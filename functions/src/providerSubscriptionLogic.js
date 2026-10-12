// ADM-026 — Provider Subscription & Visibility. Pure logic over the shared
// subscription engine records — never an admin_provider_subscriptions copy:
//   provider_subscriptions/{providerId}   current subscription state
//   subscription_plans                    plan configuration (price, currency, cycle per market)
//   subscription_history                  one record per plan period (append-only)
//   provider_visibility/{providerId}      visibility level, featured flag, pause
//   visibility_history                    visibility changes (append-only)
//   payments (purpose = subscription)     payment truth (never edited from here)
//
// Three separate concepts, never merged:
//   account status   (users / provider profile)  — e.g. Active / Suspended
//   subscription     (this engine)              — e.g. Active / Expired
//   visibility       (discovery placement)       — derived from both plus rules
// Prices are always read from records/configuration, never hardcoded.

import { DAY, clean, lower, toMillis } from './providerAdminShared.js'

export const SUBSCRIPTION_STATUSES = ['active', 'payment_pending', 'expiring_soon', 'expired', 'suspended', 'cancelled']

export const DEFAULT_SUBSCRIPTION_POLICY = {
  gracePeriodDays: 3,
  expiringSoonDays: 7,
  maxCourtesyExtensionDays: 30,
  maxAdminExtensionDays: 90,
  minRatingForRecommended: 4.0,
}

export const SUBSCRIPTION_ACTIONS = ['change_plan', 'extend', 'cancel_renewal', 'resume_renewal', 'reactivate', 'courtesy_extension']
export const VISIBILITY_ACTIONS = ['enable_featured', 'disable_featured', 'pause', 'restore']

export const ADMIN_CHANGE_REASONS = [
  { code: 'payment_reconciliation', label: 'Payment reconciliation correction' },
  { code: 'service_disruption', label: 'Platform service disruption' },
  { code: 'approved_courtesy', label: 'Approved courtesy / goodwill' },
  { code: 'provider_request', label: 'Provider request (verified)' },
  { code: 'plan_migration', label: 'Plan migration' },
  { code: 'policy_enforcement', label: 'Policy enforcement' },
  { code: 'other', label: 'Other approved reason' },
]

export function normalizePlan(id, p = {}) {
  return {
    id: p.planId || id,
    name: p.name || p.planName || id,
    kind: lower(p.kind || 'base'), // base | visibility_addon
    marketCode: String(p.marketCode || '').toUpperCase() || null,
    currency: p.currency || null,
    price: typeof p.price === 'number' ? p.price : null,
    billingCycle: lower(p.billingCycle || 'monthly'),
    providerCategories: Array.isArray(p.providerCategories) ? p.providerCategories : null,
    benefits: Array.isArray(p.benefits) ? p.benefits : [],
    visibilityTier: lower(p.visibilityTier || 'standard'),
    active: p.active !== false,
  }
}

export function normalizeSubscription(id, s = {}) {
  if (!s || !s.planId) return null
  return {
    id: s.subscriptionId || id,
    planId: s.planId,
    planName: s.planName || s.planId,
    status: lower(s.status || 'active'),
    billingCycle: lower(s.billingCycle || 'monthly'),
    currentPeriodStart: toMillis(s.currentPeriodStart),
    currentPeriodEnd: toMillis(s.currentPeriodEnd),
    autoRenew: s.autoRenew !== false,
    priceCharged: s.priceCharged && typeof s.priceCharged.amount === 'number' ? s.priceCharged : null,
    paymentStatus: lower(s.paymentStatus || 'paid'),
    latestPaymentId: s.latestPaymentId || null,
    pendingPlanId: s.pendingPlanId || null,
    pendingPlanName: s.pendingPlanName || null,
    marketCode: s.marketCode || null,
    startedAt: toMillis(s.startedAt),
    version: Number(s.version) || 0,
  }
}

export function normalizeVisibility(v = {}) {
  return {
    level: lower(v.level || 'standard'),
    premiumStartsAt: toMillis(v.premiumStartsAt),
    premiumEndsAt: toMillis(v.premiumEndsAt),
    featured: Boolean(v.featured),
    paused: Boolean(v.paused),
    pausedReason: v.pausedReason || null,
    version: Number(v.version) || 0,
  }
}

export function normalizePayment(id, p = {}) {
  return {
    id: p.paymentId || id,
    amount: typeof p.amount === 'number' ? p.amount : null,
    currency: p.currency || null,
    method: p.method || p.paymentMethod || null,
    status: lower(p.status || 'pending'),
    createdAt: toMillis(p.createdAt || p.paidAt),
    planName: p.planName || p.description || null,
    kind: lower(p.planKind || p.kind || 'base'), // base | visibility_addon
    failureReason: p.failureReason || null,
  }
}

// Subscription state as the engine sees it — independent of account status.
export function resolveSubscriptionStatus(sub, now, policy = DEFAULT_SUBSCRIPTION_POLICY) {
  if (!sub) return { status: 'none', label: 'No subscription', tone: 'grey', accessImpact: 'Not listed in marketplace discovery', inGrace: false }
  const end = sub.currentPeriodEnd
  const graceEnd = end ? end + policy.gracePeriodDays * DAY : null
  const unpaid = sub.paymentStatus === 'failed' || sub.paymentStatus === 'pending'
  if (sub.status === 'suspended') return { status: 'suspended', label: 'Suspended', tone: 'red', accessImpact: 'Subscription benefits suspended', inGrace: false }
  if (sub.status === 'cancelled' && end && now > end) return { status: 'cancelled', label: 'Cancelled', tone: 'grey', accessImpact: 'Not listed — subscription cancelled', inGrace: false }
  if (end && now > end) {
    if (unpaid && graceEnd && now <= graceEnd) {
      return { status: 'payment_pending', label: 'Payment Pending', tone: 'amber', accessImpact: `Grace period active until ${new Date(graceEnd).toISOString().slice(0, 10)}`, inGrace: true, graceEndsAt: graceEnd }
    }
    return { status: 'expired', label: 'Expired', tone: 'red', accessImpact: 'Marketplace visibility removed until renewed', inGrace: false }
  }
  if (unpaid) return { status: 'payment_pending', label: 'Payment Pending', tone: 'amber', accessImpact: 'None while the current period is paid up', inGrace: false }
  if (end && end - now <= policy.expiringSoonDays * DAY && (!sub.autoRenew || sub.status === 'cancelled')) {
    return { status: 'expiring_soon', label: 'Expiring Soon', tone: 'amber', accessImpact: 'Visibility ends at period end unless renewed', inGrace: false }
  }
  return { status: 'active', label: 'Active', tone: 'green', accessImpact: 'None', inGrace: false }
}

const SUB_LIVE = ['active', 'expiring_soon', 'payment_pending']

export function premiumState(vis, now) {
  const active = vis.level === 'premium' && (!vis.premiumEndsAt || vis.premiumEndsAt >= now) && (!vis.premiumStartsAt || vis.premiumStartsAt <= now)
  const expired = vis.level === 'premium' && vis.premiumEndsAt && vis.premiumEndsAt < now
  return { active, expired: Boolean(expired) }
}

// Where the provider can currently appear, with the reason when blocked.
// Account suspension and visibility restrictions always win over paid
// visibility; Premium can never override them.
export function resolveDiscovery({ provider, subStatus, visibility, restrictions = [], now, policy = DEFAULT_SUBSCRIPTION_POLICY, marketRules = {} }) {
  const blocks = []
  const status = provider.accountStatus
  if (status === 'suspended' || status === 'deactivated') blocks.push(`Account ${status}`)
  if (!provider.verified) blocks.push('Verification incomplete')
  if (!SUB_LIVE.includes(subStatus.status)) blocks.push(`Subscription ${subStatus.label.toLowerCase()}`)
  if (visibility.paused) blocks.push('Marketplace visibility paused by Admin')
  const visRestriction = restrictions.find((r) => r.status === 'active' && (r.kind === 'public_visibility' || r.kind === 'full_access'))
  if (visRestriction) blocks.push('Public visibility restricted (account action)')
  if (provider.contentStatus === 'rejected') blocks.push('Profile content not approved')

  const baseVisible = blocks.length === 0
  const premium = premiumState(visibility, now)
  const featuredMarket = marketRules.featuredEnabled !== false
  const ratingOk = provider.rating === null || provider.rating >= policy.minRatingForRecommended

  const entry = (key, label, state, reason = null) => ({ key, label, state, reason })
  const surfaces = [
    entry('search', 'Search Results', baseVisible ? 'active' : 'inactive', blocks[0] || null),
    entry('category', 'Category Results', baseVisible ? 'active' : 'inactive', blocks[0] || null),
    entry('nearby', 'Nearby Results', baseVisible ? 'active' : 'inactive', blocks[0] || null),
    entry('profile', 'Public Profile', baseVisible ? 'active' : 'inactive', blocks[0] || null),
    entry('standard', 'Standard Discovery', baseVisible ? 'active' : 'inactive', blocks[0] || null),
  ]
  const placement = [
    entry('search_visibility', 'Search Visibility', baseVisible ? 'active' : 'inactive', blocks[0] || null),
    entry('nearby_discovery', 'Nearby Discovery', baseVisible ? 'active' : 'inactive', blocks[0] || null),
    entry('recommended', 'Recommended Providers', baseVisible && ratingOk ? 'eligible' : 'not_eligible', !baseVisible ? blocks[0] : ratingOk ? null : `Rating below ${policy.minRatingForRecommended}`),
    entry('featured', 'Featured Provider',
      baseVisible && premium.active && visibility.featured && featuredMarket ? 'active' : 'not_active',
      !baseVisible ? blocks[0] : !premium.active ? 'Requires active Premium Visibility' : !featuredMarket ? 'Featured placement disabled in this market' : !visibility.featured ? 'Featured placement not enabled' : null),
    entry('premium_discovery', 'Premium Discovery', baseVisible && premium.active ? 'eligible' : 'not_eligible', !baseVisible ? blocks[0] : premium.active ? null : 'Premium Visibility not active'),
  ]
  return { baseVisible, blocks, surfaces, placement, premium }
}

function money(amount, currency, canSeeAmounts) {
  if (!canSeeAmounts) return { amount: null, currency, masked: true }
  return { amount: typeof amount === 'number' ? amount : null, currency, masked: false }
}

export function buildSubscriptionView({
  provider,
  subscription,
  plans = [],
  history = [],
  visibility: rawVisibility,
  visibilityHistory = [],
  payments = [],
  restrictions = [],
  policy = DEFAULT_SUBSCRIPTION_POLICY,
  marketRules = {},
  permissions = {},
  now = Date.now(),
}) {
  const visibility = normalizeVisibility(rawVisibility || {})
  const subStatus = resolveSubscriptionStatus(subscription, now, policy)
  const discovery = resolveDiscovery({ provider, subStatus, visibility, restrictions, now, policy, marketRules })
  const plan = subscription ? plans.find((p) => p.id === subscription.planId) || null : null
  const canSee = Boolean(permissions.viewFinance)
  const sortedPayments = [...payments].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  const latestPayment = sortedPayments.find((p) => p.kind === 'base') || sortedPayments[0] || null
  // A renewal needs attention when the latest attempt for a plan kind failed
  // and no later successful payment for that kind exists.
  const latestByKind = new Map()
  for (const p of sortedPayments) if (!latestByKind.has(p.kind)) latestByKind.set(p.kind, p)
  const failed = [...latestByKind.values()].find((p) => p.status === 'failed') || null

  const premiumAddon = plans.find((p) => p.kind === 'visibility_addon' && p.active)
  const category = provider.category
  const labels = {
    individual: { subscription: 'Current Subscription', visibility: 'Marketplace Visibility', featured: 'Featured Provider' },
    spa: { subscription: 'Current Business Subscription', visibility: 'Business Visibility Status', featured: 'Featured Business Status' },
    hotel: { subscription: 'Hotel Wellness Subscription', visibility: 'Property Visibility', featured: 'Featured Wellness Destination' },
  }[category]

  const unit = category === 'spa' ? provider.branches : category === 'hotel' ? provider.locations : []
  const units = unit.map((u) => {
    const active = u.active !== false && lower(u.status || 'active') === 'active'
    const restricted = restrictions.some((r) => r.status === 'active' && r.scopeTarget?.id === u.id && (r.kind === 'public_visibility' || r.kind === 'full_access'))
    return {
      id: u.id,
      name: u.name,
      visible: discovery.baseVisible && active && !restricted,
      reason: !discovery.baseVisible ? discovery.blocks[0] : !active ? 'Inactive location' : restricted ? 'Visibility restricted' : null,
    }
  })

  return {
    provider,
    labels,
    subscription: subscription
      ? {
          id: subscription.id,
          planId: subscription.planId,
          planName: subscription.planName,
          billingCycle: subscription.billingCycle,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          nextRenewal: subscription.autoRenew && subStatus.status !== 'expired' ? subscription.currentPeriodEnd : null,
          autoRenew: subscription.autoRenew,
          paymentStatus: subscription.paymentStatus,
          latestPaymentId: subscription.latestPaymentId,
          pendingPlanName: subscription.pendingPlanName,
          marketCode: subscription.marketCode || provider.marketCode,
          // What was actually charged for this period (historical truth), else the configured price.
          price: money(subscription.priceCharged?.amount ?? plan?.price, subscription.priceCharged?.currency || plan?.currency || provider.currency, canSee),
          priceSource: subscription.priceCharged ? 'subscription_record' : plan ? 'plan_configuration' : 'unavailable',
          version: subscription.version,
        }
      : null,
    status: { ...subStatus, gracePeriodDays: policy.gracePeriodDays, latestPayment: latestPayment ? latestPayment.status : null },
    visibility: {
      level: discovery.premium.active ? 'premium' : 'standard',
      premium: {
        active: discovery.premium.active,
        expired: discovery.premium.expired,
        startsAt: visibility.premiumStartsAt,
        endsAt: visibility.premiumEndsAt,
        featured: visibility.featured,
        badge: discovery.premium.active ? 'Premium' : null,
        benefits: premiumAddon?.benefits?.length ? premiumAddon.benefits : ['Higher Search Priority', 'Featured Placement', 'Premium Badge', 'Priority Discovery'],
      },
      paused: visibility.paused,
      pausedReason: visibility.pausedReason,
      baseVisible: discovery.baseVisible,
      blocks: discovery.blocks,
      surfaces: discovery.surfaces,
      placement: discovery.placement,
      units,
      version: visibility.version,
    },
    history: history
      .map((h) => ({
        id: h.id,
        planName: h.planName,
        kind: h.kind || 'base',
        periodStart: toMillis(h.periodStart),
        periodEnd: toMillis(h.periodEnd),
        amount: money(h.amount, h.currency, canSee),
        status: lower(h.status),
        paymentStatus: lower(h.paymentStatus),
        paymentId: h.paymentId || null,
        source: h.source || null,
      }))
      .sort((a, b) => (b.periodStart || 0) - (a.periodStart || 0)),
    visibilityHistory: visibilityHistory
      .map((v) => ({ id: v.id, label: v.label, reason: v.reason || null, source: v.source || null, at: toMillis(v.at || v.createdAt), actorName: v.actorName || null }))
      .sort((a, b) => (b.at || 0) - (a.at || 0)),
    payments: sortedPayments.slice(0, 5).map((p) => ({ ...p, amount: canSee ? p.amount : null, masked: !canSee })),
    paymentCount: payments.length,
    failedRenewal: failed
      ? {
          paymentId: failed.id,
          kind: failed.kind,
          planName: failed.planName,
          attemptedAt: failed.createdAt,
          method: failed.method,
          reason: failed.failureReason,
          accessState: failed.kind === 'visibility_addon'
            ? discovery.premium.active ? 'Premium Visibility active until period end' : 'Premium Visibility ended — standard visibility unaffected'
            : subStatus.inGrace ? `Grace period active (ends ${new Date(subStatus.graceEndsAt).toISOString().slice(0, 10)})` : subStatus.status === 'expired' ? 'Grace period expired' : 'Current period still active',
        }
      : null,
    plans: plans
      .filter((p) => p.active && p.kind === 'base' && (!p.marketCode || p.marketCode === provider.marketCode) && (!p.providerCategories || p.providerCategories.includes(category)))
      .map((p) => ({ id: p.id, name: p.name, billingCycle: p.billingCycle, price: money(p.price, p.currency, canSee) })),
    reasons: ADMIN_CHANGE_REASONS,
    policy: { gracePeriodDays: policy.gracePeriodDays, maxCourtesyExtensionDays: policy.maxCourtesyExtensionDays, maxAdminExtensionDays: policy.maxAdminExtensionDays },
    permitted: {
      subscription: permissions.manageSubscriptions ? subscriptionActionsFor(subscription, subStatus) : [],
      visibility: permissions.manageVisibility ? visibilityActionsFor(provider, visibility, discovery) : [],
    },
  }
}

export function subscriptionActionsFor(sub, subStatus) {
  if (!sub) return []
  const out = ['change_plan', 'extend', 'courtesy_extension']
  if (sub.autoRenew && sub.status !== 'cancelled') out.push('cancel_renewal')
  if (!sub.autoRenew && ['active', 'expiring_soon', 'payment_pending'].includes(subStatus.status)) out.push('resume_renewal')
  if (['expired', 'cancelled', 'suspended'].includes(subStatus.status)) out.push('reactivate')
  return out
}

export function visibilityActionsFor(provider, visibility, discovery) {
  const out = []
  if (discovery.premium.active && !visibility.featured) out.push('enable_featured')
  if (visibility.featured) out.push('disable_featured')
  if (!visibility.paused) out.push('pause')
  if (visibility.paused) out.push('restore')
  return out
}

function requireReason(input) {
  const reason = ADMIN_CHANGE_REASONS.find((r) => r.code === input.reasonCode)
  if (!reason) return { error: 'Select a reason for this change.' }
  return { reason }
}

/**
 * Plans a subscription change. Never edits a historical period: it updates the
 * current subscription and appends history. Payment truth stays with the
 * payment system — there is no "mark as paid" path.
 */
export function planSubscriptionChange({ provider, subscription, plans = [], input = {}, actor = {}, policy = DEFAULT_SUBSCRIPTION_POLICY, now = Date.now() }) {
  const action = input.action
  if (!SUBSCRIPTION_ACTIONS.includes(action)) return { error: 'This subscription action is not supported. Payments cannot be marked successful from the Admin panel.' }
  if (!subscription) return { error: 'This provider has no subscription to manage.' }
  if (input.expectedVersion !== undefined && Number(input.expectedVersion) !== subscription.version) {
    return { error: 'The subscription changed since you opened it. Reload and try again.', code: 'failed-precondition' }
  }
  const subStatus = resolveSubscriptionStatus(subscription, now, policy)
  if (!subscriptionActionsFor(subscription, subStatus).includes(action)) return { error: 'That action is not available for the current subscription state.' }
  const { reason, error } = requireReason(input)
  if (error) return { error }
  const note = clean(input.internalNote)

  const patch = { version: subscription.version + 1, updatedAt: now }
  const historyAppend = []
  let label = ''
  let notify = null

  if (action === 'change_plan') {
    const target = plans.find((p) => p.id === input.planId && p.active && p.kind === 'base')
    if (!target) return { error: 'Select an active plan.' }
    if (target.marketCode && provider.marketCode && target.marketCode !== provider.marketCode) return { error: 'That plan is not offered in the provider’s market.' }
    if (target.providerCategories && !target.providerCategories.includes(provider.category)) return { error: 'That plan does not apply to this provider type.' }
    if (target.id === subscription.planId) return { error: 'The provider is already on this plan.' }
    const effective = input.effective === 'immediate' ? 'immediate' : 'next_renewal'
    if (effective === 'next_renewal') {
      patch.pendingPlanId = target.id
      patch.pendingPlanName = target.name
      label = `Plan change to ${target.name} scheduled for next renewal`
    } else {
      // Close the current period as superseded and start a new period at the
      // configured price; payment is collected by the payment system (pending).
      historyAppend.push({ kind: 'base', planId: subscription.planId, planName: subscription.planName, periodStart: subscription.currentPeriodStart, periodEnd: now, amount: subscription.priceCharged?.amount ?? null, currency: subscription.priceCharged?.currency ?? null, status: 'superseded', paymentStatus: subscription.paymentStatus, source: 'admin_change' })
      const cycleDays = target.billingCycle === 'annual' ? 365 : 30
      Object.assign(patch, {
        planId: target.id,
        planName: target.name,
        billingCycle: target.billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: now + cycleDays * DAY,
        priceCharged: target.price !== null ? { amount: target.price, currency: target.currency } : null,
        paymentStatus: 'pending',
        pendingPlanId: null,
        pendingPlanName: null,
      })
      historyAppend.push({ kind: 'base', planId: target.id, planName: target.name, periodStart: now, periodEnd: now + cycleDays * DAY, amount: target.price, currency: target.currency, status: 'active', paymentStatus: 'pending', source: 'admin_change' })
      label = `Plan changed to ${target.name} (immediate)`
    }
    notify = { title: 'Your Lé Inspa plan is changing', body: `${label}.` }
  }

  if (action === 'extend' || action === 'courtesy_extension') {
    const days = Math.floor(Number(input.days))
    const max = action === 'courtesy_extension' ? policy.maxCourtesyExtensionDays : policy.maxAdminExtensionDays
    if (!Number.isFinite(days) || days < 1 || days > max) return { error: `Extension must be between 1 and ${max} days.` }
    if (action === 'courtesy_extension' && reason.code !== 'approved_courtesy' && reason.code !== 'service_disruption') {
      return { error: 'A courtesy extension needs an approved courtesy or service-disruption reason.' }
    }
    const base = Math.max(subscription.currentPeriodEnd || now, now)
    patch.currentPeriodEnd = base + days * DAY
    historyAppend.push({ kind: 'extension', planId: subscription.planId, planName: `${subscription.planName} — ${action === 'courtesy_extension' ? 'Courtesy extension' : 'Admin extension'}`, periodStart: base, periodEnd: base + days * DAY, amount: 0, currency: subscription.priceCharged?.currency || null, status: 'completed', paymentStatus: 'not_applicable', source: 'admin_change' })
    label = `${action === 'courtesy_extension' ? 'Courtesy extension' : 'Subscription extended'} by ${days} day${days === 1 ? '' : 's'}`
    notify = { title: 'Your Lé Inspa subscription was extended', body: `${label}. New end date: ${new Date(patch.currentPeriodEnd).toISOString().slice(0, 10)}.` }
  }

  if (action === 'cancel_renewal') {
    patch.autoRenew = false
    label = 'Auto-renewal cancelled — access continues to period end'
    notify = { title: 'Subscription auto-renewal turned off', body: 'Your current period stays active until its end date.' }
  }
  if (action === 'resume_renewal') {
    patch.autoRenew = true
    label = 'Auto-renewal resumed'
  }
  if (action === 'reactivate') {
    // Reactivation reopens the subscription for payment; it does not create a
    // successful payment. Visibility returns once the payment system confirms.
    const target = plans.find((p) => p.id === subscription.planId)
    const cycleDays = subscription.billingCycle === 'annual' ? 365 : 30
    Object.assign(patch, {
      status: 'active',
      autoRenew: true,
      currentPeriodStart: now,
      currentPeriodEnd: now + cycleDays * DAY,
      paymentStatus: 'pending',
      priceCharged: target && target.price !== null ? { amount: target.price, currency: target.currency } : subscription.priceCharged,
    })
    historyAppend.push({ kind: 'base', planId: subscription.planId, planName: subscription.planName, periodStart: now, periodEnd: now + cycleDays * DAY, amount: target?.price ?? null, currency: target?.currency ?? null, status: 'active', paymentStatus: 'pending', source: 'admin_reactivation' })
    label = 'Subscription reactivated — awaiting payment confirmation'
    notify = { title: 'Your Lé Inspa subscription was reactivated', body: 'Complete the pending payment to restore full subscription benefits.' }
  }

  return {
    patch,
    historyAppend: historyAppend.map((h) => ({ ...h, subscriptionId: subscription.id, createdAt: now, actorId: actor.id || null })),
    event: { action, label, reasonCode: reason.code, reasonLabel: reason.label, internalNote: note || null, actorId: actor.id || null, actorName: actor.name || 'Admin', at: now },
    notification: notify ? { ...notify, type: `subscription_${action}` } : null,
    audit: { action: `SUBSCRIPTION_${action.toUpperCase()}`, reasonCode: reason.code, previous: { planId: subscription.planId, status: subscription.status, end: subscription.currentPeriodEnd, autoRenew: subscription.autoRenew } },
    message: label,
  }
}

/**
 * Plans a visibility change. Visibility actions never touch billing, and can
 * never override account suspension, verification or visibility restrictions.
 */
export function planVisibilityChange({ provider, subscription, visibility: rawVisibility, restrictions = [], input = {}, actor = {}, policy = DEFAULT_SUBSCRIPTION_POLICY, marketRules = {}, now = Date.now() }) {
  const action = input.action
  if (!VISIBILITY_ACTIONS.includes(action)) return { error: 'Unknown visibility action.' }
  const visibility = normalizeVisibility(rawVisibility || {})
  if (input.expectedVersion !== undefined && Number(input.expectedVersion) !== visibility.version) {
    return { error: 'Visibility changed since you opened it. Reload and try again.', code: 'failed-precondition' }
  }
  const { reason, error } = requireReason(input)
  if (error) return { error }
  const subStatus = resolveSubscriptionStatus(subscription, now, policy)
  const discovery = resolveDiscovery({ provider, subStatus, visibility, restrictions, now, policy, marketRules })
  if (!visibilityActionsFor(provider, visibility, discovery).includes(action)) return { error: 'That visibility action is not available right now.' }

  const accountBlocked = ['suspended', 'deactivated'].includes(provider.accountStatus)
  const restricted = restrictions.some((r) => r.status === 'active' && (r.kind === 'public_visibility' || r.kind === 'full_access'))
  if (action === 'enable_featured') {
    if (accountBlocked) return { error: 'Premium or featured placement cannot override an account suspension.' }
    if (!provider.verified) return { error: 'Featured placement requires a verified provider.' }
    if (restricted) return { error: 'An active visibility restriction prevents featured placement.' }
    if (marketRules.featuredEnabled === false) return { error: 'Featured placement is disabled in this market.' }
  }
  if (action === 'restore') {
    if (accountBlocked) return { error: 'Visibility cannot be restored while the account is suspended or deactivated.' }
    if (restricted) return { error: 'An active public-visibility restriction must be lifted from Account Actions first.' }
  }

  const patch = { version: visibility.version + 1, updatedAt: now }
  let label = ''
  if (action === 'enable_featured') { patch.featured = true; label = 'Featured placement enabled' }
  if (action === 'disable_featured') { patch.featured = false; label = 'Featured placement disabled' }
  if (action === 'pause') { patch.paused = true; patch.pausedReason = reason.label; label = 'Marketplace visibility paused' }
  if (action === 'restore') { patch.paused = false; patch.pausedReason = null; label = 'Marketplace visibility restored' }

  return {
    patch,
    historyEntry: { label, reason: reason.label, source: 'Admin action', actorId: actor.id || null, actorName: actor.name || 'Admin', at: now, internalNote: clean(input.internalNote) || null },
    notification: action === 'pause' || action === 'restore' ? { type: `visibility_${action}`, title: label, body: action === 'pause' ? 'Your profile is temporarily hidden from marketplace discovery while we review an account matter.' : 'Your profile is visible in marketplace discovery again.' } : null,
    audit: { action: `VISIBILITY_${action.toUpperCase()}`, reasonCode: reason.code, previous: { featured: visibility.featured, paused: visibility.paused } },
    message: label,
  }
}

// ---------------------------------------------------------------- app adapters
// The mobile app keeps one `subscriptions` document per billing period
// (userId, planName, status, startDate, endDate, autoRenew, amount, currency),
// payments in `subscription_payments`, and plan prices per provider type in
// platform_settings/global_settings.subscriptions.provider (USD).
const PRICE_KEY = { massage_therapist: 'individual_massage', fitness_trainer: 'fitness_trainer', yoga_specialist: 'yoga_specialist', meditation_specialist: 'meditation_specialist', physiotherapist: 'physio_recovery', spa: 'spa_wellness', hotel_resort: 'hotel_resort' }
const CATEGORY_OF = { spa: 'spa', hotel_resort: 'hotel' }

export function appPlans(settings = {}, providerType) {
  const prices = settings?.subscriptions?.provider?.[PRICE_KEY[providerType]] || {}
  return Object.entries(prices).map(([tier, price]) => normalizePlan(tier, {
    planId: tier,
    name: tier.charAt(0).toUpperCase() + tier.slice(1),
    kind: 'base',
    currency: 'USD',
    price: typeof price === 'number' ? Math.round(price * 100) / 100 : null,
    billingCycle: 'monthly',
    providerCategories: [CATEGORY_OF[providerType] || 'individual'],
    visibilityTier: tier === 'premium' ? 'premium' : 'standard',
    benefits: tier === 'premium' ? ['Higher Search Priority', 'Featured Placement', 'Premium Badge', 'Priority Discovery'] : [],
  }))
}

const isTest = (s) => s.testOnly || s.isTestEntitlement || s.isTestAccount
export function appSubscriptionState(subs = [], payments = [], now = Date.now()) {
  const periods = subs
    .filter((s) => !['superseded'].includes(lower(s.status)))
    .map((s) => ({ ...s, _start: toMillis(s.startDate || s.createdAt), _end: toMillis(s.endDate) }))
    .sort((a, b) => (b._start || 0) - (a._start || 0))
  const current = periods.find((s) => lower(s.status) === 'active' && (!s._end || s._end >= now)) || periods.find((s) => lower(s.status) === 'pending') || periods[0] || null
  const payFor = (s) => payments.find((p) => p.subscriptionId === s.id || p.id === s.paymentId || p.transactionReference === s.paymentReference)
  const paymentStatusOf = (s) => {
    if (!s) return 'pending'
    const p = payFor(s)
    if (p) return ['successful', 'completed', 'paid'].includes(lower(p.paymentStatus)) ? 'paid' : lower(p.paymentStatus) || 'pending'
    if (s.paymentRequired === false || s.amountPaid > 0 || /^pay_|WALLET/i.test(s.paymentReference || '')) return 'paid'
    return lower(s.status) === 'pending' ? 'pending' : 'paid'
  }
  const subscription = current
    ? normalizeSubscription(current.id, {
        subscriptionId: current.id,
        planId: lower(current.planName) || 'standard',
        planName: `${current.planName || 'Standard'}${isTest(current) ? ' (test)' : ''}`,
        status: lower(current.status) === 'pending' ? 'active' : lower(current.status),
        billingCycle: current.billingCycle || 'monthly',
        currentPeriodStart: current._start,
        currentPeriodEnd: current._end,
        autoRenew: current.autoRenew === true,
        priceCharged: typeof (current.amountPaid ?? current.amount) === 'number' ? { amount: current.amountPaid ?? current.amount, currency: current.currency || 'USD' } : null,
        paymentStatus: paymentStatusOf(current),
        latestPaymentId: payFor(current)?.id || current.paymentId || null,
        pendingPlanName: current.pendingPlanName || null,
        version: current.adminVersion || 0,
      })
    : null
  const history = periods.map((s) => ({
    id: s.id,
    planName: s.planName || 'Plan',
    kind: 'base',
    periodStart: s._start,
    periodEnd: s._end,
    amount: s.amountPaid ?? s.amount ?? null,
    currency: s.currency || 'USD',
    status: s === current && (!s._end || s._end >= now) ? lower(s.status) : s._end && s._end < now ? 'completed' : lower(s.status),
    paymentStatus: paymentStatusOf(s),
    paymentId: payFor(s)?.id || null,
    source: s.source || s.provisionedBy || null,
  }))
  return { current, subscription, history }
}

export function appPayments(payments = []) {
  return payments.map((p) => normalizePayment(p.id, {
    paymentId: p.id,
    amount: typeof p.amountLocal === 'number' ? p.amountLocal : p.amount,
    currency: p.amountLocal != null ? p.localCurrency || p.currency : p.currency,
    method: p.paymentMethod,
    status: ['successful', 'completed', 'paid'].includes(lower(p.paymentStatus)) ? 'successful' : lower(p.paymentStatus),
    createdAt: p.paidAt || p.createdAt,
    planName: p.plan || p.description || null,
    kind: 'base',
    failureReason: p.failureReason || null,
  }))
}

/** Visibility state from the provider's type document + current plan. */
export function appVisibility(detail = {}, subscription = null) {
  const premiumPlan = subscription && /premium/i.test(subscription.planName)
  const premium = Boolean(detail.premiumVisibility) || premiumPlan
  return {
    level: premium ? 'premium' : 'standard',
    premiumStartsAt: premium ? subscription?.currentPeriodStart || null : null,
    premiumEndsAt: premium ? subscription?.currentPeriodEnd || null : null,
    featured: Boolean(detail.isFeatured || detail.featured),
    paused: Boolean(detail.visibilityPaused),
    pausedReason: detail.visibilityPausedReason || null,
    version: Number(detail.visibilityVersion) || 0,
  }
}
