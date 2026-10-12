import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { ALL_MARKETS, adminAccess, canAccessMarket } from './accessModel.js'
import { MARKETS } from './dashboardLogic.js'
import { loadProvider } from './platformData.js'
import { serviceView } from './providerViews.js'
import { calculateServicesSummary, filterServices, validateServiceModeration } from './providerServicesLogic.js'

// ADM-023 — Provider Services & Pricing (REUSE / ADMIN VIEW) over the
// provider's own `<type collection>/{uid}/services` records. Moderation and
// activation write those records directly (moderationStatus / isActive), the
// fields the mobile app reads, and notify the provider.

const db = () => getFirestore()

async function context(request, permission = 'providers.view') {
  const uid = await requireAdmin(request, { permission })
  const access = await adminAccess(uid)
  const providerId = String(request.data?.providerId || '').trim()
  if (!providerId || providerId.includes('/')) throw new HttpsError('invalid-argument', 'A provider ID is required.')
  const provider = await loadProvider(db(), providerId)
  if (!provider) throw new HttpsError('not-found', 'Provider not found.')
  const ok = provider.countryCode ? canAccessMarket(access, provider.countryCode) : access.markets.includes(ALL_MARKETS)
  if (!ok) throw new HttpsError('permission-denied', 'You do not have access to providers in this market.', { reason: 'market-denied' })
  if (!provider.refs.detail) throw new HttpsError('failed-precondition', 'This provider has no profile record yet.')
  return { uid, access, actor: { id: uid, name: access.fullName || 'Admin' }, provider, currency: MARKETS[provider.countryCode]?.currency || 'KES' }
}

const serviceRef = (provider, id) => {
  const sid = String(id || '').trim()
  if (!sid || sid.includes('/')) throw new HttpsError('invalid-argument', 'A service ID is required.')
  return provider.refs.detail.collection('services').doc(sid)
}

/** data: { providerId, tab, search, category, priceRange, availability, status } */
export const adminGetProviderServices = onCall(async (request) => {
  const { provider, currency } = await context(request)
  const snap = await provider.refs.detail.collection('services').limit(500).get()
  const services = snap.docs.filter((d) => !d.get('isDeleted')).map((d) => serviceView(d.id, d.data(), currency))
  const { tab = 'all', search = '', category = 'all', priceRange = 'all', availability = 'all', status = 'all' } = request.data || {}
  const filtered = filterServices(services, { tab, search, category, priceRange, availability, status })
  return { success: true, services: filtered, totalMatching: filtered.length, stats: calculateServicesSummary(services, currency), provider: { ...provider, refs: undefined, id: provider.uid } }
})

/** data: { providerId, serviceId } */
export const adminGetProviderServiceDetail = onCall(async (request) => {
  const { provider, currency } = await context(request)
  const snap = await serviceRef(provider, request.data?.serviceId).get()
  if (!snap.exists) throw new HttpsError('not-found', 'Service not found.')
  // The app does not keep a price history; the current price is the only record.
  return { success: true, service: serviceView(snap.id, snap.data(), currency), priceHistory: [] }
})

/** data: { providerId, serviceId, action: approve|request_changes|reject, reasonCode?, reasonLabel?, messageToProvider?, adminNote? } */
export const adminModerateProviderService = onCall(async (request) => {
  const { uid, actor, provider } = await context(request, 'content.moderate')
  const d = request.data || {}
  const v = validateServiceModeration(d)
  if (!v.valid) throw new HttpsError('invalid-argument', v.error)
  const ref = serviceRef(provider, d.serviceId)
  const now = FieldValue.serverTimestamp()
  const status = { approve: 'approved', request_changes: 'changes_requested', reject: 'rejected' }[d.action]
  const reason = d.reasonLabel || d.reasonCode || d.messageToProvider || null
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw new HttpsError('not-found', 'Service not found.')
    tx.update(ref, status === 'approved' ? { moderationStatus: 'approved', status: 'published', rejectionReason: null, updatedAt: now } : { moderationStatus: status, rejectionReason: reason, updatedAt: now })
    const name = snap.get('serviceName') || snap.get('name') || 'Your service'
    tx.set(db().collection('notifications').doc(), { userId: provider.uid, title: status === 'approved' ? `${name} approved` : status === 'rejected' ? `${name} not approved` : `${name} needs changes`, message: d.messageToProvider || reason || 'Your service is now live on Lé Inspa.', notificationType: 'service_moderation', relatedId: ref.id, isRead: false, read: false, createdAt: now })
    tx.set(db().collection('audit_logs').doc(), { actorId: uid, action: `PROVIDER_SERVICE_${d.action.toUpperCase()}`, entityId: ref.path, entityType: 'provider_service', metadata: { providerId: provider.uid, reason, adminNote: d.adminNote || null, reviewer: actor.name }, timestamp: now })
  })
  return { success: true, moderation: { serviceId: ref.id, action: d.action, status, reviewedAt: new Date().toISOString() } }
})

/** data: { providerId, serviceId, active: boolean, adminNote } */
export const adminUpdateProviderServiceStatus = onCall(async (request) => {
  const { uid, provider } = await context(request, 'content.moderate')
  const d = request.data || {}
  if (typeof d.active !== 'boolean') throw new HttpsError('invalid-argument', 'active (boolean) is required.')
  if (!d.active && !String(d.adminNote || '').trim()) throw new HttpsError('invalid-argument', 'A reason is required to deactivate a provider service.')
  const ref = serviceRef(provider, d.serviceId)
  const now = FieldValue.serverTimestamp()
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw new HttpsError('not-found', 'Service not found.')
    tx.update(ref, { isActive: d.active, updatedAt: now })
    if (!d.active) tx.set(db().collection('notifications').doc(), { userId: provider.uid, title: 'Service deactivated', message: `${snap.get('serviceName') || snap.get('name') || 'A service'} was deactivated by Lé Inspa: ${d.adminNote}`, notificationType: 'service_moderation', relatedId: ref.id, isRead: false, read: false, createdAt: now })
    tx.set(db().collection('audit_logs').doc(), { actorId: uid, action: d.active ? 'PROVIDER_SERVICE_ACTIVATED' : 'PROVIDER_SERVICE_DEACTIVATED', entityId: ref.path, entityType: 'provider_service', metadata: { providerId: provider.uid, adminNote: d.adminNote || null }, timestamp: now })
  })
  return { success: true, serviceId: ref.id, active: d.active }
})
