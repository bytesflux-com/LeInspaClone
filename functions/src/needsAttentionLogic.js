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
}
