import { useContext, useCallback } from 'react'
import { AdminContext } from '../context/AdminContext.jsx'

export function usePermissions() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('usePermissions must be used within an AdminProvider')
  }

  const { permissions, role } = context

  const can = useCallback(
    (permissionKey) => {
      if (role === 'super_admin' || permissions?.has('*')) return true
      return permissions?.has(permissionKey) || false
    },
    [permissions, role],
  )

  return {
    can,
    role,
    permissions,
  }
}

