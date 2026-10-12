// Client Management (ADM-012, ADM-016 → ADM-019) — profile overview, membership,
// referrals & loyalty, support & safety history and account actions over the
// app's own records. Admin-only state lives in admin collections
// (account_restrictions, account_actions, admin_notes, membership_admin_events)
// and in clearly named admin flags on the user record the app must honour.
import { lowerStatus, millis } from './platformData.js'
import { DAY, iso, paginate, clientBlock, maskEmail, maskPhone } from './clientLogic.js'

const str = (...vs) => vs.find((v) => typeof v === 'string' && v.trim())?.trim() || null
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null)
const CAP = (s) => (s ? `${s[0].toUpperCase()}${s.slice(1)}` : s)
const sum = (list, f) => list.reduce((t, x) => t + (Number(f(x)) || 0), 0)

// ---------------------------------------------------------------- cases (support / dispute / safety)

export const UNRESOLVED = ['open', 'in_review', 'investigating', 'under_investigation']
const PRIORITY_RANK = { critical: 0, high: 1, normal: 2, low: 3 }

function ticketStatus(s) {
  const v = lowerStatus(s)
  if (['closed', 'resolved', 'done', 'completed'].includes(v)) return v === 'closed' ? 'closed' : 'resolved'
  if (['in_review', 'in_progress', 'pending', 'awaiting_client'].includes(v)) return 'in_review'
  return 'open'
}
const caseStatus = (s) => {
  const v = lowerStatus(s)
  if (['resolved', 'closed', 'dismissed', 'completed', 'cancelled'].includes(v)) return v === 'closed' ? 'closed' : 'resolved'
  if (['under_investigation', 'investigating', 'under_review', 'escalated'].includes(v)) return 'investigating'
  return 'open'
}

/** Every case involving the client, as one list of distinct case types. */
export function clientCases({ tickets = [], supportCases = [], disputes = [], safety = [] }, clientId) {
  const out = []
  for (const t of tickets) {
    const msgs = Array.isArray(t.messages) ? t.messages : []
    out.push({
      id: t.id, type: 'support', category: lowerStatus(t.category) || 'general', subject: str(t.subject) || 'Support request',
      openedAt: iso(millis(t.createdAt)), updatedAt: iso(millis(t.updatedAt)), priority: lowerStatus(t.priority) || (t.escalated ? 'high' : 'normal'), status: ticketStatus(t.status),
      assignedTo: str(t.assignedAdminName, t.assignedAdmin) || null, assignedTeam: t.assignedAdmin || t.assignedAdminName ? 'Support Team' : null,
      bookingId: str(t.bookingId), paymentId: str(t.paymentId), providerId: str(t.providerId), escalated: Boolean(t.escalated),
      description: str(t.description, t.message), messages: msgs, source: 'support_tickets',
    })
  }
  for (const c of supportCases) {
    out.push({
      id: c.id, type: 'support', category: lowerStatus(c.type) || 'general', subject: c.withdrawalRequestId ? 'Withdrawal support case' : CAP(String(c.type || 'Support case').replace(/_/g, ' ')),
      openedAt: iso(millis(c.createdAt)), updatedAt: iso(millis(c.updatedAt)), priority: 'normal', status: ticketStatus(c.status),
      assignedTo: null, assignedTeam: null, bookingId: null, paymentId: null, providerId: null, escalated: false, description: null, messages: [], source: 'support_cases',
      withdrawalRequestId: c.withdrawalRequestId || null,
    })
  }
  for (const d of disputes) {
    out.push({
      id: d.id, type: 'dispute', category: lowerStatus(d.type) || 'service', subject: str(d.reason, d.notes) || CAP(String(d.type || 'Dispute').replace(/_/g, ' ')),
      openedAt: iso(millis(d.createdAt)), priority: 'high', status: caseStatus(d.status), assignedTo: null, assignedTeam: 'Resolution Team',
      bookingId: str(d.bookingId), providerId: d.againstId === clientId ? str(d.reporterId) : str(d.againstId), role: d.reporterId === clientId ? 'raised' : 'against',
      amount: num(d.amount ?? d.escrowAmount), evidenceCount: Array.isArray(d.evidence) ? d.evidence.length : 0, raisedBy: str(d.raisedBy), source: 'disputes',
    })
  }
  for (const s of safety) {
    out.push({
      id: s.id, type: 'safety', category: lowerStatus(s.issueType) || 'safety', subject: str(s.issueType) || 'Safety report',
      openedAt: iso(millis(s.createdAt)), priority: /sos|emergency/i.test(s.issueType || '') ? 'critical' : 'high', status: caseStatus(s.status),
      assignedTo: null, assignedTeam: 'Trust & Safety Team', bookingId: str(s.bookingId), providerId: str(s.providerId), providerName: str(s.providerName), details: str(s.details), source: 'safety_reports',
    })
  }
  return out.sort((a, b) => (Date.parse(b.openedAt) || 0) - (Date.parse(a.openedAt) || 0))
}

const isOpen = (c) => UNRESOLVED.includes(c.status)
const caseRow = (c) => ({
  id: c.id, type: c.type, category: c.category, subject: c.subject, openedAt: c.openedAt, priority: c.priority, status: c.status,
  assignedTo: c.assignedTo, assignedTeam: c.assignedTeam,
  related: c.bookingId ? { kind: 'booking', id: c.bookingId, label: `Booking #${c.bookingId}` } : c.providerId ? { kind: 'provider', id: c.providerId, label: c.providerName || `Provider ${c.providerId}` } : null,
})

export function supportView({ client, cases, restrictions = [], actions = [], perms, params: p = {}, now = Date.now(), assignees = [] }) {
  const visible = cases.filter((c) => perms.safety || c.type !== 'safety')
  const count = (type) => visible.filter((c) => c.type === type).length
  const supportCases = visible.filter((c) => c.type === 'support')
  const openSafety = cases.filter((c) => c.type === 'safety' && isOpen(c)).length
  const active = restrictions.filter((x) => x.status === 'active')
  const needle = String(p.q || '').trim().toLowerCase()
  const inDate = (c) => {
    if (!p.date) return true
    const t = Date.parse(c.openedAt)
    if (!t) return false
    if (p.date === 'year') return new Date(t).getUTCFullYear() === new Date(now).getUTCFullYear()
    const days = { '30d': 30, '90d': 90, '7d': 7 }[p.date]
    return days ? now - t <= days * DAY : true
  }
  const rows = visible.filter((c) => {
    if (p.tab && p.tab !== 'all' && c.type !== p.tab) return false
    if (!inDate(c)) return false
    if (p.status && p.status !== 'all' && !(c.status === p.status || (p.status === 'investigating' && c.status === 'under_investigation'))) return false
    if (p.priority && c.priority !== p.priority) return false
    if (p.cat && c.category !== p.cat) return false
    if (p.assigned && c.assignedTo !== p.assigned) return false
    if (p.linked && !c.bookingId) return false
    return !needle || [c.id, c.subject, c.bookingId, c.providerId, c.paymentId].some((v) => String(v || '').toLowerCase().includes(needle))
  })
  const sorters = {
    newest: (a, b) => (Date.parse(b.openedAt) || 0) - (Date.parse(a.openedAt) || 0),
    oldest: (a, b) => (Date.parse(a.openedAt) || 0) - (Date.parse(b.openedAt) || 0),
    priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || (Date.parse(b.openedAt) || 0) - (Date.parse(a.openedAt) || 0),
  }
  const page = paginate([...rows].sort(sorters[p.sort] || sorters.newest), p, 10)
  const restrictionEvents = active.concat(restrictions.filter((x) => x.status !== 'active')).flatMap((x) => [
    { id: `${x.id}-a`, kind: 'restriction', label: 'Restriction Applied', ref: perms.safety ? x.related?.id || null : null, at: x.startedAt },
    ...(x.endedAt ? [{ id: `${x.id}-r`, kind: 'restriction', label: 'Restriction Removed', ref: perms.safety ? x.related?.id || null : null, at: x.endedAt }] : []),
  ])
  const resolvedEvents = visible.filter((c) => !isOpen(c) && c.updatedAt).map((c) => ({ id: `${c.id}-res`, kind: c.type, label: `${CAP(c.type)} ${c.status}`, ref: c.id, at: c.updatedAt }))
  return {
    client,
    summary: { support: supportCases.length, openCases: supportCases.filter(isOpen).length, disputes: count('dispute'), safety: perms.safety ? count('safety') : null, resolved: visible.filter((c) => !isOpen(c)).length },
    counts: { all: visible.length, support: count('support'), dispute: count('dispute'), safety: perms.safety ? count('safety') : null, report: 0 },
    attention: visible
      .filter((c) => (c.type === 'safety' || c.type === 'support') && isOpen(c))
      .sort((a, b) => (a.type === 'safety' ? -1 : 0) - (b.type === 'safety' ? -1 : 0) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
      .map((c) => ({ ...caseRow(c), severity: c.type === 'safety' ? 'critical' : 'warning' })),
    account: {
      status: client.status,
      restrictions: active.map((x) => ({ id: x.id, label: x.label, reason: perms.safety ? x.category : null, reference: perms.safety ? x.related?.id || null : null, kind: x.kind })),
      openInvestigations: perms.safety ? openSafety : null,
      riskReview: perms.safety ? (openSafety ? 'Safety review in progress' : active.some((x) => x.kind === 'review') ? 'Account under review' : 'No active review') : null,
    },
    safety: { restricted: !perms.safety, open: perms.safety ? openSafety : null },
    // The app records reports as safety_reports only; there is no separate client report record.
    reportsSubmitted: { items: [], total: 0 },
    reportsAbout: perms.safety ? { items: [], total: 0 } : null,
    outcomes: [...resolvedEvents, ...restrictionEvents].filter((e) => e.at).sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
    assignees,
    ...page,
    items: page.items.map(caseRow),
  }
}

export function supportCasePreview(c, { client, perms, booking = null, payment = null, notes = [], events = [] }) {
  const common = {
    id: c.id, type: c.type, category: c.category, subject: c.subject, status: c.status, priority: c.priority, openedAt: c.openedAt,
    assignedTo: c.assignedTo, assignedTeam: c.assignedTeam, client: { id: client.id, name: client.name }, timeZone: client.timeZone, currency: client.currency,
    related: { booking, payment: perms.finance ? payment : null, providerId: c.providerId || null },
  }
  const ev = (id, at, text) => (at ? { id, at, text } : null)
  if (c.type === 'support') {
    const conversation = [
      c.description ? { id: 'm0', from: 'client', author: client.name, text: c.description, at: c.openedAt } : null,
      ...c.messages.map((m, i) => ({
        id: m.id || `m${i + 1}`,
        from: /admin|support|agent|staff/i.test(String(m.senderType || m.from || m.sender || '')) ? 'admin' : 'client',
        author: str(m.senderName, m.author, m.sender) || 'Client',
        text: str(m.text, m.body, m.message) || '',
        at: iso(millis(m.timestamp ?? m.createdAt ?? m.at)),
      })),
    ].filter(Boolean)
    return {
      ...common,
      escalated: c.escalated,
      timeline: [ev('t1', c.openedAt, 'Client submitted support request'), ...events, ev('t9', !isOpen(c) ? c.updatedAt : null, 'Ticket closed')].filter(Boolean).sort((a, b) => Date.parse(a.at) - Date.parse(b.at)),
      conversation,
      notes,
      canReply: c.source === 'support_tickets',
    }
  }
  if (c.type === 'dispute') {
    return {
      ...common,
      dispute: { issue: c.subject, amount: perms.finance ? c.amount ?? null : undefined, escrow: null, submittedAt: c.openedAt, raisedBy: c.raisedBy, clientRole: c.role, evidenceCount: c.evidenceCount },
      timeline: [ev('d1', c.openedAt, `Dispute opened${c.raisedBy ? ` by ${c.raisedBy.replace(/_/g, ' ')}` : ''}`), ...events].filter(Boolean),
      notes,
    }
  }
  if (c.type === 'safety') {
    return {
      ...common,
      safety: { severity: CAP(c.priority), category: c.subject, reportingParty: null, reportedParty: null, evidenceStatus: null, investigator: 'Trust & Safety Team', actionsTaken: null, outcome: isOpen(c) ? 'Pending' : CAP(c.status), details: c.details },
      timeline: [ev('s1', c.openedAt, 'Safety report received'), ...events].filter(Boolean),
      notes,
    }
  }
  return { ...common, timeline: [] }
}

// ---------------------------------------------------------------- membership (ADM-016)

const PLAN = {
  standard: { id: 'plan_standard', tierId: 'standard', name: 'Standard', tagline: 'Pay-per-booking access', benefits: [] },
  premium: { id: 'plan_premium', tierId: 'premium', name: 'Premium Client', tagline: 'Premium membership', benefits: [] },
}
const JOURNEY = [
  { id: 'standard', label: 'Standard', caption: 'Basic access' },
  { id: 'premium', label: 'Premium', caption: 'Premium access' },
  { id: 'executive', label: 'Executive', caption: 'Not offered in the app' },
]
const tierOfPlan = (planName) => (/premium/i.test(planName || '') ? 'premium' : /exec/i.test(planName || '') ? 'executive' : 'standard')

/** Membership periods (subscriptions) → current record + history. */
export function membershipState(subs = [], payments = [], now = Date.now()) {
  const periods = subs
    .filter((s) => lowerStatus(s.status) !== 'superseded')
    .map((s) => ({ ...s, _start: millis(s.startDate) ?? millis(s.createdAt), _end: millis(s.endDate) }))
    .sort((a, b) => (b._start || 0) - (a._start || 0))
  const current = periods.find((s) => lowerStatus(s.status) === 'active' && (!s._end || s._end >= now)) || periods.find((s) => lowerStatus(s.status) === 'pending') || periods[0] || null
  const payFor = (s) => payments.find((p) => p.subscriptionId === s.id || p.id === s.paymentId || (s.paymentReference && p.transactionReference === s.paymentReference))
  const payStatus = (s) => {
    const p = payFor(s)
    if (p) return ['completed', 'successful', 'paid'].includes(lowerStatus(p.paymentStatus)) ? 'paid' : lowerStatus(p.paymentStatus) === 'failed' ? 'failed' : 'pending'
    if (s.paymentRequired === false || s.isTestEntitlement) return 'na'
    return lowerStatus(s.status) === 'pending' ? 'pending' : 'paid'
  }
  const history = periods.map((s) => {
    const live = s === current && (!s._end || s._end >= now)
    return {
      id: s.id, tierId: tierOfPlan(s.planName), name: s.planName || 'Membership', periodStart: iso(s._start), periodEnd: iso(s._end),
      amount: num(s.amountPaid ?? s.amount ?? s.price), currency: s.currency || 'USD',
      status: live ? (lowerStatus(s.status) === 'pending' ? 'pending' : lowerStatus(s.status)) : s._end && s._end < now ? (lowerStatus(s.status) === 'active' ? 'completed' : lowerStatus(s.status)) : lowerStatus(s.status),
      reason: s.grantReason ? 'Granted' : s.source === 'admin' ? 'Admin change' : 'Purchase', paymentId: payFor(s)?.id || s.paymentId || null, by: s.provisionedBy || s.source || 'App',
      test: Boolean(s.isTestEntitlement || s.testOnly),
    }
  })
  return { current, history, payStatus, payFor }
}

export function membershipView({ client, user = {}, subs, payments, settings = {}, perms, notes = [], events = [], now = Date.now() }) {
  const { current, history, payStatus, payFor } = membershipState(subs, payments, now)
  const live = current && (!millis(current.endDate) || millis(current.endDate) >= now)
  const tierId = current && live ? tierOfPlan(current.planName) : lowerStatus(user.membershipType) || 'standard'
  const statusRaw = current ? lowerStatus(current.status) : null
  const expired = current && !live
  const status = user.membershipSuspended ? 'suspended' : !current ? (tierId === 'standard' ? 'active' : 'expired') : expired ? 'expired' : statusRaw === 'pending' ? 'payment_pending' : 'active'
  const price = current ? num(current.amountPaid ?? current.amount ?? current.price) : null
  const catalogPrice = num(settings?.subscriptions?.client?.[tierId])
  const lastPay = current ? payFor(current) : null
  const membership = current
    ? {
        id: current.id, tierId, planId: PLAN[tierId]?.id || null, planName: current.planName || null, status,
        startedAt: iso(millis(history[history.length - 1]?.periodStart ? Date.parse(history[history.length - 1].periodStart) : null)),
        periodStart: iso(millis(current.startDate)), periodEnd: iso(millis(current.endDate)), renewalAt: current.autoRenew ? iso(millis(current.endDate)) : null,
        billing: CAP(current.billingCycle || 'monthly'), market: client.country, currency: current.currency || 'USD',
        price: perms.finance ? price ?? catalogPrice : undefined, autoRenew: current.autoRenew === true,
        paymentStatus: payStatus(current), accessStatus: status === 'active' ? 'enabled' : 'disabled',
        lastPayment: lastPay && perms.finance ? { status: ['completed', 'successful'].includes(lowerStatus(lastPay.paymentStatus)) ? 'successful' : lowerStatus(lastPay.paymentStatus), at: iso(millis(lastPay.paidAt) ?? millis(lastPay.createdAt)), paymentId: lastPay.id } : null,
        scheduledChange: current.pendingPlanName ? { tierId: tierOfPlan(current.pendingPlanName), name: current.pendingPlanName, effectiveAt: iso(millis(current.endDate)) } : null,
        test: Boolean(current.isTestEntitlement || current.testOnly),
      }
    : {
        id: null, tierId, planId: PLAN[tierId]?.id || null, planName: null, status, startedAt: iso(millis(user.createdAt)), periodStart: null, periodEnd: null, renewalAt: null,
        billing: 'None (free)', market: client.country, currency: null, price: perms.finance ? 0 : undefined, autoRenew: false, paymentStatus: 'na', accessStatus: user.accountDeactivated ? 'disabled' : 'enabled', lastPayment: null, scheduledChange: null,
      }
  const failed = payments.filter((p) => lowerStatus(p.paymentStatus) === 'failed').sort((a, b) => (millis(b.createdAt) || 0) - (millis(a.createdAt) || 0))[0]
  const paidTier = membership.tierId !== 'standard'
  const act = (id, enabled, why = null, extra = {}) => ({ id, enabled: perms.manageMembership && enabled, disabledReason: !perms.manageMembership ? 'You need membership-management permission.' : enabled ? null : why, ...extra })
  return {
    client: { ...client, membershipTier: membership.tierId },
    asOf: iso(now),
    membership,
    config: PLAN[membership.tierId] ? { ...PLAN[membership.tierId], catalogPrice: perms.finance ? catalogPrice : undefined, catalogCurrency: 'USD' } : null,
    journey: { tiers: JOURNEY, currentId: membership.tierId },
    upgrade: membership.tierId === 'standard' ? { eligible: true, tierId: 'premium', requiresApproval: false } : null,
    history: history.map((h) => (perms.finance ? h : { ...h, amount: undefined })),
    payments: perms.finance
      ? payments.slice(0, 8).map((p) => ({ id: p.id, createdAt: iso(millis(p.createdAt)), description: str(p.planName, p.plan) || 'Membership payment', method: p.paymentMethod ? { kind: lowerStatus(p.paymentMethod).includes('mpesa') ? 'mpesa' : 'other', label: String(p.paymentMethod).toUpperCase().replace('MPESA', 'M-PESA') } : null, amount: num(p.amount), status: ['completed', 'successful'].includes(lowerStatus(p.paymentStatus)) ? 'successful' : lowerStatus(p.paymentStatus), paymentId: p.id }))
      : [],
    failedRenewal: perms.finance && failed && membership.paymentStatus !== 'paid' ? { attemptedAt: iso(millis(failed.createdAt)), method: null, status: 'failed', reason: str(failed.failureReason), paymentId: failed.id, nextRetryAt: null } : null,
    events: events.slice(0, 8),
    notes,
    manage: {
      actions: [
        act('change_tier', membership.status !== 'suspended', 'Reactivate the membership before changing it.', {
          options: JOURNEY.map((t) => ({ tierId: t.id, label: t.label, current: t.id === membership.tierId, available: t.id !== membership.tierId && t.id !== 'executive', reason: t.id === 'executive' ? 'The Executive tier is not offered in the app' : null })),
        }),
        act('set_auto_renew', paidTier && Boolean(current) && status !== 'expired', 'Auto-renewal only applies to an active paid plan.', { current: membership.autoRenew }),
        act('extend', paidTier && Boolean(current) && status !== 'suspended', 'Only paid, non-suspended memberships can be extended.'),
        act('cancel_renewal', paidTier && membership.autoRenew && status === 'active', 'No upcoming renewal to cancel.'),
        act('reactivate', status === 'suspended' || status === 'expired', 'The membership is already active.'),
        act('correct_status', Boolean(current), 'There is no membership record to correct.', { statuses: ['active', 'suspended', 'expired'] }),
      ],
    },
  }
}

/** Validates a manual membership change and describes the writes. Never marks a payment paid. */
export function planMembershipChange({ view, action, payload = {}, reason, note, now = Date.now() }) {
  if (!reason || !String(reason).trim()) return { error: 'A reason is required for every manual membership change.' }
  if (reason === 'Other' && String(note || '').trim().length < 5) return { error: 'Please describe the reason in the internal note.' }
  const allowed = view.manage.actions.find((a) => a.id === action)
  if (!allowed) return { error: 'Unknown membership action.' }
  if (!allowed.enabled) return { error: allowed.disabledReason || 'This action is not available for this membership.', code: 'failed-precondition' }
  const m = view.membership
  const end = m.periodEnd ? Date.parse(m.periodEnd) : null
  if (action === 'change_tier') {
    const target = allowed.options.find((o) => o.tierId === payload.tierId)
    if (!target) return { error: 'Choose a membership to change to.' }
    if (!target.available) return { error: target.reason || 'This change is not allowed.' }
    if (payload.effective === 'end_of_period') {
      if (!m.id || !end) return { error: 'This membership has no billing period to wait for. Apply the change immediately.' }
      return { period: { pendingPlanName: target.tierId === 'premium' ? 'Premium Client' : 'Standard' }, event: `Scheduled change to ${target.label} at the end of the current period` }
    }
    if (target.tierId === 'standard') {
      return { period: m.id ? { status: 'cancelled', endDate: now, autoRenew: false } : null, user: { membershipType: 'standard', membershipStatus: null, membershipExpiryDate: null }, event: 'Changed membership to Standard' }
    }
    // Upgrade: a new pending period that the payment system must confirm.
    return { newPeriod: { planName: 'Premium Client', status: 'pending', startDate: now, endDate: now + 30 * DAY, paymentRequired: true }, period: m.id && m.status !== 'expired' ? { status: 'superseded', endDate: now } : null, event: 'Upgrade to Premium requested — awaiting payment' }
  }
  if (action === 'set_auto_renew') return { period: { autoRenew: Boolean(payload.enabled) }, event: `Auto-renewal turned ${payload.enabled ? 'on' : 'off'}` }
  if (action === 'cancel_renewal') return { period: { autoRenew: false }, event: 'Next renewal cancelled (access continues to the end of the paid period)' }
  if (action === 'extend') {
    const days = Number(payload.days)
    if (!Number.isInteger(days) || days < 1 || days > 31) return { error: 'Extension must be between 1 and 31 days.' }
    const newEnd = (end || now) + days * DAY
    return { period: { endDate: newEnd }, user: { membershipExpiryDate: newEnd }, event: `Membership extended by ${days} days (no payment recorded)` }
  }
  if (action === 'reactivate') {
    if (m.status === 'expired') return { error: 'An expired membership is renewed by a new payment in the app, not reactivated by an Admin.', code: 'failed-precondition' }
    return { user: { membershipSuspended: false, membershipStatus: 'active' }, event: 'Membership reactivated' }
  }
  if (action === 'correct_status') {
    if (!allowed.statuses.includes(payload.status)) return { error: 'Choose a valid membership status.' }
    if (payload.status === 'suspended') return { user: { membershipSuspended: true, membershipStatus: 'suspended' }, event: 'Membership status corrected to suspended' }
    if (payload.status === 'expired') return { period: { status: 'expired', endDate: Math.min(end || now, now), autoRenew: false }, user: { membershipStatus: 'expired' }, event: 'Membership status corrected to expired' }
    return { user: { membershipSuspended: false, membershipStatus: 'active' }, event: 'Membership status corrected to active' }
  }
  return { error: 'Unknown membership action.' }
}

// ---------------------------------------------------------------- referrals & loyalty (ADM-017)

/** Referral records: users who signed up with this client's id or code. */
export function referralRecords(referred = [], bookingsByClient = new Map()) {
  return referred.map((u) => {
    const done = (bookingsByClient.get(u.id) || []).filter((b) => b.status === 'completed')
    const status = done.length ? 'rewarded' : u.accountStatus && lowerStatus(u.accountStatus) !== 'pending' ? 'pending' : 'ineligible'
    return {
      id: u.id,
      client: { id: u.id, name: str(u.fullName, u.displayName) || 'Client', gender: null, photoURL: str(u.profilePhoto) || null },
      email: maskEmail(u.email),
      invitedAt: iso(millis(u.createdAt)),
      joinedAt: iso(millis(u.createdAt)),
      progress: done.length ? 'Completed booking' : status === 'pending' ? 'Registered' : 'No eligible activity yet',
      // The app records no referral reward, so "rewarded" here means the qualifying booking happened.
      status: done.length ? 'rewarded' : status,
      qualified: done.length > 0,
      rewardAmount: null,
      rewardId: null,
      rewardTxnId: null,
      bookingId: done[0]?.id || null,
      country: null,
    }
  })
}

export function loyaltyView({ client, user = {}, referrals, settings = {}, notes = [], now = Date.now() }) {
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0)
  const registered = referrals.filter((x) => x.status !== 'ineligible').length
  const qualified = referrals.filter((x) => x.qualified).length
  const stale = referrals.filter((x) => x.status === 'pending' && now - Date.parse(x.invitedAt) > 30 * DAY)
  return {
    client,
    referral: {
      program: { code: str(user.referralCode, user.shareableLink) || null, status: client.status === 'suspended' ? 'paused' : 'active' },
      rule: { id: 'first_completed_booking', label: 'Registration + first completed booking', activityLabel: 'First booking completed', commissionRate: num(settings.referralCommissionRate) },
      summary: { referred: referrals.length, successful: qualified, pending: referrals.filter((x) => x.status === 'pending').length, rewardsEarned: null },
      funnel: [
        { id: 'invited', label: 'Invited / Referred', count: referrals.length, conversion: null },
        { id: 'registered', label: 'Registered', count: registered, conversion: pct(registered, referrals.length) },
        { id: 'qualified', label: 'Qualified', count: qualified, conversion: pct(qualified, registered) },
        { id: 'rewarded', label: 'Rewarded', count: 0, conversion: null },
      ],
      referredBy: str(user.referredBy, user.referralCodeUsed),
    },
    // The app has no loyalty programme yet: no accounts, rules or reward records exist.
    loyalty: {
      status: 'not_configured',
      rule: null,
      progress: null,
      summary: { earned: null, redeemed: null, available: null, totalSavings: num(user.totalSavings) },
      activity: { items: [], total: 0 },
      rewards: { items: [], counts: { all: 0, referral: 0, loyalty: 0, redeemed: 0, expired: 0 } },
    },
    issues: stale.length ? [{ id: `ISS-${stale[0].id}`, type: 'referral_pending_long', title: 'Needs Review', text: `${stale.length} referral${stale.length === 1 ? '' : 's'} pending for more than 30 days`, referralId: stale[0].id }] : [],
    notes,
  }
}

export function queryReferrals(referrals, p = {}, { client, now = Date.now() }) {
  const tabs = { all: () => true, successful: (x) => x.status === 'rewarded', pending: (x) => x.status === 'pending', ineligible: (x) => x.status === 'ineligible' }
  const needle = String(p.q || '').trim().toLowerCase()
  const rows = referrals.filter((x) => {
    if (!(tabs[p.tab] || tabs.all)(x)) return false
    if (p.date) {
      const t = Date.parse(x.joinedAt)
      const days = { '7d': 7, '30d': 30, '90d': 90 }[p.date]
      if (p.date === 'year' ? new Date(t).getUTCFullYear() !== new Date(now).getUTCFullYear() : days && now - t > days * DAY) return false
    }
    if (p.rewarded && x.rewardAmount == null) return false
    return !needle || [x.id, x.client.name, x.email].some((v) => String(v || '').toLowerCase().includes(needle))
  })
  const sorters = { newest: (a, b) => Date.parse(b.joinedAt) - Date.parse(a.joinedAt), oldest: (a, b) => Date.parse(a.joinedAt) - Date.parse(b.joinedAt), reward_high: (a, b) => (b.rewardAmount || 0) - (a.rewardAmount || 0) }
  const page = paginate([...rows].sort(sorters[p.sort] || sorters.newest), p, 5)
  return {
    currency: client.currency,
    timeZone: client.timeZone,
    counts: { all: referrals.length, successful: referrals.filter((x) => x.status === 'rewarded').length, pending: referrals.filter((x) => x.status === 'pending').length, ineligible: referrals.filter((x) => x.status === 'ineligible').length },
    ...page,
    items: page.items.map((x) => ({ id: x.id, client: x.client, joinedAt: x.joinedAt, country: client.country, countryName: client.countryName, progress: x.progress, status: x.status, rewardAmount: x.rewardAmount, rewardId: x.rewardId })),
  }
}

// ---------------------------------------------------------------- account actions (ADM-019)

export const ACCOUNT_ACTIONS = {
  restrict_booking: { kind: 'booking', history: 'Booking Restriction', scope: 'Bookings', label: 'Booking Restriction' },
  restrict_messaging: { kind: 'messaging', history: 'Messaging Restriction', scope: 'Messages', label: 'Messaging Restriction' },
  restrict_payments: { kind: 'payments', history: 'Payment Restriction', scope: 'Payments', label: 'Payment Restriction' },
  request_info: { history: 'Information Requested', scope: 'Account' },
  send_warning: { history: 'Warning Issued', scope: 'Account' },
  place_review: { kind: 'review', history: 'Placed Under Review', scope: 'Account', label: 'Account Under Review' },
  suspend: { kind: 'suspension', history: 'Account Suspended', scope: 'Account', label: 'Account Suspension' },
  reactivate: { history: 'Account Reactivated', scope: 'Account' },
  deactivate: { history: 'Account Deactivated', scope: 'Account' },
  lift: { history: 'Restriction Removed', scope: 'Account' },
}
export const ACCOUNT_REASONS = {
  suspend: ['Safety Concern', 'Policy Violation', 'Fraud / Payment Review', 'Abusive Conduct', 'Account Security', 'Compliance Requirement', 'Other Approved Reason'],
  restrict: ['Payment investigation', 'Safety review', 'Policy Violation', 'Account Security', 'Compliance Requirement', 'Other Approved Reason'],
  deactivate: ['Client request', 'Policy Violation', 'Fraud confirmed', 'Compliance Requirement', 'Account inactivity', 'Other Approved Reason'],
  reactivate: ['Review completed — restriction no longer required.', 'Issue resolved with the client.', 'Suspension applied in error.', 'Compliance requirement satisfied.', 'Other Approved Reason'],
  lift: ['Investigation completed', 'Review completed — restriction no longer required.', 'Issue resolved with the client.', 'Applied in error.', 'Other Approved Reason'],
  send_warning: ['Professional conduct policy', 'Terms of Service', 'Cancellation policy', 'Payment policy', 'Other Approved Reason'],
  request_info: ['Verify identity', 'Update contact details', 'Confirm payment method', 'Provide supporting documents', 'Other Approved Reason'],
  place_review: ['Safety Concern', 'Fraud / Payment Review', 'Account Security', 'Policy Violation', 'Other Approved Reason'],
}
const reasonsFor = (action) => (action.startsWith('restrict_') ? ACCOUNT_REASONS.restrict : ACCOUNT_REASONS[action] || [])
export const DURATIONS = [
  { id: 'until_reviewed' }, { id: '24h', hours: 24 }, { id: '7d', hours: 168 }, { id: '30d', hours: 720 }, { id: 'custom' }, { id: 'indefinite', needs: 'superAdmin' },
]
const SCOPES = [{ id: 'booking', short: 'New Bookings' }, { id: 'messaging', short: 'Messaging' }, { id: 'wallet', short: 'Wallet', needs: 'finance' }, { id: 'membership', short: 'Membership benefits' }, { id: 'full', short: 'Full Account Access' }]
const OTHER = 'Other Approved Reason'

export function normalizeRestriction(id, x = {}) {
  return {
    id, kind: x.kind, label: x.label, scope: x.scope || [], scopeLabel: x.scopeLabel || null, startedAt: iso(millis(x.startedAt)), endsAt: iso(millis(x.endsAt)),
    durationId: x.durationId || 'until_reviewed', category: x.category || null, appliedBy: x.appliedByName || null, appliedByRole: x.appliedByRole || null,
    related: x.related || null, clientMessage: x.clientMessage || null, status: x.status === 'active' && millis(x.endsAt) && millis(x.endsAt) < Date.now() ? 'expired' : x.status, endedAt: iso(millis(x.endedAt)), historyId: x.historyId || null,
  }
}

export function accountPermitted({ status, restrictions, perms }) {
  const can = perms.manage
  const none = 'You need account-management permission for this action.'
  const has = (k) => restrictions.some((x) => x.kind === k)
  const suspended = status === 'suspended'
  const deactivated = status === 'deactivated'
  const gate = (ok, why) => ({ allowed: can && ok, reason: !can ? none : ok ? null : why })
  return {
    restrict_booking: gate(!deactivated && !has('booking'), deactivated ? 'The account is deactivated.' : 'That restriction is already active.'),
    restrict_messaging: gate(!deactivated && !has('messaging'), deactivated ? 'The account is deactivated.' : 'That restriction is already active.'),
    restrict_payments: { allowed: can && perms.finance && !deactivated && !has('payments'), reason: !can ? none : !perms.finance ? 'Only authorised Finance or Security roles can restrict payments / wallet.' : deactivated ? 'The account is deactivated.' : has('payments') ? 'That restriction is already active.' : null },
    request_info: gate(!deactivated, 'The account is deactivated.'),
    send_warning: gate(!deactivated, 'The account is deactivated.'),
    place_review: gate(!deactivated && !has('review'), deactivated ? 'The account is deactivated.' : 'A review is already active.'),
    suspend: gate(!suspended && !deactivated, suspended ? 'The account is already suspended.' : 'The account is deactivated.'),
    reactivate: gate(suspended || deactivated, 'Only available for suspended or deactivated accounts.'),
    deactivate: { allowed: can && perms.deactivate && !deactivated, reason: !can ? none : !perms.deactivate ? 'Deactivation needs the deactivate-accounts permission.' : 'The account is already deactivated.' },
  }
}

function accessFor(status, membership, active) {
  const access = { client: 'enabled', booking: 'enabled', payment: 'enabled', messaging: 'enabled' }
  let membershipLabel = membership === 'none' ? 'No membership' : `${CAP(membership)} — Active`
  for (const x of active) {
    if (x.kind === 'booking') access.booking = 'restricted'
    if (x.kind === 'messaging') access.messaging = 'restricted'
    if (x.kind === 'payments') access.payment = 'restricted'
    if (x.kind === 'suspension') {
      for (const s of x.scope) {
        if (s === 'booking') access.booking = 'suspended'
        if (s === 'messaging') access.messaging = 'suspended'
        if (s === 'wallet') access.payment = 'suspended'
        if (s === 'membership') membershipLabel = `${CAP(membership)} — Benefits paused`
        if (s === 'full') Object.keys(access).forEach((k) => (access[k] = 'suspended'))
      }
    }
  }
  if (status === 'deactivated') Object.keys(access).forEach((k) => (access[k] = 'disabled'))
  return { access, membership: membershipLabel }
}

export function accountView({ client, restrictions, actions, notifications, upcoming, cases, perms, now = Date.now() }) {
  const active = restrictions.filter((x) => x.status === 'active')
  const hide = (rel) => (rel && rel.type === 'safety' && !perms.safety ? { restricted: true, type: 'safety' } : rel)
  const view = (x) => ({
    ...x,
    expires: x.kind === 'review' ? 'Until review ends' : x.durationId === 'indefinite' ? 'Indefinite' : x.endsAt ? { at: x.endsAt } : 'Until reviewed',
    category: perms.safety || x.related?.type !== 'safety' ? x.category : null,
    related: hide(x.related),
    impact: x.kind === 'review' ? 'none' : 'access',
  })
  const { access, membership } = accessFor(client.status, client.membershipTier, active)
  const openCases = cases.filter((c) => UNRESOLVED.includes(c.status))
  return {
    asOf: iso(now),
    client,
    account: { status: client.status, access, membership, underReview: active.some((x) => x.kind === 'review'), restrictionCount: active.length, suspension: active.find((x) => x.kind === 'suspension') ? view(active.find((x) => x.kind === 'suspension')) : null },
    review: { safety: perms.safety ? openCases.filter((c) => c.type === 'safety').length : null, disputes: openCases.filter((c) => c.type === 'dispute').length, support: openCases.filter((c) => c.type === 'support').length, bookings: upcoming.length },
    bookings: upcoming.map((b) => ({ id: b.id, service: b.service, scheduledAt: b.scheduledAt, amount: perms.finance ? b.price : undefined })),
    bookingCount: upcoming.length,
    restrictions: active.map(view),
    history: actions.map((h) => ({ id: h.id, at: iso(millis(h.at ?? h.createdAt)), action: h.action, reason: h.reason, scope: h.scope, admin: h.adminName || 'Admin', status: h.status, detail: { ...(h.detail || {}), internalNote: perms.manage ? h.detail?.internalNote ?? null : null, related: hide(h.detail?.related || null) } })),
    notifications: notifications.map((n) => ({ id: n.id, at: iso(millis(n.createdAt)), message: str(n.title) || 'Notification', channel: n.channel || 'In-App', status: n.isRead || n.read ? 'read' : 'delivered', body: str(n.message, n.body) })),
    relatedCases: cases.filter((c) => perms.safety || c.type !== 'safety').slice(0, 10).map((c) => ({ id: c.id, type: c.type, label: `${CAP(c.type)} case ${c.id}`, status: CAP(c.status.replace(/_/g, ' ')) })),
    permitted: accountPermitted({ status: client.status, restrictions: active, perms }),
    config: {
      suspendReasons: ACCOUNT_REASONS.suspend, restrictReasons: ACCOUNT_REASONS.restrict, deactivateReasons: ACCOUNT_REASONS.deactivate, reactivateReasons: ACCOUNT_REASONS.reactivate, liftReasons: ACCOUNT_REASONS.lift,
      durations: DURATIONS.map((d) => ({ id: d.id, allowed: !d.needs || perms[d.needs] === true })),
      scopes: SCOPES.map((s) => ({ id: s.id, allowed: !s.needs || perms[s.needs] === true })),
    },
    securityVerification: { required: ['suspend', 'reactivate', 'deactivate', 'restrict_payments'] },
  }
}

/**
 * Validates an account action against the LATEST state and returns the writes:
 * { restriction?, closeRestrictions?, user?, history, notice, message }.
 * Never cancels bookings and never touches wallet funds.
 */
export function planAccountAction({ action, payload = {}, client, restrictions, cases, perms, upcomingCount = 0, now = Date.now() }) {
  const meta = ACCOUNT_ACTIONS[action]
  if (!meta) return { error: 'That action is not recognised.' }
  if (!perms.manage) return { error: 'You do not have permission to change this account.', code: 'permission-denied' }
  const active = restrictions.filter((x) => x.status === 'active')
  const permitted = accountPermitted({ status: client.status, restrictions: active, perms })
  if (action !== 'lift' && !permitted[action]?.allowed) return { error: permitted[action]?.reason || 'This action is not available right now.', code: 'failed-precondition' }
  const category = String(payload.category || '').trim()
  if (!category) return { error: 'Select a reason before continuing.' }
  if (!reasonsFor(action).includes(category)) return { error: 'That reason is not on the approved list.' }
  const internalNote = String(payload.internalNote || '').trim()
  if (category === OTHER && internalNote.length < 10) return { error: 'Add an internal note of at least 10 characters for this reason.' }
  const notify = payload.notify !== false
  const clientMessage = String(payload.clientMessage || '').trim()
  if (notify && !clientMessage) return { error: 'Add the message the client will receive, or turn client notification off.' }
  if (clientMessage.length > 400) return { error: 'The client message can be at most 400 characters.' }
  const related = payload.relatedId ? cases.find((c) => c.id === payload.relatedId) : null
  if (payload.relatedId && !related) return { error: 'That related case does not belong to this client.' }
  if (related?.type === 'safety' && !perms.safety) return { error: 'You do not have access to that safety case.', code: 'permission-denied' }
  const rel = related ? { id: related.id, type: related.type } : null

  const duration = () => {
    const id = payload.duration || 'until_reviewed'
    const d = DURATIONS.find((x) => x.id === id)
    if (!d) return { error: 'Select a valid duration.' }
    if (d.needs && perms[d.needs] !== true) return { error: 'Indefinite restrictions need a higher permission level.' }
    if (id === 'custom') {
      const days = Number(payload.customDays)
      if (!Number.isInteger(days) || days < 1 || days > 365) return { error: 'Enter a custom duration between 1 and 365 days.' }
      return { durationId: id, label: `${days} ${days === 1 ? 'day' : 'days'}`, endsAt: now + days * DAY }
    }
    return { durationId: id, label: { until_reviewed: 'Until reviewed', '24h': '24 hours', '7d': '7 days', '30d': '30 days', indefinite: 'Indefinite' }[id], endsAt: d.hours ? now + d.hours * 3_600_000 : null }
  }
  const detail = (extra = {}) => ({ category, durationLabel: null, clientMessage: notify ? clientMessage : null, internalNote: internalNote || null, related: rel, notified: notify, ...extra })
  const base = { notice: notify ? { title: meta.history, message: clientMessage } : null }

  if (['restrict_booking', 'restrict_messaging', 'restrict_payments'].includes(action)) {
    const dur = duration()
    if (dur.error) return dur
    return {
      ...base,
      restriction: { kind: meta.kind, label: meta.label, scope: [meta.kind === 'payments' ? 'wallet' : meta.kind], scopeLabel: meta.scope, startedAt: now, endsAt: dur.endsAt, durationId: dur.durationId, category, related: rel, clientMessage: notify ? clientMessage : null, internalNote, status: 'active' },
      history: { action: meta.history, reason: category, scope: meta.scope, status: 'active', detail: detail({ durationLabel: dur.label }) },
      message: `${meta.history} applied. Existing bookings are unchanged.`,
      bookingsAffected: 0,
    }
  }
  if (action === 'place_review') {
    return {
      ...base,
      restriction: { kind: 'review', label: meta.label, scope: [], scopeLabel: 'Account', startedAt: now, endsAt: null, durationId: 'until_reviewed', category, related: rel, clientMessage: notify ? clientMessage : null, internalNote, status: 'active' },
      history: { action: meta.history, reason: category, scope: 'Account', status: 'active', detail: detail() },
      message: 'Account placed under review. Access is not affected.',
    }
  }
  if (action === 'suspend') {
    let scope = Array.isArray(payload.scope) ? payload.scope.filter((s) => SCOPES.some((x) => x.id === s)) : []
    if (!scope.length) return { error: 'Choose what should be restricted. Use the smallest appropriate restriction.' }
    if (scope.includes('wallet') && !perms.finance) return { error: 'Restricting wallet / financial actions needs Finance permission.' }
    if (scope.includes('full')) scope = ['full']
    const dur = duration()
    if (dur.error) return dur
    const label = scope.map((id) => SCOPES.find((s) => s.id === id)?.short || id).join(' + ')
    return {
      ...base,
      restriction: { kind: 'suspension', label: meta.label, scope, scopeLabel: label, startedAt: now, endsAt: dur.endsAt, durationId: dur.durationId, category, related: rel, clientMessage: notify ? clientMessage : null, internalNote, status: 'active' },
      user: { accountStatus: 'suspended' },
      history: { action: meta.history, reason: category, scope: label, status: 'active', detail: detail({ durationLabel: dur.label }) },
      message: `Account suspended (${label}).${upcomingCount ? ` ${upcomingCount} upcoming booking${upcomingCount > 1 ? 's were' : ' was'} not cancelled — review them separately.` : ''}`,
      bookingsAffected: upcomingCount,
    }
  }
  if (action === 'reactivate') {
    return {
      ...base,
      closeRestrictions: active.filter((x) => x.kind === 'suspension').map((x) => x.id),
      closeHistory: client.status === 'deactivated' ? 'Account Deactivated' : null,
      user: { accountStatus: 'active', accountDeactivated: false },
      history: { action: meta.history, reason: category, scope: 'Account', status: 'completed', detail: detail() },
      message: 'Account reactivated. The suspension is closed in history, not deleted.',
    }
  }
  if (action === 'deactivate') {
    return {
      ...base,
      user: { accountDeactivated: true, accountStatus: 'suspended' },
      history: { action: meta.history, reason: category, scope: 'Account', status: 'active', detail: detail() },
      message: `Account deactivated. Historical records are preserved.${upcomingCount ? ' Existing bookings still need separate review.' : ''}`,
      bookingsAffected: upcomingCount,
    }
  }
  if (action === 'lift') {
    const target = active.find((x) => x.id === payload.restrictionId)
    if (!target) return { error: 'That restriction is no longer active. Refresh to see the latest state.', code: 'failed-precondition' }
    if (target.kind === 'payments' && !perms.finance) return { error: 'Only Finance-permitted roles can lift a payment restriction.' }
    const stillSuspended = target.kind === 'suspension' ? active.some((x) => x.kind === 'suspension' && x.id !== target.id) : null
    return {
      ...base,
      closeRestrictions: [target.id],
      user: target.kind === 'suspension' && !stillSuspended ? { accountStatus: 'active' } : null,
      history: { action: target.kind === 'review' ? 'Review Ended' : 'Restriction Removed', reason: category, scope: target.scopeLabel || 'Account', status: 'completed', detail: detail() },
      message: `${target.label} ended. The original record is kept in history.`,
    }
  }
  return {
    ...base,
    history: { action: meta.history, reason: category, scope: 'Account', status: 'completed', detail: detail() },
    message: action === 'send_warning' ? 'Warning issued and recorded.' : 'Information request sent to the client.',
  }
}

/** Restriction flags the client app must honour, derived from the active restrictions. */
export function restrictionFlags(active) {
  const kinds = new Set(active.map((x) => x.kind))
  const scopes = new Set(active.filter((x) => x.kind === 'suspension').flatMap((x) => x.scope))
  const full = scopes.has('full')
  return {
    'adminRestrictions.booking': kinds.has('booking') || scopes.has('booking') || full,
    'adminRestrictions.messaging': kinds.has('messaging') || scopes.has('messaging') || full,
    'adminRestrictions.payments': kinds.has('payments') || scopes.has('wallet') || full,
    'adminRestrictions.membership': scopes.has('membership') || full,
    'adminRestrictions.underReview': kinds.has('review'),
  }
}

// ---------------------------------------------------------------- profile overview (ADM-012)

export function profileView({ c, now = Date.now(), bookings, payments, wallet, walletRows, membership, cases, restrictions, referralsCount, activity, perms }) {
  const client = clientBlock(c, now)
  const completed = bookings.filter((b) => b.status === 'completed')
  const openCases = cases.filter((x) => UNRESOLVED.includes(x.status))
  const tickets = openCases.filter((x) => x.type === 'support').length
  const disputes = openCases.filter((x) => x.type === 'dispute').length
  const safety = cases.filter((x) => x.type === 'safety' && UNRESOLVED.includes(x.status)).length
  const active = restrictions.filter((x) => x.status === 'active')
  const alerts = []
  if (c.status === 'suspended') alerts.push({ id: 'suspended', level: 'danger', title: 'Account Suspended', text: 'Access is limited by an active suspension. History is retained.' })
  if (c.status === 'deactivated') alerts.push({ id: 'deactivated', level: 'danger', title: 'Account Deactivated', text: 'The account is disabled. History is retained.' })
  if (safety && perms.safety) alerts.push({ id: 'safety', level: 'danger', title: 'Open Safety Review', text: `${safety} safety report${safety > 1 ? 's' : ''} awaiting review.`, restricted: 'safety' })
  const failedPay = payments.filter((p) => p.status === 'failed' && now - Date.parse(p.createdAt) < 30 * DAY).length
  if (failedPay && perms.finance) alerts.push({ id: 'payment', level: 'warning', title: 'Failed Payment', text: `${failedPay} payment${failedPay > 1 ? 's' : ''} failed in the last 30 days.`, restricted: 'finance' })
  if (disputes) alerts.push({ id: 'dispute', level: 'warning', title: 'Open Dispute', text: 'A booking dispute is awaiting resolution.' })
  const latest = cases.find((x) => x.type === 'support')
  const done = walletRows.filter((t) => t.status === 'completed')
  return {
    ...client,
    vip: false,
    membershipTier: membership.tierId,
    registrationLabel: 'Mobile App',
    email: maskEmail(c.email),
    phone: maskPhone(c.phone),
    stats: {
      totalBookings: bookings.length,
      completed: completed.length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      openIssues: tickets + disputes,
      issuesLabel: tickets ? `${tickets} support ticket${tickets > 1 ? 's' : ''}` : disputes ? `${disputes} open dispute${disputes > 1 ? 's' : ''}` : 'No open issues',
      bookingsDelta: null,
      lifetimeValue: perms.finance ? sum(completed, (b) => b.price) : null,
      lifetimeDelta: null,
    },
    membership: {
      tier: membership.tierId, name: membership.planName || CAP(membership.tierId), description: membership.tierId === 'premium' ? 'Premium Client membership' : 'Pay-per-booking access',
      status: membership.status, since: membership.startedAt, nextRenewal: membership.renewalAt, monthlyFee: perms.finance ? membership.price ?? null : null, autoRenew: membership.autoRenew,
    },
    recentBookings: bookings.slice(0, 3).map((b) => ({ id: b.id, service: b.service, venue: b.provider, scheduledAt: b.scheduledAt, status: b.status, amount: perms.finance ? b.price : null, image: b.image })),
    recentPayments: perms.finance ? payments.slice(0, 4).map((p) => ({ id: p.id, createdAt: p.createdAt, amount: p.amount, status: p.status, kind: p.method?.label || p.typeLabel, category: p.type === 'membership' ? 'subscription' : p.type })) : [],
    paymentCount: payments.filter((p) => p.status === 'successful').length,
    wallet: perms.finance
      ? { balance: num(wallet?.balance) ?? num(wallet?.availableBalance), credits: sum(done.filter((t) => t.direction === 'credit'), (t) => t.amount), debits: sum(done.filter((t) => t.direction === 'debit'), (t) => t.amount), pendingRefund: sum(walletRows.filter((t) => t.status === 'pending' && t.type === 'refund'), (t) => t.amount) }
      : null,
    referrals: { code: null, referredBy: c.referredBy || c.referralCodeUsed || null, successful: referralsCount, loyaltyStatus: 'not_configured', totalSavings: c.totalSavings },
    support: { openTickets: tickets, openDisputes: disputes, safetyReports: perms.safety ? safety : null, latest: latest ? { id: latest.id, subject: latest.subject, createdAt: latest.openedAt, status: latest.status } : null },
    activity: activity.slice(0, 5).map((a) => ({ id: a.id, type: a.type, at: a.at, text: a.title })),
    account: {
      type: 'Client (Customer)',
      riskLevel: c.status === 'suspended' || (safety && perms.safety) ? 'High' : failedPay || disputes || active.length ? 'Medium' : 'Low',
      restrictions: active.length ? active.map((x) => x.label).join(', ') : 'None',
      alerts,
    },
  }
}
