// Pure helpers shared by ADM-025 → ADM-028 (provider reviews, subscription &
// visibility, quality & risk, account actions). No Firestore access here: the
// callables load records and the browser demo backend feeds the same functions
// in-memory records, so both paths produce identical results.

import { normalizeBooking as normalizeAppBooking } from './bookingsLogic.js'
import { countryCodeOf, providerTypeOf, PROVIDER_TYPES } from './platformData.js'

export const DAY = 24 * 60 * 60 * 1000
export const HOUR = 60 * 60 * 1000

export const MARKET_INFO = {
  KE: { name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  UG: { name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
  TZ: { name: 'Tanzania', currency: 'TZS', flag: '🇹🇿' },
  RW: { name: 'Rwanda', currency: 'RWF', flag: '🇷🇼' },
  ZA: { name: 'South Africa', currency: 'ZAR', flag: '🇿🇦' },
}

// Firestore Timestamp, {_seconds}, Date, ISO string or epoch ms → epoch ms (or null).
export function toMillis(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value instanceof Date) return value.getTime()
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value._seconds === 'number') return value._seconds * 1000
  if (typeof value.seconds === 'number') return value.seconds * 1000
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

export const lower = (v) => String(v ?? '').trim().toLowerCase()
export const round1 = (n) => Math.round(n * 10) / 10
export const pct = (part, whole) => (whole > 0 ? round1((part / whole) * 100) : 0)

export function providerCategory(data = {}) {
  const type = providerTypeOf(data.accountType) || providerTypeOf(data.providerType) || providerTypeOf(data.providerCategory)
  if (type) return PROVIDER_TYPES[type].category
  const t = lower(data.providerType || data.entityType || data.category || data.type)
  if (t.includes('spa')) return 'spa'
  if (t.includes('hotel') || t.includes('resort')) return 'hotel'
  return 'individual'
}

// The app's users.accountStatus is pending | approved | rejected | suspended.
// Admin-only states are flags on the same record (never a second copy):
// accountDeactivated → deactivated, adminReviewStatus 'under_review' → under review.
export function adminAccountStatus(data = {}) {
  if (data.accountDeactivated) return 'deactivated'
  const s = lower(data.accountStatus || data.status || 'active')
  const base = s === 'approved' ? 'active' : s || 'active'
  if (base === 'active' && lower(data.adminReviewStatus) === 'under_review') return 'under_review'
  return base
}

// One display shape for the provider header on every ADM-025 → ADM-028 screen.
export function normalizeProvider(id, data = {}) {
  const marketCode = countryCodeOf(data.marketCode, data.countryCode, data.market, data.country) || (String(data.marketCode || '').toUpperCase() || null)
  const market = MARKET_INFO[marketCode] || {}
  const verification = lower(data.verificationStatus || data.verification || (data.isVerified ? 'verified' : ''))
  const accountStatus = adminAccountStatus(data)
  return {
    id: data.providerId || id,
    docId: id,
    userId: data.userId || data.uid || null,
    name: data.name || data.businessName || data.displayName || data.fullName || 'Provider',
    typeLabel: data.typeLabel || data.providerTypeLabel || data.profession || 'Provider',
    category: providerCategory(data),
    city: data.city || null,
    country: data.country || market.name || null,
    marketCode,
    flag: data.flag || market.flag || null,
    currency: data.currency || market.currency || null,
    avatar: data.avatar || data.photoUrl || data.profilePhoto || data.logo || data.profilePhotoUrl || null,
    verified: verification === 'verified' || verification === 'approved',
    verificationStatus: verification || 'unknown',
    accountStatus,
    rating: typeof data.rating === 'number' ? data.rating : typeof data.averageRating === 'number' ? data.averageRating : null,
    reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : typeof data.totalReviews === 'number' ? data.totalReviews : null,
    branches: Array.isArray(data.branches) ? data.branches : [],
    locations: Array.isArray(data.wellnessLocations) ? data.wellnessLocations : Array.isArray(data.locations) ? data.locations : [],
    verificationChecklist: data.verificationChecklist || {},
    contentStatus: lower(data.contentStatus || 'approved'),
  }
}

// Shared booking normalization (the shared `bookings` collection, never a copy).
// App bookings (bookingStatus, bookingDate/bookingTime, local.totalPrice,
// customerId) go through bookingsLogic; older/demo shapes are read directly.
export function normalizeBooking(id, b = {}) {
  if (b.bookingStatus !== undefined || b.local || b.bookingDate) {
    const n = normalizeAppBooking(id, b)
    const status = ({ accepted: 'upcoming', confirmed: 'upcoming', pending: 'upcoming', negotiation: 'upcoming', on_the_way: 'upcoming', arrived: 'upcoming', service_in_progress: 'ongoing', awaiting_client_confirmation: 'ongoing', rejected: 'cancelled', expired: 'cancelled' })[n.status] || n.status
    return {
      id: n.id, docId: id, providerId: n.provider.id, clientId: n.client.id, clientName: n.client.name, serviceName: n.service.name,
      status, startAt: n.scheduledStart, completedAt: n.completedAt, createdAt: n.createdAt, amount: n.amount || 0, currency: n.currency,
      paymentStatus: lower(b.paymentStatus), escrowStatus: lower(b.escrowStatus), disputed: lower(b.escrowStatus) === 'disputed', refunded: lower(b.paymentStatus) === 'refunded' || lower(b.escrowStatus) === 'refunded',
      refundPending: n.refundStatus === 'pending', cancelledBy: n.cancelledBy || lower(b.cancelledBy), cancelledAt: n.cancelledAt, noShow: lower(b.noShowBy) === 'provider',
      rescheduleCount: Number(b.rescheduleCount) || 0, conflict: Boolean(n.flags?.conflict || n.flags?.resourceConflict), unassigned: false,
      branchName: b.branchName || null, locationName: b.locationName || null, experienceType: b.experienceType || null, respondedOnTime: typeof b.respondedOnTime === 'boolean' ? b.respondedOnTime : null,
    }
  }
  const status = lower(b.status)
  return {
    id: b.bookingId || id,
    docId: id,
    providerId: b.providerId || null,
    clientId: b.clientId || null,
    clientName: b.clientName || b.client?.name || null,
    serviceName: b.serviceName || b.service?.name || null,
    status:
      status === 'confirmed' ? 'upcoming'
      : status === 'in_progress' || status === 'started' ? 'ongoing'
      : status || 'unknown',
    startAt: toMillis(b.startAt || b.scheduledAt || b.date),
    completedAt: toMillis(b.completedAt),
    createdAt: toMillis(b.createdAt),
    amount: typeof b.amount === 'number' ? b.amount : Number(b.amount) || 0,
    currency: b.currency || null,
    paymentStatus: lower(b.paymentStatus),
    escrowStatus: lower(b.escrowStatus),
    disputed: Boolean(b.isDisputed) || lower(b.escrowStatus) === 'disputed' || status === 'disputed',
    refunded: lower(b.paymentStatus) === 'refunded' || lower(b.escrowStatus) === 'refunded',
    refundPending: lower(b.refundStatus) === 'pending' || lower(b.paymentStatus) === 'refund_pending',
    cancelledBy: lower(b.cancelledBy),
    cancelledAt: toMillis(b.cancelledAt),
    noShow: status === 'no_show' || lower(b.noShowBy) === 'provider',
    rescheduleCount: Number(b.rescheduleCount) || 0,
    conflict: Boolean(b.bookingConflict || b.resourceConflict),
    unassigned: Boolean(b.unassigned) || (b.requiresStaff === true && !b.staffId),
    branchName: b.branchName || null,
    locationName: b.locationName || null,
    experienceType: b.experienceType || null,
    respondedOnTime: typeof b.respondedOnTime === 'boolean' ? b.respondedOnTime : null,
  }
}

// Support / safety / dispute records → one case shape. A complaint is NOT a
// confirmed violation: `confirmed` is only true when the case outcome says so.
const CLOSED_CASE = ['resolved', 'closed', 'dismissed', 'rejected', 'no_action', 'unsubstantiated']
const CONFIRMED_CASE = ['confirmed', 'upheld', 'violation_confirmed']

export function normalizeCase(id, c = {}, kind = 'safety') {
  const status = lower(c.status || 'open')
  const outcome = lower(c.outcome)
  return {
    id: c.caseId || c.disputeId || c.reportId || id,
    kind,
    category: c.category || c.issueType || c.reason || (kind === 'dispute' ? 'Booking Dispute' : 'Client Complaint'),
    severity: lower(c.severity || 'standard'),
    status,
    statusLabel: c.statusLabel || null,
    open: !CLOSED_CASE.includes(status) && !CONFIRMED_CASE.includes(status),
    confirmed: CONFIRMED_CASE.includes(status) || CONFIRMED_CASE.includes(outcome),
    bookingId: c.bookingId || null,
    createdAt: toMillis(c.createdAt || c.submittedAt),
    resolvedAt: toMillis(c.resolvedAt || c.closedAt),
    type: lower(c.type),
    outcome: outcome || null,
  }
}

export function caseLink(c) {
  if (c.kind === 'dispute') return `/disputes/${c.id}`
  if (c.kind === 'support') return `/support/${c.id}`
  return `/safety/${c.id}`
}

// Permission flags every ADM-025 → ADM-028 response carries; the UI only
// reflects them, the callables enforce them.
export function trustPermissions(access) {
  const perms = new Set(access?.permissions || [])
  return {
    viewFinance: perms.has('payments.view'),
    moderateReviews: perms.has('content.moderate'),
    manageSubscriptions: perms.has('subscriptions.manage'),
    manageVisibility: perms.has('visibility.manage'),
    assessRisk: perms.has('safety.manage'),
    accountActions: perms.has('users.suspend'),
    restrictWithdrawals: perms.has('withdrawals.approve'),
    deactivate: perms.has('users.deactivate'),
    viewAudit: perms.has('audit.view'),
  }
}

export const clean = (v, max = 2000) => String(v ?? '').trim().slice(0, max)

export function isFutureDay(ms, now) {
  return typeof ms === 'number' && ms > now
}

// Local-calendar day boundaries are approximated in UTC+3 (East Africa), the
// launch markets' zone; callers may pass a different offset.
export function dayBucket(ms, now, tzOffsetMins = 180) {
  const shift = tzOffsetMins * 60000
  const day = (t) => Math.floor((t + shift) / DAY)
  const diff = day(ms) - day(now)
  if (diff <= 0) return 'today'
  if (diff === 1) return 'tomorrow'
  return 'later'
}
