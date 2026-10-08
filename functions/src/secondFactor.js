import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getAuth } from 'firebase-admin/auth'
import { SECOND_FACTOR_CLAIM, hasVerifiedSecondFactor, requireAdmin } from './auth.js'
import { recordAdminLogin } from './accessModel.js'
import { recordAudit, recordSecurityEvent } from './events.js'
import { EMAIL_SMTP_PASSWORD, sendCodeEmail } from './mailer.js'
import { OTP_TTL_MS, checkChallenge, issueChallenge, lockedError } from './otp.js'
import { OTP_HASH_SECRET } from './security.js'

// ADM-002 — Admin Two-Factor Verification, on the shared email code engine.
const PURPOSE = 'admin_2fa'
const secrets = [OTP_HASH_SECRET, EMAIL_SMTP_PASSWORD]

function signedInEmail(request) {
  const email = String(request.auth?.token?.email ?? '').trim().toLowerCase()
  if (!email) {
    throw new HttpsError('failed-precondition', 'This admin account has no email address for verification.', {
      reason: 'no-destination',
    })
  }
  return email
}

// Issues a code for the current sign-in, or returns the one already issued
// (so reloading the page doesn't send another). `resend: true` forces a new one.
export const adminStartSecondFactor = onCall({ secrets }, async (request) => {
  const uid = await requireAdmin(request, { secondFactor: false })
  if (hasVerifiedSecondFactor(request.auth.token)) return { status: 'verified' }

  const email = signedInEmail(request)
  const { ref, reused, info } = await issueChallenge({
    purpose: PURPOSE,
    email,
    binding: { uid, authTime: request.auth.token.auth_time },
    resend: request.data?.resend === true,
    send: (otp) => sendCodeEmail({ email, otp, minutes: OTP_TTL_MS / 60000, kind: 'sign_in' }),
  })
  if (!reused) await recordSecurityEvent(request, uid, 'admin_2fa_code_sent', { entityId: ref.id })
  return info
})

export const adminVerifySecondFactor = onCall({ secrets }, async (request) => {
  const uid = await requireAdmin(request, { secondFactor: false })
  if (hasVerifiedSecondFactor(request.auth.token)) return { status: 'verified' }

  const code = String(request.data?.code ?? '')
  if (!/^\d{6}$/.test(code)) {
    throw new HttpsError('invalid-argument', 'Enter the 6-digit code.', { reason: 'invalid-format' })
  }
  const authTime = request.auth.token.auth_time
  const outcome = await checkChallenge({
    purpose: PURPOSE,
    email: signedInEmail(request),
    binding: { uid, authTime },
    code,
    onVerified: (_ref, now) => ({ status: 'consumed', consumedBy: uid, consumedAt: now }),
  })

  switch (outcome.result) {
    case 'missing':
    case 'expired':
      throw new HttpsError('deadline-exceeded', 'This verification code has expired. Request a new code.', {
        reason: 'expired',
      })
    case 'locked':
      if (outcome.justLocked) await recordSecurityEvent(request, uid, 'admin_2fa_locked', { entityId: outcome.ref.id })
      throw lockedError(outcome.lockedUntil)
    case 'incorrect':
      await recordSecurityEvent(request, uid, 'admin_2fa_failed', { entityId: outcome.ref.id })
      throw new HttpsError('invalid-argument', 'That code isn’t correct. Please try again.', {
        reason: 'incorrect',
        attemptsRemaining: outcome.attemptsRemaining,
      })
  }

  // Re-check admin status right before granting the session.
  await requireAdmin(request, { secondFactor: false })
  const user = await getAuth().getUser(uid)
  await getAuth().setCustomUserClaims(uid, { ...(user.customClaims ?? {}), [SECOND_FACTOR_CLAIM]: authTime })

  await recordAdminLogin(request, { uid, email: user.email, displayName: user.displayName, authTime })
  await recordSecurityEvent(request, uid, 'admin_2fa_verified', { entityId: outcome.ref.id })
  await recordAudit(request, {
    actorId: uid,
    action: 'admin_login',
    entityId: uid,
    entityType: 'admin_session',
    metadata: { secondFactor: 'email_otp', authTime },
  })
  return { status: 'verified' }
})
