import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// Writes to the shared `security_events` collection, using the same shape as
// the mobile backend ({ userId, eventType, deviceInfo, createdAt }). The rules
// only allow a signed-in user to record their own events, so failed sign-ins
// (no user yet) must be recorded server-side instead.
export async function recordSecurityEvent(userId, eventType) {
  try {
    await addDoc(collection(db, 'security_events'), {
      userId,
      eventType,
      deviceInfo: {
        platform: 'admin_web',
        userAgent: navigator.userAgent,
        language: navigator.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      createdAt: serverTimestamp(),
    })
  } catch (err) {
    // Never block sign-in on telemetry.
    console.warn('Failed to record security event', err)
  }
}
