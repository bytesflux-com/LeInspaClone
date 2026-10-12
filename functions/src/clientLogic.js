// Client Management (ADM-010 → ADM-015) — pure read models over the records
// the Lé Inspa client app writes. There is no admin copy of a client:
//
//   users/{uid}                 accountType 'customer', accountStatus, membershipType, country
//   customer_profiles/{uid}     client profile (name, city, membership mirror)
//   bookings                    customerId → the client's bookings
//   payments                    customerId → booking / subscription / package / wallet_topup payments
//   wallets/{uid}               client wallet balance
//   wallet_transactions         userId → wallet ledger
//   subscriptions               userId + accountType 'customer' → Premium Client membership periods
//
// Values the app does not record stay null and render as "—" — nothing is invented.
import { countryCodeOf, lowerStatus, millis, providerCategoryOf } from './platformData.js'
import { normalizeBooking } from './bookingsLogic.js'

export const DAY = 86_400_000
export const CLIENT_ACCOUNT_TYPES = ['customer', 'customers', 'client', 'clients']
export const isClientType = (t) => CLIENT_ACCOUNT_TYPES.includes(lowerStatus(t))

export const MARKET_INFO = {
  KE: { name: 'Kenya', currency: 'KES', tz: 'Africa/Nairobi', offset: 180 },
  UG: { name: 'Uganda', currency: 'UGX', tz: 'Africa/Kampala', offset: 180 },
  TZ: { name: 'Tanzania', currency: 'TZS', tz: 'Africa/Dar_es_Salaam', offset: 180 },
  RW: { name: 'Rwanda', currency: 'RWF', tz: 'Africa/Kigali', offset: 120 },
  ZA: { name: 'South Africa', currency: 'ZAR', tz: 'Africa/Johannesburg', offset: 120 },
  NG: { name: 'Nigeria', currency: 'NGN', tz: 'Africa/Lagos', offset: 60 },
  PK: { name: 'Pakistan', currency: 'PKR', tz: 'Asia/Karachi', offset: 300 },
}
export const iso = (ms) => (ms == null || Number.isNaN(ms) ? null : new Date(ms).toISOString())
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null)
const str = (...vs) => vs.find((v) => typeof v === 'string' && v.trim())?.trim() || null
const pct1 = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null)
const sum = (list, f) => list.reduce((t, x) => t + (Number(f(x)) || 0), 0)

// ---------------------------------------------------------------- identity

export function maskEmail(email) {
  if (!email || !String(email).includes('@')) return null
  const [user, domain] = String(email).split('@')
  return `${user[0] || ''}${'•'.repeat(Math.min(6, Math.max(3, user.length - 1)))}@${domain}`
}
export function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length < 6) return null
  const prefix = String(phone).trim().startsWith('+') ? `+${digits.slice(0, digits.length > 10 ? 3 : 2)}` : digits.slice(0, 2)
  return `${prefix} ••• ••• ${digits.slice(-2)}`
}
const genderOf = (g) => ({ male: 'm', m: 'm', female: 'f', f: 'f' })[lowerStatus(g)] || null

/** Admin view status: account state from the app plus admin flags (deactivated / long inactivity). */
export function clientStatusOf(user = {}, profile = {}, now = Date.now()) {
  if (user.accountDeactivated) return 'deactivated'
  const s = lowerStatus(user.accountStatus || profile.accountStatus || 'active')
  if (s === 'suspended') return 'suspended'
  if (s === 'rejected' || s === 'closed' || s === 'deleted') return 'deactivated'
  if (s === 'pending') return user.emailVerified === false ? 'unverified' : 'pending'
  const last = millis(user.lastActive) ?? millis(user.lastLoginAt)
  if (last && now - last > 180 * DAY) return 'inactive'
  return 'active'
}

/** One client from users + customer_profiles. */
export function mergeClient(uid, { user = {}, profile = {} } = {}, now = Date.now()) {
  const first = str(user.firstName, profile.firstName)
  const last = str(user.lastName, profile.lastName)
  const country = countryCodeOf(user.countryCode, user.country, profile.country)
  return {
    id: uid,
    name: str(user.fullName, profile.fullName, user.displayName, first && last ? `${first} ${last}` : first) || 'Client',
    gender: genderOf(user.gender || profile.gender),
    photoURL: str(user.profilePhoto, user.photoUrl, profile.profilePhoto) || null,
    email: str(user.email, profile.email),
    phone: str(user.phoneNumber, user.phone, profile.phoneNumber, profile.phone),
    country,
    countryName: MARKET_INFO[country]?.name || str(user.country, profile.country) || null,
    city: str(profile.city, user.city),
    region: str(profile.region, user.region),
    rawStatus: str(user.accountStatus, profile.accountStatus),
    status: clientStatusOf(user, profile, now),
    membership: lowerStatus(user.membershipType || profile.membershipType) || 'standard',
    membershipStatus: lowerStatus(user.membershipStatus || profile.membershipStatus) || null,
    membershipExpiry: millis(user.membershipExpiryDate) ?? millis(profile.membershipExpiryDate),
    joinedAt: millis(user.createdAt) ?? millis(profile.createdAt),
    lastActiveAt: millis(user.lastActive) ?? millis(user.lastLoginAt),
    updatedAt: millis(user.updatedAt) ?? millis(profile.updatedAt),
    guestConverted: Boolean(user.guestConverted),
    totalSavings: num(user.totalSavings),
    referredBy: str(user.referredBy),
    referralCodeUsed: str(user.referralCodeUsed),
    contactVerified: user.emailVerified !== false && Boolean(user.email || profile.email),
    isTest: Boolean(user.isTestAccount || user.isE2ETestAccount || profile.isE2ETestAccount || user.testOnly),
  }
}

export const currencyOf = (c) => MARKET_INFO[c?.country]?.currency || null
export const timeZoneOf = (c) => MARKET_INFO[c?.country]?.tz || 'UTC'

/** Header block shared by every client screen. */
export function clientBlock(c, now = Date.now(), currency = null) {
  return {
    id: c.id,
    name: c.name,
    photoURL: c.photoURL,
    gender: c.gender,
    membershipTier: c.membership,
    status: c.status,
    contactVerified: c.contactVerified,
    country: c.country,
    countryName: c.countryName,
    city: c.city,
    joinedAt: iso(c.joinedAt),
    lastActiveAt: iso(c.lastActiveAt),
    asOf: iso(now),
    timeZone: timeZoneOf(c),
    currency: currency || currencyOf(c),
  }
}

// ---------------------------------------------------------------- bookings (client view)

const UPCOMING = new Set(['pending', 'negotiation', 'accepted', 'confirmed', 'on_the_way', 'arrived'])
const ONGOING = new Set(['service_in_progress', 'awaiting_client_confirmation'])
const CANCELLED = new Set(['cancelled', 'rejected', 'expired'])

export function clientBookingStatus(b) {
  if (b.flags?.disputed || b.escrow === 'disputed') return 'disputed'
  if (b.status === 'pending' || b.status === 'negotiation') return 'pending'
  if (UPCOMING.has(b.status)) return 'confirmed'
  if (ONGOING.has(b.status)) return 'ongoing'
  if (CANCELLED.has(b.status)) return 'cancelled'
  return b.status === 'completed' ? 'completed' : 'pending'
}

const SOURCE = { app: 'app', website: 'website', web: 'website', guest: 'guest', walk_in: 'walkin', manual: 'walkin' }
const PROVIDER_KIND = { spa: 'spa', hotel: 'hotel' }
const PROVIDER_KIND_LABEL = { spa: 'Spa & Wellness Center', hotel: 'Hotel & Wellness Resort', provider: 'Independent Provider' }

/** Client-facing booking row from a raw app booking. */
export function clientBookingRow(id, raw, { countryName = null } = {}) {
  const b = normalizeBooking(id, raw)
  const kind = PROVIDER_KIND[providerCategoryOf(b.provider.type)] || 'provider'
  const listPrice = num(raw.local?.originalPrice) ?? num(raw.originalPrice) ?? num(raw.listPrice) ?? num(raw.servicePrice)
  const price = b.amount
  return {
    id,
    reference: b.reference,
    service: b.service.name,
    provider: b.provider.name,
    providerId: b.provider.id,
    serviceId: b.service.id,
    providerType: kind,
    providerLabel: PROVIDER_KIND_LABEL[kind],
    specialist: { name: b.specialist || null, role: null },
    scheduledAt: iso(b.scheduledStart),
    durationMins: b.durationMins,
    city: str(raw.city, raw.locationCity, raw.serviceLocation?.city),
    countryName: countryName || b.marketName,
    branch: b.branch,
    price,
    listPrice: listPrice ?? price,
    negotiated: Boolean(raw.isNegotiated || raw.negotiationId || (listPrice != null && price != null && listPrice !== price)),
    status: clientBookingStatus(b),
    payment: b.payment,
    escrow: b.escrow,
    source: b.guest ? 'guest' : SOURCE[b.source] || 'app',
    image: str(raw.serviceImage, raw.serviceImageUrl, raw.image) || null,
    paymentId: str(raw.paymentId) || null,
    currency: b.currency,
    _b: b,
  }
}

export function bookingSummary(list, now = Date.now()) {
  const count = (fn) => list.filter(fn).length
  const total = list.length
  const upcoming = list.filter((b) => b.status === 'confirmed' || b.status === 'pending')
  const completed = count((b) => b.status === 'completed')
  const cancelled = count((b) => b.status === 'cancelled')
  const soonest = upcoming.map((b) => Date.parse(b.scheduledAt)).filter((t) => t > now).sort((a, b) => a - b)[0]
  const days = soonest ? Math.max(0, Math.round((soonest - now) / DAY)) : null
  return {
    total,
    upcoming: upcoming.length,
    ongoing: count((b) => b.status === 'ongoing'),
    completed,
    cancelled,
    disputed: count((b) => b.status === 'disputed'),
    nextLabel: upcoming.length ? (days === null ? 'Awaiting schedule' : days === 0 ? 'Next today' : `Next in ${days} ${days === 1 ? 'day' : 'days'}`) : 'None scheduled',
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    cancellationRate: total ? Math.round((cancelled / total) * 100) : 0,
  }
}

const inDateWindow = (t, date, now) => {
  if (!date) return true
  if (t == null) return false
  if (date === 'upcoming') return t >= now
  if (date === 'year') return new Date(t).getUTCFullYear() === new Date(now).getUTCFullYear()
  const days = { '7d': 7, '30d': 30, '90d': 90 }[date]
  return days ? now - t <= days * DAY && t <= now + DAY : true
}

export function paginate(rows, p, fallbackSize) {
  const pageSize = Math.min(100, Math.max(1, Number(p.pageSize) || fallbackSize))
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const page = Math.min(Math.max(1, Number(p.page) || 1), totalPages)
  return { items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize, totalPages }
}

const BOOKING_TABS = {
  upcoming: (b) => b.status === 'confirmed' || b.status === 'pending',
  ongoing: (b) => b.status === 'ongoing',
  completed: (b) => b.status === 'completed',
  cancelled: (b) => b.status === 'cancelled',
  disputed: (b) => b.status === 'disputed',
}
const BOOKING_SORT = {
  newest: (a, b) => (Date.parse(b.scheduledAt) || 0) - (Date.parse(a.scheduledAt) || 0),
  oldest: (a, b) => (Date.parse(a.scheduledAt) || 0) - (Date.parse(b.scheduledAt) || 0),
  price_high: (a, b) => (b.price || 0) - (a.price || 0),
  price_low: (a, b) => (a.price || 0) - (b.price || 0),
}
const stripInternal = ({ _b, ...row }) => row
export const redactBooking = (b, finance) => {
  const row = stripInternal(b)
  if (finance) return row
  const { payment, escrow, paymentId, ...safe } = row
  return safe
}

export function queryBookings(rows, p = {}, { finance = false, now = Date.now() } = {}) {
  const needle = String(p.q || '').trim().toLowerCase()
  const filtered = rows.filter((b) => {
    if (p.status && p.status !== 'all' && !BOOKING_TABS[p.status]?.(b)) return false
    if (!inDateWindow(Date.parse(b.scheduledAt), p.date, now)) return false
    if (p.ptype && b.providerType !== p.ptype) return false
    if (p.src && b.source !== p.src) return false
    if (finance && p.pay && b.payment !== p.pay) return false
    if (finance && p.esc && b.escrow !== p.esc) return false
    if (p.neg && !b.negotiated) return false
    if (p.guest && b.source !== 'guest') return false
    return !needle || [b.id, b.reference, b.service, b.provider, b.specialist.name].some((v) => String(v || '').toLowerCase().includes(needle))
  })
  const sorted = [...filtered].sort(BOOKING_SORT[p.sort] || BOOKING_SORT.newest)
  const page = paginate(sorted, p, 6)
  return { ...page, items: page.items.map((b) => redactBooking(b, finance)) }
}

// ---------------------------------------------------------------- payments (client view)

const PAYMENT_TYPE = { booking: 'booking', package: 'booking', subscription: 'membership', membership: 'membership', wallet_topup: 'wallet', topup: 'wallet', refund: 'refund', fee: 'fee' }
const PAYMENT_TYPE_LABELS = { booking: 'Booking Payment', fee: 'Booking Platform Fee', membership: 'Membership Payment', wallet: 'Wallet Top-up', refund: 'Booking Refund' }

export function paymentStatusOf(raw) {
  const s = lowerStatus(raw.paymentStatus || raw.status)
  if (['completed', 'successful', 'success', 'paid', 'released', 'heldinescrow', 'held_in_escrow'].includes(s.replace(/_/g, '')) || ['completed', 'successful', 'success', 'paid', 'released', 'heldinescrow'].includes(s)) return 'successful'
  if (['failed', 'declined', 'cancelled', 'error'].includes(s)) return 'failed'
  if (['refunded', 'reversed'].includes(s)) return 'refunded'
  return 'pending'
}

export function methodOf(raw) {
  const m = lowerStatus(raw.paymentMethod || raw.method)
  if (!m) return null
  if (m.includes('mpesa') || m.includes('m-pesa') || m === 'm_pesa') return { kind: 'mpesa', label: 'M-PESA' }
  if (m.includes('airtel')) return { kind: 'mobile_money', label: 'Airtel Money' }
  if (m.includes('card') || m.includes('visa') || m.includes('master')) return { kind: 'card', label: 'Card' }
  if (m.includes('flutterwave')) return { kind: 'card', label: 'Flutterwave' }
  if (m.includes('wallet')) return { kind: 'wallet', label: 'Lé Inspa Wallet' }
  if (m.includes('bank')) return { kind: 'bank', label: 'Bank transfer' }
  return { kind: 'other', label: 'Other method' }
}

const maskRef = (ref) => (ref ? `${String(ref).slice(0, Math.min(8, Math.max(3, String(ref).length - 4)))}…` : null)

/** Client payment row from a `payments` doc. `bookingsById` resolves service / provider names. */
export function clientPaymentRow(id, raw, bookingsById = new Map()) {
  const type = PAYMENT_TYPE[lowerStatus(raw.paymentType || raw.type)] || (raw.bookingId ? 'booking' : 'booking')
  const booking = raw.bookingId ? bookingsById.get(raw.bookingId) : null
  const status = paymentStatusOf(raw)
  const amount = num(raw.amount) ?? num(raw.local?.totalPaid)
  const service = num(raw.serviceAmount) ?? (type === 'booking' && amount != null ? amount - (num(raw.bookingFee) || 0) - (num(raw.travelFee) || 0) : null)
  const escrowRaw = lowerStatus(raw.escrowStatus || (lowerStatus(raw.paymentStatus) === 'heldinescrow' ? 'held' : lowerStatus(raw.paymentStatus) === 'released' ? 'released' : ''))
  const escrow = type === 'booking' ? ({ held: 'held', funded: 'held', heldinescrow: 'held', released: 'released', refunded: 'refunded' }[escrowRaw] || booking?.escrow || null) : null
  const title = type === 'booking' ? booking?.service || (lowerStatus(raw.paymentType) === 'package' ? 'Package Purchase' : 'Booking') : type === 'membership' ? str(raw.planName, raw.plan) || 'Membership' : type === 'wallet' ? 'Wallet Top Up' : PAYMENT_TYPE_LABELS[type]
  return {
    id,
    txn: str(raw.transactionReference, raw.mpesaReceiptNumber, raw.paymentId) || id,
    type,
    typeLabel: PAYMENT_TYPE_LABELS[type],
    title,
    subtitle: raw.bookingId ? `Booking #${booking?.reference || raw.bookingId}` : type === 'membership' ? 'Membership' : type === 'wallet' ? 'Client Wallet' : null,
    image: booking?.image || null,
    bookingId: raw.bookingId || null,
    provider: booking?.provider || null,
    providerId: str(raw.providerId) || booking?.providerId || null,
    status,
    method: methodOf(raw),
    amount,
    currency: str(raw.currency) || booking?.currency || null,
    createdAt: iso(millis(raw.createdAt)),
    escrow,
    escrowId: null,
    breakdown: type === 'booking' && amount != null ? { service, fee: num(raw.bookingFee), discount: num(raw.discountAmount) } : null,
    refund: status === 'refunded' || raw.refundedAt ? { reason: str(raw.refundReason) || null, requestedAt: iso(millis(raw.refundedAt)), amount: num(raw.refundedDifference) ?? amount } : null,
    _raw: raw,
  }
}

export function paymentSummary(all) {
  // Totals are only meaningful in one currency: use the client's most common one.
  const freq = all.reduce((m, p) => (p.currency ? m.set(p.currency, (m.get(p.currency) || 0) + 1) : m), new Map())
  const currency = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null
  const list = currency ? all.filter((p) => !p.currency || p.currency === currency) : all
  const paid = list.filter((p) => p.status === 'successful')
  const pending = list.filter((p) => p.status === 'pending')
  const failed = list.filter((p) => p.status === 'failed')
  const refunded = list.filter((p) => p.status === 'refunded')
  const settled = paid.length + failed.length
  return {
    currency,
    otherCurrencyPayments: all.length - list.length,
    total: all.length,
    totalPaid: sum(paid, (p) => p.amount),
    totalPaidDelta: null,
    successful: paid.length,
    successRate: settled ? Math.round((paid.length / settled) * 1000) / 10 : null,
    pending: pending.length,
    pendingAmount: sum(pending, (p) => p.amount),
    refundedAmount: sum(refunded, (p) => p.refund?.amount ?? p.amount),
    refundCount: refunded.length,
    failed: failed.length,
    failureRate: settled ? Math.round((failed.length / settled) * 1000) / 10 : null,
    refunded: refunded.length,
  }
}

const PAYMENT_SORT = {
  newest: (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
  oldest: (a, b) => (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0),
  amount_high: (a, b) => (b.amount || 0) - (a.amount || 0),
  amount_low: (a, b) => (a.amount || 0) - (b.amount || 0),
}
const stripRaw = ({ _raw, ...row }) => row

export function queryPayments(rows, p = {}, now = Date.now()) {
  const needle = String(p.q || '').trim().toLowerCase()
  const filtered = rows.filter((x) => {
    if (p.status && p.status !== 'all' && x.status !== p.status) return false
    if (!inDateWindow(Date.parse(x.createdAt), p.date, now)) return false
    if (p.ptype && x.type !== p.ptype) return false
    if (p.method && x.method?.kind !== (p.method === 'visa' || p.method === 'mastercard' ? 'card' : p.method)) return false
    if (p.esc && x.escrow !== p.esc) return false
    if (p.refund && !x.refund) return false
    return !needle || [x.id, x.txn, x.bookingId, x.title].some((v) => String(v || '').toLowerCase().includes(needle))
  })
  const page = paginate([...filtered].sort(PAYMENT_SORT[p.sort] || PAYMENT_SORT.newest), p, 8)
  return { ...page, items: page.items.map(stripRaw) }
}

export function paymentPreview(row, { client, now = Date.now(), notes = [] }) {
  const raw = row._raw || {}
  const t = Date.parse(row.createdAt) || null
  const ev = (id, ms, text, tone = 'ok') => (ms ? { id, at: iso(ms), text, tone } : null)
  const timeline = [
    ev('e1', t, 'Payment initiated'),
    ev('e2', millis(raw.paidAt) ?? millis(raw.completedAt), 'Payment verified by the payment provider'),
    ev('e3', millis(raw.providerAcceptedAt), 'Provider accepted the booking'),
    ev('e4', millis(raw.releasedAt), 'Escrow released to provider'),
    ev('e5', millis(raw.failedAt), raw.failureReason ? `Payment failed — ${raw.failureReason}` : 'Payment failed', 'bad'),
    ev('e6', millis(raw.refundedAt), 'Refund completed'),
    row.status === 'pending' ? ev('e7', t, 'Awaiting confirmation from the payment provider', 'wait') : null,
  ].filter(Boolean).sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
  const b = row.breakdown
  return {
    ...stripRaw(row),
    timeZone: client.timeZone,
    asOf: iso(now),
    client: { id: client.id, name: client.name },
    reference: maskRef(str(raw.mpesaReceiptNumber, raw.transactionReference, raw.checkoutRequestId)),
    confirmedAt: iso(millis(raw.paidAt) ?? millis(raw.completedAt)),
    breakdown: row.type === 'booking' && b
      ? { rows: [['Service Amount', b.service], ['Booking Platform Fee', b.fee], ['Discount', b.discount ? -b.discount : null]], total: row.amount, totalLabel: 'Total Charged' }
      : { rows: row.type === 'membership' ? [['Plan Amount', row.amount]] : [], total: row.amount, totalLabel: row.type === 'refund' ? 'Refund Amount' : 'Total Charged' },
    escrowDetail: row.type === 'booking' && row.escrow ? { status: row.escrow, amount: row.amount, id: null } : null,
    refund: row.refund ? { id: null, amount: row.refund.amount, status: 'Completed', reason: row.refund.reason, requestedAt: row.refund.requestedAt, processedBy: str(raw.refundedTo) ? `Refunded to ${raw.refundedTo}` : null } : null,
    failure: raw.failureReason ? { reason: raw.failureReason, code: raw.failureCode ?? null } : null,
    timeline,
    notes,
  }
}

// ---------------------------------------------------------------- wallet (client view)

const TXN_TYPE = {
  topup: 'topup', wallet_top_up: 'topup', wallet_topup: 'topup', deposit: 'topup',
  payment: 'booking', booking_payment: 'booking', booking_price_adjustment: 'booking',
  refund: 'refund', booking_refund: 'refund', refund_adjustment: 'refund',
  subscription: 'membership', subscription_payment: 'membership',
  promo: 'promo', promotional_credit: 'promo',
}
const TXN_LABELS = { topup: 'Wallet Top Up', booking: 'Booking Payment', refund: 'Booking Refund', promo: 'Promotional Credit', membership: 'Membership Fee' }
const CREDIT_TYPES = new Set(['topup', 'refund', 'promo'])

export function walletRow(id, raw) {
  const rawType = lowerStatus(raw.transactionType || raw.type)
  const type = TXN_TYPE[rawType] || TXN_TYPE[lowerStatus(raw.type)] || 'booking'
  const status = { completed: 'completed', success: 'completed', successful: 'completed', failed: 'failed', reversed: 'failed', pending: 'pending' }[lowerStatus(raw.status)] || 'completed'
  // `amount` is signed in the transaction's own currency (debits negative); localAmount is only set on some rows.
  const signed = num(raw.amount) ?? num(raw.localAmount) ?? 0
  const amount = Math.abs(signed)
  const before = num(raw.balanceBefore)
  const after = num(raw.balanceAfter)
  const direction = status === 'failed' ? 'none' : before != null && after != null && before !== after ? (after > before ? 'credit' : 'debit') : signed < 0 ? 'debit' : CREDIT_TYPES.has(type) ? 'credit' : 'debit'
  const method = methodOf(raw)
  return {
    id,
    type,
    title: TXN_LABELS[type],
    subtitle: str(raw.description) || method?.label || null,
    related: raw.bookingId ? { label: `Booking #${raw.bookingId}`, sub: str(raw.serviceName) } : null,
    createdAt: iso(millis(raw.createdAt)),
    amount,
    direction,
    status,
    method,
    bookingId: raw.bookingId || null,
    paymentId: str(raw.paymentId, raw.referenceId) || null,
    balanceBefore: before,
    balanceAfter: after,
    failure: str(raw.failureReason, raw.reversalReason),
    provider: str(raw.providerName),
    service: str(raw.serviceName),
    walletType: raw.walletType || null,
    currency: str(raw.currency) || null,
  }
}

/** Ledger currency = the transactions' currency; the balance is read in the same unit (USD rows → the *Base balance). */
export function walletSummary(rows, wallet = {}) {
  const currency = rows.find((t) => t.currency)?.currency || null
  const done = rows.filter((t) => t.status === 'completed')
  const credits = sum(done.filter((t) => t.direction === 'credit'), (t) => t.amount)
  const debits = sum(done.filter((t) => t.direction === 'debit'), (t) => t.amount)
  const balance = currency === 'USD'
    ? num(wallet.availableBalanceBase) ?? num(wallet.base?.availableBalance) ?? num(wallet.availableBalance)
    : num(wallet.local?.availableBalance) ?? num(wallet.availableBalance) ?? num(wallet.balance)
  return {
    currency,
    balance,
    pending: sum(rows.filter((t) => t.status === 'pending' && t.direction === 'credit'), (t) => t.amount),
    credits,
    debits,
    // Credits − Debits should equal the wallet balance; a mismatch is surfaced, never corrected here.
    reconciled: balance == null ? null : Math.round(credits - debits) === Math.round(balance),
    promotionalBalance: num(wallet.promotionalBalance),
    counts: {
      all: rows.length,
      credits: rows.filter((t) => t.direction === 'credit').length,
      debits: rows.filter((t) => t.direction === 'debit').length,
      refunds: rows.filter((t) => t.type === 'refund').length,
      pending: rows.filter((t) => t.status === 'pending').length,
    },
  }
}

const WALLET_TABS = { all: () => true, credits: (t) => t.direction === 'credit', debits: (t) => t.direction === 'debit', refunds: (t) => t.type === 'refund', pending: (t) => t.status === 'pending' }
const WALLET_SORT = {
  newest: (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
  oldest: (a, b) => (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0),
  amount_high: (a, b) => b.amount - a.amount,
  amount_low: (a, b) => a.amount - b.amount,
}
export const walletListItem = (t) => ({ id: t.id, type: t.type, title: t.title, subtitle: t.subtitle, related: t.related, createdAt: t.createdAt, amount: t.amount, direction: t.direction, status: t.status, method: t.method, bookingId: t.bookingId })

export function queryWallet(rows, p = {}, now = Date.now()) {
  const needle = String(p.q || '').trim().toLowerCase()
  const filtered = rows.filter((t) => {
    if (!(WALLET_TABS[p.tab] || WALLET_TABS.all)(t)) return false
    if (p.status && p.status !== 'all' && t.status !== p.status) return false
    if (!inDateWindow(Date.parse(t.createdAt), p.date, now)) return false
    if (p.ttype && t.type !== p.ttype) return false
    if (p.effect && t.direction !== p.effect) return false
    if (p.linked && !t.bookingId) return false
    return !needle || [t.id, t.paymentId, t.bookingId, t.title, t.subtitle].some((v) => String(v || '').toLowerCase().includes(needle))
  })
  const page = paginate([...filtered].sort(WALLET_SORT[p.sort] || WALLET_SORT.newest), p, 6)
  return { ...page, items: page.items.map(walletListItem) }
}

/** Daily closing balance for the chart, from recorded balanceAfter values (null days carry forward). */
export function walletHistory(rows, { window = 30, now = Date.now(), offsetMins = 180 } = {}) {
  const shift = offsetMins * 60_000
  const dayOf = (ms) => Math.floor((ms + shift) / DAY)
  const done = rows.filter((t) => t.status === 'completed' && t.balanceAfter != null && t.createdAt).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  const last = dayOf(now)
  const first = last - (Number(window) - 1)
  let bal = null
  let i = 0
  const points = []
  for (let d = Math.min(first, done.length ? dayOf(Date.parse(done[0].createdAt)) : first); d <= last; d++) {
    while (i < done.length && dayOf(Date.parse(done[i].createdAt)) <= d) bal = done[i++].balanceAfter
    if (d >= first) points.push({ at: iso(d * DAY - shift), balance: bal })
  }
  return { window: Number(window), points }
}

// ---------------------------------------------------------------- directory + dashboard (ADM-010 / ADM-011)

/** Per-client aggregates from raw bookings / payments / cases. */
export function clientAggregates({ bookings = [], payments = [], disputes = [], tickets = [], safety = [] }, now = Date.now()) {
  const byClient = new Map()
  const get = (id) => {
    if (!byClient.has(id)) byClient.set(id, { bookings: 0, completed: 0, cancelled: 0, upcoming: false, inService: false, lastBookingAt: null, cancelledRecently: false, lifetimeValue: 0, currency: null, openDisputes: 0, supportTickets: 0, safetyCase: false, paymentIssue: false })
    return byClient.get(id)
  }
  for (const raw of bookings) {
    const cid = str(raw.customerId, raw.clientId)
    if (!cid) continue
    const a = get(cid)
    const b = normalizeBooking(raw.id, raw)
    a.bookings += 1
    const status = clientBookingStatus(b)
    if (status === 'completed') { a.completed += 1; a.lifetimeValue += b.amount || 0; a.currency = a.currency || b.currency }
    if (status === 'cancelled') { a.cancelled += 1; if (b.cancelledAt && now - b.cancelledAt < 30 * DAY) a.cancelledRecently = true }
    if ((status === 'confirmed' || status === 'pending') && (b.scheduledStart || 0) >= now) a.upcoming = true
    if (status === 'ongoing') a.inService = true
    const t = b.scheduledStart ?? b.createdAt
    if (t && t <= now && (!a.lastBookingAt || t > a.lastBookingAt)) a.lastBookingAt = t
  }
  for (const p of payments) {
    const cid = str(p.customerId, p.userId)
    if (!cid) continue
    const s = paymentStatusOf(p)
    const at = millis(p.createdAt)
    if (s === 'failed' && at && now - at < 30 * DAY) get(cid).paymentIssue = true
    if (s === 'pending' && at && now - at > 7 * DAY) get(cid).paymentIssue = true
  }
  for (const d of disputes) if (['open', 'pending', 'under_review', 'investigating'].includes(lowerStatus(d.status))) for (const id of [d.reporterId, d.againstId, d.clientId]) if (id) get(id).openDisputes += 1
  for (const t of tickets) if (!['closed', 'resolved'].includes(lowerStatus(t.status))) { const id = str(t.userId, t.customerId); if (id) get(id).supportTickets += 1 }
  for (const s of safety) if (!['resolved', 'closed', 'dismissed'].includes(lowerStatus(s.status)) && s.clientId) get(s.clientId).safetyCase = true
  return byClient
}

const daysAgo = (ms, now) => (ms == null ? null : Math.max(0, Math.floor((now - ms) / DAY)))

export function directoryRow(c, agg = {}, now = Date.now()) {
  return {
    ...c,
    bookings: agg.bookings || 0,
    completedCount: agg.completed || 0,
    cancelledCount: agg.cancelled || 0,
    hasUpcoming: Boolean(agg.upcoming),
    inService: Boolean(agg.inService),
    cancelledRecently: Boolean(agg.cancelledRecently),
    lastBookingDaysAgo: daysAgo(agg.lastBookingAt, now),
    lastActiveDaysAgo: daysAgo(c.lastActiveAt, now),
    updatedDaysAgo: daysAgo(c.updatedAt, now),
    lifetimeValue: agg.lifetimeValue || 0,
    lifetimeCurrency: agg.currency || currencyOf(c),
    openDisputes: agg.openDisputes || 0,
    supportTickets: agg.supportTickets || 0,
    safetyCase: Boolean(agg.safetyCase),
    paymentIssue: Boolean(agg.paymentIssue),
  }
}

/** Masked list projection — the directory never returns full contact details. */
export const listItem = (r) => ({
  id: r.id,
  name: r.name,
  gender: r.gender,
  photoURL: r.photoURL,
  email: maskEmail(r.email),
  phone: maskPhone(r.phone),
  country: r.country,
  countryName: r.countryName,
  city: r.city,
  membership: r.membership,
  status: r.status,
  bookings: r.bookings,
  lifetimeValue: Math.round(r.lifetimeValue),
  currency: r.lifetimeCurrency,
  guestConverted: r.guestConverted,
  joinedAt: iso(r.joinedAt),
})

function matchesActivity(r, activity) {
  switch (activity) {
    case 'today': return r.lastBookingDaysAgo === 0
    case 'week': return r.lastBookingDaysAgo !== null && r.lastBookingDaysAgo <= 7
    case 'upcoming': return r.hasUpcoming
    case 'in_service': return r.inService
    case 'none': return r.bookings === 0
    case 'returning': return r.bookings >= 2
    case 'cancelled_recent': return r.cancelledRecently
    default: return true
  }
}

export function filterClients(rows, p = {}, { ignoreStatus = false, now = Date.now(), canSeeSafety = false } = {}) {
  const country = p.market && p.market !== 'ALL' ? p.market : p.country
  const joinedCutoff = { '7d': 7, '30d': 30, '90d': 90 }[p.joined]
  const issues = p.issues || []
  const needle = String(p.q || '').trim().toLowerCase()
  const digits = needle.replace(/\D/g, '')
  const within = (v, limit) => v !== null && v <= Number(limit)
  return rows.filter((r) => {
    if (country && r.country !== country) return false
    if (!ignoreStatus && p.status && p.status !== 'all' && r.status !== p.status) return false
    if (p.membership && r.membership !== p.membership) return false
    if (p.region && r.region !== p.region) return false
    if (p.city && r.city !== p.city) return false
    if (p.activity && !matchesActivity(r, p.activity)) return false
    if (joinedCutoff && (!r.joinedAt || now - r.joinedAt > joinedCutoff * DAY)) return false
    if (p.joined === 'year' && (!r.joinedAt || new Date(r.joinedAt).getUTCFullYear() !== new Date(now).getUTCFullYear())) return false
    if (p.from && (!r.joinedAt || r.joinedAt < Date.parse(p.from))) return false
    if (p.to && (!r.joinedAt || r.joinedAt > Date.parse(p.to) + DAY - 1)) return false
    if (p.reg) return false // the app does not record the registration method
    if (p.guest === 'yes' && !r.guestConverted) return false
    if (p.guest === 'no' && r.guestConverted) return false
    if (p.bmin !== '' && p.bmin != null && r.bookings < Number(p.bmin)) return false
    if (p.bmax !== '' && p.bmax != null && r.bookings > Number(p.bmax)) return false
    if (p.lastb === 'never' && r.lastBookingDaysAgo !== null) return false
    if (p.lastb && p.lastb !== 'never' && !within(r.lastBookingDaysAgo, p.lastb)) return false
    if (p.lasta && !within(r.lastActiveDaysAgo, p.lasta)) return false
    if (issues.includes('dispute') && !r.openDisputes) return false
    if (issues.includes('ticket') && !r.supportTickets) return false
    if (issues.includes('safety') && (!canSeeSafety || !r.safetyCase)) return false
    if (issues.includes('payment') && !r.paymentIssue) return false
    if (!needle) return true
    return r.id.toLowerCase().includes(needle) || r.name.toLowerCase().includes(needle) || String(r.email || '').toLowerCase().includes(needle) || (digits.length >= 3 && String(r.phone || '').replace(/\D/g, '').includes(digits))
  })
}

const CLIENT_SORT = {
  newest: (a, b) => (b.joinedAt || 0) - (a.joinedAt || 0),
  oldest: (a, b) => (a.joinedAt || 0) - (b.joinedAt || 0),
  bookings: (a, b) => b.bookings - a.bookings || (b.joinedAt || 0) - (a.joinedAt || 0),
  active: (a, b) => (a.lastActiveDaysAgo ?? 1e9) - (b.lastActiveDaysAgo ?? 1e9),
  updated: (a, b) => (a.updatedDaysAgo ?? 1e9) - (b.updatedDaysAgo ?? 1e9),
  value: (a, b) => b.lifetimeValue - a.lifetimeValue,
}
export const STATUS_TABS = ['active', 'pending', 'inactive', 'suspended', 'deactivated']

export function queryClients(rows, p = {}, opts = {}) {
  const scoped = filterClients(rows, p, { ...opts, ignoreStatus: true })
  const counts = { all: scoped.length, ...Object.fromEntries(STATUS_TABS.map((s) => [s, 0])) }
  for (const r of scoped) if (r.status in counts) counts[r.status] += 1
  const filtered = p.status && p.status !== 'all' ? scoped.filter((r) => r.status === p.status) : scoped
  const sorted = [...filtered].sort(CLIENT_SORT[p.sort] || CLIENT_SORT.newest)
  const q = String(p.q || '').trim().toLowerCase()
  if (q) {
    const i = sorted.findIndex((r) => r.id.toLowerCase() === q)
    if (i > 0) sorted.unshift(sorted.splice(i, 1)[0])
  }
  const page = Math.max(1, Number(p.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(p.pageSize) || 10))
  return {
    items: sorted.slice((page - 1) * pageSize, page * pageSize).map(listItem),
    total: sorted.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    counts,
  }
}

const RANGE_DELTA_LABEL = { today: 'vs. yesterday', yesterday: 'vs. day before', '7d': 'vs. previous week', '30d': 'vs. previous 30 days', this_month: 'vs. last month', custom: 'vs. previous period' }

/** [start, end) for a reporting range in the market's local day. */
export function rangeBounds(range, now = Date.now(), offsetMins = 180) {
  const shift = offsetMins * 60_000
  const dayStart = Math.floor((now + shift) / DAY) * DAY - shift
  switch (range) {
    case 'today': return [dayStart, now]
    case 'yesterday': return [dayStart - DAY, dayStart]
    case '7d': return [dayStart - 6 * DAY, now]
    case 'this_month': {
      const d = new Date(now + shift)
      return [Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - shift, now]
    }
    default: return [dayStart - 29 * DAY, now]
  }
}

const pctChange = (cur, prev) => (prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : cur ? null : 0)
const dayLabel = (ms, offsetMins) => new Date(ms + offsetMins * 60_000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

/**
 * ADM-010 dashboard from live client rows + bookings. Period-over-period changes
 * are only given for event counts (new clients, booking clients); point-in-time
 * totals have no history in the app, so their change is null.
 */
export function buildClientDashboard({ rows, bookings, market = 'ALL', range = '30d', now = Date.now(), restrictions = [], openTickets = 0 }) {
  const offset = MARKET_INFO[market]?.offset ?? 180
  const [start, end] = rangeBounds(range, now, offset)
  const span = end - start
  const scoped = market !== 'ALL' ? rows.filter((c) => c.country === market) : rows
  const ids = new Set(scoped.map((c) => c.id))
  const count = (fn) => scoped.filter(fn).length
  const total = scoped.length
  const newIn = (a, b) => count((c) => c.joinedAt >= a && c.joinedAt < b)

  const clientBookings = bookings.filter((raw) => ids.has(str(raw.customerId, raw.clientId)))
  const norm = clientBookings.map((raw) => ({ raw, b: normalizeBooking(raw.id, raw) }))
  const at = ({ b }) => b.scheduledStart ?? b.createdAt
  const inPeriod = (a, z) => norm.filter((x) => at(x) >= a && at(x) < z)
  const cur = inPeriod(start, end)
  const prev = inPeriod(start - span, start)
  const clientsOf = (list) => new Set(list.map(({ raw }) => str(raw.customerId, raw.clientId))).size
  const finished = cur.filter(({ b }) => ['completed', 'cancelled', 'rejected', 'expired'].includes(b.status))
  const completed = cur.filter(({ b }) => b.status === 'completed')
  const currency = MARKET_INFO[market]?.currency || null
  const amountOf = ({ raw, b }) => (currency ? b.amount : num(raw.base?.totalPrice) ?? num(raw.base?.totalPaid))
  const avg = completed.length ? Math.round(sum(completed, amountOf) / completed.length) : null

  const hourly = range === 'today' || range === 'yesterday'
  const bucketMs = hourly ? 3_600_000 : DAY
  const buckets = Math.max(1, Math.ceil(span / bucketMs))
  const series = Array.from({ length: buckets }, (_, i) => {
    const a = start + i * bucketMs
    const z = a + bucketMs
    const slice = cur.filter((x) => at(x) >= a && at(x) < z)
    return {
      label: hourly ? `${String(i).padStart(2, '0')}:00` : dayLabel(a, offset),
      completed: slice.filter(({ b }) => b.status === 'completed').length,
      cancelled: slice.filter(({ b }) => ['cancelled', 'rejected', 'expired'].includes(b.status)).length,
    }
  })

  const group = (key) => {
    const map = new Map()
    for (const c of scoped) if (c[key]) map.set(c[key], (map.get(c[key]) || 0) + 1)
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, n]) => ({ name, count: n, pct: pct1(n, total) }))
  }
  const tier = (t) => count((c) => c.membership === t)
  const guestCur = bookings.map((raw) => normalizeBooking(raw.id, raw)).filter((b) => b.guest && (b.createdAt || 0) >= start && (b.createdAt || 0) < end && (market === 'ALL' || b.countryCode === market || !b.countryCode))
  const guestLinked = guestCur.filter((b) => b.client.id).length
  const activeRestrictions = restrictions.filter((x) => x.status === 'active' && ids.has(x.clientId))

  return {
    market,
    range,
    deltaLabel: RANGE_DELTA_LABEL[range] || RANGE_DELTA_LABEL['30d'],
    kpis: {
      total: { value: total, change: null },
      active: { value: count((c) => c.status === 'active'), change: null },
      newClients: { value: newIn(start, end), change: pctChange(newIn(start, end), newIn(start - span, start)) },
      bookingClients: { value: clientsOf(cur), change: pctChange(clientsOf(cur), clientsOf(prev)) },
      suspended: { value: count((c) => c.status === 'suspended'), change: null, adverse: true },
    },
    attention: {
      reviews: new Set(activeRestrictions.filter((x) => x.kind === 'review').map((x) => x.clientId)).size,
      suspended: count((c) => c.status === 'suspended'),
      support: openTickets,
      payments: count((c) => c.paymentIssue),
      guestLinking: guestCur.length - guestLinked,
    },
    segments: { all: total, standard: tier('standard'), premium: tier('premium'), executive: tier('executive'), guest: count((c) => c.guestConverted), suspended: count((c) => c.status === 'suspended'), inactive: count((c) => c.status === 'inactive') },
    membership: {
      total,
      slices: [
        { id: 'standard', label: 'Standard', count: tier('standard'), pct: pct1(tier('standard'), total) ?? 0 },
        { id: 'premium', label: 'Premium', count: tier('premium'), pct: pct1(tier('premium'), total) ?? 0 },
        { id: 'executive', label: 'Executive', count: tier('executive'), pct: pct1(tier('executive'), total) ?? 0 },
        { id: 'none', label: 'Other', count: total - tier('standard') - tier('premium') - tier('executive'), pct: pct1(total - tier('standard') - tier('premium') - tier('executive'), total) ?? 0 },
      ],
    },
    locations: { cities: group('city'), regions: group('region') },
    guest: { bookings: guestCur.length, convertedPct: guestCur.length ? Math.round((guestLinked / guestCur.length) * 100) : null, unlinked: guestCur.length - guestLinked },
    booking: {
      bookingClients: clientsOf(cur),
      completionRate: finished.length ? Math.round((completed.length / finished.length) * 100) : null,
      avgBookingValue: avg,
      currency: currency || 'USD',
      series,
      granularity: hourly ? 'hour' : 'day',
    },
  }
}

/** ADM-010 client sign-up trend: monthly (30 daily points), weekly (7), daily (24 hourly). */
export function buildClientGrowth({ rows, market = 'ALL', window = 'monthly', now = Date.now() }) {
  const offset = MARKET_INFO[market]?.offset ?? 180
  const scoped = market !== 'ALL' ? rows.filter((c) => c.country === market) : rows
  const cfg = { monthly: { points: 30, ms: DAY, label: 'last 30 days vs. previous 30 days' }, weekly: { points: 7, ms: DAY, label: 'last 7 days vs. previous 7 days' }, daily: { points: 24, ms: 3_600_000, label: 'last 24 hours vs. previous 24 hours' } }[window] || { points: 30, ms: DAY, label: '' }
  const end = now
  const start = end - cfg.points * cfg.ms
  const points = Array.from({ length: cfg.points }, (_, i) => {
    const a = start + i * cfg.ms
    return { label: cfg.ms === DAY ? dayLabel(a, offset) : new Date(a + offset * 60_000).toISOString().slice(11, 16), value: scoped.filter((c) => c.joinedAt >= a && c.joinedAt < a + cfg.ms).length }
  })
  const current = points.reduce((t, p) => t + p.value, 0)
  const previous = scoped.filter((c) => c.joinedAt >= start - (end - start) && c.joinedAt < start).length
  return { window, comparison: cfg.label, changePct: pctChange(current, previous), points }
}

/** Recent activity for the directory preview, from real records only. */
export function clientActivity(c, { bookings = [], payments = [], tickets = [] }, now = Date.now()) {
  const items = [
    ...bookings.map((b) => ({ id: `b-${b.id}`, type: 'booking', title: `Booked ${b.service}`, at: Date.parse(b.scheduledAt) || null })),
    ...payments.map((p) => ({ id: `p-${p.id}`, type: 'payment', title: `${p.typeLabel} ${p.status}`, at: Date.parse(p.createdAt) || null })),
    ...tickets.map((t) => ({ id: `t-${t.id}`, type: 'support', title: `Support ticket: ${t.subject || 'request'}`, at: millis(t.createdAt) })),
    c.lastActiveAt ? { id: 'login', type: 'login', title: 'Last seen in the app', at: c.lastActiveAt } : null,
    c.updatedAt ? { id: 'profile', type: 'profile', title: 'Profile updated', at: c.updatedAt } : null,
  ].filter((x) => x && x.at && x.at <= now + DAY)
  return items.sort((a, b) => b.at - a.at).slice(0, 6).map(({ at, ...x }) => ({ ...x, daysAgo: daysAgo(at, now), at: iso(at) }))
}
