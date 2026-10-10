// Demo data for ADM-016 (Client Membership). Used only while the
// `adminGetClientMembership` / `adminChangeClientMembership` /
// `adminAddMembershipNote` Cloud Functions are not deployed.
//
// Real sources: `customer_memberships` (the record: tier, period, price actually
// charged, status), the membership/plan configuration (benefits, plan names, tiers),
// membership history/events, `payments` (membership payments) and `audit_logs`.
// There is NO "admin client membership" record. CL-78421 mirrors the ADM-016 mockup.
//
// Prices below belong to the demo *membership records* — the UI never contains a
// price; it renders whatever the record says.
import { MOCK_CURRENCY, DAY_MS } from './clientDirectoryMock'
import { buildClientProfile } from './clientProfileMock'

const FX = { KE: 1, UG: 28, TZ: 19, RW: 10, ZA: 0.14 }
const RECORD_PRICE = { premium: 3000, executive: 7500 }
const hashOf = (text) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
const at = (y, m, d, hh, mm, tz = 3) => new Date(Date.UTC(y, m - 1, d, hh - tz, mm)).toISOString()
const iso = (ms) => new Date(ms).toISOString()
const addMonths = (isoStr, n) => {
  const d = new Date(isoStr)
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString()
}
const METHODS = {
  mpesa: { kind: 'mpesa', label: 'M-PESA' },
  visa: { kind: 'visa', label: 'Visa •••• 4821' },
  mastercard: { kind: 'mastercard', label: 'Mastercard •••• 2214' },
}

// ---------- plan configuration (what the platform config returns) ----------
const PLAN_CONFIG = {
  standard: {
    id: 'plan_standard', tierId: 'standard', name: 'Standard Wellness Access', tagline: 'Pay-per-booking wellness access',
    benefits: ['Standard wellness discovery', 'Book any listed provider or service', 'Standard platform benefits'],
  },
  premium: {
    id: 'plan_premium', tierId: 'premium', name: 'Premium Wellness Access', tagline: 'Experience Wellness Without Limits',
    benefits: ['Premium wellness discovery', 'Eligible Premium providers/services', 'Premium offers where applicable', 'Membership-specific platform benefits'],
  },
  executive: {
    id: 'plan_executive', tierId: 'executive', name: 'Executive Access', tagline: 'Elite wellness, curated for you',
    benefits: ['Everything in Premium Wellness Access', 'Executive-only providers and experiences', 'Priority concierge support', 'Membership-specific platform benefits'],
  },
}
const JOURNEY = [
  { id: 'standard', label: 'Standard', caption: 'Basic access' },
  { id: 'premium', label: 'Premium', caption: 'Premium access' },
  { id: 'executive', label: 'Executive', caption: 'Elite access' },
]

// ---------- build ----------
const stateCache = new Map()

function clientBlock(profile, r) {
  return {
    id: profile.id, name: profile.name, photoURL: profile.photoURL, gender: profile.gender,
    membershipTier: profile.membershipTier, status: profile.status, contactVerified: profile.contactVerified,
    country: profile.country, countryName: profile.countryName, city: profile.city,
    joinedAt: profile.joinedAt, lastActiveAt: profile.lastActiveAt, asOf: profile.asOf, timeZone: profile.timeZone,
    currency: MOCK_CURRENCY[r.country] || profile.currency || 'USD',
  }
}

const money = (n, fx) => Math.round(n * fx)

function eventsFromHistory(history) {
  const out = []
  history.forEach((h) => {
    const plan = PLAN_CONFIG[h.tierId]?.name || h.name
    const start = new Date(h.periodStart).getTime()
    if (h.reason === 'Joined') out.push({ id: `ev-${h.id}-j`, at: iso(start - 60_000), text: `Client joined ${plan}`, tone: 'ok', actor: 'System', ref: { type: 'membership', id: h.id } })
    else if (h.reason === 'Upgraded') out.push({ id: `ev-${h.id}-u`, at: iso(start + 60_000), text: `Upgraded to ${plan}`, tone: 'ok', actor: 'System', ref: { type: 'membership', id: h.id } })
    if (h.paymentId && h.status !== 'failed') {
      out.push({ id: `ev-${h.id}-p`, at: iso(start), text: `Membership payment verified (${h.paymentId})`, tone: 'ok', actor: 'Payment system', ref: { type: 'payment', id: h.paymentId } })
      if (h.reason === 'Renewal') out.push({ id: `ev-${h.id}-r`, at: iso(start + 60_000), text: `${plan.replace(' Wellness Access', '')} membership renewed`, tone: 'ok', actor: 'System', ref: { type: 'membership', id: h.id } })
    }
    if (h.status === 'failed') out.push({ id: `ev-${h.id}-f`, at: iso(start + 30_000), text: `Renewal payment failed (${h.paymentId})`, tone: 'bad', actor: 'Payment system', ref: { type: 'payment', id: h.paymentId } })
  })
  return out.sort((a, b) => new Date(b.at) - new Date(a.at))
}

function seededState(r) {
  const cur = MOCK_CURRENCY[r.country] || 'KES'
  const fx = FX[r.country] || 1
  const price = money(RECORD_PRICE.premium, fx)
  const H = (id, tierId, ps, pe, amount, status, reason, paymentId) => ({
    id, tierId, name: PLAN_CONFIG[tierId].name, periodStart: ps, periodEnd: pe, amount, currency: cur, status, reason, paymentId, by: 'System',
  })
  const history = [
    H('MR-5', 'premium', at(2026, 9, 12, 10, 30), at(2026, 10, 12, 10, 30), price, 'active', 'Renewal', 'PAY-92841'),
    H('MR-4', 'premium', at(2026, 8, 12, 10, 28), at(2026, 9, 12, 10, 30), price, 'completed', 'Renewal', 'PAY-91577'),
    H('MR-3', 'premium', at(2026, 7, 12, 10, 30), at(2026, 8, 12, 10, 28), price, 'completed', 'Renewal', 'PAY-90912'),
    H('MR-2', 'premium', at(2026, 6, 12, 10, 30), at(2026, 7, 12, 10, 30), price, 'completed', 'Upgraded', 'PAY-89440'),
    H('MR-1', 'standard', at(2026, 1, 12, 9, 14), at(2026, 6, 12, 10, 30), 0, 'completed', 'Joined', null),
  ]
  const P = (paymentId, ps, method, description) => ({ id: paymentId, createdAt: ps, description, method: METHODS[method], amount: price, status: 'successful', paymentId })
  const payments = [
    P('PAY-92841', at(2026, 9, 12, 10, 30), 'mpesa', 'Premium Renewal'),
    P('PAY-91577', at(2026, 8, 12, 10, 28), 'visa', 'Premium Renewal'),
    P('PAY-90912', at(2026, 7, 12, 10, 30), 'mpesa', 'Premium Renewal'),
    P('PAY-89440', at(2026, 6, 12, 10, 30), 'mastercard', 'Premium Renewal'),
    { id: 'STD-0112', createdAt: at(2026, 1, 12, 9, 14), description: 'Standard Access', method: null, amount: 0, status: 'na', paymentId: null },
  ]
  return {
    membership: {
      id: 'MEM-78421', tierId: 'premium', planId: 'plan_premium', status: 'active',
      startedAt: at(2026, 1, 12, 9, 14), periodStart: at(2026, 9, 12, 10, 30), periodEnd: at(2026, 10, 12, 10, 30), renewalAt: at(2026, 10, 12, 10, 30),
      billing: 'Monthly', market: r.country, currency: cur, price, autoRenew: true,
      paymentStatus: 'paid', accessStatus: 'enabled', lastPayment: { status: 'successful', at: at(2026, 9, 12, 10, 30), paymentId: 'PAY-92841' },
      scheduledChange: null,
    },
    history, payments, failedRenewal: null, upgrade: { eligible: true, tierId: 'executive', requiresApproval: true }, notes: [],
    events: eventsFromHistory(history),
  }
}

function generatedState(r, profile) {
  const pm = profile.membership
  const tierId = pm.tier
  const cur = MOCK_CURRENCY[r.country] || profile.currency || 'USD'
  const fx = FX[r.country] || 1
  const asOf = new Date(profile.asOf).getTime()
  const seed = hashOf(r.id)
  const num = r.id.replace(/\D/g, '')

  if (tierId === 'none') {
    return { membership: null, history: [], payments: [], failedRenewal: null, upgrade: null, notes: [], events: [] }
  }
  const startedAt = iso(r.joinedAt)
  if (tierId === 'standard') {
    const h = { id: 'MR-1', tierId: 'standard', name: PLAN_CONFIG.standard.name, periodStart: startedAt, periodEnd: null, amount: 0, currency: cur, status: 'active', reason: 'Joined', paymentId: null, by: 'System' }
    return {
      membership: { id: `MEM-${num}`, tierId: 'standard', planId: 'plan_standard', status: r.status === 'suspended' ? 'suspended' : 'active', startedAt, periodStart: startedAt, periodEnd: null, renewalAt: null, billing: 'None (free)', market: r.country, currency: cur, price: 0, autoRenew: false, paymentStatus: 'na', accessStatus: r.status === 'suspended' ? 'disabled' : 'enabled', lastPayment: null, scheduledChange: null },
      history: [h], payments: [], failedRenewal: null, upgrade: null, notes: [], events: eventsFromHistory([h]),
    }
  }

  const price = money(RECORD_PRICE[tierId], fx)
  const failed = Boolean(r.paymentIssue) && r.status !== 'suspended'
  const expired = !failed && r.status !== 'suspended' && seed % 7 === 0
  const status = r.status === 'suspended' ? 'suspended' : failed ? 'payment_failed' : expired ? 'expired' : 'active'
  const renewalAt = failed ? iso(asOf - 2 * DAY_MS) : expired ? iso(asOf - 6 * DAY_MS) : pm.nextRenewal
  const months = Math.max(1, Math.min(4, 1 + (seed % 4)))
  const joinedStandard = seed % 2 === 0 && months >= 2
  const planName = PLAN_CONFIG[tierId].name
  const history = []
  const payments = []
  const methodKeys = ['mpesa', 'visa', 'mastercard']
  for (let i = 0; i < months; i++) {
    const pe = addMonths(renewalAt, -i)
    const ps = addMonths(renewalAt, -i - 1)
    const isCurrent = i === 0
    const first = i === months - 1
    const payId = `PAY-${String(10000 + ((seed + i * 977) % 80000))}`
    const rowStatus = isCurrent ? (failed ? 'failed' : expired ? 'expired' : status === 'suspended' ? 'suspended' : 'active') : 'completed'
    history.push({ id: `MR-${months + (joinedStandard ? 1 : 0) - i}`, tierId, name: planName, periodStart: ps, periodEnd: pe, amount: price, currency: cur, status: rowStatus, reason: first ? (joinedStandard ? 'Upgraded' : 'Joined') : 'Renewal', paymentId: payId, by: 'System' })
    payments.push({ id: payId, createdAt: ps, description: `${tierId === 'executive' ? 'Executive' : 'Premium'} ${first && !joinedStandard ? 'Membership' : 'Renewal'}`, method: METHODS[methodKeys[(seed + i) % 3]], amount: price, status: isCurrent && failed ? 'failed' : 'successful', paymentId: payId })
  }
  if (joinedStandard) {
    history.push({ id: 'MR-1', tierId: 'standard', name: PLAN_CONFIG.standard.name, periodStart: startedAt, periodEnd: addMonths(renewalAt, -months), amount: 0, currency: cur, status: 'completed', reason: 'Joined', paymentId: null, by: 'System' })
  }
  const lastOk = payments.find((p) => p.status === 'successful')
  const failedPay = payments.find((p) => p.status === 'failed')
  return {
    membership: {
      id: `MEM-${num}`, tierId, planId: PLAN_CONFIG[tierId].id, status, startedAt, periodStart: addMonths(renewalAt, -1), periodEnd: renewalAt, renewalAt,
      billing: 'Monthly', market: r.country, currency: cur, price, autoRenew: pm.autoRenew && !expired,
      paymentStatus: failed ? 'failed' : 'paid', accessStatus: status === 'suspended' || expired ? 'disabled' : 'enabled',
      lastPayment: lastOk ? { status: 'successful', at: lastOk.createdAt, paymentId: lastOk.paymentId } : null, scheduledChange: null,
    },
    history, payments: payments.slice(0, 5),
    failedRenewal: failed && failedPay ? { attemptedAt: failedPay.createdAt, method: failedPay.method, status: 'failed', reason: 'Payment was declined by the provider', paymentId: failedPay.paymentId, nextRetryAt: iso(asOf + DAY_MS) } : null,
    upgrade: tierId === 'premium' && status === 'active' && seed % 3 !== 0 ? { eligible: true, tierId: 'executive', requiresApproval: true } : null,
    notes: [],
    events: eventsFromHistory(history),
  }
}

function stateFor(r) {
  if (!stateCache.has(r.id)) {
    const profile = buildClientProfile(r)
    const s = r.id === 'CL-78421' ? seededState(r) : generatedState(r, profile)
    stateCache.set(r.id, { ...s, profile, nextEvent: 1 })
  }
  return stateCache.get(r.id)
}

// ---------- manage block: what this admin may do right now (backend decides) ----------
function manageFor(s) {
  const m = s.membership
  if (!m) return { actions: [] }
  const paid = m.tierId !== 'standard'
  const live = m.status === 'active' || m.status === 'payment_failed'
  const eligible = Boolean(s.upgrade?.eligible)
  const options = JOURNEY.map((t) => {
    const current = t.id === m.tierId
    const blocked = t.id === 'executive' && !current && !eligible
    return { tierId: t.id, label: PLAN_CONFIG[t.id].name, current, available: !current && !blocked, reason: blocked ? 'Requires Executive eligibility approval' : null }
  })
  const act = (id, enabled, why = null, extra = {}) => ({ id, enabled, disabledReason: enabled ? null : why, ...extra })
  return {
    actions: [
      act('change_tier', m.status !== 'suspended', 'Reactivate the membership before changing it.', { options }),
      act('set_auto_renew', paid && live, 'Auto-renewal only applies to an active paid plan.', { current: m.autoRenew }),
      act('extend', paid && m.status !== 'suspended', 'Only paid, non-suspended memberships can be extended.'),
      act('cancel_renewal', paid && m.autoRenew && m.status === 'active', 'No upcoming renewal to cancel.'),
      act('reactivate', m.status === 'suspended' || m.status === 'expired', 'The membership is already active.'),
      act('correct_status', true, null, { statuses: ['active', 'suspended', 'expired'] }),
    ],
  }
}

const clone = (v) => JSON.parse(JSON.stringify(v))

export function buildClientMembership(r) {
  const s = stateFor(r)
  const profile = s.profile
  const m = s.membership
  const plan = m ? PLAN_CONFIG[m.tierId] : null
  return clone({
    // The header badge must follow the live membership record, not the static directory row.
    client: { ...clientBlock(profile, r), membershipTier: m?.tierId || 'none' },
    asOf: profile.asOf,
    membership: m,
    config: plan ? { id: plan.id, tierId: plan.tierId, name: plan.name, tagline: plan.tagline, benefits: plan.benefits } : null,
    journey: { tiers: JOURNEY, currentId: m?.tierId || null },
    upgrade: s.upgrade,
    history: s.history,
    payments: s.payments,
    failedRenewal: s.failedRenewal,
    events: s.events.slice(0, 8),
    notes: s.notes,
    manage: manageFor(s),
  })
}

// ---------- controlled change ----------
export function applyMockMembershipChange(r, { action, payload = {}, reason, note }) {
  const s = stateFor(r)
  const m = s.membership
  if (!m) throw new Error('This client has no membership record to change.')
  if (!reason || !reason.trim()) throw new Error('A reason is required for every manual membership change.')
  if (reason === 'Other' && (!note || note.trim().length < 5)) throw new Error('Please describe the reason in the internal note.')
  const allowed = manageFor(s).actions.find((a) => a.id === action)
  if (!allowed) throw new Error('Unknown membership action.')
  if (!allowed.enabled) throw new Error(allowed.disabledReason || 'This action is not available for this membership.')

  const now = Date.now()
  const asOf = new Date(s.profile.asOf).getTime()
  const stamp = iso(Math.max(now, asOf + 60_000))
  const push = (text, tone = 'admin') => s.events.unshift({ id: `ev-a${s.nextEvent++}`, at: stamp, text, tone, actor: 'You (Super Admin)', reason, ref: { type: 'audit', id: auditId } })
  const auditId = `AUD-${String(40000 + s.nextEvent * 17 + (hashOf(r.id) % 900))}`
  const cur = m.currency

  if (action === 'change_tier') {
    const target = allowed.options.find((o) => o.tierId === payload.tierId)
    if (!target) throw new Error('Choose a membership to change to.')
    if (target.current) throw new Error('The client is already on this membership.')
    if (!target.available) throw new Error(target.reason || 'This change is not allowed.')
    if (payload.effective === 'end_of_period') {
      if (!m.periodEnd) throw new Error('This membership has no billing period to wait for. Apply the change immediately.')
      m.scheduledChange = { tierId: target.tierId, name: target.label, effectiveAt: m.periodEnd }
      push(`Admin scheduled change to ${target.label} at the end of the current period`)
    } else {
      const order = { standard: 0, premium: 1, executive: 2 }
      const reasonLabel = order[target.tierId] > order[m.tierId] ? 'Upgraded' : 'Downgraded'
      const prior = s.history.find((h) => h.status === 'active' || h.status === 'expired' || h.status === 'suspended' || h.status === 'failed')
      if (prior) { prior.status = 'completed'; prior.periodEnd = stamp } // previous record is preserved, never overwritten
      const fee = target.tierId === 'standard' ? 0 : Math.round(RECORD_PRICE[target.tierId] * (FX[r.country] || 1))
      s.history.unshift({ id: `MR-${s.history.length + 1}`, tierId: target.tierId, name: target.label, periodStart: stamp, periodEnd: target.tierId === 'standard' ? null : addMonths(stamp, 1), amount: fee, currency: cur, status: 'active', reason: reasonLabel, paymentId: null, by: 'Admin change' })
      m.tierId = target.tierId; m.planId = PLAN_CONFIG[target.tierId].id; m.price = fee; m.status = 'active'; m.accessStatus = 'enabled'
      m.periodStart = stamp; m.periodEnd = target.tierId === 'standard' ? null : addMonths(stamp, 1); m.renewalAt = m.periodEnd
      m.billing = target.tierId === 'standard' ? 'None (free)' : 'Monthly'; m.autoRenew = target.tierId !== 'standard' && m.autoRenew; m.scheduledChange = null
      if (target.tierId === 'standard') m.paymentStatus = 'na'
      s.failedRenewal = null
      s.upgrade = target.tierId === 'premium' ? { eligible: true, tierId: 'executive', requiresApproval: true } : null
      push(`Admin changed membership to ${target.label}`)
    }
  } else if (action === 'set_auto_renew') {
    m.autoRenew = Boolean(payload.enabled)
    push(`Admin turned auto-renewal ${m.autoRenew ? 'on' : 'off'}`)
  } else if (action === 'cancel_renewal') {
    m.autoRenew = false
    push('Admin cancelled the next renewal (access continues to the end of the paid period)')
  } else if (action === 'extend') {
    const days = Number(payload.days)
    if (!Number.isFinite(days) || days < 1 || days > 31) throw new Error('Extension must be between 1 and 31 days.')
    m.periodEnd = iso(new Date(m.periodEnd).getTime() + days * DAY_MS); m.renewalAt = m.periodEnd
    const cur0 = s.history.find((h) => h.status !== 'completed')
    if (cur0) cur0.periodEnd = m.periodEnd
    push(`Admin extended the membership by ${days} days (no payment recorded)`)
  } else if (action === 'reactivate') {
    m.status = 'active'; m.accessStatus = 'enabled'
    const cur0 = s.history.find((h) => h.status === 'expired' || h.status === 'suspended')
    if (cur0) cur0.status = 'active'
    push('Admin reactivated the membership')
  } else if (action === 'correct_status') {
    if (!allowed.statuses.includes(payload.status)) throw new Error('Choose a valid membership status.')
    m.status = payload.status; m.accessStatus = payload.status === 'active' ? 'enabled' : 'disabled'
    const cur0 = s.history[0]
    if (cur0) cur0.status = payload.status === 'active' ? 'active' : payload.status
    push(`Admin corrected membership status to ${payload.status}`)
  }
  if (note?.trim()) s.notes.unshift({ id: `mn${Date.now()}`, author: 'You', text: note.trim(), createdAt: stamp })
  return { ok: true, auditId }
}

// Internal note only: never alters the membership itself.
export function addMockMembershipNote(r, text) {
  const s = stateFor(r)
  const entry = { id: `mn${Date.now()}`, author: 'You', text, createdAt: new Date().toISOString() }
  s.notes.unshift(entry)
  return entry
}
