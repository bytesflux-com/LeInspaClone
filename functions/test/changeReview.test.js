import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildServiceReview, changeRequestOutcome, decideField, detectClaims, detectContact, diffWords, normalizeField, publishable, serviceEligibility, validateFieldDecision, validateServiceDecision } from '../src/changeReviewLogic.js'
import { checklistFor } from '../src/contentModerationLogic.js'
import { deriveStatus, duplicateItems, validateRequest } from '../src/informationRequestLogic.js'

const NOW = Date.parse('2026-09-12T09:00:00Z')
const actor = { id: 'a1', name: 'Jane Ochieng' }
const pass = (type) => Object.fromEntries(checklistFor(type).map((c) => [c.id, 'pass']))
const fields = () => [
  normalizeField({ key: 'bio', current: 'Certified massage therapist.', proposed: 'Massage therapist specializing in deep tissue.' }),
  normalizeField({ key: 'professionalCategory', current: 'Massage Therapist', proposed: 'Physiotherapist' }),
]

test('diff highlights only what changed', () => {
  const d = diffWords('Certified massage therapist', 'Professional massage therapist')
  assert.deepEqual(d.map((s) => s.type), ['removed', 'added', 'same'])
})

test('verification-critical fields are classified and can never be approved', () => {
  const [, category] = fields()
  assert.equal(category.sensitive, true)
  assert.equal(category.reverifyRoute.adm, 'ADM-033')
  assert.match(validateFieldDecision(category, { decision: 'approve', checks: pass('profile_change') }, checklistFor('profile_change')), /re-verification/)
  assert.equal(validateFieldDecision(category, { decision: 'reverify' }), null)
})

test('approve needs every check; reject needs explanation and internal note', () => {
  const [bio] = fields()
  assert.match(validateFieldDecision(bio, { decision: 'approve', checks: {} }, checklistFor('profile_change')), /policy check/)
  assert.match(validateFieldDecision(bio, { decision: 'reject', reason: 'Too promotional', providerMessage: 'x' }), /internal/)
})

test('only approved, non-sensitive fields publish; outcome waits for every field', () => {
  let f = decideField(fields(), 'bio', { decision: 'approve' }, actor, NOW)
  assert.deepEqual(publishable(f).map((x) => x.key), ['bio'])
  assert.equal(changeRequestOutcome(f), null)
  f = decideField(f, 'professionalCategory', { decision: 'reverify' }, actor, NOW).map((x) => (x.key === 'bio' ? { ...x, status: 'published' } : x))
  assert.equal(changeRequestOutcome(f), 'reverification')
})

test('rejecting a proposal leaves the current value intact', () => {
  const f = decideField(fields(), 'bio', { decision: 'reject', reason: 'x' }, actor, NOW)
  const bio = f.find((x) => x.key === 'bio')
  assert.equal(bio.status, 'rejected')
  assert.equal(bio.current, 'Certified massage therapist.')
  assert.equal(publishable(f).length, 0)
})

test('service outside the approved category requires verification review', () => {
  const e = serviceEligibility('massage_therapist', 'Physiotherapy', 'Massage Therapist')
  assert.equal(e.consistent, false)
  assert.match(validateServiceDecision({ decision: 'approve', checks: pass('service') }, { checklist: checklistFor('service'), eligibility: e }), /verification review/)
  assert.equal(serviceEligibility('spa', 'Physiotherapy').consistent, true)
})

test('unsupported medical claims and contact details are flagged, not auto-rejected', () => {
  assert.deepEqual(detectClaims('Guaranteed to cure chronic back pain').sort(), ['cure', 'guaranteed'])
  assert.equal(detectClaims('Designed to support relaxation and relieve muscle tension').length, 0)
  assert.ok(detectContact('WhatsApp me on +254 712 345 678').length >= 2)
})

test('service review: update vs new, changed fields and request-changes needs a field', () => {
  const r = buildServiceReview({ serviceId: 'SRV-1', current: { name: 'Deep Tissue', description: 'Relaxing', durationMins: 60, price: 4000, category: 'Massage' }, proposed: { name: 'Deep Tissue', description: 'Relaxing and restorative', durationMins: 60, price: 4500, category: 'Massage' } }, { type: 'massage_therapist', typeLabel: 'Massage Therapist' })
  assert.equal(r.mode, 'update')
  assert.deepEqual(r.changedFields, ['description', 'price'])
  assert.equal(r.pricing.previousPrice, 4000)
  assert.match(validateServiceDecision({ decision: 'request_changes', reason: 'Description unclear', providerMessage: 'x' }, { checklist: [], eligibility: r.eligibility }), /affected field/)
})

const req = (over = {}) => ({ originModule: 'verification', originRecordId: 'u1', providerId: 'u1', requestType: 'replacement_document', items: [{ label: 'Clear certificate copy', responseType: 'upload_document', required: true }], providerMessage: 'Please upload a clearer certificate copy.', channels: ['in_app'], dueAt: NOW + 86400000, ...over })

test('ADM-040: a request needs structured items, a required item and a future deadline', () => {
  assert.equal(validateRequest(req(), NOW), null)
  assert.match(validateRequest(req({ items: [] }), NOW), /at least one/)
  assert.match(validateRequest(req({ items: [{ label: 'x', required: false }] }), NOW), /required/)
  assert.match(validateRequest(req({ dueAt: NOW - 1 }), NOW), /future/)
  assert.match(validateRequest(req({ requestType: 'replacement_document', originModule: 'safety' }), NOW), /not available/)
})

test('ADM-040: partial responses and overdue are derived, never auto-completed', () => {
  const base = { status: 'sent', dueAt: NOW + 1000, items: [{ label: 'a', required: true, status: 'received' }, { label: 'b', required: true, status: 'awaiting' }] }
  assert.equal(deriveStatus(base, NOW), 'partially_responded')
  assert.equal(deriveStatus({ ...base, dueAt: NOW - 1 }, NOW), 'overdue')
  assert.equal(deriveStatus({ ...base, items: base.items.map((i) => ({ ...i, status: 'received' })) }, NOW), 'responded')
  assert.equal(deriveStatus({ ...base, items: [{ label: 'a', required: true, status: 'awaiting' }] }, NOW), 'waiting')
})

test('ADM-040: duplicate open requests are detected', () => {
  assert.equal(duplicateItems([{ label: 'Clear certificate copy' }], [{ requestId: 'R1', items: [{ label: 'clear certificate copy' }] }]).length, 1)
})
