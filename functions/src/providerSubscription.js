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
  DEFAULT_SUBSCRIPTION_POLICY,
  buildSubscriptionView,
  normalizePayment,
  normalizePlan,
  normalizeSubscription,
  planSubscriptionChange,
  planVisibilityChange,
} from './providerSubscriptionLogic.js'
import { normalizeRestriction } from './providerAccountLogic.js'

// ADM-026 — Provider Subscription & Visibility (Admin control/view layer over
// the shared subscription engine). Collections: provider_subscriptions,
// subscription_plans, subscription_history, provider_visibility,
// visibility_history, payments, account_restrictions, notifications, audit_logs.
// Admin cannot mark a payment successful — payment truth comes from `payments`.

async function loadConfig(marketCode) {
  const [policy, market, plans] = await Promise.all([
    db().collection('platform_settings').doc('subscription_policy').get(),
    marketCode ? db().collection('platform_settings').doc(`visibility_rules_${marketCode}`).get() : null,
    safeDocs(db().collection('subscription_plans'), 'subscription plans', 200),
  ])
  return {
    policy: { ...DEFAULT_SUBSCRIPTION_POLICY, ...(policy.exists ? policy.data() : {}) },
    marketRules: market?.exists ? market.data() : {},
    plans: plans.docs.map((d) => normalizePlan(d.id, d)),
  }
}

const subRef = (provider) => db().collection('provider_subscriptions').doc(provider.docId)
const visRef = (provider) => db().collection('provider_visibility').doc(provider.docId)

async function loadSubscription(provider) {
  let snap = await subRef(provider).get()
  if (!snap.exists) {
    const q = await safeDocs(db().collection('provider_subscriptions').where('providerId', '==', provider.id), 'subscription', 1)
    if (q.docs[0]) snap = await db().collection('provider_subscriptions').doc(q.docs[0].id).get()
  }
  return { ref: snap.ref, subscription: snap.exists ? normalizeSubscription(snap.id, snap.data()) : null }
}

/** ADM-026 on load. data: { providerId } */
export const adminGetProviderSubscription = onCall(async (request) => {
  const { access, perms } = await providerScope(request)
  const providerId = requireProviderId(request.data?.providerId)
  try {
    const { provider } = await loadProvider(providerId, access)
    const [{ subscription }, vis, history, visHistory, payments, restrictions, config] = await Promise.all([
      loadSubscription(provider),
      visRef(provider).get(),
      docsForProvider('subscription_history', provider, 'subscription history', { limit: 120 }),
      docsForProvider('visibility_history', provider, 'visibility history', { limit: 120 }),
      safeDocs(db().collection('payments').where('providerId', '==', provider.id).where('purpose', '==', 'subscription'), 'subscription payments', 60),
      docsForProvider('account_restrictions', provider, 'restrictions', { limit: 200 }),
      loadConfig(provider.marketCode),
    ])
    return buildSubscriptionView({
      provider,
      subscription,
      plans: config.plans,
      history: history.docs,
      visibility: vis.exists ? vis.data() : {},
      visibilityHistory: visHistory.docs,
      payments: payments.docs.map((d) => normalizePayment(d.id, d)),
      restrictions: restrictions.docs.map((d) => normalizeRestriction(d.id, d)).filter(Boolean),
      policy: config.policy,
      marketRules: config.marketRules,
      permissions: perms,
      now: Date.now(),
    })
  } catch (err) {
    rethrow('adminGetProviderSubscription', err, 'Subscription details could not be loaded.')
  }
})

/** ADM-026 Manage Subscription. data: { providerId, action, planId?, effective?, days?, reasonCode, internalNote?, expectedVersion? } */
export const adminManageProviderSubscription = onCall(async (request) => {
  const { uid, access, actor } = await providerScope(request, { permission: 'subscriptions.manage', fresh: true })
  const d = request.data || {}
  const providerId = requireProviderId(d.providerId)
  try {
    const { provider } = await loadProvider(providerId, access)
    const config = await loadConfig(provider.marketCode)
    const { ref } = await loadSubscription(provider)
    const result = await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const subscription = snap.exists ? normalizeSubscription(snap.id, snap.data()) : null
      const plan = planSubscriptionChange({ provider, subscription, plans: config.plans, input: d, actor, policy: config.policy, now: Date.now() })
      if (plan.error) throw new HttpsError(plan.code || 'invalid-argument', plan.error)
      tx.update(ref, plan.patch)
      for (const h of plan.historyAppend) tx.set(db().collection('subscription_history').doc(), { ...h, providerId: provider.id })
      tx.set(db().collection('subscription_admin_events').doc(), { ...plan.event, providerId: provider.id, subscriptionId: subscription.id, createdAt: FieldValue.serverTimestamp() })
      if (plan.notification && provider.userId) {
        queueNotification(tx, { ...plan.notification, recipientId: provider.userId, recipientType: 'provider', category: 'subscription' })
      }
      auditEntry(tx, request, { actorId: uid, action: plan.audit.action, entityId: subscription.id, entityType: 'provider_subscription', metadata: { ...plan.audit, providerId: provider.id } })
      return plan
    })
    return { ok: true, message: result.message }
  } catch (err) {
    rethrow('adminManageProviderSubscription', err, 'The subscription change could not be applied.')
  }
})

/** ADM-026 Manage Visibility. data: { providerId, action, reasonCode, internalNote?, expectedVersion? } */
export const adminManageProviderVisibility = onCall(async (request) => {
  const { uid, access, actor } = await providerScope(request, { permission: 'visibility.manage' })
  const d = request.data || {}
  const providerId = requireProviderId(d.providerId)
  try {
    const { provider } = await loadProvider(providerId, access)
    const config = await loadConfig(provider.marketCode)
    const [{ subscription }, restrictions] = await Promise.all([
      loadSubscription(provider),
      docsForProvider('account_restrictions', provider, 'restrictions', { limit: 200 }),
    ])
    const ref = visRef(provider)
    const result = await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const plan = planVisibilityChange({
        provider,
        subscription,
        visibility: snap.exists ? snap.data() : {},
        restrictions: restrictions.docs.map((x) => normalizeRestriction(x.id, x)).filter(Boolean),
        input: d,
        actor,
        policy: config.policy,
        marketRules: config.marketRules,
        now: Date.now(),
      })
      if (plan.error) throw new HttpsError(plan.code || 'invalid-argument', plan.error)
      tx.set(ref, { providerId: provider.id, ...plan.patch }, { merge: true })
      tx.set(db().collection('visibility_history').doc(), { ...plan.historyEntry, providerId: provider.id, createdAt: FieldValue.serverTimestamp() })
      if (plan.notification && provider.userId) {
        queueNotification(tx, { ...plan.notification, recipientId: provider.userId, recipientType: 'provider', category: 'visibility' })
      }
      auditEntry(tx, request, { actorId: uid, action: plan.audit.action, entityId: provider.id, entityType: 'provider_visibility', metadata: plan.audit })
      return plan
    })
    return { ok: true, message: result.message }
  } catch (err) {
    rethrow('adminManageProviderVisibility', err, 'The visibility change could not be applied.')
  }
})
