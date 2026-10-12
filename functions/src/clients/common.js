// Shared helpers for the Client Management callables (ADM-010 → ADM-019).
//
// Every callable follows the same sequence the specs ask for:
//   authenticate → validate session → resolve role + permissions → resolve markets
//   → enforce country scope SERVER-SIDE → read the real collections → mask by permission.
// The country selector in the browser is navigation only; `scopeFor` / `loadClient`
// are the security layer.
import { HttpsError } from 'firebase-functions/v2/https'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from '../auth.js'
import { ALL_MARKETS, adminAccess, canAccessMarket } from '../accessModel.js'
import { recordAudit } from '../events.js'

export const db = () => getFirestore()

// ---------------------------------------------------------------------------
// Field map. If your Firestore field names differ, change them HERE only.
// ---------------------------------------------------------------------------
export const F = {
  country: 'countryCode',
  region: 'region',
  city: 'city',
  name: 'fullName',
  email: 'email',
  phone: 'phoneNumber',
  gender: 'gender',
  photo: 'photoURL',
  status: 'accountStatus',
  membership: 'membershipType',
  clientCode: 'clientCode', // optional display id, e.g. "CL-78421". Falls back to the document id.
  created: 'createdAt',
  updated: 'updatedAt',
  lastActive: 'lastActiveAt',
  verified: 'contactVerified', // boolean; falls back to isEmailVerified / isPhoneVerified
  regMethod: 'registrationMethod',
  guestConverted: 'guestConverted',
  // denormalised counters kept on the users document (used for fast directory filters)
  bookings: 'successfulBookings',
  lifetimeValue: 'lifetimeBookingValue',
  lastBookingAt: 'lastBookingAt',
  hasUpcoming: 'hasUpcomingBooking',
  inService: 'inServiceNow',
  cancelledRecently: 'cancelledRecently',
  openDisputes: 'openDisputeCount',
  openTickets: 'openSupportTicketCount',
  openSafety: 'openSafetyCaseCount',
  paymentIssue: 'hasPaymentIssue',
  referralCode: 'referralCode',
  referredBy: 'referredBy',
  totalSavings: 'totalSavings',
  tags: 'adminTags',
}
// The field on bookings / payments / wallets / ... that points back to the client.
export const CLIENT_FIELD = 'customerId'

export const COUNTRIES = {
  KE: { name: 'Kenya', currency: 'KES', tz: 'Africa/Nairobi', dial: '+254' },
  UG: { name: 'Uganda', currency: 'UGX', tz: 'Africa/Kampala', dial: '+256' },
  TZ: { name: 'Tanzania', currency: 'TZS', tz: 'Africa/Dar_es_Salaam', dial: '+255' },
  RW: { name: 'Rwanda', currency: 'RWF', tz: 'Africa/Kigali', dial: '+250' },
  ZA: { name: 'South Africa', currency: 'ZAR', tz: 'Africa/Johannesburg', dial: '+27' },
}
export const MARKET_CODES = Object.keys(COUNTRIES)
export const currencyOf = (code) => COUNTRIES[code]?.currency ?? 'USD'
export const countryName = (code) => COUNTRIES[code]?.name ?? code ?? ''
export const tzOf = (code) => COUNTRIES[code]?.tz ?? 'Africa/Nairobi'

// ---------------------------------------------------------------------------
// Admin context
// ---------------------------------------------------------------------------
// perms.* is what THIS admin may do. The UI only reflects it; every mutation re-checks.
export async function adminCtx(request, { permission, fresh = false } = {}) {
  const uid = await requireAdmin(request, { permission, fresh })
  const access = await adminAccess(uid)
  const set = new Set(access.permissions)
  const superAdmin = access.roleId === 'super_admin'
  const has = (p) => superAdmin || set.has(p)
  return {
    uid,
    access,
    has,
    name: access.fullName || request.auth?.token?.email || uid,
    role: access.roleName,
    perms: {
      finance: has('payments.view'),
      safety: has('safety.manage'),
      support: has('support.view'),
      respond: has('support.respond'),
      manage: has('users.suspend'),
      export: has('users.export'),
      reveal: has('users.reveal_pii'),
      memberships: has('memberships.manage'),
      superAdmin,
    },
  }
}

export const need = (ctx, permission, message) => {
  if (!ctx.has(permission)) {
    throw new HttpsError('permission-denied', message || 'Your admin role does not allow this action.', {
      reason: 'missing-permission',
      permission,
    })
  }
}

// Market scope for list/aggregate queries: { codes: ['KE'] } or { codes: null } (= everything).
export function scopeFor(ctx, requested) {
  const market = String(requested || ALL_MARKETS).toUpperCase()
  if (market !== ALL_MARKETS) {
    if (!canAccessMarket(ctx.access, market)) {
      throw new HttpsError('permission-denied', 'You are not authorised for this market.', { reason: 'market-denied' })
    }
    return { market, codes: [market] }
  }
  if (ctx.access.markets.includes(ALL_MARKETS)) return { market: ALL_MARKETS, codes: null }
  return { market: ALL_MARKETS, codes: ctx.access.markets.slice(0, 30) }
}

export function applyScope(query, scope, field = F.country) {
  if (!scope.codes) return query
  return scope.codes.length === 1 ? query.where(field, '==', scope.codes[0]) : query.where(field, 'in', scope.codes)
}

const notFound = () => new HttpsError('not-found', 'Client not found or outside your authorised markets.')

// Loads one client and enforces country scope. Out-of-scope clients look like missing ones.
export async function loadClient(ctx, clientId, market) {
  const id = String(clientId ?? '')
  if (!/^[\w.-]{1,128}$/.test(id)) throw notFound()
  const users = db().collection('users')
  let snap = await users.doc(id).get()
  if (!snap.exists) {
    const byCode = await users.where(F.clientCode, '==', id).limit(1).get()
    snap = byCode.docs[0]
  }
  if (!snap?.exists || snap.get('accountType') !== 'customer') throw notFound()
  const country = snap.get(F.country)
  const wanted = String(market || ALL_MARKETS).toUpperCase()
  if (!canAccessMarket(ctx.access, country)) throw notFound()
  if (wanted !== ALL_MARKETS && wanted !== country) throw notFound()
  return snap
}

// ---------------------------------------------------------------------------
// Value mapping
// ---------------------------------------------------------------------------
export function iso(value) {
  if (!value) return null
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'number') return new Date(value).toISOString()
  if (typeof value === 'string') return Number.isNaN(Date.parse(value)) ? null : new Date(value).toISOString()
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  return null
}
export const ms = (value) => {
  const s = iso(value)
  return s ? Date.parse(s) : 0
}
export const tsFrom = (value) => {
  const t = ms(value)
  return t ? Timestamp.fromMillis(t) : null
}
export const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
export const lower = (v) => String(v ?? '').toLowerCase()
export const DAY_MS = 86_400_000

// Raw accountStatus values (mobile architecture: pending/approved/rejected/suspended …) ↔ UI statuses.
export const STATUS_RAW = {
  active: ['approved', 'active'],
  pending: ['pending'],
  inactive: ['inactive', 'rejected'],
  suspended: ['suspended'],
  deactivated: ['deactivated', 'deleted'],
}
export function statusOf(raw) {
  const v = lower(raw)
  for (const [ui, list] of Object.entries(STATUS_RAW)) if (list.includes(v)) return ui
  return 'pending'
}
export const TIER_RAW = { standard: ['standard', 'free', 'basic'], premium: ['premium'], executive: ['executive'] }
export function tierOf(raw) {
  const v = lower(raw)
  for (const [ui, list] of Object.entries(TIER_RAW)) if (list.includes(v)) return ui
  return 'none'
}
export const rawValuesFor = (map, ui) => map[ui] ?? null

export function contactVerified(u) {
  const v = u.get(F.verified)
  if (typeof v === 'boolean') return v
  return Boolean(u.get('isEmailVerified') || u.get('isPhoneVerified'))
}

// ---------------------------------------------------------------------------
// Masking (PII is masked by default; only users.reveal_pii + audit unmasks it)
// ---------------------------------------------------------------------------
export function maskEmail(email) {
  const [local, domain] = String(email ?? '').split('@')
  if (!domain) return '•••••'
  return `${local.charAt(0)}${'•'.repeat(5)}@${domain}`
}
export function maskPhone(phone, country) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  const dial = COUNTRIES[country]?.dial ?? (String(phone ?? '').startsWith('+') ? String(phone).slice(0, 4) : '')
  if (!digits) return '••• ••• •••'
  const dialDigits = dial.replace(/\D/g, '')
  const rest = digits.startsWith(dialDigits) ? digits.slice(dialDigits.length) : digits.replace(/^0/, '')
  return `${dial} ${rest.charAt(0) || '•'}•• ••• •••`.trim()
}
export function formatPhone(phone, country) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  const dial = COUNTRIES[country]?.dial
  if (!dial) return phone || ''
  const d = dial.replace(/\D/g, '')
  const rest = digits.startsWith(d) ? digits.slice(d.length) : digits.replace(/^0/, '')
  return `${dial} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`.trim()
}

// ---------------------------------------------------------------------------
// Client projections
// ---------------------------------------------------------------------------
export const displayId = (u) => u.get(F.clientCode) || u.id

export function clientBlock(u) {
  const country = u.get(F.country)
  return {
    id: displayId(u),
    name: u.get(F.name) || 'Client',
    photoURL: u.get(F.photo) || null,
    gender: u.get(F.gender) === 'male' || u.get(F.gender) === 'm' ? 'm' : 'f',
    membershipTier: tierOf(u.get(F.membership)),
    status: statusOf(u.get(F.status)),
    contactVerified: contactVerified(u),
    country,
    countryName: countryName(country),
    city: u.get(F.city) || '',
    joinedAt: iso(u.get(F.created)),
    lastActiveAt: iso(u.get(F.lastActive)),
    asOf: new Date().toISOString(),
    timeZone: tzOf(country),
    currency: currencyOf(country),
  }
}

// ---------------------------------------------------------------------------
// Paging / counting
// ---------------------------------------------------------------------------
export function paginate(rows, { page, pageSize }, defaultSize) {
  const size = Math.min(100, Math.max(1, Number(pageSize) || defaultSize))
  const totalPages = Math.max(1, Math.ceil(rows.length / size))
  const p = Math.min(Math.max(1, Number(page) || 1), totalPages)
  return { items: rows.slice((p - 1) * size, p * size), total: rows.length, page: p, pageSize: size, totalPages }
}
export const safeCount = async (query) => {
  try {
    return (await query.count().get()).data().count
  } catch {
    return 0
  }
}
export function withinDays(value, days, now = Date.now()) {
  const t = ms(value)
  return t > 0 && now - t <= days * DAY_MS
}
// Reads up to `cap` documents of one client's records. Per-client history is bounded, so
// filtering/sorting happens in memory and no composite indexes are needed.
export async function clientDocs(collection, clientId, cap = 1000, field = CLIENT_FIELD) {
  const snap = await db().collection(collection).where(field, '==', clientId).limit(cap).get()
  return snap.docs
}
// Related records may reference the client by its uid or by its display code.
export async function clientDocsAny(collection, user, cap = 1000, field = CLIENT_FIELD) {
  const ids = [...new Set([user.id, user.get(F.clientCode)].filter(Boolean))]
  const snap = await db().collection(collection).where(field, 'in', ids).limit(cap).get()
  return snap.docs
}

// ---------------------------------------------------------------------------
// Internal notes (admin_notes) + audit
// ---------------------------------------------------------------------------
export async function listNotes(clientUid, scope, refId = null) {
  let q = db().collection('admin_notes').where('clientId', '==', clientUid).where('scope', '==', scope)
  if (refId) q = q.where('refId', '==', refId)
  const snap = await q.limit(100).get()
  return snap.docs
    .map((d) => ({ id: d.id, author: d.get('authorName'), text: d.get('text'), note: d.get('text'), createdAt: iso(d.get('createdAt')) }))
    .sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0))
}

export function cleanText(value, { min = 1, max = 1000, label = 'Text' } = {}) {
  const text = String(value ?? '').trim()
  if (text.length < min) throw new HttpsError('invalid-argument', `${label} is required.`)
  if (text.length > max) throw new HttpsError('invalid-argument', `${label} can be at most ${max} characters.`)
  return text
}

export async function addNote(request, ctx, user, { scope, refId = null, text }) {
  const body = cleanText(text, { max: 1000, label: 'Note' })
  const ref = await db().collection('admin_notes').add({
    clientId: user.id,
    scope,
    refId,
    text: body,
    authorId: ctx.uid,
    authorName: ctx.name,
    countryCode: user.get(F.country) ?? null,
    createdAt: FieldValue.serverTimestamp(),
  })
  await recordAudit(request, {
    actorId: ctx.uid,
    action: `client.${scope}_note_added`,
    entityId: user.id,
    entityType: 'user',
    metadata: { refId, noteId: ref.id },
  })
  return { id: ref.id, author: ctx.name, text: body, note: body, createdAt: new Date().toISOString() }
}

export const audit = (request, ctx, action, user, metadata = {}) =>
  recordAudit(request, { actorId: ctx.uid, action, entityId: user.id, entityType: 'user', metadata })

// Sensitive-case access is audit-logged (ADM-018).
export const auditSensitive = (request, ctx, user, caseId, caseType) =>
  audit(request, ctx, 'client.sensitive_case_opened', user, { caseId, caseType })

// Audit entry that can be written INSIDE a transaction, so a sensitive change and its audit
// record commit together. Same shape as recordAudit() in events.js.
export function auditEntry(request, ctx, { action, entityId, entityType = 'user', metadata = {} }) {
  const raw = request.rawRequest
  const ref = db().collection('audit_logs').doc()
  return {
    ref,
    data: {
      actorId: ctx.uid,
      action,
      entityId,
      entityType,
      metadata: { ...metadata, platform: 'admin_web', ipAddress: raw?.ip ?? null, userAgent: raw?.get?.('user-agent') ?? null },
      timestamp: FieldValue.serverTimestamp(),
    },
  }
}
