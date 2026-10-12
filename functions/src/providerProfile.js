import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { ALL_MARKETS, adminAccess, canAccessMarket } from './accessModel.js'
import { recordAudit } from './events.js'
import { MARKETS } from './dashboardLogic.js'
import { getDateBounds, safeTimeZone } from './dashboard.js'
import { loadAllProviders, loadProviderBundle } from './providerSources.js'
import { buildProfileView, buildProviderDashboardView, directoryRow, normalizeProviderBookings, queryDirectory } from './providerViews.js'
import { applyWriteBack, prepareWriteBack } from './contentSources.js'
import { historyEntry } from './contentModerationLogic.js'
import { readAll } from './platformLoaders.js'
import { countryCodeOf } from './platformData.js'

// ADM-020 Provider Dashboard · ADM-021 Provider Directory · ADM-022 Provider
// Admin Profile — over the mobile app's provider records (users +
// provider_profiles + type collections). Market access is enforced per
// provider; financial and contact details depend on the admin's permissions.

const db = () => getFirestore()

async function scope(request, permission = 'providers.view') {
  const uid = await requireAdmin(request, { permission })
  const access = await adminAccess(uid)
  return {
    uid,
    access,
    actor: { id: uid, name: access.fullName || 'Admin' },
    perms: { finance: access.permissions.includes('payments.view'), revealPii: access.permissions.includes('users.reveal_pii'), moderate: access.permissions.includes('content.moderate') },
    unrestricted: access.markets.includes(ALL_MARKETS),
  }
}

function assertProviderMarket(s, countryCode) {
  const ok = countryCode ? canAccessMarket(s.access, countryCode) : s.unrestricted
  if (!ok) throw new HttpsError('permission-denied', 'You do not have access to providers in this market.', { reason: 'market-denied' })
}

const requireUid = (v) => {
  const id = String(v || '').trim()
  if (!id || id.includes('/')) throw new HttpsError('invalid-argument', 'A provider ID is required.')
  return id
}

async function directoryRows(s) {
  const [providers, bookings, content] = await Promise.all([
    loadAllProviders(db()),
    readAll('bookings', { limit: 10000 }),
    readAll('content_moderation', { where: [['status', 'in', ['awaiting_review', 'under_review', 'resubmitted', 'escalated']]], limit: 3000 }),
  ])
  const byProvider = new Map()
  for (const { b } of normalizeProviderBookings(bookings.rows)) {
    if (!byProvider.has(b.provider.id)) byProvider.set(b.provider.id, [])
    byProvider.get(b.provider.id).push(b)
  }
  const contentBy = new Map()
  for (const c of content.rows) contentBy.set(c.providerId, (contentBy.get(c.providerId) || 0) + 1)
  return providers
    .filter((p) => (p.countryCode ? canAccessMarket(s.access, p.countryCode) : s.unrestricted))
    .map((p) => directoryRow(p, { bookings: byProvider.get(p.uid) || [], contentPending: contentBy.get(p.uid) || 0 }))
}

/** ADM-021 — data: { market, providerType, subcategory, status, searchQuery, verification, location, availability, subscription, minRating, sortBy, page, pageSize } */
export const adminListProviders = onCall(async (request) => {
  const s = await scope(request)
  const market = String(request.data?.market || 'ALL').toUpperCase()
  if (market !== 'ALL' && !canAccessMarket(s.access, market)) throw new HttpsError('permission-denied', 'You do not have access to this market.', { reason: 'market-denied' })
  const rows = await directoryRows(s)
  const out = queryDirectory(rows, { ...(request.data || {}), market })
  if (!s.perms.revealPii) out.items = out.items.map((r) => ({ ...r, email: r.email ? r.email.replace(/^(.{2}).*(@.*)$/, '$1••••$2') : null, phone: r.phone ? `${String(r.phone).slice(0, 4)}••••${String(r.phone).slice(-3)}` : null }))
  return out
})

/** ADM-021 quick preview. data: { providerId } */
export const adminGetProviderDetail = onCall(async (request) => {
  const s = await scope(request)
  const uid = requireUid(request.data?.providerId)
  const rows = await directoryRows(s)
  const row = rows.find((r) => r.id === uid)
  if (!row) throw new HttpsError('not-found', 'Provider not found.')
  return { provider: row }
})

/** ADM-022 — data: { providerId } */
export const adminGetProviderProfile = onCall(async (request) => {
  const s = await scope(request)
  const uid = requireUid(request.data?.providerId)
  const bundle = await loadProviderBundle(db(), uid, { finance: s.perms.finance })
  if (!bundle) throw new HttpsError('not-found', 'Provider not found.')
  assertProviderMarket(s, bundle.provider.countryCode)
  return { success: true, foundInDb: true, provider: buildProfileView(bundle, { perms: s.perms, now: Date.now() }) }
})

/** ADM-022 internal note (never shown to the provider). data: { providerId, note, team? } */
export const adminAddProviderInternalNote = onCall(async (request) => {
  const s = await scope(request)
  const uid = requireUid(request.data?.providerId)
  const text = String(request.data?.note || '').trim().slice(0, 2000)
  if (!text) throw new HttpsError('invalid-argument', 'The note is empty.')
  const user = (await db().collection('users').doc(uid).get()).data() || {}
  assertProviderMarket(s, countryCodeOf(user.countryCode, user.country))
  const now = Timestamp.now()
  const ref = await db().collection('admin_notes').add({ providerId: uid, context: 'profile', note: text, team: request.data?.team || null, authorId: s.uid, authorName: s.actor.name, createdAt: now })
  await recordAudit(request, { actorId: s.uid, action: 'provider.note_added', entityId: uid, entityType: 'provider', metadata: { noteId: ref.id } })
  return { success: true, note: { id: ref.id, text, author: s.actor.name, team: request.data?.team || null, date: 'Just now', createdAt: now.toMillis() } }
})

/**
 * ADM-022 quick moderation of the provider's pending profile photo / gallery
 * items. Goes through the same moderation records and write-back as ADM-035.
 * data: { providerId, itemType: 'photo'|'gallery', status: 'approved'|'changes_requested'|'rejected', reasonLabel?, adminNote? }
 */
export const adminUpdateProviderContentStatus = onCall(async (request) => {
  const s = await scope(request, 'content.moderate')
  const d = request.data || {}
  const uid = requireUid(d.providerId)
  const status = String(d.status || '')
  if (!['approved', 'changes_requested', 'rejected'].includes(status)) throw new HttpsError('invalid-argument', 'Choose a moderation decision.')
  const reason = String(d.reasonLabel || d.reasonCode || '').trim() || null
  if (status !== 'approved' && !reason) throw new HttpsError('invalid-argument', 'A reason is required to request changes or reject.')
  const types = d.itemType === 'gallery' ? ['gallery'] : ['profile_photo', 'gallery']
  const open = await db().collection('content_moderation').where('providerId', '==', uid).where('status', 'in', ['awaiting_review', 'under_review', 'resubmitted']).limit(50).get()
  const targets = open.docs.filter((x) => types.includes(x.get('contentType')) && (!d.itemId || x.id === d.itemId || x.get('contentId') === d.itemId))
  if (!targets.length) throw new HttpsError('failed-precondition', 'There is no pending content for this provider.')
  assertProviderMarket(s, targets[0].get('countryCode'))
  await db().runTransaction(async (tx) => {
    const now = Timestamp.now()
    const prepared = []
    for (const t of targets) {
      const snap = await tx.get(t.ref)
      const raw = snap.data()
      const patch = { status, decision: status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'request_changes', reason, reviewedBy: s.actor, reviewedAt: now, media: (raw.media || []).map((m) => ({ ...m, status })) }
      prepared.push({ ref: t.ref, raw, patch, wb: await prepareWriteBack(tx, db(), raw, patch) })
    }
    for (const p of prepared) {
      applyWriteBack(tx, db(), p.wb)
      tx.update(p.ref, p.patch)
      tx.set(db().collection('content_moderation_history').doc(), historyEntry(p.ref.id, `${status.replace('_', ' ')} from the provider profile${reason ? ` — ${reason}` : ''}`, s.actor, now, { decision: p.patch.decision }))
    }
  })
  await recordAudit(request, { actorId: s.uid, action: `content.${status}`, entityId: uid, entityType: 'provider', metadata: { items: targets.map((x) => x.id), reason, note: d.adminNote || null } })
  return { success: true, review: { status, items: targets.length, reviewedAt: new Date().toISOString() } }
})

/** ADM-020 — data: { market, dateRange, timeZone? } */
export const adminGetProviderDashboard = onCall(async (request) => {
  const s = await scope(request)
  const market = String(request.data?.market || 'ALL').toUpperCase()
  if (market !== 'ALL' && !MARKETS[market]) throw new HttpsError('invalid-argument', 'Unknown market.')
  if (market !== 'ALL' && !canAccessMarket(s.access, market)) throw new HttpsError('permission-denied', 'You do not have access to this market.', { reason: 'market-denied' })
  const tz = safeTimeZone(request.data?.timeZone)
  const range = { '7d': '7d', '30d': '30d', today: 'today', this_month: 'this_month' }[request.data?.dateRange] || '30d'
  const { start, end } = getDateBounds(range, null, tz)
  const [providers, bookings, verificationRequests, content, subscriptions, subscriptionPayments, safety] = await Promise.all([
    loadAllProviders(db()),
    readAll('bookings', { limit: 10000 }),
    readAll('verification_requests', { limit: 5000 }),
    readAll('content_moderation', { limit: 5000 }),
    readAll('subscriptions', { limit: 10000 }),
    readAll('subscription_payments', { limit: 10000 }),
    readAll('safety_reports', { limit: 3000 }),
  ])
  const view = buildProviderDashboardView(
    { providers, bookings: normalizeProviderBookings(bookings.rows).map((x) => x.b), verificationRequests: verificationRequests.rows, content: content.rows, subscriptions: subscriptions.rows, subscriptionPayments: subscriptionPayments.rows, safety: safety.rows },
    { market, markets: s.unrestricted ? null : s.access.markets, start: start.getTime(), end: end.getTime(), now: Date.now() },
  )
  return { ...view, dateRange: range, generatedAt: new Date().toISOString() }
})
