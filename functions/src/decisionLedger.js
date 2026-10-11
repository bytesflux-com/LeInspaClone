// ADM-041 Reject & Send Reason / Note · ADM-042 Verification Decision · ADM-043 Approval History (`approval_decisions`).
//
// Pure domain logic shared between Cloud Functions and the admin frontend.
// One immutable record per meaningful business decision made in verification
// and content approval (ADM-032 → ADM-042). Decision fields are never edited
// afterwards; only relationship fields (supersededByDecisionId) are linked
// when a newer decision for the same subject is recorded. Evidence is
// referenced, never copied. audit_logs remain the separate technical trail.

// Decision-type tabs used by ADM-043.
export const DECISION_TYPES = {
  verification: 'Verification',
  identity: 'Identity',
  credentials: 'Credentials',
  business_documents: 'Business Documents',
  profile_photos: 'Profile Photos',
  gallery_media: 'Gallery & Media',
  profile_changes: 'Profile Changes',
  service_information: 'Service Information',
  other: 'Other',
}
export const DECISIONS = ['approved', 'changes_requested', 'rejected', 'escalated', 'reopened', 'reverification']

const STATUS_FROM_DECISION = {
  approve: 'approved',
  request_changes: 'changes_requested',
  reject: 'rejected',
  escalate: 'escalated',
  reverify: 'reverification',
}
export const ledgerDecision = (decision) => STATUS_FROM_DECISION[decision] || decision

// Map a content moderation record to its ledger decision type.
export function contentDecisionType(contentType, isMedia) {
  if (contentType === 'profile_photo') return 'profile_photos'
  if (contentType === 'gallery' || isMedia) return 'gallery_media'
  if (contentType === 'profile_change') return 'profile_changes'
  if (contentType === 'service') return 'service_information'
  return 'other'
}

// What the decision changed, as an immutable effect snapshot.
export function effectsFor(type, decision, { isUpdate = false } = {}) {
  const ok = decision === 'approved'
  const map = {
    profile_photos: ok ? ['Eligible for public display', 'Visible across profile and search placements'] : ['Photo not published', 'Current approved photo unchanged'],
    gallery_media: ok ? ['Media eligible for its configured placements', 'Gallery progress updated'] : ['Selected media remains unpublished', 'Other approved media unaffected'],
    profile_changes: ok ? ['Approved field eligible for publication', 'Live profile updated upon publish'] : ['Proposed change not published', 'Current approved value remains live'],
    service_information: ok ? [isUpdate ? 'Approved version replaces the live service' : 'Service eligible for publication', 'Marketplace listing updated'] : [isUpdate ? 'Current approved version remains live' : 'Service not published', 'Existing approved services unaffected'],
    identity: ok ? ['Identity requirement satisfied', 'Verification progress updated'] : ['Identity requirement unsatisfied', 'Verification remains incomplete'],
    credentials: ok ? ['Credential requirement satisfied', 'Verification progress updated', 'Provider became eligible for final verification'] : ['Credential requirement remains unsatisfied', 'Verification remains incomplete'],
    business_documents: ok ? ['Business requirement satisfied', 'Verification progress updated'] : ['Business document requirement unsatisfied', 'Business verification remains incomplete'],
    verification: ok ? ['Verification status → Verified', 'Verified badge eligible', 'Provider discovery eligibility recalculated'] : decision === 'rejected' ? ['Verification status → Rejected', 'Provider account not suspended'] : ['Case left the normal verification queue'],
    other: ok ? ['Content eligible for publication'] : ['Content not published'],
  }
  if (decision === 'changes_requested') return ['Provider asked to correct and resubmit', 'Nothing published until resubmitted and approved']
  if (decision === 'escalated') return ['Sent for specialist review', 'Provider account not suspended']
  if (decision === 'reverification') return ['Routed back to the Verification Center', 'Content moderation did not approve qualification changes']
  if (decision === 'reopened') return ['Case reopened for re-review', 'Previous decision preserved in history']
  return map[type] || map.other
}

// Reviewer snapshot captured at decision time (roles and access change later).
export const reviewerSnapshot = (actor, access) => ({
  reviewedBy: { id: actor.id, name: actor.name },
  reviewerRoleSnapshot: access?.roleName || access?.roleId || 'Verification & Content Admin',
  reviewerMarketSnapshot: access?.markets || ['ALL'],
})

let counter = 0
// Human-readable, unique-enough decision reference.
export function decisionRef(now = Date.now()) {
  counter = (counter + 1) % 1000
  return `APR-${String(now).slice(-6)}${String(counter).padStart(3, '0')}`
}

// Build a ledger entry. `subjectKey` identifies "the same thing being decided"
// so a later decision can supersede an earlier one.
export function buildEntry({
  decisionId = null,
  originModule,
  originRecordId,
  targetId = null,
  decisionType,
  decision,
  reason = null,
  providerMessage = null,
  internalNote = null,
  version = null,
  subject,
  provider,
  countryCode,
  evidenceRefs = [],
  effects,
  actor,
  access,
  at,
  relatedReviewId,
  routes = {},
  previousDecisionId = null,
  reopenedFromDecisionId = null,
}) {
  const normDecision = ledgerDecision(decision)
  return {
    decisionRef: decisionId || decisionRef(),
    originModule,
    originRecordId,
    targetId,
    subjectKey: `${originModule}:${originRecordId}${targetId ? `:${targetId}` : ''}`,
    subjectType: subject?.type || 'provider',
    subjectName: subject?.name || provider?.name || null,
    subjectSubtitle: subject?.subtitle || provider?.typeLabel || null,
    subjectImage: subject?.image || provider?.photoUrl || null,
    providerId: provider?.id || null,
    providerRef: provider?.ref || provider?.id || null,
    providerName: provider?.name || null,
    providerType: provider?.typeLabel || null,
    providerCategory: provider?.category || 'individual',
    marketId: countryCode || null,
    decisionType,
    decision: normDecision,
    reason,
    providerMessage,
    internalNote,
    version,
    evidenceRefs,
    effects: effects || effectsFor(decisionType, normDecision),
    previousDecisionId,
    supersededByDecisionId: null,
    reopenedFromDecisionId,
    relatedReviewId: relatedReviewId || originRecordId || null,
    routes,
    ...reviewerSnapshot(actor, access),
    reviewedAt: at,
    createdAt: at,
  }
}

// Write a ledger entry inside a transaction and link it to the previous
// decision for the same subject. Must be called after all transaction reads.
export function writeEntry(tx, entry, db) {
  const ref = db.collection('approval_decisions').doc()
  tx.set(ref, entry)
  if (entry.previousDecisionId) {
    tx.update(db.collection('approval_decisions').doc(entry.previousDecisionId), { supersededByDecisionId: ref.id })
  }
  return ref.id
}

// ---------------------------------------------------------------------------
// ADM-041 — Reject & Send Reason / Note (dynamic reasons, templates, impact)
// ---------------------------------------------------------------------------

export const REJECTION_REASONS_BY_TYPE = {
  service_information: [
    { code: 'prohibited_content', label: 'Prohibited Content' },
    { code: 'misleading_information', label: 'Misleading Information' },
    { code: 'unsupported_claim', label: 'Unsupported Claim' },
    { code: 'outside_approved_category', label: 'Service Outside Approved Category' },
    { code: 'inappropriate_description', label: 'Inappropriate Description' },
    { code: 'policy_violation', label: 'Policy Violation' },
    { code: 'duplicate_submission', label: 'Duplicate / Invalid Submission' },
    { code: 'other', label: 'Other' },
  ],
  profile_photos: [
    { code: 'explicit_prohibited', label: 'Explicit / Prohibited Content' },
    { code: 'privacy_concern', label: 'Privacy Concern' },
    { code: 'misleading_image', label: 'Misleading Image' },
    { code: 'unrelated_media', label: 'Unrelated Media' },
    { code: 'promotional_overlay', label: 'Prohibited Promotional Information' },
    { code: 'low_quality', label: 'Unusable Image Quality' },
    { code: 'other', label: 'Other' },
  ],
  gallery_media: [
    { code: 'explicit_prohibited', label: 'Explicit / Prohibited Content' },
    { code: 'privacy_concern', label: 'Privacy / Consent Concern' },
    { code: 'misleading_image', label: 'Misleading Image' },
    { code: 'unrelated_media', label: 'Unrelated Media' },
    { code: 'promotional_overlay', label: 'Prohibited Promotional Information' },
    { code: 'other', label: 'Other' },
  ],
  profile_changes: [
    { code: 'misleading_information', label: 'Misleading Information' },
    { code: 'contact_details', label: 'Prohibited Contact Information' },
    { code: 'unsupported_claim', label: 'Unsupported Claim' },
    { code: 'inappropriate_description', label: 'Inappropriate Description' },
    { code: 'category_mismatch', label: 'Professional Category Mismatch' },
    { code: 'other', label: 'Other' },
  ],
  identity: [
    { code: 'unsupported_document', label: 'Unsupported Document' },
    { code: 'requirement_unsatisfied', label: 'Document Does Not Satisfy Requirement' },
    { code: 'material_inconsistency', label: 'Information Materially Inconsistent' },
    { code: 'expired_document', label: 'Document Expired' },
    { code: 'other', label: 'Other' },
  ],
  credentials: [
    { code: 'credential_unsatisfied', label: 'Credential Does Not Meet Requirement' },
    { code: 'expired_credential', label: 'Expired Credential' },
    { code: 'category_mismatch', label: 'Professional Category Mismatch' },
    { code: 'unsupported_credential', label: 'Unsupported Credential' },
    { code: 'other', label: 'Other' },
  ],
  business_documents: [
    { code: 'incorrect_document', label: 'Incorrect Document' },
    { code: 'business_inconsistency', label: 'Business Information Materially Inconsistent' },
    { code: 'requirement_unsatisfied', label: 'Document Does Not Meet Requirement' },
    { code: 'expired_document', label: 'Expired Document' },
    { code: 'other', label: 'Other' },
  ],
  verification: [
    { code: 'requirements_unsatisfied', label: 'Verification Requirements Not Satisfied' },
    { code: 'material_inconsistency', label: 'Information Materially Inconsistent' },
    { code: 'credential_mismatch', label: 'Professional Qualification Not Verified' },
    { code: 'compliance_failure', label: 'Market Compliance Requirements Not Met' },
    { code: 'other', label: 'Other' },
  ],
}

export const REJECTION_TEMPLATES = {
  unsupported_claim: {
    label: 'Unsupported Medical or Outcome Claim',
    message: 'Your submitted service information could not be approved because the description contains a medical claim that cannot be supported through the information provided.\n\nPlease revise the description and remove any medical guarantees. Clearly explain the wellness service and its benefits without claiming to treat or cure medical conditions.',
    guidance: 'Remove the unsupported medical claim and describe the wellness benefits without guaranteeing medical outcomes.',
  },
  prohibited_content: {
    label: 'Prohibited or Inappropriate Content',
    message: 'Your submission could not be approved because it includes content that is not permitted under Lé Inspa marketplace standards.\n\nPlease review our content guidelines, remove the prohibited material, and submit an updated version.',
    guidance: 'Ensure all text and imagery strictly reflect professional wellness services.',
  },
  outside_approved_category: {
    label: 'Service Outside Approved Category',
    message: 'Your submitted service falls outside your currently verified professional category on Lé Inspa.\n\nTo offer services in this category, please submit the relevant professional credentials for verification first.',
    guidance: 'Submit supporting credentials in the Verification Center or adjust the service category.',
  },
  misleading_information: {
    label: 'Misleading or Inaccurate Information',
    message: 'Your submission could not be approved because parts of the information appear inaccurate or potentially misleading to clients.\n\nPlease update the details so they accurately reflect the service, duration, and experience provided.',
    guidance: 'Clarify the description so it accurately matches the delivered wellness service.',
  },
  contact_details: {
    label: 'Direct Contact or Off-Platform Booking Info',
    message: 'Your submission could not be approved because it includes direct phone numbers, email addresses, or external booking links.\n\nFor client and provider safety, all bookings and communications take place through Lé Inspa.',
    guidance: 'Remove phone numbers, WhatsApp references, emails, or external links before resubmitting.',
  },
  unrelated_media: {
    label: 'Unrelated or Non-Wellness Media',
    message: 'The submitted media could not be approved because it does not depict your wellness services, treatment rooms, or professional profile.\n\nPlease upload clear photos of your actual wellness practice or facilities.',
    guidance: 'Upload high-resolution photos that represent your actual wellness services or workspace.',
  },
  privacy_concern: {
    label: 'Third-Party Privacy / Consent Concern',
    message: 'The submitted image could not be approved because identifiable individuals are visible without confirmed publication consent.\n\nPlease upload an image without identifiable clients or third parties.',
    guidance: 'Crop or replace the photo so no unconsented individuals are identifiable.',
  },
  requirements_unsatisfied: {
    label: 'Verification Requirements Not Satisfied',
    message: 'We were unable to approve your verification submission because the provided documentation does not satisfy the required standards for your provider category and market.\n\nPlease review the feedback below and submit valid supporting documents when ready.',
    guidance: 'Upload clear, valid government ID and accredited professional certificates matching your profile.',
  },
  default: {
    label: 'Standard Rejection Explanation',
    message: 'Your submission could not be approved after review because it does not meet Lé Inspa quality and policy requirements.\n\nPlease review the reason noted above, update your submission accordingly, and submit again for review.',
    guidance: 'Address the stated issue and submit a corrected version.',
  },
}

export function reasonsForDecisionType(decisionType) {
  return REJECTION_REASONS_BY_TYPE[decisionType] || REJECTION_REASONS_BY_TYPE.service_information
}

export function templateForReason(reasonCode) {
  return REJECTION_TEMPLATES[reasonCode] || REJECTION_TEMPLATES.default
}

// Dynamic impact items shown before confirmation on ADM-041.
export function rejectionImpactFor(decisionType, { isUpdate = false, allowResubmission = true } = {}) {
  const resubmitLine = allowResubmission
    ? { tone: 'ok', text: 'Provider may resubmit a new version' }
    : { tone: 'bad', text: 'Resubmission is blocked for this item under policy' }

  if (decisionType === 'service_information') {
    return isUpdate
      ? [
          { tone: 'bad', text: 'Proposed service changes will not be published' },
          { tone: 'ok', text: 'Current approved service version remains live' },
          { tone: 'ok', text: 'Provider account remains active' },
          resubmitLine,
        ]
      : [
          { tone: 'bad', text: 'Proposed service will not be published' },
          { tone: 'ok', text: 'Provider account remains active' },
          { tone: 'ok', text: 'Existing approved services remain unaffected' },
          resubmitLine,
        ]
  }
  if (decisionType === 'gallery_media') {
    return [
      { tone: 'bad', text: 'Selected media item remains unpublished' },
      { tone: 'ok', text: 'Other approved gallery images remain unaffected' },
      { tone: 'ok', text: 'Provider account remains active' },
      resubmitLine,
    ]
  }
  if (decisionType === 'profile_photos') {
    return [
      { tone: 'bad', text: 'Submitted profile photo will not be published' },
      { tone: 'ok', text: 'Current approved profile photo remains unchanged' },
      { tone: 'ok', text: 'Provider account remains active' },
      resubmitLine,
    ]
  }
  if (decisionType === 'profile_changes') {
    return [
      { tone: 'bad', text: 'Proposed profile field change will not be published' },
      { tone: 'ok', text: 'Current approved profile information remains live' },
      { tone: 'ok', text: 'Provider account remains active' },
      resubmitLine,
    ]
  }
  if (decisionType === 'business_documents') {
    return [
      { tone: 'bad', text: 'Document does not satisfy the business verification requirement' },
      { tone: 'warn', text: 'Business verification remains incomplete' },
      { tone: 'ok', text: 'Provider account is not suspended' },
      resubmitLine,
    ]
  }
  if (decisionType === 'credentials' || decisionType === 'identity') {
    return [
      { tone: 'bad', text: `${decisionType === 'identity' ? 'Identity' : 'Credential'} requirement remains unsatisfied` },
      { tone: 'warn', text: 'Provider verification remains incomplete' },
      { tone: 'ok', text: 'Provider account is not suspended' },
      resubmitLine,
    ]
  }
  if (decisionType === 'verification') {
    return [
      { tone: 'bad', text: 'Verification case will be marked Rejected' },
      { tone: 'warn', text: 'Provider will not receive the Verified badge' },
      { tone: 'ok', text: 'Provider account is not automatically suspended' },
      resubmitLine,
    ]
  }
  return [
    { tone: 'bad', text: 'Submitted item will not be published' },
    { tone: 'ok', text: 'Provider account remains active' },
    resubmitLine,
  ]
}

export function validateRejection(input = {}) {
  if (!input.reasonCode && !input.reason) return 'Select a rejection reason.'
  const msg = String(input.providerMessage || '').trim()
  if (msg.length < 15) return 'Write a clear provider-facing message (at least 15 characters).'
  if (msg.length > 1000) return 'Provider-facing message must be 1,000 characters or fewer.'
  const note = String(input.internalNote || '').trim()
  if (note.length < 10) return 'Add an internal Admin note (at least 10 characters) for audit accountability.'
  if (note.length > 1000) return 'Internal Admin note must be 1,000 characters or fewer.'
  if (msg.toLowerCase() === note.toLowerCase()) {
    return 'Provider-facing message and internal Admin note must be separate explanations.'
  }
  return null
}

// ---------------------------------------------------------------------------
// ADM-042 — Verification Decision (dynamic requirements & readiness engine)
// ---------------------------------------------------------------------------

export const VERIFICATION_REQUIREMENTS = {
  individual: [
    { key: 'identity', label: 'Identity Verification', adm: 'ADM-032', route: '/verifications' },
    { key: 'credentials', label: 'Professional Credentials', adm: 'ADM-033', route: '/verifications' },
    { key: 'profile_info', label: 'Profile Information', adm: 'ADM-038', route: '/content-approval/profile-changes' },
    { key: 'market_documents', label: 'Required Market Documents', adm: 'ADM-034', route: '/verifications' },
  ],
  spa: [
    { key: 'representative_identity', label: 'Representative Identity', adm: 'ADM-032', route: '/verifications' },
    { key: 'business_registration', label: 'Business Registration', adm: 'ADM-034', route: '/verifications' },
    { key: 'business_documents', label: 'Required Business Documents', adm: 'ADM-034', route: '/verifications' },
    { key: 'business_info', label: 'Business Information', adm: 'ADM-038', route: '/content-approval/business' },
  ],
  hotel_resort: [
    { key: 'representative_identity', label: 'Authorized Representative', adm: 'ADM-032', route: '/verifications' },
    { key: 'property_registration', label: 'Property / Business Registration', adm: 'ADM-034', route: '/verifications' },
    { key: 'business_documents', label: 'Required Business Documents', adm: 'ADM-034', route: '/verifications' },
    { key: 'wellness_operations', label: 'Property / Wellness Operation Information', adm: 'ADM-038', route: '/content-approval/business' },
    { key: 'market_compliance', label: 'Market-Specific Requirements', adm: 'ADM-034', route: '/verifications' },
  ],
}

export function evaluateVerificationReadiness(vCase) {
  const category = vCase?.provider?.category || 'individual'
  const reqDefs = VERIFICATION_REQUIREMENTS[category] || VERIFICATION_REQUIREMENTS.individual
  const compMap = new Map((vCase?.components || []).map((c) => [c.key, c]))

  const components = reqDefs.map((def) => {
    const existing = compMap.get(def.key) || {}
    return {
      key: def.key,
      label: existing.label || def.label,
      adm: existing.adm || def.adm,
      route: existing.route || def.route,
      required: existing.required !== false,
      status: existing.status || 'pending',
      reviewedBy: existing.reviewedBy || null,
      reviewedAt: existing.reviewedAt || null,
      note: existing.note || null,
    }
  })

  const requiredComponents = components.filter((c) => c.required)
  const approvedCount = requiredComponents.filter((c) => c.status === 'approved').length
  const changesRequestedCount = requiredComponents.filter((c) => c.status === 'changes_requested').length
  const rejectedCount = requiredComponents.filter((c) => c.status === 'rejected').length
  const pendingCount = requiredComponents.filter((c) => !['approved', 'changes_requested', 'rejected'].includes(c.status)).length

  const requests = vCase?.informationRequests || []
  const outstandingRequests = requests.filter((r) => r.required !== false && !['completed', 'cancelled', 'responded'].includes(r.status))

  const escalations = vCase?.escalations || []
  const blockingEscalations = escalations.filter((e) => e.status === 'pending' || e.blocking)

  const issues = vCase?.issues || []
  const blockingIssues = issues.filter((i) => i.severity === 'blocker' && !i.resolved)

  const blockers = []
  const unapproved = requiredComponents.length - approvedCount
  if (unapproved > 0) {
    blockers.push(`${unapproved} required verification component${unapproved === 1 ? ' is' : 's are'} still unresolved.`)
  }
  if (outstandingRequests.length > 0) {
    blockers.push(`${outstandingRequests.length} required information request${outstandingRequests.length === 1 ? ' is' : 's are'} waiting for provider response.`)
  }
  if (blockingEscalations.length > 0) {
    blockers.push(`${blockingEscalations.length} active escalation${blockingEscalations.length === 1 ? ' must' : 's must'} be resolved before final approval.`)
  }
  if (blockingIssues.length > 0) {
    blockers.push(`${blockingIssues.length} unresolved blocking issue${blockingIssues.length === 1 ? '' : 's'} detected.`)
  }

  const ready = blockers.length === 0 && requiredComponents.length > 0

  return {
    ready,
    headline: ready ? 'Ready for Decision' : 'Not Ready for Approval',
    subtitle: ready
      ? 'All required verification components have been reviewed.'
      : blockers[0] || 'One or more verification requirements remain unresolved.',
    blockers,
    components,
    counts: {
      required: requiredComponents.length,
      approved: approvedCount,
      changesRequested: changesRequestedCount,
      rejected: rejectedCount,
      pending: pendingCount,
      escalations: blockingEscalations.length,
      outstandingRequests: outstandingRequests.length,
    },
  }
}

export function validateVerificationDecision(vCase, input = {}) {
  const readiness = evaluateVerificationReadiness(vCase)
  const { decision, note, escalateTo, reason } = input
  if (!['approve', 'request_info', 'reject', 'escalate'].includes(decision)) {
    return 'Select a valid verification decision.'
  }
  if (decision === 'approve' && !readiness.ready) {
    return `Cannot approve verification yet: ${readiness.blockers.join(' ')}`
  }
  const hasResolvedConcerns = (vCase?.issues || []).some((i) => i.resolved)
  if (decision === 'approve' && hasResolvedConcerns && (!note || String(note).trim().length < 10)) {
    return 'A final verification note is required when approving a case with resolved concerns or exceptions.'
  }
  if (decision === 'escalate') {
    if (!escalateTo) return 'Choose a destination team for the escalation.'
    if (!reason && (!note || String(note).trim().length < 10)) {
      return 'Provide a clear escalation reason.'
    }
  }
  return null
}

export function verificationImpactFor(decision) {
  if (decision === 'approve') {
    return [
      { tone: 'ok', text: 'Verification status will change to Verified' },
      { tone: 'ok', text: 'Provider will receive a verified badge' },
      { tone: 'ok', text: 'Provider will be eligible for marketplace discovery (subject to other rules)' },
      { tone: 'ok', text: 'Existing services will remain as approved' },
      { tone: 'info', text: 'Verification approval does not override suspensions, content moderation, or subscription requirements.' },
    ]
  }
  if (decision === 'request_info') {
    return [
      { tone: 'warn', text: 'Verification status will change to More Information Needed' },
      { tone: 'info', text: 'Opens ADM-040 Request More Information pre-populated with this case' },
      { tone: 'ok', text: 'All already-approved verification components stay preserved' },
    ]
  }
  if (decision === 'reject') {
    return [
      { tone: 'bad', text: 'Verification status will change to Rejected' },
      { tone: 'info', text: 'Opens ADM-041 Reject & Send Reason / Note to record the reason and notify the provider' },
      { tone: 'ok', text: 'Rejection does not automatically suspend the provider account' },
    ]
  }
  return [
    { tone: 'purple', text: 'Verification status will change to Decision Escalated' },
    { tone: 'info', text: 'Case leaves the standard verification queue and routes to the selected specialist team' },
    { tone: 'ok', text: 'Provider account is not suspended during escalation' },
  ]
}

// ---------------------------------------------------------------------------
// ADM-043 — Approval History query, summary, and decision chain helpers
// ---------------------------------------------------------------------------

export function summarizeLedger(entries = []) {
  const counts = {
    total: entries.length,
    approved: 0,
    changes_requested: 0,
    rejected: 0,
    escalated: 0,
    superseded: 0,
    reopened: 0,
  }
  const byType = { all: entries.length }
  for (const key of Object.keys(DECISION_TYPES)) byType[key] = 0

  for (const e of entries) {
    if (e.decision === 'approved') counts.approved += 1
    else if (e.decision === 'changes_requested') counts.changes_requested += 1
    else if (e.decision === 'rejected') counts.rejected += 1
    else if (e.decision === 'escalated' || e.decision === 'reverification') counts.escalated += 1
    else if (e.decision === 'reopened') counts.reopened += 1

    if (e.supersededByDecisionId || e.decision === 'reopened') {
      counts.superseded += 1
    }
    const t = e.decisionType || 'other'
    byType[t] = (byType[t] || 0) + 1
  }
  return { counts, byType }
}

export function filterLedgerEntries(entries = [], query = {}) {
  const {
    q = '',
    tab = 'all',
    decisionType = '',
    module = '',
    providerType = '',
    market = '',
    reviewer = '',
    status = '',
  } = query
  const needle = String(q || '').trim().toLowerCase()

  return entries.filter((e) => {
    if (tab && tab !== 'all' && e.decisionType !== tab) return false
    if (decisionType && e.decisionType !== decisionType) return false
    if (module) {
      const isVer = ['verification', 'identity', 'credentials', 'business_documents'].includes(e.originModule) || ['verification', 'identity', 'credentials', 'business_documents'].includes(e.decisionType)
      if (module === 'verification' && !isVer) return false
      if (module === 'content' && isVer) return false
    }
    if (providerType && e.providerCategory !== providerType && e.providerType !== providerType) return false
    if (market && market !== 'ALL' && e.marketId !== market) return false
    if (reviewer && e.reviewedBy?.id !== reviewer && e.reviewedBy?.name !== reviewer) return false
    if (status) {
      if (status === 'superseded') {
        if (!e.supersededByDecisionId && e.decision !== 'reopened') return false
      } else if (e.decision !== status) {
        return false
      }
    }
    if (needle) {
      const hay = [
        e.decisionRef,
        e.subjectName,
        e.providerName,
        e.providerId,
        e.providerRef,
        e.relatedReviewId,
        e.originRecordId,
        e.reviewedBy?.name,
        e.reason,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })
}

// Walk previousDecisionId backwards and supersededByDecisionId forwards to
// reconstruct the full chronological decision chain for a subject.
export function buildDecisionChain(entryId, byId) {
  const get = (id) => (byId instanceof Map ? byId.get(id) : byId?.[id])
  const current = get(entryId)
  if (!current) return []

  const before = []
  const seen = new Set([current.id || current.decisionRef])
  let prevId = current.previousDecisionId
  while (prevId && !seen.has(prevId)) {
    seen.add(prevId)
    const node = get(prevId)
    if (!node) break
    before.unshift(node)
    prevId = node.previousDecisionId
  }

  const after = []
  let nextId = current.supersededByDecisionId
  while (nextId && !seen.has(nextId)) {
    seen.add(nextId)
    const node = get(nextId)
    if (!node) break
    after.push(node)
    nextId = node.supersededByDecisionId
  }

  return [
    ...before.map((n) => ({ ...n, relation: 'previous' })),
    { ...current, relation: 'current' },
    ...after.map((n) => ({ ...n, relation: 'later' })),
  ]
}
