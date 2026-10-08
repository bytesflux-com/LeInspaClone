import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { defineString } from 'firebase-functions/params'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAccess } from './accessModel.js'
import { requireAdmin } from './auth.js'
import { recordAudit, recordSecurityEvent } from './events.js'
import { maskEmail } from './security.js'
import { checkSession, deviceContext, sessionPolicy, sessionRef } from './session.js'

// ADM-004 — Admin Session Verification. Re-verifies an already signed-in,
// 2FA-verified admin with their password, checked by Firebase Auth itself
// (no second authentication system), with server-side attempt limits.
const AUTH_WEB_API_KEY = defineString('AUTH_WEB_API_KEY', {
  description: 'Public Firebase web API key (same as VITE_FIREBASE_API_KEY)',
})

const ended = (reason, message) => new HttpsError('unauthenticated', message, { reason })

async function identity(request, uid) {
  const access = await adminAccess(uid)
  return {
    identity: {
      fullName: access.fullName ?? request.auth.token.name ?? null,
      email: maskEmail(request.auth.token.email ?? ''),
      roleName: access.roleName,
    },
    access: { roleId: access.roleId, permissions: access.permissions, markets: access.markets },
  }
}

// Status + heartbeat. `active: true` means the admin interacted since the last
// call, which keeps the session alive; a locked session is reported, not thrown.
export const adminGetSession = onCall(async (request) => {
  const uid = await requireAdmin(request, { session: false })
  const policy = await sessionPolicy()
  let status = 'ACTIVE'
  let lockedReason = null
  try {
    await checkSession(request, uid, { touch: request.data?.active === true })
  } catch (error) {
    if (error?.details?.reason !== 'session-locked') throw error
    status = 'LOCKED'
    lockedReason = error.details.lockedReason
  }
  const snap = await sessionRef(uid, request.auth.token.auth_time).get()
  return {
    status,
    lockedReason,
    lockedAt: snap.get('lockedAt')?.toDate().toISOString() ?? null,
    idleTimeoutMs: policy.idleTimeoutMinutes * 60000,
    ...(await identity(request, uid)),
  }
})

async function passwordMatches(email, password) {
  const emulator = process.env.FIREBASE_AUTH_EMULATOR_HOST
  const base = emulator ? `http://${emulator}/identitytoolkit.googleapis.com` : 'https://identitytoolkit.googleapis.com'
  const key = emulator ? 'emulator' : AUTH_WEB_API_KEY.value()
  const res = await fetch(`${base}/v1/accounts:signInWithPassword?key=${key}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: false }),
  })
  const body = await res.json()
  if (res.ok) return { ok: true, uid: body.localId }
  const code = String(body.error?.message ?? '')
  if (code.startsWith('USER_DISABLED')) return { ok: false, disabled: true }
  if (!/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND|TOO_MANY_ATTEMPTS/.test(code)) {
    logger.error('Password check failed unexpectedly', { code })
    throw new HttpsError('unavailable', 'Verification is temporarily unavailable. Please try again.')
  }
  return { ok: false }
}

async function revokeSession(request, ref, uid, reason) {
  await ref.update({ status: 'REVOKED', revokedReason: reason, revokedAt: FieldValue.serverTimestamp() })
  await recordSecurityEvent(request, uid, 'admin_session_revoked', { sessionId: ref.id, reason })
}

export const adminVerifySession = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw ended('session-expired', 'Sign in to continue.')
  const ref = sessionRef(uid, request.auth.token.auth_time)

  // Suspended / revoked admins can't continue, and their session is ended.
  try {
    await requireAdmin(request, { session: false })
  } catch (error) {
    if (['admin-revoked', 'not-admin'].includes(error?.details?.reason)) {
      if ((await ref.get()).exists) await revokeSession(request, ref, uid, 'access_revoked')
    }
    throw error
  }

  const policy = await sessionPolicy()
  const snap = await ref.get()
  const s = snap.data()
  if (!s || !['ACTIVE', 'LOCKED'].includes(s.status) || !(s.expiresAt?.toMillis() > Date.now())) {
    throw ended('session-expired', 'Your session has ended. Sign in again.')
  }
  const ua = deviceContext(request).userAgent
  if (s.deviceContext?.userAgent && ua && ua !== s.deviceContext.userAgent) {
    await revokeSession(request, ref, uid, 'device_changed')
    throw ended('session-revoked', 'Your session has ended. Sign in again.')
  }

  const password = String(request.data?.password ?? '')
  const result = password ? await passwordMatches(request.auth.token.email, password) : { ok: false }
  if (result.disabled) {
    await revokeSession(request, ref, uid, 'access_revoked')
    throw new HttpsError('permission-denied', 'Administrator access has been revoked.', { reason: 'admin-revoked' })
  }
  if (!result.ok || result.uid !== uid) {
    const attempts = Number(s.verificationAttempts || 0) + 1
    if (attempts >= policy.maxVerificationAttempts) {
      await ref.update({ verificationAttempts: attempts })
      await revokeSession(request, ref, uid, 'too_many_attempts')
      throw ended('too-many-attempts', 'For security, this Admin session has been locked. Please sign in again.')
    }
    await ref.update({ verificationAttempts: attempts })
    await recordSecurityEvent(request, uid, 'admin_session_verification_failed', { sessionId: ref.id })
    throw new HttpsError('invalid-argument', 'We couldn’t verify your identity. Please try again.', { reason: 'incorrect' })
  }

  await ref.update({
    status: 'ACTIVE',
    verificationAttempts: 0,
    lastVerifiedAt: FieldValue.serverTimestamp(),
    lastActivityAt: FieldValue.serverTimestamp(),
    lockedReason: FieldValue.delete(),
    unlockedAt: FieldValue.serverTimestamp(),
  })
  await recordSecurityEvent(request, uid, 'admin_session_verified', { sessionId: ref.id, lockedReason: s.lockedReason ?? null })
  await recordAudit(request, {
    actorId: uid,
    action: 'admin_session_reverified',
    entityId: ref.id,
    entityType: 'admin_session',
    metadata: { method: 'password', lockedReason: s.lockedReason ?? null },
  })
  // Fresh role, permissions and markets — never the ones cached at sign-in.
  return { status: 'ACTIVE', ...(await identity(request, uid)) }
})

// "Not You? Sign Out" and normal sign-out: ends this session server-side.
export const adminEndSession = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) return { status: 'ended' }
  const ref = sessionRef(uid, request.auth.token.auth_time)
  const snap = await ref.get()
  if (snap.exists && ['ACTIVE', 'LOCKED'].includes(snap.get('status'))) {
    await ref.update({ status: 'REVOKED', revokedReason: 'signed_out', revokedAt: FieldValue.serverTimestamp() })
    await recordSecurityEvent(request, uid, 'admin_signed_out', { sessionId: ref.id })
  }
  return { status: 'ended' }
})
