import { RouterProvider } from 'react-router'
import { AuthProvider } from './context/AuthContext.jsx'
import { AdminProvider } from './context/AdminContext.jsx'
import GlobalErrorBoundary from './components/ui/GlobalErrorBoundary.jsx'
import { router } from './router.jsx'

export default function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <AdminProvider>
          <RouterProvider router={router} />
        </AdminProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  )
}
