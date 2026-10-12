// ADM-028 — Provider Account Actions / Suspension. Pure logic for the
// controlled enforcement screen. Extends the existing account architecture
// (users.accountStatus / provider profile status) — no admin-only status
// system, no suspended copies of provider profiles.
//
//   account_restrictions   scoped restrictions (kind + optional branch/location target)
//   account_actions        append-only enforcement history
//   notifications          what the provider was told
//
// Rules: account status and restrictions are separate; existing bookings are
// never cancelled here; funds are never confiscated — a withdrawal restriction
// is its own permission-controlled action; every action needs a reason; history
// is never erased (reactivation is a new event).

import { DAY, HOUR, caseLink, clean, dayBucket, lower, toMillis } from './providerAdminShared.js'

export const ACCOUNT_STATUSES = ['active', 'under_review', 'suspended', 'deactivated']

export const RESTRICTION_KINDS = {
  new_bookings: { label: 'New Bookings', title: 'Restrict New Bookings', description: 'Prevents the provider from accepting new bookings. Existing bookings remain unless separately managed.' },
  messaging: { label: 'Messaging', title: 'Restrict Messaging', description: 'Restricts provider-client messaging where justified.' },
  public_visibility: { label: 'Public Profile Visibility', title: 'Restrict Public Visibility', description: 'Hide or limit marketplace visibility.' },
  withdrawals: { label: 'Withdrawals', title: 'Restrict Withdrawals', description: 'Finance/Security roles only, with a legitimate reason.', finance: true },
  profile_changes: { label: 'Service / Profile Updates', title: 'Restrict Service Changes', description: 'Prevents unreviewed service/profile changes.' },
  subscription_benefits: { label: 'Subscription Benefits', title: 'Restrict Subscription Benefits', description: 'Pauses paid visibility benefits without touching billing.' },
  full_access: { label: 'Full Account Access', title: 'Full Account Access', description: 'All provider access.' },
}

export const SCOPED_RESTRICTIONS = ['new_bookings', 'messaging', 'public_visibility', 'withdrawals', 'profile_changes']

export const REASON_CATEGORIES = [
  { code: 'safety_concern', label: 'Safety Concern' },
  { code: 'professional_conduct', label: 'Professional Conduct' },
  { code: 'fraud_payment_review', label: 'Fraud / Payment Review' },
  { code: 'verification_issue', label: 'Verification Issue' },
  { code: 'compliance_requirement', label: 'Compliance Requirement' },
  { code: 'abusive_behaviour', label: 'Abusive Behaviour' },
  { code: 'repeated_violations', label: 'Repeated Policy Violations' },
  { code: 'account_security', label: 'Account Security' },
  { code: 'late_cancellation_pattern', label: 'Late Cancellation Pattern' },
  { code: 'missing_information', label: 'Missing / Outdated Information' },
  { code: 'other_approved', label: 'Other Approved Reason' },
]

export const REACTIVATION_REASONS = [
  { code: 'investigation_cleared', label: 'Investigation completed — no continuing restriction required' },
  { code: 'requirements_met', label: 'Provider met the outstanding requirements' },
  { code: 'appeal_upheld', label: 'Provider appeal upheld' },
  { code: 'restriction_error', label: 'Restriction applied in error' },
]

export const DURATIONS = [
  { code: 'until_review', label: 'Until reviewed', ms: null },
  { code: '24h', label: '24 hours', ms: 24 * HOUR },
  { code: '7d', label: '7 days', ms: 7 * DAY },
  { code: '30d', label: '30 days', ms: 30 * DAY },
  { code: 'custom', label: 'Custom date', ms: null },
  { code: 'indefinite', label: 'Indefinite — higher permission only', ms: null, elevated: true },
]

export const ACCOUNT_ACTIONS = ['request_info', 'warn', 'place_review', 'end_review', 'restrict', 'lift_restriction', 'suspend', 'reactivate', 'deactivate']

export const DEFAULT_ACCOUNT_POLICY = {
  requireCaseForSuspension: true,
  requireCaseForDeactivation: false,
}

export const MESSAGE_TEMPLATES = {
  request_info: 'We need some additional or updated information to keep your Lé Inspa account in good standing. Please review the request in your provider app.',
  warn: 'This is a formal notice about your Lé Inspa account. Please review our provider standards to avoid further action.',
  place_review: 'Your Lé Inspa account is being reviewed. Your access is not affected unless we notify you otherwise.',
  restrict: 'Some features of your Lé Inspa account have been temporarily restricted while we review an account matter.',
  suspend: 'Your Lé Inspa account has been temporarily restricted while we review an account matter. We will notify you when the review is complete.',
  reactivate: 'Your Lé Inspa account access has been restored. Thank you for your patience.',
  deactivate: 'Your Lé Inspa provider account has been deactivated in line with our platform policies.',
  lift_restriction: 'A restriction on your Lé Inspa account has been lifted.',
  end_review: 'The review of your Lé Inspa account is complete. No further action is required.',
}

const HIGH_IMPACT = ['suspend', 'reactivate', 'deactivate']

// Fresh session verification is required for configured high-risk actions.
export function requiresFreshAuth(input = {}) {
  if (HIGH_IMPACT.includes(input.action)) return true
  return input.action === 'restrict' && input.kind === 'withdrawals'
}

export function normalizeRestriction(id, r = {}) {
  if (!r || !r.kind || !RESTRICTION_KINDS[r.kind]) return null // legacy status-log docs
  return {
    id: r.restrictionId || id,
    docId: id,
    kind: r.kind,
    label: RESTRICTION_KINDS[r.kind].label,
    scopeTarget: r.scopeTarget || { type: 'account', id: null, name: 'Entire account' },
    status: lower(r.status || 'active'),
    reasonCode: r.reasonCode || null,
    reasonLabel: r.reasonLabel || null,
    caseId: r.caseId || null,
    startedAt: toMillis(r.startedAt || r.createdAt),
    expiresAt: toMillis(r.expiresAt),
    durationCode: r.durationCode || null,
    appliedByName: r.appliedByName || null,
    actionId: r.actionId || null,
    liftedAt: toMillis(r.liftedAt),
    liftedByName: r.liftedByName || null,
  }
}

// Expired restrictions are no longer enforced even before a cleanup job runs.
export function effectiveRestrictions(restrictions = [], now = Date.now()) {
  return restrictions
    .filter(Boolean)
    .map((r) => (r.status === 'active' && r.expiresAt && r.expiresAt <= now ? { ...r, status: 'expired' } : r))
}

export function normalizeAction(id, a = {}) {
  return {
    id: a.actionId || id,
    action: a.action,
    label: a.label || a.action,
    scope: a.scopeLabel || (Array.isArray(a.scope) ? a.scope.map((k) => RESTRICTION_KINDS[k]?.label || k).join(' + ') : a.scope) || 'Account',
    reasonLabel: a.reasonLabel || null,
    adminName: a.adminName || null,
    at: toMillis(a.createdAt || a.at),
    status: lower(a.status || 'completed'),
    caseId: a.caseId || null,
    durationLabel: a.durationLabel || null,
    expiresAt: toMillis(a.expiresAt),
    previousStatus: a.previousStatus || null,
    newStatus: a.newStatus || null,
  }
}

export function accessMatrix(accountStatus, restrictions = []) {
  const active = restrictions.filter((r) => r.status === 'active')
  const accountWide = (kind) => active.some((r) => (r.kind === kind || r.kind === 'full_access') && (!r.scopeTarget || r.scopeTarget.type === 'account'))
  const partial = (kind) => active.some((r) => r.kind === kind && r.scopeTarget && r.scopeTarget.type !== 'account')
  const off = accountStatus === 'deactivated'
  const row = (key, label, kind, on = 'Enabled', offLabel = 'Restricted') => {
    const restricted = off || accountWide(kind)
    return { key, label, state: restricted ? offLabel : partial(kind) ? 'Partially restricted' : on, restricted, partial: !restricted && partial(kind) }
  }
  return [
    { key: 'marketplace', label: 'Marketplace Access', state: off || accountWide('full_access') ? 'Disabled' : 'Enabled', restricted: off || accountWide('full_access') },
    row('new_bookings', 'New Bookings', 'new_bookings'),
    row('messaging', 'Messaging', 'messaging'),
    row('withdrawals', 'Payouts / Withdrawals', 'withdrawals'),
    row('subscription', 'Subscription Access', 'subscription_benefits'),
    row('public_profile', 'Public Profile', 'public_visibility', 'Visible', 'Hidden'),
  ]
}

const STATUS_META = {
  active: { label: 'Active', tone: 'green', summary: 'This provider currently has full access to Lé Inspa.' },
  under_review: { label: 'Under Review', tone: 'purple', summary: 'The account is under review. Configured access rules still apply.' },
  suspended: { label: 'Suspended', tone: 'red', summary: 'Selected provider access is suspended pending review.' },
  deactivated: { label: 'Deactivated', tone: 'red', summary: 'The provider account is deactivated. History is preserved.' },
}

export function permittedActions(provider, perms = {}) {
  const status = provider.accountStatus
  if (!perms.accountActions) return []
  const out = []
  if (status !== 'deactivated') out.push('request_info', 'warn', 'restrict', 'lift_restriction')
  if (status === 'active') out.push('place_review')
  if (status === 'under_review') out.push('end_review')
  if (status === 'active' || status === 'under_review') out.push('suspend')
  if (status === 'suspended') out.push('reactivate')
  if (status === 'deactivated' && perms.deactivate) out.push('reactivate')
  if (status !== 'deactivated' && perms.deactivate) out.push('deactivate')
  return out
}

export function buildAccountView({
  provider,
  restrictions: rawRestrictions = [],
  actions = [],
  notifications = [],
  bookings = [],
  cases = [],
  wallet = null,
  withdrawals = [],
  subscriptionStatus = null,
  assessment = null,
  notes = [],
  permissions = {},
  now = Date.now(),
}) {
  const restrictions = effectiveRestrictions(rawRestrictions, now)
  const active = restrictions.filter((r) => r.status === 'active')
  const status = ACCOUNT_STATUSES.includes(provider.accountStatus) ? provider.accountStatus : 'active'
  const meta = STATUS_META[status]
  const latestReview = actions.filter((a) => a.action === 'place_review').map((a) => normalizeAction(a.id, a)).sort((a, b) => (b.at || 0) - (a.at || 0))[0]
  const history = actions
    .map((a) => normalizeAction(a.id, a))
    .map((h) => {
      // An enforcement entry is "active" only while one of its restrictions is still enforced.
      if (h.action === 'restrict' || h.action === 'suspend') {
        const live = restrictions.some((r) => r.actionId === h.id && r.status === 'active') || (h.action === 'suspend' && status === 'suspended' && !restrictions.some((r) => r.actionId === h.id))
        return { ...h, status: live ? 'active' : 'completed' }
      }
      if (h.action === 'place_review') return { ...h, status: status === 'under_review' && latestReview?.id === h.id ? 'active' : 'completed' }
      return h
    })
    .sort((a, b) => (b.at || 0) - (a.at || 0))
  const lastSuspension = history.find((h) => h.action === 'suspend' || h.action === 'deactivate')

  const upcoming = bookings.filter((b) => b.status === 'upcoming' && (!b.startAt || b.startAt >= now - HOUR))
  const ongoing = bookings.filter((b) => b.status === 'ongoing')
  const buckets = { today: 0, tomorrow: 0, later: 0 }
  for (const b of upcoming) buckets[b.startAt ? dayBucket(b.startAt, now) : 'later'] += 1
  const refundPending = bookings.filter((b) => b.refundPending)
  const openCases = cases.filter((c) => c.open)
  const finance = Boolean(permissions.viewFinance)
  const heldEscrow = bookings.filter((b) => b.escrowStatus === 'held').reduce((s, b) => s + (b.amount || 0), 0)
  const pendingWithdrawal = withdrawals.filter((w) => ['pending', 'pending_approval', 'processing', 'under_review'].includes(lower(w.status))).reduce((s, w) => s + (Number(w.amount) || 0), 0)
  const financial = finance
    ? {
        pendingEscrow: typeof wallet?.pendingEscrow === 'number' ? wallet.pendingEscrow : heldEscrow,
        availableBalance: typeof wallet?.availableBalance === 'number' ? wallet.availableBalance : null,
        pendingWithdrawal,
        unresolvedRefunds: refundPending.reduce((s, b) => s + (b.amount || 0), 0),
        currency: provider.currency,
      }
    : null

  const sortedOpen = [...openCases].sort((a, b) => (b.severity === 'critical') - (a.severity === 'critical') || (b.createdAt || 0) - (a.createdAt || 0))
  const top = sortedOpen[0]

  const units = provider.category === 'spa' ? provider.branches : provider.category === 'hotel' ? provider.locations : []
  return {
    provider,
    account: {
      status,
      label: meta.label,
      tone: meta.tone,
      summary: active.length && status === 'active' ? `This provider is active with ${active.length} scoped restriction${active.length === 1 ? '' : 's'}.` : meta.summary,
      access: accessMatrix(status, restrictions),
      activeRestrictionCount: active.length,
      suspension: (status === 'suspended' || status === 'deactivated') && lastSuspension
        ? { since: lastSuspension.at, by: lastSuspension.adminName, reason: lastSuspension.reasonLabel, scope: lastSuspension.scope, duration: lastSuspension.durationLabel, caseId: lastSuspension.caseId, expiresAt: lastSuspension.expiresAt }
        : null,
    },
    review: {
      openSafetyCases: openCases.filter((c) => c.kind === 'safety').length,
      openDisputes: openCases.filter((c) => c.kind === 'dispute').length,
      upcomingBookings: upcoming.length,
      pendingEscrow: financial ? financial.pendingEscrow : null,
      pendingWithdrawal: financial ? financial.pendingWithdrawal : null,
      verification: provider.verified ? 'Verified' : provider.verificationStatus,
      subscription: subscriptionStatus,
      currency: provider.currency,
      financeLocked: !finance,
    },
    impact: {
      bookings: { ...buckets, total: upcoming.length, ongoing: ongoing.length },
      clients: {
        upcoming: new Set(upcoming.map((b) => b.clientId).filter(Boolean)).size,
        ongoing: new Set(ongoing.map((b) => b.clientId).filter(Boolean)).size,
        awaitingRefund: new Set(refundPending.map((b) => b.clientId).filter(Boolean)).size,
      },
      financial,
    },
    recommended: top
      ? { caseId: top.id, kind: top.kind, title: `${top.category} Under Review`, category: top.category, bookingId: top.bookingId, submittedAt: top.createdAt, link: caseLink(top), currentRisk: assessment ? `${assessment.levelLabel}${openCases.length ? ' (Under Review)' : ''}` : null }
      : null,
    cases: cases.map((c) => ({ id: c.id, kind: c.kind, category: c.category, status: c.status, open: c.open, link: caseLink(c) })),
    restrictions: restrictions.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0)),
    history,
    notifications: notifications
      .map((n) => ({ id: n.id, title: n.title, type: n.type || n.notificationType, channels: n.channels || ['in_app'], status: lower(n.status || (n.isRead ? 'read' : 'delivered')), at: toMillis(n.createdAt), body: n.body || n.message || null }))
      .sort((a, b) => (b.at || 0) - (a.at || 0)),
    notes: notes.map((n) => ({ id: n.id, text: n.note || n.text, author: n.authorName || n.author || 'Admin', at: toMillis(n.createdAt) })).sort((a, b) => (b.at || 0) - (a.at || 0)),
    assessment,
    permitted: permittedActions(provider, permissions),
    permissions: { restrictWithdrawals: Boolean(permissions.restrictWithdrawals), deactivate: Boolean(permissions.deactivate), viewFinance: finance },
    config: {
      reasons: REASON_CATEGORIES,
      reactivationReasons: REACTIVATION_REASONS,
      durations: DURATIONS.map(({ code, label, elevated }) => ({ code, label, elevated: Boolean(elevated) })),
      kinds: Object.entries(RESTRICTION_KINDS).map(([code, k]) => ({ code, ...k })),
      scopedKinds: SCOPED_RESTRICTIONS,
      templates: MESSAGE_TEMPLATES,
      units: units.map((u) => ({ id: u.id, name: u.name, type: provider.category === 'spa' ? 'branch' : 'location' })),
    },
  }
}

function resolveExpiry(input, now) {
  const d = DURATIONS.find((x) => x.code === input.duration)
  if (!d) return { error: 'Select a duration.' }
  if (d.code === 'custom') {
    const until = toMillis(input.customUntil)
    if (!until || until <= now + HOUR) return { error: 'The custom end date must be in the future.' }
    return { duration: d, expiresAt: until, label: `Until ${new Date(until).toISOString().slice(0, 10)}` }
  }
  return { duration: d, expiresAt: d.ms ? now + d.ms : null, label: d.label.replace(' — higher permission only', '') }
}

function resolveTarget(provider, input) {
  if (!input.targetId) return { scopeTarget: { type: 'account', id: null, name: 'Entire account' } }
  const units = provider.category === 'spa' ? provider.branches : provider.category === 'hotel' ? provider.locations : []
  const unit = units.find((u) => u.id === input.targetId)
  if (!unit) return { error: 'Select a valid branch or location.' }
  return { scopeTarget: { type: provider.category === 'spa' ? 'branch' : 'location', id: unit.id, name: unit.name } }
}

/**
 * Validates an account action against the provider's LATEST state and plans
 * the writes. Returns { error, code? } or:
 *   providerPatch, restrictionsCreate[], restrictionUpdates[{id, patch}],
 *   actionRecord, notification, audit, message
 */
export function planAccountAction({ provider, restrictions: rawRestrictions = [], cases = [], input = {}, actor = {}, permissions = {}, policy = DEFAULT_ACCOUNT_POLICY, now = Date.now() }) {
  const action = input.action
  if (!ACCOUNT_ACTIONS.includes(action)) return { error: 'Unknown account action.' }
  if (input.expectedStatus && input.expectedStatus !== provider.accountStatus) {
    return { error: 'The provider’s account state changed since you opened this screen. Reload before acting.', code: 'failed-precondition' }
  }
  if (!permittedActions(provider, permissions).includes(action)) {
    return { error: 'This action is not available for the current account state or your role.', code: 'permission-denied' }
  }
  const restrictions = effectiveRestrictions(rawRestrictions, now)
  const active = restrictions.filter((r) => r.status === 'active')
  const providerMessage = clean(input.providerMessage, 1500)
  const internalNote = clean(input.internalNote)
  if (providerMessage && internalNote && providerMessage === internalNote) {
    return { error: 'The provider message and the internal note must be different — internal notes are never shown to the provider.' }
  }
  const reasonList = action === 'reactivate' ? REACTIVATION_REASONS : REASON_CATEGORIES
  const reason = reasonList.find((r) => r.code === input.reasonCode)
  if (!reason) return { error: action === 'reactivate' ? 'Select a reactivation reason.' : 'Select a reason category.' }
  if (['warn', 'request_info', 'suspend', 'deactivate', 'restrict'].includes(action) && !providerMessage) {
    return { error: 'Add the message the provider will receive.' }
  }
  if (['suspend', 'deactivate'].includes(action) && internalNote.length < 10) {
    return { error: 'Add an internal note (at least 10 characters) explaining the decision.' }
  }

  let caseRef = null
  if (input.caseId) {
    const id = clean(input.caseId, 40).toUpperCase()
    caseRef = cases.find((c) => c.id.toUpperCase() === id)?.id || (/^[A-Z]{2,5}-\d{3,}$/.test(id) ? id : null)
    if (!caseRef) return { error: 'The related case reference is not valid (e.g. SAF-2811).' }
  }
  if (action === 'suspend' && policy.requireCaseForSuspension && !caseRef) {
    return { error: 'Policy requires a related case for a suspension. Select or create the case first.' }
  }
  if (action === 'deactivate' && policy.requireCaseForDeactivation && !caseRef) {
    return { error: 'Policy requires a related case for deactivation.' }
  }

  const previousStatus = provider.accountStatus
  const restrictionsCreate = []
  const restrictionUpdates = []
  let newStatus = previousStatus
  let scope = []
  let scopeLabel = 'Account'
  let durationLabel = null
  let expiresAt = null
  let label = ''
  let liftedKinds = []

  const makeRestriction = (kind, scopeTarget, extra = {}) => ({
    kind,
    scopeTarget,
    status: 'active',
    reasonCode: reason.code,
    reasonLabel: reason.label,
    caseId: caseRef,
    startedAt: now,
    expiresAt,
    durationCode: input.duration || null,
    appliedById: actor.id || null,
    appliedByName: actor.name || 'Admin',
    ...extra,
  })

  if (action === 'restrict' || action === 'suspend') {
    const kinds = action === 'restrict' ? [input.kind] : [...new Set(Array.isArray(input.scope) ? input.scope : [])]
    if (!kinds.length || kinds.some((k) => !RESTRICTION_KINDS[k])) return { error: action === 'suspend' ? 'Select at least one suspension scope.' : 'Select a restriction.' }
    if (action === 'restrict' && kinds[0] === 'full_access') return { error: 'Full account access is restricted through Suspend Provider.' }
    if (kinds.includes('withdrawals') && !permissions.restrictWithdrawals) {
      return { error: 'Withdrawal restrictions need Finance/Security permission.', code: 'permission-denied' }
    }
    const exp = resolveExpiry(input, now)
    if (exp.error) return { error: exp.error }
    if (exp.duration.elevated && !permissions.deactivate) return { error: 'Indefinite restrictions need a higher permission.', code: 'permission-denied' }
    expiresAt = exp.expiresAt
    durationLabel = exp.label
    const target = resolveTarget(provider, input)
    if (target.error) return { error: target.error }
    for (const k of kinds) {
      const dup = active.find((r) => r.kind === k && (r.scopeTarget?.id || null) === (target.scopeTarget.id || null))
      if (dup && action === 'restrict') return { error: `${RESTRICTION_KINDS[k].label} is already restricted for ${target.scopeTarget.name}.` }
      if (!dup) restrictionsCreate.push(makeRestriction(k, target.scopeTarget))
    }
    scope = kinds
    scopeLabel = `${kinds.map((k) => RESTRICTION_KINDS[k].label).join(' + ')}${target.scopeTarget.type !== 'account' ? ` — ${target.scopeTarget.name}` : ''}`
    if (action === 'suspend') {
      newStatus = 'suspended'
      label = 'Provider Suspended'
    } else {
      label = `${RESTRICTION_KINDS[kinds[0]].label} Restriction`
    }
  }

  if (action === 'lift_restriction') {
    const target = active.find((r) => r.id === input.restrictionId || r.docId === input.restrictionId)
    if (!target) return { error: 'That restriction is not active.' }
    if (target.kind === 'withdrawals' && !permissions.restrictWithdrawals) return { error: 'Lifting a withdrawal restriction needs Finance/Security permission.', code: 'permission-denied' }
    restrictionUpdates.push({ id: target.docId, patch: { status: 'lifted', liftedAt: now, liftedById: actor.id || null, liftedByName: actor.name || 'Admin', liftReason: reason.label } })
    scope = [target.kind]
    scopeLabel = target.label
    liftedKinds = [target.kind]
    label = 'Restriction Removed'
  }

  if (action === 'reactivate') {
    const restore = new Set(Array.isArray(input.restore) ? input.restore : active.map((r) => r.kind))
    for (const r of active) {
      if (!restore.has(r.kind)) continue
      if (r.kind === 'withdrawals' && !permissions.restrictWithdrawals) continue // stays until Finance lifts it
      restrictionUpdates.push({ id: r.docId, patch: { status: 'lifted', liftedAt: now, liftedById: actor.id || null, liftedByName: actor.name || 'Admin', liftReason: reason.label } })
      liftedKinds.push(r.kind)
    }
    newStatus = 'active'
    scope = liftedKinds
    scopeLabel = liftedKinds.length ? liftedKinds.map((k) => RESTRICTION_KINDS[k].label).join(' + ') : 'Account'
    label = 'Provider Reactivated'
  }

  if (action === 'deactivate') {
    newStatus = 'deactivated'
    label = 'Provider Deactivated'
  }
  if (action === 'place_review') { newStatus = 'under_review'; label = 'Placed Under Review' }
  if (action === 'end_review') { newStatus = 'active'; label = 'Review Closed' }
  if (action === 'warn') label = 'Warning Issued'
  if (action === 'request_info') label = 'Information Requested'

  const actionRecord = {
    action,
    label,
    scope,
    scopeLabel,
    reasonCode: reason.code,
    reasonLabel: reason.label,
    caseId: caseRef,
    durationLabel,
    expiresAt,
    providerMessage: providerMessage || MESSAGE_TEMPLATES[action],
    internalNote: internalNote || null,
    previousStatus,
    newStatus,
    adminId: actor.id || null,
    adminName: actor.name || 'Admin',
    adminRole: actor.role || null,
    // Restrictions/suspensions stay "active" until lifted; everything else is complete.
    status: action === 'restrict' || action === 'suspend' || action === 'place_review' ? 'active' : 'completed',
    notifyProvider: input.notify !== false,
    createdAt: now,
  }

  const notification = actionRecord.notifyProvider
    ? {
        type: `account_${action}`,
        title: { request_info: 'Information Request', warn: 'Warning Notice', place_review: 'Account Under Review', end_review: 'Account Review Complete', restrict: 'Account Restriction', lift_restriction: 'Restriction Lifted', suspend: 'Suspension Notice', reactivate: 'Account Reactivated', deactivate: 'Account Deactivated' }[action],
        body: actionRecord.providerMessage,
      }
    : null

  return {
    providerPatch: newStatus !== previousStatus ? { accountStatus: newStatus, accountStatusUpdatedAt: now } : null,
    restrictionsCreate,
    restrictionUpdates,
    actionRecord,
    notification,
    // Bookings and funds are intentionally untouched by every action.
    audit: { action: `PROVIDER_${action.toUpperCase()}`, previousStatus, newStatus, scope, reasonCode: reason.code, caseId: caseRef, expiresAt },
    message: `${label}${newStatus !== previousStatus ? ` — account is now ${STATUS_META[newStatus].label}` : ''}`,
  }
}
