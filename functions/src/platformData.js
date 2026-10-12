// Shared mapping between the Lé Inspa mobile app's Firestore records and the
// Admin panel. The mobile app is the source of truth; this module only reads
// and normalizes what it writes:
//
//   users/{uid}                    identity, accountType, accountStatus, country
//   customer_profiles/{uid}        client details
//   provider_profiles/{uid}        shared provider summary (rating, totals)
//   <type collection>/{uid}        provider details per type (see PROVIDER_TYPES)
//   <type collection>/{uid}/services   provider services
//
// Live data stores country as a name ("Kenya") or a code ("KE"), and some
// accountType values use the collection name ("massage_therapists"); both are
// resolved here so every screen applies the same rules.

const COUNTRY_ALIASES = {
  ke: 'KE', kenya: 'KE',
  ug: 'UG', uganda: 'UG',
  tz: 'TZ', tanzania: 'TZ',
  rw: 'RW', rwanda: 'RW',
  za: 'ZA', 'south africa': 'ZA',
  ng: 'NG', nigeria: 'NG',
  pk: 'PK', pakistan: 'PK',
  in: 'IN', india: 'IN',
}
export const CURRENCY_COUNTRY = { KES: 'KE', UGX: 'UG', TZS: 'TZ', RWF: 'RW', ZAR: 'ZA', NGN: 'NG' }

// First value that resolves to a known ISO country code, else null.
export function countryCodeOf(...values) {
  for (const v of values) {
    if (typeof v !== 'string' || !v.trim()) continue
    const code = COUNTRY_ALIASES[v.trim().toLowerCase()]
    if (code) return code
  }
  return null
}

// Canonical provider types → their per-type collection and display data.
export const PROVIDER_TYPES = {
  massage_therapist: { collection: 'massage_therapists', category: 'individual', label: 'Massage Therapist' },
  fitness_trainer: { collection: 'fitness_personal_trainers', category: 'individual', label: 'Fitness Trainer' },
  yoga_specialist: { collection: 'yoga_specialists', category: 'individual', label: 'Yoga Specialist' },
  meditation_specialist: { collection: 'meditation_wellness_specialists', category: 'individual', label: 'Meditation & Wellness Specialist' },
  physiotherapist: { collection: 'physiotherapists_recovery_specialists', category: 'individual', label: 'Physiotherapist' },
  spa: { collection: 'spa_wellness_centers', category: 'spa', label: 'Spa & Wellness Center' },
  hotel_resort: { collection: 'hotels_wellness_resorts', category: 'hotel', label: 'Hotel & Wellness Resort' },
}

const TYPE_ALIASES = {
  massage_therapists: 'massage_therapist',
  fitness_personal_trainers: 'fitness_trainer',
  personal_trainer: 'fitness_trainer',
  fitness_personal_trainer: 'fitness_trainer',
  yoga_specialists: 'yoga_specialist',
  meditation_wellness_specialists: 'meditation_specialist',
  meditation_wellness_specialist: 'meditation_specialist',
  physiotherapists_recovery_specialists: 'physiotherapist',
  physiotherapy: 'physiotherapist',
  spa_wellness_centers: 'spa',
  spa_wellness_center: 'spa',
  hotels_wellness_resorts: 'hotel_resort',
  hotel: 'hotel_resort',
  hotels: 'hotel_resort',
}

export function providerTypeOf(value) {
  const t = String(value ?? '').trim().toLowerCase()
  if (PROVIDER_TYPES[t]) return t
  return TYPE_ALIASES[t] || null
}

// Every raw accountType a provider can carry (for Firestore `in` queries, ≤ 30).
export const PROVIDER_ACCOUNT_TYPES = [...new Set([...Object.keys(PROVIDER_TYPES), ...Object.keys(TYPE_ALIASES)])]

export const providerCategoryOf = (type) => PROVIDER_TYPES[providerTypeOf(type)]?.category || null

// users.accountStatus uses pending | approved | rejected | suspended (some
// records use "active"). Admin screens treat approved and active as active.
export function accountStatusOf(value) {
  const s = String(value ?? '').trim().toLowerCase()
  if (s === 'approved' || s === 'active') return 'active'
  if (['pending', 'rejected', 'suspended', 'deactivated', 'under_review', 'restricted'].includes(s)) return s
  return s || 'pending'
}

export const lowerStatus = (v) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, '_')

// Plain-JS millis from Firestore Timestamp / ISO / number.
export function millis(v) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return v
  if (typeof v.toMillis === 'function') return v.toMillis()
  if (v instanceof Date) return v.getTime()
  if (typeof v._seconds === 'number') return v._seconds * 1000
  const p = Date.parse(v)
  return Number.isNaN(p) ? null : p
}

// Market scope check for an already-resolved country code. `markets` null = unrestricted.
export const inMarkets = (code, markets) => !markets || (code && markets.includes(code))

/**
 * Merges the provider records the mobile app keeps for one uid into one view:
 * users (identity/status) + provider_profiles (summary) + type collection (details).
 */
export function mergeProvider(uid, { user = {}, profile = {}, detail = {} } = {}) {
  const type = providerTypeOf(user.accountType) || providerTypeOf(profile.accountType) || providerTypeOf(detail.accountType) || providerTypeOf(detail.providerCategory)
  const info = PROVIDER_TYPES[type] || {}
  const verification = lowerStatus(detail.verificationStatus || user.verificationStatus || (user.isVerified || detail.isVerified ? 'approved' : 'pending'))
  return {
    uid,
    type,
    category: info.category || 'individual',
    typeLabel: profile.professionalTitle || info.label || 'Provider',
    collection: info.collection || null,
    name: detail.businessName || detail.displayName || profile.displayName || user.displayName || user.fullName || detail.fullName || 'Provider',
    email: user.email || detail.email || null,
    phone: user.phoneNumber || detail.phoneNumber || null,
    city: detail.city || profile.city || user.city || null,
    region: detail.region || profile.region || user.region || null,
    country: detail.country || profile.country || user.country || null,
    countryCode: countryCodeOf(user.countryCode, detail.countryCode, user.country, detail.country, profile.country),
    avatar: detail.profilePhoto || detail.logo || detail.businessLogo || profile.profilePhoto || user.profilePhoto || null,
    accountStatus: accountStatusOf(user.accountStatus || detail.accountStatus),
    rawAccountStatus: user.accountStatus || detail.accountStatus || null,
    verificationStatus: verification === 'verified' ? 'approved' : verification,
    verified: ['approved', 'verified'].includes(verification),
    identityVerificationStatus: lowerStatus(user.identityVerificationStatus || detail.identityVerificationStatus) || null,
    professionalVerificationStatus: lowerStatus(user.professionalVerificationStatus || detail.professionalVerificationStatus) || null,
    businessVerificationStatus: lowerStatus(detail.businessVerificationStatus) || null,
    rating: Number(detail.averageRating ?? profile.averageRating ?? 0) || 0,
    reviewCount: Number(detail.totalReviews ?? profile.totalReviews ?? 0) || 0,
    totalBookings: Number(detail.totalBookings ?? profile.totalBookings ?? user.successfulBookings ?? 0) || 0,
    subscriptionPlan: detail.subscriptionPlan || user.subscriptionPlan || null,
    subscriptionStatus: detail.subscriptionStatus || user.subscriptionStatus || null,
    premiumVisibility: Boolean(detail.premiumVisibility),
    isAvailable: detail.isAvailable ?? profile.isAvailable ?? null,
    walletBalance: Number(detail.walletBalance ?? 0) || 0,
    createdAt: millis(user.createdAt || detail.createdAt),
    lastActive: millis(user.lastActive || user.lastLoginAt),
    bio: detail.bio || detail.description || profile.bio || null,
    yearsExperience: detail.yearsExperience ?? profile.yearsExperience ?? detail.yearsInBusiness ?? null,
    languages: detail.languages || profile.languages || [], // list or string (both occur in app data)
  }
}

/** Loads and merges the provider records for a uid. Returns null if `users/{uid}` is not a provider. */
export async function loadProvider(db, uid) {
  if (!uid || String(uid).includes('/')) return null
  const [userSnap, profileSnap] = await Promise.all([db.collection('users').doc(uid).get(), db.collection('provider_profiles').doc(uid).get()])
  const user = userSnap.exists ? userSnap.data() : {}
  const profile = profileSnap.exists ? profileSnap.data() : {}
  let type = providerTypeOf(user.accountType) || providerTypeOf(profile.accountType)
  let detail = {}
  let detailRef = null
  if (type) {
    detailRef = db.collection(PROVIDER_TYPES[type].collection).doc(uid)
    const d = await detailRef.get()
    detail = d.exists ? d.data() : {}
  } else {
    // users doc missing or untyped: look the uid up in each type collection.
    for (const [t, info] of Object.entries(PROVIDER_TYPES)) {
      const d = await db.collection(info.collection).doc(uid).get()
      if (d.exists) { type = t; detail = d.data(); detailRef = d.ref; break }
    }
  }
  if (!type) return null
  return { ...mergeProvider(uid, { user: { accountType: type, ...user }, profile, detail }), refs: { user: db.collection('users').doc(uid), profile: profileSnap.ref, detail: detailRef } }
}

/** Batch-loads users docs → Map(uid → data). */
export async function loadUsers(db, uids) {
  const ids = [...new Set(uids.filter((u) => u && !String(u).includes('/')))]
  const out = new Map()
  for (let i = 0; i < ids.length; i += 300) {
    const snaps = await db.getAll(...ids.slice(i, i + 300).map((id) => db.collection('users').doc(id)))
    for (const s of snaps) if (s.exists) out.set(s.id, s.data())
  }
  return out
}

/** Country of a booking: provider's country, then client's, then currency. */
export function bookingCountry(booking, providerUser, clientUser) {
  return (
    countryCodeOf(booking.countryCode, booking.marketId) ||
    countryCodeOf(providerUser?.countryCode, providerUser?.country) ||
    countryCodeOf(clientUser?.countryCode, clientUser?.country) ||
    CURRENCY_COUNTRY[booking.local?.currency || booking.currency] ||
    null
  )
}
