import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import { lockSession, waitForUnlock, endSession } from './sessionLock'

/**
 * Calls an admin Cloud Function with automatic in-session lock & reverification handling (ADM-004).
 */
export async function callAdmin(name, data = {}, { retry = true } = {}) {
  try {
    const { data: result } = await httpsCallable(functions, name)(data)
    return result
  } catch (err) {
    const reason = err?.details?.reason
    if (retry && (reason === 'session-locked' || reason === 'reverification-required')) {
      lockSession(reason === 'session-locked' ? (err.details.lockedReason ?? 'inactivity') : 'sensitive_action')
      await waitForUnlock()
      return callAdmin(name, data, { retry: false })
    }
    if (err?.code === 'functions/unauthenticated') {
      endSession(reason)
    }
    throw err
  }
}

