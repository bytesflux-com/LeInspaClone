import test from 'node:test'
import assert from 'node:assert/strict'
import {
  bookingSummary,
  buildClientDashboard,
  clientAggregates,
  clientBookingRow,
  clientPaymentRow,
  clientStatusOf,
  directoryRow,
  maskEmail,
  maskPhone,
  mergeClient,
  paymentSummary,
  queryClients,
  walletRow,
  walletSummary,
} from '../src/clientLogic.js'
import { accountPermitted, membershipView, planAccountAction, planMembershipChange, restrictionFlags } from '../src/clientCaseLogic.js'

const NOW = Date.UTC(2026, 9, 12, 9)
const DAY = 86400000

test('client status maps the app account state plus admin flags', () => {
  assert.equal(clientStatusOf({ accountStatus: 'active', lastActive: NOW - DAY }, {}, NOW), 'active')
  assert.equal(clientStatusOf({ accountStatus: 'approved' }, {}, NOW), 'active')
  assert.equal(clientStatusOf({ accountStatus: 'suspended' }, {}, NOW), 'suspended')
  assert.equal(clientStatusOf({ accountStatus: 'suspended', accountDeactivated: true }, {}, NOW), 'deactivated')
  assert.equal(clientStatusOf({ accountStatus: 'pending' }, {}, NOW), 'pending')
  assert.equal(clientStatusOf({ accountStatus: 'active', lastActive: NOW - 200 * DAY }, {}, NOW), 'inactive')
})

test('contacts are masked and the merged client resolves country names', () => {
  assert.equal(maskEmail('wallen@gmail.com'), 'w•••••@gmail.com')
  assert.match(maskPhone('+254722998877'), /^\+254 ••• ••• 77$/)
  assert.equal(maskPhone('12'), null)
  const c = mergeClient('u1', { user: { fullName: 'Ann', country: 'Kenya', membershipType: 'premium', createdAt: NOW }, profile: { city: 'Nairobi' } }, NOW)
  assert.equal(c.country, 'KE')
  assert.equal(c.city, 'Nairobi')
  assert.equal(c.membership, 'premium')
})

const booking = (id, o) => ({ id, customerId: 'c1', bookingDate: '2026-10-20', bookingTime: '10:00 AM', local: { totalPrice: 4000, currency: 'KES' }, serviceName: 'Massage', providerName: 'Spa', ...o })

test('client booking rows map app statuses to the client tabs', () => {
  const rows = [
    clientBookingRow('b1', booking('b1', { bookingStatus: 'confirmed' })),
    clientBookingRow('b2', booking('b2', { bookingStatus: 'completed', bookingDate: '2026-10-01' })),
    clientBookingRow('b3', booking('b3', { bookingStatus: 'cancelled' })),
    clientBookingRow('b4', booking('b4', { bookingStatus: 'service_in_progress' })),
    clientBookingRow('b5', booking('b5', { bookingStatus: 'completed', hasOpenDispute: true })),
  ]
  assert.deepEqual(rows.map((r) => r.status), ['confirmed', 'completed', 'cancelled', 'ongoing', 'disputed'])
  assert.equal(rows[0].price, 4000)
  const s = bookingSummary(rows, NOW)
  assert.equal(s.upcoming, 1)
  assert.equal(s.nextLabel, 'Next in 8 days')
})

test('directory aggregates and query count by status and filter by issues', () => {
  const now = NOW
  const agg = clientAggregates({
    bookings: [booking('b1', { bookingStatus: 'completed', bookingDate: '2026-10-01' }), booking('b2', { bookingStatus: 'confirmed' })],
    payments: [{ customerId: 'c2', paymentStatus: 'failed', createdAt: now - DAY }],
    tickets: [{ userId: 'c2', status: 'Open' }],
  }, now)
  const rows = [
    directoryRow(mergeClient('c1', { user: { fullName: 'Ann', country: 'KE', accountStatus: 'active', createdAt: now - 2 * DAY } }, now), agg.get('c1'), now),
    directoryRow(mergeClient('c2', { user: { fullName: 'Ben', country: 'KE', accountStatus: 'suspended', createdAt: now - DAY } }, now), agg.get('c2'), now),
  ]
  assert.equal(rows[0].bookings, 2)
  assert.equal(rows[0].hasUpcoming, true)
  assert.equal(rows[1].paymentIssue, true)
  const all = queryClients(rows, {}, { now })
  assert.equal(all.counts.active, 1)
  assert.equal(all.counts.suspended, 1)
  assert.equal(all.items[0].id, 'c2') // newest first
  assert.match(all.items[0].email ?? '', /^$|•/)
  assert.equal(queryClients(rows, { issues: ['payment'] }, { now }).total, 1)
  assert.equal(queryClients(rows, { issues: ['ticket'] }, { now }).items[0].id, 'c2')
  assert.equal(queryClients(rows, { activity: 'upcoming' }, { now }).items[0].id, 'c1')
})

test('dashboard counts new and booking clients for the period without inventing history', () => {
  const rows = [mergeClient('c1', { user: { country: 'KE', createdAt: NOW - 3 * DAY } }, NOW), mergeClient('c2', { user: { country: 'UG', createdAt: NOW - 60 * DAY } }, NOW)].map((c) => directoryRow(c, {}, NOW))
  const dash = buildClientDashboard({ rows, bookings: [booking('b1', { bookingStatus: 'completed', bookingDate: '2026-10-08', customerId: 'c1' })], market: 'ALL', range: '30d', now: NOW })
  assert.equal(dash.kpis.total.value, 2)
  assert.equal(dash.kpis.total.change, null)
  assert.equal(dash.kpis.newClients.value, 1)
  assert.equal(dash.kpis.bookingClients.value, 1)
  assert.equal(dash.booking.completionRate, 100)
  assert.equal(buildClientDashboard({ rows, bookings: [], market: 'UG', range: '30d', now: NOW }).kpis.total.value, 1)
})

test('payment totals use one currency and wallet direction follows the signed amount', () => {
  const p = [
    clientPaymentRow('p1', { amount: 1000, currency: 'KES', paymentStatus: 'completed', paymentType: 'booking' }),
    clientPaymentRow('p2', { amount: 500, currency: 'KES', paymentStatus: 'pending', paymentType: 'wallet_topup' }),
    clientPaymentRow('p3', { amount: 5, currency: 'USD', paymentStatus: 'completed', paymentType: 'subscription' }),
  ]
  assert.deepEqual(p.map((x) => x.type), ['booking', 'wallet', 'membership'])
  const s = paymentSummary(p)
  assert.equal(s.currency, 'KES')
  assert.equal(s.totalPaid, 1000)
  assert.equal(s.otherCurrencyPayments, 1)

  const w = [walletRow('t1', { type: 'topup', amount: 100, currency: 'USD', status: 'completed' }), walletRow('t2', { type: 'payment', amount: -40, currency: 'USD' })]
  assert.deepEqual(w.map((t) => t.direction), ['credit', 'debit'])
  const ws = walletSummary(w, { availableBalanceBase: 60, availableBalance: 7800 })
  assert.equal(ws.balance, 60)
  assert.equal(ws.reconciled, true)
  assert.equal(walletSummary(w, { availableBalanceBase: 99 }).reconciled, false)
})

const perms = { manage: true, finance: true, safety: true, deactivate: true, superAdmin: false, manageMembership: true }

test('account actions validate reasons, scopes and the latest state', () => {
  const client = { status: 'active' }
  assert.match(planAccountAction({ action: 'suspend', payload: {}, client, restrictions: [], cases: [], perms }).error, /reason/)
  const ok = planAccountAction({ action: 'suspend', payload: { category: 'Policy Violation', scope: ['booking', 'full'], notify: false }, client, restrictions: [], cases: [], perms, upcomingCount: 2, now: NOW })
  assert.deepEqual(ok.restriction.scope, ['full'])
  assert.equal(ok.user.accountStatus, 'suspended')
  assert.equal(ok.bookingsAffected, 2)
  assert.match(planAccountAction({ action: 'suspend', payload: { category: 'Policy Violation', scope: ['wallet'], notify: false }, client, restrictions: [], cases: [], perms: { ...perms, finance: false } }).error, /Finance/)
  assert.match(planAccountAction({ action: 'suspend', payload: { category: 'Policy Violation', scope: ['booking'], duration: 'indefinite', notify: false }, client, restrictions: [], cases: [], perms }).error, /higher permission/)
  // Already suspended → suspend not allowed, reactivate allowed.
  const p = accountPermitted({ status: 'suspended', restrictions: [], perms })
  assert.equal(p.suspend.allowed, false)
  assert.equal(p.reactivate.allowed, true)
  const flags = restrictionFlags([{ kind: 'suspension', scope: ['full'] }, { kind: 'review', scope: [] }])
  assert.equal(flags['adminRestrictions.booking'], true)
  assert.equal(flags['adminRestrictions.underReview'], true)
})

test('membership view reads client periods and changes never mark payments paid', () => {
  const subs = [{ id: 's1', planName: 'Premium Client', status: 'active', startDate: NOW - 5 * DAY, endDate: NOW + 25 * DAY, amount: 7.66, currency: 'USD', autoRenew: true }]
  const view = membershipView({ client: { id: 'c1', country: 'KE' }, user: { membershipType: 'premium' }, subs, payments: [], settings: { subscriptions: { client: { premium: 7.66 } } }, perms, now: NOW })
  assert.equal(view.membership.tierId, 'premium')
  assert.equal(view.membership.status, 'active')
  assert.equal(view.manage.actions.find((a) => a.id === 'cancel_renewal').enabled, true)
  const exec = view.manage.actions.find((a) => a.id === 'change_tier').options.find((o) => o.tierId === 'executive')
  assert.equal(exec.available, false)
  assert.match(planMembershipChange({ view, action: 'extend', payload: { days: 40 }, reason: 'Goodwill', now: NOW }).error, /between 1 and 31/)
  const ext = planMembershipChange({ view, action: 'extend', payload: { days: 7 }, reason: 'Goodwill', now: NOW })
  assert.equal(ext.period.endDate, NOW + 32 * DAY)
  const std = membershipView({ client: { id: 'c2', country: 'KE' }, user: { membershipType: 'standard' }, subs: [], payments: [], perms, now: NOW })
  const up = planMembershipChange({ view: std, action: 'change_tier', payload: { tierId: 'premium' }, reason: 'Client request', now: NOW })
  assert.equal(up.newPeriod.status, 'pending')
  assert.equal(up.newPeriod.paymentRequired, true)
})
