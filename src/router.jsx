import { createBrowserRouter, Navigate } from 'react-router'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import AdminLayout from './components/layout/AdminLayout.jsx'
import AdminLogin from './pages/auth/AdminLogin.jsx'
import TwoFactor from './pages/auth/TwoFactor.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import GlobalDashboard from './pages/dashboard/GlobalDashboard.jsx'
import OperationsCenter from './pages/operations/OperationsCenter.jsx'
import ClientManagement from './pages/clients/ClientManagement.jsx'
import AllClients from './pages/clients/AllClients.jsx'
import ClientProfile from './pages/clients/ClientProfile.jsx'
import ClientBookings from './pages/clients/ClientBookings.jsx'
import ClientPayments from './pages/clients/ClientPayments.jsx'
import ClientWallet from './pages/clients/ClientWallet.jsx'
import ClientMembership from './pages/clients/ClientMembership.jsx'
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

          // MANAGEMENT
          // ADM-010 — Client Management dashboard
          { path: 'clients', element: <ClientManagement />, handle: { fullBleed: true } },
          // ADM-011 — All Clients (full-bleed workspace with docked preview)
          { path: 'clients/all', element: <AllClients />, handle: { fullBleed: true } },
          { path: 'guest-bookings', element: <Placeholder title="Guest Bookings" /> },
          // ADM-012 — Client Profile. Tabs/sections keep the profile shell (header +
          // control panel); ADM-013 → ADM-019 replace the placeholders inside it.
          { path: 'clients/:clientId', element: <ClientProfile />, handle: { fullBleed: true } },
          // ADM-013 — Client Bookings (admin view of the shared bookings collection)
          { path: 'clients/:clientId/bookings', element: <ClientBookings />, handle: { fullBleed: true } },
          // ADM-014 — Client Payments (admin view of the shared payments collection)
          { path: 'clients/:clientId/payments', element: <ClientPayments />, handle: { fullBleed: true } },
          // ADM-015 — Client Wallet (admin view of the shared wallets / wallet_transactions)
          { path: 'clients/:clientId/wallet', element: <ClientWallet />, handle: { fullBleed: true } },
          // ADM-016 — Client Membership (admin view of customer_memberships + plan configuration)
          { path: 'clients/:clientId/membership', element: <ClientMembership />, handle: { fullBleed: true } },
          { path: 'clients/:clientId/:section', element: <ClientProfile />, handle: { fullBleed: true } },
          { path: 'attention', element: <Placeholder title="Needs Your Attention" /> },
          { path: 'spas', element: <Placeholder title="Spas & Wellness Centers" /> },
          { path: 'hotels', element: <Placeholder title="Hotels & Resorts" /> },
          { path: 'payments', element: <Placeholder title="Payments" /> },
          { path: 'payments/:paymentId', element: <Placeholder title="Payment Details" /> }, // ADM-056
          { path: 'content', element: <Placeholder title="Content Management" /> },
          { path: 'reports', element: <Placeholder title="Reports" /> },
          { path: 'market-insights', element: <Placeholder title="Market Insights" /> },
          { path: 'providers', element: <Placeholder title="Providers & Spas" /> },
          { path: 'providers/:providerId', element: <Placeholder title="Provider Admin Profile" /> },
          { path: 'services/:serviceId', element: <Placeholder title="Service Details" /> },
          { path: 'verifications', element: <Placeholder title="Verification & Approvals" /> },
          { path: 'bookings', element: <Placeholder title="Bookings Telemetry" /> },
          { path: 'bookings/:bookingId', element: <Placeholder title="Booking Details" /> }, // ADM-051

          // FINANCE
          { path: 'finance', element: <Placeholder title="Finance & Wallets" /> },
          { path: 'escrow', element: <Placeholder title="Escrow Custody" /> },
          { path: 'escrow/:escrowId', element: <Placeholder title="Escrow Details" /> },
          { path: 'refunds/:refundId', element: <Placeholder title="Refund Details" /> },
          { path: 'withdrawals', element: <Placeholder title="Withdrawal Authorizations" /> },

          // TRUST & SAFETY
          { path: 'disputes', element: <Placeholder title="Disputes & Holds" /> },
          { path: 'safety', element: <Placeholder title="Safety Incidents" /> },
          { path: 'support', element: <Placeholder title="Support Concierge" /> },
          { path: 'support/:ticketId', element: <Placeholder title="Support Ticket Details" /> }, // ADM-103

          // GROWTH
          { path: 'memberships', element: <Placeholder title="Memberships" /> },
          { path: 'loyalty', element: <Placeholder title="Referrals & Loyalty" /> },
          { path: 'promotions', element: <Placeholder title="Promotions & Campaigns" /> },

          // INTELLIGENCE
          { path: 'analytics', element: <Placeholder title="Cross-Market Analytics" /> },
          { path: 'markets', element: <Placeholder title="Market Operations" /> },

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
