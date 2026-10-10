import test from 'node:test'
import assert from 'node:assert/strict'
import {
  attentionMockService,
  resetMockAttentionStore,
} from '../../src/mocks/attentionMockService.js'

test.beforeEach(() => {
  resetMockAttentionStore()
})

test('UI Integration: Queue displays all sample records with consistent initial counts', async () => {
  const result = await attentionMockService.getNeedsAttention({ marketId: 'ALL' })
  assert.equal(result.isMock, true)
  assert.equal(result.items.length, 14)
  assert.equal(result.summary.total, 14)
  assert.equal(result.summary.critical, 1) // 1 critical dispute
  assert.equal(result.summary.high, 4) // 2 manual_review withdrawals, 2 open disputes
  assert.equal(result.summary.normal, 9)
  assert.equal(result.summary.verification, 4)
  assert.equal(result.summary.finance, 4)
  assert.equal(result.summary.disputes, 3)
  assert.equal(result.summary.support, 3)
})

test('UI Integration: Market filtering strictly partitions KE and UG records and updates counts', async () => {
  const keResult = await attentionMockService.getNeedsAttention({ marketId: 'KE' })
  assert.equal(keResult.context.marketId, 'KE')
  assert.ok(keResult.items.length > 0)
  for (const item of keResult.items) {
    assert.equal(item.marketCode, 'KE')
  }
  assert.equal(keResult.summary.total, keResult.items.length)

  const ugResult = await attentionMockService.getNeedsAttention({ marketId: 'UG' })
  assert.equal(ugResult.context.marketId, 'UG')
  assert.ok(ugResult.items.length > 0)
  for (const item of ugResult.items) {
    assert.equal(item.marketCode, 'UG')
  }
  assert.equal(ugResult.summary.total, ugResult.items.length)

  // Sum of sovereign markets must equal total
  assert.equal(keResult.items.length + ugResult.items.length, 14)
})

test('UI Integration: Detail records retrieval matches expected schema for each category', async () => {
  // Provider Verification Detail
  const verif = await attentionMockService.getReviewItem({
    sourceType: 'user_verification',
    sourceId: 'usr-ke-101',
    marketId: 'ALL',
  })
  assert.equal(verif.sourceId, 'usr-ke-101')
  assert.equal(verif.status, 'pending')
  assert.ok(verif.documents.length >= 2)
  assert.equal(verif.supportedActions.length, 2)
  assert.equal(verif.supportedActions[0].id, 'approve')
  assert.equal(verif.supportedActions[1].id, 'reject')

  // Withdrawal Detail (Read-Only)
  const wd = await attentionMockService.getReviewItem({
    sourceType: 'withdrawal_request',
    sourceId: 'wdr-ke-201',
    marketId: 'ALL',
  })
  assert.equal(wd.sourceId, 'wdr-ke-201')
  assert.equal(wd.currency, 'KES')
  assert.equal(wd.supportedActions.length, 0)
  assert.ok(wd.unsupportedReason.includes('Automated payout execution rail is not connected'))

  // Dispute Detail (Read-Only)
  const disp = await attentionMockService.getReviewItem({
    sourceType: 'dispute',
    sourceId: 'dsp-ke-301',
    marketId: 'ALL',
  })
  assert.equal(disp.sourceId, 'dsp-ke-301')
  assert.equal(disp.supportedActions.length, 0)
  assert.ok(disp.unsupportedReason.includes('Dispute financial resolution and escrow release'))

  // Support Ticket Detail (Read-Only)
  const ticket = await attentionMockService.getReviewItem({
    sourceType: 'support_ticket',
    sourceId: 'tkt-ke-401',
    marketId: 'ALL',
  })
  assert.equal(ticket.sourceId, 'tkt-ke-401')
  assert.equal(ticket.supportedActions.length, 0)
  assert.ok(ticket.unsupportedReason.includes('Support ticket responses require the concierge'))
})

test('UI Integration: Detail item rejects cross-market access for country-scoped admins', async () => {
  await assert.rejects(
    async () => {
      await attentionMockService.getReviewItem({
        sourceType: 'user_verification',
        sourceId: 'usr-ke-101',
        marketId: 'UG', // Uganda admin trying to view Kenya record
      })
    },
    (err) => {
      assert.equal(err.code, 'functions/permission-denied')
      return true
    },
  )
})

test('UI Integration: Rejection requires a valid reason (>= 3 chars)', async () => {
  await assert.rejects(
    async () => {
      await attentionMockService.processReviewAction({
        sourceType: 'user_verification',
        sourceId: 'usr-ke-101',
        action: 'reject',
        reason: '   ',
      })
    },
    (err) => {
      assert.equal(err.code, 'functions/failed-precondition')
      assert.equal(err.details?.reason, 'missing-reason')
      return true
    },
  )

  await assert.rejects(
    async () => {
      await attentionMockService.processReviewAction({
        sourceType: 'user_verification',
        sourceId: 'usr-ke-101',
        action: 'reject',
        reason: 'no',
      })
    },
    (err) => {
      assert.equal(err.code, 'functions/failed-precondition')
      return true
    },
  )
})

test('UI Integration: Approval succeeds, updates in-memory record, and refreshes queue without stale counts', async () => {
  const result = await attentionMockService.processReviewAction({
    sourceType: 'user_verification',
    sourceId: 'usr-ke-101',
    action: 'approve',
  })
  assert.equal(result.ok, true)
  assert.equal(result.status, 'verified')
  assert.equal(result.isMock, true)

  // Verify updated detail state
  const updatedDetail = await attentionMockService.getReviewItem({
    sourceType: 'user_verification',
    sourceId: 'usr-ke-101',
    marketId: 'ALL',
  })
  assert.equal(updatedDetail.status, 'verified')
  assert.equal(updatedDetail.supportedActions.length, 0)

  // Verify queue refresh: item removed from pending queue
  const refreshedQueue = await attentionMockService.getNeedsAttention({ marketId: 'ALL' })
  assert.equal(refreshedQueue.items.length, 13) // was 14
  assert.equal(refreshedQueue.summary.total, 13)
  assert.equal(refreshedQueue.summary.verification, 3) // was 4
  assert.ok(!refreshedQueue.items.some((item) => item.sourceId === 'usr-ke-101'))

  // Repeated action attempt must be rejected (idempotency/concurrency guard)
  await assert.rejects(
    async () => {
      await attentionMockService.processReviewAction({
        sourceType: 'user_verification',
        sourceId: 'usr-ke-101',
        action: 'approve',
      })
    },
    (err) => {
      assert.equal(err.code, 'functions/failed-precondition')
      assert.equal(err.details?.reason, 'already-processed')
      return true
    },
  )
})

test('UI Integration: Unsupported categories reject mutation attempts', async () => {
  for (const unsupported of ['withdrawal_request', 'dispute', 'support_ticket']) {
    await assert.rejects(
      async () => {
        await attentionMockService.processReviewAction({
          sourceType: unsupported,
          sourceId: 'sample-id',
          action: 'approve',
        })
      },
      (err) => {
        assert.equal(err.code, 'functions/failed-precondition')
        return true
      },
    )
  }
})

test('UI Integration: Queue assignment updates assignee and persists in queue and detail states', async () => {
  const assignResult = await attentionMockService.assignQueueItem({
    sourceType: 'user_verification',
    sourceId: 'usr-ke-101',
    assigneeId: 'adm-sarah',
    assigneeName: 'Sarah Admin',
    assigneeEmail: 'sarah@le-inspa.com',
  })
  assert.equal(assignResult.ok, true)
  assert.equal(assignResult.assignedTo?.uid, 'adm-sarah')

  // Check queue item reflects assignment
  const queue = await attentionMockService.getNeedsAttention({ marketId: 'ALL' })
  const item = queue.items.find((i) => i.sourceId === 'usr-ke-101')
  assert.equal(item.assignedTo?.uid, 'adm-sarah')
  assert.equal(item.assignedTo?.name, 'Sarah Admin')

  // Check detail item reflects assignment
  const detail = await attentionMockService.getReviewItem({
    sourceType: 'user_verification',
    sourceId: 'usr-ke-101',
    marketId: 'ALL',
  })
  assert.equal(detail.assignedTo?.uid, 'adm-sarah')

  // Unassigning clears the assignee
  const unassignResult = await attentionMockService.assignQueueItem({
    sourceType: 'user_verification',
    sourceId: 'usr-ke-101',
    assigneeId: 'unassigned',
  })
  assert.equal(unassignResult.ok, true)
  assert.equal(unassignResult.assignedTo, null)
})
