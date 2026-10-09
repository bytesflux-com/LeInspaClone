import { MOCK_QUEUE_ITEMS, MOCK_REVIEW_DETAILS } from './needsAttentionFixtures.js'

// In-memory clones for development testing state persistence during session
let inMemoryQueue = JSON.parse(JSON.stringify(MOCK_QUEUE_ITEMS))
let inMemoryDetails = JSON.parse(JSON.stringify(MOCK_REVIEW_DETAILS))

export function resetMockAttentionStore() {
  inMemoryQueue = JSON.parse(JSON.stringify(MOCK_QUEUE_ITEMS))
  inMemoryDetails = JSON.parse(JSON.stringify(MOCK_REVIEW_DETAILS))
}

function summarizeMockItems(items) {
  const summary = {
    total: items.length,
    critical: 0,
    high: 0,
    normal: 0,
    resolvedToday: 2, // representative historical count
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
    else if (item.category === 'finance') summary.finance += 1
    else if (item.category === 'disputes') summary.disputes += 1
    else if (item.category === 'support') summary.support += 1
  }

  return summary
}

export const attentionMockService = {
  async getNeedsAttention({ marketId = 'ALL' } = {}) {
    // Artificial slight delay to allow inspecting LoadingState in dev
    await new Promise((resolve) => setTimeout(resolve, 80))

    const filtered = inMemoryQueue.filter((item) => {
      if (marketId === 'ALL') return true
      return item.marketCode === marketId
    })

    const summary = summarizeMockItems(filtered)

    return {
      context: {
        marketId,
        marketName: marketId === 'ALL' ? 'All Markets' : marketId === 'KE' ? 'Kenya' : marketId === 'UG' ? 'Uganda' : marketId,
        scopedMarkets: marketId === 'ALL' ? ['ALL'] : [marketId],
        generatedAt: new Date().toISOString(),
      },
      summary,
      items: filtered,
      isMock: true,
    }
  },

  async getReviewItem({ sourceType, sourceId, marketId = 'ALL' }) {
    await new Promise((resolve) => setTimeout(resolve, 60))

    const key = `${sourceType}:${sourceId}`
    const record = inMemoryDetails[key]

    if (!record) {
      const error = new Error(`Record ${sourceId} not found or has been removed.`)
      error.code = 'functions/not-found'
      throw error
    }

    if (marketId !== 'ALL' && record.countryCode && record.countryCode !== marketId) {
      const error = new Error(`You are not authorized for this market (${record.countryCode}).`)
      error.code = 'functions/permission-denied'
      error.details = { reason: 'market-denied', market: record.countryCode }
      throw error
    }

    return {
      ...record,
      isMock: true,
    }
  },

  async processReviewAction({ sourceType, sourceId, action, reason = '' }) {
    await new Promise((resolve) => setTimeout(resolve, 120))

    if (sourceType !== 'user_verification') {
      const error = new Error(`Consequential actions on ${sourceType} are not supported.`)
      error.code = 'functions/failed-precondition'
      throw error
    }

    const key = `${sourceType}:${sourceId}`
    const record = inMemoryDetails[key]

    if (!record) {
      const error = new Error('User record not found or has been removed.')
      error.code = 'functions/not-found'
      throw error
    }

    if (record.status !== 'pending') {
      const error = new Error(`Verification is currently '${record.status}'. Only pending records can be reviewed.`)
      error.code = 'functions/failed-precondition'
      error.details = { reason: 'already-processed' }
      throw error
    }

    if (action !== 'approve' && action !== 'reject') {
      const error = new Error(`Action '${action}' is not supported. Must be 'approve' or 'reject'.`)
      error.code = 'functions/invalid-argument'
      throw error
    }

    if (action === 'reject') {
      const trimmed = typeof reason === 'string' ? reason.trim() : ''
      if (!trimmed || trimmed.length < 3) {
        const error = new Error('A detailed rejection reason (at least 3 characters) is required when rejecting verification.')
        error.code = 'functions/failed-precondition'
        error.details = { reason: 'missing-reason' }
        throw error
      }
    }

    const nextStatus = action === 'approve' ? 'verified' : 'rejected'
    const nowIso = new Date().toISOString()

    // Update in-memory record
    record.status = nextStatus
    record.supportedActions = []
    if (action === 'approve') {
      record.verifiedAt = nowIso
      record.verifiedBy = 'adm-dev-simulated'
      record.rejectionReason = null
    } else {
      record.rejectedAt = nowIso
      record.rejectedBy = 'adm-dev-simulated'
      record.rejectionReason = reason.trim()
    }

    // Remove from active pending queue
    inMemoryQueue = inMemoryQueue.filter((item) => item.id !== key)

    return {
      ok: true,
      sourceId,
      sourceType,
      status: nextStatus,
      action,
      isMock: true,
      message:
        action === 'approve'
          ? '[SIMULATED] Provider verification approved successfully in mock mode.'
          : '[SIMULATED] Provider verification rejected in mock mode.',
    }
  },

  async assignQueueItem({ sourceType, sourceId, assigneeId, assigneeName, assigneeEmail }) {
    await new Promise((resolve) => setTimeout(resolve, 60))
    const key = `${sourceType}:${sourceId}`
    const queueItem = inMemoryQueue.find((item) => item.id === key)
    const detailItem = inMemoryDetails[key]

    const assignedTo =
      assigneeId && assigneeId !== 'unassigned'
        ? {
            uid: assigneeId,
            name: assigneeName || assigneeEmail || 'Assigned Admin',
            email: assigneeEmail || 'admin@le-inspa.com',
          }
        : null

    if (queueItem) {
      queueItem.assignedTo = assignedTo
    }
    if (detailItem) {
      detailItem.assignedTo = assignedTo
    }

    return {
      ok: true,
      sourceType,
      sourceId,
      assignedTo,
      isMock: true,
    }
  },
}
