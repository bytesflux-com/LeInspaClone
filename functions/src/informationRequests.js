import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { ALL_MARKETS, adminAccess, canAccessMarket } from './accessModel.js'
import { recordAudit } from './events.js'
import { CONTENT_TYPES, normalizeModeration, toMillis } from './contentModerationLogic.js'
import {
  CHANNELS,
  DEFAULT_DEADLINE_HOURS,
  MODULES,
  OPEN,
  REMINDER_DEFAULTS,
  REQUEST_TYPES,
  RESPONSE_TYPES,
  TEMPLATES,
  TYPES_BY_MODULE,
  allowedActions,
  deriveStatus,
  duplicateItems,
  normalizeItems,
  progress,
  validateRequest,
} from './informationRequestLogic.js'

// ADM-040 — Request More Information (SHARED across Admin modules).
//
// Collection: information_requests — one structured request per case, with
// item-level statuses so partial responses are tracked exactly. The request
// keeps its origin (module + record) so "Continue Review" returns to the case.
// Provider responses are written by the provider app (item.status/response);
// this module derives status from them and never rejects a provider.

const db = () => getFirestore()
const col = () => db().collection('information_requests')

// Permission needed to request information from each originating workflow.
const PERMISSION_BY_MODULE = {
  verification: 'providers.verify',
  content: 'content.moderate',
  profile_change: 'content.moderate',
  service: 'content.moderate',
  account: 'users.suspend',
  safety: 'safety.manage',
  finance: 'payments.view',
}

async function guard(request, originModule) {
  if (!MODULES[originModule]) throw new HttpsError('invalid-argument', 'Unknown originating workflow.')
  const uid = await requireAdmin(request, { permission: PERMISSION_BY_MODULE[originModule] })
  const access = await adminAccess(uid)
  return { uid, access, actor: { id: uid, name: access.fullName || 'Admin' } }
}

function assertMarket(access, countryCode) {
  const ok = countryCode ? canAccessMarket(access, countryCode) : access.markets.includes(ALL_MARKETS)
  if (!ok) throw new HttpsError('permission-denied', 'You do not have access to this case.', { reason: 'market-denied' })
}

// Resolve the originating case server-side; the client never supplies it.
async function resolveOrigin(originModule, originRecordId) {
  const id = String(originRecordId || '').trim()
  if (!id || id.includes('/')) throw new HttpsError('invalid-argument', 'The originating case is required.')
  if (['content', 'profile_change', 'service'].includes(originModule)) {
    const snap = await db().collection('content_moderation').doc(id).get()
    if (!snap.exists) throw new HttpsError('not-found', 'The originating content review no longer exists.')
    const r = normalizeModeration(snap.id, snap.data())
    return {
      originModule,
      originRecordId: id,
      reviewType: r.contentType === 'profile_change' ? 'Profile Information Change' : r.contentType === 'service' ? 'Service Information' : CONTENT_TYPES[r.contentType],
      caseId: r.contentId,
      caseStatus: r.status,
      relatedItem: r.title || r.contentLabel,
      provider: { id: r.provider.id, ref: r.provider.ref, name: r.provider.name, typeLabel: r.provider.typeLabel, photoUrl: r.provider.photoUrl, verified: r.provider.verified, city: r.provider.city },
      countryCode: r.countryCode,
    }
  }
  // Verification / account / safety / finance cases are keyed by the provider's user record.
  const snap = await db().collection('users').doc(id).get()
  if (!snap.exists) throw new HttpsError('not-found', 'The originating case no longer exists.')
  const u = snap.data()
  return {
    originModule,
    originRecordId: id,
    reviewType: originModule === 'verification' ? 'Professional Verification' : MODULES[originModule].label,
    caseId: `${originModule === 'verification' ? 'VER' : 'CASE'}-${id.slice(0, 8).toUpperCase()}`,
    caseStatus: u.professionalVerificationStatus || u.accountStatus || null,
    relatedItem: null,
    provider: { id, ref: u.providerRef || id, name: u.fullName || u.displayName || u.name || 'Provider', typeLabel: u.accountType || null, photoUrl: u.photoURL || u.profileImage || null, verified: u.professionalVerificationStatus === 'approved', city: u.city || null },
    countryCode: String(u.countryCode || '').toUpperCase() || null,
  }
}

function view(id, d, now) {
  const req = { ...d, requestId: id }
  const status = deriveStatus(req, now)
  return {
    requestId: id,
    reference: d.reference || id,
    originModule: d.originModule,
    originRecordId: d.originRecordId,
    origin: d.origin || null,
    requestType: d.requestType,
    requestTypeLabel: REQUEST_TYPES[d.requestType] || d.requestType,
    status,
    progress: progress(req),
    items: (d.items || []).map((i) => ({ ...i, respondedAt: toMillis(i.respondedAt) ? new Date(toMillis(i.respondedAt)).toISOString() : null })),
    providerMessage: d.providerMessage,
    internalNote: d.internalNote,
    dueAt: toMillis(d.dueAt) ? new Date(toMillis(d.dueAt)).toISOString() : null,
    reminders: d.reminders || REMINDER_DEFAULTS,
    channels: d.channels || [],
    createdBy: d.createdBy || null,
    createdAt: toMillis(d.createdAt) ? new Date(toMillis(d.createdAt)).toISOString() : null,
    sentAt: toMillis(d.sentAt) ? new Date(toMillis(d.sentAt)).toISOString() : null,
    respondedAt: toMillis(d.respondedAt) ? new Date(toMillis(d.respondedAt)).toISOString() : null,
    history: (d.history || []).map((h) => ({ ...h, at: toMillis(h.at) ? new Date(toMillis(h.at)).toISOString() : null })),
    actions: allowedActions(status),
    countryCode: d.countryCode,
  }
}

async function requestsForOrigin(originModule, originRecordId, now) {
  try {
    const snap = await col().where('originRecordId', '==', originRecordId).limit(50).get()
    return snap.docs.filter((d) => d.get('originModule') === originModule).map((d) => view(d.id, d.data(), now)).sort((a, z) => String(z.createdAt).localeCompare(String(a.createdAt)))
  } catch (err) {
    logger.warn('information request history failed', err.message)
    return []
  }
}

/**
 * Workspace for a new request: resolved case context, templates, response
 * types, deadline defaults and the case's previous requests.
 * data: { originModule, originRecordId }
 */
export const adminGetInfoRequestWorkspace = onCall(async (request) => {
  const { originModule, originRecordId } = request.data || {}
  const { access } = await guard(request, originModule)
  const origin = await resolveOrigin(originModule, originRecordId)
  assertMarket(access, origin.countryCode)
  const now = Date.now()
  return {
    origin,
    requestTypes: TYPES_BY_MODULE[originModule].map((id) => ({ id, label: REQUEST_TYPES[id] })),
    responseTypes: Object.entries(RESPONSE_TYPES).map(([id, l]) => ({ id, label: l })),
    template: TEMPLATES[originModule],
    defaultDeadlineHours: DEFAULT_DEADLINE_HOURS[originModule],
    reminderDefaults: REMINDER_DEFAULTS,
    channels: Object.entries(CHANNELS).map(([id, l]) => ({ id, label: l })),
    history: await requestsForOrigin(originModule, origin.originRecordId, now),
  }
})

/**
 * Save a draft or send a request.
 * data: { requestId?, send: boolean, originModule, originRecordId, requestType, items[], providerMessage, internalNote?, dueAt?, reminders?, channels[] }
 */
export const adminSaveInfoRequest = onCall(async (request) => {
  const d = request.data || {}
  const { uid, access, actor } = await guard(request, d.originModule)
  const origin = await resolveOrigin(d.originModule, d.originRecordId)
  assertMarket(access, origin.countryCode)
  const now = Date.now()
  const send = d.send === true
  const payload = {
    originModule: d.originModule,
    originRecordId: origin.originRecordId,
    origin,
    providerId: origin.provider.id,
    countryCode: origin.countryCode,
    requestType: d.requestType,
    items: normalizeItems(d.items),
    providerMessage: String(d.providerMessage || '').slice(0, 1000),
    internalNote: String(d.internalNote || '').slice(0, 1000),
    dueAt: d.dueAt ? Timestamp.fromMillis(toMillis(d.dueAt)) : null,
    reminders: { ...REMINDER_DEFAULTS, ...(d.reminders || {}) },
    channels: (d.channels || []).filter((c) => CHANNELS[c]),
  }
  if (send) {
    const error = validateRequest({ ...payload, providerId: origin.provider.id, dueAt: d.dueAt }, now)
    if (error) throw new HttpsError('invalid-argument', error)
  }

  const open = (await requestsForOrigin(d.originModule, origin.originRecordId, now)).filter((r) => OPEN.includes(r.status) && r.requestId !== d.requestId)
  const dupes = duplicateItems(payload.items, open)
  if (send && dupes.length && d.allowDuplicates !== true) {
    throw new HttpsError('already-exists', `An open request already asks for: ${dupes.map((x) => x.label).join(', ')}.`, { reason: 'duplicate-items', dupes })
  }

  const ts = Timestamp.fromMillis(now)
  const entry = (event) => ({ event, at: ts, actor })
  const ref = d.requestId ? col().doc(String(d.requestId)) : col().doc()
  await db().runTransaction(async (tx) => {
    const existing = d.requestId ? await tx.get(ref) : null
    if (existing && !existing.exists) throw new HttpsError('not-found', 'This draft no longer exists.')
    if (existing && existing.get('status') !== 'draft') throw new HttpsError('failed-precondition', 'Only drafts can be edited. Cancel and replace a sent request instead.')
    const history = [...(existing?.get('history') || []), entry(send ? 'Request sent' : 'Draft saved')]
    tx.set(ref, {
      ...payload,
      reference: existing?.get('reference') || `REQ-${ref.id.slice(0, 6).toUpperCase()}`,
      status: send ? 'sent' : 'draft',
      createdBy: existing?.get('createdBy') || actor,
      createdAt: existing?.get('createdAt') || ts,
      ...(send ? { sentAt: ts, notificationIntent: { channels: payload.channels, at: ts } } : {}),
      history,
    })
    // Link the request to its originating moderation case.
    if (send && ['content', 'profile_change', 'service'].includes(d.originModule)) {
      tx.update(db().collection('content_moderation').doc(origin.originRecordId), { openInfoRequestId: ref.id })
      tx.set(db().collection('content_moderation_history').doc(), { moderationId: origin.originRecordId, event: `More information requested (${payload.items.length} item${payload.items.length === 1 ? '' : 's'})`, actor, at: ts, details: { requestId: ref.id } })
    }
  })
  await recordAudit(request, { actorId: uid, action: send ? 'info_request.sent' : 'info_request.draft_saved', entityId: ref.id, entityType: 'information_request', metadata: { originModule: d.originModule, originRecordId: origin.originRecordId, items: payload.items.length } })
  const saved = await ref.get()
  return view(ref.id, saved.data(), now)
})

async function loadRequest(request, requestId) {
  const id = String(requestId || '').trim()
  if (!id || id.includes('/')) throw new HttpsError('invalid-argument', 'A request ID is required.')
  const snap = await col().doc(id).get()
  if (!snap.exists) throw new HttpsError('not-found', 'This information request no longer exists.')
  const { uid, access, actor } = await guard(request, snap.get('originModule'))
  assertMarket(access, snap.get('countryCode'))
  return { uid, actor, ref: snap.ref, data: snap.data() }
}

/** data: { requestId } */
export const adminGetInfoRequest = onCall(async (request) => {
  const { data, ref } = await loadRequest(request, request.data?.requestId)
  const now = Date.now()
  return { ...view(ref.id, data, now), previous: (await requestsForOrigin(data.originModule, data.originRecordId, now)).filter((r) => r.requestId !== ref.id) }
})

/**
 * Tracking list across modules (status derived per request).
 * data: { status?, originModule?, market? }
 */
export const adminListInfoRequests = onCall(async (request) => {
  const uid = await requireAdmin(request, {})
  const access = await adminAccess(uid)
  const d = request.data || {}
  const now = Date.now()
  const snap = await col().where('createdAt', '>=', Timestamp.fromMillis(now - 90 * 24 * 3600 * 1000)).orderBy('createdAt', 'desc').limit(500).get()
  const items = snap.docs
    .map((doc) => view(doc.id, doc.data(), now))
    .filter((r) => (r.countryCode ? canAccessMarket(access, r.countryCode) : access.markets.includes(ALL_MARKETS)))
    .filter((r) => access.permissions.includes(PERMISSION_BY_MODULE[r.originModule]))
    .filter((r) => (!d.market || d.market === ALL_MARKETS || r.countryCode === d.market) && (!d.originModule || r.originModule === d.originModule) && (!d.status || r.status === d.status))
  const counts = {}
  for (const r of items) counts[r.status] = (counts[r.status] || 0) + 1
  return { items, counts, generatedAt: new Date(now).toISOString() }
})

/**
 * Follow-up actions. Never rejects the provider; the originating workflow decides.
 * data: { requestId, action: remind|extend|cancel|complete|escalate, dueAt? }
 */
export const adminInfoRequestAction = onCall(async (request) => {
  const { requestId, action, dueAt } = request.data || {}
  const { uid, actor, ref, data } = await loadRequest(request, requestId)
  const now = Date.now()
  const status = deriveStatus(data, now)
  const allowed = allowedActions(status)
  if (!allowed[action]) throw new HttpsError('failed-precondition', `You can't ${action} a request that is ${status.replace('_', ' ')}.`)
  const ts = Timestamp.fromMillis(now)
  const patch = {}
  let event
  if (action === 'remind') {
    patch.lastReminderAt = ts
    event = 'Reminder sent'
  } else if (action === 'extend') {
    const ms = toMillis(dueAt)
    if (!ms || ms <= now) throw new HttpsError('invalid-argument', 'Choose a new deadline in the future.')
    patch.dueAt = Timestamp.fromMillis(ms)
    event = `Deadline extended to ${new Date(ms).toISOString().slice(0, 10)}`
  } else if (action === 'cancel') {
    patch.status = 'cancelled'
    event = 'Request cancelled'
  } else if (action === 'complete') {
    patch.status = 'completed'
    patch.completedAt = ts
    event = 'Marked complete — review can continue'
  } else if (action === 'escalate') {
    patch.escalatedAt = ts
    event = 'Escalated after no response'
  }
  await ref.update({ ...patch, history: [...(data.history || []), { event, at: ts, actor }] })
  await recordAudit(request, { actorId: uid, action: `info_request.${action}`, entityId: ref.id, entityType: 'information_request', metadata: { originModule: data.originModule } })
  const fresh = await ref.get()
  return view(ref.id, fresh.data(), now)
})
