import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { FieldValue } from 'firebase-admin/firestore'
import {
  auditEntry,
  db,
  docsForProvider,
  loadProvider,
  providerScope,
  queueNotification,
  requireProviderId,
  rethrow,
  safeDocs,
} from './providerAdminContext.js'
import {
  DEFAULT_REVIEW_POLICY,
  buildReviewDetail,
  buildReviewsView,
  normalizeBooking,
  normalizeReport,
  normalizeReview,
  planReviewModeration,
  reportFromFlag,
} from './providerReviewsLogic.js'

// ADM-025 — Provider Reviews (REUSE / ADMIN VIEW).
// Reads the shared review records the client and provider apps already use:
//   reviews                   the app's reviews (original text/rating never modified;
//                             app report flags isReported/reportedAt surface as reports)
//   review_reports            reports against a review or a provider response
//   review_moderation_events  append-only moderation history
//   bookings                  booking linkage for verification
// Moderation writes run in a transaction, preserve the original review, append
// history, queue notifications and write audit_logs.

async function reviewPolicy() {
  const snap = await db().collection('platform_settings').doc('review_policy').get()
  return { ...DEFAULT_REVIEW_POLICY, ...(snap.exists ? snap.data() : {}) }
}

async function loadReviewSet(provider) {
  const [reviews, reports, bookings] = await Promise.all([
    docsForProvider('reviews', provider, 'reviews', { limit: 5000 }),
    docsForProvider('review_reports', provider, 'review reports', { limit: 3000 }),
    docsForProvider('bookings', provider, 'bookings', { limit: 5000 }),
  ])
  const normalized = reviews.docs.map((d) => normalizeReview(d.id, d))
  const recorded = reports.docs.map((d) => normalizeReport(d.id, d))
  const reported = new Set(recorded.map((r) => r.reviewId))
  return {
    reviews: normalized,
    reports: [...recorded, ...normalized.filter((r) => !reported.has(r.id)).map(reportFromFlag).filter(Boolean)],
    bookings: bookings.docs.map((d) => normalizeBooking(d.id, d)),
    truncated: reviews.truncated || bookings.truncated,
  }
}

/**
 * ADM-025 on load. data: { providerId, tab?, search?, rating?, dateRange?, status?, bookingVerified?, hasMedia?, hasResponse?, page?, pageSize? }
 */
export const adminGetProviderReviews = onCall(async (request) => {
  const { access, perms } = await providerScope(request)
  const providerId = requireProviderId(request.data?.providerId)
  try {
    const { provider } = await loadProvider(providerId, access)
    const set = await loadReviewSet(provider)
    const view = buildReviewsView({ ...set, filters: request.data || {}, now: Date.now() })
    return { provider, ...view, truncated: set.truncated, permissions: perms }
  } catch (err) {
    rethrow('adminGetProviderReviews', err, 'Provider reviews could not be loaded.')
  }
})

async function findReview(provider, reviewId) {
  const col = db().collection('reviews')
  let snap = await col.doc(reviewId).get()
  if (!snap.exists) {
    const q = await col.where('reviewId', '==', reviewId).limit(1).get()
    if (q.empty) throw new HttpsError('not-found', 'Review not found.')
    snap = q.docs[0]
  }
  const review = normalizeReview(snap.id, snap.data())
  const keys = [provider.id, provider.docId, provider.userId]
  if (!keys.includes(review.providerId)) throw new HttpsError('not-found', 'Review not found for this provider.')
  return { ref: snap.ref, review }
}

async function loadReviewContext(provider, review) {
  const [reports, events, siblings, booking] = await Promise.all([
    safeDocs(db().collection('review_reports').where('reviewId', '==', review.id), 'review reports', 100),
    safeDocs(db().collection('review_moderation_events').where('reviewId', '==', review.id), 'review history', 200),
    docsForProvider('reviews', provider, 'sibling reviews', { limit: 5000 }),
    review.bookingId ? db().collection('bookings').doc(review.bookingId).get() : null,
  ])
  let bookingRecord = booking?.exists ? normalizeBooking(booking.id, booking.data()) : null
  if (!bookingRecord && review.bookingId) {
    const q = await safeDocs(db().collection('bookings').where('bookingId', '==', review.bookingId), 'booking by id', 1)
    if (q.docs[0]) bookingRecord = normalizeBooking(q.docs[0].id, q.docs[0])
  }
  const recorded = reports.docs.map((d) => normalizeReport(d.id, d))
  return {
    reports: recorded.length ? recorded : [reportFromFlag(review)].filter(Boolean),
    events: events.docs,
    siblings: siblings.docs.map((d) => normalizeReview(d.id, d)),
    booking: bookingRecord,
  }
}

/**
 * ADM-025 review drawer. data: { providerId, reviewId }
 */
export const adminGetProviderReviewDetail = onCall(async (request) => {
  const { access, perms } = await providerScope(request)
  const providerId = requireProviderId(request.data?.providerId)
  const reviewId = requireProviderId(request.data?.reviewId)
  try {
    const { provider } = await loadProvider(providerId, access)
    const { review } = await findReview(provider, reviewId)
    const [ctx, policy] = await Promise.all([loadReviewContext(provider, review), reviewPolicy()])
    return buildReviewDetail({ review, provider, policy, canModerate: perms.moderateReviews, ...ctx })
  } catch (err) {
    rethrow('adminGetProviderReviewDetail', err, 'The review could not be loaded.')
  }
})

/**
 * ADM-025 moderation. data: { providerId, reviewId, action, target?, reasonCode?, clientExplanation?, internalNote?, expectedStatus? }
 */
export const adminModerateProviderReview = onCall(async (request) => {
  const { uid, access, actor } = await providerScope(request, { permission: 'content.moderate' })
  const d = request.data || {}
  const providerId = requireProviderId(d.providerId)
  const reviewId = requireProviderId(d.reviewId)
  try {
    const { provider } = await loadProvider(providerId, access)
    const { ref } = await findReview(provider, reviewId)

    const result = await db().runTransaction(async (tx) => {
      // Re-read the latest state inside the transaction.
      const fresh = await tx.get(ref)
      const review = normalizeReview(fresh.id, fresh.data())
      const reportSnap = await tx.get(db().collection('review_reports').where('reviewId', '==', review.id).limit(100))
      const recorded = reportSnap.docs.map((doc) => normalizeReport(doc.id, doc.data()))
      const reports = recorded.length ? recorded : [reportFromFlag(review)].filter(Boolean)

      const plan = planReviewModeration({ review, reports, input: d, actor, now: Date.now() })
      if (plan.error) throw new HttpsError(plan.code || 'invalid-argument', plan.error)

      const flagResolved = plan.reportUpdates.some((u) => u.id.startsWith('flag-') && u.patch.status === 'resolved')
      // Moderation state is stored on the review as admin fields; text and rating are never changed.
      tx.update(ref, { ...plan.reviewPatch, ...(plan.audit.target === 'response' ? { providerReplyStatus: plan.newStatus } : {}), ...(flagResolved ? { isReported: false, reportResolvedAt: Date.now(), reportOutcome: plan.newStatus } : {}) })
      for (const u of plan.reportUpdates) if (!u.id.startsWith('flag-')) tx.update(db().collection('review_reports').doc(u.id), u.patch)
      for (const e of plan.events) {
        tx.set(db().collection('review_moderation_events').doc(), {
          ...e,
          reviewId: review.id,
          providerId: review.providerId,
          createdAt: FieldValue.serverTimestamp(),
        })
      }
      for (const n of plan.notifications) {
        queueNotification(tx, { ...n, category: 'reviews', related: { reviewId: review.id } })
      }
      auditEntry(tx, request, {
        actorId: uid,
        action: plan.audit.action,
        entityId: review.id,
        entityType: 'provider_review',
        metadata: { ...plan.audit, providerId: provider.id },
      })
      return plan
    })
    return { ok: true, status: result.newStatus, message: result.message }
  } catch (err) {
    rethrow('adminModerateProviderReview', err, 'The moderation decision could not be saved.')
  }
})
