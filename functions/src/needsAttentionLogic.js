<<<<<<< HEAD
import { ALL_MARKETS, canAccessMarket } from './accessModel.js'

// ---------------------------------------------------------------------------
// ADM-009 — Needs Your Attention: pure logic (no Firestore calls).
//
// Everything here is deterministic so it can be unit-tested
// (functions/test/needsAttentionLogic.test.js). The callable in
// needsAttention.js performs authentication and the Firestore reads.
// ---------------------------------------------------------------------------

// Country codes the backend knows about. Mirrors MARKET_METADATA in
// dashboard.js (ADM-005) and src/constants/markets.js.
export const COUNTRY_CODES = ['KE', 'UG', 'TZ', 'RW', 'ZA']
const KNOWN_REQUEST_CODES = new Set([ALL_MARKETS, ...COUNTRY_CODES])

// Page access: same permission as the navigation entry for /attention and as
// ADM-005 (adminGetDashboardSummary). Every system role has it.
export const PAGE_PERMISSION = 'dashboard.view'

export const PRIORITY_RANK = { critical: 0, high: 1, normal: 2 }

// Category definitions. Only sources whose collection, actionable status and
// market field are already used by the existing backend (dashboard.js) are
// included.
//
// permission  — reuses the permission that gates the matching section in the
//               existing role model (src/constants/navigation.js +
//               src/constants/permissions.js → backend accessModel.js).
// priority    — ADM-005 marks verification, withdrawals and disputes as
//               'high' urgency when present; support has no urgency there.
//               No evidenced rule exists for 'critical', so nothing is critical.
// marketField — field used for country scoping, or null when the market of a
//               record cannot be established from the existing code.
export const CATEGORIES = {
  verification: {
    collection: 'users',
    collectionGroup: false,
    statusField: 'professionalVerificationStatus',
    statuses: ['pending'],
    marketField: 'countryCode',
    permission: 'providers.verify',
    priority: 'high',
    title: 'Provider Verification Pending',
    actionLabel: 'Review',
    actionRoute: '/verifications',
  },
  withdrawal: {
    collection: 'withdrawal_requests',
    collectionGroup: false,
    statusField: 'status',
    // Same list as WITHDRAWAL_ACTION_STATUSES in dashboard.js ("Awaiting
    // Approval"). The withdrawal workflow itself lives in the mobile backend,
    // which is not part of this repository.
    statuses: ['submitted', 'processing', 'manual_review'],
    marketField: 'countryCode',
    permission: 'withdrawals.approve',
    priority: 'high',
    title: 'Withdrawal Request',
    actionLabel: 'Review',
    actionRoute: '/withdrawals',
  },
  dispute: {
    collection: 'disputes',
    collectionGroup: false,
    statusField: 'status',
    statuses: ['open'],
    marketField: 'countryCode',
    // PERMISSIONS.DISPUTES_MANAGE maps to 'safety.manage' in the existing role model.
    permission: 'safety.manage',
    priority: 'high',
    title: 'Open Dispute',
    actionLabel: 'Review',
    actionRoute: '/disputes',
  },
  support: {
    collection: 'support_tickets',
    collectionGroup: true,
    statusField: 'status',
    statuses: ['open'],
    // No market field or relationship is established for support tickets.
    marketField: null,
    permission: 'support.view',
    priority: 'normal',
    title: 'Open Support Ticket',
    actionLabel: 'Review',
    actionRoute: '/support',
  },
}

export const CATEGORY_IDS = Object.keys(CATEGORIES)

export const PER_CATEGORY_LIMIT = 30
export const ITEM_LIMIT = 100

// Error type for market validation, mapped to HttpsError by the callable.
export class MarketScopeError extends Error {
  constructor(code, message, reason) {
    super(message)
    this.code = code
    this.reason = reason
  }
}

// ---------------------------------------------------------------------------
// Market scope. `requestedMarket` is an untrusted UI filter; `access` comes
// from adminAccess(uid) (fresh admin_profiles read).
//
// Returns { requested, global, codes }:
//   codes === null  → unrestricted admin (markets contains 'ALL') viewing ALL
//   codes = [...]   → explicit country codes every query must be limited to
// ---------------------------------------------------------------------------
export function resolveMarketScope(requestedMarket, access) {
  // Missing / empty → ALL, as in adminGetDashboardSummary.
  if (requestedMarket !== undefined && requestedMarket !== null && typeof requestedMarket !== 'string') {
    throw new MarketScopeError('invalid-argument', 'Market must be a market code.', 'invalid-market')
  }
  const requested = (requestedMarket ?? '').trim().toUpperCase() || ALL_MARKETS
  if (!KNOWN_REQUEST_CODES.has(requested)) {
    throw new MarketScopeError('invalid-argument', 'Unknown market.', 'invalid-market')
  }

  const markets = Array.isArray(access?.markets) ? access.markets : []
  const unrestricted = markets.includes(ALL_MARKETS)

  if (requested === ALL_MARKETS) {
    if (unrestricted) return { requested, global: true, codes: null }
    // "All" for a scoped admin means only their authorized, known countries.
    const codes = COUNTRY_CODES.filter((code) => markets.includes(code))
    if (codes.length === 0) {
      throw new MarketScopeError('permission-denied', 'You are not authorized for any market.', 'no-authorized-markets')
    }
    return { requested, global: false, codes }
  }

  if (!canAccessMarket({ markets }, requested)) {
    throw new MarketScopeError('permission-denied', 'You are not authorized to access this market.', 'unauthorized-market')
  }
  return { requested, global: false, codes: [requested] }
}

// ---------------------------------------------------------------------------
// Category plan: which categories this admin may see, and which can be
// queried safely for the resolved market scope.
//   state 'query'      — permitted and safely scoped
//   state 'forbidden'  — admin's role lacks the category permission
//   state 'restricted' — permitted, but records cannot be attributed to a
//                        market, so they are withheld for this scope
// ---------------------------------------------------------------------------
export function planCategories(permissions, scope) {
  const granted = new Set(Array.isArray(permissions) ? permissions : [...(permissions ?? [])])
  return CATEGORY_IDS.map((category) => {
    const def = CATEGORIES[category]
    if (!granted.has(def.permission)) return { category, state: 'forbidden', reason: 'missing-permission' }
    if (!def.marketField && !(scope.global && scope.codes === null)) {
      return { category, state: 'restricted', reason: 'market-attribution-unknown' }
    }
    return { category, state: 'query' }
  })
}

// ---------------------------------------------------------------------------
// Timestamps
// ---------------------------------------------------------------------------

// Firestore Timestamp (duck-typed), Date or null → epoch millis or null.
export function toMillis(value) {
  if (value == null) return null
  let ms = null
  if (typeof value.toMillis === 'function') ms = value.toMillis()
  else if (value instanceof Date) ms = value.getTime()
  return Number.isFinite(ms) ? ms : null
}

// Whole minutes between `sinceMs` and `nowMs`; null when unknown.
// Future timestamps (clock skew) are clamped to 0.
export function waitingMinutes(sinceMs, nowMs) {
  if (!Number.isFinite(sinceMs) || !Number.isFinite(nowMs)) return null
  return Math.max(0, Math.floor((nowMs - sinceMs) / 60000))
}

// ---------------------------------------------------------------------------
// Normalization. Only fields already used by the existing backend are read.
// ---------------------------------------------------------------------------
export function normalizeItem({ category, id, path, data, nowMs }) {
  const def = CATEGORIES[category]
  const d = data ?? {}
  // No actionable-state timestamp is established for any source, so
  // createdAt (record creation) is the only available basis.
  const sinceMs = toMillis(d.createdAt)
  const country = def.marketField ? d[def.marketField] : null
  const marketCode = typeof country === 'string' && COUNTRY_CODES.includes(country) ? country : null

  return {
    id: `${category}:${path ?? id}`,
    sourceType: category,
    sourceId: id,
    sourcePath: path ?? null,
    category,
    priority: def.priority,
    status: typeof d[def.statusField] === 'string' ? d[def.statusField] : null,
    marketCode,
    title: def.title,
    description: category === 'verification' && typeof d.accountType === 'string' ? d.accountType : null,
    waitingSince: sinceMs === null ? null : new Date(sinceMs).toISOString(),
    waitingBasis: sinceMs === null ? null : 'createdAt',
    waitingMinutes: waitingMinutes(sinceMs, nowMs),
    actionLabel: def.actionLabel,
    actionRoute: def.actionRoute,
  }
}

// True when the record is actionable per its category's status list.
export function isActionable(item) {
  return CATEGORIES[item.category]?.statuses.includes(item.status) === true
}

// Defense in depth: a scoped admin never receives a record whose market is
// outside (or unknown to) the resolved scope.
export function isInScope(item, scope) {
  if (scope.codes === null) return true
  return item.marketCode !== null && scope.codes.includes(item.marketCode)
}

// One queue item per source record: sourceType + full document path
// (collection-group ids are only unique within their parent).
export function dedupeItems(items) {
  const seen = new Set()
  return items.filter((item) => {
    const key = `${item.sourceType}:${item.sourcePath ?? item.sourceId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Critical → High → Normal; oldest first within a priority; unknown age last.
export function sortItems(items) {
  return [...items].sort((a, b) => {
    const pr = (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2)
    if (pr !== 0) return pr
    const ta = a.waitingSince ? Date.parse(a.waitingSince) : null
    const tb = b.waitingSince ? Date.parse(b.waitingSince) : null
    if (ta !== tb) {
      if (ta === null) return 1
      if (tb === null) return -1
      return ta - tb
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
}

// ---------------------------------------------------------------------------
// Summary. `results` = one entry per category:
//   { category, state: 'ok'|'error'|'forbidden'|'restricted', reason?, total, items }
// `total` is a full aggregation count (same filters as the item query) or null.
// Priority totals derive from category totals because priority is fixed per
// category. `complete` is false when any permitted, queryable category failed.
// ---------------------------------------------------------------------------
export function buildQueue(results, { itemLimit = ITEM_LIMIT } = {}) {
  const categories = {}
  const priorities = { critical: 0, high: 0, normal: 0 }
  let total = 0
  let complete = true
  const collected = []

  for (const r of results) {
    const def = CATEGORIES[r.category]
    const ok = r.state === 'ok' && Number.isFinite(r.total)
    if (r.state === 'error' || (r.state === 'ok' && !ok)) complete = false
    if (ok) {
      total += r.total
      priorities[def.priority] += r.total
      collected.push(...(r.items ?? []))
    }
    categories[r.category] = {
      permitted: r.state !== 'forbidden',
      state: ok ? 'ok' : r.state === 'ok' ? 'error' : r.state,
      reason: r.reason ?? null,
      total: ok ? r.total : null,
      displayed: 0,
    }
  }

  const items = sortItems(dedupeItems(collected)).slice(0, Math.max(0, itemLimit))
  for (const item of items) categories[item.category].displayed++

  return {
    summary: {
      total,
      complete,
      critical: priorities.critical,
      high: priorities.high,
      normal: priorities.normal,
      displayed: items.length,
      truncated: items.length < total,
    },
    categories,
    items,
  }
=======
export const ALL_MARKETS = 'ALL'

export const PRIORITY_RANK = {
  critical: 0,
  high: 1,
  normal: 2,
}

export const ENABLED_MARKET_CODES = ['KE', 'UG', 'TZ', 'RW', 'ZA']

export const WITHDRAWAL_ACTION_STATUSES = ['submitted', 'processing', 'manual_review']
export const VERIFICATION_PENDING_STATUS = 'pending'
export const DISPUTE_OPEN_STATUS = 'open'
export const SUPPORT_OPEN_STATUS = 'open'

export const QUEUE_CAP = 100
export const SOURCE_LIMIT = 40

export function resolveMarketScope(access, requestedMarket, enabledCodes = ENABLED_MARKET_CODES) {
  const requested = String(requestedMarket || ALL_MARKETS).toUpperCase()
  const assigned = Array.isArray(access?.markets) ? access.markets : []
  const hasAll = assigned.includes(ALL_MARKETS)
  const permitted = hasAll
    ? [...enabledCodes]
    : assigned.filter((code) => code !== ALL_MARKETS && enabledCodes.includes(code))

  if (requested !== ALL_MARKETS) {
    const allowed = hasAll || permitted.includes(requested)
    if (!allowed) return { error: 'unauthorized', requested }
    return { requested, unrestricted: false, markets: [requested] }
  }

  return { requested: ALL_MARKETS, unrestricted: hasAll, markets: permitted }
}

export function allowedCategories(permissionList) {
  const permissions = new Set(permissionList || [])
  const has = (key) => permissions.has(key)
  return {
    verification: has('providers.view') || has('providers.verify'),
    finance: has('payments.view') || has('withdrawals.approve'),
    disputes: has('safety.manage'),
    support: has('support.view'),
  }
}

export function resolvePriority({ category, status }) {
  if (category === 'finance' && status === 'manual_review') return 'high'
  if (category === 'disputes' && status === DISPUTE_OPEN_STATUS) return 'high'
  return 'normal'
}

export function queueKey(sourceType, sourceId) {
  return `${sourceType}:${sourceId}`
}

export function dedupeItems(items) {
  const seen = new Set()
  const unique = []
  for (const item of items) {
    const key = item.id || queueKey(item.sourceType, item.sourceId)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(item)
  }
  return unique
}

export function sortQueueItems(items) {
  return [...items].sort((a, b) => {
    const rankA = PRIORITY_RANK[a.priority] ?? 99
    const rankB = PRIORITY_RANK[b.priority] ?? 99
    if (rankA !== rankB) return rankA - rankB

    const timeA = a.createdAt || null
    const timeB = b.createdAt || null
    if (timeA && timeB) return timeA.localeCompare(timeB)
    if (timeA) return -1
    if (timeB) return 1
    return String(a.id).localeCompare(String(b.id))
  })
}

export function summarizeQueue(items) {
  const summary = {
    total: items.length,
    critical: 0,
    high: 0,
    normal: 0,
    resolvedToday: 0,
    verification: 0,
    content: 0,
    finance: 0,
    disputes: 0,
    safety: 0,
    support: 0,
    bookingIssues: 0,
  }

  for (const item of items) {
    if (item.priority === 'critical') summary.critical += 1
    else if (item.priority === 'high') summary.high += 1
    else summary.normal += 1

    if (item.category === 'verification') summary.verification += 1
    else if (item.category === 'content') summary.content += 1
    else if (item.category === 'finance') summary.finance += 1
    else if (item.category === 'disputes') summary.disputes += 1
    else if (item.category === 'safety') summary.safety += 1
    else if (item.category === 'support') summary.support += 1
    else if (item.category === 'booking') summary.bookingIssues += 1
  }

  return summary
}

export function capQueue(items, cap = QUEUE_CAP) {
  return items.slice(0, cap)
>>>>>>> 34d6fc54f70a52ab6bda0e4055cb0e1c9840e2e7
}
