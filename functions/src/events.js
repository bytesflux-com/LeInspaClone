import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'

function requestContext(request) {
  const raw = request.rawRequest
  return {
    platform: 'admin_web',
    ipAddress: raw?.ip ?? null,
    userAgent: raw?.get?.('user-agent') ?? null,
  }
}

// Same shape as the mobile backend: { userId, eventType, deviceInfo, createdAt }.
export async function recordSecurityEvent(request, userId, eventType, extra = {}) {
  try {
    await getFirestore()
      .collection('security_events')
      .add({ userId, eventType, deviceInfo: requestContext(request), ...extra, createdAt: FieldValue.serverTimestamp() })
  } catch (error) {
    logger.warn('Failed to record security event', { eventType, error: error.message })
  }
}

// Same shape as the mobile backend: { actorId, action, entityId, entityType, metadata, timestamp }.
export async function recordAudit(request, { actorId, action, entityId, entityType, metadata = {} }) {
  try {
    await getFirestore()
      .collection('audit_logs')
      .add({
        actorId,
        action,
        entityId,
        entityType,
        metadata: { ...metadata, ...requestContext(request) },
        timestamp: FieldValue.serverTimestamp(),
      })
  } catch (error) {
    logger.warn('Failed to record audit log', { action, error: error.message })
  }
}
