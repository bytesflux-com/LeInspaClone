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

import ClientLoyalty from './pages/clients/ClientLoyalty.jsx'

import ClientSupport from './pages/clients/ClientSupport.jsx'


import NeedsAttention from './pages/attention/NeedsAttention.jsx'
import VerificationCenterPage from './pages/VerificationCenterPage.jsx'
import VerificationQueuePage from './pages/VerificationQueuePage.jsx'
import VerificationReviewPage from './pages/VerificationReviewPage.jsx'

import IdentityDocumentsReviewPage from './pages/IdentityDocumentsReviewPage.jsx'
import ProfessionalCredentialsReviewPage from './pages/ProfessionalCredentialsReviewPage.jsx'

import BusinessDocumentsReviewPage from './pages/BusinessDocumentsReviewPage.jsx'

import VerificationDetail from './pages/verifications/VerificationDetail.jsx'
import WithdrawalDetail from './pages/withdrawals/WithdrawalDetail.jsx'
import DisputeDetail from './pages/disputes/DisputeDetail.jsx'
import SupportTicketDetail from './pages/support/SupportTicketDetail.jsx'
import MarketDashboard from './pages/dashboard/MarketDashboard.jsx'
import GlobalSearchPage from './pages/search/GlobalSearchPage.jsx'
import ProviderDashboard from './pages/providers/ProviderDashboard.jsx'
import ProviderDirectory from './pages/providers/ProviderDirectory.jsx'
import ProviderProfile from './pages/providers/ProviderProfile.jsx'
import ProviderServices from './pages/providers/ProviderServices.jsx'
import ProviderBookings from './pages/providers/ProviderBookings.jsx'
import BookingManagement from './pages/bookings/BookingManagement.jsx'
import ActiveBookings from './pages/bookings/ActiveBookings.jsx'
import UpcomingBookings from './pages/bookings/UpcomingBookings.jsx'
import OngoingBookings from './pages/bookings/OngoingBookings.jsx'
import CompletedBookings from './pages/bookings/CompletedBookings.jsx'
import CancelledBookings from './pages/bookings/CancelledBookings.jsx'
import GuestBookings from './pages/bookings/GuestBookings.jsx'



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
          { path: 'search', element: <GlobalSearchPage /> },

          // MANAGEMENT
          // ADM-010 — Client Management dashboard
          { path: 'clients', element: <ClientManagement />, handle: { fullBleed: true } },
          // ADM-011 — All Clients (full-bleed workspace with docked preview)
          { path: 'clients/all', element: <AllClients />, handle: { fullBleed: true } },
          // ADM-050 — Guest Bookings (guest view over the shared bookings collection)
          { path: 'guest-bookings', element: <GuestBookings />, handle: { fullBleed: true } },
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
          // ADM-017 — Client Referrals & Loyalty (admin view of referrals, loyalty accounts and rewards)
          { path: 'clients/:clientId/loyalty', element: <ClientLoyalty />, handle: { fullBleed: true } },
          // ADM-018 — Client Support & Safety History (aggregated admin view over support, dispute, safety and report records)
          { path: 'clients/:clientId/support', element: <ClientSupport />, handle: { fullBleed: true } },
          { path: 'clients/:clientId/:section', element: <ClientProfile />, handle: { fullBleed: true } },
          { path: 'attention', element: <NeedsAttention /> },
          { path: 'spas', element: <Placeholder title="Spas & Wellness Centers" /> },
          { path: 'hotels', element: <Placeholder title="Hotels & Resorts" /> },
          { path: 'payments', element: <Placeholder title="Payments" /> },
          { path: 'payments/:paymentId', element: <Placeholder title="Payment Details" /> }, // ADM-056
          { path: 'content', element: <Placeholder title="Content Management" /> },
          { path: 'reports', element: <Placeholder title="Reports" /> },
          // ADM-020 — Provider Management Dashboard
          { path: 'providers', element: <ProviderDashboard />, handle: { fullBleed: true } },
          // ADM-021 — Provider Directory (Dynamic Master Search & Filter Directory)
          { path: 'providers/all', element: <ProviderDirectory />, handle: { fullBleed: true } },
          { path: 'providers/directory', element: <ProviderDirectory />, handle: { fullBleed: true } },
          { path: 'providers/subscriptions', element: <Placeholder title="Provider Subscriptions" /> },
          // ADM-023 — Provider Services & Pricing (Status: REUSE / ADMIN VIEW)
          { path: 'providers/services', element: <ProviderServices />, handle: { fullBleed: true } },
          { path: 'providers/:providerId/services', element: <ProviderServices />, handle: { fullBleed: true } },
          // ADM-024 — Provider Bookings & Earnings (Status: REUSE / ADMIN VIEW)
          { path: 'providers/bookings', element: <ProviderBookings />, handle: { fullBleed: true } },
          { path: 'providers/:providerId/bookings', element: <ProviderBookings />, handle: { fullBleed: true } },
          // ADM-022 — Provider Admin Profile (Dynamic 360° Profile)
          { path: 'providers/:providerId', element: <ProviderProfile />, handle: { fullBleed: true } },
          { path: 'providers/:providerId/:section', element: <ProviderProfile />, handle: { fullBleed: true } },
          { path: 'services/:serviceId', element: <Placeholder title="Service Details" /> },
          { path: 'verifications', element: <VerificationCenterPage />, handle: { fullBleed: true } },
          { path: 'verifications/queue', element: <VerificationQueuePage />, handle: { fullBleed: true } },

          { path: 'verifications/identity/:id', element: <IdentityDocumentsReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/identity', element: <IdentityDocumentsReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/review/:id/identity', element: <IdentityDocumentsReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/credentials/:id', element: <ProfessionalCredentialsReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/credentials', element: <ProfessionalCredentialsReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/review/:id/credentials', element: <ProfessionalCredentialsReviewPage />, handle: { fullBleed: true } },

          { path: 'verifications/business/:id', element: <BusinessDocumentsReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/business', element: <BusinessDocumentsReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/review/:id/business', element: <BusinessDocumentsReviewPage />, handle: { fullBleed: true } },

          { path: 'verifications/review/:id', element: <VerificationReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/review', element: <VerificationReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/:id', element: <VerificationReviewPage />, handle: { fullBleed: true } },
          // ADM-044 → ADM-048 — Booking Operations (views over the shared bookings collection)
          { path: 'bookings', element: <BookingManagement />, handle: { fullBleed: true } },
          { path: 'bookings/active', element: <ActiveBookings />, handle: { fullBleed: true } },
          { path: 'bookings/upcoming', element: <UpcomingBookings />, handle: { fullBleed: true } },
          { path: 'bookings/ongoing', element: <OngoingBookings />, handle: { fullBleed: true } },
          { path: 'bookings/completed', element: <CompletedBookings />, handle: { fullBleed: true } },
          { path: 'bookings/cancelled', element: <CancelledBookings />, handle: { fullBleed: true } },
          { path: 'bookings/:bookingId', element: <Placeholder title="Booking Details" /> }, // ADM-051
          { path: 'bookings/:bookingId/timeline', element: <Placeholder title="Booking Timeline" /> }, // ADM-052
          { path: 'refunds', element: <Placeholder title="Refund Management" /> }, // ADM-066
          { path: 'refunds/:refundId', element: <Placeholder title="Refund Details" /> }, // ADM-067
          { path: 'reviews', element: <Placeholder title="Review Moderation" /> }, // ADM-110
          { path: 'providers/:providerId/risk', element: <Placeholder title="Provider Quality & Risk Review" /> }, // ADM-027

          // FINANCE
          { path: 'finance', element: <Placeholder title="Finance & Wallets" /> },
          { path: 'escrow', element: <Placeholder title="Escrow Custody" /> },
          { path: 'escrow/:escrowId', element: <Placeholder title="Escrow Details" /> },
          { path: 'refunds/:refundId', element: <Placeholder title="Refund Details" /> },
          { path: 'withdrawals', element: <Placeholder title="Withdrawal Authorizations" /> },
          { path: 'withdrawals/:id', element: <WithdrawalDetail /> },

          // TRUST & SAFETY
          { path: 'disputes', element: <Placeholder title="Disputes & Holds" /> },

          { path: 'disputes/:disputeId', element: <Placeholder title="Dispute Details" /> },

          { path: 'safety', element: <Placeholder title="Safety Incidents" /> },
          { path: 'safety/:caseId', element: <Placeholder title="Safety Investigation" /> },
          { path: 'reports/:reportId', element: <Placeholder title="Report Details" /> },
          { path: 'support', element: <Placeholder title="Support Concierge" /> },
          { path: 'support/:id', element: <SupportTicketDetail /> },

          // GROWTH
          { path: 'memberships', element: <Placeholder title="Memberships" /> },
          { path: 'loyalty', element: <Placeholder title="Referrals & Loyalty" /> },
          { path: 'promotions', element: <Placeholder title="Promotions & Campaigns" /> },
          { path: 'campaigns', element: <Placeholder title="Marketing Campaigns" /> },

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
