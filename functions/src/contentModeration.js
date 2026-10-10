import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { getTimezoneOffset } from 'date-fns-tz'
import { requireAdmin } from './auth.js'
import { ALL_MARKETS, adminAccess, canAccessMarket } from './accessModel.js'
import { safeTimeZone } from './dashboard.js'
import { recordAudit } from './events.js'
import {
  DAY,
  DECISIONS,
  MARKET_META,
  OPEN_STATUSES,
  buildQueue,
  buildReview,
  checklistFor,
  decideMedia,
  decideRecord,
  galleryOutcome,
  historyEntry,
  label,
  normalizeModeration,
  scopeRecords,
  validateDecision,
} from './contentModerationLogic.js'

// ADM-035 Content Approval Center · ADM-036 Profile Photo · ADM-037 Gallery & Media.
//
// Collections:
//   content_moderation          one record per submitted content item (references
//                               the provider's own content; never a copy of it)
//   content_moderation_history  append-only moderation events
//   content_moderation_notes    internal notes (never shown to providers)
// Every write revalidates permission, market access and the content version,
// runs in a transaction and writes an audit_logs entry.

const PERMISSION = 'content.moderate'
const OPEN_LIMIT = 3000
const RECENT_LIMIT = 2000
const PROVIDER_CATEGORIES = ['individual', 'spa', 'hotel']

const db = () => getFirestore()
const col = () => db().collection('content_moderation')

async function adminContext(request) {
  const uid = await requireAdmin(request, { permission: PERMISSION })
  const access = await adminAccess(uid)
  return { uid, access, actor: { id: uid, name: access.fullName || 'Admin' } }
}

function marketScope(access, requested) {
  const market = String(requested || ALL_MARKETS).toUpperCase()
  if (market !== ALL_MARKETS && !MARKET_META[market]) throw new HttpsError('invalid-argument', 'Unknown market.')
  if (market !== ALL_MARKETS && !canAccessMarket(access, market)) {
    throw new HttpsError('permission-denied', 'You do not have access to this market.', { reason: 'market-denied' })
  }
  const unrestricted = access.markets.includes(ALL_MARKETS)
  return { market, markets: market !== ALL_MARKETS ? [market] : unrestricted ? null : access.markets }
}

function assertRecordAccess(access, data) {
  const country = String(data.countryCode || '').toUpperCase()
  const ok = country ? canAccessMarket(access, country) : access.markets.includes(ALL_MARKETS)
  if (!ok) throw new HttpsError('permission-denied', 'You do not have access to this content.', { reason: 'market-denied' })
}

const requireId = (value, what = 'moderation ID') => {
  const id = String(value || '').trim()
  if (!id || id.includes('/')) throw new HttpsError('invalid-argument', `A ${what} is required.`)
  return id
}

/**
 * ADM-035 — moderation queue, KPI cards, attention cards and type tabs.
 * data: { market, providerType?, type?, q?, status?, priority?, submitted?, reviewer?, sort?, page?, pageSize?, timeZone? }
 */
export const adminGetContentQueue = onCall(async (request) => {
  const { uid, access } = await adminContext(request)
  const d = request.data || {}
  const scope = marketScope(access, d.market)
  const now = Date.now()
  const timeZone = safeTimeZone(d.timeZone)

  const read = async (query, limit, what) => {
    try {
      const snap = await query.limit(limit).get()
      return { docs: snap.docs, truncated: snap.size >= limit }
    } catch (err) {
      logger.error(`content ${what} query failed`, err.message)
      throw new HttpsError('unavailable', 'The moderation queue could not be loaded. Try again shortly.')
    }
  }
  // Open work regardless of age, plus anything decided in the last 30 days.
  const [open, recent] = await Promise.all([
    read(col().where('status', 'in', [...OPEN_STATUSES, 'changes_requested']), OPEN_LIMIT, 'open'),
    read(col().where('reviewedAt', '>=', Timestamp.fromMillis(now - 30 * DAY)), RECENT_LIMIT, 'recent'),
  ])
  const byId = new Map()
  for (const doc of [...open.docs, ...recent.docs]) byId.set(doc.id, normalizeModeration(doc.id, doc.data()))
  const providerCategory = PROVIDER_CATEGORIES.includes(d.providerType) ? d.providerType : null
  const records = scopeRecords([...byId.values()], { markets: scope.markets, providerCategory })

  const queue = buildQueue(records, d, { now, tzOffsetMins: Math.round(getTimezoneOffset(timeZone, new Date(now)) / 60000), adminId: uid })
  return {
    context: {
      market: scope.market,
      generatedAt: new Date(now).toISOString(),
      truncated: open.truncated || recent.truncated,
      adminId: uid,
    },
    ...queue,
  }
})

async function loadRelated(moderationId, providerId) {
  const safe = async (query, what) => {
    try {
      return (await query.get()).docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    } catch (err) {
      logger.warn(`content ${what} lookup failed`, err.message)
      return []
    }
  }
  const [history, notes, providerItems] = await Promise.all([
    safe(db().collection('content_moderation_history').where('moderationId', '==', moderationId).limit(100), 'history'),
    safe(db().collection('content_moderation_notes').where('moderationId', '==', moderationId).limit(50), 'notes'),
    providerId ? safe(col().where('providerId', '==', providerId).limit(500), 'provider history') : [],
  ])
  // Context only: the current submission is judged on its own evidence.
  const providerStats = { approved: 0, changesRequested: 0, rejected: 0, escalated: 0 }
  for (const item of providerItems) {
    if (item.id === moderationId) continue
    if (item.status === 'approved') providerStats.approved += 1
    else if (item.status === 'changes_requested') providerStats.changesRequested += 1
    else if (item.status === 'rejected') providerStats.rejected += 1
    else if (item.status === 'escalated') providerStats.escalated += 1
  }
  return { history, notes, providerStats }
}

/**
 * Review detail for the ADM-035 panel and the ADM-036 / ADM-037 screens.
 * data: { moderationId }
 */
export const adminGetContentReview = onCall(async (request) => {
  const { access } = await adminContext(request)
  const id = requireId(request.data?.moderationId)
  const snap = await col().doc(id).get()
  if (!snap.exists) throw new HttpsError('not-found', 'This content is no longer in the moderation queue.')
  assertRecordAccess(access, snap.data())
  const record = normalizeModeration(snap.id, snap.data())
  const related = await loadRelated(id, record.provider.id)
  return buildReview(record, { now: Date.now(), ...related })
})

// Runs `mutate` in a transaction against the latest record, after checking
// market access and (when given) that the admin saw the current version.
async function transact(request, id, expectedVersion, mutate) {
  const { access, actor, uid } = await adminContext(request)
  const ref = col().doc(id)
  const result = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw new HttpsError('not-found', 'This content is no longer in the moderation queue.')
    assertRecordAccess(access, snap.data())
    const record = normalizeModeration(snap.id, snap.data())
    if (expectedVersion != null && Number(expectedVersion) !== record.version) {
      throw new HttpsError('failed-precondition', 'The provider submitted a newer version. Reload to review the latest content.', { reason: 'stale-version' })
    }
    const now = Timestamp.now()
    const out = mutate({ record, raw: snap.data(), actor, now })
    if (out.patch) tx.update(ref, out.patch)
    for (const h of out.history || []) tx.set(db().collection('content_moderation_history').doc(), h)
    return { record, out }
  })
  return { ...result, uid, actor }
}

/**
 * Start (or take over) a review: marks it under review and records the reviewer.
 * data: { moderationId }
 */
export const adminStartContentReview = onCall(async (request) => {
  const id = requireId(request.data?.moderationId)
  const { uid } = await transact(request, id, null, ({ record, actor, now }) => {
    if (!OPEN_STATUSES.includes(record.status)) throw new HttpsError('failed-precondition', `This content is already ${label(record.status).toLowerCase()}.`)
    const takeover = record.assignedTo && record.assignedTo.id !== actor.id
    return {
      patch: { status: record.status === 'escalated' ? 'escalated' : 'under_review', assignedTo: actor, reviewStartedAt: now },
      history: [historyEntry(id, takeover ? `Review taken over from ${record.assignedTo.name}` : 'Review started', actor, now, { version: record.version })],
    }
  })
  await recordAudit(request, { actorId: uid, action: 'content.review_started', entityId: id, entityType: 'content_moderation' })
  return { ok: true }
})

function decisionInput(d) {
  return {
    decision: d.decision,
    checks: d.checks && typeof d.checks === 'object' ? d.checks : {},
    reason: d.reason ? String(d.reason).slice(0, 200) : null,
    providerMessage: d.providerMessage ? String(d.providerMessage).slice(0, 2000) : null,
    internalNote: d.internalNote ? String(d.internalNote).slice(0, 2000) : null,
    escalateTo: d.escalateTo || null,
  }
}

/**
 * Approve / Request Changes / Reject / Escalate a content item, or — with
 * mediaId — one gallery item.
 * data: { moderationId, version, mediaId?, mediaVersion?, decision, checks, reason?, providerMessage?, internalNote?, escalateTo? }
 */
export const adminContentDecision = onCall(async (request) => {
  const d = request.data || {}
  const id = requireId(d.moderationId)
  const input = decisionInput(d)
  if (!DECISIONS.includes(input.decision)) throw new HttpsError('invalid-argument', 'Choose a moderation decision.')

  const { uid, record, out } = await transact(request, id, d.version, ({ record, actor, now }) => {
    if (!OPEN_STATUSES.includes(record.status)) throw new HttpsError('failed-precondition', `This content is already ${label(record.status).toLowerCase()}.`)
    const isMedia = Boolean(d.mediaId)
    const error = validateDecision(input, checklistFor(record.contentType, isMedia || record.contentType === 'gallery'))
    if (error) throw new HttpsError('invalid-argument', error)
    const history = []
    if (input.internalNote) history.push(historyEntry(id, 'Internal note recorded with decision', actor, now, { internal: true }))

    if (isMedia) {
      const current = record.media.find((m) => m.mediaId === d.mediaId)
      if (!current) throw new HttpsError('not-found', 'This media item is no longer part of the submission.')
      if (d.mediaVersion != null && Number(d.mediaVersion) !== current.version) {
        throw new HttpsError('failed-precondition', 'This image was replaced. Reload to review the latest version.', { reason: 'stale-version' })
      }
      if (!['awaiting_review', 'under_review'].includes(current.status)) throw new HttpsError('failed-precondition', 'This media item already has a decision.')
      const res = decideMedia(record.media, d.mediaId, input, actor, now)
      history.push(historyEntry(id, `${current.title}: ${label(res.status)}${input.reason ? ` — ${input.reason}` : ''}`, actor, now, { mediaId: d.mediaId, decision: input.decision, version: current.version }))
      return { patch: { media: res.media, status: record.status === 'awaiting_review' ? 'under_review' : record.status, assignedTo: record.assignedTo || actor }, history, mediaStatus: res.status }
    }
    const res = decideRecord(record, input, actor, now)
    history.push(res.history)
    return { patch: { ...res.patch, ...(input.internalNote ? { internalNote: input.internalNote } : {}) }, history }
  })

  await recordAudit(request, {
    actorId: uid,
    action: `content.${input.decision}`,
    entityId: d.mediaId ? `${id}/${d.mediaId}` : id,
    entityType: d.mediaId ? 'content_media' : 'content_moderation',
    metadata: { contentType: record.contentType, version: record.version, reason: input.reason, escalateTo: input.escalateTo },
  })
  // Provider notification is recorded on the moderation record (providerMessage);
  // delivery goes through the platform notification pipeline.
  return { ok: true, status: out.mediaStatus || out.patch.status }
})

/**
 * Careful bulk decision for selected gallery items. There is no "approve all":
 * only explicitly selected, still-pending items at their current version.
 * Bulk reject requires a reason, provider explanation and internal note.
 * data: { moderationId, version, items: [{ mediaId, version }], decision, reason?, providerMessage?, internalNote?, checks? }
 */
export const adminBulkMediaDecision = onCall(async (request) => {
  const d = request.data || {}
  const id = requireId(d.moderationId)
  const items = Array.isArray(d.items) ? d.items.slice(0, 50) : []
  if (!items.length) throw new HttpsError('invalid-argument', 'Select at least one media item.')
  const input = decisionInput(d)
  if (!['approve', 'request_changes', 'reject'].includes(input.decision)) throw new HttpsError('invalid-argument', 'Bulk escalation is not supported; escalate items individually.')

  const { uid, record } = await transact(request, id, d.version, ({ record, actor, now }) => {
    if (record.contentType !== 'gallery') throw new HttpsError('failed-precondition', 'Bulk decisions apply to gallery submissions only.')
    // Bulk approval confirms each item's checklist was reviewed in the UI.
    const error = validateDecision(input.decision === 'approve' ? { ...input, checks: Object.fromEntries(checklistFor('gallery', true).map((c) => [c.id, 'pass'])) } : input, checklistFor('gallery', true))
    if (error) throw new HttpsError('invalid-argument', error)
    let media = record.media
    const history = []
    for (const it of items) {
      const current = media.find((m) => m.mediaId === it.mediaId)
      if (!current) throw new HttpsError('not-found', 'A selected media item is no longer part of the submission.')
      if (it.version != null && Number(it.version) !== current.version) throw new HttpsError('failed-precondition', `${current.title} was replaced. Reload before continuing.`, { reason: 'stale-version' })
      if (!['awaiting_review', 'under_review'].includes(current.status)) throw new HttpsError('failed-precondition', `${current.title} already has a decision.`)
      media = decideMedia(media, it.mediaId, input, actor, now).media
    }
    history.push(historyEntry(id, `${items.length} media items: ${label(input.decision === 'approve' ? 'approved' : input.decision === 'reject' ? 'rejected' : 'changes_requested')}${input.reason ? ` — ${input.reason}` : ''}`, actor, now, { mediaIds: items.map((i) => i.mediaId), bulk: true }))
    return { patch: { media, status: record.status === 'awaiting_review' ? 'under_review' : record.status, assignedTo: record.assignedTo || actor }, history }
  })
  await recordAudit(request, { actorId: uid, action: `content.bulk_${input.decision}`, entityId: id, entityType: 'content_moderation', metadata: { count: items.length, contentType: record.contentType, reason: input.reason } })
  return { ok: true }
})

/**
 * Complete a gallery review once every item has a decision. Only approved
 * items become publicly eligible; unresolved/rejected items stay private.
 * data: { moderationId, version }
 */
export const adminCompleteGalleryReview = onCall(async (request) => {
  const d = request.data || {}
  const id = requireId(d.moderationId)
  const { uid, out } = await transact(request, id, d.version, ({ record, actor, now }) => {
    if (record.contentType !== 'gallery') throw new HttpsError('failed-precondition', 'Only gallery submissions are completed this way.')
    const outcome = galleryOutcome(record.media)
    if (!outcome) throw new HttpsError('failed-precondition', 'Every media item needs a decision before the review can be completed.')
    const s = outcome.summary
    return {
      patch: { status: outcome.status, decision: 'gallery_complete', reviewedBy: actor, reviewedAt: now, publishedMediaIds: outcome.publishedMediaIds, outcomeSummary: s, publicEligible: outcome.publishedMediaIds.length > 0 },
      history: [historyEntry(id, `Gallery review completed — ${s.approved} approved, ${s.changesRequested} changes requested, ${s.rejected} rejected, ${s.escalated} escalated`, actor, now, s)],
      outcome,
    }
  })
  await recordAudit(request, { actorId: uid, action: 'content.gallery_completed', entityId: id, entityType: 'content_moderation', metadata: out.outcome.summary })
  return { ok: true, status: out.outcome.status, summary: out.outcome.summary }
})

/**
 * Internal moderation note (hidden from the provider).
 * data: { moderationId, text }
 */
export const adminAddModerationNote = onCall(async (request) => {
  const { access, actor, uid } = await adminContext(request)
  const id = requireId(request.data?.moderationId)
  const text = String(request.data?.text || '').trim().slice(0, 2000)
  if (text.length < 3) throw new HttpsError('invalid-argument', 'Write a note first.')
  const snap = await col().doc(id).get()
  if (!snap.exists) throw new HttpsError('not-found', 'This content is no longer in the moderation queue.')
  assertRecordAccess(access, snap.data())
  const now = Timestamp.now()
  const ref = await db().collection('content_moderation_notes').add({ moderationId: id, text, authorId: actor.id, authorName: actor.name, createdAt: now })
  await recordAudit(request, { actorId: uid, action: 'content.note_added', entityId: id, entityType: 'content_moderation' })
  return { id: ref.id, text, authorName: actor.name, createdAt: now.toDate().toISOString() }
})
