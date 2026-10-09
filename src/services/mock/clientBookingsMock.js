// Demo data for ADM-013 (Client Bookings). Used only while the
// `adminGetClientBookings` / `adminGetBookingPreview` Cloud Functions are not
// deployed. It is derived from the existing client rows — there is no separate
// "admin client bookings" record. CL-78421 mirrors the ADM-013 mockup.
import { MOCK_CURRENCY, DAY_MS } from './clientDirectoryMock'
import { buildClientProfile, PROFILE_AS_OF } from './clientProfileMock'
import { SOURCE_LABELS } from '../../constants/clientBookings'

const FX = { KE: 1, UG: 28, TZ: 19, RW: 10, ZA: 0.14 }
const hashOf = (text) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
const at = (y, m, d, hh, mm, tz = 3) => new Date(Date.UTC(y, m - 1, d, hh - tz, mm)).toISOString()
const iso = (ms) => new Date(ms).toISOString()

const PROVIDER_LABELS = { spa: 'Spa & Wellness Center', hotel: 'Hotel & Wellness Resort' }

// [service, provider, providerType, [specialist, role], price (KES), minutes, image]
const CATALOG = [
  ['Deep Tissue Massage', 'Serenity Wellness Spa', 'spa', ['Grace Njeri', 'Massage Therapist'], 4500, 60, '/demo/bk-massage.jpg'],
  ['Classic Facial', 'Radiance Spa', 'spa', ['Lucy Achieng', 'Esthetician'], 5000, 75, '/demo/bk-facial.jpg'],
  ['Swedish Massage', 'Tranquil Escapes Resort', 'hotel', ['Peter Kamau', 'Massage Therapist'], 3000, 90, '/demo/bk-swedish.jpg'],
  ['Private Yoga Session', 'Flow Wellness Studio', 'provider', ['Amina Wekesa', 'Yoga Specialist'], 3500, 60, '/demo/bk-yoga.jpg'],
  ['Personal Training', 'Elite Fitness Hub', 'provider', ['Brian Otieno', 'Fitness Trainer'], 4000, 60, '/demo/bk-training.jpg'],
  ['Meditation Session', 'Mindful Living Center', 'provider', ['Naomi Chebet', 'Meditation Specialist'], 2500, 45, '/demo/bk-meditation.jpg'],
]
const CITIES = ['Nairobi', 'Westlands', 'Kilimani', 'Karen', 'Lavington', 'Nakuru', 'Mombasa']

function toBooking({ id, svc, scheduledAt, city, status, payment, escrow, source, listPrice, agreedPrice, fx, countryName, extra = {} }) {
  const [service, provider, providerType, [name, role], price, minutes, image] = svc
  const base = Math.round((listPrice ?? price) * fx)
  const seed = hashOf(id)
  return {
    id,
    service,
    provider,
    providerId: `PR-${10000 + (hashOf(provider) % 80000)}`,
    serviceId: `SV-${10000 + (hashOf(service + provider) % 80000)}`,
    providerType,
    providerLabel: PROVIDER_LABELS[providerType] || role,
    specialist: { name, role },
    scheduledAt,
    durationMins: minutes,
    city,
    countryName,
    branch: `${provider} - ${city}`,
    price: agreedPrice != null ? Math.round(agreedPrice * fx) : base,
    listPrice: base,
    negotiated: agreedPrice != null && agreedPrice !== listPrice,
    status,
    payment,
    escrow,
    source,
    image,
    paymentId: `PAY-${String(10000 + (seed % 80000))}`,
    ...extra,
  }
}

// Hand-written rows that match the ADM-013 mockup (amounts in KES).
const SEEDED = [
  ['LI-48291', 0, at(2026, 9, 12, 14, 0), 'Nairobi', 'confirmed', 'paid', 'held', 'app'],
  ['LI-47182', 3, at(2026, 9, 8, 10, 0), 'Westlands', 'completed', 'paid', 'released', 'app'],
  ['LI-46021', 2, at(2026, 9, 2, 16, 30), 'Nakuru', 'cancelled', 'refunding', 'released', 'website'],
  ['LI-44833', 1, at(2026, 8, 25, 11, 0), 'Kilimani', 'completed', 'paid', 'released', 'app'],
  ['LI-43910', 4, at(2026, 8, 18, 18, 0), 'Lavington', 'completed', 'paid', 'released', 'app'],
  ['LI-42105', 5, at(2026, 8, 5, 7, 0), 'Karen', 'completed', 'paid', 'released', 'guest'],
]
// Older history for the demo client (pages 2–3).
const SEEDED_OLDER = [
  ['LI-41377', 0, at(2026, 7, 30, 15, 0), 'Nairobi', 'completed', 'paid', 'released', 'app'],
  ['LI-40586', 3, at(2026, 7, 22, 12, 30), 'Westlands', 'completed', 'paid', 'released', 'app'],
  ['LI-39944', 2, at(2026, 7, 15, 9, 0), 'Nairobi', 'confirmed', 'paid', 'held', 'app'],
  ['LI-39108', 1, at(2026, 7, 8, 17, 0), 'Kilimani', 'completed', 'paid', 'released', 'website'],
  ['LI-38267', 4, at(2026, 6, 29, 18, 30), 'Lavington', 'completed', 'paid', 'released', 'app', { negotiated: [4500, 4000] }],
  ['LI-37450', 5, at(2026, 6, 20, 8, 0), 'Karen', 'cancelled', 'refunded', 'refunded', 'app'],
  ['LI-36802', 0, at(2026, 6, 11, 13, 0), 'Nairobi', 'completed', 'paid', 'released', 'app'],
  ['LI-36019', 3, at(2026, 6, 2, 9, 30), 'Westlands', 'completed', 'paid', 'released', 'guest'],
  ['LI-35244', 1, at(2026, 5, 24, 15, 30), 'Kilimani', 'completed', 'paid', 'released', 'app'],
  ['LI-34571', 2, at(2026, 5, 14, 11, 0), 'Nairobi', 'completed', 'paid', 'released', 'app'],
  ['LI-33890', 4, at(2026, 5, 5, 17, 30), 'Lavington', 'completed', 'paid', 'released', 'website'],
  ['LI-33125', 5, at(2026, 4, 22, 7, 30), 'Karen', 'completed', 'paid', 'released', 'app'],
]

function buildSeeded(fx, countryName) {
  return [...SEEDED, ...SEEDED_OLDER].map(([id, ci, scheduledAt, city, status, payment, escrow, source, opts]) =>
    toBooking({
      id,
      svc: CATALOG[ci],
      scheduledAt,
      city,
      status,
      payment,
      escrow,
      source,
      listPrice: opts?.negotiated?.[0],
      agreedPrice: opts?.negotiated?.[1],
      fx,
      countryName,
    }),
  )
}

function buildGenerated(r, fx, countryName) {
  const n = r.bookings || 0
  if (!n) return []
  const seed = hashOf(r.id)
  const cancelled = Math.min(r.cancelledCount || 0, n)
  const disputed = Math.min(r.openDisputes || 0, Math.max(0, n - cancelled - 1))
  const upcoming = r.hasUpcoming ? 1 : 0
  const ongoing = r.inService ? 1 : 0
  const out = []
  for (let i = 0; i < n; i += 1) {
    const svc = CATALOG[(seed + i) % CATALOG.length]
    const idNum = 20000 + ((seed + i * 977) % 70000)
    let status = 'completed'
    let scheduledAt = iso(PROFILE_AS_OF - ((r.lastBookingDaysAgo ?? 3) + i * 5) * DAY_MS)
    if (i < upcoming) {
      status = 'confirmed'
      scheduledAt = iso(PROFILE_AS_OF + 3 * DAY_MS)
    } else if (i < upcoming + ongoing) {
      status = 'ongoing'
      scheduledAt = iso(PROFILE_AS_OF - 45 * 60_000)
    } else if (i >= n - cancelled) status = 'cancelled'
    else if (i >= upcoming + ongoing && i < upcoming + ongoing + disputed) status = 'disputed'

    let payment = status === 'cancelled' ? 'refunded' : 'paid'
    let escrow = status === 'confirmed' || status === 'ongoing' || status === 'disputed' ? 'held' : status === 'cancelled' ? 'refunded' : 'released'
    if (r.paymentIssue && i === 0 && status !== 'cancelled') {
      payment = status === 'confirmed' ? 'pending' : 'failed'
    }
    const source = r.guestConverted && i % 4 === 3 ? 'guest' : i % 5 === 2 ? 'website' : 'app'
    out.push(
      toBooking({ id: `LI-${idNum}`, svc, scheduledAt, city: r.city || CITIES[i % CITIES.length], status, payment, escrow, source, fx, countryName }),
    )
  }
  return out
}

function summarize(list, asOf) {
  const count = (fn) => list.filter(fn).length
  const total = list.length
  const upcoming = count((b) => b.status === 'confirmed' || b.status === 'pending')
  const completed = count((b) => b.status === 'completed')
  const cancelled = count((b) => b.status === 'cancelled')
  const soonest = list
    .filter((b) => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.scheduledAt) > new Date(asOf))
    .map((b) => new Date(b.scheduledAt).getTime())
    .sort((a, b) => a - b)[0]
  const days = soonest ? Math.max(0, Math.round((soonest - new Date(asOf).getTime()) / DAY_MS)) : null
  return {
    total,
    upcoming,
    ongoing: count((b) => b.status === 'ongoing'),
    completed,
    cancelled,
    disputed: count((b) => b.status === 'disputed'),
    nextLabel: upcoming ? (days === null ? 'Awaiting schedule' : days === 0 ? 'Next today' : `Next in ${days} ${days === 1 ? 'day' : 'days'}`) : 'None scheduled',
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    cancellationRate: total ? Math.round((cancelled / total) * 100) : 0,
  }
}

function bookingsFor(r) {
  const fx = FX[r.country] || 1
  const countryName = buildClientProfile(r).countryName
  const list = r.id === 'CL-78421' ? buildSeeded(fx, countryName) : buildGenerated(r, fx, countryName)
  return list.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
}

// ---------- list query (server-side filtering / sorting / paging) ----------

const matchesDate = (b, date, asOf) => {
  if (!date) return true
  const t = new Date(b.scheduledAt).getTime()
  const now = new Date(asOf).getTime()
  if (date === 'upcoming') return t >= now
  if (date === 'year') return new Date(t).getUTCFullYear() === new Date(now).getUTCFullYear()
  const days = { '7d': 7, '30d': 30, '90d': 90 }[date]
  return days ? now - t <= days * DAY_MS && t <= now + DAY_MS : true
}

const TAB_MATCH = {
  upcoming: (b) => b.status === 'confirmed' || b.status === 'pending',
  ongoing: (b) => b.status === 'ongoing',
  completed: (b) => b.status === 'completed',
  cancelled: (b) => b.status === 'cancelled',
  disputed: (b) => b.status === 'disputed',
}

const SORTERS = {
  newest: (a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt),
  oldest: (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt),
  price_high: (a, b) => b.price - a.price,
  price_low: (a, b) => a.price - b.price,
}

// Admins without finance access never receive payment / escrow fields.
const redact = (b, finance) => {
  if (finance) return b
  const { payment, escrow, paymentId, ...safe } = b
  return safe
}

export function queryClientBookings(r, p) {
  const finance = p.finance !== false
  const profile = buildClientProfile(r)
  const all = bookingsFor(r)
  const summary = summarize(all, profile.asOf)

  const needle = (p.q || '').trim().toLowerCase()
  let rows = all.filter((b) => {
    if (p.status && p.status !== 'all' && !TAB_MATCH[p.status]?.(b)) return false
    if (!matchesDate(b, p.date, profile.asOf)) return false
    if (p.ptype && b.providerType !== p.ptype) return false
    if (p.src && b.source !== p.src) return false
    if (finance && p.pay && b.payment !== p.pay) return false
    if (finance && p.esc && b.escrow !== p.esc) return false
    if (p.neg && !b.negotiated) return false
    if (p.guest && b.source !== 'guest') return false
    if (!needle) return true
    return [b.id, b.service, b.provider, b.specialist.name].some((v) => v.toLowerCase().includes(needle))
  })
  rows = [...rows].sort(SORTERS[p.sort] || SORTERS.newest)

  const pageSize = Number(p.pageSize) || 6
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const page = Math.min(Math.max(1, Number(p.page) || 1), totalPages)
  const start = (page - 1) * pageSize

  // The demo client mirrors the mockup's headline figures exactly; for every
  // other client the counts are derived from the rows above.
  const shown = r.id === 'CL-78421'
    ? { ...summary, upcoming: 2, ongoing: 0, completed: 15, cancelled: 2, disputed: 0, nextLabel: 'Next in 3 days', completionRate: 83, cancellationRate: 11 }
    : summary

  return {
    client: {
      id: profile.id,
      name: profile.name,
      photoURL: profile.photoURL,
      gender: profile.gender,
      membershipTier: profile.membershipTier,
      status: profile.status,
      contactVerified: profile.contactVerified,
      country: profile.country,
      countryName: profile.countryName,
      city: profile.city,
      joinedAt: profile.joinedAt,
      lastActiveAt: profile.lastActiveAt,
      asOf: profile.asOf,
      timeZone: profile.timeZone,
      currency: MOCK_CURRENCY[r.country] || profile.currency || 'USD',
    },
    summary: shown,
    items: rows.slice(start, start + pageSize).map((b) => redact(b, finance)),
    total: rows.length,
    page,
    pageSize,
    totalPages,
  }
}

// ---------- drawer preview ----------

export function buildBookingPreview(r, bookingId, { finance = true } = {}) {
  const profile = buildClientProfile(r)
  const b = bookingsFor(r).find((x) => x.id === bookingId)
  if (!b) throw new Error('Booking not found or outside your authorised markets.')
  const t = new Date(b.scheduledAt).getTime()
  const h = 3_600_000
  const cur = MOCK_CURRENCY[r.country] || 'KES'

  const timeline = [{ id: 't1', at: iso(t - 26 * h), text: `Booking created via ${SOURCE_LABELS[b.source]}` }]
  if (b.payment !== 'pending') timeline.push({ id: 't2', at: iso(t - 25 * h), text: `Payment ${b.payment === 'failed' ? 'attempt failed' : 'received'} — ${cur} ${b.price.toLocaleString('en-US')}` })
  if (b.status !== 'pending') timeline.push({ id: 't3', at: iso(t - 24 * h), text: 'Confirmed by provider' })
  if (b.negotiated) timeline.splice(1, 0, { id: 't1b', at: iso(t - 27 * h + 1800_000), text: `Offer agreed at ${cur} ${b.price.toLocaleString('en-US')} (listed ${cur} ${b.listPrice.toLocaleString('en-US')})` })
  if (b.status === 'completed') {
    timeline.push({ id: 't4', at: iso(t + b.durationMins * 60_000), text: 'Service marked complete' })
    timeline.push({ id: 't5', at: iso(t + b.durationMins * 60_000 + 20 * 60_000), text: 'Client confirmed service received' })
    if (b.escrow === 'released') timeline.push({ id: 't6', at: iso(t + b.durationMins * 60_000 + 25 * 60_000), text: 'Escrow released to provider' })
  }
  if (b.status === 'ongoing') timeline.push({ id: 't4', at: iso(t), text: 'Service started' })
  if (b.status === 'cancelled') {
    timeline.push({ id: 't4', at: iso(t - 6 * h), text: 'Booking cancelled' })
    timeline.push({ id: 't5', at: iso(t - 6 * h + 600_000), text: b.payment === 'refunded' ? 'Refund completed' : 'Refund initiated' })
  }
  if (b.status === 'disputed') timeline.push({ id: 't4', at: iso(t + 2 * h), text: 'Dispute opened by client' })

  return {
    ...redact(b, finance),
    client: { id: profile.id, name: profile.name },
    currency: cur,
    timeZone: profile.timeZone,
    asOf: profile.asOf,
    timeline: timeline.sort((a, c) => new Date(c.at) - new Date(a.at)),
    ...(finance
      ? {
          paymentDetail: {
            id: b.paymentId,
            method: b.source === 'guest' ? 'Card' : 'M-PESA',
            amount: b.price,
            bookingFee: Math.round(b.price * 0.05),
            paidAt: iso(t - 25 * h),
          },
        }
      : {}),
    cancellation:
      b.status === 'cancelled'
        ? { id: `CXL-${hashOf(b.id) % 9000 + 1000}`, cancelledBy: 'Client', reason: 'Schedule conflict', refundAmount: b.price, refundStatus: b.payment === 'refunded' ? 'Completed' : 'Processing' }
        : null,
    dispute: b.status === 'disputed' ? { id: `DSP-${hashOf(b.id) % 9000 + 1000}`, reason: 'Service not as described', status: 'Under review' } : null,
    notes:
      b.status === 'cancelled' || b.status === 'disputed'
        ? [{ id: 'n1', author: 'Support Team', createdAt: iso(t - 5 * h), text: 'Client contacted support. Case logged against this booking.' }]
        : [],
  }
}
