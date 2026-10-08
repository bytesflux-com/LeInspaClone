import { httpsCallable } from 'firebase/functions'
import { callAdmin } from './firebaseFunctions'
import { functions } from './firebase'
import { dashboardService } from '../services/dashboardService'

// Callables from the `admin` functions codebase (functions/src).
export async function getDashboardSummary({ market = 'ALL', dateRange = 'today', customRange = null } = {}) {
  return dashboardService.getDashboardSummary({ marketId: market, dateRange, customRange })
}

// ADM-002: issues (or returns the already-issued) code for this sign-in.
export async function startSecondFactor({ resend = false } = {}) {
  const { data } = await httpsCallable(functions, 'adminStartSecondFactor')({ resend })
  return data
}

export async function verifySecondFactor(code) {
  const { data } = await httpsCallable(functions, 'adminVerifySecondFactor')({ code })
  return data
}

// ADM-003 password recovery (no signed-in user).
export async function requestPasswordReset(email, { resend = false } = {}) {
  const { data } = await httpsCallable(functions, 'adminRequestPasswordReset')({ email, resend })
  return data
}

export async function verifyPasswordReset(email, code) {
  const { data } = await httpsCallable(functions, 'adminVerifyPasswordReset')({ email, code })
  return data
}

export async function completePasswordReset(email, resetToken, newPassword) {
  const { data } = await httpsCallable(functions, 'adminCompletePasswordReset')({ email, resetToken, newPassword })
  return data
}

// ADM-004 session verification.
export async function getSession({ active = false } = {}) {
  const { data } = await httpsCallable(functions, 'adminGetSession')({ active })
  return data
}

export async function verifySession(password) {
  const { data } = await httpsCallable(functions, 'adminVerifySession')({ password })
  return data
}

export async function endAdminSession() {
  try {
    await httpsCallable(functions, 'adminEndSession')({})
  } catch {
    // signing out locally still proceeds
  }
}
