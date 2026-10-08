import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import { endSession, lockSession, waitForUnlock } from './sessionLock'

// Calls an admin Cloud Function. If the server says the session is locked or
// the action needs fresh verification, ADM-004 is shown and — once verified —
// the same call is retried, so the admin continues exactly where they were.
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
    if (err?.code === 'functions/unauthenticated') endSession(reason)
    throw err
  }
}
