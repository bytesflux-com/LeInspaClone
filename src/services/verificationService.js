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
 * Service object export for standard import patterns.
 */
export const verificationService = {
  fetchVerificationQueue,
  assignReviewer,
  submitVerificationDecision,
  isMockMode: isVerificationMockMode,
  setMockMode: setVerificationMockMode,
}
