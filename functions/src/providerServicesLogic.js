/**
 * ADM-023: Pure business logic, stats calculation, and validation
 * for Provider Services & Pricing.
 */

export const SERVICE_STATUSES = ['active', 'inactive', 'archived']
export const APPROVAL_STATUSES = ['approved', 'pending_review', 'changes_requested', 'rejected']

/**
 * Calculates service summary KPIs from a collection of provider services.
 */
export function calculateServicesSummary(services = []) {
  if (!Array.isArray(services) || services.length === 0) {
    return {
      activeCount: 0,
      inactiveCount: 0,
      pendingReviewCount: 0,
      changesRequestedCount: 0,
      totalCount: 0,
      averagePrice: 0,
      averagePriceFormatted: 'KES 0',
      lowestPrice: 0,
      lowestPriceFormatted: 'KES 0',
      highestPrice: 0,
      highestPriceFormatted: 'KES 0',
    }
  }

  let activeCount = 0
  let inactiveCount = 0
  let pendingReviewCount = 0
  let changesRequestedCount = 0
  const prices = []

  for (const s of services) {
    if (s.active || s.status === 'active') activeCount++
    else inactiveCount++

    if (s.approvalStatus === 'pending_review' || s.reviewStatus === 'pending_review' || s.hasPendingChanges) {
      pendingReviewCount++
    }
    if (s.approvalStatus === 'changes_requested' || s.reviewStatus === 'changes_requested') {
      changesRequestedCount++
    }

    const priceNum = typeof s.priceNum === 'number' ? s.priceNum : parseFloat(String(s.price || 0).replace(/[^\d.]/g, ''))
    if (!isNaN(priceNum) && priceNum > 0) {
      prices.push(priceNum)
    }
  }

  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0
  const averagePrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0

  return {
    activeCount,
    inactiveCount,
    pendingReviewCount,
    changesRequestedCount,
    totalCount: services.length,
    averagePrice,
    averagePriceFormatted: `KES ${averagePrice.toLocaleString()}`,
    lowestPrice,
    lowestPriceFormatted: `KES ${lowestPrice.toLocaleString()}`,
    highestPrice,
    highestPriceFormatted: `KES ${highestPrice.toLocaleString()}`,
  }
}

/**
 * Filters services by search query, tab status, category, price range, and availability.
 */
export function filterServices(services = [], filters = {}) {
  const {
    tab = 'all', // 'all', 'active', 'inactive', 'pending_review', 'changes_requested'
    search = '',
    category = 'all',
    priceRange = 'all',
    availability = 'all',
    status = 'all',
  } = filters

  return services.filter((srv) => {
    // 1. Status Tab filter
    if (tab === 'active' && !srv.active && srv.status !== 'active') return false
    if (tab === 'inactive' && (srv.active || srv.status === 'active')) return false
    if (tab === 'pending_review' && srv.approvalStatus !== 'pending_review' && srv.reviewStatus !== 'pending_review' && !srv.hasPendingChanges) return false
    if (tab === 'changes_requested' && srv.approvalStatus !== 'changes_requested' && srv.reviewStatus !== 'changes_requested') return false

    // 2. Search query filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase()
      const matchName = srv.name?.toLowerCase().includes(q)
      const matchId = (srv.serviceId || srv.id)?.toLowerCase().includes(q)
      const matchCat = srv.category?.toLowerCase().includes(q)
      const matchDesc = srv.description?.toLowerCase().includes(q)
      if (!matchName && !matchId && !matchCat && !matchDesc) return false
    }

    // 3. Category filter
    if (category && category !== 'all') {
      if (srv.category?.toLowerCase() !== category.toLowerCase()) return false
    }

    // 4. Status filter
    if (status && status !== 'all') {
      if (status === 'active' && !srv.active && srv.status !== 'active') return false
      if (status === 'inactive' && (srv.active || srv.status === 'active')) return false
    }

    // 5. Availability filter
    if (availability && availability !== 'all') {
      if (srv.availability?.toLowerCase() !== availability.toLowerCase()) return false
    }

    // 6. Price range filter
    if (priceRange && priceRange !== 'all') {
      const p = typeof srv.priceNum === 'number' ? srv.priceNum : parseFloat(String(srv.price || 0).replace(/[^\d.]/g, ''))
      if (priceRange === 'under_4000' && p >= 4000) return false
      if (priceRange === '4000_6000' && (p < 4000 || p > 6000)) return false
      if (priceRange === 'above_6000' && p <= 6000) return false
    }

    return true
  })
}

/**
 * Validates service moderation action.
 */
export function validateServiceModeration({ action, reasonCode, reasonLabel, messageToProvider }) {
  if (!action || !['approve', 'request_changes', 'reject'].includes(action)) {
    return { valid: false, error: "Action must be 'approve', 'request_changes', or 'reject'." }
  }

  if (action === 'request_changes' || action === 'reject') {
    if (!reasonCode && !reasonLabel && !messageToProvider?.trim()) {
      return { valid: false, error: 'Rejection or changes request requires a reason or message to provider.' }
    }
  }

  return { valid: true }
}

/**
 * Validates pricing alert condition (e.g. abrupt price increase > 50%).
 */
export function evaluatePricingAlert(currentPrice, previousPrice) {
  if (!previousPrice || previousPrice <= 0) return null
  const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100
  if (percentChange >= 50) {
    return {
      type: 'warning',
      code: 'UNUSUAL_PRICE_INCREASE',
      message: `Price increased by ${Math.round(percentChange)}% compared to last recorded price.`,
    }
  }
  if (percentChange <= -50) {
    return {
      type: 'warning',
      code: 'UNUSUAL_PRICE_DECREASE',
      message: `Price decreased by ${Math.abs(Math.round(percentChange))}% compared to last recorded price.`,
    }
  }
  return null
}

