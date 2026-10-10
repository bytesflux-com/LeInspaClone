// Demo data for ADM-018 (Client Support & Safety History). Used only while the
// `adminGetClientSupport` / `adminGetSupportCasePreview` Cloud Functions are not deployed.
//
// There is NO "admin client support history" record: the shapes below mirror what the real
// `support_tickets`, `disputes`, `safety_reports`, report records, restriction records and
// case-event records would produce when aggregated for one client. Case types stay distinct
// (Support ≠ Dispute ≠ Safety ≠ Report) and every case keeps its source relationships
// (clientId / bookingId / paymentId / providerId / reportId). CL-78421 mirrors the mockup.
//
// Rules the backend (and therefore this mock) follows:
//  • Safety data requires stronger permission — without it, safety cases are omitted entirely
//    (no rows, no counts) and the safety card says it is restricted.
//  • Opening a safety case is recorded as sensitive access.
//  • Internal notes and client conversation are returned separately.
//  • A report is an allegation, not proof — nothing is punished automatically.
//  • Historical cases are never deleted; restrictions applied/removed are both kept.
import { MOCK_CURRENCY, DAY_MS } from './clientDirectoryMock'
import { buildClientProfile, PROFILE_AS_OF } from './clientProfileMock'
import { PRIORITY_RANK, UNRESOLVED } from '../../constants/clientSupport'

const FX = { KE: 1, UG: 28, TZ: 19, RW: 10, ZA: 0.14 }
const hashOf = (text) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
const at = (y, m, d, hh, mm, tz = 3) => new Date(Date.UTC(y, m - 1, d, hh - tz, mm)).toISOString()
const iso = (ms) => new Date(ms).toISOString()
const plus = (isoString, minutes) => iso(new Date(isoString).getTime() + minutes * 60_000)

// Sensitive-case access log (the real backend writes to `audit_logs`).
export const SENSITIVE_ACCESS_LOG = []

// Mutations made from the drawer live here for the demo session (real: support_tickets + case events).
const overlay = new Map()
const slot = (clientId, caseId) => {
  const key = `${clientId}:${caseId}`
  if (!overlay.has(key)) overlay.set(key, { messages: [], notes: [], events: [], assignee: null, escalated: false })
  return overlay.get(key)
}

const SUPPORT_SUBJECTS = [
  ['Payment not reflected', 'payment'],
  ['Refund enquiry', 'refund'],
  ['Unable to book', 'booking'],
  ['Account access issue', 'account'],
  ['Wallet top up issue', 'payment'],
  ['App bug report', 'technical'],
]
const AGENTS = ['Jane', 'Peter', 'Mary', 'John', 'Tom']
const CLIENT_MESSAGE = {
  payment: 'My payment went through but the booking is not showing.',
  refund: 'I cancelled my booking and would like to know when my refund will arrive.',
  booking: 'I tried to book a session but the app would not let me continue.',
  account: 'I cannot sign in to my account even after resetting my password.',
  technical: 'The app closes unexpectedly when I open my bookings.',
}

const agentOf = (name) => ({ assignedTo: name, assignedTeam: 'Support Team' })

// ---------- case records ----------

function seededCases() {
  const c = (o) => ({ clientId: 'CL-78421', priority: 'normal', ...o })
  return {
    cases: [
      c({ id: 'SUP-4812', type: 'support', category: 'payment', subject: 'Payment not reflected', bookingId: 'LI-48291', service: 'Deep Tissue Massage', paymentId: 'PAY-92841', openedAt: at(2026, 9, 12, 10, 24), status: 'in_review', ...agentOf('Jane') }),
      c({ id: 'DSP-3918', type: 'dispute', category: 'service', subject: 'Service disagreement', bookingId: 'LI-47182', service: 'Hot Stone Massage', openedAt: at(2026, 9, 4, 9, 40), priority: 'high', status: 'investigating', assignedTo: 'Resolution Team', assignedTeam: 'Safety & Resolution Team' }),
      c({ id: 'SUP-3721', type: 'support', category: 'refund', subject: 'Refund enquiry', bookingId: 'LI-46021', service: 'Swedish Massage', openedAt: at(2026, 9, 2, 17, 5), status: 'resolved', ...agentOf('Peter') }),
      c({ id: 'RPT-19281', type: 'report', category: 'conduct', subject: 'Provider conduct', providerId: 'PR-2210', providerName: 'Serenity Wellness Spa', openedAt: at(2026, 8, 28, 11, 15), status: 'resolved', assignedTo: 'Safety Team', assignedTeam: 'Safety Team' }),
      c({ id: 'SUP-2891', type: 'support', category: 'booking', subject: 'Unable to book', openedAt: at(2026, 8, 15, 14, 2), priority: 'low', status: 'resolved', ...agentOf('Mary') }),
      c({ id: 'SUP-1884', type: 'support', category: 'account', subject: 'Account access issue', openedAt: at(2026, 8, 7, 9, 30), status: 'resolved', ...agentOf('John') }),
      c({ id: 'SUP-1120', type: 'support', category: 'payment', subject: 'Wallet top up issue', openedAt: at(2026, 7, 21, 16, 48), priority: 'low', status: 'resolved', ...agentOf('Jane') }),
      c({ id: 'SUP-0987', type: 'support', category: 'technical', subject: 'App bug report', openedAt: at(2026, 7, 10, 12, 10), priority: 'low', status: 'resolved', ...agentOf('Tom') }),
    ],
    reportsSubmitted: [
      { id: 'RPT-19281', kind: 'Provider Report', providerId: 'PR-2210', reason: 'Professional Conduct', submittedAt: at(2026, 8, 28, 11, 15), status: 'resolved' },
      { id: 'RPT-16322', kind: 'Provider Report', providerId: 'PR-1881', reason: 'Service Quality', submittedAt: at(2026, 6, 12, 15, 40), status: 'resolved' },
    ],
    reportsAbout: [],
    restrictions: [],
    outcomes: [
      { id: 'o1', kind: 'support', label: 'Support Issue Resolved', at: at(2026, 9, 2, 18, 30) },
      { id: 'o2', kind: 'refund', label: 'Refund Processed', at: at(2026, 9, 2, 18, 40) },
      { id: 'o3', kind: 'dispute', label: 'Dispute Closed', at: at(2026, 8, 20, 12, 0) },
      { id: 'o4', kind: 'report', label: 'Report Reviewed', at: at(2026, 8, 28, 15, 0) },
      { id: 'o5', kind: 'support', label: 'Support Issue Resolved', at: at(2026, 8, 15, 16, 0) },
      { id: 'o6', kind: 'support', label: 'Support Issue Resolved', at: at(2026, 8, 7, 11, 0) },
    ],
  }
}

function generatedCases(r, fx) {
  const seed = hashOf(r.id)
  const cases = []
  const reportsSubmitted = []
  const reportsAbout = []
  const restrictions = []
  const outcomes = []
  const base = { clientId: r.id, priority: 'normal' }
  const bookingRef = (n) => ({ bookingId: `LI-${40000 + ((seed + n * 211) % 9000)}`, service: 'Wellness Session' })

  // Open support tickets.
  for (let i = 0; i < r.supportTickets; i += 1) {
    const [subject, category] = r.paymentIssue && i === 0 ? SUPPORT_SUBJECTS[0] : SUPPORT_SUBJECTS[(seed + i) % SUPPORT_SUBJECTS.length]
    cases.push({
      ...base, id: `SUP-${4000 + ((seed + i * 17) % 900)}`, type: 'support', category, subject,
      ...bookingRef(i), paymentId: category === 'payment' ? `PAY-${20000 + ((seed + i) % 70000)}` : null, payAmount: Math.round(3500 * fx),
      openedAt: iso(PROFILE_AS_OF - (3 + i * 2) * DAY_MS), status: 'in_review', ...agentOf(AGENTS[(seed + i) % AGENTS.length]),
    })
  }
  // Open dispute.
  if (r.openDisputes) {
    cases.push({
      ...base, id: `DSP-${3000 + (seed % 900)}`, type: 'dispute', category: 'service', subject: 'Service disagreement', ...bookingRef(7),
      disputeAmount: Math.round(4200 * fx), openedAt: iso(PROFILE_AS_OF - 6 * DAY_MS), priority: 'high', status: 'investigating',
      assignedTo: 'Resolution Team', assignedTeam: 'Safety & Resolution Team',
    })
  }
  // Open safety case (only visible with safety permission — filtered in `visible`).
  if (r.safetyCase) {
    cases.push({
      ...base, id: `SAF-${2000 + (seed % 900)}`, type: 'safety', category: 'safety', subject: 'Professional / Personal Safety', ...bookingRef(3),
      openedAt: iso(PROFILE_AS_OF - 4 * DAY_MS), priority: 'high', status: 'under_investigation',
      assignedTo: 'Trust & Safety Team', assignedTeam: 'Trust & Safety Team',
    })
    reportsAbout.push({ id: `RPT-${15000 + (seed % 900)}`, category: 'Professional / Personal Safety', date: iso(PROFILE_AS_OF - 4 * DAY_MS), status: 'investigating', outcome: 'Pending' })
    restrictions.push({ id: 'RST-1', kind: 'booking', label: 'Booking Restricted', reason: 'New bookings paused while a safety review is completed.', reference: `SAF-${2000 + (seed % 900)}`, appliedAt: iso(PROFILE_AS_OF - 4 * DAY_MS), removedAt: null })
  }
  // Resolved history.
  const resolved = r.bookings ? Math.min(4, 1 + (seed % 4)) : 0
  for (let i = 0; i < resolved; i += 1) {
    const [subject, category] = SUPPORT_SUBJECTS[(seed + i + 2) % SUPPORT_SUBJECTS.length]
    const opened = PROFILE_AS_OF - (30 + i * 23) * DAY_MS
    const withBooking = ['payment', 'refund'].includes(category)
    cases.push({
      ...base, id: `SUP-${1000 + ((seed + i * 311) % 2900)}`, type: 'support', category, subject, priority: i % 2 ? 'low' : 'normal',
      ...(withBooking ? bookingRef(10 + i) : {}), openedAt: iso(opened), status: 'resolved', ...agentOf(AGENTS[(seed + i + 1) % AGENTS.length]),
    })
    outcomes.push({ id: `o${i}`, kind: category === 'refund' ? 'refund' : 'support', label: category === 'refund' ? 'Refund Processed' : 'Support Issue Resolved', at: iso(opened + 4 * 3_600_000) })
  }
  // One historical report submitted by the client.
  if (r.bookings > 1 && seed % 3 === 0) {
    const id = `RPT-${12000 + (seed % 5000)}`
    const when = iso(PROFILE_AS_OF - 41 * DAY_MS)
    reportsSubmitted.push({ id, kind: 'Provider Report', providerId: `PR-${1000 + (seed % 3000)}`, reason: 'Service Quality', submittedAt: when, status: 'resolved' })
    cases.push({ ...base, id, type: 'report', category: 'conduct', subject: 'Provider conduct', providerId: `PR-${1000 + (seed % 3000)}`, openedAt: when, status: 'resolved', assignedTo: 'Safety Team', assignedTeam: 'Safety Team' })
    outcomes.push({ id: 'or', kind: 'report', label: 'Report Reviewed', at: plus(when, 240) })
  }
  if (r.status === 'suspended') {
    restrictions.push({ id: 'RST-S', kind: 'account', label: 'Account Suspended', reason: 'Suspended by an Admin after a policy review.', reference: 'ADM-019', appliedAt: iso(PROFILE_AS_OF - 12 * DAY_MS), removedAt: null })
  }
  return { cases, reportsSubmitted, reportsAbout, restrictions, outcomes }
}

function source(r) {
  const fx = FX[r.country] || 1
  return r.id === 'CL-78421' ? seededCases() : generatedCases(r, fx)
}

function clientBlock(profile, r) {
  return {
    id: profile.id, name: profile.name, photoURL: profile.photoURL, gender: profile.gender, membershipTier: profile.membershipTier,
    status: profile.status, contactVerified: profile.contactVerified, country: profile.country, countryName: profile.countryName,
    city: profile.city, joinedAt: profile.joinedAt, lastActiveAt: profile.lastActiveAt, asOf: profile.asOf, timeZone: profile.timeZone,
    currency: MOCK_CURRENCY[r.country] || profile.currency || 'USD',
  }
}

// Case rows with admin mutations applied (assignment / escalation) and safety filtered by permission.
function visibleCases(r, perms) {
  const src = source(r)
  const cases = src.cases
    .filter((c) => perms.safety || c.type !== 'safety')
    .map((c) => {
      const o = overlay.get(`${r.id}:${c.id}`)
      if (!o) return c
      return { ...c, origAssignedTo: c.assignedTo, assignedTo: o.assignee?.name || c.assignedTo, assignedTeam: o.assignee?.team || c.assignedTeam, priority: o.escalated ? 'high' : c.priority }
    })
  return { ...src, cases }
}

const toRow = (c) => ({
  id: c.id, type: c.type, category: c.category, subject: c.subject, openedAt: c.openedAt, priority: c.priority, status: c.status,
  assignedTo: c.assignedTo, assignedTeam: c.assignedTeam,
  related: c.bookingId ? { kind: 'booking', id: c.bookingId, label: `Booking #${c.bookingId}` } : c.providerId ? { kind: 'provider', id: c.providerId, label: `Provider #${c.providerId}` } : null,
})

// ---------- list / overview ----------

function matchesDate(c, date, asOf) {
  if (!date) return true
  const age = (new Date(asOf).getTime() - new Date(c.openedAt).getTime()) / DAY_MS
  if (date === '30d') return age <= 30
  if (date === '90d') return age <= 90
  if (date === 'year') return new Date(c.openedAt).getUTCFullYear() === new Date(asOf).getUTCFullYear()
  return true
}

const SORTERS = {
  newest: (a, b) => new Date(b.openedAt) - new Date(a.openedAt),
  oldest: (a, b) => new Date(a.openedAt) - new Date(b.openedAt),
  priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || new Date(b.openedAt) - new Date(a.openedAt),
}

const isOpen = (c) => UNRESOLVED.includes(c.status)

export function queryClientSupport(r, p = {}, perms = {}) {
  const profile = buildClientProfile(r)
  const client = clientBlock(profile, r)
  const data = visibleCases(r, perms)
  const all = data.cases.filter((c) => c.listed !== false)

  // Safety is a separate, restricted section: counts come back null when the role cannot see it.
  const count = (type) => all.filter((c) => c.type === type).length
  const supportCases = all.filter((c) => c.type === 'support')
  const summary = {
    support: supportCases.length,
    openCases: supportCases.filter(isOpen).length,
    disputes: count('dispute'),
    safety: perms.safety ? count('safety') : null,
    resolved: all.filter((c) => !isOpen(c)).length,
  }
  const counts = { all: all.length, support: count('support'), dispute: count('dispute'), safety: perms.safety ? count('safety') : null, report: count('report') }

  // Needs attention: an open safety case outranks any ordinary support issue.
  const attention = all
    .filter((c) => (c.type === 'safety' || c.type === 'support') && isOpen(c))
    .sort((a, b) => (a.type === 'safety' ? -1 : 0) - (b.type === 'safety' ? -1 : 0) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || new Date(a.openedAt) - new Date(b.openedAt))
    .map((c) => ({ ...toRow(c), severity: c.type === 'safety' ? 'critical' : 'warning' }))

  const openSafety = all.filter((c) => c.type === 'safety' && isOpen(c)).length
  const restrictions = data.restrictions.map((x) => (perms.safety ? x : { ...x, reason: null }))
  const active = restrictions.filter((x) => !x.removedAt)
  const account = {
    status: client.status,
    restrictions: active.map((x) => ({ id: x.id, label: x.label, reason: x.reason, reference: perms.safety ? x.reference : null, kind: x.kind })),
    openInvestigations: perms.safety ? openSafety : null,
    riskReview: perms.safety ? (openSafety ? 'Safety review in progress' : 'No active review') : null,
  }

  // Resolution history keeps the original action even after a restriction is removed.
  const restrictionEvents = restrictions.flatMap((x) => [
    { id: `${x.id}-a`, kind: 'restriction', label: 'Restriction Applied', ref: perms.safety ? x.reference : null, at: x.appliedAt },
    ...(x.removedAt ? [{ id: `${x.id}-r`, kind: 'restriction', label: 'Restriction Removed', ref: perms.safety ? x.reference : null, at: x.removedAt }] : []),
  ])
  const outcomes = [...data.outcomes, ...restrictionEvents].sort((a, b) => new Date(b.at) - new Date(a.at))

  // Table
  const needle = (p.q || '').trim().toLowerCase()
  let rows = all.filter((c) => {
    if (p.tab && p.tab !== 'all' && c.type !== p.tab) return false
    if (!matchesDate(c, p.date, client.asOf)) return false
    if (p.status && p.status !== 'all' && !(c.status === p.status || (p.status === 'investigating' && c.status === 'under_investigation'))) return false
    if (p.priority && c.priority !== p.priority) return false
    if (p.cat && c.category !== p.cat) return false
    if (p.assigned && c.assignedTo !== p.assigned) return false
    if (p.linked && !c.bookingId) return false
    if (!needle) return true
    return [c.id, c.subject, c.bookingId || '', c.providerId || '', c.paymentId || ''].some((v) => v.toLowerCase().includes(needle))
  })
  rows = [...rows].sort(SORTERS[p.sort] || SORTERS.newest)
  const pageSize = Number(p.pageSize) || 10
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const page = Math.min(Math.max(1, Number(p.page) || 1), totalPages)

  return {
    client,
    summary,
    counts,
    attention,
    account,
    safety: { restricted: !perms.safety, open: openSafety },
    reportsSubmitted: { items: data.reportsSubmitted, total: data.reportsSubmitted.length },
    reportsAbout: perms.safety ? { items: data.reportsAbout, total: data.reportsAbout.length } : null,
    outcomes,
    assignees: AGENTS,
    items: rows.slice((page - 1) * pageSize, page * pageSize).map(toRow),
    total: rows.length,
    page,
    pageSize,
    totalPages,
  }
}

// ---------- drawer details ----------

function supportTimeline(c, extra) {
  const base = [
    { id: 't1', at: c.openedAt, text: 'Client submitted support request' },
    { id: 't2', at: plus(c.openedAt, 2), text: 'Ticket created' },
    { id: 't3', at: plus(c.openedAt, 7), text: `Assigned to ${c.origAssignedTo || c.assignedTo}` }, // original assignment is never rewritten
  ]
  if (c.paymentId || c.category === 'refund') base.push({ id: 't4', at: plus(c.openedAt, 18), text: `Admin reviewed related ${c.category === 'refund' ? 'refund' : 'payment'}` })
  base.push({ id: 't5', at: plus(c.openedAt, 40), text: 'Response sent to client' })
  base.push(isOpen(c) ? { id: 't6', at: plus(c.openedAt, 54), text: 'Awaiting client response' } : { id: 't6', at: plus(c.openedAt, 180), text: 'Issue resolved' })
  return [...base, ...extra].sort((a, b) => new Date(a.at) - new Date(b.at))
}

function conversationFor(c) {
  const msg = CLIENT_MESSAGE[c.category] || 'I need help with my account.'
  const out = [
    { id: 'm1', from: 'client', author: 'Client', text: msg, at: c.openedAt },
    { id: 'm2', from: 'admin', author: c.origAssignedTo || c.assignedTo, text: c.category === 'payment' ? 'We are reviewing your payment and booking.' : 'Thanks for reaching out — we are looking into this now.', at: plus(c.openedAt, 40) },
  ]
  if (!isOpen(c)) out.push({ id: 'm3', from: 'admin', author: c.origAssignedTo || c.assignedTo, text: 'This is now resolved. Please reply if you need anything else.', at: plus(c.openedAt, 180) })
  return out
}

function notesFor(c) {
  if (c.id === 'SUP-4812') return [{ id: 'n1', text: 'Payment verified. Booking synchronization being reviewed.', author: 'Jane', createdAt: at(2026, 9, 12, 10, 44) }]
  return isOpen(c) ? [{ id: 'n1', text: 'Reviewed the account history before replying.', author: c.assignedTo, createdAt: plus(c.openedAt, 20) }] : []
}

function relatedFor(r, c, perms, fx) {
  const booking = c.bookingId ? { id: c.bookingId, service: c.service || 'Wellness Session', provider: c.providerName || null } : null
  // The payment is omitted entirely when the admin cannot view payments.
  const payment = c.paymentId && perms.finance ? { id: c.paymentId, amount: c.payAmount ?? Math.round(4500 * fx), method: 'M-PESA' } : null
  return { booking, payment, providerId: c.providerId || null }
}

export function buildSupportCasePreview(r, caseId, perms = {}) {
  const data = visibleCases(r, perms)
  const all = [...data.cases]
  const c = all.find((x) => x.id === caseId)
  const rep = !c ? data.reportsSubmitted.find((x) => x.id === caseId) : null
  if (!c && !rep) throw new Error('This case was not found, or your role cannot view it.')

  const profile = buildClientProfile(r)
  const client = clientBlock(profile, r)
  const fx = FX[r.country] || 1

  if (rep) {
    return {
      id: rep.id, type: 'report', status: rep.status, priority: 'normal', openedAt: rep.submittedAt, client: { id: client.id, name: client.name }, timeZone: client.timeZone,
      subject: `${rep.kind} — ${rep.reason}`, assignedTo: 'Safety Team', assignedTeam: 'Safety Team',
      report: { kind: rep.kind, providerId: rep.providerId, providerName: null, reason: rep.reason, submittedAt: rep.submittedAt, outcome: 'Reviewed — no further action required' },
      related: { booking: null, payment: null, providerId: rep.providerId }, timeline: [
        { id: 'r1', at: rep.submittedAt, text: 'Report submitted by client' }, { id: 'r2', at: plus(rep.submittedAt, 180), text: 'Report reviewed' },
      ],
    }
  }

  const o = overlay.get(`${r.id}:${c.id}`)
  const common = {
    id: c.id, type: c.type, category: c.category, subject: c.subject, status: c.status, priority: c.priority, openedAt: c.openedAt,
    assignedTo: c.assignedTo, assignedTeam: c.assignedTeam, client: { id: client.id, name: client.name }, timeZone: client.timeZone, currency: client.currency,
    related: relatedFor(r, c, perms, fx),
  }

  if (c.type === 'support') {
    const extra = (o?.events || []).map((e) => ({ id: e.id, at: e.at, text: e.text }))
    const conversation = [...conversationFor(c), ...(o?.messages || [])]
    return {
      ...common,
      escalated: Boolean(o?.escalated),
      timeline: supportTimeline(c, extra),
      conversation,
      notes: [...notesFor(c), ...(o?.notes || [])],
    }
  }

  if (c.type === 'dispute') {
    return {
      ...common,
      dispute: {
        issue: c.subject,
        amount: perms.finance ? (c.disputeAmount ?? null) : undefined, // undefined = not permitted, null = not yet determined
        escrow: 'held',
        submittedAt: c.openedAt,
      },
      timeline: [
        { id: 'd1', at: c.openedAt, text: 'Dispute submitted' },
        { id: 'd2', at: plus(c.openedAt, 2), text: 'Escrow held' },
        { id: 'd3', at: plus(c.openedAt, 30), text: 'Assigned to Safety & Resolution Team' },
        { id: 'd4', at: plus(c.openedAt, 24 * 60), text: 'Investigation started' },
      ],
    }
  }

  if (c.type === 'safety') {
    // Opening a sensitive case is access-logged (real backend: audit_logs).
    SENSITIVE_ACCESS_LOG.push({ caseId: c.id, clientId: r.id, at: new Date().toISOString() })
    return {
      ...common,
      safety: {
        severity: 'High', category: 'Professional / Personal Safety', reportingParty: 'Provider', reportedParty: 'Client',
        evidenceStatus: 'Under review', investigator: 'Trust & Safety Team', actionsTaken: 'Booking restriction applied pending review', outcome: 'Pending',
      },
      timeline: [
        { id: 's1', at: c.openedAt, text: 'Safety report received' },
        { id: 's2', at: plus(c.openedAt, 15), text: 'Assigned to Trust & Safety Team' },
        { id: 's3', at: plus(c.openedAt, 60), text: 'Booking restriction applied' },
      ],
    }
  }

  // report (listed in the history table)
  return {
    ...common,
    report: { kind: 'Provider Report', providerId: c.providerId, providerName: c.providerName || null, reason: 'Professional Conduct', submittedAt: c.openedAt, outcome: 'Reviewed — no further action required' },
    timeline: [{ id: 'r1', at: c.openedAt, text: 'Report submitted by client' }, { id: 'r2', at: plus(c.openedAt, 240), text: 'Report reviewed' }],
  }
}

// ---------- mutations (support cases only) ----------

const nowIso = () => new Date().toISOString()

export function addMockCaseMessage(clientId, caseId, text) {
  const o = slot(clientId, caseId)
  const at0 = nowIso()
  o.messages.push({ id: `m-${o.messages.length + 10}`, from: 'admin', author: 'Admin', text, at: at0 })
  o.events.push({ id: `e-${o.events.length + 10}`, at: at0, text: 'Response sent to client' })
  return { ok: true }
}

export function addMockCaseNote(clientId, caseId, text) {
  const o = slot(clientId, caseId)
  o.notes.push({ id: `n-${o.notes.length + 10}`, text, author: 'Admin', createdAt: nowIso() })
  return { ok: true }
}

export function reassignMockCase(clientId, caseId, assignee) {
  const o = slot(clientId, caseId)
  const person = AGENTS.includes(assignee) ? assignee : AGENTS[0]
  o.assignee = { name: person, team: 'Support Team' }
  o.events.push({ id: `e-${o.events.length + 10}`, at: nowIso(), text: `Reassigned to ${person}` })
  return { ok: true }
}

export function escalateMockCase(clientId, caseId) {
  const o = slot(clientId, caseId)
  o.escalated = true
  o.events.push({ id: `e-${o.events.length + 10}`, at: nowIso(), text: 'Escalated to Support Lead' })
  return { ok: true }
}
