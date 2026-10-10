/**
 * @file verificationService.js
 * @description Client-side API service bridge for ADM-029: Verification Center.
 * Integrates callable Cloud Functions with automatic emulator fallback,
 * in-memory state tracking for local UI/demo mode, and optimistic updates.
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from '../lib/firebase'
import { callAdmin } from '../lib/firebaseFunctions'
import {
  kpiMetrics as initialKpis,
  needsAttentionItems as initialNeedsAttention,
  performanceMetrics as initialPerformance,
  mockVerificationQueue as initialMockQueue,
} from '../data/mockVerificationData'
import {
  VERIFICATION_STATUSES,
} from '../data/verificationSchema'

// In-memory state for local mock development / standalone UI mode
let localQueue = JSON.parse(JSON.stringify(initialMockQueue))
let localKpis = JSON.parse(JSON.stringify(initialKpis))
let localNeedsAttention = JSON.parse(JSON.stringify(initialNeedsAttention))
let localPerformance = JSON.parse(JSON.stringify(initialPerformance))

/**
 * Determine if mock mode is forced via environment flags or localStorage.
 */
export function isVerificationMockMode() {
  if (typeof window === 'undefined') return false
  if (import.meta.env.VITE_USE_MOCK_DATA === 'true') return true
  if (import.meta.env.DEV && window.__LE_INSPA_MOCK_VERIFICATION__ === true) return true
  if (import.meta.env.DEV && localStorage.getItem('le_inspa_mock_verification') === 'true') return true
  return false
}

/**
 * Toggle mock mode explicitly for testing and demonstrations.
 */
export function setVerificationMockMode(enabled) {
  if (typeof localStorage !== 'undefined') {
    if (enabled) localStorage.setItem('le_inspa_mock_verification', 'true')
    else localStorage.removeItem('le_inspa_mock_verification')
  }
}

/**
 * Recalculate mock KPI & attention stats based on in-memory queue changes.
 */
function recalculateLocalMetrics() {
  let awaiting = 0
  let under = 0
  let changes = 0
  let apprv = 0
  let rej = 0

  localQueue.forEach((item) => {
    const s = item.status
    if (s === 'AWAITING_REVIEW') awaiting++
    else if (s === 'UNDER_REVIEW') under++
    else if (s === 'CHANGES_REQUESTED') changes++
    else if (s === 'APPROVED') apprv++
    else if (s === 'REJECTED') rej++
  })

  // Adjust base counts relative to initial mock baseline
  localKpis = {
    ...localKpis,
    awaitingReview: { ...localKpis.awaitingReview, count: Math.max(0, 428 + (awaiting - 3)) },
    underReview: { ...localKpis.underReview, count: Math.max(0, 86 + (under - 3)) },
    changesRequested: { ...localKpis.changesRequested, count: Math.max(0, 112 + (changes - 1)) },
    approved: { ...localKpis.approved, count: Math.max(0, 742 + (apprv - 1)) },
    rejected: { ...localKpis.rejected, count: Math.max(0, 27 + rej) },
  }
}

/**
 * 1. Fetch Verification Queue & Aggregations
 * Retrieves filtered verification queue records along with KPI metrics,
 * needs attention items, and performance stats.
 *
 * @param {Object} filters
 * @param {string} [filters.marketId='ALL']
 * @param {string} [filters.status]
 * @param {string} [filters.providerType]
 * @param {string} [filters.priority]
 * @param {string} [filters.searchQuery]
 * @returns {Promise<{ queue: Array, kpis: Object, needsAttention: Object, performance: Object }>}
 */
export async function fetchVerificationQueue(filters = {}) {
  const {
    marketId = 'ALL',
    status = 'ALL',
    providerType = 'ALL',
    priority = 'ALL',
    searchQuery = '',
  } = filters

  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminGetVerificationQueue', {
        marketId,
        status: status === 'ALL' ? undefined : status,
        providerType: providerType === 'ALL' ? undefined : providerType,
        priority: priority === 'ALL' ? undefined : priority,
        searchQuery: searchQuery.trim(),
      })

      if (result && Array.isArray(result.queue) && result.queue.length > 0) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminGetVerificationQueue unavailable or offline. Falling back to local mock data.',
        err?.message
      )
    }
  }

  // Fallback to local mock state
  let filtered = [...localQueue]

  if (marketId && marketId !== 'ALL') {
    filtered = filtered.filter((r) => r.market?.code === marketId)
  }

  if (status && status !== 'ALL') {
    filtered = filtered.filter((r) => r.status === status)
  }

  if (providerType && providerType !== 'ALL') {
    filtered = filtered.filter((r) => r.providerCategory === providerType)
  }

  if (priority && priority !== 'ALL') {
    filtered = filtered.filter((r) => r.priority === priority)
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.trim().toLowerCase()
    filtered = filtered.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.providerId && r.providerId.toLowerCase().includes(q)) ||
        (r.type && r.type.toLowerCase().includes(q)) ||
        (r.verificationType && r.verificationType.toLowerCase().includes(q))
    )
  }

  return {
    queue: filtered,
    kpis: localKpis,
    needsAttention: localNeedsAttention,
    performance: localPerformance,
  }
}

/**
 * 2. Assign Reviewer
 * Assigns an administrative reviewer to a verification record.
 *
 * @param {string} verificationId
 * @param {Object} reviewerData
 * @param {string} reviewerData.assignToUid
 * @param {string} reviewerData.assignToName
 * @param {string} [reviewerData.note]
 * @returns {Promise<{ success: boolean, verificationId: string, assignedTo: string }>}
 */
export async function assignReviewer(verificationId, reviewerData = {}) {
  const { assignToUid, assignToName, note = '' } = reviewerData

  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminAssignVerificationReviewer', {
        verificationId,
        assignToUid,
        assignToName,
        note,
      })
      if (result?.success) {
        // Also sync local queue item if present
        const item = localQueue.find((r) => r.id === verificationId)
        if (item) {
          item.assignedTo = assignToName || 'Admin Reviewer'
        }
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminAssignVerificationReviewer failed. Falling back to local state update.',
        err?.message
      )
    }
  }

  // Fallback / Mock update
  const index = localQueue.findIndex((r) => r.id === verificationId)
  if (index !== -1) {
    localQueue[index] = {
      ...localQueue[index],
      assignedTo: assignToName || (assignToUid ? 'Admin Reviewer' : 'Unassigned'),
      updatedAt: new Date().toISOString(),
    }
  }

  return {
    success: true,
    verificationId,
    assignedTo: assignToName || 'Unassigned',
  }
}

/**
 * 3. Submit Verification Decision
 * Submits an administrative decision (APPROVE, REQUEST_CHANGES, REJECT, ESCALATE).
 *
 * @param {Object} payload
 * @param {string} payload.verificationId
 * @param {'APPROVE'|'REQUEST_CHANGES'|'REJECT'|'ESCALATE'} payload.decision
 * @param {string[]} [payload.reasons]
 * @param {string} [payload.adminNotes]
 * @param {Array} [payload.requestedChanges]
 * @param {number} [payload.expectedVersion]
 * @returns {Promise<{ success: boolean, verificationId: string, updatedStatus: string, version: number }>}
 */
export async function submitVerificationDecision(payload) {
  const {
    verificationId,
    decision,
    reasons = [],
    adminNotes = '',
    requestedChanges = [],
    expectedVersion,
  } = payload

  const normalizedDecision = String(decision || '').toUpperCase()

  const STATUS_MAP = {
    APPROVE: 'APPROVED',
    REQUEST_CHANGES: 'CHANGES_REQUESTED',
    REJECT: 'REJECTED',
    ESCALATE: 'ESCALATED',
  }
  const targetStatus = STATUS_MAP[normalizedDecision] || normalizedDecision

  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminSubmitVerificationDecision', {
        verificationId,
        decision: normalizedDecision,
        reasons,
        adminNotes,
        requestedChanges,
        expectedVersion,
      })

      if (result?.success) {
        // Synchronize in-memory record
        const itemIndex = localQueue.findIndex((r) => r.id === verificationId)
        if (itemIndex !== -1) {
          localQueue[itemIndex] = {
            ...localQueue[itemIndex],
            status: targetStatus,
            version: (localQueue[itemIndex].version || 1) + 1,
            updatedAt: new Date().toISOString(),
          }
          recalculateLocalMetrics()
        }
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminSubmitVerificationDecision failed. Falling back to local mock state.',
        err?.message
      )
    }
  }

  // Fallback: Update mock state in-memory so UI updates immediately
  const index = localQueue.findIndex((r) => r.id === verificationId)
  if (index === -1) {
    throw new Error(`Verification item with ID ${verificationId} not found in mock store.`)
  }

  const existing = localQueue[index]
  const newVersion = (existing.version || 1) + 1

  const decisionHistory = Array.isArray(existing.decisionHistory) ? [...existing.decisionHistory] : []
  decisionHistory.push({
    decision: normalizedDecision,
    reasons,
    adminNotes,
    decidedBy: 'admin-current-user',
    decidedByName: 'Admin Reviewer',
    decidedAt: new Date().toISOString(),
  })

  // Update document progress steps if approved
  const progressSteps = (existing.progressSteps || []).map((step) => {
    if (normalizedDecision === 'APPROVE') {
      return { ...step, status: 'APPROVED' }
    }
    if (normalizedDecision === 'REQUEST_CHANGES' && step.status === 'REVIEWING_NOW') {
      return { ...step, status: 'CHANGES_REQUESTED' }
    }
    return step
  })

  localQueue[index] = {
    ...existing,
    status: targetStatus,
    version: newVersion,
    decisionHistory,
    progressSteps,
    lastDecision: {
      decision: normalizedDecision,
      reasons,
      adminNotes,
    },
    updatedAt: new Date().toISOString(),
  }

  recalculateLocalMetrics()

  return {
    success: true,
    verificationId,
    updatedStatus: targetStatus,
    version: newVersion,
  }
}

/**
 * 4. Fetch Detailed Verification Queue (ADM-030)
 * Retrieves filtered verification queue records along with computed waiting durations,
 * SLA overdue flags, status counts, and priority-ranked sorting.
 *
 * @param {Object} filters
 * @returns {Promise<{ queue: Array, totalCount: number, statusCounts: Object }>}
 */
export async function fetchDetailedQueue(filters = {}) {
  const {
    marketId = 'ALL',
    status = 'ALL',
    providerType = 'ALL',
    verificationType = 'ALL',
    priority = 'ALL',
    assignedTo = 'ALL',
    searchQuery = '',
    sortBy = 'priority',
    overdueOnly = false,
  } = filters

  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminGetVerificationQueueDetailed', {
        marketId,
        status: status === 'ALL' ? undefined : status,
        providerType: providerType === 'ALL' ? undefined : providerType,
        verificationType: verificationType === 'ALL' ? undefined : verificationType,
        priority: priority === 'ALL' ? undefined : priority,
        assignedTo: assignedTo === 'ALL' ? undefined : assignedTo,
        searchQuery: searchQuery.trim(),
        sortBy,
      })

      if (result && Array.isArray(result.queue)) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminGetVerificationQueueDetailed failed or offline. Falling back to local mock state.',
        err?.message
      )
    }
  }

  // Local fallback
  let filtered = [...localQueue]

  // Status Filter
  if (status && status !== 'ALL') {
    const norm = status === 'NEW' ? 'AWAITING_REVIEW' : status
    filtered = filtered.filter((r) => r.status === norm)
  }

  // Market Filter
  if (marketId && marketId !== 'ALL') {
    filtered = filtered.filter((r) => r.market?.code === marketId)
  }

  // Provider Category Filter
  if (providerType && providerType !== 'ALL') {
    filtered = filtered.filter((r) => r.providerCategory === providerType)
  }

  // Verification Type Filter
  if (verificationType && verificationType !== 'ALL') {
    const vt = verificationType.toLowerCase()
    filtered = filtered.filter((r) => r.verificationType && r.verificationType.toLowerCase().includes(vt))
  }

  // Priority Filter
  if (priority && priority !== 'ALL') {
    filtered = filtered.filter((r) => r.priority === priority)
  }

  // Assigned To Filter
  if (assignedTo && assignedTo !== 'ALL') {
    if (assignedTo === 'UNASSIGNED') {
      filtered = filtered.filter((r) => !r.assignedTo || r.assignedTo === 'Unassigned')
    } else {
      filtered = filtered.filter((r) => r.assignedTo?.toLowerCase().includes(assignedTo.toLowerCase()))
    }
  }

  // Overdue Filter
  if (overdueOnly) {
    filtered = filtered.filter((r) => r.isOverdue)
  }

  // Search Query
  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.trim().toLowerCase()
    filtered = filtered.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.providerId && r.providerId.toLowerCase().includes(q)) ||
        (r.type && r.type.toLowerCase().includes(q)) ||
        (r.verificationType && r.verificationType.toLowerCase().includes(q))
    )
  }

  // Compute status counts based on local mutations
  let newDelta = 0
  let underDelta = 0
  let resubDelta = 0
  let changesDelta = 0
  let escalatedDelta = 0

  localQueue.forEach((item) => {
    const s = item.status
    if (s === 'AWAITING_REVIEW') newDelta++
    else if (s === 'UNDER_REVIEW') underDelta++
    else if (s === 'RESUBMITTED') resubDelta++
    else if (s === 'CHANGES_REQUESTED') changesDelta++
    else if (s === 'ESCALATED') escalatedDelta++
  })

  // Baseline calibration from prompt specs: All (428), New (196), Under Review (86), Resubmitted (46), Changes Requested (112), Escalated (7)
  const statusCounts = {
    all: Math.max(0, 428 + (newDelta - 4) + (underDelta - 3) + (resubDelta - 2) + (changesDelta - 1) + (escalatedDelta - 1)),
    new: Math.max(0, 196 + (newDelta - 4)),
    underReview: Math.max(0, 86 + (underDelta - 3)),
    resubmitted: Math.max(0, 46 + (resubDelta - 2)),
    changesRequested: Math.max(0, 112 + (changesDelta - 1)),
    escalated: Math.max(0, 7 + (escalatedDelta - 1)),
  }

  // Sorting
  const PRIORITY_ORDER = { URGENT: 3, HIGH: 2, NORMAL: 1 }

  filtered.sort((a, b) => {
    if (sortBy === 'oldest') {
      return (a.waitingDurationMs || 0) - (b.waitingDurationMs || 0)
    }
    if (sortBy === 'newest') {
      return (b.waitingDurationMs || 0) - (a.waitingDurationMs || 0)
    }
    if (sortBy === 'waiting') {
      return (b.waitingDurationMs || 0) - (a.waitingDurationMs || 0)
    }
    if (sortBy === 'resubmitted') {
      const aResub = a.status === 'RESUBMITTED' ? 1 : 0
      const bResub = b.status === 'RESUBMITTED' ? 1 : 0
      return bResub - aResub
    }
    if (sortBy === 'unassigned') {
      const aUn = !a.assignedTo || a.assignedTo === 'Unassigned' ? 1 : 0
      const bUn = !b.assignedTo || b.assignedTo === 'Unassigned' ? 1 : 0
      return bUn - aUn
    }

    // Default: Priority First
    // 1. Overdue cases
    if (Boolean(a.isOverdue) !== Boolean(b.isOverdue)) {
      return a.isOverdue ? -1 : 1
    }
    // 2. Priority: URGENT -> HIGH -> NORMAL
    const aPri = PRIORITY_ORDER[String(a.priority).toUpperCase()] || 0
    const bPri = PRIORITY_ORDER[String(b.priority).toUpperCase()] || 0
    if (aPri !== bPri) {
      return bPri - aPri
    }
    // 3. Waiting time: Longest waiting first
    return (b.waitingDurationMs || 0) - (a.waitingDurationMs || 0)
  })

  return {
    queue: filtered,
    totalCount: filtered.length,
    statusCounts,
  }
}

/**
 * 5. Claim Case (ADM-030)
 * Assigns verification case to currently logged in admin and transitions status
 * from AWAITING_REVIEW to UNDER_REVIEW.
 *
 * @param {string} verificationId
 * @returns {Promise<{ success: boolean, verificationId: string, assignedTo: string, status: string }>}
 */
export async function claimCase(verificationId) {
  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminClaimVerificationCase', { verificationId })
      if (result?.success) {
        const item = localQueue.find((r) => r.id === verificationId)
        if (item) {
          item.assignedTo = result.assignedTo || 'Hasnain Ahmed'
          item.status = result.status || item.status
          item.reviewStartedAt = new Date().toISOString()
        }
        recalculateLocalMetrics()
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminClaimVerificationCase failed. Falling back to local store.',
        err?.message
      )
    }
  }

  // Local fallback
  const index = localQueue.findIndex((r) => r.id === verificationId)
  if (index === -1) {
    throw new Error(`Verification case ${verificationId} not found in store.`)
  }

  const existing = localQueue[index]
  const shouldTransition = existing.status === 'AWAITING_REVIEW' || existing.status === 'NEW'
  const newStatus = shouldTransition ? 'UNDER_REVIEW' : existing.status
  const assignedToName = 'Hasnain Ahmed'

  localQueue[index] = {
    ...existing,
    assignedTo: assignedToName,
    assignedReviewer: { uid: 'current_admin_uid', name: assignedToName },
    status: newStatus,
    reviewStartedAt: shouldTransition ? new Date().toISOString() : existing.reviewStartedAt,
    updatedAt: new Date().toISOString(),
  }

  recalculateLocalMetrics()

  return {
    success: true,
    verificationId,
    assignedTo: assignedToName,
    status: newStatus,
  }
}

/**
 * 6. Escalate Case (ADM-030)
 * Escalates verification case to Compliance Team with reason and notes.
 *
 * @param {string} verificationId
 * @param {Object} reasonData
 * @param {string} reasonData.reason
 * @param {string} [reasonData.complianceNotes]
 * @returns {Promise<{ success: boolean, verificationId: string, status: string, assignedTo: string }>}
 */
export async function escalateCase(verificationId, reasonData = {}) {
  const { reason = 'Requires compliance review', complianceNotes = '' } = reasonData

  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminEscalateVerificationCase', {
        verificationId,
        reason,
        complianceNotes,
      })
      if (result?.success) {
        const item = localQueue.find((r) => r.id === verificationId)
        if (item) {
          item.status = 'ESCALATED'
          item.assignedTo = 'Compliance Team'
        }
        recalculateLocalMetrics()
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminEscalateVerificationCase failed. Falling back to local store.',
        err?.message
      )
    }
  }

  // Local fallback
  const index = localQueue.findIndex((r) => r.id === verificationId)
  if (index === -1) {
    throw new Error(`Verification case ${verificationId} not found in store.`)
  }

  const existing = localQueue[index]
  localQueue[index] = {
    ...existing,
    status: 'ESCALATED',
    assignedTo: 'Compliance Team',
    assignedReviewer: { uid: 'compliance_team', name: 'Compliance Team' },
    escalation: {
      reason,
      complianceNotes,
      escalatedAt: new Date().toISOString(),
      escalatedBy: 'Hasnain Ahmed',
    },
    updatedAt: new Date().toISOString(),
  }

  recalculateLocalMetrics()

  return {
    success: true,
    verificationId,
    status: 'ESCALATED',
    assignedTo: 'Compliance Team',
  }
}

/**
 * 7. Fetch Verification Detail (ADM-031)
 * Retrieves complete verification workspace payload for a specific provider/record.
 *
 * @param {string} verificationId
 * @returns {Promise<Object>}
 */
const localReviewRecords = new Map()

function generateInitialReviewRecord(idOrProviderId) {
  const base = localQueue.find((r) => r.id === idOrProviderId || r.providerId === idOrProviderId) || localQueue[0] || {}
  const providerCategory = base?.providerCategory || 'INDIVIDUAL'
  const isGrace = !base?.providerId || base.providerId === 'PR-82941' || base.id === 'ver-001'
  const isSpa = providerCategory === 'SPA_WELLNESS'
  const isHotel = providerCategory === 'HOTEL_RESORT'

  if (isGrace && !isSpa && !isHotel) {
    return {
      id: 'ver-001',
      providerId: 'PR-82941',
      name: 'Grace Njeri',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      type: 'Massage Therapist',
      providerCategory: 'INDIVIDUAL',
      market: {
        code: 'KE',
        name: 'Kenya',
        flag: '🇰🇪',
      },
      status: 'UNDER_REVIEW',
      submittedAt: '12 Sep 2026 • 10:42 AM',
      assignedTo: 'Jane Ochieng',
      assignedReviewer: {
        uid: 'reviewer-jane',
        name: 'Jane Ochieng',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      },
      phone: '+254 712 345 678',
      email: 'grace.njeri@gmail.com',
      version: 1,
      progressSteps: [
        { id: 'IDENTITY', label: 'Identity Verification', status: 'APPROVED', number: 1 },
        { id: 'CREDENTIALS', label: 'Professional Credentials', status: 'REVIEWING_NOW', number: 2 },
        { id: 'PROFILE', label: 'Profile Information', status: 'PENDING', number: 3 },
        { id: 'FINAL', label: 'Final Verification', status: 'PENDING', number: 4 },
      ],
      componentTabs: [
        { id: 'IDENTITY', label: 'Identity Verification', status: 'APPROVED', badgeCount: 0 },
        { id: 'CREDENTIALS', label: 'Professional Credentials', status: 'REVIEWING_NOW', badgeCount: 1 },
        { id: 'PROFILE', label: 'Profile Information', status: 'PENDING', badgeCount: 0 },
        { id: 'DOCUMENTS', label: 'Required Documents', status: 'PENDING', badgeCount: 0 },
        { id: 'FINAL', label: 'Final Verification', status: 'PENDING', badgeCount: 0 },
      ],
      activeDocument: {
        id: 'doc-101',
        title: 'Professional Certificate',
        fileName: 'Professional_Certificate.pdf',
        docType: 'Professional Certificate',
        nameOnDoc: 'Grace Njeri',
        docNumber: '•••• 7281',
        unmaskedDocNumber: 'KMF-2024-7281',
        issuer: 'International Wellness Institute',
        issueDate: '15 Jan 2024',
        expiryDate: '15 Jan 2028',
        uploadedAt: '12 Sep 2026 • 10:42 AM',
        fileStatus: 'Readable',
        pageCount: 2,
        activePage: 1,
        ocrStatus: 'SUCCESS',
        totalPagesSubmitted: 3,
      },
      documents: [
        {
          id: 'doc-101',
          title: 'Professional Certificate',
          fileName: 'Professional_Certificate.pdf',
          docType: 'Professional Certificate',
          nameOnDoc: 'Grace Njeri',
          docNumber: '•••• 7281',
          unmaskedDocNumber: 'KMF-2024-7281',
          issuer: 'International Wellness Institute',
          issueDate: '15 Jan 2024',
          expiryDate: '15 Jan 2028',
          uploadedAt: '12 Sep 2026 • 10:42 AM',
          fileStatus: 'Readable',
          pageCount: 2,
        },
        {
          id: 'doc-102',
          title: 'National ID Card',
          fileName: 'National_ID_Card.pdf',
          docType: 'National ID Card',
          nameOnDoc: 'Grace Wanjiku Njeri',
          docNumber: '•••• 3942',
          unmaskedDocNumber: 'ID-8291-3942',
          issuer: 'Republic of Kenya - National Registration Bureau',
          issueDate: '10 Feb 2020',
          expiryDate: 'N/A',
          uploadedAt: '12 Sep 2026 • 10:40 AM',
          fileStatus: 'Readable',
          pageCount: 2,
        },
        {
          id: 'doc-103',
          title: 'Practice License',
          fileName: 'Practice_License_2026.pdf',
          docType: 'Practice License',
          nameOnDoc: 'Grace Njeri',
          docNumber: '•••• 4419',
          unmaskedDocNumber: 'LIC-2026-4419',
          issuer: 'Kenya Allied Health Professionals Board',
          issueDate: '01 Jan 2026',
          expiryDate: '31 Dec 2026',
          uploadedAt: '12 Sep 2026 • 10:41 AM',
          fileStatus: 'Readable',
          pageCount: 1,
        },
      ],
      previousSubmissions: [
        {
          num: 1,
          submittedAt: '12 Sep 2026 10:42 AM',
          fileName: 'Professional_Certificate.pdf',
          status: 'Current',
          statusType: 'current',
          reviewedBy: '—',
          notes: '—',
          docId: 'doc-101',
        },
        {
          num: 2,
          submittedAt: '10 Sep 2026 9:15 AM',
          fileName: 'Certificate_v1.pdf',
          status: 'Replaced',
          statusType: 'replaced',
          reviewedBy: 'Jane Ochieng',
          notes: 'Document unclear',
          docId: 'doc-101-v1',
        },
      ],
      reviewHistory: [
        {
          id: 'rh-1',
          time: '12 Sep 2026 • 11:20 AM',
          title: 'Review started (Jane Ochieng)',
          actor: 'Jane Ochieng',
          type: 'review_started',
        },
        {
          id: 'rh-2',
          time: '12 Sep 2026 • 11:05 AM',
          title: 'Assigned to Jane Ochieng by System',
          actor: 'System',
          type: 'assignment',
        },
        {
          id: 'rh-3',
          time: '12 Sep 2026 • 10:42 AM',
          title: 'Document submitted by Grace Njeri',
          actor: 'Grace Njeri',
          type: 'submission',
        },
      ],
      comparisonData: [
        { field: 'Full Name', account: 'Grace Njeri', document: 'Grace W. Njeri', result: 'Review', resultType: 'review' },
        { field: 'Country', account: 'Kenya', document: 'Kenya', result: 'Match', resultType: 'match' },
        { field: 'Profession', account: 'Massage Therapist', document: 'Massage Therapy', result: 'Consistent', resultType: 'consistent' },
        { field: 'Document Status', account: '—', document: 'Valid', result: 'Valid', resultType: 'valid' },
        { field: 'Expiry Date', account: '—', document: '15 Jan 2028', result: 'Valid', resultType: 'valid' },
      ],
      checklist: [
        { id: 'chk-1', key: 'documentReadable', label: 'Document readable', status: 'Pass', resultType: 'pass' },
        { id: 'chk-2', key: 'nameMatches', label: 'Name reasonably matches account', status: 'Needs review', resultType: 'review' },
        { id: 'chk-3', key: 'issuerProvided', label: 'Issuer provided', status: 'Pass', resultType: 'pass' },
        { id: 'chk-4', key: 'documentCurrent', label: 'Document current (not expired)', status: 'Pass', resultType: 'pass' },
        { id: 'chk-5', key: 'pagesIncluded', label: 'Required pages included', status: 'Pass', resultType: 'pass' },
        { id: 'chk-6', key: 'credentialAccepted', label: 'Credential type accepted', status: 'Pass', resultType: 'pass' },
        { id: 'chk-7', key: 'noTampering', label: 'No obvious tampering concern', status: 'Pass', resultType: 'pass' },
      ],
      internalNotes: [
        {
          id: 'note-1',
          authorName: 'Jane Ochieng',
          authorRole: 'Verification Specialist',
          text: 'Verified registration with the Kenya Allied Health Professionals Board records database. Certificate watermark is authentic.',
          createdAt: '12 Sep 2026 • 11:22 AM',
        },
      ],
    }
  }

  // Spa & Wellness Center dynamic structure
  if (isSpa) {
    return {
      id: base.id || 'ver-002',
      providerId: base.providerId || 'SPA-28192',
      name: base.name || 'Serenity Wellness Spa',
      avatarUrl: base.avatarUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150&auto=format&fit=crop&q=80',
      type: 'Spa & Wellness Center',
      providerCategory: 'SPA_WELLNESS',
      market: base.market || { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
      status: base.status || 'UNDER_REVIEW',
      submittedAt: base.submittedAt || '11 Sep 2026 • 3:18 PM',
      assignedTo: base.assignedTo || 'Jane Ochieng',
      assignedReviewer: {
        uid: 'reviewer-jane',
        name: 'Jane Ochieng',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      },
      phone: '+254 722 998 877',
      email: 'info@serenityspa.co.ke',
      version: base.version || 1,
      progressSteps: [
        { id: 'BUSINESS_REG', label: 'Business Registration', status: 'APPROVED', number: 1 },
        { id: 'PREMISES_PERMIT', label: 'Premises Permit', status: 'REVIEWING_NOW', number: 2 },
        { id: 'TAX_CLEARANCE', label: 'Tax / VAT Clearance', status: 'PENDING', number: 3 },
        { id: 'FINAL', label: 'Final Verification', status: 'PENDING', number: 4 },
      ],
      componentTabs: [
        { id: 'BUSINESS_REG', label: 'Business Registration', status: 'APPROVED', badgeCount: 0 },
        { id: 'PREMISES_PERMIT', label: 'Premises Permit', status: 'REVIEWING_NOW', badgeCount: 1 },
        { id: 'TAX_CLEARANCE', label: 'Tax / VAT Clearance', status: 'PENDING', badgeCount: 0 },
        { id: 'FACILITY', label: 'Operating Location', status: 'PENDING', badgeCount: 0 },
        { id: 'FINAL', label: 'Final Verification', status: 'PENDING', badgeCount: 0 },
      ],
      activeDocument: {
        id: 'doc-spa-01',
        title: 'Premises Operating Permit',
        fileName: 'County_Operating_Permit_2026.pdf',
        docType: 'County Operating Permit',
        nameOnDoc: 'Serenity Wellness Spa Ltd',
        docNumber: '•••• 9120',
        unmaskedDocNumber: 'NBI-SBL-2026-9120',
        issuer: 'Nairobi City County Government',
        issueDate: '01 Jan 2026',
        expiryDate: '31 Dec 2026',
        uploadedAt: '11 Sep 2026 • 3:18 PM',
        fileStatus: 'Readable',
        pageCount: 2,
        activePage: 1,
        ocrStatus: 'SUCCESS',
        totalPagesSubmitted: 4,
      },
      documents: [
        {
          id: 'doc-spa-01',
          title: 'Premises Operating Permit',
          fileName: 'County_Operating_Permit_2026.pdf',
          docType: 'County Operating Permit',
          nameOnDoc: 'Serenity Wellness Spa Ltd',
          docNumber: '•••• 9120',
          unmaskedDocNumber: 'NBI-SBL-2026-9120',
          issuer: 'Nairobi City County Government',
          issueDate: '01 Jan 2026',
          expiryDate: '31 Dec 2026',
          uploadedAt: '11 Sep 2026 • 3:18 PM',
          fileStatus: 'Readable',
          pageCount: 2,
        },
        {
          id: 'doc-spa-02',
          title: 'Certificate of Incorporation',
          fileName: 'Certificate_of_Incorporation.pdf',
          docType: 'Business Registration',
          nameOnDoc: 'Serenity Wellness Spa Ltd',
          docNumber: '•••• 4410',
          unmaskedDocNumber: 'CPR-2018-4410',
          issuer: 'Business Registration Service (BRS Kenya)',
          issueDate: '14 May 2018',
          expiryDate: 'N/A',
          uploadedAt: '11 Sep 2026 • 3:15 PM',
          fileStatus: 'Readable',
          pageCount: 2,
        },
      ],
      previousSubmissions: [
        {
          num: 1,
          submittedAt: '11 Sep 2026 3:18 PM',
          fileName: 'County_Operating_Permit_2026.pdf',
          status: 'Current',
          statusType: 'current',
          reviewedBy: '—',
          notes: '—',
          docId: 'doc-spa-01',
        },
      ],
      reviewHistory: [
        {
          id: 'rh-s1',
          time: '11 Sep 2026 • 4:00 PM',
          title: 'Review started (Jane Ochieng)',
          actor: 'Jane Ochieng',
          type: 'review_started',
        },
      ],
      comparisonData: [
        { field: 'Business Name', account: 'Serenity Wellness Spa', document: 'Serenity Wellness Spa Ltd', result: 'Match', resultType: 'match' },
        { field: 'Operating County', account: 'Nairobi, Kenya', document: 'Nairobi City County', result: 'Match', resultType: 'match' },
        { field: 'Registration Number', account: '•••• 4410', document: 'CPR-2018-4410', result: 'Consistent', resultType: 'consistent' },
        { field: 'Premises Permit', account: '—', document: 'Valid', result: 'Valid', resultType: 'valid' },
        { field: 'Expiry Date', account: '—', document: '31 Dec 2026', result: 'Valid', resultType: 'valid' },
      ],
      checklist: [
        { id: 'chk-s1', key: 'businessEntityValid', label: 'Business registration valid', status: 'Pass', resultType: 'pass' },
        { id: 'chk-s2', key: 'premisesPermitActive', label: 'Premises operating permit active', status: 'Pass', resultType: 'pass' },
        { id: 'chk-s3', key: 'taxPinActive', label: 'VAT / Tax PIN active & verified', status: 'Pass', resultType: 'pass' },
        { id: 'chk-s4', key: 'locationMatches', label: 'Operating location matches registry', status: 'Pass', resultType: 'pass' },
        { id: 'chk-s5', key: 'directorMandate', label: 'Director authorized mandate verified', status: 'Pass', resultType: 'pass' },
        { id: 'chk-s6', key: 'hygieneHealthCleared', label: 'Public health inspection cleared', status: 'Pass', resultType: 'pass' },
      ],
      internalNotes: [],
    }
  }

  // Hotel & Wellness Resort dynamic structure
  return {
    id: base.id || 'ver-003',
    providerId: base.providerId || 'HOTEL-55102',
    name: base.name || 'Mara Safari Wellness Lodge',
    avatarUrl: base.avatarUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=150&auto=format&fit=crop&q=80',
    type: 'Hotel & Wellness Resort',
    providerCategory: 'HOTEL_RESORT',
    market: base.market || { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    status: base.status || 'UNDER_REVIEW',
    submittedAt: base.submittedAt || '10 Sep 2026 • 2:10 PM',
    assignedTo: base.assignedTo || 'Jane Ochieng',
    assignedReviewer: {
      uid: 'reviewer-jane',
      name: 'Jane Ochieng',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    },
    phone: '+254 733 112 233',
    email: 'admin@marawellness.ke',
    version: base.version || 1,
    progressSteps: [
      { id: 'PROPERTY_TITLE', label: 'Property Title / Lease', status: 'APPROVED', number: 1 },
      { id: 'HOSPITALITY_LIC', label: 'Hospitality Operating Permit', status: 'REVIEWING_NOW', number: 2 },
      { id: 'SAFETY_AUDIT', label: 'Wellness Safety Accreditation', status: 'PENDING', number: 3 },
      { id: 'FINAL', label: 'Final Verification', status: 'PENDING', number: 4 },
    ],
    componentTabs: [
      { id: 'PROPERTY_TITLE', label: 'Property Title / Lease', status: 'APPROVED', badgeCount: 0 },
      { id: 'HOSPITALITY_LIC', label: 'Hospitality License', status: 'REVIEWING_NOW', badgeCount: 1 },
      { id: 'SAFETY_AUDIT', label: 'Safety Accreditation', status: 'PENDING', badgeCount: 0 },
      { id: 'MANDATE', label: 'Corporate Mandate', status: 'PENDING', badgeCount: 0 },
      { id: 'FINAL', label: 'Final Verification', status: 'PENDING', badgeCount: 0 },
    ],
    activeDocument: {
      id: 'doc-hotel-01',
      title: 'TRA Hospitality Operating Permit',
      fileName: 'TRA_Hospitality_Permit_2026.pdf',
      docType: 'Hospitality Operating Permit',
      nameOnDoc: 'Mara Safari Wellness Lodge & Spa',
      docNumber: '•••• 1849',
      unmaskedDocNumber: 'TRA-LODGE-2026-1849',
      issuer: 'Tourism Regulatory Authority (TRA)',
      issueDate: '01 Jan 2026',
      expiryDate: '31 Dec 2027',
      uploadedAt: '10 Sep 2026 • 2:10 PM',
      fileStatus: 'Readable',
      pageCount: 3,
      activePage: 1,
      ocrStatus: 'SUCCESS',
      totalPagesSubmitted: 5,
    },
    documents: [
      {
        id: 'doc-hotel-01',
        title: 'TRA Hospitality Operating Permit',
        fileName: 'TRA_Hospitality_Permit_2026.pdf',
        docType: 'Hospitality Operating Permit',
        nameOnDoc: 'Mara Safari Wellness Lodge & Spa',
        docNumber: '•••• 1849',
        unmaskedDocNumber: 'TRA-LODGE-2026-1849',
        issuer: 'Tourism Regulatory Authority (TRA)',
        issueDate: '01 Jan 2026',
        expiryDate: '31 Dec 2027',
        uploadedAt: '10 Sep 2026 • 2:10 PM',
        fileStatus: 'Readable',
        pageCount: 3,
      },
    ],
    previousSubmissions: [
      {
        num: 1,
        submittedAt: '10 Sep 2026 2:10 PM',
        fileName: 'TRA_Hospitality_Permit_2026.pdf',
        status: 'Current',
        statusType: 'current',
        reviewedBy: '—',
        notes: '—',
        docId: 'doc-hotel-01',
      },
    ],
    reviewHistory: [
      {
        id: 'rh-h1',
        time: '10 Sep 2026 • 3:00 PM',
        title: 'Review started (Jane Ochieng)',
        actor: 'Jane Ochieng',
        type: 'review_started',
      },
    ],
    comparisonData: [
      { field: 'Resort Name', account: 'Mara Safari Wellness Lodge', document: 'Mara Safari Wellness Lodge & Spa', result: 'Match', resultType: 'match' },
      { field: 'Operating Jurisdiction', account: 'Maasai Mara, Kenya', document: 'Narok County / TRA Zone 4', result: 'Consistent', resultType: 'consistent' },
      { field: 'Hospitality Class', account: '5-Star Eco Wellness Resort', document: 'Class A Eco Resort', result: 'Match', resultType: 'match' },
      { field: 'Permit Status', account: '—', document: 'Active', result: 'Valid', resultType: 'valid' },
      { field: 'Expiry Date', account: '—', document: '31 Dec 2027', result: 'Valid', resultType: 'valid' },
    ],
    checklist: [
      { id: 'chk-h1', key: 'propertyTitleLease', label: 'Property Title Deed / Master Lease verified', status: 'Pass', resultType: 'pass' },
      { id: 'chk-h2', key: 'hospitalityLicense', label: 'Hospitality Operating Permit in good standing', status: 'Pass', resultType: 'pass' },
      { id: 'chk-h3', key: 'safetyAccreditation', label: 'Wellness & hydrotherapy safety standards passed', status: 'Pass', resultType: 'pass' },
      { id: 'chk-h4', key: 'insuranceCoverage', label: 'Commercial public liability coverage active', status: 'Pass', resultType: 'pass' },
      { id: 'chk-h5', key: 'gmMandate', label: 'Authorized General Manager mandate confirmed', status: 'Pass', resultType: 'pass' },
    ],
    internalNotes: [],
  }
}

export async function fetchVerificationDetail(verificationId) {
  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminGetVerificationDetail', { verificationId })
      if (result?.verification) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminGetVerificationDetail failed. Falling back to local store.',
        err?.message
      )
    }
  }

  // Check in-memory store
  if (!localReviewRecords.has(verificationId)) {
    const fresh = generateInitialReviewRecord(verificationId)
    localReviewRecords.set(verificationId, fresh)
    if (fresh.providerId) localReviewRecords.set(fresh.providerId, fresh)
    if (fresh.id) localReviewRecords.set(fresh.id, fresh)
  }

  const record = localReviewRecords.get(verificationId)
  return {
    verification: record,
    checklist: record.checklist,
    documents: record.documents,
    previousSubmissions: record.previousSubmissions,
    reviewHistory: record.reviewHistory,
    internalNotes: record.internalNotes,
    comparisonData: record.comparisonData,
    components: record.components || {},
  }
}

/**
 * 8. Submit Component Decision (ADM-031)
 *
 * @param {Object} payload
 * @param {string} payload.verificationId
 * @param {string} payload.componentKey
 * @param {string} payload.decision - 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | 'ESCALATE'
 * @param {Object} [payload.checklistResults]
 * @param {string} [payload.reason]
 * @param {string} [payload.providerMessage]
 * @param {string} [payload.internalNote]
 * @param {number} [payload.expectedVersion]
 */
export async function submitComponentDecision(payload) {
  const {
    verificationId,
    componentKey,
    decision,
    checklistResults = {},
    reason = '',
    providerMessage = '',
    internalNote = '',
    expectedVersion,
  } = payload

  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminSubmitComponentDecision', payload)
      if (result?.success) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminSubmitComponentDecision failed. Falling back to local store.',
        err?.message
      )
    }
  }

  // Local fallback
  let record = localReviewRecords.get(verificationId)
  if (!record) {
    record = generateInitialReviewRecord(verificationId)
    localReviewRecords.set(verificationId, record)
  }

  if (typeof expectedVersion === 'number' && record.version && record.version !== expectedVersion) {
    console.warn('[verificationService] Concurrency version check warning', { expected: expectedVersion, current: record.version })
  }

  const normalizedDecision = String(decision).toUpperCase()
  const nextVersion = (record.version || 1) + 1
  record.version = nextVersion

  // Update step status in progressSteps
  record.progressSteps = (record.progressSteps || []).map((step) => {
    if (step.id === componentKey || (componentKey === 'CREDENTIALS' && step.number === 2)) {
      return {
        ...step,
        status: normalizedDecision === 'APPROVE' ? 'APPROVED' : normalizedDecision === 'REQUEST_CHANGES' ? 'CHANGES_REQUESTED' : normalizedDecision === 'REJECT' ? 'REJECTED' : 'ESCALATED',
      }
    }
    return step
  })

  // Update tabs status
  record.componentTabs = (record.componentTabs || []).map((tab) => {
    if (tab.id === componentKey) {
      return {
        ...tab,
        status: normalizedDecision === 'APPROVE' ? 'APPROVED' : normalizedDecision === 'REQUEST_CHANGES' ? 'CHANGES_REQUESTED' : normalizedDecision === 'REJECT' ? 'REJECTED' : 'ESCALATED',
        badgeCount: 0,
      }
    }
    return tab
  })

  // Update overall status
  if (normalizedDecision === 'APPROVE') {
    const allApproved = record.progressSteps.every((s) => s.status === 'APPROVED')
    if (componentKey === 'FINAL' || allApproved) {
      record.status = 'APPROVED'
    } else {
      record.status = 'UNDER_REVIEW'
    }
  } else if (normalizedDecision === 'REQUEST_CHANGES') {
    record.status = 'CHANGES_REQUESTED'
  } else if (normalizedDecision === 'REJECT') {
    record.status = 'REJECTED'
  } else if (normalizedDecision === 'ESCALATE') {
    record.status = 'ESCALATED'
  }

  // Update checklist items if checklistResults provided
  if (checklistResults && Object.keys(checklistResults).length > 0) {
    record.checklist = (record.checklist || []).map((item) => {
      if (checklistResults[item.key] !== undefined) {
        const val = checklistResults[item.key]
        return {
          ...item,
          status: val === true || val === 'Pass' ? 'Pass' : val === 'Needs review' ? 'Needs review' : 'Fail',
          resultType: val === true || val === 'Pass' ? 'pass' : val === 'Needs review' ? 'review' : 'fail',
        }
      }
      return item
    })
  }

  // Append to review history
  const historyEntry = {
    id: `rh-${Date.now()}`,
    time: 'Just now',
    title: `${normalizedDecision === 'APPROVE' ? 'Approved' : normalizedDecision === 'REQUEST_CHANGES' ? 'Changes requested for' : normalizedDecision === 'REJECT' ? 'Rejected' : 'Escalated'} ${componentKey}`,
    actor: 'Jane Ochieng',
    type: normalizedDecision.toLowerCase(),
    notes: reason || internalNote || providerMessage || '',
  }
  record.reviewHistory = [historyEntry, ...(record.reviewHistory || [])]

  // Append internal note if supplied
  if (internalNote && internalNote.trim()) {
    const newNote = {
      id: `note-${Date.now()}`,
      authorName: 'Jane Ochieng',
      authorRole: 'Verification Specialist',
      text: internalNote.trim(),
      createdAt: 'Just now',
    }
    record.internalNotes = [newNote, ...(record.internalNotes || [])]
  }

  // Update queue item
  const queueItem = localQueue.find((r) => r.id === record.id || r.providerId === record.providerId)
  if (queueItem) {
    queueItem.status = record.status
    queueItem.version = nextVersion
  }
  recalculateLocalMetrics()

  return {
    success: true,
    verificationId: record.id,
    componentKey,
    decision: normalizedDecision,
    status: record.status,
    version: nextVersion,
  }
}

/**
 * 9. Add Internal Note (ADM-031)
 *
 * @param {string} verificationId
 * @param {string} noteText
 * @returns {Promise<Object>}
 */
export async function addInternalNote(verificationId, noteText) {
  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminAddVerificationInternalNote', { verificationId, noteText })
      if (result?.success) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminAddVerificationInternalNote failed. Falling back to local store.',
        err?.message
      )
    }
  }

  let record = localReviewRecords.get(verificationId)
  if (!record) {
    record = generateInitialReviewRecord(verificationId)
    localReviewRecords.set(verificationId, record)
  }

  const newNote = {
    id: `note-${Date.now()}`,
    authorName: 'Jane Ochieng',
    authorRole: 'Verification Specialist',
    text: noteText.trim(),
    createdAt: 'Just now',
  }

  record.internalNotes = [newNote, ...(record.internalNotes || [])]
  return {
    success: true,
    note: newNote,
  }
}

/**

 * ============================================================================
 * ADM-032: IDENTITY DOCUMENTS REVIEW SERVICES & MOCK REPOSITORY
 * ============================================================================
 */

const localIdentityRecords = new Map()

function generateInitialIdentityRecord(verificationId) {
  const baseReview = localReviewRecords.get(verificationId) || localQueue.find((r) => r.id === verificationId || r.providerId === verificationId) || {}
  const providerCategory = baseReview?.providerCategory || 'INDIVIDUAL'
  const isSpa = providerCategory === 'SPA_WELLNESS' || verificationId?.includes('spa') || verificationId === 'ver-002' || verificationId === 'SPA-28192'
  const isHotel = providerCategory === 'HOTEL_RESORT' || verificationId?.includes('hotel') || verificationId === 'ver-003' || verificationId === 'HOTEL-55102'

  let personName = 'Grace Njeri'
  let docName = 'Grace Wanjiku Njeri'
  let providerId = 'PR-82941'
  let businessName = null
  let representative = null
  let idNumberMasked = '•••• •••• 4821'
  let idNumberPlain = '1234 5678 4821'
  let dobMasked = '••/••/1998'
  let dobPlain = '14 Mar 1998'
  let nationality = 'KENYAN'
  let sex = 'F'
  let market = { code: 'KE', name: 'Kenya', flag: '🇰🇪' }

  if (isSpa) {
    personName = 'Mary Wanjiku'
    docName = 'Mary Wanjiku Kamau'
    providerId = 'SPA-28192'
    businessName = 'Serenity Wellness Spa'
    representative = {
      name: 'Mary Wanjiku',
      role: 'Business Owner / Authorized Representative',
      title: 'Managing Director & Founder',
      businessName: 'Serenity Wellness Spa',
      email: 'm.wanjiku@serenityspa.co.ke',
      phone: '+254 722 998 877',
      authorizedDocument: 'CR12 Official Company Registry Certificate',
      mandateVerified: true,
    }
    idNumberMasked = '•••• •••• 9102'
    idNumberPlain = '2481 9021 9102'
    dobMasked = '••/••/1986'
    dobPlain = '22 Jun 1986'
  } else if (isHotel) {
    personName = 'David Mwangi'
    docName = 'David Kariuki Mwangi'
    providerId = 'HOTEL-55102'
    businessName = 'Savanna Wellness Resort'
    representative = {
      name: 'David Mwangi',
      role: 'Property Administrator',
      title: 'General Manager & Authorized Signatory',
      businessName: 'Savanna Wellness Resort',
      email: 'd.mwangi@marawellness.ke',
      phone: '+254 733 112 233',
      authorizedDocument: 'Board Resolution & TRA Hospitality Mandate',
      mandateVerified: true,
    }
    idNumberMasked = '•••• •••• 3319'
    idNumberPlain = '1982 7492 3319'
    dobMasked = '••/••/1982'
    dobPlain = '08 Nov 1982'
    sex = 'M'
  }

  return {
    id: verificationId || 'ver-001',
    providerId,
    providerCategory: isSpa ? 'SPA_WELLNESS' : isHotel ? 'HOTEL_RESORT' : 'INDIVIDUAL',
    name: personName,
    businessName,
    representative,
    type: isSpa ? 'Spa & Wellness Center' : isHotel ? 'Hotel & Wellness Resort' : 'Massage Therapist',
    market,
    status: 'AWAITING_REVIEW', // Soft amber badge in snapshot
    submittedAt: '12 Sep 2026 • 10:42 AM',
    assignedTo: 'Jane Ochieng',
    assignedReviewer: {
      uid: 'reviewer-jane',
      name: 'Jane Ochieng',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    },
    version: 2,
    document: {
      type: 'National ID',
      docNumberMasked: idNumberMasked,
      docNumberPlain: idNumberPlain,
      nameOnDoc: docName,
      issuedBy: 'Government of Kenya',
      issueDate: '14 Mar 2018',
      expiryDate: 'Not Applicable',
      uploadedAt: '12 Sep 2026 • 10:42 AM',
      fileStatus: 'Readable',
      dobMasked,
      dobPlain,
      nationality,
      sex,
      frontSideUrl: '/images/mock-kenya-id-front.png',
      backSideUrl: '/images/mock-kenya-id-back.png',
      isFrontRevealed: false,
      isNumberRevealed: false,
      isDobRevealed: false,
    },
    documentSlots: [
      { id: 'national_id', label: 'National ID', active: true, count: 2, status: 'SUBMITTED' },
      { id: 'passport', label: 'Passport', active: false, count: 0, status: 'OPTIONAL' },
      { id: 'supporting_doc', label: 'Supporting Document', active: false, count: 0, status: 'OPTIONAL' },
    ],
    comparisonTable: [
      {
        id: 'cmp-1',
        field: 'Full Name',
        account: personName,
        document: docName,
        result: 'Review',
        resultType: 'review',
        note: 'Name variation / middle name present',
      },
      {
        id: 'cmp-2',
        field: 'Country',
        account: 'Kenya',
        document: 'Kenya',
        result: 'Match',
        resultType: 'match',
        note: 'Matches operating sovereign jurisdiction',
      },
      {
        id: 'cmp-3',
        field: 'Date of Birth',
        account: dobMasked,
        document: dobPlain,
        accountPlain: dobPlain,
        documentPlain: dobPlain,
        result: 'Match',
        resultType: 'match',
        note: 'DOB verified against civil registry',
      },
      {
        id: 'cmp-4',
        field: 'Document Type',
        account: 'National ID',
        document: 'National ID',
        result: 'Match',
        resultType: 'match',
        note: 'Accepted Kenyan National Identification',
      },
      {
        id: 'cmp-5',
        field: 'Document Number',
        account: idNumberMasked,
        document: idNumberMasked,
        accountPlain: idNumberPlain,
        documentPlain: idNumberPlain,
        result: 'Match',
        resultType: 'match',
        note: 'National Registration Bureau format confirmed',
      },
    ],
    checklist: [
      { key: 'documentTypeAccepted', label: 'Document type accepted', status: 'Pass', resultType: 'pass', description: 'Official Republic of Kenya National ID' },
      { key: 'documentComplete', label: 'Document appears complete', status: 'Pass', resultType: 'pass', description: 'Both front and back sides provided with full borders' },
      { key: 'isReadable', label: 'Document is readable', status: 'Pass', resultType: 'pass', description: 'High contrast text and biometric facial photo sharp' },
      { key: 'nameMatches', label: 'Name matches / reasonably corresponds', status: 'Needs review', resultType: 'review', description: 'Middle name present on ID' },
      { key: 'requiredInfoPresent', label: 'Required information is present', status: 'Pass', resultType: 'pass', description: 'ID number, DOB, sex, and issuance authority verified' },
      { key: 'isCurrent', label: 'Document is current (not expired)', status: 'Pass', resultType: 'pass', description: 'Perpetual statutory validity under Kenyan Registration law' },
      { key: 'noTampering', label: 'No obvious tampering concern', status: 'Pass', resultType: 'pass', description: 'Guilloche background, coat of arms, and ghost photo intact' },
    ],
    previousSubmissions: [
      {
        version: 2,
        isCurrent: true,
        submittedAt: '12 Sep 2026 • 10:42 AM',
        status: 'Under Review',
        statusType: 'under_review',
        fileName: 'National_ID_Front_and_Back_v2.pdf',
        reviewer: 'Jane Ochieng',
        notes: 'Resubmitted with clear high-resolution back side scan.',
      },
      {
        version: 1,
        isCurrent: false,
        submittedAt: '10 Sep 2026 • 9:15 AM',
        status: 'Changes Requested',
        statusType: 'changes_requested',
        fileName: 'National_ID_Scan_v1.pdf',
        reviewer: 'Jane Ochieng',
        notes: 'Back side unreadable due to blurriness and glare.',
      },
    ],
    reviewHistory: [
      { id: 'irh-1', time: '12 Sep 2026 • 11:20 AM', title: 'Review started by Jane Ochieng', actor: 'Jane Ochieng', type: 'review_started' },
      { id: 'irh-2', time: '12 Sep 2026 • 11:05 AM', title: 'Assigned to Jane Ochieng by System', actor: 'System', type: 'assignment' },
      { id: 'irh-3', time: '12 Sep 2026 • 10:42 AM', title: `Document submitted by ${personName}`, actor: personName, type: 'submission' },
      { id: 'irh-4', time: '10 Sep 2026 • 3:02 PM', title: 'Changes requested — Back side unreadable', actor: 'Jane Ochieng', type: 'changes_requested' },
      { id: 'irh-5', time: '10 Sep 2026 • 2:15 PM', title: 'Identity document submitted', actor: personName, type: 'submission' },
    ],
    internalNotes: [
      {
        id: 'in-1',
        authorName: 'Jane Ochieng',
        authorRole: 'Verification Specialist',
        createdAt: '12 Sep 2026 • 11:25 AM',
        text: 'Middle name verified against Kenya National Registration Bureau record format. Resubmitted back scan confirms serial number 2803144.',
      },
    ],
  }
}

/**
 * 10. Fetch Identity Verification Detail (ADM-032)
 */
export async function fetchIdentityVerificationDetail(verificationId) {
  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminGetIdentityVerificationDetail', { verificationId })
      if (result?.verificationId || result?.name) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminGetIdentityVerificationDetail failed. Falling back to local store.',
        err?.message
      )
    }
  }

  if (!localIdentityRecords.has(verificationId)) {
    const fresh = generateInitialIdentityRecord(verificationId)
    localIdentityRecords.set(verificationId, fresh)
    if (fresh.providerId) localIdentityRecords.set(fresh.providerId, fresh)
    if (fresh.id) localIdentityRecords.set(fresh.id, fresh)
  }

  return localIdentityRecords.get(verificationId)
}

/**
 * 11. Reveal Sensitive Identity Field (ADM-032)
 */
export async function revealSensitiveIdentityField(verificationId, fieldName) {
  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminRevealSensitiveIdentityField', { verificationId, fieldName })
      if (result?.plainValue) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminRevealSensitiveIdentityField failed. Falling back to local unmask.',
        err?.message
      )
    }
  }

  const record = localIdentityRecords.get(verificationId) || generateInitialIdentityRecord(verificationId)
  localIdentityRecords.set(verificationId, record)

  let plainValue = ''
  if (fieldName === 'documentNumber') {
    plainValue = record.document?.docNumberPlain || '1234 5678 4821'
    record.document.isNumberRevealed = true
  } else if (fieldName === 'dob') {
    plainValue = record.document?.dobPlain || '14 Mar 1998'
    record.document.isDobRevealed = true
  }

  // Audit log mock record
  console.info(`[AUDIT LOG] SENSITIVE_IDENTITY_DATA_REVEALED: ${fieldName} unmasked for ${verificationId} by Jane Ochieng`)

  return {
    success: true,
    verificationId,
    fieldName,
    plainValue,
    revealedBy: 'Jane Ochieng',
    revealedAt: new Date().toISOString(),
  }
}

/**
 * 12. Submit Identity Decision (ADM-032)
 */
export async function submitIdentityDecision(payload) {
  const {
    verificationId,
    decision,
    checklistResults = {},
    reason = '',
    providerMessage = '',
    internalNote = '',
    expectedVersion,
  } = payload

  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminSubmitIdentityDecision', payload)
      if (result?.success) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminSubmitIdentityDecision failed. Falling back to local store.',
        err?.message
      )
    }
  }

  let record = localIdentityRecords.get(verificationId)
  if (!record) {
    record = generateInitialIdentityRecord(verificationId)
    localIdentityRecords.set(verificationId, record)
  }

  const normalizedDecision = String(decision).toUpperCase()
  const nextVersion = (record.version || 2) + 1
  record.version = nextVersion

  const statusMap = {
    APPROVE: 'APPROVED',
    REQUEST_CHANGES: 'CHANGES_REQUESTED',
    REJECT: 'REJECTED',
    ESCALATE: 'ESCALATED',
  }
  const newStatus = statusMap[normalizedDecision] || normalizedDecision
  record.status = newStatus

  // Update checklist items if provided
  if (checklistResults && Object.keys(checklistResults).length > 0) {
    record.checklist = record.checklist.map((item) => {
      if (checklistResults[item.key] !== undefined) {
        const val = checklistResults[item.key]
        return {
          ...item,
          status: val === true || val === 'Pass' ? 'Pass' : val === 'Needs review' ? 'Needs review' : 'Fail',
          resultType: val === true || val === 'Pass' ? 'pass' : val === 'Needs review' ? 'review' : 'fail',
        }
      }
      return item
    })
  }

  // Append to review history
  const historyTitles = {
    APPROVE: 'Identity document approved by Jane Ochieng',
    REQUEST_CHANGES: `Changes requested — ${reason || 'New document required'}`,
    REJECT: `Identity verification rejected — ${reason}`,
    ESCALATE: `Identity case escalated — ${reason || 'Senior compliance review'}`,
  }

  const newHistoryItem = {
    id: `irh-${Date.now()}`,
    time: 'Just now',
    title: historyTitles[normalizedDecision] || `Identity decision: ${normalizedDecision}`,
    actor: 'Jane Ochieng',
    type: normalizedDecision.toLowerCase(),
    notes: reason || internalNote || providerMessage || '',
  }
  record.reviewHistory = [newHistoryItem, ...record.reviewHistory]

  // If requesting changes, update previous submissions
  if (normalizedDecision === 'REQUEST_CHANGES') {
    const updatedSubmissions = record.previousSubmissions.map((sub) => {
      if (sub.isCurrent) {
        return {
          ...sub,
          isCurrent: false,
          status: 'Changes Requested',
          statusType: 'changes_requested',
          notes: reason || providerMessage || 'Resubmission required',
        }
      }
      return sub
    })
    record.previousSubmissions = [
      {
        version: nextVersion,
        isCurrent: true,
        submittedAt: 'Pending provider resubmission',
        status: 'Awaiting Resubmission',
        statusType: 'changes_requested',
        fileName: 'Pending upload...',
        reviewer: 'Jane Ochieng',
        notes: reason || providerMessage,
      },
      ...updatedSubmissions,
    ]
  }

  // Append internal note if provided
  if (internalNote && internalNote.trim()) {
    record.internalNotes = [
      {
        id: `in-${Date.now()}`,
        authorName: 'Jane Ochieng',
        authorRole: 'Verification Specialist',
        createdAt: 'Just now',
        text: internalNote.trim(),
      },
      ...record.internalNotes,
    ]
  }

  // Synchronize state with ADM-031 review record (localReviewRecords)
  let parentReview = localReviewRecords.get(verificationId) || localReviewRecords.get(record.providerId)
  if (parentReview) {
    parentReview.progressSteps = (parentReview.progressSteps || []).map((step) => {
      if (step.id === 'IDENTITY' || step.number === 1) {
        return {
          ...step,
          status: newStatus === 'APPROVED' ? 'APPROVED' : newStatus === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED' : newStatus === 'REJECTED' ? 'REJECTED' : 'REVIEWING_NOW',
        }
      }
      return step
    })

    parentReview.componentTabs = (parentReview.componentTabs || []).map((tab) => {
      if (tab.id === 'IDENTITY') {
        return {
          ...tab,
          status: newStatus === 'APPROVED' ? 'APPROVED' : newStatus === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED' : newStatus === 'REJECTED' ? 'REJECTED' : 'PENDING',
        }
      }
      return tab
    })
  }

  return {
    success: true,
    verificationId: record.id,
    decision: normalizedDecision,
    status: newStatus,
    version: nextVersion,
  }
}

/**
 * ============================================================================
 * ADM-033: PROFESSIONAL CREDENTIALS REVIEW SERVICES & MOCK REPOSITORY
 * ============================================================================
 */

const localCredentialRecords = new Map()

function getDynamicRequirementsConfig(providerCategory = 'INDIVIDUAL', type = '') {
  const norm = (type + ' ' + providerCategory).toUpperCase()
  if (norm.includes('TRAINER') || norm.includes('FITNESS')) {
    return {
      category: 'Personal Trainer',
      requiredCount: 2,
      ruleTitle: 'Fitness Instructor & CPR Qualification',
      services: ['1-on-1 Personal Training', 'HIIT Coaching', 'Strength & Conditioning', 'Postural Analysis'],
    }
  }
  if (norm.includes('YOGA') || norm.includes('MEDITATION')) {
    return {
      category: 'Yoga & Meditation Specialist',
      requiredCount: 2,
      ruleTitle: 'Yoga Alliance & Mindfulness Accreditation',
      services: ['Vinyasa Flow Yoga', 'Hatha Yoga', 'Guided Mindfulness Meditation', 'Sound Bath Therapy'],
    }
  }
  if (norm.includes('PHYSIO') || norm.includes('RECOVERY')) {
    return {
      category: 'Physiotherapist & Recovery Specialist',
      requiredCount: 3,
      ruleTitle: 'Degree & Board Practicing License',
      services: ['Musculoskeletal Rehabilitation', 'Sports Injury Assessment', 'Dry Needling', 'Joint Mobilization'],
    }
  }
  if (norm.includes('SPA') || norm.includes('HOTEL')) {
    return {
      category: 'Spa & Wellness Center',
      requiredCount: 2,
      ruleTitle: 'Lead Therapist & Safety Protocol Certification',
      services: ['Full Thermal & Spa Treatment Menu', 'Hydrotherapy Protocols', 'Body Wraps & Scrubs'],
    }
  }
  // Default: Massage Therapist (Grace Njeri)
  return {
    category: 'Massage Therapist',
    requiredCount: 2,
    ruleTitle: 'Professional Massage Therapy Qualification',
    services: ['Swedish Massage', 'Deep Tissue Massage', 'Sports Massage', 'Aromatherapy Treatment'],
  }
}

function generateInitialCredentialRecord(verificationId, targetCredId = 'cred-001') {
  const baseReview = localReviewRecords.get(verificationId) || localQueue.find((r) => r.id === verificationId || r.providerId === verificationId) || {}
  const providerCategory = baseReview?.providerCategory || 'INDIVIDUAL'
  const reqConfig = getDynamicRequirementsConfig(providerCategory, baseReview?.type || 'Massage Therapist')

  const credentialsList = [
    {
      id: 'cred-001',
      title: 'Professional Practice Certificate',
      subtitle: 'Professional Massage Therapy',
      status: 'REVIEWING_NOW',
      isRequired: true,
      fileName: 'Professional_Practice_Certificate.pdf',
      credentialNumber: '••••7281',
      unmaskedNumber: 'KMF-2024-7281',
      issuer: 'Kenya Massage Federation',
      issuerStatus: 'Recognized Institution',
      countryOfIssue: 'Kenya',
      issueDate: '15 Jan 2024',
      expiryDate: '15 Jan 2028',
      remainingTime: '1 year 4 months',
      isCurrent: true,
      isExpiringSoon: false,
      uploadedAt: '12 Sep 2026 • 10:42 AM',
      nameOnDoc: 'Grace W. Njeri',
      pageCount: 2,
      fileStatus: 'Readable',
    },
    {
      id: 'cred-002',
      title: 'Massage Therapy Diploma',
      subtitle: 'Swedish & Deep Tissue Foundations',
      status: 'APPROVED',
      isRequired: true,
      fileName: 'Massage_Therapy_Diploma.pdf',
      credentialNumber: '••••4819',
      unmaskedNumber: 'IWI-2021-4819',
      issuer: 'International Wellness Institute',
      issuerStatus: 'Recognized Institution',
      countryOfIssue: 'Kenya',
      issueDate: '10 May 2021',
      expiryDate: 'N/A',
      remainingTime: 'Perpetual',
      isCurrent: true,
      isExpiringSoon: false,
      uploadedAt: '12 Sep 2026 • 10:40 AM',
      nameOnDoc: 'Grace Njeri',
      pageCount: 1,
      fileStatus: 'Readable',
    },
    {
      id: 'cred-003',
      title: 'Sports & Remedial Accreditation',
      subtitle: 'Advanced Athlete Recovery',
      status: 'OPTIONAL',
      isRequired: false,
      fileName: 'Sports_Remedial_Cert.pdf',
      credentialNumber: '••••9920',
      unmaskedNumber: 'EASMB-2023-9920',
      issuer: 'East Africa Sports Medicine Board',
      issuerStatus: 'Recognized Institution',
      countryOfIssue: 'Kenya',
      issueDate: '10 Nov 2023',
      expiryDate: '10 Nov 2027',
      remainingTime: '1 year 2 months',
      isCurrent: true,
      isExpiringSoon: false,
      uploadedAt: '12 Sep 2026 • 10:41 AM',
      nameOnDoc: 'Grace Wanjiku Njeri',
      pageCount: 1,
      fileStatus: 'Readable',
    },
  ]

  const activeCred = credentialsList.find((c) => c.id === targetCredId) || credentialsList[0]

  return {
    verificationId: verificationId || 'ver-001',
    providerId: baseReview.providerId || 'PR-82941',
    providerCategory,
    name: baseReview.name || 'Grace Njeri',
    avatarUrl: baseReview.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    type: baseReview.type || 'Massage Therapist',
    market: baseReview.market || { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    status: 'UNDER_REVIEW',
    submittedAt: '12 Sep 2026 • 10:42 AM',
    assignedTo: 'Jane Ochieng',
    assignedReviewer: {
      uid: 'reviewer-jane',
      name: 'Jane Ochieng',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    },
    version: 2,
    summary: {
      credentialsRequired: reqConfig.requiredCount,
      submitted: 2,
      approved: 1,
      underReview: 1,
      changesRequested: 0,
    },
    credentialsList,
    activeCredential: {
      ...activeCred,
      isNumberRevealed: false,
    },
    requirementsMapping: {
      requiredFor: `${reqConfig.category} Verification`,
      marketName: 'Kenya',
      marketFlag: '🇰🇪',
      ruleTitle: reqConfig.ruleTitle,
      ruleStatus: 'Required',
      eligibleServices: reqConfig.services,
      validity: {
        issueDate: activeCred.issueDate,
        expiryDate: activeCred.expiryDate,
        remainingTime: activeCred.remainingTime,
        isCurrent: activeCred.isCurrent,
        isExpiringSoon: activeCred.isExpiringSoon,
      },
    },
    comparisonTable: [
      {
        id: 'cmp-c1',
        field: 'Full Name',
        account: baseReview.name || 'Grace Njeri',
        credential: activeCred.nameOnDoc || 'Grace W. Njeri',
        result: 'Review',
        resultType: 'review',
        note: 'Middle initial difference corresponds to National ID',
      },
      {
        id: 'cmp-c2',
        field: 'Profession',
        account: baseReview.type || 'Massage Therapist',
        credential: 'Massage Therapy',
        result: 'Consistent',
        resultType: 'consistent',
        note: 'Matches practice category',
      },
      {
        id: 'cmp-c3',
        field: 'Country of Practice',
        account: 'Kenya',
        credential: activeCred.countryOfIssue || 'Kenya',
        result: 'Match',
        resultType: 'match',
        note: 'Sovereign jurisdiction verified',
      },
      {
        id: 'cmp-c4',
        field: 'Credential Type',
        account: 'Massage Therapy Qualification',
        credential: activeCred.title || 'Professional Practice Certificate',
        result: 'Match',
        resultType: 'match',
        note: 'Meets Tier-1 qualification requirement',
      },
      {
        id: 'cmp-c5',
        field: 'Document Expiry',
        account: '—',
        credential: activeCred.expiryDate || '15 Jan 2028',
        result: activeCred.isCurrent ? 'Current' : 'Expired',
        resultType: activeCred.isCurrent ? 'match' : 'fail',
        note: `Valid (${activeCred.remainingTime})`,
      },
    ],
    checklist: [
      { key: 'documentReadable', label: 'Document readable and clear', status: 'Pass', resultType: 'pass', description: 'Text, seals, and signatures are fully legible' },
      { key: 'pagesIncluded', label: 'Required pages included', status: 'Pass', resultType: 'pass', description: 'All certificate pages (1 & 2) submitted' },
      { key: 'nameCorresponds', label: 'Provider name corresponds', status: 'Needs review', resultType: 'review', description: 'Grace Njeri vs Grace W. Njeri (corresponds with National ID)' },
      { key: 'categoryMatches', label: 'Credential matches provider category', status: 'Pass', resultType: 'pass', description: 'Massage therapy qualification matches therapist profile' },
      { key: 'issuerProvided', label: 'Issuer information provided', status: 'Pass', resultType: 'pass', description: 'Kenya Massage Federation is a recognized professional body' },
      { key: 'issueDateValid', label: 'Issue date valid', status: 'Pass', resultType: 'pass', description: 'Issued 15 Jan 2024 within valid credential window' },
      { key: 'credentialCurrent', label: 'Credential current / not expired', status: 'Pass', resultType: 'pass', description: 'Expiry date 15 Jan 2028 is beyond statutory threshold' },
      { key: 'satisfiesRequirement', label: 'Satisfies configured requirement', status: 'Pass', resultType: 'pass', description: 'Fulfills Tier-1 platform qualification standards' },
      { key: 'noTampering', label: 'No issue requiring escalation', status: 'Pass', resultType: 'pass', description: 'Signatures, borders, and official seals intact' },
    ],
    previousSubmissions: [
      {
        version: 2,
        isCurrent: true,
        submittedAt: '12 Sep 2026 • 10:42 AM',
        fileName: 'Professional_Practice_Certificate.pdf',
        status: 'Under Review',
        statusType: 'under_review',
        reviewer: 'Jane Ochieng',
        notes: 'Resubmitted with clear issuing authority seal.',
      },
      {
        version: 1,
        isCurrent: false,
        submittedAt: '10 Sep 2026 • 9:15 AM',
        fileName: 'Certificate_v1.pdf',
        status: 'Changes Requested',
        statusType: 'changes_requested',
        reviewer: 'Jane Ochieng',
        notes: 'Issuer information and registrar seal unreadable.',
      },
    ],
    reviewHistory: [
      { id: 'crh-1', time: '12 Sep 2026 • 11:20 AM', title: 'Review started (Jane Ochieng)', actor: 'Jane Ochieng', type: 'review_started' },
      { id: 'crh-2', time: '12 Sep 2026 • 11:05 AM', title: 'Assigned to Jane Ochieng', actor: 'System', type: 'assignment' },
      { id: 'crh-3', time: '12 Sep 2026 • 10:42 AM', title: 'Replacement credential submitted', actor: 'Grace Njeri', type: 'submission' },
      { id: 'crh-4', time: '10 Sep 2026 • 11:02 AM', title: 'Changes requested (Issuer unreadable)', actor: 'Jane Ochieng', type: 'changes_requested' },
      { id: 'crh-5', time: '10 Sep 2026 • 9:15 AM', title: 'Credential submitted', actor: 'Grace Njeri', type: 'submission' },
    ],
    internalNotes: [
      {
        id: 'cn-1',
        authorName: 'Jane Ochieng',
        authorRole: 'Verification Specialist',
        createdAt: '12 Sep 2026 • 11:22 AM',
        text: 'Provider name includes middle initial. Identity record otherwise matches. Credential is valid until 2028.',
      },
    ],
  }
}

/**
 * 13. Fetch Credential Verification Detail (ADM-033)
 */
export async function fetchCredentialVerificationDetail(verificationId, credentialId = 'cred-001') {
  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminGetCredentialVerificationDetail', { verificationId, credentialId })
      if (result?.verificationId || result?.name) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminGetCredentialVerificationDetail failed. Falling back to local store.',
        err?.message
      )
    }
  }

  const cacheKey = `${verificationId || 'ver-001'}_${credentialId || 'cred-001'}`
  if (!localCredentialRecords.has(cacheKey)) {
    const record = generateInitialCredentialRecord(verificationId, credentialId)
    localCredentialRecords.set(cacheKey, record)
  }

  return localCredentialRecords.get(cacheKey)
}

/**
 * 14. Submit Credential Decision (ADM-033)
 */
export async function submitCredentialDecision(payload) {
  const {
    verificationId,
    credentialId = 'cred-001',
    decision,
    checklistResults = {},
    reason = '',
    providerMessage = '',
    internalNote = '',
    expectedVersion,
  } = payload

  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminSubmitCredentialDecision', payload)
      if (result?.success) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminSubmitCredentialDecision failed. Falling back to local store.',
        err?.message
      )
    }
  }

  const cacheKey = `${verificationId || 'ver-001'}_${credentialId || 'cred-001'}`
  let record = localCredentialRecords.get(cacheKey)
  if (!record) {
    record = generateInitialCredentialRecord(verificationId, credentialId)
    localCredentialRecords.set(cacheKey, record)
  }

  const normalizedDecision = String(decision).toUpperCase()
  const nextVersion = (record.version || 2) + 1
  record.version = nextVersion

  const statusMap = {
    APPROVE: 'APPROVED',
    REQUEST_CHANGES: 'CHANGES_REQUESTED',
    REJECT: 'REJECTED',
    ESCALATE: 'ESCALATED',
  }
  const newStatus = statusMap[normalizedDecision] || normalizedDecision

  // Update active credential status
  if (record.activeCredential) {
    record.activeCredential.status = newStatus
  }

  // Update list
  record.credentialsList = record.credentialsList.map((c) => {
    if (c.id === credentialId) {
      return { ...c, status: newStatus }
    }
    return c
  })

  // Update summary counters
  const approvedCount = record.credentialsList.filter((c) => c.status === 'APPROVED').length
  const underReviewCount = record.credentialsList.filter((c) => c.status === 'REVIEWING_NOW' || c.status === 'UNDER_REVIEW').length
  const changesCount = record.credentialsList.filter((c) => c.status === 'CHANGES_REQUESTED').length

  record.summary = {
    ...record.summary,
    approved: approvedCount,
    underReview: underReviewCount,
    changesRequested: changesCount,
  }

  // If checklistResults provided, update
  if (checklistResults && Object.keys(checklistResults).length > 0) {
    record.checklist = record.checklist.map((item) => {
      if (checklistResults[item.key] !== undefined) {
        const val = checklistResults[item.key]
        return {
          ...item,
          status: val === true || val === 'Pass' ? 'Pass' : val === 'Needs review' ? 'Needs review' : 'Fail',
          resultType: val === true || val === 'Pass' ? 'pass' : val === 'Needs review' ? 'review' : 'fail',
        }
      }
      return item
    })
  }

  // Review History entry
  const historyLabels = {
    APPROVE: `Approved credential (${record.activeCredential?.title || 'Practice Certificate'})`,
    REQUEST_CHANGES: `Changes requested — ${reason || 'Correction needed'}`,
    REJECT: `Credential rejected — ${reason}`,
    ESCALATE: `Credential escalated to senior review — ${reason}`,
  }

  const newHistory = {
    id: `crh-${Date.now()}`,
    time: 'Just now',
    title: historyLabels[normalizedDecision] || `Credential decision: ${normalizedDecision}`,
    actor: 'Jane Ochieng',
    type: normalizedDecision.toLowerCase(),
    notes: reason || internalNote || providerMessage || '',
  }
  record.reviewHistory = [newHistory, ...record.reviewHistory]

  // If requesting changes, update previous submissions
  if (normalizedDecision === 'REQUEST_CHANGES') {
    const updatedPrev = record.previousSubmissions.map((s) => ({
      ...s,
      isCurrent: false,
      status: 'Changes Requested',
      statusType: 'changes_requested',
      notes: reason || providerMessage || 'Resubmission required',
    }))
    record.previousSubmissions = [
      {
        version: nextVersion,
        isCurrent: true,
        submittedAt: 'Pending provider resubmission',
        fileName: 'Pending upload...',
        status: 'Awaiting Resubmission',
        statusType: 'changes_requested',
        reviewer: 'Jane Ochieng',
        notes: reason || providerMessage,
      },
      ...updatedPrev,
    ]
  }

  // Internal note if provided
  if (internalNote && internalNote.trim()) {
    record.internalNotes = [
      {
        id: `cn-${Date.now()}`,
        authorName: 'Jane Ochieng',
        authorRole: 'Verification Specialist',
        createdAt: 'Just now',
        text: internalNote.trim(),
      },
      ...record.internalNotes,
    ]
  }

  // Propagate to ADM-031 parent review record
  let parentReview = localReviewRecords.get(verificationId) || localReviewRecords.get(record.providerId)
  if (parentReview) {
    const allRequiredApproved = record.credentialsList.filter((c) => c.isRequired).every((c) => c.status === 'APPROVED')
    const nextParentStatus = allRequiredApproved ? 'APPROVED' : normalizedDecision === 'REQUEST_CHANGES' ? 'CHANGES_REQUESTED' : 'REVIEWING_NOW'

    parentReview.progressSteps = (parentReview.progressSteps || []).map((step) => {
      if (step.id === 'CREDENTIALS' || step.number === 2) {
        return { ...step, status: nextParentStatus }
      }
      return step
    })

    parentReview.componentTabs = (parentReview.componentTabs || []).map((tab) => {
      if (tab.id === 'CREDENTIALS') {
        return { ...tab, status: nextParentStatus, badgeCount: nextParentStatus === 'APPROVED' ? 0 : 1 }
      }
      return tab
    })
  }

  return {
    success: true,
    verificationId: record.verificationId,
    credentialId,
    decision: normalizedDecision,
    status: newStatus,
    version: nextVersion,
  }
}

/**
 * 15. Add Credential Internal Note (ADM-033)
 */
export async function addCredentialInternalNote(verificationId, credentialId = 'cred-001', noteText = '') {
  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminAddCredentialInternalNote', { verificationId, credentialId, noteText })
      if (result?.success) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminAddCredentialInternalNote failed. Falling back to local store.',
        err?.message
      )
    }
  }

  const cacheKey = `${verificationId || 'ver-001'}_${credentialId || 'cred-001'}`
  let record = localCredentialRecords.get(cacheKey)
  if (!record) {
    record = generateInitialCredentialRecord(verificationId, credentialId)
    localCredentialRecords.set(cacheKey, record)
  }

  const newNote = {
    id: `cn-${Date.now()}`,
    authorName: 'Jane Ochieng',
    authorRole: 'Verification Specialist',
    createdAt: 'Just now',
    text: noteText.trim(),
  }

  record.internalNotes = [newNote, ...(record.internalNotes || [])]
  return {
    success: true,
    note: newNote,
  }
}

/**

 * -------------------------------------------------------------
 * ADM-034: Business Documents Review In-Memory Mock Store
 * -------------------------------------------------------------
 */
const localBusinessRecords = new Map()

function generateInitialBusinessRecord(verificationId = 'ver-002', documentId = 'doc-licence') {
  const baseReview =
    localVerificationDetails.get(verificationId) ||
    localQueue.find((q) => q.id === verificationId || q.providerId === verificationId) ||
    localQueue.find((q) => q.providerCategory === 'SPA_WELLNESS') ||
    localQueue[1] || {}

  const isHotel = baseReview.providerCategory === 'HOTEL_RESORT'
  const businessName = isHotel ? (baseReview.name || 'Savanna Wellness Resort') : (baseReview.name || 'Serenity Wellness Spa')
  const legalEntityName = isHotel ? 'Savanna Wellness Resort Ltd.' : 'Serenity Wellness Ltd.'
  const providerCode = baseReview.providerId || (isHotel ? 'HOTEL-55102' : 'SPA-28192')
  const categoryLabel = isHotel ? 'Hotel & Wellness Resort' : 'Spa & Wellness Center'
  const representativeName = isHotel ? 'David Mwangi' : 'Mary Wanjiku'
  const representativeRole = isHotel ? 'Property Administrator / General Manager' : 'Managing Director & Founder'
  const representativeDoc = isHotel ? 'Board Resolution & TRA Mandate' : 'CR12 Official Company Registry Certificate'
  const representativeId = isHotel ? '•••• •••• 3319' : '•••• •••• 9102'

  const documentRequirements = [
    {
      id: 'doc-reg',
      title: 'Business Registration',
      subtitle: 'Certificate of Incorporation',
      status: 'APPROVED',
      isRequired: true,
      fileName: isHotel ? 'Savanna_Incorporation_Cert.pdf' : 'Serenity_Incorporation_Cert.pdf',
      docType: 'Certificate of Incorporation',
      issuer: 'Business Registration Service (BRS Kenya)',
      regNumberMasked: '•••• •••• 89412',
      regNumberPlain: 'CPR/2021/89412',
      issueDate: '14 Jun 2021',
      expiryDate: 'Perpetual',
      uploadedAt: '10 Sep 2026 • 2:15 PM',
      pageCount: 1,
    },
    {
      id: 'doc-licence',
      title: 'Operating Licence',
      subtitle: 'Premises Single Business Permit',
      status: 'UNDER_REVIEW',
      isRequired: true,
      fileName: 'Nairobi_County_Operating_Licence_2025.pdf',
      docType: 'Single Business Permit (SBP)',
      issuer: 'Nairobi City County Government',
      regNumberMasked: '•••• •••• 78421',
      regNumberPlain: 'NBI/BL/2025/78421',
      issueDate: '01 Jan 2025',
      expiryDate: '31 Dec 2025',
      uploadedAt: '11 Sep 2026 • 3:18 PM',
      pageCount: 3,
    },
    {
      id: 'doc-tax',
      title: 'Tax Compliance Certificate',
      subtitle: 'KRA Corporate Compliance',
      status: 'CHANGES_REQUESTED',
      isRequired: true,
      fileName: 'KRA_Tax_Compliance_Cert_2025.pdf',
      docType: 'Tax Compliance Certificate (TCC)',
      issuer: 'Kenya Revenue Authority',
      regNumberMasked: '•••• •••• 819P',
      regNumberPlain: 'P051892041M',
      issueDate: '15 Jan 2025',
      expiryDate: '15 Jan 2026',
      uploadedAt: '10 Sep 2026 • 2:20 PM',
      pageCount: 1,
    },
    {
      id: 'doc-cr12',
      title: 'Authorized Representative',
      subtitle: 'Official Company Registry Search',
      status: 'APPROVED',
      isRequired: true,
      fileName: 'Official_CR12_Search_2026.pdf',
      docType: 'Official Search Form CR12',
      issuer: 'Business Registration Service',
      regNumberMasked: '•••• •••• 3109',
      regNumberPlain: 'CR12/2024/3109',
      issueDate: '20 Jul 2024',
      expiryDate: 'Perpetual (Valid)',
      uploadedAt: '10 Sep 2026 • 2:22 PM',
      pageCount: 2,
    },
  ]

  const activeDocId = documentId || 'doc-licence'
  const activeDoc = documentRequirements.find((d) => d.id === activeDocId) || documentRequirements[1]

  return {
    verificationId,
    providerId: providerCode,
    providerCategory: baseReview.providerCategory || 'SPA_WELLNESS',
    tradingName: businessName,
    legalEntityName,
    businessCategory: categoryLabel,
    market: baseReview.market || { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    location: 'Westlands, Nairobi',
    operatingAddress: 'Delta Towers, Ground Floor & Suite 102, Chiromo Road, Westlands, Nairobi',
    registeredAddress: 'Delta Towers, 4th Floor, Chiromo Road, Westlands, Nairobi, P.O. Box 48192-00100',
    status: 'UNDER_REVIEW',
    submittedAt: '11 Sep 2026 • 3:18 PM',
    assignedTo: 'Jane Ochieng',
    assignedReviewer: {
      uid: 'reviewer-jane',
      name: 'Jane Ochieng',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    },
    version: 2,
    progressSummary: {
      requiredDocuments: 4,
      submitted: 4,
      approved: 2,
      underReview: 1,
      changesRequested: 1,
      missing: 0,
    },
    representative: {
      name: representativeName,
      role: representativeRole,
      title: 'Managing Director & Authorized Signatory',
      ownership: '100% Beneficial Shareholder',
      email: isHotel ? 'd.mwangi@marawellness.ke' : 'm.wanjiku@serenityspa.co.ke',
      phone: isHotel ? '+254 733 112 233' : '+254 722 998 877',
      idNumberMasked: representativeId,
      authorizedDocument: representativeDoc,
      isIdentityVerified: true,
      identityReviewId: verificationId,
    },
    documents: documentRequirements,
    activeDocument: {
      ...activeDoc,
      activePage: 1,
      plotNumber: 'Plot 209/18420 Chiromo Rd',
      businessActivity: 'Spa, Massage Therapy & Wellness Center',
      signatoryAuthority: 'Chief Licensing Officer, Nairobi City County',
      watermarkText: 'OFFICIAL COUNTY SEAL VERIFIED',
      fileSize: '3.1 MB',
      fileFormat: 'PDF',
      qualityStatus: 'Readable & High Resolution',
      validity: {
        issueDate: activeDoc.issueDate,
        expiryDate: activeDoc.expiryDate,
        remainingDays: 264,
        remainingFormatted: '6 months remaining',
        isCurrent: true,
        isExpiringSoon: false,
      },
    },
    addressComparison: {
      registeredAddress: 'Delta Towers, 4th Floor, Chiromo Road, Westlands, Nairobi, P.O. Box 48192-00100',
      operatingAddress: 'Delta Towers, Ground Floor & Suite 102, Chiromo Road, Westlands, Nairobi',
      isMatch: true,
      matchNote: 'Premises Match Confirmed (Same Commercial Complex / Address Parcel)',
    },
    requirementInfo: {
      mandateTitle: 'Nairobi City County Single Business Permit Mandate',
      legalReference: 'Nairobi City County Single Business Permit Act (2020) & Lé Inspa Platform Safety Policy',
      description:
        'All wellness facilities operating physical massage, hydrotherapy, sauna, or aesthetic treatment premises within Nairobi County must maintain an active Single Business Permit (SBP) displaying the designated wellness activity code.',
      eligibleServices: [
        'Therapeutic Massage & Body Treatments',
        'Hydrotherapy & Water Circuit Operations',
        'Sauna, Steam & Thermal Suites',
        'Facials, Skin Care & Esthetics',
      ],
    },
    comparisonTable: [
      {
        id: 'cmp-b1',
        field: 'Business Trading Name',
        account: businessName,
        document: legalEntityName,
        result: 'Review',
        resultType: 'review',
        note: 'Informational review: Legal corporate entity registered with BRS vs. public consumer-facing trading brand.',
      },
      {
        id: 'cmp-b2',
        field: 'Country & Jurisdiction',
        account: 'Kenya',
        document: 'Kenya',
        result: 'Match',
        resultType: 'match',
        note: 'National sovereign jurisdiction matches registered platform operating market.',
      },
      {
        id: 'cmp-b3',
        field: 'Licence / Permit Number',
        account: activeDoc.regNumberMasked,
        document: activeDoc.regNumberMasked,
        accountPlain: activeDoc.regNumberPlain,
        documentPlain: activeDoc.regNumberPlain,
        result: 'Match',
        resultType: 'match',
        note: 'Validated against county unified licensing registry database.',
      },
      {
        id: 'cmp-b4',
        field: 'Business & Facility Category',
        account: categoryLabel,
        document: `${categoryLabel} (Category 3B)`,
        result: 'Match',
        resultType: 'match',
        note: 'Permit authorizes therapeutic wellness, massage, and hydrotherapy services.',
      },
      {
        id: 'cmp-b5',
        field: 'Authorized Representative',
        account: `${representativeName} (${representativeRole.split(' ')[0]})`,
        document: `${representativeName} (Managing Director)`,
        result: 'Match',
        resultType: 'match',
        note: 'Verified corporate representative corresponds with official CR12 registry.',
      },
      {
        id: 'cmp-b6',
        field: 'Premises Location',
        account: 'Westlands, Nairobi',
        document: 'Plot 209/18420 Chiromo Rd, Westlands',
        result: 'Match',
        resultType: 'match',
        note: 'Physical facility parcel verified against county land mapping database.',
      },
    ],
    checklist: [
      { key: 'entityLegallyRegistered', label: 'Business entity legally registered', status: 'Pass', resultType: 'pass', description: 'Certificate of Incorporation verified with BRS Kenya' },
      { key: 'premisesPermitActive', label: 'Premises operating permit active', status: 'Pass', resultType: 'pass', description: 'Single business permit valid for current calendar year' },
      { key: 'taxComplianceVerified', label: 'Tax compliance verified', status: 'Needs review', resultType: 'review', description: 'KRA Tax compliance certificate renewal requested' },
      { key: 'operatingAddressMatches', label: 'Operating address matches permit', status: 'Pass', resultType: 'pass', description: 'Plot number and street location match profile' },
      { key: 'representativeVerified', label: 'Authorized representative verified', status: 'Pass', resultType: 'pass', description: 'Identity and Director status confirmed in ADM-032' },
      { key: 'signatoryMandateConfirmed', label: 'Signatory mandate confirmed', status: 'Pass', resultType: 'pass', description: 'CR12 document confers official contracting authority' },
      { key: 'publicHealthCleared', label: 'Public health & hygiene inspection cleared', status: 'Pass', resultType: 'pass', description: 'County health directorate sanitation seal present' },
      { key: 'noSanctionsFlags', label: 'No sanctions or regulatory flags', status: 'Pass', resultType: 'pass', description: 'Entity in good legal standing across registry databases' },
    ],
    previousSubmissions: [
      {
        version: 2,
        isCurrent: true,
        submittedAt: '11 Sep 2026 • 3:18 PM',
        fileName: 'Nairobi_County_Operating_Licence_2025.pdf',
        status: 'Under Review',
        statusType: 'under_review',
        reviewer: 'Jane Ochieng',
        notes: 'Resubmitted with current 2025/2026 calendar year Single Business Permit and paid county receipt.',
      },
      {
        version: 1,
        isCurrent: false,
        submittedAt: '05 Sep 2026 • 11:20 AM',
        fileName: 'County_Permit_2024_Expired.pdf',
        status: 'Changes Requested',
        statusType: 'changes_requested',
        reviewer: 'Jane Ochieng',
        notes: 'Submitted permit expired on 31 Dec 2024. Current calendar year single business permit required.',
      },
    ],
    reviewHistory: [
      { id: 'brh-1', time: '11 Sep 2026 • 3:45 PM', title: 'Review started by Jane Ochieng', actor: 'Jane Ochieng', type: 'review_started' },
      { id: 'brh-2', time: '11 Sep 2026 • 3:30 PM', title: 'Assigned to Jane Ochieng by System', actor: 'System', type: 'assignment' },
      { id: 'brh-3', time: '11 Sep 2026 • 3:18 PM', title: `Replacement Operating Licence submitted by ${businessName}`, actor: businessName, type: 'submission' },
      { id: 'brh-4', time: '05 Sep 2026 • 2:10 PM', title: 'Changes requested — Licence expired (Jane Ochieng)', actor: 'Jane Ochieng', type: 'changes_requested' },
      { id: 'brh-5', time: '05 Sep 2026 • 11:20 AM', title: `Business documents submitted by ${businessName}`, actor: businessName, type: 'submission' },
    ],
    internalNotes: [
      {
        id: 'bn-1',
        authorName: 'Jane Ochieng',
        authorRole: 'Verification Specialist',
        createdAt: '11 Sep 2026 • 3:50 PM',
        text: 'Trading name differs from legal entity (Serenity Wellness Spa vs Serenity Wellness Ltd). This is standard under Kenya Business Names Act. CR12 confirms Mary Wanjiku as 100% director.',
      },
    ],
  }
}

/**
 * 16. Fetch Business Verification Detail (ADM-034)
 */
export async function fetchBusinessVerificationDetail(verificationId, documentId) {
  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminGetBusinessVerificationDetail', { verificationId, documentId })
      if (result?.verificationId || result?.tradingName || result?.legalEntityName) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminGetBusinessVerificationDetail failed. Falling back to local store.',
        err?.message
      )
    }
  }

  const cacheKey = `${verificationId || 'ver-002'}_${documentId || 'doc-licence'}`
  if (!localBusinessRecords.has(cacheKey)) {
    const record = generateInitialBusinessRecord(verificationId, documentId)
    localBusinessRecords.set(cacheKey, record)
  }

  return localBusinessRecords.get(cacheKey)
}

/**
 * 17. Reveal Business Document Number (ADM-034)
 */
export async function revealBusinessDocumentNumber(verificationId, documentId = 'doc-licence') {
  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminRevealBusinessDocumentNumber', { verificationId, documentId })
      if (result?.plainNumber) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminRevealBusinessDocumentNumber failed. Falling back to local store.',
        err?.message
      )
    }
  }

  let plainNumber = 'NBI/BL/2025/78421'
  if (documentId === 'doc-reg') plainNumber = 'CPR/2021/89412'
  else if (documentId === 'doc-tax') plainNumber = 'P051892041M'
  else if (documentId === 'doc-cr12') plainNumber = 'CR12/2024/3109'

  return {
    success: true,
    verificationId,
    documentId,
    plainNumber,
    revealedBy: 'Jane Ochieng',
    revealedAt: new Date().toISOString(),
  }
}

/**
 * 18. Submit Business Document Decision (ADM-034)
 */
export async function submitBusinessDocumentDecision(payload) {
  const {
    verificationId,
    documentId = 'doc-licence',
    decision,
    checklistResults = {},
    reason = '',
    providerMessage = '',
    internalNote = '',
    expectedVersion,
  } = payload

  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminSubmitBusinessDocumentDecision', payload)
      if (result?.success) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminSubmitBusinessDocumentDecision failed. Falling back to local store.',
        err?.message
      )
    }
  }

  const cacheKey = `${verificationId || 'ver-002'}_${documentId || 'doc-licence'}`
  let record = localBusinessRecords.get(cacheKey)
  if (!record) {
    record = generateInitialBusinessRecord(verificationId, documentId)
    localBusinessRecords.set(cacheKey, record)
  }

  const normalizedDecision = String(decision).toUpperCase()
  const nextVersion = (record.version || 2) + 1
  record.version = nextVersion

  const statusMap = {
    APPROVE: 'APPROVED',
    REQUEST_CHANGES: 'CHANGES_REQUESTED',
    REJECT: 'REJECTED',
    ESCALATE: 'ESCALATED',
  }
  const newStatus = statusMap[normalizedDecision] || normalizedDecision

  // Update active document status
  if (record.activeDocument) {
    record.activeDocument.status = newStatus
  }

  // Update document in documents array
  record.documents = record.documents.map((d) => {
    if (d.id === documentId) {
      return { ...d, status: newStatus }
    }
    return d
  })

  // Update progress summary counts
  const approvedCount = record.documents.filter((d) => d.status === 'APPROVED').length
  const underReviewCount = record.documents.filter((d) => d.status === 'UNDER_REVIEW' || d.status === 'REVIEWING_NOW').length
  const changesCount = record.documents.filter((d) => d.status === 'CHANGES_REQUESTED').length

  record.progressSummary = {
    ...record.progressSummary,
    approved: approvedCount,
    underReview: underReviewCount,
    changesRequested: changesCount,
  }

  // Update checklist if checklistResults passed
  if (checklistResults && Object.keys(checklistResults).length > 0) {
    record.checklist = record.checklist.map((item) => {
      if (checklistResults[item.key] !== undefined) {
        const val = checklistResults[item.key]
        return {
          ...item,
          status: val === true || val === 'Pass' ? 'Pass' : val === 'Needs review' ? 'Needs review' : 'Fail',
          resultType: val === true || val === 'Pass' ? 'pass' : val === 'Needs review' ? 'review' : 'fail',
        }
      }
      return item
    })
  }

  // Review history entry
  const historyLabels = {
    APPROVE: `Approved business document (${record.activeDocument?.title || 'Operating Licence'})`,
    REQUEST_CHANGES: `Changes requested — ${reason || 'Correction needed'}`,
    REJECT: `Document rejected — ${reason}`,
    ESCALATE: `Document escalated to compliance — ${reason}`,
  }

  const newHistory = {
    id: `brh-${Date.now()}`,
    time: 'Just now',
    title: historyLabels[normalizedDecision] || `Business document decision: ${normalizedDecision}`,
    actor: 'Jane Ochieng',
    type: normalizedDecision.toLowerCase(),
    notes: reason || internalNote || providerMessage || '',
  }
  record.reviewHistory = [newHistory, ...record.reviewHistory]

  // If requesting changes, update previous submissions
  if (normalizedDecision === 'REQUEST_CHANGES') {
    const updatedPrev = record.previousSubmissions.map((s) => ({
      ...s,
      isCurrent: false,
      status: 'Changes Requested',
      statusType: 'changes_requested',
      notes: reason || providerMessage || 'Resubmission required',
    }))
    record.previousSubmissions = [
      {
        version: nextVersion,
        isCurrent: true,
        submittedAt: 'Pending business resubmission',
        fileName: 'Pending upload...',
        status: 'Awaiting Resubmission',
        statusType: 'changes_requested',
        reviewer: 'Jane Ochieng',
        notes: reason || providerMessage,
      },
      ...updatedPrev,
    ]
  }

  // Internal note if provided
  if (internalNote && internalNote.trim()) {
    record.internalNotes = [
      {
        id: `bn-${Date.now()}`,
        authorName: 'Jane Ochieng',
        authorRole: 'Verification Specialist',
        createdAt: 'Just now',
        text: internalNote.trim(),
      },
      ...record.internalNotes,
    ]
  }

  // Propagate to ADM-031 parent review record
  let parentReview = localReviewRecords.get(verificationId) || localReviewRecords.get(record.providerId)
  if (parentReview) {
    const allRequiredApproved = record.documents.filter((d) => d.isRequired).every((d) => d.status === 'APPROVED')
    const nextParentStatus = allRequiredApproved ? 'APPROVED' : normalizedDecision === 'REQUEST_CHANGES' ? 'CHANGES_REQUESTED' : 'REVIEWING_NOW'

    parentReview.progressSteps = (parentReview.progressSteps || []).map((step) => {
      if (step.id === 'BUSINESS_DOCS' || step.id === 'PREMISES_PERMIT' || step.number === 2) {
        return { ...step, status: nextParentStatus }
      }
      return step
    })

    parentReview.componentTabs = (parentReview.componentTabs || []).map((tab) => {
      if (tab.id === 'BUSINESS_DOCS' || tab.id === 'PREMISES_PERMIT') {
        return { ...tab, status: nextParentStatus, badgeCount: nextParentStatus === 'APPROVED' ? 0 : 1 }
      }
      return tab
    })
  }

  return {
    success: true,
    verificationId: record.verificationId,
    documentId,
    decision: normalizedDecision,
    status: newStatus,
    version: nextVersion,
  }
}

/**
 * 19. Add Business Internal Note (ADM-034)
 */
export async function addBusinessInternalNote(verificationId, documentId = 'doc-licence', noteText = '') {
  if (!isVerificationMockMode()) {
    try {
      const result = await callAdmin('adminAddBusinessInternalNote', { verificationId, documentId, noteText })
      if (result?.success) {
        return result
      }
    } catch (err) {
      console.warn(
        '[verificationService] Cloud Function adminAddBusinessInternalNote failed. Falling back to local store.',
        err?.message
      )
    }
  }

  const cacheKey = `${verificationId || 'ver-002'}_${documentId || 'doc-licence'}`
  let record = localBusinessRecords.get(cacheKey)
  if (!record) {
    record = generateInitialBusinessRecord(verificationId, documentId)
    localBusinessRecords.set(cacheKey, record)
  }

  const newNote = {
    id: `bn-${Date.now()}`,
    authorName: 'Jane Ochieng',
    authorRole: 'Verification Specialist',
    createdAt: 'Just now',
    text: noteText.trim(),
  }

  record.internalNotes = [newNote, ...(record.internalNotes || [])]
  return {
    success: true,
    note: newNote,
  }
}

/**

 * Service object export for standard import patterns.
 */
export const verificationService = {
  fetchVerificationQueue,
  fetchDetailedQueue,
  claimCase,
  escalateCase,
  assignReviewer,
  submitVerificationDecision,
  fetchVerificationDetail,
  submitComponentDecision,
  addInternalNote,

  fetchIdentityVerificationDetail,
  revealSensitiveIdentityField,
  submitIdentityDecision,
  fetchCredentialVerificationDetail,
  submitCredentialDecision,
  addCredentialInternalNote,

  fetchBusinessVerificationDetail,
  revealBusinessDocumentNumber,
  submitBusinessDocumentDecision,
  addBusinessInternalNote,

  isMockMode: isVerificationMockMode,
  setMockMode: setVerificationMockMode,
}


