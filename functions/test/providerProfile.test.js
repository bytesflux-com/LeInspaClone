import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canAccessProviderMarket,
  resolveProviderPermissions,
  validateContentModeration,
  validateInternalNote,
  resolveProviderCategory,
} from '../src/providerProfileLogic.js'

test('ADM-022 Security: Sovereign market access isolation', () => {
  const keAdmin = { markets: ['KE'], role: 'country_admin' }
  const ugAdmin = { markets: ['UG'], role: 'country_admin' }
  const superAdmin = { markets: ['ALL'], role: 'super_admin' }

  assert.equal(canAccessProviderMarket(keAdmin, 'KE'), true)
  assert.equal(canAccessProviderMarket(keAdmin, 'UG'), false)
  assert.equal(canAccessProviderMarket(ugAdmin, 'UG'), true)
  assert.equal(canAccessProviderMarket(ugAdmin, 'KE'), false)
  assert.equal(canAccessProviderMarket(superAdmin, 'KE'), true)
  assert.equal(canAccessProviderMarket(superAdmin, 'UG'), true)
  assert.equal(canAccessProviderMarket(superAdmin, 'ALL'), true)
  assert.equal(canAccessProviderMarket(keAdmin, null), false)
})

test('ADM-022 Security: Permission resolution enforces financial & PII gates', () => {
  const basicAdmin = { role: 'operations', permissions: ['providers.view'] }
  const financeAdmin = { role: 'finance', permissions: ['providers.view', 'payments.view'] }
  const complianceAdmin = { role: 'compliance', permissions: ['providers.view', 'providers.verify', 'users.suspend'] }
  const superAdmin = { role: 'super_admin', permissions: [] }

  const basic = resolveProviderPermissions(basicAdmin)
  assert.equal(basic.canView, true)
  assert.equal(basic.canViewFinancials, false)
  assert.equal(basic.canVerify, false)
  assert.equal(basic.canSuspend, false)

  const fin = resolveProviderPermissions(financeAdmin)
  assert.equal(fin.canView, true)
  assert.equal(fin.canViewFinancials, true)
  assert.equal(fin.canVerify, false)

  const comp = resolveProviderPermissions(complianceAdmin)
  assert.equal(comp.canVerify, true)
  assert.equal(comp.canSuspend, true)
  assert.equal(comp.canViewFinancials, false)

  const superAdm = resolveProviderPermissions(superAdmin)
  assert.equal(superAdm.canView, true)
  assert.equal(superAdm.canViewFinancials, true)
  assert.equal(superAdm.canVerify, true)
  assert.equal(superAdm.canSuspend, true)
})

test('ADM-022 Content Moderation: Rejection strictly requires reason', () => {
  const approval = validateContentModeration({ status: 'approved' })
  assert.equal(approval.valid, true)

  const badReject = validateContentModeration({ status: 'changes_requested', reasonCode: null, reasonLabel: null })
  assert.equal(badReject.valid, false)
  assert.ok(badReject.error.includes('requires a reason'))

  const goodReject = validateContentModeration({
    status: 'changes_requested',
    reasonCode: 'IMAGE_QUALITY',
    reasonLabel: 'Low resolution',
  })
  assert.equal(goodReject.valid, true)
})

test('ADM-022 Internal Notes: Empty notes are rejected, valid notes sanitized', () => {
  const empty = validateInternalNote({ text: '   ' })
  assert.equal(empty.valid, false)

  const valid = validateInternalNote({ text: '  Credential verified against Kenyan council.  ', author: 'Jane' })
  assert.equal(valid.valid, true)
  assert.equal(valid.sanitizedText, 'Credential verified against Kenyan council.')
  assert.equal(valid.author, 'Jane')
})

test('ADM-022 Dynamic Architecture: Resolves Individual vs Spa vs Hotel', () => {
  assert.equal(resolveProviderCategory('individual', 'massage_therapist'), 'individual')
  assert.equal(resolveProviderCategory('individual', 'fitness_trainer'), 'individual')
  assert.equal(resolveProviderCategory('spa', 'spa'), 'spa')
  assert.equal(resolveProviderCategory('hotel_resort', 'hotel_resort'), 'hotel_resort')
})

