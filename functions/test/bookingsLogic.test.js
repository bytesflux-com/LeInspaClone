import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDashboard, buildListView, buildQuickView, deriveOps, maskEmail, maskPhone, normalizeBooking, MINUTE, DAY } from '../src/bookingsLogic.js'

const NOW = Date.parse('2026-10-10T11:00:00Z') // 14:00 Nairobi
const at = (mins) => new Date(NOW + mins * MINUTE).toISOString()
const make = (over = {}) =>
  normalizeBooking(over.id || 'BK-1', {
    bookingStatus: 'confirmed',
    countryCode: 'KE',
    currency: 'KES',
    totalPrice: 4500,
    providerType: 'massage_therapist',
    paymentStatus: 'paid',
    scheduledAt: at(120),
    durationMinutes: 60,
    createdAt: at(-60),
    ...over,
  })

test('a booking past its start time is not ongoing without a start event', () => {
  const o = deriveOps(make({ scheduledAt: at(-30) }), NOW)
  assert.equal(o.ongoing, false)
  assert.equal(o.runningLate, true)
  assert.equal(o.operational, 'running_late')
})

test('provider check-in (arrived) suppresses the running-late flag', () => {
  const o = deriveOps(make({ bookingStatus: 'arrived', scheduledAt: at(-20) }), NOW)
  assert.equal(o.runningLate, false)
  assert.equal(o.startingSoon, true)
})

test('only a few minutes past start stays inside the grace window', () => {
  assert.equal(deriveOps(make({ scheduledAt: at(-5) }), NOW).runningLate, false)
})

test('service start evidence makes a booking ongoing and tracks elapsed time', () => {
  const o = deriveOps(make({ bookingStatus: 'service_in_progress', scheduledAt: at(-40), serviceStartedAt: at(-38) }), NOW)
  assert.equal(o.ongoing, true)
  assert.equal(o.elapsedMins, 38)
  assert.equal(o.operational, 'in_progress')
})

test('running over expected duration is a warning, and never completes the booking', () => {
  const o = deriveOps(make({ bookingStatus: 'service_in_progress', serviceStartedAt: at(-90) }), NOW)
  assert.equal(o.overTime, true)
  assert.equal(o.overByMins, 30)
  assert.equal(o.completed, false)
})

test('scheduled end passing does not mark a booking completed', () => {
  const o = deriveOps(make({ scheduledAt: at(-300) }), NOW)
  assert.equal(o.completed, false)
  assert.equal(o.settlement, null)
})

test('provider completion moves the booking to awaiting completion', () => {
  const o = deriveOps(make({ bookingStatus: 'service_in_progress', serviceStartedAt: at(-70), serviceCompletedByProvider: true }), NOW)
  assert.equal(o.awaitingCompletion, true)
  assert.equal(o.ongoing, false)
  assert.equal(o.operational, 'awaiting_completion')
})

test('individual professionals never need a staff assignment', () => {
  const o = deriveOps(make(), NOW)
  assert.equal(o.assignment, 'not_required')
  assert.equal(o.issues.includes('unassigned'), false)
})

test('a spa booking without staff is unassigned and needs attention', () => {
  const o = deriveOps(make({ providerType: 'spa' }), NOW)
  assert.equal(o.assignment, 'unassigned')
  assert.equal(o.readiness, 'assignment_pending')
  assert.ok(o.issues.includes('unassigned'))
})

test('booking, payment, assignment and readiness stay separate', () => {
  const o = deriveOps(make({ providerType: 'spa', assignedStaffName: 'Lucy', paymentStatus: 'pending', scheduledAt: at(180) }), NOW)
  const b = make({ paymentStatus: 'pending' })
  assert.equal(b.status, 'confirmed')
  assert.equal(b.payment, 'pending')
  assert.equal(o.assignment, 'assigned')
  assert.equal(o.readiness, 'payment_pending')
})

test('a pending payment far in the future is not yet an issue', () => {
  const o = deriveOps(make({ paymentStatus: 'pending', scheduledAt: at(5 * 24 * 60) }), NOW)
  assert.equal(o.issues.includes('payment_issue'), false)
})

test('completed with escrow funded is settlement pending, released is settled', () => {
  assert.equal(deriveOps(make({ bookingStatus: 'completed', escrowStatus: 'funded' }), NOW).settlement, 'pending')
  assert.equal(deriveOps(make({ bookingStatus: 'completed', escrowStatus: 'released' }), NOW).settlement, 'settled')
  assert.equal(deriveOps(make({ bookingStatus: 'completed', escrowStatus: 'disputed' }), NOW).settlement, 'on_hold')
})

test('dashboard never sums different currencies', () => {
  const rows = [make({ id: 'a' }), make({ id: 'b', countryCode: 'UG', currency: 'UGX', totalPrice: 90000 })]
  const d = buildDashboard(rows, { now: NOW, period: { start: NOW - DAY, end: NOW + MINUTE } })
  assert.equal(d.kpis.value.mode, 'multiple')
  assert.deepEqual(d.kpis.value.byMarket.map((m) => m.currency).sort(), ['KES', 'UGX'])
})

test('dashboard hides money without the payments permission', () => {
  const d = buildDashboard([make()], { now: NOW, period: { start: NOW - DAY, end: NOW }, finance: false })
  assert.equal(d.kpis.value, null)
  assert.equal(d.recent[0].amount, null)
})

test('active view floats problem bookings first and paginates', () => {
  const rows = [
    make({ id: 'ok', bookingStatus: 'service_in_progress', serviceStartedAt: at(-10) }),
    make({ id: 'late', scheduledAt: at(-30) }),
    make({ id: 'later', scheduledAt: at(600) }),
  ]
  const res = buildListView('active', rows, { pageSize: 5 }, { now: NOW })
  assert.equal(res.total, 2)
  assert.equal(res.items[0].id, 'late')
  assert.equal(res.summary.runningLate, 1)
})

test('upcoming tabs split today and tomorrow', () => {
  const rows = [make({ id: 't', scheduledAt: at(120) }), make({ id: 'm', scheduledAt: at(24 * 60) })]
  const res = buildListView('upcoming', rows, { tab: 'tomorrow' }, { now: NOW })
  assert.deepEqual(res.items.map((i) => i.id), ['m'])
  assert.equal(res.tabs.find((t) => t.id === 'today').count, 1)
})

test('quick view reports a conflict without changing the booking', () => {
  const q = buildQuickView(make({ hasConflict: true, conflictType: 'provider_double_booked' }), NOW)
  assert.equal(q.status, 'confirmed')
  assert.equal(q.overall.tone, 'bad')
  assert.equal(q.checks.find((c) => c.label === 'Booking Conflict').value, 'Provider double booked')
})

test('ADM-048: a refund after completion keeps the booking completed', () => {
  const res = buildListView('completed', [make({ bookingStatus: 'completed', paymentStatus: 'refunded', escrowStatus: 'refunded', serviceConfirmed: true, completedAt: at(-60) })], {}, { now: NOW })
  assert.equal(res.items[0].status, 'completed')
  assert.equal(res.items[0].postService, 'refund_resolved')
  assert.equal(res.items[0].needsAttention, false)
})

test('ADM-048: settlement pending and missing client confirmation are follow-ups', () => {
  const res = buildListView('completed', [make({ bookingStatus: 'completed', escrowStatus: 'funded', completedAt: at(-60) })], {}, { now: NOW })
  assert.deepEqual(res.items[0].issues.sort(), ['awaiting_confirmation', 'settlement_pending'])
  assert.equal(res.items[0].postService, 'follow_up')
  assert.equal(res.summary.awaitingSettlement, 1)
})

test('ADM-048: completion source is shown, never hidden', () => {
  const q = buildQuickView(make({ bookingStatus: 'completed', serviceCompletedByProvider: true, completedAt: at(-30) }), NOW, { view: 'completed' })
  assert.equal(q.completion.completedBy, 'provider')
  assert.equal(q.completion.status, 'awaiting_confirmation')
})

const cancelled = (over = {}) => make({ bookingStatus: 'cancelled', cancelledAt: at(-600), scheduledAt: at(1440), ...over })

test('ADM-049: a paid cancellation with no refund record is "refund not started"', () => {
  const res = buildListView('cancelled', [cancelled({ cancelledBy: 'Client' })], {}, { now: NOW })
  assert.equal(res.items[0].refund, 'not_started')
  assert.ok(res.items[0].issues.includes('refund_not_started'))
  assert.equal(res.items[0].resolution, 'needs_attention')
})

test('ADM-049: a refunded or no-refund cancellation stays quiet', () => {
  const res = buildListView('cancelled', [cancelled({ id: 'a', refundStatus: 'Refunded' }), cancelled({ id: 'b', refundStatus: 'No Refund' })], {}, { now: NOW })
  assert.deepEqual(res.items.map((i) => i.resolution).sort(), ['closed', 'resolved'])
  assert.equal(res.summary.needsAttention, 0)
})

test('ADM-049: late provider cancellation is a no-show risk; repeats are flagged, not punished', () => {
  const rows = [1, 2, 3].map((i) => cancelled({ id: `p${i}`, cancelledBy: 'Provider', refundStatus: 'Refunded', cancelledAt: at(-60), scheduledAt: at(0), providerId: 'PR-1' }))
  const res = buildListView('cancelled', rows, {}, { now: NOW })
  assert.ok(res.items.every((i) => i.issues.includes('provider_no_show') && i.issues.includes('repeated_provider')))
  assert.equal(res.summary.provider, 3)
})

test('ADM-049: completed bookings never appear as cancelled', () => {
  const res = buildListView('cancelled', [make({ bookingStatus: 'completed', paymentStatus: 'refunded' })], {}, { now: NOW })
  assert.equal(res.total, 0)
})

const guest = (over = {}) => make({ customerType: 'GUEST', clientId: null, guestSnapshot: { fullName: 'Daniel Kamau', phone: '+254712345678', email: 'daniel@gmail.com', phoneVerified: true }, ...over })

test('ADM-050: an unregistered guest is valid, not a problem', () => {
  const res = buildListView('guest', [guest()], {}, { now: NOW })
  assert.equal(res.items[0].account, 'not_registered')
  assert.equal(res.items[0].needsAttention, false)
})

test('ADM-050: guest contact is masked in lists and searchable by phone', () => {
  const res = buildListView('guest', [guest()], { q: '345678' }, { now: NOW })
  assert.equal(res.total, 1)
  assert.equal(res.items[0].guest.phone, '+254 7•• ••• 678')
  assert.equal(res.items[0].guest.email, 'da••••@gmail.com')
})

test('ADM-050: link conflicts and unverified contact need attention', () => {
  const res = buildListView('guest', [guest({ id: 'c', accountLinkStatus: 'conflict' }), guest({ id: 'u', guestSnapshot: { fullName: 'X', phone: '+254700000001' } })], {}, { now: NOW })
  assert.equal(res.attention.find((a) => a.id === 'duplicate_match').count, 1)
  assert.equal(res.attention.find((a) => a.id === 'contact_issue').count, 1)
})

test('ADM-050: registering from guest keeps the booking id and links the client', () => {
  const b = normalizeBooking('BK-1', { customerType: 'REGISTERED_FROM_GUEST', clientId: 'CLT-82941', guestSnapshot: { fullName: 'Sarah' } })
  assert.equal(b.id, 'BK-1')
  assert.equal(b.guest.account, 'linked')
  assert.equal(b.guest.linkedClientId, 'CLT-82941')
})

test('ADM-050: masking keeps the market calling code', () => {
  assert.equal(maskPhone('+27821554410'), '+27 8•• ••• 410')
  assert.equal(maskPhone('+256772554310'), '+256 7•• ••• 310')
  assert.equal(maskEmail('a@x.com'), 'a••••@x.com')
})
