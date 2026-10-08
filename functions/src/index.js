import { setGlobalOptions } from 'firebase-functions/v2'
import { onCall } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { requireAdmin } from './auth.js'

initializeApp()

setGlobalOptions({ region: 'us-central1', maxInstances: 10 })

// Health check the admin panel can call to verify the backend is reachable.
export const adminPing = onCall(async (request) => {
  await requireAdmin(request)
  return { ok: true, time: new Date().toISOString() }
})

export { adminStartSecondFactor, adminVerifySecondFactor } from './secondFactor.js'
export {
  adminRequestPasswordReset,
  adminVerifyPasswordReset,
  adminCompletePasswordReset,
} from './passwordRecovery.js'
export { adminGetSession, adminVerifySession, adminEndSession } from './sessionVerification.js'
export { adminGetDashboardSummary } from './dashboard.js'
