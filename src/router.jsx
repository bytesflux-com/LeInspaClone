import { createBrowserRouter, Navigate } from 'react-router'
import BookingDetails from './pages/bookings/BookingDetails.jsx'
import PaymentDetails from './pages/payments/PaymentDetails.jsx'
import CaseDetail from './pages/support/CaseDetail.jsx'
import VerificationEntry from './pages/VerificationEntry.jsx'
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
import ClientAccount from './pages/clients/ClientAccount.jsx'

import NeedsAttention from './pages/attention/NeedsAttention.jsx'
import VerificationCenterPage from './pages/VerificationCenterPage.jsx'
import VerificationQueuePage from './pages/VerificationQueuePage.jsx'
import VerificationReviewPage from './pages/VerificationReviewPage.jsx'
import IdentityDocumentsReviewPage from './pages/IdentityDocumentsReviewPage.jsx'
import ProfessionalCredentialsReviewPage from './pages/ProfessionalCredentialsReviewPage.jsx'
import BusinessDocumentsReviewPage from './pages/BusinessDocumentsReviewPage.jsx'

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
import ProviderReviews from './pages/providers/ProviderReviews.jsx'
import ProviderSubscription from './pages/providers/ProviderSubscription.jsx'
import ProviderQualityRisk from './pages/providers/ProviderQualityRisk.jsx'
import ProviderAccountActions from './pages/providers/ProviderAccountActions.jsx'
import BookingManagement from './pages/bookings/BookingManagement.jsx'
import ActiveBookings from './pages/bookings/ActiveBookings.jsx'
import UpcomingBookings from './pages/bookings/UpcomingBookings.jsx'
import OngoingBookings from './pages/bookings/OngoingBookings.jsx'
import CompletedBookings from './pages/bookings/CompletedBookings.jsx'
import CancelledBookings from './pages/bookings/CancelledBookings.jsx'
import GuestBookings from './pages/bookings/GuestBookings.jsx'

import ContentApprovalCenter from './pages/content/ContentApprovalCenter.jsx'
import ProfilePhotoApproval from './pages/content/ProfilePhotoApproval.jsx'
import GalleryMediaApproval from './pages/content/GalleryMediaApproval.jsx'
import ProfileChangeReview from './pages/content/ProfileChangeReview.jsx'
import ServiceApproval from './pages/content/ServiceApproval.jsx'
import RequestMoreInformation from './pages/content/RequestMoreInformation.jsx'
import InformationRequests from './pages/content/InformationRequests.jsx'
import RejectDecision from './pages/content/RejectDecision.jsx'
import VerificationDecision from './pages/content/VerificationDecision.jsx'
import ApprovalHistory from './pages/content/ApprovalHistory.jsx'
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
          { path: 'operations/my-tasks', element: <Navigate to="/attention?assigned=me" replace /> },
          { path: 'operations/queue', element: <Navigate to="/attention" replace /> },
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
          // ADM-019 — Client Account Actions (controlled execution layer: restrictions, suspension, reactivation, deactivation)
          { path: 'clients/:clientId/account', element: <ClientAccount />, handle: { fullBleed: true } },
          { path: 'clients/:clientId/:section', element: <ClientProfile />, handle: { fullBleed: true } },
          { path: 'attention', element: <NeedsAttention /> },
          { path: 'spas', element: <Navigate to="/providers/all?type=spa" replace /> },
          { path: 'hotels', element: <Navigate to="/providers/all?type=hotel_resort" replace /> },
          { path: 'payments', element: <Placeholder title="Payments" spec="ADM-055" alternatives={[{ label: 'Client payments are on each client profile', to: '/clients/all' }, { label: 'Finance items needing action', to: '/attention?tab=finance' }]} /> },
          { path: 'payments/:paymentId', element: <PaymentDetails />, handle: { fullBleed: true } }, // ADM-056 entry point
          { path: 'content', element: <ContentApprovalCenter />, handle: { fullBleed: true } },
          { path: 'reports', element: <Placeholder title="Reports" spec="—" alternatives={[{ label: 'Market dashboard', to: '/markets' }, { label: 'Approval history', to: '/approval-history' }]} /> },
          // ADM-020 — Provider Management Dashboard
          { path: 'providers', element: <ProviderDashboard />, handle: { fullBleed: true } },
          // ADM-021 — Provider Directory (Dynamic Master Search & Filter Directory)
          { path: 'providers/all', element: <ProviderDirectory />, handle: { fullBleed: true } },
          { path: 'providers/directory', element: <ProviderDirectory />, handle: { fullBleed: true } },
          { path: 'providers/subscriptions', element: <Navigate to="/providers/all?subscription=active" replace /> },
          // ADM-023 — Provider Services & Pricing (Status: REUSE / ADMIN VIEW)
          { path: 'providers/services', element: <ProviderServices />, handle: { fullBleed: true } },
          { path: 'providers/:providerId/services', element: <ProviderServices />, handle: { fullBleed: true } },
          // ADM-024 — Provider Bookings & Earnings (Status: REUSE / ADMIN VIEW)
          { path: 'providers/bookings', element: <ProviderBookings />, handle: { fullBleed: true } },
          { path: 'providers/:providerId/bookings', element: <ProviderBookings />, handle: { fullBleed: true } },
          // ADM-025 — Provider Reviews (Status: REUSE / ADMIN VIEW over the shared review system)
          { path: 'providers/reviews', element: <ProviderReviews />, handle: { fullBleed: true } },
          { path: 'providers/:providerId/reviews', element: <ProviderReviews />, handle: { fullBleed: true } },
          // ADM-026 — Provider Subscription & Visibility (Admin layer over the shared subscription engine)
          { path: 'providers/subscription', element: <ProviderSubscription />, handle: { fullBleed: true } },
          { path: 'providers/:providerId/subscription', element: <ProviderSubscription />, handle: { fullBleed: true } },
          // ADM-027 — Provider Quality & Risk Review
          { path: 'providers/risk', element: <ProviderQualityRisk />, handle: { fullBleed: true } },
          { path: 'providers/:providerId/risk', element: <ProviderQualityRisk />, handle: { fullBleed: true } },
          // ADM-028 — Provider Account Actions / Suspension
          { path: 'providers/account', element: <ProviderAccountActions />, handle: { fullBleed: true } },
          { path: 'providers/:providerId/account', element: <ProviderAccountActions />, handle: { fullBleed: true } },
          // ADM-022 — Provider Admin Profile (Dynamic 360° Profile)
          { path: 'providers/:providerId', element: <ProviderProfile />, handle: { fullBleed: true } },
          { path: 'providers/:providerId/:section', element: <ProviderProfile />, handle: { fullBleed: true } },
          { path: 'services/:serviceId', element: <Placeholder title="Service Details" spec="ADM-023" alternatives={[{ label: 'Provider directory', to: '/providers/all' }]} /> },

          // ADM-029 → ADM-034 — Verification Center
          { path: 'verifications', element: <VerificationCenterPage />, handle: { fullBleed: true } },
          { path: 'verifications/queue', element: <VerificationQueuePage />, handle: { fullBleed: true } },
          { path: 'verifications/identity/:id', element: <IdentityDocumentsReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/identity', element: <VerificationEntry kind="identity" />, handle: { fullBleed: true } },
          { path: 'verifications/review/:id/identity', element: <IdentityDocumentsReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/credentials/:id', element: <ProfessionalCredentialsReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/credentials', element: <VerificationEntry kind="credentials" />, handle: { fullBleed: true } },
          { path: 'verifications/review/:id/credentials', element: <ProfessionalCredentialsReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/business/:id', element: <BusinessDocumentsReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/business', element: <VerificationEntry kind="business" />, handle: { fullBleed: true } },
          { path: 'verifications/review/:id/business', element: <BusinessDocumentsReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/review/:id', element: <VerificationReviewPage />, handle: { fullBleed: true } },
          { path: 'verifications/review', element: <VerificationEntry kind="review" />, handle: { fullBleed: true } },

          // ADM-042 — Verification Decision (before verifications/:id catch-all)
          { path: 'verifications/decision', element: <VerificationDecision />, handle: { fullBleed: true } },
          { path: 'verifications/:verificationId/decision', element: <VerificationDecision />, handle: { fullBleed: true } },
          { path: 'verifications/:id', element: <VerificationReviewPage />, handle: { fullBleed: true } },

          // ADM-035 → ADM-043 — Content moderation, information requests, reject workflow, approval history
          { path: 'content-approval', element: <ContentApprovalCenter />, handle: { fullBleed: true } },
          { path: 'content-approval/profile-photos', element: <ContentApprovalCenter presetType="profile_photo" title="Profile Photo Approval" />, handle: { fullBleed: true } },
          { path: 'content-approval/profile-photos/:moderationId', element: <ProfilePhotoApproval />, handle: { fullBleed: true } },
          { path: 'content-approval/gallery', element: <ContentApprovalCenter presetType="gallery" title="Gallery & Media Approval" />, handle: { fullBleed: true } },
          { path: 'content-approval/gallery/:moderationId', element: <GalleryMediaApproval />, handle: { fullBleed: true } },
          { path: 'content-approval/profile-changes', element: <ContentApprovalCenter presetType="profile_change" title="Profile Information Change" />, handle: { fullBleed: true } },
          { path: 'content-approval/profile-changes/:moderationId', element: <ProfileChangeReview />, handle: { fullBleed: true } },
          { path: 'content-approval/services', element: <ContentApprovalCenter presetType="service" title="Service Information Approval" />, handle: { fullBleed: true } },
          { path: 'content-approval/services/:moderationId', element: <ServiceApproval />, handle: { fullBleed: true } },
          { path: 'information-requests', element: <InformationRequests />, handle: { fullBleed: true } },
          { path: 'information-requests/new', element: <RequestMoreInformation />, handle: { fullBleed: true } },
          { path: 'information-requests/:requestId', element: <RequestMoreInformation />, handle: { fullBleed: true } },
          { path: 'reject', element: <RejectDecision />, handle: { fullBleed: true } },
          { path: 'approval-history', element: <ApprovalHistory />, handle: { fullBleed: true } },
          { path: 'content-approval/history', element: <ApprovalHistory />, handle: { fullBleed: true } },
          { path: 'content-approval/offers', element: <ContentApprovalCenter presetType="offer" title="Offers & Packages Approval" />, handle: { fullBleed: true } },
          { path: 'content-approval/business', element: <ContentApprovalCenter presetType="business_profile" title="Business Content Approval" />, handle: { fullBleed: true } },

          // ADM-044 → ADM-048 — Booking Operations (views over the shared bookings collection)
          { path: 'bookings', element: <BookingManagement />, handle: { fullBleed: true } },
          { path: 'bookings/active', element: <ActiveBookings />, handle: { fullBleed: true } },
          { path: 'bookings/upcoming', element: <UpcomingBookings />, handle: { fullBleed: true } },
          { path: 'bookings/ongoing', element: <OngoingBookings />, handle: { fullBleed: true } },
          { path: 'bookings/completed', element: <CompletedBookings />, handle: { fullBleed: true } },
          { path: 'bookings/cancelled', element: <CancelledBookings />, handle: { fullBleed: true } },
          { path: 'bookings/:bookingId', element: <BookingDetails />, handle: { fullBleed: true } }, // ADM-051 entry point
          { path: 'bookings/:bookingId/timeline', element: <BookingDetails initialTab="Timeline" />, handle: { fullBleed: true } }, // ADM-052 entry point
          { path: 'refunds/:refundId', element: <Placeholder title="Refund Details" spec="ADM-067" alternatives={[{ label: 'Cancelled bookings', to: '/bookings/cancelled' }]} /> },
          { path: 'refunds', element: <Placeholder title="Refund Management" spec="ADM-066" alternatives={[{ label: 'Cancelled bookings', to: '/bookings/cancelled' }, { label: 'Finance items needing action', to: '/attention?tab=finance' }]} /> },
          { path: 'reviews', element: <Placeholder title="Review Moderation" spec="ADM-110" alternatives={[{ label: 'Provider reviews are on each provider profile', to: '/providers/all' }]} /> },

          // FINANCE
          { path: 'finance', element: <Placeholder title="Finance & Wallets" spec="ADM-054" alternatives={[{ label: 'Finance items needing action', to: '/attention?tab=finance' }, { label: 'Global dashboard financial position', to: '/dashboard' }]} /> },
          { path: 'escrow', element: <Placeholder title="Escrow Custody" spec="ADM-057" alternatives={[{ label: 'Active bookings (escrow held)', to: '/bookings/active' }]} /> },
          { path: 'escrow/:escrowId', element: <Placeholder title="Escrow Details" spec="ADM-058" alternatives={[{ label: 'Active bookings (escrow held)', to: '/bookings/active' }]} /> },
          { path: 'withdrawals', element: <Navigate to="/attention?tab=finance" replace /> },
          { path: 'withdrawals/:id', element: <WithdrawalDetail /> },

          // TRUST & SAFETY
          { path: 'disputes', element: <Navigate to="/attention?tab=disputes" replace /> },
          { path: 'disputes/:id', element: <CaseDetail kind="dispute" /> },
          { path: 'safety', element: <Navigate to="/attention?tab=safety" replace /> },
          { path: 'safety/:id', element: <CaseDetail kind="safety" /> },
          { path: 'reports/:reportId', element: <Placeholder title="Report Details" spec="—" alternatives={[{ label: 'Safety items needing action', to: '/attention?tab=safety' }]} /> },
          { path: 'support', element: <Navigate to="/attention?tab=support" replace /> },
          { path: 'support/:id', element: <SupportTicketDetail /> },

          // GROWTH
          { path: 'memberships', element: <Placeholder title="Membership Management" spec="ADM-074" alternatives={[{ label: 'Client membership distribution', to: '/clients' }]} /> },
          { path: 'loyalty', element: <Placeholder title="Referrals & Loyalty" spec="ADM-080" alternatives={[{ label: 'Client directory', to: '/clients/all' }]} /> },
          { path: 'promotions', element: <Placeholder title="Promotions Dashboard" spec="ADM-087" alternatives={[]} /> },
          { path: 'campaigns', element: <Placeholder title="Promo Campaigns" spec="ADM-088" alternatives={[]} /> },

          // INTELLIGENCE
          { path: 'analytics', element: <Placeholder title="Cross-Market Analytics" spec="—" alternatives={[{ label: 'Market dashboard', to: '/markets' }]} /> },
          { path: 'markets', element: <MarketDashboard /> },

          // PLATFORM
          { path: 'settings', element: <Placeholder title="Platform Settings" spec="—" alternatives={[]} /> },
          { path: 'team', element: <Placeholder title="Admin Team & Roles" spec="—" alternatives={[]} /> },
          { path: 'audit-logs', element: <Placeholder title="Security Audit Logs" spec="ADM-144" alternatives={[{ label: 'Approval history (decision ledger)', to: '/approval-history' }]} /> },
          { path: 'system-health', element: <Navigate to="/operations" replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])
