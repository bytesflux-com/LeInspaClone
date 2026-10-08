import { HttpsError } from 'firebase-functions/v2/https'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { deterministicId, hashOtp, maskEmail, randomOtp, safeEqualHex } from './security.js'

// Email code engine shared by ADM-002 (2FA) and ADM-003 (password recovery).
// Mirrors the mobile backend's email-verification module: the same
// `email_verification_requests` collection, document ids, HMAC hashing
// (OTP_HASH_SECRET) and limits. Only the `purpose` differs per flow.
export const OTP_TTL_MS = 5 * 60 * 1000
const RESEND_DELAY_MS = 60 * 1000
const RATE_WINDOW_MS = 60 * 60 * 1000
const MAX_SENDS_PER_WINDOW = 5
const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60 * 1000

export const iso = (ts) => (ts ? ts.toDate().toISOString() : null)

export function challengeRef(purpose, email) {
  return getFirestore()
    .collection('email_verification_requests')
    .doc(deterministicId('email_otp', `${purpose}:${email}`))
}

export function lockedError(lockedUntil) {
  return new HttpsError('resource-exhausted', 'Verification temporarily locked for security.', {
    reason: 'locked',
    lockedUntil: iso(lockedUntil),
  })
}

export function challengeInfo(email, data) {
  return {
    status: 'sent',
    destination: maskEmail(email),
    expiresAt: iso(data.expiresAt),
    resendAvailableAt: new Date(data.lastSentAt.toMillis() + RESEND_DELAY_MS).toISOString(),
    attemptsRemaining: Math.max(MAX_ATTEMPTS - Number(data.attemptCount || 0), 0),
  }
}

function emulatorTestCode() {
  const code = process.env.EMAIL_OTP_TEST_CODE ?? ''
  return process.env.FUNCTIONS_EMULATOR === 'true' && /^\d{6}$/.test(code) ? code : null
}

// Creates a code for `binding` (fields identifying who/which session it is
// for), or returns the live one when `binding` matches and `resend` is false.
// Then delivers it with `send(otp)`. Throws HttpsError with a `reason` for
// locked / resend-too-soon / too-many-requests / delivery failures.
export async function issueChallenge({ purpose, email, binding, resend = false, send }) {
  const ref = challengeRef(purpose, email)
  const otp = emulatorTestCode() ?? randomOtp()
  const now = Timestamp.now()
  const sameBinding = (data) => Object.entries(binding).every(([k, v]) => data[k] === v)

  const result = await getFirestore().runTransaction(async (tx) => {
    const existing = (await tx.get(ref)).data() || {}

    if (existing.status === 'locked' && existing.lockedUntil?.toMillis() > now.toMillis()) {
      throw lockedError(existing.lockedUntil)
    }
    // A code that was sent, or is still being sent by a parallel request.
    const reusable =
      ['sent', 'sending'].includes(existing.status) &&
      sameBinding(existing) &&
      existing.expiresAt?.toMillis() > now.toMillis()
    if (reusable && !resend) return { reused: true, data: existing }

    // A failed delivery sent nothing, so it doesn't start the resend delay
    // (it still counts toward the hourly limit below).
    const delivered = existing.status !== 'delivery_failed'
    if (delivered && now.toMillis() - (existing.lastSentAt?.toMillis() || 0) < RESEND_DELAY_MS) {
      throw new HttpsError('resource-exhausted', 'Please wait one minute before requesting another code.', {
        reason: 'resend-too-soon',
        resendAvailableAt: new Date(existing.lastSentAt.toMillis() + RESEND_DELAY_MS).toISOString(),
      })
    }
    const sameWindow = now.toMillis() - (existing.windowStartedAt?.toMillis() || 0) < RATE_WINDOW_MS
    const sendCount = sameWindow ? Number(existing.sendCount || 0) : 0
    if (sendCount >= MAX_SENDS_PER_WINDOW) {
      throw new HttpsError('resource-exhausted', 'Too many verification requests. Please try again later.', {
        reason: 'too-many-requests',
      })
    }

    const data = {
      email,
      purpose,
      ...binding,
      otpHash: hashOtp(ref.id, otp),
      status: 'sending',
      attemptCount: 0,
      sendCount: sendCount + 1,
      windowStartedAt: sameWindow ? existing.windowStartedAt : now,
      lastSentAt: now,
      expiresAt: Timestamp.fromMillis(now.toMillis() + OTP_TTL_MS),
      lockedUntil: null,
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
      createdAt: existing.createdAt || now,
      updatedAt: now,
    }
    tx.set(ref, data)
    return { reused: false, data }
  })

  if (result.reused) return { ref, reused: true, info: challengeInfo(email, result.data) }

  try {
    if (!emulatorTestCode()) await send(otp)
    await ref.update({ status: 'sent', deliveredAt: Timestamp.now() })
  } catch (error) {
    await ref.update({ status: 'delivery_failed', expiresAt: Timestamp.now(), updatedAt: Timestamp.now() })
    throw error
  }
  return { ref, reused: false, info: challengeInfo(email, { ...result.data, status: 'sent' }) }
}

// Checks `code` against the challenge. Wrong attempts are persisted, so the
// transaction returns an outcome instead of throwing (a throw would roll the
// counter back). `onVerified` returns extra fields to store on success.
// Outcomes: verified | incorrect | locked | expired | missing.
export async function checkChallenge({ purpose, email, binding = {}, code, onVerified = () => ({}) }) {
  const ref = challengeRef(purpose, email)
  const now = Timestamp.now()

  const outcome = await getFirestore().runTransaction(async (tx) => {
    const data = (await tx.get(ref)).data()
    if (!data) return { result: 'missing' }
    if (!Object.entries(binding).every(([k, v]) => data[k] === v)) return { result: 'expired' }
    if (data.status === 'locked' && data.lockedUntil?.toMillis() > now.toMillis()) {
      return { result: 'locked', lockedUntil: data.lockedUntil }
    }
    if (data.status !== 'sent' || !(data.expiresAt?.toMillis() > now.toMillis())) return { result: 'expired' }

    const attempts = Number(data.attemptCount || 0)
    if (safeEqualHex(data.otpHash, hashOtp(ref.id, code))) {
      tx.update(ref, { status: 'verified', otpHash: null, verifiedAt: now, updatedAt: now, ...onVerified(ref, now) })
      return { result: 'verified', data }
    }
    if (attempts + 1 >= MAX_ATTEMPTS) {
      const lockedUntil = Timestamp.fromMillis(now.toMillis() + LOCK_MS)
      tx.update(ref, { status: 'locked', otpHash: null, attemptCount: attempts + 1, lockedUntil, updatedAt: now })
      return { result: 'locked', lockedUntil, justLocked: true }
    }
    tx.update(ref, { attemptCount: attempts + 1, updatedAt: now })
    return { result: 'incorrect', attemptsRemaining: MAX_ATTEMPTS - attempts - 1 }
  })
  return { ref, ...outcome }
}
