import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getDownloadURL, getStorage } from 'firebase-admin/storage'
import { requireAdmin } from './auth.js'
import { ALL_MARKETS, adminAccess, canAccessMarket } from './accessModel.js'
import { PROVIDER_TYPES, loadUsers, providerTypeOf } from './platformData.js'
import {
  aggregates,
  componentsOf,
  filterQueue,
  formatStamp,
  isVerificationRequest,
  planDecision,
  sortQueue,
  toQueueRecord,
} from './verificationLogic.js'

// ADM-029 → ADM-034 — Verification Center callables over `verification_requests`
// (the mobile app's submissions). Reviewer identity always comes from the
// session; market access is enforced per record; decisions run in a
// transaction that reads everything first, then writes the request (app
// format), mirrors the status to users / provider records, queues the app
// notification and writes audit_logs.

const COLLECTION = 'verification_requests'
const db = () => getFirestore()

async function ctx(request, permission = 'providers.view', opts = {}) {
  const uid = await requireAdmin(request, { permission, ...opts })
  const access = await adminAccess(uid)
  return { uid, access, actor: { id: uid, name: access.fullName || 'Admin' } }
}

const requireId = (v, what = 'verificationId') => {
  const id = String(v || '').trim()
  if (!id || id.includes('/')) throw new HttpsError('invalid-argument', `Missing ${what}.`)
  return id
}

function assertMarket(access, record) {
  const ok = record.countryCode ? canAccessMarket(access, record.countryCode) : access.markets.includes(ALL_MARKETS)
  if (!ok) throw new HttpsError('permission-denied', 'You do not have access to verifications in this market.', { reason: 'market-denied' })
}

async function loadOne(id) {
  const ref = db().collection(COLLECTION).doc(id)
  const snap = await ref.get()
  if (!snap.exists || !isVerificationRequest(snap.data())) throw new HttpsError('not-found', 'Verification request not found.')
  const data = snap.data()
  const uid = data.userId || data.providerId
  const user = uid ? (await db().collection('users').doc(uid).get()).data() || {} : {}
  return { ref, data, user, record: toQueueRecord(snap.id, data, user) }
}

async function loadAll(access) {
  const snap = await db().collection(COLLECTION).limit(5000).get()
  const docs = snap.docs.filter((d) => isVerificationRequest(d.data()))
  const users = await loadUsers(db(), docs.map((d) => d.get('userId') || d.get('providerId')))
  const now = Date.now()
  const all = docs.map((d) => toQueueRecord(d.id, d.data(), users.get(d.get('userId') || d.get('providerId')) || {}, now))
  const unrestricted = access.markets.includes(ALL_MARKETS)
  return { records: all.filter((r) => (r.countryCode ? canAccessMarket(access, r.countryCode) : unrestricted)), truncated: snap.size >= 5000 }
}

// Storage path → time-limited signed URL (falls back to a download URL);
// http(s) URLs written by the app are returned as-is.
async function fileUrl(ref) {
  if (!ref) return null
  if (/^https?:\/\//i.test(ref)) return ref
  try {
    const file = getStorage().bucket().file(ref)
    try {
      const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 15 * 60 * 1000 })
      return url
    } catch {
      return await getDownloadURL(file)
    }
  } catch (err) {
    logger.warn('[verification] could not resolve document', ref, err.message)
    return null
  }
}

async function withUrls(docs) {
  return Promise.all(docs.map(async (d) => ({ ...d, fileUrl: await fileUrl(d.ref), fileName: String(d.ref || '').split('/').pop().split('?')[0] || d.title })))
}

const reviewHistoryOf = (data, record) => {
  const admin = (data.adminReview?.reviewHistory || []).map((h) => ({ id: h.id, time: formatStamp(h.timestamp), title: `${String(h.action).replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}${h.reviewerName ? ` by ${h.reviewerName}` : ''}`, actor: h.reviewerName, notes: h.notes || null, type: String(h.action).toLowerCase() }))
  const legacy = ['identity', 'professional', 'business']
    .filter((f) => data[`${f}ReviewedAt`] && !admin.some((h) => h.type.includes(f)))
    .map((f) => ({ id: `legacy-${f}`, time: formatStamp(Number(data[`${f}ReviewedAt`]) || data[`${f}ReviewedAt`]?.toMillis?.()), title: `${f[0].toUpperCase()}${f.slice(1)} ${data[`${f}VerificationStatus`] || 'reviewed'}${data[`${f}ReviewedBy`] ? ` by ${data[`${f}ReviewedBy`]}` : ''}`, actor: data[`${f}ReviewedBy`] || null, type: 'review' }))
  return [...admin, ...legacy, { id: 'submitted', time: record.submittedAt, title: `Submitted by ${record.name}`, actor: record.name, type: 'submission' }]
}

const notesOf = (data, componentKey) =>
  (data.adminReview?.internalNotes || [])
    .filter((n) => !componentKey || !n.componentKey || n.componentKey === componentKey || n.componentKey === 'FINAL')
    .map((n) => ({ id: n.id, authorName: n.authorName, authorRole: n.authorRole || 'Admin', createdAt: formatStamp(n.createdAt), text: n.text }))

const CHECKLISTS = {
  IDENTITY: [
    ['documentTypeAccepted', 'Document type accepted', 'Government-issued ID or passport'],
    ['documentComplete', 'Document appears complete', 'All required sides/pages provided'],
    ['isReadable', 'Document is readable', 'Text and photo are legible'],
    ['nameMatches', 'Name matches / reasonably corresponds', 'Compare with the account name'],
    ['selfieMatches', 'Selfie matches document photo', 'Same person in selfie and ID'],
    ['isCurrent', 'Document is current (not expired)', 'Check the expiry date on the document'],
    ['noTampering', 'No obvious tampering concern', 'No edits, overlays or inconsistencies'],
  ],
  CREDENTIALS: [
    ['documentReadable', 'Document readable and clear', 'Text, seals and signatures are legible'],
    ['nameCorresponds', 'Provider name corresponds', 'Compare with the account and ID name'],
    ['categoryMatches', 'Credential matches provider category', 'Qualification fits the services offered'],
    ['issuerProvided', 'Issuer information provided', 'Issuing body is identifiable'],
    ['credentialCurrent', 'Credential current / not expired', 'Check the dates on the document'],
    ['noTampering', 'No issue requiring escalation', 'No signs of alteration'],
  ],
  BUSINESS_DOCS: [
    ['documentReadable', 'Document readable and clear', 'Registration details are legible'],
    ['businessNameMatches', 'Business name matches account', 'Compare with the registered business name'],
    ['registrationValid', 'Registration / permit valid', 'Check issue and expiry dates'],
    ['representativeVerified', 'Authorized representative identified', 'Owner/representative ID provided'],
    ['addressConsistent', 'Address consistent', 'Matches the operating location on the profile'],
    ['noTampering', 'No issue requiring escalation', 'No signs of alteration'],
  ],
}
const checklistFor = (key) => (CHECKLISTS[key] || []).map(([k, label, description]) => ({ key: k, label, status: 'Not checked', resultType: 'review', description }))

const previousSubmissionsOf = (data, record) => [
  { version: record.version, isCurrent: true, submittedAt: record.submittedAt, status: record.status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()), statusType: record.status.toLowerCase(), fileName: null, reviewer: record.assignedTo, notes: data.rejectionReason || null },
]

const reviewerOf = (record) => record.assignedReviewer || null

async function providerContext(record) {
  if (!record.providerId) return {}
  const type = providerTypeOf(record.providerType)
  const [profile, detail] = await Promise.all([
    db().collection('provider_profiles').doc(record.providerId).get(),
    type ? db().collection(PROVIDER_TYPES[type].collection).doc(record.providerId).get() : null,
  ])
  return { profile: profile.exists ? { id: profile.id, ...profile.data() } : null, detail: detail?.exists ? detail.data() : null }
}

/** Applies a planned decision in one transaction (reads first, then writes). */
async function decide(request, verificationId, componentKey, input) {
  const { uid, access, actor } = await ctx(request, 'providers.verify', { fresh: true })
  const id = requireId(verificationId)
  const ref = db().collection(COLLECTION).doc(id)
  const result = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists || !isVerificationRequest(snap.data())) throw new HttpsError('not-found', 'Verification request not found.')
    const data = snap.data()
    const ownerUid = data.userId || data.providerId
    const userRef = ownerUid ? db().collection('users').doc(ownerUid) : null
    const userSnap = userRef ? await tx.get(userRef) : null
    const user = userSnap?.exists ? userSnap.data() : {}
    const record = toQueueRecord(snap.id, data, user)
    assertMarket(access, record)
    const type = providerTypeOf(data.accountType) || providerTypeOf(user.accountType)
    const detailRef = type && ownerUid ? db().collection(PROVIDER_TYPES[type].collection).doc(ownerUid) : null
    const profileRef = ownerUid ? db().collection('provider_profiles').doc(ownerUid) : null
    const [detailSnap, profileSnap] = await Promise.all([detailRef ? tx.get(detailRef) : null, profileRef ? tx.get(profileRef) : null])

    const plan = planDecision(data, { ...input, componentKey }, actor, Date.now())
    if (plan.error) throw new HttpsError(plan.code || 'invalid-argument', plan.error)

    tx.update(ref, plan.requestPatch)
    if (plan.userPatch && userSnap?.exists) tx.update(userRef, plan.userPatch)
    if (plan.detailPatch && detailSnap?.exists) tx.update(detailRef, plan.detailPatch)
    if (profileSnap?.exists) {
      const p = {}
      if (plan.requestPatch.identityVerificationStatus) p.identityVerified = plan.requestPatch.identityVerificationStatus === 'approved'
      if (plan.requestPatch.professionalVerificationStatus) p.professionallyVerified = plan.requestPatch.professionalVerificationStatus === 'approved'
      if (Object.keys(p).length) tx.update(profileRef, p)
    }
    if (plan.notification && ownerUid) {
      // Same shape as the mobile app's notifications so the provider sees it.
      tx.set(db().collection('notifications').doc(), { userId: ownerUid, title: plan.notification.title, message: plan.notification.message, notificationType: 'verification', relatedId: snap.id, isRead: false, read: false, createdAt: FieldValue.serverTimestamp() })
    }
    tx.set(db().collection('audit_logs').doc(), { actorId: uid, action: plan.audit.action, entityId: snap.id, entityType: 'verification_request', metadata: { ...plan.audit, providerId: ownerUid, reason: input.reason || null }, timestamp: FieldValue.serverTimestamp() })
    return { ...plan.result, verificationId: snap.id }
  })
  return result
}

async function addNote(request, verificationId, noteText, componentKey) {
  const { uid, access, actor } = await ctx(request, 'providers.view')
  const text = String(noteText || '').trim()
  if (!text) throw new HttpsError('invalid-argument', 'The note is empty.')
  const { ref, data, record } = await loadOne(requireId(verificationId))
  assertMarket(access, record)
  const note = { id: `note-${Date.now()}`, authorId: uid, authorName: actor.name, authorRole: access.roleName || 'Admin', text: text.slice(0, 2000), createdAt: Date.now(), componentKey: componentKey || null }
  await ref.update({ 'adminReview.internalNotes': [note, ...(data.adminReview?.internalNotes || [])].slice(0, 100) })
  return { success: true, note: { ...note, createdAt: formatStamp(note.createdAt) } }
}

async function audit(uid, action, entityId, metadata) {
  await db().collection('audit_logs').add({ actorId: uid, action, entityId, entityType: 'verification_request', metadata, timestamp: FieldValue.serverTimestamp() })
}

// ---------------------------------------------------------------- ADM-029
export const adminGetVerificationQueue = onCall(async (request) => {
  const { access } = await ctx(request)
  const d = request.data || {}
  if (d.marketId && d.marketId !== 'ALL' && !canAccessMarket(access, d.marketId)) throw new HttpsError('permission-denied', 'You do not have access to this market.')
  const { records } = await loadAll(access)
  const scoped = filterQueue(records, { marketId: d.marketId })
  const queue = sortQueue(filterQueue(scoped, { ...d, marketId: undefined }), 'priority').slice(0, Math.min(Number(d.limit) || 50, 200))
  const { kpis, needsAttention, performance } = aggregates(scoped)
  return { queue, kpis, needsAttention, performance }
})

// ---------------------------------------------------------------- ADM-030
export const adminGetVerificationQueueDetailed = onCall(async (request) => {
  const { access, uid } = await ctx(request)
  const d = request.data || {}
  if (d.marketId && d.marketId !== 'ALL' && !canAccessMarket(access, d.marketId)) throw new HttpsError('permission-denied', 'You do not have access to this market.')
  const { records } = await loadAll(access)
  const scoped = filterQueue(records, { marketId: d.marketId })
  const filters = { ...d, marketId: undefined, assignedTo: d.assignedTo === 'ME' ? uid : d.assignedTo, includeClosed: false }
  if (d.overdueOnly) filters.status = undefined
  let queue = filterQueue(scoped, filters)
  if (d.overdueOnly) queue = queue.filter((r) => r.isOverdue)
  return { queue: sortQueue(queue, d.sortBy || 'priority'), totalCount: queue.length, statusCounts: aggregates(scoped).statusCounts }
})

export const adminAssignVerificationReviewer = onCall(async (request) => {
  const { uid, access, actor } = await ctx(request, 'providers.verify')
  const { verificationId, assignToUid, assignToName, note = '' } = request.data || {}
  const { ref, data, record } = await loadOne(requireId(verificationId))
  assertMarket(access, record)
  const assignee = assignToUid ? { uid: String(assignToUid), name: String(assignToName || assignToUid) } : { uid, name: actor.name }
  const entry = { id: `rev-${Date.now()}`, action: 'ASSIGNED', reviewerName: actor.name, reviewerUid: uid, notes: note || `Assigned to ${assignee.name}`, timestamp: Date.now() }
  await ref.update({ 'adminReview.assignedTo': assignee, 'adminReview.assignedAt': Date.now(), 'adminReview.reviewHistory': [entry, ...(data.adminReview?.reviewHistory || [])].slice(0, 100) })
  await audit(uid, 'VERIFICATION_ASSIGNED', ref.id, { assignee })
  return { success: true, verificationId: ref.id, assignedTo: assignee.name }
})

export const adminClaimVerificationCase = onCall(async (request) => {
  const { uid, access, actor } = await ctx(request, 'providers.verify')
  const id = requireId(request.data?.verificationId)
  assertMarket(access, (await loadOne(id)).record)
  const ref = db().collection(COLLECTION).doc(id)
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw new HttpsError('not-found', 'Verification request not found.')
    const data = snap.data()
    const record = toQueueRecord(snap.id, data, {})
    const current = data.adminReview?.assignedTo
    if (current && current.uid !== uid) throw new HttpsError('failed-precondition', `Already claimed by ${current.name}.`)
    if (['APPROVED', 'REJECTED'].includes(record.status)) throw new HttpsError('failed-precondition', 'This verification is already decided.')
    const entry = { id: `rev-${Date.now()}`, action: 'REVIEW_STARTED', reviewerName: actor.name, reviewerUid: uid, notes: 'Claimed for review', timestamp: Date.now() }
    tx.update(ref, { 'adminReview.assignedTo': { uid, name: actor.name }, 'adminReview.assignedAt': Date.now(), 'adminReview.reviewHistory': [entry, ...(data.adminReview?.reviewHistory || [])].slice(0, 100) })
    return { success: true, verificationId: id, assignedTo: actor.name, status: 'UNDER_REVIEW' }
  })
})

export const adminEscalateVerificationCase = onCall(async (request) => {
  const { uid, access, actor } = await ctx(request, 'providers.verify')
  const { verificationId, reason = '', complianceNotes = '' } = request.data || {}
  if (!String(reason).trim()) throw new HttpsError('invalid-argument', 'An escalation reason is required.')
  const { ref, data, record } = await loadOne(requireId(verificationId))
  assertMarket(access, record)
  const entry = { id: `rev-${Date.now()}`, action: 'ESCALATED', reviewerName: actor.name, reviewerUid: uid, notes: reason, timestamp: Date.now() }
  const notes = complianceNotes.trim() ? [{ id: `note-${Date.now()}`, authorId: uid, authorName: actor.name, text: complianceNotes.trim(), createdAt: Date.now(), componentKey: 'FINAL' }, ...(data.adminReview?.internalNotes || [])] : data.adminReview?.internalNotes || []
  await ref.update({ 'adminReview.escalated': true, 'adminReview.priority': 'URGENT', 'adminReview.escalationReason': reason, 'adminReview.reviewHistory': [entry, ...(data.adminReview?.reviewHistory || [])].slice(0, 100), 'adminReview.internalNotes': notes.slice(0, 100) })
  await audit(uid, 'VERIFICATION_ESCALATED', ref.id, { reason })
  return { success: true, verificationId: ref.id, status: 'ESCALATED' }
})

// ---------------------------------------------------------------- ADM-031
export const adminGetVerificationDetail = onCall(async (request) => {
  const { access } = await ctx(request)
  const { data, record } = await loadOne(requireId(request.data?.verificationId))
  assertMarket(access, record)
  const [docs, provider] = await Promise.all([withUrls(record.documents), providerContext(record)])
  const components = componentsOf(data)
  return {
    verification: { ...record, documents: docs },
    providerProfile: provider.profile,
    checklist: Object.keys(components).flatMap((k) => checklistFor(k).map((c) => ({ ...c, componentKey: k }))),
    documents: docs,
    previousSubmissions: previousSubmissionsOf(data, record),
    reviewHistory: reviewHistoryOf(data, record),
    internalNotes: notesOf(data),
    components,
  }
})

export const adminSubmitComponentDecision = onCall(async (request) => {
  const d = request.data || {}
  return decide(request, d.verificationId, d.componentKey, d)
})

export const adminSubmitVerificationDecision = onCall(async (request) => {
  const d = request.data || {}
  const reason = [...(d.reasons || []), ...(d.requestedChanges || [])].filter(Boolean).join('; ')
  return decide(request, d.verificationId, 'FINAL', { decision: d.decision, reason, internalNote: d.adminNotes || '', expectedVersion: d.expectedVersion })
})

export const adminAddVerificationInternalNote = onCall((request) => addNote(request, request.data?.verificationId, request.data?.noteText))

// ---------------------------------------------------------------- ADM-032 identity
export const adminGetIdentityVerificationDetail = onCall(async (request) => {
  const { access } = await ctx(request)
  const { data, user, record } = await loadOne(requireId(request.data?.verificationId))
  assertMarket(access, record)
  const idDocs = await withUrls(record.documents.filter((x) => x.component === 'IDENTITY'))
  const front = idDocs.find((x) => x.docType === 'GOVT_ID') || idDocs[0] || null
  const selfie = idDocs.find((x) => x.docType === 'SELFIE') || null
  const business = record.providerCategory !== 'INDIVIDUAL'
  const ownerName = data.ownerName || data.legalName || [data.firstName, data.lastName].filter(Boolean).join(' ') || null
  const components = componentsOf(data)
  return {
    verificationId: record.id,
    providerId: record.providerId,
    providerCategory: record.providerCategory,
    name: business ? ownerName || record.name : record.name,
    businessName: business ? data.businessName || record.name : null,
    representative: business ? { name: ownerName || '—', role: 'Business Owner / Authorized Representative', title: null, businessName: data.businessName || record.name, email: data.ownerEmail || data.email || null, phone: data.phoneNumber || null, authorizedDocument: null } : null,
    type: record.type,
    market: record.market,
    status: components.IDENTITY?.status || 'AWAITING_REVIEW',
    submittedAt: record.submittedAt,
    assignedTo: record.assignedTo,
    assignedReviewer: reviewerOf(record),
    version: record.version,
    document: {
      type: front?.title || 'Identity Document',
      docNumberMasked: 'Not captured',
      nameOnDoc: ownerName || record.name,
      issuedBy: null,
      issueDate: null,
      expiryDate: null,
      uploadedAt: record.submittedAt,
      fileStatus: front?.fileUrl ? 'Uploaded' : 'Missing',
      dobMasked: 'Not captured',
      nationality: user.country || data.country || null,
      frontUrl: front?.fileUrl || null,
      backUrl: selfie?.fileUrl || null,
    },
    documentSlots: idDocs.map((x) => ({ id: x.id, label: x.title, active: x === front, count: 1, status: 'SUBMITTED', fileUrl: x.fileUrl })),
    comparisonTable: [
      { field: 'Full Name', account: user.fullName || user.displayName || '—', document: ownerName || '—', result: 'Review', resultType: 'review', note: 'Compare with the name printed on the document' },
      { field: 'Country', account: user.country || '—', document: data.country || user.country || '—', result: 'Review', resultType: 'review', note: null },
      { field: 'Document Type', account: '—', document: front?.title || '—', result: 'Review', resultType: 'review', note: null },
    ],
    checklist: checklistFor('IDENTITY'),
    previousSubmissions: previousSubmissionsOf(data, record),
    reviewHistory: reviewHistoryOf(data, record),
    internalNotes: notesOf(data, 'IDENTITY'),
  }
})

// Document numbers / dates of birth are not captured by the app, so there is
// nothing to unmask; the attempt is still audited.
export const adminRevealSensitiveIdentityField = onCall(async (request) => {
  const { uid, access } = await ctx(request, 'identity.reveal_sensitive', { fresh: true })
  const { verificationId, fieldName } = request.data || {}
  const { record } = await loadOne(requireId(verificationId))
  assertMarket(access, record)
  await audit(uid, 'SENSITIVE_IDENTITY_FIELD_REVEAL', record.id, { fieldName })
  return { success: true, fieldName, value: null, plainValue: 'Not captured', available: false, message: 'This field is not captured in the submission.' }
})

export const adminSubmitIdentityDecision = onCall((request) => decide(request, request.data?.verificationId, 'IDENTITY', request.data || {}))

// ---------------------------------------------------------------- ADM-033 credentials
export const adminGetCredentialVerificationDetail = onCall(async (request) => {
  const { access } = await ctx(request)
  const { data, user, record } = await loadOne(requireId(request.data?.verificationId))
  assertMarket(access, record)
  const creds = await withUrls(record.documents.filter((x) => x.component === 'CREDENTIALS'))
  const components = componentsOf(data)
  const status = components.CREDENTIALS?.status || 'AWAITING_REVIEW'
  const active = creds.find((c) => c.id === request.data?.credentialId) || creds[0] || null
  const credential = (c) => c && { id: c.id, credentialType: c.title, credentialName: c.title, nameOnDoc: record.name, docNumberMasked: 'Not captured', issuer: null, issuerStatus: null, countryOfIssue: user.country || null, issueDate: null, expiryDate: null, uploadedAt: record.submittedAt, fileStatus: c.fileUrl ? 'Uploaded' : 'Missing', pageCount: null, activePage: 1, fileName: c.fileName, fileUrl: c.fileUrl, status, isRequired: true }
  return {
    verificationId: record.id,
    providerId: record.providerId,
    name: record.name,
    type: record.type,
    market: record.market,
    status,
    submittedAt: record.submittedAt,
    assignedTo: record.assignedTo,
    assignedReviewer: reviewerOf(record),
    version: record.version,
    summary: { credentialsRequired: creds.length, submitted: creds.length, approved: status === 'APPROVED' ? creds.length : 0, underReview: ['AWAITING_REVIEW', 'UNDER_REVIEW'].includes(status) ? creds.length : 0, changesRequested: status === 'CHANGES_REQUESTED' ? creds.length : 0, rejected: status === 'REJECTED' ? creds.length : 0 },
    credentialsList: creds.map((c) => ({ id: c.id, title: c.title, subtitle: c.fileName, status: c === active && ['AWAITING_REVIEW', 'UNDER_REVIEW'].includes(status) ? 'REVIEWING_NOW' : status, isRequired: true, fileName: c.fileName, issuer: null, expiryDate: null })),
    activeCredential: credential(active),
    requirementsMapping: { requiredFor: `${record.type} Verification`, marketName: record.market.name, marketFlag: record.market.flag, ruleTitle: `${record.type} qualification`, ruleStatus: 'Required', eligibleServices: [], validity: { issueDate: null, expiryDate: null, remainingTime: null, isCurrent: null, isExpiringSoon: false } },
    comparisonTable: [
      { id: 'cmp-c1', field: 'Full Name', account: user.fullName || user.displayName || '—', credential: record.name, result: 'Review', resultType: 'review', note: 'Compare with the name on the credential' },
      { id: 'cmp-c2', field: 'Profession', account: record.type, credential: active?.title || '—', result: 'Review', resultType: 'review', note: null },
      { id: 'cmp-c3', field: 'Country of Practice', account: user.country || '—', credential: data.country || user.country || '—', result: 'Review', resultType: 'review', note: null },
    ],
    checklist: checklistFor('CREDENTIALS'),
    previousSubmissions: previousSubmissionsOf(data, record),
    reviewHistory: reviewHistoryOf(data, record),
    internalNotes: notesOf(data, 'CREDENTIALS'),
  }
})

export const adminSubmitCredentialDecision = onCall((request) => decide(request, request.data?.verificationId, 'CREDENTIALS', request.data || {}))
export const adminAddCredentialInternalNote = onCall((request) => addNote(request, request.data?.verificationId, request.data?.noteText, 'CREDENTIALS'))

// ---------------------------------------------------------------- ADM-034 business
export const adminGetBusinessVerificationDetail = onCall(async (request) => {
  const { access } = await ctx(request)
  const { data, user, record } = await loadOne(requireId(request.data?.verificationId))
  assertMarket(access, record)
  const docs = await withUrls(record.documents.filter((x) => x.component === 'BUSINESS_DOCS' || (x.component === 'IDENTITY' && x.id.startsWith('government'))))
  const components = componentsOf(data)
  const status = components.BUSINESS_DOCS?.status || 'AWAITING_REVIEW'
  const active = docs.find((x) => x.id === request.data?.documentId) || docs.find((x) => x.component === 'BUSINESS_DOCS') || docs[0] || null
  const provider = await providerContext(record)
  const address = provider.detail ? [provider.detail.building, provider.detail.street, provider.detail.area, provider.detail.city].filter(Boolean).join(', ') : null
  const ownerName = data.ownerName || data.legalName || [data.firstName, data.lastName].filter(Boolean).join(' ') || null
  const toDoc = (x) => ({ id: x.id, title: x.title, subtitle: x.fileName, status: x.component === 'BUSINESS_DOCS' ? status : components.IDENTITY?.status || 'AWAITING_REVIEW', isRequired: true, fileName: x.fileName, fileUrl: x.fileUrl, docType: x.title, issuer: null, regNumberMasked: 'Not captured', issueDate: null, expiryDate: null, uploadedAt: record.submittedAt, pageCount: null })
  return {
    verificationId: record.id,
    providerId: record.providerId,
    tradingName: data.businessName || record.name,
    businessCategory: record.type,
    market: record.market,
    location: [provider.detail?.area, provider.detail?.city || user.city].filter(Boolean).join(', ') || null,
    operatingAddress: address || data.address || null,
    registeredAddress: data.address || null,
    status,
    submittedAt: record.submittedAt,
    assignedTo: record.assignedTo,
    assignedReviewer: reviewerOf(record),
    version: record.version,
    progressSummary: { requiredDocuments: docs.length, submitted: docs.filter((x) => x.fileUrl).length, approved: status === 'APPROVED' ? docs.length : 0, underReview: ['AWAITING_REVIEW', 'UNDER_REVIEW'].includes(status) ? docs.length : 0, changesRequested: status === 'CHANGES_REQUESTED' ? docs.length : 0, missing: docs.filter((x) => !x.fileUrl).length },
    representative: { name: ownerName || '—', role: 'Owner / Authorized Representative', title: null, ownership: null, email: data.ownerEmail || data.email || null, phone: data.phoneNumber || null, idNumberMasked: 'Not captured', authorizedDocument: null, isIdentityVerified: components.IDENTITY?.status === 'APPROVED', identityReviewId: record.id },
    documents: docs.map(toDoc),
    activeDocument: active ? { ...toDoc(active), activePage: 1, fileFormat: /\.pdf($|\?)/i.test(active.ref) ? 'PDF' : 'IMAGE', qualityStatus: active.fileUrl ? 'Uploaded' : 'Missing', validity: { issueDate: null, expiryDate: null, isCurrent: null } } : null,
    addressComparison: { registeredAddress: data.address || '—', operatingAddress: address || '—', isMatch: null, matchNote: 'Compare the document address with the operating location' },
    requirementInfo: { mandateTitle: `${record.type} business verification`, legalReference: null, description: 'Business registration and permits required to operate on Lé Inspa in this market.', eligibleServices: [] },
    comparisonTable: [
      { field: 'Business Name', account: provider.detail?.businessName || user.displayName || '—', document: data.businessName || '—', result: 'Review', resultType: 'review', note: null },
      { field: 'Owner', account: user.fullName || '—', document: ownerName || '—', result: 'Review', resultType: 'review', note: null },
      { field: 'Country', account: user.country || '—', document: data.country || user.country || '—', result: 'Review', resultType: 'review', note: null },
    ],
    checklist: checklistFor('BUSINESS_DOCS'),
    previousSubmissions: previousSubmissionsOf(data, record),
    reviewHistory: reviewHistoryOf(data, record),
    internalNotes: notesOf(data, 'BUSINESS_DOCS'),
  }
})

export const adminRevealBusinessDocumentNumber = onCall(async (request) => {
  const { uid, access } = await ctx(request, 'identity.reveal_sensitive', { fresh: true })
  const { verificationId, documentId } = request.data || {}
  const { record } = await loadOne(requireId(verificationId))
  assertMarket(access, record)
  await audit(uid, 'BUSINESS_DOCUMENT_NUMBER_REVEAL', record.id, { documentId })
  return { success: true, documentId, value: null, plainNumber: 'Not captured', available: false, message: 'Registration numbers are not captured in the submission.' }
})

export const adminSubmitBusinessDocumentDecision = onCall((request) => decide(request, request.data?.verificationId, 'BUSINESS_DOCS', request.data || {}))
export const adminAddBusinessInternalNote = onCall((request) => addNote(request, request.data?.verificationId, request.data?.noteText, 'BUSINESS_DOCS'))

