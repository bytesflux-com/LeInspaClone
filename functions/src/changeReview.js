import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { recordAudit } from './events.js'
import { checklistFor, historyEntry, label, OPEN_STATUSES } from './contentModerationLogic.js'
import {
  changeRequestOutcome,
  decideField,
  normalizeField,
  publishable,
  serviceEligibility,
  servicePublishPatch,
  validateFieldDecision,
  validateServiceDecision,
} from './changeReviewLogic.js'
import { requireId, transact } from './contentModeration.js'

// ADM-038 Profile Information Change Review · ADM-039 Service Information Approval.
//
// Both reuse `content_moderation` (contentType profile_change / service) and
// write back to the provider's own records — `providers/{id}` for profile
// fields and `provider_services/{id}` for services (same contract as ADM-023:
// proposedChanges → live, approvalStatus). Live values stay public until a
// change is approved; rejecting a proposal never touches the live record.

const db = () => getFirestore()

const input = (d) => ({
  decision: d.decision,
  checks: d.checks && typeof d.checks === 'object' ? d.checks : {},
  reason: d.reason ? String(d.reason).slice(0, 200) : null,
  affectedField: d.affectedField ? String(d.affectedField).slice(0, 80) : null,
  providerMessage: d.providerMessage ? String(d.providerMessage).slice(0, 2000) : null,
  internalNote: d.internalNote ? String(d.internalNote).slice(0, 2000) : null,
  escalateTo: d.escalateTo || null,
})

// Re-verification goes back to the Verification Center rather than being
// approved by content moderation.
function reverificationRecord(record, fields, actor, now) {
  return {
    providerId: record.provider.id,
    countryCode: record.countryCode,
    source: 'content_moderation',
    moderationId: record.id,
    fields: fields.map((f) => ({ key: f.key, label: f.label, current: f.current ?? null, proposed: f.proposed ?? null, route: f.reverifyRoute || null })),
    status: 'open',
    requestedBy: actor,
    createdAt: now,
  }
}

/**
 * ADM-038 — decide one changed profile field.
 * data: { moderationId, version, fieldKey, decision: approve|request_changes|reject|reverify, checks?, reason?, providerMessage?, internalNote? }
 */
export const adminProfileFieldDecision = onCall(async (request) => {
  const d = request.data || {}
  const id = requireId(d.moderationId)
  const inp = input(d)
  const { uid, record } = await transact(request, id, d.version, ({ record, actor, now }) => {
    if (record.contentType !== 'profile_change') throw new HttpsError('failed-precondition', 'This is not a profile change request.')
    if (!OPEN_STATUSES.includes(record.status)) throw new HttpsError('failed-precondition', `This request is already ${label(record.status).toLowerCase()}.`)
    const fields = (record.profileChange?.fields || []).map(normalizeField)
    const field = fields.find((f) => f.key === d.fieldKey)
    const error = validateFieldDecision(field, inp, checklistFor('profile_change'))
    if (error) throw new HttpsError('invalid-argument', error)
    const next = decideField(fields, field.key, inp, actor, now)
    const outcome = changeRequestOutcome(next)
    const history = [historyEntry(id, `${field.label}: ${label(next.find((f) => f.key === field.key).status)}${inp.reason ? ` — ${inp.reason}` : ''}`, actor, now, { field: field.key, decision: inp.decision })]
    let reverify = null
    if (inp.decision === 'reverify') {
      const ref = db().collection('reverification_requests').doc()
      history.push(historyEntry(id, `Sent for re-verification (${field.reverifyRoute?.label || 'Verification Review'})`, actor, now, { reverificationId: ref.id }))
      reverify = { ref, data: reverificationRecord(record, [field], actor, now) }
    }
    return {
      reverify,
      patch: {
        'profileChange.fields': next,
        status: outcome || (record.status === 'awaiting_review' ? 'under_review' : record.status),
        assignedTo: record.assignedTo || actor,
        ...(outcome ? { reviewedBy: actor, reviewedAt: now, decision: 'field_review_complete' } : {}),
      },
      history,
    }
  }, (tx, o) => {
    if (o.reverify) tx.set(o.reverify.ref, o.reverify.data)
  })
  await recordAudit(request, { actorId: uid, action: `content.profile_field_${inp.decision}`, entityId: `${id}/${d.fieldKey}`, entityType: 'profile_change', metadata: { providerId: record.provider.id, reason: inp.reason } })
  return { ok: true }
})
/**
 * ADM-038 — publish every approved, non-sensitive field to the live profile
 * in one transaction. Unresolved and re-verification fields stay pending.
 * data: { moderationId, version }
 */
export const adminPublishProfileChanges = onCall(async (request) => {
  const d = request.data || {}
  const id = requireId(d.moderationId)
  let published = []
  const { uid, record } = await transact(request, id, d.version, ({ record, actor, now }) => {
    if (record.contentType !== 'profile_change') throw new HttpsError('failed-precondition', 'This is not a profile change request.')
    const fields = (record.profileChange?.fields || []).map(normalizeField)
    const ready = publishable(fields)
    if (!ready.length) throw new HttpsError('failed-precondition', 'There are no approved changes to publish.')
    published = ready
    const next = fields.map((f) => (ready.some((r) => r.key === f.key) ? { ...f, status: 'published', publishedAt: now } : f))
    const outcome = changeRequestOutcome(next)
    return {
      patch: {
        'profileChange.fields': next,
        status: outcome || record.status,
        ...(outcome ? { reviewedBy: actor, reviewedAt: now, decision: 'published', publicEligible: true } : {}),
      },
      history: [historyEntry(id, `Published ${ready.length} approved change${ready.length === 1 ? '' : 's'}: ${ready.map((f) => f.label).join(', ')}`, actor, now, { fields: ready.map((f) => f.key) })],
      // Live profile update happens inside the same transaction.
      livePatch: Object.fromEntries(ready.map((f) => [f.path, f.proposed])),
    }
  }, async (tx, o, record) => {
    if (!record.provider.id) return
    const ref = db().collection('providers').doc(record.provider.id)
    const snap = await tx.get(ref)
    if (snap.exists) tx.update(ref, { ...o.livePatch, profileUpdatedAt: FieldValue.serverTimestamp() })
  })
  await recordAudit(request, { actorId: uid, action: 'content.profile_changes_published', entityId: id, entityType: 'profile_change', metadata: { providerId: record.provider.id, fields: published.map((f) => f.key) } })
  return { ok: true, published: published.map((f) => f.key) }
})

/**
 * ADM-039 — decide a new service or a service update.
 * data: { moderationId, version, decision: approve|request_changes|reject|reverify|escalate, checks?, reason?, affectedField?, providerMessage?, internalNote?, escalateTo? }
 */
export const adminServiceDecision = onCall(async (request) => {
  const d = request.data || {}
  const id = requireId(d.moderationId)
  const inp = input(d)
  const { uid, record } = await transact(request, id, d.version, ({ record, actor, now }) => {
    if (record.contentType !== 'service' || !record.serviceChange) throw new HttpsError('failed-precondition', 'This is not a service submission.')
    if (!OPEN_STATUSES.includes(record.status)) throw new HttpsError('failed-precondition', `This service is already ${label(record.status).toLowerCase()}.`)
    const proposed = record.serviceChange.proposed || {}
    // Eligibility is revalidated on every decision, not trusted from the UI.
    const eligibility = serviceEligibility(record.provider.type, proposed.category, record.provider.typeLabel)
    const error = validateServiceDecision(inp, { checklist: checklistFor('service'), eligibility })
    if (error) throw new HttpsError('invalid-argument', error)
    const status = { approve: 'approved', request_changes: 'changes_requested', reject: 'rejected', reverify: 'reverification', escalate: 'escalated' }[inp.decision]
    const isUpdate = Boolean(record.serviceChange.current)
    const history = [historyEntry(id, `${label(status)}${inp.affectedField ? ` (${inp.affectedField})` : ''}${inp.reason ? ` — ${inp.reason}` : ''}`, actor, now, { decision: inp.decision })]
    if (inp.decision === 'reverify') history.push(historyEntry(id, 'Sent for verification review (ADM-031 / ADM-033)', actor, now))
    return {
      patch: {
        status,
        decision: inp.decision,
        reason: inp.reason,
        affectedField: inp.affectedField,
        providerMessage: inp.providerMessage,
        internalNote: inp.internalNote,
        policyChecks: inp.checks,
        reviewedBy: actor,
        reviewedAt: now,
        publicEligible: status === 'approved',
        ...(inp.decision === 'escalate' ? { escalation: { team: inp.escalateTo, reason: inp.reason, at: now } } : {}),
      },
      history,
      serviceId: record.serviceChange.serviceId,
      servicePatch:
        status === 'approved'
          ? { ...servicePublishPatch(proposed), proposedChanges: null, hasPendingChanges: false, approvalStatus: 'approved', reviewStatus: 'approved', lastApprovedAt: FieldValue.serverTimestamp() }
          : status === 'changes_requested'
            ? { approvalStatus: 'changes_requested', reviewStatus: 'changes_requested', changesRequestedReason: inp.reason }
            : status === 'rejected'
              ? isUpdate
                ? { proposedChanges: null, hasPendingChanges: false, approvalStatus: 'approved', reviewStatus: 'rejected' } // live version stays intact
                : { approvalStatus: 'rejected', reviewStatus: 'rejected' }
              : null,
      reverify: inp.decision === 'reverify' ? { ref: db().collection('reverification_requests').doc(), data: reverificationRecord(record, [{ key: 'category', label: 'Service Category', current: record.serviceChange.current?.category ?? null, proposed: proposed.category, reverifyRoute: { adm: 'ADM-033', label: 'Professional Credentials' } }], actor, now) } : null,
    }
  }, async (tx, o) => {
    if (o.reverify) tx.set(o.reverify.ref, o.reverify.data)
    if (!o.servicePatch || !o.serviceId) return
    const ref = db().collection('provider_services').doc(o.serviceId)
    const snap = await tx.get(ref)
    if (snap.exists) tx.update(ref, o.servicePatch)
  })
  await recordAudit(request, { actorId: uid, action: `content.service_${inp.decision}`, entityId: id, entityType: 'service_moderation', metadata: { providerId: record.provider.id, serviceId: record.serviceChange?.serviceId || null, reason: inp.reason } })
  return { ok: true }
})
