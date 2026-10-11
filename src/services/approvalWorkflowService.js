// ADM-041 Reject & Send Reason / Note · ADM-042 Verification Decision · ADM-043 Approval History.
//
// Calls the admin Cloud Functions (functions/src/approvalWorkflows.js):
//   adminGetRejectionWorkspace, adminSubmitRejection,
//   adminGetVerificationDecision, adminSubmitVerificationDecision,
//   adminListApprovalDecisions, adminGetApprovalDecision, adminExportApprovalHistory
// When VITE_USE_MOCK_CONTENT=true, runs an in-memory store backed by the exact
// same pure domain logic from functions/src/decisionLedger.js.

import { callAdmin } from '../lib/adminCall'
import {
  DECISION_TYPES,
  REJECTION_TEMPLATES,
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
} from '../../functions/src/decisionLedger.js'
import { CONTENT_TYPES, MARKET_META, normalizeModeration } from '../../functions/src/contentModerationLogic.js'
import { contentStore } from './mock/contentModerationMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_CONTENT === 'true'
const delay = (ms = 160) => new Promise((r) => setTimeout(r, ms))
const fail = (m) => {
  throw new Error(m)
}

const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const IMG = (name) => `/demo/content/${name}.jpg`

const MOCK_ACTOR = { id: 'adm-jane', name: 'Jane Ochieng' }
const MOCK_ACCESS = {
  roleId: 'verification_specialist',
  roleName: 'Verification Specialist',
  markets: ['KE', 'UG', 'TZ', 'RW', 'ZA'],
}

// ---------------------------------------------------------------------------
// Seeded Verification Cases for ADM-042 (Individual, Spa, Hotel & Resort, Blocked)
// ---------------------------------------------------------------------------

let verCasesStore = null

function seedVerificationCases() {
  if (verCasesStore) return verCasesStore
  verCasesStore = new Map([
    [
      'PR-82941',
      {
        verificationId: 'PR-82941',
        caseId: 'VER-82941',
        version: 2,
        status: 'under_review',
        riskBadge: 'normal',
        submittedAt: '2026-04-24T12:15:00.000Z',
        assignedTo: { id: 'adm-jane', name: 'Jane Ochieng', role: 'Verification Specialist' },
        countryCode: 'KE',
        marketName: 'Kenya',
        city: 'Nairobi',
        provider: {
          id: 'PR-82941',
          ref: 'PR-82941',
          name: 'Grace Njeri',
          category: 'individual',
          categoryLabel: 'Individual Provider',
          typeLabel: 'Massage Therapist',
          photoUrl: IMG('grace-njeri'),
          city: 'Nairobi',
          countryCode: 'KE',
          verified: false,
          accountStatus: 'active',
        },
        components: [
          {
            key: 'identity',
            label: 'Identity Verification',
            adm: 'ADM-032',
            route: '/verifications?case=PR-82941&tab=identity',
            required: true,
            status: 'approved',
            reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng' },
            reviewedAt: '2026-04-24T11:20:00.000Z',
            note: 'National ID matches provider profile and selfie check.',
          },
          {
            key: 'credentials',
            label: 'Professional Credentials',
            adm: 'ADM-033',
            route: '/verifications?case=PR-82941&tab=credentials',
            required: true,
            status: 'approved',
            reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng' },
            reviewedAt: '2026-04-24T14:15:00.000Z',
            note: 'Resubmitted certificate (Version 2) verified with Kenya Holistic Therapy Association.',
          },
          {
            key: 'profile_info',
            label: 'Profile Information',
            adm: 'ADM-038',
            route: '/content-approval/profile-changes/CNT-83110',
            required: true,
            status: 'approved',
            reviewedBy: { id: 'adm-peter', name: 'Peter Maina' },
            reviewedAt: '2026-04-23T16:40:00.000Z',
            note: 'Bio, display name, and languages meet marketplace guidelines.',
          },
          {
            key: 'market_documents',
            label: 'Required Market Documents',
            adm: 'ADM-034',
            route: '/verifications?case=PR-82941&tab=documents',
            required: true,
            status: 'approved',
            reviewedBy: { id: 'adm-peter', name: 'Peter Maina' },
            reviewedAt: '2026-04-23T15:10:00.000Z',
            note: 'KRA Tax Compliance Certificate valid through Dec 2026.',
          },
        ],
        evidence: [
          {
            evidenceId: 'EV-82941-1',
            title: 'National ID Card',
            subtitle: 'Government-Issued ID · Kenya',
            version: 1,
            status: 'approved',
            thumbnailUrl: IMG('grace-njeri'),
            reviewedBy: 'Jane Ochieng',
            reviewedAt: '2026-04-24T11:20:00.000Z',
          },
          {
            evidenceId: 'EV-82941-2',
            title: 'Professional Certificate',
            subtitle: 'Holistic Massage Therapy Diploma (HTA-7281)',
            version: 2,
            status: 'approved',
            thumbnailUrl: IMG('spa-products'),
            reviewedBy: 'Jane Ochieng',
            reviewedAt: '2026-04-24T14:15:00.000Z',
          },
          {
            evidenceId: 'EV-82941-3',
            title: 'Profile Photo',
            subtitle: 'Professional Headshot · 1200×1200 JPG',
            version: 2,
            status: 'approved',
            thumbnailUrl: IMG('grace-njeri'),
            reviewedBy: 'Peter Maina',
            reviewedAt: '2026-04-23T16:40:00.000Z',
          },
          {
            evidenceId: 'EV-82941-4',
            title: 'Tax Compliance Certificate',
            subtitle: 'Kenya Revenue Authority · Valid',
            version: 1,
            status: 'approved',
            thumbnailUrl: IMG('aromatherapy'),
            reviewedBy: 'Peter Maina',
            reviewedAt: '2026-04-23T15:10:00.000Z',
          },
        ],
        informationRequests: [
          {
            requestId: 'REQ-82941',
            title: 'Clearer certificate image',
            status: 'completed',
            required: true,
            sentAt: '2026-04-22T15:10:00.000Z',
            respondedAt: '2026-04-24T11:45:00.000Z',
            sentBy: 'Jane Ochieng',
          },
        ],
        escalations: [],
        issues: [
          {
            issueId: 'ISS-1',
            text: 'Professional certificate image was blurry in Version 1 (resolved in Version 2)',
            severity: 'warning',
            resolved: true,
          },
        ],
        history: [
          { event: 'Verification submitted', at: '2026-04-22T10:15:00.000Z', actor: { name: 'Grace Njeri' } },
          { event: 'Assigned to Jane Ochieng', at: '2026-04-22T11:00:00.000Z', actor: { name: 'System' } },
          { event: 'Information requested (Professional Certificate)', at: '2026-04-22T15:10:00.000Z', actor: { name: 'Jane Ochieng' } },
          { event: 'Provider submitted updated certificate (Version 2)', at: '2026-04-24T11:45:00.000Z', actor: { name: 'Grace Njeri' } },
          { event: 'All components approved', at: '2026-04-24T14:15:00.000Z', actor: { name: 'Jane Ochieng' } },
        ],
        notes: [
          {
            noteId: 'N-1',
            authorName: 'Jane Ochieng',
            authorRole: 'Verification Specialist',
            createdAt: '2026-04-24T14:18:00.000Z',
            text: 'All verification requirements satisfied. Updated certificate is clear and valid. Ready for final approval.',
          },
        ],
        lastDecisionId: 'APR-82941',
      },
    ],
    [
      'SPA-28192',
      {
        verificationId: 'SPA-28192',
        caseId: 'VER-28192',
        version: 1,
        status: 'under_review',
        riskBadge: 'normal',
        submittedAt: '2026-04-23T09:30:00.000Z',
        assignedTo: { id: 'adm-jane', name: 'Jane Ochieng', role: 'Verification Specialist' },
        countryCode: 'KE',
        marketName: 'Kenya',
        city: 'Westlands, Nairobi',
        provider: {
          id: 'SPA-28192',
          ref: 'SPA-28192',
          name: 'Serenity Wellness Spa',
          category: 'spa',
          categoryLabel: 'Spa & Wellness Center',
          typeLabel: 'Day Spa & Wellness Center',
          photoUrl: IMG('wellness-lounge'),
          city: 'Westlands, Nairobi',
          countryCode: 'KE',
          verified: false,
          accountStatus: 'active',
        },
        components: [
          {
            key: 'representative_identity',
            label: 'Representative Identity',
            adm: 'ADM-032',
            route: '/verifications?case=SPA-28192&tab=identity',
            required: true,
            status: 'approved',
            reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng' },
            reviewedAt: '2026-04-23T14:10:00.000Z',
            note: 'Director national ID and letter of authorization verified.',
          },
          {
            key: 'business_registration',
            label: 'Business Registration',
            adm: 'ADM-034',
            route: '/verifications?case=SPA-28192&tab=business',
            required: true,
            status: 'approved',
            reviewedBy: { id: 'adm-peter', name: 'Peter Maina' },
            reviewedAt: '2026-04-24T09:50:00.000Z',
            note: 'Certificate of Incorporation PVT-2021-88412 verified.',
          },
          {
            key: 'business_documents',
            label: 'Required Business Documents',
            adm: 'ADM-034',
            route: '/verifications?case=SPA-28192&tab=documents',
            required: true,
            status: 'approved',
            reviewedBy: { id: 'adm-peter', name: 'Peter Maina' },
            reviewedAt: '2026-04-24T13:20:00.000Z',
            note: 'County Single Business Permit & Public Health License verified.',
          },
          {
            key: 'business_info',
            label: 'Business Information',
            adm: 'ADM-038',
            route: '/content-approval/business',
            required: true,
            status: 'approved',
            reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng' },
            reviewedAt: '2026-04-24T13:45:00.000Z',
            note: 'Westlands branch address, operating hours, and facility list confirmed.',
          },
        ],
        evidence: [
          { evidenceId: 'EV-28192-1', title: 'Director National ID', subtitle: 'Authorized Representative', version: 1, status: 'approved', thumbnailUrl: IMG('grace-njeri'), reviewedBy: 'Jane Ochieng' },
          { evidenceId: 'EV-28192-2', title: 'Certificate of Incorporation', subtitle: 'Business Registration · Kenya', version: 1, status: 'approved', thumbnailUrl: IMG('wellness-lounge'), reviewedBy: 'Peter Maina' },
          { evidenceId: 'EV-28192-3', title: 'County Health & Trade Permit', subtitle: 'Nairobi City County · 2026', version: 2, status: 'approved', thumbnailUrl: IMG('massage-room'), reviewedBy: 'Peter Maina' },
          { evidenceId: 'EV-28192-4', title: 'Facility Insurance Certificate', subtitle: 'Public Liability Cover', version: 1, status: 'approved', thumbnailUrl: IMG('sauna'), reviewedBy: 'Jane Ochieng' },
        ],
        informationRequests: [],
        escalations: [],
        issues: [],
        history: [
          { event: 'Business verification pack submitted', at: '2026-04-23T09:30:00.000Z', actor: { name: 'Serenity Wellness Spa' } },
          { event: 'All 4 business verification components approved', at: '2026-04-24T13:45:00.000Z', actor: { name: 'Jane Ochieng' } },
        ],
        notes: [
          {
            noteId: 'N-SPA-1',
            authorName: 'Peter Maina',
            authorRole: 'Compliance Reviewer',
            createdAt: '2026-04-24T13:50:00.000Z',
            text: 'Corporate registration, county permit, and representative identity match across all submitted documents.',
          },
        ],
        lastDecisionId: 'APR-72819',
      },
    ],
    [
      'HTL-40771',
      {
        verificationId: 'HTL-40771',
        caseId: 'VER-40771',
        version: 1,
        status: 'under_review',
        riskBadge: 'normal',
        submittedAt: '2026-04-21T08:00:00.000Z',
        assignedTo: { id: 'adm-aisha', name: 'Aisha Noor', role: 'Senior Verification Lead' },
        countryCode: 'KE',
        marketName: 'Kenya',
        city: 'Naivasha',
        provider: {
          id: 'HTL-40771',
          ref: 'HTL-40771',
          name: 'Savanna Wellness Resort',
          category: 'hotel_resort',
          categoryLabel: 'Hotel & Wellness Resort',
          typeLabel: 'Luxury Hotel & Spa Resort',
          photoUrl: IMG('resort-pool'),
          city: 'Naivasha',
          countryCode: 'KE',
          verified: false,
          accountStatus: 'active',
        },
        components: [
          { key: 'representative_identity', label: 'Authorized Representative', adm: 'ADM-032', route: '/verifications?case=HTL-40771', required: true, status: 'approved', reviewedBy: { id: 'adm-aisha', name: 'Aisha Noor' }, reviewedAt: '2026-04-22T10:00:00.000Z', note: 'GM passport & board resolution verified.' },
          { key: 'property_registration', label: 'Property / Business Registration', adm: 'ADM-034', route: '/verifications?case=HTL-40771', required: true, status: 'approved', reviewedBy: { id: 'adm-aisha', name: 'Aisha Noor' }, reviewedAt: '2026-04-22T11:30:00.000Z', note: 'Hospitality group registration verified.' },
          { key: 'business_documents', label: 'Required Business Documents', adm: 'ADM-034', route: '/verifications?case=HTL-40771', required: true, status: 'approved', reviewedBy: { id: 'adm-peter', name: 'Peter Maina' }, reviewedAt: '2026-04-23T09:15:00.000Z', note: 'Tourism Regulatory Authority license valid.' },
          { key: 'wellness_operations', label: 'Property / Wellness Operation Information', adm: 'ADM-038', route: '/content-approval/business', required: true, status: 'approved', reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng' }, reviewedAt: '2026-04-23T14:00:00.000Z', note: 'Wellness Pavilion & hydrotherapy wing details verified.' },
          { key: 'market_compliance', label: 'Market-Specific Requirements', adm: 'ADM-034', route: '/verifications?case=HTL-40771', required: true, status: 'approved', reviewedBy: { id: 'adm-aisha', name: 'Aisha Noor' }, reviewedAt: '2026-04-24T10:00:00.000Z', note: 'TRA Class A Hospitality & Spa Safety certificate verified.' },
        ],
        evidence: [
          { evidenceId: 'EV-40771-1', title: 'Authorized Representative ID', subtitle: 'General Manager Authorization', version: 1, status: 'approved', thumbnailUrl: IMG('suite'), reviewedBy: 'Aisha Noor' },
          { evidenceId: 'EV-40771-2', title: 'Tourism Regulatory Authority License', subtitle: 'TRA Hospitality & Spa · Kenya', version: 1, status: 'approved', thumbnailUrl: IMG('resort-pool'), reviewedBy: 'Peter Maina' },
          { evidenceId: 'EV-40771-3', title: 'Wellness Pavilion Operating Permit', subtitle: 'Public Health & Hydrotherapy Safety', version: 1, status: 'approved', thumbnailUrl: IMG('treatment-suite'), reviewedBy: 'Jane Ochieng' },
          { evidenceId: 'EV-40771-4', title: 'Comprehensive Resort Liability Policy', subtitle: 'Hospitality Insurance · Valid', version: 1, status: 'approved', thumbnailUrl: IMG('hotel-room'), reviewedBy: 'Aisha Noor' },
        ],
        informationRequests: [],
        escalations: [],
        issues: [],
        history: [
          { event: 'Hotel & Wellness Resort verification submitted', at: '2026-04-21T08:00:00.000Z', actor: { name: 'Savanna Wellness Resort' } },
          { event: 'All 5 hospitality & wellness requirements approved', at: '2026-04-24T10:00:00.000Z', actor: { name: 'Aisha Noor' } },
        ],
        notes: [
          {
            noteId: 'N-HTL-1',
            authorName: 'Aisha Noor',
            authorRole: 'Senior Verification Lead',
            createdAt: '2026-04-24T10:15:00.000Z',
            text: 'All 5 hospitality and wellness operation checks passed. Ready for final resort verification.',
          },
        ],
        lastDecisionId: null,
      },
    ],
    [
      'PR-66310',
      {
        verificationId: 'PR-66310',
        caseId: 'VER-66310',
        version: 1,
        status: 'more_information_needed',
        riskBadge: 'attention',
        submittedAt: '2026-04-22T09:00:00.000Z',
        assignedTo: { id: 'adm-jane', name: 'Jane Ochieng', role: 'Verification Specialist' },
        countryCode: 'KE',
        marketName: 'Kenya',
        city: 'Westlands, Nairobi',
        provider: {
          id: 'PR-66310',
          ref: 'PR-66310',
          name: 'Brian Otieno',
          category: 'individual',
          categoryLabel: 'Individual Provider',
          typeLabel: 'Fitness Trainer',
          photoUrl: IMG('brian-otieno'),
          city: 'Westlands, Nairobi',
          countryCode: 'KE',
          verified: false,
          accountStatus: 'active',
        },
        components: [
          { key: 'identity', label: 'Identity Verification', adm: 'ADM-032', route: '/verifications?case=PR-66310', required: true, status: 'approved', reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng' }, reviewedAt: '2026-04-22T13:00:00.000Z', note: 'National ID verified.' },
          { key: 'credentials', label: 'Professional Credentials', adm: 'ADM-033', route: '/verifications?case=PR-66310', required: true, status: 'changes_requested', reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng' }, reviewedAt: '2026-04-23T11:20:00.000Z', note: 'Submitted certificate is cropped and missing accreditation number.' },
          { key: 'profile_info', label: 'Profile Information', adm: 'ADM-038', route: '/content-approval/profile-changes', required: true, status: 'approved', reviewedBy: { id: 'adm-peter', name: 'Peter Maina' }, reviewedAt: '2026-04-22T14:00:00.000Z', note: 'Profile bio approved.' },
          { key: 'market_documents', label: 'Required Market Documents', adm: 'ADM-034', route: '/verifications?case=PR-66310', required: true, status: 'pending', reviewedBy: null, reviewedAt: null, note: 'Awaiting tax compliance upload.' },
        ],
        evidence: [
          { evidenceId: 'EV-66310-1', title: 'National ID Card', subtitle: 'Government-Issued ID · Kenya', version: 1, status: 'approved', thumbnailUrl: IMG('brian-otieno'), reviewedBy: 'Jane Ochieng' },
          { evidenceId: 'EV-66310-2', title: 'Fitness Trainer Certificate', subtitle: 'Missing accreditation seal', version: 1, status: 'changes_requested', thumbnailUrl: IMG('fitness'), reviewedBy: 'Jane Ochieng' },
        ],
        informationRequests: [
          {
            requestId: 'REQ-66310',
            title: 'Uncropped accredited fitness certificate & KRA PIN',
            status: 'waiting',
            required: true,
            sentAt: '2026-04-23T11:25:00.000Z',
            dueAt: '2026-04-26T23:59:00.000Z',
            sentBy: 'Jane Ochieng',
          },
        ],
        escalations: [],
        issues: [
          {
            issueId: 'ISS-66310-1',
            text: 'Professional Credentials component has Changes Requested and awaits provider response.',
            severity: 'blocker',
            resolved: false,
          },
        ],
        history: [
          { event: 'Verification submitted', at: '2026-04-22T09:00:00.000Z', actor: { name: 'Brian Otieno' } },
          { event: 'Information requested (REQ-66310)', at: '2026-04-23T11:25:00.000Z', actor: { name: 'Jane Ochieng' } },
        ],
        notes: [
          {
            noteId: 'N-66310-1',
            authorName: 'Jane Ochieng',
            authorRole: 'Verification Specialist',
            createdAt: '2026-04-23T11:26:00.000Z',
            text: 'Cannot approve final verification until uncropped certificate and market tax document are received.',
          },
        ],
        lastDecisionId: null,
      },
    ],
  ])
  return verCasesStore
}

// ---------------------------------------------------------------------------
// Seeded Approval History Ledger (`approval_decisions`) for ADM-043
// Matches `mockup_2.jpg` row-for-row + linked chains + extra history records
// ---------------------------------------------------------------------------

let ledgerStoreMap = null

function seedLedger() {
  if (ledgerStoreMap) return ledgerStoreMap
  const rows = [
    // 1. APR-82941 — Grace Njeri · Credentials · Approved · Version 2 (linked to previous APR-81102)
    {
      id: 'APR-82941',
      decisionRef: 'APR-82941',
      originModule: 'credentials',
      originRecordId: 'PR-82941',
      targetId: 'CRED-82941',
      subjectKey: 'credentials:PR-82941',
      subjectType: 'provider',
      subjectName: 'Grace Njeri',
      subjectSubtitle: 'Massage Therapist',
      subjectImage: IMG('grace-njeri'),
      providerId: 'PR-82941',
      providerRef: 'PR-82941',
      providerName: 'Grace Njeri',
      providerType: 'Massage Therapist',
      providerCategory: 'individual',
      marketId: 'KE',
      marketName: 'Nairobi, Kenya',
      decisionType: 'credentials',
      decision: 'approved',
      reason: 'Professional Certificate Verified',
      providerMessage: 'Your updated Professional Certificate (Version 2) has been verified and approved. Your credential requirement is now satisfied.',
      internalNote: 'Certificate clear and valid. Verified registration number HTA-7281 with Kenya Holistic Therapy Association.',
      version: 'Version 2',
      evidenceRefs: [
        { label: 'Professional Certificate (Version 2)', version: 2, status: 'approved', previewUrl: IMG('spa-products') },
        { label: 'Supporting Qualification Document', version: 1, status: 'approved', previewUrl: IMG('aromatherapy') },
      ],
      effects: [
        'Credential requirement satisfied',
        'Verification progress updated (4 of 4 Complete)',
        'Provider became eligible for final verification decision (ADM-042)',
      ],
      previousDecisionId: 'APR-81102',
      supersededByDecisionId: null,
      reopenedFromDecisionId: null,
      relatedReviewId: 'CRED-82941',
      relatedInfoRequestId: 'REQ-82941',
      routes: {
        original: '/verifications/PR-82941/decision',
        provider: '/providers/PR-82941',
        infoRequest: '/information-requests/REQ-82941',
      },
      reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng', avatarUrl: IMG('grace-njeri') },
      reviewerRoleSnapshot: 'Verification Specialist',
      reviewerMarketSnapshot: ['KE', 'UG', 'TZ'],
      reviewedAt: '2026-04-24T14:15:00.000Z',
      createdAt: '2026-04-24T14:15:00.000Z',
      auditId: 'AUD-992841',
    },
    // 2. APR-72819 — Serenity Wellness Spa · Business Documents · Changes Requested · Version 1
    {
      id: 'APR-72819',
      decisionRef: 'APR-72819',
      originModule: 'business_documents',
      originRecordId: 'SPA-28192',
      targetId: 'DOC-72819',
      subjectKey: 'business_documents:SPA-28192',
      subjectType: 'business',
      subjectName: 'Serenity Wellness Spa',
      subjectSubtitle: 'Spa · Nairobi',
      subjectImage: IMG('wellness-lounge'),
      providerId: 'SPA-28192',
      providerRef: 'SPA-28192',
      providerName: 'Serenity Wellness Spa',
      providerType: 'Spa & Wellness Center',
      providerCategory: 'spa',
      marketId: 'KE',
      marketName: 'Nairobi, Kenya',
      decisionType: 'business_documents',
      decision: 'changes_requested',
      reason: 'Missing Business Permit Page',
      providerMessage: 'Please upload the full two-page Nairobi County Single Business Permit including the renewal stamp on page 2.',
      internalNote: 'Page 1 of permit looks valid, but renewal endorsement page was omitted.',
      version: 'Version 1',
      evidenceRefs: [
        { label: 'County Single Business Permit (Page 1)', version: 1, status: 'changes_requested', previewUrl: IMG('wellness-lounge') },
      ],
      effects: [
        'Provider asked to upload complete permit document',
        'Business verification remains in progress until resubmitted',
      ],
      previousDecisionId: null,
      supersededByDecisionId: null,
      reopenedFromDecisionId: null,
      relatedReviewId: 'VER-28192',
      routes: {
        original: '/verifications/SPA-28192/decision',
        provider: '/providers/SPA-28192',
      },
      reviewedBy: { id: 'adm-peter', name: 'Peter Maina', avatarUrl: IMG('peter-kamau') },
      reviewerRoleSnapshot: 'Compliance Reviewer',
      reviewerMarketSnapshot: ['KE'],
      reviewedAt: '2026-04-24T13:20:00.000Z',
      createdAt: '2026-04-24T13:20:00.000Z',
      auditId: 'AUD-992710',
    },
    // 3. APR-62811 — Deep Tissue Massage (Grace Njeri) · Service Information · Approved · Version 2
    {
      id: 'APR-62811',
      decisionRef: 'APR-62811',
      originModule: 'service',
      originRecordId: 'CNT-48291',
      targetId: 'SRV-48291',
      subjectKey: 'service:CNT-48291',
      subjectType: 'service',
      subjectName: 'Deep Tissue Massage',
      subjectSubtitle: 'Grace Njeri',
      subjectImage: IMG('massage-oil'),
      providerId: 'PR-82941',
      providerRef: 'PR-82941',
      providerName: 'Grace Njeri',
      providerType: 'Massage Therapist',
      providerCategory: 'individual',
      marketId: 'KE',
      marketName: 'Nairobi, Kenya',
      decisionType: 'service_information',
      decision: 'approved',
      reason: 'Service Update Approved',
      providerMessage: 'Your updated Deep Tissue Massage service listing (Version 2) has been approved and published.',
      internalNote: 'Duration and description update aligned with Massage Therapist category. Pricing within normal Nairobi band.',
      version: 'Version 2',
      evidenceRefs: [
        { label: 'Deep Tissue Massage Listing (Version 2)', version: 2, status: 'approved', previewUrl: IMG('massage-oil') },
      ],
      effects: [
        'Approved version replaces the live service',
        'Marketplace listing updated across Search and Provider Profile',
      ],
      previousDecisionId: null,
      supersededByDecisionId: null,
      reopenedFromDecisionId: null,
      relatedReviewId: 'CNT-48291',
      routes: {
        original: '/content-approval/services/CNT-48291',
        provider: '/providers/PR-82941',
      },
      reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng', avatarUrl: IMG('grace-njeri') },
      reviewerRoleSnapshot: 'Verification Specialist',
      reviewerMarketSnapshot: ['KE', 'UG', 'TZ'],
      reviewedAt: '2026-04-24T12:05:00.000Z',
      createdAt: '2026-04-24T12:05:00.000Z',
      auditId: 'AUD-992605',
    },
    // 4. APR-51892 — Steam Room Image (Serenity Wellness Spa) · Gallery & Media · Rejected · Image #8
    {
      id: 'APR-51892',
      decisionRef: 'APR-51892',
      originModule: 'gallery',
      originRecordId: 'CNT-72819',
      targetId: 'MED-82937',
      subjectKey: 'gallery:CNT-72819:MED-82937',
      subjectType: 'media',
      subjectName: 'Steam Room Image',
      subjectSubtitle: 'Serenity Wellness Spa',
      subjectImage: IMG('unrelated-clinic'),
      providerId: 'SPA-28192',
      providerRef: 'SPA-28192',
      providerName: 'Serenity Wellness Spa',
      providerType: 'Spa & Wellness Center',
      providerCategory: 'spa',
      marketId: 'KE',
      marketName: 'Nairobi, Kenya',
      decisionType: 'gallery_media',
      decision: 'rejected',
      reason: 'Unrelated Media',
      providerMessage: 'Image #8 (Steam Room) could not be approved because it depicts an unrelated clinical dental room rather than a spa steam facility.',
      internalNote: 'Stock/unrelated clinic photo uploaded in slot #8. Other gallery photos are genuine.',
      version: 'Image #8',
      evidenceRefs: [
        { label: 'Steam Room Image (MED-82937)', version: 1, status: 'rejected', previewUrl: IMG('unrelated-clinic') },
      ],
      effects: [
        'Selected media item remains unpublished',
        'Other approved gallery images remain unaffected',
        'Provider account remains active',
      ],
      previousDecisionId: null,
      supersededByDecisionId: null,
      reopenedFromDecisionId: null,
      relatedReviewId: 'CNT-72819',
      routes: {
        original: '/content-approval/gallery/CNT-72819',
        provider: '/providers/SPA-28192',
      },
      reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng', avatarUrl: IMG('grace-njeri') },
      reviewerRoleSnapshot: 'Verification Specialist',
      reviewerMarketSnapshot: ['KE', 'UG', 'TZ'],
      reviewedAt: '2026-04-24T11:30:00.000Z',
      createdAt: '2026-04-24T11:30:00.000Z',
      auditId: 'AUD-992512',
    },
    // 5. APR-41876 — Zenith Fitness · Business Documents · Escalated · Version 1
    {
      id: 'APR-41876',
      decisionRef: 'APR-41876',
      originModule: 'business_documents',
      originRecordId: 'SPA-41876',
      targetId: 'DOC-41876',
      subjectKey: 'business_documents:SPA-41876',
      subjectType: 'business',
      subjectName: 'Zenith Fitness',
      subjectSubtitle: 'Wellness Center',
      subjectImage: IMG('fitness'),
      providerId: 'SPA-41876',
      providerRef: 'SPA-41876',
      providerName: 'Zenith Fitness',
      providerType: 'Wellness Center',
      providerCategory: 'spa',
      marketId: 'KE',
      marketName: 'Mombasa, Kenya',
      decisionType: 'business_documents',
      decision: 'escalated',
      reason: 'Ownership Discrepancy',
      providerMessage: 'Your business verification documents are undergoing secondary compliance review by our specialist team.',
      internalNote: 'Escalated to Compliance / Legal Review: beneficial ownership on CR12 differs from representative declaration.',
      version: 'Version 1',
      evidenceRefs: [
        { label: 'CR12 Company Registry Extract', version: 1, status: 'escalated', previewUrl: IMG('fitness') },
      ],
      effects: [
        'Sent for specialist compliance review',
        'Case paused in standard verification queue',
        'Provider account not suspended',
      ],
      previousDecisionId: null,
      supersededByDecisionId: null,
      reopenedFromDecisionId: null,
      relatedReviewId: 'VER-41876',
      routes: {
        original: '/verifications/PR-82941/decision',
        provider: '/providers/PR-66310',
      },
      reviewedBy: { id: 'adm-david', name: 'David Mwangi', avatarUrl: IMG('daniel-okoth') },
      reviewerRoleSnapshot: 'Senior Compliance Analyst',
      reviewerMarketSnapshot: ['KE', 'TZ'],
      reviewedAt: '2026-04-23T17:50:00.000Z',
      createdAt: '2026-04-23T17:50:00.000Z',
      auditId: 'AUD-991982',
    },
    // 6. APR-31765 — Elite Hotel & Resort · Verification · Approved · Case #31765
    {
      id: 'APR-31765',
      decisionRef: 'APR-31765',
      originModule: 'verification',
      originRecordId: 'HTL-40771',
      targetId: null,
      subjectKey: 'verification:HTL-31765',
      subjectType: 'hotel_resort',
      subjectName: 'Elite Hotel & Resort',
      subjectSubtitle: 'Hotel · Mombasa',
      subjectImage: IMG('resort-pool'),
      providerId: 'HTL-40771',
      providerRef: 'HTL-31765',
      providerName: 'Elite Hotel & Resort',
      providerType: 'Hotel & Wellness Resort',
      providerCategory: 'hotel_resort',
      marketId: 'KE',
      marketName: 'Mombasa, Kenya',
      decisionType: 'verification',
      decision: 'approved',
      reason: 'All Requirements Met',
      providerMessage: 'Congratulations! Elite Hotel & Resort has passed final verification on Lé Inspa and received the Verified badge.',
      internalNote: 'All 5 hotel & resort verification components approved. TRA license and wellness liability insurance verified.',
      version: 'Case #31765',
      evidenceRefs: [
        { label: 'Hospitality Registration & TRA Permit', version: 1, status: 'approved', previewUrl: IMG('resort-pool') },
        { label: 'Authorized Representative ID', version: 1, status: 'approved', previewUrl: IMG('suite') },
      ],
      effects: [
        'Verification status → Verified',
        'Verified badge awarded',
        'Provider discovery eligibility enabled across Kenya market',
      ],
      previousDecisionId: null,
      supersededByDecisionId: null,
      reopenedFromDecisionId: null,
      relatedReviewId: 'VER-31765',
      routes: {
        original: '/verifications/HTL-40771/decision',
        provider: '/providers/HTL-40771',
      },
      reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng', avatarUrl: IMG('grace-njeri') },
      reviewerRoleSnapshot: 'Verification Specialist',
      reviewerMarketSnapshot: ['KE', 'UG', 'TZ'],
      reviewedAt: '2026-04-23T16:10:00.000Z',
      createdAt: '2026-04-23T16:10:00.000Z',
      auditId: 'AUD-991844',
    },
    // 7. APR-21654 — Sarah Akinyi · Credentials · Rejected (Superseded by APR-90127) · Version 1
    {
      id: 'APR-21654',
      decisionRef: 'APR-21654',
      originModule: 'credentials',
      originRecordId: 'PR-22140',
      targetId: 'CRED-21654',
      subjectKey: 'credentials:PR-22140',
      subjectType: 'provider',
      subjectName: 'Sarah Akinyi',
      subjectSubtitle: 'Beautician',
      subjectImage: IMG('joy-akinyi'),
      providerId: 'PR-22140',
      providerRef: 'PR-22140',
      providerName: 'Sarah Akinyi',
      providerType: 'Beautician',
      providerCategory: 'individual',
      marketId: 'KE',
      marketName: 'Kisumu, Kenya',
      decisionType: 'credentials',
      decision: 'rejected',
      reason: 'Expired Certificate',
      providerMessage: 'Your submitted beauty therapy practicing certificate expired in December 2024. Please submit your current renewed practicing certificate.',
      internalNote: 'Version 1 certificate expired. Superseded after provider uploaded renewed 2026 certificate in Version 2 (APR-90127).',
      version: 'Version 1',
      evidenceRefs: [
        { label: 'Beauty Therapy Certificate (2024 Expired)', version: 1, status: 'rejected', previewUrl: IMG('facial') },
      ],
      effects: [
        'Credential requirement remained unsatisfied at Version 1',
        'Later superseded by APR-90127 (Version 2 Approved)',
      ],
      previousDecisionId: null,
      supersededByDecisionId: 'APR-90127',
      reopenedFromDecisionId: null,
      relatedReviewId: 'CRED-21654',
      routes: {
        original: '/verifications/PR-82941/decision',
        provider: '/providers/PR-22140',
      },
      reviewedBy: { id: 'adm-peter', name: 'Peter Maina', avatarUrl: IMG('peter-kamau') },
      reviewerRoleSnapshot: 'Compliance Reviewer',
      reviewerMarketSnapshot: ['KE'],
      reviewedAt: '2026-04-22T15:40:00.000Z',
      createdAt: '2026-04-22T15:40:00.000Z',
      auditId: 'AUD-991204',
    },
    // 8. APR-11543 — Relaxation Package (Lotus Wellness Spa) · Service Information · Reopened · Version 1
    {
      id: 'APR-11543',
      decisionRef: 'APR-11543',
      originModule: 'service',
      originRecordId: 'CNT-62811',
      targetId: 'SRV-62811',
      subjectKey: 'service:CNT-62811',
      subjectType: 'service',
      subjectName: 'Relaxation Package',
      subjectSubtitle: 'Lotus Wellness Spa',
      subjectImage: IMG('spa-treatment'),
      providerId: 'HTL-61890',
      providerRef: 'HTL-61890',
      providerName: 'Lotus Wellness Spa',
      providerType: 'Spa & Wellness Center',
      providerCategory: 'spa',
      marketId: 'KE',
      marketName: 'Nairobi, Kenya',
      decisionType: 'service_information',
      decision: 'reopened',
      reason: 'Pricing Update Review',
      providerMessage: 'Your Relaxation Package submission has been reopened for updated package pricing review.',
      internalNote: 'Reopened to verify bundled pricing breakdown after provider updated seasonal resort rates.',
      version: 'Version 1',
      evidenceRefs: [
        { label: 'Relaxation Package Pricing Sheet', version: 1, status: 'reopened', previewUrl: IMG('spa-treatment') },
      ],
      effects: [
        'Case reopened for re-review',
        'Previous decision preserved in immutable approval history',
      ],
      previousDecisionId: null,
      supersededByDecisionId: null,
      reopenedFromDecisionId: 'APR-08110',
      relatedReviewId: 'CNT-62811',
      routes: {
        original: '/content-approval/services/CNT-62811',
        provider: '/providers/HTL-61890',
      },
      reviewedBy: { id: 'adm-david', name: 'David Mwangi', avatarUrl: IMG('daniel-okoth') },
      reviewerRoleSnapshot: 'Senior Compliance Analyst',
      reviewerMarketSnapshot: ['KE', 'TZ'],
      reviewedAt: '2026-04-22T11:25:00.000Z',
      createdAt: '2026-04-22T11:25:00.000Z',
      auditId: 'AUD-990988',
    },
    // 9. APR-10432 — Michael Otieno · Profile Changes · Approved · Version 3
    {
      id: 'APR-10432',
      decisionRef: 'APR-10432',
      originModule: 'profile_change',
      originRecordId: 'CNT-83110',
      targetId: null,
      subjectKey: 'profile_change:PR-66310',
      subjectType: 'provider',
      subjectName: 'Michael Otieno',
      subjectSubtitle: 'Fitness Trainer',
      subjectImage: IMG('brian-otieno'),
      providerId: 'PR-66310',
      providerRef: 'PR-66310',
      providerName: 'Michael Otieno',
      providerType: 'Fitness Trainer',
      providerCategory: 'individual',
      marketId: 'KE',
      marketName: 'Nakuru, Kenya',
      decisionType: 'profile_changes',
      decision: 'approved',
      reason: 'Bio & Service Area Updated',
      providerMessage: 'Your profile bio and service area updates (Version 3) have been approved and are now live.',
      internalNote: 'Checked bio for external contact details — clean. Service area expanded to Nakuru town center.',
      version: 'Version 3',
      evidenceRefs: [
        { label: 'Profile Field Diff Snapshot (v2 → v3)', version: 3, status: 'approved', previewUrl: IMG('brian-otieno') },
      ],
      effects: [
        'Approved profile fields published to live profile',
        'Previous profile version archived in version history',
      ],
      previousDecisionId: null,
      supersededByDecisionId: null,
      reopenedFromDecisionId: null,
      relatedReviewId: 'CNT-83110',
      routes: {
        original: '/content-approval/profile-changes/CNT-83110',
        provider: '/providers/PR-66310',
      },
      reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng', avatarUrl: IMG('grace-njeri') },
      reviewerRoleSnapshot: 'Verification Specialist',
      reviewerMarketSnapshot: ['KE', 'UG', 'TZ'],
      reviewedAt: '2026-04-21T14:55:00.000Z',
      createdAt: '2026-04-21T14:55:00.000Z',
      auditId: 'AUD-990412',
    },
    // 10. APR-09321 — Tranquil Minds · Gallery & Media · Changes Requested · 3 Images
    {
      id: 'APR-09321',
      decisionRef: 'APR-09321',
      originModule: 'gallery',
      originRecordId: 'CNT-72819',
      targetId: null,
      subjectKey: 'gallery:SPA-19433',
      subjectType: 'business',
      subjectName: 'Tranquil Minds',
      subjectSubtitle: 'Wellness Studio',
      subjectImage: IMG('meditation'),
      providerId: 'SPA-19433',
      providerRef: 'SPA-19433',
      providerName: 'Tranquil Minds',
      providerType: 'Wellness Studio',
      providerCategory: 'spa',
      marketId: 'KE',
      marketName: 'Nairobi, Kenya',
      decisionType: 'gallery_media',
      decision: 'changes_requested',
      reason: 'Low Image Resolution',
      providerMessage: 'Three uploaded studio gallery photos are below our minimum 1200×800px resolution requirement. Please upload higher-resolution images.',
      internalNote: '3 of 6 meditation studio images were compressed WhatsApp forwards (640×480). Requested originals.',
      version: '3 Images',
      evidenceRefs: [
        { label: 'Studio Room Photo #1 (640×480)', version: 1, status: 'changes_requested', previewUrl: IMG('meditation') },
      ],
      effects: [
        'Provider asked to upload high-resolution replacement photos',
        'Approved gallery photos remain visible',
      ],
      previousDecisionId: null,
      supersededByDecisionId: null,
      reopenedFromDecisionId: null,
      relatedReviewId: 'CNT-72819',
      routes: {
        original: '/content-approval/gallery/CNT-72819',
        provider: '/providers/SPA-19433',
      },
      reviewedBy: { id: 'adm-peter', name: 'Peter Maina', avatarUrl: IMG('peter-kamau') },
      reviewerRoleSnapshot: 'Compliance Reviewer',
      reviewerMarketSnapshot: ['KE'],
      reviewedAt: '2026-04-21T10:15:00.000Z',
      createdAt: '2026-04-21T10:15:00.000Z',
      auditId: 'AUD-990119',
    },
    // 11. APR-81102 — Earlier decision in Grace Njeri's credential chain (Version 1 — Changes Requested, superseded by APR-82941)
    {
      id: 'APR-81102',
      decisionRef: 'APR-81102',
      originModule: 'credentials',
      originRecordId: 'PR-82941',
      targetId: 'CRED-82941',
      subjectKey: 'credentials:PR-82941',
      subjectType: 'provider',
      subjectName: 'Grace Njeri',
      subjectSubtitle: 'Massage Therapist',
      subjectImage: IMG('grace-njeri'),
      providerId: 'PR-82941',
      providerRef: 'PR-82941',
      providerName: 'Grace Njeri',
      providerType: 'Massage Therapist',
      providerCategory: 'individual',
      marketId: 'KE',
      marketName: 'Nairobi, Kenya',
      decisionType: 'credentials',
      decision: 'changes_requested',
      reason: 'Blurry Document Image',
      providerMessage: 'The uploaded scan of your Holistic Massage Therapy diploma is blurry around the registration seal. Please upload a clearer photo or scan.',
      internalNote: 'Issued information request REQ-82941 for a clearer copy of the certificate.',
      version: 'Version 1',
      evidenceRefs: [
        { label: 'Professional Certificate (Version 1 — Blurry)', version: 1, status: 'changes_requested', previewUrl: IMG('spa-products') },
      ],
      effects: [
        'Information request REQ-82941 sent to provider',
        'Later superseded by APR-82941 (Version 2 Approved)',
      ],
      previousDecisionId: null,
      supersededByDecisionId: 'APR-82941',
      reopenedFromDecisionId: null,
      relatedReviewId: 'CRED-82941',
      relatedInfoRequestId: 'REQ-82941',
      routes: {
        original: '/verifications/PR-82941/decision',
        provider: '/providers/PR-82941',
        infoRequest: '/information-requests/REQ-82941',
      },
      reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng', avatarUrl: IMG('grace-njeri') },
      reviewerRoleSnapshot: 'Verification Specialist',
      reviewerMarketSnapshot: ['KE', 'UG', 'TZ'],
      reviewedAt: '2026-04-22T15:10:00.000Z',
      createdAt: '2026-04-22T15:10:00.000Z',
      auditId: 'AUD-989401',
    },
    // 12. APR-90127 — Later decision that superseded APR-21654 (Sarah Akinyi Credentials Version 2 Approved)
    {
      id: 'APR-90127',
      decisionRef: 'APR-90127',
      originModule: 'credentials',
      originRecordId: 'PR-22140',
      targetId: 'CRED-21654',
      subjectKey: 'credentials:PR-22140',
      subjectType: 'provider',
      subjectName: 'Sarah Akinyi',
      subjectSubtitle: 'Beautician',
      subjectImage: IMG('joy-akinyi'),
      providerId: 'PR-22140',
      providerRef: 'PR-22140',
      providerName: 'Sarah Akinyi',
      providerType: 'Beautician',
      providerCategory: 'individual',
      marketId: 'KE',
      marketName: 'Kisumu, Kenya',
      decisionType: 'credentials',
      decision: 'approved',
      reason: 'Renewed 2026 Certificate Verified',
      providerMessage: 'Your renewed 2026 Beauty Therapy practicing certificate has been verified and approved.',
      internalNote: 'Supersedes APR-21654. Renewed certificate valid through Dec 2026.',
      version: 'Version 2',
      evidenceRefs: [
        { label: 'Beauty Therapy Certificate (2026 Renewed)', version: 2, status: 'approved', previewUrl: IMG('facial') },
      ],
      effects: [
        'Credential requirement satisfied',
        'Supersedes earlier rejection APR-21654',
      ],
      previousDecisionId: 'APR-21654',
      supersededByDecisionId: null,
      reopenedFromDecisionId: null,
      relatedReviewId: 'CRED-21654',
      routes: {
        original: '/verifications/PR-82941/decision',
        provider: '/providers/PR-22140',
      },
      reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng', avatarUrl: IMG('grace-njeri') },
      reviewerRoleSnapshot: 'Verification Specialist',
      reviewerMarketSnapshot: ['KE', 'UG', 'TZ'],
      reviewedAt: '2026-04-23T09:40:00.000Z',
      createdAt: '2026-04-23T09:40:00.000Z',
      auditId: 'AUD-991550',
    },
    // 13. APR-08914 — Grace Njeri · Identity · Approved · Version 1
    {
      id: 'APR-08914',
      decisionRef: 'APR-08914',
      originModule: 'identity',
      originRecordId: 'PR-82941',
      targetId: 'ID-82941',
      subjectKey: 'identity:PR-82941',
      subjectType: 'provider',
      subjectName: 'Grace Njeri',
      subjectSubtitle: 'Massage Therapist',
      subjectImage: IMG('grace-njeri'),
      providerId: 'PR-82941',
      providerRef: 'PR-82941',
      providerName: 'Grace Njeri',
      providerType: 'Massage Therapist',
      providerCategory: 'individual',
      marketId: 'KE',
      marketName: 'Nairobi, Kenya',
      decisionType: 'identity',
      decision: 'approved',
      reason: 'Government ID & Selfie Verified',
      providerMessage: 'Your National ID and identity verification check have been approved.',
      internalNote: 'Kenyan National ID front/back and liveness photo match.',
      version: 'Version 1',
      evidenceRefs: [
        { label: 'National ID Card (Front & Back)', version: 1, status: 'approved', previewUrl: IMG('grace-njeri') },
      ],
      effects: [
        'Identity requirement satisfied',
        'Verification progress updated',
      ],
      previousDecisionId: null,
      supersededByDecisionId: null,
      reopenedFromDecisionId: null,
      relatedReviewId: 'VER-82941',
      routes: {
        original: '/verifications/PR-82941/decision',
        provider: '/providers/PR-82941',
      },
      reviewedBy: { id: 'adm-jane', name: 'Jane Ochieng', avatarUrl: IMG('grace-njeri') },
      reviewerRoleSnapshot: 'Verification Specialist',
      reviewerMarketSnapshot: ['KE', 'UG', 'TZ'],
      reviewedAt: '2026-04-21T09:05:00.000Z',
      createdAt: '2026-04-21T09:05:00.000Z',
      auditId: 'AUD-989012',
    },
    // 14. APR-08402 — Amina Wekesa · Profile Photos · Approved · Version 1
    {
      id: 'APR-08402',
      decisionRef: 'APR-08402',
      originModule: 'profile_photo',
      originRecordId: 'CNT-82941',
      targetId: 'MED-71204',
      subjectKey: 'profile_photo:PR-71204',
      subjectType: 'provider',
      subjectName: 'Amina Wekesa',
      subjectSubtitle: 'Yoga Specialist',
      subjectImage: IMG('amina-wekesa'),
      providerId: 'PR-71204',
      providerRef: 'PR-71204',
      providerName: 'Amina Wekesa',
      providerType: 'Yoga Specialist',
      providerCategory: 'individual',
      marketId: 'KE',
      marketName: 'Kilimani, Kenya',
      decisionType: 'profile_photos',
      decision: 'approved',
      reason: 'Meets Profile Photo Standards',
      providerMessage: 'Your new profile photo has been approved and is now visible on your public profile.',
      internalNote: 'Clear lighting, neutral background, high resolution.',
      version: 'Version 1',
      evidenceRefs: [
        { label: 'Profile Headshot (1200×1200)', version: 1, status: 'approved', previewUrl: IMG('amina-wekesa') },
      ],
      effects: [
        'Eligible for public display',
        'Visible across profile and search placements',
      ],
      previousDecisionId: null,
      supersededByDecisionId: null,
      reopenedFromDecisionId: null,
      relatedReviewId: 'CNT-82941',
      routes: {
        original: '/content-approval/profile-photos/CNT-82941',
        provider: '/providers/PR-71204',
      },
      reviewedBy: { id: 'adm-aisha', name: 'Aisha Noor', avatarUrl: IMG('naomi-chebet') },
      reviewerRoleSnapshot: 'Senior Verification Lead',
      reviewerMarketSnapshot: ['KE', 'UG', 'TZ', 'RW'],
      reviewedAt: '2026-04-20T16:30:00.000Z',
      createdAt: '2026-04-20T16:30:00.000Z',
      auditId: 'AUD-988740',
    },
  ]

  ledgerStoreMap = new Map(rows.map((r) => [r.id, r]))
  return ledgerStoreMap
}

function appendMockLedgerEntry(entry) {
  const store = seedLedger()
  const id = entry.decisionRef
  // Find if any existing entry shares the same subjectKey and has no supersededByDecisionId
  let previousId = entry.previousDecisionId
  if (!previousId && entry.subjectKey) {
    for (const existing of store.values()) {
      if (existing.subjectKey === entry.subjectKey && !existing.supersededByDecisionId) {
        previousId = existing.id
        break
      }
    }
  }
  const record = {
    ...entry,
    id,
    previousDecisionId: previousId || null,
    marketName: MARKET_META[entry.marketId]?.name ? `${entry.provider?.city ? `${entry.provider.city}, ` : ''}${MARKET_META[entry.marketId].name}` : entry.marketId || 'Kenya',
    auditId: `AUD-${String(Date.now()).slice(-6)}`,
  }
  if (previousId && store.has(previousId)) {
    const prev = store.get(previousId)
    store.set(previousId, { ...prev, supersededByDecisionId: id })
  }
  // Insert at the front of the map so newest decisions show first
  const nextMap = new Map([[id, record], ...store.entries()])
  ledgerStoreMap = nextMap
  return record
}

// ---------------------------------------------------------------------------
// Mock implementations
// ---------------------------------------------------------------------------

const mock = {
  async getRejectionWorkspace({ originModule = 'service', originRecordId = 'CNT-48291', targetId = null } = {}) {
    await delay()
    const id = originRecordId || 'CNT-48291'

    if (['content', 'profile_change', 'service', 'profile_photo', 'gallery'].includes(originModule)) {
      const entry = contentStore().get(id) || contentStore().get('CNT-48291')
      if (!entry) fail('The originating moderation record no longer exists.')
      const r = normalizeModeration(id, entry.doc)
      const decisionType = contentDecisionType(r.contentType, Boolean(targetId))
      const isUpdate = r.contentType === 'service' ? Boolean(r.serviceChange?.current) : r.contentType === 'profile_change'
      const reasons = reasonsForDecisionType(decisionType)
      return {
        origin: {
          originModule,
          originRecordId: id,
          targetId,
          decisionType,
          decisionTypeLabel: DECISION_TYPES[decisionType] || r.contentLabel,
          reviewType:
            r.contentType === 'service'
              ? 'Service Information Approval'
              : r.contentType === 'profile_change'
                ? 'Profile Information Change'
                : CONTENT_TYPES[r.contentType] || r.contentLabel,
          reviewId: r.contentId,
          subjectTitle: r.title || r.contentLabel,
          subjectId: r.serviceChange?.serviceId || targetId || 'SRV-82941',
          subjectImage: r.media?.[0]?.url || r.provider.photoUrl || null,
          submittedAt: r.submittedAt,
          status: r.status,
          version: r.version || 2,
          isUpdate,
          provider: r.provider,
          countryCode: r.countryCode,
          marketName: r.marketName || 'Kenya',
        },
        reasons,
        templates: REJECTION_TEMPLATES,
        impact: rejectionImpactFor(decisionType, { isUpdate, allowResubmission: true }),
        allowResubmissionDefault: true,
      }
    }

    const vCase = seedVerificationCases().get(id) || seedVerificationCases().get('PR-82941')
    const decisionType = ['identity', 'credentials', 'business_documents'].includes(originModule) ? originModule : 'verification'
    return {
      origin: {
        originModule,
        originRecordId: vCase.verificationId,
        targetId,
        decisionType,
        decisionTypeLabel: DECISION_TYPES[decisionType] || 'Verification',
        reviewType: `${DECISION_TYPES[decisionType] || 'Verification'} Review`,
        reviewId: vCase.caseId,
        subjectTitle: vCase.provider.name,
        subjectId: targetId || vCase.caseId,
        subjectImage: vCase.provider.photoUrl,
        submittedAt: vCase.submittedAt,
        status: vCase.status,
        version: vCase.version || 1,
        isUpdate: false,
        provider: vCase.provider,
        countryCode: vCase.countryCode,
        marketName: vCase.marketName || 'Kenya',
      },
      reasons: reasonsForDecisionType(decisionType),
      templates: REJECTION_TEMPLATES,
      impact: rejectionImpactFor(decisionType, { isUpdate: false, allowResubmission: true }),
      allowResubmissionDefault: true,
    }
  },

  async submitRejection(d = {}) {
    await delay(200)
    const err = validateRejection(d)
    if (err) fail(err)

    const ws = await mock.getRejectionWorkspace({
      originModule: d.originModule,
      originRecordId: d.originRecordId,
      targetId: d.targetId,
    })
    const { origin } = ws
    const reasonObj = ws.reasons.find((r) => r.code === d.reasonCode)
    const reasonLabel = d.reason || reasonObj?.label || d.reasonCode
    const nowIso = new Date().toISOString()

    // Update underlying store if content moderation
    const cEntry = contentStore().get(origin.originRecordId)
    if (cEntry) {
      cEntry.doc.status = 'rejected'
      cEntry.doc.decision = 'reject'
      cEntry.doc.reason = reasonLabel
      cEntry.doc.providerMessage = d.providerMessage
      cEntry.doc.reviewedBy = MOCK_ACTOR
      cEntry.doc.reviewedAt = nowIso
      cEntry.history.unshift({
        moderationId: origin.originRecordId,
        event: `Rejected — ${reasonLabel}`,
        at: nowIso,
        actor: MOCK_ACTOR,
      })
      if (d.internalNote) {
        cEntry.notes.unshift({
          text: d.internalNote,
          authorName: MOCK_ACTOR.name,
          createdAt: nowIso,
        })
      }
    }

    // Update verification store if verification case
    const vCase = seedVerificationCases().get(origin.originRecordId)
    if (vCase && ['verification', 'identity', 'credentials', 'business_documents'].includes(origin.originModule)) {
      if (origin.originModule === 'verification') {
        vCase.status = 'rejected'
      } else {
        vCase.components = vCase.components.map((c) =>
          c.key === origin.originModule ? { ...c, status: 'rejected', reviewedBy: MOCK_ACTOR, reviewedAt: nowIso } : c,
        )
      }
      vCase.history.unshift({
        event: `Rejected (${origin.decisionTypeLabel}) — ${reasonLabel}`,
        at: nowIso,
        actor: MOCK_ACTOR,
      })
    }

    const built = buildEntry({
      originModule: origin.originModule,
      originRecordId: origin.originRecordId,
      targetId: origin.targetId,
      decisionType: origin.decisionType,
      decision: 'rejected',
      reason: reasonLabel,
      providerMessage: d.providerMessage,
      internalNote: d.internalNote,
      version: `Version ${origin.version || 1}`,
      subject: {
        type: origin.decisionType,
        name: origin.subjectTitle,
        subtitle: origin.provider.name,
        image: origin.subjectImage,
      },
      provider: origin.provider,
      countryCode: origin.countryCode,
      evidenceRefs: [
        { label: `${origin.subjectTitle} (Version ${origin.version || 1})`, version: origin.version || 1, status: 'rejected', previewUrl: origin.subjectImage },
      ],
      effects: effectsFor(origin.decisionType, 'rejected', { isUpdate: origin.isUpdate }),
      actor: MOCK_ACTOR,
      access: MOCK_ACCESS,
      at: nowIso,
      relatedReviewId: origin.reviewId,
      routes: {
        original:
          origin.originModule === 'service'
            ? `/content-approval/services/${origin.originRecordId}`
            : origin.originModule === 'verification'
              ? `/verifications/${origin.originRecordId}/decision`
              : `/content-approval?c=${origin.originRecordId}`,
        provider: `/providers/${origin.provider.id}`,
      },
    })
    const saved = appendMockLedgerEntry(built)
    return { ok: true, ledgerId: saved.id, entry: saved }
  },

  async getVerificationDecision({ verificationId = 'PR-82941' } = {}) {
    await delay()
    const cases = seedVerificationCases()
    const vCase = cases.get(verificationId) || cases.get('PR-82941')
    const readiness = evaluateVerificationReadiness(vCase)
    return {
      ...vCase,
      readiness,
      impacts: {
        approve: verificationImpactFor('approve'),
        request_info: verificationImpactFor('request_info'),
        reject: verificationImpactFor('reject'),
        escalate: verificationImpactFor('escalate'),
      },
      availableCases: [...cases.values()].map((c) => ({
        verificationId: c.verificationId,
        caseId: c.caseId,
        name: c.provider.name,
        category: c.provider.category,
        categoryLabel: c.provider.categoryLabel,
        typeLabel: c.provider.typeLabel,
        ready: evaluateVerificationReadiness(c).ready,
      })),
    }
  },

  async submitVerificationDecision(d = {}) {
    await delay(200)
    const cases = seedVerificationCases()
    const vCase = cases.get(d.verificationId) || cases.get('PR-82941')
    if (!vCase) fail('Verification case not found.')

    const err = validateVerificationDecision(vCase, d)
    if (err) fail(err)

    const nowIso = new Date().toISOString()
    const statusMap = {
      approve: 'approved',
      request_info: 'more_information_needed',
      reject: 'rejected',
      escalate: 'escalated',
    }
    vCase.status = statusMap[d.decision] || 'under_review'
    if (d.decision === 'approve') {
      vCase.provider.verified = true
    }
    const eventLabel =
      d.decision === 'approve'
        ? 'Final Verification Approved — Provider marked Verified'
        : d.decision === 'escalate'
          ? `Verification Escalated to ${d.escalateTo || 'Compliance'}`
          : d.decision === 'reject'
            ? 'Verification Rejected'
            : 'More Information Requested'

    vCase.history.unshift({
      event: eventLabel,
      at: nowIso,
      actor: MOCK_ACTOR,
    })
    if (d.note) {
      vCase.notes.unshift({
        noteId: `N-${Date.now()}`,
        authorName: MOCK_ACTOR.name,
        authorRole: MOCK_ACCESS.roleName,
        createdAt: nowIso,
        text: d.note,
      })
    }

    const built = buildEntry({
      originModule: 'verification',
      originRecordId: vCase.verificationId,
      decisionType: 'verification',
      decision: ledgerDecision(d.decision),
      reason:
        d.reason ||
        (d.decision === 'approve'
          ? 'All Requirements Met'
          : d.decision === 'escalate'
            ? `Escalated (${d.escalateTo || 'Compliance'})`
            : 'Verification Decision Recorded'),
      providerMessage:
        d.providerMessage ||
        (d.decision === 'approve'
          ? `Congratulations! ${vCase.provider.name} is now a Verified provider on Lé Inspa.`
          : null),
      internalNote: d.note || 'Final verification decision recorded via ADM-042.',
      version: `Case #${vCase.caseId.replace('VER-', '')}`,
      subject: {
        type: vCase.provider.category,
        name: vCase.provider.name,
        subtitle: vCase.provider.typeLabel,
        image: vCase.provider.photoUrl,
      },
      provider: vCase.provider,
      countryCode: vCase.countryCode,
      evidenceRefs: (vCase.evidence || []).map((e) => ({
        label: e.title,
        version: e.version || 1,
        status: e.status || 'approved',
        previewUrl: e.thumbnailUrl,
      })),
      effects: effectsFor('verification', ledgerDecision(d.decision)),
      actor: MOCK_ACTOR,
      access: MOCK_ACCESS,
      at: nowIso,
      relatedReviewId: vCase.caseId,
      routes: {
        original: `/verifications/${vCase.verificationId}/decision`,
        provider: `/providers/${vCase.provider.id}`,
      },
      previousDecisionId: vCase.lastDecisionId || null,
    })

    const saved = appendMockLedgerEntry(built)
    vCase.lastDecisionId = saved.id
    return { ok: true, ledgerId: saved.id, status: vCase.status, entry: saved }
  },

  async listApprovalDecisions(q = {}) {
    await delay(140)
    const all = [...seedLedger().values()]
    const marketScoped = q.market && q.market !== 'ALL' ? all.filter((e) => e.marketId === q.market) : all
    const { counts, byType } = summarizeLedger(marketScoped)
    const filtered = filterLedgerEntries(all, q)

    const page = Math.max(1, Number(q.page) || 1)
    const pageSize = Math.min(50, Math.max(5, Number(q.pageSize) || 10))
    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)

    return {
      items,
      total: filtered.length,
      page,
      pageSize,
      counts,
      byType,
      reviewers: [
        { id: 'Jane Ochieng', name: 'Jane Ochieng' },
        { id: 'Peter Maina', name: 'Peter Maina' },
        { id: 'David Mwangi', name: 'David Mwangi' },
        { id: 'Aisha Noor', name: 'Aisha Noor' },
      ],
      generatedAt: new Date().toISOString(),
    }
  },

  async getApprovalDecision({ decisionId } = {}) {
    await delay(100)
    const store = seedLedger()
    const d = store.get(decisionId) || [...store.values()][0]
    if (!d) fail('Decision record not found.')
    const chain = buildDecisionChain(d.id, store)
    return {
      decision: d,
      chain,
      currentSubjectStatus: {
        accountStatus: 'active',
        verificationStatus: 'verified',
      },
    }
  },

  async exportApprovalHistory(q = {}) {
    await delay(150)
    const all = [...seedLedger().values()]
    const filtered = filterLedgerEntries(all, q).map(({ internalNote, ...rest }) => rest)
    return {
      items: filtered,
      exportedAt: new Date().toISOString(),
    }
  },
}

export const approvalWorkflowService = {
  isMock: USE_MOCK,
  templateForReason,
  rejectionImpactFor,
  verificationImpactFor,
  validateRejection,
  validateVerificationDecision,
  getRejectionWorkspace: (p) => (USE_MOCK ? mock.getRejectionWorkspace(p) : callAdmin('adminGetRejectionWorkspace', p)),
  submitRejection: (p) => (USE_MOCK ? mock.submitRejection(p) : callAdmin('adminSubmitRejection', p)),
  getVerificationDecision: (p) => (USE_MOCK ? mock.getVerificationDecision(p) : callAdmin('adminGetVerificationDecision', p)),
  submitVerificationDecision: (p) => (USE_MOCK ? mock.submitVerificationDecision(p) : callAdmin('adminSubmitFinalVerificationDecision', p)),
  listApprovalDecisions: (p) => (USE_MOCK ? mock.listApprovalDecisions(p) : callAdmin('adminListApprovalDecisions', p)),
  getApprovalDecision: (p) => (USE_MOCK ? mock.getApprovalDecision(p) : callAdmin('adminGetApprovalDecision', p)),
  exportApprovalHistory: (p) => (USE_MOCK ? mock.exportApprovalHistory(p) : callAdmin('adminExportApprovalHistory', p)),
}

