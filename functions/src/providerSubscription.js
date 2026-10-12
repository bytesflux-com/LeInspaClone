import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import {
  auditEntry,
  db,
  loadProvider,
  providerScope,
  queueNotification,
  requireProviderId,
  rethrow,
  safeDocs,
} from './providerAdminContext.js'
import {
  DEFAULT_SUBSCRIPTION_POLICY,
  appPayments,
  appPlans,
  appSubscriptionState,
  appVisibility,
  buildSubscriptionView,
  planSubscriptionChange,
  planVisibilityChange,
} from './providerSubscriptionLogic.js'
import { loadRestrictions } from './providerAccount.js'
import { providerTypeOf } from './platformData.js'

// ADM-026 — Provider Subscription & Visibility: Admin control layer over the
// app's own subscription records — no admin copy:
//   subscriptions            one document per billing period (the history)
//   subscription_payments    payment truth (never marked paid from here)
//   platform_settings/global_settings.subscriptions.provider   plan prices (config)
//   <type collection>/{uid}  premiumVisibility / isFeatured / visibilityPaused flags
//   visibility_history, subscription_admin_events, audit_logs   admin records

async function loadConfig(marketCode) {
  const [policy, market, settings] = await Promise.all([
    db().collection('platform_settings').doc('subscription_policy').get(),
    marketCode ? db().collection('platform_settings').doc(`visibility_rules_${marketCode}`).get() : null,
    db().collection('platform_settings').doc('global_settings').get(),
  ])
  return {
    policy: { ...DEFAULT_SUBSCRIPTION_POLICY, ...(policy.exists ? policy.data() : {}) },
    marketRules: market?.exists ? market.data() : {},
    settings: settings.exists ? settings.data() : {},
  }
}

async function loadState(provider) {
  const [subs, payments, visHistory] = await Promise.all([
    safeDocs(db().collection('subscriptions').where('userId', '==', provider.id), 'subscriptions', 200),
    safeDocs(db().collection('subscription_payments').where('providerId', '==', provider.id), 'subscription payments', 200),
    safeDocs(db().collection('visibility_history').where('providerId', '==', provider.id), 'visibility history', 120),
  ])
  return { state: appSubscriptionState(subs.docs, payments.docs, Date.now()), payments: appPayments(payments.docs), visHistory: visHistory.docs }
}

/** ADM-026 on load. data: { providerId } */
export const adminGetProviderSubscription = onCall(async (request) => {
  const { access, perms } = await providerScope(request)
  const providerId = requireProviderId(request.data?.providerId)
  try {
    const { provider, raw } = await loadProvider(providerId, access)
    const [{ state, payments, visHistory }, restrictions, config] = await Promise.all([loadState(provider), loadRestrictions(provider), loadConfig(provider.marketCode)])
    const type = providerTypeOf(raw.accountType)
    return buildSubscriptionView({
      provider,
      subscription: state.subscription,
      plans: appPlans(config.settings, type),
      history: state.history,
      visibility: appVisibility(raw, state.subscription),
      visibilityHistory: visHistory,
      payments,
      restrictions,
      policy: config.policy,
      marketRules: config.marketRules,
      permissions: perms,
      now: Date.now(),
    })
  } catch (err) {
    rethrow('adminGetProviderSubscription', err, 'Subscription details could not be loaded.')
  }
})

const ts = (ms) => (ms ? Timestamp.fromMillis(ms) : null)

/** ADM-026 Manage Subscription. data: { providerId, action, planId?, effective?, days?, reasonCode, internalNote?, expectedVersion? } */
export const adminManageProviderSubscription = onCall(async (request) => {
  const { uid, access, actor } = await providerScope(request, { permission: 'subscriptions.manage', fresh: true })
  const d = request.data || {}
  const providerId = requireProviderId(d.providerId)
  try {
    const { provider, raw, detailRef } = await loadProvider(providerId, access)
    const config = await loadConfig(provider.marketCode)
    const plans = appPlans(config.settings, providerTypeOf(raw.accountType))
    const { state } = await loadState(provider)
    if (!state.current) throw new HttpsError('failed-precondition', 'This provider has no subscription record to manage.')
    const ref = db().collection('subscriptions').doc(state.current.id)

    const result = await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const fresh = appSubscriptionState([{ id: snap.id, ...snap.data() }], [], Date.now())
      const subscription = { ...state.subscription, version: fresh.subscription?.version ?? 0 }
      const plan = planSubscriptionChange({ provider, subscription, plans, input: d, actor, policy: config.policy, now: Date.now() })
      if (plan.error) throw new HttpsError(plan.code || 'invalid-argument', plan.error)

      // Translate the plan into the app's period records.
      const p = plan.patch
      const update = { adminVersion: p.version, updatedAt: FieldValue.serverTimestamp() }
      if ('autoRenew' in p) update.autoRenew = p.autoRenew
      if ('pendingPlanId' in p) Object.assign(update, { pendingPlanId: p.pendingPlanId, pendingPlanName: p.pendingPlanName })
      const newPeriod = plan.historyAppend.find((h) => h.status === 'active')
      if (d.action === 'extend' || d.action === 'courtesy_extension') update.endDate = ts(p.currentPeriodEnd)
      if (newPeriod) {
        // Immediate plan change / reactivation: close the current period and open a new
        // one awaiting payment — the payment system confirms it, never the Admin.
        if (d.action === 'change_plan') Object.assign(update, { status: 'superseded', endDate: Timestamp.now() })
        tx.set(db().collection('subscriptions').doc(), {
          userId: provider.id,
          providerId: provider.id,
          accountType: raw.accountType,
          planName: newPeriod.planName,
          status: 'pending',
          subscriptionStatus: 'pending',
          paymentRequired: true,
          startDate: ts(newPeriod.periodStart),
          endDate: ts(newPeriod.periodEnd),
          amount: newPeriod.amount,
          currency: newPeriod.currency || 'USD',
          billingCycle: p.billingCycle || 'monthly',
          autoRenew: true,
          source: newPeriod.source,
          createdAt: FieldValue.serverTimestamp(),
        })
        if (detailRef) tx.update(detailRef, { subscriptionPlan: newPeriod.planName, subscriptionStatus: 'pending' })
      }
      tx.update(ref, update)
      tx.set(db().collection('subscription_admin_events').doc(), { ...plan.event, providerId: provider.id, subscriptionId: state.current.id, createdAt: FieldValue.serverTimestamp() })
      if (plan.notification) queueNotification(tx, { ...plan.notification, recipientId: provider.id, recipientType: 'provider', category: 'subscription' })
      auditEntry(tx, request, { actorId: uid, action: plan.audit.action, entityId: state.current.id, entityType: 'subscription', metadata: { ...plan.audit, providerId: provider.id } })
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
    const { provider, detailRef } = await loadProvider(providerId, access)
    if (!detailRef) throw new HttpsError('failed-precondition', 'This provider has no profile record to update.')
    const [config, { state }, restrictions] = await Promise.all([loadConfig(provider.marketCode), loadState(provider), loadRestrictions(provider)])
    const result = await db().runTransaction(async (tx) => {
      const snap = await tx.get(detailRef)
      const plan = planVisibilityChange({
        provider,
        subscription: state.subscription,
        visibility: appVisibility(snap.data() || {}, state.subscription),
        restrictions,
        input: d,
        actor,
        policy: config.policy,
        marketRules: config.marketRules,
        now: Date.now(),
      })
      if (plan.error) throw new HttpsError(plan.code || 'invalid-argument', plan.error)
      const p = plan.patch
      const update = { visibilityVersion: p.version, visibilityUpdatedAt: FieldValue.serverTimestamp() }
      if ('featured' in p) update.isFeatured = p.featured
      if ('paused' in p) Object.assign(update, { visibilityPaused: p.paused, visibilityPausedReason: p.pausedReason ?? null })
      tx.update(detailRef, update)
      tx.set(db().collection('visibility_history').doc(), { ...plan.historyEntry, providerId: provider.id, createdAt: FieldValue.serverTimestamp() })
      if (plan.notification) queueNotification(tx, { ...plan.notification, recipientId: provider.id, recipientType: 'provider', category: 'visibility' })
      auditEntry(tx, request, { actorId: uid, action: plan.audit.action, entityId: provider.id, entityType: 'provider_visibility', metadata: plan.audit })
      return plan
    })
    return { ok: true, message: result.message }
  } catch (err) {
    rethrow('adminManageProviderVisibility', err, 'The visibility change could not be applied.')
  }
})
