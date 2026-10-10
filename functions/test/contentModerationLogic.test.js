import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  HOUR,
  buildQueue,
  buildReview,
  checklistFor,
  decideMedia,
  decideRecord,
  galleryOutcome,
  imageQuality,
  isOverdue,
  normalizeModeration,
  validateDecision,
} from '../src/contentModerationLogic.js'

const NOW = Date.parse('2026-09-12T09:00:00Z')
const at = (h) => new Date(NOW + h * HOUR).toISOString()
const rec = (id, over = {}) => normalizeModeration(id, { contentType: 'profile_photo', status: 'awaiting_review', priority: 'normal', countryCode: 'KE', providerName: 'Grace Njeri', providerType: 'massage_therapist', submittedAt: at(-2), ...over })
const allPass = (type, media = false) => Object.fromEntries(checklistFor(type, media).map((c) => [c.id, 'pass']))
const actor = { id: 'admin-1', name: 'Jane Ochieng' }

test('approval requires every policy check to pass', () => {
  const list = checklistFor('profile_photo')
  assert.match(validateDecision({ decision: 'approve', checks: {} }, list), /Every policy check/)
  assert.equal(validateDecision({ decision: 'approve', checks: allPass('profile_photo') }, list), null)
})

test('request changes needs a reason and a provider message', () => {
  const list = checklistFor('profile_photo')
  assert.match(validateDecision({ decision: 'request_changes' }, list), /reason/)
  assert.match(validateDecision({ decision: 'request_changes', reason: 'Poor crop' }, list), /provider/)
  assert.equal(validateDecision({ decision: 'request_changes', reason: 'Poor crop', providerMessage: 'Please re-crop.' }, list), null)
})

test('reject additionally requires an internal note', () => {
  const list = checklistFor('service')
  assert.match(validateDecision({ decision: 'reject', reason: 'Misleading', providerMessage: 'x' }, list), /internal/)
})

test('escalation needs a destination team', () => {
  assert.match(validateDecision({ decision: 'escalate', reason: 'Safety concern' }, []), /escalated to/)
  assert.equal(validateDecision({ decision: 'escalate', reason: 'Safety concern', escalateTo: 'trust_safety' }, []), null)
})

test('checklists change by content type', () => {
  assert.ok(checklistFor('profile_photo').some((c) => c.id === 'subject_visible'))
  assert.ok(checklistFor('service').some((c) => c.id === 'no_medical_claims'))
  assert.ok(checklistFor('gallery').some((c) => c.id === 'no_private'))
})

test('a decision records reviewer, keeps the version and only approval is public', () => {
  const r = rec('m1', { contentVersion: 2 })
  const { patch, history } = decideRecord(r, { decision: 'reject', reason: 'Offensive or prohibited imagery', providerMessage: 'x', internalNote: 'y' }, actor, NOW)
  assert.equal(patch.status, 'rejected')
  assert.equal(patch.publicEligible, false)
  assert.equal(patch.reviewedBy.name, 'Jane Ochieng')
  assert.equal(history.details.version, 2)
})

test('one rejected gallery image does not reject the others', () => {
  const g = rec('g1', { contentType: 'gallery', media: [{ mediaId: 'a', title: 'Sauna' }, { mediaId: 'b', title: 'Lounge', status: 'approved' }] })
  const { media } = decideMedia(g.media, 'a', { decision: 'reject', reason: 'Privacy violation' }, actor, NOW)
  assert.equal(media.find((m) => m.mediaId === 'a').status, 'rejected')
  assert.equal(media.find((m) => m.mediaId === 'b').status, 'approved')
})

test('gallery completes only when every item has a decision', () => {
  const g = rec('g2', { contentType: 'gallery', media: [{ mediaId: 'a', status: 'approved' }, { mediaId: 'b', status: 'awaiting_review' }] })
  assert.equal(galleryOutcome(g.media), null)
  const done = rec('g3', { contentType: 'gallery', media: [{ mediaId: 'a', status: 'approved' }, { mediaId: 'b', status: 'rejected' }] })
  const out = galleryOutcome(done.media)
  assert.equal(out.status, 'approved')
  assert.deepEqual(out.publishedMediaIds, ['a'])
})

test('overdue uses the priority target; escalated items are not overdue', () => {
  assert.equal(isOverdue(rec('o1', { priority: 'high', submittedAt: at(-13) }), NOW), true)
  assert.equal(isOverdue(rec('o2', { priority: 'normal', submittedAt: at(-13) }), NOW), false)
  assert.equal(isOverdue(rec('o3', { status: 'escalated', submittedAt: at(-100) }), NOW), false)
})

test('queue: counts, type tabs, and overdue/high priority first', () => {
  const records = [
    rec('a', { priority: 'normal', submittedAt: at(-1) }),
    rec('b', { contentType: 'gallery', priority: 'high', submittedAt: at(-20) }),
    rec('c', { status: 'resubmitted', submittedAt: at(-3) }),
    rec('d', { status: 'approved', reviewedAt: at(-1) }),
    rec('e', { status: 'escalated' }),
  ]
  const q = buildQueue(records, {}, { now: NOW })
  assert.equal(q.kpis.awaiting, 3)
  assert.equal(q.kpis.approvedToday, 1)
  assert.equal(q.attention.overdue, 1)
  assert.equal(q.attention.resubmitted, 1)
  assert.equal(q.items[0].id, 'b')
  assert.equal(q.tabs.find((t) => t.id === 'gallery').count, 1)
  assert.equal(buildQueue(records, { type: 'gallery' }, { now: NOW }).total, 1)
})

test('image quality is measured, not assumed', () => {
  const q = imageQuality({ width: 1200, height: 1200, sizeBytes: 2.4 * 1024 * 1024, format: 'JPG' }, 'profile_photo')
  assert.equal(q[0].state, 'good')
  assert.equal(q[1].value, '1:1')
  assert.equal(imageQuality({ width: 300, height: 200 }, 'gallery')[0].state, 'poor')
})

test('review exposes provider history as context and separates notes', () => {
  const review = buildReview(rec('r1'), { now: NOW, notes: [{ text: 'internal', createdAt: at(-1) }], providerStats: { approved: 42, changesRequested: 3, rejected: 1, escalated: 0 } })
  assert.equal(review.providerStats.approved, 42)
  assert.equal(review.notes[0].text, 'internal')
  assert.ok(review.checklist.length > 5)
})
