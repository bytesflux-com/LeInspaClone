import test from 'node:test'
import assert from 'node:assert/strict'
import { adminAccountStatus, normalizeProvider } from '../src/providerAdminShared.js'
import { normalizeReview, reportFromFlag } from '../src/providerReviewsLogic.js'
import { appPlans, appSubscriptionState, appVisibility } from '../src/providerSubscriptionLogic.js'
import { bookingsSummary, directoryRow, queryDirectory, reviewStats, walletTransactions } from '../src/providerViews.js'
import { mergeProvider } from '../src/platformData.js'

const NOW = Date.UTC(2026, 9, 12, 9)
const DAY = 86400000

test('admin account status maps app status plus admin flags', () => {
  assert.equal(adminAccountStatus({ accountStatus: 'approved' }), 'active')
  assert.equal(adminAccountStatus({ accountStatus: 'suspended' }), 'suspended')
  assert.equal(adminAccountStatus({ accountStatus: 'suspended', accountDeactivated: true }), 'deactivated')
  assert.equal(adminAccountStatus({ accountStatus: 'approved', adminReviewStatus: 'under_review' }), 'under_review')
  // Review flag never masks a suspension.
  assert.equal(adminAccountStatus({ accountStatus: 'suspended', adminReviewStatus: 'under_review' }), 'suspended')
})

test('provider header resolves country names stored by the app', () => {
  assert.equal(normalizeProvider('u1', { country: 'Kenya', accountStatus: 'approved' }).marketCode, 'KE')
  assert.equal(normalizeProvider('u1', { country: 'Nigeria' }).marketCode, 'NG')
})

test('app isReported flag surfaces as an open report and nothing otherwise', () => {
  const flagged = normalizeReview('r1', { providerId: 'p1', rating: 2, reviewText: 'Late', customerName: 'A', isReported: true, reportedAt: NOW - DAY })
  const report = reportFromFlag(flagged)
  assert.equal(report.id, 'flag-r1')
  assert.equal(report.status, 'open')
  assert.equal(report.createdAt, NOW - DAY)
  assert.equal(flagged.text, 'Late')
  assert.equal(flagged.clientName, 'A')
  assert.equal(reportFromFlag(normalizeReview('r2', { rating: 5 })), null)
})

test('subscription state picks the live period and derives payment status', () => {
  const subs = [
    { id: 'old', planName: 'Standard', status: 'active', startDate: NOW - 60 * DAY, endDate: NOW - 30 * DAY, amount: 10, currency: 'USD' },
    { id: 'cur', planName: 'Premium', status: 'active', startDate: NOW - 5 * DAY, endDate: NOW + 25 * DAY, amount: 25, autoRenew: true },
    { id: 'gone', planName: 'Premium', status: 'superseded', startDate: NOW - 4 * DAY, endDate: NOW - 4 * DAY },
  ]
  const payments = [{ id: 'pay1', subscriptionId: 'cur', paymentStatus: 'successful' }]
  const { current, subscription, history } = appSubscriptionState(subs, payments, NOW)
  assert.equal(current.id, 'cur')
  assert.equal(subscription.planId, 'premium')
  assert.equal(subscription.paymentStatus, 'paid')
  assert.equal(subscription.autoRenew, true)
  assert.deepEqual(history.map((h) => h.id), ['cur', 'old'])
  assert.equal(history.find((h) => h.id === 'old').status, 'completed')

  // Pending period with no payment stays pending; no subscriptions → null.
  const pending = appSubscriptionState([{ id: 'p', planName: 'Standard', status: 'pending', startDate: NOW }], [], NOW)
  assert.equal(pending.subscription.paymentStatus, 'pending')
  assert.equal(appSubscriptionState([], [], NOW).subscription, null)
})

test('plans come from global settings per provider type, with no invented prices', () => {
  const settings = { subscriptions: { provider: { spa_wellness: { standard: 20, premium: 45.5 } } } }
  const plans = appPlans(settings, 'spa')
  assert.deepEqual(plans.map((p) => p.id).sort(), ['premium', 'standard'])
  assert.equal(plans.find((p) => p.id === 'premium').price, 45.5)
  assert.equal(plans.find((p) => p.id === 'premium').visibilityTier, 'premium')
  assert.deepEqual(appPlans(settings, 'massage_therapist'), [])
})

test('visibility reads the type document flags', () => {
  const v = appVisibility({ isFeatured: true, visibilityPaused: true, visibilityPausedReason: 'policy', visibilityVersion: 3 }, { planName: 'Premium', currentPeriodStart: 1, currentPeriodEnd: 2 })
  assert.equal(v.level, 'premium')
  assert.equal(v.featured, true)
  assert.equal(v.paused, true)
  assert.equal(v.version, 3)
  assert.equal(appVisibility({}, null).level, 'standard')
})

test('directory rows and query use real fields and count by status', () => {
  const ke = mergeProvider('a', { user: { accountType: 'massage_therapists', accountStatus: 'approved', fullName: 'Ann', country: 'Kenya', createdAt: NOW - DAY } })
  const ng = mergeProvider('b', { user: { accountType: 'spa', accountStatus: 'pending', country: 'NG', createdAt: NOW }, detail: { businessName: 'Bliss Spa' } })
  const rows = [directoryRow(ke), directoryRow(ng)]
  assert.equal(rows[0].marketCode, 'KE')
  assert.equal(rows[0].typeId, 'massage_therapist')
  assert.equal(rows[1].name, 'Bliss Spa')
  assert.equal(rows[1].entityType, 'spa')

  const all = queryDirectory(rows)
  assert.equal(all.totalItems, 2)
  assert.equal(all.items[0].id, 'b') // newest first
  assert.equal(all.statusCounts.active, 1)
  assert.equal(all.statusCounts.pending, 1)
  assert.equal(queryDirectory(rows, { market: 'KE' }).totalItems, 1)
  assert.equal(queryDirectory(rows, { searchQuery: 'bliss' }).items[0].id, 'b')
  assert.equal(queryDirectory(rows, { providerType: 'professionals' }).totalItems, 1)
})

test('bookings summary hides money without finance access and sums escrow by status', () => {
  const bookings = [
    { status: 'completed', amount: 1000, providerAmount: 850, platformFee: 150, client: { id: 'c1' } },
    { status: 'completed', amount: 500, providerAmount: 425, platformFee: 75, client: { id: 'c1' } },
    { status: 'cancelled', amount: 700, client: { id: 'c2' } },
  ]
  const escrows = [{ status: 'funded', local: { totalPrice: 300 } }, { status: 'released', local: { totalPrice: 1500 } }]
  const masked = bookingsSummary(bookings, { escrows })
  assert.equal(masked.financials, null)
  assert.equal(masked.escrowPositions, null)
  assert.equal(masked.counts.completed, 2)
  assert.equal(masked.performance.completionRate, 66.7)
  assert.equal(masked.performance.repeatClientsRate, 100)

  const s = bookingsSummary(bookings, { escrows, finance: true, wallet: { local: { availableBalance: 900 } }, currency: 'KES' })
  assert.equal(s.financials.grossServiceValue, 1500)
  assert.equal(s.financials.providerEarnings, 1275)
  assert.equal(s.escrowPositions.held, 300)
  assert.equal(s.escrowPositions.released, 1500)
  assert.equal(s.withdrawalPositions.availableToWithdraw, 900)
  assert.equal(s.withdrawalPositions.recentRequest, null)
})

test('wallet transaction direction follows the recorded balance movement', () => {
  const [debit, credit] = walletTransactions([
    { id: 'w2', type: 'earning', amount: 200, balanceBefore: 500, balanceAfter: 300, createdAt: NOW },
    { id: 'w1', type: 'withdrawal', amount: 100, balanceBefore: 300, balanceAfter: 400, createdAt: NOW - DAY },
  ], 'KES')
  assert.equal(debit.isCredit, false)
  assert.equal(credit.isCredit, true)
  assert.match(credit.amountFormatted, /^\+ KES 100$/)
})

test('review stats exclude hidden and removed reviews', () => {
  const stats = reviewStats([{ rating: 5 }, { rating: 4 }, { rating: 1, status: 'hidden' }, { rating: 1, status: 'removed' }])
  assert.equal(stats.count, 2)
  assert.equal(stats.avg, 4.5)
  assert.equal(stats.distribution.find((d) => d.stars === 5).percentage, 50)
})
