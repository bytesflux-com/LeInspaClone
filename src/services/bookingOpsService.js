// ADM-044 → ADM-048 — Booking Operations service.
//
// Calls the admin Cloud Functions (functions/src/bookings.js):
//   adminGetBookingDashboard, adminListBookings, adminGetBookingQuickView,
//   adminRevealGuestContact (audited)
// Market access, permissions and every derived state are resolved server-side;
// `market` here is only the requested context. Set VITE_USE_MOCK_BOOKINGS=true
// to use demo data run through the same derivation code instead.
import { callAdmin } from '../lib/adminCall'
import { MARKETS } from '../constants/markets'
import {
  DAY,
  MARKET_CODES,
  buildDashboard,
  buildListView,
  buildQuickView,
  scopeRows,
} from '../../functions/src/bookingsLogic.js'
import { mockBookings } from './mock/bookingOpsMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_BOOKINGS === 'true'
const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms))
const timeZoneOf = (market) => MARKETS.find((m) => m.id === market)?.timeZone || 'Africa/Nairobi'

// Mock-only: the reporting period in the market's local day (UTC+3 for the demo).
function mockPeriod(dateRange, now) {
  const offset = 3 * 60 * 60 * 1000
  const today = Math.floor((now + offset) / DAY) * DAY - offset
  const end = today + DAY - 1
  switch (dateRange) {
    case 'yesterday': return { start: today - DAY, end: today - 1 }
    case '7d': return { start: today - 7 * DAY, end }
    case '30d': return { start: today - 30 * DAY, end }
    case 'this_month': {
      const d = new Date(now + offset)
      return { start: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - offset, end }
    }
    default: return { start: today, end }
  }
}

function mockContext(market, extra = {}) {
  const meta = MARKETS.find((m) => m.id === market)
  return {
    market,
    marketName: meta?.name || 'All Markets',
    currency: market === 'ALL' ? null : meta?.currency,
    generatedAt: new Date().toISOString(),
    canSeeFinancial: true,
    authorizedMarkets: MARKET_CODES,
    isDemo: true,
    ...extra,
  }
}

const scope = (market, providerType) => ({ markets: market && market !== 'ALL' ? [market] : null, providerCategory: providerType || null })

export const bookingOpsService = {
  isMock: USE_MOCK,

  async getDashboard({ market = 'ALL', providerType = '', dateRange = 'today', customRange = null }) {
    if (!USE_MOCK) {
      return callAdmin('adminGetBookingDashboard', { market, providerType: providerType || null, dateRange, customRange, timeZone: timeZoneOf(market) })
    }
    await delay()
    const now = Date.now()
    const rows = scopeRows(mockBookings(now), scope(market, providerType))
    const data = buildDashboard(rows, { now, period: mockPeriod(dateRange, now), market })
    return { context: mockContext(market, { providerType: providerType || null, dateRange }), ...data }
  },

  async listBookings(view, { market = 'ALL', dateRange = 'today', ...params }) {
    if (!USE_MOCK) {
      return callAdmin('adminListBookings', { view, market, dateRange, timeZone: timeZoneOf(market), ...params })
    }
    await delay()
    const now = Date.now()
    const rows = scopeRows(mockBookings(now), scope(market, params.providerType))
    const period = ['completed', 'cancelled', 'guest'].includes(view) ? mockPeriod(dateRange, now) : null
    return { context: mockContext(market, { dateRange, canExport: true, canRevealContact: true }), ...buildListView(view, rows, params, { now, period, exportAll: params.export === true }) }
  },

  // Every filtered row of a workspace (server checks users.export and audits).
  async exportBookings(view, params) {
    return this.listBookings(view, { ...params, export: true, page: 1 })
  },

  async revealGuestContact(bookingId, reason = '') {
    if (!USE_MOCK) return callAdmin('adminRevealGuestContact', { bookingId, reason })
    await delay(140)
    const b = mockBookings().find((x) => x.id === bookingId)
    if (!b?.guest) throw new Error('This is not a guest booking.')
    return { phone: b.guest.phone, email: b.guest.email }
  },

  async getQuickView(bookingId, view) {
    if (!USE_MOCK) return callAdmin('adminGetBookingQuickView', { bookingId, view })
    await delay(140)
    const b = mockBookings().find((x) => x.id === bookingId)
    if (!b) throw new Error('This booking no longer exists.')
    const providerCancellations = mockBookings().filter((x) => x.status === 'cancelled' && x.cancelledBy === 'provider' && x.provider.name === b.provider.name).length
    return buildQuickView(b, Date.now(), { view, providerCancellations, canRevealContact: true, related: { disputes: b.flags.disputed ? [{ id: `DSP-${b.id.slice(-4)}`, status: 'open', reason: 'Service quality' }] : [], tickets: b.flags.supportOpen ? [{ id: `TCK-${b.id.slice(-4)}`, status: 'open', subject: 'Follow-up request' }] : [], paymentId: `PAY-${b.id.slice(-4)}`, refundId: b.refundId, reviewId: b.reviewId } })
  },
}
