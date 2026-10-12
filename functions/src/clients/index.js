// Client Management callables, ADM-010 → ADM-019.
export {
  adminGetClientDashboard, adminGetClientGrowth, adminListClients, adminGetClientPreview, adminGetClientActivity,
  adminGetClientNotes, adminAddClientNote, adminExportClients, adminBulkNotifyClients, adminBulkTagClients,
} from './directory.js'
export { adminGetClientProfile, adminRevealClientContact } from './profile.js'
export { adminGetClientBookings, adminGetBookingPreview } from './bookings.js'
export { adminGetClientPayments, adminGetPaymentPreview, adminAddPaymentNote } from './payments.js'
export { adminGetClientWallet, adminGetWalletBalanceHistory, adminGetWalletTransactionPreview, adminAddWalletTransactionNote } from './wallet.js'
export { adminGetClientMembership, adminChangeClientMembership, adminAddMembershipNote } from './membership.js'
export { adminGetClientLoyalty, adminGetClientReferrals, adminGetReferralPreview, adminAddLoyaltyNote } from './loyalty.js'
export { adminGetClientSupport, adminGetSupportCasePreview, adminReplyToSupportCase, adminAddSupportCaseNote, adminReassignSupportCase, adminEscalateSupportCase } from './support.js'
export { adminGetClientAccount, adminApplyClientAccountAction } from './account.js'
