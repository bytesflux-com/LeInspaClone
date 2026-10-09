import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { adminAccess, canAccessMarket } from './accessModel.js'
import {
  ALL_MARKETS,
  DISPUTE_OPEN_STATUS,
  SOURCE_LIMIT,
  SUPPORT_OPEN_STATUS,
  VERIFICATION_PENDING_STATUS,
  WITHDRAWAL_ACTION_STATUSES,
  allowedCategories,
  capQueue,
  dedupeItems,
  queueKey,
  resolveMarketScope,
  resolvePriority,
  sortQueueItems,
  summarizeQueue,
} from './needsAttentionLogic.js'

const MARKET_METADATA = {
  ALL: { name: 'All Markets', code: 'ALL' },
  KE: { name: 'Kenya', code: 'KE' },
  UG: { name: 'Uganda', code: 'UG' },
  TZ: { name: 'Tanzania', code: 'TZ' },
  RW: { name: 'Rwanda', code: 'RW' },
  ZA: { name: 'South Africa', code: 'ZA' },
}

function toIso(value) {
  return value instanceof Timestamp ? value.toDate().toISOString() : null
}

function waitingMinutesFrom(value) {
  if (!(value instanceof Timestamp)) return null
  return Math.max(0, Math.floor((Date.now() - value.toMillis()) / 60000))
}

function marketLabel(code) {
  if (!code) return 'Unknown'
  return MARKET_METADATA[code]?.name || code
}

function humanize(value) {
  if (!value) return null
  const text = String(value).replaceAll('_', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function isInScope(countryCode, scope) {
  if (scope.unrestricted) return true
  return Boolean(countryCode) && scope.markets.includes(countryCode)
}

function buildItem({
  sourceType,
  sourceId,
  category,
  title,
  description,
  status,
  countryCode,
  actionableAt,
  actionLabel,
}) {
  const priority = resolvePriority({ category, status })
  return {
    id: queueKey(sourceType, sourceId),
    category,
    title,
    description,
    priority,
    market: marketLabel(countryCode),
    marketCode: countryCode || null,
    status,
    waitingMinutes: waitingMinutesFrom(actionableAt),
    createdAt: toIso(actionableAt),
    assignedTo: null,
    sourceType,
    sourceId,
    actionLabel,
  }
}

async function safeGet(query, label) {
  try {
    return await query.get()
  } catch (err) {
    logger.warn(`Needs-attention query failed (${label}):`, err.message)
    return { docs: [] }
  }
}

function scopedQueries(collection, { statusField, statusValue, statusIn, scope }) {
  const applyStatus = (query) => {
    if (statusField && statusIn?.length) return query.where(statusField, 'in', statusIn)
    if (statusField && statusValue) return query.where(statusField, '==', statusValue)
    return query
  }

  if (scope.unrestricted) {
    return [applyStatus(collection).limit(SOURCE_LIMIT)]
  }

  return scope.markets.map((code) => applyStatus(collection.where('countryCode', '==', code)).limit(SOURCE_LIMIT))
}

async function collectDocs(queries, label) {
  const snaps = await Promise.all(queries.map((query, index) => safeGet(query, `${label}:${index}`)))
  return snaps.flatMap((snap) => snap.docs)
}

async function loadVerificationItems(db, scope) {
  const queries = scopedQueries(db.collection('users'), {
    statusField: 'professionalVerificationStatus',
    statusValue: VERIFICATION_PENDING_STATUS,
    scope,
  })
  const docs = await collectDocs(queries, 'verification')
  return docs
    .filter((doc) => isInScope(doc.get('countryCode') || null, scope))
    .map((doc) => {
      const accountType = doc.get('accountType')
      return buildItem({
        sourceType: 'user_verification',
        sourceId: doc.id,
        category: 'verification',
        title: 'Provider verification',
        description: humanize(accountType) || 'Pending professional verification',
        status: doc.get('professionalVerificationStatus') || VERIFICATION_PENDING_STATUS,
        countryCode: doc.get('countryCode') || null,
        actionableAt: doc.get('createdAt'),
        actionLabel: 'Review',
      })
    })
}

async function loadWithdrawalItems(db, scope) {
  const queries = scopedQueries(db.collection('withdrawal_requests'), {
    statusField: 'status',
    statusIn: WITHDRAWAL_ACTION_STATUSES,
    scope,
  })
  const docs = await collectDocs(queries, 'withdrawals')
  return docs
    .filter((doc) => isInScope(doc.get('countryCode') || null, scope))
    .map((doc) =>
      buildItem({
        sourceType: 'withdrawal_request',
        sourceId: doc.id,
        category: 'finance',
        title: 'Withdrawal request',
        description: humanize(doc.get('status')) || 'Awaiting approval',
        status: doc.get('status'),
        countryCode: doc.get('countryCode') || null,
        actionableAt: doc.get('createdAt'),
        actionLabel: 'Review Withdrawal',
      }),
    )
}

async function loadDisputeItems(db, scope) {
  const queries = scopedQueries(db.collection('disputes'), {
    statusField: 'status',
    statusValue: DISPUTE_OPEN_STATUS,
    scope,
  })
  const docs = await collectDocs(queries, 'disputes')
  return docs
    .filter((doc) => isInScope(doc.get('countryCode') || null, scope))
    .map((doc) =>
      buildItem({
        sourceType: 'dispute',
        sourceId: doc.id,
        category: 'disputes',
        title: `Dispute ${doc.id}`,
        description: 'Open case requiring review',
        status: doc.get('status') || DISPUTE_OPEN_STATUS,
        countryCode: doc.get('countryCode') || null,
        actionableAt: doc.get('createdAt'),
        actionLabel: 'Review Case',
      }),
    )
}

async function loadSupportItems(db, scope) {
  const snap = await safeGet(
    db.collectionGroup('support_tickets').where('status', '==', SUPPORT_OPEN_STATUS).limit(SOURCE_LIMIT),
    'support',
  )
  return snap.docs
    .filter((doc) => {
      const countryCode = doc.get('countryCode') || null
      if (countryCode) return isInScope(countryCode, scope)
      return scope.unrestricted
    })
    .map((doc) =>
      buildItem({
        sourceType: 'support_ticket',
        sourceId: doc.id,
        category: 'support',
        title: 'Support ticket',
        description: 'Open ticket requiring a response',
        status: doc.get('status') || SUPPORT_OPEN_STATUS,
        countryCode: doc.get('countryCode') || null,
        actionableAt: doc.get('createdAt'),
        actionLabel: 'Review',
      }),
    )
}

export const adminGetNeedsAttention = onCall(async (request) => {
  const uid = await requireAdmin(request, { permission: 'dashboard.view' })
  const access = await adminAccess(uid)

  const requestedMarket = String(request.data?.market || ALL_MARKETS).toUpperCase()
  if (requestedMarket !== ALL_MARKETS && !canAccessMarket(access, requestedMarket)) {
    throw new HttpsError('permission-denied', 'You are not authorized for this market.', {
      reason: 'market-denied',
      market: requestedMarket,
    })
  }

  const scope = resolveMarketScope(access, requestedMarket)
  if (scope.error === 'unauthorized') {
    throw new HttpsError('permission-denied', 'You are not authorized for this market.', {
      reason: 'market-denied',
      market: requestedMarket,
    })
  }

  const categories = allowedCategories(access.permissions)
  const db = getFirestore()
  const loaders = []
  if (categories.verification) loaders.push(loadVerificationItems(db, scope))
  if (categories.finance) loaders.push(loadWithdrawalItems(db, scope))
  if (categories.disputes) loaders.push(loadDisputeItems(db, scope))
  if (categories.support) loaders.push(loadSupportItems(db, scope))

  const groups = await Promise.all(loaders)
  const items = capQueue(sortQueueItems(dedupeItems(groups.flat())))
  const summary = summarizeQueue(items)
  const meta = MARKET_METADATA[requestedMarket] || MARKET_METADATA.ALL

  return {
    context: {
      marketId: requestedMarket,
      marketName: meta.name,
      scopedMarkets: scope.unrestricted ? [ALL_MARKETS] : scope.markets,
      generatedAt: new Date().toISOString(),
    },
    summary,
    items,
  }
})
