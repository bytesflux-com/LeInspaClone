// Demo data for ADM-014 (Client Payments). Used only while the
// `adminGetClientPayments` / `adminGetPaymentPreview` Cloud Functions are not
// deployed. Derived from the existing client + booking rows — there is no
// separate "admin client payments" record. CL-78421 mirrors the ADM-014 mockup.
import { MOCK_CURRENCY, DAY_MS } from './clientDirectoryMock'
import { buildClientProfile } from './clientProfileMock'
import { queryClientBookings } from './clientBookingsMock'
import { PAYMENT_TYPE_LABELS } from '../../constants/clientPayments'

const FX = { KE: 1, UG: 28, TZ: 19, RW: 10, ZA: 0.14 }
const hashOf = (text) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
const at = (y, m, d, hh, mm, tz = 3) => new Date(Date.UTC(y, m - 1, d, hh - tz, mm)).toISOString()
const iso = (ms) => new Date(ms).toISOString()
const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
const code = (seed, n) => Array.from({ length: n }, (_, i) => REF_CHARS[((seed * (i + 3) + i * 7) >>> 0) % REF_CHARS.length]).join('')

const METHODS = {
  mpesa: { kind: 'mpesa', label: 'M-PESA' },
  visa: { kind: 'visa', label: 'Visa •••• 4821' },
  mastercard: { kind: 'mastercard', label: 'Mastercard •••• 2214' },
  original: { kind: 'original', label: 'Original Method' },
  wallet: { kind: 'wallet', label: 'Lé Inspa Wallet' },
  bank: { kind: 'bank', label: 'Bank transfer' },
}

function make({ id, txn, type, title, subtitle, image, bookingId, provider, status, method, amount, createdAt, escrow, breakdown, refund, escrowId }) {
  const seed = hashOf(id)
  return {
    id,
    txn: txn || `TXN-${code(seed, 7)}`,
    type,
    typeLabel: PAYMENT_TYPE_LABELS[type],
    title,
    subtitle,
    image: image || null,
    bookingId: bookingId || null,
    provider: provider || null,
    status,
    method: METHODS[method],
    amount,
    createdAt,
    escrow: escrow || null,
    escrowId: escrow ? `ESC-${10000 + (seed % 80000)}` : null,
    breakdown: breakdown || null,
    refund: refund || null,
  }
}

// ---------- the demo client (matches the mockup) ----------

function buildSeeded() {
  const B = (id, title, subtitle, o) => make({ id, title, subtitle, ...o })
  const rows = [
    B('PAY-92841', 'Deep Tissue Massage', 'Booking #LI-48291', { txn: 'TXN-7H3K8F2', type: 'booking', image: '/demo/bk-massage.jpg', bookingId: 'LI-48291', provider: 'Serenity Wellness Spa', status: 'successful', method: 'mpesa', amount: 4500, createdAt: at(2026, 9, 12, 13, 58), escrow: 'held', breakdown: { service: 4200, fee: 300, discount: 0 } }),
    B('PAY-77123', 'Swedish Massage', 'Booking #LI-47182', { txn: 'TXN-9P2L7D4', type: 'booking', image: '/demo/bk-yoga.jpg', bookingId: 'LI-47182', provider: 'Flow Wellness Studio', status: 'successful', method: 'visa', amount: 3500, createdAt: at(2026, 9, 8, 9, 45), escrow: 'released', breakdown: { service: 3300, fee: 200, discount: 0 } }),
    B('PAY-55612', 'Booking Refund', 'Booking #LI-46021', { txn: 'TXN-1Q8M3N9', type: 'refund', image: '/demo/bk-swedish.jpg', bookingId: 'LI-46021', provider: 'Tranquil Escapes Resort', status: 'refunded', method: 'original', amount: 2000, createdAt: at(2026, 9, 2, 17, 12), refund: { reason: 'Booking cancellation', requestedAt: at(2026, 9, 2, 17, 12) } }),
    B('PAY-44018', 'Premium Membership', 'Membership Renewal', { txn: 'TXN-5Z9P1K7', type: 'membership', status: 'successful', method: 'mpesa', amount: 3000, createdAt: at(2026, 9, 1, 10, 22) }),
    B('PAY-33109', 'Wallet Top Up', 'Client Wallet', { txn: 'TXN-9C4L2P1', type: 'wallet', status: 'successful', method: 'mpesa', amount: 5000, createdAt: at(2026, 8, 25, 15, 10) }),
    B('PAY-22015', 'Yoga Session', 'Booking #LI-43910', { txn: 'TXN-7D8Q9X3', type: 'booking', image: '/demo/bk-training.jpg', bookingId: 'LI-43910', provider: 'Elite Fitness Hub', status: 'failed', method: 'mastercard', amount: 4000, createdAt: at(2026, 8, 18, 18, 0), breakdown: { service: 3800, fee: 200, discount: 0 } }),
    B('PAY-11877', 'Meditation Session', 'Booking #LI-42105', { txn: 'TXN-4M6R5T2', type: 'booking', image: '/demo/bk-facial.jpg', bookingId: 'LI-42105', provider: 'Mindful Living Center', status: 'successful', method: 'mpesa', amount: 2500, createdAt: at(2026, 8, 5, 7, 0), escrow: 'released', breakdown: { service: 2350, fee: 150, discount: 0 } }),
    B('PAY-00914', 'Payment Fee', 'Platform Fee', { txn: 'TXN-3K8V1L9', type: 'fee', status: 'successful', method: 'mpesa', amount: 230, createdAt: at(2026, 8, 5, 7, 0) }),
  ]
  const older = [
    ['PAY-98211', 'booking', 'Swedish Massage', 'Booking #LI-46021', '/demo/bk-swedish.jpg', 'LI-46021', 'Tranquil Escapes Resort', 'refunded', 'mpesa', 3000, at(2026, 8, 2, 10, 30), 'refunded'],
    ['PAY-97420', 'membership', 'Premium Membership', 'Membership Renewal', null, null, null, 'successful', 'mpesa', 3000, at(2026, 8, 1, 10, 5)],
    ['PAY-96308', 'booking', 'Deep Tissue Massage', 'Booking #LI-41377', '/demo/bk-massage.jpg', 'LI-41377', 'Serenity Wellness Spa', 'successful', 'mpesa', 4500, at(2026, 7, 30, 15, 40), 'released'],
    ['PAY-95117', 'wallet', 'Wallet Top Up', 'Client Wallet', null, null, null, 'pending', 'mpesa', 3000, at(2026, 7, 29, 11, 15)],
    ['PAY-94026', 'booking', 'Private Yoga Session', 'Booking #LI-40586', '/demo/bk-yoga.jpg', 'LI-40586', 'Flow Wellness Studio', 'successful', 'visa', 3500, at(2026, 7, 22, 12, 0), 'released'],
    ['PAY-93885', 'booking', 'Swedish Massage', 'Booking #LI-39944', '/demo/bk-swedish.jpg', 'LI-39944', 'Tranquil Escapes Resort', 'successful', 'mpesa', 6000, at(2026, 7, 15, 9, 0), 'held'],
    ['PAY-92774', 'wallet', 'Wallet Top Up', 'Client Wallet', null, null, null, 'successful', 'mpesa', 25000, at(2026, 7, 12, 19, 20)],
    ['PAY-91653', 'booking', 'Classic Facial', 'Booking #LI-39108', '/demo/bk-facial.jpg', 'LI-39108', 'Radiance Spa', 'successful', 'visa', 5000, at(2026, 7, 8, 17, 0), 'released'],
    ['PAY-90542', 'membership', 'Premium Membership', 'Membership Renewal', null, null, null, 'successful', 'mpesa', 3000, at(2026, 7, 1, 10, 12)],
    ['PAY-89431', 'booking', 'Personal Training', 'Booking #LI-38267', '/demo/bk-training.jpg', 'LI-38267', 'Elite Fitness Hub', 'successful', 'mpesa', 4000, at(2026, 6, 29, 18, 30), 'released'],
    ['PAY-88320', 'wallet', 'Wallet Top Up', 'Client Wallet', null, null, null, 'successful', 'mpesa', 20000, at(2026, 6, 20, 8, 5)],
    ['PAY-87219', 'booking', 'Deep Tissue Massage', 'Booking #LI-36802', '/demo/bk-massage.jpg', 'LI-36802', 'Serenity Wellness Spa', 'successful', 'mpesa', 4500, at(2026, 6, 11, 13, 0), 'released'],
    ['PAY-86108', 'booking', 'Personal Training', 'Booking #LI-36410', '/demo/bk-training.jpg', 'LI-36410', 'Elite Fitness Hub', 'failed', 'visa', 4000, at(2026, 6, 3, 18, 0)],
    ['PAY-85097', 'wallet', 'Wallet Top Up', 'Client Wallet', null, null, null, 'successful', 'mpesa', 15000, at(2026, 5, 24, 15, 30)],
    ['PAY-84086', 'wallet', 'Wallet Top Up', 'Client Wallet', null, null, null, 'successful', 'mpesa', 0, at(2026, 4, 22, 7, 30)],
  ]
  // The last successful row balances lifetime paid to the profile's 128,450.
  const paidSoFar = [...rows, ...older.slice(0, -1).map((o) => ({ status: o[7], amount: o[9], type: o[1] }))]
    .filter((p) => p.status === 'successful')
    .reduce((s, p) => s + p.amount, 0)
  older[older.length - 1][9] = 128450 - paidSoFar

  older.forEach(([id, type, title, subtitle, image, bookingId, provider, status, method, amount, createdAt, escrow]) => {
    rows.push(
      make({
        id,
        type,
        title,
        subtitle,
        image,
        bookingId,
        provider,
        status,
        method,
        amount,
        createdAt,
        escrow,
        breakdown: type === 'booking' ? { service: Math.round(amount * 0.93), fee: amount - Math.round(amount * 0.93), discount: 0 } : null,
        refund: status === 'refunded' ? { reason: 'Booking cancellation', requestedAt: at(2026, 9, 2, 17, 12), amount: 2000, linkedId: 'PAY-55612' } : null,
      }),
    )
  })
  return rows
}

// ---------- every other client ----------

function buildGenerated(r, fx) {
  const profile = buildClientProfile(r)
  const bookings = queryClientBookings(r, { status: 'all', pageSize: 1000, finance: true }).items
  const out = []
  bookings.forEach((b) => {
    const t = new Date(b.scheduledAt).getTime() - 25 * 3_600_000
    const status = b.payment === 'paid' ? 'successful' : b.payment === 'pending' ? 'pending' : b.payment === 'failed' ? 'failed' : 'refunded'
    const service = Math.round(b.price * 0.93)
    out.push(
      make({
        id: `PAY-${10000 + (hashOf(b.id) % 80000)}`,
        type: 'booking',
        title: b.service,
        subtitle: `Booking #${b.id}`,
        image: b.image,
        bookingId: b.id,
        provider: b.provider,
        status,
        method: b.source === 'guest' ? 'visa' : 'mpesa',
        amount: b.price,
        createdAt: iso(t),
        escrow: b.escrow,
        breakdown: { service, fee: b.price - service, discount: 0 },
        refund: status === 'refunded' ? { reason: 'Booking cancellation', requestedAt: iso(t + 20 * 3_600_000), amount: b.price } : null,
      }),
    )
    if (b.status === 'cancelled' && (b.payment === 'refunded' || b.payment === 'refunding')) {
      out.push(
        make({
          id: `PAY-${10000 + (hashOf(`${b.id}-R`) % 80000)}`,
          type: 'refund',
          title: 'Booking Refund',
          subtitle: `Booking #${b.id}`,
          image: b.image,
          bookingId: b.id,
          provider: b.provider,
          status: 'refunded',
          method: 'original',
          amount: b.price,
          createdAt: iso(t + 20 * 3_600_000),
          refund: { reason: 'Booking cancellation', requestedAt: iso(t + 20 * 3_600_000) },
        }),
      )
    }
  })
  if (r.membership === 'premium' || r.membership === 'executive') {
    const fee = Math.round((r.membership === 'premium' ? 3000 : 7500) * fx)
    out.push(make({ id: `PAY-${10000 + (hashOf(`${r.id}-M`) % 80000)}`, type: 'membership', title: `${r.membership === 'premium' ? 'Premium' : 'Executive'} Membership`, subtitle: 'Membership Renewal', status: 'successful', method: 'mpesa', amount: fee, createdAt: iso(new Date(profile.asOf).getTime() - 20 * DAY_MS) }))
  }
  if (r.bookings) {
    out.push(make({ id: `PAY-${10000 + (hashOf(`${r.id}-W`) % 80000)}`, type: 'wallet', title: 'Wallet Top Up', subtitle: 'Client Wallet', status: 'successful', method: 'mpesa', amount: Math.round(5000 * fx), createdAt: iso(new Date(profile.asOf).getTime() - 12 * DAY_MS) }))
  }
  return out
}

function paymentsFor(r) {
  const list = r.id === 'CL-78421' ? buildSeeded() : buildGenerated(r, FX[r.country] || 1)
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

function summarize(list, r) {
  const sum = (arr) => arr.reduce((s, p) => s + p.amount, 0)
  const paid = list.filter((p) => p.status === 'successful')
  const pending = list.filter((p) => p.status === 'pending')
  const failed = list.filter((p) => p.status === 'failed')
  const refunds = list.filter((p) => p.type === 'refund')
  const settled = paid.length + failed.length
  const seed = hashOf(r.id)
  const seeded = r.id === 'CL-78421'
  return {
    total: list.length,
    totalPaid: sum(paid),
    totalPaidDelta: seeded ? 18.2 : (seed % 25) - 5,
    successful: paid.length,
    successRate: seeded ? 94.7 : settled ? Math.round((paid.length / settled) * 1000) / 10 : 0,
    pending: pending.length,
    pendingAmount: sum(pending),
    refundedAmount: sum(refunds),
    refundCount: refunds.length,
    failed: failed.length,
    failureRate: seeded ? 10.5 : settled ? Math.round((failed.length / settled) * 1000) / 10 : 0,
    refunded: list.filter((p) => p.status === 'refunded').length,
  }
}

// ---------- list query (server-side filtering / sorting / paging) ----------

const matchesDate = (p, date, asOf) => {
  if (!date) return true
  const t = new Date(p.createdAt).getTime()
  const now = new Date(asOf).getTime()
  if (date === 'year') return new Date(t).getUTCFullYear() === new Date(now).getUTCFullYear()
  const days = { '7d': 7, '30d': 30, '90d': 90 }[date]
  return days ? now - t <= days * DAY_MS && t <= now + DAY_MS : true
}

const SORTERS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  amount_high: (a, b) => b.amount - a.amount,
  amount_low: (a, b) => a.amount - b.amount,
}

const matchesMethod = (p, m) => (m === 'card' ? p.method.kind === 'visa' || p.method.kind === 'mastercard' : p.method.kind === m)

export function queryClientPayments(r, p) {
  const profile = buildClientProfile(r)
  const all = paymentsFor(r)
  const summary = summarize(all, r)
  const needle = (p.q || '').trim().toLowerCase()

  let rows = all.filter((x) => {
    if (p.status && p.status !== 'all' && x.status !== p.status) return false
    if (!matchesDate(x, p.date, profile.asOf)) return false
    if (p.ptype && x.type !== p.ptype) return false
    if (p.method && !matchesMethod(x, p.method)) return false
    if (p.esc && x.escrow !== p.esc) return false
    if (p.refund && !x.refund) return false
    if (!needle) return true
    return [x.id, x.txn, x.bookingId || '', x.title].some((v) => v.toLowerCase().includes(needle))
  })
  rows = [...rows].sort(SORTERS[p.sort] || SORTERS.newest)

  const pageSize = Number(p.pageSize) || 8
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const page = Math.min(Math.max(1, Number(p.page) || 1), totalPages)
  const start = (page - 1) * pageSize

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
    summary,
    items: rows.slice(start, start + pageSize),
    total: rows.length,
    page,
    pageSize,
    totalPages,
  }
}

// ---------- drawer preview ----------

const notesStore = new Map()

const maskRef = (p) => {
  if (p.id === 'PAY-92841') return 'MPESA2K8F3H7…' // matches the ADM-014 mockup
  const seed = hashOf(p.id)
  if (p.method.kind === 'mpesa') return `MPESA${code(seed, 7)}…`
  if (p.method.kind === 'visa' || p.method.kind === 'mastercard') return `pi_•••••${code(seed, 5)}`
  return `REF-${code(seed, 6)}…`
}

function timelineFor(p) {
  const t = new Date(p.createdAt).getTime()
  const ev = (id, sec, text, tone = 'ok') => ({ id, at: iso(t + sec * 1000), text, tone })
  if (p.status === 'failed') {
    return [ev('e1', 0, 'Payment initiated'), ev('e2', 25, 'Authorization declined by issuer', 'bad'), ev('e3', 26, 'Payment marked failed', 'bad')]
  }
  if (p.status === 'pending') {
    return [ev('e1', 0, 'Payment initiated'), ev('e2', 20, 'Awaiting confirmation from provider', 'wait')]
  }
  if (p.type === 'refund') {
    return [ev('e1', 0, 'Refund requested'), ev('e2', 60, 'Refund approved'), ev('e3', 120, 'Refund sent to original payment method', 'wait')]
  }
  const base = [ev('e1', 0, 'Payment initiated'), ev('e2', 20, 'Payment authorization received'), ev('e3', 60, 'Payment verified')]
  if (p.type === 'booking') {
    base.push(ev('e4', 70, 'Booking payment recorded'))
    if (p.escrow === 'held') base.push(ev('e5', 80, 'Funds held in escrow', 'escrow'))
    if (p.escrow === 'released') base.push(ev('e5', 80, 'Funds held in escrow', 'escrow'), { id: 'e6', at: iso(t + 3 * 86_400_000), text: 'Escrow released to provider', tone: 'ok' })
    if (p.escrow === 'refunded') base.push(ev('e5', 80, 'Funds held in escrow', 'escrow'), { id: 'e6', at: iso(t + 30 * 86_400_000), text: 'Escrow returned to client', tone: 'ok' })
  } else if (p.type === 'membership') base.push(ev('e4', 70, 'Membership payment recorded'), ev('e5', 80, 'Membership renewed'))
  else if (p.type === 'wallet') base.push(ev('e4', 70, 'Wallet credited'))
  else base.push(ev('e4', 70, 'Platform fee recorded'))
  return base
}

export function buildPaymentPreview(r, paymentId, { notes = true } = {}) {
  const profile = buildClientProfile(r)
  const p = paymentsFor(r).find((x) => x.id === paymentId)
  if (!p) throw new Error('Payment not found or outside your authorised markets.')
  const cur = MOCK_CURRENCY[r.country] || 'KES'

  const refund = p.refund
    ? {
        id: `RFD-${1000 + (hashOf(p.id) % 9000)}`,
        amount: p.refund.amount ?? p.amount,
        status: 'Processing',
        reason: p.refund.reason,
        requestedAt: p.refund.requestedAt,
        processedBy: 'Admin / System',
      }
    : null

  const b = p.breakdown
  const breakdown =
    p.type === 'booking' && b
      ? { rows: [['Service Amount', b.service], ['Booking Platform Fee', b.fee], ['Discount', b.discount ? -b.discount : null]], total: p.amount, totalLabel: 'Total Charged' }
      : p.type === 'refund'
        ? { rows: [], total: p.amount, totalLabel: 'Refund Amount' }
        : p.type === 'membership'
          ? { rows: [['Plan Amount', p.amount]], total: p.amount, totalLabel: 'Total Charged' }
          : { rows: [], total: p.amount, totalLabel: 'Total Charged' }

  const confirmed = p.status === 'successful' || p.status === 'refunded' ? iso(new Date(p.createdAt).getTime() + 60_000) : null

  return {
    ...p,
    currency: cur,
    timeZone: profile.timeZone,
    asOf: profile.asOf,
    client: { id: profile.id, name: profile.name },
    reference: maskRef(p),
    confirmedAt: confirmed,
    breakdown,
    escrowDetail: p.type === 'booking' && p.escrow ? { status: p.escrow, amount: p.amount, id: p.escrowId } : null,
    refund,
    timeline: timelineFor(p),
    notes: notes ? notesStore.get(`${r.id}|${p.id}`) || [] : [],
  }
}

export function addMockPaymentNote(clientId, paymentId, text) {
  const entry = { id: `pn${Date.now()}`, author: 'You', text, createdAt: new Date().toISOString() }
  const key = `${clientId}|${paymentId}`
  notesStore.set(key, [entry, ...(notesStore.get(key) || [])])
  return entry
}
