import test from 'node:test'
import assert from 'node:assert/strict'
import { accountStatusOf, bookingCountry, countryCodeOf, providerTypeOf } from '../src/platformData.js'
import { componentsOf, isVerificationRequest, overallStatus, planDecision, toQueueRecord, aggregates } from '../src/verificationLogic.js'
import { buildGlobalDashboard } from '../src/dashboardLogic.js'
import { buildOperations } from '../src/operationsLogic.js'
import { allowedGroups, searchEntities } from '../src/searchLogic.js'

const NOW = Date.UTC(2026, 9, 12, 9)
const DAY = 86400000

test('country, provider type and account status resolve the live data variants', () => {
  assert.equal(countryCodeOf('Kenya'), 'KE')
  assert.equal(countryCodeOf(' ke '), 'KE')
  assert.equal(countryCodeOf('qE8veAb7wZn0XDgYU2sf', 'Nigeria'), 'NG')
  assert.equal(countryCodeOf(''), null)
  assert.equal(providerTypeOf('massage_therapists'), 'massage_therapist')
  assert.equal(providerTypeOf('hotels_wellness_resorts'), 'hotel_resort')
  assert.equal(providerTypeOf('customer'), null)
  assert.equal(accountStatusOf('approved'), 'active')
  assert.equal(accountStatusOf('Suspended'), 'suspended')
  assert.equal(bookingCountry({ local: { currency: 'KES' } }, null, null), 'KE')
  assert.equal(bookingCountry({}, { country: 'Uganda' }, { country: 'Kenya' }), 'UG')
})

// ---------- Verification (ADM-029 → ADM-034)
const regRequest = {
  userId: 'U1',
  accountType: 'massage_therapist',
  status: 'pending',
  submittedAt: NOW - 3 * DAY,
  identityDocumentPath: 'identity_documents/U1/id',
  selfieWithIdDocumentPath: 'identity_documents/U1/selfie',
  professionalDocumentPaths: ['kyc_documents/U1/cert'],
  identityVerificationStatus: 'pending',
  professionalVerificationStatus: 'pending',
}
const actor = { id: 'A1', name: 'Reviewer' }

test('verification: content submissions are excluded and components derive from the app fields', () => {
  assert.equal(isVerificationRequest({ requestType: 'gallery_photo' }), false)
  assert.equal(isVerificationRequest({ requestType: 'spa_business' }), true)
  const c = componentsOf(regRequest)
  assert.deepEqual(Object.keys(c).sort(), ['CREDENTIALS', 'IDENTITY'])
  assert.equal(overallStatus(regRequest), 'AWAITING_REVIEW')
  const r = toQueueRecord('V1', regRequest, { country: 'Kenya', fullName: 'Grace Njeri' }, NOW)
  assert.equal(r.market.code, 'KE')
  assert.equal(r.isOverdue, true) // 72h > 48h SLA
  assert.equal(r.priority, 'HIGH')
})

test('verification: decisions write the app vocabulary and need every component before approval', () => {
  const p = planDecision(regRequest, { componentKey: 'IDENTITY', decision: 'APPROVE' }, actor, NOW)
  assert.equal(p.requestPatch.identityVerificationStatus, 'approved')
  assert.equal(p.requestPatch.status, 'reviewed')
  assert.equal(p.result.overallStatus, 'UNDER_REVIEW')
  assert.equal(p.userPatch.identityVerificationStatus, 'approved')
  assert.match(planDecision(regRequest, { componentKey: 'FINAL', decision: 'APPROVE' }, actor, NOW).error || '', /All components/)
  const rej = planDecision(regRequest, { componentKey: 'CREDENTIALS', decision: 'REJECT', reason: 'Certificate unreadable' }, actor, NOW)
  assert.equal(rej.requestPatch.status, 'rejected')
  assert.equal(rej.requestPatch.rejectionReason, 'Certificate unreadable')
  assert.equal(rej.detailPatch.verificationStatus, 'rejected')
  assert.equal(planDecision({ ...regRequest, status: 'approved' }, { componentKey: 'IDENTITY', decision: 'APPROVE' }, actor).code, 'failed-precondition')
  assert.equal(planDecision({ ...regRequest, adminReview: { version: 3 } }, { componentKey: 'IDENTITY', decision: 'APPROVE', expectedVersion: 2 }, actor).code, 'failed-precondition')
})

test('verification: KPI counts are real (no floors)', () => {
  const a = aggregates([toQueueRecord('V1', regRequest, {}, NOW)], NOW)
  assert.equal(a.statusCounts.all, 1)
  assert.equal(a.kpis.awaitingReview.count, 1)
  assert.equal(a.needsAttention.expiringCredentials.count, null)
})

// ---------- Dashboard / Operations / Search
function fixture() {
  const users = [
    { id: 'P1', accountType: 'massage_therapists', accountStatus: 'approved', country: 'Kenya', countryCodeResolved: 'KE', createdAt: NOW - 2 * DAY, displayName: 'Paul JK' },
    { id: 'C1', accountType: 'customer', accountStatus: 'active', country: 'KE', countryCodeResolved: 'KE', createdAt: NOW - 40 * DAY, membershipType: 'premium', fullName: 'Jeswin James', email: 'jeswin@example.com' },
    { id: 'P2', accountType: 'spa', accountStatus: 'pending', country: 'Uganda', countryCodeResolved: 'UG', createdAt: NOW - 1 * DAY },
  ]
  const bookings = [
    { id: 'B1', status: 'completed', countryCode: 'KE', amount: 5000, currency: 'KES', platformFee: 750, completedAt: NOW - DAY, createdAtMs: NOW - 2 * DAY, scheduledStart: NOW - DAY, service: { name: 'Massage' }, client: { id: 'C1', name: 'Jeswin' }, provider: { id: 'P1', name: 'Paul' }, flags: {}, location: {} },
    { id: 'B2', status: 'confirmed', countryCode: 'KE', amount: 6000, currency: 'KES', createdAtMs: NOW - 3 * DAY, scheduledStart: NOW - 5 * 3600000, service: { name: 'Massage' }, client: { id: 'C1', name: 'Jeswin' }, provider: { id: 'P1', name: 'Paul' }, flags: {}, location: {} },
  ]
  return {
    users,
    usersById: new Map(users.map((u) => [u.id, u])),
    bookings,
    payments: [{ id: 'PAY1', paymentType: 'booking', paymentStatus: 'completed', userId: 'C1', local: { totalPaid: 5000, currency: 'KES' }, createdAt: NOW - DAY }],
    escrows: [{ id: 'E1', status: 'funded', providerId: 'P1', local: { totalPrice: 6000, providerEarnings: 5100, currency: 'KES' } }],
    withdrawals: [{ id: 'W1', status: 'manual_review', userId: 'P1', amount: 2500, createdAt: NOW - DAY }],
    disputes: [{ id: 'D1', status: 'open', reporterId: 'P1', createdAt: NOW - DAY }],
    safety: [{ id: 'S1', status: 'pending', issueType: 'SOS Emergency Triggered', providerId: 'P1', createdAt: NOW - DAY }],
    supportTickets: [{ id: 'T1', status: 'Open', userId: 'C1', createdAt: NOW - 3 * DAY, subject: 'Refund' }],
    supportCases: [],
    verificationRequests: [{ id: 'V1', status: 'pending', userId: 'P1' }, { id: 'V2', status: 'pending', userId: 'P1', requestType: 'gallery_photo' }],
    profileUpdates: [],
    subscriptions: [],
    assignments: [],
  }
}

test('dashboard: market scoping, real totals and no invented trends', () => {
  const src = fixture()
  const r = buildGlobalDashboard(src, { market: 'KE', start: NOW - 30 * DAY, end: NOW, dayKey: (ms) => new Date(ms).toISOString().slice(0, 10) })
  assert.equal(r.metrics.grossBookingValue.value, 5000)
  assert.equal(r.metrics.grossBookingValue.currency, 'KES')
  assert.equal(r.metrics.grossBookingValue.trend, null) // nothing in the previous period
  assert.equal(r.providerNetwork.total, 1) // the Ugandan spa is out of scope
  assert.equal(r.attention.safety.incidents, 1)
  assert.equal(r.attention.support.open, 1) // "Open" counts as open
  assert.equal(r.financial.inEscrow, 6000)
  assert.equal(r.approvals.galleryMedia, 1)
})

test('operations: queue from real sources with SOS first', () => {
  const r = buildOperations(fixture(), { market: 'ALL', now: NOW })
  assert.equal(r.immediateAttention[0].issue, 'Safety Report')
  assert.equal(r.immediateAttention[0].priority, 'critical')
  assert.equal(r.bookingOperations.awaitingIntervention, 1) // confirmed booking 5h past start
  assert.equal(r.trustSafetyOperations.reportedReviews, null) // no source → unknown, not 0
  assert.equal(r.financeOperations.withdrawalsAwaitingApproval, 1)
})

test('search: permission-scoped groups, masked contacts, no sample entities', () => {
  const src = fixture()
  const none = searchEntities(src, { query: 'zzz-no-match', permissions: ['users.view', 'providers.view', 'bookings.view'] })
  assert.equal(none.counts.all, 0)
  const r = searchEntities(src, { query: 'jeswin', permissions: ['users.view'] })
  assert.equal(r.counts.clients, 1)
  assert.equal(r.counts.bookings, 0) // no bookings.view
  assert.equal(r.results.clients[0].email, 'je••••@example.com')
  assert.deepEqual(allowedGroups(['support.view']), ['supportTickets'])
  assert.equal(searchEntities(src, { query: 'B1', permissions: ['bookings.view'] }).exactMatch.type, 'bookings')
})
