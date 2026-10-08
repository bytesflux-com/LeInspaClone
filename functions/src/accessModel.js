import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { newSessionData, sessionPolicy } from './session.js'

// Admin authorization model, owned by this backend:
//   admin_permissions/{permissionId}  catalog of everything an admin can do
//   admin_roles/{roleId}              named sets of permissions
//   admin_profiles/{uid}              each admin's role, markets + status (ACTIVE | SUSPENDED | REVOKED)
//   admin_sessions/{uid_authTime}     each sign-in that passed 2FA (see session.js)
// Bump CATALOG_VERSION when permissions or roles change; the next admin login
// writes the new catalog.
export const CATALOG_VERSION = 1

export const PERMISSIONS = {
  'dashboard.view': { name: 'View dashboard', category: 'Overview', sensitive: false },
  'users.view': { name: 'View users', category: 'Users', sensitive: false },
  'users.suspend': { name: 'Suspend or reactivate users', category: 'Users', sensitive: true },
  'providers.view': { name: 'View providers, spas and hotels', category: 'Providers', sensitive: false },
  'providers.verify': { name: 'Approve or reject provider verification', category: 'Providers', sensitive: true },
  'bookings.view': { name: 'View bookings', category: 'Bookings', sensitive: false },
  'bookings.manage': { name: 'Change or cancel bookings', category: 'Bookings', sensitive: true },
  'payments.view': { name: 'View payments and wallets', category: 'Finance', sensitive: false },
  'withdrawals.approve': { name: 'Approve withdrawals', category: 'Finance', sensitive: true },
  'escrow.release': { name: 'Release escrow', category: 'Finance', sensitive: true },
  'refunds.issue': { name: 'Issue refunds', category: 'Finance', sensitive: true },
  'support.view': { name: 'View support tickets', category: 'Support', sensitive: false },
  'support.respond': { name: 'Reply to support tickets', category: 'Support', sensitive: false },
  'safety.manage': { name: 'Handle safety reports', category: 'Safety', sensitive: true },
  'markets.manage': { name: 'Manage country operations', category: 'Platform', sensitive: true },
  'settings.manage': { name: 'Change platform configuration', category: 'Platform', sensitive: true },
  'admins.manage': { name: 'Manage admin accounts and roles', category: 'Platform', sensitive: true },
  'audit.view': { name: 'View audit logs and admin sessions', category: 'Platform', sensitive: true },
}

export const ROLES = {
  super_admin: {
    name: 'Super Admin',
    description: 'Full access to every market and setting.',
    permissions: Object.keys(PERMISSIONS),
  },
  country_admin: {
    name: 'Country Admin',
    description: 'Runs day-to-day operations for assigned markets.',
    permissions: [
      'dashboard.view',
      'users.view',
      'users.suspend',
      'providers.view',
      'providers.verify',
      'bookings.view',
      'bookings.manage',
      'payments.view',
      'support.view',
      'support.respond',
      'safety.manage',
    ],
  },
  finance_admin: {
    name: 'Finance Admin',
    description: 'Payments, withdrawals, escrow and refunds.',
    permissions: [
      'dashboard.view',
      'bookings.view',
      'payments.view',
      'withdrawals.approve',
      'escrow.release',
      'refunds.issue',
      'audit.view',
    ],
  },
  verification_officer: {
    name: 'Verification Officer',
    description: 'Reviews provider verification documents.',
    permissions: ['dashboard.view', 'users.view', 'providers.view', 'providers.verify'],
  },
  support_agent: {
    name: 'Support Agent',
    description: 'Answers clients and providers.',
    permissions: ['dashboard.view', 'users.view', 'providers.view', 'bookings.view', 'support.view', 'support.respond'],
  },
}

// Admins who existed before this model get full access, matching what the
// shared Firestore rules already give every admin today.
export const BOOTSTRAP_ROLE = 'super_admin'
// Country codes an admin may operate in; 'ALL' = every enabled market.
export const ALL_MARKETS = 'ALL'
export const ADMIN_STATUSES = ['ACTIVE', 'SUSPENDED', 'REVOKED']

const db = () => getFirestore()
export const profileRef = (uid) => db().collection('admin_profiles').doc(uid)

// Writes the permission and role catalog when it is missing or outdated.
export async function ensureAccessModel() {
  const marker = await db().collection('admin_roles').doc(BOOTSTRAP_ROLE).get()
  if (marker.exists && marker.get('catalogVersion') >= CATALOG_VERSION) return

  const batch = db().batch()
  const now = FieldValue.serverTimestamp()
  for (const [permissionId, p] of Object.entries(PERMISSIONS)) {
    batch.set(db().collection('admin_permissions').doc(permissionId), {
      permissionId,
      ...p,
      catalogVersion: CATALOG_VERSION,
      updatedAt: now,
    })
  }
  for (const [roleId, r] of Object.entries(ROLES)) {
    batch.set(db().collection('admin_roles').doc(roleId), {
      roleId,
      ...r,
      isSystem: true,
      catalogVersion: CATALOG_VERSION,
      updatedAt: now,
    })
  }
  await batch.commit()
}

// Called after a successful 2FA: creates the profile on first login, records
// the login, and opens an admin session for this sign-in.
export async function recordAdminLogin(request, { uid, email, displayName, authTime }) {
  await ensureAccessModel()
  const policy = await sessionPolicy()
  const now = FieldValue.serverTimestamp()
  const ref = profileRef(uid)

  await db().runTransaction(async (tx) => {
    const profile = await tx.get(ref)
    if (!profile.exists) {
      tx.set(ref, {
        userId: uid,
        email,
        fullName: displayName ?? null,
        roleId: BOOTSTRAP_ROLE,
        markets: [ALL_MARKETS],
        status: 'ACTIVE',
        twoFactorEnabled: true,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
      })
    } else {
      tx.update(ref, { email, twoFactorEnabled: true, lastLoginAt: now, updatedAt: now })
    }
    tx.set(db().collection('admin_sessions').doc(`${uid}_${authTime}`), newSessionData(request, uid, authTime, policy))
  })
}

// Ends every open session of an admin (e.g. after a password reset).
export async function revokeAdminSessions(uid, reason) {
  const sessions = await db().collection('admin_sessions').where('adminId', '==', uid).get()
  const open = sessions.docs.filter((d) => ['ACTIVE', 'LOCKED'].includes(d.get('status')))
  if (open.length === 0) return 0
  const batch = db().batch()
  open.forEach((d) =>
    batch.update(d.ref, { status: 'REVOKED', revokedReason: reason, revokedAt: FieldValue.serverTimestamp() }),
  )
  await batch.commit()
  return open.length
}

// Permissions of an admin profile (missing profile = pre-model admin).
export async function permissionsFor(profile) {
  const roleId = profile?.exists ? profile.get('roleId') : BOOTSTRAP_ROLE
  const role = await db().collection('admin_roles').doc(roleId).get()
  // Fall back to the in-code catalog until the first login writes it.
  return new Set(role.exists ? role.get('permissions') : (ROLES[roleId]?.permissions ?? []))
}

// Current role, permissions and markets, always read fresh (ADM-004: never
// rely on what was cached at sign-in).
export async function adminAccess(uid) {
  const profile = await profileRef(uid).get()
  const roleId = profile.exists ? profile.get('roleId') : BOOTSTRAP_ROLE
  const role = await db().collection('admin_roles').doc(roleId).get()
  return {
    roleId,
    roleName: role.exists ? role.get('name') : (ROLES[roleId]?.name ?? roleId),
    permissions: [...(await permissionsFor(profile))].sort(),
    markets: profile.exists ? (profile.get('markets') ?? []) : [ALL_MARKETS],
    fullName: profile.exists ? profile.get('fullName') : null,
  }
}

// Market access check for market-scoped data. The country selector in the UI
// is navigation only; this is the security layer.
export function canAccessMarket(access, countryCode) {
  return access.markets.includes(ALL_MARKETS) || access.markets.includes(countryCode)
}
