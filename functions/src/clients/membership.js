// ADM-016 Client Membership — an Admin control/view layer over `customer_memberships`,
// `membership_plans` (configuration), `membership_events`, `payments` and `audit_logs`
// (no admin_client_memberships). Client account status and membership status are different things.
// Prices and benefits are READ from the record / plan configuration — never hardcoded.
// Nothing here can mark a payment successful, and no membership history row is ever overwritten.
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import {
  DAY_MS, F, addNote, adminCtx, auditEntry, clientBlock, cleanText, currencyOf, db, iso, listNotes, loadClient, lower, ms, need, num, tierOf,
} from './common.js'
import { paymentsOf } from './payments.js'

const JOURNEY = [
  { id: 'standard', label: 'Standard', caption: 'Basic access' },
  { id: 'premium', label: 'Premium', caption: 'Premium access' },
  { id: 'executive', label: 'Executive', caption: 'Elite access' },
]
const DEFAULT_NAME = { standard: 'Standard Wellness Access', premium: 'Premium Wellness Access', executive: 'Executive Access' }
const TIER_ORDER = { standard: 0, premium: 1, executive: 2 }

function statusOf(raw) {
  const s = lower(raw)
  if (['payment_failed', 'failed', 'past_due'].includes(s)) return 'payment_failed'
  if (['expired', 'lapsed', 'cancelled', 'canceled', 'ended'].includes(s)) return 'expired'
  if (s === 'suspended') return 'suspended'
  if (s === 'completed') return 'completed'
  return 'active'
}
const addMonths = (value, n) => { const d = new Date(value); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString() }

async function planFor(tierId, country) {
  const snap = await db().collection('membership_plans').where('tierId', '==', tierId).limit(10).get()
  const docs = snap.docs.filter((d) => d.get('active') !== false)
  const doc = docs.find((d) => d.get('countryCode') === country) ?? docs.find((d) => !d.get('countryCode')) ?? docs[0]
  if (!doc) return null
  const price = doc.get('prices')?.[country] ?? doc.get('price')
  return { id: doc.id, tierId, name: doc.get('name') || DEFAULT_NAME[tierId], tagline: doc.get('tagline') || '', benefits: doc.get('benefits') || [], price: typeof price === 'number' ? price : null, billing: doc.get('billing') || 'Monthly' }
}

const recordOf = (d, finance) => {
  const r = d.data()
  const tierId = tierOf(r.tier ?? r.tierId)
  return {
    id: r.recordNumber || d.id,
    docId: d.id,
    tierId,
    name: r.planName || DEFAULT_NAME[tierId] || 'Membership',
    periodStart: iso(r.periodStart ?? r.startedAt),
    periodEnd: iso(r.periodEnd),
    amount: finance ? num(r.price ?? r.amount) : null,
    currency: r.currency || null,
    status: statusOf(r.status),
    reason: r.reason || 'Renewal',
    paymentId: finance ? r.paymentNumber || r.paymentId || null : null,
    by: r.changedByName || 'System',
    _r: r,
  }
}

// One snapshot of everything ADM-012 and ADM-016 need.
export async function loadMembership(user, ctx) {
  const finance = ctx.perms.finance
  const country = user.get(F.country)
  const snap = await db().collection('customer_memberships').where('customerId', '==', user.id).limit(200).get()
  const records = snap.docs.map((d) => recordOf(d, finance)).sort((a, b) => ms(b.periodStart) - ms(a.periodStart))
  const cur = records.find((r) => r._r.isCurrent === true) ?? records.find((r) => r.status !== 'completed') ?? records[0] ?? null
  if (!cur) return { membership: null, records, history: [], payments: [], failedRenewal: null, upgrade: null, config: null, events: [], cur: null, country }

  const r = cur._r
  const [plan, allPayments] = await Promise.all([planFor(cur.tierId, country), finance ? paymentsOf(user, 300) : []])
  const payments = allPayments.filter((p) => p.type === 'membership')
  const lastOk = payments.find((p) => p.status === 'successful')
  const failed = payments.find((p) => p.status === 'failed')
  const status = cur.status
  const failedRenewal = status === 'payment_failed' && failed
    ? { attemptedAt: failed.createdAt, method: failed.method, status: 'failed', reason: r.failureReason || 'Payment was declined by the provider', paymentId: failed.id, nextRetryAt: iso(r.nextRetryAt) }
    : null
  const membership = {
    id: r.membershipNumber || cur.docId,
    tierId: cur.tierId,
    planId: r.planId || plan?.id || null,
    status,
    startedAt: iso(r.startedAt) || records[records.length - 1]?.periodStart,
    periodStart: cur.periodStart,
    periodEnd: cur.periodEnd,
    renewalAt: iso(r.renewalAt ?? r.periodEnd),
    billing: r.billing || (cur.tierId === 'standard' ? 'None (free)' : plan?.billing || 'Monthly'),
    market: country,
    currency: r.currency || currencyOf(country),
    price: finance ? num(r.price ?? r.amount) : null,
    autoRenew: Boolean(r.autoRenew),
    paymentStatus: cur.tierId === 'standard' ? 'na' : status === 'payment_failed' ? 'failed' : 'paid',
    accessStatus: r.accessStatus || (status === 'active' || status === 'payment_failed' ? 'enabled' : 'disabled'),
    lastPayment: finance && lastOk ? { status: 'successful', at: lastOk.createdAt, paymentId: lastOk.id } : null,
    scheduledChange: r.scheduledChange ? { tierId: r.scheduledChange.tierId, name: r.scheduledChange.name, effectiveAt: iso(r.scheduledChange.effectiveAt) } : null,
  }
  const upgrade = cur.tierId === 'premium' && status === 'active' && user.get('executiveEligible') === true
    ? { eligible: true, tierId: 'executive', requiresApproval: true } : null

  const evSnap = await db().collection('membership_events').where('customerId', '==', user.id).limit(60).get()
  let events = evSnap.docs.map((d) => ({ id: d.id, at: iso(d.get('createdAt')), text: d.get('text'), tone: d.get('tone') || 'ok', actor: d.get('actor') || 'System', reason: d.get('reason') || null, ref: d.get('ref') || null }))
  if (!events.length) events = records.flatMap((h) => h.periodStart ? [{ id: `ev-${h.docId}`, at: h.periodStart, text: h.reason === 'Joined' ? `Client joined ${h.name}` : h.reason === 'Upgraded' ? `Upgraded to ${h.name}` : `${h.name} — ${h.reason.toLowerCase()}`, tone: h.status === 'payment_failed' ? 'bad' : 'ok', actor: 'System', ref: { type: 'membership', id: h.id } }] : [])
  events.sort((a, b) => ms(b.at) - ms(a.at))

  return {
    membership, records, cur, upgrade, plan, country, failedRenewal,
    config: plan ? { id: plan.id, tierId: plan.tierId, name: plan.name, tagline: plan.tagline, benefits: plan.benefits } : null,
    history: records.map(({ _r, docId, ...h }) => h),
    payments: payments.slice(0, 5).map((p) => ({ id: p.id, createdAt: p.createdAt, description: p.title, method: p.method, amount: p.amount, status: p.status, paymentId: p.id })),
    events,
  }
}

// What THIS admin may do right now — the backend decides, the UI only reflects it.
function manageFor(ctx, s) {
  const m = s.membership
  if (!m) return { actions: [] }
  const paid = m.tierId !== 'standard'
  const live = m.status === 'active' || m.status === 'payment_failed'
  const can = ctx.perms.memberships
  const none = 'You need membership-management permission for this action.'
  const eligible = Boolean(s.upgrade?.eligible)
  const options = JOURNEY.map((t) => {
    const current = t.id === m.tierId
    const blocked = t.id === 'executive' && !current && !eligible
    return { tierId: t.id, label: DEFAULT_NAME[t.id], current, available: !current && !blocked, reason: blocked ? 'Requires Executive eligibility approval' : null }
  })
  const act = (id, enabled, why = null, extra = {}) => ({ id, enabled: can && enabled, disabledReason: !can ? none : enabled ? null : why, ...extra })
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

export const adminGetClientMembership = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  const user = await loadClient(ctx, request.data?.clientId, request.data?.market)
  const s = await loadMembership(user, ctx)
  const notes = await listNotes(user.id, 'membership')
  const client = clientBlock(user)
  return {
    client: { ...client, membershipTier: s.membership?.tierId || 'none' },
    asOf: client.asOf,
    membership: s.membership,
    config: s.config,
    journey: { tiers: JOURNEY, currentId: s.membership?.tierId || null },
    upgrade: s.upgrade,
    history: s.history,
    payments: s.payments,
    failedRenewal: s.failedRenewal,
    events: s.events.slice(0, 8),
    notes,
    manage: manageFor(ctx, s),
  }
})

export const adminChangeClientMembership = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view', fresh: true })
  need(ctx, 'memberships.manage', 'You need membership-management permission for this action.')
  const { clientId, action, payload = {}, note } = request.data || {}
  const reason = cleanText(request.data?.reason, { max: 200, label: 'A reason' })
  if (reason === 'Other' && String(note || '').trim().length < 5) throw new HttpsError('invalid-argument', 'Please describe the reason in the internal note.')
  const user = await loadClient(ctx, clientId)
  const country = user.get(F.country)

  // Everything is validated against the LATEST state inside the transaction.
  const result = await db().runTransaction(async (tx) => {
    const snap = await tx.get(db().collection('customer_memberships').where('customerId', '==', user.id).limit(200))
    const records = snap.docs.map((d) => ({ d, rec: recordOf(d, true) })).sort((a, b) => ms(b.rec.periodStart) - ms(a.rec.periodStart))
    const curEntry = records.find((r) => r.d.get('isCurrent') === true) ?? records.find((r) => r.rec.status !== 'completed') ?? records[0]
    if (!curEntry) throw new HttpsError('failed-precondition', 'This client has no membership record to change.')
    const m = curEntry.rec
    const r = curEntry.d.data()
    const paid = m.tierId !== 'standard'
    const eligible = user.get('executiveEligible') === true && m.tierId === 'premium' && m.status === 'active'
    const fail = (msg) => { throw new HttpsError('failed-precondition', msg) }
    const audit = auditEntry(request, ctx, { action: `client.membership_${action}`, entityId: user.id, metadata: { reason, action, payload, from: m.tierId, membershipId: curEntry.d.id } })
    const events = []
    const push = (text) => events.push({ customerId: user.id, countryCode: country, text, tone: 'admin', actor: `${ctx.name} (${ctx.role})`, reason, ref: { type: 'audit', id: audit.ref.id }, createdAt: FieldValue.serverTimestamp() })
    const now = new Date()
    const update = {}

    if (action === 'change_tier') {
      if (m.status === 'suspended') fail('Reactivate the membership before changing it.')
      const target = JOURNEY.find((t) => t.id === payload.tierId)
      if (!target) fail('Choose a membership to change to.')
      if (target.id === m.tierId) fail('The client is already on this membership.')
      if (target.id === 'executive' && !eligible) fail('Requires Executive eligibility approval.')
      const plan = await planFor(target.id, country)
      const label = plan?.name || DEFAULT_NAME[target.id]
      if (payload.effective === 'end_of_period') {
        if (!m.periodEnd) fail('This membership has no billing period to wait for. Apply the change immediately.')
        update.scheduledChange = { tierId: target.id, name: label, effectiveAt: Timestamp.fromMillis(ms(m.periodEnd)) }
        push(`Admin scheduled change to ${label} at the end of the current period`)
      } else {
        if (target.id !== 'standard' && (plan?.price == null)) fail('The price for that plan is not configured for this market.')
        const price = target.id === 'standard' ? 0 : plan.price
        const end = target.id === 'standard' ? null : Timestamp.fromDate(new Date(addMonths(now, 1)))
        tx.update(curEntry.d.ref, { status: 'completed', isCurrent: false, periodEnd: Timestamp.fromDate(now), updatedAt: FieldValue.serverTimestamp() }) // previous record preserved
        tx.set(db().collection('customer_memberships').doc(), {
          customerId: user.id, countryCode: country, membershipNumber: r.membershipNumber || null, tier: target.id, planId: plan?.id || null, planName: label,
          status: 'active', accessStatus: 'enabled', isCurrent: true, startedAt: r.startedAt || r.periodStart || Timestamp.fromDate(now),
          periodStart: Timestamp.fromDate(now), periodEnd: end, renewalAt: end, billing: target.id === 'standard' ? 'None (free)' : plan.billing,
          price, currency: r.currency || currencyOf(country), autoRenew: target.id !== 'standard' && Boolean(r.autoRenew),
          reason: TIER_ORDER[target.id] > TIER_ORDER[m.tierId] ? 'Upgraded' : 'Downgraded', changedBy: ctx.uid, changedByName: ctx.name, createdAt: FieldValue.serverTimestamp(),
        })
        tx.update(user.ref, { [F.membership]: target.id, [F.updated]: FieldValue.serverTimestamp() }) // access follows the new tier
        push(`Admin changed membership to ${label}`)
      }
    } else if (action === 'set_auto_renew') {
      if (!paid || !['active', 'payment_failed'].includes(m.status)) fail('Auto-renewal only applies to an active paid plan.')
      update.autoRenew = Boolean(payload.enabled)
      push(`Admin turned auto-renewal ${update.autoRenew ? 'on' : 'off'}`)
    } else if (action === 'cancel_renewal') {
      if (!paid || !r.autoRenew || m.status !== 'active') fail('No upcoming renewal to cancel.')
      update.autoRenew = false
      push('Admin cancelled the next renewal (access continues to the end of the paid period)')
    } else if (action === 'extend') {
      const days = Number(payload.days)
      if (!paid || m.status === 'suspended') fail('Only paid, non-suspended memberships can be extended.')
      if (!Number.isInteger(days) || days < 1 || days > 31) fail('Extension must be between 1 and 31 days.')
      const end = Timestamp.fromMillis((ms(m.periodEnd) || now.getTime()) + days * DAY_MS)
      update.periodEnd = end
      update.renewalAt = end
      push(`Admin extended the membership by ${days} days (no payment recorded)`)
    } else if (action === 'reactivate') {
      if (!['suspended', 'expired'].includes(m.status)) fail('The membership is already active.')
      update.status = 'active'
      update.accessStatus = 'enabled'
      push('Admin reactivated the membership')
    } else if (action === 'correct_status') {
      if (!['active', 'suspended', 'expired'].includes(payload.status)) fail('Choose a valid membership status.')
      update.status = payload.status
      update.accessStatus = payload.status === 'active' ? 'enabled' : 'disabled'
      push(`Admin corrected membership status to ${payload.status}`)
    } else {
      fail('Unknown membership action.')
    }

    if (Object.keys(update).length) tx.update(curEntry.d.ref, { ...update, changedBy: ctx.uid, changedByName: ctx.name, updatedAt: FieldValue.serverTimestamp() })
    for (const e of events) tx.set(db().collection('membership_events').doc(), e)
    tx.set(audit.ref, audit.data)
    tx.set(db().collection('notifications').doc(), {
      userId: user.id, type: 'membership_updated', title: 'Your membership was updated', body: 'Your Lé Inspa membership has been updated by our team.',
      channel: 'in_app', status: 'queued', read: false, countryCode: country, createdAt: FieldValue.serverTimestamp(),
    })
    return audit.ref.id
  })

  if (String(note || '').trim()) await addNote(request, ctx, user, { scope: 'membership', text: note })
  return { ok: true, auditId: result }
})

// Internal note only — it never alters the membership.
export const adminAddMembershipNote = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  const user = await loadClient(ctx, request.data?.clientId)
  const e = await addNote(request, ctx, user, { scope: 'membership', text: request.data?.text })
  return { id: e.id, author: e.author, text: e.text, createdAt: e.createdAt }
})
