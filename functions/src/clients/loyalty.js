// ADM-017 Client Referrals & Loyalty — an Admin view over `referrals`, `loyalty_accounts`,
// `loyalty_transactions`, `rewards` and the configured programme rules
// (no admin_referrals / admin_loyalty).
//  • Referral success follows the CONFIGURED referral rule, never registration alone.
//  • Loyalty progress follows the CONFIGURED loyalty rule — nothing like "10 bookings" is hardcoded.
//  • Referral and loyalty balances stay separate; rewards are never edited from here.
//  • Anomalies create a "Needs Review" state, never an automatic accusation.
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import {
  DAY_MS, F, addNote, adminCtx, clientBlock, cleanText, currencyOf, db, iso, listNotes, loadClient, lower, ms, num, paginate, tzOf,
} from './common.js'

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0)
const FALLBACK_REFERRAL_RULE = { id: 'configured', label: 'Configured referral rule', activityLabel: 'Required eligible activity completed' }

async function programmeConfig() {
  const [ref, loy] = await Promise.all([
    db().collection('platform_settings').doc('referral_program').get(),
    db().collection('platform_settings').doc('loyalty_program').get(),
  ])
  const r = ref.exists ? ref.data() : {}
  const l = loy.exists ? loy.data() : {}
  return {
    referral: { id: r.ruleId || FALLBACK_REFERRAL_RULE.id, label: r.label || FALLBACK_REFERRAL_RULE.label, activityLabel: r.activityLabel || FALLBACK_REFERRAL_RULE.activityLabel, pendingReviewDays: num(r.pendingReviewDays, 30) },
    loyalty: loy.exists
      ? { mode: l.mode || 'milestone', unitLabel: l.unitLabel || 'eligible booking', unitLabelPlural: l.unitLabelPlural || 'eligible bookings', target: num(l.target), rewardValue: num(l.rewardValue), rewardsExpire: Boolean(l.rewardsExpire) }
      : null,
  }
}

function referralStatus(raw) {
  const s = lower(raw)
  if (['rewarded', 'successful', 'completed'].includes(s)) return 'rewarded'
  if (['ineligible', 'rejected', 'invalid'].includes(s)) return 'ineligible'
  return 'pending'
}

function normalizeReferral(d, finance) {
  const r = d.data()
  const status = referralStatus(r.status)
  return {
    id: r.referralNumber || d.id,
    docId: d.id,
    client: { id: r.referredClientCode || r.referredId || '', name: r.referredName || 'Client', gender: lower(r.referredGender) === 'male' ? 'm' : 'f', photoURL: r.referredPhotoURL || null },
    email: r.referredEmail || '',
    invitedAt: iso(r.invitedAt ?? r.createdAt),
    joinedAt: iso(r.joinedAt ?? r.createdAt),
    progress: r.progressLabel || (status === 'pending' ? 'Registered' : status === 'ineligible' ? 'No eligible activity yet' : 'Eligible action completed'),
    status,
    qualified: status === 'rewarded' || r.qualified === true,
    rewardAmount: finance && status === 'rewarded' ? num(r.rewardAmount) : null,
    rewardId: r.rewardNumber || r.rewardId || null,
    rewardTxnId: finance && status === 'rewarded' ? r.rewardTransactionId || null : null,
    bookingId: r.qualifyingBookingNumber || r.qualifyingBookingId || null,
  }
}

async function referralsOf(user, finance) {
  const snap = await db().collection('referrals').where('referrerId', '==', user.id).limit(1000).get()
  return snap.docs.map((d) => normalizeReferral(d, finance)).sort((a, b) => ms(b.joinedAt) - ms(a.joinedAt))
}

const counts = (list) => ({
  all: list.length,
  successful: list.filter((x) => x.status === 'rewarded').length,
  pending: list.filter((x) => x.status === 'pending').length,
  ineligible: list.filter((x) => x.status === 'ineligible').length,
})

function funnel(list) {
  const invited = list.length
  const registered = list.filter((x) => x.status !== 'ineligible').length
  const qualified = list.filter((x) => x.qualified).length
  const rewarded = list.filter((x) => x.status === 'rewarded' && x.rewardId).length
  return [
    { id: 'invited', label: 'Invited / Referred', count: invited, conversion: null },
    { id: 'registered', label: 'Registered', count: registered, conversion: pct(registered, invited) },
    { id: 'qualified', label: 'Qualified', count: qualified, conversion: pct(qualified, registered) },
    { id: 'rewarded', label: 'Rewarded', count: rewarded, conversion: pct(rewarded, qualified) },
  ]
}

export const adminGetClientLoyalty = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  const user = await loadClient(ctx, request.data?.clientId, request.data?.market)
  const finance = ctx.perms.finance
  const cfg = await programmeConfig()
  const [referrals, accSnap, txSnap, rwSnap, notes] = await Promise.all([
    referralsOf(user, finance),
    db().collection('loyalty_accounts').where('customerId', '==', user.id).limit(1).get(),
    db().collection('loyalty_transactions').where('customerId', '==', user.id).limit(300).get(),
    db().collection('rewards').where('customerId', '==', user.id).limit(300).get(),
    listNotes(user.id, 'loyalty'),
  ])
  const acc = accSnap.docs[0]?.data() || {}
  const value = (v) => (finance ? num(v) : null)

  const activity = txSnap.docs.map((d) => {
    const t = d.data()
    return { id: d.id, kind: t.kind, title: t.title, related: t.related || { label: t.relatedLabel || '—', sub: t.relatedSub || null, bookingId: t.bookingId || null }, at: iso(t.createdAt), delta: { type: t.deltaType || t.delta?.type || 'progress', value: t.deltaType === 'reward' || t.delta?.type === 'reward' ? value(t.delta?.value ?? t.value) : num(t.delta?.value ?? t.value) }, status: t.status }
  }).sort((a, b) => ms(b.at) - ms(a.at))

  const rewards = rwSnap.docs.map((d) => {
    const r = d.data()
    return { id: r.rewardNumber || d.id, source: r.source, value: value(r.value), issuedAt: iso(r.issuedAt ?? r.createdAt), status: lower(r.status), related: r.related || null, reason: r.reason || '', closedAt: iso(r.closedAt), expiresAt: iso(r.expiresAt) }
  }).sort((a, b) => ms(b.issuedAt) - ms(a.issuedAt))
  const rewardCounts = {
    all: rewards.length,
    referral: rewards.filter((x) => x.source === 'referral').length,
    loyalty: rewards.filter((x) => x.source === 'loyalty').length,
    redeemed: rewards.filter((x) => x.status === 'redeemed').length,
    expired: rewards.filter((x) => x.status === 'expired').length,
  }

  const rule = cfg.loyalty
  const rewarded = referrals.filter((x) => x.status === 'rewarded')
  const staleCutoff = Date.now() - cfg.referral.pendingReviewDays * DAY_MS
  const stale = referrals.filter((x) => x.status === 'pending' && ms(x.invitedAt) < staleCutoff)
  const issues = stale.length
    ? [{ id: `ISS-${stale[0].id}`, type: 'referral_pending_long', title: 'Needs Review', text: `${stale.length} referral${stale.length === 1 ? '' : 's'} pending for more than ${cfg.referral.pendingReviewDays} days`, referralId: stale[0].id }]
    : []

  return {
    client: clientBlock(user),
    referral: {
      program: { code: user.get(F.referralCode) || null, status: lower(user.get(F.status)) === 'suspended' ? 'paused' : 'active' },
      rule: cfg.referral,
      summary: { referred: referrals.length, successful: rewarded.length, pending: referrals.filter((x) => x.status === 'pending').length, rewardsEarned: finance ? rewarded.reduce((s, x) => s + (x.rewardAmount || 0), 0) : null },
      funnel: funnel(referrals),
    },
    loyalty: {
      status: lower(acc.status) || 'inactive',
      rule: rule ? { ...rule, rewardValue: finance ? rule.rewardValue : null } : null,
      progress: rule && rule.mode !== 'credit' ? { mode: rule.mode, current: num(acc.current), target: rule.target, unitLabel: rule.unitLabel, unitLabelPlural: rule.unitLabelPlural } : null,
      summary: { earned: num(acc.earned), redeemed: num(acc.redeemed), available: num(acc.available), totalSavings: value(acc.totalSavings) },
      activity: { items: activity.slice(0, 20), total: activity.length },
      rewards: { items: rewards, counts: rewardCounts },
    },
    issues,
    notes,
  }
})

const TAB = { all: () => true, successful: (x) => x.status === 'rewarded', pending: (x) => x.status === 'pending', ineligible: (x) => x.status === 'ineligible' }
const SORT = {
  newest: (a, b) => ms(b.joinedAt) - ms(a.joinedAt),
  oldest: (a, b) => ms(a.joinedAt) - ms(b.joinedAt),
  reward_high: (a, b) => (b.rewardAmount || 0) - (a.rewardAmount || 0) || ms(b.joinedAt) - ms(a.joinedAt),
}
function dateOk(x, date) {
  if (!date) return true
  const t = ms(x.joinedAt)
  const now = Date.now()
  if (date === 'year') return new Date(t).getUTCFullYear() === new Date(now).getUTCFullYear()
  const days = { '7d': 7, '30d': 30, '90d': 90 }[date]
  return days ? now - t <= days * DAY_MS && t <= now + DAY_MS : true
}

export const adminGetClientReferrals = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  const p = request.data || {}
  const user = await loadClient(ctx, p.clientId, p.market)
  const all = await referralsOf(user, ctx.perms.finance)
  const needle = String(p.q || '').trim().toLowerCase()
  const country = user.get(F.country)
  let rows = all.filter((x) => {
    if (!(TAB[p.tab] || TAB.all)(x)) return false
    if (!dateOk(x, p.date)) return false
    if (p.rewarded && x.rewardAmount == null) return false
    return !needle || [x.id, x.client.id, x.client.name, x.email].some((v) => String(v).toLowerCase().includes(needle))
  })
  rows = [...rows].sort(SORT[p.sort] || SORT.newest)
  const page = paginate(rows, p, 5)
  return {
    currency: currencyOf(country),
    timeZone: tzOf(country),
    counts: counts(all),
    ...page,
    items: page.items.map((x) => ({ id: x.id, client: x.client, joinedAt: x.joinedAt, country, countryName: user.get('countryName') || country, progress: x.progress, status: x.status, rewardAmount: x.rewardAmount, rewardId: x.rewardId })),
  }
})

export const adminGetReferralPreview = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  const p = request.data || {}
  const user = await loadClient(ctx, p.clientId, p.market)
  const finance = ctx.perms.finance
  const all = await referralsOf(user, finance)
  const x = all.find((i) => i.id === p.referralId || i.docId === p.referralId)
  if (!x) throw new HttpsError('not-found', 'Referral not found or outside your authorised markets.')
  const cfg = await programmeConfig()
  const country = user.get(F.country)
  const joined = ms(x.joinedAt)
  const ev = (id, at, text, tone = 'ok') => ({ id, at: new Date(at).toISOString(), text, tone })
  const events = [ev('e1', ms(x.invitedAt), `Referral code ${user.get(F.referralCode) || ''} applied`.trim()), ev('e2', joined, 'Registration completed')]
  const doc = await db().collection('referrals').doc(x.docId).get()
  const qualifiedAt = ms(doc.get('qualifiedAt')) || joined
  const rewardedAt = ms(doc.get('rewardedAt')) || qualifiedAt
  if (x.status === 'rewarded') {
    events.push(ev('e3', qualifiedAt, cfg.referral.activityLabel))
    events.push(ev('e4', rewardedAt, `Reward issued${x.rewardId ? ` · ${x.rewardId}` : ''}`))
    if (x.rewardTxnId) events.push(ev('e5', rewardedAt + 1000, `Reward transaction ${x.rewardTxnId} recorded`))
  } else if (x.status === 'pending') events.push(ev('e3', joined + 1000, 'Waiting for the required eligible activity', 'wait'))
  else events.push(ev('e3', joined + 1000, 'No eligible activity recorded — referral not eligible for a reward', 'muted'))

  return {
    id: x.id, client: x.client, joinedAt: x.joinedAt, country, countryName: user.get('countryName') || country,
    progress: x.progress, status: x.status, rewardAmount: x.rewardAmount, rewardId: x.rewardId,
    currency: currencyOf(country), timeZone: tzOf(country),
    code: user.get(F.referralCode) || null,
    invitedAt: x.invitedAt,
    referrer: { id: clientBlock(user).id, name: user.get(F.name) || 'Client' },
    qualification: [
      { id: 'q1', label: 'Registration completed', done: true },
      { id: 'q2', label: cfg.referral.activityLabel, done: x.qualified },
    ],
    rewardTxnId: x.rewardTxnId,
    bookingId: x.bookingId,
    events,
  }
})

// Internal note only — it never creates, edits or reverses a reward.
export const adminAddLoyaltyNote = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  const user = await loadClient(ctx, request.data?.clientId)
  const e = await addNote(request, ctx, user, { scope: 'loyalty', text: cleanText(request.data?.text, { max: 1000, label: 'Note' }) })
  return { id: e.id, author: e.author, text: e.text, createdAt: e.createdAt }
})
