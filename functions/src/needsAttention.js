import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { FieldPath, FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { adminAccess, canAccessMarket } from './accessModel.js'
import { recordAudit } from './events.js'
import {
  ALL_MARKETS,
  ASSIGNMENT_COLLECTION,
  DISPUTE_OPEN_STATUS,
  SOURCE_LIMIT,
  SUPPORT_OPEN_STATUS,
  VERIFICATION_PENDING_STATUS,
  WITHDRAWAL_ACTION_STATUSES,
  allowedCategories,
  assignmentDocId,
  canAccessItemScope,
  capQueue,
  dedupeItems,
  determineSupportedActions,
  isActionableStatus,
  queueKey,
  resolveMarketScope,
  resolvePriority,
  sortQueueItems,
  startOfLocalDay,
  summarizeQueue,
  validateAssignment,
  validateReviewPermission,
  validateVerificationTransition,
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
  const rawItems = dedupeItems(groups.flat())

  // Attach assignments if any
  if (rawItems.length > 0) {
    try {
      const assignRefs = rawItems.slice(0, 100).map((item) =>
        db.collection(ASSIGNMENT_COLLECTION).doc(assignmentDocId(item.sourceType, item.sourceId))
      )
      const assignDocs = await db.getAll(...assignRefs)
      const assignMap = new Map()
      for (const d of assignDocs) {
        if (d.exists) assignMap.set(d.id, d.data())
      }
      for (const item of rawItems) {
        const dId = assignmentDocId(item.sourceType, item.sourceId)
        if (assignMap.has(dId)) {
          const assignData = assignMap.get(dId)
          item.assignedTo = assignData?.assignedTo || null
          item.assignedAt = toIso(assignData?.assignedAt)
        }
      }
    } catch (err) {
      logger.warn('Failed to load queue assignments:', err.message)
    }
  }

  // Calculate real resolutions recorded today (without fabricating counts)
  let resolvedToday = 0
  try {
    const startOfToday = Timestamp.fromDate(startOfLocalDay())
    let resolvedQuery = db.collection('users').where('professionalVerifiedAt', '>=', startOfToday)
    if (!scope.unrestricted) {
      if (scope.markets.length === 1) {
        resolvedQuery = resolvedQuery.where('countryCode', '==', scope.markets[0])
      } else if (scope.markets.length > 1) {
        resolvedQuery = resolvedQuery.where('countryCode', 'in', scope.markets.slice(0, 10))
      }
    }
    const resolvedSnap = await resolvedQuery.limit(50).get()
    resolvedToday = resolvedSnap.size
  } catch (err) {
    logger.warn('Failed to calculate resolvedToday count:', err.message)
  }

  const items = capQueue(sortQueueItems(rawItems))
  const summary = summarizeQueue(items, { visible: categories, resolvedToday })
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

export const adminGetReviewItem = onCall(async (request) => {
  const uid = await requireAdmin(request, { permission: 'dashboard.view' })
  const access = await adminAccess(uid)

  const { sourceType, sourceId } = request.data || {}
  if (!sourceType || !sourceId) {
    throw new HttpsError('invalid-argument', 'sourceType and sourceId are required.')
  }

  const hasPermission = validateReviewPermission(access.permissions, sourceType, 'view')
  if (!hasPermission) {
    throw new HttpsError('permission-denied', 'You do not have permission to view records in this category.', {
      reason: 'missing-category-permission',
      sourceType,
    })
  }

  const db = getFirestore()

  if (sourceType === 'user_verification') {
    const doc = await db.collection('users').doc(sourceId).get()
    if (!doc.exists) {
      throw new HttpsError('not-found', 'Provider record not found or has been removed.')
    }

    const countryCode = doc.get('countryCode') || null
    if (!canAccessItemScope(access, countryCode)) {
      throw new HttpsError('permission-denied', 'You are not authorized for this market.', {
        reason: 'market-denied',
        market: countryCode,
      })
    }

    const status = doc.get('professionalVerificationStatus') || VERIFICATION_PENDING_STATUS
    const supportedActions = determineSupportedActions({
      sourceType,
      status,
      permissions: access.permissions,
    })

    return {
      sourceType,
      sourceId,
      category: 'verification',
      title: doc.get('displayName') || doc.get('fullName') || 'Provider Verification',
      accountType: doc.get('accountType') || 'Provider',
      status,
      countryCode,
      marketName: marketLabel(countryCode),
      email: doc.get('email') || null,
      phone: doc.get('phone') || doc.get('phoneNumber') || null,
      businessName: doc.get('businessName') || null,
      submittedAt: toIso(doc.get('submittedAt') || doc.get('createdAt')),
      verifiedAt: toIso(doc.get('professionalVerifiedAt')),
      verifiedBy: doc.get('professionalVerifiedBy') || null,
      rejectionReason: doc.get('professionalRejectionReason') || null,
      rejectedAt: toIso(doc.get('professionalRejectedAt')),
      rejectedBy: doc.get('professionalRejectedBy') || null,
      documents: doc.get('verificationDocuments') || doc.get('documents') || [],
      supportedActions,
    }
  }

  if (sourceType === 'withdrawal_request') {
    const doc = await db.collection('withdrawal_requests').doc(sourceId).get()
    if (!doc.exists) {
      throw new HttpsError('not-found', 'Withdrawal request not found.')
    }

    const countryCode = doc.get('countryCode') || null
    if (!canAccessItemScope(access, countryCode)) {
      throw new HttpsError('permission-denied', 'You are not authorized for this market.', {
        reason: 'market-denied',
        market: countryCode,
      })
    }

    return {
      sourceType,
      sourceId,
      category: 'finance',
      title: `Withdrawal ${sourceId}`,
      amount: doc.get('amount') || 0,
      currency: doc.get('currency') || (countryCode === 'KE' ? 'KES' : 'USD'),
      status: doc.get('status') || 'submitted',
      countryCode,
      marketName: marketLabel(countryCode),
      providerId: doc.get('providerId') || doc.get('userId') || null,
      paymentMethod: doc.get('paymentMethod') || doc.get('channel') || 'Mobile Money',
      accountNumber: doc.get('accountNumber') || doc.get('phoneNumber') || null,
      createdAt: toIso(doc.get('createdAt')),
      supportedActions: [],
      unsupportedReason:
        'Automated payout execution rail is not connected in this environment. Direct ledger mutations are restricted to prevent financial discrepancies.',
    }
  }

  if (sourceType === 'dispute') {
    const doc = await db.collection('disputes').doc(sourceId).get()
    if (!doc.exists) {
      throw new HttpsError('not-found', 'Dispute case not found.')
    }

    const countryCode = doc.get('countryCode') || null
    if (!canAccessItemScope(access, countryCode)) {
      throw new HttpsError('permission-denied', 'You are not authorized for this market.', {
        reason: 'market-denied',
        market: countryCode,
      })
    }

    return {
      sourceType,
      sourceId,
      category: 'disputes',
      title: `Dispute ${sourceId}`,
      bookingId: doc.get('bookingId') || null,
      complainantId: doc.get('complainantId') || doc.get('clientId') || null,
      reason: doc.get('reason') || doc.get('disputeReason') || 'Case under investigation',
      status: doc.get('status') || DISPUTE_OPEN_STATUS,
      countryCode,
      marketName: marketLabel(countryCode),
      escrowAmount: doc.get('escrowAmount') || doc.get('amount') || 0,
      createdAt: toIso(doc.get('createdAt')),
      supportedActions: [],
      unsupportedReason:
        'Dispute financial resolution and escrow release require payment gateway integration. Direct modifications are restricted.',
    }
  }

  if (sourceType === 'support_ticket') {
    let doc = await db.collection('support_tickets').doc(sourceId).get()
    if (!doc.exists) {
      const snap = await db.collectionGroup('support_tickets').where(FieldPath.documentId(), '==', sourceId).limit(1).get()
      if (!snap.empty) {
        doc = snap.docs[0]
      }
    }

    if (!doc.exists) {
      throw new HttpsError('not-found', 'Support ticket not found.')
    }

    const countryCode = doc.get('countryCode') || null
    if (!canAccessItemScope(access, countryCode)) {
      throw new HttpsError('permission-denied', 'You are not authorized for this market.', {
        reason: 'market-denied',
        market: countryCode,
      })
    }

    return {
      sourceType,
      sourceId,
      category: 'support',
      title: doc.get('subject') || `Support Ticket ${sourceId}`,
      userId: doc.get('userId') || doc.get('customerId') || null,
      subject: doc.get('subject') || 'Support request',
      status: doc.get('status') || SUPPORT_OPEN_STATUS,
      countryCode,
      marketName: marketLabel(countryCode),
      createdAt: toIso(doc.get('createdAt')),
      messages: doc.get('messages') || [],
      supportedActions: [],
      unsupportedReason: 'Support ticket responses require the concierge messaging service.',
    }
  }

  throw new HttpsError('invalid-argument', `Unsupported sourceType: ${sourceType}`)
})

export const adminProcessReviewAction = onCall(async (request) => {
  const { sourceType, sourceId, action, reason } = request.data || {}
  if (!sourceType || !sourceId || !action) {
    throw new HttpsError('invalid-argument', 'sourceType, sourceId, and action are required.')
  }

  if (sourceType !== 'user_verification') {
    throw new HttpsError('failed-precondition', `Consequential actions on ${sourceType} are not supported.`)
  }

  // Sensitive action requires fresh session + providers.verify permission
  const uid = await requireAdmin(request, { permission: 'providers.verify', fresh: true })
  const access = await adminAccess(uid)

  const db = getFirestore()
  const userRef = db.collection('users').doc(sourceId)

  const result = await db.runTransaction(async (tx) => {
    const userDoc = await tx.get(userRef)
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User record not found or has been removed.')
    }

    const countryCode = userDoc.get('countryCode') || null
    if (!canAccessItemScope(access, countryCode)) {
      throw new HttpsError('permission-denied', 'You are not authorized for this market.', {
        reason: 'market-denied',
        market: countryCode,
      })
    }

    const currentStatus = userDoc.get('professionalVerificationStatus') || VERIFICATION_PENDING_STATUS
    const validation = validateVerificationTransition(currentStatus, action, reason)
    if (!validation.valid) {
      throw new HttpsError('failed-precondition', validation.message, { reason: validation.error })
    }

    const now = FieldValue.serverTimestamp()
    const updates = {
      professionalVerificationStatus: validation.nextStatus,
      updatedAt: now,
    }

    if (action === 'approve') {
      updates.professionalVerifiedAt = now
      updates.professionalVerifiedBy = uid
      updates.professionalRejectionReason = FieldValue.delete()
    } else {
      updates.professionalRejectedAt = now
      updates.professionalRejectedBy = uid
      updates.professionalRejectionReason = reason.trim()
    }

    tx.update(userRef, updates)
    return {
      nextStatus: validation.nextStatus,
      countryCode,
    }
  })

  // Record audit trail
  await recordAudit(request, {
    actorId: uid,
    action: action === 'approve' ? 'provider_verification.approved' : 'provider_verification.rejected',
    entityId: sourceId,
    entityType: 'user',
    metadata: {
      action,
      reason: reason?.trim() || null,
      countryCode: result.countryCode,
      previousStatus: VERIFICATION_PENDING_STATUS,
      newStatus: result.nextStatus,
    },
  })

  return {
    ok: true,
    sourceId,
    sourceType,
    status: result.nextStatus,
    action,
    message:
      action === 'approve'
        ? 'Provider verification approved successfully.'
        : 'Provider verification rejected.',
  }
})

export const adminAssignQueueItem = onCall(async (request) => {
  const uid = await requireAdmin(request, { permission: 'dashboard.view' })
  const caller = await adminAccess(uid)
  caller.uid = uid

  const { sourceType, sourceId, assigneeId } = request.data || {}
  if (!sourceType || !sourceId) {
    throw new HttpsError('invalid-argument', 'sourceType and sourceId are required.')
  }

  const db = getFirestore()
  let countryCode = null
  let isActionable = false

  // Verify source record and retrieve countryCode
  if (sourceType === 'user_verification') {
    const doc = await db.collection('users').doc(sourceId).get()
    if (!doc.exists) throw new HttpsError('not-found', 'Provider record not found.')
    countryCode = doc.get('countryCode') || null
    isActionable = isActionableStatus(sourceType, doc.get('professionalVerificationStatus') || VERIFICATION_PENDING_STATUS)
  } else if (sourceType === 'withdrawal_request') {
    const doc = await db.collection('withdrawal_requests').doc(sourceId).get()
    if (!doc.exists) throw new HttpsError('not-found', 'Withdrawal request not found.')
    countryCode = doc.get('countryCode') || null
    isActionable = isActionableStatus(sourceType, doc.get('status'))
  } else if (sourceType === 'dispute') {
    const doc = await db.collection('disputes').doc(sourceId).get()
    if (!doc.exists) throw new HttpsError('not-found', 'Dispute case not found.')
    countryCode = doc.get('countryCode') || null
    isActionable = isActionableStatus(sourceType, doc.get('status') || DISPUTE_OPEN_STATUS)
  } else if (sourceType === 'support_ticket') {
    let doc = await db.collection('support_tickets').doc(sourceId).get()
    if (!doc.exists) {
      const snap = await db.collectionGroup('support_tickets').where(FieldPath.documentId(), '==', sourceId).limit(1).get()
      if (!snap.empty) doc = snap.docs[0]
    }
    if (!doc?.exists) throw new HttpsError('not-found', 'Support ticket not found.')
    countryCode = doc.get('countryCode') || null
    isActionable = isActionableStatus(sourceType, doc.get('status') || SUPPORT_OPEN_STATUS)
  } else {
    throw new HttpsError('invalid-argument', `Unsupported sourceType: ${sourceType}`)
  }

  if (!isActionable) {
    throw new HttpsError('failed-precondition', 'Cannot assign an item that is no longer actionable.', {
      reason: 'not-actionable',
    })
  }

  // Resolve assignee
  let assignee = null
  if (assigneeId && assigneeId !== 'unassigned') {
    if (assigneeId === uid) {
      assignee = {
        uid,
        email: caller.fullName || uid,
        fullName: caller.fullName || null,
        status: 'ACTIVE',
        permissions: caller.permissions,
        markets: caller.markets,
      }
    } else {
      const pDoc = await db.collection('admin_profiles').doc(assigneeId).get()
      if (!pDoc.exists) {
        throw new HttpsError('not-found', 'Assignee admin profile not found.')
      }
      const pData = pDoc.data()
      const pAccess = await adminAccess(assigneeId)
      assignee = {
        uid: assigneeId,
        email: pData.email || assigneeId,
        fullName: pData.fullName || null,
        status: pData.status || 'ACTIVE',
        permissions: pAccess.permissions,
        markets: pAccess.markets,
      }
    }
  }

  const check = validateAssignment({ caller, assignee, sourceType, countryCode })
  if (!check.valid) {
    throw new HttpsError(
      check.error === 'market-denied' || check.error === 'assignee-market-denied'
        ? 'permission-denied'
        : 'failed-precondition',
      `Assignment validation failed: ${check.error}`,
      { reason: check.error }
    )
  }

  const assignDocRef = db.collection(ASSIGNMENT_COLLECTION).doc(assignmentDocId(sourceType, sourceId))
  const assignedPayload = assignee
    ? {
        uid: assignee.uid,
        name: assignee.fullName || assignee.email,
        email: assignee.email,
      }
    : null

  await assignDocRef.set({
    sourceType,
    sourceId,
    assignedTo: assignedPayload,
    assignedBy: uid,
    assignedAt: FieldValue.serverTimestamp(),
    countryCode,
  })

  // Audit log
  await recordAudit(request, {
    actorId: uid,
    action: assignee ? 'queue_item.assigned' : 'queue_item.unassigned',
    entityId: `${sourceType}:${sourceId}`,
    entityType: 'queue_item',
    metadata: {
      sourceType,
      sourceId,
      assigneeId: assignee?.uid || null,
      countryCode,
    },
  })

  return {
    ok: true,
    sourceType,
    sourceId,
    assignedTo: assignedPayload,
  }
})
