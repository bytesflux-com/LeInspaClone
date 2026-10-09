import assert from 'node:assert/strict'
import test from 'node:test'
import {
  allowedCategories,
  capQueue,
  dedupeItems,
  resolveMarketScope,
  resolvePriority,
  sortQueueItems,
  summarizeQueue,
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
