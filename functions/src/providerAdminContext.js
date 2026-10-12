import { HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { ALL_MARKETS, adminAccess, canAccessMarket } from './accessModel.js'
import { normalizeProvider, trustPermissions } from './providerAdminShared.js'

// Shared callable plumbing for ADM-025 → ADM-028. Every call:
//   1. authenticates the admin (2FA + active session; `fresh` for high-risk writes),
//   2. checks the role permission,
//   3. resolves the provider from the existing provider records,
//   4. enforces market access server-side (the country selector is navigation only).

export const db = () => getFirestore()

export async function providerScope(request, { permission = 'providers.view', fresh = false } = {}) {
  const uid = await requireAdmin(request, { permission, fresh })
  const access = await adminAccess(uid)
  return { uid, access, perms: trustPermissions(access), actor: { id: uid, name: access.fullName || 'Admin', role: access.roleName || null } }
}

export const requireProviderId = (value) => {
  const id = String(value || '').trim()
  if (!id || id.includes('/') || id.length > 128) throw new HttpsError('invalid-argument', 'A provider ID is required.')
  return id
}

// Looks the provider up in the existing records: providers/{id}, then a
// providers doc whose providerId matches, then users/{id}. Never a copy.
export async function loadProvider(providerId, access) {
  const providers = db().collection('providers')
  let snap = await providers.doc(providerId).get()
  if (!snap.exists) {
    const q = await providers.where('providerId', '==', providerId).limit(1).get()
    snap = q.empty ? await db().collection('users').doc(providerId).get() : q.docs[0]
  }
  if (!snap.exists) throw new HttpsError('not-found', 'Provider not found.')
  const provider = normalizeProvider(snap.id, snap.data())
  const allowed = provider.marketCode ? canAccessMarket(access, provider.marketCode) : access.markets.includes(ALL_MARKETS)
  if (!allowed) {
    throw new HttpsError('permission-denied', 'You do not have access to providers in this market.', { reason: 'market-denied' })
  }
  return { ref: snap.ref, raw: snap.data(), provider }
}

// A query that degrades to [] (with a log) instead of failing the whole screen
// when an optional related collection is missing or unindexed.
export async function safeDocs(query, label, limit = 2000) {
  try {
    const snap = await query.limit(limit).get()
    return { docs: snap.docs.map((d) => ({ id: d.id, ...d.data() })), truncated: snap.size >= limit }
  } catch (err) {
    logger.warn(`[provider-admin] ${label} lookup failed`, err.message)
    return { docs: [], truncated: false }
  }
}

// IDs the provider may be stored under across the shared collections.
export const providerKeys = (provider) => [...new Set([provider.id, provider.docId, provider.userId].filter(Boolean))].slice(0, 10)

export async function docsForProvider(collection, provider, label, { field = 'providerId', limit = 2000 } = {}) {
  return safeDocs(db().collection(collection).where(field, 'in', providerKeys(provider)), label, limit)
}

// Queues a notice in the shared `notifications` collection; delivery (push /
// email) is handled by the platform notification pipeline.
export function queueNotification(tx, n) {
  const ref = db().collection('notifications').doc()
  tx.set(ref, {
    recipientId: n.recipientId,
    recipientType: n.recipientType,
    category: n.category || 'account',
    type: n.type,
    title: n.title,
    body: n.body,
    channels: n.channels || ['in_app', 'email'],
    status: 'queued',
    read: false,
    related: n.related || null,
    createdAt: FieldValue.serverTimestamp(),
  })
  return ref.id
}

export function auditEntry(tx, request, { actorId, action, entityId, entityType, metadata = {} }) {
  const raw = request.rawRequest
  tx.set(db().collection('audit_logs').doc(), {
    actorId,
    action,
    entityId,
    entityType,
    metadata: { ...metadata, platform: 'admin_web', ipAddress: raw?.ip ?? null, userAgent: raw?.get?.('user-agent') ?? null },
    timestamp: FieldValue.serverTimestamp(),
  })
}

export function rethrow(label, err, fallback) {
  if (err instanceof HttpsError) throw err
  logger.error(`[${label}]`, err)
  throw new HttpsError('internal', fallback)
}
