import { logger } from 'firebase-functions/v2'
import { PROVIDER_ACCOUNT_TYPES, PROVIDER_TYPES, countryCodeOf, loadProvider, mergeProvider, providerTypeOf } from './platformData.js'

// Firestore loaders for ADM-020 → ADM-028. Providers are the mobile app's own
// records: users/{uid} (identity, accountType, accountStatus, country) +
// provider_profiles/{uid} + <type collection>/{uid} (+ services / gallery
// subcollections). There is no `providers` collection.

const rows = async (query, label, limit = 2000) => {
  try {
    const snap = await query.limit(limit).get()
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    logger.warn(`[providers] ${label} read failed`, err.message)
    return []
  }
}

/** Every provider, merged from users + provider_profiles + type collections. */
export async function loadAllProviders(db) {
  const [users, profiles, ...typeDocs] = await Promise.all([
    rows(db.collection('users').where('accountType', 'in', PROVIDER_ACCOUNT_TYPES.slice(0, 30)), 'provider users', 10000),
    rows(db.collection('provider_profiles'), 'provider_profiles', 10000),
    ...Object.values(PROVIDER_TYPES).map((t) => rows(db.collection(t.collection), t.collection, 10000)),
  ])
  const byUid = new Map()
  const entry = (uid) => {
    if (!byUid.has(uid)) byUid.set(uid, { user: {}, profile: {}, detail: {} })
    return byUid.get(uid)
  }
  for (const u of users) entry(u.id).user = u
  for (const p of profiles) entry(p.id).profile = p
  Object.keys(PROVIDER_TYPES).forEach((type, i) => {
    for (const d of typeDocs[i]) {
      const e = entry(d.id)
      e.detail = d
      if (!providerTypeOf(e.user.accountType)) e.user = { ...e.user, accountType: type }
    }
  })
  return [...byUid]
    .filter(([, e]) => providerTypeOf(e.user.accountType) || providerTypeOf(e.profile.accountType))
    .map(([uid, e]) => ({ ...mergeProvider(uid, e), raw: e }))
}

/** Everything ADM-022 → ADM-028 show for one provider. Finance sources only when permitted. */
export async function loadProviderBundle(db, uid, { finance = false } = {}) {
  const provider = await loadProvider(db, uid)
  if (!provider) return null
  const detailRef = provider.refs.detail
  const none = Promise.resolve([])
  const [userSnap, profileSnap, detailSnap] = await Promise.all([provider.refs.user.get(), provider.refs.profile.get(), detailRef ? detailRef.get() : null])
  const [services, gallery, bookings, reviews, subscriptions, subscriptionPayments, wallet, walletTx, withdrawals, escrows, verificationRequests, safety, disputesAgainst, disputesBy, support, restrictions, actions, notes, content] = await Promise.all([
    detailRef ? rows(detailRef.collection('services'), 'services', 500) : none,
    detailRef ? rows(detailRef.collection('gallery'), 'gallery', 500) : none,
    rows(db.collection('bookings').where('providerId', '==', uid), 'bookings', 5000),
    rows(db.collection('reviews').where('providerId', '==', uid), 'reviews', 5000),
    rows(db.collection('subscriptions').where('userId', '==', uid), 'subscriptions', 200),
    rows(db.collection('subscription_payments').where('providerId', '==', uid), 'subscription payments', 200),
    finance ? db.collection('wallets').doc(uid).get().then((s) => (s.exists ? s.data() : null)).catch(() => null) : null,
    finance ? rows(db.collection('wallet_transactions').where('userId', '==', uid), 'wallet transactions', 500) : none,
    finance ? rows(db.collection('withdrawal_requests').where('userId', '==', uid), 'withdrawals', 500) : none,
    finance ? rows(db.collection('escrow_transactions').where('providerId', '==', uid), 'escrow', 2000) : none,
    rows(db.collection('verification_requests').where('userId', '==', uid), 'verification requests', 200),
    rows(db.collection('safety_reports').where('providerId', '==', uid), 'safety reports', 300),
    rows(db.collection('disputes').where('againstId', '==', uid), 'disputes against', 300),
    rows(db.collection('disputes').where('reporterId', '==', uid), 'disputes by', 300),
    rows(db.collection('support_tickets').where('userId', '==', uid), 'support tickets', 300),
    rows(db.collection('account_restrictions').where('providerId', '==', uid), 'restrictions', 300),
    rows(db.collection('account_actions').where('providerId', '==', uid), 'account actions', 300),
    rows(db.collection('admin_notes').where('providerId', '==', uid), 'admin notes', 100),
    rows(db.collection('content_moderation').where('providerId', '==', uid), 'content moderation', 300),
  ])
  const disputes = [...new Map([...disputesAgainst, ...disputesBy].map((d) => [d.id, d])).values()]
  return {
    provider: { ...provider, refs: undefined },
    refs: provider.refs,
    raw: { user: userSnap.exists ? userSnap.data() : {}, profile: profileSnap.exists ? profileSnap.data() : {}, detail: detailSnap?.exists ? detailSnap.data() : {} },
    services,
    gallery,
    bookings,
    reviews,
    subscriptions,
    subscriptionPayments,
    wallet,
    walletTx,
    withdrawals,
    escrows,
    verificationRequests,
    safety,
    disputes,
    support,
    restrictions,
    actions,
    notes,
    content,
    finance,
  }
}

export const resolvedCountry = (p) => p.countryCode || countryCodeOf(p.country)
