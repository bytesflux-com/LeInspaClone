import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import LoadingState from '../ui/LoadingState'

export default function ProtectedRoute() {
  const { user, isAdmin, secondFactorVerified, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <LoadingState message="Verifying secure admin session…" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />
  }

  if (!secondFactorVerified) {
    return <Navigate to="/verify" replace />
  }

  return <Outlet />
}
