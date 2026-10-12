import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { ALL_MARKETS, adminAccess, canAccessMarket } from './accessModel.js'
import { MARKETS } from './dashboardLogic.js'
import { loadProviderBundle } from './providerSources.js'
import { bookingRow, bookingsSummary, businessContext, normalizeProviderBookings, reviewStats, topServices, walletTransactions } from './providerViews.js'

// ADM-024 — Provider Bookings & Earnings (REUSE / ADMIN VIEW) over the shared
// `bookings`, `escrow_transactions`, `wallets`, `wallet_transactions` and
// `withdrawal_requests` records. Money is shown only to admins with
// payments.view; nothing is estimated when a record is missing.

const db = () => getFirestore()
const DAY = 86400000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

async function context(request) {
  const uid = await requireAdmin(request, { permission: 'providers.view' })
  const access = await adminAccess(uid)
  const providerId = String(request.data?.providerId || '').trim()
  if (!providerId || providerId.includes('/')) throw new HttpsError('invalid-argument', 'A provider ID is required.')
  const finance = access.permissions.includes('payments.view')
  const bundle = await loadProviderBundle(db(), providerId, { finance })
  if (!bundle) throw new HttpsError('not-found', 'Provider not found.')
  const code = bundle.provider.countryCode
  const ok = code ? canAccessMarket(access, code) : access.markets.includes(ALL_MARKETS)
  if (!ok) throw new HttpsError('permission-denied', 'You do not have access to providers in this market.', { reason: 'market-denied' })
  const currency = MARKETS[code]?.currency || 'KES'
  const items = normalizeProviderBookings(bundle.bookings.map((d) => ({ ...d, derivedCountryCode: code })))
  return { finance, bundle, currency, items }
}

const TAB = {
  upcoming: ['pending', 'negotiation', 'accepted', 'confirmed', 'on_the_way', 'arrived'],
  ongoing: ['service_in_progress', 'awaiting_client_confirmation'],
  completed: ['completed'],
  cancelled: ['cancelled', 'rejected', 'expired'],
}
const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, '12m': 365 }

function filterRows(rows, f) {
  const q = String(f.search || '').trim().toLowerCase()
  const days = RANGE_DAYS[f.dateRange]
  return rows.filter((r) => {
    if (f.tab && f.tab !== 'all') {
      if (f.tab === 'disputed') { if (r.escrowStatus !== 'disputed') return false } else if (!(TAB[f.tab] || []).includes(r.status)) return false
    }
    if (f.service && f.service !== 'all' && !String(r.serviceName).toLowerCase().includes(String(f.service).toLowerCase())) return false
    if (f.bookingSource && f.bookingSource !== 'all' && !String(r.bookingSource).toLowerCase().includes(String(f.bookingSource).toLowerCase())) return false
    if (f.paymentStatus && f.paymentStatus !== 'all' && !String(r.paymentStatus).toLowerCase().includes(String(f.paymentStatus).toLowerCase())) return false
    if (f.escrowStatus && f.escrowStatus !== 'all' && !String(r.escrowStatus).toLowerCase().includes(String(f.escrowStatus).toLowerCase())) return false
    if (days && (!r.scheduledStart || r.scheduledStart < Date.now() - days * DAY)) return false
    if (q && ![r.id, r.clientName, r.serviceName].some((v) => String(v || '').toLowerCase().includes(q))) return false
    return true
  })
}

const maskMoney = (row) => ({ ...row, amount: null, amountFormatted: '••••', paymentBreakdown: null })

/** data: { providerId, tab, search, service, bookingSource, paymentStatus, escrowStatus, dateRange } */
export const adminGetProviderBookings = onCall(async (request) => {
  const { finance, bundle, currency, items } = await context(request)
  const rows = items.map(({ b, raw }) => bookingRow(b, raw)).sort((a, b) => (b.scheduledStart || 0) - (a.scheduledStart || 0))
  const filtered = filterRows(rows, request.data || {})
  const bookings = items.map((x) => x.b)
  const p = bundle.provider
  return {
    success: true,
    bookings: finance ? filtered : filtered.map(maskMoney),
    totalMatching: filtered.length,
    summary: bookingsSummary(bookings, { wallet: bundle.wallet, escrows: bundle.escrows, withdrawals: bundle.withdrawals, finance, currency, avgRating: reviewStats(bundle.reviews).avg }),
    topServices: topServices(bookings, currency).map((s) => (finance ? s : { ...s, revenue: null, revenueFormatted: '••••' })),
    recentTransactions: finance ? walletTransactions(bundle.walletTx, currency) : [],
    provider: {
      id: p.uid, name: p.name, providerType: p.category, typeLabel: p.typeLabel, city: p.city, country: p.country, flag: null,
      rating: reviewStats(bundle.reviews).avg ?? p.rating, reviewCount: bundle.reviews.length, avatar: p.avatar, isVerified: p.verified,
      status: p.accountStatus, availableNow: p.isAvailable === true, joinedDate: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      dynamicSpaContext: businessContext(p.category, items, currency, finance)?.spa,
      dynamicHotelContext: businessContext(p.category, items, currency, finance)?.hotel,
    },
    currency,
  }
})

/** data: { providerId, bookingId } */
export const adminGetProviderBookingDetail = onCall(async (request) => {
  const { finance, items } = await context(request)
  const hit = items.find((x) => x.b.id === request.data?.bookingId)
  if (!hit) throw new HttpsError('not-found', 'Booking not found for this provider.')
  const row = bookingRow(hit.b, hit.raw)
  return { success: true, booking: finance ? row : maskMoney(row), client: { id: hit.b.client.id, name: hit.b.client.name }, payment: finance ? { status: row.paymentStatus, escrowStatus: row.escrowStatus, breakdown: row.paymentBreakdown } : null }
})

/** data: { providerId } — finance permission required */
export const adminGetProviderEarningsOverview = onCall(async (request) => {
  const { finance, bundle, currency, items } = await context(request)
  if (!finance) throw new HttpsError('permission-denied', 'Earnings need the payments.view permission.')
  const summary = bookingsSummary(items.map((x) => x.b), { wallet: bundle.wallet, escrows: bundle.escrows, withdrawals: bundle.withdrawals, finance: true, currency })
  return { success: true, ledger: { ...summary.financials, ...summary.escrowPositions, ...summary.withdrawalPositions }, recentTransactions: walletTransactions(bundle.walletTx, currency) }
})

/** data: { providerId, period: '7d'|'30d'|'90d'|'12m' } — provider earnings per bucket vs the previous period */
export const adminGetProviderEarningsChart = onCall(async (request) => {
  const { finance, items } = await context(request)
  if (!finance) return { success: true, period: request.data?.period || '30d', points: [], restricted: true }
  const period = RANGE_DAYS[request.data?.period] ? request.data.period : '30d'
  const days = RANGE_DAYS[period]
  const buckets = period === '7d' ? 7 : period === '12m' ? 12 : 6
  const size = (days * DAY) / buckets
  const now = Date.now()
  const done = items.map((x) => x.b).filter((b) => b.status === 'completed')
  const at = (b) => b.completedAt || b.scheduledStart || 0
  const points = Array.from({ length: buckets }, (_, i) => {
    const s = now - days * DAY + i * size
    const e = s + size
    const sum = (from, to) => done.filter((b) => at(b) >= from && at(b) < to).reduce((t, b) => t + (b.providerAmount || 0), 0)
    const d = new Date(e - 1 + 3 * 3600000)
    return { date: period === '12m' ? MONTHS[d.getUTCMonth()] : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`, current: Math.round(sum(s, e)), previous: Math.round(sum(s - days * DAY, e - days * DAY)) }
  })
  return { success: true, period, points }
})
