import test from 'node:test'
import assert from 'node:assert/strict'
import { DAY, normalizeBooking, normalizeCase, normalizeProvider } from '../src/providerAdminShared.js'
import { authenticitySignals, buildReviewsView, normalizeReport, normalizeReview, planReviewModeration } from '../src/providerReviewsLogic.js'
import {
  buildSubscriptionView,
  normalizePayment,
  normalizePlan,
  normalizeSubscription,
  planSubscriptionChange,
  planVisibilityChange,
  resolveSubscriptionStatus,
} from '../src/providerSubscriptionLogic.js'
import { buildRiskView, planRiskAssessment, qualityScore, bookingStats } from '../src/providerRiskLogic.js'
import { accessMatrix, buildAccountView, normalizeRestriction, planAccountAction, requiresFreshAuth } from '../src/providerAccountLogic.js'

const NOW = Date.UTC(2026, 9, 12, 9, 0)
const provider = (extra = {}) => normalizeProvider('PR-1', { name: 'Grace Njeri', marketCode: 'KE', verificationStatus: 'verified', accountStatus: 'active', rating: 4.9, userId: 'U1', ...extra })
const actor = { id: 'A1', name: 'Jane', role: 'Trust & Safety' }
const allPerms = { viewFinance: true, moderateReviews: true, manageSubscriptions: true, manageVisibility: true, assessRisk: true, accountActions: true, restrictWithdrawals: true, deactivate: true }

// ---------- ADM-025 ----------
const booking = normalizeBooking('LI-1', { bookingId: 'LI-1', providerId: 'PR-1', clientId: 'C1', status: 'completed', startAt: NOW - 5 * DAY, completedAt: NOW - 5 * DAY })
const review = (extra = {}) => normalizeReview('REV-1', { reviewId: 'REV-1', providerId: 'PR-1', clientId: 'C1', clientName: 'Sarah', bookingId: 'LI-1', rating: 5, text: 'Great', status: 'published', submittedAt: NOW - 4 * DAY, ...extra })

test('ADM-025: overview and distribution come from the actual records', () => {
  const reviews = [review(), review({ reviewId: 'REV-2', rating: 4 }), review({ reviewId: 'REV-3', rating: 1, status: 'hidden' })]
  const view = buildReviewsView({ reviews, reports: [], bookings: [booking], filters: {}, now: NOW })
  assert.equal(view.overview.totalReviews, 3)
  assert.equal(view.overview.averageRating, 4.5) // published only
  assert.equal(view.overview.hiddenRemoved, 1)
  assert.equal(view.distribution.find((d) => d.star === 5).percent, 50)
  assert.equal(view.performance.sentiment, null) // not implemented → not shown
})

test('ADM-025: tabs, search and booking-verified filters', () => {
  const reviews = [review(), review({ reviewId: 'REV-2', bookingId: null, text: 'lovely massage' })]
  const reports = [normalizeReport('R1', { reviewId: 'REV-1', status: 'open' })]
  let view = buildReviewsView({ reviews, reports, bookings: [booking], filters: { tab: 'reported' }, now: NOW })
  assert.deepEqual(view.items.map((r) => r.id), ['REV-1'])
  view = buildReviewsView({ reviews, reports, bookings: [booking], filters: { search: 'lovely' }, now: NOW })
  assert.deepEqual(view.items.map((r) => r.id), ['REV-2'])
  view = buildReviewsView({ reviews, reports, bookings: [booking], filters: { bookingVerified: 'no' }, now: NOW })
  assert.deepEqual(view.items.map((r) => r.id), ['REV-2'])
})

test('ADM-025: authenticity signals flag duplicates and refunds without deciding', () => {
  const refunded = normalizeBooking('LI-1', { ...booking, bookingId: 'LI-1', status: 'completed', clientId: 'C1', paymentStatus: 'refunded', completedAt: NOW - 5 * DAY })
  const sigs = authenticitySignals(review(), refunded, [review(), review({ reviewId: 'REV-9' })])
  assert.equal(sigs.find((s) => s.key === 'no_duplicate').ok, false)
  assert.equal(sigs.find((s) => s.key === 'booking_refunded').tone, 'warn')
})

test('ADM-025: hide/remove require a policy reason; negative rating alone is not one', () => {
  const r = review({ rating: 1 })
  assert.match(planReviewModeration({ review: r, input: { action: 'hide' }, now: NOW }).error, /reason/)
  assert.match(planReviewModeration({ review: r, input: { action: 'hide', reasonCode: 'provider_dislikes' }, now: NOW }).error, /reason/)
})

test('ADM-025: moderation preserves original content, resolves reports and separates notes', () => {
  const r = review()
  const reports = [normalizeReport('R1', { reviewId: 'REV-1', status: 'open', reportedByType: 'provider', reportedById: 'PR-1' })]
  const same = planReviewModeration({ review: r, reports, input: { action: 'remove', reasonCode: 'spam', clientExplanation: 'x x', internalNote: 'x x' }, now: NOW })
  assert.match(same.error, /different/)
  const plan = planReviewModeration({ review: r, reports, input: { action: 'remove', reasonCode: 'spam', internalNote: 'Bot pattern', expectedStatus: 'published' }, actor, now: NOW })
  assert.equal(plan.newStatus, 'removed')
  assert.equal(plan.reviewPatch.text, undefined)
  assert.equal(plan.reviewPatch.rating, undefined)
  assert.equal(plan.reportUpdates[0].patch.status, 'resolved')
  assert.ok(plan.events.length >= 1)
  const stale = planReviewModeration({ review: r, reports, input: { action: 'hide', reasonCode: 'spam', expectedStatus: 'hidden' }, now: NOW })
  assert.equal(stale.code, 'failed-precondition')
})

test('ADM-025: provider responses use the same moderation path', () => {
  const r = review({ providerResponse: { text: 'Thanks', status: 'published' } })
  const reports = [normalizeReport('R2', { reviewId: 'REV-1', status: 'open', target: 'response' })]
  const plan = planReviewModeration({ review: r, reports, input: { action: 'hide', target: 'response', reasonCode: 'harassment' }, actor, now: NOW })
  assert.equal(plan.reviewPatch.providerResponse.status, 'hidden')
  assert.equal(plan.reviewPatch.status, undefined)
})

// ---------- ADM-026 ----------
const plans = [
  normalizePlan('pro', { planId: 'pro', name: 'Professional Standard', marketCode: 'KE', currency: 'KES', price: 1999, kind: 'base' }),
  normalizePlan('plus', { planId: 'plus', name: 'Professional Plus', marketCode: 'KE', currency: 'KES', price: 2999, kind: 'base' }),
  normalizePlan('prem', { planId: 'prem', name: 'Premium Visibility', marketCode: 'KE', currency: 'KES', price: 2999, kind: 'visibility_addon' }),
]
const sub = (extra = {}) => normalizeSubscription('SUB-1', { subscriptionId: 'SUB-1', planId: 'pro', planName: 'Professional Standard', status: 'active', currentPeriodStart: NOW - 10 * DAY, currentPeriodEnd: NOW + 20 * DAY, priceCharged: { amount: 1999, currency: 'KES' }, paymentStatus: 'paid', ...extra })

test('ADM-026: subscription status is independent from account status', () => {
  assert.equal(resolveSubscriptionStatus(sub({ currentPeriodEnd: NOW - 10 * DAY }), NOW).status, 'expired')
  assert.equal(resolveSubscriptionStatus(sub({ currentPeriodEnd: NOW - DAY, paymentStatus: 'failed' }), NOW).status, 'payment_pending')
  assert.equal(resolveSubscriptionStatus(sub({ currentPeriodEnd: NOW + 3 * DAY, autoRenew: false }), NOW).status, 'expiring_soon')
  const view = buildSubscriptionView({ provider: provider(), subscription: sub({ currentPeriodEnd: NOW - 10 * DAY }), plans, permissions: allPerms, now: NOW })
  assert.equal(view.provider.accountStatus, 'active')
  assert.equal(view.status.status, 'expired')
  assert.equal(view.visibility.baseVisible, false)
})

test('ADM-026: a suspended provider never regains visibility via subscription or premium', () => {
  const view = buildSubscriptionView({ provider: provider({ accountStatus: 'suspended' }), subscription: sub(), plans, visibility: { level: 'premium', premiumEndsAt: NOW + 5 * DAY, featured: true }, permissions: allPerms, now: NOW })
  assert.equal(view.visibility.baseVisible, false)
  assert.equal(view.visibility.placement.find((p) => p.key === 'featured').state, 'not_active')
  const plan = planVisibilityChange({ provider: provider({ accountStatus: 'suspended' }), subscription: sub(), visibility: { paused: true }, input: { action: 'restore', reasonCode: 'other' }, now: NOW })
  assert.ok(plan.error)
})

test('ADM-026: prices are hidden without finance permission and failed add-on renewal is detected', () => {
  const payments = [
    normalizePayment('P1', { status: 'successful', planKind: 'base', amount: 1999, createdAt: NOW - 10 * DAY }),
    normalizePayment('P2', { status: 'failed', planKind: 'visibility_addon', amount: 2999, createdAt: NOW - 9 * DAY }),
  ]
  const view = buildSubscriptionView({ provider: provider(), subscription: sub(), plans, payments, permissions: { manageSubscriptions: true }, now: NOW })
  assert.equal(view.subscription.price.masked, true)
  assert.equal(view.subscription.price.amount, null)
  assert.equal(view.failedRenewal.kind, 'visibility_addon')
})

test('ADM-026: changes need a reason, cannot mark payments paid, and append history', () => {
  assert.match(planSubscriptionChange({ provider: provider(), subscription: sub(), plans, input: { action: 'mark_paid', reasonCode: 'other' }, now: NOW }).error, /cannot be marked/)
  assert.match(planSubscriptionChange({ provider: provider(), subscription: sub(), plans, input: { action: 'extend', days: 5 }, now: NOW }).error, /reason/)
  const change = planSubscriptionChange({ provider: provider(), subscription: sub(), plans, input: { action: 'change_plan', planId: 'plus', effective: 'immediate', reasonCode: 'plan_migration' }, actor, now: NOW })
  assert.equal(change.patch.paymentStatus, 'pending') // payment system collects it
  assert.equal(change.historyAppend[0].status, 'superseded')
  assert.equal(change.historyAppend[1].amount, 2999) // configured price, not hardcoded
  const courtesy = planSubscriptionChange({ provider: provider(), subscription: sub(), plans, input: { action: 'courtesy_extension', days: 45, reasonCode: 'approved_courtesy' }, now: NOW })
  assert.match(courtesy.error, /between 1 and 30/)
})

// ---------- ADM-027 ----------
function bookingsFixture() {
  const list = []
  for (let i = 0; i < 40; i += 1) list.push(normalizeBooking(`B${i}`, { providerId: 'PR-1', clientId: `C${i % 25}`, status: i < 38 ? 'completed' : 'cancelled', cancelledBy: 'client', startAt: NOW - (i + 1) * 3 * DAY }))
  return list
}

test('ADM-027: quality score only with a documented model and enough data, always explained', () => {
  const stats = bookingStats(bookingsFixture(), NOW)
  const s = qualityScore({ stats, avgRating: 4.9 })
  assert.equal(s.available, true)
  assert.ok(s.score > 80 && s.score <= 100)
  assert.equal(s.explanation.length, 6)
  assert.equal(qualityScore({ stats, avgRating: 4.9, model: { enabled: false } }).available, false)
  assert.equal(qualityScore({ stats: bookingStats(bookingsFixture().slice(0, 3), NOW), avgRating: 5 }).available, false)
})

test('ADM-027: one open complaint is an open issue, not Medium risk; confirmed violations escalate', () => {
  const complaint = normalizeCase('SAF-1', { status: 'under_review', category: 'Professional Conduct' })
  let view = buildRiskView({ provider: provider(), bookings: bookingsFixture(), cases: [complaint], permissions: allPerms, now: NOW })
  assert.equal(view.kpis.risk.level, 'low')
  assert.equal(view.kpis.openIssues.count, 1)
  assert.equal(view.recommended.title, 'Review Client Complaint')
  const confirmed = [normalizeCase('SAF-2', { status: 'confirmed', createdAt: NOW - 10 * DAY }), normalizeCase('SAF-3', { status: 'closed', outcome: 'upheld', createdAt: NOW - 20 * DAY })]
  view = buildRiskView({ provider: provider(), bookings: bookingsFixture(), cases: confirmed, permissions: allPerms, now: NOW })
  assert.equal(view.kpis.risk.level, 'high')
})

test('ADM-027: financial signals are locked without finance permission', () => {
  const view = buildRiskView({ provider: provider(), bookings: bookingsFixture(), permissions: {}, now: NOW })
  assert.equal(view.financial, null)
  assert.equal(view.riskSignals.find((s) => s.key === 'payments').state, 'locked')
})

test('ADM-027: assessments need a reason, valid cases and keep the previous level', () => {
  assert.ok(planRiskAssessment({ input: { level: 'low', reason: 'short' } }).error)
  assert.ok(planRiskAssessment({ input: { level: 'low', reason: 'Performance remains strong', relatedCases: ['X-1'] }, cases: [] }).error)
  const plan = planRiskAssessment({ input: { level: 'medium', reason: 'Complaint under review' }, previous: { id: 'a0', level: 'low' }, actor, now: NOW })
  assert.equal(plan.record.previousLevel, 'low')
})

// ---------- ADM-028 ----------
test('ADM-028: restrictions are separate from status; active account can have scoped restriction', () => {
  const r = normalizeRestriction('R1', { kind: 'new_bookings', status: 'active' })
  const m = accessMatrix('active', [r])
  assert.equal(m.find((x) => x.key === 'new_bookings').restricted, true)
  assert.equal(m.find((x) => x.key === 'messaging').restricted, false)
  assert.equal(normalizeRestriction('legacy', { providerId: 'x', status: 'suspended' }), null)
})

test('ADM-028: suspension requires reason, message, internal note and (by policy) a case', () => {
  const base = { action: 'suspend', scope: ['new_bookings', 'public_visibility'], duration: 'until_review', reasonCode: 'professional_conduct', providerMessage: 'We are reviewing an account matter.', internalNote: 'Temporary restriction while SAF-2811 is reviewed.' }
  assert.match(planAccountAction({ provider: provider(), input: { ...base }, permissions: allPerms, now: NOW }).error, /case/)
  const cases = [normalizeCase('SAF-2811', { caseId: 'SAF-2811', status: 'under_review' })]
  const plan = planAccountAction({ provider: provider(), cases, input: { ...base, caseId: 'SAF-2811' }, actor, permissions: allPerms, now: NOW })
  assert.equal(plan.providerPatch.accountStatus, 'suspended')
  assert.equal(plan.restrictionsCreate.length, 2)
  assert.equal(plan.actionRecord.previousStatus, 'active')
  assert.equal(plan.bookingUpdates, undefined) // bookings are never touched
})

test('ADM-028: withdrawals and indefinite scopes need elevated permission; fresh auth for high-risk', () => {
  const input = { action: 'restrict', kind: 'withdrawals', duration: '7d', reasonCode: 'fraud_payment_review', providerMessage: 'Withdrawals paused for review.' }
  assert.equal(planAccountAction({ provider: provider(), input, permissions: { accountActions: true }, now: NOW }).code, 'permission-denied')
  assert.equal(requiresFreshAuth(input), true)
  assert.equal(requiresFreshAuth({ action: 'warn' }), false)
  const indef = planAccountAction({ provider: provider(), input: { ...input, kind: 'messaging', duration: 'indefinite' }, permissions: { accountActions: true }, now: NOW })
  assert.equal(indef.code, 'permission-denied')
})

test('ADM-028: reactivation lifts selected restrictions as a new event; finance restriction stays without permission', () => {
  const restrictions = [
    normalizeRestriction('R1', { kind: 'new_bookings', status: 'active', actionId: 'S1' }),
    normalizeRestriction('R2', { kind: 'withdrawals', status: 'active', actionId: 'S1' }),
  ]
  const plan = planAccountAction({ provider: provider({ accountStatus: 'suspended' }), restrictions, input: { action: 'reactivate', reasonCode: 'investigation_cleared' }, permissions: { accountActions: true }, actor, now: NOW })
  assert.deepEqual(plan.restrictionUpdates.map((u) => u.id), ['R1'])
  assert.equal(plan.providerPatch.accountStatus, 'active')
  assert.equal(plan.actionRecord.action, 'reactivate')
})

test('ADM-028: impact splits upcoming bookings and hides money without finance permission', () => {
  const bookings = [
    normalizeBooking('B1', { status: 'confirmed', clientId: 'C1', startAt: NOW + 2 * 3600e3, escrowStatus: 'held', amount: 100 }),
    normalizeBooking('B2', { status: 'confirmed', clientId: 'C2', startAt: NOW + 26 * 3600e3 }),
    normalizeBooking('B3', { status: 'confirmed', clientId: 'C2', startAt: NOW + 5 * DAY }),
  ]
  const view = buildAccountView({ provider: provider(), bookings, permissions: { accountActions: true }, now: NOW })
  assert.equal(view.impact.bookings.total, 3)
  assert.equal(view.impact.clients.upcoming, 2)
  assert.equal(view.impact.financial, null)
  assert.ok(view.permitted.includes('suspend'))
  assert.ok(!view.permitted.includes('deactivate'))
})
