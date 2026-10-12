import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { FieldPath, FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { adminAccess, canAccessMarket } from './accessModel.js'
import { countryCodeOf, loadUsers, providerTypeOf } from './platformData.js'
import { recordAudit } from './events.js'
import {
  ALL_MARKETS,
  ASSIGNMENT_COLLECTION,
  CONTENT_REQUEST_TYPES,
  DISPUTE_OPEN_STATUS,
  SAFETY_OPEN_STATUSES,
  SUPPORT_OPEN_STATUSES,
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

// Dispute parties with their account role so the Admin can open the right profile.
async function disputeParties(db, doc) {
  const ids = [
    ['Raised by', doc.get('complainantId') || doc.get('reporterId') || doc.get('clientId')],
    ['Against', doc.get('againstId') || doc.get('providerId')],
  ].filter(([, id]) => id && !String(id).includes('/'))
  if (!ids.length) return []
  const users = await loadUsers(db, ids.map(([, id]) => id))
  return ids.map(([label, id]) => {
    const u = users.get(id) || {}
    return { label, id, name: u.fullName || u.displayName || null, role: providerTypeOf(u.accountType) ? 'provider' : u.accountType ? 'client' : null }
  })
}

async function safeGet(query, label) {
  try {
    return await query.get()
  } catch (err) {
    logger.warn(`Needs-attention query failed (${label}):`, err.message)
    return { docs: [] }
  }
}

// Mobile-app records carry no countryCode: each source names the users that
// own it, and the item's market is the first owner's resolved country.
const SOURCES = {
  verification: {
    query: (db) => db.collection('users').where('professionalVerificationStatus', '==', VERIFICATION_PENDING_STATUS),
    owners: (d) => [d.id],
    build: (d, countryCode) => buildItem({
      sourceType: 'user_verification',
      sourceId: d.id,
      category: 'verification',
      title: 'Provider verification',
      description: humanize(d.get('accountType')) || 'Pending professional verification',
      status: d.get('professionalVerificationStatus') || VERIFICATION_PENDING_STATUS,
      countryCode,
      actionableAt: d.get('updatedAt') || d.get('createdAt'),
      actionLabel: 'Review',
    }),
  },
  finance: {
    query: (db) => db.collection('withdrawal_requests').where('status', 'in', WITHDRAWAL_ACTION_STATUSES),
    owners: (d) => [d.get('userId'), d.get('providerId')],
    build: (d, countryCode) => buildItem({
      sourceType: 'withdrawal_request',
      sourceId: d.id,
      category: 'finance',
      title: 'Withdrawal request',
      description: humanize(d.get('manualReviewReason') || d.get('status')) || 'Awaiting approval',
      status: d.get('status'),
      countryCode,
      actionableAt: d.get('manualReviewAt') || d.get('createdAt'),
      actionLabel: 'Review Withdrawal',
    }),
  },
  disputes: {
    query: (db) => db.collection('disputes').where('status', '==', DISPUTE_OPEN_STATUS),
    owners: (d) => [d.get('reporterId'), d.get('againstId'), d.get('clientId'), d.get('providerId')],
    build: (d, countryCode) => buildItem({
      sourceType: 'dispute',
      sourceId: d.id,
      category: 'disputes',
      title: `Dispute ${d.id}`,
      description: humanize(d.get('type')) || 'Open case requiring review',
      status: d.get('status') || DISPUTE_OPEN_STATUS,
      countryCode,
      actionableAt: d.get('createdAt'),
      actionLabel: 'Review Case',
    }),
  },
  safety: {
    query: (db) => db.collection('safety_reports').where('status', 'in', SAFETY_OPEN_STATUSES),
    owners: (d) => [d.get('providerId'), d.get('clientId')],
    build: (d, countryCode) => buildItem({
      sourceType: 'safety_report',
      sourceId: d.id,
      category: 'safety',
      title: d.get('issueType') || 'Safety report',
      description: d.get('providerName') ? `Provider: ${d.get('providerName')}` : 'Safety report awaiting review',
      status: d.get('issueType') || d.get('status'),
      countryCode,
      actionableAt: d.get('createdAt'),
      actionLabel: 'Review Report',
    }),
  },
  content: {
    query: (db) => db.collection('verification_requests').where('status', '==', 'pending'),
    filter: (d) => CONTENT_REQUEST_TYPES.includes(String(d.get('requestType') || '')),
    owners: (d) => [d.get('userId')],
    build: (d, countryCode) => buildItem({
      sourceType: 'content_submission',
      sourceId: d.id,
      category: 'content',
      title: humanize(d.get('requestType')) || 'Content submission',
      description: d.get('businessName') || d.get('docType') || 'Awaiting moderation',
      status: 'pending',
      countryCode,
      actionableAt: d.get('submittedAt') || d.get('createdAt'),
      actionLabel: 'Moderate',
    }),
  },
  support: {
    query: (db) => db.collectionGroup('support_tickets').where('status', 'in', SUPPORT_OPEN_STATUSES),
    owners: (d) => [d.get('userId'), d.get('customerId')],
    build: (d, countryCode) => buildItem({
      sourceType: 'support_ticket',
      sourceId: d.id,
      category: 'support',
      title: d.get('subject') || 'Support ticket',
      description: humanize(d.get('category')) || 'Open ticket requiring a response',
      status: String(d.get('status') || SUPPORT_OPEN_STATUS).toLowerCase(),
      countryCode,
      actionableAt: d.get('updatedAt') || d.get('createdAt'),
      actionLabel: 'Review',
    }),
  },
}

const OWNERS = {
  user_verification: (d) => [d.id],
  withdrawal_request: SOURCES.finance.owners,
  dispute: SOURCES.disputes.owners,
  safety_report: SOURCES.safety.owners,
  content_submission: SOURCES.content.owners,
  support_ticket: SOURCES.support.owners,
}

const countryFor = (usersById, uids) => {
  for (const uid of uids) {
    const u = uid && usersById.get(uid)
    const code = u && countryCodeOf(u.countryCode, u.country)
    if (code) return code
  }
  return null
}

// Resolved market of one record (used by the review/assign handlers).
async function recordCountry(db, uids) {
  return countryFor(await loadUsers(db, uids.filter(Boolean)), uids)
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
  const active = Object.entries(SOURCES).filter(([category]) => categories[category])
  const snaps = await Promise.all(active.map(([category, src]) => safeGet(src.query(db).limit(SOURCE_LIMIT * 5), category)))
  const docsBySource = active.map(([, src], i) => [src, snaps[i].docs.filter((d) => !src.filter || src.filter(d))])
  const usersById = await loadUsers(db, docsBySource.flatMap(([src, docs]) => docs.flatMap((d) => src.owners(d))))
  const groups = docsBySource.map(([src, docs]) =>
    docs
      .map((d) => ({ d, countryCode: countryFor(usersById, src.owners(d)) }))
      .filter(({ countryCode }) => isInScope(countryCode, scope))
      .map(({ d, countryCode }) => src.build(d, countryCode)),
  )
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
    const resolvedSnap = await db.collection('users').where('professionalVerifiedAt', '>=', startOfToday).limit(200).get()
    const resolvedInScope = resolvedSnap.docs.filter((d) => isInScope(countryCodeOf(d.get('countryCode'), d.get('country')), scope))
    resolvedToday = resolvedInScope.length
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

    const countryCode = await recordCountry(db, OWNERS[sourceType](doc))
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

    const countryCode = await recordCountry(db, OWNERS[sourceType](doc))
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
      currency: doc.get('currency') || ({ KE: 'KES', UG: 'UGX', TZ: 'TZS', RW: 'RWF', ZA: 'ZAR' }[countryCode] || 'KES'),
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

    const countryCode = await recordCountry(db, OWNERS[sourceType](doc))
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
      complainantId: doc.get('complainantId') || doc.get('reporterId') || doc.get('clientId') || null,
      againstId: doc.get('againstId') || null,
      raisedBy: doc.get('raisedBy') || null,
      reason: doc.get('reason') || doc.get('disputeReason') || doc.get('notes') || humanize(doc.get('type')) || 'Case under investigation',
      status: doc.get('status') || DISPUTE_OPEN_STATUS,
      countryCode,
      marketName: marketLabel(countryCode),
      escrowAmount: doc.get('escrowAmount') || doc.get('amount') || 0,
      createdAt: toIso(doc.get('createdAt')),
      parties: await disputeParties(db, doc),
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

    const countryCode = await recordCountry(db, OWNERS[sourceType](doc))
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

  if (sourceType === 'safety_report') {
    const doc = await db.collection('safety_reports').doc(sourceId).get()
    if (!doc.exists) throw new HttpsError('not-found', 'Safety report not found.')
    const countryCode = await recordCountry(db, OWNERS.safety_report(doc))
    if (!canAccessItemScope(access, countryCode)) {
      throw new HttpsError('permission-denied', 'You are not authorized for this market.', { reason: 'market-denied', market: countryCode })
    }
    return {
      sourceType,
      sourceId,
      category: 'safety',
      title: doc.get('issueType') || 'Safety report',
      status: doc.get('status') || 'pending',
      countryCode,
      marketName: marketLabel(countryCode),
      details: doc.get('details') || null,
      bookingId: doc.get('bookingId') || null,
      providerId: doc.get('providerId') || null,
      providerName: doc.get('providerName') || null,
      clientId: doc.get('clientId') || null,
      clientName: doc.get('clientName') || null,
      createdAt: toIso(doc.get('createdAt')),
      supportedActions: [],
      unsupportedReason: 'Safety reports are investigated in the Safety workflow (ADM-018 / Safety Investigation).',
    }
  }

  if (sourceType === 'content_submission') {
    const doc = await db.collection('verification_requests').doc(sourceId).get()
    if (!doc.exists) throw new HttpsError('not-found', 'Content submission not found.')
    const countryCode = await recordCountry(db, OWNERS.content_submission(doc))
    if (!canAccessItemScope(access, countryCode)) {
      throw new HttpsError('permission-denied', 'You are not authorized for this market.', { reason: 'market-denied', market: countryCode })
    }
    return {
      sourceType,
      sourceId,
      category: 'content',
      title: humanize(doc.get('requestType')) || 'Content submission',
      status: doc.get('status') || 'pending',
      countryCode,
      marketName: marketLabel(countryCode),
      providerId: doc.get('userId') || null,
      businessName: doc.get('businessName') || null,
      submittedAt: toIso(doc.get('submittedAt') || doc.get('createdAt')),
      supportedActions: [],
      unsupportedReason: 'Content decisions are made in Content Approval (ADM-035).',
      link: `/content-approval`,
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

    const countryCode = countryCodeOf(userDoc.get('countryCode'), userDoc.get('country'))
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
    countryCode = await recordCountry(db, OWNERS[sourceType](doc))
    isActionable = isActionableStatus(sourceType, doc.get('professionalVerificationStatus') || VERIFICATION_PENDING_STATUS)
  } else if (sourceType === 'withdrawal_request') {
    const doc = await db.collection('withdrawal_requests').doc(sourceId).get()
    if (!doc.exists) throw new HttpsError('not-found', 'Withdrawal request not found.')
    countryCode = await recordCountry(db, OWNERS[sourceType](doc))
    isActionable = isActionableStatus(sourceType, doc.get('status'))
  } else if (sourceType === 'dispute') {
    const doc = await db.collection('disputes').doc(sourceId).get()
    if (!doc.exists) throw new HttpsError('not-found', 'Dispute case not found.')
    countryCode = await recordCountry(db, OWNERS[sourceType](doc))
    isActionable = isActionableStatus(sourceType, doc.get('status') || DISPUTE_OPEN_STATUS)
  } else if (sourceType === 'support_ticket') {
    let doc = await db.collection('support_tickets').doc(sourceId).get()
    if (!doc.exists) {
      const snap = await db.collectionGroup('support_tickets').where(FieldPath.documentId(), '==', sourceId).limit(1).get()
      if (!snap.empty) doc = snap.docs[0]
    }
    if (!doc?.exists) throw new HttpsError('not-found', 'Support ticket not found.')
    countryCode = await recordCountry(db, OWNERS[sourceType](doc))
    isActionable = isActionableStatus(sourceType, String(doc.get('status') || SUPPORT_OPEN_STATUS).toLowerCase())
  } else if (sourceType === 'safety_report' || sourceType === 'content_submission') {
    const doc = await db.collection(sourceType === 'safety_report' ? 'safety_reports' : 'verification_requests').doc(sourceId).get()
    if (!doc.exists) throw new HttpsError('not-found', 'Record not found.')
    countryCode = await recordCountry(db, OWNERS[sourceType](doc))
    isActionable = ['pending', 'open', 'under_investigation', 'escalated'].includes(String(doc.get('status') || '').toLowerCase())
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
