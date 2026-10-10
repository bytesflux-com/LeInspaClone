import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { canAccessMarket, PERMISSIONS } from './accessModel.js'
import {
  calculateBookingsSummary,
  filterProviderBookings,
  calculateTopServices,
  getEarningsChartPoints,
} from './providerBookingsLogic.js'

/**
 * ADM-024: Retrieve Provider Bookings, Ledger & Financial Overview.
 * REUSE / ADMIN VIEW over shared bookings, escrow and payments collections.
 */
export const adminGetProviderBookings = onCall(async (request) => {
  const admin = await requireAdmin(request)
  const {
    providerId,
    tab = 'all',
    search = '',
    service = 'all',
    bookingSource = 'all',
    paymentStatus = 'all',
    escrowStatus = 'all',
    dateRange = 'all',
  } = request.data || {}

  if (!providerId) {
    throw new HttpsError('invalid-argument', 'Missing providerId argument.')
  }

  // Permission check
  const permissions = Array.isArray(admin.permissions) ? admin.permissions : []
  const isSuperAdmin = admin.role === 'super_admin'
  const canView =
    isSuperAdmin ||
    permissions.includes(PERMISSIONS.PROVIDERS_VIEW) ||
    permissions.includes(PERMISSIONS.BOOKINGS_VIEW) ||
    permissions.includes('providers.view')

  if (!canView) {
    throw new HttpsError('permission-denied', 'Missing required permission: PROVIDERS_VIEW or BOOKINGS_VIEW.')
  }

  const db = getFirestore()

  try {
    // 1. Resolve Provider Document to verify market authorization
    let providerData = null
    const pDoc = await db.collection('providers').doc(providerId).get()
    if (pDoc.exists) {
      providerData = pDoc.data()
    } else {
      const qSnap = await db.collection('providers').where('providerId', '==', providerId).limit(1).get()
      if (!qSnap.empty) {
        providerData = qSnap.docs[0].data()
      }
    }

    if (providerData?.marketCode && !canAccessMarket(admin, providerData.marketCode)) {
      throw new HttpsError(
        'permission-denied',
        `Admin not authorized to access provider in market '${providerData.marketCode}'.`
      )
    }

    // 2. Fetch Bookings from shared collection
    let bookings = []
    const bSnap = await db.collection('bookings').where('providerId', '==', providerId).get()
    bSnap.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() })
    })

    // 3. Query ledger positions / wallet balances
    let ledger = {}
    try {
      const walletDoc = await db.collection('provider_wallets').doc(providerId).get()
      if (walletDoc.exists) {
        ledger = walletDoc.data()
      }
    } catch (e) {
      logger.warn('[adminGetProviderBookings] Could not load provider_wallets:', e?.message)
    }

    // 4. Compute summaries
    const summary = calculateBookingsSummary(bookings, ledger)
    const topServices = calculateTopServices(bookings)

    // 5. Apply filters
    const filtered = filterProviderBookings(bookings, {
      tab,
      search,
      service,
      bookingSource,
      paymentStatus,
      escrowStatus,
      dateRange,
    })

    return {
      success: true,
      bookings: filtered,
      totalMatching: filtered.length,
      summary,
      topServices,
      provider: providerData ? { id: providerId, ...providerData } : null,
    }
  } catch (err) {
    logger.error('[adminGetProviderBookings] Error:', err)
    if (err instanceof HttpsError) throw err
    throw new HttpsError('internal', err?.message || 'Failed to retrieve provider bookings.')
  }
})

/**
 * ADM-024: Retrieve Single Booking Detailed View (Payment breakdown, Escrow, Timeline).
 */
export const adminGetProviderBookingDetail = onCall(async (request) => {
  const admin = await requireAdmin(request)
  const { providerId, bookingId } = request.data || {}

  if (!providerId || !bookingId) {
    throw new HttpsError('invalid-argument', 'Missing providerId or bookingId argument.')
  }

  const db = getFirestore()
  try {
    const bDoc = await db.collection('bookings').doc(bookingId).get()
    if (!bDoc.exists) {
      throw new HttpsError('not-found', `Booking '${bookingId}' not found.`)
    }

    const bookingData = { id: bDoc.id, ...bDoc.data() }

    // Security check: sovereign market isolation
    if (bookingData.marketCode && !canAccessMarket(admin, bookingData.marketCode)) {
      throw new HttpsError('permission-denied', `Admin not authorized to access booking in market '${bookingData.marketCode}'.`)
    }

    // Resolve client record if needed
    let clientData = null
    if (bookingData.clientId) {
      const cDoc = await db.collection('clients').doc(bookingData.clientId).get()
      if (cDoc.exists) clientData = { id: cDoc.id, ...cDoc.data() }
    }

    // Resolve payment & escrow records
    let paymentData = null
    if (bookingData.paymentId) {
      const payDoc = await db.collection('payments').doc(bookingData.paymentId).get()
      if (payDoc.exists) paymentData = payDoc.data()
    }

    return {
      success: true,
      booking: bookingData,
      client: clientData,
      payment: paymentData,
    }
  } catch (err) {
    logger.error('[adminGetProviderBookingDetail] Error:', err)
    if (err instanceof HttpsError) throw err
    throw new HttpsError('internal', err?.message || 'Failed to retrieve booking detail.')
  }
})

/**
 * ADM-024: Retrieve Ledger-Backed Earnings Overview & Escrow Position.
 */
export const adminGetProviderEarningsOverview = onCall(async (request) => {
  const admin = await requireAdmin(request)
  const { providerId } = request.data || {}

  if (!providerId) {
    throw new HttpsError('invalid-argument', 'Missing providerId argument.')
  }

  const permissions = Array.isArray(admin.permissions) ? admin.permissions : []
  const isSuperAdmin = admin.role === 'super_admin'
  const canSeeFinance =
    isSuperAdmin || permissions.includes(PERMISSIONS.FINANCE_VIEW) || permissions.includes('finance.view')

  if (!canSeeFinance) {
    throw new HttpsError('permission-denied', 'Missing required permission: FINANCE_VIEW.')
  }

  const db = getFirestore()
  try {
    const walletDoc = await db.collection('provider_wallets').doc(providerId).get()
    const ledger = walletDoc.exists ? walletDoc.data() : {}

    // Recent transactions
    let recentTransactions = []
    const txSnap = await db
      .collection('wallet_transactions')
      .where('walletId', '==', providerId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get()

    txSnap.forEach((doc) => recentTransactions.push({ id: doc.id, ...doc.data() }))

    return {
      success: true,
      ledger,
      recentTransactions,
    }
  } catch (err) {
    logger.error('[adminGetProviderEarningsOverview] Error:', err)
    if (err instanceof HttpsError) throw err
    throw new HttpsError('internal', err?.message || 'Failed to retrieve earnings overview.')
  }
})

/**
 * ADM-024: Retrieve Earnings Performance Time Series Points.
 */
export const adminGetProviderEarningsChart = onCall(async (request) => {
  await requireAdmin(request)
  const { period = '30d' } = request.data || {}

  const points = getEarningsChartPoints(period)
  return {
    success: true,
    period,
    points,
  }
})

