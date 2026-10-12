// ADM-027 — Provider Quality & Risk Review. Pure aggregation over EXISTING
// records (bookings, provider_reviews, review_reports, safety_reports,
// disputes, provider_credentials, content_moderation, account_restrictions,
// account_actions, withdrawal_requests). Only Admin assessments are stored by
// this screen (`provider_risk_assessments`), never copies of the sources.
//
//   • A risk signal is not proof; a complaint is not a confirmed violation.
//   • The quality score exists only when a documented model is configured, and
//     every score ships with its per-component explanation.
//   • Subscription / Premium Visibility are deliberately NOT inputs: paying for
//     visibility can never improve a safety assessment.
//   • This screen investigates; enforcement lives in ADM-028.

import { DAY, caseLink, clean, lower, pct, round1, toMillis } from './providerAdminShared.js'

export const DEFAULT_QUALITY_MODEL = {
  version: '2026.1',
  enabled: true,
  minBookings: 10,
  components: [
    { key: 'rating', label: 'Client Rating', weight: 30, how: 'Average published rating mapped from 1–5 to 0–100%' },
    { key: 'completion', label: 'Completion Rate', weight: 25, how: 'Completed ÷ (completed + cancelled) bookings' },
    { key: 'cancellation', label: 'Booking Cancellation Rate', weight: 15, how: 'Full marks at 0%, zero at or above 10%' },
    { key: 'repeat', label: 'Repeat Client Rate', weight: 10, how: 'Full marks at 50% or more repeat clients' },
    { key: 'dispute', label: 'Dispute Rate', weight: 10, how: 'Full marks at 0%, zero at or above 5%' },
    { key: 'reliability', label: 'Response / Reliability', weight: 10, how: 'On-time responses, else bookings without provider cancellation or no-show' },
  ],
}

export const DEFAULT_RISK_RULES = {
  mediumOpenCaseThreshold: 2, // open standard cases before Medium; any serious open case → Medium
  highConfirmedViolations: 2, // confirmed violations within the window → High
  confirmedWindowDays: 180,
  credentialExpiryWarningDays: 30,
  cancellationSpikeMultiplier: 2,
  cancellationSpikeMinimum: 3,
  reportedReviewAlertThreshold: 3,
}

export const ASSESSMENT_LEVELS = [
  { code: 'low', label: 'Low Risk' },
  { code: 'medium', label: 'Medium Risk' },
  { code: 'high', label: 'High Risk' },
]

const SERIOUS = ['high', 'serious', 'critical']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MIN_BUCKET = 3

export function normalizeCredential(id, c = {}) {
  return {
    id: c.credentialId || id,
    name: c.name || c.title || c.type || 'Credential',
    status: lower(c.status || 'approved'),
    expiresAt: toMillis(c.expiresAt || c.expiryDate),
    renewedAt: toMillis(c.renewedAt || c.approvedAt),
  }
}

export function normalizeAssessment(id, a = {}) {
  const level = lower(a.level || 'low')
  return {
    id,
    level,
    levelLabel: ASSESSMENT_LEVELS.find((l) => l.code === level)?.label || level,
    reason: a.reason || null,
    note: a.note || null,
    relatedCases: Array.isArray(a.relatedCases) ? a.relatedCases : [],
    reviewedByName: a.reviewedByName || null,
    reviewedByRole: a.reviewedByRole || null,
    reviewedAt: toMillis(a.reviewedAt || a.createdAt),
    previousLevel: a.previousLevel || null,
    nextReviewAt: toMillis(a.nextReviewAt),
  }
}

function rateStatus(value, bands) {
  for (const [limit, status, label] of bands) if (bands.inverse ? value <= limit : value >= limit) return { status, label }
  return { status: 'concern', label: 'Needs attention' }
}
const higher = (bands) => bands
const lowerIsBetter = (bands) => Object.assign(bands, { inverse: true })

export function bookingStats(bookings = [], now = Date.now()) {
  const completed = bookings.filter((b) => b.status === 'completed')
  const cancelled = bookings.filter((b) => b.status === 'cancelled')
  const providerCancels = cancelled.filter((b) => b.cancelledBy === 'provider')
  const late = providerCancels.filter((b) => b.startAt && b.cancelledAt && b.startAt - b.cancelledAt < DAY)
  const noShows = bookings.filter((b) => b.noShow)
  const finished = completed.length + cancelled.length
  const perClient = new Map()
  for (const b of completed) if (b.clientId) perClient.set(b.clientId, (perClient.get(b.clientId) || 0) + 1)
  const repeat = [...perClient.values()].filter((n) => n > 1).length
  const responseKnown = bookings.filter((b) => b.respondedOnTime !== null)
  const reliability = responseKnown.length >= 10
    ? pct(responseKnown.filter((b) => b.respondedOnTime).length, responseKnown.length)
    : bookings.length ? round1(100 - pct(providerCancels.length + noShows.length, bookings.length)) : null

  // Cancellation spike: last 30 days vs the previous 90.
  const recent = bookings.filter((b) => b.startAt && b.startAt >= now - 30 * DAY && b.startAt <= now)
  const baseline = bookings.filter((b) => b.startAt && b.startAt < now - 30 * DAY && b.startAt >= now - 120 * DAY)
  const recentCancel = recent.filter((b) => b.status === 'cancelled' && b.cancelledBy === 'provider').length
  const baseRate = baseline.length ? baseline.filter((b) => b.status === 'cancelled' && b.cancelledBy === 'provider').length / baseline.length : 0
  const recentRate = recent.length ? recentCancel / recent.length : 0

  return {
    total: bookings.length,
    completed: completed.length,
    providerCancellations: providerCancels.length,
    lateCancellations: late.length,
    noShows: noShows.length,
    reschedules: bookings.reduce((s, b) => s + (b.rescheduleCount || 0), 0),
    conflicts: bookings.filter((b) => b.conflict).length,
    completionRate: finished ? pct(completed.length, finished) : null,
    cancellationRate: finished ? pct(cancelled.length, finished) : null,
    repeatRate: perClient.size ? pct(repeat, perClient.size) : null,
    disputeRate: bookings.length ? pct(bookings.filter((b) => b.disputed).length, bookings.length) : null,
    refundRate: bookings.length ? pct(bookings.filter((b) => b.refunded).length, bookings.length) : null,
    refundCases: bookings.filter((b) => b.refunded || b.refundPending).length,
    reliability,
    spike: { recentCancel, recentRate, baseRate },
  }
}

// Score only from a documented, enabled model; each component is explained.
export function qualityScore({ stats, avgRating, model = DEFAULT_QUALITY_MODEL }) {
  if (!model?.enabled) return { available: false, reason: 'No documented quality model is configured for this market.' }
  if (stats.total < model.minBookings) return { available: false, reason: `Not enough data — needs at least ${model.minBookings} bookings.` }
  const norm = {
    rating: avgRating === null ? null : Math.max(0, (avgRating - 1) / 4),
    completion: stats.completionRate === null ? null : stats.completionRate / 100,
    cancellation: stats.cancellationRate === null ? null : Math.max(0, 1 - stats.cancellationRate / 10),
    repeat: stats.repeatRate === null ? null : Math.min(1, stats.repeatRate / 50),
    dispute: stats.disputeRate === null ? null : Math.max(0, 1 - stats.disputeRate / 5),
    reliability: stats.reliability === null ? null : stats.reliability / 100,
  }
  let earned = 0
  let possible = 0
  const explanation = model.components.map((c) => {
    const n = norm[c.key]
    if (n === null || n === undefined) return { ...c, points: null, note: 'No data — excluded' }
    const points = round1(n * c.weight)
    earned += points
    possible += c.weight
    return { ...c, points }
  })
  if (!possible) return { available: false, reason: 'Not enough data to score.' }
  const score = Math.round((earned / possible) * 100)
  const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Fair' : 'Needs Attention'
  return { available: true, score, max: 100, label, modelVersion: model.version, explanation }
}

function trendSeries(bookings, reviews, period, now) {
  const spec = period === '90d' ? { n: 6, size: 15 * DAY } : period === '12m' ? { n: 12, size: 30.4 * DAY } : { n: 5, size: 6 * DAY }
  const start = now - spec.n * spec.size
  const points = []
  for (let i = 0; i < spec.n; i += 1) {
    const from = start + i * spec.size
    const to = from + spec.size
    const b = bookings.filter((x) => x.startAt >= from && x.startAt < to && (x.status === 'completed' || x.status === 'cancelled'))
    const r = reviews.filter((x) => x.status === 'published' && x.submittedAt >= from && x.submittedAt < to)
    const completed = b.filter((x) => x.status === 'completed').length
    const avg = r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : null
    const end = new Date(to - 1)
    points.push({
      label: period === '12m' ? MONTHS[end.getUTCMonth()] : `${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]}`,
      // Buckets with too few records are left empty rather than over-reacting to one review.
      rating: avg === null || r.length < MIN_BUCKET ? null : round1(avg),
      ratingPct: avg === null || r.length < MIN_BUCKET ? null : Math.round((avg / 5) * 100),
      completionRate: b.length >= MIN_BUCKET ? pct(completed, b.length) : null,
      cancellationRate: b.length >= MIN_BUCKET ? pct(b.length - completed, b.length) : null,
      bookings: b.length,
    })
  }
  // Direction compares the first and last halves per metric, ignoring empty buckets.
  const half = Math.ceil(points.length / 2)
  const avgOf = (arr, k) => {
    const vals = arr.map((p) => p[k]).filter((v) => v !== null)
    return vals.length ? vals.reduce((a, v) => a + v, 0) / vals.length : null
  }
  let delta = 0
  let compared = 0
  for (const [k, sign] of [['completionRate', 1], ['ratingPct', 1], ['cancellationRate', -1]]) {
    const a = avgOf(points.slice(0, half), k)
    const b = avgOf(points.slice(-half), k)
    if (a !== null && b !== null) { delta += sign * (b - a); compared += 1 }
  }
  const direction = compared === 0 ? 'insufficient_data' : delta > 4 ? 'improving' : delta < -4 ? 'declining' : 'stable'
  return { period, points, direction }
}

export function riskLevel({ cases, stats, credentials, provider, restrictions, financialAlert, reviewAlert, securityAlert, rules = DEFAULT_RISK_RULES, now }) {
  const reasons = []
  const open = cases.filter((c) => c.open)
  const confirmedRecent = cases.filter((c) => c.confirmed && (c.resolvedAt || c.createdAt || 0) >= now - rules.confirmedWindowDays * DAY)
  const seriousOpen = open.filter((c) => SERIOUS.includes(c.severity))
  const seriousConfirmed = confirmedRecent.filter((c) => SERIOUS.includes(c.severity))
  if (seriousConfirmed.length) reasons.push({ level: 'high', text: `${seriousConfirmed.length} confirmed serious violation(s) in ${rules.confirmedWindowDays} days` })
  if (confirmedRecent.length >= rules.highConfirmedViolations) reasons.push({ level: 'high', text: `${confirmedRecent.length} confirmed violations in ${rules.confirmedWindowDays} days` })
  if (seriousOpen.length) reasons.push({ level: 'medium', text: `${seriousOpen.length} serious case(s) under investigation` })
  if (open.length >= rules.mediumOpenCaseThreshold) reasons.push({ level: 'medium', text: `${open.length} open cases` })
  if (credentials.some((c) => c.expiresAt && c.expiresAt < now)) reasons.push({ level: 'medium', text: 'Expired professional credential' })
  if (!provider.verified) reasons.push({ level: 'medium', text: 'Verification incomplete' })
  if (stats.spike.recentCancel >= rules.cancellationSpikeMinimum && stats.spike.recentRate > Math.max(stats.spike.baseRate * rules.cancellationSpikeMultiplier, 0.05)) {
    reasons.push({ level: 'medium', text: 'Provider cancellation spike in the last 30 days' })
  }
  if (financialAlert) reasons.push({ level: 'medium', text: 'Financial activity requires review' })
  if (reviewAlert) reasons.push({ level: 'medium', text: 'Review integrity alert' })
  if (securityAlert) reasons.push({ level: 'medium', text: 'Account security alert' })
  if (restrictions.some((r) => r.status === 'active' && r.kind === 'full_access')) reasons.push({ level: 'medium', text: 'Full-access restriction in force' })

  const level = reasons.some((r) => r.level === 'high') ? 'high' : reasons.some((r) => r.level === 'medium') ? 'medium' : 'low'
  const summary = { low: 'No significant current risk', medium: 'One or more signals require investigation', high: 'Serious or repeated verified issues — urgent authorized review' }[level]
  return { level, label: { low: 'Low', medium: 'Medium', high: 'High' }[level], summary, reasons }
}

export function buildRiskView({
  provider,
  bookings = [],
  reviews = [],
  reports = [],
  cases = [],
  restrictions = [],
  credentials = [],
  contentItems = [],
  withdrawals = [],
  actions = [],
  assessments = [],
  securityAlerts = [],
  model = DEFAULT_QUALITY_MODEL,
  rules = DEFAULT_RISK_RULES,
  permissions = {},
  period = '30d',
  now = Date.now(),
}) {
  const stats = bookingStats(bookings, now)
  const published = reviews.filter((r) => r.status === 'published')
  const avgRating = published.length ? round1(published.reduce((s, r) => s + r.rating, 0) / published.length) : null
  const openReports = reports.filter((r) => ['open', 'under_review', 'escalated'].includes(r.status))
  const reportedReviews = new Set(openReports.map((r) => r.reviewId)).size
  const activeRestrictions = restrictions.filter((r) => r.status === 'active' && (!r.expiresAt || r.expiresAt > now))
  const openCases = cases.filter((c) => c.open)
  const complaints = cases.filter((c) => c.kind === 'safety')
  const disputes = cases.filter((c) => c.kind === 'dispute')
  const finance = Boolean(permissions.viewFinance)

  const expiring = credentials.filter((c) => c.expiresAt && c.expiresAt >= now && c.expiresAt - now <= rules.credentialExpiryWarningDays * DAY)
  const expired = credentials.filter((c) => c.expiresAt && c.expiresAt < now)
  const contentIssues = contentItems.filter((c) => ['rejected', 'changes_requested', 'escalated'].includes(lower(c.status)))

  // Financial signals (computed only for Finance-permitted admins).
  const recentWithdrawals = withdrawals.filter((w) => toMillis(w.createdAt) >= now - 7 * DAY)
  const avgWithdrawal = withdrawals.length ? withdrawals.reduce((s, w) => s + (Number(w.amount) || 0), 0) / withdrawals.length : 0
  const unusual = recentWithdrawals.length > 3 || recentWithdrawals.some((w) => avgWithdrawal && Number(w.amount) > avgWithdrawal * 3)
  const financialAlert = unusual ? 'Withdrawal pattern requires review.' : null
  const reviewAlert = reportedReviews >= rules.reportedReviewAlertThreshold && reportedReviews / Math.max(1, reviews.length) > 0.05
  const securityAlert = securityAlerts.find((s) => !s.resolved) || null

  const risk = riskLevel({ cases, stats, credentials, provider, restrictions: activeRestrictions, financialAlert: finance ? financialAlert : unusual, reviewAlert, securityAlert, rules, now })
  const score = qualityScore({ stats, avgRating, model })

  const signal = (key, label, value, display, bands, detail = null) => {
    const band = value === null || value === undefined ? { status: 'nodata', label: 'No data' } : rateStatus(value, bands)
    return { key, label, value, display: value === null || value === undefined ? '—' : display, detail, status: band.status, statusLabel: band.label }
  }
  const qualitySignals = [
    signal('rating', 'Client Rating', avgRating, `${avgRating} / 5`, higher([[4.5, 'strong', 'Strong'], [4.0, 'healthy', 'Healthy'], [3.5, 'watch', 'Watch']]), `${published.length} reviews`),
    signal('completion', 'Completion Rate', stats.completionRate, `${Math.round(stats.completionRate)}%`, higher([[95, 'strong', 'Strong'], [90, 'healthy', 'Healthy'], [80, 'watch', 'Watch']])),
    signal('cancellation', 'Booking Cancellation Rate', stats.cancellationRate, `${stats.cancellationRate}%`, lowerIsBetter([[3, 'healthy', 'Healthy'], [6, 'watch', 'Watch']])),
    signal('repeat', 'Repeat Client Rate', stats.repeatRate, `${Math.round(stats.repeatRate)}%`, higher([[30, 'strong', 'Strong'], [15, 'healthy', 'Healthy'], [0, 'watch', 'Watch']])),
    signal('dispute', 'Dispute Rate', stats.disputeRate, `${stats.disputeRate}%`, lowerIsBetter([[1, 'strong', 'Low'], [3, 'watch', 'Watch']])),
    signal('reliability', 'Response / Reliability', stats.reliability, `${Math.round(stats.reliability)}%`, higher([[95, 'strong', 'Strong'], [90, 'healthy', 'Healthy'], [80, 'watch', 'Watch']])),
  ]

  const sig = (key, label, state, text) => ({ key, label, state, text })
  const openComplaints = complaints.filter((c) => c.open)
  const riskSignals = [
    sig('identity', 'Identity & Verification', provider.verified ? 'ok' : 'warn', provider.verified ? 'No current issue' : `Verification ${provider.verificationStatus}`),
    sig('credentials', 'Professional Credentials', expired.length ? 'alert' : expiring.length ? 'warn' : 'ok', expired.length ? 'Credential expired' : expiring.length ? 'Credential expiring soon' : 'Verified'),
    finance
      ? sig('payments', 'Payment Activity', financialAlert ? 'warn' : 'ok', financialAlert ? 'Unusual activity' : 'No current alert')
      : sig('payments', 'Payment Activity', 'locked', 'Finance permission required'),
    sig('booking', 'Booking Behaviour', risk.reasons.some((r) => r.text.includes('spike')) ? 'warn' : 'ok', risk.reasons.some((r) => r.text.includes('spike')) ? 'Cancellation spike' : 'Normal'),
    sig('complaints', 'Client Complaints', openComplaints.length ? 'warn' : 'ok', openComplaints.length ? `${openComplaints.length} open complaint${openComplaints.length === 1 ? '' : 's'}` : 'No open complaints'),
    sig('reviews', 'Review Integrity', reviewAlert ? 'warn' : 'ok', reviewAlert ? `${reportedReviews} reported reviews` : 'No significant alert'),
    sig('security', 'Account Security', securityAlert ? 'warn' : 'ok', securityAlert ? securityAlert.label || 'Security alert' : 'No current alert'),
    sig('content', 'Content Compliance', contentIssues.length ? 'warn' : 'ok', contentIssues.length ? `${contentIssues.length} item(s) need changes` : 'Approved'),
  ]

  const needsReview = [
    ...openCases.map((c) => ({ id: c.id, kind: c.kind, title: c.kind === 'dispute' ? 'Booking Dispute' : 'Client Complaint', caseId: c.id, submittedAt: c.createdAt, bookingId: c.bookingId, category: c.category, statusLabel: c.statusLabel || (c.status === 'open' ? 'Open' : 'Under Review'), severity: c.severity, link: caseLink(c) })),
    ...expiring.map((c) => ({ id: c.id, kind: 'credential', title: 'Credential Expiring', caseId: null, submittedAt: null, category: c.name, expiresAt: c.expiresAt, statusLabel: 'Expiring', link: `/verifications/credentials/${c.id}` })),
    ...(finance && financialAlert ? [{ id: 'fin-alert', kind: 'financial', title: 'Unusual Activity', category: financialAlert, statusLabel: 'Requires review', link: '/withdrawals' }] : []),
  ]

  const checklist = provider.verificationChecklist || {}
  const ok = (v, fallback = true) => (v === undefined ? fallback : ['approved', 'verified', 'current', 'clear'].includes(lower(v)))
  const compliance = {
    items: [
      { key: 'identity', label: 'Identity', ok: ok(checklist.identity, provider.verified), state: ok(checklist.identity, provider.verified) ? 'Verified' : 'Pending' },
      { key: 'credentials', label: 'Professional Credentials', ok: !expired.length && credentials.every((c) => c.status === 'approved' || c.status === 'verified'), state: expired.length ? 'Expired' : 'Approved' },
      { key: 'profile', label: 'Profile Information', ok: ok(checklist.profileInformation), state: ok(checklist.profileInformation) ? 'Approved' : 'Changes Required' },
      { key: 'photo', label: 'Profile Photo', ok: ok(checklist.profilePhoto), state: ok(checklist.profilePhoto) ? 'Approved' : 'Changes Required' },
      { key: 'documents', label: 'Required Documents', ok: !expired.length, state: expired.length ? 'Expired' : 'Current' },
      { key: 'content', label: 'Content Moderation', ok: !contentIssues.length, state: contentIssues.length ? 'Action needed' : 'Clear' },
    ],
    alerts: [...expired, ...expiring].map((c) => ({ id: c.id, title: c.expiresAt < now ? 'Credential Expired' : 'Credential Expiring', name: c.name, expiresAt: c.expiresAt, link: `/verifications/credentials/${c.id}` })),
  }

  const warnings = actions.filter((a) => a.action === 'warn')
  const safety = {
    openCases: complaints.filter((c) => c.open).length,
    closedCases: complaints.filter((c) => !c.open).length,
    confirmedViolations: cases.filter((c) => c.confirmed).length,
    warnings: warnings.length,
    activeRestrictions: activeRestrictions.length,
  }

  // Timeline keeps the signal AND its outcome.
  const sortedAssessments = assessments.map((a) => (a.levelLabel ? a : normalizeAssessment(a.id, a))).sort((a, b) => (b.reviewedAt || 0) - (a.reviewedAt || 0))
  const timeline = [
    ...cases.map((c) => ({ at: c.createdAt, label: `${c.kind === 'dispute' ? 'Dispute opened' : `${c.category} submitted`}`, caseId: c.id, tone: c.open ? 'amber' : c.confirmed ? 'red' : 'green', outcome: c.open ? 'Under Review' : c.confirmed ? 'Violation confirmed' : 'Closed — no violation', link: caseLink(c) })),
    ...credentials.filter((c) => c.renewedAt).map((c) => ({ at: c.renewedAt, label: `${c.name} renewed`, tone: 'green', outcome: 'Completed' })),
    ...sortedAssessments.map((a) => ({ at: a.reviewedAt, label: 'Quality review completed', tone: 'purple', outcome: a.reason || a.levelLabel })),
    ...actions.filter((a) => ['warn', 'suspend', 'restrict', 'reactivate'].includes(a.action)).map((a) => ({ at: a.at, label: a.label, tone: a.action === 'reactivate' ? 'green' : 'amber', outcome: a.reasonLabel })),
    ...(Array.isArray(provider.riskEvents) ? provider.riskEvents : []),
  ]
    .filter((e) => e.at)
    .sort((a, b) => b.at - a.at)
    .slice(0, 20)

  const current = sortedAssessments[0] || null
  const topCase = needsReview.find((n) => n.caseId)
  const recommended = topCase
    ? { title: `Review ${topCase.title}`, text: `${openCases.length} unresolved case${openCases.length === 1 ? '' : 's'} require${openCases.length === 1 ? 's' : ''} assessment.`, link: topCase.link, label: 'Review Case' }
    : needsReview[0]
      ? { title: needsReview[0].title === 'Unusual Activity' ? 'Review Financial Activity' : 'Review Credential', text: needsReview[0].category, link: needsReview[0].link, label: 'Open' }
      : { title: 'No Action Required', text: 'No unresolved signals need review right now.', link: null, label: null }

  return {
    provider,
    kpis: {
      quality: score,
      risk,
      openIssues: { count: needsReview.length, label: needsReview.length ? 'Requires review' : 'Nothing open' },
      restrictions: { count: activeRestrictions.length, label: activeRestrictions.length ? `${activeRestrictions.length} active` : 'None' },
    },
    qualitySignals,
    riskSignals,
    needsReview,
    trend: trendSeries(bookings, reviews, period, now),
    reliability: {
      completed: stats.completed,
      providerCancellations: stats.providerCancellations,
      noShows: stats.noShows,
      lateCancellations: stats.lateCancellations,
      reschedules: stats.reschedules,
      conflicts: stats.conflicts,
    },
    experience: {
      averageRating: avgRating,
      totalReviews: reviews.length,
      reportedReviews,
      complaints: complaints.length,
      disputes: disputes.length,
      refundCases: stats.refundCases,
    },
    compliance,
    financial: finance
      ? {
          paymentDisputes: disputes.filter((d) => d.type === 'payment').length,
          refundRate: stats.refundRate,
          failedPayouts: withdrawals.filter((w) => lower(w.status) === 'failed').length,
          withdrawalReviews: withdrawals.filter((w) => ['under_review', 'held'].includes(lower(w.status))).length,
          unusualAlert: financialAlert,
        }
      : null,
    safety,
    timeline,
    assessment: current,
    assessmentHistory: sortedAssessments.slice(0, 10),
    recommended,
    dynamic: dynamicMetrics(provider, bookings, cases),
    levels: ASSESSMENT_LEVELS,
    model: score.available ? { version: model.version, components: model.components } : null,
    permissions: {
      canAssess: Boolean(permissions.assessRisk),
      canInvestigate: Boolean(permissions.assessRisk) && openCases.length > 0,
      financeLocked: !finance,
      canAccountActions: Boolean(permissions.accountActions),
    },
    openCases: openCases.map((c) => ({ id: c.id, category: c.category, kind: c.kind })),
  }
}

// Spa → per-branch, Hotel → per-wellness-location. A problem in one unit is
// shown in that unit; it does not re-classify the whole business.
function dynamicMetrics(provider, bookings, cases) {
  if (provider.category === 'individual') return null
  const keyOf = (b) => (provider.category === 'spa' ? b.branchName : b.locationName) || 'Unassigned'
  const groups = new Map()
  for (const b of bookings) {
    const k = keyOf(b)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(b)
  }
  const units = [...groups.entries()].map(([name, list]) => {
    const s = bookingStats(list)
    return { name, bookings: list.length, completionRate: s.completionRate, cancellationRate: s.cancellationRate, providerCancellations: s.providerCancellations, conflicts: s.conflicts }
  }).sort((a, b) => b.bookings - a.bookings)
  const base = {
    category: provider.category,
    unitLabel: provider.category === 'spa' ? 'Branch' : 'Wellness Location',
    units,
    staffComplaints: cases.filter((c) => lower(c.category).includes('staff') || lower(c.category).includes('conduct')).length,
  }
  if (provider.category === 'spa') {
    return {
      ...base,
      unassignedBookingRate: bookings.length ? pct(bookings.filter((b) => b.unassigned).length, bookings.length) : 0,
      resourceConflicts: bookings.filter((b) => b.conflict).length,
    }
  }
  const byType = (t) => bookings.filter((b) => lower(b.experienceType) === t && (b.status === 'cancelled' || b.disputed || b.conflict)).length
  return {
    ...base,
    inRoomIssues: byType('in_room'),
    conciergeIssues: byType('concierge'),
    packageIssues: byType('package'),
  }
}

/**
 * Validates an Admin assessment update. Previous assessments are preserved:
 * the result is a NEW record that references the previous level.
 */
export function planRiskAssessment({ input = {}, previous = null, cases = [], snapshot = {}, actor = {}, now = Date.now() }) {
  const level = ASSESSMENT_LEVELS.find((l) => l.code === input.level)
  if (!level) return { error: 'Select an assessment level.' }
  const reason = clean(input.reason, 500)
  if (reason.length < 10) return { error: 'An internal reason (at least 10 characters) is required for every assessment.' }
  const known = new Set(cases.map((c) => c.id))
  const relatedCases = [...new Set(Array.isArray(input.relatedCases) ? input.relatedCases : [])]
  const unknown = relatedCases.filter((id) => !known.has(id))
  if (unknown.length) return { error: `Unknown related case(s): ${unknown.join(', ')}` }
  const nextReviewDays = Number(input.nextReviewDays) || 30
  const record = {
    type: 'admin_assessment',
    level: level.code,
    reason,
    note: clean(input.note, 2000) || null,
    relatedCases,
    previousLevel: previous?.level || null,
    previousAssessmentId: previous?.id || null,
    reviewedById: actor.id || null,
    reviewedByName: actor.name || 'Admin',
    reviewedByRole: actor.role || null,
    reviewedAt: now,
    nextReviewAt: now + Math.min(180, Math.max(1, nextReviewDays)) * DAY,
    snapshot,
  }
  return {
    record,
    audit: { action: 'PROVIDER_RISK_ASSESSMENT_UPDATED', level: level.code, previousLevel: previous?.level || null, relatedCases },
    message: `Assessment recorded: ${level.label}`,
  }
}
