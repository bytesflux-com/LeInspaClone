// ADM-014 Client Payments — an Admin view over the central `payments` collection
// (no admin_client_payments). Financial records are NEVER written here: the only write is an
// internal note. Payment status ≠ booking status ≠ escrow status ≠ refund status.
// The authoritative status is whatever the verified backend / payment-provider events recorded.
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import {
  CLIENT_FIELD, DAY_MS, addNote, adminCtx, clientBlock, clientDocsAny, cleanText, currencyOf, db, iso, listNotes, loadClient, lower, ms, num, paginate, tzOf,
} from './common.js'
import { escrowStateOf } from './bookings.js'

const TYPE = {
  booking: 'booking', booking_payment: 'booking', fee: 'fee', booking_fee: 'fee',
  membership: 'membership', subscription: 'membership', wallet: 'wallet', wallet_topup: 'wallet', topup: 'wallet', refund: 'refund', booking_refund: 'refund',
}
const TYPE_LABEL = { booking: 'Booking Payment', fee: 'Booking Platform Fee', membership: 'Membership Payment', wallet: 'Wallet Top-up', refund: 'Booking Refund' }

export function paymentStatusOf(raw) {
  const s = lower(raw)
  if (['successful', 'success', 'succeeded', 'completed', 'paid', 'captured'].includes(s)) return 'successful'
  if (['failed', 'declined', 'error', 'cancelled'].includes(s)) return 'failed'
  if (['refunded', 'partially_refunded'].includes(s)) return 'refunded'
  if (s === 'reversed') return 'reversed'
  return 'pending'
}

export function methodOf(p) {
  const raw = lower(p.method ?? p.paymentMethod)
  const brand = lower(p.cardBrand)
  const last4 = p.cardLast4 || p.last4
  const kind = raw.includes('mpesa') || raw.includes('m-pesa') ? 'mpesa'
    : brand === 'visa' || raw === 'visa' ? 'visa'
    : brand === 'mastercard' || raw === 'mastercard' ? 'mastercard'
    : raw === 'card' ? 'visa' : raw === 'wallet' ? 'wallet' : raw.includes('bank') ? 'bank' : raw === 'original' || raw === 'original_method' ? 'original' : 'mpesa'
  const label = { mpesa: 'M-PESA', wallet: 'Lé Inspa Wallet', bank: 'Bank transfer', original: 'Original Method' }[kind]
    || `${kind === 'visa' ? 'Visa' : 'Mastercard'}${last4 ? ` •••• ${last4}` : ''}`
  return { kind, label }
}

export function normalizePayment(d) {
  const p = d.data()
  const type = TYPE[lower(p.type ?? p.paymentType)]
  if (!type) return null // withdrawals, referral commissions … do not belong to a client's payment history
  const bookingId = p.bookingNumber || p.bookingId || null
  const tier = lower(p.membershipTier || p.planName || '')
  const title = type === 'booking' ? p.serviceName || 'Booking Payment'
    : type === 'membership' ? `${tier.includes('exec') ? 'Executive' : 'Premium'} Membership`
    : type === 'wallet' ? 'Wallet Top Up' : type === 'refund' ? 'Booking Refund' : 'Payment Fee'
  const subtitle = bookingId && type !== 'wallet' && type !== 'membership' ? `Booking #${bookingId}` : type === 'membership' ? 'Membership Renewal' : type === 'wallet' ? 'Client Wallet' : 'Platform Fee'
  return {
    id: p.paymentNumber || d.id,
    docId: d.id,
    txn: p.transactionId || p.txn || d.id.slice(0, 12).toUpperCase(),
    type,
    typeLabel: TYPE_LABEL[type],
    title,
    subtitle,
    image: p.serviceImage || null,
    bookingId,
    bookingDocId: p.bookingId || null,
    provider: p.providerName || null,
    status: type === 'refund' && paymentStatusOf(p.status) === 'successful' ? 'refunded' : paymentStatusOf(p.status),
    method: methodOf(p),
    amount: num(p.amount),
    createdAt: iso(p.createdAt),
    escrow: type === 'booking' ? escrowStateOf(p.escrowStatus) : null,
    escrowId: p.escrowId || null,
    breakdown: type === 'booking' && p.serviceAmount != null ? { service: num(p.serviceAmount), fee: num(p.bookingFee), discount: num(p.discount) } : null,
    refund: p.refundId || p.refundAmount != null || type === 'refund'
      ? { reason: p.refundReason || 'Booking cancellation', requestedAt: iso(p.refundRequestedAt ?? p.createdAt), amount: num(p.refundAmount ?? p.amount), linkedId: p.refundId || null }
      : null,
    _raw: { reference: p.processorReference || p.providerReference || p.reference || '', confirmedAt: p.confirmedAt, escrowAmount: p.escrowAmount },
  }
}
const publicPayment = ({ _raw, docId, bookingDocId, ...rest }) => rest

export async function paymentsOf(user, cap = 1000) {
  const docs = await clientDocsAny('payments', user, cap, CLIENT_FIELD)
  return docs.map(normalizePayment).filter(Boolean).sort((a, b) => ms(b.createdAt) - ms(a.createdAt))
}

function summarize(list) {
  const sum = (arr) => arr.reduce((s, p) => s + p.amount, 0)
  const paid = list.filter((p) => p.status === 'successful' && p.type !== 'refund')
  const pending = list.filter((p) => p.status === 'pending')
  const failed = list.filter((p) => p.status === 'failed')
  const refunds = list.filter((p) => p.type === 'refund')
  const settled = paid.length + failed.length
  const now = Date.now()
  const inWindow = (from, to) => sum(paid.filter((p) => now - ms(p.createdAt) >= from * DAY_MS && now - ms(p.createdAt) < to * DAY_MS))
  const last = inWindow(0, 30)
  const prev = inWindow(30, 60)
  return {
    total: list.length,
    totalPaid: sum(paid),
    totalPaidDelta: prev > 0 ? Math.round(((last - prev) / prev) * 1000) / 10 : 0,
    successful: paid.length,
    successRate: settled ? Math.round((paid.length / settled) * 1000) / 10 : 0,
    pending: pending.length,
    pendingAmount: sum(pending),
    refundedAmount: sum(refunds),
    refundCount: refunds.length,
    failed: failed.length,
    failureRate: settled ? Math.round((failed.length / settled) * 1000) / 10 : 0,
    refunded: list.filter((p) => p.status === 'refunded').length,
  }
}

const SORT = {
  newest: (a, b) => ms(b.createdAt) - ms(a.createdAt),
  oldest: (a, b) => ms(a.createdAt) - ms(b.createdAt),
  amount_high: (a, b) => b.amount - a.amount,
  amount_low: (a, b) => a.amount - b.amount,
}
const methodOk = (p, m) => (m === 'card' ? ['visa', 'mastercard'].includes(p.method.kind) : p.method.kind === m)
function dateOk(p, date) {
  if (!date) return true
  const t = ms(p.createdAt)
  const now = Date.now()
  if (date === 'year') return new Date(t).getUTCFullYear() === new Date(now).getUTCFullYear()
  const days = { '7d': 7, '30d': 30, '90d': 90 }[date]
  return days ? now - t <= days * DAY_MS && t <= now + DAY_MS : true
}

export const adminGetClientPayments = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'payments.view' })
  const p = request.data || {}
  const user = await loadClient(ctx, p.clientId, p.market)
  const all = await paymentsOf(user)
  const needle = String(p.q || '').trim().toLowerCase()
  let rows = all.filter((x) => {
    if (p.status && p.status !== 'all' && x.status !== p.status) return false
    if (!dateOk(x, p.date)) return false
    if (p.ptype && x.type !== p.ptype) return false
    if (p.method && !methodOk(x, p.method)) return false
    if (p.esc && x.escrow !== p.esc) return false
    if (p.refund && !x.refund) return false
    return !needle || [x.id, x.txn, x.bookingId || '', x.title].some((v) => String(v).toLowerCase().includes(needle))
  })
  rows = [...rows].sort(SORT[p.sort] || SORT.newest)
  const page = paginate(rows, p, 8)
  return { client: clientBlock(user), summary: summarize(all), ...page, items: page.items.map(publicPayment) }
})

// Processor references are never shown in full.
const maskRef = (ref) => (ref ? `${String(ref).slice(0, 9)}…` : '—')

async function findPayment(user, paymentId) {
  const id = String(paymentId ?? '')
  const gone = new HttpsError('not-found', 'Payment not found or outside your authorised markets.')
  if (!/^[\w.-]{1,128}$/.test(id)) throw gone
  let doc = await db().collection('payments').doc(id).get()
  if (!doc.exists) doc = (await db().collection('payments').where('paymentNumber', '==', id).limit(1).get()).docs[0]
  if (!doc?.exists || ![user.id, user.get('clientCode')].includes(doc.get(CLIENT_FIELD))) throw gone
  return doc
}

async function timelineOf(doc, p) {
  const events = await doc.ref.collection('events').limit(60).get().catch(() => null)
  if (events && !events.empty) {
    return events.docs.map((e) => ({ id: e.id, at: iso(e.get('createdAt')), text: e.get('text') || e.get('type'), tone: e.get('tone') || 'ok' })).filter((e) => e.at).sort((a, b) => ms(a.at) - ms(b.at))
  }
  const d = doc.data()
  const out = []
  const add = (id, at, text, tone = 'ok') => at && out.push({ id, at: iso(at), text, tone })
  add('e1', d.createdAt, p.type === 'refund' ? 'Refund requested' : 'Payment initiated')
  add('e2', d.authorizedAt, 'Payment authorization received')
  add('e3', d.verifiedAt ?? d.confirmedAt, 'Payment verified')
  add('e4', d.failedAt, d.failureReason || 'Payment failed', 'bad')
  add('e5', d.recordedAt, p.type === 'booking' ? 'Booking payment recorded' : p.type === 'membership' ? 'Membership payment recorded' : 'Payment recorded')
  add('e6', d.escrowHeldAt, 'Funds held in escrow', 'escrow')
  add('e7', d.escrowReleasedAt, 'Escrow released to provider')
  return out.sort((a, b) => ms(a.at) - ms(b.at))
}

export const adminGetPaymentPreview = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'payments.view' })
  const q = request.data || {}
  const user = await loadClient(ctx, q.clientId, q.market)
  const doc = await findPayment(user, q.paymentId)
  const p = normalizePayment(doc)
  if (!p) throw new HttpsError('not-found', 'Payment not found or outside your authorised markets.')
  const cur = doc.get('currency') || currencyOf(user.get('countryCode'))

  let refund = null
  if (p.refund) {
    const r = p.refund.linkedId ? await db().collection('refunds').doc(p.refund.linkedId).get().catch(() => null) : null
    refund = {
      id: r?.exists ? r.get('refundNumber') || r.id : p.refund.linkedId || `RFD-${doc.id.slice(0, 6).toUpperCase()}`,
      amount: r?.exists ? num(r.get('amount'), p.refund.amount) : p.refund.amount,
      status: r?.exists ? String(r.get('status') || 'Processing').replace(/^./, (c) => c.toUpperCase()) : p.status === 'refunded' ? 'Completed' : 'Processing',
      reason: r?.exists ? r.get('reason') || p.refund.reason : p.refund.reason,
      requestedAt: r?.exists ? iso(r.get('createdAt')) : p.refund.requestedAt,
      processedBy: r?.exists ? r.get('processedByName') || 'Admin / System' : 'Admin / System',
    }
  }
  const b = p.breakdown
  const breakdown = p.type === 'booking' && b
    ? { rows: [['Service Amount', b.service], ['Booking Platform Fee', b.fee], ['Discount', b.discount ? -b.discount : null]], total: p.amount, totalLabel: 'Total Charged' }
    : p.type === 'refund' ? { rows: [], total: p.amount, totalLabel: 'Refund Amount' }
    : p.type === 'membership' ? { rows: [['Plan Amount', p.amount]], total: p.amount, totalLabel: 'Total Charged' }
    : { rows: [], total: p.amount, totalLabel: 'Total Charged' }

  const confirmed = ['successful', 'refunded'].includes(p.status) ? iso(p._raw.confirmedAt) : null
  const notes = await listNotes(user.id, 'payment', doc.id)
  return {
    ...publicPayment(p),
    currency: cur,
    timeZone: tzOf(user.get('countryCode')),
    asOf: new Date().toISOString(),
    client: { id: clientBlock(user).id, name: user.get('fullName') || 'Client' },
    reference: maskRef(p._raw.reference),
    confirmedAt: confirmed,
    breakdown,
    escrowDetail: p.type === 'booking' && p.escrow ? { status: p.escrow, amount: num(p._raw.escrowAmount, p.amount), id: p.escrowId } : null,
    refund,
    timeline: await timelineOf(doc, p),
    notes: notes.map((n) => ({ id: n.id, author: n.author, text: n.text, createdAt: n.createdAt })),
  }
})

// Internal note only — it never touches the financial record.
export const adminAddPaymentNote = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'payments.view' })
  const user = await loadClient(ctx, request.data?.clientId)
  const doc = await findPayment(user, request.data?.paymentId)
  const entry = await addNote(request, ctx, user, { scope: 'payment', refId: doc.id, text: cleanText(request.data?.text, { max: 1000, label: 'Note' }) })
  return { id: entry.id, author: entry.author, text: entry.text, createdAt: entry.createdAt }
})
