// ADM-035 → ADM-037 — Content moderation: pure logic, no Firestore.
//
// Content moderation is not provider verification (ADM-029–034): it decides
// whether content a provider wants to publish is appropriate, accurate and
// compliant. One moderation record (`content_moderation`) references the
// provider's existing content — it never copies the provider's profile,
// gallery, services or packages. Every decision preserves earlier versions and
// writes history; a rejection never suspends a provider.

export const MINUTE = 60 * 1000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

// Moderation target (hours) before an open item counts as overdue.
export const REVIEW_TARGET_HOURS = { urgent: 4, high: 12, normal: 24, low: 48 }

export const CONTENT_TYPES = {
  profile_photo: 'Profile Photo',
  gallery: 'Gallery',
  service: 'Service Content',
  business_profile: 'Business Profile',
  offer: 'Offer',
  package: 'Package',
  other: 'Other Public Content',
}

export const STATUSES = ['awaiting_review', 'under_review', 'resubmitted', 'escalated', 'changes_requested', 'approved', 'rejected']
// Items a moderator can act on now (changes_requested waits for the provider).
export const OPEN_STATUSES = ['awaiting_review', 'under_review', 'resubmitted', 'escalated']
export const PRIORITIES = ['urgent', 'high', 'normal', 'low']
export const MEDIA_STATUSES = ['awaiting_review', 'under_review', 'approved', 'changes_requested', 'rejected', 'escalated']
const DECIDED_MEDIA = new Set(['approved', 'changes_requested', 'rejected', 'escalated'])

export const MARKET_META = {
  KE: { name: 'Kenya', currency: 'KES' },
  UG: { name: 'Uganda', currency: 'UGX' },
  TZ: { name: 'Tanzania', currency: 'TZS' },
  RW: { name: 'Rwanda', currency: 'RWF' },
  ZA: { name: 'South Africa', currency: 'ZAR' },
}

export const PROVIDER_TYPE_LABELS = {
  massage_therapist: 'Massage Therapist',
  fitness_trainer: 'Fitness Trainer',
  physiotherapist: 'Physiotherapist',
  meditation_specialist: 'Meditation Specialist',
  yoga_specialist: 'Yoga Specialist',
  spa: 'Spa & Wellness Center',
  hotel_resort: 'Hotel & Wellness Resort',
}
export function providerCategory(type) {
  const t = String(type || '').toLowerCase()
  if (t.includes('spa')) return 'spa'
  if (t.includes('hotel') || t.includes('resort')) return 'hotel'
  return 'individual'
}

// Policy checklists per content type. In production these come from the
// moderation policy configuration; this is the default policy.
const CORE = [
  ['no_explicit', 'No nudity or explicit content'],
  ['no_sexual', 'No sexual or suggestive presentation prohibited by policy'],
  ['no_contact', 'No prohibited contact information'],
  ['no_external_booking', 'No external booking promotion'],
  ['no_misleading', 'No misleading promotional text'],
]
export const CHECKLISTS = {
  profile_photo: [
    ['clear', 'Image is clear enough for public display'],
    ['subject_visible', 'Provider is clearly visible'],
    ['professional', 'Photo is appropriate for a professional wellness marketplace'],
    ...CORE,
    ['no_offensive', 'No offensive or prohibited imagery'],
    ['standards', 'Meets Lé Inspa profile-photo standards'],
  ],
  media: [
    ['clear', 'Image is clear enough for public display'],
    ['relevant', 'Media is relevant to the provider/business'],
    ['category', 'Media matches its assigned category'],
    ['no_explicit', 'No nudity or prohibited explicit content'],
    ['no_sexual', 'No prohibited sexual or suggestive content'],
    ['no_private', 'No visible private client information'],
    ['no_contact', 'No prohibited contact information'],
    ['no_external_booking', 'No external booking solicitation'],
    ['no_misleading', 'No misleading promotional text'],
    ['no_offensive', 'No offensive or prohibited imagery'],
    ['standards', 'Meets Lé Inspa media standards'],
  ],
  service: [
    ['category', 'Service belongs to an appropriate provider category'],
    ['professional', 'Description is professional'],
    ['no_explicit_language', 'No sexual or explicit language'],
    ['no_medical_claims', 'No prohibited or misleading medical claims'],
    ['no_external_booking', 'No external booking or contact solicitation'],
    ['images', 'Images are appropriate'],
    ['complete', 'Pricing and content fields are complete'],
  ],
  offer: [
    ['accurate', 'Offer details are clear and accurate'],
    ['pricing', 'Original and offer prices are consistent'],
    ['dates', 'Validity dates are present and sensible'],
    ['eligible', 'Eligible services belong to this provider'],
    ['image', 'Promotional image is appropriate'],
    ...CORE.slice(2),
  ],
  business_profile: [
    ['accurate', 'Business description is accurate and professional'],
    ['logo', 'Logo / cover image is appropriate'],
    ['wellness_scope', 'Content stays within Lé Inspa wellness scope'],
    ...CORE,
  ],
  other: [
    ['appropriate', 'Content is appropriate for a wellness marketplace'],
    ...CORE,
    ['standards', 'Meets Lé Inspa content standards'],
  ],
}
export const checklistFor = (contentType, isMedia = false) => {
  const key = isMedia ? 'media' : contentType === 'package' ? 'offer' : contentType === 'gallery' ? 'media' : contentType
  return (CHECKLISTS[key] || CHECKLISTS.other).map(([id, label]) => ({ id, label }))
}

// Fixable reasons (Request Changes) and policy reasons (Reject / Escalate).
export const CHANGE_REASONS = {
  profile_photo: ['Photo too blurry', 'Provider not clearly visible', 'Poor crop', 'Promotional text included', 'Contact information visible', 'Image inappropriate for profile use', 'Incorrect image uploaded', 'Other'],
  media: ['Image too blurry', 'Poor crop', 'Wrong media category', 'Image unrelated to business/service', 'Private information visible', 'Promotional/contact information visible', 'Duplicate image', 'Media does not meet quality standards', 'Other'],
  default: ['Image quality too low', 'Description needs clarification', 'Inappropriate wording', 'Promotional information incomplete', 'Unsupported claim', 'Contact information included', 'Content does not meet profile standards', 'Other'],
}
export const REJECT_REASONS = ['Explicit or sexual content', 'Prohibited contact or external booking', 'Misleading or false content', 'Offensive or prohibited imagery', 'Content unrelated to wellness services', 'Privacy violation', 'Repeated policy violation', 'Other policy violation']
export const ESCALATE_REASONS = ['Potential explicit content', 'Safety concern', 'Privacy concern', 'Potential illegal content', 'Possible impersonation concern', 'Serious professional misconduct concern', 'Repeated prohibited submissions', 'Complex policy interpretation', 'Other']
export const ESCALATION_TEAMS = { trust_safety: 'Trust & Safety', senior_moderation: 'Senior Moderation' }
export const reasonsFor = (contentType, isMedia) => (isMedia || contentType === 'gallery' ? CHANGE_REASONS.media : CHANGE_REASONS[contentType] || CHANGE_REASONS.default)

// ---------- normalisation ----------

export function toMillis(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value instanceof Date) return value.getTime()
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value === 'object' && typeof value.seconds === 'number') return value.seconds * 1000
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? null : ms
}
const iso = (ms) => (ms == null ? null : new Date(ms).toISOString())
const str = (...v) => v.find((x) => typeof x === 'string' && x.trim())?.trim() || null
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const lower = (v, allowed, fallback) => {
  const s = String(v || '').toLowerCase()
  return allowed.includes(s) ? s : fallback
}

function normalizeMedia(m, i) {
  return {
    mediaId: str(m.mediaId) || `MED-${i + 1}`,
    title: str(m.title) || `Media ${i + 1}`,
    category: lower(m.category, ['profile', 'gallery', 'services', 'facilities', 'wellness_locations'], 'gallery'),
    url: str(m.url, m.mediaRef),
    width: num(m.width),
    height: num(m.height),
    sizeBytes: num(m.sizeBytes),
    format: str(m.format)?.toUpperCase() || null,
    status: lower(m.status, MEDIA_STATUSES, 'awaiting_review'),
    version: num(m.version) || 1,
    position: num(m.position) ?? i + 1,
    relatedEntity: m.relatedEntity ? { type: str(m.relatedEntity.type), name: str(m.relatedEntity.name) } : null,
    branch: str(m.branch),
    placements: Array.isArray(m.placements) ? m.placements.filter(Boolean) : [],
    peopleVisible: Boolean(m.peopleVisible),
    consent: lower(m.consent, ['satisfied', 'review'], null),
    uploadedAt: toMillis(m.uploadedAt),
    decision: m.decision ? { ...m.decision, at: toMillis(m.decision.at) } : null,
    versions: (m.versions || []).map((v) => ({ version: num(v.version), status: lower(v.status, MEDIA_STATUSES, 'changes_requested'), reason: str(v.reason), url: str(v.url), submittedAt: toMillis(v.submittedAt) })),
  }
}

// Raw `content_moderation` document → one consistent record.
export function normalizeModeration(id, d = {}) {
  const contentType = lower(d.contentType, Object.keys(CONTENT_TYPES), 'other')
  const countryCode = str(d.countryCode, d.marketId)?.toUpperCase() || null
  const providerType = str(d.providerType)?.toLowerCase() || null
  return {
    id,
    contentId: str(d.contentId) || id,
    contentType,
    contentLabel: str(d.contentLabel) || CONTENT_TYPES[contentType],
    title: str(d.title),
    status: lower(d.status, STATUSES, 'awaiting_review'),
    priority: lower(d.priority, PRIORITIES, 'normal'),
    version: num(d.contentVersion ?? d.version) || 1,
    provider: {
      id: str(d.providerId),
      ref: str(d.providerRef, d.providerId),
      name: str(d.providerName) || 'Provider',
      type: providerType,
      typeLabel: PROVIDER_TYPE_LABELS[providerType] || null,
      category: providerCategory(providerType),
      verified: Boolean(d.providerVerified),
      city: str(d.providerCity, d.city),
      photoUrl: str(d.providerPhotoUrl),
      rating: num(d.providerRating),
      reviews: num(d.providerReviewCount),
      price: num(d.providerPrice),
    },
    countryCode,
    marketName: MARKET_META[countryCode]?.name || countryCode || '—',
    currency: str(d.currency) || MARKET_META[countryCode]?.currency || null,
    assignedTo: d.assignedTo?.name ? { id: str(d.assignedTo.id), name: d.assignedTo.name } : null,
    submittedAt: toMillis(d.submittedAt),
    dueAt: toMillis(d.dueAt),
    reviewStartedAt: toMillis(d.reviewStartedAt),
    reviewedAt: toMillis(d.reviewedAt),
    reviewedBy: d.reviewedBy?.name ? { id: str(d.reviewedBy.id), name: d.reviewedBy.name } : null,
    decision: str(d.decision),
    reason: str(d.reason),
    providerMessage: str(d.providerMessage),
    escalation: d.escalation ? { team: str(d.escalation.team), reason: str(d.escalation.reason), at: toMillis(d.escalation.at) } : null,
    placements: Array.isArray(d.placements) ? d.placements.filter(Boolean) : [],
    media: (d.media || []).map(normalizeMedia),
    service: d.service || null,
    offer: d.offer || null,
    business: d.business || null,
    previousVersions: (d.previousVersions || []).map((v) => ({ version: num(v.version), status: lower(v.status, STATUSES, 'changes_requested'), reason: str(v.reason), submittedAt: toMillis(v.submittedAt), url: str(v.url) })),
    resubmitted: Boolean(d.resubmitted) || d.status === 'resubmitted',
  }
}

// ---------- queue (ADM-035) ----------

export const isOpen = (r) => OPEN_STATUSES.includes(r.status)
export function dueAtOf(r) {
  return r.dueAt ?? (r.submittedAt != null ? r.submittedAt + (REVIEW_TARGET_HOURS[r.priority] ?? 24) * HOUR : null)
}
export const isOverdue = (r, now) => isOpen(r) && r.status !== 'escalated' && dueAtOf(r) != null && dueAtOf(r) < now

const startOfDayIn = (ms, tzOffsetMins = 180) => {
  const shifted = ms + tzOffsetMins * MINUTE
  return shifted - (shifted % DAY) - tzOffsetMins * MINUTE
}

const PRIORITY_RANK = { urgent: 0, high: 1, normal: 2, low: 3 }
const TABS = ['all', 'profile_photo', 'gallery', 'service', 'business_profile', 'offer', 'package', 'other']

export function scopeRecords(records, { markets, providerCategory: cat }) {
  return records.filter((r) => (!markets || markets.includes(r.countryCode)) && (!cat || r.provider.category === cat))
}

function matchesQuery(r, q) {
  const needle = String(q || '').trim().toLowerCase()
  if (!needle) return true
  return [r.id, r.contentId, r.provider.name, r.provider.ref, r.title, r.contentLabel, r.service?.name, r.offer?.title].some((v) => v && String(v).toLowerCase().includes(needle))
}

function submittedWithin(r, key, now) {
  const hours = { '24h': 24, '7d': 168, '30d': 720 }[key]
  return !hours || (r.submittedAt != null && r.submittedAt >= now - hours * HOUR)
}

// Thumbnail shown in the queue: first media item, else the offer image.
const thumbOf = (r) => r.media[0]?.url || r.offer?.imageUrl || r.business?.logoUrl || r.service?.imageUrl || null

export function toQueueRow(r, now) {
  return {
    id: r.id,
    contentId: r.contentId,
    contentType: r.contentType,
    contentLabel: r.contentLabel,
    title: r.title,
    thumbnailUrl: thumbOf(r),
    mediaCount: r.media.length,
    provider: { id: r.provider.id, ref: r.provider.ref, name: r.provider.name, typeLabel: r.provider.typeLabel, category: r.provider.category, verified: r.provider.verified },
    countryCode: r.countryCode,
    marketName: r.marketName,
    submittedAt: iso(r.submittedAt),
    priority: r.priority,
    status: r.status,
    overdue: isOverdue(r, now),
    resubmitted: r.resubmitted,
    assignedTo: r.assignedTo,
    version: r.version,
  }
}

// Build the moderation queue: KPI cards, attention cards, type tabs and one page.
export function buildQueue(records, params = {}, { now, tzOffsetMins = 180, adminId = null } = {}) {
  const todayStart = startOfDayIn(now, tzOffsetMins)
  const count = (set, fn) => set.filter(fn).length

  const kpis = {
    awaiting: count(records, (r) => r.status === 'awaiting_review' || r.status === 'resubmitted'),
    awaitingPriority: count(records, (r) => (r.status === 'awaiting_review' || r.status === 'resubmitted') && (r.priority === 'urgent' || r.priority === 'high')),
    underReview: count(records, (r) => r.status === 'under_review'),
    changesRequested: count(records, (r) => r.status === 'changes_requested'),
    approvedToday: count(records, (r) => r.status === 'approved' && r.reviewedAt != null && r.reviewedAt >= todayStart),
    escalated: count(records, (r) => r.status === 'escalated'),
  }
  const attention = {
    escalated: kpis.escalated,
    overdue: count(records, (r) => isOverdue(r, now)),
    resubmitted: count(records, (r) => r.status === 'resubmitted'),
  }

  // Everything except the type tab narrows the tab counts.
  const base = records.filter((r) =>
    (!params.status || (params.status === 'overdue' ? isOverdue(r, now) : r.status === params.status)) &&
    (!params.priority || r.priority === params.priority) &&
    (!params.reviewer || (params.reviewer === 'unassigned' ? !r.assignedTo : params.reviewer === 'me' ? r.assignedTo?.id === adminId : r.assignedTo?.name === params.reviewer)) &&
    submittedWithin(r, params.submitted, now) &&
    matchesQuery(r, params.q),
  )
  const tabs = TABS.map((id) => ({ id, count: id === 'all' ? base.length : count(base, (r) => r.contentType === id) }))
  const type = TABS.includes(params.type) && params.type !== 'all' ? params.type : null
  const rows = base.filter((r) => !type || r.contentType === type)

  // Open work first: overdue, then priority, then oldest submission.
  rows.sort((a, z) =>
    Number(isOpen(z)) - Number(isOpen(a)) ||
    Number(isOverdue(z, now)) - Number(isOverdue(a, now)) ||
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[z.priority] ||
    (params.sort === 'newest' ? (z.submittedAt ?? 0) - (a.submittedAt ?? 0) : (a.submittedAt ?? 0) - (z.submittedAt ?? 0)),
  )

  const pageSize = Math.min(Math.max(Number(params.pageSize) || 8, 5), 50)
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(Number(params.page) || 1, 1), totalPages)
  const reviewers = [...new Set(records.map((r) => r.assignedTo?.name).filter(Boolean))].sort()

  return {
    kpis,
    attention,
    tabs,
    reviewers,
    items: rows.slice((page - 1) * pageSize, page * pageSize).map((r) => toQueueRow(r, now)),
    total,
    page,
    pageSize,
    totalPages,
  }
}

// ---------- review detail (ADM-035 panel, ADM-036, ADM-037) ----------

// Measured image facts. Lighting, cropping and subject visibility are judged
// by the moderator in the checklist; they are never auto-passed here.
export function imageQuality(m, contentType) {
  if (!m?.width || !m?.height) return []
  const minSide = Math.min(m.width, m.height)
  const ratio = m.width / m.height
  const square = Math.abs(ratio - 1) < 0.05
  const g = (a, z) => {
    let x = a
    let y = z
    while (y) [x, y] = [y, x % y]
    return x
  }
  const d = g(m.width, m.height)
  return [
    { label: 'Resolution', value: `${m.width} × ${m.height}`, state: minSide >= 800 ? 'good' : minSide >= 400 ? 'fair' : 'poor', note: minSide >= 800 ? 'Good' : minSide >= 400 ? 'Acceptable' : 'Too low' },
    { label: 'Aspect Ratio', value: m.width / d <= 32 && m.height / d <= 32 ? `${m.width / d}:${m.height / d}` : `${ratio.toFixed(2)}:1`, state: contentType === 'profile_photo' ? (square ? 'good' : 'fair') : 'good', note: contentType === 'profile_photo' && !square ? 'Will be cropped' : 'Suitable' },
    ...(m.sizeBytes ? [{ label: 'File Size', value: `${(m.sizeBytes / 1024 / 1024).toFixed(1)} MB`, state: m.sizeBytes <= 10 * 1024 * 1024 ? 'good' : 'fair', note: m.sizeBytes <= 10 * 1024 * 1024 ? 'Suitable' : 'Large' }] : []),
    ...(m.format ? [{ label: 'Format', value: m.format, state: ['JPG', 'JPEG', 'PNG', 'WEBP'].includes(m.format) ? 'good' : 'fair', note: 'Supported' }] : []),
  ]
}

export function mediaSummary(media) {
  const s = { submitted: media.length, approved: 0, awaiting: 0, underReview: 0, changesRequested: 0, rejected: 0, escalated: 0 }
  for (const m of media) {
    if (m.status === 'approved') s.approved += 1
    else if (m.status === 'awaiting_review') s.awaiting += 1
    else if (m.status === 'under_review') s.underReview += 1
    else if (m.status === 'changes_requested') s.changesRequested += 1
    else if (m.status === 'rejected') s.rejected += 1
    else if (m.status === 'escalated') s.escalated += 1
  }
  s.reviewed = s.approved + s.changesRequested + s.rejected + s.escalated
  s.complete = media.length > 0 && s.reviewed === media.length
  return s
}

const mediaOut = (m, contentType) => ({
  ...m,
  uploadedAt: iso(m.uploadedAt),
  decision: m.decision ? { ...m.decision, at: iso(m.decision.at) } : null,
  versions: m.versions.map((v) => ({ ...v, submittedAt: iso(v.submittedAt) })),
  quality: imageQuality(m, contentType),
  checklist: checklistFor(contentType, contentType === 'gallery'),
})

export function buildReview(r, { now, history = [], notes = [], providerStats = null } = {}) {
  return {
    ...toQueueRow(r, now),
    provider: { ...r.provider },
    currency: r.currency,
    dueAt: iso(dueAtOf(r)),
    reviewStartedAt: iso(r.reviewStartedAt),
    reviewedAt: iso(r.reviewedAt),
    reviewedBy: r.reviewedBy,
    decision: r.decision,
    reason: r.reason,
    providerMessage: r.providerMessage,
    escalation: r.escalation ? { ...r.escalation, at: iso(r.escalation.at) } : null,
    placements: r.placements,
    media: r.media.map((m) => mediaOut(m, r.contentType)),
    mediaSummary: r.contentType === 'gallery' ? mediaSummary(r.media) : null,
    service: r.service,
    offer: r.offer,
    business: r.business,
    previousVersions: r.previousVersions.map((v) => ({ ...v, submittedAt: iso(v.submittedAt) })),
    checklist: checklistFor(r.contentType),
    reasons: { changes: reasonsFor(r.contentType), reject: REJECT_REASONS, escalate: ESCALATE_REASONS, teams: ESCALATION_TEAMS },
    history: history.map((h) => ({ ...h, at: iso(toMillis(h.at)) })).sort((a, z) => String(z.at).localeCompare(String(a.at))),
    notes: notes.map((n) => ({ ...n, createdAt: iso(toMillis(n.createdAt)) })).sort((a, z) => String(z.createdAt).localeCompare(String(a.createdAt))),
    providerStats,
  }
}

// ---------- decisions ----------

export const DECISIONS = ['approve', 'request_changes', 'reject', 'escalate']
const STATUS_FOR = { approve: 'approved', request_changes: 'changes_requested', reject: 'rejected', escalate: 'escalated' }

// Server-side validation for a moderation decision. Returns an error message
// or null. Request Changes and Reject are different outcomes on purpose.
export function validateDecision(input, checklist) {
  const { decision, checks = {}, reason, providerMessage, internalNote, escalateTo } = input
  if (!DECISIONS.includes(decision)) return 'Choose a moderation decision.'
  if (decision === 'approve') {
    const missing = checklist.filter((c) => checks[c.id] !== 'pass')
    if (missing.length) return `Every policy check must pass before approval (${missing.length} outstanding).`
    return null
  }
  if (!reason) return 'A reason is required.'
  if (decision === 'request_changes' && !String(providerMessage || '').trim()) return 'Write the message the provider will see.'
  if (decision === 'reject') {
    if (!String(providerMessage || '').trim()) return 'A provider-facing explanation is required.'
    if (!String(internalNote || '').trim()) return 'An internal admin note is required for rejections.'
  }
  if (decision === 'escalate' && !ESCALATION_TEAMS[escalateTo]) return 'Choose who the review is escalated to.'
  return null
}

// Apply a decision to a whole content item (non-gallery). Returns the patch
// and history entry; the caller writes both atomically.
export function decideRecord(r, input, actor, now) {
  const status = STATUS_FOR[input.decision]
  const patch = {
    status,
    decision: input.decision,
    reason: input.reason || null,
    providerMessage: input.decision === 'approve' ? null : input.providerMessage || null,
    policyChecks: input.checks || {},
    reviewedBy: actor,
    reviewedAt: now,
    publicEligible: status === 'approved',
    ...(input.decision === 'escalate' ? { escalation: { team: input.escalateTo, reason: input.reason, at: now } } : {}),
  }
  return { patch, history: historyEntry(r.id, `${label(status)}${input.reason ? ` — ${input.reason}` : ''}`, actor, now, { decision: input.decision, version: r.version, escalateTo: input.escalateTo || null }) }
}

// Apply a decision to one gallery item. One rejected image never rejects the
// rest of the gallery.
export function decideMedia(media, mediaId, input, actor, now) {
  const idx = media.findIndex((m) => m.mediaId === mediaId)
  if (idx < 0) return { error: 'This media item is no longer part of the submission.' }
  const status = STATUS_FOR[input.decision]
  const next = media.map((m, i) =>
    i === idx
      ? { ...m, status, publicEligible: status === 'approved', decision: { decision: input.decision, reason: input.reason || null, providerMessage: input.providerMessage || null, checks: input.checks || {}, by: actor, at: now, escalateTo: input.escalateTo || null } }
      : m,
  )
  return { media: next, item: next[idx], status }
}

// Overall result once every media item has a decision.
export function galleryOutcome(media) {
  const s = mediaSummary(media)
  if (!s.complete) return null
  const status = s.escalated ? 'escalated' : s.changesRequested ? 'changes_requested' : s.approved ? 'approved' : 'rejected'
  return { status, summary: s, publishedMediaIds: media.filter((m) => m.status === 'approved').map((m) => m.mediaId) }
}

export function historyEntry(moderationId, event, actor, at, details = {}) {
  return { moderationId, event, actor: actor ? { id: actor.id || null, name: actor.name || null } : null, at, details }
}

export function label(value) {
  if (!value) return '—'
  const text = String(value).replaceAll('_', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
