import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { canAccessMarket, PERMISSIONS } from './accessModel.js'
import {
  calculateServicesSummary,
  filterServices,
  validateServiceModeration,
} from './providerServicesLogic.js'

/**
 * ADM-023: Retrieve Provider Services & Pricing catalogue.
 * Reuses source-of-truth service records from provider architecture,
 * calculates statistics, and applies filters.
 */
export const adminGetProviderServices = onCall(async (request) => {
  const admin = await requireAdmin(request)
  const { providerId, tab = 'all', search = '', category = 'all', priceRange = 'all', availability = 'all', status = 'all' } =
    request.data || {}

  if (!providerId) {
    throw new HttpsError('invalid-argument', 'Missing providerId argument.')
  }

  // Permission check
  const permissions = Array.isArray(admin.permissions) ? admin.permissions : []
  const isSuperAdmin = admin.role === 'super_admin'
  const canViewProviders =
    isSuperAdmin || permissions.includes(PERMISSIONS.PROVIDERS_VIEW) || permissions.includes('providers.view')

  if (!canViewProviders) {
    throw new HttpsError('permission-denied', 'Missing required permission: PROVIDERS_VIEW.')
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

    // 2. Fetch Services from Firestore (checking provider_services collection or provider subcollection)
    let services = []
    const srvSnap = await db.collection('provider_services').where('providerId', '==', providerId).get()

    if (!srvSnap.empty) {
      srvSnap.forEach((doc) => {
        services.push({ id: doc.id, ...doc.data() })
      })
    } else if (pDoc.exists) {
      // Check subcollection
      const subSnap = await pDoc.ref.collection('services').get()
      subSnap.forEach((doc) => {
        services.push({ id: doc.id, ...doc.data() })
      })
    }

    // 3. Compute Summary Statistics
    const stats = calculateServicesSummary(services)

    // 4. Filter Services
    const filtered = filterServices(services, {
      tab,
      search,
      category,
      priceRange,
      availability,
      status,
    })

    return {
      success: true,
      services: filtered,
      totalMatching: filtered.length,
      stats,
      provider: providerData ? { id: providerId, ...providerData } : null,
    }
  } catch (err) {
    logger.error('[adminGetProviderServices] Error:', err)
    if (err instanceof HttpsError) throw err
    throw new HttpsError('internal', err?.message || 'Failed to retrieve provider services.')
  }
})

/**
 * ADM-023: Retrieve Detail for a single service (price history, overrides, availability).
 */
export const adminGetProviderServiceDetail = onCall(async (request) => {
  const admin = await requireAdmin(request)
  const { providerId, serviceId } = request.data || {}

  if (!providerId || !serviceId) {
    throw new HttpsError('invalid-argument', 'providerId and serviceId are required.')
  }

  const db = getFirestore()
  try {
    let serviceDoc = await db.collection('provider_services').doc(serviceId).get()
    let serviceData = serviceDoc.exists ? serviceDoc.data() : null

    if (!serviceData) {
      const pDoc = await db.collection('providers').doc(providerId).get()
      if (pDoc.exists) {
        const subDoc = await pDoc.ref.collection('services').doc(serviceId).get()
        if (subDoc.exists) serviceData = subDoc.data()
      }
    }

    // Retrieve price change history
    let priceHistory = []
    try {
      const histSnap = await db
        .collection('provider_services')
        .doc(serviceId)
        .collection('price_history')
        .orderBy('effectiveDate', 'desc')
        .limit(10)
        .get()
      histSnap.forEach((doc) => priceHistory.push({ id: doc.id, ...doc.data() }))
    } catch (e) {
      logger.warn('Could not read price_history:', e?.message)
    }

    return {
      success: true,
      service: serviceData ? { id: serviceId, ...serviceData } : null,
      priceHistory,
    }
  } catch (err) {
    logger.error('[adminGetProviderServiceDetail] Error:', err)
    throw new HttpsError('internal', err?.message || 'Failed to retrieve service detail.')
  }
})

/**
 * ADM-023: Moderate Proposed Service Changes (Approve, Request Changes, Reject).
 */
export const adminModerateProviderService = onCall(async (request) => {
  const admin = await requireAdmin(request)
  const {
    providerId,
    serviceId,
    action, // 'approve' | 'request_changes' | 'reject'
    reasonCode,
    reasonLabel,
    messageToProvider,
    adminNote,
  } = request.data || {}

  if (!providerId || !serviceId || !action) {
    throw new HttpsError('invalid-argument', 'providerId, serviceId, and action are required.')
  }

  const validation = validateServiceModeration({
    action,
    reasonCode,
    reasonLabel,
    messageToProvider,
  })

  if (!validation.valid) {
    throw new HttpsError('invalid-argument', validation.error)
  }

  const db = getFirestore()
  try {
    const moderationRecord = {
      providerId,
      serviceId,
      action,
      reasonCode: reasonCode || null,
      reasonLabel: reasonLabel || null,
      messageToProvider: messageToProvider || null,
      adminNote: adminNote || null,
      reviewedBy: admin.name || 'Admin',
      reviewedByUid: admin.uid,
      reviewedAt: new Date().toISOString(),
      timestamp: FieldValue.serverTimestamp(),
    }

    // Write moderation log
    await db.collection('content_moderation_logs').add(moderationRecord)

    // Update service record if exists
    const srvRef = db.collection('provider_services').doc(serviceId)
    const srvDoc = await srvRef.get()
    if (srvDoc.exists) {
      if (action === 'approve') {
        const data = srvDoc.data()
        // If there were proposed changes, publish them
        const proposed = data.proposedChanges || {}
        await srvRef.update({
          ...proposed,
          proposedChanges: null,
          hasPendingChanges: false,
          approvalStatus: 'approved',
          reviewStatus: 'approved',
          lastApprovedAt: FieldValue.serverTimestamp(),
        })
      } else if (action === 'request_changes') {
        await srvRef.update({
          approvalStatus: 'changes_requested',
          reviewStatus: 'changes_requested',
          changesRequestedReason: reasonLabel || messageToProvider,
        })
      } else if (action === 'reject') {
        await srvRef.update({
          proposedChanges: null,
          hasPendingChanges: false,
          approvalStatus: 'rejected',
          reviewStatus: 'rejected',
        })
      }
    }

    // Write audit log
    await db.collection('audit_logs').add({
      type: 'PROVIDER_SERVICE_MODERATED',
      providerId,
      serviceId,
      action,
      adminUid: admin.uid,
      timestamp: FieldValue.serverTimestamp(),
    })

    return {
      success: true,
      moderation: moderationRecord,
    }
  } catch (err) {
    logger.error('[adminModerateProviderService] Error:', err)
    if (err instanceof HttpsError) throw err
    throw new HttpsError('internal', err?.message || 'Failed to moderate service.')
  }
})

/**
 * ADM-023: Update Service Active / Inactive Status.
 */
export const adminUpdateProviderServiceStatus = onCall(async (request) => {
  const admin = await requireAdmin(request)
  const { providerId, serviceId, active, adminNote } = request.data || {}

  if (!providerId || !serviceId || typeof active !== 'boolean') {
    throw new HttpsError('invalid-argument', 'providerId, serviceId, and active (boolean) are required.')
  }

  const db = getFirestore()
  try {
    const srvRef = db.collection('provider_services').doc(serviceId)
    const srvDoc = await srvRef.get()
    if (srvDoc.exists) {
      await srvRef.update({
        active,
        status: active ? 'active' : 'inactive',
        statusUpdatedAt: FieldValue.serverTimestamp(),
      })
    }

    await db.collection('audit_logs').add({
      type: 'PROVIDER_SERVICE_STATUS_UPDATED',
      providerId,
      serviceId,
      active,
      adminNote: adminNote || null,
      adminUid: admin.uid,
      timestamp: FieldValue.serverTimestamp(),
    })

    return {
      success: true,
      serviceId,
      active,
    }
  } catch (err) {
    logger.error('[adminUpdateProviderServiceStatus] Error:', err)
    throw new HttpsError('internal', err?.message || 'Failed to update service status.')
  }
})

