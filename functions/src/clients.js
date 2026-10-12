import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { adminAccess, canAccessMarket } from './accessModel.js'
import { auditEntry, db, queueNotification, rethrow } from './providerAdminContext.js'
import { readAll } from './platformLoaders.js'
import { countryCodeOf, lowerStatus, millis } from './platformData.js'
import {
  CLIENT_ACCOUNT_TYPES,
  MARKET_INFO,
  bookingSummary,
  buildClientDashboard,
  buildClientGrowth,
  clientActivity,
  clientAggregates,
  clientBlock,
  clientBookingRow,
  clientPaymentRow,
  currencyOf,
  directoryRow,
  filterClients,
  isClientType,
  iso,
  listItem,
  mergeClient,
  paymentPreview,
  paymentSummary,
  queryBookings,
  queryClients,
  queryPayments,
  queryWallet,
  redactBooking,
  walletHistory,
  walletListItem,
  walletRow,
  walletSummary,
} from './clientLogic.js'
import {
  accountView,
  clientCases,
  loyaltyView,
  membershipView,
  normalizeRestriction,
  planAccountAction,
  planMembershipChange,
  profileView,
  queryReferrals,
  referralRecords,
  restrictionFlags,
  supportCasePreview,
  supportView,
} from './clientCaseLogic.js'

// ADM-010 → ADM-019 — Client Management backend. Reads the client app's own
// records (see clientLogic.js); admin-only records are account_restrictions,
// account_actions, admin_notes and membership_admin_events (all keyed by
// clientId) plus audit_logs. Every call re-checks the admin, the permission
// and the client's market; the `market` the browser sends is only a filter.

const ALL = 'ALL'

async function clientScope(request, { permission = 'users.view', fresh = false } = {}) {
  const uid = await requireAdmin(request, { permission, fresh })
  const access = await adminAccess(uid)
  const has = (p) => access.permissions.includes(p)
  return {
    uid,
    access,
    actor: { id: uid, name: access.fullName || 'Admin', role: access.roleName || null },
    perms: {
      finance: has('payments.view'),
      safety: has('safety.manage'),
      manage: has('users.suspend'),
      deactivate: has('users.deactivate'),
      superAdmin: access.roleId === 'super_admin',
      manageMembership: has('memberships.manage'),
      reveal: has('identity.reveal_sensitive'),
      respond: has('support.respond'),
      bookings: has('bookings.view'),
    },
  }
}

const requireId = (v, label = 'clientId') => {
  const id = String(v || '').trim()
  if (!id || id.includes('/') || id.length > 200) throw new HttpsError('invalid-argument', `A valid ${label} is required.`)
  return id
}
const marketsOf = (access) => (access.markets.includes(ALL) ? null : access.markets)
const inScope = (access, country) => access.markets.includes(ALL) || (country && canAccessMarket(access, country))

async function rows(collection, where, limit = 2000) {
  return (await readAll(collection, { where, limit })).rows
}

/** One client (users + customer_profiles), scope-checked. */
async function loadClient(clientId, access) {
  const [u, p] = await Promise.all([db().collection('users').doc(clientId).get(), db().collection('customer_profiles').doc(clientId).get()])
  const user = u.exists ? u.data() : null
  const profile = p.exists ? p.data() : null
  if (!profile && (!user || !isClientType(user.accountType))) throw new HttpsError('not-found', 'Client not found or outside your authorised markets.')
  const c = mergeClient(clientId, { user: user || {}, profile: profile || {} })
  if (!inScope(access, c.country)) throw new HttpsError('not-found', 'Client not found or outside your authorised markets.')
  return { c, user: user || {}, profile: profile || {}, refs: { user: u.exists ? u.ref : null, profile: p.exists ? p.ref : null } }
}

/** Every client the admin may see, with directory aggregates. */
async function loadClientRows(access, { now = Date.now() } = {}) {
  const [users, profiles, bookings, payments, disputes, tickets, safety] = await Promise.all([
    rows('users', [['accountType', 'in', CLIENT_ACCOUNT_TYPES]], 10000),
    rows('customer_profiles', [], 10000),
    rows('bookings', [], 10000),
    rows('payments', [], 10000),
    rows('disputes', [], 2000),
    rows('support_tickets', [], 2000),
    rows('safety_reports', [], 2000),
  ])
  const profileById = new Map(profiles.map((p) => [p.id, p]))
  const seen = new Set()
  const clients = []
  for (const u of users) {
    seen.add(u.id)
    clients.push(mergeClient(u.id, { user: u, profile: profileById.get(u.id) || {} }, now))
  }
  for (const p of profiles) if (!seen.has(p.id)) clients.push(mergeClient(p.id, { profile: p }, now))
  const scoped = clients.filter((c) => inScope(access, c.country))
  const agg = clientAggregates({ bookings: bookings.filter((b) => lowerStatus(b.bookingStatus ?? b.status) !== 'draft'), payments, disputes, tickets, safety }, now)
  return { rows: scoped.map((c) => directoryRow(c, agg.get(c.id) || {}, now)), bookings, tickets }
}

/** Everything one client screen needs (finance sources only for Finance-permitted admins). */
async function loadBundle(clientId, { finance = false, cases = true, account = false, membership = false, referrals = false } = {}) {
  const q = (col, field, limit = 2000) => rows(col, [[field, '==', clientId]], limit)
  const [bookings, payments, wallet, walletTx, subs, tickets, supportCases, disputesBy, disputesAgainst, safety, restrictions, actions, notes, notifications, memberEvents, referred] = await Promise.all([
    q('bookings', 'customerId', 3000),
    finance || membership ? q('payments', 'customerId', 3000) : [],
    finance ? db().collection('wallets').doc(clientId).get() : null,
    finance ? q('wallet_transactions', 'userId', 3000) : [],
    q('subscriptions', 'userId', 300),
    cases ? q('support_tickets', 'userId', 300) : [],
    cases ? q('support_cases', 'userId', 300) : [],
    cases ? q('disputes', 'reporterId', 200) : [],
    cases ? q('disputes', 'againstId', 200) : [],
    cases ? q('safety_reports', 'clientId', 200) : [],
    q('account_restrictions', 'clientId', 300),
    account ? q('account_actions', 'clientId', 300) : [],
    q('admin_notes', 'clientId', 300),
    account ? q('notifications', 'userId', 50) : [],
    membership ? q('membership_admin_events', 'clientId', 100) : [],
    referrals ? q('users', 'referredBy', 500) : [],
  ])
  return {
    bookings: bookings.filter((b) => lowerStatus(b.bookingStatus ?? b.status) !== 'draft'),
    payments,
    wallet: wallet?.exists ? wallet.data() : null,
    walletTx,
    subs: subs.filter((s) => isClientType(s.accountType) || /client/i.test(s.planName || '')),
    tickets,
    supportCases,
    disputes: [...disputesBy, ...disputesAgainst.filter((d) => !disputesBy.some((x) => x.id === d.id))],
    safety,
    restrictions: restrictions.map((r) => normalizeRestriction(r.id, r)).sort((a, b) => (Date.parse(b.startedAt) || 0) - (Date.parse(a.startedAt) || 0)),
    actions: actions.sort((a, b) => (millis(b.at ?? b.createdAt) || 0) - (millis(a.at ?? a.createdAt) || 0)),
    notes,
    notifications: notifications.sort((a, b) => (millis(b.createdAt) || 0) - (millis(a.createdAt) || 0)),
    memberEvents,
    referred,
  }
}

const notesFor = (notes, context, refId = null) =>
  notes
    .filter((n) => n.context === context && (refId == null || n.refId === refId))
    .sort((a, b) => (millis(b.createdAt) || 0) - (millis(a.createdAt) || 0))
    .map((n) => ({ id: n.id, author: n.authorName || 'Admin', text: n.note, note: n.note, createdAt: iso(millis(n.createdAt)) }))

const bookingRowsOf = (bundle, c) => bundle.bookings.map((b) => clientBookingRow(b.id, b, { countryName: c.countryName })).sort((a, b) => (Date.parse(b.scheduledAt) || 0) - (Date.parse(a.scheduledAt) || 0))
const paymentRowsOf = (bundle, bookingRows) => {
  const byId = new Map(bookingRows.map((b) => [b.id, b]))
  return bundle.payments.map((p) => clientPaymentRow(p.id, p, byId)).sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
}
const walletRowsOf = (bundle) => bundle.walletTx.filter((t) => !t.walletType || /customer/i.test(t.walletType)).map((t) => walletRow(t.id, t)).sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
const casesOf = (bundle, clientId) => clientCases({ tickets: bundle.tickets, supportCases: bundle.supportCases, disputes: bundle.disputes, safety: bundle.safety }, clientId)

async function addNote(request, { permission = 'users.view', context, refId = null, text }) {
  const s = await clientScope(request, { permission })
  const clientId = requireId(request.data?.clientId)
  const note = String(text || '').trim()
  if (note.length < 3 || note.length > 2000) throw new HttpsError('invalid-argument', 'Notes must be between 3 and 2,000 characters.')
  await loadClient(clientId, s.access)
  const now = Date.now()
  const ref = db().collection('admin_notes').doc()
  const batch = db().batch()
  batch.set(ref, { clientId, context, refId, note, authorId: s.uid, authorName: s.actor.name, createdAt: now })
  auditEntry(batch, request, { actorId: s.uid, action: 'client.note_added', entityId: clientId, entityType: 'client', metadata: { context, refId } })
  await batch.commit()
  return { id: ref.id, author: s.actor.name, text: note, note, createdAt: iso(now) }
}

// ================================================================= ADM-010 dashboard

export const adminGetClientDashboard = onCall(async (request) => {
  const s = await clientScope(request)
  const market = String(request.data?.market || ALL).toUpperCase()
  if (market !== ALL && !inScope(s.access, market)) throw new HttpsError('permission-denied', 'You are not authorized for this market.')
  try {
    const now = Date.now()
    const [{ rows: clientRows, bookings, tickets }, restrictions] = await Promise.all([loadClientRows(s.access, { now }), rows('account_restrictions', [['status', '==', 'active']], 2000)])
    const ids = new Set(clientRows.filter((c) => market === ALL || c.country === market).map((c) => c.id))
    const openTickets = tickets.filter((t) => ids.has(t.userId) && !['closed', 'resolved'].includes(lowerStatus(t.status))).length
    return buildClientDashboard({ rows: clientRows, bookings, market, range: request.data?.range || '30d', now, restrictions: restrictions.filter((r) => r.clientId), openTickets })
  } catch (err) {
    rethrow('adminGetClientDashboard', err, 'The client dashboard could not be loaded.')
  }
})

export const adminGetClientGrowth = onCall(async (request) => {
  const s = await clientScope(request)
  const market = String(request.data?.market || ALL).toUpperCase()
  if (market !== ALL && !inScope(s.access, market)) throw new HttpsError('permission-denied', 'You are not authorized for this market.')
  try {
    const { rows: clientRows } = await loadClientRows(s.access)
    return buildClientGrowth({ rows: clientRows, market, window: request.data?.window || 'monthly' })
  } catch (err) {
    rethrow('adminGetClientGrowth', err, 'Client growth could not be loaded.')
  }
})

// ================================================================= ADM-011 directory

export const adminListClients = onCall(async (request) => {
  const s = await clientScope(request)
  try {
    const { rows: clientRows } = await loadClientRows(s.access)
    return queryClients(clientRows, request.data || {}, { canSeeSafety: s.perms.safety })
  } catch (err) {
    rethrow('adminListClients', err, 'Clients could not be loaded.')
  }
})

export const adminGetClientPreview = onCall(async (request) => {
  const s = await clientScope(request)
  const clientId = requireId(request.data?.clientId)
  try {
    const { c } = await loadClient(clientId, s.access)
    const bundle = await loadBundle(clientId, { finance: s.perms.finance })
    const bookings = bookingRowsOf(bundle, c)
    const cases = casesOf(bundle, clientId)
    const open = (t) => cases.filter((x) => x.type === t && ['open', 'in_review', 'investigating'].includes(x.status)).length
    const sum = bookingSummary(bookings)
    const ws = s.perms.finance ? walletSummary(walletRowsOf(bundle), bundle.wallet || {}) : null
    return {
      ...listItem({ ...c, bookings: bookings.length, lifetimeValue: bookings.filter((b) => b.status === 'completed').reduce((t, b) => t + (b.price || 0), 0), lifetimeCurrency: currencyOf(c) }),
      currency: currencyOf(c),
      stats: { totalBookings: bookings.length, completed: sum.completed, cancelled: sum.cancelled, openDisputes: open('dispute'), supportTickets: open('support'), walletBalance: ws?.balance ?? null },
      totalSavings: c.totalSavings,
      referredBy: c.referredBy || c.referralCodeUsed || null,
      membershipDetail: { tier: c.membership, since: iso(c.joinedAt), validUntil: iso(c.membershipExpiry) },
    }
  } catch (err) {
    rethrow('adminGetClientPreview', err, 'The client preview could not be loaded.')
  }
})

export const adminGetClientActivity = onCall(async (request) => {
  const s = await clientScope(request)
  const clientId = requireId(request.data?.clientId)
  try {
    const { c } = await loadClient(clientId, s.access)
    const bundle = await loadBundle(clientId, { finance: s.perms.finance })
    const bookings = bookingRowsOf(bundle, c)
    return clientActivity(c, { bookings, payments: s.perms.finance ? paymentRowsOf(bundle, bookings) : [], tickets: bundle.tickets })
  } catch (err) {
    rethrow('adminGetClientActivity', err, 'Client activity could not be loaded.')
  }
})

export const adminGetClientNotes = onCall(async (request) => {
  const s = await clientScope(request)
  const clientId = requireId(request.data?.clientId)
  await loadClient(clientId, s.access)
  return notesFor(await rows('admin_notes', [['clientId', '==', clientId]], 300), 'directory')
})

export const adminAddClientNote = onCall((request) => addNote(request, { context: 'directory', text: request.data?.note }))

export const adminExportClients = onCall(async (request) => {
  const s = await clientScope(request, { permission: 'users.export' })
  try {
    const { rows: clientRows } = await loadClientRows(s.access)
    const p = request.data || {}
    const items = filterClients(clientRows, p, { canSeeSafety: s.perms.safety }).slice(0, 5000).map(listItem)
    const esc = (v) => (v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))
    const header = ['Client ID', 'Name', 'Email (masked)', 'Phone (masked)', 'Country', 'City', 'Membership', 'Status', 'Bookings', 'Joined']
    const lines = items.map((r) => [r.id, r.name, r.email, r.phone, r.countryName, r.city, r.membership, r.status, r.bookings, r.joinedAt?.slice(0, 10)].map(esc).join(','))
    const batch = db().batch()
    auditEntry(batch, request, { actorId: s.uid, action: 'client.export', entityId: 'clients', entityType: 'client_directory', metadata: { count: items.length, filters: p } })
    await batch.commit()
    return [header.join(','), ...lines].join('\n')
  } catch (err) {
    rethrow('adminExportClients', err, 'The export could not be created.')
  }
})

const bulkIds = (v) => {
  const ids = [...new Set((Array.isArray(v) ? v : []).map((x) => String(x || '').trim()).filter((x) => x && !x.includes('/')))]
  if (!ids.length || ids.length > 200) throw new HttpsError('invalid-argument', 'Select between 1 and 200 clients.')
  return ids
}

export const adminBulkNotifyClients = onCall(async (request) => {
  const s = await clientScope(request, { permission: 'users.suspend' })
  const ids = bulkIds(request.data?.clientIds)
  const title = String(request.data?.title || '').trim()
  const message = String(request.data?.message || '').trim()
  if (!title || title.length > 120 || !message || message.length > 1000) throw new HttpsError('invalid-argument', 'A title (≤120) and message (≤1,000 characters) are required.')
  const allowed = []
  for (const id of ids) {
    try {
      await loadClient(id, s.access)
      allowed.push(id)
    } catch { /* outside scope: skipped */ }
  }
  const batch = db().batch()
  for (const id of allowed) queueNotification(batch, { recipientId: id, recipientType: 'client', title, body: message, category: 'admin_message' })
  auditEntry(batch, request, { actorId: s.uid, action: 'client.bulk_notify', entityId: 'clients', entityType: 'client_directory', metadata: { count: allowed.length, title } })
  await batch.commit()
  return { queued: allowed.length, skipped: ids.length - allowed.length }
})

export const adminBulkTagClients = onCall(async (request) => {
  const s = await clientScope(request)
  const ids = bulkIds(request.data?.clientIds)
  const tag = String(request.data?.tag || '').trim()
  if (!tag || tag.length > 40) throw new HttpsError('invalid-argument', 'Tags must be 1–40 characters.')
  const allowed = []
  for (const id of ids) {
    try {
      await loadClient(id, s.access)
      allowed.push(id)
    } catch { /* outside scope */ }
  }
  const batch = db().batch()
  // Internal tags are admin-only records — never written to the client's profile.
  for (const id of allowed) batch.set(db().collection('admin_client_tags').doc(id), { clientId: id, tags: FieldValue.arrayUnion(tag), updatedAt: Date.now(), updatedBy: s.uid }, { merge: true })
  auditEntry(batch, request, { actorId: s.uid, action: 'client.bulk_tag', entityId: 'clients', entityType: 'client_directory', metadata: { count: allowed.length, tag } })
  await batch.commit()
  return { tagged: allowed.length }
})

// ================================================================= ADM-012 profile

export const adminGetClientProfile = onCall(async (request) => {
  const s = await clientScope(request)
  const clientId = requireId(request.data?.clientId)
  try {
    const now = Date.now()
    const [{ c, user }, settings] = await Promise.all([loadClient(clientId, s.access), db().collection('platform_settings').doc('global_settings').get()])
    const bundle = await loadBundle(clientId, { finance: s.perms.finance, membership: true, referrals: true })
    const bookings = bookingRowsOf(bundle, c)
    const payments = paymentRowsOf(bundle, bookings)
    const walletRows = s.perms.finance ? walletRowsOf(bundle) : []
    const membership = membershipView({ client: clientBlock(c, now), user, subs: bundle.subs, payments: bundle.payments.filter((p) => lowerStatus(p.paymentType) === 'subscription'), settings: settings.exists ? settings.data() : {}, perms: s.perms, now }).membership
    const cases = casesOf(bundle, clientId)
    return profileView({
      c, now, bookings, payments, wallet: bundle.wallet ? { balance: walletSummary(walletRows, bundle.wallet).balance } : null, walletRows, membership, cases,
      restrictions: bundle.restrictions, referralsCount: bundle.referred.length, activity: clientActivity(c, { bookings, payments: s.perms.finance ? payments : [], tickets: bundle.tickets }, now), perms: s.perms,
    })
  } catch (err) {
    rethrow('adminGetClientProfile', err, 'The client profile could not be loaded.')
  }
})

export const adminRevealClientContact = onCall(async (request) => {
  const s = await clientScope(request, { permission: 'identity.reveal_sensitive' })
  const clientId = requireId(request.data?.clientId)
  const { c } = await loadClient(clientId, s.access)
  const batch = db().batch()
  auditEntry(batch, request, { actorId: s.uid, action: 'client.contact_revealed', entityId: clientId, entityType: 'client', metadata: { fields: ['email', 'phone'] } })
  await batch.commit()
  return { email: c.email, phone: c.phone }
})

// ================================================================= ADM-013 bookings

export const adminGetClientBookings = onCall(async (request) => {
  const s = await clientScope(request, { permission: 'bookings.view' })
  const clientId = requireId(request.data?.clientId)
  try {
    const now = Date.now()
    const { c } = await loadClient(clientId, s.access)
    const bundle = await loadBundle(clientId, { cases: false })
    const all = bookingRowsOf(bundle, c)
    return { client: clientBlock(c, now, all.find((b) => b.currency)?.currency), summary: bookingSummary(all, now), ...queryBookings(all, request.data || {}, { finance: s.perms.finance, now }) }
  } catch (err) {
    rethrow('adminGetClientBookings', err, 'Client bookings could not be loaded.')
  }
})

export const adminGetBookingPreview = onCall(async (request) => {
  const s = await clientScope(request, { permission: 'bookings.view' })
  const clientId = requireId(request.data?.clientId)
  const bookingId = requireId(request.data?.bookingId, 'bookingId')
  try {
    const now = Date.now()
    const { c } = await loadClient(clientId, s.access)
    const snap = await db().collection('bookings').doc(bookingId).get()
    if (!snap.exists || (snap.get('customerId') !== clientId && snap.get('clientId') !== clientId)) throw new HttpsError('not-found', 'Booking not found for this client.')
    const raw = snap.data()
    const row = clientBookingRow(snap.id, raw, { countryName: c.countryName })
    const b = row._b
    const ev = (id, ms, text) => (ms ? { id, at: iso(ms), text } : null)
    const [payments, disputes, notes] = await Promise.all([
      s.perms.finance ? rows('payments', [['bookingId', '==', bookingId]], 20) : [],
      rows('disputes', [['bookingId', '==', bookingId]], 10),
      rows('admin_notes', [['clientId', '==', clientId]], 300),
    ])
    const pay = payments.find((p) => p.customerId === clientId) || payments[0]
    return {
      ...redactBooking(row, s.perms.finance),
      client: { id: c.id, name: c.name },
      currency: row.currency || currencyOf(c),
      timeZone: clientBlock(c).timeZone,
      asOf: iso(now),
      timeline: [
        ev('t1', b.createdAt, 'Booking created'),
        ev('t2', b.confirmedAt, 'Confirmed by provider'),
        ev('t3', b.serviceStartedAt, 'Service started'),
        ev('t4', b.providerCompletedAt, 'Provider marked the service complete'),
        ev('t5', b.serviceConfirmedAt, 'Client confirmed the service'),
        ev('t6', b.completedAt, 'Booking completed'),
        ev('t7', b.fundsReleasedAt, 'Escrow released to provider'),
        ev('t8', b.cancelledAt, `Booking cancelled${b.cancelledBy ? ` by ${b.cancelledBy}` : ''}`),
        ev('t9', b.refundRequestedAt, 'Refund requested'),
      ].filter(Boolean).sort((x, y) => Date.parse(y.at) - Date.parse(x.at)),
      ...(s.perms.finance && pay ? { paymentDetail: { id: pay.id, method: clientPaymentRow(pay.id, pay).method?.label || null, amount: clientPaymentRow(pay.id, pay).amount, bookingFee: typeof pay.bookingFee === 'number' ? pay.bookingFee : null, paidAt: iso(millis(pay.paidAt) ?? millis(pay.completedAt)) } } : {}),
      cancellation: row.status === 'cancelled' ? { id: b.cancellationId, cancelledBy: b.cancelledBy, reason: b.cancellationReason, refundAmount: s.perms.finance ? b.refundAmount : null, refundStatus: b.refundStatus } : null,
      dispute: disputes[0] ? { id: disputes[0].id, reason: disputes[0].reason || disputes[0].notes || disputes[0].type || null, status: disputes[0].status || 'open' } : null,
      notes: notesFor(notes, 'booking', bookingId),
    }
  } catch (err) {
    rethrow('adminGetBookingPreview', err, 'The booking could not be loaded.')
  }
})

// ================================================================= ADM-014 payments

export const adminGetClientPayments = onCall(async (request) => {
  const s = await clientScope(request, { permission: 'payments.view' })
  const clientId = requireId(request.data?.clientId)
  try {
    const now = Date.now()
    const { c } = await loadClient(clientId, s.access)
    const bundle = await loadBundle(clientId, { finance: true, cases: false })
    const all = paymentRowsOf(bundle, bookingRowsOf(bundle, c))
    const summary = paymentSummary(all)
    return { client: clientBlock(c, now, summary.currency), summary, ...queryPayments(all, request.data || {}, now) }
  } catch (err) {
    rethrow('adminGetClientPayments', err, 'Client payments could not be loaded.')
  }
})

/**
 * Payment drawer and the standalone Payment Details page. `clientId` is optional:
 * without it the owner is resolved from the payment (client payment or provider
 * subscription payment) and scope-checked against that owner.
 */
export const adminGetPaymentPreview = onCall(async (request) => {
  const s = await clientScope(request, { permission: 'payments.view' })
  const paymentId = requireId(request.data?.paymentId, 'paymentId')
  try {
    const now = Date.now()
    let snap = await db().collection('payments').doc(paymentId).get()
    let fromSubscriptions = false
    if (!snap.exists) {
      snap = await db().collection('subscription_payments').doc(paymentId).get()
      fromSubscriptions = snap.exists
    }
    if (!snap.exists) throw new HttpsError('not-found', 'Payment not found or outside your authorised markets.')
    const raw = fromSubscriptions
      ? { ...snap.data(), paymentType: 'subscription', customerId: snap.get('providerId'), amount: snap.get('amountLocal') ?? snap.get('amount'), currency: snap.get('localCurrency') ?? snap.get('currency'), planName: snap.get('plan') }
      : snap.data()
    const ownerId = request.data?.clientId ? requireId(request.data.clientId) : raw.customerId || raw.userId || raw.providerId
    if (request.data?.clientId && raw.customerId !== ownerId && raw.userId !== ownerId) throw new HttpsError('not-found', 'Payment not found for this client.')
    const ownerSnap = ownerId ? await db().collection('users').doc(ownerId).get() : null
    const owner = ownerSnap?.exists ? ownerSnap.data() : {}
    const country = countryCodeOf(owner.countryCode, owner.country) || (raw.currency === 'KES' ? 'KE' : null)
    if (!inScope(s.access, country)) throw new HttpsError('not-found', 'Payment not found or outside your authorised markets.')
    const c = mergeClient(ownerId || 'unknown', { user: owner }, now)
    let bookingsById = new Map()
    if (raw.bookingId) {
      const b = await db().collection('bookings').doc(raw.bookingId).get()
      if (b.exists) bookingsById = new Map([[b.id, clientBookingRow(b.id, b.data(), { countryName: c.countryName })]])
    }
    const notes = ownerId ? await rows('admin_notes', [['clientId', '==', ownerId]], 300) : []
    const row = clientPaymentRow(snap.id, raw, bookingsById)
    const preview = paymentPreview(row, { client: clientBlock(c, now), now, notes: notesFor(notes, 'payment', paymentId) })
    return { ...preview, currency: row.currency || currencyOf(c), owner: { id: ownerId, name: c.name, role: isClientType(owner.accountType) ? 'client' : owner.accountType ? 'provider' : null }, source: fromSubscriptions ? 'subscription_payments' : 'payments' }
  } catch (err) {
    rethrow('adminGetPaymentPreview', err, 'The payment could not be loaded.')
  }
})

export const adminAddPaymentNote = onCall((request) => addNote(request, { permission: 'payments.view', context: 'payment', refId: requireId(request.data?.paymentId, 'paymentId'), text: request.data?.text }))

// ================================================================= ADM-015 wallet

async function walletContext(request) {
  const s = await clientScope(request, { permission: 'payments.view' })
  const clientId = requireId(request.data?.clientId)
  const { c, user } = await loadClient(clientId, s.access)
  const bundle = await loadBundle(clientId, { finance: true, cases: false })
  return { s, c, user, bundle, rows: walletRowsOf(bundle) }
}

export const adminGetClientWallet = onCall(async (request) => {
  try {
    const now = Date.now()
    const { c, user, bundle, rows: all } = await walletContext(request)
    const currency = all.find((t) => t.currency)?.currency || currencyOf(c)
    return {
      client: clientBlock(c, now, currency),
      wallet: {
        id: bundle.wallet ? c.id : null,
        type: 'Client Wallet',
        status: user.adminRestrictions?.payments ? 'restricted' : c.status === 'suspended' ? 'frozen' : bundle.wallet ? 'active' : 'not_created',
        owner: c.name,
        currency,
        country: c.country,
        countryName: c.countryName,
        createdAt: iso(c.joinedAt),
        updatedAt: iso(millis(bundle.wallet?.updatedAt)),
      },
      summary: walletSummary(all, bundle.wallet || {}),
      ...queryWallet(all, request.data || {}, now),
    }
  } catch (err) {
    rethrow('adminGetClientWallet', err, 'The client wallet could not be loaded.')
  }
})

export const adminGetWalletBalanceHistory = onCall(async (request) => {
  try {
    const { c, rows: all } = await walletContext(request)
    return { ...walletHistory(all, { window: [7, 30, 90].includes(Number(request.data?.window)) ? Number(request.data.window) : 30, offsetMins: MARKET_INFO[c.country]?.offset ?? 180 }), currency: all.find((t) => t.currency)?.currency || currencyOf(c), timeZone: clientBlock(c).timeZone }
  } catch (err) {
    rethrow('adminGetWalletBalanceHistory', err, 'Wallet history could not be loaded.')
  }
})

export const adminGetWalletTransactionPreview = onCall(async (request) => {
  try {
    const now = Date.now()
    const txnId = requireId(request.data?.txnId, 'txnId')
    const { c, bundle, rows: all } = await walletContext(request)
    const t = all.find((x) => x.id === txnId)
    if (!t) throw new HttpsError('not-found', 'Transaction not found for this client.')
    const ev = (id, ms, text, tone = 'ok') => (ms ? { id, at: iso(ms), text, tone } : null)
    const raw = bundle.walletTx.find((x) => x.id === txnId) || {}
    return {
      ...walletListItem(t),
      currency: t.currency || currencyOf(c),
      timeZone: clientBlock(c).timeZone,
      asOf: iso(now),
      client: { id: c.id, name: c.name },
      typeLabel: t.title,
      balanceBefore: t.balanceBefore,
      balanceAfter: t.status === 'pending' ? null : t.balanceAfter,
      funding: t.type === 'topup' ? { method: t.method, paymentId: t.paymentId, amount: t.amount } : null,
      booking: t.bookingId ? { id: t.bookingId, service: t.service, provider: t.provider, amount: t.amount, image: null } : null,
      refund: t.type === 'refund' ? { id: null, reason: raw.reason || raw.description || null, status: t.status === 'pending' ? 'Pending' : 'Completed', requestedAt: t.createdAt, amount: t.amount } : null,
      promo: t.type === 'promo' ? { name: raw.description || 'Promotional credit' } : null,
      membership: t.type === 'membership' ? { name: raw.description || 'Membership', note: null } : null,
      failure: t.failure,
      timeline: [ev('e1', Date.parse(t.createdAt), 'Transaction recorded'), ev('e2', millis(raw.completedAt), 'Transaction completed'), t.status === 'failed' ? ev('e3', Date.parse(t.createdAt), t.failure || 'Transaction failed', 'bad') : null].filter(Boolean),
      notes: notesFor(bundle.notes, 'wallet', txnId),
    }
  } catch (err) {
    rethrow('adminGetWalletTransactionPreview', err, 'The transaction could not be loaded.')
  }
})

export const adminAddWalletTransactionNote = onCall((request) => addNote(request, { permission: 'payments.view', context: 'wallet', refId: requireId(request.data?.txnId, 'txnId'), text: request.data?.text }))

// ================================================================= ADM-016 membership

async function membershipContext(request, scopeOpts) {
  const s = await clientScope(request, scopeOpts)
  const clientId = requireId(request.data?.clientId)
  const now = Date.now()
  const [{ c, user, refs }, settings] = await Promise.all([loadClient(clientId, s.access), db().collection('platform_settings').doc('global_settings').get()])
  const bundle = await loadBundle(clientId, { cases: false, membership: true })
  const events = bundle.memberEvents
    .sort((a, b) => (millis(b.createdAt) || 0) - (millis(a.createdAt) || 0))
    .map((e) => ({ id: e.id, at: iso(millis(e.createdAt)), text: e.text, tone: 'admin', actor: e.adminName || 'Admin', reason: e.reason || null, ref: { type: 'audit', id: e.id } }))
  const view = membershipView({
    client: clientBlock(c, now), user, subs: bundle.subs, payments: bundle.payments.filter((p) => lowerStatus(p.paymentType) === 'subscription'),
    settings: settings.exists ? settings.data() : {}, perms: s.perms, notes: notesFor(bundle.notes, 'membership'), events, now,
  })
  return { s, c, user, refs, bundle, view, now, settings: settings.exists ? settings.data() : {} }
}

export const adminGetClientMembership = onCall(async (request) => {
  try {
    return (await membershipContext(request)).view
  } catch (err) {
    rethrow('adminGetClientMembership', err, 'The membership could not be loaded.')
  }
})

export const adminChangeClientMembership = onCall(async (request) => {
  const d = request.data || {}
  try {
    const { s, c, refs, view, now, settings } = await membershipContext(request, { permission: 'memberships.manage', fresh: true })
    const plan = planMembershipChange({ view, action: d.action, payload: d.payload || {}, reason: d.reason, note: d.note, now })
    if (plan.error) throw new HttpsError(plan.code || 'invalid-argument', plan.error)
    const ts = (ms) => (ms == null ? null : Timestamp.fromMillis(ms))
    const batch = db().batch()
    const subRef = view.membership.id ? db().collection('subscriptions').doc(view.membership.id) : null
    if (plan.period && subRef) {
      const patch = { ...plan.period, updatedAt: FieldValue.serverTimestamp(), adminUpdatedBy: s.uid }
      if ('endDate' in patch) patch.endDate = ts(patch.endDate)
      batch.update(subRef, patch)
    }
    if (plan.newPeriod) {
      const price = Number(settings?.subscriptions?.client?.premium)
      batch.set(db().collection('subscriptions').doc(), {
        userId: c.id, accountType: 'customer', planName: plan.newPeriod.planName, status: 'pending', subscriptionStatus: 'pending', paymentRequired: true,
        startDate: ts(plan.newPeriod.startDate), endDate: ts(plan.newPeriod.endDate), amount: Number.isFinite(price) ? price : null, currency: 'USD', billingCycle: 'monthly', autoRenew: true,
        source: 'admin', provisionedBy: s.uid, createdAt: FieldValue.serverTimestamp(),
      })
    }
    if (plan.user) {
      const patch = { ...plan.user }
      if ('membershipExpiryDate' in patch) patch.membershipExpiryDate = ts(patch.membershipExpiryDate)
      if (refs.user) batch.update(refs.user, patch)
      if (refs.profile) batch.update(refs.profile, Object.fromEntries(Object.entries(patch).filter(([k]) => k.startsWith('membership'))))
    }
    const eventRef = db().collection('membership_admin_events').doc()
    batch.set(eventRef, { clientId: c.id, action: d.action, payload: d.payload || {}, text: plan.event, reason: d.reason, adminId: s.uid, adminName: s.actor.name, createdAt: now })
    if (String(d.note || '').trim()) batch.set(db().collection('admin_notes').doc(), { clientId: c.id, context: 'membership', refId: eventRef.id, note: String(d.note).trim(), authorId: s.uid, authorName: s.actor.name, createdAt: now })
    if (['change_tier', 'extend', 'reactivate', 'cancel_renewal'].includes(d.action)) queueNotification(batch, { recipientId: c.id, recipientType: 'client', title: 'Membership updated', body: plan.event.replace(/\s*\(.*\)$/, ''), category: 'membership' })
    auditEntry(batch, request, { actorId: s.uid, action: `client.membership.${d.action}`, entityId: c.id, entityType: 'client_membership', metadata: { subscriptionId: view.membership.id, payload: d.payload || {}, reason: d.reason } })
    await batch.commit()
    return { ok: true, auditId: eventRef.id, message: plan.event }
  } catch (err) {
    rethrow('adminChangeClientMembership', err, 'The membership change could not be applied.')
  }
})

export const adminAddMembershipNote = onCall((request) => addNote(request, { context: 'membership', text: request.data?.text }))

// ================================================================= ADM-017 referrals & loyalty

async function loyaltyContext(request) {
  const s = await clientScope(request)
  const clientId = requireId(request.data?.clientId)
  const now = Date.now()
  const [{ c, user }, settings] = await Promise.all([loadClient(clientId, s.access), db().collection('platform_settings').doc('global_settings').get()])
  const bundle = await loadBundle(clientId, { cases: false, referrals: true })
  const referredBookings = new Map()
  for (const u of bundle.referred.slice(0, 50)) {
    referredBookings.set(u.id, (await rows('bookings', [['customerId', '==', u.id]], 200)).map((b) => clientBookingRow(b.id, b)))
  }
  const referrals = referralRecords(bundle.referred.filter((u) => u.id !== clientId), referredBookings)
  return { s, c, user, bundle, referrals, now, settings: settings.exists ? settings.data() : {} }
}

export const adminGetClientLoyalty = onCall(async (request) => {
  try {
    const { c, user, bundle, referrals, now, settings } = await loyaltyContext(request)
    return loyaltyView({ client: clientBlock(c, now), user, referrals, settings, notes: notesFor(bundle.notes, 'loyalty'), now })
  } catch (err) {
    rethrow('adminGetClientLoyalty', err, 'Referrals & loyalty could not be loaded.')
  }
})

export const adminGetClientReferrals = onCall(async (request) => {
  try {
    const { c, referrals, now } = await loyaltyContext(request)
    return queryReferrals(referrals, request.data || {}, { client: clientBlock(c, now), now })
  } catch (err) {
    rethrow('adminGetClientReferrals', err, 'Referrals could not be loaded.')
  }
})

export const adminGetReferralPreview = onCall(async (request) => {
  try {
    const { c, user, referrals, now } = await loyaltyContext(request)
    const x = referrals.find((r) => r.id === request.data?.referralId)
    if (!x) throw new HttpsError('not-found', 'Referral not found for this client.')
    const client = clientBlock(c, now)
    return {
      id: x.id, client: x.client, joinedAt: x.joinedAt, country: client.country, countryName: client.countryName, progress: x.progress, status: x.status, rewardAmount: null, rewardId: null,
      currency: client.currency, timeZone: client.timeZone, code: user.referralCode || null, invitedAt: x.invitedAt, referrer: { id: c.id, name: c.name },
      qualification: [{ id: 'q1', label: 'Registration completed', done: x.status !== 'ineligible' }, { id: 'q2', label: 'First booking completed', done: x.qualified }],
      rewardTxnId: null, bookingId: x.bookingId,
      events: [{ id: 'e1', at: x.joinedAt, text: 'Registered with this client as referrer', tone: 'ok' }, x.qualified ? { id: 'e2', at: x.joinedAt, text: 'First booking completed', tone: 'ok' } : { id: 'e2', at: x.joinedAt, text: 'Waiting for a completed booking', tone: 'wait' }],
    }
  } catch (err) {
    rethrow('adminGetReferralPreview', err, 'The referral could not be loaded.')
  }
})

export const adminAddLoyaltyNote = onCall((request) => addNote(request, { context: 'loyalty', text: request.data?.text }))

// ================================================================= ADM-018 support & safety history

async function supportContext(request, scopeOpts) {
  const s = await clientScope(request, scopeOpts)
  const clientId = requireId(request.data?.clientId)
  const { c } = await loadClient(clientId, s.access)
  const bundle = await loadBundle(clientId, { finance: s.perms.finance })
  return { s, c, bundle, cases: casesOf(bundle, clientId) }
}

async function assignableAdmins() {
  const admins = await rows('admin_profiles', [], 200)
  return admins.filter((a) => (a.status || 'ACTIVE') === 'ACTIVE').map((a) => a.fullName || a.email).filter(Boolean).slice(0, 50)
}

export const adminGetClientSupport = onCall(async (request) => {
  try {
    const now = Date.now()
    const { s, c, bundle, cases } = await supportContext(request, { permission: 'support.view' })
    return supportView({ client: clientBlock(c, now), cases, restrictions: bundle.restrictions, perms: s.perms, params: request.data || {}, now, assignees: await assignableAdmins() })
  } catch (err) {
    rethrow('adminGetClientSupport', err, 'Support & safety history could not be loaded.')
  }
})

export const adminGetSupportCasePreview = onCall(async (request) => {
  try {
    const now = Date.now()
    const { s, c, bundle, cases } = await supportContext(request, { permission: 'support.view' })
    const x = cases.find((k) => k.id === request.data?.caseId)
    if (!x || (x.type === 'safety' && !s.perms.safety)) throw new HttpsError('not-found', 'This case was not found, or your role cannot view it.')
    const bookingRow = x.bookingId ? bookingRowsOf(bundle, c).find((b) => b.id === x.bookingId) : null
    const pay = x.paymentId ? bundle.payments.find((p) => p.id === x.paymentId) : bookingRow ? bundle.payments.find((p) => p.bookingId === bookingRow.id) : null
    const events = (await rows('support_case_events', [['caseId', '==', x.id]], 100)).map((e) => ({ id: e.id, at: iso(millis(e.createdAt)), text: e.text }))
    if (x.type === 'safety') {
      const batch = db().batch()
      auditEntry(batch, request, { actorId: s.uid, action: 'client.safety_case_viewed', entityId: x.id, entityType: 'safety_report', metadata: { clientId: c.id } })
      await batch.commit()
    }
    return supportCasePreview(x, {
      client: clientBlock(c, now),
      perms: s.perms,
      booking: bookingRow ? { id: bookingRow.id, service: bookingRow.service, provider: bookingRow.provider } : null,
      payment: pay ? { id: pay.id, amount: clientPaymentRow(pay.id, pay).amount, method: clientPaymentRow(pay.id, pay).method?.label || null } : null,
      notes: notesFor(bundle.notes, 'support', x.id),
      events,
    })
  } catch (err) {
    rethrow('adminGetSupportCasePreview', err, 'The case could not be loaded.')
  }
})

/** Mutations apply to support tickets only; disputes and safety reports have their own workflows. */
async function ticketMutation(request, { permission = 'support.respond', apply }) {
  const s = await clientScope(request, { permission })
  const clientId = requireId(request.data?.clientId)
  const caseId = requireId(request.data?.caseId, 'caseId')
  await loadClient(clientId, s.access)
  const ref = db().collection('support_tickets').doc(caseId)
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists || (snap.get('userId') !== clientId && snap.get('customerId') !== clientId)) throw new HttpsError('not-found', 'Support ticket not found for this client.')
    const out = apply(tx, ref, snap, s)
    auditEntry(tx, request, { actorId: s.uid, action: out.audit, entityId: caseId, entityType: 'support_ticket', metadata: { clientId, ...(out.meta || {}) } })
    if (out.event) tx.set(db().collection('support_case_events').doc(), { caseId, clientId, text: out.event, adminId: s.uid, adminName: s.actor.name, createdAt: Date.now() })
    return { ok: true }
  })
}

export const adminReplyToSupportCase = onCall((request) => {
  const text = String(request.data?.text || '').trim()
  if (text.length < 2 || text.length > 2000) throw new HttpsError('invalid-argument', 'Replies must be between 2 and 2,000 characters.')
  return ticketMutation(request, {
    apply: (tx, ref, snap, s) => {
      tx.update(ref, { messages: FieldValue.arrayUnion({ text, senderType: 'admin', senderName: s.actor.name, senderId: s.uid, timestamp: Date.now() }), status: lowerStatus(snap.get('status')) === 'closed' ? snap.get('status') : 'In Review', updatedAt: FieldValue.serverTimestamp() })
      queueNotification(tx, { recipientId: request.data.clientId, recipientType: 'client', title: 'Support replied to your ticket', body: text.slice(0, 200), category: 'support', related: { ticketId: ref.id } })
      return { audit: 'client.support_replied', event: 'Response sent to client' }
    },
  })
})

export const adminAddSupportCaseNote = onCall(async (request) => {
  const s = await clientScope(request, { permission: 'support.view' })
  const caseId = requireId(request.data?.caseId, 'caseId')
  await addNote(request, { permission: 'support.view', context: 'support', refId: caseId, text: request.data?.text })
  return { ok: true, author: s.actor.name }
})

export const adminReassignSupportCase = onCall((request) => {
  const assignee = String(request.data?.assignee || '').trim()
  if (!assignee || assignee.length > 120) throw new HttpsError('invalid-argument', 'Choose who to assign the case to.')
  return ticketMutation(request, {
    apply: (tx, ref) => {
      tx.update(ref, { assignedAdmin: assignee, assignedAdminName: assignee, updatedAt: FieldValue.serverTimestamp() })
      return { audit: 'client.support_reassigned', event: `Reassigned to ${assignee}`, meta: { assignee } }
    },
  })
})

export const adminEscalateSupportCase = onCall((request) =>
  ticketMutation(request, {
    apply: (tx, ref) => {
      tx.update(ref, { escalated: true, priority: 'high', escalatedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
      return { audit: 'client.support_escalated', event: 'Escalated to Support Lead' }
    },
  }),
)

// ================================================================= ADM-019 account actions

async function accountContext(request, scopeOpts) {
  const s = await clientScope(request, scopeOpts)
  const clientId = requireId(request.data?.clientId)
  const now = Date.now()
  const { c, user, refs } = await loadClient(clientId, s.access)
  const bundle = await loadBundle(clientId, { account: true })
  const bookings = bookingRowsOf(bundle, c)
  const upcoming = bookings.filter((b) => (b.status === 'confirmed' || b.status === 'pending') && Date.parse(b.scheduledAt) >= now).sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))
  return { s, c, user, refs, bundle, upcoming, cases: casesOf(bundle, clientId), now }
}

export const adminGetClientAccount = onCall(async (request) => {
  try {
    const { s, c, bundle, upcoming, cases, now } = await accountContext(request)
    return accountView({ client: clientBlock(c, now), restrictions: bundle.restrictions, actions: bundle.actions, notifications: bundle.notifications, upcoming, cases, perms: s.perms, now })
  } catch (err) {
    rethrow('adminGetClientAccount', err, 'Account details could not be loaded.')
  }
})

const HIGH_IMPACT = ['suspend', 'reactivate', 'deactivate', 'restrict_payments']

export const adminApplyClientAccountAction = onCall(async (request) => {
  const d = request.data || {}
  const action = String(d.action || '')
  try {
    const { s, c, refs, bundle, upcoming, cases, now } = await accountContext(request, { permission: action === 'deactivate' ? 'users.deactivate' : 'users.suspend', fresh: HIGH_IMPACT.includes(action) })
    if (!refs.user) throw new HttpsError('failed-precondition', 'This client has no account record to change.')
    const result = await db().runTransaction(async (tx) => {
      // Re-read the latest account state and restrictions inside the transaction.
      const [userSnap, restrictionSnap] = await Promise.all([tx.get(refs.user), tx.get(db().collection('account_restrictions').where('clientId', '==', c.id).where('status', '==', 'active'))])
      const latest = mergeClient(c.id, { user: userSnap.data() || {} }, now)
      const restrictions = restrictionSnap.docs.map((x) => normalizeRestriction(x.id, x.data()))
      const plan = planAccountAction({ action, payload: d, client: { ...clientBlock(latest, now), status: latest.status }, restrictions, cases, perms: s.perms, upcomingCount: upcoming.length, now })
      if (plan.error) throw new HttpsError(plan.code || 'invalid-argument', plan.error)

      const historyRef = db().collection('account_actions').doc()
      let active = restrictions.filter((x) => !(plan.closeRestrictions || []).includes(x.id))
      if (plan.restriction) {
        const rRef = db().collection('account_restrictions').doc()
        const rec = { ...plan.restriction, clientId: c.id, subjectType: 'client', appliedBy: s.uid, appliedByName: s.actor.name, appliedByRole: s.actor.role, historyId: historyRef.id, createdAt: now }
        tx.set(rRef, rec)
        active = [...active, normalizeRestriction(rRef.id, rec)]
      }
      for (const id of plan.closeRestrictions || []) {
        const old = restrictions.find((x) => x.id === id)
        tx.update(db().collection('account_restrictions').doc(id), { status: 'closed', endedAt: now, endedBy: s.uid, endedByName: s.actor.name, endReason: d.category })
        if (old?.historyId) tx.update(db().collection('account_actions').doc(old.historyId), { status: 'removed' })
      }
      if (plan.closeHistory) {
        const prior = bundle.actions.find((h) => h.action === plan.closeHistory && h.status === 'active')
        if (prior) tx.update(db().collection('account_actions').doc(prior.id), { status: 'removed' })
      }
      tx.set(historyRef, { ...plan.history, clientId: c.id, subjectType: 'client', adminId: s.uid, adminName: s.actor.name, at: now, createdAt: now })

      // The client app reads accountStatus / accountDeactivated / adminRestrictions.* to enforce access.
      const userPatch = { ...restrictionFlags(active), adminRestrictionsUpdatedAt: now }
      if (plan.user) {
        if ('accountStatus' in plan.user) userPatch.accountStatus = plan.user.accountStatus === 'active' ? (userSnap.get('accountStatusBeforeSuspension') || 'active') : plan.user.accountStatus
        if (plan.user.accountStatus === 'suspended' && lowerStatus(userSnap.get('accountStatus')) !== 'suspended') userPatch.accountStatusBeforeSuspension = userSnap.get('accountStatus') || 'active'
        if ('accountDeactivated' in plan.user) userPatch.accountDeactivated = plan.user.accountDeactivated
      }
      tx.update(refs.user, userPatch)
      if (refs.profile && 'accountStatus' in userPatch) tx.update(refs.profile, { accountStatus: userPatch.accountStatus })
      if (plan.notice) queueNotification(tx, { recipientId: c.id, recipientType: 'client', title: plan.notice.title, body: plan.notice.message, category: 'account' })
      auditEntry(tx, request, { actorId: s.uid, action: `client.account.${action}`, entityId: c.id, entityType: 'client', metadata: { reason: d.category, scope: d.scope || null, duration: d.duration || null, restrictionId: d.restrictionId || null, relatedId: d.relatedId || null } })
      return plan
    })
    return { ok: true, message: result.message, bookingsAffected: result.bookingsAffected ?? 0 }
  } catch (err) {
    rethrow('adminApplyClientAccountAction', err, 'The account action could not be applied.')
  }
})
