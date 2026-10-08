import crypto from 'node:crypto'
import { defineSecret } from 'firebase-functions/params'

// Shared with the mobile backend (Le-Inspa-Project/backend): same secret and
// same hashing, so admin codes live in the existing verification engine.
export const OTP_HASH_SECRET = defineSecret('OTP_HASH_SECRET')

// backend/src/shared/ids.js
export function deterministicId(prefix, value) {
  const digest = crypto.createHash('sha256').update(String(value)).digest('hex')
  return `${prefix}_${digest.slice(0, 32)}`
}

// backend/src/shared/security.js
export function hashOtp(requestId, otp) {
  return crypto.createHmac('sha256', OTP_HASH_SECRET.value()).update(`${requestId}:${otp}`).digest('hex')
}

export function safeEqualHex(left, right) {
  if (!left || !right || left.length !== right.length) return false
  return crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'))
}

export function randomOtp() {
  return crypto.randomInt(100000, 1000000).toString()
}

// "wanjiru@leinspa.com" → "w•••••@leinspa.com"
export function maskEmail(email) {
  const [local, domain] = String(email).split('@')
  if (!domain) return '•••••'
  return `${local.charAt(0)}•••••@${domain}`
}
