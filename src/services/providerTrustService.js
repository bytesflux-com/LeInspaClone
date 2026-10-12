// ADM-025 → ADM-028 — provider reviews, subscription & visibility, quality &
// risk, and account actions. Calls the admin Cloud Functions:
//   adminGetProviderReviews, adminGetProviderReviewDetail, adminModerateProviderReview      (ADM-025)
//   adminGetProviderSubscription, adminManageProviderSubscription, adminManageProviderVisibility (ADM-026)
//   adminGetProviderQualityRisk, adminUpdateProviderRiskAssessment                         (ADM-027)
//   adminGetProviderAccountActions, adminApplyProviderAccountAction, adminAddProviderAccountNote (ADM-028)
// Permissions, market access and every state transition are enforced by those
// functions. VITE_USE_MOCK_PROVIDERS=true runs an in-memory demo through the
// same pure logic instead; `ctx` (permissions / markets / actor) is used by the
// demo only — the real functions resolve the admin themselves.
import { callAdmin } from '../lib/adminCall'
import { trustMock } from './mock/providerTrustMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_PROVIDERS === 'true'

export const providerTrustService = {
  isMock: USE_MOCK,

  // ADM-025
  getReviews: (providerId, filters, ctx) =>
    USE_MOCK ? trustMock.getReviews(providerId, filters, ctx) : callAdmin('adminGetProviderReviews', { providerId, ...filters }),
  getReviewDetail: (providerId, reviewId, ctx) =>
    USE_MOCK ? trustMock.getReviewDetail(providerId, reviewId, ctx) : callAdmin('adminGetProviderReviewDetail', { providerId, reviewId }),
  moderateReview: (providerId, input, ctx) =>
    USE_MOCK ? trustMock.moderateReview(providerId, input, ctx) : callAdmin('adminModerateProviderReview', { providerId, ...input }),

  // ADM-026
  getSubscription: (providerId, ctx) =>
    USE_MOCK ? trustMock.getSubscription(providerId, ctx) : callAdmin('adminGetProviderSubscription', { providerId }),
  manageSubscription: (providerId, input, ctx) =>
    USE_MOCK ? trustMock.manageSubscription(providerId, input, ctx) : callAdmin('adminManageProviderSubscription', { providerId, ...input }),
  manageVisibility: (providerId, input, ctx) =>
    USE_MOCK ? trustMock.manageVisibility(providerId, input, ctx) : callAdmin('adminManageProviderVisibility', { providerId, ...input }),

  // ADM-027
  getQualityRisk: (providerId, period, ctx) =>
    USE_MOCK ? trustMock.getQualityRisk(providerId, period, ctx) : callAdmin('adminGetProviderQualityRisk', { providerId, period }),
  updateAssessment: (providerId, input, ctx) =>
    USE_MOCK ? trustMock.updateAssessment(providerId, input, ctx) : callAdmin('adminUpdateProviderRiskAssessment', { providerId, ...input }),

  // ADM-028
  getAccount: (providerId, ctx) =>
    USE_MOCK ? trustMock.getAccount(providerId, ctx) : callAdmin('adminGetProviderAccountActions', { providerId }),
  applyAccountAction: (providerId, input, ctx) =>
    USE_MOCK ? trustMock.applyAccountAction(providerId, input, ctx) : callAdmin('adminApplyProviderAccountAction', { providerId, ...input }),
  addAccountNote: (providerId, text, ctx) =>
    USE_MOCK ? trustMock.addAccountNote(providerId, text, ctx) : callAdmin('adminAddProviderAccountNote', { providerId, text }),
}
