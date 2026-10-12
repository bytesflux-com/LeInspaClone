import { setGlobalOptions } from 'firebase-functions/v2'
import { onCall } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { requireAdmin } from './auth.js'

initializeApp()

setGlobalOptions({ region: 'us-central1', maxInstances: 10 })

// Health check the admin panel can call to verify the backend is reachable.
export const adminPing = onCall(async (request) => {
  await requireAdmin(request)
  return { ok: true, time: new Date().toISOString() }
})

export { adminStartSecondFactor, adminVerifySecondFactor } from './secondFactor.js'
export {
  adminRequestPasswordReset,
  adminVerifyPasswordReset,
  adminCompletePasswordReset,
} from './passwordRecovery.js'
export { adminGetSession, adminVerifySession, adminEndSession } from './sessionVerification.js'
export { adminGetDashboardSummary } from './dashboard.js'
export { adminGetOperationsSummary } from './operations.js'
export { adminGetMarketDashboardData } from './marketDashboard.js'
export { adminGlobalSearch } from './search.js'
export {
  adminGetNeedsAttention,
  adminGetReviewItem,
  adminProcessReviewAction,
  adminAssignQueueItem,
} from './needsAttention.js'
export {
  adminGetBookingDashboard,
  adminListBookings,
  adminGetBookingQuickView,
  adminRevealGuestContact,
} from './bookings.js'

// ADM-020 → ADM-022 — provider dashboard, directory and 360° profile
export {
  adminGetProviderDashboard,
  adminListProviders,
  adminGetProviderDetail,
  adminGetProviderProfile,
  adminAddProviderInternalNote,
  adminUpdateProviderContentStatus,
} from './providerProfile.js'
export {
  adminGetProviderServices,
  adminGetProviderServiceDetail,
  adminModerateProviderService,
  adminUpdateProviderServiceStatus,
} from './providerServices.js'
export {
  adminGetProviderBookings,
  adminGetProviderBookingDetail,
  adminGetProviderEarningsOverview,
  adminGetProviderEarningsChart,
} from './providerBookings.js'
// ADM-025 → ADM-028 — Provider reviews, subscription & visibility, quality & risk, account actions
export { adminGetProviderReviews, adminGetProviderReviewDetail, adminModerateProviderReview } from './providerReviews.js'
export {
  adminGetProviderSubscription,
  adminManageProviderSubscription,
  adminManageProviderVisibility,
} from './providerSubscription.js'
export { adminGetProviderQualityRisk, adminUpdateProviderRiskAssessment } from './providerRisk.js'
export {
  adminGetProviderAccountActions,
  adminApplyProviderAccountAction,
  adminAddProviderAccountNote,
} from './providerAccount.js'

// ADM-029 → ADM-034 — Verification Center over verification_requests
export {
  adminGetVerificationQueue,
  adminAssignVerificationReviewer,
  adminSubmitVerificationDecision,
  adminGetVerificationQueueDetailed,
  adminClaimVerificationCase,
  adminEscalateVerificationCase,
  adminGetVerificationDetail,
  adminSubmitComponentDecision,
  adminAddVerificationInternalNote,
  adminGetIdentityVerificationDetail,
  adminRevealSensitiveIdentityField,
  adminSubmitIdentityDecision,
  adminGetCredentialVerificationDetail,
  adminSubmitCredentialDecision,
  adminAddCredentialInternalNote,
  adminGetBusinessVerificationDetail,
  adminRevealBusinessDocumentNumber,
  adminSubmitBusinessDocumentDecision,
  adminAddBusinessInternalNote,
} from './verificationCenter.js'

export {
  adminGetContentQueue,
  adminGetContentReview,
  adminStartContentReview,
  adminContentDecision,
  adminBulkMediaDecision,
  adminCompleteGalleryReview,
  adminAddModerationNote,
} from './contentModeration.js'
export { adminProfileFieldDecision, adminPublishProfileChanges, adminServiceDecision } from './changeReview.js'
export {
  adminGetInfoRequestWorkspace,
  adminSaveInfoRequest,
  adminGetInfoRequest,
  adminListInfoRequests,
  adminInfoRequestAction,
} from './informationRequests.js'
export {
  adminGetRejectionWorkspace,
  adminSubmitRejection,
  adminGetVerificationDecision,
  adminSubmitFinalVerificationDecision,
  adminListApprovalDecisions,
  adminGetApprovalDecision,
  adminExportApprovalHistory,
} from './approvalWorkflows.js'
// ADM-010 → ADM-019 — Client Management
export {
  adminGetClientDashboard,
  adminGetClientGrowth,
  adminListClients,
  adminGetClientPreview,
  adminGetClientActivity,
  adminGetClientNotes,
  adminAddClientNote,
  adminExportClients,
  adminBulkNotifyClients,
  adminBulkTagClients,
  adminGetClientProfile,
  adminRevealClientContact,
  adminGetClientBookings,
  adminGetBookingPreview,
  adminGetClientPayments,
  adminGetPaymentPreview,
  adminAddPaymentNote,
  adminGetClientWallet,
  adminGetWalletBalanceHistory,
  adminGetWalletTransactionPreview,
  adminAddWalletTransactionNote,
  adminGetClientMembership,
  adminChangeClientMembership,
  adminAddMembershipNote,
  adminGetClientLoyalty,
  adminGetClientReferrals,
  adminGetReferralPreview,
  adminAddLoyaltyNote,
  adminGetClientSupport,
  adminGetSupportCasePreview,
  adminReplyToSupportCase,
  adminAddSupportCaseNote,
  adminReassignSupportCase,
  adminEscalateSupportCase,
  adminGetClientAccount,
  adminApplyClientAccountAction,
} from './clients.js'
