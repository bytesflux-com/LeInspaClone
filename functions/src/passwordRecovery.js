import crypto from 'node:crypto'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { getAuth } from 'firebase-admin/auth'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { revokeAdminSessions } from './accessModel.js'
import { isActiveAdmin } from './auth.js'
import { recordAudit, recordSecurityEvent } from './events.js'
import { EMAIL_SMTP_PASSWORD, sendCodeEmail, sendPasswordChangedEmail } from './mailer.js'
import { OTP_TTL_MS, challengeRef, checkChallenge, issueChallenge, lockedError } from './otp.js'
import { OTP_HASH_SECRET, hashOtp, maskEmail, safeEqualHex } from './security.js'

// ADM-003 — Admin Password Recovery, on the shared email code engine.
// Same shape as the mobile backend's recovery (code → single-use reset token
// → new password), with stricter admin rules: no enumeration, suspended
// admins can't recover, all sessions are revoked after a reset.
const PURPOSE = 'admin_password_reset'
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000
const MIN_REQUEST_MS = 2500 // equal response time whether or not the email is an admin
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const secrets = [OTP_HASH_SECRET, EMAIL_SMTP_PASSWORD]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function requireEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  if (email.length > 320 || !EMAIL_PATTERN.test(email)) {
    throw new HttpsError('invalid-argument', 'Enter a valid email address.', { reason: 'invalid-email' })
  }
  return email
}

// Admin policy — stricter than the mobile app's 8 characters.
export function passwordProblems(password) {
  const problems = []
  if (password.length < 12) problems.push('at least 12 characters')
  if (password.length > 128) problems.push('at most 128 characters')
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) problems.push('upper and lower case letters')
  if (!/[0-9]/.test(password)) problems.push('a number')
  if (!/[^A-Za-z0-9]/.test(password)) problems.push('a symbol')
  return problems
}

async function findUser(email) {
  try {
    return await getAuth().getUserByEmail(email)
  } catch (error) {
    if (error.code === 'auth/user-not-found') return null
    throw error
  }
}

// Step 1. Always answers the same way, so it never reveals whether an admin
// account exists. Codes are only sent to active admins; limits are applied
// silently for the same reason.
export const adminRequestPasswordReset = onCall({ secrets }, async (request) => {
  const started = Date.now()
  const email = requireEmail(request.data?.email)

  try {
    const user = await findUser(email)
    if (user && (await isActiveAdmin(user))) {
      let result = 'code_sent'
      try {
        const { reused } = await issueChallenge({
          purpose: PURPOSE,
          email,
          binding: { uid: user.uid },
          resend: request.data?.resend === true,
          send: (otp) => sendCodeEmail({ email, otp, minutes: OTP_TTL_MS / 60000, kind: 'password_reset' }),
        })
        if (reused) result = 'code_still_valid'
      } catch (error) {
        result = error?.details?.reason ?? 'error'
        logger.warn('Admin password reset code not sent', { result })
      }
      await recordSecurityEvent(request, user.uid, 'admin_password_recovery_requested', { result })
    }
  } catch (error) {
    logger.error('Admin password reset request failed', { error: error.message })
  }

  await sleep(Math.max(0, MIN_REQUEST_MS - (Date.now() - started)))
  return { status: 'requested', destination: maskEmail(email) }
})

// Step 2. Exchanges a correct code for a single-use reset token.
export const adminVerifyPasswordReset = onCall({ secrets }, async (request) => {
  const email = requireEmail(request.data?.email)
  const code = String(request.data?.code ?? '')
  if (!/^\d{6}$/.test(code)) {
    throw new HttpsError('invalid-argument', 'Enter the 6-digit code.', { reason: 'invalid-format' })
  }

  const resetToken = crypto.randomBytes(32).toString('base64url')
  const outcome = await checkChallenge({
    purpose: PURPOSE,
    email,
    code,
    onVerified: (ref, now) => ({
      verificationTokenHash: hashOtp(ref.id, resetToken),
      verificationTokenExpiresAt: Timestamp.fromMillis(now.toMillis() + RESET_TOKEN_TTL_MS),
    }),
  })

  switch (outcome.result) {
    case 'expired':
      throw new HttpsError('deadline-exceeded', 'This verification code has expired. Request a new code.', {
        reason: 'expired',
      })
    case 'locked':
      throw lockedError(outcome.lockedUntil)
    case 'missing':
    case 'incorrect':
      // No attempt count here: it would hint that a recovery is in progress.
      throw new HttpsError('invalid-argument', 'That code isn’t correct. Please try again.', { reason: 'incorrect' })
  }

  await recordSecurityEvent(request, outcome.data.uid, 'admin_password_recovery_verified', {
    entityId: outcome.ref.id,
  })
  return { resetToken, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString() }
})

// Step 3. Sets the new password, consumes the token and signs out every session.
export const adminCompletePasswordReset = onCall({ secrets }, async (request) => {
  const email = requireEmail(request.data?.email)
  const token = String(request.data?.resetToken ?? '')
  const password = String(request.data?.newPassword ?? '')
  const problems = passwordProblems(password)
  if (problems.length) {
    throw new HttpsError('invalid-argument', `Use ${problems.join(', ')}.`, { reason: 'weak-password', problems })
  }

  const ref = challengeRef(PURPOSE, email)
  const now = Timestamp.now()
  const uid = await getFirestore().runTransaction(async (tx) => {
    const data = (await tx.get(ref)).data()
    const valid =
      data?.status === 'verified' &&
      data.verificationTokenExpiresAt?.toMillis() > now.toMillis() &&
      token.length > 0 &&
      safeEqualHex(data.verificationTokenHash, hashOtp(ref.id, token))
    if (!valid) {
      throw new HttpsError('deadline-exceeded', 'This recovery session has expired. Start again.', {
        reason: 'reset-expired',
      })
    }
    tx.update(ref, { status: 'resetting', updatedAt: now })
    return data.uid
  })

  // Recovery never overrides a suspension or revocation.
  const user = await getAuth()
    .getUser(uid)
    .catch(() => null)
  if (!(await isActiveAdmin(user))) {
    await ref.update({ status: 'consumed', verificationTokenHash: null, consumedAt: Timestamp.now() })
    await recordSecurityEvent(request, uid, 'admin_password_reset_blocked')
    throw new HttpsError('permission-denied', 'This account can’t be recovered. Contact your Lé Inspa security lead.', {
      reason: 'not-eligible',
    })
  }

  try {
    await getAuth().updateUser(uid, { password })
  } catch (error) {
    await ref.update({ status: 'verified', updatedAt: Timestamp.now() })
    throw error
  }
  await ref.update({
    status: 'consumed',
    consumedBy: uid,
    consumedAt: Timestamp.now(),
    verificationTokenHash: null,
    updatedAt: Timestamp.now(),
  })
  await getAuth().revokeRefreshTokens(uid)
  const sessionsRevoked = await revokeAdminSessions(uid, 'password_reset')

  await recordSecurityEvent(request, uid, 'admin_password_reset')
  await recordAudit(request, {
    actorId: uid,
    action: 'admin_password_reset',
    entityId: uid,
    entityType: 'admin_account',
    metadata: { method: 'email_otp', sessionsRevoked },
  })
  await sendPasswordChangedEmail({ email }).catch((error) =>
    logger.warn('Password-changed notification not sent', { error: error.message }),
  )
  return { status: 'reset' }
})
