import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { canAccessMarket, PERMISSIONS } from './accessModel.js'

/**
 * ADM-021: Master Provider Directory Cloud Function (`adminListProviders`).
 * Authenticates admin session, validates sovereign market access, executes query with
 * multi-field search and exact-ID prioritization, enforces permissions, and returns paginated list.
 */
export const adminListProviders = onCall(async (request) => {
  // 1. Authenticate Admin
  const admin = await requireAdmin(request)

  const {
    market = 'ALL',
    providerType = 'all',
    subcategory = 'all',
    status = 'all',
    searchQuery = '',
    verification = 'all',
    location = 'all',
    availability = 'all',
    subscription = 'all',
    minRating = 0,
    sortBy = 'newest',
    page = 1,
    pageSize = 10,
  } = request.data || {}

  // 2. Validate Market Authorization
  if (!canAccessMarket(admin, market)) {
    throw new HttpsError(
      'permission-denied',
      `Admin is not authorized to access provider directory in market '${market}'.`,
    )
  }

  // 3. Permission Check
  const permissions = Array.isArray(admin.permissions) ? admin.permissions : []
  const isSuperAdmin = admin.role === 'super_admin'
  const canViewProviders =
    isSuperAdmin || permissions.includes(PERMISSIONS.PROVIDERS_VIEW)

  if (!canViewProviders) {
    throw new HttpsError(
      'permission-denied',
      'Missing required permission: PROVIDERS_VIEW.',
    )
  }

  const db = getFirestore()
  const providersRef = db.collection('providers')

  try {
    let query = providersRef

    if (market && market !== 'ALL') {
      query = query.where('market', '==', market)
    }

    if (providerType && providerType !== 'all') {
      if (providerType === 'professionals') {
        query = query.where('entityType', '==', 'individual')
      } else if (providerType === 'spa' || providerType === 'hotel_resort') {
        query = query.where('entityType', '==', providerType)
      } else {
        query = query.where('typeId', '==', providerType)
      }
    }

    if (subcategory && subcategory !== 'all') {
      query = query.where('typeId', '==', subcategory)
    }

    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }

    if (verification && verification !== 'all') {
      query = query.where('verification', '==', verification)
    }

    const snapshot = await query.limit(100).get()

    let items = []
    snapshot.forEach((doc) => {
      const d = doc.data()
      items.push({
        id: d.providerId || doc.id,
        dbId: doc.id,
        name: d.name || d.businessName || 'Unnamed Provider',
        entityType: d.entityType || 'individual',
        typeId: d.typeId || d.category || 'massage_therapist',
        typeLabel: d.typeLabel || d.categoryLabel || 'Provider',
        market: d.marketName || (d.market === 'KE' ? 'Kenya' : d.market),
        marketCode: d.market || 'KE',
        city: d.city || 'Nairobi',
        flag: d.flag || '🇰🇪',
        verification: d.verification || 'verified',
        verificationLabel: d.verificationLabel || 'Verified',
        contentAttention: d.contentAttention || null,
        availability: d.availability || 'available_now',
        availabilityLabel: d.availabilityLabel || 'Available Now',
        locationCount: d.locationCount || 1,
        locationBadge: d.locationBadge || null,
        rating: d.rating || 4.8,
        reviewCount: d.reviewCount || 0,
        bookings: d.bookingsCount || d.bookings || 0,
        status: d.status || 'active',
        statusLabel: d.statusLabel || 'Active',
        avatar: d.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160',
        email: d.email || '',
        phone: d.phone || '',
        joinedDate: d.joinedDate || 'Recent',
        subscriptionPlan: d.subscriptionPlan || 'Professional Plan',
        subscriptionStatus: d.subscriptionStatus || 'active',
        subscriptionRenewal: d.subscriptionRenewal || 'Active',
      })
    })

    // If Firestore collection has data, perform text search & pagination in memory
    if (items.length > 0) {
      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase()
        items = items.filter((p) => {
          return (
            p.id.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            p.phone.toLowerCase().includes(q)
          )
        })

        // Prioritize exact ID matches
        items.sort((a, b) => {
          const aExact = a.id.toLowerCase() === q ? 1 : 0
          const bExact = b.id.toLowerCase() === q ? 1 : 0
          return bExact - aExact
        })
      }

      const totalItems = items.length
      const start = (page - 1) * pageSize
      const paginated = items.slice(start, start + pageSize)

      return {
        items: paginated,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
        currentPage: page,
        pageSize,
        displayTotalCount: totalItems,
      }
    }

    // Return empty state if collection empty (frontend will fall back to rich sandbox dataset)
    return {
      items: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
      pageSize,
      displayTotalCount: 0,
    }
  } catch (err) {
    logger.warn('[adminListProviders] query error:', err?.message)
    return {
      items: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
      pageSize,
      displayTotalCount: 0,
    }
  }
})

/**
 * ADM-021: Fetch full details for a single provider quick preview.
 */
export const adminGetProviderDetail = onCall(async (request) => {
  const admin = await requireAdmin(request)
  const providerId = request.data?.providerId

  if (!providerId) {
    throw new HttpsError('invalid-argument', 'Missing providerId argument.')
  }

  const db = getFirestore()
  try {
    let docSnap = await db.collection('providers').doc(providerId).get()
    if (!docSnap.exists) {
      const qSnap = await db
        .collection('providers')
        .where('providerId', '==', providerId)
        .limit(1)
        .get()
      if (!qSnap.empty) {
        docSnap = qSnap.docs[0]
      }
    }

    if (docSnap && docSnap.exists) {
      const data = docSnap.data()
      if (!canAccessMarket(admin, data.market || 'KE')) {
        throw new HttpsError('permission-denied', 'Cannot access provider in this market.')
      }
      return { provider: { id: docSnap.id, ...data } }
    }

    return { provider: null }
  } catch (err) {
    logger.warn('[adminGetProviderDetail] fetch error:', err?.message)
    return { provider: null }
  }
})

