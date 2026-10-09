import { createBrowserRouter, Navigate } from 'react-router'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import AdminLayout from './components/layout/AdminLayout.jsx'
import AdminLogin from './pages/auth/AdminLogin.jsx'
import TwoFactor from './pages/auth/TwoFactor.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import GlobalDashboard from './pages/dashboard/GlobalDashboard.jsx'
import MarketDashboard from './pages/dashboard/MarketDashboard.jsx'
import OperationsCenter from './pages/operations/OperationsCenter.jsx'
import NeedsAttention from './pages/attention/NeedsAttention.jsx'
import Placeholder from './pages/Placeholder.jsx'
import NotFound from './pages/NotFound.jsx'
import RouteErrorElement from './components/ui/RouteErrorElement.jsx'

export const router = createBrowserRouter([
  // Authentication routes
  {
    path: '/login',
    element: <AdminLogin />,
    errorElement: <RouteErrorElement />,
  },
  {
    path: '/verify',
    element: <TwoFactor />,
    errorElement: <RouteErrorElement />,
  },
  {
    path: '/2fa',
    element: <TwoFactor />,
    errorElement: <RouteErrorElement />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
    errorElement: <RouteErrorElement />,
  },

  // Protected Admin Shell
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorElement />,
    children: [
      {
        element: <AdminLayout />,
        errorElement: <RouteErrorElement />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },

          // CONTROL
          { path: 'dashboard', element: <GlobalDashboard /> },
          { path: 'operations', element: <OperationsCenter /> },
          { path: 'attention', element: <NeedsAttention /> },

          // MANAGEMENT
          { path: 'clients', element: <Placeholder title="Clients CRM" /> },
          { path: 'providers', element: <Placeholder title="Providers & Spas" /> },
          { path: 'verifications', element: <Placeholder title="Verification & Approvals" /> },
          { path: 'bookings', element: <Placeholder title="Bookings Telemetry" /> },

          // FINANCE
          { path: 'finance', element: <Placeholder title="Finance & Wallets" /> },
          { path: 'escrow', element: <Placeholder title="Escrow Custody" /> },
          { path: 'withdrawals', element: <Placeholder title="Withdrawal Authorizations" /> },

          // TRUST & SAFETY
          { path: 'disputes', element: <Placeholder title="Disputes & Holds" /> },
          { path: 'safety', element: <Placeholder title="Safety Incidents" /> },
          { path: 'support', element: <Placeholder title="Support Concierge" /> },

          // GROWTH
          { path: 'memberships', element: <Placeholder title="Memberships" /> },
          { path: 'loyalty', element: <Placeholder title="Referrals & Loyalty" /> },
          { path: 'promotions', element: <Placeholder title="Promotions & Campaigns" /> },

          // INTELLIGENCE
          { path: 'analytics', element: <Placeholder title="Cross-Market Analytics" /> },
          { path: 'markets', element: <MarketDashboard /> },

          // PLATFORM
          { path: 'settings', element: <Placeholder title="Platform Settings" /> },
          { path: 'team', element: <Placeholder title="Admin Team & Roles" /> },
          { path: 'audit-logs', element: <Placeholder title="Security Audit Logs" /> },
          { path: 'system-health', element: <Placeholder title="System Telemetry" /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])
