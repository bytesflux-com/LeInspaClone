import { HttpsError } from 'firebase-functions/v2/https'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'
import { recordSecurityEvent } from './events.js'

// ADM-004 session security, enforced server-side on every admin call.
// Defaults can be overridden in platform_settings/admin_security
// (idleTimeoutMinutes, maxSessionHours, sensitiveFreshnessMinutes,
// maxVerificationAttempts) without a redeploy.
const DEFAULT_POLICY = {
  idleTimeoutMinutes: 15,
  maxSessionHours: 12,
  sensitiveFreshnessMinutes: 10,
  maxVerificationAttempts: 5,
}
const ACTIVITY_WRITE_THROTTLE_MS = 60 * 1000
const POLICY_CACHE_MS = 5 * 60 * 1000

let cachedPolicy = null
let cachedAt = 0

export async function sessionPolicy() {
  if (cachedPolicy && Date.now() - cachedAt < POLICY_CACHE_MS) return cachedPolicy
  let overrides = {}
  try {
    const snap = await getFirestore().collection('platform_settings').doc('admin_security').get()
    if (snap.exists) overrides = snap.data()
  } catch {
    // fall back to defaults
  }
  const pick = (key) => {
    const v = Number(overrides[key])
    return Number.isFinite(v) && v > 0 ? v : DEFAULT_POLICY[key]
  }
  cachedPolicy = Object.fromEntries(Object.keys(DEFAULT_POLICY).map((k) => [k, pick(k)]))
  cachedAt = Date.now()
  return cachedPolicy
}

export const sessionRef = (uid, authTime) =>
  getFirestore().collection('admin_sessions').doc(`${uid}_${authTime}`)

export function deviceContext(request) {
  return {
    ipAddress: request.rawRequest?.ip ?? null,
    userAgent: request.rawRequest?.get?.('user-agent') ?? null,
  }
}

const ended = (reason, message) => new HttpsError('unauthenticated', message, { reason })

// Loads and evaluates the session behind this request. Throws:
//  unauthenticated  session-expired | session-revoked  → full sign-in (ADM-001)
//  permission-denied session-locked | reverification-required → ADM-004
// `fresh`: the action needs a verification within sensitiveFreshnessMinutes.
// `touch`: count this call as activity (default true).
export async function checkSession(request, uid, { fresh = false, touch = true } = {}) {
  const policy = await sessionPolicy()
  const ref = sessionRef(uid, request.auth.token.auth_time)
  const snap = await ref.get()
  const now = Date.now()

  if (!snap.exists) throw ended('session-expired', 'Your session has ended. Sign in again.')
  const s = snap.data()
  if (s.status === 'REVOKED' || s.status === 'EXPIRED') {
    throw ended('session-revoked', 'Your session has ended. Sign in again.')
  }
  if (!(s.expiresAt?.toMillis() > now)) {
    await ref.update({ status: 'EXPIRED', endedAt: FieldValue.serverTimestamp() })
    throw ended('session-expired', 'Your session has reached its time limit. Sign in again.')
  }

  // Risk: the session is being used from a different browser/device. Not
  // recoverable through ADM-004 — require a full sign-in.
  const ua = deviceContext(request).userAgent
  if (s.deviceContext?.userAgent && ua && ua !== s.deviceContext.userAgent) {
    await ref.update({ status: 'REVOKED', revokedReason: 'device_changed', revokedAt: FieldValue.serverTimestamp() })
    await recordSecurityEvent(request, uid, 'admin_session_revoked', { sessionId: ref.id, reason: 'device_changed' })
    throw ended('session-revoked', 'Your session has ended. Sign in again.')
  }

  const lastActivity = s.lastActivityAt?.toMillis() ?? 0
  if (s.status === 'LOCKED' || now - lastActivity > policy.idleTimeoutMinutes * 60000) {
    if (s.status !== 'LOCKED') {
      await ref.update({ status: 'LOCKED', lockedReason: 'inactivity', lockedAt: FieldValue.serverTimestamp() })
      await recordSecurityEvent(request, uid, 'admin_session_locked', { sessionId: ref.id, reason: 'inactivity' })
    }
    throw new HttpsError('permission-denied', 'Verify your admin session to continue.', {
      reason: 'session-locked',
      lockedReason: s.lockedReason ?? 'inactivity',
    })
  }

  if (fresh && now - (s.lastVerifiedAt?.toMillis() ?? 0) > policy.sensitiveFreshnessMinutes * 60000) {
    throw new HttpsError('permission-denied', 'Verify your admin session to continue.', {
      reason: 'reverification-required',
    })
  }

  if (touch && now - lastActivity > ACTIVITY_WRITE_THROTTLE_MS) {
    await ref.update({ lastActivityAt: FieldValue.serverTimestamp() })
  }
  return { ref, data: s, policy }
}

// Session document for a sign-in that just passed 2FA.
export function newSessionData(request, uid, authTime, policy) {
  const now = Timestamp.now()
  return {
    sessionId: `${uid}_${authTime}`,
    adminId: uid,
    authTime,
    status: 'ACTIVE',
    secondFactor: 'email_otp',
    deviceContext: deviceContext(request),
    verificationAttempts: 0,
    lastActivityAt: now,
    lastVerifiedAt: now,
    expiresAt: Timestamp.fromMillis(now.toMillis() + policy.maxSessionHours * 3600000),
    createdAt: now,
  }
}
