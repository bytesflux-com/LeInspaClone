// ADM-006 — Operations Center: a backend-generated operational read model over
// the mobile app's records (bookings, withdrawal_requests, payments,
// escrow_transactions, verification_requests, professional_profile_update_requests,
// disputes, safety_reports, support_tickets, support_cases, users) plus the
// Admin queue assignments. No operational_cases copy is stored.
//
// A count is null (shown as "—") when the platform has no source for it yet,
// never an invented number.

import { MARKETS, WITHDRAWAL_OPEN, isPaid } from './dashboardLogic.js'
import { accountStatusOf, inMarkets, lowerStatus, millis, providerTypeOf, PROVIDER_TYPES } from './platformData.js'

const HOUR = 3600000
const DAY = 24 * HOUR
const SAFETY_OPEN = new Set(['pending', 'open', 'under_investigation', 'escalated'])
const DISPUTE_OPEN = new Set(['open', 'pending', 'under_review', 'escalated'])
const SUPPORT_OPEN = new Set(['open', 'pending', 'in_progress', 'awaiting_reply'])
const CONTENT_TYPES = new Set(['gallery_photo', 'gallery_photo_edit', 'profile_photo', 'profile_text_change'])

export function waitingLabel(ms, now) {
  if (!ms) return '—'
  const mins = Math.max(0, Math.round((now - ms) / 60000))
  if (mins < 60) return `${mins} min`
  if (mins < 48 * 60) return `${Math.round(mins / 60)} h`
  return `${Math.round(mins / 1440)} d`
}

const agoLabel = (ms, now) => (ms ? `${waitingLabel(ms, now)} ago` : '')

/**
 * @param src  { users, usersById, bookings, payments, escrows, withdrawals, verificationRequests, profileUpdates, disputes, safety, supportTickets, supportCases, assignments }
 * @param opts { market, markets, now, adminUid }
 */
export function buildOperations(src, { market = 'ALL', markets = null, now = Date.now(), adminUid = null }) {
  const scopeMarkets = market !== 'ALL' ? [market] : markets
  const country = (...uids) => uids.map((u) => src.usersById.get(u)?.countryCodeResolved).find(Boolean) || null
  const scoped = (rows, ...fields) => rows.map((r) => ({ ...r, _country: country(...fields.map((f) => r[f])) })).filter((r) => inMarkets(r._country, scopeMarkets))
  const startOfToday = now - ((now + 3 * HOUR) % DAY) // East Africa day boundary

  const assignments = new Map(src.assignments.map((a) => [`${a.sourceType}:${a.sourceId}`, a]))
  const assigneeOf = (type, id) => assignments.get(`${type}:${id}`)?.assignedTo || null

  const withdrawals = scoped(src.withdrawals, 'userId', 'providerId')
  const disputes = scoped(src.disputes, 'reporterId', 'againstId', 'clientId', 'providerId')
  const safety = scoped(src.safety, 'providerId', 'clientId')
  const support = scoped(src.supportTickets, 'userId', 'customerId')
  const supportCases = scoped(src.supportCases, 'userId')
  const verification = scoped(src.verificationRequests, 'userId')
  const profileUpdates = scoped(src.profileUpdates, 'userId', 'providerId')
  const payments = scoped(src.payments, 'userId', 'providerId', 'customerId')
  const escrows = scoped(src.escrows, 'providerId', 'customerId')
  const users = src.users.filter((u) => inMarkets(u.countryCodeResolved, scopeMarkets))
  const bookings = src.bookings.filter((b) => inMarkets(b.countryCode, scopeMarkets))

  const openWithdrawals = withdrawals.filter((w) => WITHDRAWAL_OPEN.has(lowerStatus(w.status)))
  const openDisputes = disputes.filter((d) => DISPUTE_OPEN.has(lowerStatus(d.status)))
  const openSafety = safety.filter((s) => SAFETY_OPEN.has(lowerStatus(s.status)))
  const sos = openSafety.filter((s) => /sos|emergency/i.test(s.issueType || ''))
  const openSupport = support.filter((s) => SUPPORT_OPEN.has(lowerStatus(s.status)))
  const openSupportCases = supportCases.filter((s) => SUPPORT_OPEN.has(lowerStatus(s.status)))
  const pendingVr = verification.filter((v) => lowerStatus(v.status) === 'pending')
  const pendingContent = pendingVr.filter((v) => CONTENT_TYPES.has(lowerStatus(v.requestType)))
  const pendingVerification = pendingVr.filter((v) => !CONTENT_TYPES.has(lowerStatus(v.requestType)))
  const pendingProfileUpdates = profileUpdates.filter((p) => lowerStatus(p.status) === 'pending')

  // Bookings that need operations: not started although their time has passed,
  // and conflicts / unassigned business bookings.
  const PRE = new Set(['pending', 'negotiation', 'accepted', 'confirmed'])
  const overdue = bookings.filter((b) => PRE.has(b.status) && b.scheduledStart && b.scheduledStart < now - HOUR)
  const conflicts = bookings.filter((b) => b.flags?.conflict || b.flags?.resourceConflict)
  const unassigned = bookings.filter((b) => b.category !== 'individual' && PRE.has(b.status) && !b.assignedId && !b.specialist)
  const providerCancellations = bookings.filter((b) => b.status === 'cancelled' && b.cancelledBy === 'provider' && (b.cancelledAt || b.createdAtMs) >= now - 7 * DAY)

  // Immediate attention: one queue across sources, highest priority first.
  const name = (uid) => {
    const u = src.usersById.get(uid)
    return u?.displayName || u?.fullName || u?.businessName || null
  }
  const item = (o) => ({ ...o, market: o.country || '—', marketName: MARKETS[o.country]?.name || o.country || 'Unknown', waiting: waitingLabel(o.since, now), assignedTo: o.assignee?.email || o.assignee?.name || 'Unassigned' })
  const queue = [
    ...openSafety.map((s) => item({ id: `safety_report:${s.id}`, priority: sos.includes(s) ? 'critical' : 'high', issue: 'Safety Report', category: 'safety', country: s._country, entity: s.issueType || 'Safety report', status: 'New', action: 'Review', actionLink: `/safety/${s.id}`, since: millis(s.createdAt), assignee: assigneeOf('safety_report', s.id) })),
    ...openDisputes.map((d) => item({ id: `dispute:${d.id}`, priority: 'high', issue: 'Dispute', category: 'disputes', country: d._country, entity: d.bookingId ? `Booking ${d.bookingId}` : `Dispute ${d.id}`, status: 'Open', action: 'Review', actionLink: `/disputes/${d.id}`, since: millis(d.createdAt), assignee: assigneeOf('dispute', d.id) })),
    ...openWithdrawals.map((w) => item({ id: `withdrawal_request:${w.id}`, priority: lowerStatus(w.status) === 'manual_review' ? 'high' : 'normal', issue: 'Withdrawal Review', category: 'finance', country: w._country, entity: `${MARKETS[w._country]?.currency || 'KES'} ${Number(w.amount || 0).toLocaleString('en')}`, status: lowerStatus(w.status) === 'manual_review' ? 'Manual Review' : 'Pending', action: 'Review', actionLink: `/withdrawals/${w.id}`, since: millis(w.manualReviewAt || w.createdAt), assignee: assigneeOf('withdrawal_request', w.id) })),
    ...overdue.map((b) => item({ id: `booking:${b.id}`, priority: 'high', issue: 'Booking Not Started', category: 'bookings', country: b.countryCode, entity: `${b.service.name} • ${b.provider.name}`, status: b.status, action: 'Open', actionLink: `/bookings/${b.id}`, since: b.scheduledStart })),
    ...pendingVerification.map((v) => item({ id: `verification:${v.id}`, priority: 'normal', issue: 'Provider Verification', category: 'verification', country: v._country, entity: v.businessName || name(v.userId) || PROVIDER_TYPES[providerTypeOf(v.accountType)]?.label || 'Provider', status: 'Pending', action: 'Review', actionLink: `/verifications/review/${v.id}`, since: millis(v.submittedAt || v.createdAt) })),
  ]
  const RANK = { critical: 0, high: 1, normal: 2 }
  queue.sort((a, b) => RANK[a.priority] - RANK[b.priority] || (a.since || 0) - (b.since || 0))

  // Resolved today (recorded resolution timestamps only).
  const resolved = [
    ...withdrawals.filter((w) => ['completed', 'approved'].includes(lowerStatus(w.status))).map((w) => ({ id: `w-${w.id}`, title: `Withdrawal ${lowerStatus(w.status)}`, amount: `${MARKETS[w._country]?.currency || 'KES'} ${Number(w.amount || 0).toLocaleString('en')}`, market: w._country, at: millis(w.updatedAt || w.approvedAt || w.completedAt) })),
    ...verification.filter((v) => ['approved', 'rejected'].includes(lowerStatus(v.status))).map((v) => ({ id: `v-${v.id}`, title: `Verification ${lowerStatus(v.status)}`, entity: v.businessName || name(v.userId) || 'Provider', market: v._country, at: millis(v.updatedAt) })),
    ...support.filter((s) => lowerStatus(s.status) === 'closed').map((s) => ({ id: `s-${s.id}`, title: 'Support ticket closed', ticketId: s.subject || s.id, market: s._country, at: millis(s.updatedAt) })),
    ...disputes.filter((d) => !DISPUTE_OPEN.has(lowerStatus(d.status))).map((d) => ({ id: `d-${d.id}`, title: 'Dispute resolved', entity: d.bookingId ? `Booking ${d.bookingId}` : d.id, market: d._country, at: millis(d.resolvedAt || d.updatedAt) })),
  ].filter((r) => r.at)
  resolved.sort((a, b) => b.at - a.at)

  // Live activity (newest first).
  const activity = [
    ...bookings.filter((b) => b.createdAtMs).map((b) => ({ id: `b-${b.id}`, type: 'booking', title: `Booking ${b.status.replaceAll('_', ' ')}`, subtitle: b.service.name, country: b.countryCode, at: b.createdAtMs })),
    ...verification.map((v) => ({ id: `v-${v.id}`, type: 'verification', title: 'Verification submitted', subtitle: PROVIDER_TYPES[providerTypeOf(v.accountType)]?.label || (v.requestType ? String(v.requestType).replaceAll('_', ' ') : 'Provider'), country: v._country, at: millis(v.submittedAt || v.createdAt) })),
    ...withdrawals.map((w) => ({ id: `w-${w.id}`, type: 'withdrawal', title: 'Withdrawal submitted', subtitle: `${MARKETS[w._country]?.currency || 'KES'} ${Number(w.amount || 0).toLocaleString('en')}`, country: w._country, at: millis(w.createdAt) })),
    ...safety.map((s) => ({ id: `s-${s.id}`, type: 'safety', title: 'Safety report received', subtitle: s.issueType || 'Safety report', priority: SAFETY_OPEN.has(lowerStatus(s.status)) ? 'Needs review' : null, country: s._country, at: millis(s.createdAt) })),
    ...users.filter((u) => millis(u.createdAt)).map((u) => ({ id: `u-${u.id}`, type: providerTypeOf(u.accountType) ? 'provider' : 'client', title: providerTypeOf(u.accountType) ? 'Provider registration' : 'New client registration', subtitle: PROVIDER_TYPES[providerTypeOf(u.accountType)]?.label || 'Client', country: u.countryCodeResolved, at: millis(u.createdAt) })),
  ]
    .filter((a) => a.at)
    .sort((a, b) => b.at - a.at)
    .slice(0, 10)
    .map((a) => ({ ...a, meta: [MARKETS[a.country]?.name || a.country || 'Unknown', agoLabel(a.at, now)].join(' • ') }))

  const mine = queue.filter((q) => {
    const a = assignments.get(q.id)
    return a && adminUid && a.assignedTo?.uid === adminUid
  })

  return {
    summary: {
      critical: queue.filter((q) => q.priority === 'critical').length,
      high: queue.filter((q) => q.priority === 'high').length,
      awaitingAction: queue.length + pendingContent.length + pendingProfileUpdates.length + openSupport.length,
      inReview: queue.filter((q) => assignments.has(q.id)).length,
      resolvedToday: resolved.filter((r) => r.at >= startOfToday).length,
    },
    immediateAttention: queue.slice(0, 15),
    liveActivity: activity,
    bookingOperations: {
      newConflicts: conflicts.length,
      unassigned: unassigned.length,
      failedReschedules: null, // no reschedule-failure record exists yet
      providerCancellations: providerCancellations.length,
      guestIssues: bookings.filter((b) => b.guest?.conflictReason).length,
      awaitingIntervention: overdue.length,
    },
    financeOperations: {
      withdrawalsAwaitingApproval: openWithdrawals.length,
      paymentsPendingVerification: payments.filter((p) => !isPaid(p) && ['pending', 'processing', 'initiated'].includes(lowerStatus(p.status || p.paymentStatus))).length,
      escrowHolds: escrows.filter((e) => lowerStatus(e.status) === 'disputed').length,
      refundsAwaitingReview: bookings.filter((b) => b.refundStatus === 'pending' || b.refundStatus === 'requested').length,
      reconciliationExceptions: openSupportCases.filter((c) => /reconcil/i.test(c.type || '')).length,
    },
    verificationOperations: {
      providerVerification: pendingVerification.length,
      profilePhotos: pendingContent.filter((v) => lowerStatus(v.requestType) === 'profile_photo').length,
      galleryMedia: pendingContent.filter((v) => lowerStatus(v.requestType).startsWith('gallery')).length,
      profileChanges: pendingContent.filter((v) => lowerStatus(v.requestType) === 'profile_text_change').length + pendingProfileUpdates.length,
      credentials: pendingVerification.filter((v) => (v.professionalDocumentPaths || []).length > 0 || lowerStatus(v.professionalVerificationStatus) === 'pending').length,
      requestMoreInfo: src.informationRequests ? src.informationRequests.filter((r) => ['sent', 'awaiting_response', 'overdue'].includes(lowerStatus(r.status))).length : null,
    },
    trustSafetyOperations: {
      highPrioritySafety: sos.length,
      openDisputes: openDisputes.length,
      reportedReviews: null, // the app has no review-report records yet
      reportedMedia: null,
      suspendedAccounts: users.filter((u) => accountStatusOf(u.accountStatus) === 'suspended').length,
    },
    supportOperations: {
      openTickets: openSupport.length + openSupportCases.length,
      highPriority: openSupport.filter((s) => ['payment', 'safety'].includes(lowerStatus(s.category))).length,
      waitingOnLeInspa: openSupport.filter((s) => !s.assignedAdmin).length + openSupportCases.length,
      waitingOnUser: null, // tickets do not record whose turn it is
      slaBreachOverdue: [...openSupport, ...openSupportCases].filter((s) => millis(s.createdAt) && now - millis(s.createdAt) > DAY).length,
    },
    systemIntegrations: ['Payments', 'Booking Engine', 'Notifications', 'Maps', 'M-PESA', 'Email'].map((n) => ({ name: n, status: 'Not monitored', isDegraded: false })),
    assignedToMe: mine.slice(0, 8).map((q) => ({ id: q.id, type: q.category, title: q.issue, entity: q.entity, waiting: q.waiting, urgency: q.priority === 'normal' ? 'medium' : 'high', link: q.actionLink })),
    teamWorkload: [
      { team: 'Finance Team', count: openWithdrawals.length, link: '/withdrawals' },
      { team: 'Verification Team', count: pendingVerification.length + pendingContent.length + pendingProfileUpdates.length, link: '/verifications' },
      { team: 'Support Team', count: openSupport.length + openSupportCases.length, link: '/support' },
      { team: 'Safety Team', count: openSafety.length + openDisputes.length, link: '/safety' },
      { team: 'Operations Team', count: overdue.length + conflicts.length, link: '/bookings' },
    ],
    resolvedRecently: resolved.slice(0, 6).map((r) => ({ ...r, marketName: MARKETS[r.market]?.name || r.market || 'Unknown', time: agoLabel(r.at, now) })),
  }
}
