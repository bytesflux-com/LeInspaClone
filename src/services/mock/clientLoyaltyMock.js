// Demo data for ADM-017 (Client Referrals & Loyalty). Used only while the
// `adminGetClientLoyalty` / `adminGetClientReferrals` / `adminGetReferralPreview`
// Cloud Functions are not deployed. Nothing here is a separate "admin referral" or
// "admin loyalty" record: the shapes mirror what the real `referrals`,
// `loyalty_accounts`, `loyalty_transactions` and reward records would produce.
// CL-78421 mirrors the ADM-017 mockup.
//
// Rules the backend (and therefore this mock) follows:
//  • Referral success is decided by the configured referral rule, never by registration alone.
//  • The funnel counts the eligible path: Referred → Registered (eligible) → Qualified → Rewarded.
//  • The loyalty rule/configuration is returned with the account; the UI never hardcodes it.
//  • Every reward carries its source (referral / booking / loyalty event); history is never edited.
import { MOCK_CURRENCY, DAY_MS } from './clientDirectoryMock'
import { buildClientProfile } from './clientProfileMock'

const FX = { KE: 1, UG: 28, TZ: 19, RW: 10, ZA: 0.14 }
const REWARD_KES = 800
const PENDING_REVIEW_DAYS = 30

const hashOf = (text) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
const at = (y, m, d, hh, mm, tz = 3) => new Date(Date.UTC(y, m - 1, d, hh - tz, mm)).toISOString()
const iso = (ms) => new Date(ms).toISOString()
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

// ---------- referral records ----------

function ref(o) {
  return {
    id: `REF-${o.num}`,
    client: { id: `CL-${o.num}`, name: o.name, gender: o.gender, photoURL: null },
    email: `${o.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
    invitedAt: o.invitedAt || o.joinedAt,
    joinedAt: o.joinedAt,
    progress: o.progress,
    status: o.status, // rewarded | pending | ineligible
    qualified: o.status === 'rewarded',
    rewardAmount: o.status === 'rewarded' ? o.reward : null,
    rewardId: o.rewardId || null,
    rewardTxnId: o.status === 'rewarded' ? o.txnId || `REF-TXN-${o.num}` : null,
    bookingId: o.bookingId || null,
  }
}

function seededReferrals() {
  const K = REWARD_KES
  return [
    ref({ num: 82941, name: 'Grace Njeri', gender: 'f', joinedAt: at(2026, 9, 12, 11, 20), status: 'rewarded', progress: 'Eligible action completed', reward: K, rewardId: 'RWD-92841', txnId: 'REF-TXN-92841' }),
    ref({ num: 72814, name: 'Daniel Kimani', gender: 'm', joinedAt: at(2026, 9, 10, 9, 5), status: 'pending', progress: 'Registered' }),
    ref({ num: 66192, name: 'Sheila Achieng', gender: 'f', joinedAt: at(2026, 9, 2, 14, 10), status: 'rewarded', progress: 'Completed booking', reward: K, rewardId: 'RWD-77110', bookingId: 'LI-46188' }),
    ref({ num: 55011, name: 'Brian Otieno', gender: 'm', invitedAt: at(2026, 8, 19, 10, 0), joinedAt: at(2026, 8, 28, 16, 45), status: 'pending', progress: 'Registered' }),
    ref({ num: 44721, name: 'Faith Wambui', gender: 'f', joinedAt: at(2026, 8, 20, 12, 30), status: 'ineligible', progress: 'No eligible activity yet' }),
    ref({ num: 39174, name: 'Peter Mwangi', gender: 'm', joinedAt: at(2026, 7, 14, 10, 15), status: 'rewarded', progress: 'Completed booking', reward: K, bookingId: 'LI-40012' }),
    ref({ num: 30617, name: 'Lucy Wairimu', gender: 'f', joinedAt: at(2026, 6, 2, 13, 40), status: 'rewarded', progress: 'Completed booking', reward: K, bookingId: 'LI-36822' }),
    ref({ num: 28842, name: 'Samuel Otieno', gender: 'm', joinedAt: at(2026, 5, 18, 9, 50), status: 'rewarded', progress: 'Eligible action completed', reward: K }),
    ref({ num: 26410, name: 'Mercy Chebet', gender: 'f', joinedAt: at(2026, 4, 2, 15, 0), status: 'rewarded', progress: 'Completed booking', reward: K, rewardId: 'RWD-31820', bookingId: 'LI-31190' }),
    ref({ num: 24155, name: 'Kevin Omondi', gender: 'm', joinedAt: at(2026, 3, 20, 11, 30), status: 'rewarded', progress: 'Eligible action completed', reward: K }),
    ref({ num: 21908, name: 'Ann Muthoni', gender: 'f', joinedAt: at(2026, 2, 28, 17, 5), status: 'rewarded', progress: 'Completed booking', reward: K, bookingId: 'LI-29004' }),
    ref({ num: 19377, name: 'Joseph Kariuki', gender: 'm', joinedAt: at(2026, 2, 9, 8, 40), status: 'ineligible', progress: 'No eligible activity yet' }),
  ]
}

const NAMES = [
  ['Amina Hassan', 'f'], ['Victor Kamau', 'm'], ['Naomi Chebet', 'f'], ['Dennis Wafula', 'm'],
  ['Joyce Akinyi', 'f'], ['Martin Ndungu', 'm'], ['Purity Njoki', 'f'], ['Allan Barasa', 'm'],
  ['Irene Atieno', 'f'], ['Simon Rono', 'm'],
]

function generatedReferrals(r, profile) {
  const seed = hashOf(r.id)
  const count = seed % 9
  const asOf = new Date(profile.asOf).getTime()
  const joined = new Date(profile.joinedAt).getTime()
  const list = []
  for (let i = 0; i < count; i++) {
    const num = 10000 + ((seed + i * 7919) % 89000)
    const [name, gender] = NAMES[(seed + i * 3) % NAMES.length]
    const joinedAt = Math.max(joined + DAY_MS, asOf - (i * 11 + 3 + (seed % 5)) * DAY_MS)
    const status = i === 0 && seed % 2 === 0 ? 'pending' : i % 5 === 4 ? 'ineligible' : 'rewarded'
    // Roughly one pending referral in six has been waiting past the review threshold.
    const invitedAt = status === 'pending' && seed % 3 === 0 ? joinedAt - 36 * DAY_MS : joinedAt
    list.push(
      ref({
        num,
        name,
        gender,
        invitedAt: iso(invitedAt),
        joinedAt: iso(joinedAt),
        status,
        progress: status === 'pending' ? 'Registered' : status === 'ineligible' ? 'No eligible activity yet' : i % 2 ? 'Eligible action completed' : 'Completed booking',
        reward: REWARD_KES,
      }),
    )
  }
  return list
}

// ---------- loyalty ----------

const LOYALTY_RULE = {
  mode: 'milestone', // milestone | points | credit — the UI adapts to whichever is configured
  unitLabel: 'eligible booking',
  unitLabelPlural: 'eligible bookings',
  target: 10,
  rewardValue: REWARD_KES,
  rewardsExpire: true,
}

const act = (id, o) => ({ id, ...o })

function seededLoyalty() {
  const K = REWARD_KES
  return {
    account: { status: 'active', current: 8, earned: 4, redeemed: 2, available: 2, totalSavings: 3200 },
    activity: [
      act('LA-1', { kind: 'eligible_booking', title: 'Eligible Booking', related: { label: 'Deep Tissue Massage', sub: 'Booking #LI-48291', bookingId: 'LI-48291' }, at: at(2026, 9, 12, 13, 58), delta: { type: 'progress', value: 1 }, status: 'qualified' }),
      act('LA-2', { kind: 'reward_earned', title: 'Reward Earned', related: { label: 'Loyalty Milestone', sub: '10 Bookings' }, at: at(2026, 9, 8, 10, 22), delta: { type: 'reward', value: K }, status: 'earned' }),
      act('LA-3', { kind: 'reward_redeemed', title: 'Reward Redeemed', related: { label: 'Booking #LI-47182', sub: null, bookingId: 'LI-47182' }, at: at(2026, 9, 4, 9, 15), delta: { type: 'redeemed', value: 1 }, status: 'redeemed' }),
      act('LA-4', { kind: 'eligible_booking', title: 'Eligible Booking', related: { label: 'Swedish Massage', sub: 'Booking #LI-46021', bookingId: 'LI-46021' }, at: at(2026, 9, 2, 15, 40), delta: { type: 'progress', value: 1 }, status: 'qualified' }),
      act('LA-5', { kind: 'eligible_booking', title: 'Eligible Booking', related: { label: 'Yoga Session', sub: 'Booking #LI-43910', bookingId: 'LI-43910' }, at: at(2026, 8, 25, 18, 5), delta: { type: 'progress', value: 1 }, status: 'qualified' }),
      act('LA-6', { kind: 'eligible_booking', title: 'Eligible Booking', related: { label: 'Classic Facial', sub: 'Booking #LI-43120', bookingId: 'LI-43120' }, at: at(2026, 8, 19, 11, 30), delta: { type: 'progress', value: 1 }, status: 'qualified' }),
      act('LA-7', { kind: 'eligible_booking', title: 'Eligible Booking', related: { label: 'Hot Stone Massage', sub: 'Booking #LI-42007', bookingId: 'LI-42007' }, at: at(2026, 8, 11, 16, 20), delta: { type: 'progress', value: 1 }, status: 'qualified' }),
      act('LA-8', { kind: 'eligible_booking', title: 'Eligible Booking', related: { label: 'Aromatherapy', sub: 'Booking #LI-41188', bookingId: 'LI-41188' }, at: at(2026, 8, 3, 9, 45), delta: { type: 'progress', value: 1 }, status: 'qualified' }),
    ],
    rewards: [
      { id: 'RWD-92841', source: 'referral', value: K, issuedAt: at(2026, 9, 12, 11, 25), status: 'available', related: { kind: 'referral', id: 'REF-82941', label: 'REF-82941' }, reason: 'Referral of Grace Njeri qualified.' },
      { id: 'RWD-82192', source: 'loyalty', value: K, issuedAt: at(2026, 9, 8, 10, 22), status: 'redeemed', related: { kind: 'booking', id: 'LI-47182', label: 'Booking #LI-47182' }, reason: 'Loyalty milestone reached: 10 eligible bookings.', closedAt: at(2026, 9, 4, 9, 15) },
      { id: 'RWD-77110', source: 'referral', value: K, issuedAt: at(2026, 9, 2, 14, 15), status: 'available', related: { kind: 'referral', id: 'REF-66192', label: 'REF-66192' }, reason: 'Referral of Sheila Achieng qualified.' },
      { id: 'RWD-62011', source: 'loyalty', value: K, issuedAt: at(2026, 6, 12, 10, 0), status: 'expired', related: null, reason: 'Loyalty milestone reached: 10 eligible bookings.', closedAt: at(2026, 9, 12, 0, 0) },
      { id: 'RWD-55109', source: 'loyalty', value: K, issuedAt: at(2026, 5, 20, 10, 0), status: 'redeemed', related: { kind: 'booking', id: 'LI-33110', label: 'Booking #LI-33110' }, reason: 'Loyalty milestone reached: 10 eligible bookings.', closedAt: at(2026, 6, 3, 14, 0) },
      { id: 'RWD-31820', source: 'referral', value: K, issuedAt: at(2026, 4, 2, 15, 10), status: 'available', related: { kind: 'referral', id: 'REF-26410', label: 'REF-26410' }, reason: 'Referral of Mercy Chebet qualified.' },
    ],
  }
}

const SERVICES = ['Deep Tissue Massage', 'Swedish Massage', 'Yoga Session', 'Classic Facial', 'Hot Stone Massage', 'Aromatherapy']

function generatedLoyalty(r, profile, referrals, fx) {
  const seed = hashOf(r.id)
  const asOf = new Date(profile.asOf).getTime()
  const { target } = LOYALTY_RULE
  const value = Math.round(REWARD_KES * fx)
  const total = r.bookings || 0
  const earned = Math.floor(total / target)
  const redeemed = Math.floor(earned / 2)
  const activity = []
  const rewards = []

  for (let i = 0; i < Math.min(total, 6); i++) {
    const id = `LI-${30000 + ((seed + i * 131) % 15000)}`
    const s = SERVICES[(seed + i) % SERVICES.length]
    activity.push(act(`LA-${i + 1}`, { kind: 'eligible_booking', title: 'Eligible Booking', related: { label: s, sub: `Booking #${id}`, bookingId: id }, at: iso(asOf - (i * 9 + 2) * DAY_MS), delta: { type: 'progress', value: 1 }, status: 'qualified' }))
  }
  for (let i = 0; i < earned; i++) {
    const issued = asOf - (30 + i * 45) * DAY_MS
    const isRedeemed = i >= earned - redeemed
    const bookingId = `LI-${20000 + ((seed + i * 977) % 9000)}`
    activity.push(act(`LE-${i + 1}`, { kind: 'reward_earned', title: 'Reward Earned', related: { label: 'Loyalty Milestone', sub: `${target} Bookings` }, at: iso(issued), delta: { type: 'reward', value }, status: 'earned' }))
    if (isRedeemed) activity.push(act(`LR-${i + 1}`, { kind: 'reward_redeemed', title: 'Reward Redeemed', related: { label: `Booking #${bookingId}`, sub: null, bookingId }, at: iso(issued + 5 * DAY_MS), delta: { type: 'redeemed', value: 1 }, status: 'redeemed' }))
    rewards.push({ id: `RWD-${40000 + ((seed + i * 211) % 50000)}`, source: 'loyalty', value, issuedAt: iso(issued), status: isRedeemed ? 'redeemed' : 'available', related: isRedeemed ? { kind: 'booking', id: bookingId, label: `Booking #${bookingId}` } : null, reason: `Loyalty milestone reached: ${target} eligible bookings.`, closedAt: isRedeemed ? iso(issued + 5 * DAY_MS) : null })
  }
  referrals.filter((x) => x.status === 'rewarded').forEach((x, i) => {
    const rid = `RWD-${60000 + ((seed + i * 331) % 30000)}`
    x.rewardId = rid
    rewards.push({ id: rid, source: 'referral', value: x.rewardAmount, issuedAt: x.joinedAt, status: 'available', related: { kind: 'referral', id: x.id, label: x.id }, reason: `Referral of ${x.client.name} qualified.` })
  })
  activity.sort((a, b) => new Date(b.at) - new Date(a.at))
  rewards.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))

  return {
    account: { status: r.status === 'active' ? 'active' : 'inactive', current: total % target, earned, redeemed, available: earned - redeemed, totalSavings: redeemed * value },
    activity,
    rewards,
  }
}

// ---------- per-client state ----------

const stateCache = new Map()

const scaleRecord = (x, fx) => (x.rewardAmount == null ? x : { ...x, rewardAmount: Math.round(x.rewardAmount * fx) })

function stateFor(r) {
  if (!stateCache.has(r.id)) {
    const profile = buildClientProfile(r)
    const fx = FX[r.country] || 1
    const seeded = r.id === 'CL-78421'
    const referrals = (seeded ? seededReferrals() : generatedReferrals(r, profile)).map((x) => scaleRecord(x, fx))
    const loyalty = seeded ? seededLoyalty() : generatedLoyalty(r, profile, referrals, fx)
    const scaled = seeded && fx !== 1
    if (scaled) {
      loyalty.rewards = loyalty.rewards.map((x) => ({ ...x, value: Math.round(x.value * fx) }))
      loyalty.activity = loyalty.activity.map((x) => (x.delta.type === 'reward' ? { ...x, delta: { ...x.delta, value: Math.round(x.delta.value * fx) } } : x))
      loyalty.account = { ...loyalty.account, totalSavings: Math.round(loyalty.account.totalSavings * fx) }
    }
    stateCache.set(r.id, { profile, referrals, loyalty, notes: [], fx, currency: MOCK_CURRENCY[r.country] || profile.currency || 'USD' })
  }
  return stateCache.get(r.id)
}

const clientBlock = (s, r) => ({
  id: s.profile.id,
  name: s.profile.name,
  photoURL: s.profile.photoURL,
  gender: s.profile.gender,
  membershipTier: s.profile.membershipTier,
  status: s.profile.status,
  contactVerified: s.profile.contactVerified,
  country: s.profile.country,
  countryName: s.profile.countryName,
  city: s.profile.city,
  joinedAt: s.profile.joinedAt,
  lastActiveAt: s.profile.lastActiveAt,
  asOf: s.profile.asOf,
  timeZone: s.profile.timeZone,
  currency: s.currency || MOCK_CURRENCY[r.country] || 'USD',
})

const statusCounts = (list) => ({
  all: list.length,
  successful: list.filter((x) => x.status === 'rewarded').length,
  pending: list.filter((x) => x.status === 'pending').length,
  ineligible: list.filter((x) => x.status === 'ineligible').length,
})

function buildFunnel(list) {
  const invited = list.length
  const registered = list.filter((x) => x.status !== 'ineligible').length
  const qualified = list.filter((x) => x.qualified).length
  const rewarded = list.filter((x) => x.rewardTxnId).length
  return [
    { id: 'invited', label: 'Invited / Referred', count: invited, conversion: null },
    { id: 'registered', label: 'Registered', count: registered, conversion: pct(registered, invited) },
    { id: 'qualified', label: 'Qualified', count: qualified, conversion: pct(qualified, registered) },
    { id: 'rewarded', label: 'Rewarded', count: rewarded, conversion: pct(rewarded, qualified) },
  ]
}

// Issues only ever raise a review state — they never accuse or penalise the client.
function buildIssues(s) {
  const asOf = new Date(s.profile.asOf).getTime()
  const stale = s.referrals.filter((x) => x.status === 'pending' && asOf - new Date(x.invitedAt).getTime() > PENDING_REVIEW_DAYS * DAY_MS)
  if (stale.length === 0) return []
  return [
    {
      id: `ISS-${stale[0].id}`,
      type: 'referral_pending_long',
      title: 'Needs Review',
      text: `${stale.length} referral${stale.length === 1 ? '' : 's'} pending for more than ${PENDING_REVIEW_DAYS} days`,
      referralId: stale[0].id,
    },
  ]
}

// ---------- main payload ----------

export function buildClientLoyalty(r) {
  const s = stateFor(r)
  const { account } = s.loyalty
  const rule = LOYALTY_RULE
  const rewarded = s.referrals.filter((x) => x.status === 'rewarded')
  const rewardCounts = {
    all: s.loyalty.rewards.length,
    referral: s.loyalty.rewards.filter((x) => x.source === 'referral').length,
    loyalty: s.loyalty.rewards.filter((x) => x.source === 'loyalty').length,
    redeemed: s.loyalty.rewards.filter((x) => x.status === 'redeemed').length,
    expired: s.loyalty.rewards.filter((x) => x.status === 'expired').length,
  }

  return {
    client: clientBlock(s, r),
    referral: {
      program: { code: s.profile.referrals.code, status: r.status === 'suspended' ? 'paused' : 'active' },
      rule: { id: 'first_eligible_booking', label: 'Registration + first eligible completed booking', activityLabel: 'Required eligible activity completed' },
      summary: {
        referred: s.referrals.length,
        successful: rewarded.length,
        pending: s.referrals.filter((x) => x.status === 'pending').length,
        rewardsEarned: rewarded.reduce((sum, x) => sum + (x.rewardAmount || 0), 0),
      },
      funnel: buildFunnel(s.referrals),
    },
    loyalty: {
      status: account.status,
      rule,
      progress: rule.mode === 'credit' ? null : { mode: rule.mode, current: account.current, target: rule.target, unitLabel: rule.unitLabel, unitLabelPlural: rule.unitLabelPlural },
      summary: { earned: account.earned, redeemed: account.redeemed, available: account.available, totalSavings: account.totalSavings },
      activity: { items: s.loyalty.activity, total: s.loyalty.activity.length },
      rewards: { items: s.loyalty.rewards, counts: rewardCounts },
    },
    issues: buildIssues(s),
    notes: s.notes,
  }
}

// ---------- referral list (server-side filtering / sorting / paging) ----------

const matchesDate = (x, date, asOf) => {
  if (!date) return true
  const ms = new Date(x.joinedAt).getTime()
  const now = new Date(asOf).getTime()
  if (date === 'year') return new Date(ms).getUTCFullYear() === new Date(now).getUTCFullYear()
  const days = { '7d': 7, '30d': 30, '90d': 90 }[date]
  return days ? now - ms <= days * DAY_MS && ms <= now + DAY_MS : true
}

const TAB_FILTERS = {
  all: () => true,
  successful: (x) => x.status === 'rewarded',
  pending: (x) => x.status === 'pending',
  ineligible: (x) => x.status === 'ineligible',
}

const SORTERS = {
  newest: (a, b) => new Date(b.joinedAt) - new Date(a.joinedAt),
  oldest: (a, b) => new Date(a.joinedAt) - new Date(b.joinedAt),
  reward_high: (a, b) => (b.rewardAmount || 0) - (a.rewardAmount || 0) || new Date(b.joinedAt) - new Date(a.joinedAt),
}

const listItem = (x, s) => ({
  id: x.id,
  client: x.client,
  joinedAt: x.joinedAt,
  country: s.profile.country,
  countryName: s.profile.countryName,
  progress: x.progress,
  status: x.status,
  rewardAmount: x.rewardAmount,
  rewardId: x.rewardId,
})

export function queryClientReferrals(r, p) {
  const s = stateFor(r)
  const needle = (p.q || '').trim().toLowerCase()
  let rows = s.referrals.filter((x) => {
    if (!(TAB_FILTERS[p.tab] || TAB_FILTERS.all)(x)) return false
    if (!matchesDate(x, p.date, s.profile.asOf)) return false
    if (p.rewarded && x.rewardAmount == null) return false
    if (!needle) return true
    return [x.id, x.client.id, x.client.name, x.email].some((v) => v.toLowerCase().includes(needle))
  })
  rows = [...rows].sort(SORTERS[p.sort] || SORTERS.newest)

  const pageSize = Number(p.pageSize) || 5
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const page = Math.min(Math.max(1, Number(p.page) || 1), totalPages)
  const start = (page - 1) * pageSize
  return {
    currency: s.currency,
    timeZone: s.profile.timeZone,
    counts: statusCounts(s.referrals),
    items: rows.slice(start, start + pageSize).map((x) => listItem(x, s)),
    total: rows.length,
    page,
    pageSize,
    totalPages,
  }
}

// ---------- referral drawer ----------

export function buildReferralPreview(r, referralId) {
  const s = stateFor(r)
  const x = s.referrals.find((i) => i.id === referralId)
  if (!x) throw new Error('Referral not found or outside your authorised markets.')
  const joined = new Date(x.joinedAt).getTime()
  const ev = (id, ms, text, tone = 'ok') => ({ id, at: iso(ms), text, tone })
  const events = [
    ev('e1', new Date(x.invitedAt).getTime(), `Referral code ${s.profile.referrals.code} applied`),
    ev('e2', joined, 'Registration completed'),
  ]
  if (x.status === 'rewarded') {
    events.push(ev('e3', joined + 2 * 3_600_000, 'Required eligible activity completed'))
    events.push(ev('e4', joined + 2 * 3_600_000 + 300_000, `Reward issued${x.rewardId ? ` · ${x.rewardId}` : ''}`))
    events.push(ev('e5', joined + 2 * 3_600_000 + 360_000, `Reward transaction ${x.rewardTxnId} recorded`))
  } else if (x.status === 'pending') {
    events.push(ev('e3', joined + 1000, 'Waiting for the required eligible activity', 'wait'))
  } else {
    events.push(ev('e3', joined + 1000, 'No eligible activity recorded — referral not eligible for a reward', 'muted'))
  }

  return {
    ...listItem(x, s),
    currency: s.currency,
    timeZone: s.profile.timeZone,
    code: s.profile.referrals.code,
    invitedAt: x.invitedAt,
    referrer: { id: s.profile.id, name: s.profile.name },
    qualification: [
      { id: 'q1', label: 'Registration completed', done: true },
      { id: 'q2', label: 'Required eligible activity completed', done: x.qualified },
    ],
    rewardTxnId: x.rewardTxnId,
    bookingId: x.bookingId,
    events,
  }
}

// ---------- internal notes ----------

export function addMockLoyaltyNote(r, text) {
  const s = stateFor(r)
  const entry = { id: `ln${Date.now()}`, author: 'You', text, createdAt: new Date().toISOString() }
  s.notes.unshift(entry)
  return entry
}
