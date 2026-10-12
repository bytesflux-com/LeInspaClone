// ADM-005 — Global Admin Dashboard: pure aggregation over the mobile app's
// records (users, bookings, payments, escrow_transactions, withdrawal_requests,
// disputes, safety_reports, support_tickets, verification_requests,
// professional_profile_update_requests, subscriptions). Every figure is computed
// from records; nothing is estimated. Trends compare with the previous period
// of equal length and are null when there is nothing to compare against.

import { convertCurrency } from './utils/currency.js'
import { accountStatusOf, inMarkets, lowerStatus, millis, providerTypeOf, PROVIDER_TYPES } from './platformData.js'

export const MARKETS = {
  KE: { name: 'Kenya', currency: 'KES' },
  UG: { name: 'Uganda', currency: 'UGX' },
  TZ: { name: 'Tanzania', currency: 'TZS' },
  RW: { name: 'Rwanda', currency: 'RWF' },
  ZA: { name: 'South Africa', currency: 'ZAR' },
}

const PAID = new Set(['successful', 'success', 'completed', 'paid'])
export const WITHDRAWAL_OPEN = new Set(['submitted', 'pending', 'processing', 'manual_review', 'pending_approval', 'under_review'])
const SAFETY_OPEN = new Set(['pending', 'open', 'under_investigation', 'under_review', 'escalated'])
const DISPUTE_OPEN = new Set(['open', 'pending', 'under_review', 'escalated'])
const SUPPORT_OPEN = new Set(['open', 'pending', 'in_progress', 'awaiting_reply'])

export const isPaid = (p) => PAID.has(lowerStatus(p.status)) || PAID.has(lowerStatus(p.paymentStatus))

export function pctChange(current, previous) {
  if (!previous) return null
  const v = Math.round(((current - previous) / previous) * 1000) / 10
  return `${v >= 0 ? '+' : ''}${v}%`
}
const countChange = (current, previous) => (current === previous ? null : `${current - previous >= 0 ? '+' : ''}${current - previous}`)

// Money in a record's own currency → reporting currency.
const money = (amount, from, to) => (typeof amount === 'number' && Number.isFinite(amount) ? convertCurrency(amount, from || to, to) : 0)
const round = (n) => Math.round(n * 100) / 100

const DAY = 86400000
const inRange = (ms, start, end) => typeof ms === 'number' && ms >= start && ms <= end

/**
 * @param src  { users, bookings, payments, escrows, withdrawals, disputes, safety, supportTickets, verificationRequests, profileUpdates, subscriptions }
 * @param opts { market, markets, start, end, now, dayKey(ms) → 'YYYY-MM-DD' in admin tz }
 */
export function buildGlobalDashboard(src, { market = 'ALL', markets = null, start, end, dayKey }) {
  const reporting = MARKETS[market]?.currency || 'USD'
  const scopeMarkets = market !== 'ALL' ? [market] : markets
  const ownerCountry = (uid) => src.usersById.get(uid)?.countryCodeResolved || null
  const inScope = (code) => inMarkets(code, scopeMarkets)
  const prevStart = start - (end - start)
  const prevEnd = start

  const users = src.users.filter((u) => inScope(u.countryCodeResolved))
  const providers = users.filter((u) => providerTypeOf(u.accountType))
  const clients = users.filter((u) => String(u.accountType).toLowerCase() === 'customer')
  const bookings = src.bookings.filter((b) => inScope(b.countryCode))

  // Booking value in reporting currency (USD copy when reporting in USD).
  const value = (b) => (reporting === 'USD' && b.amountBase != null ? b.amountBase : money(b.amount, b.currency, reporting))
  const fee = (b) => (reporting === 'USD' && b.platformFeeBase != null ? b.platformFeeBase : money(b.platformFee, b.currency, reporting))
  const completedIn = (s, e) => bookings.filter((b) => b.status === 'completed' && inRange(b.completedAt || b.scheduledStart, s, e))
  const gbv = (list) => round(list.reduce((t, b) => t + value(b), 0))

  const payments = src.payments
    .map((p) => ({ ...p, country: ownerCountry(p.providerId) || ownerCountry(p.userId) || ownerCountry(p.customerId), at: millis(p.paidAt || p.createdAt), currency: p.local?.currency || p.currency || 'KES' }))
    .filter((p) => inScope(p.country) && isPaid(p))
  const payAmount = (p) => (reporting === 'USD' && typeof p.base?.totalPaid === 'number' ? p.base.totalPaid : money(p.local?.totalPaid ?? p.amount, p.currency, reporting))
  const kindOf = (p) => lowerStatus(p.paymentType || p.type)
  const paymentsIn = (s, e) => payments.filter((p) => inRange(p.at, s, e))
  const subscriptionRevenue = (list) => round(list.filter((p) => kindOf(p) === 'subscription').reduce((t, p) => t + payAmount(p), 0))

  const cur = completedIn(start, end)
  const prev = completedIn(prevStart, prevEnd)
  const curFees = round(cur.reduce((t, b) => t + fee(b), 0) + subscriptionRevenue(paymentsIn(start, end)))
  const prevFees = round(prev.reduce((t, b) => t + fee(b), 0) + subscriptionRevenue(paymentsIn(prevStart, prevEnd)))
  const bookingsIn = (s, e) => bookings.filter((b) => inRange(b.createdAtMs, s, e)).length
  const joinedIn = (list, s, e) => list.filter((u) => inRange(millis(u.createdAt), s, e)).length

  const activeClients = clients.filter((c) => accountStatusOf(c.accountStatus) === 'active').length
  const activeProviders = providers.filter((p) => accountStatusOf(p.accountStatus) === 'active').length

  // Attention
  const scoped = (rows, ...owner) => rows.filter((r) => inScope(owner.map((f) => ownerCountry(r[f])).find(Boolean) || null))
  const verificationPending = scoped(src.verificationRequests, 'userId').filter((v) => lowerStatus(v.status) === 'pending')
  const withdrawalsOpen = scoped(src.withdrawals, 'userId').filter((w) => WITHDRAWAL_OPEN.has(lowerStatus(w.status)))
  const disputesOpen = scoped(src.disputes, 'reporterId', 'againstId').filter((d) => DISPUTE_OPEN.has(lowerStatus(d.status)))
  const safetyOpen = scoped(src.safety, 'providerId', 'clientId').filter((s) => SAFETY_OPEN.has(lowerStatus(s.status)))
  const supportOpen = scoped(src.supportTickets, 'userId').filter((s) => SUPPORT_OPEN.has(lowerStatus(s.status)))

  // Financial position (current balances, reporting currency).
  const escrowCurrency = (e) => e.local?.currency || 'KES'
  const escrowAmount = (e) => (reporting === 'USD' && typeof e.base?.totalPrice === 'number' ? e.base.totalPrice : money(e.local?.totalPrice ?? e.amount, escrowCurrency(e), reporting))
  const escrows = scoped(src.escrows, 'providerId', 'customerId')
  const marketCurrency = (uid) => MARKETS[ownerCountry(uid)]?.currency || 'KES'
  const financial = {
    customerPayments: round(paymentsIn(start, end).reduce((t, p) => t + payAmount(p), 0)),
    inEscrow: round(escrows.filter((e) => ['funded', 'held', 'pending'].includes(lowerStatus(e.status))).reduce((t, e) => t + escrowAmount(e), 0)),
    providerPayable: round(escrows.filter((e) => lowerStatus(e.status) === 'funded').reduce((t, e) => t + (reporting === 'USD' ? e.base?.providerEarnings ?? 0 : money(e.local?.providerEarnings, escrowCurrency(e), reporting)), 0)),
    platformRevenue: curFees,
    pendingWithdrawals: round(withdrawalsOpen.reduce((t, w) => t + money(Number(w.amount) || 0, marketCurrency(w.userId), reporting), 0)),
    refundsIssued: round(escrows.filter((e) => ['refunded', 'split_refund'].includes(lowerStatus(e.status)) && inRange(millis(e.refundedAt), start, end)).reduce((t, e) => t + escrowAmount(e), 0)),
    currency: reporting,
  }

  // Performance chart: one point per day of the period (max 31, min 7).
  const days = Math.min(31, Math.max(7, Math.ceil((end - start) / DAY)))
  const chartStart = end - days * DAY
  const buckets = new Map()
  for (let i = 0; i < days; i += 1) buckets.set(dayKey(chartStart + (i + 1) * DAY - 1), { revenue: 0, bookings: 0 })
  for (const b of bookings) {
    const k = b.createdAtMs && buckets.get(dayKey(b.createdAtMs))
    if (k) k.bookings += 1
    const c = b.status === 'completed' && buckets.get(dayKey(b.completedAt || b.scheduledStart))
    if (c) c.revenue += value(b)
  }
  const chartPoints = [...buckets].map(([date, v]) => ({ date, revenue: round(v.revenue), bookings: v.bookings }))

  // Recent activity across sources (newest first).
  const events = []
  for (const b of bookings) if (b.createdAtMs) events.push({ id: `b-${b.id}`, type: 'booking', title: `Booking ${b.status.replaceAll('_', ' ')}`, subtitle: b.service.name, country: b.countryCode, at: b.createdAtMs, link: `/bookings/${b.id}` })
  for (const u of users) if (millis(u.createdAt)) events.push({ id: `u-${u.id}`, type: providerTypeOf(u.accountType) ? 'provider' : 'client', title: providerTypeOf(u.accountType) ? 'Provider Registration' : 'New Client Registration', subtitle: PROVIDER_TYPES[providerTypeOf(u.accountType)]?.label || 'Client', country: u.countryCodeResolved, at: millis(u.createdAt), link: providerTypeOf(u.accountType) ? `/providers/${u.id}` : `/clients/${u.id}` })
  for (const w of scoped(src.withdrawals, 'userId')) events.push({ id: `w-${w.id}`, type: 'withdrawal', title: `Withdrawal ${lowerStatus(w.status).replaceAll('_', ' ')}`, subtitle: `${marketCurrency(w.userId)} ${Number(w.amount || 0).toLocaleString('en')}`, country: ownerCountry(w.userId), at: millis(w.createdAt), link: `/withdrawals/${w.id}` })
  for (const s of scoped(src.safety, 'providerId', 'clientId')) events.push({ id: `s-${s.id}`, type: 'safety', title: 'Safety Report Received', subtitle: s.issueType || 'Safety report', priority: SAFETY_OPEN.has(lowerStatus(s.status)) ? 'Needs review' : null, country: ownerCountry(s.providerId) || ownerCountry(s.clientId), at: millis(s.createdAt), link: `/safety/${s.id}` })
  const liveOperations = events
    .filter((e) => e.at)
    .sort((a, b) => b.at - a.at)
    .slice(0, 8)
    .map((e) => ({ ...e, meta: `${MARKETS[e.country]?.name || e.country || '—'}` }))

  // Provider network by type.
  const byType = new Map()
  for (const p of providers) {
    const t = providerTypeOf(p.accountType)
    byType.set(t, (byType.get(t) || 0) + 1)
  }
  const categories = Object.entries(PROVIDER_TYPES).map(([t, info]) => ({ name: info.label, count: byType.get(t) || 0, percent: providers.length ? Math.round(((byType.get(t) || 0) / providers.length) * 100) : 0 }))

  // Membership (clients).
  const tierCounts = new Map()
  for (const c of clients) {
    const tier = String(c.membershipType || 'standard').toLowerCase()
    tierCounts.set(tier, (tierCounts.get(tier) || 0) + 1)
  }
  const TIER_COLORS = { standard: '#5c2dd5', premium: '#3b82f6', executive: '#f59e0b' }
  const clientIds = new Set(clients.map((c) => c.id))
  const clientSubs = src.subscriptions.filter((s) => clientIds.has(s.userId))
  const clientSubPaymentsIn = (s, e) => payments.filter((p) => kindOf(p) === 'subscription' && clientIds.has(p.userId || p.customerId) && inRange(p.at, s, e))
  const upgradesIn = (s, e) => clientSubs.filter((x) => inRange(millis(x.startDate || x.createdAt), s, e)).length
  const paidCur = round(clientSubPaymentsIn(start, end).reduce((t, p) => t + payAmount(p), 0))
  const paidPrev = round(clientSubPaymentsIn(prevStart, prevEnd).reduce((t, p) => t + payAmount(p), 0))

  // Approvals waiting (content & verification submissions from the app).
  const pendingVr = verificationPending
  const typeOf = (v) => lowerStatus(v.requestType)
  const approvals = {
    profilePhotos: pendingVr.filter((v) => typeOf(v) === 'profile_photo').length,
    galleryMedia: pendingVr.filter((v) => typeOf(v).startsWith('gallery')).length,
    profileChanges: pendingVr.filter((v) => typeOf(v).startsWith('profile_text')).length + scoped(src.profileUpdates, 'userId').filter((p) => lowerStatus(p.status) === 'pending').length,
    credentials: pendingVr.filter((v) => !typeOf(v) || ['hotel_business', 'spa_business', 'identity', 'professional', 'credential'].some((k) => typeOf(v).includes(k))).length,
  }

  const marketsComparison = market === 'ALL'
    ? Object.entries(MARKETS)
        .filter(([code]) => !markets || markets.includes(code))
        .map(([code, m]) => {
          const mb = src.bookings.filter((b) => b.countryCode === code)
          const revenue = round(mb.filter((b) => b.status === 'completed' && inRange(b.completedAt || b.scheduledStart, start, end)).reduce((t, b) => t + money(b.amount, b.currency, m.currency), 0))
          const attention = src.verificationRequests.filter((v) => lowerStatus(v.status) === 'pending' && ownerCountry(v.userId) === code).length
          return {
            id: code,
            code,
            name: m.name,
            currency: m.currency,
            bookings: mb.length,
            revenue,
            providers: src.users.filter((u) => u.countryCodeResolved === code && providerTypeOf(u.accountType)).length,
            attention,
            health: attention > 10 ? 'Attention' : 'Healthy',
          }
        })
    : []

  return {
    metrics: {
      grossBookingValue: { value: gbv(cur), currency: reporting, trend: pctChange(gbv(cur), gbv(prev)), period: 'vs. previous period' },
      platformRevenue: { value: curFees, currency: reporting, trend: pctChange(curFees, prevFees), period: 'vs. previous period' },
      bookings: { value: bookingsIn(start, end), trend: pctChange(bookingsIn(start, end), bookingsIn(prevStart, prevEnd)), period: 'created this period' },
      activeClients: { value: activeClients, trend: countChange(joinedIn(clients, start, end), 0), period: 'new this period' },
      activeProviders: { value: activeProviders, trend: countChange(joinedIn(providers, start, end), 0), period: 'new this period' },
    },
    attention: {
      verification: { pending: verificationPending.length, label: 'Pending Reviews', urgency: verificationPending.length ? 'high' : 'normal', link: '/verifications' },
      withdrawals: { pending: withdrawalsOpen.length, label: 'Awaiting Approval', urgency: withdrawalsOpen.length ? 'high' : 'normal', link: '/withdrawals' },
      disputes: { open: disputesOpen.length, label: 'Open Cases', urgency: disputesOpen.length ? 'high' : 'normal', link: '/disputes' },
      safety: { incidents: safetyOpen.length, label: 'Awaiting Review', urgency: safetyOpen.length ? 'high' : 'normal', link: '/safety' },
      support: { open: supportOpen.length, label: 'Open Tickets', link: '/support' },
    },
    performance: {
      currentPeriodGbv: gbv(cur),
      previousPeriodGbv: gbv(prev),
      growthPercentage: pctChange(gbv(cur), gbv(prev)),
      currency: reporting,
      chartPoints,
    },
    financial,
    markets: marketsComparison,
    liveOperations,
    providerNetwork: {
      total: providers.length,
      trend: countChange(joinedIn(providers, start, end), 0),
      period: 'new this period',
      categories,
      pendingVerification: providers.filter((p) => lowerStatus(p.professionalVerificationStatus) === 'pending' || accountStatusOf(p.accountStatus) === 'pending').length,
      suspended: providers.filter((p) => accountStatusOf(p.accountStatus) === 'suspended').length,
    },
    membership: {
      totalClients: clients.length,
      trend: countChange(joinedIn(clients, start, end), 0),
      tiers: [...tierCounts].map(([name, n]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), percent: Math.round((n / clients.length) * 100), count: n, color: TIER_COLORS[name] || '#94a3b8' })),
      paidRevenue: paidCur,
      revenueTrend: pctChange(paidCur, paidPrev),
      newUpgrades: upgradesIn(start, end),
      upgradeTrend: pctChange(upgradesIn(start, end), upgradesIn(prevStart, prevEnd)),
      currency: reporting,
    },
    approvals,
  }
}
