// ADM-004 lock state shared by the API layer and the UI. The server decides
// whether a session is locked; this only mirrors it so the UI can show the
// checkpoint and resume interrupted calls afterwards.
const unlocked = { locked: false, reason: null, lockedAt: null }
let state = unlocked
let waiters = []
const listeners = new Set()
const endedListeners = new Set()
let endedReason = null

const emit = () => listeners.forEach((fn) => fn())

export const getLockState = () => state
export function subscribeLock(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// reason: 'inactivity' | 'sensitive_action' | other server lockedReason
export function lockSession(reason, lockedAt) {
  if (state.locked) return
  state = { locked: true, reason, lockedAt: lockedAt ?? new Date().toISOString() }
  emit()
}

export function waitForUnlock() {
  if (!state.locked) return Promise.resolve()
  return new Promise((resolve, reject) => waiters.push({ resolve, reject }))
}

export function unlockSession() {
  state = unlocked
  emit()
  waiters.forEach((w) => w.resolve())
  waiters = []
}

// The session is over (expired, revoked, too many attempts, signed out):
// pending calls fail and the app signs out.
export function endSession(reason) {
  endedReason = reason ?? 'session-expired'
  waiters.forEach((w) => w.reject(Object.assign(new Error('Session ended'), { code: 'session-ended' })))
  waiters = []
  state = unlocked
  emit()
  endedListeners.forEach((fn) => fn(endedReason))
}

export function onSessionEnded(fn) {
  endedListeners.add(fn)
  return () => endedListeners.delete(fn)
}

// Read once by the login page to explain why the admin is back there.
export function takeEndedReason() {
  const r = endedReason
  endedReason = null
  return r
}
