import { httpsCallable } from 'firebase/functions'
import { functions } from '../lib/firebase'
import { callAdmin } from '../lib/firebaseFunctions'

export const adminService = {
  // Session
  async getSession({ active = false } = {}) {
    const { data } = await httpsCallable(functions, 'adminGetSession')({ active })
    return data
  },

  async verifySession(password) {
    const { data } = await httpsCallable(functions, 'adminVerifySession')({ password })
    return data
  },

  async endSession() {
    try {
      await httpsCallable(functions, 'adminEndSession')({})
    } catch {
      // Local sign out proceeds
    }
  },

  // Second Factor (ADM-002)
  async startSecondFactor({ resend = false } = {}) {
    const { data } = await httpsCallable(functions, 'adminStartSecondFactor')({ resend })
    return data
  },

  async verifySecondFactor(code) {
    const { data } = await httpsCallable(functions, 'adminVerifySecondFactor')({ code })
    return data
  },

  // Password Reset (ADM-003)
  async requestPasswordReset(email, { resend = false } = {}) {
    const { data } = await httpsCallable(functions, 'adminRequestPasswordReset')({ email, resend })
    return data
  },

  async verifyPasswordReset(email, code) {
    const { data } = await httpsCallable(functions, 'adminVerifyPasswordReset')({ email, code })
    return data
  },

  async completePasswordReset(email, resetToken, newPassword) {
    const { data } = await httpsCallable(functions, 'adminCompletePasswordReset')({ email, resetToken, newPassword })
    return data
  },
}

