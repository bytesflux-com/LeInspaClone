import { logger } from 'firebase-functions/v2'
import { getFirestore } from 'firebase-admin/firestore'
import { normalizeBooking } from './bookingsLogic.js'
import { bookingCountry, countryCodeOf, millis } from './platformData.js'

// Bounded reads of the mobile app's collections for Admin aggregations. Each
// returns plain objects with `id`; a failing optional collection degrades to []
// (logged) so one missing source never blanks a whole screen. `truncated`
// marks a read that hit its cap — the signal to move that view to a
// materialized aggregate.

const db = () => getFirestore()

export async function readAll(collection, { limit = 5000, where, orderBy } = {}) {
  try {
    let q = db().collection(collection)
    for (const w of where || []) q = q.where(...w)
    if (orderBy) q = q.orderBy(...orderBy)
    const snap = await q.limit(limit).get()
    return { rows: snap.docs.map((d) => ({ id: d.id, ...d.data() })), truncated: snap.size >= limit }
  } catch (err) {
    logger.warn(`[platform] ${collection} read failed`, err.message)
    return { rows: [], truncated: false }
  }
}

/** users → Map(uid → data) plus resolved countryCode on each record. */
export async function readUsers(limit = 10000) {
  const { rows, truncated } = await readAll('users', { limit })
  for (const u of rows) u.countryCodeResolved = countryCodeOf(u.countryCode, u.country)
  return { users: rows, byId: new Map(rows.map((u) => [u.id, u])), truncated }
}

/**
 * Bookings (drafts excluded) normalized by bookingsLogic, with the country
 * derived from provider/client/currency and the USD reporting amount kept.
 */
export async function readBookings(usersById, { limit = 5000 } = {}) {
  const { rows, truncated } = await readAll('bookings', { limit })
  const out = []
  for (const d of rows) {
    if (String(d.bookingStatus ?? d.status ?? '').toLowerCase() === 'draft') continue
    const provider = usersById.get(d.providerId)
    const b = normalizeBooking(d.id, {
      ...d,
      derivedCountryCode: bookingCountry(d, provider, usersById.get(d.customerId ?? d.clientId)),
      derivedProviderName: provider?.displayName || provider?.fullName || null,
    })
    b.amountBase = typeof d.base?.totalPrice === 'number' ? d.base.totalPrice : null
    b.platformFeeBase = typeof d.base?.platformFee === 'number' ? d.base.platformFee : null
    b.createdAtMs = millis(d.createdAt)
    out.push(b)
  }
  return { bookings: out, truncated }
}

/** Country of a record owned by a user (withdrawals, wallets, reports…). */
export const ownerCountry = (usersById, ...uids) => {
  for (const uid of uids) {
    const u = usersById.get(uid)
    if (u?.countryCodeResolved) return u.countryCodeResolved
  }
  return null
}
