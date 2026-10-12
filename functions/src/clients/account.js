// ADM-019 Client Account Actions — the controlled execution layer for one client account.
// Reads/writes the existing `users` account status plus `account_restrictions`, `account_actions`,
// `notifications` and `audit_logs`. There is no second admin copy of the client account.
//  • Account status and scoped restrictions are SEPARATE concepts (never one isSuspended flag).
//  • The browser only COLLECTS a request; everything is re-validated here against the LATEST state.
//  • Existing bookings are never cancelled, wallet funds are never touched, nothing is ever erased:
//    ending a restriction closes it and adds a new event.
//  • High-impact actions require a fresh admin verification (callAdmin retries after ADM-004).
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import {
  DAY_MS, F, adminCtx, auditEntry, clientBlock, db, iso, loadClient, lower, ms, num, statusOf, tierOf,
} from './common.js'
import { bookingsOf } from './bookings.js'

const OTHER = 'Other Approved Reason'
const MIN_NOTE = 10
const MAX_CLIENT_MESSAGE = 400
const REASONS = {
  suspend: ['Safety Concern', 'Policy Violation', 'Fraud / Payment Review', 'Abusive Conduct', 'Account Security', 'Compliance Requirement', OTHER],
  restrict: ['Payment investigation', 'Safety review', 'Policy Violation', 'Account Security', 'Compliance Requirement', OTHER],
  deactivate: ['Client request', 'Policy Violation', 'Fraud confirmed', 'Compliance Requirement', 'Account inactivity', OTHER],
  reactivate: ['Review completed — restriction no longer required.', 'Issue resolved with the client.', 'Suspension applied in error.', 'Compliance requirement satisfied.', OTHER],
  lift: ['Investigation completed', 'Review completed — restriction no longer required.', 'Issue resolved with the client.', 'Applied in error.', OTHER],
  warning: ['Professional conduct policy', 'Terms of Service', 'Cancellation policy', 'Payment policy', OTHER],
  info: ['Verify identity', 'Update contact details', 'Confirm payment method', 'Provide supporting documents', OTHER],
  review: ['Safety Concern', 'Fraud / Payment Review', 'Account Security', 'Policy Violation', OTHER],
}
const ACTIONS = {
  restrict_booking: { kind: 'booking', reasons: REASONS.restrict, history: 'Booking Restriction', scope: 'Bookings', notice: 'In-App' },
  restrict_messaging: { kind: 'messaging', reasons: REASONS.restrict, history: 'Messaging Restriction', scope: 'Messages', notice: 'In-App' },
  restrict_payments: { kind: 'payments', reasons: REASONS.restrict, history: 'Payment Restriction', scope: 'Payments', notice: 'In-App' },
  request_info: { reasons: REASONS.info, history: 'Information Requested', scope: 'Account' },
  send_warning: { reasons: REASONS.warning, history: 'Warning Issued', scope: 'Account' },
  place_review: { kind: 'review', reasons: REASONS.review, history: 'Placed Under Review', scope: 'Account' },
  suspend: { kind: 'suspension', reasons: REASONS.suspend, history: 'Account Suspended', scope: 'Account' },
  reactivate: { reasons: REASONS.reactivate, history: 'Account Reactivated', scope: 'Account' },
  deactivate: { reasons: REASONS.deactivate, history: 'Account Deactivated', scope: 'Account' },
  lift: { reasons: REASONS.lift, history: 'Restriction Removed', scope: 'Account' },
}
const FRESH = new Set(['suspend', 'reactivate', 'deactivate', 'restrict_payments'])
const SCOPES = [
  { id: 'booking', short: 'New Bookings' }, { id: 'messaging', short: 'Messaging' }, { id: 'wallet', short: 'Wallet', needs: 'finance' },
  { id: 'membership', short: 'Membership benefits' }, { id: 'full', short: 'Full Account Access' },
]
const DURATIONS = [
  { id: 'until_reviewed' }, { id: '24h', hours: 24 }, { id: '7d', hours: 24 * 7 }, { id: '30d', hours: 24 * 30 }, { id: 'custom' }, { id: 'indefinite', needs: 'superAdmin' },
]
const RAW_STATUS = { active: 'approved', suspended: 'suspended', deactivated: 'deactivated' }

const hideRelated = (rel, perms) => (!rel ? null : rel.type === 'safety' && !perms.safety ? { restricted: true, type: 'safety' } : rel)

function permittedFor(status, perms, active) {
  const can = perms.manage
  const none = 'You need account-management permission for this action.'
  const has = (k) => active.some((x) => x.kind === k)
  const susp = status === 'suspended'
  const deact = status === 'deactivated'
  const gate = (ok, why) => ({ allowed: can && ok, reason: !can ? none : ok ? null : why })
  return {
    restrict_booking: gate(!deact, 'The account is deactivated.'),
    restrict_messaging: gate(!deact, 'The account is deactivated.'),
    restrict_payments: gate(perms.finance && !deact, !perms.finance ? 'Only authorised Finance or Security roles can restrict payments / wallet.' : 'The account is deactivated.'),
    request_info: gate(!deact, 'The account is deactivated.'),
    send_warning: gate(!deact, 'The account is deactivated.'),
    place_review: gate(!deact && !has('review'), has('review') ? 'A review is already active.' : 'The account is deactivated.'),
    suspend: gate(!susp && !deact, susp ? 'The account is already suspended.' : 'The account is deactivated.'),
    reactivate: gate(susp || deact, 'Only available for suspended or deactivated accounts.'),
    deactivate: gate(!deact, 'The account is already deactivated.'),
  }
}

function accessFor(tier, status, active) {
  const access = { client: 'enabled', booking: 'enabled', payment: 'enabled', messaging: 'enabled' }
  const cap = (s) => (s ? `${s[0].toUpperCase()}${s.slice(1)}` : s)
  let membership = tier === 'none' ? 'No membership' : `${cap(tier)} — Active`
  for (const x of active) {
    if (x.kind === 'booking') access.booking = 'restricted'
    if (x.kind === 'messaging') access.messaging = 'restricted'
    if (x.kind === 'payments') access.payment = 'restricted'
    if (x.kind === 'suspension') {
      for (const s of x.scope || []) {
        if (s === 'booking') access.booking = 'suspended'
        if (s === 'messaging') access.messaging = 'suspended'
        if (s === 'wallet') access.payment = 'suspended'
        if (s === 'membership') membership = `${cap(tier)} — Benefits paused`
        if (s === 'full') { for (const k of Object.keys(access)) access[k] = 'suspended'; if (tier !== 'none') membership = `${cap(tier)} — Suspended` }
      }
    }
  }
  if (status === 'deactivated') { for (const k of Object.keys(access)) access[k] = 'disabled'; if (tier !== 'none') membership = `${cap(tier)} — Paused` }
  return { access, membership }
}

const restrictionOf = (d) => {
  const r = d.data()
  return {
    id: d.id, kind: r.kind, label: r.label, scope: r.scope || [], scopeLabel: r.scopeLabel || '', startedAt: iso(r.startedAt), endsAt: iso(r.endsAt), durationId: r.durationId || 'until_reviewed',
    category: r.category || null, appliedBy: r.appliedBy || '', appliedByRole: r.appliedByRole || '', related: r.relatedId ? { id: r.relatedId, type: r.relatedType } : null,
    clientMessage: r.clientMessage || null, status: r.status || 'active', historyId: r.historyId || null,
  }
}
const describeExpiry = (x) => (x.kind === 'review' ? 'Until review ends' : x.durationId === 'indefinite' ? 'Indefinite' : x.endsAt ? { at: x.endsAt } : 'Until reviewed')

async function relatedCases(user, perms) {
  const ids = [...new Set([user.id, user.get(F.clientCode)].filter(Boolean))]
  const q = (c) => db().collection(c).where('customerId', 'in', ids).limit(100).get()
  const [sup, dsp, saf] = await Promise.all([q('support_tickets'), q('disputes'), perms.safety ? q('safety_reports') : null])
  const open = (d) => ['open', 'in_review', 'investigating', 'under_investigation', 'escalated'].includes(lower(d.get('status')))
  const label = (d, t, n) => ({ id: d.get(n) || d.id, type: t, label: `${{ safety: 'Safety case', dispute: 'Dispute', support: 'Support case' }[t]} ${d.get(n) || d.id}`, status: String(d.get('status') || '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()), open: open(d), at: ms(d.get('createdAt')) })
  const all = [...sup.docs.map((d) => label(d, 'support', 'ticketNumber')), ...dsp.docs.map((d) => label(d, 'dispute', 'disputeNumber')), ...(saf?.docs || []).map((d) => label(d, 'safety', 'caseNumber'))]
  return {
    counts: { safety: perms.safety ? all.filter((c) => c.type === 'safety' && c.open).length : null, disputes: all.filter((c) => c.type === 'dispute' && c.open).length, support: all.filter((c) => c.type === 'support' && c.open).length },
    related: all.sort((a, b) => b.at - a.at).slice(0, 15).map(({ open, at, ...c }) => c),
  }
}

export const adminGetClientAccount = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  const user = await loadClient(ctx, request.data?.clientId, request.data?.market)
  const perms = ctx.perms
  const status = statusOf(user.get(F.status))
  const [rSnap, hSnap, nSnap, cases, bookings] = await Promise.all([
    db().collection('account_restrictions').where('customerId', '==', user.id).limit(200).get(),
    db().collection('account_actions').where('customerId', '==', user.id).limit(200).get(),
    db().collection('notifications').where('userId', '==', user.id).where('accountAction', '==', true).limit(100).get(),
    relatedCases(user, perms),
    bookingsOf(user, 300),
  ])
  const restrictions = rSnap.docs.map(restrictionOf)
  const active = restrictions.filter((x) => x.status === 'active')
  const tier = tierOf(user.get(F.membership))
  const { access, membership } = accessFor(tier, status, active)
  const client = clientBlock(user)
  const view = (x) => ({ ...x, expires: describeExpiry(x), category: perms.safety || x.related?.type !== 'safety' ? x.category : null, related: hideRelated(x.related, perms), impact: x.kind === 'review' ? 'none' : 'access' })
  const suspension = active.find((x) => x.kind === 'suspension')
  const upcoming = bookings.filter((b) => ['confirmed', 'pending'].includes(b.status) && ms(b.scheduledAt) > Date.now())

  return {
    asOf: client.asOf,
    client,
    account: { status, access, membership, underReview: active.some((x) => x.kind === 'review'), restrictionCount: active.length, suspension: suspension ? view(suspension) : null },
    review: { safety: cases.counts.safety, disputes: cases.counts.disputes, support: cases.counts.support, bookings: upcoming.length },
    bookings: upcoming.map((b) => ({ id: b.id, service: b.service, scheduledAt: b.scheduledAt, amount: perms.finance ? b.price : undefined })),
    bookingCount: upcoming.length,
    restrictions: active.map(view),
    history: hSnap.docs.map((d) => {
      const h = d.data()
      return { id: h.actionNumber || d.id, at: iso(h.createdAt), action: h.action, reason: h.reason, scope: h.scope, admin: h.adminName, status: h.status, detail: { ...(h.detail || {}), related: hideRelated(h.detail?.related || null, perms) } }
    }).sort((a, b) => ms(b.at) - ms(a.at)),
    notifications: nSnap.docs.map((d) => ({ id: d.id, at: iso(d.get('createdAt')), message: d.get('title'), channel: d.get('channelLabel') || 'In-App', status: d.get('status') === 'queued' ? 'queued' : d.get('status') === 'failed' ? 'failed' : 'delivered', body: d.get('body') })).sort((a, b) => ms(b.at) - ms(a.at)),
    relatedCases: cases.related.filter((c) => perms.safety || c.type !== 'safety'),
    permitted: permittedFor(status, perms, active),
    config: {
      suspendReasons: REASONS.suspend, restrictReasons: REASONS.restrict, deactivateReasons: REASONS.deactivate, reactivateReasons: REASONS.reactivate, liftReasons: REASONS.lift,
      durations: DURATIONS.map((d) => ({ id: d.id, allowed: !d.needs || perms[d.needs] === true })),
      scopes: SCOPES.map((s) => ({ id: s.id, allowed: !s.needs || perms[s.needs] === true })),
    },
    securityVerification: { required: [...FRESH] },
  }
})

const scopeLabelOf = (scope) => scope.map((id) => SCOPES.find((s) => s.id === id)?.short || id).join(' + ')

export const adminApplyClientAccountAction = onCall(async (request) => {
  const body = request.data || {}
  const meta = ACTIONS[body.action]
  if (!meta) throw new HttpsError('invalid-argument', 'That action is not recognised.')
  // High-impact actions need a verification within the freshness window (ADM-004 handles the prompt).
  const ctx = await adminCtx(request, { permission: 'users.suspend', fresh: FRESH.has(body.action) })
  const perms = ctx.perms
  const fail = (m) => { throw new HttpsError('failed-precondition', m) }
  const bad = (m) => { throw new HttpsError('invalid-argument', m) }
  const action = body.action
  const user = await loadClient(ctx, body.clientId)

  const category = String(body.category || '').trim()
  if (!category) bad('Select a reason before continuing.')
  if (!meta.reasons.includes(category)) bad('That reason is not on the approved list.')
  const internalNote = String(body.internalNote || '').trim().slice(0, 500)
  if (category === OTHER && internalNote.length < MIN_NOTE) bad(`Add an internal note of at least ${MIN_NOTE} characters for this reason.`)
  const notify = body.notify !== false
  const clientMessage = String(body.clientMessage || '').trim()
  if (notify && !clientMessage) bad('Add the message the client will receive, or turn client notification off.')
  if (clientMessage.length > MAX_CLIENT_MESSAGE) bad(`The client message can be at most ${MAX_CLIENT_MESSAGE} characters.`)

  const country = user.get(F.country)
  const cases = await relatedCases(user, perms)
  const related = body.relatedId ? cases.related.find((c) => c.id === body.relatedId) : null
  if (body.relatedId && !related) bad('That related case does not belong to this client.')
  if (related?.type === 'safety' && !perms.safety) bad('You do not have access to that safety case.')
  const upcoming = (await bookingsOf(user, 300)).filter((b) => ['confirmed', 'pending'].includes(b.status) && ms(b.scheduledAt) > Date.now()).length

  const duration = () => {
    const id = body.duration || 'until_reviewed'
    const d = DURATIONS.find((x) => x.id === id)
    if (!d) bad('Select a valid duration.')
    if (d.needs && perms[d.needs] !== true) fail('Indefinite restrictions need a higher permission level.')
    if (id === 'custom') {
      const days = Number(body.customDays)
      if (!Number.isInteger(days) || days < 1 || days > 365) bad('Enter a custom duration between 1 and 365 days.')
      return { durationId: id, label: `${days} ${days === 1 ? 'day' : 'days'}`, endsAt: Timestamp.fromMillis(Date.now() + days * DAY_MS) }
    }
    return { durationId: id, label: id === 'until_reviewed' ? 'Until reviewed' : id === 'indefinite' ? 'Indefinite' : id === '24h' ? '24 hours' : id === '7d' ? '7 days' : '30 days', endsAt: d.hours ? Timestamp.fromMillis(Date.now() + d.hours * 3_600_000) : null }
  }

  const message = await db().runTransaction(async (tx) => {
    // Re-read the LATEST state inside the transaction.
    const fresh = await tx.get(user.ref)
    const rs = await tx.get(db().collection('account_restrictions').where('customerId', '==', user.id).where('status', '==', 'active'))
    const active = rs.docs.map(restrictionOf)
    const status = statusOf(fresh.get(F.status))
    const permitted = permittedFor(status, perms, active)
    if (action !== 'lift') {
      if (!perms.manage) fail('You do not have permission to change this account.')
      if (!permitted[action].allowed) fail(permitted[action].reason || 'This action is not available right now.')
    }
    const audit = auditEntry(request, ctx, { action: `client.account_${action}`, entityId: user.id, metadata: { reason: category, scope: body.scope || null, duration: body.duration || null, relatedId: related?.id || null, notified: notify, upcomingBookings: upcoming } })
    const actionRef = db().collection('account_actions').doc()
    const resRef = db().collection('account_restrictions').doc()
    const base = { customerId: user.id, countryCode: country }
    const detail = (extra = {}) => ({ category, durationLabel: null, clientMessage: notify ? clientMessage : null, internalNote: internalNote || null, related: related ? { id: related.id, type: related.type } : null, notified: notify, ...extra })
    const history = (h) => tx.set(actionRef, { ...base, adminId: ctx.uid, adminName: ctx.name, createdAt: FieldValue.serverTimestamp(), auditId: audit.ref.id, ...h })
    const notice = (title, channel) => notify && tx.set(db().collection('notifications').doc(), { userId: user.id, countryCode: country, title, body: clientMessage, type: 'account_action', accountAction: true, channel: channel === 'Email' ? 'email' : 'in_app', channelLabel: channel, status: 'queued', read: false, createdAt: FieldValue.serverTimestamp() })
    const newRestriction = (extra) => tx.set(resRef, { ...base, startedAt: FieldValue.serverTimestamp(), category, appliedBy: ctx.name, appliedById: ctx.uid, appliedByRole: ctx.role, relatedId: related?.id || null, relatedType: related?.type || null, clientMessage: notify ? clientMessage : null, internalNote, status: 'active', historyId: actionRef.id, auditId: audit.ref.id, ...extra })
    const closeRestriction = (d, r) => tx.update(db().collection('account_restrictions').doc(d.id), { status: 'closed', endedAt: FieldValue.serverTimestamp(), endedBy: ctx.name, endedById: ctx.uid, endReason: category, ...r })
    const flags = (patch) => tx.update(user.ref, { ...patch, [F.updated]: FieldValue.serverTimestamp() })
    let msg

    if (meta.kind === 'booking' || meta.kind === 'messaging' || meta.kind === 'payments') {
      if (active.some((x) => x.kind === meta.kind)) fail('That restriction is already active on this account.')
      const dur = duration()
      newRestriction({ kind: meta.kind, label: meta.history, scope: [meta.kind === 'payments' ? 'wallet' : meta.kind], scopeLabel: meta.scope, endsAt: dur.endsAt, durationId: dur.durationId })
      history({ action: meta.history, reason: category, scope: meta.scope, status: 'active', detail: detail({ durationLabel: dur.label }) })
      flags({ [`accessFlags.${meta.kind === 'payments' ? 'payment' : meta.kind}`]: false })
      notice(`${meta.history} applied`, 'In-App')
      msg = `${meta.history} applied. Existing bookings are unchanged.`
    } else if (action === 'suspend') {
      let scope = Array.isArray(body.scope) ? body.scope.filter((s) => SCOPES.some((x) => x.id === s)) : []
      if (!scope.length) bad('Choose what should be restricted. Use the smallest appropriate restriction.')
      if (scope.includes('wallet') && !perms.finance) fail('Restricting wallet / financial actions needs Finance permission.')
      if (scope.includes('full')) scope = ['full']
      const dur = duration()
      const label = scopeLabelOf(scope)
      newRestriction({ kind: 'suspension', label: 'Account Suspension', scope, scopeLabel: label, endsAt: dur.endsAt, durationId: dur.durationId })
      history({ action: meta.history, reason: category, scope: label, status: 'active', detail: detail({ durationLabel: dur.label }) })
      flags({ [F.status]: RAW_STATUS.suspended, suspendedAt: FieldValue.serverTimestamp(), suspensionScope: scope })
      notice('Account restricted', 'Email')
      msg = `Account suspended (${label}). ${upcoming ? `${upcoming} existing booking${upcoming > 1 ? 's were' : ' was'} not cancelled.` : ''}`.trim()
    } else if (action === 'reactivate') {
      for (const x of active.filter((y) => y.kind === 'suspension')) {
        closeRestriction(x, {})
        if (x.historyId) tx.update(db().collection('account_actions').doc(x.historyId), { status: 'removed' })
      }
      flags({ [F.status]: RAW_STATUS.active, suspensionScope: FieldValue.delete(), reactivatedAt: FieldValue.serverTimestamp() })
      history({ action: meta.history, reason: category, scope: 'Account', status: 'completed', detail: detail() })
      notice('Account reactivated', 'Email')
      msg = 'Account reactivated. The suspension is closed in history, not deleted.'
    } else if (action === 'deactivate') {
      flags({ [F.status]: RAW_STATUS.deactivated, deactivatedAt: FieldValue.serverTimestamp() })
      history({ action: meta.history, reason: category, scope: 'Account', status: 'active', detail: detail() })
      notice('Account deactivated', 'Email')
      msg = `Account deactivated. Historical records are preserved.${upcoming ? ' Existing bookings still need separate review.' : ''}`
    } else if (action === 'lift') {
      if (!perms.manage) fail('You do not have permission to change this account.')
      const target = active.find((x) => x.id === body.restrictionId)
      if (!target) fail('That restriction is no longer active. Refresh to see the latest state.')
      closeRestriction(target, {})
      if (target.historyId) tx.update(db().collection('account_actions').doc(target.historyId), { status: 'removed' })
      if (target.kind === 'suspension') flags({ [F.status]: RAW_STATUS.active, suspensionScope: FieldValue.delete() })
      else if (['booking', 'messaging', 'payments'].includes(target.kind)) flags({ [`accessFlags.${target.kind === 'payments' ? 'payment' : target.kind}`]: true })
      history({ action: target.kind === 'review' ? 'Review Ended' : 'Restriction Removed', reason: category, scope: target.scopeLabel || 'Account', status: 'completed', detail: detail() })
      notice(`${target.label} removed`, 'In-App')
      msg = `${target.label} ended. The original record is kept in history.`
    } else if (action === 'place_review') {
      newRestriction({ kind: 'review', label: 'Account Under Review', scope: [], scopeLabel: 'Account', endsAt: null, durationId: 'until_reviewed' })
      history({ action: meta.history, reason: category, scope: 'Account', status: 'active', detail: detail() })
      notice('Account under review', 'In-App')
      msg = 'Account placed under review. Access is not affected.'
    } else {
      history({ action: meta.history, reason: category, scope: 'Account', status: 'completed', detail: detail() })
      notice(action === 'send_warning' ? 'Account warning sent' : 'Information requested', 'Email')
      msg = action === 'send_warning' ? 'Warning issued and recorded.' : 'Information request sent to the client.'
    }
    tx.set(audit.ref, audit.data)
    return msg
  })
  return { ok: true, message, bookingsAffected: 0, upcomingBookings: upcoming }
})
