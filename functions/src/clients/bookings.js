// ADM-013 Client Bookings — an Admin view over the central `bookings` collection
// (no admin_client_bookings). Booking status, payment status and escrow status stay independent.
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import {
  CLIENT_FIELD, DAY_MS, adminCtx, clientBlock, clientDocsAny, currencyOf, db, iso, listNotes, loadClient, lower, ms, num, paginate, tzOf,
} from './common.js'

const SOURCE = { app: 'app', mobile_app: 'app', mobile: 'app', website: 'website', web: 'website', guest: 'guest', walkin: 'walkin', walk_in: 'walkin', manual: 'walkin' }
const PROVIDER_LABEL = { spa: 'Spa & Wellness Center', hotel: 'Hotel & Wellness Resort' }

export function bookingStatusOf(b) {
  const s = lower(b.bookingStatus)
  if (lower(b.disputeStatus) === 'open' || s === 'disputed') return 'disputed'
  if (['pending', 'negotiation', 'accepted'].includes(s)) return 'pending'
  if (s === 'confirmed') return 'confirmed'
  if (['on_the_way', 'arrived', 'service_in_progress', 'awaiting_client_confirmation', 'ongoing'].includes(s)) return 'ongoing'
  if (s === 'completed') return 'completed'
  if (['cancelled', 'canceled', 'expired'].includes(s)) return 'cancelled'
  return 'pending'
}
export function paymentStateOf(raw) {
  const s = lower(raw)
  if (['paid', 'success', 'succeeded', 'successful', 'completed', 'captured'].includes(s)) return 'paid'
  if (['failed', 'declined', 'error'].includes(s)) return 'failed'
  if (['refunding', 'refund_pending', 'refund_processing'].includes(s)) return 'refunding'
  if (['refunded', 'partially_refunded'].includes(s)) return 'refunded'
  return 'pending'
}
export const escrowStateOf = (raw) => (['held', 'released', 'refunded'].includes(lower(raw)) ? lower(raw) : null)

export function normalizeBooking(d) {
  const b = d.data()
  const type = lower(b.providerType)
  const providerType = type === 'spa' ? 'spa' : type.startsWith('hotel') ? 'hotel' : 'provider'
  const listPrice = num(b.totalPrice ?? b.listedPrice)
  const agreed = b.agreedPrice != null ? num(b.agreedPrice) : null
  const source = b.guestBooking === true ? 'guest' : SOURCE[lower(b.bookingSource)] || 'app'
  return {
    id: b.bookingNumber || d.id,
    docId: d.id,
    service: b.serviceName || 'Service',
    provider: b.providerName || '',
    providerId: b.providerId || null,
    serviceId: b.serviceId || null,
    providerType,
    providerLabel: PROVIDER_LABEL[providerType] || b.specialistRole || 'Independent Provider',
    specialist: { name: b.specialistName || b.providerName || '', role: b.specialistRole || '' },
    scheduledAt: iso(b.scheduledAt ?? b.scheduledDate ?? b.createdAt),
    durationMins: num(b.durationMinutes ?? b.duration, 60),
    city: b.city || '',
    countryName: b.countryName || '',
    branch: b.branchName || (b.providerName && b.city ? `${b.providerName} - ${b.city}` : ''),
    price: agreed ?? listPrice,
    listPrice,
    negotiated: agreed != null && agreed !== listPrice,
    status: bookingStatusOf(b),
    payment: paymentStateOf(b.paymentStatus),
    escrow: escrowStateOf(b.escrowStatus),
    source,
    image: b.serviceImage || null,
    paymentId: b.paymentId || null,
    createdAt: iso(b.createdAt),
  }
}

// Admins without payment access never receive payment / escrow fields.
export const redactBooking = (b, finance) => {
  if (finance) return b
  const { payment, escrow, paymentId, ...safe } = b
  return safe
}

const TAB = {
  upcoming: (b) => b.status === 'confirmed' || b.status === 'pending',
  ongoing: (b) => b.status === 'ongoing',
  completed: (b) => b.status === 'completed',
  cancelled: (b) => b.status === 'cancelled',
  disputed: (b) => b.status === 'disputed',
}
const SORT = {
  newest: (a, b) => ms(b.scheduledAt) - ms(a.scheduledAt),
  oldest: (a, b) => ms(a.scheduledAt) - ms(b.scheduledAt),
  price_high: (a, b) => b.price - a.price,
  price_low: (a, b) => a.price - b.price,
}
function dateOk(b, date) {
  if (!date) return true
  const t = ms(b.scheduledAt)
  const now = Date.now()
  if (date === 'upcoming') return t >= now
  if (date === 'year') return new Date(t).getUTCFullYear() === new Date(now).getUTCFullYear()
  const days = { '7d': 7, '30d': 30, '90d': 90 }[date]
  return days ? now - t <= days * DAY_MS && t <= now + DAY_MS : true
}

export function summarize(list) {
  const count = (fn) => list.filter(fn).length
  const total = list.length
  const upcoming = count(TAB.upcoming)
  const completed = count(TAB.completed)
  const cancelled = count(TAB.cancelled)
  const now = Date.now()
  const next = list.filter((b) => TAB.upcoming(b) && ms(b.scheduledAt) > now).map((b) => ms(b.scheduledAt)).sort((a, b) => a - b)[0]
  const days = next ? Math.max(0, Math.round((next - now) / DAY_MS)) : null
  return {
    total, upcoming, ongoing: count(TAB.ongoing), completed, cancelled, disputed: count(TAB.disputed),
    nextLabel: upcoming ? (days === null ? 'Awaiting schedule' : days === 0 ? 'Next today' : `Next in ${days} ${days === 1 ? 'day' : 'days'}`) : 'None scheduled',
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    cancellationRate: total ? Math.round((cancelled / total) * 100) : 0,
  }
}

export async function bookingsOf(user, cap = 1000) {
  const docs = await clientDocsAny('bookings', user, cap, CLIENT_FIELD)
  return docs.map(normalizeBooking).sort(SORT.newest)
}

export const adminGetClientBookings = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'bookings.view' })
  const p = request.data || {}
  const user = await loadClient(ctx, p.clientId, p.market)
  const finance = ctx.perms.finance
  const all = await bookingsOf(user)
  const needle = String(p.q || '').trim().toLowerCase()
  let rows = all.filter((b) => {
    if (p.status && p.status !== 'all' && !TAB[p.status]?.(b)) return false
    if (!dateOk(b, p.date)) return false
    if (p.ptype && b.providerType !== p.ptype) return false
    if (p.src && b.source !== p.src) return false
    if (finance && p.pay && b.payment !== p.pay) return false
    if (finance && p.esc && b.escrow !== p.esc) return false
    if (p.neg && !b.negotiated) return false
    if (p.guest && b.source !== 'guest') return false
    return !needle || [b.id, b.service, b.provider, b.specialist.name].some((v) => String(v).toLowerCase().includes(needle))
  })
  rows = [...rows].sort(SORT[p.sort] || SORT.newest)
  const page = paginate(rows, p, 6)
  return { client: clientBlock(user), summary: summarize(all), ...page, items: page.items.map((b) => redactBooking(b, finance)) }
})

async function findBooking(user, bookingId) {
  const id = String(bookingId ?? '')
  if (!/^[\w.-]{1,128}$/.test(id)) throw new HttpsError('not-found', 'Booking not found or outside your authorised markets.')
  let doc = await db().collection('bookings').doc(id).get()
  if (!doc.exists) doc = (await db().collection('bookings').where('bookingNumber', '==', id).limit(1).get()).docs[0]
  const owner = doc?.exists ? doc.get(CLIENT_FIELD) : null
  if (!doc?.exists || ![user.id, user.get('clientCode')].includes(owner)) throw new HttpsError('not-found', 'Booking not found or outside your authorised markets.')
  return doc
}

// Timeline entries come from the booking's own event records, falling back to its recorded timestamps.
async function timelineOf(doc, row, cur) {
  const b = doc.data()
  const events = await doc.ref.collection('events').limit(60).get().catch(() => null)
  if (events && !events.empty) {
    return events.docs.map((e) => ({ id: e.id, at: iso(e.get('createdAt')), text: e.get('text') || e.get('type') })).filter((e) => e.at).sort((a, b) => ms(b.at) - ms(a.at))
  }
  const money = (n) => `${cur} ${Number(n).toLocaleString('en-US')}`
  const t = []
  const add = (id, at, text) => at && t.push({ id, at: iso(at), text })
  add('t1', b.createdAt, 'Booking created')
  add('t2', b.paidAt, `Payment received — ${money(row.price)}`)
  add('t3', b.confirmedAt, 'Confirmed by provider')
  add('t4', b.startedAt, 'Service started')
  add('t5', b.completedAt, 'Service marked complete')
  add('t6', b.serviceConfirmedAt, 'Client confirmed service received')
  add('t7', b.escrowReleasedAt, 'Escrow released to provider')
  add('t8', b.cancelledAt, 'Booking cancelled')
  return t.sort((a, c) => ms(c.at) - ms(a.at))
}

export const adminGetBookingPreview = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'bookings.view' })
  const p = request.data || {}
  const user = await loadClient(ctx, p.clientId, p.market)
  const doc = await findBooking(user, p.bookingId)
  const row = normalizeBooking(doc)
  const b = doc.data()
  const finance = ctx.perms.finance
  const cur = b.currency || currencyOf(user.get('countryCode'))

  const [cancel, dispute, notes] = await Promise.all([
    row.status === 'cancelled' ? db().collection('booking_cancellations').where('bookingId', '==', doc.id).limit(1).get() : null,
    row.status === 'disputed' ? db().collection('disputes').where('bookingId', '==', doc.id).limit(1).get() : null,
    listNotes(user.id, 'booking', doc.id),
  ])
  const c = cancel?.docs[0]
  const dsp = dispute?.docs[0]
  let paymentDetail
  if (finance && row.paymentId) {
    const pay = await db().collection('payments').doc(row.paymentId).get()
    if (pay.exists) {
      paymentDetail = {
        id: pay.get('paymentNumber') || pay.id,
        method: pay.get('methodLabel') || pay.get('method') || '',
        amount: num(pay.get('amount'), row.price),
        bookingFee: num(pay.get('bookingFee') ?? b.bookingFee),
        paidAt: iso(pay.get('confirmedAt') ?? pay.get('createdAt')),
      }
    }
  }
  return {
    ...redactBooking(row, finance),
    client: { id: clientBlock(user).id, name: user.get('fullName') || 'Client' },
    currency: cur,
    timeZone: tzOf(user.get('countryCode')),
    asOf: new Date().toISOString(),
    timeline: await timelineOf(doc, row, cur),
    ...(finance && paymentDetail ? { paymentDetail } : {}),
    cancellation: c ? { id: c.get('cancellationNumber') || c.id, cancelledBy: c.get('cancelledBy') || '', reason: c.get('reason') || '', refundAmount: finance ? num(c.get('refundAmount')) : null, refundStatus: c.get('refundStatus') || '' } : null,
    dispute: dsp ? { id: dsp.get('disputeNumber') || dsp.id, reason: dsp.get('reason') || '', status: dsp.get('status') || '' } : null,
    notes: notes.map((n) => ({ id: n.id, author: n.author, createdAt: n.createdAt, text: n.text })),
  }
})
