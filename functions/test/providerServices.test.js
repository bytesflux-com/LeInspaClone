import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateServicesSummary,
  filterServices,
  validateServiceModeration,
  evaluatePricingAlert,
} from '../src/providerServicesLogic.js'

test('ADM-023 Services Logic: calculateServicesSummary accurately aggregates pricing & statuses', () => {
  const mockServices = [
    { id: '1', active: true, price: 'KES 4,500', priceNum: 4500, approvalStatus: 'approved' },
    { id: '2', active: true, price: 'KES 3,500', priceNum: 3500, approvalStatus: 'approved' },
    { id: '3', active: true, price: 'KES 6,000', priceNum: 6000, approvalStatus: 'approved' },
    { id: '4', active: true, price: 'KES 6,500', priceNum: 6500, approvalStatus: 'pending_review' },
    { id: '5', active: false, price: 'KES 4,000', priceNum: 4000, approvalStatus: 'approved' },
    { id: '6', active: true, price: 'KES 4,500', priceNum: 4500, approvalStatus: 'pending_review' },
    { id: '7', active: true, price: 'KES 7,500', priceNum: 7500, approvalStatus: 'approved' },
    { id: '8', active: true, price: 'KES 4,000', priceNum: 4000, approvalStatus: 'approved' },
    { id: '9', active: true, price: 'KES 3,000', priceNum: 3000, approvalStatus: 'approved' },
  ]

  const summary = calculateServicesSummary(mockServices)

  assert.equal(summary.totalCount, 9)
  assert.equal(summary.activeCount, 8)
  assert.equal(summary.inactiveCount, 1)
  assert.equal(summary.pendingReviewCount, 2)
  assert.equal(summary.lowestPrice, 3000)
  assert.equal(summary.highestPrice, 7500)
  assert.ok(summary.averagePrice > 4000 && summary.averagePrice < 5500)
})

test('ADM-023 Services Logic: filterServices handles tab and multi-facet filtering', () => {
  const mockServices = [
    { id: '1', name: 'Deep Tissue Massage', category: 'Massage', active: true, approvalStatus: 'approved', availability: 'available' },
    { id: '2', name: 'Hot Stone Therapy', category: 'Specialty', active: true, approvalStatus: 'pending_review', availability: 'limited' },
    { id: '3', name: 'Aromatherapy Session', category: 'Relaxation', active: false, approvalStatus: 'approved', availability: 'unavailable' },
  ]

  // Filter by active tab
  const activeOnly = filterServices(mockServices, { tab: 'active' })
  assert.equal(activeOnly.length, 2)

  // Filter by pending review tab
  const pendingOnly = filterServices(mockServices, { tab: 'pending_review' })
  assert.equal(pendingOnly.length, 1)
  assert.equal(pendingOnly[0].name, 'Hot Stone Therapy')

  // Search by keyword
  const searchMatch = filterServices(mockServices, { search: 'Tissue' })
  assert.equal(searchMatch.length, 1)
  assert.equal(searchMatch[0].id, '1')

  // Filter by category
  const specialtyMatch = filterServices(mockServices, { category: 'Specialty' })
  assert.equal(specialtyMatch.length, 1)
  assert.equal(specialtyMatch[0].name, 'Hot Stone Therapy')
})

test('ADM-023 Moderation: Rejection strictly requires reason or message', () => {
  const validApprove = validateServiceModeration({ action: 'approve' })
  assert.equal(validApprove.valid, true)

  const invalidReject = validateServiceModeration({ action: 'request_changes' })
  assert.equal(invalidReject.valid, false)
  assert.ok(invalidReject.error.includes('requires a reason'))

  const validReject = validateServiceModeration({
    action: 'request_changes',
    reasonCode: 'IMAGE_POLICY',
    messageToProvider: 'Please upload image without watermark',
  })
  assert.equal(validReject.valid, true)
})

test('ADM-023 Pricing Alert: Triggers warning for sudden surge > 50%', () => {
  const surgeAlert = evaluatePricingAlert(6500, 4000) // 62.5% surge
  assert.ok(surgeAlert !== null)
  assert.equal(surgeAlert.code, 'UNUSUAL_PRICE_INCREASE')

  const normalChange = evaluatePricingAlert(4200, 4000) // 5% change
  assert.equal(normalChange, null)
})

