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

// Summary category key for each queue category.
const SUMMARY_KEY = {
  verification: 'verification',
  content: 'content',
  finance: 'finance',
  disputes: 'disputes',
  safety: 'safety',
  support: 'support',
  booking: 'bookingIssues',
}

// The seven ADM-009 categories and whether this repository has a source of
// truth for them. 'connected' = queue + supported decisions, 'read_only' =
// queue + review screen but no decision integration, 'unavailable' = no
// source collection or business rule exists in this codebase.
export const CATEGORY_AVAILABILITY = {
  verification: { state: 'connected' },
  content: {
    state: 'unavailable',
    reason: 'No gallery/media moderation collection or status schema exists in this repository.',
  },
  finance: {
    state: 'read_only',
    reason: 'No payout rail or ledger integration is connected; withdrawals can be reviewed but not approved here.',
  },
  disputes: {
    state: 'read_only',
    reason: 'No escrow-release or refund workflow is connected; disputes can be reviewed but not decided here.',
  },
  safety: {
    state: 'unavailable',
    reason: 'No safety-report collection or safety action model exists in this repository.',
  },
  support: {
    state: 'read_only',
    reason: 'No support messaging integration is connected; replies cannot be sent from the Admin panel.',
  },
  booking: {
    state: 'unavailable',
    reason: 'No booking status is defined as requiring Admin action (bookingStatus values are operational only).',
  },
}

// Counts are null (unknown) when a category is not visible to the admin, has
// no source of truth, or its query failed — never a fabricated 0.
// `resolvedToday` must come from recorded resolution timestamps (or null).
export function summarizeQueue(items, { visible = null, failed = [], resolvedToday = 0 } = {}) {
  const failedSet = new Set(failed)
  const known = (category) => {
    if (failedSet.has(category)) return false
    if (CATEGORY_AVAILABILITY[category]?.state === 'unavailable') return false
    if (visible && !visible[category]) return false
    return true
  }

  const summary = {
    total: items.length,
    critical: 0,
    high: 0,
    normal: 0,
    resolvedToday,
  }
  for (const [category, key] of Object.entries(SUMMARY_KEY)) {
    summary[key] = known(category) ? 0 : null
  }

  for (const item of items) {
    if (item.priority === 'critical') summary.critical += 1
    else if (item.priority === 'high') summary.high += 1
    else summary.normal += 1

    const key = SUMMARY_KEY[item.category]
    if (key && summary[key] !== null) summary[key] += 1
  }

  return summary
}

export function capQueue(items, cap = QUEUE_CAP) {
  return items.slice(0, cap)
}

// ---------------------------------------------------------------------------
// Actionable state — the single definition of "still needs Admin action".
// ---------------------------------------------------------------------------
export function isActionableStatus(sourceType, status) {
  if (sourceType === 'user_verification') return status === VERIFICATION_PENDING_STATUS
  if (sourceType === 'withdrawal_request') return WITHDRAWAL_ACTION_STATUSES.includes(status)
  if (sourceType === 'dispute') return status === DISPUTE_OPEN_STATUS
  if (sourceType === 'support_ticket') return status === SUPPORT_OPEN_STATUS
  return false
}

export const SOURCE_CATEGORY = {
  user_verification: 'verification',
  withdrawal_request: 'finance',
  dispute: 'disputes',
  support_ticket: 'support',
}

// Support tickets may live in a top-level collection or as a subcollection
// (the dashboard reads them with a collection-group query). Nested tickets are
// addressed by their full path; only paths that end in a support_tickets
// document are accepted so this cannot be used to read arbitrary documents.
export function isValidSupportTicketRef(sourceId) {
  if (typeof sourceId !== 'string' || !sourceId || sourceId.length > 700) return false
  if (!sourceId.includes('/')) return !sourceId.includes('..')
  const segments = sourceId.split('/')
  if (segments.length % 2 !== 0) return false
  if (segments.some((s) => !s || s === '.' || s === '..')) return false
  return segments[segments.length - 2] === 'support_tickets'
}

// ---------------------------------------------------------------------------
// Assignment (stored in admin_queue_assignments, never on the source record).
// ---------------------------------------------------------------------------
export const ASSIGNMENT_COLLECTION = 'admin_queue_assignments'

// Permission that authorises acting on (and so assigning others to) a category.
export function actionPermissionFor(sourceType) {
  if (sourceType === 'user_verification') return 'providers.verify'
  if (sourceType === 'withdrawal_request') return 'withdrawals.approve'
  if (sourceType === 'dispute') return 'safety.manage'
  if (sourceType === 'support_ticket') return 'support.respond'
  return null
}

export function assignmentDocId(sourceType, sourceId) {
  // Firestore IDs cannot contain '/', so nested ticket paths are encoded.
  return `${sourceType}:${encodeURIComponent(sourceId)}`
}

// Rules (documented in the handover; product owner may refine):
// - Assign to me: caller can view the category and the item's market.
// - Assign another admin: caller additionally holds the category's action
//   permission or admins.manage.
// - Assignee: ACTIVE admin who can view the category and the item's market.
export function validateAssignment({ caller, assignee, sourceType, countryCode }) {
  if (!validateReviewPermission(caller.permissions, sourceType, 'view')) {
    return { valid: false, error: 'missing-category-permission' }
  }
  if (!canAccessItemScope(caller, countryCode)) return { valid: false, error: 'market-denied' }

  if (assignee === null) return { valid: true } // unassign: same rule as viewing

  const isSelf = assignee.uid === caller.uid
  if (!isSelf) {
    const perms = new Set(caller.permissions || [])
    const actionPermission = actionPermissionFor(sourceType)
    if (!perms.has('admins.manage') && !(actionPermission && perms.has(actionPermission))) {
      return { valid: false, error: 'cannot-assign-others' }
    }
  }
  if (assignee.status !== 'ACTIVE') return { valid: false, error: 'assignee-inactive' }
  if (!validateReviewPermission(assignee.permissions, sourceType, 'view')) {
    return { valid: false, error: 'assignee-missing-permission' }
  }
  if (!canAccessItemScope(assignee, countryCode)) return { valid: false, error: 'assignee-market-denied' }
  return { valid: true }
}

// Start of the current local day as a Date, for "Resolved Today".
// East African Time has no DST, so a fixed offset is exact for KE/UG.
export const RESOLUTION_DAY_UTC_OFFSET_HOURS = 3
export function startOfLocalDay(now = new Date(), offsetHours = RESOLUTION_DAY_UTC_OFFSET_HOURS) {
  const shifted = new Date(now.getTime() + offsetHours * 3600000)
  shifted.setUTCHours(0, 0, 0, 0)
  return new Date(shifted.getTime() - offsetHours * 3600000)
}

export function canAccessItemScope(access, itemCountryCode) {
  const markets = Array.isArray(access?.markets) ? access.markets : []
  if (markets.includes(ALL_MARKETS)) return true
  return Boolean(itemCountryCode) && markets.includes(itemCountryCode)
}

export function validateReviewPermission(permissionList, sourceType, action = 'view') {
  const permissions = new Set(permissionList || [])
  if (sourceType === 'user_verification') {
    if (action === 'view') {
      return permissions.has('providers.view') || permissions.has('providers.verify')
    }
    if (action === 'approve' || action === 'reject') {
      return permissions.has('providers.verify')
    }
  }
  if (sourceType === 'withdrawal_request') {
    if (action === 'view') {
      return permissions.has('payments.view') || permissions.has('withdrawals.approve')
    }
    if (action === 'approve' || action === 'reject') {
      return permissions.has('withdrawals.approve')
    }
  }
  if (sourceType === 'dispute') {
    return permissions.has('safety.manage')
  }
  if (sourceType === 'support_ticket') {
    if (action === 'view') {
      return permissions.has('support.view') || permissions.has('support.respond')
    }
    if (action === 'respond') {
      return permissions.has('support.respond')
    }
  }
  return false
}

export function validateVerificationTransition(currentStatus, action, reason) {
  if (currentStatus !== VERIFICATION_PENDING_STATUS) {
    return {
      valid: false,
      error: 'already-processed',
      message: `Verification is currently '${currentStatus || 'unknown'}'. Only pending records can be reviewed.`,
    }
  }

  if (action !== 'approve' && action !== 'reject') {
    return {
      valid: false,
      error: 'invalid-action',
      message: `Action '${action}' is not supported. Must be 'approve' or 'reject'.`,
    }
  }

  if (action === 'reject') {
    const trimmed = typeof reason === 'string' ? reason.trim() : ''
    if (!trimmed || trimmed.length < 3) {
      return {
        valid: false,
        error: 'missing-reason',
        message: 'A detailed rejection reason (at least 3 characters) is required when rejecting verification.',
      }
    }
  }

  return {
    valid: true,
    nextStatus: action === 'approve' ? 'verified' : 'rejected',
  }
}

export function determineSupportedActions({ sourceType, status, permissions }) {
  const perms = new Set(permissions || [])
  if (sourceType === 'user_verification') {
    if (status === VERIFICATION_PENDING_STATUS && perms.has('providers.verify')) {
      return [
        { id: 'approve', label: 'Approve Verification', variant: 'primary' },
        { id: 'reject', label: 'Reject Verification', variant: 'danger', requiresReason: true },
      ]
    }
    return []
  }

  // Financial, dispute, and support workflows do not have connected execution/rail backends in this repo
  return []
}
