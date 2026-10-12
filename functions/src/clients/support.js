// ADM-018 Client Support & Safety History — an aggregated Admin view over the REAL case systems:
// `support_tickets`, `disputes`, `safety_reports`, `reports` (made by / about the client),
// `account_restrictions`, case `events` / `messages` subcollections and `admin_notes`.
// There is no admin_client_support_history collection.
//  • Support ≠ Dispute ≠ Safety ≠ Report — four distinct types.
//  • Safety needs `safety.manage`: without it safety cases, counts and restriction reasons are OMITTED.
//  • Internal notes and the client conversation are returned separately.
//  • Opening a safety case is audit-logged. Cases are never deleted.
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { FieldValue } from 'firebase-admin/firestore'
import {
  CLIENT_FIELD, DAY_MS, F, addNote, adminCtx, audit, auditSensitive, clientBlock, cleanText, db, iso, listNotes, loadClient, lower, ms, need, num, paginate, tzOf,
} from './common.js'

const PRIORITY_RANK = { critical: 0, high: 1, normal: 2, low: 3 }
const UNRESOLVED = ['open', 'in_review', 'investigating', 'under_investigation']
const isOpen = (c) => UNRESOLVED.includes(c.status)

const statusOf = (raw) => {
  const s = lower(raw)
  if (['escalated', 'awaiting_client', 'in_progress'].includes(s)) return 'in_review'
  if (['resolved', 'closed', 'investigating', 'under_investigation', 'in_review'].includes(s)) return s
  return 'open'
}
const priorityOf = (raw) => (PRIORITY_RANK[lower(raw)] != null ? lower(raw) : 'normal')

const SOURCES = [
  { type: 'support', collection: 'support_tickets', field: CLIENT_FIELD, number: 'ticketNumber' },
  { type: 'dispute', collection: 'disputes', field: CLIENT_FIELD, number: 'disputeNumber' },
  { type: 'safety', collection: 'safety_reports', field: CLIENT_FIELD, number: 'caseNumber', restricted: true },
]

function toCase(source, d) {
  const c = d.data()
  return {
    id: c[source.number] || d.id,
    docId: d.id,
    type: source.type,
    category: lower(c.category) || (source.type === 'safety' ? 'safety' : 'service'),
    subject: c.subject || c.issue || c.title || 'Case',
    openedAt: iso(c.createdAt ?? c.openedAt),
    priority: source.type === 'safety' ? priorityOf(c.priority || c.severity || 'high') : priorityOf(c.priority),
    status: statusOf(c.status),
    assignedTo: c.assignedToName || c.assignedTo || (source.type === 'safety' ? 'Trust & Safety Team' : 'Unassigned'),
    assignedTeam: c.assignedTeam || (source.type === 'support' ? 'Support Team' : source.type === 'dispute' ? 'Safety & Resolution Team' : 'Trust & Safety Team'),
    bookingId: c.bookingNumber || c.bookingId || null,
    paymentId: c.paymentNumber || c.paymentId || null,
    providerId: c.providerId || null,
    providerName: c.providerName || null,
    service: c.serviceName || null,
    resolvedAt: iso(c.resolvedAt ?? c.closedAt),
    escalated: Boolean(c.escalated),
    _c: c,
  }
}
const toReportCase = (d) => {
  const c = d.data()
  return {
    id: c.reportNumber || d.id, docId: d.id, type: 'report', category: 'conduct', subject: c.subject || `${c.kind || 'Provider Report'} — ${c.reason || ''}`.trim(),
    openedAt: iso(c.createdAt), priority: priorityOf(c.priority), status: statusOf(c.status), assignedTo: c.assignedToName || 'Safety Team', assignedTeam: 'Safety Team',
    bookingId: c.bookingNumber || c.bookingId || null, paymentId: null, providerId: c.providerId || null, providerName: c.providerName || null, service: null, resolvedAt: iso(c.resolvedAt), escalated: false, _c: c,
  }
}
const toRow = ({ _c, docId, resolvedAt, escalated, paymentId, service, ...c }) => ({
  ...c,
  related: c.bookingId ? { kind: 'booking', id: c.bookingId, label: `Booking #${c.bookingId}` } : c.providerId ? { kind: 'provider', id: c.providerId, label: `Provider #${c.providerId}` } : null,
})

async function loadAll(user, ctx) {
  const ids = [...new Set([user.id, user.get(F.clientCode)].filter(Boolean))]
  const sources = SOURCES.filter((s) => !s.restricted || ctx.perms.safety)
  const [groups, submitted, about, restrictions] = await Promise.all([
    Promise.all(sources.map(async (s) => (await db().collection(s.collection).where(s.field, 'in', ids).limit(500).get()).docs.map((d) => toCase(s, d)))),
    db().collection('reports').where('reporterId', 'in', ids).limit(200).get(),
    ctx.perms.safety ? db().collection('reports').where('reportedUserId', 'in', ids).limit(200).get() : null,
    db().collection('account_restrictions').where('customerId', '==', user.id).limit(200).get(),
  ])
  const submittedDocs = submitted.docs
  const cases = [...groups.flat(), ...submittedDocs.map(toReportCase)]
  return {
    cases,
    reportsSubmitted: submittedDocs.map((d) => ({ id: d.get('reportNumber') || d.id, kind: d.get('kind') || 'Provider Report', providerId: d.get('providerId') || null, reason: d.get('reason') || '', submittedAt: iso(d.get('createdAt')), status: statusOf(d.get('status')) })),
    reportsAbout: (about?.docs || []).map((d) => ({ id: d.get('reportNumber') || d.id, category: d.get('category') || '', date: iso(d.get('createdAt')), status: statusOf(d.get('status')), outcome: d.get('outcome') || 'Pending' })),
    restrictions: restrictions.docs.map((d) => ({ id: d.id, kind: d.get('kind'), label: d.get('label') || 'Restriction', reason: d.get('category') || d.get('reason') || null, reference: d.get('relatedId') || 'ADM-019', appliedAt: iso(d.get('startedAt') ?? d.get('createdAt')), removedAt: iso(d.get('endedAt')) })),
  }
}

async function assignees() {
  const snap = await db().collection('admin_profiles').where('status', '==', 'ACTIVE').limit(100).get()
  return snap.docs.filter((d) => ['support_agent', 'country_admin', 'super_admin'].includes(d.get('roleId'))).map((d) => d.get('fullName')).filter(Boolean)
}

function dateOk(c, date) {
  if (!date) return true
  const age = (Date.now() - ms(c.openedAt)) / DAY_MS
  if (date === '30d') return age <= 30
  if (date === '90d') return age <= 90
  if (date === 'year') return new Date(ms(c.openedAt)).getUTCFullYear() === new Date().getUTCFullYear()
  return true
}
const SORT = {
  newest: (a, b) => ms(b.openedAt) - ms(a.openedAt),
  oldest: (a, b) => ms(a.openedAt) - ms(b.openedAt),
  priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || ms(b.openedAt) - ms(a.openedAt),
}

export const adminGetClientSupport = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'support.view' })
  const p = request.data || {}
  const user = await loadClient(ctx, p.clientId, p.market)
  const safetyOk = ctx.perms.safety
  const data = await loadAll(user, ctx)
  const all = data.cases
  const client = clientBlock(user)

  const count = (type) => all.filter((c) => c.type === type).length
  const supportCases = all.filter((c) => c.type === 'support')
  const openSafety = all.filter((c) => c.type === 'safety' && isOpen(c)).length
  const summary = { support: supportCases.length, openCases: supportCases.filter(isOpen).length, disputes: count('dispute'), safety: safetyOk ? count('safety') : null, resolved: all.filter((c) => !isOpen(c)).length }
  const counts = { all: all.length, support: count('support'), dispute: count('dispute'), safety: safetyOk ? count('safety') : null, report: count('report') }

  const attention = all.filter((c) => (c.type === 'safety' || c.type === 'support') && isOpen(c))
    .sort((a, b) => (a.type === 'safety' ? -1 : 0) - (b.type === 'safety' ? -1 : 0) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || ms(a.openedAt) - ms(b.openedAt))
    .map((c) => ({ ...toRow(c), severity: c.type === 'safety' ? 'critical' : 'warning' }))

  const restrictions = data.restrictions.map((x) => (safetyOk ? x : { ...x, reason: null, reference: null }))
  const active = restrictions.filter((x) => !x.removedAt)
  const account = {
    status: client.status,
    restrictions: active.map((x) => ({ id: x.id, label: x.label, reason: x.reason, reference: safetyOk ? x.reference : null, kind: x.kind })),
    openInvestigations: safetyOk ? openSafety : null,
    riskReview: safetyOk ? (openSafety ? 'Safety review in progress' : 'No active review') : null,
  }

  const resolved = all.filter((c) => !isOpen(c)).flatMap((c) => {
    const at = c.resolvedAt || c.openedAt
    const base = { id: `o-${c.docId}`, at, kind: c.type === 'report' ? 'report' : 'support' }
    if (c.type === 'report') return [{ ...base, label: 'Report Reviewed' }]
    if (c.type === 'dispute') return [{ ...base, kind: 'dispute', label: 'Dispute Closed' }]
    if (c.type === 'safety') return []
    return c.category === 'refund' ? [{ ...base, label: 'Support Issue Resolved' }, { ...base, id: `${base.id}-r`, kind: 'refund', label: 'Refund Processed' }] : [{ ...base, label: 'Support Issue Resolved' }]
  })
  const restrictionEvents = restrictions.flatMap((x) => [
    { id: `${x.id}-a`, kind: 'restriction', label: 'Restriction Applied', ref: safetyOk ? x.reference : null, at: x.appliedAt },
    ...(x.removedAt ? [{ id: `${x.id}-r`, kind: 'restriction', label: 'Restriction Removed', ref: safetyOk ? x.reference : null, at: x.removedAt }] : []),
  ])
  const outcomes = [...resolved, ...restrictionEvents].sort((a, b) => ms(b.at) - ms(a.at)).slice(0, 30)

  const needle = String(p.q || '').trim().toLowerCase()
  let rows = all.filter((c) => {
    if (p.tab && p.tab !== 'all' && c.type !== p.tab) return false
    if (!dateOk(c, p.date)) return false
    if (p.status && p.status !== 'all' && !(c.status === p.status || (p.status === 'investigating' && c.status === 'under_investigation'))) return false
    if (p.priority && c.priority !== p.priority) return false
    if (p.cat && c.category !== p.cat) return false
    if (p.assigned && c.assignedTo !== p.assigned) return false
    if (p.linked && !c.bookingId) return false
    return !needle || [c.id, c.subject, c.bookingId || '', c.providerId || '', c.paymentId || ''].some((v) => String(v).toLowerCase().includes(needle))
  })
  rows = [...rows].sort(SORT[p.sort] || SORT.newest)
  const page = paginate(rows, p, 10)

  return {
    client, summary, counts, attention, account,
    safety: { restricted: !safetyOk, open: safetyOk ? openSafety : 0 },
    reportsSubmitted: { items: data.reportsSubmitted, total: data.reportsSubmitted.length },
    reportsAbout: safetyOk ? { items: data.reportsAbout, total: data.reportsAbout.length } : null,
    outcomes,
    assignees: await assignees(),
    ...page,
    items: page.items.map(toRow),
  }
})

// Finds one case that belongs to this client AND that this admin may see.
async function findCase(user, ctx, caseId) {
  const id = String(caseId ?? '')
  const gone = new HttpsError('not-found', 'This case was not found, or your role cannot view it.')
  if (!/^[\w.-]{1,128}$/.test(id)) throw gone
  const ids = [user.id, user.get(F.clientCode)]
  for (const s of SOURCES) {
    if (s.restricted && !ctx.perms.safety) continue
    let doc = await db().collection(s.collection).doc(id).get()
    if (!doc.exists) doc = (await db().collection(s.collection).where(s.number, '==', id).limit(1).get()).docs[0]
    if (doc?.exists && ids.includes(doc.get(s.field))) return { kind: s.type, doc, c: toCase(s, doc) }
  }
  let rep = await db().collection('reports').doc(id).get()
  if (!rep.exists) rep = (await db().collection('reports').where('reportNumber', '==', id).limit(1).get()).docs[0]
  if (rep?.exists && ids.includes(rep.get('reporterId'))) return { kind: 'report', doc: rep, c: toReportCase(rep) }
  throw gone
}

async function eventsOf(doc, fallback) {
  const snap = await doc.ref.collection('events').limit(100).get().catch(() => null)
  const rows = (snap?.docs || []).map((e) => ({ id: e.id, at: iso(e.get('createdAt')), text: e.get('text') || e.get('type') })).filter((e) => e.at)
  return (rows.length ? rows : fallback).sort((a, b) => ms(a.at) - ms(b.at))
}

export const adminGetSupportCasePreview = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'support.view' })
  const q = request.data || {}
  const user = await loadClient(ctx, q.clientId, q.market)
  const { kind, doc, c } = await findCase(user, ctx, q.caseId)
  const client = clientBlock(user)
  const finance = ctx.perms.finance
  const c0 = c._c

  const common = {
    id: c.id, type: c.type, category: c.category, subject: c.subject, status: c.status, priority: c.priority, openedAt: c.openedAt,
    assignedTo: c.assignedTo, assignedTeam: c.assignedTeam, client: { id: client.id, name: client.name }, timeZone: tzOf(user.get(F.country)), currency: client.currency,
  }
  let payment = null
  if (c.paymentId && finance) {
    const pay = await db().collection('payments').doc(c.paymentId).get().catch(() => null)
    payment = { id: pay?.exists ? pay.get('paymentNumber') || pay.id : c.paymentId, amount: pay?.exists ? num(pay.get('amount')) : null, method: pay?.exists ? pay.get('methodLabel') || pay.get('method') || '' : '' }
  }
  common.related = { booking: c.bookingId ? { id: c.bookingId, service: c.service || '', provider: c.providerName || null } : null, payment, providerId: c.providerId }
  const fallback = [{ id: 't1', at: c.openedAt, text: kind === 'report' ? 'Report submitted by client' : 'Case opened' }]

  if (kind === 'support') {
    const [timeline, msgs, notes] = await Promise.all([
      eventsOf(doc, fallback),
      doc.ref.collection('messages').limit(200).get().catch(() => null),
      listNotes(user.id, 'support_case', doc.id),
    ])
    const conversation = (msgs?.docs || []).map((m) => ({ id: m.id, from: m.get('from') === 'admin' ? 'admin' : 'client', author: m.get('authorName') || (m.get('from') === 'admin' ? 'Admin' : 'Client'), text: m.get('text'), at: iso(m.get('createdAt')) })).sort((a, b) => ms(a.at) - ms(b.at))
    return { ...common, escalated: c.escalated, timeline, conversation, notes: notes.map((n) => ({ id: n.id, text: n.text, author: n.author, createdAt: n.createdAt })) }
  }
  if (kind === 'dispute') {
    return {
      ...common,
      dispute: { issue: c.subject, amount: finance ? (c0.amountInvolved != null ? num(c0.amountInvolved) : null) : undefined, escrow: lower(c0.escrowStatus) || 'held', submittedAt: c.openedAt },
      timeline: await eventsOf(doc, [...fallback, { id: 'd2', at: c.openedAt, text: 'Dispute submitted' }]),
    }
  }
  if (kind === 'safety') {
    await auditSensitive(request, ctx, user, c.id, 'safety') // opening a sensitive case is access-logged
    return {
      ...common,
      safety: {
        severity: c0.severity || 'High', category: c0.category || 'Professional / Personal Safety', reportingParty: c0.reportingParty || '—', reportedParty: c0.reportedParty || '—',
        evidenceStatus: c0.evidenceStatus || 'Under review', investigator: c0.investigatorName || c.assignedTo, actionsTaken: c0.actionsTaken || '—', outcome: c0.outcome || 'Pending',
      },
      timeline: await eventsOf(doc, fallback),
    }
  }
  return {
    ...common,
    report: { kind: c0.kind || 'Provider Report', providerId: c.providerId, providerName: c.providerName, reason: c0.reason || '', submittedAt: c.openedAt, outcome: c0.outcome || (isOpen(c) ? 'Pending' : 'Reviewed') },
    timeline: await eventsOf(doc, fallback),
  }
})

// ---- mutations (support cases only; resolution of disputes / safety happens in their own workflows) ----
async function supportCase(ctx, request, user) {
  const found = await findCase(user, ctx, request.data?.caseId)
  if (found.kind !== 'support') throw new HttpsError('failed-precondition', 'Only support cases can be changed from this screen.')
  return found
}
const caseEvent = (doc, ctx, text) => doc.ref.collection('events').add({ text, actor: ctx.name, actorId: ctx.uid, createdAt: FieldValue.serverTimestamp() })

// Goes through the shared support messaging; never includes internal notes.
export const adminReplyToSupportCase = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'support.respond' })
  const user = await loadClient(ctx, request.data?.clientId)
  const { doc, c } = await supportCase(ctx, request, user)
  const text = cleanText(request.data?.text, { max: 2000, label: 'Reply' })
  await doc.ref.collection('messages').add({ from: 'admin', authorId: ctx.uid, authorName: ctx.name, text, createdAt: FieldValue.serverTimestamp() })
  await doc.ref.update({ lastResponseAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), status: c.status === 'open' ? 'in_review' : doc.get('status') })
  await caseEvent(doc, ctx, 'Response sent to client')
  await audit(request, ctx, 'support.case_replied', user, { caseId: c.id })
  return { ok: true }
})

// Internal note: stored separately, never visible to the client.
export const adminAddSupportCaseNote = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'support.respond' })
  const user = await loadClient(ctx, request.data?.clientId)
  const { doc } = await supportCase(ctx, request, user)
  await addNote(request, ctx, user, { scope: 'support_case', refId: doc.id, text: request.data?.text })
  return { ok: true }
})

export const adminReassignSupportCase = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'support.respond' })
  const user = await loadClient(ctx, request.data?.clientId)
  const { doc, c } = await supportCase(ctx, request, user)
  const people = await assignees()
  const assignee = String(request.data?.assignee || '')
  if (!people.includes(assignee)) throw new HttpsError('invalid-argument', 'Choose a valid team member.')
  await doc.ref.update({ assignedToName: assignee, assignedTeam: 'Support Team', updatedAt: FieldValue.serverTimestamp() })
  await caseEvent(doc, ctx, `Reassigned to ${assignee}`)
  await audit(request, ctx, 'support.case_reassigned', user, { caseId: c.id, assignee })
  return { ok: true }
})

export const adminEscalateSupportCase = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'support.respond' })
  const user = await loadClient(ctx, request.data?.clientId)
  const { doc, c } = await supportCase(ctx, request, user)
  if (!isOpen(c)) throw new HttpsError('failed-precondition', 'Only unresolved cases can be escalated.')
  await doc.ref.update({ priority: 'high', escalated: true, updatedAt: FieldValue.serverTimestamp() })
  await caseEvent(doc, ctx, 'Escalated to high priority')
  await audit(request, ctx, 'support.case_escalated', user, { caseId: c.id })
  return { ok: true }
})
