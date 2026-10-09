<<<<<<< HEAD
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  CATEGORIES,
  MarketScopeError,
  buildQueue,
  dedupeItems,
  isActionable,
  isInScope,
  normalizeItem,
  planCategories,
  resolveMarketScope,
  sortItems,
  toMillis,
  waitingMinutes,
} from '../src/needsAttentionLogic.js'
import { ROLES } from '../src/accessModel.js'

const NOW = Date.parse('2026-10-09T12:00:00.000Z')
const ts = (iso) => ({ toMillis: () => Date.parse(iso) }) // Firestore Timestamp shape
const KE_UG = { markets: ['KE', 'UG'] }
const GLOBAL = { markets: ['ALL'] }

function expectScopeError(fn, code, reason) {
  assert.throws(fn, (err) => err instanceof MarketScopeError && err.code === code && err.reason === reason)
}

function item(category, id, opts = {}) {
  const { createdAt, status, path } = opts
  const countryCode = 'countryCode' in opts ? opts.countryCode : 'KE'
  const def = CATEGORIES[category]
  return normalizeItem({
    category,
    id,
    path: path ?? `${def.collection}/${id}`,
    data: { [def.statusField]: status ?? def.statuses[0], countryCode, createdAt: createdAt ? ts(createdAt) : undefined },
    nowMs: NOW,
  })
}

describe('resolveMarketScope', () => {
  test('KE+UG admin requesting ALL is limited to KE and UG', () => {
    assert.deepEqual(resolveMarketScope('ALL', KE_UG), { requested: 'ALL', global: false, codes: ['KE', 'UG'] })
  })
  test('KE+UG admin requesting KE gets only KE', () => {
    assert.deepEqual(resolveMarketScope('KE', KE_UG).codes, ['KE'])
  })
  test('KE+UG admin requesting UG gets only UG', () => {
    assert.deepEqual(resolveMarketScope('ug', KE_UG).codes, ['UG'])
  })
  test('KE+UG admin requesting TZ is rejected', () => {
    expectScopeError(() => resolveMarketScope('TZ', KE_UG), 'permission-denied', 'unauthorized-market')
  })
  test('missing or empty market defaults to ALL (existing ADM-005 convention)', () => {
    assert.deepEqual(resolveMarketScope(undefined, KE_UG).codes, ['KE', 'UG'])
    assert.deepEqual(resolveMarketScope(null, KE_UG).codes, ['KE', 'UG'])
    assert.deepEqual(resolveMarketScope('  ', KE_UG).codes, ['KE', 'UG'])
  })
  test('malformed and unsupported markets are rejected', () => {
    expectScopeError(() => resolveMarketScope(42, KE_UG), 'invalid-argument', 'invalid-market')
    expectScopeError(() => resolveMarketScope(['KE'], KE_UG), 'invalid-argument', 'invalid-market')
    expectScopeError(() => resolveMarketScope({ market: 'KE' }, KE_UG), 'invalid-argument', 'invalid-market')
    expectScopeError(() => resolveMarketScope('XX', KE_UG), 'invalid-argument', 'invalid-market')
    expectScopeError(() => resolveMarketScope('KE,TZ', KE_UG), 'invalid-argument', 'invalid-market')
  })
  test('unrestricted admin (markets contains ALL) gets an unfiltered ALL scope', () => {
    assert.deepEqual(resolveMarketScope('ALL', GLOBAL), { requested: 'ALL', global: true, codes: null })
    assert.deepEqual(resolveMarketScope('TZ', GLOBAL).codes, ['TZ'])
  })
  test('unknown codes stored on a profile never widen the scope', () => {
    assert.deepEqual(resolveMarketScope('ALL', { markets: ['KE', 'XX'] }).codes, ['KE'])
  })
  test('admin without markets is rejected', () => {
    expectScopeError(() => resolveMarketScope('ALL', { markets: [] }), 'permission-denied', 'no-authorized-markets')
    expectScopeError(() => resolveMarketScope('ALL', {}), 'permission-denied', 'no-authorized-markets')
    expectScopeError(() => resolveMarketScope('KE', { markets: [] }), 'permission-denied', 'unauthorized-market')
  })
})

describe('planCategories', () => {
  const states = (plan) => Object.fromEntries(plan.map((p) => [p.category, p.state]))
  const scopedKE = { requested: 'KE', global: false, codes: ['KE'] }
  const globalAll = { requested: 'ALL', global: true, codes: null }

  test('super admin with global ALL sees every category', () => {
    assert.deepEqual(states(planCategories(ROLES.super_admin.permissions, globalAll)), {
      verification: 'query',
      withdrawal: 'query',
      dispute: 'query',
      support: 'query',
    })
  })
  test('support tickets are withheld whenever the scope is country-limited', () => {
    assert.equal(states(planCategories(ROLES.super_admin.permissions, scopedKE)).support, 'restricted')
    const scopedAll = { requested: 'ALL', global: false, codes: ['KE', 'UG'] }
    assert.equal(states(planCategories(ROLES.country_admin.permissions, scopedAll)).support, 'restricted')
  })
  test('roles receive only the categories their permissions allow', () => {
    assert.deepEqual(states(planCategories(ROLES.verification_officer.permissions, globalAll)), {
      verification: 'query',
      withdrawal: 'forbidden',
      dispute: 'forbidden',
      support: 'forbidden',
    })
    assert.deepEqual(states(planCategories(ROLES.finance_admin.permissions, globalAll)), {
      verification: 'forbidden',
      withdrawal: 'query',
      dispute: 'forbidden',
      support: 'forbidden',
    })
    assert.deepEqual(states(planCategories(ROLES.country_admin.permissions, scopedKE)), {
      verification: 'query',
      withdrawal: 'forbidden',
      dispute: 'query',
      support: 'restricted',
    })
    assert.deepEqual(states(planCategories(ROLES.support_agent.permissions, scopedKE)), {
      verification: 'forbidden',
      withdrawal: 'forbidden',
      dispute: 'forbidden',
      support: 'restricted',
    })
  })
  test('no permissions means no categories', () => {
    assert.ok(planCategories([], globalAll).every((p) => p.state === 'forbidden'))
    assert.ok(planCategories(undefined, globalAll).every((p) => p.state === 'forbidden'))
  })
})

describe('timestamps and waiting time', () => {
  test('toMillis handles Timestamp-like, Date, missing and invalid values', () => {
    assert.equal(toMillis(ts('2026-10-09T11:00:00.000Z')), Date.parse('2026-10-09T11:00:00.000Z'))
    assert.equal(toMillis(new Date('2026-10-09T11:00:00.000Z')), Date.parse('2026-10-09T11:00:00.000Z'))
    assert.equal(toMillis(undefined), null)
    assert.equal(toMillis(null), null)
    assert.equal(toMillis('2026-10-09'), null)
    assert.equal(toMillis(12345), null)
    assert.equal(toMillis(new Date('invalid')), null)
    assert.equal(toMillis({ toMillis: () => NaN }), null)
  })
  test('waitingMinutes floors, clamps future values and returns null when unknown', () => {
    assert.equal(waitingMinutes(NOW - 90 * 60000 - 30000, NOW), 90)
    assert.equal(waitingMinutes(NOW + 5 * 60000, NOW), 0)
    assert.equal(waitingMinutes(null, NOW), null)
  })
  test('normalized item exposes createdAt basis or null', () => {
    const known = item('withdrawal', 'w1', { createdAt: '2026-10-09T10:00:00.000Z' })
    assert.equal(known.waitingMinutes, 120)
    assert.equal(known.waitingBasis, 'createdAt')
    assert.equal(known.waitingSince, '2026-10-09T10:00:00.000Z')
    const unknown = item('withdrawal', 'w2')
    assert.equal(unknown.waitingMinutes, null)
    assert.equal(unknown.waitingSince, null)
    assert.equal(unknown.waitingBasis, null)
  })
})

describe('normalization, actionable status and market filtering', () => {
  test('only configured statuses are actionable', () => {
    assert.ok(isActionable(item('withdrawal', 'a', { status: 'manual_review' })))
    assert.ok(isActionable(item('withdrawal', 'b', { status: 'processing' })))
    assert.ok(!isActionable(item('withdrawal', 'c', { status: 'completed' })))
    assert.ok(!isActionable(item('dispute', 'd', { status: 'resolved' })))
    assert.ok(!isActionable(item('verification', 'e', { status: 'approved' })))
    assert.ok(isActionable(item('support', 'f', { status: 'open' })))
  })
  test('priority is fixed per category; nothing is critical', () => {
    assert.equal(item('verification', 'v').priority, 'high')
    assert.equal(item('withdrawal', 'w', { status: 'manual_review' }).priority, 'high')
    assert.equal(item('dispute', 'd').priority, 'high')
    assert.equal(item('support', 's').priority, 'normal')
  })
  test('unknown or missing country is never reported as a market', () => {
    assert.equal(item('dispute', 'x', { countryCode: 'XX' }).marketCode, null)
    assert.equal(item('dispute', 'y', { countryCode: undefined }).marketCode, null)
    // support tickets have no established market field
    assert.equal(item('support', 'z', { countryCode: 'KE' }).marketCode, null)
  })
  test('isInScope keeps only records from the resolved markets', () => {
    const scope = { codes: ['KE', 'UG'] }
    assert.ok(isInScope(item('dispute', 'a', { countryCode: 'KE' }), scope))
    assert.ok(isInScope(item('dispute', 'b', { countryCode: 'UG' }), scope))
    assert.ok(!isInScope(item('dispute', 'c', { countryCode: 'TZ' }), scope))
    assert.ok(!isInScope(item('dispute', 'd', { countryCode: undefined }), scope))
    assert.ok(!isInScope(item('support', 'e'), scope))
    assert.ok(isInScope(item('dispute', 'f', { countryCode: undefined }), { codes: null }))
  })
})

describe('deduplication', () => {
  test('same source record appears once', () => {
    const a = item('dispute', 'd1')
    assert.equal(dedupeItems([a, { ...a }, item('dispute', 'd2')]).length, 2)
  })
  test('same id in different categories or parents stays distinct', () => {
    const items = [
      item('dispute', 'same'),
      item('withdrawal', 'same'),
      item('support', 't1', { path: 'users/u1/support_tickets/t1' }),
      item('support', 't1', { path: 'users/u2/support_tickets/t1' }),
    ]
    assert.equal(dedupeItems(items).length, 4)
  })
})

describe('sorting', () => {
  test('critical → high → normal, oldest first, unknown age last', () => {
    const critical = { ...item('support', 'c', { createdAt: '2026-10-09T11:59:00.000Z' }), priority: 'critical' }
    const highNew = item('dispute', 'h1', { createdAt: '2026-10-09T11:00:00.000Z' })
    const highOld = item('withdrawal', 'h2', { createdAt: '2026-10-01T00:00:00.000Z' })
    const highUnknown = item('verification', 'h3')
    const normal = item('support', 'n', { createdAt: '2026-01-01T00:00:00.000Z' })
    const sorted = sortItems([normal, highUnknown, highNew, critical, highOld])
    assert.deepEqual(
      sorted.map((i) => i.sourceId),
      ['c', 'h2', 'h1', 'h3', 'n'],
    )
  })
})

describe('buildQueue summary', () => {
  const ok = (category, total, items) => ({ category, state: 'ok', total, items })

  test('totals come from full counts, not from the bounded item list', () => {
    const verifications = [item('verification', 'v1', { createdAt: '2026-10-01T00:00:00.000Z' })]
    const disputes = [item('dispute', 'd1', { createdAt: '2026-10-02T00:00:00.000Z' })]
    const q = buildQueue([
      ok('verification', 57, verifications),
      ok('withdrawal', 0, []),
      ok('dispute', 4, disputes),
      { category: 'support', state: 'restricted', reason: 'market-attribution-unknown', total: null, items: [] },
    ])
    assert.deepEqual(q.summary, { total: 61, complete: true, critical: 0, high: 61, normal: 0, displayed: 2, truncated: true })
    assert.deepEqual(q.categories.verification, { permitted: true, state: 'ok', reason: null, total: 57, displayed: 1 })
    assert.deepEqual(q.categories.support, {
      permitted: true,
      state: 'restricted',
      reason: 'market-attribution-unknown',
      total: null,
      displayed: 0,
    })
  })
  test('a failed category marks the summary incomplete and is not counted as zero', () => {
    const q = buildQueue([
      ok('verification', 2, [item('verification', 'v1'), item('verification', 'v2')]),
      { category: 'withdrawal', state: 'error', reason: 'query-failed', total: null, items: [] },
      { category: 'dispute', state: 'forbidden', reason: 'missing-permission', total: null, items: [] },
      ok('support', 1, [item('support', 's1')]),
    ])
    assert.equal(q.summary.complete, false)
    assert.equal(q.summary.total, 3)
    assert.equal(q.summary.high, 2)
    assert.equal(q.summary.normal, 1)
    assert.equal(q.summary.truncated, false)
    assert.equal(q.categories.withdrawal.total, null)
    assert.equal(q.categories.withdrawal.state, 'error')
    assert.equal(q.categories.dispute.permitted, false)
  })
  test('item limit bounds the list but keeps totals and per-category displayed counts consistent', () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      item('dispute', `d${i}`, { createdAt: `2026-10-0${i + 1}T00:00:00.000Z` }),
    )
    const q = buildQueue([ok('dispute', 40, many)], { itemLimit: 3 })
    assert.equal(q.items.length, 3)
    assert.deepEqual(q.items.map((i) => i.sourceId), ['d0', 'd1', 'd2'])
    assert.equal(q.summary.total, 40)
    assert.equal(q.summary.displayed, 3)
    assert.equal(q.categories.dispute.displayed, 3)
    assert.equal(q.summary.truncated, true)
  })
  test('duplicate items across results are counted once in the displayed list', () => {
    const d = item('dispute', 'dup')
    const q = buildQueue([ok('dispute', 1, [d, { ...d }])])
    assert.equal(q.items.length, 1)
    assert.equal(q.categories.dispute.displayed, 1)
  })
=======
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
>>>>>>> 34d6fc54f70a52ab6bda0e4055cb0e1c9840e2e7
})
