// ADM-008 — Market / Country Dashboard: one country's view, built from the same
// record-level aggregations as ADM-005 (buildGlobalDashboard) and ADM-006
// (buildOperations) plus market-only sections (cities, payment rails, health).
// Health scores are simple, documented threshold rules over real figures.

import { MARKETS, buildGlobalDashboard, isPaid } from './dashboardLogic.js'
import { buildOperations } from './operationsLogic.js'
import { accountStatusOf, lowerStatus, millis, providerTypeOf, PROVIDER_TYPES } from './platformData.js'

const DAY = 86400000
const COLORS = ['#5c2dd5', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b']

const fmt = (n, symbol) => `${symbol ? `${symbol} ` : ''}${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`

// Threshold rule → 0-100 score and status label.
function rule(id, name, target, value, display, good, ok) {
  const score = value === null ? null : good(value) ? 95 : ok(value) ? 75 : 50
  return { id, name, target, value: display, score, status: score === null ? 'No data' : score >= 90 ? 'Optimal' : score >= 70 ? 'Attention' : 'Critical' }
}

export function buildMarketDashboard(src, { market, start, end, now = Date.now(), dayKey, symbol, manager = null }) {
  const m = MARKETS[market]
  const global = buildGlobalDashboard(src, { market, start, end, dayKey })
  const ops = buildOperations(src, { market, now })
  const inMarket = (code) => code === market
  const users = src.users.filter((u) => inMarket(u.countryCodeResolved))
  const providers = users.filter((u) => providerTypeOf(u.accountType))
  const clients = users.filter((u) => String(u.accountType).toLowerCase() === 'customer')
  const bookings = src.bookings.filter((b) => inMarket(b.countryCode))
  const ownerCountry = (...uids) => uids.map((u) => src.usersById.get(u)?.countryCodeResolved).find(Boolean) || null
  const payments = src.payments.filter((p) => inMarket(ownerCountry(p.customerId, p.userId, p.providerId)))
  const withdrawals = src.withdrawals.filter((w) => inMarket(ownerCountry(w.userId, w.providerId)))
  const prevStart = start - (end - start)
  const metric = (cur, prev, money = false) => ({
    raw: cur,
    formatted: money ? fmt(cur, symbol) : Number(cur).toLocaleString('en-US'),
    trend: prev ? `${cur - prev >= 0 ? '+' : ''}${Math.round(((cur - prev) / prev) * 1000) / 10}%` : null,
    period: 'vs previous period',
    previous: prev,
  })
  const joined = (list, s, e) => list.filter((u) => { const t = millis(u.createdAt); return t >= s && t <= e }).length

  // Cities: providers, clients and bookings by city.
  const cityMap = new Map()
  const city = (name) => {
    const key = String(name || 'Unknown').trim().toLowerCase() || 'unknown'
    if (!cityMap.has(key)) cityMap.set(key, { id: key, name: String(name || 'Unknown').trim().replace(/^\w/, (c) => c.toUpperCase()), region: null, clients: 0, providers: 0, bookings: 0, gbv: 0, revenue: 0 })
    return cityMap.get(key)
  }
  for (const u of providers) {
    const c = city(u.city)
    c.region = c.region || u.region || null
    c.providers += 1
  }
  for (const u of clients) city(u.city).clients += 1
  for (const b of bookings) {
    const c = city(src.usersById.get(b.provider.id)?.city || b.location.city)
    c.bookings += 1
    if (b.status === 'completed') {
      c.gbv += b.amount || 0
      c.revenue += b.platformFee || 0
    }
  }
  const cities = [...cityMap.values()]
    .sort((a, b) => b.providers + b.clients - (a.providers + a.clients))
    .map((c) => ({ ...c, growth: null, health: c.providers === 0 && c.clients > 0 ? 'Attention' : 'Healthy' }))

  // Payment rails: payments grouped by method in the period.
  const periodPayments = payments.filter((p) => { const t = millis(p.paidAt || p.createdAt); return t >= start && t <= end })
  const rails = new Map()
  for (const p of periodPayments) {
    const method = String(p.paymentMethod || '').toLowerCase().replace(/[^a-z]/g, '') || 'unknown'
    const r = rails.get(method) || { id: method, name: method === 'mpesa' ? 'M-PESA' : method.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()), type: method === 'mpesa' ? 'Mobile Money' : method === 'wallet' ? 'Stored Value' : 'Card / Other', volume: 0, transactions: 0, paid: 0, failed: 0 }
    r.transactions += 1
    if (isPaid(p)) { r.paid += 1; r.volume += Number(p.local?.totalPaid ?? p.amount) || 0 }
    if (['failed', 'cancelled'].includes(lowerStatus(p.paymentStatus || p.status))) r.failed += 1
    rails.set(method, r)
  }
  const railList = [...rails.values()].map((r) => ({ ...r, successRate: r.paid + r.failed ? Math.round((r.paid / (r.paid + r.failed)) * 1000) / 10 : null, status: 'Not monitored' }))
  const paidN = periodPayments.filter(isPaid).length
  const failedN = periodPayments.filter((p) => lowerStatus(p.paymentStatus || p.status) === 'failed').length

  // Health rules.
  const bookingsCur = global.metrics.bookings.value
  const bookingsPrev = bookings.filter((b) => b.createdAtMs >= prevStart && b.createdAtMs < start).length
  const growth = bookingsPrev ? (bookingsCur - bookingsPrev) / bookingsPrev : null
  const ratio = providers.length ? clients.length / providers.length : null
  const paySuccess = paidN + failedN ? paidN / (paidN + failedN) : null
  const verificationBacklog = global.attention.verification.pending
  const supportOverdue = ops.supportOperations.slaBreachOverdue
  const safetyRate = bookings.length ? global.attention.safety.incidents / bookings.length : null
  const healthMetrics = [
    rule('booking_growth', 'Booking Growth Rate', '≥ 15% period over period', growth, growth === null ? 'No prior data' : `${Math.round(growth * 1000) / 10}%`, (v) => v >= 0.15, (v) => v >= 0),
    rule('provider_supply', 'Provider Supply Ratio', '≤ 3 clients per provider', ratio, ratio === null ? '—' : `${Math.round(ratio * 10) / 10}:1`, (v) => v <= 3, (v) => v <= 6),
    rule('payment_success', 'Payment Success Rate', '> 96%', paySuccess, paySuccess === null ? '—' : `${Math.round(paySuccess * 1000) / 10}%`, (v) => v > 0.96, (v) => v > 0.9),
    rule('verification_backlog', 'Verification Backlog', '< 10 pending', verificationBacklog, `${verificationBacklog} pending`, (v) => v < 10, (v) => v < 25),
    rule('support_sla', 'Support Tickets > 24h', '0 overdue', supportOverdue, `${supportOverdue} overdue`, (v) => v === 0, (v) => v <= 3),
    rule('safety_index', 'Open Safety Reports per Booking', '< 0.1%', safetyRate, safetyRate === null ? '—' : `${Math.round(safetyRate * 10000) / 100}%`, (v) => v < 0.001, (v) => v < 0.01),
  ]
  const scored = healthMetrics.filter((h) => h.score !== null)
  const overall = scored.length ? Math.round(scored.reduce((t, h) => t + h.score, 0) / scored.length) : null

  // Provider ecosystem by type and lifecycle.
  const byType = Object.entries(PROVIDER_TYPES).map(([t, info], i) => {
    const count = providers.filter((p) => providerTypeOf(p.accountType) === t).length
    return { name: info.label, count, percent: providers.length ? Math.round((count / providers.length) * 100) : 0, color: COLORS[i % COLORS.length] }
  }).filter((x) => x.count > 0)
  const lifecycle = { active: 0, pending: 0, suspended: 0, inactive: 0 }
  for (const p of providers) {
    const s = accountStatusOf(p.accountStatus)
    if (s === 'active') lifecycle.active += 1
    else if (s === 'pending') lifecycle.pending += 1
    else if (s === 'suspended') lifecycle.suspended += 1
    else lifecycle.inactive += 1
  }

  const repeatClients = (() => {
    const counts = new Map()
    for (const b of bookings) if (b.client.id) counts.set(b.client.id, (counts.get(b.client.id) || 0) + 1)
    return counts.size ? Math.round(([...counts.values()].filter((n) => n > 1).length / counts.size) * 1000) / 10 : null
  })()

  const todayStart = now - ((now + 3 * 3600000) % DAY)
  const LIVE = new Set(['pending', 'negotiation', 'accepted', 'confirmed', 'on_the_way', 'arrived'])
  const topCats = new Map()
  for (const b of bookings) topCats.set(b.service.name, (topCats.get(b.service.name) || 0) + 1)
  const openW = withdrawals.filter((w) => ['submitted', 'pending', 'pending_approval', 'manual_review'].includes(lowerStatus(w.status)))

  return {
    context: {
      marketId: market,
      marketCode: market,
      marketName: m.name,
      currency: m.currency,
      currencySymbol: symbol,
      status: 'Active',
      countryManager: manager,
      totalCities: cities.length,
      generatedAt: new Date(now).toISOString(),
    },
    metrics: {
      gbv: metric(global.performance.currentPeriodGbv, global.performance.previousPeriodGbv, true),
      revenue: metric(global.metrics.platformRevenue.value, null, true),
      bookings: metric(bookingsCur, bookingsPrev),
      clients: metric(clients.length, clients.length - joined(clients, start, end)),
      providers: metric(providers.length, providers.length - joined(providers, start, end)),
    },
    needsAttention: {
      verifications: { count: global.attention.verification.pending, label: 'Provider Verifications', urgency: 'high', route: '/verifications' },
      approvals: { count: global.approvals.profilePhotos + global.approvals.galleryMedia + global.approvals.profileChanges, label: 'Photo, Media & Profile Changes', urgency: 'medium', route: '/content-approval' },
      withdrawals: { count: global.attention.withdrawals.pending, label: 'Pending Withdrawals', urgency: 'high', route: '/withdrawals' },
      disputes: { count: global.attention.disputes.open, label: 'Open Disputes', urgency: 'medium', route: '/disputes' },
      safety: { count: global.attention.safety.incidents, label: 'Safety Reports', urgency: 'critical', route: '/safety' },
      support: { count: ops.supportOperations.openTickets, label: 'Open Support Tickets', urgency: 'medium', route: '/support' },
    },
    performance: { ...global.performance, chartPoints: global.performance.chartPoints.map((p) => ({ ...p, date: p.date.slice(5) })) },
    marketHealth: { overallScore: overall, status: overall === null ? 'No data' : overall >= 90 ? 'Healthy' : overall >= 75 ? 'Attention' : 'Critical', metrics: healthMetrics },
    providerEcosystem: { total: providers.length, bySpecialty: byType, lifecycle },
    clientEcosystem: {
      total: clients.length,
      newClients: joined(clients, start, end),
      returningPercentage: repeatClients,
      tiers: global.membership.tiers,
    },
    cities,
    bookingsAndFinance: {
      bookingsBreakdown: {
        today: bookings.filter((b) => b.scheduledStart >= todayStart && b.scheduledStart < todayStart + DAY).length,
        upcoming: bookings.filter((b) => LIVE.has(b.status) && b.scheduledStart > now).length,
        ongoing: bookings.filter((b) => ['service_in_progress', 'awaiting_client_confirmation'].includes(b.status)).length,
        completed: bookings.filter((b) => b.status === 'completed').length,
        cancelled: bookings.filter((b) => ['cancelled', 'rejected', 'expired'].includes(b.status)).length,
        conflicts: ops.bookingOperations.newConflicts,
      },
      topCategories: [...topCats].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, n]) => ({ name, bookings: n })),
      financialPosition: {
        customerPayments: global.financial.customerPayments,
        escrowHeld: global.financial.inEscrow,
        providerPayable: global.financial.providerPayable,
        platformRevenue: global.financial.platformRevenue,
        pendingWithdrawals: global.financial.pendingWithdrawals,
        refundsIssued: global.financial.refundsIssued,
        currency: m.currency,
        currencySymbol: symbol,
      },
    },
    paymentsAndWithdrawals: {
      rails: railList,
      withdrawalsPipeline: {
        todaySubmitted: withdrawals.filter((w) => millis(w.createdAt) >= todayStart).length,
        pendingApproval: openW.length,
        processing: withdrawals.filter((w) => lowerStatus(w.status) === 'processing').length,
        completedToday: withdrawals.filter((w) => ['completed', 'approved'].includes(lowerStatus(w.status)) && millis(w.updatedAt) >= todayStart).length,
        failedToday: withdrawals.filter((w) => ['failed', 'rejected'].includes(lowerStatus(w.status)) && millis(w.updatedAt || w.rejectedAt) >= todayStart).length,
        totalPendingAmount: openW.reduce((t, w) => t + (Number(w.amount) || 0), 0),
        currency: m.currency,
        currencySymbol: symbol,
      },
    },
    moderationSafetySupport: {
      verificationsQueue: {
        applications: ops.verificationOperations.providerVerification,
        credentials: ops.verificationOperations.credentials,
        photos: ops.verificationOperations.profilePhotos,
        media: ops.verificationOperations.galleryMedia,
        profileChanges: ops.verificationOperations.profileChanges,
      },
      trustAndSafety: {
        openReports: global.attention.safety.incidents,
        highPriority: ops.trustSafetyOperations.highPrioritySafety,
        disputes: global.attention.disputes.open,
        suspendedAccounts: ops.trustSafetyOperations.suspendedAccounts,
      },
      supportService: {
        openTickets: ops.supportOperations.openTickets,
        avgResponseMinutes: null, // tickets do not record first-response time
        slaCompliance: null,
        resolvedToday: ops.summary.resolvedToday,
      },
    },
    recentActivity: ops.liveActivity,
  }
}
