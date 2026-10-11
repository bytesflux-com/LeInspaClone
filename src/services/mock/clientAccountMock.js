// Demo data for ADM-019 (Client Account Actions). Used only while the `adminGetClientAccount` /
// `adminApplyClientAccountAction` Cloud Functions are not deployed.
//
// There is NO second Admin copy of the client account. The shapes below mirror what the real
// `users` record, `account_restrictions`, `account_actions`, `notifications`, `bookings` and the
// case systems (`safety_reports`, `disputes`, `support_tickets`) would produce when aggregated for
// one client. CL-78421 mirrors the ADM-019 mockup.
//
// Rules this mock (and therefore the real backend) follows:
//  • Account status and restrictions are SEPARATE: scoped restriction records, never one flag.
//  • Every action is re-validated against the LATEST state — the browser only collects a request.
//  • Existing bookings are never silently cancelled; their impact is shown for separate review.
//  • Suspending never touches wallet funds. Financial restrictions need Finance permission.
//  • Client-facing reason and internal note are stored separately.
//  • Nothing is ever erased: ending a restriction closes it historically and adds a new event.
import { MOCK_CURRENCY, DAY_MS } from './clientDirectoryMock'
import { buildClientProfile, PROFILE_AS_OF } from './clientProfileMock'
import {
  ACTION_META,
  CLIENT_TEMPLATES,
  DEACTIVATE_REASONS,
  DURATIONS,
  LIFT_REASONS,
  MAX_CLIENT_MESSAGE,
  MIN_NOTE,
  OTHER_REASON,
  REACTIVATE_REASONS,
  RESTRICT_REASONS,
  SUSPEND_REASONS,
  SUSPENSION_SCOPES,
} from '../../constants/clientAccount'

const FX = { KE: 1, UG: 28, TZ: 19, RW: 10, ZA: 0.14 }
const hashOf = (text) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
const at = (y, m, d, hh, mm, tz = 3) => new Date(Date.UTC(y, m - 1, d, hh - tz, mm)).toISOString()
const iso = (ms) => new Date(ms).toISOString()
const CAP = (s) => (s ? `${s[0].toUpperCase()}${s.slice(1)}` : s)

const store = new Map()
let seq = 100

// ---------- seed ----------

function seededHistory() {
  const h = (id, when, action, reason, scope, admin, status, detail = {}) => ({
    id, at: when, action, reason, scope, admin, status,
    detail: { category: reason, durationLabel: null, clientMessage: null, internalNote: null, related: null, notified: false, ...detail },
  })
  return [
    h('ACT-2041', at(2026, 9, 12, 11, 20), 'Warning Issued', 'Professional conduct policy', 'Account', 'Jane', 'completed', {
      clientMessage: 'This is a formal reminder of the Lé Inspa professional conduct policy that applies to your account.',
      internalNote: 'Second complaint from a provider about late-night messages. First formal warning.', notified: true,
    }),
    h('ACT-2007', at(2026, 8, 4, 9, 45), 'Booking Restriction', 'Payment investigation', 'Bookings', 'Peter', 'removed', {
      durationLabel: 'Until reviewed',
      clientMessage: 'You are temporarily unable to create new bookings while we review your account. Existing bookings are not affected.',
      internalNote: 'Chargeback flagged by the payment processor. Restriction lifted once the issuer confirmed the payment.', notified: true,
    }),
    h('ACT-1996', at(2026, 8, 1, 15, 5), 'Notice Sent', 'Verify identity', 'Account', 'Mary', 'completed', {
      clientMessage: 'Please confirm your identity so we can complete an account review.', internalNote: 'Name on wallet top-up did not match the account name.', notified: true,
    }),
    h('ACT-1934', at(2026, 6, 12, 14, 30), 'Restriction Removed', 'Investigation completed', 'Messages', 'John', 'completed', {
      clientMessage: 'The restriction on your account has been removed. Thank you for your patience.', internalNote: 'Review closed — no further action required.', notified: true,
    }),
    h('ACT-1921', at(2026, 6, 5, 10, 10), 'Support Follow Up', 'Account access issue', 'Account', 'Jane', 'completed', {
      internalNote: 'Client could not sign in after resetting the password. Session tokens cleared.', related: { id: 'SUP-4701', type: 'support' },
    }),
  ]
}

function seededNotifications() {
  const n = (id, when, message, channel, body) => ({ id, at: when, message, channel, status: 'delivered', body })
  return [
    n('NTF-9120', at(2026, 9, 12, 11, 21), 'Account warning sent', 'Email', 'This is a formal reminder of the Lé Inspa professional conduct policy that applies to your account. Please review our Terms of Service.'),
    n('NTF-9044', at(2026, 8, 4, 16, 2), 'Booking restriction removed', 'In-App', 'The restriction on your account has been removed. You can create new bookings again. Thank you for your patience.'),
    n('NTF-9001', at(2026, 8, 1, 15, 6), 'Identity verification requested', 'Email', 'Please confirm your identity so we can complete an account review. Reply to this email or open the app to continue.'),
    n('NTF-8870', at(2026, 6, 5, 10, 40), 'Support case update', 'In-App', 'Our team has updated your support case. Open the app to read the latest reply.'),
    n('NTF-8412', at(2026, 5, 28, 9, 0), 'Welcome to Lé Inspa', 'Email', 'Welcome to Lé Inspa — your wellness journey starts here.'),
  ]
}

function bookingsFor(r, fx, asOf) {
  if (r.id === 'CL-78421') {
    return [
      { id: 'LI-48291', service: 'Deep Tissue Massage', scheduledAt: at(2026, 9, 12, 10, 0), amount: 4500 },
      { id: 'LI-49382', service: 'Swedish Massage', scheduledAt: at(2026, 9, 16, 14, 0), amount: 3000 },
    ]
  }
  if (!r.hasUpcoming) return []
  const seed = hashOf(r.id)
  return [{ id: `LI-${20000 + (seed % 70000)}`, service: ['Deep Tissue Massage', 'Swedish Massage', 'Hot Stone Massage'][seed % 3], scheduledAt: iso(asOf + 3 * DAY_MS), amount: Math.round((3000 + (seed % 4) * 500) * fx) }]
}

function casesFor(r) {
  if (r.id === 'CL-78421') {
    return {
      counts: { safety: 0, disputes: 0, support: 1 },
      related: [
        { id: 'SAF-2811', type: 'safety', label: 'Safety case SAF-2811', status: 'Closed' },
        { id: 'DSP-3918', type: 'dispute', label: 'Dispute DSP-3918', status: 'Resolved' },
        { id: 'SUP-4812', type: 'support', label: 'Support case SUP-4812', status: 'In Review' },
      ],
    }
  }
  const seed = hashOf(r.id)
  const related = []
  if (r.safetyCase) related.push({ id: `SAF-${2000 + (seed % 900)}`, type: 'safety', label: `Safety case SAF-${2000 + (seed % 900)}`, status: 'Under Investigation' })
  if (r.openDisputes) related.push({ id: `DSP-${3000 + (seed % 900)}`, type: 'dispute', label: `Dispute DSP-${3000 + (seed % 900)}`, status: 'Open' })
  if (r.supportTickets) related.push({ id: `SUP-${4000 + (seed % 900)}`, type: 'support', label: `Support case SUP-${4000 + (seed % 900)}`, status: 'In Review' })
  return { counts: { safety: r.safetyCase ? 1 : 0, disputes: r.openDisputes || 0, support: r.supportTickets || 0 }, related }
}

function initialState(r) {
  const seeded = r.id === 'CL-78421'
  const seed = hashOf(r.id)
  const joined = iso(r.joinedAt)
  const state = {
    status: r.status,
    restrictions: [],
    history: seeded ? seededHistory() : [],
    notifications: seeded ? seededNotifications() : [{ id: `NTF-${seed % 9000}`, at: joined, message: 'Welcome to Lé Inspa', channel: 'Email', status: 'delivered', body: 'Welcome to Lé Inspa — your wellness journey starts here.' }],
  }

  if (r.status === 'suspended') {
    const cases = casesFor(r)
    const safety = cases.related.find((c) => c.type === 'safety')
    const started = at(2026, 9, 12, 9, 30)
    state.restrictions.push({
      id: 'RST-0412', kind: 'suspension', label: 'Account Suspension', scope: ['booking', 'messaging'], scopeLabel: 'Bookings + Messaging',
      startedAt: started, endsAt: null, durationId: 'until_reviewed', category: 'Policy Violation', appliedBy: 'Jane', appliedByRole: 'Trust & Safety',
      related: safety ? { id: safety.id, type: safety.type } : { id: 'SAF-2811', type: 'safety' }, clientMessage: CLIENT_TEMPLATES.suspend[0],
      internalNote: 'Pending review of conduct reports.', status: 'active', historyId: 'ACT-2050',
    })
    state.history.unshift({
      id: 'ACT-2050', at: started, action: 'Account Suspended', reason: 'Policy Violation', scope: 'Bookings + Messaging', admin: 'Jane', status: 'active',
      detail: { category: 'Policy Violation', durationLabel: 'Until reviewed', clientMessage: CLIENT_TEMPLATES.suspend[0], internalNote: 'Pending review of conduct reports.', related: { id: safety?.id || 'SAF-2811', type: 'safety' }, notified: true },
    })
    state.notifications.unshift({ id: 'NTF-9210', at: started, message: 'Account restricted', channel: 'Email', status: 'delivered', body: CLIENT_TEMPLATES.suspend[0] })
  } else if (r.status === 'deactivated') {
    const when = at(2026, 8, 20, 12, 0)
    state.history.unshift({
      id: 'ACT-2030', at: when, action: 'Account Deactivated', reason: 'Client request', scope: 'Account', admin: 'Mary', status: 'active',
      detail: { category: 'Client request', durationLabel: null, clientMessage: CLIENT_TEMPLATES.deactivate[1], internalNote: 'Client asked support to close the account.', related: null, notified: true },
    })
  }
  return state
}

function stateFor(r) {
  if (!store.has(r.id)) store.set(r.id, initialState(r))
  return store.get(r.id)
}

// ---------- view building ----------

const activeOf = (st) => st.restrictions.filter((x) => x.status === 'active')

function describeExpiry(x, tz) {
  if (x.kind === 'review') return 'Until review ends'
  if (x.durationId === 'indefinite') return 'Indefinite'
  if (x.endsAt) return { at: x.endsAt }
  return 'Until reviewed'
}

function accessFor(r, st) {
  const access = { client: 'enabled', booking: 'enabled', payment: 'enabled', messaging: 'enabled' }
  let membership = r.membership === 'none' ? 'No membership' : `${CAP(r.membership)} — Active`
  for (const x of activeOf(st)) {
    if (x.kind === 'booking') access.booking = 'restricted'
    if (x.kind === 'messaging') access.messaging = 'restricted'
    if (x.kind === 'payments') access.payment = 'restricted'
    if (x.kind === 'suspension') {
      for (const s of x.scope) {
        if (s === 'booking') access.booking = 'suspended'
        if (s === 'messaging') access.messaging = 'suspended'
        if (s === 'wallet') access.payment = 'suspended'
        if (s === 'membership') membership = `${CAP(r.membership)} — Benefits paused`
        if (s === 'full') {
          access.client = 'suspended'
          access.booking = 'suspended'
          access.payment = 'suspended'
          access.messaging = 'suspended'
          membership = r.membership === 'none' ? membership : `${CAP(r.membership)} — Suspended`
        }
      }
    }
  }
  if (st.status === 'deactivated') {
    for (const k of Object.keys(access)) access[k] = 'disabled'
    membership = r.membership === 'none' ? membership : `${CAP(r.membership)} — Paused`
  }
  return { access, membership }
}

function hideRelated(rel, perms) {
  if (!rel) return null
  if (rel.type === 'safety' && !perms.safety) return { restricted: true, type: 'safety' }
  return rel
}

function permittedFor(st, perms, activeList) {
  const can = perms.manage
  const none = 'You need account-management permission for this action.'
  const hasKind = (k) => activeList.some((x) => x.kind === k)
  const suspended = st.status === 'suspended'
  const deactivated = st.status === 'deactivated'
  const out = {
    restrict_booking: { allowed: can && !deactivated, reason: !can ? none : deactivated ? 'The account is deactivated.' : null },
    restrict_messaging: { allowed: can && !deactivated, reason: !can ? none : deactivated ? 'The account is deactivated.' : null },
    restrict_payments: { allowed: can && perms.finance && !deactivated, reason: !can ? none : !perms.finance ? 'Only authorised Finance or Security roles can restrict payments / wallet.' : deactivated ? 'The account is deactivated.' : null },
    request_info: { allowed: can && !deactivated, reason: !can ? none : deactivated ? 'The account is deactivated.' : null },
    send_warning: { allowed: can && !deactivated, reason: !can ? none : deactivated ? 'The account is deactivated.' : null },
    place_review: { allowed: can && !deactivated && !hasKind('review'), reason: !can ? none : deactivated ? 'The account is deactivated.' : hasKind('review') ? 'A review is already active.' : null },
    suspend: { allowed: can && !suspended && !deactivated, reason: !can ? none : suspended ? 'The account is already suspended.' : deactivated ? 'The account is deactivated.' : null },
    reactivate: { allowed: can && (suspended || deactivated), reason: !can ? none : 'Only available for suspended or deactivated accounts.' },
    deactivate: { allowed: can && !deactivated, reason: !can ? none : 'The account is already deactivated.' },
  }
  return out
}

export function buildClientAccount(r, perms = {}) {
  const profile = buildClientProfile(r)
  const st = stateFor(r)
  const fx = FX[r.country] || 1
  const currency = MOCK_CURRENCY[r.country] || 'USD'
  const tz = profile.timeZone
  const cases = casesFor(r)
  const bookings = bookingsFor(r, fx, PROFILE_AS_OF)
  const active = activeOf(st)
  const { access, membership } = accessFor(r, st)

  const client = {
    id: profile.id, name: profile.name, photoURL: profile.photoURL, gender: profile.gender, membershipTier: profile.membershipTier,
    status: st.status, contactVerified: profile.contactVerified, country: profile.country, countryName: profile.countryName,
    city: profile.city, joinedAt: profile.joinedAt, lastActiveAt: profile.lastActiveAt, asOf: profile.asOf, timeZone: tz, currency,
  }

  const view = (x) => ({
    id: x.id, kind: x.kind, label: x.label, scope: x.scope, scopeLabel: x.scopeLabel, startedAt: x.startedAt, endsAt: x.endsAt || null,
    durationId: x.durationId, expires: describeExpiry(x, tz), category: perms.safety || x.related?.type !== 'safety' ? x.category : null,
    appliedBy: x.appliedBy, appliedByRole: x.appliedByRole, related: hideRelated(x.related, perms), clientMessage: x.clientMessage, status: x.status,
    impact: x.kind === 'review' ? 'none' : 'access',
  })

  const suspension = active.find((x) => x.kind === 'suspension')
  const permitted = permittedFor(st, perms, active)

  return {
    asOf: profile.asOf,
    client,
    account: {
      status: st.status,
      access,
      membership,
      underReview: active.some((x) => x.kind === 'review'),
      restrictionCount: active.length,
      suspension: suspension ? view(suspension) : null,
    },
    review: {
      safety: perms.safety ? cases.counts.safety : null,
      disputes: cases.counts.disputes,
      support: cases.counts.support,
      bookings: bookings.length,
    },
    bookings: bookings.map((b) => ({ ...b, amount: perms.finance ? b.amount : undefined })),
    bookingCount: bookings.length,
    restrictions: active.map(view),
    history: st.history.map((h) => ({
      id: h.id, at: h.at, action: h.action, reason: h.reason, scope: h.scope, admin: h.admin, status: h.status,
      detail: { ...h.detail, related: hideRelated(h.detail.related, perms) },
    })),
    notifications: st.notifications,
    relatedCases: cases.related.filter((c) => perms.safety || c.type !== 'safety'),
    permitted,
    config: {
      suspendReasons: SUSPEND_REASONS,
      restrictReasons: RESTRICT_REASONS,
      deactivateReasons: DEACTIVATE_REASONS,
      reactivateReasons: REACTIVATE_REASONS,
      liftReasons: LIFT_REASONS,
      durations: DURATIONS.map((d) => ({ id: d.id, allowed: !d.needs || perms[d.needs] === true })),
      scopes: SUSPENSION_SCOPES.map((s) => ({ id: s.id, allowed: !s.needs || perms[s.needs] === true })),
    },
    securityVerification: { required: ['suspend', 'reactivate', 'deactivate', 'restrict_payments'] },
  }
}

// ---------- validation + mutation ----------

const fail = (message) => {
  throw new Error(message)
}

function scopeLabelOf(scope) {
  return scope.map((id) => SUSPENSION_SCOPES.find((s) => s.id === id)?.short || id).join(' + ')
}

export function applyAccountAction(r, payload, perms = {}) {
  const { action } = payload
  const meta = ACTION_META[action]
  if (!meta) fail('That action is not recognised.')
  if (!perms.manage) fail('You do not have permission to change this account.')

  const st = stateFor(r)
  const active = activeOf(st)
  const permitted = permittedFor(st, perms, active)
  const requested = action === 'lift' ? null : permitted[action]
  if (requested && !requested.allowed) fail(requested.reason || 'This action is not available right now.')

  // Reason is mandatory for every action.
  const category = (payload.category || '').trim()
  if (!category) fail('Select a reason before continuing.')
  if (!meta.reasons.includes(category)) fail('That reason is not on the approved list.')
  const internalNote = (payload.internalNote || '').trim()
  if (category === OTHER_REASON && internalNote.length < MIN_NOTE) fail(`Add an internal note of at least ${MIN_NOTE} characters for this reason.`)

  const notify = payload.notify !== false
  const clientMessage = (payload.clientMessage || '').trim()
  if (notify && !clientMessage) fail('Add the message the client will receive, or turn client notification off.')
  if (clientMessage.length > MAX_CLIENT_MESSAGE) fail(`The client message can be at most ${MAX_CLIENT_MESSAGE} characters.`)

  const related = payload.relatedId ? casesFor(r).related.find((c) => c.id === payload.relatedId) : null
  if (payload.relatedId && !related) fail('That related case does not belong to this client.')
  if (related?.type === 'safety' && !perms.safety) fail('You do not have access to that safety case.')

  const now = new Date().toISOString()
  const admin = payload.actor || 'You'
  const id = () => `${++seq}`

  // Build the duration for restrictions / suspensions.
  const duration = () => {
    const id0 = payload.duration || 'until_reviewed'
    const d = DURATIONS.find((x) => x.id === id0)
    if (!d) fail('Select a valid duration.')
    if (d.needs && perms[d.needs] !== true) fail('Indefinite restrictions need a higher permission level.')
    if (id0 === 'custom') {
      const days = Number(payload.customDays)
      if (!Number.isInteger(days) || days < 1 || days > 365) fail('Enter a custom duration between 1 and 365 days.')
      return { durationId: id0, label: `${days} ${days === 1 ? 'day' : 'days'}`, endsAt: iso(Date.now() + days * DAY_MS) }
    }
    return { durationId: id0, label: d.label, endsAt: d.hours ? iso(Date.now() + d.hours * 3_600_000) : null }
  }

  const detail = (extra = {}) => ({ category, durationLabel: null, clientMessage: notify ? clientMessage : null, internalNote: internalNote || null, related: related ? { id: related.id, type: related.type } : null, notified: notify, ...extra })
  const pushHistory = (h) => st.history.unshift({ id: `ACT-${id()}`, at: now, admin, ...h })
  const pushNotice = (message, channel) => notify && st.notifications.unshift({ id: `NTF-${id()}`, at: now, message, channel, status: 'delivered', body: clientMessage })
  const bookingsAffected = bookingsFor(r, FX[r.country] || 1, PROFILE_AS_OF).length

  if (['restrict_booking', 'restrict_messaging', 'restrict_payments'].includes(action)) {
    if (active.some((x) => x.kind === meta.kind)) fail('That restriction is already active on this account.')
    const dur = duration()
    const rid = `RST-${id()}`
    const hid = `ACT-${id()}`
    st.restrictions.push({
      id: rid, kind: meta.kind, label: meta.history, scope: [meta.kind === 'booking' ? 'booking' : meta.kind === 'messaging' ? 'messaging' : 'wallet'], scopeLabel: meta.scope,
      startedAt: now, endsAt: dur.endsAt, durationId: dur.durationId, category, appliedBy: admin, appliedByRole: payload.actorRole || 'Admin',
      related: related ? { id: related.id, type: related.type } : null, clientMessage: notify ? clientMessage : null, internalNote, status: 'active', historyId: hid,
    })
    st.history.unshift({ id: hid, at: now, action: meta.history, reason: category, scope: meta.scope, admin, status: 'active', detail: detail({ durationLabel: dur.label }) })
    pushNotice(`${meta.history} applied`, 'In-App')
    return { ok: true, message: `${meta.history} applied. Existing bookings are unchanged.`, bookingsAffected: 0 }
  }

  if (action === 'suspend') {
    if (active.some((x) => x.kind === 'suspension')) fail('This account is already suspended.')
    let scope = Array.isArray(payload.scope) ? payload.scope.filter((s) => SUSPENSION_SCOPES.some((x) => x.id === s)) : []
    if (!scope.length) fail('Choose what should be restricted. Use the smallest appropriate restriction.')
    if (scope.includes('wallet') && !perms.finance) fail('Restricting wallet / financial actions needs Finance permission.')
    if (scope.includes('full')) scope = ['full']
    const dur = duration()
    const rid = `RST-${id()}`
    const hid = `ACT-${id()}`
    const label = scopeLabelOf(scope)
    st.restrictions.push({
      id: rid, kind: 'suspension', label: 'Account Suspension', scope, scopeLabel: label, startedAt: now, endsAt: dur.endsAt, durationId: dur.durationId,
      category, appliedBy: admin, appliedByRole: payload.actorRole || 'Admin', related: related ? { id: related.id, type: related.type } : null,
      clientMessage: notify ? clientMessage : null, internalNote, status: 'active', historyId: hid,
    })
    st.status = 'suspended'
    st.history.unshift({ id: hid, at: now, action: 'Account Suspended', reason: category, scope: label, admin, status: 'active', detail: detail({ durationLabel: dur.label }) })
    pushNotice('Account restricted', 'Email')
    return { ok: true, message: `Account suspended (${label}). ${bookingsAffected ? `${bookingsAffected} existing booking${bookingsAffected > 1 ? 's were' : ' was'} not cancelled.` : ''}`.trim(), bookingsAffected }
  }

  if (action === 'reactivate') {
    if (st.status !== 'suspended' && st.status !== 'deactivated') fail('Only suspended or deactivated accounts can be reactivated.')
    for (const x of active.filter((y) => y.kind === 'suspension')) {
      x.status = 'closed'
      x.endedAt = now
      x.endedBy = admin
      x.endReason = category
      const h = st.history.find((y) => y.id === x.historyId)
      if (h) h.status = 'removed'
    }
    if (st.status === 'deactivated') {
      const h = st.history.find((y) => y.action === 'Account Deactivated' && y.status === 'active')
      if (h) h.status = 'removed'
    }
    st.status = 'active'
    pushHistory({ action: 'Account Reactivated', reason: category, scope: 'Account', status: 'completed', detail: detail() })
    pushNotice('Account reactivated', 'Email')
    return { ok: true, message: 'Account reactivated. The suspension is closed in history, not deleted.' }
  }

  if (action === 'deactivate') {
    if (st.status === 'deactivated') fail('This account is already deactivated.')
    st.status = 'deactivated'
    pushHistory({ action: 'Account Deactivated', reason: category, scope: 'Account', status: 'active', detail: detail() })
    pushNotice('Account deactivated', 'Email')
    return { ok: true, message: `Account deactivated. Historical records are preserved.${bookingsAffected ? ' Existing bookings still need separate review.' : ''}`, bookingsAffected }
  }

  if (action === 'lift') {
    const target = active.find((x) => x.id === payload.restrictionId)
    if (!target) fail('That restriction is no longer active. Refresh to see the latest state.')
    target.status = 'closed'
    target.endedAt = now
    target.endedBy = admin
    target.endReason = category
    const h = st.history.find((y) => y.id === target.historyId)
    if (h) h.status = 'removed'
    if (target.kind === 'suspension') st.status = 'active'
    pushHistory({ action: target.kind === 'review' ? 'Review Ended' : 'Restriction Removed', reason: category, scope: target.scopeLabel || 'Account', status: 'completed', detail: detail() })
    pushNotice(`${target.label} removed`, 'In-App')
    return { ok: true, message: `${target.label} ended. The original record is kept in history.` }
  }

  if (action === 'place_review') {
    if (active.some((x) => x.kind === 'review')) fail('A review is already active on this account.')
    const rid = `RST-${id()}`
    const hid = `ACT-${id()}`
    st.restrictions.push({
      id: rid, kind: 'review', label: 'Account Under Review', scope: [], scopeLabel: 'Account', startedAt: now, endsAt: null, durationId: 'until_reviewed', category,
      appliedBy: admin, appliedByRole: payload.actorRole || 'Admin', related: related ? { id: related.id, type: related.type } : null, clientMessage: notify ? clientMessage : null, internalNote, status: 'active', historyId: hid,
    })
    st.history.unshift({ id: hid, at: now, action: meta.history, reason: category, scope: 'Account', admin, status: 'active', detail: detail() })
    pushNotice('Account under review', 'In-App')
    return { ok: true, message: 'Account placed under review. Access is not affected.' }
  }

  // request_info · send_warning
  pushHistory({ action: meta.history, reason: category, scope: 'Account', status: 'completed', detail: detail() })
  pushNotice(action === 'send_warning' ? 'Account warning sent' : 'Information requested', 'Email')
  return { ok: true, message: action === 'send_warning' ? 'Warning issued and recorded.' : 'Information request sent to the client.' }
}
