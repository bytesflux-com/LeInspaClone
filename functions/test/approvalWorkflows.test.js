import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DECISION_TYPES,
  buildDecisionChain,
  buildEntry,
  contentDecisionType,
  effectsFor,
  evaluateVerificationReadiness,
  filterLedgerEntries,
  ledgerDecision,
  reasonsForDecisionType,
  rejectionImpactFor,
  summarizeLedger,
  templateForReason,
  validateRejection,
  validateVerificationDecision,
  verificationImpactFor,
} from '../src/decisionLedger.js'

test('ADM-041: validateRejection enforces reason, separate providerMessage and internalNote', () => {
  assert.equal(validateRejection({}), 'Select a rejection reason.')
  assert.match(
    validateRejection({ reasonCode: 'unsupported_claim', providerMessage: 'Too short', internalNote: 'Valid internal note' }),
    /at least 15 characters/,
  )
  assert.match(
    validateRejection({
      reasonCode: 'unsupported_claim',
      providerMessage: 'Your submission contains an unsupported medical claim that cannot be approved.',
      internalNote: 'short',
    }),
    /at least 10 characters/,
  )
  const sameText = 'Your submission contains an unsupported medical claim that cannot be approved.'
  assert.match(
    validateRejection({
      reasonCode: 'unsupported_claim',
      providerMessage: sameText,
      internalNote: sameText,
    }),
    /must be separate explanations/,
  )
  assert.equal(
    validateRejection({
      reasonCode: 'unsupported_claim',
      providerMessage: 'Your service description includes a medical claim that cannot be verified.',
      internalNote: 'Version 2 rejected for medical cure guarantee in description.',
    }),
    null,
  )
})

test('ADM-041: dynamic reasons and impact adapt to decisionType and update mode', () => {
  const serviceReasons = reasonsForDecisionType('service_information')
  assert.ok(serviceReasons.some((r) => r.code === 'unsupported_claim'))

  const galleryReasons = reasonsForDecisionType('gallery_media')
  assert.ok(galleryReasons.some((r) => r.code === 'unrelated_media'))

  const updateImpact = rejectionImpactFor('service_information', { isUpdate: true, allowResubmission: true })
  assert.ok(updateImpact.some((i) => i.text.includes('Current approved service version remains live')))

  const noResubmitImpact = rejectionImpactFor('service_information', { isUpdate: false, allowResubmission: false })
  assert.ok(noResubmitImpact.some((i) => i.text.includes('Resubmission is blocked')))

  const tpl = templateForReason('unsupported_claim')
  assert.ok(tpl.message.includes('medical claim'))
})

test('ADM-042: evaluateVerificationReadiness supports individual, spa, and hotel_resort categories', () => {
  const readyIndividual = {
    provider: { id: 'PR-82941', category: 'individual' },
    components: [
      { key: 'identity', status: 'approved' },
      { key: 'credentials', status: 'approved' },
      { key: 'profile_info', status: 'approved' },
      { key: 'market_documents', status: 'approved' },
    ],
    informationRequests: [{ requestId: 'REQ-1', status: 'completed', required: true }],
    escalations: [],
    issues: [{ issueId: 'ISS-1', severity: 'warning', resolved: true }],
  }
  const r1 = evaluateVerificationReadiness(readyIndividual)
  assert.equal(r1.ready, true)
  assert.equal(r1.counts.required, 4)
  assert.equal(r1.counts.approved, 4)
  assert.equal(validateVerificationDecision(readyIndividual, { decision: 'approve', note: 'All 4 components verified and resolved.' }), null)

  // Resolved concern requires final note on approval
  assert.match(
    validateVerificationDecision(readyIndividual, { decision: 'approve', note: '' }),
    /final verification note is required/,
  )

  // Blocked case with pending component and waiting info request
  const blockedCase = {
    provider: { id: 'PR-66310', category: 'individual' },
    components: [
      { key: 'identity', status: 'approved' },
      { key: 'credentials', status: 'changes_requested' },
      { key: 'profile_info', status: 'approved' },
      { key: 'market_documents', status: 'pending' },
    ],
    informationRequests: [{ requestId: 'REQ-2', status: 'waiting', required: true }],
  }
  const r2 = evaluateVerificationReadiness(blockedCase)
  assert.equal(r2.ready, false)
  assert.equal(r2.counts.approved, 2)
  assert.equal(r2.counts.outstandingRequests, 1)
  assert.match(validateVerificationDecision(blockedCase, { decision: 'approve' }), /Cannot approve verification yet/)

  // Hotel & Resort has 5 required components
  const hotelCase = {
    provider: { id: 'HTL-40771', category: 'hotel_resort' },
    components: [
      { key: 'representative_identity', status: 'approved' },
      { key: 'property_registration', status: 'approved' },
      { key: 'business_documents', status: 'approved' },
      { key: 'wellness_operations', status: 'approved' },
      { key: 'market_compliance', status: 'approved' },
    ],
  }
  const r3 = evaluateVerificationReadiness(hotelCase)
  assert.equal(r3.ready, true)
  assert.equal(r3.counts.required, 5)
  assert.equal(r3.counts.approved, 5)
})

test('ADM-043: buildEntry, summarizeLedger, filterLedgerEntries, and buildDecisionChain', () => {
  const e1 = {
    id: 'APR-100',
    decisionRef: 'APR-100',
    originModule: 'credentials',
    originRecordId: 'PR-82941',
    subjectKey: 'credentials:PR-82941',
    subjectName: 'Grace Njeri',
    providerName: 'Grace Njeri',
    providerCategory: 'individual',
    marketId: 'KE',
    decisionType: 'credentials',
    decision: 'changes_requested',
    reason: 'Blurry Document Image',
    reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng' },
    previousDecisionId: null,
    supersededByDecisionId: 'APR-200',
  }
  const e2 = {
    ...buildEntry({
      decisionId: 'APR-200',
      originModule: 'credentials',
      originRecordId: 'PR-82941',
      decisionType: contentDecisionType('other', false) === 'other' ? 'credentials' : 'other',
      decision: ledgerDecision('approve'),
      reason: 'Professional Certificate Verified',
      subject: { type: 'provider', name: 'Grace Njeri' },
      provider: { id: 'PR-82941', name: 'Grace Njeri', category: 'individual' },
      countryCode: 'KE',
      effects: effectsFor('credentials', 'approved'),
      actor: { id: 'adm-jane', name: 'Jane Ochieng' },
      access: { roleName: 'Verification Specialist', markets: ['KE'] },
      at: '2026-04-24T14:15:00.000Z',
      previousDecisionId: 'APR-100',
    }),
    id: 'APR-200',
  }

  const entries = [e2, e1]
  const summary = summarizeLedger(entries)
  assert.equal(summary.counts.total, 2)
  assert.equal(summary.counts.approved, 1)
  assert.equal(summary.counts.changes_requested, 1)
  assert.equal(summary.counts.superseded, 1)
  assert.equal(summary.byType.credentials, 2)
  assert.ok(DECISION_TYPES.credentials)

  const supersededOnly = filterLedgerEntries(entries, { status: 'superseded' })
  assert.equal(supersededOnly.length, 1)
  assert.equal(supersededOnly[0].id, 'APR-100')

  const chainMap = new Map(entries.map((x) => [x.id, x]))
  const chainFromLatest = buildDecisionChain('APR-200', chainMap)
  assert.equal(chainFromLatest.length, 2)
  assert.equal(chainFromLatest[0].id, 'APR-100')
  assert.equal(chainFromLatest[0].relation, 'previous')
  assert.equal(chainFromLatest[1].id, 'APR-200')
  assert.equal(chainFromLatest[1].relation, 'current')

  const impact = verificationImpactFor('approve')
  assert.ok(impact.length >= 4)
})

