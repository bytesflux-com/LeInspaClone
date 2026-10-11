/**
 * @file verificationSchema.js
 * @description Central Firestore schema contracts, enums, workflow state machines,
 * document requirement rules, and metadata for ADM-029: Verification Center.
 */

// ============================================================================
// 1. PROVIDER TYPES
// ============================================================================

/**
 * Provider category identifiers and descriptive labels.
 * Represents the 3 core provider classification tiers on Lé Inspa.
 */
export const PROVIDER_TYPES = Object.freeze({
  INDIVIDUAL: 'Individual Professional',
  SPA_WELLNESS: 'Spa & Wellness Center',
  HOTEL_RESORT: 'Hotel & Wellness Resort',
})

/**
 * Provider type metadata for UI badges, icons, and descriptions.
 */
export const PROVIDER_TYPE_CONFIG = Object.freeze({
  INDIVIDUAL: {
    key: 'INDIVIDUAL',
    label: 'Individual Professional',
    shortLabel: 'Individual',
    badgeVariant: 'neutral',
    description: 'Solo practitioner, certified therapist, or independent wellness specialist',
  },
  SPA_WELLNESS: {
    key: 'SPA_WELLNESS',
    label: 'Spa & Wellness Center',
    shortLabel: 'Spa & Wellness',
    badgeVariant: 'purple',
    description: 'Dedicated standalone spa, clinic, or wellness center facility',
  },
  HOTEL_RESORT: {
    key: 'HOTEL_RESORT',
    label: 'Hotel & Wellness Resort',
    shortLabel: 'Hotel & Resort',
    badgeVariant: 'amber',
    description: 'Hospitality resort, luxury hotel wellness wing, or retreat destination',
  },
})

// ============================================================================
// 2. VERIFICATION TYPES
// ============================================================================

/**
 * Verification stream / application classification categories.
 */
export const VERIFICATION_TYPES = Object.freeze({
  IDENTITY: 'Identity Verification',
  CREDENTIALS: 'Professional Credentials',
  BUSINESS_DOCS: 'Business Documents',
  PROPERTY_VERIFICATION: 'Property Verification',
  LOCATION: 'Location Verification',
  BUSINESS_REGISTRATION: 'Business Registration',
})

// ============================================================================
// 3. WORKFLOW STATUSES
// ============================================================================

/**
 * Verification workflow lifecycle statuses.
 * Strictly distinct from the operational account status of a provider.
 */
export const VERIFICATION_STATUSES = Object.freeze({
  AWAITING_REVIEW: 'Awaiting Review',
  UNDER_REVIEW: 'Under Review',
  CHANGES_REQUESTED: 'Changes Requested',
  RESUBMITTED: 'Resubmitted',
  ESCALATED: 'Escalated',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
})

/**
 * UI presentation badges, colors, and styling configurations for each status.
 */
export const VERIFICATION_STATUS_CONFIG = Object.freeze({
  AWAITING_REVIEW: {
    key: 'AWAITING_REVIEW',
    label: 'Awaiting Review',
    badgeColor: 'orange',
    badgeVariant: 'warning',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    textClass: 'text-orange-700 dark:text-orange-300',
    borderClass: 'border-orange-200 dark:border-orange-800',
  },
  UNDER_REVIEW: {
    key: 'UNDER_REVIEW',
    label: 'Under Review',
    badgeColor: 'purple',
    badgeVariant: 'accent',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-200 dark:border-purple-800',
  },
  CHANGES_REQUESTED: {
    key: 'CHANGES_REQUESTED',
    label: 'Changes Requested',
    badgeColor: 'amber',
    badgeVariant: 'warning',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800',
  },
  RESUBMITTED: {
    key: 'RESUBMITTED',
    label: 'Resubmitted',
    badgeColor: 'blue',
    badgeVariant: 'info',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-200 dark:border-blue-800',
  },
  ESCALATED: {
    key: 'ESCALATED',
    label: 'Escalated',
    badgeColor: 'purple/red',
    badgeVariant: 'danger',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    textClass: 'text-rose-700 dark:text-rose-300',
    borderClass: 'border-rose-200 dark:border-rose-800',
  },
  APPROVED: {
    key: 'APPROVED',
    label: 'Approved',
    badgeColor: 'green',
    badgeVariant: 'success',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
  },
  REJECTED: {
    key: 'REJECTED',
    label: 'Rejected',
    badgeColor: 'red',
    badgeVariant: 'danger',
    bgClass: 'bg-red-50 dark:bg-red-950/40',
    textClass: 'text-red-700 dark:text-red-300',
    borderClass: 'border-red-200 dark:border-red-800',
  },
})

// ============================================================================
// 4. PRIORITY LEVELS
// ============================================================================

/**
 * Review queue priority ratings.
 */
export const PRIORITY_LEVELS = Object.freeze({
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
})

/**
 * Priority styling configurations.
 */
export const PRIORITY_CONFIG = Object.freeze({
  NORMAL: {
    key: 'NORMAL',
    label: 'Normal',
    color: 'default',
    badgeVariant: 'neutral',
    textClass: 'text-slate-600 dark:text-slate-400',
    dotClass: 'bg-slate-400',
  },
  HIGH: {
    key: 'HIGH',
    label: 'High',
    color: 'orange',
    badgeVariant: 'warning',
    textClass: 'text-orange-600 dark:text-orange-400',
    dotClass: 'bg-orange-500',
  },
  URGENT: {
    key: 'URGENT',
    label: 'Urgent',
    color: 'red',
    badgeVariant: 'danger',
    textClass: 'text-red-600 dark:text-red-400',
    dotClass: 'bg-red-500',
  },
})

// ============================================================================
// 5. DYNAMIC DOCUMENT REQUIREMENTS BY PROVIDER TYPE
// ============================================================================

/**
 * Dynamic Document Requirements by Provider Type (`REQUIRED_DOCUMENTS_BY_TYPE`).
 * Defines exact checklist requirements and verification rules per tier.
 */
export const REQUIRED_DOCUMENTS_BY_TYPE = Object.freeze({
  INDIVIDUAL: [
    {
      id: 'govt_id',
      code: 'GOVT_ID',
      title: 'Government-issued Identity (National ID / Passport)',
      category: 'IDENTITY',
      required: true,
      description: 'Valid national ID card, passport, or alien registration card matching account holder name.',
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
      maxSizeMb: 10,
    },
    {
      id: 'prof_cert',
      code: 'PROF_CERT',
      title: 'Professional Certificate / Diploma',
      category: 'CREDENTIALS',
      required: true,
      description: 'Accredited certificate, diploma, or degree in relevant wellness/therapy specialization.',
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
      maxSizeMb: 15,
    },
    {
      id: 'practice_license',
      code: 'PRACTICE_LICENSE',
      title: 'Practice License',
      category: 'CREDENTIALS',
      required: true,
      description: 'Valid, active professional practitioner or allied health regulatory license.',
      acceptedFormats: ['PDF'],
      maxSizeMb: 10,
    },
    {
      id: 'profile_consistency',
      code: 'PROFILE_CONSISTENCY',
      title: 'Profile Consistency Verification',
      category: 'IDENTITY',
      required: true,
      description: 'Live face capture, biometrics check, or facial comparison against government ID photo.',
      acceptedFormats: ['JPG', 'PNG'],
      maxSizeMb: 10,
    },
  ],

  SPA_WELLNESS: [
    {
      id: 'business_registration',
      code: 'BUSINESS_REG',
      title: 'Business Registration Certificate',
      category: 'BUSINESS_DOCS',
      required: true,
      description: 'Official Certificate of Incorporation or Business Registration from national registrar.',
      acceptedFormats: ['PDF'],
      maxSizeMb: 20,
    },
    {
      id: 'operating_license',
      code: 'OPERATING_LICENSE',
      title: 'Premises Operating License',
      category: 'BUSINESS_DOCS',
      required: true,
      description: 'Local county or municipal government single business permit and operating license.',
      acceptedFormats: ['PDF'],
      maxSizeMb: 15,
    },
    {
      id: 'tax_clearance',
      code: 'TAX_CLEARANCE',
      title: 'Tax / VAT Clearance',
      category: 'BUSINESS_DOCS',
      required: true,
      description: 'Valid national revenue authority Tax Compliance Certificate (TCC) or VAT certificate.',
      acceptedFormats: ['PDF'],
      maxSizeMb: 10,
    },
    {
      id: 'location_facility',
      code: 'LOCATION_FACILITY',
      title: 'Location & Facility Verification',
      category: 'LOCATION',
      required: true,
      description: 'Proof of premises lease/ownership and on-site facility photographs or utility bill.',
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
      maxSizeMb: 25,
    },
  ],

  HOTEL_RESORT: [
    {
      id: 'hospitality_license',
      code: 'HOSPITALITY_LICENSE',
      title: 'Hospitality / Hotel Operating License',
      category: 'BUSINESS_DOCS',
      required: true,
      description: 'Tourism Regulatory Authority hotel license, star rating cert, or hospitality franchise permit.',
      acceptedFormats: ['PDF'],
      maxSizeMb: 25,
    },
    {
      id: 'property_registration',
      code: 'PROPERTY_REG',
      title: 'Property Registration & Ownership Proof',
      category: 'PROPERTY_VERIFICATION',
      required: true,
      description: 'Title deed, long-term commercial head lease, or official cadastral property registry.',
      acceptedFormats: ['PDF'],
      maxSizeMb: 30,
    },
    {
      id: 'wellness_safety_accreditation',
      code: 'SAFETY_ACCREDITATION',
      title: 'Wellness Facility Safety Accreditation',
      category: 'PROPERTY_VERIFICATION',
      required: true,
      description: 'Public health & safety compliance certificate, fire clearance, and pool/spa sanitary audit.',
      acceptedFormats: ['PDF'],
      maxSizeMb: 20,
    },
    {
      id: 'power_of_attorney',
      code: 'POWER_OF_ATTORNEY',
      title: 'Authorized Representative Power of Attorney',
      category: 'BUSINESS_DOCS',
      required: true,
      description: 'Official board resolution or power of attorney designating the platform administrator.',
      acceptedFormats: ['PDF'],
      maxSizeMb: 10,
    },
  ],
})

// ============================================================================
// 6. REASONS FOR CHANGES / REJECTION
// ============================================================================

/**
 * Standard selectable reasons when requesting corrections or document resubmission.
 */
export const CHANGE_REQUEST_REASONS = Object.freeze([
  'Document unclear',
  'Document expired',
  'Information mismatch',
  'Incomplete document',
  'Unsupported document',
  'Missing page',
  'Other',
])

/**
 * Standard regulatory and compliance reasons for formal application rejection.
 */
export const REJECTION_REASONS = Object.freeze([
  'Fraudulent / Tampered document',
  'Expired beyond renewal window',
  'Identity mismatch failure',
  'Unaccredited institution',
  'Sanctioned entity / High risk',
  'Other compliance issue',
])

// ============================================================================
// 7. FIRESTORE COLLECTION & SCHEMA CONTRACT JSDOCS
// ============================================================================

/**
 * Firestore Collection paths for the Verification Center
 */
export const VERIFICATION_FIRESTORE_COLLECTIONS = Object.freeze({
  QUEUE: 'verificationQueue',
  AUDIT_LOGS: 'verificationAuditLogs',
  DOCUMENTS: 'verificationDocuments',
})

/**
 * @typedef {Object} VerificationComparisonField
 * @property {string} fieldName - Field label (e.g. "Account Name", "Country")
 * @property {string} accountValue - Value from user/provider account profile
 * @property {string} docValue - Value extracted/OCR-verified from submitted document
 * @property {boolean} isMatch - Whether values match according to verification criteria
 * @property {string|null} diffNote - Note describing discrepancy (e.g. "Possible difference")
 */

/**
 * @typedef {Object} VerificationDocumentItem
 * @property {string} id - Document unique identifier
 * @property {string} title - Document title/type label
 * @property {string} docType - Required document code (e.g. "PROF_CERT")
 * @property {string} nameOnDoc - Full name appearing on the document
 * @property {string} docNumber - Document registration or license number (masked or unmasked)
 * @property {string} issuer - Issuing organization or regulatory body
 * @property {string} issueDate - Issue date string
 * @property {string} expiryDate - Expiry date string
 * @property {string} fileUrl - Secure storage URL or viewer path
 * @property {string} fileFormat - PDF, JPG, PNG
 * @property {number} fileSizeKb - File size in Kilobytes
 * @property {'PENDING'|'APPROVED'|'REJECTED'|'CHANGES_REQUESTED'} status - Document status
 */

/**
 * @typedef {Object} VerificationProgressStep
 * @property {string} id - Step identifier
 * @property {string} label - Step human-readable label
 * @property {'APPROVED'|'REVIEWING_NOW'|'PENDING'|'REJECTED'|'CHANGES_REQUESTED'} status - Step status
 */

/**
 * @typedef {Object} VerificationMarket
 * @property {string} code - Two-letter ISO country code (e.g. "KE", "UG", "TZ", "ZA", "MA")
 * @property {string} name - Market display name (e.g. "Kenya")
 * @property {string} flag - Country flag emoji (e.g. "🇰🇪")
 */

/**
 * @typedef {Object} VerificationQueueRecord
 * @property {string} id - Unique queue record ID (e.g. "ver-001")
 * @property {string} providerId - Associated provider ID (e.g. "PR-82941")
 * @property {string} name - Provider or business name
 * @property {string} type - Provider sub-type or specialty (e.g. "Massage Therapist")
 * @property {keyof typeof PROVIDER_TYPES} providerCategory - INDIVIDUAL | SPA_WELLNESS | HOTEL_RESORT
 * @property {VerificationMarket} market - Market geographical metadata
 * @property {string} verificationType - Type of verification application
 * @property {string} submittedAt - Human-readable or ISO submission timestamp
 * @property {keyof typeof PRIORITY_LEVELS} priority - NORMAL | HIGH | URGENT
 * @property {keyof typeof VERIFICATION_STATUSES} status - Current workflow status
 * @property {string} assignedTo - Admin reviewer name or "Unassigned"
 * @property {string} avatarUrl - Provider avatar or logo URL
 * @property {VerificationProgressStep[]} progressSteps - Milestone checklist
 * @property {VerificationDocumentItem[]} documents - Submitted documents array
 * @property {VerificationComparisonField[]} comparisonData - Field comparison checks
 * @property {number} version - Schema version number (always 1)
 */
