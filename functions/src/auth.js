import { HttpsError } from 'firebase-functions/v2/https'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { permissionsFor, profileRef } from './accessModel.js'
import { checkSession } from './session.js'

const BLOCKED_STATUSES = ['suspended', 'deleted', 'revoked', 'banned', 'deactivated']

// Custom claim set by adminVerifySecondFactor. It holds the `auth_time` of the
// sign-in it verified, so every new sign-in needs a fresh code.
export const SECOND_FACTOR_CLAIM = 'adm2fa'

// Blocked by the mobile app's account status, or by the admin profile status.
function isBlocked(user, profile) {
  const userBlocked = user.exists && BLOCKED_STATUSES.includes(String(user.get('accountStatus') ?? '').toLowerCase())
  const profileBlocked = profile.exists && profile.get('status') !== 'ACTIVE'
  return userBlocked || profileBlocked
}

// For flows without a signed-in user (ADM-003): is this Auth user an active admin?
export async function isActiveAdmin(userRecord) {
  if (!userRecord || userRecord.disabled) return false
  const [user, profile] = await Promise.all([
    getFirestore().collection('users').doc(userRecord.uid).get(),
    profileRef(userRecord.uid).get(),
  ])
  const isAdmin = userRecord.customClaims?.admin === true || (user.exists && user.get('accountType') === 'admin')
  return isAdmin && !isBlocked(user, profile)
}

export function hasVerifiedSecondFactor(token) {
  return typeof token?.auth_time === 'number' && token[SECOND_FACTOR_CLAIM] === token.auth_time
}

// Same admin rule as the mobile backend's requireAdmin (backend/src/shared/auth.js):
// `admin` custom claim OR users/{uid}.accountType == 'admin' — plus account and
// admin-profile status, revoked sessions, by default a verified second factor
// and an active (unlocked, unexpired) admin session for this sign-in, and
// optionally a permission from the admin's role.
// `fresh`: sensitive action — the session must have been verified recently (ADM-004).
// `session: false`: skip the session check (used by ADM-002/ADM-004 themselves).
export async function requireAdmin(request, { secondFactor = true, permission, fresh = false, session = true } = {}) {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in to continue.')

  const [user, profile, account] = await Promise.all([
    getFirestore().collection('users').doc(uid).get(),
    profileRef(uid).get(),
    getAuth().getUser(uid),
  ])
  // Sessions revoked after this sign-in (e.g. by a password reset) stop working
  // immediately, not only when their ID token expires.
  const validAfter = Date.parse(account.tokensValidAfterTime ?? '') || 0
  if (account.disabled || request.auth.token.auth_time * 1000 < validAfter) {
    throw new HttpsError('unauthenticated', 'Your session has ended. Sign in again.', { reason: 'session-revoked' })
  }
  const isAdmin = request.auth.token?.admin === true || (user.exists && user.get('accountType') === 'admin')
  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Administrator access is required.', { reason: 'not-admin' })
  }
  if (isBlocked(user, profile)) {
    throw new HttpsError('permission-denied', 'Administrator access has been revoked.', { reason: 'admin-revoked' })
  }
  if (secondFactor && !hasVerifiedSecondFactor(request.auth.token)) {
    throw new HttpsError('permission-denied', 'Two-factor verification is required.', {
      reason: 'second-factor-required',
    })
  }
  if (secondFactor && session) await checkSession(request, uid, { fresh })
  if (permission && !(await permissionsFor(profile)).has(permission)) {
    throw new HttpsError('permission-denied', 'Your admin role does not allow this action.', {
      reason: 'missing-permission',
      permission,
    })
  }
  return uid
}
