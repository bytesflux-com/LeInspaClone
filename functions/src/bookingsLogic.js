// ADM-044 → ADM-048 — Booking Operations: pure logic, no Firestore.
//
// Every screen is a view over the shared `bookings` collection. Nothing here
// writes a booking or stores a derived state: "active", "upcoming", "ongoing",
// "running late", "awaiting completion" and "readiness" are recomputed from the
// stored lifecycle fields every time. Booking status, payment status,
// assignment status, operational state and settlement status stay separate.

export const MINUTE = 60 * 1000
export const DAY = 24 * 60 * MINUTE

// Operational thresholds (minutes). Kept here so the backend and the demo data
// agree; move to platform settings when ops wants to tune them.
export const THRESHOLDS = {
  startingSoon: 60, // ADM-045 "Starting Soon" window
  startingNext: 30, // ADM-044 "Starting in Next 30 Minutes"
  lateGrace: 10, // past start with no start/check-in evidence
  overtimeTolerance: 10, // past actual start + duration
  approachingEnd: 15, // ADM-047 "Approaching End"
  noShowWindow: 120, // ADM-049: provider cancelling this close to start counts as a no-show risk
  repeatedProviderCancellations: 3, // ADM-049: provider-initiated cancellations in scope
  defaultDuration: 60,
}

export const MARKET_META = {
  KE: { name: 'Kenya', currency: 'KES' },
  UG: { name: 'Uganda', currency: 'UGX' },
  TZ: { name: 'Tanzania', currency: 'TZS' },
  RW: { name: 'Rwanda', currency: 'RWF' },
  ZA: { name: 'South Africa', currency: 'ZAR' },
}
export const MARKET_CODES = Object.keys(MARKET_META)

// Stored booking statuses (mobile app lifecycle) plus tolerated aliases.
export const BOOKING_STATUSES = [
  'pending',
  'negotiation',
  'accepted',
  'confirmed',
  'on_the_way',
  'arrived',
  'service_in_progress',
  'awaiting_client_confirmation',
  'completed',
  'cancelled',
  'rejected',
  'expired',
]
const STATUS_ALIASES = {
  in_progress: 'service_in_progress',
  ongoing: 'service_in_progress',
  started: 'service_in_progress',
  awaiting_confirmation: 'awaiting_client_confirmation',
  canceled: 'cancelled',
  declined: 'rejected',
}
const PRE_SERVICE = new Set(['pending', 'negotiation', 'accepted', 'confirmed', 'on_the_way', 'arrived'])
const CONFIRMED_OR_LATER = new Set(['accepted', 'confirmed', 'on_the_way', 'arrived', 'service_in_progress', 'awaiting_client_confirmation', 'completed'])
const TERMINAL = new Set(['completed', 'cancelled', 'rejected', 'expired'])
// Statuses that can still be operationally live — the "live set" query.
export const LIVE_STATUSES = [...PRE_SERVICE, 'service_in_progress', 'awaiting_client_confirmation']

// Provider types used by the mobile app, grouped into the three booking families.
export const PROVIDER_TYPE_LABELS = {
  massage_therapist: 'Massage Therapist',
  fitness_trainer: 'Fitness Trainer',
  physiotherapist: 'Physiotherapist',
  meditation_specialist: 'Meditation Specialist',
  yoga_specialist: 'Yoga Specialist',
  spa: 'Spa & Wellness Center',
  hotel_resort: 'Hotel & Wellness Resort',
}
export const CATEGORY_LABELS = {
  individual: 'Individual Professionals',
  spa: 'Spa & Wellness Centers',
  hotel: 'Hotels & Wellness Resorts',
}
export function providerCategory(providerType) {
  const t = String(providerType || '').toLowerCase()
  if (t === 'spa' || t.includes('spa') || t.includes('wellness_center')) return 'spa'
  if (t.includes('hotel') || t.includes('resort')) return 'hotel'
  return 'individual'
}

export const SOURCE_LABELS = {
  app: 'Lé Inspa App',
  shared_link: 'Shared Link',
  qr_code: 'QR Code',
  website: 'Website',
  walk_in: 'Walk-In',
  manual: 'Manual',
  phone: 'Phone',
  guest: 'Guest Booking',
}
function normalizeSource(value) {
  const s = String(value || 'app').toLowerCase().replace(/[\s-]+/g, '_')
  if (s === 'walkin') return 'walk_in'
  if (s === 'qr') return 'qr_code'
  if (s === 'link' || s === 'sharedlink') return 'shared_link'
  if (s === 'online' || s === 'mobile' || s === 'mobile_app') return 'app'
  return SOURCE_LABELS[s] ? s : 'app'
}

// Payment state is read from the server-written field only; the frontend's
// view of a checkout is never treated as final.
function normalizePayment(value) {
  const s = String(value || '').toLowerCase()
  if (['paid', 'succeeded', 'success', 'captured', 'completed', 'confirmed'].includes(s)) return 'paid'
  if (['failed', 'declined', 'error', 'cancelled'].includes(s)) return 'failed'
  if (['refunded', 'reversed'].includes(s)) return 'refunded'
  if (['refunding', 'refund_pending', 'refund_requested', 'partially_refunded'].includes(s)) return 'refunding'
  if (['disputed', 'chargeback'].includes(s)) return 'disputed'
  return 'pending'
}

// Escrow states from the additional-collections architecture.
function normalizeEscrow(value) {
  const s = String(value || '').toLowerCase()
  if (['funded', 'held', 'holding'].includes(s)) return 'held'
  if (['released', 'settled', 'paid_out'].includes(s)) return 'released'
  if (s === 'refunded') return 'refunded'
  if (s === 'disputed') return 'disputed'
  return s ? 'pending' : null
}

function normalizeAssignment(value) {
  const s = String(value || '').toLowerCase()
  if (['assigned', 'confirmed'].includes(s)) return 'assigned'
  if (['reassignment_needed', 'reassign', 'needs_reassignment'].includes(s)) return 'reassignment_needed'
  if (['conflict', 'assignment_conflict'].includes(s)) return 'conflict'
  if (['unassigned', 'pending', 'open'].includes(s)) return 'unassigned'
  return null
}

// Who triggered a lifecycle event: client / provider / admin / system.
function normalizeActor(value) {
  const s = String(value || '').toLowerCase()
  if (!s) return null
  if (['client', 'customer', 'user', 'guest'].some((k) => s.includes(k))) return 'client'
  if (['provider', 'business', 'spa', 'hotel', 'staff', 'specialist', 'professional'].some((k) => s.includes(k))) return 'provider'
  if (s.includes('admin') || s.includes('support')) return 'admin'
  if (['system', 'auto', 'workflow', 'timeout'].some((k) => s.includes(k))) return 'system'
  return null
}

// booking_cancellations refund states: Pending / Refunded / No Refund.
function normalizeRefund(value) {
  const s = String(value || '').toLowerCase().replace(/[\s-]+/g, '_')
  if (!s) return null
  if (['refunded', 'completed', 'processed', 'paid'].includes(s)) return 'refunded'
  if (['no_refund', 'none', 'not_eligible', 'ineligible', 'declined'].includes(s)) return 'no_refund'
  if (s === 'failed') return 'failed'
  return 'pending'
}

// Guest → client account-link state (ADM-050). Not a booking status.
function normalizeAccount(d, linkedClientId) {
  const s = String(d.accountLinkStatus ?? d.guestAccountStatus ?? '').toLowerCase().replace(/[\s-]+/g, '_')
  if (['conflict', 'link_conflict', 'duplicate'].includes(s) || d.duplicateAccountMatch) return 'link_conflict'
  if (['pending', 'link_pending'].includes(s)) return 'link_pending'
  if (['linked', 'booking_linked'].includes(s)) return 'linked'
  if (String(d.customerType || '').toUpperCase() === 'REGISTERED_FROM_GUEST' && linkedClientId) return 'linked'
  if (['account_created', 'created', 'registered'].includes(s)) return 'account_created'
  if (['registration_started', 'started'].includes(s)) return 'registration_started'
  return 'not_registered'
}

export function maskPhone(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '')
  if (digits.length < 7) return phone ? '•••' : null
  // Calling codes for the Lé Inspa markets (+27 is two digits), else +XXX.
  const cc = digits.startsWith('+') ? ['+254', '+255', '+256', '+250', '+27'].find((c) => digits.startsWith(c)) || digits.slice(0, 4) : ''
  const rest = digits.slice(cc.length)
  return `${cc ? `${cc} ` : ''}${rest[0]}•• ••• ${rest.slice(-3)}`
}

export function maskEmail(email) {
  const [user, domain] = String(email || '').split('@')
  if (!domain) return email ? '•••' : null
  return `${user.slice(0, 2)}••••@${domain}`
}

// Firestore Timestamp, Date, ISO string, epoch ms or {seconds} → epoch ms.
export function toMillis(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value instanceof Date) return value.getTime()
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.toDate === 'function') return value.toDate().getTime()
  if (typeof value === 'object' && typeof value.seconds === 'number') return value.seconds * 1000
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? null : ms
}

const iso = (ms) => (ms == null ? null : new Date(ms).toISOString())
const str = (...values) => values.find((v) => typeof v === 'string' && v.trim())?.trim() || null
const list = (value) => (Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [])

function scheduledStartOf(d) {
  const direct = toMillis(d.scheduledAt ?? d.bookingDateTime ?? d.startTime ?? d.scheduledStart ?? d.appointmentTime)
  if (direct != null) return direct
  // Split date + "HH:mm" time as stored by some booking flows.
  const day = toMillis(d.bookingDate ?? d.date)
  if (day == null) return null
  const [h, m] = String(d.bookingTime ?? d.time ?? '').split(':').map(Number)
  return Number.isFinite(h) ? day + (h * 60 + (Number.isFinite(m) ? m : 0)) * MINUTE : day
}

// Raw Firestore booking → one consistent record. Unknown/missing optional
// fields fall back to null rather than guessed values.
export function normalizeBooking(id, d = {}) {
  const rawStatus = String(d.bookingStatus ?? d.status ?? 'pending').toLowerCase()
  const status = STATUS_ALIASES[rawStatus] || (BOOKING_STATUSES.includes(rawStatus) ? rawStatus : 'pending')
  const providerType = String(d.providerType ?? d.providerCategory ?? '').toLowerCase() || null
  const category = providerCategory(providerType)
  const start = scheduledStartOf(d)
  const durationMins = Number(d.durationMinutes ?? d.serviceDuration ?? d.duration ?? d.durationMins) || THRESHOLDS.defaultDuration
  const end = toMillis(d.scheduledEndAt ?? d.endTime ?? d.scheduledEnd) ?? (start != null ? start + durationMins * MINUTE : null)
  const countryCode = str(d.countryCode, d.marketId, d.market)?.toUpperCase() || null
  const meta = MARKET_META[countryCode]
  const serviceStartedAt = toMillis(d.serviceStartedAt ?? d.startedAt ?? d.checkInAt)
  const providerCompletedAt = toMillis(d.providerCompletedAt ?? d.serviceCompletedAt)
  const flags = new Set(list(d.issueFlags ?? d.issues).map((f) => String(f).toLowerCase()))
  const snap = d.guestSnapshot || {}
  const customerType = String(d.customerType || '').toUpperCase()
  const isGuest = customerType === 'GUEST' || customerType === 'REGISTERED_FROM_GUEST' || Boolean(d.isGuest || d.guestBooking || d.guestSnapshot) || ['guest', 'guest_checkout'].includes(String(d.bookingSource || '').toLowerCase())
  const clientId = str(d.clientId, d.customerId, d.userId)
  const policy = d.cancellationPolicySnapshot || null
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

  return {
    id,
    reference: str(d.bookingReference, d.bookingNumber, d.reference) || id,
    status,
    countryCode,
    marketName: meta?.name || countryCode || '—',
    currency: str(d.currency) || meta?.currency || null,
    amount: typeof d.totalPrice === 'number' ? d.totalPrice : typeof d.amount === 'number' ? d.amount : null,
    client: { id: clientId, name: str(d.customerName, d.clientName, snap.fullName, d.guestName) || 'Client', guest: isGuest },
    guest: isGuest
      ? {
          name: str(snap.fullName, d.guestName, d.customerName) || 'Guest',
          phone: str(snap.phone, d.guestPhone, d.customerPhone),
          email: str(snap.email, d.guestEmail, d.customerEmail),
          phoneVerified: Boolean(snap.phoneVerified ?? d.guestPhoneVerified),
          emailVerified: Boolean(snap.emailVerified ?? d.guestEmailVerified),
          countryCode: str(snap.countryCode, d.countryCode),
          account: normalizeAccount(d, clientId),
          linkedClientId: customerType === 'REGISTERED_FROM_GUEST' || str(d.accountLinkStatus) === 'linked' ? clientId : str(d.linkedClientId),
          linkedClientName: str(d.linkedClientName),
          linkedAt: toMillis(d.accountLinkedAt ?? d.linkedAt),
          conflictReason: str(d.accountLinkConflictReason, d.linkConflictReason),
          channels: list(d.notificationChannels ?? d.communicationChannels).map(String),
        }
      : null,
    provider: { id: str(d.providerId, d.businessId), name: str(d.providerName, d.businessName) || 'Provider', type: providerType, typeLabel: PROVIDER_TYPE_LABELS[providerType] || null, rating: num(d.providerRating), reviews: num(d.providerReviewCount) },
    category,
    service: { id: str(d.serviceId), name: str(d.serviceName, d.service) || 'Service' },
    scheduledStart: start,
    scheduledEnd: end,
    durationMins,
    location: {
      mode: str(d.serviceMode, d.locationType, d.serviceLocationType),
      label: str(d.locationName, d.serviceLocation, d.address?.label, typeof d.address === 'string' ? d.address : null),
      city: str(d.city, d.address?.city),
    },
    branch: str(d.branchName, d.branch),
    branchId: str(d.branchId),
    specialist: str(d.assignedStaffName, d.specialistName, d.assignedProfessionalName),
    specialists: list(d.assignedStaffNames ?? d.assignedProfessionals).map(String),
    resources: list(d.resourceNames ?? d.resources).map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean),
    source: normalizeSource(d.bookingSource ?? d.source),
    payment: normalizePayment(d.paymentStatus),
    escrow: normalizeEscrow(d.escrowStatus),
    payout: str(d.payoutStatus, d.settlementStatus),
    paymentMethod: str(d.paymentMethod, d.paymentProvider),
    transactionId: str(d.transactionId, d.paymentReference, d.paymentId),
    platformFee: num(d.platformFee),
    providerAmount: num(d.providerAmount ?? d.providerEarnings),
    fundsReleasedAt: toMillis(d.escrowReleasedAt ?? d.releasedAt ?? d.fundsReleasedAt),
    settledAt: toMillis(d.settledAt ?? d.payoutAt ?? d.payoutCompletedAt),
    assignmentRaw: normalizeAssignment(d.assignmentStatus),
    assignedId: str(d.assignedStaffId, d.specialistId),
    staffCheckInAt: toMillis(d.staffCheckInAt ?? d.checkInAt),
    createdAt: toMillis(d.createdAt),
    confirmedAt: toMillis(d.confirmedAt ?? d.acceptedAt),
    serviceStarted: Boolean(d.serviceStarted) || serviceStartedAt != null,
    serviceStartedAt,
    serviceStartedBy: str(d.serviceStartedBy, d.startedBy),
    providerCompleted: Boolean(d.serviceCompletedByProvider) || providerCompletedAt != null,
    providerCompletedAt,
    serviceConfirmed: Boolean(d.serviceConfirmed),
    serviceConfirmedAt: toMillis(d.serviceConfirmedAt),
    completedAt: toMillis(d.completedAt),
    completedBy: normalizeActor(d.completedBy ?? d.completionSource),
    cancelledAt: toMillis(d.cancelledAt),
    cancelledBy: normalizeActor(d.cancelledBy),
    cancellationId: str(d.cancellationId),
    cancellationReason: str(d.cancellationReason),
    cancellationReasonCode: str(d.cancellationReasonCode)?.toLowerCase() || null,
    cancellationRequestedAt: toMillis(d.cancellationRequestedAt),
    cancellationFee: num(d.cancellationFee),
    policy: policy && {
      name: str(policy.name, policy.policyName),
      window: str(policy.window, policy.cancellationWindow),
      clientFee: num(policy.clientFee),
      providerPenalty: str(policy.providerPenalty),
    },
    clientNotified: d.clientNotified ?? null,
    providerNotified: d.providerNotified ?? null,
    rescheduledAt: toMillis(d.rescheduledAt),
    refundStatus: normalizeRefund(d.refundStatus),
    refundAmount: num(d.refundAmount),
    refundRequestedAt: toMillis(d.refundRequestedAt),
    refundReason: str(d.refundReason),
    refundId: str(d.refundId),
    refundEligibility: str(d.refundEligibility)?.toLowerCase() || null,
    rating: typeof d.rating === 'number' ? d.rating : typeof d.reviewRating === 'number' ? d.reviewRating : null,
    reviewComment: str(d.reviewComment, d.reviewText),
    reviewStatus: str(d.reviewStatus)?.toLowerCase() || null,
    reviewId: str(d.reviewId),
    reviewed: Boolean(d.reviewId || d.hasReview || typeof d.rating === 'number' || typeof d.reviewRating === 'number'),
    flags: {
      conflict: Boolean(d.hasConflict || d.conflictType) || flags.has('conflict') || flags.has('booking_conflict'),
      conflictType: str(d.conflictType),
      resourceConflict: Boolean(d.resourceConflict) || flags.has('resource_conflict'),
      serviceProblem: Boolean(d.serviceIssueReported || d.serviceProblem) || flags.has('service_problem'),
      clientIssue: Boolean(d.clientReportedIssue) || flags.has('client_issue'),
      providerIssue: Boolean(d.providerReportedIssue) || flags.has('provider_issue'),
      safety: Boolean(d.safetyConcern) || flags.has('safety'),
      delayReported: Boolean(d.delayReported || d.providerRunningLate) || flags.has('delay'),
      providerUnavailable: Boolean(d.providerUnavailable) || flags.has('provider_unavailable'),
      clientActionRequired: Boolean(d.clientActionRequired) || flags.has('client_action_required'),
      disputed: Boolean(d.hasOpenDispute || (d.disputeId && d.disputeStatus !== 'resolved')) || flags.has('disputed'),
      assignmentChanged: Boolean(d.reassignedDuringService) || flags.has('assignment_changed'),
      supportOpen: Boolean(d.hasOpenSupportTicket || d.supportTicketId) || flags.has('support'),
      chargeback: Boolean(d.chargeback || d.hasChargeback) || flags.has('chargeback'),
      noShow: Boolean(d.providerNoShow) || flags.has('no_show'),
      reviewReported: Boolean(d.reviewReported) || flags.has('review_reported'),
    },
  }
}

// Assignment only applies to multi-staff businesses; an individual
// professional delivering the service personally needs no staff record.
export function assignmentOf(b) {
  if (b.category === 'individual') return 'not_required'
  if (b.assignmentRaw) return b.assignmentRaw
  return b.assignedId || b.specialist || b.specialists.length ? 'assigned' : 'unassigned'
}

// Derive operational state at `now`. Nothing is inferred from the clock alone:
// "ongoing" needs a start event, "completed" needs an explicit completion.
export function deriveOps(b, now) {
  const terminal = TERMINAL.has(b.status)
  const completed = b.status === 'completed'
  const cancelled = b.status === 'cancelled' || b.status === 'rejected' || b.status === 'expired'
  const awaitingCompletion = !terminal && (b.status === 'awaiting_client_confirmation' || b.providerCompleted)
  const started = b.serviceStarted || b.status === 'service_in_progress' || b.status === 'awaiting_client_confirmation' || completed
  const ongoing = !terminal && started && !awaitingCompletion
  const preService = !terminal && !started && PRE_SERVICE.has(b.status)
  const startMs = b.scheduledStart
  const minsToStart = startMs == null ? null : (startMs - now) / MINUTE
  const actualStart = b.serviceStartedAt ?? startMs
  const expectedEnd = actualStart == null ? b.scheduledEnd : actualStart + b.durationMins * MINUTE
  const minsToEnd = expectedEnd == null ? null : (expectedEnd - now) / MINUTE
  const assignment = assignmentOf(b)

  const enRoute = preService && (b.status === 'on_the_way' || b.status === 'arrived')
  // Late needs evidence beyond the clock: no start, no check-in (arrived), past grace.
  const runningLate = preService && b.status !== 'arrived' && minsToStart != null && minsToStart < -THRESHOLDS.lateGrace
  const lateSignal = runningLate || (preService && b.flags.delayReported)
  const startingSoon = preService && !lateSignal && (enRoute || (minsToStart != null && minsToStart >= -THRESHOLDS.lateGrace && minsToStart <= THRESHOLDS.startingSoon))
  const upcoming = preService && minsToStart != null && minsToStart > 0
  const overTime = ongoing && minsToEnd != null && minsToEnd < -THRESHOLDS.overtimeTolerance
  const approachingEnd = ongoing && !overTime && minsToEnd != null && minsToEnd <= THRESHOLDS.approachingEnd
  const paymentIssue = !cancelled && (b.payment === 'failed' || (b.payment === 'pending' && (ongoing || awaitingCompletion || completed || (minsToStart != null && minsToStart < 24 * 60))))
  const live = !terminal

  const issues = []
  if (live && (b.flags.conflict || assignment === 'conflict')) issues.push('conflict')
  if (live && b.flags.resourceConflict) issues.push('resource_conflict')
  if (live && (b.flags.serviceProblem || b.flags.safety)) issues.push('service_problem')
  if (paymentIssue) issues.push('payment_issue')
  if (live && (assignment === 'unassigned' || assignment === 'reassignment_needed')) issues.push('unassigned')
  if (b.flags.disputed || b.payment === 'disputed' || b.escrow === 'disputed') issues.push('disputed')
  if (live && b.flags.clientIssue) issues.push('client_issue')
  if (live && (b.flags.providerIssue || (preService && b.flags.delayReported))) issues.push('provider_issue')
  if (preService && b.flags.providerUnavailable) issues.push('provider_unavailable')
  if (preService && (b.flags.clientActionRequired || b.status === 'negotiation')) issues.push('client_action')
  if (live && b.flags.assignmentChanged) issues.push('assignment_changed')
  if (lateSignal) issues.push('running_late')
  if (overTime) issues.push('over_time')

  // ADM-045 / ADM-047 operational state, most serious first.
  let operational = null
  if (live) {
    if (issues.includes('conflict') || issues.includes('resource_conflict')) operational = 'conflict'
    else if (issues.includes('service_problem')) operational = 'service_problem'
    else if (lateSignal) operational = 'running_late'
    else if (overTime) operational = 'over_time'
    else if (awaitingCompletion) operational = 'awaiting_completion'
    else if (issues.length) operational = 'needs_attention'
    else if (ongoing) operational = approachingEnd ? 'approaching_end' : 'in_progress'
    else if (startingSoon) operational = 'starting_soon'
    else if (upcoming) operational = 'upcoming'
    else operational = 'scheduled'
  }

  // ADM-046 readiness — separate from booking status.
  let readiness = null
  if (preService) {
    if (issues.includes('conflict') || issues.includes('resource_conflict')) readiness = 'conflict'
    else if (b.payment === 'pending' || b.payment === 'failed') readiness = 'payment_pending'
    else if (assignment === 'unassigned' || assignment === 'reassignment_needed') readiness = 'assignment_pending'
    else if (issues.length) readiness = 'needs_attention'
    else readiness = 'ready'
  }

  // ADM-048 provider settlement — separate from payment status and from the
  // held-funds (escrow) state. Completion never implies funds were released.
  let settlement = null
  if (completed) {
    if (b.escrow === 'disputed' || b.payment === 'disputed' || b.flags.disputed || b.flags.chargeback) settlement = 'on_hold'
    else if (b.escrow === 'refunded' || b.payment === 'refunded') settlement = 'refunded'
    else if (b.settledAt != null || b.escrow === 'released' || ['paid', 'released', 'settled', 'completed'].includes(String(b.payout || '').toLowerCase())) settlement = 'settled'
    else settlement = 'pending'
  }

  return {
    live,
    terminal,
    completed,
    cancelled,
    preService,
    started,
    ongoing,
    upcoming,
    enRoute,
    startingSoon,
    runningLate: lateSignal,
    awaitingCompletion,
    overTime,
    approachingEnd,
    active: ongoing || awaitingCompletion || startingSoon || lateSignal,
    assignment,
    issues,
    needsAttention: issues.length > 0,
    operational,
    readiness,
    settlement,
    minsToStart,
    expectedEnd,
    elapsedMins: ongoing && actualStart != null ? Math.max(0, Math.round((now - actualStart) / MINUTE)) : null,
    overByMins: overTime ? Math.round(-minsToEnd) : null,
    remainingMins: ongoing && minsToEnd != null && minsToEnd > 0 ? Math.round(minsToEnd) : null,
  }
}

// ---------- views ----------

export const VIEWS = ['active', 'upcoming', 'ongoing', 'completed', 'cancelled', 'guest']

const startOfDayIn = (ms, tzOffsetMins) => {
  const shifted = ms + tzOffsetMins * MINUTE
  return shifted - (shifted % DAY) - tzOffsetMins * MINUTE
}
const withinPeriod = (ms, period) => ms != null && ms >= period.start && ms <= period.end
const isToday = (ms, ctx) => ms != null && ms >= ctx.todayStart && ms < ctx.todayStart + DAY

// ADM-048 — post-service state. Completion, client confirmation, funds,
// settlement and refunds stay separate; later financial events never rewrite
// the fact that the service was completed.
function completedState(b, o) {
  const confirmation = b.serviceConfirmed ? 'confirmed' : 'pending'
  const refundOpen = b.payment === 'refunding' || b.refundStatus === 'pending'
  const disputed = b.flags.disputed || b.escrow === 'disputed' || b.payment === 'disputed'
  const issues = []
  if (confirmation === 'pending') issues.push('awaiting_confirmation')
  if (o.settlement === 'pending') issues.push('settlement_pending')
  if (refundOpen) issues.push('refund_requested')
  if (disputed) issues.push('disputed')
  if (b.flags.chargeback || b.payment === 'failed') issues.push('chargeback')
  if (b.flags.supportOpen) issues.push('support_follow_up')
  if (b.flags.safety) issues.push('safety_report')
  if (b.flags.reviewReported) issues.push('review_reported')

  let postService = 'complete'
  if (issues.includes('chargeback')) postService = 'chargeback'
  else if (disputed) postService = 'disputed'
  else if (refundOpen) postService = 'refund_requested'
  else if (issues.length) postService = 'follow_up'
  else if (b.payment === 'refunded' || b.refundStatus === 'refunded') postService = 'refund_resolved'

  return {
    issues,
    needsAttention: postService !== 'complete' && postService !== 'refund_resolved',
    confirmation,
    settlement: o.settlement,
    funds: b.escrow,
    postService,
    review: b.reviewed ? 'reviewed' : 'not_reviewed',
  }
}

// ADM-049 — cancellation state. Cancelled-by, payment, refund and resolution
// are separate concepts; ordinary resolved cancellations stay quiet.
function cancelledState(b, o, ctx) {
  const by = b.cancelledBy || 'unknown'
  let refund = b.refundStatus
  if (!refund) {
    if (b.payment === 'refunded') refund = 'refunded'
    else if (b.payment === 'refunding') refund = 'pending'
    else if (b.payment === 'paid') refund = 'not_started'
    else refund = 'not_applicable'
  }
  const disputed = b.flags.disputed || b.payment === 'disputed'
  const leadMins = b.cancelledAt != null && b.scheduledStart != null ? (b.scheduledStart - b.cancelledAt) / MINUTE : null
  const providerKey = b.provider.id || b.provider.name
  const issues = []
  if (refund === 'pending' || refund === 'failed') issues.push('refund_pending')
  if (refund === 'not_started') issues.push('refund_not_started')
  if (by === 'provider' && (b.flags.noShow || b.cancellationReasonCode === 'no_show' || (leadMins != null && leadMins < THRESHOLDS.noShowWindow))) issues.push('provider_no_show')
  if (disputed) issues.push('dispute_open')
  if (by === 'provider' && (ctx.providerCancels?.get(providerKey) || 0) >= THRESHOLDS.repeatedProviderCancellations) issues.push('repeated_provider')
  if (b.flags.safety || String(b.cancellationReasonCode || '').includes('safety')) issues.push('safety_cancellation')
  if (b.flags.supportOpen) issues.push('support_open')

  let resolution = 'closed'
  if (disputed) resolution = 'disputed'
  else if (issues.some((i) => i !== 'repeated_provider')) resolution = 'needs_attention'
  else if (refund === 'refunded') resolution = 'resolved'

  const eligibility = b.refundEligibility || (refund === 'no_refund' ? 'not_eligible' : by === 'provider' || by === 'admin' ? 'eligible' : refund === 'refunded' || refund === 'pending' ? 'eligible' : 'per_policy')
  return { issues, needsAttention: resolution === 'needs_attention' || resolution === 'disputed', by, refund, resolution, eligibility, leadMins }
}

// ADM-050 — guest state. Booking lifecycle and account lifecycle are separate,
// and "not registered" is a valid customer state, never a warning.
function guestState(b, o) {
  const g = b.guest
  const lifecycle = o.completed ? 'completed' : o.cancelled ? 'cancelled' : o.ongoing || o.awaitingCompletion ? 'ongoing' : 'upcoming'
  const contact = g.phoneVerified || g.emailVerified ? 'verified' : g.phone || g.email ? 'unverified' : 'missing'
  const issues = []
  if (g.account === 'link_pending') issues.push('link_pending')
  if (g.account === 'link_conflict') issues.push('duplicate_match')
  if (contact !== 'verified' && !o.terminal) issues.push('contact_issue')
  if (o.issues.includes('payment_issue')) issues.push('payment_issue')
  if (b.flags.supportOpen) issues.push('guest_support')
  return { issues, needsAttention: issues.length > 0, lifecycle, account: g.account, contact }
}

const liveState = (b, o) => ({ issues: o.issues, needsAttention: o.needsAttention })

// Per-workspace definition: membership, reporting period, view-specific state,
// tab predicates and the summary counters.
const VIEW_DEFS = {
  active: {
    member: (b, o) => o.active,
    state: liveState,
    issues: ['conflict', 'running_late', 'unassigned', 'payment_issue', 'resource_conflict', 'client_issue'],
    tabs: {
      all: () => true,
      starting_soon: (b, o) => o.startingSoon,
      in_progress: (b, o) => o.ongoing,
      running_late: (b, o) => o.runningLate,
      awaiting_completion: (b, o) => o.awaitingCompletion,
      needs_attention: (b, o) => o.needsAttention,
      unassigned: (b, o) => o.issues.includes('unassigned'),
    },
    summary: (n) => ({
      activeNow: n((b, o) => o.ongoing),
      startingSoon: n((b, o) => o.startingSoon),
      runningLate: n((b, o) => o.runningLate),
      needsAttention: n((b, o) => o.needsAttention),
      awaitingCompletion: n((b, o) => o.awaitingCompletion),
      unassigned: n((b, o) => o.issues.includes('unassigned')),
    }),
  },
  upcoming: {
    member: (b, o) => o.preService && (o.upcoming || o.startingSoon) && !o.runningLate,
    state: liveState,
    issues: ['payment_issue', 'unassigned', 'conflict', 'provider_unavailable', 'client_action'],
    tabs: {
      all: () => true,
      today: (b, o, x, ctx) => b.scheduledStart < ctx.todayStart + DAY,
      tomorrow: (b, o, x, ctx) => b.scheduledStart >= ctx.todayStart + DAY && b.scheduledStart < ctx.todayStart + 2 * DAY,
      next_7: (b, o, x, ctx) => b.scheduledStart < ctx.todayStart + 7 * DAY,
      next_30: (b, o, x, ctx) => b.scheduledStart < ctx.todayStart + 30 * DAY,
      needs_attention: (b, o) => o.readiness !== 'ready',
    },
    summary: (n, rows, ctx) => ({
      upcoming: rows.length,
      today: n((b) => b.scheduledStart < ctx.todayStart + DAY),
      tomorrow: n((b) => b.scheduledStart >= ctx.todayStart + DAY && b.scheduledStart < ctx.todayStart + 2 * DAY),
      next7: n((b) => b.scheduledStart < ctx.todayStart + 7 * DAY),
      paymentPending: n((b) => b.payment === 'pending' || b.payment === 'failed'),
      needsAttention: n((b, o) => o.readiness !== 'ready'),
    }),
  },
  ongoing: {
    member: (b, o) => o.ongoing,
    state: liveState,
    issues: ['over_time', 'service_problem', 'provider_issue', 'assignment_changed', 'client_issue', 'payment_issue'],
    tabs: {
      all: () => true,
      in_progress: (b, o) => o.operational === 'in_progress',
      approaching_end: (b, o) => o.approachingEnd,
      over_time: (b, o) => o.overTime,
      needs_attention: (b, o) => o.needsAttention,
      client_issue: (b, o) => o.issues.includes('client_issue') || o.issues.includes('service_problem'),
      provider_issue: (b, o) => o.issues.includes('provider_issue'),
    },
    summary: (n, rows) => ({
      inProgress: rows.length,
      approachingEnd: n((b, o) => o.approachingEnd),
      overTime: n((b, o) => o.overTime),
      needsAttention: n((b, o) => o.needsAttention),
      clientIssue: n((b, o) => o.issues.includes('client_issue') || o.issues.includes('service_problem')),
      providerIssue: n((b, o) => o.issues.includes('provider_issue')),
    }),
  },
  completed: {
    member: (b, o) => o.completed,
    periodOf: (b) => b.completedAt ?? b.scheduledEnd,
    state: completedState,
    issues: ['awaiting_confirmation', 'settlement_pending', 'refund_requested', 'disputed', 'chargeback', 'support_follow_up'],
    tabs: {
      all: () => true,
      today: (b, o, x, ctx) => isToday(b.completedAt ?? b.scheduledEnd, ctx),
      confirmed: (b, o, x) => x.confirmation === 'confirmed',
      settlement_pending: (b, o, x) => x.settlement === 'pending',
      reviewed: (b, o, x) => x.review === 'reviewed',
      refunded: (b) => b.payment === 'refunded' || b.payment === 'refunding' || b.refundStatus != null,
      disputed: (b, o, x) => x.postService === 'disputed' || x.postService === 'chargeback',
    },
    summary: (n, rows, ctx) => ({
      completed: rows.length,
      today: n((b) => isToday(b.completedAt ?? b.scheduledEnd, ctx)),
      confirmed: n((b, o, x) => x.confirmation === 'confirmed'),
      awaitingSettlement: n((b, o, x) => x.settlement === 'pending'),
      reviewed: n((b, o, x) => x.review === 'reviewed'),
      postServiceIssues: n((b, o, x) => ['chargeback', 'disputed', 'refund_requested'].includes(x.postService) || x.issues.includes('support_follow_up') || x.issues.includes('safety_report')),
    }),
  },
  cancelled: {
    member: (b) => b.status === 'cancelled',
    periodOf: (b) => b.cancelledAt ?? b.createdAt,
    state: cancelledState,
    issues: ['refund_pending', 'refund_not_started', 'provider_no_show', 'dispute_open', 'repeated_provider', 'safety_cancellation'],
    tabs: {
      all: () => true,
      client: (b, o, x) => x.by === 'client',
      provider: (b, o, x) => x.by === 'provider',
      admin: (b, o, x) => x.by === 'admin' || x.by === 'system',
      refund_pending: (b, o, x) => x.refund === 'pending' || x.refund === 'not_started' || x.refund === 'failed',
      refunded: (b, o, x) => x.refund === 'refunded',
      no_refund: (b, o, x) => x.refund === 'no_refund' || x.refund === 'not_applicable',
      needs_attention: (b, o, x) => x.needsAttention,
    },
    summary: (n, rows, ctx) => ({
      total: rows.length,
      today: n((b) => isToday(b.cancelledAt, ctx)),
      client: n((b, o, x) => x.by === 'client'),
      provider: n((b, o, x) => x.by === 'provider'),
      refundPending: n((b, o, x) => x.refund === 'pending' || x.refund === 'not_started' || x.refund === 'failed'),
      needsAttention: n((b, o, x) => x.needsAttention),
    }),
  },
  guest: {
    member: (b) => Boolean(b.guest),
    periodOf: (b) => b.createdAt,
    state: guestState,
    issues: ['link_pending', 'duplicate_match', 'contact_issue', 'payment_issue', 'guest_support'],
    tabs: {
      all: () => true,
      upcoming: (b, o, x) => x.lifecycle === 'upcoming',
      ongoing: (b, o, x) => x.lifecycle === 'ongoing',
      completed: (b, o, x) => x.lifecycle === 'completed',
      cancelled: (b, o, x) => x.lifecycle === 'cancelled',
      account_created: (b, o, x) => x.account === 'account_created' || x.account === 'linked',
      not_registered: (b, o, x) => x.account === 'not_registered' || x.account === 'registration_started',
      link_issues: (b, o, x) => x.account === 'link_pending' || x.account === 'link_conflict',
    },
    summary: (n, rows) => ({
      guests: rows.length,
      upcoming: n((b, o, x) => x.lifecycle === 'upcoming'),
      completed: n((b, o, x) => x.lifecycle === 'completed'),
      accountsCreated: n((b, o, x) => x.account === 'account_created' || x.account === 'linked'),
      awaitingLink: n((b, o, x) => x.account === 'link_pending'),
      needsAttention: n((b, o, x) => x.needsAttention),
    }),
  },
}

export const VIEW_ISSUES = Object.fromEntries(Object.entries(VIEW_DEFS).map(([k, v]) => [k, v.issues]))

// Simple equality filters shared by every workspace. Each reads from the
// booking, the derived ops, or the view-specific state.
const FILTERS = {
  pay: (b) => b.payment,
  assign: (b, o) => o.assignment,
  src: (b) => b.source,
  ptype: (b) => b.category,
  settle: (b, o, x) => x.settlement,
  confirm: (b, o, x) => x.confirmation,
  review: (b, o, x) => x.review,
  refund: (b, o, x) => (x.refund === 'not_started' || x.refund === 'failed' ? 'pending' : x.refund === 'not_applicable' ? 'no_refund' : x.refund),
  by: (b, o, x) => x.by,
  account: (b, o, x) => x.account,
  contact: (b, o, x) => x.contact,
  lifecycle: (b, o, x) => x.lifecycle,
}

function matchesQuery(b, q) {
  const needle = String(q || '').trim().toLowerCase()
  if (!needle) return true
  const fields = [b.id, b.reference, b.client.name, b.provider.name, b.service.name, b.branch, b.cancellationReason]
  if (b.guest) fields.push(b.guest.name, b.guest.email)
  if (fields.some((v) => v && String(v).toLowerCase().includes(needle))) return true
  // Phone search on digits only (guest lookup by verified phone).
  const digits = needle.replace(/\D/g, '')
  return Boolean(b.guest?.phone && digits.length >= 4 && b.guest.phone.replace(/\D/g, '').includes(digits))
}

// Severity used to float problem bookings to the top.
const SEVERITY = { conflict: 0, service_problem: 0, running_late: 1, over_time: 1, needs_attention: 2, awaiting_completion: 3 }

function sortRows(view, rows, sort) {
  const byStart = (a, z) => (a.b.scheduledStart ?? 0) - (z.b.scheduledStart ?? 0)
  const attentionFirst = (a, z) => (a.x.needsAttention === z.x.needsAttention ? 0 : a.x.needsAttention ? -1 : 1)
  if (sort === 'newest') return rows.sort((a, z) => (z.b.createdAt ?? 0) - (a.b.createdAt ?? 0))
  if (sort === 'amount') return rows.sort((a, z) => (z.b.amount ?? 0) - (a.b.amount ?? 0))
  if (sort === 'time') return rows.sort(byStart)
  const def = VIEW_DEFS[view]
  if (def.periodOf) {
    // Historical views: most recent first; "priority" lifts unresolved records.
    const recent = (a, z) => (def.periodOf(z.b) ?? 0) - (def.periodOf(a.b) ?? 0)
    return rows.sort(sort === 'recent' ? recent : (a, z) => attentionFirst(a, z) || recent(a, z))
  }
  return rows.sort((a, z) => (SEVERITY[a.o.operational] ?? 9) - (SEVERITY[z.o.operational] ?? 9) || attentionFirst(a, z) || byStart(a, z))
}

// Bookings the admin may see at all, plus the market/provider-type filters.
export function scopeRows(bookings, { markets, providerCategory: cat }) {
  return bookings.filter((b) => (!markets || markets.includes(b.countryCode)) && (!cat || b.category === cat))
}

function contextFor(view, rows, now, tzOffsetMins) {
  const ctx = { now, todayStart: startOfDayIn(now, tzOffsetMins) }
  if (view === 'cancelled') {
    ctx.providerCancels = new Map()
    for (const { b } of rows) {
      if (b.cancelledBy === 'provider') {
        const key = b.provider.id || b.provider.name
        ctx.providerCancels.set(key, (ctx.providerCancels.get(key) || 0) + 1)
      }
    }
  }
  return ctx
}

// Build one paginated workspace response (ADM-045 → ADM-050).
// `exportAll` returns every filtered row (bounded by the caller's query cap).
export function buildListView(view, bookings, params, { now, tzOffsetMins = 180, period = null, finance = true, exportAll = false } = {}) {
  const def = VIEW_DEFS[view]
  let rows = bookings
    .map((b) => ({ b, o: deriveOps(b, now) }))
    .filter(({ b, o }) => def.member(b, o) && (!period || !def.periodOf || withinPeriod(def.periodOf(b), period)))
  const ctx = contextFor(view, rows, now, tzOffsetMins)
  rows = rows.map((r) => ({ ...r, x: def.state(r.b, r.o, ctx) }))

  const n = (fn) => rows.filter(({ b, o, x }) => fn(b, o, x)).length
  const attention = def.issues.map((id) => ({ id, count: n((b, o, x) => x.issues.includes(id)) }))
  const tabs = Object.entries(def.tabs).map(([id, fn]) => ({ id, count: n((b, o, x) => fn(b, o, x, ctx)) }))
  const summary = def.summary(n, rows, ctx)

  const tabFn = def.tabs[params.tab] || def.tabs.all
  rows = rows.filter(({ b, o, x }) =>
    tabFn(b, o, x, ctx) &&
    (!params.issue || x.issues.includes(params.issue)) &&
    Object.entries(FILTERS).every(([key, get]) => !params[key] || get(b, o, x) === params[key]) &&
    matchesQuery(b, params.q),
  )
  sortRows(view, rows, params.sort)

  const total = rows.length
  const pageSize = exportAll ? Math.max(total, 1) : Math.min(Math.max(Number(params.pageSize) || 10, 5), 50)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = exportAll ? 1 : Math.min(Math.max(Number(params.page) || 1, 1), totalPages)
  const items = rows.slice((page - 1) * pageSize, page * pageSize).map(({ b, o, x }) => toRow(view, b, o, x, finance))

  return { view, summary, attention, tabs, items, total, page, pageSize, totalPages }
}

// Permission-safe table row. Amounts are omitted without payments.view; guest
// contact details are always masked here (reveal is a separate audited call).
export function toRow(view, b, o, x, finance = true) {
  const row = {
    id: b.id,
    reference: b.reference,
    client: { id: b.client.id, name: b.client.name, guest: b.client.guest },
    provider: { id: b.provider.id, name: b.provider.name, typeLabel: b.provider.typeLabel, rating: b.provider.rating, reviews: b.provider.reviews },
    category: b.category,
    service: b.service.name,
    scheduledStart: iso(b.scheduledStart),
    scheduledEnd: iso(b.scheduledEnd),
    serviceStartedAt: iso(b.serviceStartedAt),
    expectedEnd: iso(o.expectedEnd),
    completedAt: iso(b.completedAt ?? (b.status === 'completed' ? b.scheduledEnd : null)),
    cancelledAt: iso(b.cancelledAt),
    elapsedMins: o.elapsedMins,
    overByMins: o.overByMins,
    durationMins: b.durationMins,
    countryCode: b.countryCode,
    marketName: b.marketName,
    amount: finance ? b.amount : null,
    currency: b.currency,
    status: b.status,
    payment: b.payment,
    escrow: finance ? b.escrow : null,
    assignment: o.assignment,
    operational: o.operational,
    readiness: o.readiness,
    settlement: finance ? o.settlement : null,
    serviceConfirmed: b.serviceConfirmed,
    reviewed: b.reviewed,
    rating: b.rating,
    source: b.source,
    branch: b.branch,
    issues: x.issues,
    needsAttention: x.needsAttention,
  }
  if (view === 'completed') Object.assign(row, { confirmation: x.confirmation, postService: x.postService, review: x.review })
  if (view === 'cancelled') {
    Object.assign(row, {
      cancelledBy: x.by,
      cancellationReason: b.cancellationReason,
      refund: x.refund,
      resolution: x.resolution,
      refundAmount: finance ? b.refundAmount : null,
    })
  }
  if (view === 'guest') {
    Object.assign(row, {
      guest: { name: b.guest.name, phone: maskPhone(b.guest.phone), email: maskEmail(b.guest.email), phoneVerified: b.guest.phoneVerified, emailVerified: b.guest.emailVerified },
      account: x.account,
      contact: x.contact,
      lifecycle: x.lifecycle,
    })
  }
  return row
}

// ---------- quick view (drawer) ----------

function defaultView(b, o) {
  if (o.completed) return 'completed'
  if (b.status === 'cancelled') return 'cancelled'
  if (o.ongoing) return 'ongoing'
  if (o.preService && !o.active) return 'upcoming'
  return 'active'
}

const check = (label, state, value) => ({ label, state, value })

function liveChecks(view, b, o) {
  const payState = b.payment === 'paid' ? 'ok' : b.payment === 'failed' || b.payment === 'disputed' ? 'bad' : 'warn'
  const assignState = o.assignment === 'assigned' || o.assignment === 'not_required' ? 'ok' : o.assignment === 'conflict' ? 'bad' : 'warn'
  const conflict = o.issues.includes('conflict') || o.issues.includes('resource_conflict')
  const clientIssue = o.issues.includes('client_issue') || o.issues.includes('service_problem')
  const checks = [
    check('Provider', b.flags.providerUnavailable ? 'bad' : 'ok', b.flags.providerUnavailable ? 'Unavailable' : 'Active'),
    check('Booking', CONFIRMED_OR_LATER.has(b.status) ? 'ok' : 'warn', label(b.status)),
    check('Assignment', assignState, o.assignment === 'not_required' ? 'Not required' : label(o.assignment)),
    check('Payment', payState, label(b.payment)),
  ]
  if (view === 'upcoming') checks.push(check('Availability', conflict ? 'bad' : 'ok', conflict ? 'Conflict detected' : 'Valid'))
  else checks.push(check('Service Start', o.started ? 'ok' : o.runningLate ? 'warn' : 'neutral', o.started ? 'Started' : 'Not started'))
  if (b.resources.length) checks.push(check('Required Resource', o.issues.includes('resource_conflict') ? 'bad' : 'ok', o.issues.includes('resource_conflict') ? 'Conflict' : 'Reserved'))
  checks.push(check('Booking Conflict', conflict ? 'bad' : 'ok', conflict ? (b.flags.conflictType ? label(b.flags.conflictType) : 'Detected') : 'None'))
  checks.push(check('Client Issue', clientIssue ? 'bad' : 'ok', clientIssue ? 'Reported' : 'None'))
  if (view === 'ongoing') checks.push(check('Provider Issue', o.issues.includes('provider_issue') ? 'warn' : 'ok', o.issues.includes('provider_issue') ? 'Reported' : 'None'))

  const bad = checks.some((c) => c.state === 'bad')
  const warn = checks.some((c) => c.state === 'warn') || o.needsAttention
  const text = view === 'upcoming'
    ? bad ? 'Conflict — review before service' : warn ? 'Needs attention before service' : 'Ready for service'
    : bad ? 'Intervention may be needed' : warn ? 'Needs attention' : o.ongoing ? 'Service running normally' : 'On track'
  return { checks, overall: { label: text, tone: bad ? 'bad' : warn ? 'warn' : 'ok' } }
}

function completionDetail(b, o, x, finance) {
  const completedBy = b.completedBy || (b.serviceConfirmed ? 'client' : b.providerCompleted ? 'provider' : null)
  const tone = { complete: 'ok', refund_resolved: 'ok', follow_up: 'warn', refund_requested: 'bad', disputed: 'bad', chargeback: 'bad' }[x.postService]
  return {
    completion: {
      providerCompleted: b.providerCompleted,
      providerCompletedAt: iso(b.providerCompletedAt),
      clientConfirmed: b.serviceConfirmed,
      clientConfirmedAt: iso(b.serviceConfirmedAt),
      completedAt: iso(b.completedAt ?? b.scheduledEnd),
      completedBy,
      status: b.serviceConfirmed ? 'complete' : 'awaiting_confirmation',
    },
    paymentInfo: { amount: finance ? b.amount : null, status: b.payment, method: b.paymentMethod, transactionId: finance ? b.transactionId : null },
    funds: finance ? { status: b.escrow, releasedAt: iso(b.fundsReleasedAt) } : null,
    settlementInfo: finance ? { status: o.settlement, providerAmount: b.providerAmount, platformFee: b.platformFee, settledAt: iso(b.settledAt) } : null,
    review: { reviewed: b.reviewed, rating: b.rating, comment: b.reviewComment, status: b.reviewStatus || (b.reviewed ? 'published' : null), id: b.reviewId, reported: b.flags.reviewReported },
    overall: { label: { complete: 'Complete', refund_resolved: 'Refund resolved', follow_up: 'Follow-up needed', refund_requested: 'Refund requested', disputed: 'Disputed', chargeback: 'Chargeback / payment issue' }[x.postService], tone },
  }
}

function cancellationDetail(b, o, x, finance) {
  const paid = ['paid', 'refunded', 'refunding', 'disputed'].includes(b.payment)
  const checks = [
    check('Booking', 'ok', 'Cancelled'),
    check('Client Notification', b.clientNotified === false ? 'warn' : b.clientNotified ? 'ok' : 'neutral', b.clientNotified === false ? 'Not sent' : b.clientNotified ? 'Sent' : 'Not recorded'),
    check('Provider Notification', b.providerNotified === false ? 'warn' : b.providerNotified ? 'ok' : 'neutral', b.providerNotified === false ? 'Not sent' : b.providerNotified ? 'Sent' : 'Not recorded'),
    check('Payment', paid ? 'ok' : 'neutral', paid ? 'Captured' : 'Not captured'),
    check('Refund', x.refund === 'refunded' ? 'ok' : x.refund === 'pending' ? 'warn' : x.refund === 'not_started' || x.refund === 'failed' ? 'bad' : 'neutral', label(x.refund)),
    check('Dispute', x.issues.includes('dispute_open') ? 'bad' : 'ok', x.issues.includes('dispute_open') ? 'Open' : 'None'),
    check('Support Case', b.flags.supportOpen ? 'warn' : 'ok', b.flags.supportOpen ? 'Open' : 'None'),
  ]
  const overall = x.resolution === 'resolved' || x.resolution === 'closed'
    ? { label: 'Cancellation resolved', tone: 'ok' }
    : x.resolution === 'disputed' ? { label: 'Disputed — escalated', tone: 'bad' } : { label: 'Cancellation not fully resolved', tone: 'warn' }

  const timeline = [
    ['Booking confirmed', b.confirmedAt],
    [`${b.cancelledBy ? label(b.cancelledBy) : 'Cancellation'} cancellation requested`, b.cancellationRequestedAt],
    ['Booking cancelled', b.cancelledAt],
    ['Refund created', b.refundRequestedAt],
  ].filter(([, at]) => at != null).map(([event, at]) => ({ event, at: iso(at) }))
  if (x.refund === 'pending') timeline.push({ event: 'Refund pending', at: null })
  if (x.refund === 'refunded') timeline.push({ event: 'Refunded', at: null })

  return {
    cancellation: { id: b.cancellationId, at: iso(b.cancelledAt), by: x.by, reason: b.cancellationReason, reasonCode: b.cancellationReasonCode, requestedAt: iso(b.cancellationRequestedAt), fee: finance ? b.cancellationFee : null, leadMins: x.leadMins == null ? null : Math.round(x.leadMins) },
    paymentInfo: { amount: finance ? b.amount : null, status: b.payment, method: b.paymentMethod, transactionId: finance ? b.transactionId : null },
    refundInfo: { eligibility: x.eligibility, amount: finance ? b.refundAmount : null, status: x.refund, requestedAt: iso(b.refundRequestedAt), reason: b.refundReason || (x.by === 'provider' ? 'Provider cancellation' : null), id: b.refundId },
    policy: b.policy,
    cancelTimeline: timeline,
    checks,
    overall,
  }
}

function guestDetail(b, o, x, { reveal = false } = {}) {
  const g = b.guest
  return {
    guestInfo: {
      name: g.name,
      phone: reveal ? g.phone : maskPhone(g.phone),
      email: reveal ? g.email : maskEmail(g.email),
      revealed: reveal,
      phoneVerified: g.phoneVerified,
      emailVerified: g.emailVerified,
      countryCode: g.countryCode,
      contact: x.contact,
      account: x.account,
      lifecycle: x.lifecycle,
      linkedClientId: g.linkedClientId,
      linkedClientName: g.linkedClientName,
      linkedAt: iso(g.linkedAt),
      conflictReason: g.conflictReason,
      channels: g.channels,
      snapshot: { name: g.name, createdAt: iso(b.createdAt), source: b.source },
    },
  }
}

export function buildQuickView(b, now, { view: requested, finance = true, related = {}, reveal = false, providerCancellations = null, canRevealContact = false } = {}) {
  const o = deriveOps(b, now)
  const view = VIEWS.includes(requested) ? requested : defaultView(b, o)
  const def = VIEW_DEFS[view]
  const ctx = { now, todayStart: startOfDayIn(now, 180), providerCancels: new Map([[b.provider.id || b.provider.name, providerCancellations ?? 0]]) }
  // A booking opened from a list it no longer belongs to falls back to live state.
  const x = def.member(b, o) ? def.state(b, o, ctx) : liveState(b, o)

  const timeline = [
    ['Booking created', b.createdAt],
    ['Booking confirmed', b.confirmedAt],
    ['Service started', b.serviceStartedAt],
    ['Provider marked complete', b.providerCompletedAt],
    ['Client confirmed service', b.serviceConfirmedAt],
    ['Booking completed', b.completedAt],
    ['Booking cancelled', b.cancelledAt],
  ].filter(([, at]) => at != null).map(([event, at]) => ({ event, at: iso(at) })).sort((a, z) => a.at.localeCompare(z.at))

  const base = {
    ...toRow(view, b, o, x, finance),
    view,
    durationMins: b.durationMins,
    remainingMins: o.remainingMins,
    location: b.location,
    branch: b.branch,
    specialist: b.specialist,
    specialists: b.specialists,
    resources: b.resources,
    serviceStartedBy: b.serviceStartedBy,
    // Individual professionals deliver the service themselves.
    assignedTo: o.assignment === 'not_required' ? `${b.provider.name} (Self)` : b.specialists.length ? b.specialists.join(', ') : b.specialist,
    staffCheckInAt: iso(b.staffCheckInAt ?? (o.assignment === 'not_required' ? b.serviceStartedAt : null)),
    bookedAt: iso(b.createdAt),
    paymentMethod: b.paymentMethod,
    transactionId: finance ? b.transactionId : null,
    timeline,
    related,
  }

  if (view === 'completed' && o.completed) return { ...base, ...completionDetail(b, o, x, finance), checks: [] }
  if (view === 'cancelled' && b.status === 'cancelled') {
    const providerRisk = x.by === 'provider' ? { cancellations: providerCancellations, reviewRecommended: (providerCancellations ?? 0) >= THRESHOLDS.repeatedProviderCancellations } : null
    return { ...base, ...cancellationDetail(b, o, x, finance), providerRisk }
  }
  if (view === 'guest' && b.guest) {
    const live = o.terminal ? { checks: [], overall: null } : liveChecks(o.preService && !o.active ? 'upcoming' : 'active', b, o)
    const detail = guestDetail(b, o, x, { reveal })
    detail.guestInfo.canReveal = canRevealContact
    return { ...base, ...detail, ...live, paymentInfo: { amount: finance ? b.amount : null, status: b.payment, method: b.paymentMethod, transactionId: finance ? b.transactionId : null } }
  }
  return { ...base, ...liveChecks(view, b, o) }
}

export function label(value) {
  if (!value) return '—'
  const text = String(value).replaceAll('_', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// ---------- ADM-044 dashboard ----------

const addTo = (map, key, n = 1) => map.set(key, (map.get(key) || 0) + n)

export function buildDashboard(bookings, { now, period, tzOffsetMins = 180, market = 'ALL', finance = true, statusCounts = null, truncated = false }) {
  const rows = bookings.map((b) => ({ b, o: deriveOps(b, now) }))
  const inPeriod = (ms) => withinPeriod(ms, period)
  const createdRows = rows.filter(({ b }) => inPeriod(b.createdAt))
  const live = rows.filter(({ o }) => o.live)
  const count = (set, fn) => set.filter(({ b, o }) => fn(o, b)).length
  const todayStart = startOfDayIn(now, tzOffsetMins)

  const completedInPeriod = rows.filter(({ b, o }) => o.completed && inPeriod(b.completedAt ?? b.scheduledEnd))
  const cancelledInPeriod = rows.filter(({ b, o }) => o.cancelled && inPeriod(b.cancelledAt ?? b.createdAt))

  // Trends compare the same-length period immediately before. Only
  // period-based figures get a trend; live snapshots (upcoming, ongoing)
  // have no stored history to compare against.
  const span = period.end - period.start
  const prev = { start: period.start - span - 1, end: period.start - 1 }
  const inPrev = (ms) => withinPeriod(ms, prev)
  const change = (cur, before) => (before ? Math.round(((cur - before) / before) * 100) : null)
  const prevCreated = rows.filter(({ b }) => inPrev(b.createdAt))
  const trends = {
    total: change(createdRows.length, prevCreated.length),
    completed: change(completedInPeriod.length, count(rows, (o, b) => o.completed && inPrev(b.completedAt ?? b.scheduledEnd))),
    cancelled: change(cancelledInPeriod.length, count(rows, (o, b) => o.cancelled && inPrev(b.cancelledAt ?? b.createdAt))),
    value: null,
  }

  // Booking value: never sum different currencies.
  let value = null
  if (finance) {
    const byCurrency = new Map()
    const byMarket = new Map()
    for (const { b, o } of createdRows) {
      if (o.cancelled || typeof b.amount !== 'number' || !b.currency) continue
      addTo(byCurrency, b.currency, b.amount)
      if (b.countryCode) byMarket.set(b.countryCode, { market: b.countryCode, name: b.marketName, currency: b.currency, amount: (byMarket.get(b.countryCode)?.amount || 0) + b.amount })
    }
    value = byCurrency.size <= 1
      ? { mode: 'single', currency: [...byCurrency.keys()][0] || MARKET_META[market]?.currency || null, amount: [...byCurrency.values()][0] || 0 }
      : { mode: 'multiple', byMarket: MARKET_CODES.map((c) => byMarket.get(c)).filter(Boolean) } // amounts in different currencies are not comparable
    if (value.mode === 'single') {
      const before = prevCreated.filter(({ b, o }) => !o.cancelled && b.currency === value.currency && typeof b.amount === 'number').reduce((n, { b }) => n + b.amount, 0)
      trends.value = change(value.amount, before)
    }
  }

  const statusOverview = BOOKING_STATUSES.map((status) => ({
    status,
    count: statusCounts ? statusCounts[status] ?? 0 : rows.filter(({ b }) => b.status === status).length,
  }))

  const journeyBase = createdRows
  const journey = {
    created: journeyBase.length,
    confirmed: count(journeyBase, (o, b) => CONFIRMED_OR_LATER.has(b.status) || b.confirmedAt != null),
    started: count(journeyBase, (o) => o.started),
    completed: count(journeyBase, (o) => o.completed),
    settled: finance ? count(journeyBase, (o) => o.settlement === 'settled') : null,
  }

  // Booking activity for the card toggle: hourly today, daily for 7 / 30 days,
  // labelled in the market's local time.
  const HOUR = 60 * MINUTE
  const series = (start, size, n, fmt) => {
    const buckets = Array.from({ length: n }, (_, i) => ({ at: iso(start + i * size + tzOffsetMins * MINUTE).slice(0, fmt), start: start + i * size, created: 0, completed: 0, cancelled: 0 }))
    const put = (ms, key) => {
      if (ms == null) return
      const i = Math.floor((ms - start) / size)
      if (i >= 0 && i < n) buckets[i][key] += 1
    }
    for (const { b, o } of rows) {
      put(b.createdAt, 'created')
      if (o.completed) put(b.completedAt ?? b.scheduledEnd, 'completed')
      if (o.cancelled) put(b.cancelledAt, 'cancelled')
    }
    return buckets.map(({ start: _s, ...rest }) => rest)
  }
  const activity = {
    today: series(todayStart, HOUR, 24, 16),
    '7d': series(todayStart - 6 * DAY, DAY, 7, 10),
    '30d': series(todayStart - 29 * DAY, DAY, 30, 10),
  }

  const categories = new Map(Object.keys(CATEGORY_LABELS).map((k) => [k, 0]))
  const types = new Map()
  for (const { b } of createdRows) {
    addTo(categories, b.category)
    if (b.category === 'individual' && b.provider.type) addTo(types, b.provider.type)
  }

  const markets = market === 'ALL'
    ? MARKET_CODES.map((code) => {
        const m = rows.filter(({ b }) => b.countryCode === code)
        const created = m.filter(({ b }) => inPeriod(b.createdAt))
        const done = m.filter(({ o }) => o.completed).length
        const closed = done + m.filter(({ o }) => o.cancelled).length
        return {
          id: code,
          name: MARKET_META[code].name,
          bookings: created.length,
          ongoing: m.filter(({ o }) => o.ongoing).length,
          needsAttention: m.filter(({ o }) => o.needsAttention).length,
          completionRate: closed ? Math.round((done / closed) * 100) : null,
        }
      }).filter((m) => m.bookings || m.ongoing || m.needsAttention)
    : []

  const recent = [...createdRows].sort((a, z) => (z.b.createdAt ?? 0) - (a.b.createdAt ?? 0)).slice(0, 6).map(({ b, o }) => toRow('active', b, o, liveState(b, o), finance))

  const sources = new Map()
  for (const { b } of createdRows) addTo(sources, b.source)

  const payBase = rows.filter(({ b, o }) => inPeriod(b.createdAt) || o.live)
  const payment = { paid: 0, pending: 0, failed: 0, refunded: 0, disputed: 0 }
  for (const { b } of payBase) {
    const key = b.payment === 'refunding' ? 'refunded' : b.payment
    if (key in payment) payment[key] += 1
  }

  const business = live.filter(({ b }) => b.category !== 'individual')
  const assignment = {
    assigned: count(business, (o) => o.assignment === 'assigned'),
    unassigned: count(business, (o) => o.assignment === 'unassigned'),
    reassignment: count(business, (o) => o.assignment === 'reassignment_needed'),
    conflict: count(business, (o) => o.assignment === 'conflict'),
  }

  const today = (ms) => ms != null && ms >= todayStart && ms < todayStart + DAY
  const cancelledToday = rows.filter(({ b, o }) => o.cancelled && today(b.cancelledAt))
  const cancellations = {
    cancelledToday: cancelledToday.length,
    rescheduledToday: count(rows, (o, b) => today(b.rescheduledAt)),
    refundPending: count(rows, (o, b) => o.cancelled && (b.payment === 'refunding' || b.refundStatus === 'pending')),
    byProvider: count(cancelledInPeriod, (o, b) => b.cancelledBy === 'provider'),
    byClient: count(cancelledInPeriod, (o, b) => b.cancelledBy === 'client'),
  }

  return {
    kpis: {
      total: createdRows.length,
      upcoming: count(live, (o) => o.preService && o.upcoming),
      ongoing: count(live, (o) => o.ongoing),
      completed: completedInPeriod.length,
      cancelled: cancelledInPeriod.length,
      value,
    },
    attention: {
      conflicts: count(live, (o) => o.issues.includes('conflict') || o.issues.includes('resource_conflict')),
      paymentIssues: count(rows, (o) => o.issues.includes('payment_issue')),
      unassigned: count(live, (o) => o.issues.includes('unassigned')),
      serviceProblems: count(live, (o) => o.issues.includes('service_problem')),
      disputed: count(rows, (o) => o.issues.includes('disputed')),
      awaitingCompletion: count(live, (o) => o.awaitingCompletion),
    },
    statusOverview,
    journey,
    activity,
    trends,
    providerTypes: {
      categories: [...categories].map(([id, n]) => ({ id, label: CATEGORY_LABELS[id], count: n })),
      individual: [...types].map(([id, n]) => ({ id, label: PROVIDER_TYPE_LABELS[id] || label(id), count: n })).sort((a, z) => z.count - a.count),
    },
    markets,
    recent,
    sources: [...sources].map(([id, n]) => ({ id, label: SOURCE_LABELS[id] || label(id), count: n })).sort((a, z) => z.count - a.count),
    payment,
    assignment,
    cancellations,
    now: {
      ongoing: count(live, (o) => o.ongoing),
      startingNext: count(live, (o) => o.preService && o.minsToStart != null && o.minsToStart >= 0 && o.minsToStart <= THRESHOLDS.startingNext),
      runningLate: count(live, (o) => o.runningLate),
      awaitingCompletion: count(live, (o) => o.awaitingCompletion),
    },
    truncated,
  }
}
