// ADM-029 → ADM-034 — Verification Center: pure logic over the mobile app's
// `verification_requests` (no verification_records copy).
//
// What the app writes per request:
//   identityDocumentPath, selfieWithIdDocumentPath, nationalIdPhoto, selfiePhoto      (identity)
//   professionalDocumentPaths[] + professionalDocumentTitles[], licensePhoto,
//   professionalLicensePhoto, policeClearancePhoto                                     (credentials)
//   businessDocumentPath, documents{registrationCert, governmentId, selfieId}          (business)
//   fileUrl + docType / submittedDocuments[]                                           (single document uploads)
//   status pending | reviewed | approved | rejected, rejectionReason, resolvedAt
//   identity|professional|businessVerificationStatus + …ReviewedAt / …ReviewedBy
//
// Admin review state (assignment, notes, history, version, escalation) is kept
// on the same document under `adminReview`, so nothing is duplicated. Decisions
// are written back in the app's own lowercase field format.

import { MARKETS } from './dashboardLogic.js'
import { countryCodeOf, lowerStatus, millis, providerTypeOf, PROVIDER_TYPES } from './platformData.js'

export const CONTENT_REQUEST_TYPES = new Set(['gallery_photo', 'gallery_photo_edit', 'profile_photo', 'profile_text_change'])
export const isVerificationRequest = (d) => !CONTENT_REQUEST_TYPES.has(lowerStatus(d.requestType))

export const COMPONENT_FIELD = { IDENTITY: 'identity', CREDENTIALS: 'professional', BUSINESS_DOCS: 'business' }
const COMPONENT_LABEL = { IDENTITY: 'Identity', CREDENTIALS: 'Professional Credentials', BUSINESS_DOCS: 'Business Documents' }
export const TYPE_LABEL = { IDENTITY: 'Identity Verification', CREDENTIALS: 'Professional Credentials', BUSINESS_DOCS: 'Business Documents' }
const FLAGS = { KE: '🇰🇪', UG: '🇺🇬', TZ: '🇹🇿', RW: '🇷🇼', ZA: '🇿🇦', NG: '🇳🇬', PK: '🇵🇰', IN: '🇮🇳' }
const COUNTRY_NAMES = { NG: 'Nigeria', PK: 'Pakistan', IN: 'India' }

const HOUR = 3600000
export const SLA_HOURS = 48

const MOBILE_TO_ADMIN = { approved: 'APPROVED', verified: 'APPROVED', rejected: 'REJECTED', changes_requested: 'CHANGES_REQUESTED', action_required: 'CHANGES_REQUESTED' }
const ADMIN_TO_MOBILE = { APPROVED: 'approved', REJECTED: 'rejected', CHANGES_REQUESTED: 'changes_requested' }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function formatStamp(ms) {
  if (!ms) return '—'
  const d = new Date(ms + 3 * HOUR) // East Africa Time display
  const h = d.getUTCHours()
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} • ${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}
export function formatDuration(ms) {
  if (ms == null || ms < 0) return '—'
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  if (h < 48) return `${h}h${mins % 60 ? ` ${mins % 60}m` : ''}`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

function componentKind(text) {
  const t = String(text || '').toLowerCase()
  if (/business|registration|kra|tax|permit|incorporat|cr12|licen[cs]e.*(business|premises)/.test(t)) return 'BUSINESS_DOCS'
  if (/identity|national id|passport|selfie|government id/.test(t)) return 'IDENTITY'
  return 'CREDENTIALS'
}

/** Documents named by the request, each tied to a component. `ref` is a storage path or URL. */
export function documentsOf(d) {
  const out = []
  const add = (id, title, component, ref, docType) => ref && out.push({ id, title, component, ref, docType })
  add('identity_document', 'Identity Document', 'IDENTITY', d.identityDocumentPath, 'GOVT_ID')
  add('selfie_with_id', 'Selfie with ID', 'IDENTITY', d.selfieWithIdDocumentPath, 'SELFIE')
  add('national_id_photo', 'National ID Photo', 'IDENTITY', d.nationalIdPhoto, 'GOVT_ID')
  add('selfie_photo', 'Selfie Photo', 'IDENTITY', d.selfiePhoto, 'SELFIE')
  ;(d.professionalDocumentPaths || []).forEach((p, i) => {
    const title = d.professionalDocumentTitles?.[i] || `Professional Document ${i + 1}`
    add(`professional_${i}`, title, /business/i.test(p) || /business/i.test(title) ? 'BUSINESS_DOCS' : 'CREDENTIALS', p, 'PROF_CERT')
  })
  add('license_photo', 'Professional License', 'CREDENTIALS', d.licensePhoto, 'LICENSE')
  add('professional_license_photo', 'Professional License', 'CREDENTIALS', d.professionalLicensePhoto, 'LICENSE')
  add('police_clearance', 'Police Clearance Certificate', 'CREDENTIALS', d.policeClearancePhoto, 'POLICE_CLEARANCE')
  add('business_document', 'Business Registration Document', 'BUSINESS_DOCS', d.businessDocumentPath, 'BUSINESS_REG')
  const docs = d.documents && typeof d.documents === 'object' && !Array.isArray(d.documents) ? d.documents : {}
  add('registration_cert', 'Registration Certificate', 'BUSINESS_DOCS', docs.registrationCert, 'BUSINESS_REG')
  add('government_id', 'Owner Government ID', 'IDENTITY', docs.governmentId, 'GOVT_ID')
  add('selfie_id', 'Owner Selfie with ID', 'IDENTITY', docs.selfieId, 'SELFIE')
  if (d.fileUrl) add('uploaded_document', d.requestedDocTitle || d.docType || 'Uploaded Document', componentKind(d.docType || d.requestedDocTitle), d.fileUrl, 'UPLOAD')
  ;(Array.isArray(d.submittedDocuments) ? d.submittedDocuments : []).forEach((s, i) => {
    const ref = typeof s === 'string' ? s : s?.url || s?.fileUrl || s?.path
    const title = typeof s === 'object' && (s.title || s.name || s.type) ? s.title || s.name || s.type : d.docType || `Submitted Document ${i + 1}`
    if (ref !== d.fileUrl) add(`submitted_${i}`, title, componentKind(title), ref, 'UPLOAD')
  })
  return out
}

/** Components that apply to the request with their current admin status. */
export function componentsOf(d) {
  const docs = documentsOf(d)
  const admin = d.adminReview?.components || {}
  const overall = lowerStatus(d.status)
  const out = {}
  for (const key of Object.keys(COMPONENT_FIELD)) {
    const field = COMPONENT_FIELD[key]
    const mobile = lowerStatus(d[`${field}VerificationStatus`])
    const applies = docs.some((x) => x.component === key) || (mobile && mobile !== 'not_required' && mobile !== 'none' && mobile !== 'not_submitted') || (key === 'BUSINESS_DOCS' && /_business$/.test(lowerStatus(d.requestType)))
    if (!applies) continue
    let status = MOBILE_TO_ADMIN[mobile] || (overall === 'approved' ? 'APPROVED' : overall === 'rejected' ? 'REJECTED' : 'AWAITING_REVIEW')
    if (admin[key]?.status && millis(admin[key].decidedAt) >= (millis(d[`${field}ReviewedAt`]) || 0)) status = admin[key].status
    out[key] = {
      status,
      label: COMPONENT_LABEL[key],
      reason: admin[key]?.reason || null,
      decidedByName: admin[key]?.decidedByName || d[`${field}ReviewedBy`] || null,
      decidedAt: admin[key]?.decidedAt || millis(d[`${field}ReviewedAt`]) || null,
    }
  }
  return out
}

export function overallStatus(d, components = componentsOf(d)) {
  const mobile = lowerStatus(d.status)
  if (mobile === 'approved') return 'APPROVED'
  if (mobile === 'rejected') return 'REJECTED'
  if (d.adminReview?.escalated) return 'ESCALATED'
  const comps = Object.values(components)
  if (mobile === 'changes_requested' || comps.some((c) => c.status === 'CHANGES_REQUESTED') || (mobile === 'reviewed' && (d.requiredActions || []).length)) return 'CHANGES_REQUESTED'
  if ((d.adminReview?.resubmissionCount || 0) > 0 && !d.adminReview?.assignedTo) return 'RESUBMITTED'
  if (d.adminReview?.assignedTo || mobile === 'reviewed' || comps.some((c) => c.status === 'APPROVED')) return 'UNDER_REVIEW'
  return 'AWAITING_REVIEW'
}

const OPEN = new Set(['AWAITING_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED', 'ESCALATED', 'CHANGES_REQUESTED'])

/** One queue row (ADM-029 / ADM-030) from a request + its owner's users record. */
export function toQueueRecord(id, d, user = {}, now = Date.now()) {
  const components = componentsOf(d)
  const status = overallStatus(d, components)
  const type = providerTypeOf(d.accountType) || providerTypeOf(user.accountType) || providerTypeOf(d.collection)
  const category = PROVIDER_TYPES[type]?.category
  const code = countryCodeOf(user.countryCode, user.country, d.country)
  const submittedAt = millis(d.submittedAt || d.createdAt)
  const resolvedAt = millis(d.resolvedAt || d.reviewedAt)
  const waiting = submittedAt ? (OPEN.has(status) ? now : resolvedAt || now) - submittedAt : null
  const keys = Object.keys(components)
  const primary = keys.includes('BUSINESS_DOCS') ? 'BUSINESS_DOCS' : keys.includes('CREDENTIALS') ? 'CREDENTIALS' : 'IDENTITY'
  const nameFromParts = [d.firstName, d.lastName].filter(Boolean).join(' ')
  const accountName = user.displayName || user.fullName || null
  const docName = d.businessName || d.legalName || nameFromParts || d.ownerName || null
  const priority = d.adminReview?.priority || (OPEN.has(status) && waiting > 72 * HOUR ? 'URGENT' : OPEN.has(status) && waiting > 24 * HOUR ? 'HIGH' : 'NORMAL')
  const assignee = d.adminReview?.assignedTo || null
  const docs = documentsOf(d)
  return {
    id,
    providerId: d.userId || d.providerId || d.spaId || d.hotelId || null,
    name: docName || accountName || 'Provider',
    type: PROVIDER_TYPES[type]?.label || 'Provider',
    providerType: type,
    providerCategory: category === 'spa' ? 'SPA_WELLNESS' : category === 'hotel' ? 'HOTEL_RESORT' : 'INDIVIDUAL',
    market: { code: code || 'UNKNOWN', name: MARKETS[code]?.name || COUNTRY_NAMES[code] || 'Unknown', flag: FLAGS[code] || '🌍' },
    countryCode: code,
    verificationType: TYPE_LABEL[primary],
    verificationTypeKey: primary,
    requestType: d.requestType || null,
    isRegistration: d.isRegistration !== false,
    submittedAt: formatStamp(submittedAt),
    submittedAtMs: submittedAt,
    resolvedAtMs: resolvedAt,
    waitingDurationMs: waiting,
    waitingFormatted: formatDuration(waiting),
    isOverdue: OPEN.has(status) && waiting != null && waiting > SLA_HOURS * HOUR,
    resubmissionsCount: d.adminReview?.resubmissionCount || 0,
    priority,
    status,
    assignedTo: assignee?.name || 'Unassigned',
    assignedReviewer: assignee,
    avatarUrl: user.profilePhoto || null,
    progressSteps: [
      ...keys.map((k, i) => ({ id: `step-${i + 1}`, label: COMPONENT_LABEL[k], status: components[k].status === 'AWAITING_REVIEW' ? (assignee ? 'REVIEWING_NOW' : 'PENDING') : components[k].status })),
      { id: 'step-final', label: 'Final Verification', status: status === 'APPROVED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'PENDING' },
    ],
    documents: docs.map((x) => ({ id: x.id, title: x.title, docType: x.docType, component: x.component, nameOnDoc: docName, docNumber: null, issuer: null, issueDate: null, expiryDate: null, fileUrl: null, ref: x.ref, fileFormat: /\.pdf($|\?)/i.test(x.ref) ? 'PDF' : 'IMAGE', status: components[x.component]?.status || 'AWAITING_REVIEW' })),
    comparisonData: [
      { fieldName: 'Account Name', accountValue: accountName || '—', docValue: docName || '—', isMatch: !!accountName && !!docName && accountName.trim().toLowerCase() === docName.trim().toLowerCase(), diffNote: accountName && docName && accountName.trim().toLowerCase() !== docName.trim().toLowerCase() ? 'Possible difference' : null },
      { fieldName: 'Country', accountValue: user.country || '—', docValue: d.country || user.country || '—', isMatch: !d.country || countryCodeOf(d.country) === code, diffNote: null },
      { fieldName: 'Email', accountValue: user.email ? '•••' + String(user.email).replace(/^[^@]*/, '') : '—', docValue: d.email ? '•••' + String(d.email).replace(/^[^@]*/, '') : '—', isMatch: !d.email || !user.email || d.email.toLowerCase() === user.email.toLowerCase(), diffNote: null },
    ],
    components,
    rejectionReason: d.rejectionReason || null,
    requiredActions: d.requiredActions || [],
    version: d.adminReview?.version || 1,
  }
}

export function aggregates(records, now = Date.now()) {
  const monthStart = (() => { const t = new Date(now); t.setUTCDate(1); t.setUTCHours(0, 0, 0, 0); return t.getTime() })()
  const dayStart = now - ((now + 3 * HOUR) % (24 * HOUR))
  const count = (pred) => records.filter(pred).length
  const awaiting = records.filter((r) => r.status === 'AWAITING_REVIEW' || r.status === 'RESUBMITTED')
  const resolvedMonth = records.filter((r) => ['APPROVED', 'REJECTED'].includes(r.status) && r.resolvedAtMs >= monthStart)
  const decidedToday = records.filter((r) => r.resolvedAtMs >= dayStart)
  const durations = resolvedMonth.map((r) => r.resolvedAtMs - r.submittedAtMs).filter((x) => x > 0).sort((a, b) => a - b)
  const median = durations.length ? durations[Math.floor(durations.length / 2)] : null
  const decided = records.filter((r) => ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(r.status))
  const rate = (n) => (decided.length ? `${Math.round((n / decided.length) * 100)}%` : '—')
  return {
    kpis: {
      awaitingReview: { count: awaiting.length, subtext: `${awaiting.filter((r) => r.priority === 'URGENT').length} urgent`, status: 'urgent' },
      underReview: { count: count((r) => r.status === 'UNDER_REVIEW'), subtext: 'In progress', status: 'progress' },
      changesRequested: { count: count((r) => r.status === 'CHANGES_REQUESTED'), subtext: 'Waiting for provider', status: 'waiting' },
      approved: { count: resolvedMonth.filter((r) => r.status === 'APPROVED').length, subtext: 'This month', status: 'success' },
      rejected: { count: resolvedMonth.filter((r) => r.status === 'REJECTED').length, subtext: 'This month', status: 'danger' },
    },
    needsAttention: {
      overdueReviews: { count: count((r) => r.isOverdue), label: 'Overdue Reviews', description: `Past ${SLA_HOURS}h review target`, severity: 'urgent' },
      expiringCredentials: { count: null, label: 'Expiring Credentials', description: 'Credential expiry dates are not captured yet', severity: 'warning' },
      resubmissions: { count: count((r) => r.status === 'RESUBMITTED'), label: 'Resubmissions', description: 'Submitted corrections', severity: 'warning' },
      escalatedReviews: { count: count((r) => r.status === 'ESCALATED'), label: 'Escalated Reviews', description: 'Require senior review', severity: 'escalated' },
    },
    performance: {
      medianReviewTime: median == null ? '—' : formatDuration(median),
      reviewedToday: decidedToday.length,
      approvalRate: rate(decided.filter((r) => r.status === 'APPROVED').length),
      changesRequestedRate: rate(decided.filter((r) => r.status === 'CHANGES_REQUESTED').length),
      escalatedRate: records.length ? `${Math.round((count((r) => r.status === 'ESCALATED') / records.length) * 100)}%` : '—',
    },
    statusCounts: {
      all: records.filter((r) => OPEN.has(r.status)).length,
      new: count((r) => r.status === 'AWAITING_REVIEW'),
      underReview: count((r) => r.status === 'UNDER_REVIEW'),
      resubmitted: count((r) => r.status === 'RESUBMITTED'),
      changesRequested: count((r) => r.status === 'CHANGES_REQUESTED'),
      escalated: count((r) => r.status === 'ESCALATED'),
    },
  }
}

export function filterQueue(records, { status, providerType, verificationType, priority, assignedTo, searchQuery, marketId, includeClosed = true } = {}) {
  const q = String(searchQuery || '').trim().toLowerCase()
  return records.filter((r) => {
    if (!includeClosed && !OPEN.has(r.status)) return false
    if (status && status !== 'ALL' && r.status !== (status === 'NEW' ? 'AWAITING_REVIEW' : status)) return false
    if (providerType && providerType !== 'ALL' && r.providerCategory !== providerType) return false
    if (verificationType && verificationType !== 'ALL' && r.verificationType !== verificationType && r.verificationTypeKey !== verificationType) return false
    if (priority && priority !== 'ALL' && r.priority !== priority) return false
    if (assignedTo && assignedTo !== 'ALL') {
      if (assignedTo === 'UNASSIGNED' ? r.assignedReviewer : r.assignedReviewer?.uid !== assignedTo && r.assignedTo !== assignedTo) return false
    }
    if (marketId && marketId !== 'ALL' && r.countryCode !== marketId) return false
    if (q && ![r.name, r.providerId, r.id, r.type, r.verificationType].some((v) => String(v || '').toLowerCase().includes(q))) return false
    return true
  })
}

const PRIORITY_ORDER = { URGENT: 3, HIGH: 2, NORMAL: 1 }
export function sortQueue(records, sortBy = 'priority') {
  return [...records].sort((a, b) => {
    if (sortBy === 'oldest' || sortBy === 'waiting') return (b.waitingDurationMs || 0) - (a.waitingDurationMs || 0)
    if (sortBy === 'newest') return (a.waitingDurationMs || 0) - (b.waitingDurationMs || 0)
    if (sortBy === 'resubmitted') return (b.status === 'RESUBMITTED') - (a.status === 'RESUBMITTED')
    if (sortBy === 'unassigned') return !b.assignedReviewer - !a.assignedReviewer
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1
    const p = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0)
    return p || (b.waitingDurationMs || 0) - (a.waitingDurationMs || 0)
  })
}

const DECISIONS = ['APPROVE', 'REQUEST_CHANGES', 'REJECT', 'ESCALATE']
const DECISION_STATUS = { APPROVE: 'APPROVED', REQUEST_CHANGES: 'CHANGES_REQUESTED', REJECT: 'REJECTED', ESCALATE: 'ESCALATED' }

/**
 * Plans a decision on one component (IDENTITY / CREDENTIALS / BUSINESS_DOCS) or
 * the whole request (componentKey 'FINAL'). Returns { error } or the writes:
 *   requestPatch   fields for verification_requests/{id} (app format + adminReview)
 *   userPatch      users/{uid} status mirror
 *   detailPatch    provider type-collection status mirror (on final outcomes)
 *   notification, audit, result
 */
export function planDecision(d, { componentKey, decision, reason = '', providerMessage = '', internalNote = '', checklistResults = {}, expectedVersion }, actor, now = Date.now()) {
  const dec = String(decision || '').toUpperCase()
  if (!DECISIONS.includes(dec)) return { error: `Invalid decision: ${decision}` }
  if (['REQUEST_CHANGES', 'REJECT'].includes(dec) && !String(reason || '').trim()) return { error: 'A reason is required to request changes or reject.' }
  const admin = d.adminReview || {}
  const version = admin.version || 1
  if (typeof expectedVersion === 'number' && expectedVersion !== version) return { error: 'This verification changed since you opened it. Refresh and try again.', code: 'failed-precondition' }
  const components = componentsOf(d)
  const current = overallStatus(d, components)
  if (['APPROVED', 'REJECTED'].includes(current)) return { error: `This verification is already ${current.toLowerCase()}.`, code: 'failed-precondition' }
  const key = componentKey === 'FINAL' || !componentKey ? 'FINAL' : componentKey === 'BUSINESS' ? 'BUSINESS_DOCS' : componentKey
  if (key !== 'FINAL' && !components[key]) return { error: `This request has no ${key.toLowerCase().replace('_', ' ')} component.` }
  const newCompStatus = DECISION_STATUS[dec]
  const at = now
  const compUpdates = {}
  // A final decision never approves components implicitly: each component is reviewed on its own first.
  const targets = key === 'FINAL' ? [] : [key]
  for (const k of targets) compUpdates[k] = { status: newCompStatus, reason: reason || null, providerMessage: providerMessage || null, checklistResults, decidedBy: actor.id, decidedByName: actor.name, decidedAt: at }
  const merged = { ...Object.fromEntries(Object.entries(components).map(([k, c]) => [k, { status: c.status }])), ...compUpdates }
  const allApproved = Object.values(merged).every((c) => c.status === 'APPROVED')
  const final = dec === 'REJECT' ? 'REJECTED' : dec === 'REQUEST_CHANGES' ? 'CHANGES_REQUESTED' : dec === 'ESCALATE' ? 'ESCALATED' : allApproved ? 'APPROVED' : 'UNDER_REVIEW'
  if (key === 'FINAL' && dec === 'APPROVE' && !allApproved) return { error: 'All components must be approved before final approval.' }

  const historyEntry = { id: `rev-${at}`, action: `${dec}_${key}`, reviewerName: actor.name, reviewerUid: actor.id, notes: reason || providerMessage || `${key} ${dec.toLowerCase()}`, timestamp: at }
  const requestPatch = {
    'adminReview.version': version + 1,
    'adminReview.reviewHistory': [historyEntry, ...(admin.reviewHistory || [])].slice(0, 100),
    'adminReview.decisionHistory': [...(admin.decisionHistory || []), { componentKey: key, decision: dec, reason, providerMessage, checklistResults, decidedBy: actor.id, decidedByName: actor.name, decidedAt: at, version: version + 1 }].slice(-100),
    'adminReview.escalated': dec === 'ESCALATE' ? true : admin.escalated && !['APPROVED', 'REJECTED'].includes(final) ? admin.escalated : false,
    updatedAt: at,
  }
  if (internalNote.trim()) requestPatch['adminReview.internalNotes'] = [{ id: `note-${at}`, authorId: actor.id, authorName: actor.name, text: internalNote.trim(), createdAt: at, componentKey: key }, ...(admin.internalNotes || [])].slice(0, 100)
  const userPatch = {}
  for (const [k, c] of Object.entries(compUpdates)) {
    const field = COMPONENT_FIELD[k]
    requestPatch[`adminReview.components.${k}`] = c
    if (ADMIN_TO_MOBILE[c.status]) {
      requestPatch[`${field}VerificationStatus`] = ADMIN_TO_MOBILE[c.status]
      requestPatch[`${field}ReviewedAt`] = at
      requestPatch[`${field}ReviewedBy`] = actor.name
      if (k !== 'BUSINESS_DOCS') userPatch[`${field}VerificationStatus`] = ADMIN_TO_MOBILE[c.status]
    }
  }
  // Overall request status in the app's vocabulary.
  if (final === 'APPROVED') Object.assign(requestPatch, { status: 'approved', resolvedAt: at, reviewedAt: at, rejectionReason: null })
  else if (final === 'REJECTED') Object.assign(requestPatch, { status: 'rejected', resolvedAt: at, reviewedAt: at, rejectionReason: reason })
  else if (final === 'CHANGES_REQUESTED') Object.assign(requestPatch, { status: 'reviewed', reviewedAt: at, requiredActions: [reason, ...(d.requiredActions || [])].filter(Boolean).slice(0, 20), rejectionReason: reason })
  else if (lowerStatus(d.status) !== 'reviewed' && Object.keys(compUpdates).length) Object.assign(requestPatch, { status: 'reviewed', reviewedAt: at })

  const detailPatch = final === 'APPROVED' ? { verificationStatus: 'approved', isVerified: true, verificationUpdatedAt: at } : final === 'REJECTED' ? { verificationStatus: 'rejected', verificationUpdatedAt: at } : null
  if (final === 'APPROVED' && components.BUSINESS_DOCS) Object.assign(detailPatch, { businessVerificationStatus: 'approved' })
  if (final === 'APPROVED') userPatch.isVerified = true

  const message = providerMessage || (dec === 'APPROVE' ? (final === 'APPROVED' ? 'Your Lé Inspa verification has been approved.' : `Your ${COMPONENT_LABEL[key] || 'verification'} was approved.`) : dec === 'ESCALATE' ? null : reason)
  return {
    requestPatch,
    userPatch: Object.keys(userPatch).length ? userPatch : null,
    detailPatch,
    notification: message ? { title: final === 'APPROVED' ? 'Verification approved' : final === 'REJECTED' ? 'Verification not approved' : final === 'CHANGES_REQUESTED' ? 'Verification needs changes' : 'Verification update', message } : null,
    audit: { action: `VERIFICATION_${dec}`, componentKey: key, previousStatus: current, newStatus: final },
    result: { success: true, componentKey: key, decision: dec, status: compUpdates[key]?.status || final, overallStatus: final, updatedStatus: final, version: version + 1 },
  }
}

// ADM-042 / ADM-041 — the verification "case" view of a request. Requirement
// keys follow decisionLedger.VERIFICATION_REQUIREMENTS; requirements the
// submission does not cover (no source data) are marked not required rather
// than blocking approval forever.
const CASE_KEYS = {
  individual: { IDENTITY: ['identity'], CREDENTIALS: ['credentials'], BUSINESS_DOCS: ['market_documents'] },
  spa: { IDENTITY: ['representative_identity'], BUSINESS_DOCS: ['business_registration', 'business_documents'], CREDENTIALS: ['business_documents'] },
  hotel_resort: { IDENTITY: ['representative_identity'], BUSINESS_DOCS: ['property_registration', 'business_documents'], CREDENTIALS: ['business_documents'] },
}
const CASE_STATUS = { APPROVED: 'approved', REJECTED: 'rejected', CHANGES_REQUESTED: 'changes_requested', ESCALATED: 'escalated' }
const ALL_CASE_KEYS = {
  individual: ['identity', 'credentials', 'profile_info', 'market_documents'],
  spa: ['representative_identity', 'business_registration', 'business_documents', 'business_info'],
  hotel_resort: ['representative_identity', 'property_registration', 'business_documents', 'wellness_operations', 'market_compliance'],
}

export function verificationCase(id, d, user = {}, { informationRequests = [] } = {}) {
  const r = toQueueRecord(id, d, user)
  const category = r.providerCategory === 'SPA_WELLNESS' ? 'spa' : r.providerCategory === 'HOTEL_RESORT' ? 'hotel_resort' : 'individual'
  const mapped = new Map()
  for (const [comp, c] of Object.entries(r.components)) {
    for (const key of CASE_KEYS[category][comp] || []) {
      const prev = mapped.get(key)
      const status = CASE_STATUS[c.status] || 'pending'
      // When two components feed one requirement, the least-advanced status wins.
      if (!prev || prev.status === 'approved') mapped.set(key, { key, status, reviewedBy: c.decidedByName || null, reviewedAt: c.decidedAt || null, required: true })
    }
  }
  const components = ALL_CASE_KEYS[category].map((key) => mapped.get(key) || { key, status: 'not_applicable', required: false, note: 'Not part of this submission' })
  const finalStatus = { APPROVED: 'approved', REJECTED: 'rejected', CHANGES_REQUESTED: 'more_information_needed', ESCALATED: 'escalated' }[r.status] || 'under_review'
  return {
    verificationId: id,
    caseId: id,
    provider: { id: r.providerId, ref: r.providerId, name: r.name, category, categoryLabel: r.type, typeLabel: r.type, photoUrl: r.avatarUrl },
    countryCode: r.countryCode,
    marketName: r.market.name,
    city: user.city || null,
    status: finalStatus,
    submittedAt: r.submittedAtMs ? new Date(r.submittedAtMs).toISOString() : null,
    version: r.version,
    assignedTo: r.assignedReviewer,
    components,
    evidence: r.documents.map((x) => ({ title: x.title, version: 1, status: (CASE_STATUS[x.status] || 'pending') })),
    informationRequests: informationRequests.map((q) => ({ id: q.id, status: String(q.status || '').toLowerCase(), required: true, title: q.title || q.requestType || 'Information request' })),
    escalations: d.adminReview?.escalated ? [{ status: 'pending', team: 'Senior Review', reason: d.adminReview.escalationReason || null, blocking: true }] : [],
    issues: [],
    history: (d.adminReview?.reviewHistory || []).map((h) => ({ id: h.id, at: new Date(h.timestamp).toISOString(), title: String(h.action).replace(/_/g, ' ').toLowerCase(), actor: h.reviewerName, note: h.notes || null })),
    notes: (d.adminReview?.internalNotes || []).map((n) => ({ id: n.id, text: n.text, author: n.authorName, at: new Date(n.createdAt).toISOString() })),
    open: OPEN.has(r.status),
  }
}

/** App-format writes for an ADM-042 final decision / ADM-041 rejection. */
export function finalDecisionPatch(d, decision, { reason = null, note = null, actor, now = Date.now() }) {
  const admin = d.adminReview || {}
  const entry = { id: `rev-${now}`, action: `FINAL_${String(decision).toUpperCase()}`, reviewerName: actor.name, reviewerUid: actor.id, notes: reason || note || null, timestamp: now }
  const base = { 'adminReview.version': (admin.version || 1) + 1, 'adminReview.reviewHistory': [entry, ...(admin.reviewHistory || [])].slice(0, 100), updatedAt: now }
  if (decision === 'approve') return { request: { ...base, status: 'approved', resolvedAt: now, reviewedAt: now, rejectionReason: null, 'adminReview.escalated': false }, user: { isVerified: true }, detail: { verificationStatus: 'approved', isVerified: true, verificationUpdatedAt: now } }
  if (decision === 'reject') return { request: { ...base, status: 'rejected', resolvedAt: now, reviewedAt: now, rejectionReason: reason, 'adminReview.escalated': false }, user: null, detail: { verificationStatus: 'rejected', verificationUpdatedAt: now } }
  if (decision === 'request_info') return { request: { ...base, status: 'reviewed', reviewedAt: now, requiredActions: [reason || note].filter(Boolean), rejectionReason: reason }, user: null, detail: null }
  return { request: { ...base, 'adminReview.escalated': true, 'adminReview.priority': 'URGENT', 'adminReview.escalationReason': reason || note }, user: null, detail: null }
}
