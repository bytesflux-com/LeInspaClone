import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { getTimezoneOffset } from 'date-fns-tz'
import { requireAdmin } from './auth.js'
import { ALL_MARKETS, adminAccess, canAccessMarket } from './accessModel.js'
import { getDateBounds, safeTimeZone } from './dashboard.js'
import { recordAudit } from './events.js'
import {
  BOOKING_STATUSES,
  DAY,
  LIVE_STATUSES,
  MARKET_CODES,
  MARKET_META,
  VIEWS,
  buildDashboard,
  buildListView,
  buildQuickView,
  normalizeBooking,
  scopeRows,
} from './bookingsLogic.js'

// ADM-044 → ADM-050 — Booking Operations callables.
//
// Every screen reads the shared `bookings` collection (plus
// `booking_cancellations` for ADM-049); there is no admin_bookings /
// active_bookings / completed_bookings / cancelled_bookings / guest_bookings
// copy. Each call loads bounded sets that only need Firestore's automatic
// single-field indexes:
//   live   — every booking whose status can still be operational,
//   recent — bookings created inside the reporting period plus a look-back,
//   cancel — booking_cancellations created in the period (ADM-049),
// then derives every operational state server-side (bookingsLogic.js). When a
// set hits its cap the response says `truncated`, the signal to move these
// views onto materialized aggregates.

const LIVE_LIMIT = 4000
const RECENT_LIMIT = 5000
const CANCEL_LIMIT = 3000
const LINK_LIMIT = 1000
const LOOKBACK_DAYS = 60
const LIVE_QUERY_STATUSES = [...LIVE_STATUSES, 'in_progress', 'ongoing', 'started', 'awaiting_confirmation']
const PROVIDER_CATEGORIES = ['individual', 'spa', 'hotel']
const CLOSED_CASE = ['resolved', 'closed', 'cancelled', 'rejected']

const db = () => getFirestore()
const defined = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null))

// Authenticate, check the booking permission, and resolve which markets this
// admin may see for the requested market. Market access is enforced here,
// never trusted from the client.
async function resolveScope(request) {
  const uid = await requireAdmin(request, { permission: 'bookings.view' })
  const access = await adminAccess(uid)
  const market = String(request.data?.market || ALL_MARKETS).toUpperCase()
  if (market !== ALL_MARKETS && !MARKET_META[market]) {
    throw new HttpsError('invalid-argument', 'Unknown market.')
  }
  if (market !== ALL_MARKETS && !canAccessMarket(access, market)) {
    throw new HttpsError('permission-denied', 'You do not have access to this market.', { reason: 'market-denied' })
  }
  const unrestricted = access.markets.includes(ALL_MARKETS)
  const markets = market !== ALL_MARKETS ? [market] : unrestricted ? null : access.markets.filter((m) => MARKET_META[m])
  const finance = access.permissions.includes('payments.view')
  const cat = PROVIDER_CATEGORIES.includes(request.data?.providerType) ? request.data.providerType : null
  const timeZone = safeTimeZone(request.data?.timeZone)
  return { uid, access, market, markets, unrestricted, finance, providerCategory: cat, timeZone }
}

function periodFor(request, timeZone) {
  const { start, end } = getDateBounds(request.data?.dateRange || 'today', request.data?.customRange || null, timeZone)
  return { start: start.getTime(), end: end.getTime() }
}

async function read(query, limit, label) {
  try {
    const snap = await query.limit(limit).get()
    return { docs: snap.docs, truncated: snap.size >= limit }
  } catch (err) {
    logger.error(`bookings ${label} query failed`, err.message)
    throw new HttpsError('unavailable', 'Booking data could not be loaded. Try again shortly.')
  }
}

// Optional supporting collection: a missing collection or index degrades to
// "no extra data" rather than failing the screen.
async function readOptional(query, label) {
  try {
    return (await query.get()).docs
  } catch (err) {
    logger.warn(`bookings ${label} lookup failed`, err.message)
    return []
  }
}

// booking_cancellations is the source of truth for who cancelled, why, and
// the refund outcome; its values take precedence over the booking's copy.
function cancellationFields(id, c) {
  return defined({
    cancellationId: c.cancellationId ?? id,
    cancelledBy: c.cancelledBy,
    cancellationReason: c.cancellationReason,
    cancellationReasonCode: c.cancellationReasonCode,
    cancellationRequestedAt: c.requestedAt,
    cancelledAt: c.cancelledAt ?? c.createdAt,
    refundAmount: c.refundAmount,
    refundStatus: c.refundStatus,
    refundRequestedAt: c.refundRequestedAt,
    refundId: c.refundId,
    refundEligibility: c.refundEligibility,
    cancellationFee: c.cancellationFee,
    cancellationPolicySnapshot: c.cancellationPolicySnapshot ?? c.policySnapshot,
    clientNotified: c.clientNotified,
    providerNotified: c.providerNotified,
  })
}

async function loadBookings(periodStart, { live = true, recent = true, cancellations = false, guestLinks = false } = {}) {
  const col = db().collection('bookings')
  const none = { docs: [], truncated: false }
  const [liveSet, recentSet, cancelSet, links] = await Promise.all([
    live ? read(col.where('bookingStatus', 'in', LIVE_QUERY_STATUSES), LIVE_LIMIT, 'live') : none,
    recent ? read(col.where('createdAt', '>=', Timestamp.fromMillis(periodStart - LOOKBACK_DAYS * DAY)).orderBy('createdAt', 'desc'), RECENT_LIMIT, 'recent') : none,
    cancellations
      ? readOptional(db().collection('booking_cancellations').where('createdAt', '>=', Timestamp.fromMillis(periodStart - DAY)).limit(CANCEL_LIMIT), 'cancellations')
      : [],
    guestLinks ? readOptional(db().collection('guest_account_links').where('status', 'in', ['pending', 'conflict', 'PENDING', 'CONFLICT']).limit(LINK_LIMIT), 'guest links') : [],
  ])

  const raw = new Map()
  for (const doc of [...liveSet.docs, ...recentSet.docs]) raw.set(doc.id, doc.data())

  // Cancelled bookings created long before their cancellation are fetched by id.
  const byBooking = new Map(cancelSet.map((doc) => [doc.get('bookingId'), doc]).filter(([id]) => id))
  const missing = [...byBooking.keys()].filter((id) => !raw.has(id) && !id.includes('/'))
  for (let i = 0; i < missing.length; i += 300) {
    const docs = await db().getAll(...missing.slice(i, i + 300).map((id) => col.doc(id)))
    for (const doc of docs) if (doc.exists) raw.set(doc.id, doc.data())
  }
  for (const [bookingId, doc] of byBooking) {
    if (raw.has(bookingId)) raw.set(bookingId, { ...raw.get(bookingId), ...cancellationFields(doc.id, doc.data()) })
  }
  for (const doc of links) {
    const bookingId = doc.get('bookingId')
    if (raw.has(bookingId)) {
      raw.set(bookingId, { ...raw.get(bookingId), ...defined({ accountLinkStatus: String(doc.get('status') || '').toLowerCase(), accountLinkConflictReason: doc.get('conflictReason') }) })
    }
  }

  const bookings = [...raw].map(([id, data]) => normalizeBooking(id, data))
  return { bookings, truncated: liveSet.truncated || recentSet.truncated || cancelSet.length >= CANCEL_LIMIT }
}

// All-time status distribution via count() aggregates (equality filters only,
// so no composite index is required). Skipped when a provider-type filter or a
// multi-market restricted scope makes equality counting impossible.
async function statusCounts(scope) {
  if (scope.providerCategory || (scope.markets && scope.markets.length !== 1)) return null
  try {
    const counts = await Promise.all(
      BOOKING_STATUSES.map(async (status) => {
        let q = db().collection('bookings').where('bookingStatus', '==', status)
        if (scope.markets) q = q.where('countryCode', '==', scope.markets[0])
        return [status, (await q.count().get()).data().count]
      }),
    )
    return Object.fromEntries(counts)
  } catch (err) {
    logger.warn('booking status counts failed', err.message)
    return null
  }
}

function context(scope, request, extra = {}) {
  const meta = MARKET_META[scope.market]
  return {
    market: scope.market,
    marketName: meta?.name || 'All Markets',
    currency: meta?.currency || null,
    providerType: scope.providerCategory,
    dateRange: request.data?.dateRange || 'today',
    timeZone: scope.timeZone,
    generatedAt: new Date().toISOString(),
    canSeeFinancial: scope.finance,
    canExport: scope.access.permissions.includes('users.export'),
    canRevealContact: scope.access.permissions.includes('users.reveal_pii'),
    ...extra,
  }
}

const tzOffsetMins = (timeZone, at) => Math.round(getTimezoneOffset(timeZone, new Date(at)) / 60000)

/**
 * ADM-044 — Booking Management Dashboard.
 * data: { market, providerType?, dateRange, customRange?, timeZone? }
 */
export const adminGetBookingDashboard = onCall(async (request) => {
  const scope = await resolveScope(request)
  const now = Date.now()
  const period = periodFor(request, scope.timeZone)
  const [{ bookings, truncated }, counts] = await Promise.all([loadBookings(period.start), statusCounts(scope)])
  const rows = scopeRows(bookings, scope)

  const dashboard = buildDashboard(rows, {
    now,
    period,
    tzOffsetMins: tzOffsetMins(scope.timeZone, now),
    market: scope.market,
    finance: scope.finance,
    statusCounts: counts,
    truncated,
  })
  // Restricted admins only see the markets they hold.
  if (scope.markets) dashboard.markets = dashboard.markets.filter((m) => scope.markets.includes(m.id))
  return { context: context(scope, request, { authorizedMarkets: scope.markets || MARKET_CODES }), ...dashboard }
})

const LIST_PARAMS = ['tab', 'issue', 'q', 'pay', 'assign', 'src', 'settle', 'confirm', 'review', 'refund', 'by', 'account', 'contact', 'lifecycle', 'sort', 'page', 'pageSize']
const HISTORICAL = new Set(['completed', 'cancelled', 'guest'])

/**
 * ADM-045 Active · 046 Upcoming · 047 Ongoing · 048 Completed · 049 Cancelled · 050 Guest.
 * data: { view, market, providerType?, dateRange?, customRange?, timeZone?, export?, ...filters }
 * `export: true` returns every filtered row (requires users.export, audited).
 */
export const adminListBookings = onCall(async (request) => {
  const view = request.data?.view
  if (!VIEWS.includes(view)) throw new HttpsError('invalid-argument', 'Unknown booking view.')
  const scope = await resolveScope(request)
  const exportAll = request.data?.export === true
  if (exportAll && !scope.access.permissions.includes('users.export')) {
    throw new HttpsError('permission-denied', 'Your admin role does not allow exports.', { reason: 'missing-permission', permission: 'users.export' })
  }

  const now = Date.now()
  const period = HISTORICAL.has(view) ? periodFor(request, scope.timeZone) : null
  const { bookings, truncated } = await loadBookings(period?.start ?? now, {
    live: view !== 'completed' && view !== 'cancelled',
    recent: HISTORICAL.has(view),
    cancellations: view === 'cancelled',
    guestLinks: view === 'guest',
  })
  const rows = scopeRows(bookings, scope)
  const params = Object.fromEntries(LIST_PARAMS.map((k) => [k, request.data?.[k]]))

  const result = buildListView(view, rows, params, {
    now,
    tzOffsetMins: tzOffsetMins(scope.timeZone, now),
    period,
    finance: scope.finance,
    exportAll,
  })
  if (exportAll) {
    await recordAudit(request, {
      actorId: scope.uid,
      action: 'bookings.export',
      entityId: view,
      entityType: 'booking_view',
      metadata: { market: scope.market, providerType: scope.providerCategory, dateRange: request.data?.dateRange || null, rows: result.total, filters: defined(params) },
    })
  }
  return { context: context(scope, request, { truncated }), ...result }
})

const firstOf = (docs) => (docs[0] ? { id: docs[0].id, ...docs[0].data() } : null)

// Related records keyed by bookingId, merged so server-confirmed payment,
// funds, refund and review data win over the booking's own copy.
async function relatedRecords(bookingId) {
  const by = (name) => readOptional(db().collection(name).where('bookingId', '==', bookingId).limit(3), name)
  const [payments, escrow, cancellations, reviews, refunds, disputes, tickets, links] = await Promise.all([
    by('payments'),
    by('escrow_transactions'),
    by('booking_cancellations'),
    by('reviews'),
    by('refunds'),
    by('disputes'),
    readOptional(db().collectionGroup('support_tickets').where('bookingId', '==', bookingId).limit(3), 'support tickets'),
    by('guest_account_links'),
  ])
  return { payments, escrow, cancellations, reviews, refunds, disputes, tickets, links }
}

function mergeRelated(raw, r) {
  const p = firstOf(r.payments)
  const e = firstOf(r.escrow)
  const c = firstOf(r.cancellations)
  const rv = firstOf(r.reviews)
  const rf = firstOf(r.refunds)
  const l = firstOf(r.links)
  const open = (docs) => docs.some((d) => !CLOSED_CASE.includes(String(d.get('status') || '').toLowerCase()))
  return {
    ...raw,
    ...(p ? defined({ paymentStatus: p.status ?? p.paymentStatus, paymentMethod: p.method ?? p.paymentMethod, transactionId: p.transactionId ?? p.reference ?? p.id, platformFee: p.platformFee, providerAmount: p.providerAmount }) : {}),
    ...(e ? defined({ escrowStatus: e.status, escrowReleasedAt: e.releasedAt }) : {}),
    ...(c ? cancellationFields(c.id, c) : {}),
    ...(rv ? defined({ reviewId: rv.id, rating: rv.rating, reviewComment: rv.comment ?? rv.text, reviewStatus: rv.status, reviewReported: rv.reported }) : {}),
    ...(rf ? defined({ refundId: rf.id, refundStatus: rf.status, refundAmount: rf.amount, refundRequestedAt: rf.createdAt }) : {}),
    ...(l ? defined({ accountLinkStatus: String(l.status || '').toLowerCase(), accountLinkConflictReason: l.conflictReason, linkedClientId: l.clientId, accountLinkedAt: l.linkedAt }) : {}),
    ...(open(r.disputes) ? { hasOpenDispute: true } : {}),
    ...(open(r.tickets) ? { hasOpenSupportTicket: true } : {}),
  }
}

// Shared by the drawer and the guest reveal: load one booking and re-check
// the admin's market access for that specific booking.
async function loadAccessibleBooking(request, permission) {
  const bookingId = String(request.data?.bookingId || '').trim()
  if (!bookingId || bookingId.includes('/')) throw new HttpsError('invalid-argument', 'A booking ID is required.')
  const uid = await requireAdmin(request, { permission })
  const access = await adminAccess(uid)
  const snap = await db().collection('bookings').doc(bookingId).get()
  if (!snap.exists) throw new HttpsError('not-found', 'This booking no longer exists.')
  const raw = snap.data()
  const country = String(raw.countryCode || '').toUpperCase()
  const allowed = country ? canAccessMarket(access, country) : access.markets.includes(ALL_MARKETS)
  if (!allowed) throw new HttpsError('permission-denied', 'You do not have access to this booking.', { reason: 'market-denied' })
  return { uid, access, bookingId, raw }
}

/**
 * Drawer for ADM-045 → ADM-050. Revalidates market access for this booking
 * and returns permission-safe, view-specific details.
 * data: { bookingId, view? }
 */
export const adminGetBookingQuickView = onCall(async (request) => {
  const { access, bookingId, raw } = await loadAccessibleBooking(request, 'bookings.view')
  const finance = access.permissions.includes('payments.view')
  const r = await relatedRecords(bookingId)
  const booking = normalizeBooking(bookingId, mergeRelated(raw, r))

  let providerCancellations = null
  if (booking.status === 'cancelled' && booking.provider.id) {
    try {
      const q = db().collection('bookings').where('providerId', '==', booking.provider.id).where('bookingStatus', '==', 'cancelled')
      providerCancellations = (await q.count().get()).data().count
    } catch (err) {
      logger.warn('provider cancellation count failed', err.message)
    }
  }

  const caseRef = (d, extra) => ({ id: d.id, status: d.get('status') ?? null, ...extra(d) })
  return buildQuickView(booking, Date.now(), {
    view: request.data?.view,
    finance,
    providerCancellations,
    related: {
      disputes: r.disputes.map((d) => caseRef(d, (x) => ({ reason: x.get('reason') ?? x.get('category') ?? null }))),
      tickets: r.tickets.map((d) => caseRef(d, (x) => ({ subject: x.get('subject') ?? x.get('category') ?? null }))),
      paymentId: finance ? r.payments[0]?.id || null : null,
      refundId: finance ? r.refunds[0]?.id || booking.refundId || null : null,
      reviewId: r.reviews[0]?.id || booking.reviewId || null,
    },
    canRevealContact: access.permissions.includes('users.reveal_pii'),
  })
})

/**
 * ADM-050 — reveal a guest's full phone / email. Requires users.reveal_pii,
 * re-checks market access and writes an audit log for every reveal.
 * data: { bookingId, reason? }
 */
export const adminRevealGuestContact = onCall(async (request) => {
  const { uid, bookingId, raw } = await loadAccessibleBooking(request, 'users.reveal_pii')
  const booking = normalizeBooking(bookingId, raw)
  if (!booking.guest) throw new HttpsError('failed-precondition', 'This is not a guest booking.')
  await recordAudit(request, {
    actorId: uid,
    action: 'guest.contact_revealed',
    entityId: bookingId,
    entityType: 'booking',
    metadata: { reason: String(request.data?.reason || '').slice(0, 200) || null, countryCode: booking.countryCode },
  })
  return { phone: booking.guest.phone, email: booking.guest.email }
})
