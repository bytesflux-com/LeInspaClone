// ADM-010 Client Management Dashboard + ADM-011 All Clients.
//
// Source of truth is the central `users` collection (accountType == 'customer').
// There is NO admin_clients collection. Filtering, sorting and paging run in Firestore;
// the browser only ever receives one page of MASKED rows.
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { AggregateField, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { addDays, addHours, format, startOfDay, startOfMonth, subDays } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { convertCurrency } from '../utils/currency.js'
import {
  COUNTRIES, DAY_MS, F, MARKET_CODES, STATUS_RAW, TIER_RAW,
  addNote, adminCtx, applyScope, cleanText, countryName, currencyOf,
  db, displayId, iso, listNotes, loadClient, lower, maskEmail, maskPhone, ms, need, num, safeCount, scopeFor, statusOf, tierOf,
} from './common.js'
import { recordAudit } from '../events.js'

const users = () => db().collection('users')
const customers = (scope) => applyScope(users().where('accountType', '==', 'customer'), scope)
const pct1 = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0)
const changePct = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : cur > 0 ? 100 : 0)
const DEFAULT_TZ = 'Africa/Nairobi'

// ---------------------------------------------------------------------------
// Reporting-period maths
// ---------------------------------------------------------------------------
const RANGE_LABEL = { today: 'vs. yesterday', yesterday: 'vs. day before', '7d': 'vs. previous week', '30d': 'vs. last month', this_month: 'vs. last month', custom: 'vs. previous period' }

function periodOf(range, tz = DEFAULT_TZ, custom = null) {
  const now = toZonedTime(new Date(), tz)
  let start = startOfDay(now)
  let end = now
  if (range === 'yesterday') { start = startOfDay(subDays(now, 1)); end = startOfDay(now) }
  else if (range === '7d') start = startOfDay(subDays(now, 7))
  else if (range === '30d') start = startOfDay(subDays(now, 30))
  else if (range === 'this_month') start = startOfMonth(now)
  else if (range === 'custom' && custom?.start) {
    start = toZonedTime(new Date(custom.start), tz)
    end = custom.end ? toZonedTime(new Date(custom.end), tz) : now
  }
  const length = Math.max(DAY_MS / 24, end.getTime() - start.getTime())
  const prevEnd = start
  const prevStart = new Date(start.getTime() - length)
  const z = (d) => fromZonedTime(format(d, "yyyy-MM-dd'T'HH:mm:ss"), tz)
  return { start: z(start), end: z(end), prevStart: z(prevStart), prevEnd: z(prevEnd), hourly: range === 'today' || range === 'yesterday', days: Math.max(1, Math.round(length / DAY_MS)) }
}

const between = (q, field, a, b) => q.where(field, '>=', Timestamp.fromDate(a)).where(field, '<', Timestamp.fromDate(b))
const buckets = (start, end, stepMs) => {
  const out = []
  for (let t = start.getTime(); t < end.getTime() && out.length < 90; t += stepMs) out.push([new Date(t), new Date(Math.min(t + stepMs, end.getTime()))])
  return out
}

// ---------------------------------------------------------------------------
// ADM-010 — dashboard
// ---------------------------------------------------------------------------
export const adminGetClientDashboard = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  const scope = scopeFor(ctx, request.data?.market)
  const range = String(request.data?.range || '30d')
  const tz = scope.codes?.length === 1 ? COUNTRIES[scope.codes[0]]?.tz || DEFAULT_TZ : DEFAULT_TZ
  const period = periodOf(range, tz, request.data?.customRange)
  const base = () => customers(scope)
  const bookingsBase = () => applyScope(db().collection('bookings'), scope, 'countryCode')
  const inStatus = (ui) => base().where(F.status, 'in', STATUS_RAW[ui])
  const inTier = (ui) => base().where(F.membership, 'in', TIER_RAW[ui])

  const [
    total, active, suspended, inactive, pending, deactivated,
    newNow, newPrev, bookingClients, bookingClientsPrev,
    standard, premium, executive, guestConverted,
    activePrev,
  ] = await Promise.all([
    safeCount(base()), safeCount(inStatus('active')), safeCount(inStatus('suspended')), safeCount(inStatus('inactive')),
    safeCount(inStatus('pending')), safeCount(inStatus('deactivated')),
    safeCount(between(base(), F.created, period.start, period.end)),
    safeCount(between(base(), F.created, period.prevStart, period.prevEnd)),
    safeCount(base().where(F.bookings, '>', 0)),
    safeCount(between(base().where(F.bookings, '>', 0), F.created, period.prevStart, period.prevEnd)),
    safeCount(inTier('standard')), safeCount(inTier('premium')), safeCount(inTier('executive')),
    safeCount(base().where(F.guestConverted, '==', true)),
    safeCount(between(inStatus('active'), F.created, period.prevStart, period.prevEnd)),
  ])

  // Needs Attention — each number links to a filtered view on the client side.
  const supportBase = applyScope(db().collection('support_tickets'), scope, 'countryCode')
  const paymentsBase = applyScope(db().collection('payments'), scope, 'countryCode')
  const guestBase = applyScope(db().collection('guest_bookings'), scope, 'countryCode')
  const [escalations, paymentIssues, guestBookings, unlinked] = await Promise.all([
    safeCount(supportBase.where('status', 'in', ['escalated', 'open']).where('priority', 'in', ['high', 'critical'])),
    safeCount(paymentsBase.where('status', '==', 'failed').where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - 30 * DAY_MS)))),
    safeCount(between(guestBase, 'createdAt', period.start, period.end)),
    safeCount(guestBase.where('linkedUserId', '==', null)),
  ])

  // Locations — real configured cities/regions only (collection `cities`: { name, region, countryCode }).
  const locations = await configuredLocations(scope, total, base)

  // Booking behaviour for the selected period.
  const booking = await bookingBehaviour(scope, period, bookingsBase, bookingClients)
  const guestLinked = Math.max(0, guestBookings - unlinked)

  return {
    market: scope.market,
    range,
    deltaLabel: RANGE_LABEL[range] || RANGE_LABEL['30d'],
    kpis: {
      total: { value: total, change: changePct(total, Math.max(0, total - newNow)) },
      active: { value: active, change: changePct(active, Math.max(0, active - newNow)) },
      newClients: { value: newNow, change: changePct(newNow, newPrev) },
      bookingClients: { value: bookingClients, change: changePct(bookingClients, Math.max(0, bookingClients - bookingClientsPrev)) },
      suspended: { value: suspended, change: 0, adverse: true },
    },
    attention: { reviews: pending, suspended, support: escalations, payments: paymentIssues, guestLinking: unlinked },
    segments: { all: total, standard, premium, executive, guest: guestConverted, suspended, inactive },
    membership: {
      total,
      slices: [
        { id: 'standard', label: 'Standard', count: standard, pct: pct1(standard, total) },
        { id: 'premium', label: 'Premium', count: premium, pct: pct1(premium, total) },
        { id: 'executive', label: 'Executive', count: executive, pct: pct1(executive, total) },
        { id: 'none', label: 'Other', count: Math.max(0, total - standard - premium - executive), pct: pct1(Math.max(0, total - standard - premium - executive), total) },
      ],
    },
    locations,
    guest: { bookings: guestBookings, convertedPct: pct1(guestLinked, guestBookings), unlinked },
    booking,
  }
})

async function configuredLocations(scope, total, base) {
  try {
    const cfg = await applyScope(db().collection('cities'), scope, 'countryCode').limit(60).get()
    const cities = cfg.docs.map((d) => ({ name: d.get('name'), region: d.get('region') || null, country: d.get('countryCode') })).filter((c) => c.name)
    const counts = await Promise.all(cities.map((c) => safeCount(base().where(F.city, '==', c.name).where(F.country, '==', c.country))))
    const rows = cities.map((c, i) => ({ ...c, count: counts[i] }))
    const cityList = [...rows].sort((a, b) => b.count - a.count).slice(0, 5).map((c) => ({ name: c.name, count: c.count, pct: pct1(c.count, total) }))
    const byRegion = new Map()
    for (const c of rows) if (c.region) byRegion.set(c.region, (byRegion.get(c.region) || 0) + c.count)
    const regions = [...byRegion.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count, pct: pct1(count, total) }))
    return { cities: cityList, regions }
  } catch {
    return { cities: [], regions: [] }
  }
}

async function bookingBehaviour(scope, period, bookingsBase, bookingClients) {
  const codes = scope.codes ?? MARKET_CODES
  const single = scope.codes?.length === 1
  const currency = single ? currencyOf(scope.codes[0]) : 'USD'
  const inPeriod = (q) => between(q, 'createdAt', period.start, period.end)
  const [completed, cancelled, avgs] = await Promise.all([
    safeCount(inPeriod(bookingsBase().where('bookingStatus', '==', 'completed'))),
    safeCount(inPeriod(bookingsBase().where('bookingStatus', '==', 'cancelled'))),
    Promise.all(codes.map(async (code) => {
      try {
        const q = inPeriod(db().collection('bookings').where('countryCode', '==', code).where('bookingStatus', '==', 'completed'))
        const d = (await q.aggregate({ avg: AggregateField.average('totalPrice'), n: AggregateField.count() }).get()).data()
        return { code, avg: d.avg || 0, n: d.n || 0 }
      } catch { return { code, avg: 0, n: 0 } }
    })),
  ])
  const nTotal = avgs.reduce((s, a) => s + a.n, 0)
  const avgBookingValue = Math.round(avgs.reduce((s, a) => s + convertCurrency(a.avg, currencyOf(a.code), currency) * a.n, 0) / (nTotal || 1))

  const stepMs = period.hourly ? 3_600_000 : DAY_MS
  const steps = buckets(period.start, period.end, stepMs)
  const series = await Promise.all(steps.map(async ([a, b]) => {
    const [c, x] = await Promise.all([
      safeCount(between(bookingsBase().where('bookingStatus', '==', 'completed'), 'createdAt', a, b)),
      safeCount(between(bookingsBase().where('bookingStatus', '==', 'cancelled'), 'createdAt', a, b)),
    ])
    const zoned = toZonedTime(a, scope.codes?.length === 1 ? COUNTRIES[scope.codes[0]]?.tz || DEFAULT_TZ : DEFAULT_TZ)
    return { label: period.hourly ? format(zoned, 'HH:00') : format(zoned, 'MMM d'), completed: c, cancelled: x }
  }))
  return {
    bookingClients,
    completionRate: pct1(completed, completed + cancelled),
    avgBookingValue,
    currency,
    series,
    granularity: period.hourly ? 'hour' : 'day',
  }
}

export const adminGetClientGrowth = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  const scope = scopeFor(ctx, request.data?.market)
  const window = ['daily', 'weekly', 'monthly'].includes(request.data?.window) ? request.data.window : 'monthly'
  const tz = scope.codes?.length === 1 ? COUNTRIES[scope.codes[0]]?.tz || DEFAULT_TZ : DEFAULT_TZ
  const zonedNow = toZonedTime(new Date(), tz)
  const z = (d) => fromZonedTime(format(d, "yyyy-MM-dd'T'HH:mm:ss"), tz)
  const cfg = {
    daily: { start: startOfDay(zonedNow), points: 24, step: 'hour', label: 'today vs. yesterday', prev: () => startOfDay(subDays(zonedNow, 1)) },
    weekly: { start: startOfDay(subDays(zonedNow, 6)), points: 7, step: 'day', label: 'this week vs. last week', prev: () => startOfDay(subDays(zonedNow, 13)) },
    monthly: { start: startOfDay(subDays(zonedNow, 29)), points: 30, step: 'day', label: 'this month vs. last month', prev: () => startOfDay(subDays(zonedNow, 59)) },
  }[window]
  const q = () => customers(scope)
  const points = await Promise.all(Array.from({ length: cfg.points }, async (_, i) => {
    const a = cfg.step === 'hour' ? addHours(cfg.start, i) : addDays(cfg.start, i)
    const b = cfg.step === 'hour' ? addHours(a, 1) : addDays(a, 1)
    return { label: cfg.step === 'hour' ? format(a, 'HH:00') : format(a, 'MMM d'), value: await safeCount(between(q(), F.created, z(a), z(b))) }
  }))
  const current = points.reduce((s, p) => s + p.value, 0)
  const prevStart = cfg.prev()
  const previous = await safeCount(between(q(), F.created, z(prevStart), z(cfg.start)))
  return { window, comparison: cfg.label, changePct: changePct(current, previous), points }
})

// ---------------------------------------------------------------------------
// ADM-011 — directory
// ---------------------------------------------------------------------------
const SORT_FIELD = {
  newest: [F.created, 'desc'], oldest: [F.created, 'asc'], bookings: [F.bookings, 'desc'],
  active: [F.lastActive, 'desc'], updated: [F.updated, 'desc'], value: [F.lifetimeValue, 'desc'],
}
const sortOf = (ctx, sort) => (sort === 'value' && !ctx.perms.finance ? 'newest' : SORT_FIELD[sort] ? sort : 'newest')
const ts = (msValue) => Timestamp.fromMillis(msValue)
const JOINED_DAYS = { '7d': 7, '30d': 30, '90d': 90 }

// Firestore side of the filters (everything except free-text search).
function filteredQuery(ctx, scope, p, { ignoreStatus = false } = {}) {
  let q = customers(scope)
  const now = Date.now()
  if (!scope.codes && p.country) q = q.where(F.country, '==', String(p.country).toUpperCase())
  if (!ignoreStatus && p.status && p.status !== 'all') {
    if (!STATUS_RAW[p.status]) throw new HttpsError('invalid-argument', 'Unknown status.')
    q = q.where(F.status, 'in', STATUS_RAW[p.status])
  }
  if (p.membership) {
    if (!TIER_RAW[p.membership]) throw new HttpsError('invalid-argument', 'Unknown membership.')
    q = q.where(F.membership, 'in', TIER_RAW[p.membership])
  }
  if (p.region) q = q.where(F.region, '==', p.region)
  if (p.city) q = q.where(F.city, '==', p.city)
  if (p.reg) q = q.where(F.regMethod, '==', p.reg)
  if (p.guest === 'yes') q = q.where(F.guestConverted, '==', true)
  if (p.guest === 'no') q = q.where(F.guestConverted, '==', false)

  const days = JOINED_DAYS[p.joined]
  if (days) q = q.where(F.created, '>=', ts(now - days * DAY_MS))
  if (p.joined === 'year') q = q.where(F.created, '>=', ts(Date.UTC(new Date().getUTCFullYear(), 0, 1)))
  if (p.from) q = q.where(F.created, '>=', ts(Date.parse(p.from)))
  if (p.to) q = q.where(F.created, '<=', ts(Date.parse(p.to) + DAY_MS - 1))

  const startToday = Math.floor(now / DAY_MS) * DAY_MS
  switch (p.activity) {
    case 'today': q = q.where(F.lastBookingAt, '>=', ts(startToday)); break
    case 'week': q = q.where(F.lastBookingAt, '>=', ts(now - 7 * DAY_MS)); break
    case 'upcoming': q = q.where(F.hasUpcoming, '==', true); break
    case 'in_service': q = q.where(F.inService, '==', true); break
    case 'none': q = q.where(F.bookings, '==', 0); break
    case 'returning': q = q.where(F.bookings, '>=', 2); break
    case 'cancelled_recent': q = q.where(F.cancelledRecently, '==', true); break
    default:
  }
  if (p.bmin !== '' && p.bmin != null) q = q.where(F.bookings, '>=', Number(p.bmin))
  if (p.bmax !== '' && p.bmax != null) q = q.where(F.bookings, '<=', Number(p.bmax))
  if (p.lastb === 'never') q = q.where(F.bookings, '==', 0)
  else if (p.lastb) q = q.where(F.lastBookingAt, '>=', ts(now - Number(p.lastb) * DAY_MS))
  if (p.lasta) q = q.where(F.lastActive, '>=', ts(now - Number(p.lasta) * DAY_MS))

  const issues = Array.isArray(p.issues) ? p.issues : []
  if (issues.includes('dispute')) q = q.where(F.openDisputes, '>', 0)
  if (issues.includes('ticket')) q = q.where(F.openTickets, '>', 0)
  if (issues.includes('safety') && ctx.perms.safety) q = q.where(F.openSafety, '>', 0)
  if (issues.includes('payment') && ctx.perms.finance) q = q.where(F.paymentIssue, '==', true)
  return q
}

// Same filters evaluated on one document — used for search results.
function matches(ctx, u, p, { ignoreStatus = false } = {}) {
  const now = Date.now()
  const status = statusOf(u.get(F.status))
  const created = ms(u.get(F.created))
  const booked = ms(u.get(F.lastBookingAt))
  const bookings = num(u.get(F.bookings))
  if (!ignoreStatus && p.status && p.status !== 'all' && status !== p.status) return false
  if (p.membership && tierOf(u.get(F.membership)) !== p.membership) return false
  if (p.country && !(p.market && p.market !== 'ALL') && u.get(F.country) !== String(p.country).toUpperCase()) return false
  if (p.region && u.get(F.region) !== p.region) return false
  if (p.city && u.get(F.city) !== p.city) return false
  if (p.reg && u.get(F.regMethod) !== p.reg) return false
  if (p.guest === 'yes' && !u.get(F.guestConverted)) return false
  if (p.guest === 'no' && u.get(F.guestConverted)) return false
  if (JOINED_DAYS[p.joined] && now - created > JOINED_DAYS[p.joined] * DAY_MS) return false
  if (p.joined === 'year' && new Date(created).getUTCFullYear() !== new Date().getUTCFullYear()) return false
  if (p.from && created < Date.parse(p.from)) return false
  if (p.to && created > Date.parse(p.to) + DAY_MS - 1) return false
  if (p.activity === 'today' && !(booked >= Math.floor(now / DAY_MS) * DAY_MS)) return false
  if (p.activity === 'week' && !(booked && now - booked <= 7 * DAY_MS)) return false
  if (p.activity === 'upcoming' && !u.get(F.hasUpcoming)) return false
  if (p.activity === 'in_service' && !u.get(F.inService)) return false
  if (p.activity === 'none' && bookings !== 0) return false
  if (p.activity === 'returning' && bookings < 2) return false
  if (p.activity === 'cancelled_recent' && !u.get(F.cancelledRecently)) return false
  if (p.bmin !== '' && p.bmin != null && bookings < Number(p.bmin)) return false
  if (p.bmax !== '' && p.bmax != null && bookings > Number(p.bmax)) return false
  if (p.lastb === 'never' && bookings !== 0) return false
  if (p.lastb && p.lastb !== 'never' && !(booked && now - booked <= Number(p.lastb) * DAY_MS)) return false
  if (p.lasta && now - ms(u.get(F.lastActive)) > Number(p.lasta) * DAY_MS) return false
  const issues = Array.isArray(p.issues) ? p.issues : []
  if (issues.includes('dispute') && !num(u.get(F.openDisputes))) return false
  if (issues.includes('ticket') && !num(u.get(F.openTickets))) return false
  if (issues.includes('safety') && ctx.perms.safety && !num(u.get(F.openSafety))) return false
  if (issues.includes('payment') && ctx.perms.finance && !u.get(F.paymentIssue)) return false
  return true
}

const SORT_VALUE = {
  newest: (u) => ms(u.get(F.created)), oldest: (u) => -ms(u.get(F.created)), bookings: (u) => num(u.get(F.bookings)),
  active: (u) => ms(u.get(F.lastActive)), updated: (u) => ms(u.get(F.updated)), value: (u) => num(u.get(F.lifetimeValue)),
}

// Candidate documents for a free-text query. Exact Client ID ranks first.
// Name search is a prefix search on `fullName`; for contains-search at scale use Algolia/Typesense.
async function searchCandidates(scope, raw) {
  const q = String(raw).trim().slice(0, 80)
  const out = new Map()
  const add = (docs) => docs.forEach((d) => d.get('accountType') === 'customer' && out.set(d.id, d))
  const scoped = (query) => applyScope(query.where('accountType', '==', 'customer'), scope).limit(60)
  const exact = []
  const byId = await users().doc(q.replace(/\//g, '')).get().catch(() => null)
  if (byId?.exists) exact.push(byId)
  const byCode = await scoped(users().where(F.clientCode, '==', q.toUpperCase())).get()
  exact.push(...byCode.docs)
  exact.forEach((d) => d.get('accountType') === 'customer' && out.set(d.id, d))

  const tasks = []
  if (q.includes('@')) {
    const e = q.toLowerCase()
    tasks.push(scoped(users().where(F.email, '>=', e).where(F.email, '<=', `${e}\uf8ff`)).get())
  }
  const digits = q.replace(/\D/g, '')
  if (digits.length >= 5) {
    for (const v of new Set([`+${digits}`, digits, `+${COUNTRIES.KE.dial.slice(1)}${digits.replace(/^0/, '')}`])) tasks.push(scoped(users().where(F.phone, '==', v)).get())
  }
  if (!q.includes('@') && !/^\d+$/.test(q)) {
    const title = q.replace(/\b\w/g, (c) => c.toUpperCase())
    for (const v of new Set([q, title])) tasks.push(scoped(users().where(F.name, '>=', v).where(F.name, '<=', `${v}\uf8ff`)).get())
  }
  for (const snap of await Promise.all(tasks)) add(snap.docs)
  return { docs: [...out.values()], exactIds: new Set(exact.map((d) => d.id)) }
}

function toListItem(ctx, u) {
  const country = u.get(F.country)
  return {
    id: displayId(u),
    name: u.get(F.name) || 'Client',
    gender: ['male', 'm'].includes(lower(u.get(F.gender))) ? 'm' : 'f',
    photoURL: u.get(F.photo) || null,
    email: maskEmail(u.get(F.email)),
    phone: maskPhone(u.get(F.phone), country),
    country,
    countryName: countryName(country),
    city: u.get(F.city) || '',
    membership: tierOf(u.get(F.membership)),
    status: statusOf(u.get(F.status)),
    bookings: num(u.get(F.bookings)),
    lifetimeValue: ctx.perms.finance ? num(u.get(F.lifetimeValue)) : null,
    currency: currencyOf(country),
    guestConverted: Boolean(u.get(F.guestConverted)),
    joinedAt: iso(u.get(F.created)),
  }
}

const STATUS_TABS = ['active', 'pending', 'inactive', 'suspended', 'deactivated']

async function runList(ctx, p) {
  const scope = scopeFor(ctx, p.market)
  const params = { ...p, market: scope.market }
  const page = Math.max(1, Number(p.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(p.pageSize) || 10))
  const sort = sortOf(ctx, p.sort)
  const hasQuery = String(p.q || '').trim().length > 0

  if (hasQuery) {
    const { docs, exactIds } = await searchCandidates(scope, p.q)
    const scoped = docs.filter((u) => matches(ctx, u, params, { ignoreStatus: true }))
    const counts = { all: scoped.length, ...Object.fromEntries(STATUS_TABS.map((s) => [s, 0])) }
    for (const u of scoped) { const s = statusOf(u.get(F.status)); if (s in counts) counts[s] += 1 }
    const rows = (p.status && p.status !== 'all' ? scoped.filter((u) => statusOf(u.get(F.status)) === p.status) : scoped)
      .sort((a, b) => Number(exactIds.has(b.id)) - Number(exactIds.has(a.id)) || SORT_VALUE[sort](b) - SORT_VALUE[sort](a))
    return {
      items: rows.slice((page - 1) * pageSize, page * pageSize).map((u) => toListItem(ctx, u)),
      total: rows.length, page, pageSize, totalPages: Math.max(1, Math.ceil(rows.length / pageSize)), counts,
    }
  }

  const [field, direction] = SORT_FIELD[sort]
  const filtered = filteredQuery(ctx, scope, params)
  const [snap, total, ...tabCounts] = await Promise.all([
    filtered.orderBy(field, direction).offset((page - 1) * pageSize).limit(pageSize).get(),
    safeCount(filtered),
    ...STATUS_TABS.map((s) => safeCount(filteredQuery(ctx, scope, { ...params, status: s }, { ignoreStatus: false }))),
  ])
  const counts = { all: 0 }
  STATUS_TABS.forEach((s, i) => { counts[s] = tabCounts[i]; counts.all += tabCounts[i] })
  // Statuses outside the five tabs (e.g. a client without a status) still belong to "All".
  const allQuery = filteredQuery(ctx, scope, params, { ignoreStatus: true })
  counts.all = p.status && p.status !== 'all' ? await safeCount(allQuery) : total
  return {
    items: snap.docs.map((u) => toListItem(ctx, u)),
    total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), counts,
  }
}

export const adminListClients = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  return runList(ctx, request.data || {})
})

// Lightweight aggregate preview — never the full booking/payment history.
export const adminGetClientPreview = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  const u = await loadClient(ctx, request.data?.clientId, request.data?.market)
  const key = u.id
  const code = u.get(F.clientCode)
  const ids = [...new Set([key, code].filter(Boolean))]
  const bookings = () => db().collection('bookings').where('customerId', 'in', ids)
  const [total, completed, cancelled, tickets, disputes] = await Promise.all([
    safeCount(bookings()),
    safeCount(bookings().where('bookingStatus', '==', 'completed')),
    safeCount(bookings().where('bookingStatus', '==', 'cancelled')),
    ctx.perms.support ? safeCount(db().collection('support_tickets').where('customerId', 'in', ids).where('status', 'in', ['open', 'in_review', 'escalated'])) : 0,
    safeCount(db().collection('disputes').where('customerId', 'in', ids).where('status', 'in', ['open', 'investigating'])),
  ])
  let walletBalance = null
  if (ctx.perms.finance) {
    const w = await db().collection('wallets').where('ownerId', '==', key).where('type', '==', 'client').limit(1).get()
    walletBalance = w.empty ? 0 : num(w.docs[0].get('availableBalance') ?? w.docs[0].get('balance'))
  }
  const joined = iso(u.get(F.created))
  const since = iso(u.get('membershipSince')) || joined
  return {
    ...toListItem(ctx, u),
    stats: { totalBookings: total, completed, cancelled, openDisputes: disputes, supportTickets: tickets, walletBalance },
    totalSavings: ctx.perms.finance ? num(u.get(F.totalSavings)) : null,
    referredBy: u.get(F.referredBy) || null,
    membershipDetail: { tier: tierOf(u.get(F.membership)), since, validUntil: iso(u.get('membershipExpiresAt')) },
  }
})

export const adminGetClientActivity = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  const u = await loadClient(ctx, request.data?.clientId)
  const snap = await db().collection('client_activity').where('clientId', '==', u.id).limit(100).get().catch(() => null)
  const rows = (snap?.docs || []).map((d) => ({ id: d.id, type: d.get('type') || 'profile', title: d.get('title') || d.get('text') || 'Activity', at: iso(d.get('createdAt')) }))
  return rows.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 20).map((r) => ({ ...r, daysAgo: Math.floor((Date.now() - Date.parse(r.at)) / DAY_MS) }))
})

export const adminGetClientNotes = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  const u = await loadClient(ctx, request.data?.clientId)
  return listNotes(u.id, 'client')
})

export const adminAddClientNote = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  const u = await loadClient(ctx, request.data?.clientId)
  return addNote(request, ctx, u, { scope: 'client', text: request.data?.note })
})

// ---------------------------------------------------------------------------
// Export + bulk actions (safe actions only: no bulk suspend / delete exists)
// ---------------------------------------------------------------------------
const csvCell = (v) => {
  const s = String(v ?? '')
  return /^[=+\-@\t\r]/.test(s) ? `"'${s.replace(/"/g, '""')}"` : /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s // blocks CSV formula injection
}

export const adminExportClients = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.export', fresh: true })
  const scope = scopeFor(ctx, request.data?.market)
  const p = { ...(request.data || {}), market: scope.market }
  const sort = sortOf(ctx, p.sort)
  const [field, direction] = SORT_FIELD[sort]
  const LIMIT = 5000
  let docs
  if (String(p.q || '').trim()) docs = (await searchCandidates(scope, p.q)).docs.filter((u) => matches(ctx, u, p))
  else docs = (await filteredQuery(ctx, scope, p).orderBy(field, direction).limit(LIMIT).get()).docs
  const rows = docs.slice(0, LIMIT).map((u) => toListItem(ctx, u))
  const header = ['Client ID', 'Name', 'Email (masked)', 'Phone (masked)', 'Country', 'City', 'Membership', 'Status', 'Bookings', 'Joined']
  const lines = [header.join(',')].concat(rows.map((r) => [r.id, r.name, r.email, r.phone, r.countryName, r.city, r.membership, r.status, r.bookings, (r.joinedAt || '').slice(0, 10)].map(csvCell).join(',')))
  await recordAuditExport(request, ctx, rows.length, p)
  return lines.join('\n')
})

async function recordAuditExport(request, ctx, rowCount, p) {
  await recordAudit(request, {
    actorId: ctx.uid, action: 'clients.exported', entityId: 'clients', entityType: 'export',
    metadata: { rowCount, market: p.market, filters: { status: p.status, membership: p.membership, city: p.city } },
  })
}

// Bulk actions only touch clients inside the admin's markets; others are skipped, never errors that leak existence.
async function inScopeClients(ctx, ids) {
  const list = [...new Set((Array.isArray(ids) ? ids : []).map(String))].slice(0, 500)
  if (!list.length) throw new HttpsError('invalid-argument', 'Select at least one client.')
  const docs = await Promise.all(list.map((id) => loadClient(ctx, id).catch(() => null)))
  return docs.filter(Boolean)
}

export const adminBulkNotifyClients = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view', fresh: true })
  need(ctx, 'support.respond', 'Your role cannot send notifications.')
  const title = cleanText(request.data?.title, { max: 120, label: 'Title' })
  const message = cleanText(request.data?.message, { max: 500, label: 'Message' })
  const clients = await inScopeClients(ctx, request.data?.clientIds)
  const batch = db().batch()
  for (const u of clients) {
    batch.set(db().collection('notifications').doc(), {
      userId: u.id, title, body: message, type: 'admin_message', channel: 'in_app', status: 'queued',
      countryCode: u.get(F.country) ?? null, createdBy: ctx.uid, read: false, createdAt: FieldValue.serverTimestamp(),
    })
  }
  await batch.commit()
  await recordAuditBulk(request, ctx, 'clients.bulk_notified', clients, { title })
  return { queued: clients.length, skipped: (request.data?.clientIds?.length || 0) - clients.length }
})

export const adminBulkTagClients = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view', fresh: true })
  need(ctx, 'support.respond', 'Your role cannot tag clients.')
  const tag = cleanText(request.data?.tag, { max: 40, label: 'Tag' }).toLowerCase()
  const clients = await inScopeClients(ctx, request.data?.clientIds)
  const batch = db().batch()
  for (const u of clients) batch.update(u.ref, { [F.tags]: FieldValue.arrayUnion(tag) })
  await batch.commit()
  await recordAuditBulk(request, ctx, 'clients.bulk_tagged', clients, { tag })
  return { tagged: clients.length, skipped: (request.data?.clientIds?.length || 0) - clients.length }
})

async function recordAuditBulk(request, ctx, action, clients, extra) {
  await recordAudit(request, { actorId: ctx.uid, action, entityId: 'clients', entityType: 'bulk', metadata: { count: clients.length, clientIds: clients.slice(0, 50).map((u) => u.id), ...extra } })
}

