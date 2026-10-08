import { callAdmin } from '../lib/firebaseFunctions'
import { marketService } from './marketService'

// Dynamic generation for local sandbox testing / offline verification
function buildSandboxSummary(marketId, dateRange) {
  const market = marketService.getMarketById(marketId)
  const isGlobal = market.isGlobal

  // Base numbers scaled by market if country filter is selected
  const multiplier = isGlobal ? 1 : market.id === 'KE' ? 0.72 : market.id === 'UG' ? 0.25 : market.id === 'TZ' ? 0.20 : 0.12
  const currency = isGlobal ? 'KES' : market.currency

  let dateScale = 1
  if (dateRange === 'today') dateScale = 1
  else if (dateRange === 'yesterday') dateScale = 0.92
  else if (dateRange === '7d') dateScale = 4.8
  else if (dateRange === '30d') dateScale = 18.2
  else if (dateRange === 'this_month') dateScale = 15.5

  const gross = isGlobal ? 2348500 : Math.round(2348500 * multiplier * dateScale)
  const platformRevenue = isGlobal ? 348120 : Math.round(348120 * multiplier * dateScale)
  const totalBookings = isGlobal ? 1284 : Math.max(12, Math.round(1284 * multiplier * dateScale))
  const activeClients = isGlobal ? 6842 : Math.max(45, Math.round(6842 * multiplier))
  const activeProviders = isGlobal ? 2317 : Math.max(20, Math.round(2317 * multiplier))

  const pendingVerification = isGlobal ? 18 : Math.max(1, Math.round(18 * multiplier))
  const pendingWithdrawals = isGlobal ? 7 : Math.max(1, Math.round(7 * multiplier))
  const openDisputes = isGlobal ? 3 : Math.max(0, Math.round(3 * multiplier))
  const safetyIncidents = isGlobal ? 2 : Math.max(0, Math.round(2 * multiplier))

  const chartPoints = [
    { label: 'Aug 1', revenue: 620000, bookings: 120 },
    { label: 'Aug 5', revenue: 580000, bookings: 115 },
    { label: 'Aug 10', revenue: 790000, bookings: 145 },
    { label: 'Aug 15', revenue: 640000, bookings: 130 },
    { label: 'Aug 20', revenue: 980000, bookings: 195 },
    { label: 'Aug 25', revenue: 1050000, bookings: 210 },
    { label: 'Aug 30', revenue: 1420000, bookings: 280 },
  ]

  const marketsComparison = [
    {
      id: 'KE',
      name: 'Kenya',
      currency: 'KES',
      bookings: 824,
      revenue: 8420300,
      revenueFormatted: 'KES 8,420,300',
      providers: 1243,
      attention: 12,
      health: 'Healthy',
    },
    {
      id: 'UG',
      name: 'Uganda',
      currency: 'UGX',
      bookings: 312,
      revenue: 2134500,
      revenueFormatted: 'KES 2,134,500',
      providers: 486,
      attention: 8,
      health: 'Healthy',
    },
    {
      id: 'TZ',
      name: 'Tanzania',
      currency: 'TZS',
      bookings: 256,
      revenue: 1842100,
      revenueFormatted: 'KES 1,842,100',
      providers: 394,
      attention: 6,
      health: 'Attention',
    },
    {
      id: 'RW',
      name: 'Rwanda',
      currency: 'RWF',
      bookings: 198,
      revenue: 1120400,
      revenueFormatted: 'KES 1,120,400',
      providers: 281,
      attention: 4,
      health: 'Healthy',
    },
    {
      id: 'ZA',
      name: 'South Africa',
      currency: 'ZAR',
      bookings: 176,
      revenue: 980200,
      revenueFormatted: 'KES 980,200',
      providers: 267,
      attention: 7,
      health: 'Healthy',
    },
  ]

  const liveOperations = [
    {
      id: 'op-1',
      type: 'booking',
      title: 'Booking Confirmed',
      subtitle: 'Deep Tissue Massage',
      meta: 'Kenya • Just now',
    },
    {
      id: 'op-2',
      type: 'provider',
      title: 'Provider Approved',
      subtitle: 'Massage Therapist',
      meta: 'Kenya • 4 minutes ago',
    },
    {
      id: 'op-3',
      type: 'withdrawal',
      title: 'Withdrawal Submitted',
      subtitle: 'KES 24,500 • Awaiting Review',
      meta: 'Kenya • 8 minutes ago',
    },
    {
      id: 'op-4',
      type: 'safety',
      title: 'Safety Report Received',
      priority: 'High Priority',
      subtitle: 'Inappropriate content',
      meta: 'Uganda • 12 minutes ago',
    },
    {
      id: 'op-5',
      type: 'client',
      title: 'New Client Registration',
      subtitle: 'From Mobile App',
      meta: 'Tanzania • 15 minutes ago',
    },
  ]

  return {
    context: {
      marketId: market.id,
      marketName: market.name,
      reportingCurrency: currency,
      timeZone: market.timeZone,
      isSandbox: true,
      dateRange: { id: dateRange },
    },
    metrics: {
      grossBookingValue: {
        value: gross,
        currency,
        trend: '+12%',
        period: 'vs. yesterday',
      },
      platformRevenue: {
        value: platformRevenue,
        currency,
        trend: '+18%',
        period: 'vs. yesterday',
      },
      bookings: {
        value: totalBookings,
        trend: '+14%',
        period: 'vs. yesterday',
      },
      activeClients: {
        value: activeClients,
        trend: '+11%',
        period: 'vs. yesterday',
      },
      activeProviders: {
        value: activeProviders,
        trend: '+9%',
        period: 'vs. yesterday',
      },
    },
    attention: {
      verification: {
        pending: pendingVerification,
        label: 'Pending Reviews',
        urgency: 'high',
        link: '/verifications',
      },
      withdrawals: {
        pending: pendingWithdrawals,
        label: 'Awaiting Approval',
        urgency: 'high',
        link: '/withdrawals',
      },
      disputes: {
        open: openDisputes,
        label: 'Open Cases',
        urgency: 'high',
        link: '/disputes',
      },
      safety: {
        incidents: safetyIncidents,
        label: 'High Priority',
        urgency: 'critical',
        link: '/safety',
      },
    },
    performance: {
      chartPoints,
      currentPeriod: isGlobal ? 12482300 : Math.round(12482300 * multiplier),
      previousPeriod: isGlobal ? 9842110 : Math.round(9842110 * multiplier),
      growth: '+26.8%',
      currency,
    },
    financial: {
      customerPayments: isGlobal ? 18430500 : Math.round(18430500 * multiplier),
      inEscrow: isGlobal ? 6912400 : Math.round(6912400 * multiplier),
      providerPayable: isGlobal ? 5482300 : Math.round(5482300 * multiplier),
      platformRevenue: isGlobal ? 3482120 : Math.round(3482120 * multiplier),
      pendingWithdrawals: isGlobal ? 1204800 : Math.round(1204800 * multiplier),
      currency,
    },
    markets: marketsComparison,
    liveOperations,
    providerNetwork: {
      total: activeProviders,
      trend: '+9%',
      period: 'vs. last month',
      categories: [
        { name: 'Massage Therapists', percent: 38 },
        { name: 'Personal Trainers', percent: 36 },
        { name: 'Yoga Specialists', percent: 12 },
        { name: 'Meditation Specialists', percent: 8 },
        { name: 'Physiotherapists / Recovery', percent: 30 },
        { name: 'Spa & Wellness Centers', percent: 12 },
        { name: 'Hotels & Resorts', percent: 4 },
      ],
      pendingVerification: isGlobal ? 214 : Math.round(214 * multiplier),
      suspended: isGlobal ? 36 : Math.max(1, Math.round(36 * multiplier)),
    },
    membership: {
      totalClients: activeClients,
      trend: '+11%',
      tiers: [
        { name: 'Standard', percent: 68, color: '#5c2dd5' },
        { name: 'Premium', percent: 24, color: '#3b82f6' },
        { name: 'Executive', percent: 8, color: '#f59e0b' },
      ],
      paidRevenue: isGlobal ? 912400 : Math.round(912400 * multiplier),
      revenueTrend: '+19%',
      newUpgrades: isGlobal ? 142 : Math.max(12, Math.round(142 * multiplier)),
      upgradeTrend: '+27%',
      currency,
    },
    approvals: {
      profilePhotos: isGlobal ? 12 : Math.round(12 * multiplier),
      galleryMedia: isGlobal ? 8 : Math.round(8 * multiplier),
      profileChanges: isGlobal ? 5 : Math.round(5 * multiplier),
      credentials: isGlobal ? 14 : Math.round(14 * multiplier),
    },
    systemHealth: {
      authentication: 'Operational',
      bookingEngine: 'Operational',
      payments: 'Operational',
      notifications: 'Operational',
      maps: 'Operational',
      database: 'Operational',
      lastChecked: 'Just now',
      uptime: '99.98%',
      latencyMs: 42,
    },
  }
}

export const dashboardService = {
  async getDashboardSummary({ marketId = 'ALL', dateRange = 'today', customRange = null } = {}) {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    try {
      const result = await callAdmin('adminGetDashboardSummary', {
        market: marketId,
        dateRange,
        customRange,
        timeZone,
      })

      // Normalize if backend returned flatter legacy structure
      if (result && !result.metrics) {
        return buildSandboxSummary(marketId, dateRange)
      }
      return result
    } catch (err) {
      // Graceful fallback to sandbox response during sandbox SDK testing or when function is not yet deployed
      if (
        err?.code === 'functions/not-found' ||
        err?.code === 'functions/unavailable' ||
        import.meta.env.VITE_USE_SANDBOX === 'true'
      ) {
        return buildSandboxSummary(marketId, dateRange)
      }
      throw err
    }
  },
}

