import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canAccessItemScope,
  determineSupportedActions,
  validateReviewPermission,
  validateVerificationTransition,
  summarizeQueue,
  sortQueueItems,
  dedupeItems,
} from '../src/needsAttentionLogic.js'

test('Review Workflows Security: validateReviewPermission blocks unauthorized admins', () => {
  // Provider verification
  assert.equal(validateReviewPermission(['providers.view'], 'user_verification', 'view'), true)
  assert.equal(validateReviewPermission(['providers.view'], 'user_verification', 'approve'), false)
  assert.equal(validateReviewPermission(['providers.verify'], 'user_verification', 'approve'), true)
  assert.equal(validateReviewPermission(['providers.verify'], 'user_verification', 'reject'), true)
  assert.equal(validateReviewPermission(['dashboard.view'], 'user_verification', 'view'), false)
  assert.equal(validateReviewPermission([], 'user_verification', 'view'), false)

  // Withdrawals
  assert.equal(validateReviewPermission(['payments.view'], 'withdrawal_request', 'view'), true)
  assert.equal(validateReviewPermission(['payments.view'], 'withdrawal_request', 'approve'), false)
  assert.equal(validateReviewPermission(['withdrawals.approve'], 'withdrawal_request', 'approve'), true)
  assert.equal(validateReviewPermission(['safety.manage'], 'withdrawal_request', 'view'), false)

  // Disputes
  assert.equal(validateReviewPermission(['safety.manage'], 'dispute', 'view'), true)
  assert.equal(validateReviewPermission(['payments.view'], 'dispute', 'view'), false)

  // Support
  assert.equal(validateReviewPermission(['support.view'], 'support_ticket', 'view'), true)
  assert.equal(validateReviewPermission(['support.view'], 'support_ticket', 'respond'), false)
  assert.equal(validateReviewPermission(['support.respond'], 'support_ticket', 'respond'), true)
})

test('Review Workflows Security: canAccessItemScope enforces strict sovereign market isolation', () => {
  const keAdmin = { markets: ['KE'] }
  const ugAdmin = { markets: ['UG'] }
  const superAdmin = { markets: ['ALL'] }

  // Authorized market allowed
  assert.equal(canAccessItemScope(keAdmin, 'KE'), true)
  assert.equal(canAccessItemScope(ugAdmin, 'UG'), true)

  // Unauthorized market denied
  assert.equal(canAccessItemScope(keAdmin, 'UG'), false)
  assert.equal(canAccessItemScope(ugAdmin, 'KE'), false)
  assert.equal(canAccessItemScope(keAdmin, 'TZ'), false)

  // Missing or null countryCode strictly denied for country-scoped admins
  assert.equal(canAccessItemScope(keAdmin, null), false)
  assert.equal(canAccessItemScope(keAdmin, ''), false)
  assert.equal(canAccessItemScope(keAdmin, undefined), false)

  // Super Admin unrestricted
  assert.equal(canAccessItemScope(superAdmin, 'KE'), true)
  assert.equal(canAccessItemScope(superAdmin, 'UG'), true)
  assert.equal(canAccessItemScope(superAdmin, 'ZA'), true)
  assert.equal(canAccessItemScope(superAdmin, null), true)
})

test('Review Workflows State Machine: approval succeeds only for pending records', () => {
  const pendingApproval = validateVerificationTransition('pending', 'approve')
  assert.equal(pendingApproval.valid, true)
  assert.equal(pendingApproval.nextStatus, 'verified')

  const verifiedApproval = validateVerificationTransition('verified', 'approve')
  assert.equal(verifiedApproval.valid, false)
  assert.equal(verifiedApproval.error, 'already-processed')

  const rejectedApproval = validateVerificationTransition('rejected', 'approve')
  assert.equal(rejectedApproval.valid, false)
  assert.equal(rejectedApproval.error, 'already-processed')
})

test('Review Workflows State Machine: rejection requires a valid, non-empty reason', () => {
  const validReject = validateVerificationTransition('pending', 'reject', 'Missing national accreditation document')
  assert.equal(validReject.valid, true)
  assert.equal(validReject.nextStatus, 'rejected')

  // Empty string
  const emptyReason = validateVerificationTransition('pending', 'reject', '')
  assert.equal(emptyReason.valid, false)
  assert.equal(emptyReason.error, 'missing-reason')

  // Whitespace only
  const whitespaceReason = validateVerificationTransition('pending', 'reject', '   ')
  assert.equal(whitespaceReason.valid, false)
  assert.equal(whitespaceReason.error, 'missing-reason')

  // Too short (< 3 characters)
  const shortReason = validateVerificationTransition('pending', 'reject', 'no')
  assert.equal(shortReason.valid, false)
  assert.equal(shortReason.error, 'missing-reason')
})

test('Review Workflows Concurrency: repeated action attempts on processed records are blocked', () => {
  // Simulates race condition where another admin processed the record first
  const raceResult = validateVerificationTransition('verified', 'reject', 'Document invalid')
  assert.equal(raceResult.valid, false)
  assert.equal(raceResult.error, 'already-processed')
})

test('Review Workflows Action Scoping: determineSupportedActions restricts unsupported categories', () => {
  // Provider verification pending + permission
  const providerActions = determineSupportedActions({
    sourceType: 'user_verification',
    status: 'pending',
    permissions: ['providers.verify'],
  })
  assert.equal(providerActions.length, 2)
  assert.equal(providerActions[0].id, 'approve')
  assert.equal(providerActions[1].id, 'reject')

  // Provider verification already processed
  const processedActions = determineSupportedActions({
    sourceType: 'user_verification',
    status: 'verified',
    permissions: ['providers.verify'],
  })
  assert.equal(processedActions.length, 0)

  // Withdrawals: payout rail not connected, direct actions blocked
  const withdrawalActions = determineSupportedActions({
    sourceType: 'withdrawal_request',
    status: 'manual_review',
    permissions: ['withdrawals.approve'],
  })
  assert.equal(withdrawalActions.length, 0)

  // Disputes: escrow release rail not connected, direct actions blocked
  const disputeActions = determineSupportedActions({
    sourceType: 'dispute',
    status: 'open',
    permissions: ['safety.manage'],
  })
  assert.equal(disputeActions.length, 0)

  // Support: concierge messaging service required, direct actions blocked
  const supportActions = determineSupportedActions({
    sourceType: 'support_ticket',
    status: 'open',
    permissions: ['support.respond'],
  })
  assert.equal(supportActions.length, 0)
})

test('Review Workflows Queue Refresh: processing an item updates queue and summary accurately', () => {
  const initialItems = [
    { id: 'user_verification:1', sourceType: 'user_verification', category: 'verification', priority: 'normal', status: 'pending' },
    { id: 'withdrawal_request:2', sourceType: 'withdrawal_request', category: 'finance', priority: 'high', status: 'manual_review' },
    { id: 'dispute:3', sourceType: 'dispute', category: 'disputes', priority: 'high', status: 'open' },
  ]

  const initialSummary = summarizeQueue(initialItems)
  assert.equal(initialSummary.total, 3)
  assert.equal(initialSummary.verification, 1)
  assert.equal(initialSummary.finance, 1)
  assert.equal(initialSummary.disputes, 1)

  // Simulate successful decision: verification item is now processed ('verified')
  // Under the Phase 3 / Phase 4 query rule, only pending verifications are returned by the queue loader
  const refreshedItems = initialItems.filter((item) => item.id !== 'user_verification:1')
  const refreshedSummary = summarizeQueue(refreshedItems)

  assert.equal(refreshedSummary.total, 2)
  assert.equal(refreshedSummary.verification, 0)
  assert.equal(refreshedSummary.finance, 1)
  assert.equal(refreshedSummary.disputes, 1)
})
