import { useContext } from 'react'
import { AdminContext } from '../context/AdminContext.jsx'
import { lockSession, unlockSession } from '../lib/sessionLock'

export function useAdminSession() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdminSession must be used within an AdminProvider')
  }

  return {
    admin: context.admin,
    role: context.role,
    lock: context.lock,
    lockSession: (reason) => lockSession(reason || 'manual'),
    unlockSession,
    refreshSession: context.refreshSession,
  }
}

