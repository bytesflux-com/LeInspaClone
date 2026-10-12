// ADM-025 — Provider Reviews (REUSE / ADMIN VIEW). Pure logic over the shared
// review records (`provider_reviews`), their reports (`review_reports`) and the
// append-only moderation history (`review_moderation_events`). There is no
// admin_provider_reviews copy.
//
// Rules this module enforces:
//   • negative ≠ policy violation — low ratings are never hidden automatically,
//     and hide/remove needs a configured policy reason;
//   • reports are allegations — they surface as context, never as a verdict;
//   • original review text and rating are never modified; moderation changes
//     visibility and appends history;
//   • provider responses go through the same moderation path (target: 'response').

import { DAY, clean, lower, normalizeBooking, pct, round1, toMillis } from './providerAdminShared.js'

export const REVIEW_STATUSES = ['published', 'hidden', 'removed', 'pending_review']
export const REVIEW_TABS = ['all', 'published', 'reported', 'hidden', 'pending']

// Configured moderation reasons (hide / remove). "Provider dislikes it" is
// deliberately not a reason.
export const MODERATION_REASONS = [
  { code: 'abusive_language', label: 'Abusive language' },
  { code: 'harassment', label: 'Harassment' },
  { code: 'personal_information', label: 'Personal information' },
  { code: 'spam', label: 'Spam' },
  { code: 'irrelevant_content', label: 'Irrelevant content' },
  { code: 'fake_manipulated', label: 'Fake / Manipulated review' },
  { code: 'prohibited_content', label: 'Prohibited content' },
  { code: 'other_policy', label: 'Other policy reason' },
]

export const RESTORE_REASONS = [
  { code: 'moderation_error', label: 'Previous moderation was incorrect' },
  { code: 'appeal_upheld', label: 'Client appeal upheld' },
  { code: 'policy_review_completed', label: 'Policy review completed — no violation' },
]

export const MODERATION_ACTIONS = ['keep_published', 'hide', 'remove', 'request_review', 'restore']

export const DEFAULT_REVIEW_POLICY = {
  reviewWindowDays: 30, // a review must be submitted within N days of the completed booking
  requireVerifiedBooking: true,
}

const REPORT_OPEN = ['open', 'under_review', 'escalated']

export function normalizeReview(id, r = {}) {
  const response = r.providerResponse && r.providerResponse.text
    ? {
        text: String(r.providerResponse.text),
        status: lower(r.providerResponse.status || 'published'),
        respondedAt: toMillis(r.providerResponse.respondedAt),
        reported: Boolean(r.providerResponse.reported),
      }
    : null
  const status = lower(r.status || 'published')
  return {
    id: r.reviewId || id,
    docId: id,
    providerId: r.providerId || null,
    clientId: r.clientId || null,
    clientName: r.clientName || 'Client',
    bookingId: r.bookingId || null,
    serviceName: r.serviceName || null,
    rating: Math.max(1, Math.min(5, Number(r.rating) || 0)),
    text: String(r.text || r.comment || ''),
    status: REVIEW_STATUSES.includes(status) ? status : 'published',
    submittedAt: toMillis(r.submittedAt || r.createdAt),
    publishedAt: toMillis(r.publishedAt),
    media: Array.isArray(r.media) ? r.media.map((m, i) => ({
      id: m.id || `m${i}`,
      url: m.url || null,
      status: lower(m.status || 'pending'),
      public: Boolean(m.public) && lower(m.status) === 'approved',
      reported: Boolean(m.reported),
    })) : [],
    providerResponse: response,
    context: r.context || null,
    moderation: r.moderation || null,
    deviceHash: r.deviceHash || null,
    marketCode: r.marketCode || null,
    version: Number(r.version) || 0,
  }
}

export function normalizeReport(id, r = {}) {
  return {
    id: r.reportId || id,
    docId: id,
    reviewId: r.reviewId || null,
    target: lower(r.target || 'review'),
    reportedByType: lower(r.reportedByType || 'client'),
    reportedById: r.reportedById || null,
    reasonLabel: r.reasonLabel || r.reason || 'Reported',
    status: lower(r.status || 'open'),
    createdAt: toMillis(r.createdAt),
    assignedTo: r.assignedTo || null,
  }
}

const isOpenReport = (rep) => REPORT_OPEN.includes(rep.status)

// Authenticity signals: context for the admin, never automatic proof.
export function authenticitySignals(review, booking, siblings = [], policy = DEFAULT_REVIEW_POLICY) {
  const signals = []
  const add = (key, ok, label, warn = false) => signals.push({ key, ok, label, tone: ok ? 'ok' : warn ? 'warn' : 'missing' })
  add('booking_exists', Boolean(booking), booking ? 'Booking exists' : 'No linked booking found')
  if (booking) {
    add('booking_completed', booking.status === 'completed', booking.status === 'completed' ? 'Booking completed' : `Booking is ${booking.status}`)
    const clientMatch = !review.clientId || !booking.clientId || review.clientId === booking.clientId
    add('client_matches', clientMatch, clientMatch ? 'Client matches booking' : 'Reviewer is not the booking client')
    const anchor = booking.completedAt || booking.startAt
    const within = anchor && review.submittedAt ? review.submittedAt - anchor <= policy.reviewWindowDays * DAY && review.submittedAt >= anchor - DAY : true
    add('within_window', within, within ? 'Review submitted within allowed period' : `Submitted outside the ${policy.reviewWindowDays}-day review window`)
  }
  const dupes = siblings.filter((s) => s.id !== review.id && review.bookingId && s.bookingId === review.bookingId)
  add('no_duplicate', dupes.length === 0, dupes.length === 0 ? 'No duplicate review for same booking' : `${dupes.length} other review(s) for the same booking`)
  // Warnings (only listed when present).
  if (review.deviceHash) {
    const samePattern = siblings.filter((s) => s.id !== review.id && s.deviceHash === review.deviceHash && s.clientId !== review.clientId)
    if (samePattern.length) signals.push({ key: 'device_pattern', ok: false, tone: 'warn', label: 'Multiple reviews from same device/account pattern' })
  }
  if (booking && (booking.refunded || booking.disputed)) {
    signals.push({ key: 'booking_refunded', ok: false, tone: 'warn', label: booking.disputed ? 'Booking later disputed' : 'Booking later refunded' })
  }
  return signals
}

export function isBookingVerified(review, booking) {
  return Boolean(booking && booking.status === 'completed' && (!review.clientId || !booking.clientId || booking.clientId === review.clientId))
}

function inDateRange(ms, range, now) {
  if (!range || range === 'all' || !ms) return true
  const days = { '7d': 7, '30d': 30, '90d': 90, '12m': 365 }[range]
  return days ? ms >= now - days * DAY : true
}

function rowFor(review, booking, reports) {
  const open = reports.filter(isOpenReport)
  return {
    id: review.id,
    clientName: review.clientName,
    clientId: review.clientId,
    bookingId: review.bookingId,
    serviceName: review.serviceName,
    rating: review.rating,
    submittedAt: review.submittedAt,
    status: review.status,
    reported: open.length > 0,
    everReported: reports.length > 0,
    reportCount: open.length,
    bookingVerified: isBookingVerified(review, booking),
    hiddenReason: review.status === 'hidden' || review.status === 'removed' ? review.moderation?.reasonLabel || 'Moderation' : null,
    excerpt: review.text.slice(0, 140),
    hasMedia: review.media.length > 0,
    hasResponse: Boolean(review.providerResponse),
    context: review.context,
  }
}

// ADM-025 list payload: KPI overview, distribution, performance, tab counts, page.
export function buildReviewsView({ reviews = [], reports = [], bookings = [], filters = {}, now = Date.now() }) {
  const bookingById = new Map(bookings.map((b) => [b.id, b]))
  const reportsByReview = new Map()
  for (const rep of reports) {
    if (!reportsByReview.has(rep.reviewId)) reportsByReview.set(rep.reviewId, [])
    reportsByReview.get(rep.reviewId).push(rep)
  }
  const rows = reviews
    .map((r) => rowFor(r, bookingById.get(r.bookingId), reportsByReview.get(r.id) || []))
    .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))

  // Overview — always from the actual records.
  const published = rows.filter((r) => r.status === 'published')
  const avg = published.length ? round1(published.reduce((s, r) => s + r.rating, 0) / published.length) : null
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = published.filter((r) => r.rating === star).length
    return { star, count, percent: published.length ? Math.round((count / published.length) * 100) : 0 }
  })
  const monthStart = new Date(now)
  monthStart.setUTCDate(1)
  monthStart.setUTCHours(0, 0, 0, 0)
  const responded = reviews.filter((r) => r.providerResponse).length

  const counts = {
    all: rows.length,
    published: published.length,
    reported: rows.filter((r) => r.reported).length,
    hidden: rows.filter((r) => r.status === 'hidden' || r.status === 'removed').length,
    pending: rows.filter((r) => r.status === 'pending_review').length,
  }

  // "vs last month": the same figures as they stood 30 days ago.
  const monthAgo = now - 30 * DAY
  const publishedBefore = published.filter((r) => r.submittedAt && r.submittedAt < monthAgo)
  const avgBefore = publishedBefore.length ? publishedBefore.reduce((s, r) => s + r.rating, 0) / publishedBefore.length : null
  const overview = {
    averageRating: avg,
    ratingChange: avg !== null && avgBefore !== null ? round1(avg - avgBefore) : null,
    totalReviews: rows.length,
    newReviews30d: rows.filter((r) => r.submittedAt >= monthAgo).length,
    verifiedBookingReviews: rows.filter((r) => r.bookingVerified).length,
    verifiedShare: pct(rows.filter((r) => r.bookingVerified).length, rows.length),
    reportedReviews: counts.reported,
    reportedShare: pct(counts.reported, rows.length),
    hiddenRemoved: counts.hidden,
    hiddenShare: pct(counts.hidden, rows.length),
  }

  const prevMonthStart = new Date(monthStart)
  prevMonthStart.setUTCMonth(prevMonthStart.getUTCMonth() - 1)
  const thisMonth = rows.filter((r) => r.submittedAt >= monthStart.getTime()).length
  const lastMonth = rows.filter((r) => r.submittedAt >= prevMonthStart.getTime() && r.submittedAt < monthStart.getTime()).length
  const performance = {
    averageRating: avg,
    reviewsThisMonth: thisMonth,
    reviewsLastMonth: lastMonth,
    monthChange: lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null,
    // Share of 4–5★ published ratings — a rating count, not AI sentiment scoring
    // (sentiment analysis is not implemented on the platform, so none is shown).
    positiveShare: published.length ? Math.round(pct(published.filter((r) => r.rating >= 4).length, published.length)) : null,
    sentiment: null,
    reportedReviewRate: pct(rows.filter((r) => r.everReported).length, rows.length),
    responseRate: Math.round(pct(responded, reviews.length)),
  }

  const byService = new Map()
  for (const r of published) {
    const name = r.serviceName || 'Other'
    const s = byService.get(name) || { name, count: 0, total: 0 }
    s.count += 1
    s.total += r.rating
    byService.set(name, s)
  }
  const topServices = [...byService.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((s) => ({ name: s.name, count: s.count, averageRating: round1(s.total / s.count) }))

  // Filters
  const tab = REVIEW_TABS.includes(filters.tab) ? filters.tab : 'all'
  const q = lower(filters.search)
  const textById = new Map(reviews.map((r) => [r.id, lower(r.text)]))
  const filtered = rows.filter((r) => {
    if (tab === 'published' && r.status !== 'published') return false
    if (tab === 'reported' && !r.reported) return false
    if (tab === 'hidden' && r.status !== 'hidden' && r.status !== 'removed') return false
    if (tab === 'pending' && r.status !== 'pending_review') return false
    if (filters.rating && filters.rating !== 'all' && r.rating !== Number(filters.rating)) return false
    if (filters.status && filters.status !== 'all' && r.status !== filters.status) return false
    if (filters.bookingVerified === 'yes' && !r.bookingVerified) return false
    if (filters.bookingVerified === 'no' && r.bookingVerified) return false
    if (filters.hasMedia === 'yes' && !r.hasMedia) return false
    if (filters.hasResponse === 'yes' && !r.hasResponse) return false
    if (filters.hasResponse === 'no' && r.hasResponse) return false
    if (!inDateRange(r.submittedAt, filters.dateRange, now)) return false
    if (q) {
      const hay = `${lower(r.id)} ${lower(r.clientName)} ${lower(r.bookingId)} ${lower(r.serviceName)} ${textById.get(r.id) || ''}`
      if (!hay.includes(q)) return false
    }
    return true
  })

  const pageSize = Math.min(50, Math.max(5, Number(filters.pageSize) || 10))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(totalPages, Math.max(1, Number(filters.page) || 1))
  return {
    overview,
    distribution,
    performance,
    topServices,
    counts,
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
    totalPages,
  }
}

// Which moderation actions apply to the record's current state.
export function availableActions(review, openReports, target = 'review') {
  const status = target === 'response' ? review.providerResponse?.status : review.status
  if (!status) return []
  if (status === 'published') return openReports.length ? ['keep_published', 'hide', 'remove', 'request_review'] : ['hide', 'remove']
  if (status === 'pending_review') return ['keep_published', 'hide', 'remove']
  if (status === 'hidden') return ['restore', 'remove']
  if (status === 'removed') return ['restore']
  return []
}

export function buildReviewDetail({ review, booking, reports = [], events = [], siblings = [], provider, policy = DEFAULT_REVIEW_POLICY, canModerate = false }) {
  const openReports = reports.filter(isOpenReport)
  const verified = isBookingVerified(review, booking)
  return {
    review: {
      id: review.id,
      status: review.status,
      rating: review.rating,
      text: review.text,
      submittedAt: review.submittedAt,
      publishedAt: review.publishedAt,
      serviceName: review.serviceName || booking?.serviceName || null,
      context: review.context,
      moderation: review.moderation,
      version: review.version,
    },
    // Minimum client identity for the decision — no contact details.
    client: { id: review.clientId, name: review.clientName },
    provider: { id: provider?.id, name: provider?.name },
    booking: booking
      ? { id: booking.id, status: booking.status, serviceName: booking.serviceName, location: booking.locationName || booking.branchName || null, startAt: booking.startAt, completedAt: booking.completedAt, refunded: booking.refunded, disputed: booking.disputed }
      : { id: review.bookingId, missing: true },
    bookingVerification: {
      verified,
      label: verified ? 'Verified Completed Booking' : booking ? `Booking ${booking.status}` : 'No verified booking',
      required: policy.requireVerifiedBooking,
    },
    authenticity: authenticitySignals(review, booking, siblings, policy),
    media: review.media.map((m) => ({
      ...m,
      // Client media is never shown publicly before moderation completes.
      moderationPending: m.status === 'pending',
      url: m.status === 'rejected' ? null : m.url,
    })),
    reports: reports
      .map((r) => ({ ...r, open: isOpenReport(r) }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    providerResponse: review.providerResponse,
    history: events
      .map((e) => ({ id: e.id, type: e.type, label: e.label, at: toMillis(e.at || e.createdAt), actorName: e.actorName || null, detail: e.detail || null }))
      .sort((a, b) => (a.at || 0) - (b.at || 0)),
    actions: canModerate ? availableActions(review, openReports.filter((r) => r.target !== 'response'), 'review') : [],
    responseActions: canModerate && review.providerResponse ? availableActions(review, openReports.filter((r) => r.target === 'response'), 'response') : [],
    reasons: MODERATION_REASONS,
    restoreReasons: RESTORE_REASONS,
    negativeGuard: review.rating <= 2 && verified,
  }
}

const ACTION_LABEL = {
  keep_published: 'Review kept published',
  hide: 'Review hidden',
  remove: 'Review removed',
  request_review: 'Sent for further moderation review',
  restore: 'Review restored',
}

/**
 * Validates and plans a moderation decision. Returns { error } or the writes:
 *   reviewPatch   — fields to merge into the review (text / rating never touched)
 *   reportUpdates — [{ id, patch }] for affected open reports
 *   events        — append-only history entries
 *   notifications — notices to queue (client, reporter)
 *   audit         — audit-log metadata
 */
export function planReviewModeration({ review, reports = [], input = {}, actor = {}, now = Date.now() }) {
  const action = input.action
  const target = input.target === 'response' ? 'response' : 'review'
  if (!MODERATION_ACTIONS.includes(action)) return { error: 'Unknown moderation action.' }
  if (target === 'response' && !review.providerResponse) return { error: 'This review has no provider response.' }

  const currentStatus = target === 'response' ? review.providerResponse.status : review.status
  if (input.expectedStatus && input.expectedStatus !== currentStatus) {
    return { error: 'This review changed since you opened it. Reload to see the latest state.', code: 'failed-precondition' }
  }
  const relevantOpen = reports.filter((r) => isOpenReport(r) && (target === 'response' ? r.target === 'response' : r.target !== 'response'))
  if (!availableActions(review, relevantOpen, target).includes(action)) {
    return { error: `“${ACTION_LABEL[action]}” is not available while the ${target} is ${currentStatus.replace('_', ' ')}.` }
  }

  const internalNote = clean(input.internalNote)
  const clientExplanation = clean(input.clientExplanation, 1000)
  let reason = null
  if (action === 'hide' || action === 'remove') {
    reason = MODERATION_REASONS.find((r) => r.code === input.reasonCode)
    if (!reason) return { error: 'A configured moderation reason is required to hide or remove.' }
    if (reason.code === 'other_policy' && internalNote.length < 10) {
      return { error: '“Other policy reason” needs an internal note explaining the policy basis.' }
    }
  }
  if (action === 'restore') {
    reason = RESTORE_REASONS.find((r) => r.code === input.reasonCode)
    if (!reason) return { error: 'A restoration reason is required.' }
  }
  if (action === 'request_review' && internalNote.length < 5) {
    return { error: 'Add an internal note telling the moderation team what to look at.' }
  }
  if (clientExplanation && internalNote && clientExplanation === internalNote) {
    return { error: 'The client-facing explanation and the internal note must be different — internal notes are never shown to clients.' }
  }

  const newStatus = { keep_published: 'published', hide: 'hidden', remove: 'removed', restore: 'published', request_review: currentStatus }[action]
  const moderation = {
    action,
    target,
    reasonCode: reason?.code || null,
    reasonLabel: reason?.label || null,
    clientExplanation: clientExplanation || null,
    decidedBy: actor.id || null,
    decidedByName: actor.name || 'Admin',
    decidedAt: now,
    previousStatus: currentStatus,
  }

  const reviewPatch = { version: (review.version || 0) + 1, updatedAt: now }
  if (target === 'response') {
    reviewPatch.providerResponse = { ...review.providerResponse, status: newStatus, moderation }
  } else {
    reviewPatch.status = newStatus
    reviewPatch.moderation = moderation
    if (newStatus === 'published' && !review.publishedAt) reviewPatch.publishedAt = now
  }

  const reportOutcome = { keep_published: 'resolved_kept', hide: 'resolved_actioned', remove: 'resolved_actioned', request_review: 'escalated' }[action]
  const reportUpdates = reportOutcome
    ? relevantOpen.map((r) => ({
        id: r.docId || r.id,
        patch: reportOutcome === 'escalated'
          ? { status: 'escalated', assignedTo: 'Moderation Team', updatedAt: now }
          : { status: 'resolved', outcome: reportOutcome, resolvedAt: now, resolvedBy: actor.id || null },
      }))
    : []

  const label = target === 'response' ? ACTION_LABEL[action].replace('Review', 'Provider response') : ACTION_LABEL[action]
  const events = [{ type: action, target, label, at: now, actorId: actor.id || null, actorName: actor.name || 'Admin', detail: reason?.label || null, internalNote: internalNote || null }]
  if (action === 'request_review') {
    events.push({ type: 'assigned', target, label: 'Assigned to Moderation Team', at: now + 1, actorName: actor.name || 'Admin' })
  }

  const notifications = []
  if ((action === 'hide' || action === 'remove') && target === 'review' && review.clientId) {
    notifications.push({
      recipientId: review.clientId,
      recipientType: 'client',
      type: 'review_moderated',
      title: 'Update on your review',
      body: clientExplanation || `Your review was ${newStatus} because it did not meet our review guidelines (${reason.label}).`,
    })
  }
  if ((action === 'hide' || action === 'remove') && target === 'response' && review.providerId) {
    notifications.push({
      recipientId: review.providerId,
      recipientType: 'provider',
      type: 'review_response_moderated',
      title: 'Your review response was moderated',
      body: clientExplanation || `Your response was ${newStatus} (${reason.label}).`,
    })
  }
  if (reportOutcome && reportOutcome !== 'escalated') {
    for (const rep of relevantOpen) {
      if (rep.reportedByType === 'system') continue
      notifications.push({
        recipientId: rep.reportedById || null,
        recipientType: rep.reportedByType,
        type: 'review_report_resolved',
        title: 'Your report has been reviewed',
        body: 'Thank you for your report. Our team reviewed it against the Lé Inspa review guidelines.',
        reportId: rep.id,
      })
    }
  }

  return {
    newStatus,
    reviewPatch,
    reportUpdates,
    events,
    notifications: notifications.filter((n) => n.recipientId),
    audit: { action: `REVIEW_${action.toUpperCase()}`, target, previousStatus: currentStatus, newStatus, reasonCode: reason?.code || null, reportsAffected: reportUpdates.length },
    message: label,
  }
}

// Booking normalization re-export so callers need one import.
export { normalizeBooking }
