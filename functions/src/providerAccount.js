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
import { clean, normalizeBooking, normalizeCase, normalizeProvider, toMillis } from './providerAdminShared.js'
import {
  DEFAULT_ACCOUNT_POLICY,
  buildAccountView,
  normalizeRestriction,
  planAccountAction,
  requiresFreshAuth,
} from './providerAccountLogic.js'
import { normalizeAssessment } from './providerRiskLogic.js'
import { normalizeSubscription, resolveSubscriptionStatus } from './providerSubscriptionLogic.js'

// ADM-028 — Provider Account Actions / Suspension.
// Account status lives on the existing records (users.accountStatus and the
// provider profile); scoped restrictions in `account_restrictions`; history in
// `account_actions`. Bookings and wallet funds are never modified here.

// Safety / dispute / support cases that reference the provider.
export async function loadCases(provider) {
  const [safety, disputes] = await Promise.all([
    docsForProvider('safety_reports', provider, 'safety reports', { limit: 300 }),
    docsForProvider('disputes', provider, 'disputes', { limit: 300 }),
  ])
  return [
    ...safety.docs.map((d) => normalizeCase(d.id, d, 'safety')),
    ...disputes.docs.map((d) => normalizeCase(d.id, d, 'dispute')),
  ]
}

async function accountPolicy() {
  const snap = await db().collection('platform_settings').doc('provider_account_policy').get()
  return { ...DEFAULT_ACCOUNT_POLICY, ...(snap.exists ? snap.data() : {}) }
}

export async function loadRestrictions(provider) {
  const res = await docsForProvider('account_restrictions', provider, 'restrictions', { limit: 300 })
  return res.docs.map((d) => normalizeRestriction(d.id, d)).filter(Boolean)
}

/** ADM-028 on load. data: { providerId } */
export const adminGetProviderAccountActions = onCall(async (request) => {
  const { access, perms } = await providerScope(request)
  const providerId = requireProviderId(request.data?.providerId)
  try {
    const { provider } = await loadProvider(providerId, access)
    const [restrictions, actions, bookings, cases, wallet, withdrawals, sub, assessments, notes, notifications] = await Promise.all([
      loadRestrictions(provider),
      docsForProvider('account_actions', provider, 'account actions', { limit: 200 }),
      docsForProvider('bookings', provider, 'bookings', { limit: 5000 }),
      loadCases(provider),
      perms.viewFinance ? db().collection('provider_wallets').doc(provider.docId).get() : null,
      perms.viewFinance ? docsForProvider('withdrawal_requests', provider, 'withdrawals', { limit: 200 }) : { docs: [] },
      db().collection('provider_subscriptions').doc(provider.docId).get(),
      docsForProvider('provider_risk_assessments', provider, 'assessments', { limit: 20 }),
      safeDocs(db().collection('admin_notes').where('providerId', '==', provider.id).where('context', '==', 'account'), 'account notes', 50),
      provider.userId
        ? safeDocs(db().collection('notifications').where('recipientId', '==', provider.userId).where('category', '==', 'account'), 'notifications', 50)
        : { docs: [] },
    ])
    const subscription = sub.exists ? normalizeSubscription(sub.id, sub.data()) : null
    const latest = assessments.docs.map((d) => normalizeAssessment(d.id, d)).sort((a, b) => (b.reviewedAt || 0) - (a.reviewedAt || 0))[0] || null
    return buildAccountView({
      provider,
      restrictions,
      actions: actions.docs,
      notifications: notifications.docs,
      bookings: bookings.docs.map((d) => normalizeBooking(d.id, d)),
      cases,
      wallet: wallet?.exists ? wallet.data() : null,
      withdrawals: withdrawals.docs,
      subscriptionStatus: resolveSubscriptionStatus(subscription, Date.now()).label,
      assessment: latest,
      notes: notes.docs,
      permissions: perms,
      now: Date.now(),
    })
  } catch (err) {
    rethrow('adminGetProviderAccountActions', err, 'Account actions could not be loaded.')
  }
})

/**
 * ADM-028 single write path for every account action.
 * data: { providerId, action, reasonCode, scope?, kind?, targetId?, duration?, customUntil?, caseId?,
 *         providerMessage?, internalNote?, notify?, restrictionId?, restore?, expectedStatus? }
 */
export const adminApplyProviderAccountAction = onCall(async (request) => {
  const d = request.data || {}
  // High-risk actions require a recent session re-verification (ADM-004).
  const { uid, access, perms, actor } = await providerScope(request, { permission: 'users.suspend', fresh: requiresFreshAuth(d) })
  const providerId = requireProviderId(d.providerId)
  try {
    const { ref, provider: loaded } = await loadProvider(providerId, access)
    const [cases, policy] = await Promise.all([loadCases(loaded), accountPolicy()])
    const restrictionCol = db().collection('account_restrictions')

    const result = await db().runTransaction(async (tx) => {
      // Latest provider state + restrictions, read inside the transaction.
      const fresh = await tx.get(ref)
      const provider = normalizeProvider(fresh.id, fresh.data())
      const rSnap = await tx.get(restrictionCol.where('providerId', '==', provider.id).limit(300))
      const restrictions = rSnap.docs.map((x) => normalizeRestriction(x.id, x.data())).filter(Boolean)
      const userRef = provider.userId ? db().collection('users').doc(provider.userId) : null

      const plan = planAccountAction({ provider, restrictions, cases, input: d, actor, permissions: perms, policy, now: Date.now() })
      if (plan.error) throw new HttpsError(plan.code || 'invalid-argument', plan.error)

      const actionRef = db().collection('account_actions').doc()
      tx.set(actionRef, { ...plan.actionRecord, actionId: actionRef.id, providerId: provider.id, subjectType: 'provider', createdAt: FieldValue.serverTimestamp() })
      for (const r of plan.restrictionsCreate) {
        const rRef = restrictionCol.doc()
        tx.set(rRef, { ...r, restrictionId: rRef.id, providerId: provider.id, subjectType: 'provider', actionId: actionRef.id, createdAt: FieldValue.serverTimestamp() })
      }
      for (const u of plan.restrictionUpdates) tx.update(restrictionCol.doc(u.id), u.patch)
      if (plan.providerPatch) {
        tx.update(ref, { ...plan.providerPatch, status: plan.providerPatch.accountStatus })
        if (userRef && userRef.path !== ref.path) tx.set(userRef, { accountStatus: plan.providerPatch.accountStatus }, { merge: true })
      }
      if (plan.notification && provider.userId) {
        queueNotification(tx, { ...plan.notification, recipientId: provider.userId, recipientType: 'provider', category: 'account', related: { actionId: actionRef.id, caseId: plan.actionRecord.caseId } })
      }
      auditEntry(tx, request, { actorId: uid, action: plan.audit.action, entityId: provider.id, entityType: 'provider_account', metadata: { ...plan.audit, actionId: actionRef.id } })
      return plan
    })
    return { ok: true, message: result.message, newStatus: result.actionRecord.newStatus }
  } catch (err) {
    rethrow('adminApplyProviderAccountAction', err, 'The account action could not be applied.')
  }
})

/** ADM-028 Notes & Internal Comments. data: { providerId, text } — internal only, never shown to the provider. */
export const adminAddProviderAccountNote = onCall(async (request) => {
  const { uid, access, actor } = await providerScope(request)
  const providerId = requireProviderId(request.data?.providerId)
  const text = clean(request.data?.text)
  if (text.length < 3) throw new HttpsError('invalid-argument', 'The note is empty.')
  try {
    const { provider } = await loadProvider(providerId, access)
    const ref = db().collection('admin_notes').doc()
    const batch = db().batch()
    batch.set(ref, { providerId: provider.id, context: 'account', note: text, authorId: uid, authorName: actor.name, createdAt: FieldValue.serverTimestamp() })
    auditEntry(batch, request, { actorId: uid, action: 'PROVIDER_ACCOUNT_NOTE_ADDED', entityId: provider.id, entityType: 'provider_account', metadata: { noteId: ref.id } })
    await batch.commit()
    return { ok: true, note: { id: ref.id, text, author: actor.name, at: toMillis(new Date()) } }
  } catch (err) {
    rethrow('adminAddProviderAccountNote', err, 'The note could not be saved.')
  }
})
