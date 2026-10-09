// Demo aggregates for ADM-010. Counts that exist in the client dataset (totals,
// tiers, status, locations, booking clients, guest-converted) are computed from it;
// time-based figures (new clients, growth, booking activity) are modelled.
// A real backend replaces this with `adminGetClientDashboard` / `adminGetClientGrowth`.
import { MOCK_CLIENTS } from './clientDirectoryMock'

const BASE = {
  newClients: 1284,
  deltas: { total: 16.8, active: 14.3, newClients: 21.5, bookingClients: 18.2, suspended: 9.1 },
  attention: { reviews: 12, suspended: 6, support: 4, payments: 3, guestLinking: 2 },
  guest: { bookings: 642, convertedPct: 68 },
  booking: { completionRate: 78, avgBookingValueKes: 14230, bookingsPerClient: 1.45 },
  growthPct: { monthly: 16.8, weekly: 9.4, daily: 3.2 },
}

// KES per 1 unit of currency for aggregate money figures.
const MONEY = { ALL: { currency: 'USD', perKes: 1 / 130 }, KE: { currency: 'KES', perKes: 1 }, UG: { currency: 'UGX', perKes: 28 }, TZ: { currency: 'TZS', perKes: 19 }, RW: { currency: 'RWF', perKes: 10 }, ZA: { currency: 'ZAR', perKes: 0.14 } }

const RANGE_FACTOR = { today: 0.04, yesterday: 0.04, '7d': 0.27, '30d': 1, this_month: 0.9, custom: 1 }
const RANGE_DELTA_LABEL = { today: 'vs. yesterday', yesterday: 'vs. day before', '7d': 'vs. previous week', '30d': 'vs. last month', this_month: 'vs. last month', custom: 'vs. previous period' }

function hashOf(text) {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}
function rngFor(seedText) {
  let a = hashOf(seedText) || 1
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pct1 = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0)
const scaleCount = (n, f) => Math.max(0, Math.round(n * f))

function labelFor(offsetDays) {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function hourLabels() {
  return Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`)
}

function trendSeries({ total, points, seed, rise = 0.9 }) {
  const rnd = rngFor(seed)
  const weights = Array.from({ length: points }, (_, i) => {
    const trend = 1 + (rise * i) / Math.max(1, points - 1)
    return trend * (0.7 + rnd() * 0.6)
  })
  const sum = weights.reduce((a, b) => a + b, 0)
  const values = weights.map((w) => Math.round((w / sum) * total))
  return values
}

export function buildGrowth({ market, window }) {
  const scoped = market && market !== 'ALL' ? MOCK_CLIENTS.filter((c) => c.country === market) : MOCK_CLIENTS
  const share = scoped.length / MOCK_CLIENTS.length
  const cfg = {
    monthly: { total: scaleCount(BASE.newClients, share), points: 30, label: 'this month vs. last month' },
    weekly: { total: scaleCount(BASE.newClients * 0.27, share), points: 7, label: 'this week vs. last week' },
    daily: { total: scaleCount(BASE.newClients * 0.04, share), points: 24, label: 'today vs. yesterday' },
  }[window] || null
  const c = cfg || { total: 0, points: 30, label: '' }
  const values = trendSeries({ total: c.total, points: c.points, seed: `growth-${market}-${window}` })
  const labels = window === 'daily' ? hourLabels() : values.map((_, i) => labelFor(c.points - 1 - i))
  const offset = (hashOf(market || 'ALL') % 7) - 3
  return {
    window,
    comparison: c.label,
    changePct: market === 'ALL' || !market ? BASE.growthPct[window] : Math.round((BASE.growthPct[window] + offset * 0.4) * 10) / 10,
    points: values.map((v, i) => ({ label: labels[i], value: v })),
  }
}

export function buildDashboard({ market, range }) {
  const m = market || 'ALL'
  const scoped = m !== 'ALL' ? MOCK_CLIENTS.filter((c) => c.country === m) : MOCK_CLIENTS
  const share = scoped.length / MOCK_CLIENTS.length
  const rf = RANGE_FACTOR[range] ?? 1
  const offset = m === 'ALL' ? 0 : (hashOf(m) % 7) - 3

  const count = (fn) => scoped.reduce((n, c) => (fn(c) ? n + 1 : n), 0)
  const total = scoped.length
  const active = count((c) => c.status === 'active')
  const suspended = count((c) => c.status === 'suspended')
  const inactive = count((c) => c.status === 'inactive')
  const tier = (t) => count((c) => c.membership === t)
  const bookingClients = Math.round(count((c) => c.bookings > 0) * (rf >= 1 ? 1 : 0.4 + rf * 2))
  const newClients = scaleCount(BASE.newClients * rf, share)

  const d = (key) => (m === 'ALL' ? BASE.deltas[key] : Math.round((BASE.deltas[key] + offset * 0.4) * 10) / 10)
  const money = MONEY[m] || MONEY.ALL

  // Locations
  const group = (key) => {
    const map = new Map()
    for (const c of scoped) map.set(c[key], (map.get(c[key]) || 0) + 1)
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, n]) => ({ name, count: n, pct: pct1(n, total) }))
  }

  // Booking activity series
  const hourly = range === 'today' || range === 'yesterday'
  const days = hourly ? 24 : range === '7d' ? 7 : range === 'this_month' ? Math.max(7, new Date().getDate()) : 30
  const rnd = rngFor(`booking-${m}-${range}`)
  const totalCompleted = Math.round(bookingClients * BASE.booking.bookingsPerClient * (BASE.booking.completionRate / 100))
  const avg = totalCompleted / days
  const labels = hourly ? hourLabels() : Array.from({ length: days }, (_, i) => labelFor(days - 1 - i))
  const activity = labels.map((label, i) => {
    const wave = 1 + 0.25 * Math.sin((i / (hourly ? 24 : 7)) * Math.PI * 2)
    const completed = Math.max(0, Math.round(avg * wave * (0.75 + rnd() * 0.5)))
    const cancelled = Math.max(0, Math.round(completed * (0.1 + rnd() * 0.08)))
    return { label, completed, cancelled }
  })

  const guestBookings = scaleCount(BASE.guest.bookings * rf, share)
  const convertedPct = Math.min(95, Math.max(30, BASE.guest.convertedPct + (m === 'ALL' ? 0 : offset)))

  return {
    market: m,
    range,
    deltaLabel: RANGE_DELTA_LABEL[range] || RANGE_DELTA_LABEL['30d'],
    kpis: {
      total: { value: total, change: d('total') },
      active: { value: active, change: d('active') },
      newClients: { value: newClients, change: d('newClients') },
      bookingClients: { value: bookingClients, change: d('bookingClients') },
      suspended: { value: suspended, change: d('suspended'), adverse: true },
    },
    attention: {
      reviews: scaleCount(BASE.attention.reviews, share),
      suspended: scaleCount(BASE.attention.suspended, share),
      support: scaleCount(BASE.attention.support, share),
      payments: scaleCount(BASE.attention.payments, share),
      guestLinking: scaleCount(BASE.attention.guestLinking, share),
    },
    segments: {
      all: total,
      standard: tier('standard'),
      premium: tier('premium'),
      executive: tier('executive'),
      guest: count((c) => c.guestConverted),
      suspended,
      inactive,
    },
    membership: {
      total,
      slices: [
        { id: 'standard', label: 'Standard', count: tier('standard'), pct: pct1(tier('standard'), total) },
        { id: 'premium', label: 'Premium', count: tier('premium'), pct: pct1(tier('premium'), total) },
        { id: 'executive', label: 'Executive', count: tier('executive'), pct: pct1(tier('executive'), total) },
        { id: 'none', label: 'Other', count: tier('none'), pct: pct1(tier('none'), total) },
      ],
    },
    locations: { cities: group('city'), regions: group('region') },
    guest: {
      bookings: guestBookings,
      convertedPct,
      unlinked: Math.round(guestBookings * (1 - convertedPct / 100)),
    },
    booking: {
      bookingClients,
      completionRate: BASE.booking.completionRate,
      avgBookingValue: Math.round(BASE.booking.avgBookingValueKes * money.perKes),
      currency: money.currency,
      series: activity,
      granularity: hourly ? 'hour' : 'day',
    },
  }
}
