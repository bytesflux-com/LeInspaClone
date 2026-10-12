import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'
import { countryCodeOf, loadUsers, lowerStatus, PROVIDER_TYPES, providerTypeOf } from './platformData.js'

// ADM-035 → ADM-039 bridge between the mobile app's content submissions and
// the Admin moderation records (`content_moderation`, one per submission,
// referencing — never copying — the provider's content):
//
//   verification_requests  requestType gallery_photo | gallery_photo_edit → gallery
//                          requestType profile_photo                       → profile_photo
//                          requestType profile_text_change                 → profile_change
//   professional_profile_update_requests (status pending)                  → profile_change
//   <type collection>/{uid}/services (moderationStatus pending)            → service
//
// Decisions are written back to the source in the app's own vocabulary:
// request status approved | rejected | reviewed, gallery moderationStatus,
// service moderationStatus/status, and a notification the app displays.

const PROFILE_FIELDS = {
  displayName: 'Display Name',
  bio: 'Bio',
  professionalTitle: 'Professional Title',
  yearsExperience: 'Years of Experience',
  languages: 'Languages',
  city: 'City',
  region: 'Region',
  country: 'Country',
  professionalSkills: 'Professional Skills',
  sessionTypes: 'Session Types',
  serviceRadiusKm: 'Service Radius (km)',
  homeServiceAvailable: 'Home Service',
  spaServiceAvailable: 'Spa Service',
  profilePhoto: 'Profile Photo',
  treatmentPhotos: 'Treatment Photos',
  countiesServed: 'Counties Served',
}
// Fields mirrored on provider_profiles (the shared provider summary).
const SHARED_PROFILE_FIELDS = new Set(['displayName', 'bio', 'professionalTitle', 'yearsExperience', 'languages', 'city', 'region', 'country', 'profilePhoto'])

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

function providerBits(uid, user = {}, detail = {}) {
  const type = providerTypeOf(user.accountType) || providerTypeOf(detail.accountType) || providerTypeOf(detail.providerCategory)
  return {
    providerId: uid,
    providerName: detail.businessName || detail.displayName || detail.fullName || user.displayName || user.fullName || 'Provider',
    providerType: type,
    providerVerified: ['approved', 'verified'].includes(lowerStatus(detail.verificationStatus)) || user.isVerified === true,
    providerCity: detail.city || user.city || null,
    providerPhotoUrl: detail.profilePhoto || user.profilePhoto || null,
    countryCode: countryCodeOf(user.countryCode, user.country, detail.country),
    providerCollection: type ? PROVIDER_TYPES[type].collection : null,
  }
}

/** content_moderation record (fields only) for a pending verification_requests content item, or null. */
export function recordFromVerificationRequest(id, d, user = {}, detail = {}) {
  const kind = lowerStatus(d.requestType)
  const uid = d.userId || d.providerId
  const p = providerBits(uid, user, { providerCategory: d.providerCategory, ...detail })
  const base = { ...p, status: 'awaiting_review', priority: 'normal', contentVersion: 1, submittedAt: d.submittedAt || d.createdAt || null, source: { kind: 'verification_request', collection: 'verification_requests', id, requestType: kind, providerCollection: p.providerCollection } }
  if (kind === 'gallery_photo' || kind === 'gallery_photo_edit') {
    const photo = d.photoData || {}
    const mediaId = d.galleryImageId || id
    return {
      ...base,
      contentId: mediaId,
      contentType: 'gallery',
      title: kind === 'gallery_photo_edit' ? 'Gallery photo update' : 'New gallery photo',
      media: [{ mediaId, url: photo.imageUrl || d.fileUrl || null, thumbnailUrl: photo.thumbnailUrl || null, title: photo.caption || 'Gallery photo', caption: photo.caption || null, description: photo.description || null, category: photo.category || null, isFeatured: Boolean(photo.isFeatured), status: 'awaiting_review', version: 1, complianceFlags: d.complianceFlags || null }],
      source: { ...base.source, galleryPath: p.providerCollection && uid && d.galleryImageId ? `${p.providerCollection}/${uid}/gallery/${d.galleryImageId}` : null },
    }
  }
  if (kind === 'profile_photo') {
    return { ...base, contentId: id, contentType: 'profile_photo', title: 'Profile photo', media: [{ mediaId: id, url: d.photoData?.imageUrl || d.fileUrl || d.profilePhoto || null, title: 'Profile photo', status: 'awaiting_review', version: 1 }] }
  }
  if (kind === 'profile_text_change') {
    const fields = Object.entries(d.changedFields || {}).map(([key, v]) => ({ key, label: v?.label || PROFILE_FIELDS[key] || key, path: key, current: v?.oldValue ?? null, proposed: v?.newValue ?? null }))
    return { ...base, contentId: id, contentType: 'profile_change', title: 'Profile information change', media: [], profileChange: { fields, proposedVersion: 1 } }
  }
  return null
}

/** content_moderation record for a pending professional_profile_update_requests doc (diff against the live profile). */
export function recordFromProfileUpdate(id, d, user = {}, detail = {}) {
  const uid = d.userId || d.providerId
  const p = providerBits(uid, user, detail)
  const protectedFields = new Set(d.changedProtectedFields || [])
  const fields = Object.entries(PROFILE_FIELDS)
    .filter(([key]) => d[key] !== undefined && !same(d[key], detail[key]))
    .map(([key, label]) => ({ key, label, path: key, current: detail[key] ?? null, proposed: d[key], sensitive: protectedFields.has(key) || undefined }))
  if (!fields.length) return null
  return { ...p, status: 'awaiting_review', priority: 'normal', contentVersion: 1, submittedAt: d.updatedAt || d.createdAt || null, contentId: id, contentType: 'profile_change', title: 'Professional profile update', media: [], profileChange: { fields, proposedVersion: 1, updatedSections: d.updatedSections || [] }, source: { kind: 'profile_update_request', collection: 'professional_profile_update_requests', id, providerCollection: p.providerCollection } }
}

/** content_moderation record for a service awaiting moderation. */
export function recordFromService(path, s, user = {}, detail = {}) {
  const [collection, uid, , serviceId] = path.split('/')
  const p = providerBits(uid, user, { accountType: collection, ...detail })
  return {
    ...p,
    status: 'awaiting_review',
    priority: 'normal',
    contentVersion: 1,
    submittedAt: s.updatedAt || s.createdAt || null,
    contentId: serviceId,
    contentType: 'service',
    title: s.serviceName || s.name || 'Service',
    media: s.imageUrl || s.serviceImage ? [{ mediaId: `${serviceId}_image`, url: s.imageUrl || s.serviceImage, title: 'Service image', status: 'awaiting_review', version: 1 }] : [],
    serviceChange: { serviceId, current: null, proposed: { name: s.serviceName || s.name || null, description: s.description || null, category: s.category || null, price: s.price ?? null, durationMinutes: s.durationMinutes ?? null, currency: s.currency || null, imageUrl: s.imageUrl || s.serviceImage || null } },
    source: { kind: 'service', path, providerCollection: collection },
  }
}

export const moderationIdFor = (kind, id) => `${{ verification_request: 'vr', profile_update_request: 'ppu', service: 'svc' }[kind]}_${id.replace(/\//g, '__')}`

/**
 * Creates content_moderation records for app submissions that are not in the
 * queue yet. Idempotent (deterministic ids, create-only). Returns the count created.
 */
export async function syncContentQueue(db) {
  try {
    const [vr, ppu, svc] = await Promise.all([
      db.collection('verification_requests').where('status', '==', 'pending').limit(1000).get(),
      db.collection('professional_profile_update_requests').where('status', '==', 'pending').limit(1000).get(),
      db.collectionGroup('services').where('moderationStatus', '==', 'pending').limit(1000).get(),
    ])
    const vrDocs = vr.docs.filter((d) => ['gallery_photo', 'gallery_photo_edit', 'profile_photo', 'profile_text_change'].includes(lowerStatus(d.get('requestType'))))
    const candidates = [
      ...vrDocs.map((d) => ({ id: moderationIdFor('verification_request', d.id), doc: d, kind: 'vr' })),
      ...ppu.docs.map((d) => ({ id: moderationIdFor('profile_update_request', d.id), doc: d, kind: 'ppu' })),
      ...svc.docs.map((d) => ({ id: moderationIdFor('service', d.ref.path), doc: d, kind: 'svc' })),
    ]
    if (!candidates.length) return 0
    const existing = new Set()
    for (let i = 0; i < candidates.length; i += 300) {
      const snaps = await db.getAll(...candidates.slice(i, i + 300).map((c) => db.collection('content_moderation').doc(c.id)))
      snaps.forEach((s) => s.exists && existing.add(s.id))
    }
    const missing = candidates.filter((c) => !existing.has(c.id))
    if (!missing.length) return 0
    const owner = (c) => (c.kind === 'svc' ? c.doc.ref.path.split('/')[1] : c.doc.get('userId') || c.doc.get('providerId'))
    const users = await loadUsers(db, missing.map(owner))
    const batch = db.batch()
    let created = 0
    for (const c of missing) {
      const uid = owner(c)
      const user = users.get(uid) || {}
      let rec = null
      // Provider details live on the type-collection document (users can be missing).
      const type = providerTypeOf(user.accountType) || providerTypeOf(c.doc.get('providerCategory')) || providerTypeOf(c.doc.get('accountType')) || providerTypeOf(c.doc.get('collection')) || (c.kind === 'svc' ? providerTypeOf(c.doc.ref.path.split('/')[0]) : null)
      const detail = type && uid ? (await db.collection(PROVIDER_TYPES[type].collection).doc(uid).get()).data() || {} : {}
      if (c.kind === 'vr') rec = recordFromVerificationRequest(c.doc.id, c.doc.data(), user, detail)
      else if (c.kind === 'svc') rec = recordFromService(c.doc.ref.path, c.doc.data(), user, detail)
      else rec = recordFromProfileUpdate(c.doc.id, c.doc.data(), user, detail)
      if (!rec) continue
      batch.create(db.collection('content_moderation').doc(c.id), { ...rec, submittedAt: rec.submittedAt || Timestamp.now(), syncedAt: Timestamp.now() })
      created += 1
    }
    if (created) await batch.commit()
    return created
  } catch (err) {
    logger.warn('[content] queue sync failed', err.message)
    return 0
  }
}

const FINAL = new Set(['approved', 'rejected', 'changes_requested'])

/**
 * Reads what a write-back needs (call before any transaction write).
 * `raw` is the stored moderation record, `patch` the update being applied.
 */
export async function prepareWriteBack(tx, db, raw, patch) {
  const src = raw?.source
  const status = patch.status
  if (!src || !FINAL.has(status) || status === raw.status) return null
  const refs = {}
  if (src.collection && src.id) refs.request = db.collection(src.collection).doc(src.id)
  if (src.galleryPath) refs.gallery = db.doc(src.galleryPath)
  if (src.kind === 'service' && src.path) refs.service = db.doc(src.path)
  const snaps = {}
  for (const [k, ref] of Object.entries(refs)) snaps[k] = await tx.get(ref)
  return { src, status, refs, snaps, reason: patch.reason || raw.reason || null, providerMessage: patch.providerMessage || null, providerId: raw.providerId, title: raw.title || 'Your content' }
}

/** Applies a prepared write-back (after all transaction reads). */
export function applyWriteBack(tx, db, wb) {
  if (!wb) return
  const now = FieldValue.serverTimestamp()
  const { status, refs, snaps, reason } = wb
  if (snaps.request?.exists) {
    tx.update(refs.request, status === 'approved'
      ? { status: 'approved', resolvedAt: now, updatedAt: now, rejectionReason: null }
      : status === 'rejected'
        ? { status: 'rejected', resolvedAt: now, updatedAt: now, rejectionReason: reason }
        : { status: 'reviewed', updatedAt: now, rejectionReason: reason, requiredActions: [reason].filter(Boolean) })
  }
  if (snaps.gallery?.exists) {
    tx.update(refs.gallery, status === 'approved' ? { moderationStatus: 'approved', rejectionReason: null, updatedAt: now } : { moderationStatus: status === 'rejected' ? 'rejected' : 'changes_requested', rejectionReason: reason, updatedAt: now })
  }
  if (snaps.service?.exists) {
    tx.update(refs.service, status === 'approved' ? { moderationStatus: 'approved', status: 'published', updatedAt: now } : { moderationStatus: status === 'rejected' ? 'rejected' : 'changes_requested', rejectionReason: reason, updatedAt: now })
  }
  if (wb.providerId) {
    const title = status === 'approved' ? `${wb.title} approved` : status === 'rejected' ? `${wb.title} not approved` : `${wb.title} needs changes`
    tx.set(db.collection('notifications').doc(), { userId: wb.providerId, title, message: wb.providerMessage || reason || (status === 'approved' ? 'Your submission is now live on Lé Inspa.' : 'Please review the moderation feedback in your app.'), notificationType: 'content_moderation', relatedId: wb.src.id || wb.src.path || null, isRead: false, read: false, createdAt: now })
  }
}

/** Live profile targets for publishing approved profile fields. */
export function profileTargets(db, raw) {
  const uid = raw?.providerId
  const col = raw?.source?.providerCollection || (raw?.providerType ? PROVIDER_TYPES[providerTypeOf(raw.providerType)]?.collection : null)
  return uid && col ? { detail: db.collection(col).doc(uid), profile: db.collection('provider_profiles').doc(uid) } : null
}
export const isSharedProfileField = (key) => SHARED_PROFILE_FIELDS.has(key)
