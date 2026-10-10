/**
 * ADM-022: Pure business logic, state machines, and access validation
 * for Provider 360° Admin Profile.
 */

export const ALL_MARKETS = 'ALL'

export const SUPPORTED_PROVIDER_TYPES = [
  'massage_therapist',
  'fitness_trainer',
  'yoga_specialist',
  'meditation_specialist',
  'physiotherapy',
  'spa',
  'hotel_resort',
]

/**
 * Validates whether an admin can access a provider belonging to a sovereign market.
 */
export function canAccessProviderMarket(admin, providerMarket) {
  if (!admin) return false
  const markets = Array.isArray(admin.markets) ? admin.markets : []
  if (markets.includes(ALL_MARKETS)) return true
  if (!providerMarket) return false
  return markets.includes(providerMarket.toUpperCase())
}

/**
 * Resolves capability gates for viewing, financial audit, PII reveal, and compliance actions.
 */
export function resolveProviderPermissions(admin) {
  if (!admin) {
    return {
      canView: false,
      canViewFinancials: false,
      canRevealPii: false,
      canVerify: false,
      canSuspend: false,
    }
  }

  const isSuperAdmin = admin.role === 'super_admin'
  const perms = new Set(Array.isArray(admin.permissions) ? admin.permissions : [])

  return {
    canView: isSuperAdmin || perms.has('providers.view'),
    canViewFinancials: isSuperAdmin || perms.has('payments.view') || perms.has('finance.view'),
    canRevealPii: isSuperAdmin || perms.has('users.reveal_pii') || perms.has('users.view'),
    canVerify: isSuperAdmin || perms.has('providers.verify'),
    canSuspend: isSuperAdmin || perms.has('users.suspend'),
  }
}

/**
 * Validates content moderation state change. Rejections strictly require a reason.
 */
export function validateContentModeration({ status, reasonCode, reasonLabel }) {
  if (!status) {
    return { valid: false, error: 'Status is required.' }
  }

  if (status === 'changes_requested' || status === 'rejected') {
    if (!reasonCode && !reasonLabel) {
      return { valid: false, error: 'Rejection or changes request requires a reason.' }
    }
  }

  return { valid: true }
}

/**
 * Validates internal admin notes: prevents empty records and ensures internal-only attribution.
 */
export function validateInternalNote({ text, author }) {
  if (!text || !text.trim()) {
    return { valid: false, error: 'Note text cannot be empty.' }
  }
  return {
    valid: true,
    sanitizedText: text.trim(),
    author: author || 'Admin',
  }
}

/**
 * Determines whether the dynamic profile is an Individual, Spa, or Hotel.
 */
export function resolveProviderCategory(entityType, typeId) {
  if (entityType === 'spa' || typeId === 'spa') return 'spa'
  if (entityType === 'hotel_resort' || typeId === 'hotel_resort') return 'hotel_resort'
  return 'individual'
}

