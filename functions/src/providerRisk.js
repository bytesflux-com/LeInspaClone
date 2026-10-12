import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { FieldValue } from 'firebase-admin/firestore'
import { auditEntry, db, docsForProvider, loadProvider, providerScope, requireProviderId, rethrow } from './providerAdminContext.js'
import { normalizeBooking } from './providerAdminShared.js'
import { normalizeAction } from './providerAccountLogic.js'
import { normalizeReport, normalizeReview, reportFromFlag } from './providerReviewsLogic.js'
import {
  DEFAULT_QUALITY_MODEL,
  DEFAULT_RISK_RULES,
  buildRiskView,
  normalizeAssessment,
  normalizeCredential,
  planRiskAssessment,
} from './providerRiskLogic.js'
import { loadCases, loadRestrictions } from './providerAccount.js'

// ADM-027 — Provider Quality & Risk Review. Aggregates existing records; the
// only collection it writes is `provider_risk_assessments` (Admin assessments
// and the calculated snapshot at that moment). Model and rules come from
// platform_settings so scores are configuration-driven and explainable.

async function loadModel() {
  const [model, rules] = await Promise.all([
    db().collection('platform_settings').doc('provider_quality_model').get(),
    db().collection('platform_settings').doc('provider_risk_rules').get(),
  ])
  return {
    model: model.exists ? { ...DEFAULT_QUALITY_MODEL, ...model.data() } : DEFAULT_QUALITY_MODEL,
    rules: { ...DEFAULT_RISK_RULES, ...(rules.exists ? rules.data() : {}) },
  }
}

async function loadRiskSources(provider, perms) {
  const [bookings, reviews, reports, cases, restrictions, credentials, content, withdrawals, actions, assessments, security, config] = await Promise.all([
    docsForProvider('bookings', provider, 'bookings', { limit: 5000 }),
    docsForProvider('reviews', provider, 'reviews', { limit: 5000 }),
    docsForProvider('review_reports', provider, 'review reports', { limit: 2000 }),
    loadCases(provider),
    loadRestrictions(provider),
    // The app does not record credential expiry dates yet; expiry signals stay empty until it does.
    { docs: [] },
    docsForProvider('content_moderation', provider, 'content moderation', { limit: 300 }),
    // Financial sources are only read for Finance-permitted admins.
    perms.viewFinance ? docsForProvider('withdrawal_requests', provider, 'withdrawals', { field: 'userId', limit: 300 }) : { docs: [] },
    docsForProvider('account_actions', provider, 'account actions', { limit: 200 }),
    docsForProvider('provider_risk_assessments', provider, 'assessments', { limit: 50 }),
    provider.userId ? docsForProvider('security_events', provider, 'security events', { field: 'userId', limit: 50 }) : { docs: [] },
    loadModel(),
  ])
  return {
    bookings: bookings.docs.map((d) => normalizeBooking(d.id, d)),
    reviews: reviews.docs.map((d) => normalizeReview(d.id, d)),
    reports: (() => {
      const recorded = reports.docs.map((d) => normalizeReport(d.id, d))
      const seen = new Set(recorded.map((r) => r.reviewId))
      return [...recorded, ...reviews.docs.map((d) => normalizeReview(d.id, d)).filter((r) => !seen.has(r.id)).map(reportFromFlag).filter(Boolean)]
    })(),
    cases,
    restrictions,
    credentials: credentials.docs.map((d) => normalizeCredential(d.id, d)),
    contentItems: content.docs,
    withdrawals: withdrawals.docs,
    actions: actions.docs.map((d) => normalizeAction(d.id, d)),
    assessments: assessments.docs.filter((d) => d.type === 'admin_assessment').map((d) => normalizeAssessment(d.id, d)),
    securityAlerts: security.docs.filter((e) => /alert|suspicious|takeover/i.test(e.eventType || '')).map((e) => ({ label: e.eventType, resolved: Boolean(e.resolved) })),
    ...config,
  }
}

/** ADM-027 on load. data: { providerId, period?: '30d' | '90d' | '12m' } */
export const adminGetProviderQualityRisk = onCall(async (request) => {
  const { access, perms } = await providerScope(request)
  const providerId = requireProviderId(request.data?.providerId)
  const period = ['30d', '90d', '12m'].includes(request.data?.period) ? request.data.period : '30d'
  try {
    const { provider } = await loadProvider(providerId, access)
    const sources = await loadRiskSources(provider, perms)
    return buildRiskView({ provider, ...sources, permissions: perms, period, now: Date.now() })
  } catch (err) {
    rethrow('adminGetProviderQualityRisk', err, 'Quality & risk data could not be loaded.')
  }
})

/** ADM-027 Update Assessment. data: { providerId, level, reason, note?, relatedCases?, nextReviewDays? } */
export const adminUpdateProviderRiskAssessment = onCall(async (request) => {
  const { uid, access, perms, actor } = await providerScope(request, { permission: 'safety.manage' })
  const providerId = requireProviderId(request.data?.providerId)
  try {
    const { provider } = await loadProvider(providerId, access)
    const sources = await loadRiskSources(provider, perms)
    const view = buildRiskView({ provider, ...sources, permissions: perms, now: Date.now() })
    const plan = planRiskAssessment({
      input: request.data || {},
      previous: view.assessment,
      cases: sources.cases,
      snapshot: { computedLevel: view.kpis.risk.level, qualityScore: view.kpis.quality.available ? view.kpis.quality.score : null, modelVersion: sources.model.version },
      actor,
      now: Date.now(),
    })
    if (plan.error) throw new HttpsError('invalid-argument', plan.error)
    const ref = db().collection('provider_risk_assessments').doc()
    const batch = db().batch()
    batch.set(ref, { ...plan.record, providerId: provider.id, createdAt: FieldValue.serverTimestamp() })
    auditEntry(batch, request, { actorId: uid, action: plan.audit.action, entityId: provider.id, entityType: 'provider_risk', metadata: { ...plan.audit, assessmentId: ref.id } })
    await batch.commit()
    return { ok: true, message: plan.message }
  } catch (err) {
    rethrow('adminUpdateProviderRiskAssessment', err, 'The assessment could not be saved.')
  }
})
