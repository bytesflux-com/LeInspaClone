// ADM-038 Profile Information Change Review · ADM-039 Service Information Approval
// Pure logic, no Firestore.
//
// A change request compares the CURRENT approved (live) values with the
// PROPOSED values. The live values stay public until a field is approved;
// rejecting a proposal never erases what is live. Verification-critical
// fields can never be approved by a content moderator — they go back to the
// Verification Center (ADM-031–034).

import { CHANGE_REASONS, ESCALATION_TEAMS, REJECT_REASONS, buildReview, label, toMillis } from './contentModerationLogic.js'

// ---------- word-level difference ----------

// Longest-common-subsequence diff over words. Returns segments the UI can
// highlight: { text, type: 'same' | 'added' | 'removed' }.
export function diffWords(current = '', proposed = '') {
  const a = String(current ?? '').split(/(\s+)/).filter((t) => t !== '')
  const b = String(proposed ?? '').split(/(\s+)/).filter((t) => t !== '')
  const n = a.length
  const m = b.length
  // Cap the matrix for very long texts; fall back to whole replacement.
  if (n * m > 400000) return [{ text: String(current ?? ''), type: 'removed' }, { text: String(proposed ?? ''), type: 'added' }].filter((s) => s.text)
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  }
  const out = []
  const push = (text, type) => {
    const last = out[out.length - 1]
    if (last && last.type === type) last.text += text
    else out.push({ text, type })
  }
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push(a[i], 'same')
      i += 1
      j += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) push(a[i++], 'removed')
    else push(b[j++], 'added')
  }
  while (i < n) push(a[i++], 'removed')
  while (j < m) push(b[j++], 'added')
  return out
}

const asText = (v) => (Array.isArray(v) ? v.join(', ') : v == null ? '' : String(v))
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

// ---------- ADM-038 profile change fields ----------

// Verification-critical profile fields (configurable in production policy).
export const SENSITIVE_PROFILE_FIELDS = new Set(['legalName', 'legalBusinessName', 'professionalCategory', 'businessType', 'credentials', 'authorizedRepresentative', 'identity'])
export const PROFILE_FIELD_LABELS = {
  displayName: 'Display Name',
  businessName: 'Business Name',
  professionalTitle: 'Professional Title',
  bio: 'Professional Bio',
  businessDescription: 'Business Description',
  languages: 'Languages',
  location: 'Public Location',
  publicContact: 'Public Contact',
  professionalCategory: 'Professional Category',
  legalBusinessName: 'Legal Business Name',
  businessType: 'Business Type',
  authorizedRepresentative: 'Authorized Representative',
}
// Which verification step a sensitive field returns to.
export const REVERIFY_ROUTE = {
  professionalCategory: { adm: 'ADM-033', label: 'Professional Credentials' },
  credentials: { adm: 'ADM-033', label: 'Professional Credentials' },
  legalName: { adm: 'ADM-032', label: 'Identity Documents' },
  identity: { adm: 'ADM-032', label: 'Identity Documents' },
  legalBusinessName: { adm: 'ADM-034', label: 'Business Documents' },
  businessType: { adm: 'ADM-034', label: 'Business Documents' },
  authorizedRepresentative: { adm: 'ADM-034', label: 'Business Documents' },
}

export const FIELD_STATUSES = ['pending', 'approved', 'changes_requested', 'rejected', 'reverification', 'published']
export const FIELD_DECISIONS = ['approve', 'request_changes', 'reject', 'reverify']
const FIELD_STATUS_FOR = { approve: 'approved', request_changes: 'changes_requested', reject: 'rejected', reverify: 'reverification' }

// Normalise one changed field of a profile change request.
export function normalizeField(f, i = 0) {
  const key = String(f.key || f.field || `field_${i}`)
  const current = f.current ?? null
  const proposed = f.proposed ?? null
  const changeType = current == null || (Array.isArray(current) && !current.length) ? 'added' : proposed == null || proposed === '' ? 'removed' : 'changed'
  const sensitive = f.sensitive ?? SENSITIVE_PROFILE_FIELDS.has(key)
  return {
    key,
    label: f.label || PROFILE_FIELD_LABELS[key] || label(key),
    path: f.path || key,
    current,
    proposed,
    changeType,
    sensitive: Boolean(sensitive),
    classification: sensitive ? 'sensitive' : 'standard',
    publicImpact: f.publicImpact || 'Professional Profile',
    changeKind: f.changeKind || (Array.isArray(proposed) ? 'List Update' : 'Content Update'),
    status: FIELD_STATUSES.includes(f.status) ? f.status : 'pending',
    decision: f.decision ? { ...f.decision, at: toMillis(f.decision.at) } : null,
    reverifyRoute: sensitive ? REVERIFY_ROUTE[key] || { adm: 'ADM-031', label: 'Verification Review' } : null,
  }
}

export function fieldSummary(fields, previousRequests = 0) {
  const s = { changed: fields.length, standard: 0, sensitive: 0, previousRequests, approved: 0, pending: 0, reverification: 0, rejected: 0, changesRequested: 0, published: 0 }
  for (const f of fields) {
    if (f.sensitive) s.sensitive += 1
    else s.standard += 1
    if (f.status === 'approved') s.approved += 1
    else if (f.status === 'pending') s.pending += 1
    else if (f.status === 'reverification') s.reverification += 1
    else if (f.status === 'rejected') s.rejected += 1
    else if (f.status === 'changes_requested') s.changesRequested += 1
    else if (f.status === 'published') s.published += 1
  }
  return s
}

// Server-side validation for one field decision. A content moderator can
// never approve a verification-critical change.
export function validateFieldDecision(field, input, checklist = []) {
  if (!field) return 'This field is no longer part of the change request.'
  if (!FIELD_DECISIONS.includes(input.decision)) return 'Choose a decision for this field.'
  if (field.status !== 'pending') return `${field.label} already has a decision.`
  if (input.decision === 'approve') {
    if (field.sensitive) return `${field.label} affects verified information — send it for re-verification instead of approving.`
    const missing = checklist.filter((c) => input.checks?.[c.id] !== 'pass')
    if (missing.length) return `Every policy check must pass before approval (${missing.length} outstanding).`
    return null
  }
  if (input.decision === 'reverify') return null
  if (!input.reason) return 'A reason is required.'
  if (!String(input.providerMessage || '').trim()) return input.decision === 'reject' ? 'A provider-facing explanation is required.' : 'Write the message the provider will see.'
  if (input.decision === 'reject' && !String(input.internalNote || '').trim()) return 'An internal admin note is required for rejections.'
  return null
}

export function decideField(fields, key, input, actor, now) {
  return fields.map((f) =>
    f.key === key
      ? { ...f, status: FIELD_STATUS_FOR[input.decision], decision: { decision: input.decision, reason: input.reason || null, providerMessage: input.providerMessage || null, by: actor, at: now } }
      : f,
  )
}

// Approved fields that can be published together, atomically.
export const publishable = (fields) => fields.filter((f) => f.status === 'approved' && !f.sensitive)

// Overall request status once nothing is pending.
export function changeRequestOutcome(fields) {
  if (fields.some((f) => f.status === 'pending' || f.status === 'approved')) return null
  if (fields.some((f) => f.status === 'reverification')) return 'reverification'
  if (fields.some((f) => f.status === 'changes_requested')) return 'changes_requested'
  if (fields.some((f) => f.status === 'published')) return 'approved'
  return 'rejected'
}

// ---------- ADM-039 service information ----------

export const SERVICE_FIELDS = [
  ['name', 'Service Name'],
  ['description', 'Description'],
  ['durationMins', 'Duration'],
  ['price', 'Price'],
  ['category', 'Category'],
  ['serviceModes', 'Service Mode'],
  ['locations', 'Location'],
  ['tags', 'Tags / Features'],
]
// Category changes can affect professional eligibility.
export const SENSITIVE_SERVICE_FIELDS = new Set(['category'])

export function serviceChangedFields(current, proposed) {
  if (!current) return SERVICE_FIELDS.filter(([k]) => proposed?.[k] != null).map(([k]) => k)
  return SERVICE_FIELDS.filter(([k]) => !same(current[k], proposed?.[k])).map(([k]) => k)
}

// Service categories each approved provider type may offer. Spas and hotels
// may list any wellness category. Configurable policy in production.
export const CATEGORY_ELIGIBILITY = {
  massage_therapist: ['Massage', 'Aromatherapy', 'Reflexology'],
  physiotherapist: ['Physiotherapy', 'Recovery', 'Rehabilitation', 'Sports Massage'],
  fitness_trainer: ['Fitness', 'Personal Training', 'Strength', 'Conditioning'],
  yoga_specialist: ['Yoga', 'Breathwork', 'Stretching'],
  meditation_specialist: ['Meditation', 'Mindfulness', 'Breathwork'],
}

export function serviceEligibility(providerType, category, approvedCategoryLabel) {
  const allowed = CATEGORY_ELIGIBILITY[providerType]
  if (!allowed) return { consistent: true, approvedCategory: approvedCategoryLabel || 'Business (all wellness categories)', submittedCategory: category || '—' }
  const consistent = Boolean(category) && allowed.some((c) => c.toLowerCase() === String(category).toLowerCase())
  return { consistent, approvedCategory: approvedCategoryLabel, submittedCategory: category || '—', allowed }
}

// Wording that turns wellness descriptions into unsupported medical
// guarantees. Flags for the moderator — never an automatic rejection.
const CLAIM_PATTERNS = [
  /\bguarantee(d|s)?\b/gi,
  /\bcures?\b|\bcured\b/gi,
  /\bheals?\b(?! and)/gi,
  /\b100\s?%/gi,
  /\bpermanent(ly)?\b/gi,
  /\btreats? (disease|illness|chronic|cancer|diabetes|depression)\b/gi,
  /\bmedical(ly)? proven\b/gi,
  /\b(eliminates?|reverses?) (pain|disease)\b/gi,
]
export function detectClaims(text = '') {
  const found = new Set()
  for (const re of CLAIM_PATTERNS) for (const m of String(text).matchAll(re)) found.add(m[0].toLowerCase())
  return [...found]
}
const CONTACT_PATTERNS = [/\+?\d[\d\s-]{7,}\d/g, /\b[\w.-]+@[\w-]+\.\w{2,}\b/g, /\bwhats\s?app\b/gi, /\bcall me\b/gi, /\bdm me\b/gi]
export function detectContact(text = '') {
  const found = new Set()
  for (const re of CONTACT_PATTERNS) for (const m of String(text).matchAll(re)) found.add(m[0])
  return [...found]
}

export const SERVICE_CHANGE_AFFECTED = ['Service Name', 'Description', 'Price', 'Duration', 'Service Mode', 'Location Information', 'Other']
export const SERVICE_CHANGE_REASONS = ['Description unclear', 'Unsupported claim', 'Contact information included', 'Service information incomplete', 'Category needs clarification', 'Pricing information unclear', 'Other']
export const PROFILE_CHANGE_REASONS = ['Information unclear', 'Unsupported claim', 'Prohibited contact information', 'Inappropriate wording', 'Too promotional', 'Information inconsistent', 'Other']

// Service decision validation (whole submission).
export function validateServiceDecision(input, { checklist, eligibility }) {
  const d = input.decision
  if (!['approve', 'request_changes', 'reject', 'reverify', 'escalate'].includes(d)) return 'Choose a moderation decision.'
  if (d === 'approve') {
    if (eligibility && !eligibility.consistent) return "This service is outside the provider's approved category — send it for verification review."
    const missing = checklist.filter((c) => input.checks?.[c.id] !== 'pass')
    if (missing.length) return `Every policy check must pass before approval (${missing.length} outstanding).`
    return null
  }
  if (d === 'reverify') return null
  if (!input.reason) return 'A reason is required.'
  if (d === 'request_changes' && !input.affectedField) return 'Select the affected field.'
  if (d !== 'escalate' && !String(input.providerMessage || '').trim()) return d === 'reject' ? 'A provider-facing explanation is required.' : 'Write the message the provider will see.'
  if (d === 'reject' && !String(input.internalNote || '').trim()) return 'An internal admin note is required for rejections.'
  if (d === 'escalate' && !ESCALATION_TEAMS[input.escalateTo]) return 'Choose who the review is escalated to.'
  return null
}

// Fields written back to provider_services on approval — same contract as
// ADM-023 (proposedChanges → live, approvalStatus).
export function servicePublishPatch(proposed) {
  const out = {}
  for (const [k] of SERVICE_FIELDS) if (proposed?.[k] !== undefined) out[k] = proposed[k]
  return out
}

// Build the ADM-039 view model from a normalised record's serviceChange.
export function buildServiceReview(sc, provider) {
  if (!sc) return null
  const current = sc.current || null
  const proposed = sc.proposed || {}
  const changed = serviceChangedFields(current, proposed)
  const eligibility = serviceEligibility(provider.type, proposed.category, provider.typeLabel)
  const claims = detectClaims(`${proposed.name || ''} ${proposed.description || ''}`)
  const contact = detectContact(`${proposed.name || ''} ${proposed.description || ''}`)
  const issues = [
    ...claims.map((c) => ({ type: 'claim', text: `Possible unsupported claim: “${c}”` })),
    ...contact.map((c) => ({ type: 'contact', text: `Contact information in public text: “${c}”` })),
    ...(!eligibility.consistent ? [{ type: 'eligibility', text: `“${proposed.category}” is outside the provider's approved category (${eligibility.approvedCategory})` }] : []),
    ...(proposed.price == null ? [{ type: 'pricing', text: 'Price is missing' }] : []),
    ...(!proposed.durationMins ? [{ type: 'duration', text: 'Duration is missing' }] : []),
  ]
  return {
    mode: current ? 'update' : 'new',
    serviceId: sc.serviceId || null,
    current,
    proposed,
    fields: SERVICE_FIELDS.map(([key, l]) => ({
      key,
      label: l,
      current: current ? current[key] ?? null : null,
      proposed: proposed[key] ?? null,
      changed: changed.includes(key),
      sensitive: SENSITIVE_SERVICE_FIELDS.has(key),
      diff: (key === 'description' || key === 'name') && current ? diffWords(asText(current[key]), asText(proposed[key])) : null,
    })),
    changedFields: changed,
    eligibility,
    claims,
    issues,
    verificationImpact: !eligibility.consistent || (current && changed.includes('category')) ? 'Verification review required' : 'None',
    pricing: { price: proposed.price ?? null, pricingType: proposed.pricingType || 'Fixed', previousPrice: current?.price ?? null },
    bufferMins: sc.bufferMins ?? null,
    branches: sc.branches || [],
    mediaStatus: sc.mediaStatus || null,
    mediaModerationId: sc.mediaModerationId || null,
    versions: (sc.versions || []).map((v) => ({ ...v, submittedAt: v.submittedAt ? new Date(toMillis(v.submittedAt)).toISOString() : null })),
  }
}

export function buildProfileChangeReview(pc) {
  if (!pc) return null
  const fields = (pc.fields || []).map(normalizeField).map((f) => ({
    ...f,
    decision: f.decision ? { ...f.decision, at: f.decision.at ? new Date(f.decision.at).toISOString() : null } : null,
    diff: typeof f.current === 'string' || typeof f.proposed === 'string' ? diffWords(asText(f.current), asText(f.proposed)) : null,
    listDiff: Array.isArray(f.current) || Array.isArray(f.proposed) ? { added: (f.proposed || []).filter((x) => !(f.current || []).includes(x)), removed: (f.current || []).filter((x) => !(f.proposed || []).includes(x)), kept: (f.current || []).filter((x) => (f.proposed || []).includes(x)) } : null,
  }))
  return {
    currentVersion: pc.currentVersion || null,
    proposedVersion: pc.proposedVersion || null,
    fields,
    summary: fieldSummary(fields, pc.previousRequests || 0),
    currentProfile: pc.currentProfile || {},
    versions: (pc.versions || []).map((v) => ({ ...v, submittedAt: v.submittedAt ? new Date(toMillis(v.submittedAt)).toISOString() : null })),
    publishable: publishable(fields).map((f) => f.key),
  }
}

export const changeReasons = { profile: PROFILE_CHANGE_REASONS, service: SERVICE_CHANGE_REASONS, reject: REJECT_REASONS, media: CHANGE_REASONS.media }

// Full review payload: the shared moderation review plus the ADM-038 / ADM-039
// comparison data when the record carries it.
export function buildFullReview(record, opts) {
  const base = buildReview(record, opts)
  const profileChange = buildProfileChangeReview(record.profileChange)
  const serviceReview = buildServiceReview(record.serviceChange, record.provider)
  return {
    ...base,
    profileChange,
    serviceReview,
    reasons: { ...base.reasons, ...(profileChange ? { changes: PROFILE_CHANGE_REASONS } : {}), ...(serviceReview ? { changes: SERVICE_CHANGE_REASONS, affected: SERVICE_CHANGE_AFFECTED } : {}) },
  }
}
