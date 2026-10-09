import assert from 'node:assert/strict'
import test from 'node:test'
import {
  allowedCategories,
  canAccessItemScope,
  capQueue,
  dedupeItems,
  determineSupportedActions,
  resolveMarketScope,
  resolvePriority,
  sortQueueItems,
  summarizeQueue,
  validateReviewPermission,
  validateVerificationTransition,
} from '../src/needsAttentionLogic.js'

test('All Markets for a country-scoped admin is only assigned countries', () => {
  const scope = resolveMarketScope({ markets: ['KE', 'UG'] }, 'ALL')
  assert.deepEqual(scope, { requested: 'ALL', unrestricted: false, markets: ['KE', 'UG'] })
})

test('specific unauthorized market is rejected', () => {
  const scope = resolveMarketScope({ markets: ['KE', 'UG'] }, 'TZ')
  assert.equal(scope.error, 'unauthorized')
})

test('super admin All Markets is unrestricted', () => {
  const scope = resolveMarketScope({ markets: ['ALL'] }, 'ALL')
  assert.equal(scope.unrestricted, true)
  assert.deepEqual(scope.markets, ['KE', 'UG', 'TZ', 'RW', 'ZA'])
})

test('priority uses manual_review and open disputes only', () => {
  assert.equal(resolvePriority({ category: 'finance', status: 'manual_review' }), 'high')
  assert.equal(resolvePriority({ category: 'finance', status: 'submitted' }), 'normal')
  assert.equal(resolvePriority({ category: 'disputes', status: 'open' }), 'high')
  assert.equal(resolvePriority({ category: 'verification', status: 'pending' }), 'normal')
})

test('sorts critical then high then normal, oldest first', () => {
  const sorted = sortQueueItems([
    { id: 'n2', priority: 'normal', createdAt: '2026-01-02T00:00:00.000Z' },
    { id: 'c2', priority: 'critical', createdAt: '2026-01-02T00:00:00.000Z' },
    { id: 'c1', priority: 'critical', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'h1', priority: 'high', createdAt: '2026-01-01T00:00:00.000Z' },
  ])
  assert.deepEqual(
    sorted.map((item) => item.id),
    ['c1', 'c2', 'h1', 'n2'],
  )
})

test('dedupes by sourceType + sourceId', () => {
  const unique = dedupeItems([
    { id: 'dispute:abc', sourceType: 'dispute', sourceId: 'abc' },
    { id: 'dispute:abc', sourceType: 'dispute', sourceId: 'abc' },
    { id: 'user_verification:1', sourceType: 'user_verification', sourceId: '1' },
  ])
  assert.equal(unique.length, 2)
})

test('summary is derived from the same item list', () => {
  const items = capQueue([
    { category: 'verification', priority: 'normal' },
    { category: 'finance', priority: 'high' },
    { category: 'disputes', priority: 'high' },
  ])
  assert.deepEqual(summarizeQueue(items), {
    total: 3,
    critical: 0,
    high: 2,
    normal: 1,
    resolvedToday: 0,
    verification: 1,
    content: 0,
    finance: 1,
    disputes: 1,
    safety: 0,
    support: 0,
    bookingIssues: 0,
  })
})

test('category visibility follows existing admin permissions', () => {
  const finance = allowedCategories(['dashboard.view', 'payments.view', 'withdrawals.approve'])
  assert.equal(finance.finance, true)
  assert.equal(finance.verification, false)
  const officer = allowedCategories(['providers.verify', 'providers.view'])
  assert.equal(officer.verification, true)
  assert.equal(officer.disputes, false)
})

test('canAccessItemScope checks markets properly', () => {
  const adminScope = { markets: ['KE', 'UG'] }
  assert.equal(canAccessItemScope(adminScope, 'KE'), true)
  assert.equal(canAccessItemScope(adminScope, 'UG'), true)
  assert.equal(canAccessItemScope(adminScope, 'TZ'), false)
  assert.equal(canAccessItemScope(adminScope, null), false)
  assert.equal(canAccessItemScope({ markets: ['ALL'] }, null), true)
})

test('validateReviewPermission enforces category view and action permissions', () => {
  // Provider verification
  assert.equal(validateReviewPermission(['providers.view'], 'user_verification', 'view'), true)
  assert.equal(validateReviewPermission(['providers.view'], 'user_verification', 'approve'), false)
  assert.equal(validateReviewPermission(['providers.verify'], 'user_verification', 'approve'), true)
  assert.equal(validateReviewPermission(['providers.verify'], 'user_verification', 'reject'), true)
  assert.equal(validateReviewPermission(['dashboard.view'], 'user_verification', 'view'), false)

  // Withdrawals
  assert.equal(validateReviewPermission(['payments.view'], 'withdrawal_request', 'view'), true)
  assert.equal(validateReviewPermission(['payments.view'], 'withdrawal_request', 'approve'), false)
  assert.equal(validateReviewPermission(['withdrawals.approve'], 'withdrawal_request', 'approve'), true)

  // Disputes
  assert.equal(validateReviewPermission(['safety.manage'], 'dispute', 'view'), true)
  assert.equal(validateReviewPermission(['payments.view'], 'dispute', 'view'), false)

  // Support
  assert.equal(validateReviewPermission(['support.view'], 'support_ticket', 'view'), true)
  assert.equal(validateReviewPermission(['support.view'], 'support_ticket', 'respond'), false)
  assert.equal(validateReviewPermission(['support.respond'], 'support_ticket', 'respond'), true)
})

test('validateVerificationTransition permits approve for pending records', () => {
  const result = validateVerificationTransition('pending', 'approve')
  assert.equal(result.valid, true)
  assert.equal(result.nextStatus, 'verified')
})

test('validateVerificationTransition permits reject with detailed reason', () => {
  const result = validateVerificationTransition('pending', 'reject', 'Missing government ID credentials')
  assert.equal(result.valid, true)
  assert.equal(result.nextStatus, 'rejected')
})

test('validateVerificationTransition rejects rejection without reason', () => {
  const result = validateVerificationTransition('pending', 'reject', '  ')
  assert.equal(result.valid, false)
  assert.equal(result.error, 'missing-reason')
})

test('validateVerificationTransition blocks already processed records (concurrency/idempotency protection)', () => {
  const resultVerified = validateVerificationTransition('verified', 'approve')
  assert.equal(resultVerified.valid, false)
  assert.equal(resultVerified.error, 'already-processed')

  const resultRejected = validateVerificationTransition('rejected', 'reject', 'any reason')
  assert.equal(resultRejected.valid, false)
  assert.equal(resultRejected.error, 'already-processed')
})

test('validateVerificationTransition blocks unknown actions', () => {
  const result = validateVerificationTransition('pending', 'delete')
  assert.equal(result.valid, false)
  assert.equal(result.error, 'invalid-action')
})

test('determineSupportedActions returns actions only when permitted and actionable', () => {
  const permittedActions = determineSupportedActions({
    sourceType: 'user_verification',
    status: 'pending',
    permissions: ['providers.verify'],
  })
  assert.equal(permittedActions.length, 2)
  assert.equal(permittedActions[0].id, 'approve')
  assert.equal(permittedActions[1].id, 'reject')

  const viewOnlyActions = determineSupportedActions({
    sourceType: 'user_verification',
    status: 'pending',
    permissions: ['providers.view'],
  })
  assert.equal(viewOnlyActions.length, 0)

  const processedActions = determineSupportedActions({
    sourceType: 'user_verification',
    status: 'verified',
    permissions: ['providers.verify'],
  })
  assert.equal(processedActions.length, 0)

  // Financial and other categories have no direct execution actions
  const financeActions = determineSupportedActions({
    sourceType: 'withdrawal_request',
    status: 'submitted',
    permissions: ['withdrawals.approve'],
  })
  assert.equal(financeActions.length, 0)
})

