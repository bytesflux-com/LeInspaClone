// System permission constants mapping to backend accessModel
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  USERS_VIEW: 'users.view',
  USERS_SUSPEND: 'users.suspend',
  USERS_EXPORT: 'users.export',
  USERS_REVEAL_PII: 'users.reveal_pii', // ADM-012 — unmask client email / phone (audited)
  MEMBERSHIPS_MANAGE: 'memberships.manage', // ADM-016 — change / extend / reactivate a client's membership (audited)
  PROVIDERS_VIEW: 'providers.view',
  PROVIDERS_VERIFY: 'providers.verify',
  BOOKINGS_VIEW: 'bookings.view',
  BOOKINGS_MANAGE: 'bookings.manage',
  FINANCE_VIEW: 'payments.view',
  WITHDRAWALS_APPROVE: 'withdrawals.approve',
  ESCROW_RELEASE: 'escrow.release',
  REFUNDS_ISSUE: 'refunds.issue',
  DISPUTES_MANAGE: 'safety.manage',
  SUPPORT_VIEW: 'support.view',
  MARKETS_MANAGE: 'markets.manage',
  SETTINGS_MANAGE: 'settings.manage',
  ADMINS_MANAGE: 'admins.manage',
  AUDIT_VIEW: 'audit.view',
}

