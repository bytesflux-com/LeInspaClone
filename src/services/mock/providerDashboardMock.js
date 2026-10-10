// Deterministic multi-market mock dataset and aggregator for ADM-020 Provider Management Dashboard

export const MARKET_SCALING = {
  ALL: { factor: 1.0, currency: 'KES', label: 'All Markets' },
  KE: { factor: 0.50, currency: 'KES', label: 'Kenya' },
  UG: { factor: 0.132, currency: 'UGX', label: 'Uganda' },
  TZ: { factor: 0.118, currency: 'TZS', label: 'Tanzania' },
  NG: { factor: 0.100, currency: 'NGN', label: 'Nigeria' },
  GH: { factor: 0.075, currency: 'GHS', label: 'Ghana' },
  ZA: { factor: 0.050, currency: 'ZAR', label: 'South Africa' },
  RW: { factor: 0.025, currency: 'RWF', label: 'Rwanda' },
}

export function buildProviderDashboard(marketId = 'ALL', dateRange = '30d') {
  const isGlobal = marketId === 'ALL'
  const marketInfo = MARKET_SCALING[marketId] || { factor: 0.2, currency: 'USD', label: marketId }
  const factor = isGlobal ? 1.0 : marketInfo.factor

  // Scale integer safely
  const scale = (val) => Math.max(1, Math.round(val * factor))

  // Six KPI Cards
  const kpis = {
    totalProviders: isGlobal ? 24860 : scale(24860),
    totalProvidersTrend: '+12.4%',
    totalProvidersVs: 'vs last month',

    activeProviders: isGlobal ? 21420 : scale(21420),
    activeProvidersTrend: '+10.8%',
    activeProvidersVs: 'vs last month',

    pendingVerification: isGlobal ? 428 : Math.max(12, scale(428)),
    pendingVerificationTrend: '+6.2%',
    pendingVerificationVs: 'vs last month',

    newProviders: isGlobal ? 1284 : scale(1284),
    newProvidersTrend: '+18.6%',
    newProvidersVs: 'vs last month',

    suspended: isGlobal ? 64 : Math.max(2, scale(64)),
    suspendedTrend: '+2.1%',
    suspendedVs: 'vs last month',

    availableNow: isGlobal ? 8940 : scale(8940),
    availableNowTrend: '+15.3%',
    availableNowVs: 'vs last month',
  }

  // Needs Your Attention operational cards (5 cards)
  const attention = [
    {
      id: 'verification_queue',
      title: 'Verification Queue',
      count: isGlobal ? 428 : scale(428),
      description: 'Providers waiting for review.',
      badgeColor: 'orange',
      link: '/verifications',
      actionLabel: 'Review',
    },
    {
      id: 'profile_photo_approvals',
      title: 'Profile / Photo Approvals',
      count: isGlobal ? 186 : scale(186),
      description: 'Photos or information awaiting moderation.',
      badgeColor: 'orange',
      link: '/content',
      actionLabel: 'Review',
    },
    {
      id: 'safety_compliance',
      title: 'Safety & Compliance',
      count: isGlobal ? 14 : Math.max(1, scale(14)),
      description: 'Cases require review.',
      badgeColor: 'red',
      link: '/safety',
      actionLabel: 'Review',
    },
    {
      id: 'provider_account_reviews',
      title: 'Provider Account Reviews',
      count: isGlobal ? 27 : Math.max(2, scale(27)),
      description: 'Accounts under review.',
      badgeColor: 'orange',
      link: '/providers?status=under_review',
      actionLabel: 'Review',
    },
    {
      id: 'withdrawal_requests',
      title: 'Withdrawal Requests',
      count: isGlobal ? 92 : Math.max(5, scale(92)),
      description: 'Provider withdrawals awaiting approval.',
      badgeColor: 'purple',
      link: '/withdrawals',
      actionLabel: 'Review',
    },
  ]

  // Provider Categories (7 cards)
  const categories = [
    {
      id: 'massage_therapist',
      name: 'Massage Therapists',
      total: isGlobal ? 8420 : scale(8420),
      active: isGlobal ? 7640 : scale(7640),
      icon: 'sparkles',
    },
    {
      id: 'fitness_trainer',
      name: 'Personal Trainers',
      total: isGlobal ? 4260 : scale(4260),
      active: isGlobal ? 3810 : scale(3810),
      icon: 'dumbbell',
    },
    {
      id: 'physiotherapy',
      name: 'Physiotherapy & Recovery',
      total: isGlobal ? 2180 : scale(2180),
      active: isGlobal ? 1940 : scale(1940),
      icon: 'activity',
    },
    {
      id: 'yoga_specialist',
      name: 'Yoga Specialists',
      total: isGlobal ? 3460 : scale(3460),
      active: isGlobal ? 3120 : scale(3120),
      icon: 'heart',
    },
    {
      id: 'meditation_specialist',
      name: 'Meditation Specialists',
      total: isGlobal ? 1940 : scale(1940),
      active: isGlobal ? 1720 : scale(1720),
      icon: 'leaf',
    },
    {
      id: 'spa',
      name: 'Spas & Wellness Centers',
      total: isGlobal ? 3820 : scale(3820),
      active: isGlobal ? 3420 : scale(3420),
      icon: 'flower',
    },
    {
      id: 'hotel_resort',
      name: 'Hotels & Wellness Resorts',
      total: isGlobal ? 780 : scale(780),
      active: isGlobal ? 650 : scale(650),
      icon: 'hotel',
    },
  ]

  // Provider Growth chart series (customizable by window)
  const growthSeries = buildGrowthPoints(factor, dateRange)

  // Provider Status donut distribution
  const statusDistribution = {
    total: kpis.totalProviders,
    segments: [
      {
        id: 'active',
        label: 'Active',
        count: kpis.activeProviders,
        percentage: 86.2,
        color: '#16a34a',
      },
      {
        id: 'pending',
        label: 'Pending Verification',
        count: kpis.pendingVerification,
        percentage: 1.7,
        color: '#f59e0b',
      },
      {
        id: 'under_review',
        label: 'Under Review',
        count: isGlobal ? 310 : scale(310),
        percentage: 1.2,
        color: '#8b5cf6',
      },
      {
        id: 'suspended',
        label: 'Suspended',
        count: kpis.suspended,
        percentage: 0.3,
        color: '#ef4444',
      },
      {
        id: 'inactive',
        label: 'Inactive',
        count: Math.max(10, kpis.totalProviders - kpis.activeProviders - kpis.pendingVerification - (isGlobal ? 310 : scale(310)) - kpis.suspended),
        percentage: 10.6,
        color: '#94a3b8',
      },
    ],
  }

  // Verification Pipeline Funnel
  const verificationPipeline = {
    submitted: isGlobal ? 1240 : scale(1240),
    awaitingReview: isGlobal ? 428 : scale(428),
    approved: isGlobal ? 742 : scale(742),
    rejected: isGlobal ? 70 : Math.max(3, scale(70)),
    categories: [
      { name: 'Identity Verification', count: isGlobal ? 194 : scale(194) },
      { name: 'Professional Credentials', count: isGlobal ? 142 : scale(142) },
      { name: 'Business Documents', count: isGlobal ? 58 : scale(58) },
      { name: 'Spa & Resort Licences', count: isGlobal ? 34 : scale(34) },
    ],
  }

  // Content Awaiting Approval
  const contentApproval = {
    profilePhotos: isGlobal ? 74 : scale(74),
    galleryPhotos: isGlobal ? 62 : scale(62),
    profileInfo: isGlobal ? 31 : scale(31),
    servicesDescriptions: isGlobal ? 19 : scale(19),
    businessInfo: isGlobal ? 8 : Math.max(1, scale(8)),
    totalAwaiting: isGlobal ? 194 : scale(194),
  }

  // Provider Activity (4 cards)
  const activity = {
    availableNow: kpis.availableNow,
    bookedToday: isGlobal ? 6280 : scale(6280),
    unavailable: isGlobal ? 4120 : scale(4120),
    noScheduleConfigured: isGlobal ? 860 : scale(860),
  }

  // Platform Provider Performance
  const performance = {
    bookings: isGlobal ? 48240 : scale(48240),
    bookingsTrend: '+14.2%',
    completed: isGlobal ? 43810 : scale(43810),
    completedTrend: '+12.8%',
    cancellationRate: '4.2%',
    cancellationTrend: '-1.1%',
    averageRating: 4.8,
    ratingTrend: '+0.2',
    repeatBookingRate: '38%',
    repeatBookingTrend: '+3.6%',
    providerEarningsAmount: isGlobal ? 18400000 : Math.round(18400000 * factor),
    providerEarningsFormatted: `${marketInfo.currency} ${(isGlobal ? 18400000 : Math.round(18400000 * factor)).toLocaleString('en-US')}`,
    providerEarningsCompact: isGlobal ? 'KES 18.4M' : `${marketInfo.currency} ${(18.4 * factor).toFixed(1)}M`,
  }

  // Provider Quality Signals
  const quality = {
    rating45Plus: isGlobal ? 18240 : scale(18240),
    highCompletionRate: isGlobal ? 19810 : scale(19810),
    lowCancellation: isGlobal ? 20120 : scale(20120),
    needsPerformanceReview: isGlobal ? 124 : Math.max(5, scale(124)),
  }

  // Recently Joined Providers
  const recentProviders = [
    {
      id: 'prv-101',
      name: 'Grace Njeri',
      type: 'Massage Therapist',
      typeId: 'massage_therapist',
      market: 'Kenya',
      marketCode: 'KE',
      verification: 'Verified',
      verificationStatus: 'verified',
      status: 'Active',
      statusId: 'active',
      joined: '12 Sep 2026',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'prv-102',
      name: 'Serenity Wellness Spa',
      type: 'Spa & Wellness Center',
      typeId: 'spa',
      market: 'Kenya',
      marketCode: 'KE',
      verification: 'Pending',
      verificationStatus: 'pending',
      status: 'Pending Verification',
      statusId: 'pending',
      joined: '12 Sep 2026',
      avatar: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'prv-103',
      name: 'Savanna Wellness Resort',
      type: 'Hotel & Wellness Resort',
      typeId: 'hotel_resort',
      market: 'Kenya',
      marketCode: 'KE',
      verification: 'Documents Review',
      verificationStatus: 'under_review',
      status: 'Pending',
      statusId: 'pending',
      joined: '11 Sep 2026',
      avatar: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'prv-104',
      name: 'James Otieno',
      type: 'Yoga Specialist',
      typeId: 'yoga_specialist',
      market: 'Kenya',
      marketCode: 'KE',
      verification: 'Verified',
      verificationStatus: 'verified',
      status: 'Active',
      statusId: 'active',
      joined: '10 Sep 2026',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'prv-105',
      name: 'WellFit Studios',
      type: 'Personal Trainer',
      typeId: 'fitness_trainer',
      market: 'Kenya',
      marketCode: 'KE',
      verification: 'Verified',
      verificationStatus: 'verified',
      status: 'Active',
      statusId: 'active',
      joined: '9 Sep 2026',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
  ]

  // Providers by Market (Africa distribution)
  const marketDistribution = [
    { code: 'KE', name: 'Kenya', count: 12420, percent: 50.0, flag: '🇰🇪' },
    { code: 'UG', name: 'Uganda', count: 3280, percent: 13.2, flag: '🇺🇬' },
    { code: 'TZ', name: 'Tanzania', count: 2940, percent: 11.8, flag: '🇹🇿' },
    { code: 'NG', name: 'Nigeria', count: 2480, percent: 10.0, flag: '🇳🇬' },
    { code: 'GH', name: 'Ghana', count: 1860, percent: 7.5, flag: '🇬🇭' },
    { code: 'ZA', name: 'South Africa', count: 1240, percent: 5.0, flag: '🇿🇦' },
    { code: 'MA', name: 'Morocco', count: 980, percent: 3.9, flag: '🇲🇦' },
    { code: 'OTHER', name: 'Other', count: 1680, percent: 6.8, flag: '🌐' },
  ]

  // Provider Subscriptions
  const subscriptions = {
    active: isGlobal ? 20410 : scale(20410),
    expiringSoon: isGlobal ? 340 : scale(340),
    paymentFailed: isGlobal ? 42 : Math.max(1, scale(42)),
    inactive: isGlobal ? 980 : scale(980),
    revenueAmount: isGlobal ? 4250000 : Math.round(4250000 * factor),
    revenueFormatted: `${marketInfo.currency} ${(isGlobal ? 4250000 : Math.round(4250000 * factor)).toLocaleString('en-US')}`,
    revenueCompact: isGlobal ? 'KES 4.25M' : `${marketInfo.currency} ${(4.25 * factor).toFixed(2)}M`,
  }

  // Provider Account Health
  const accountHealth = {
    healthy: kpis.activeProviders,
    needsAttention: kpis.pendingVerification,
    suspended: kpis.suspended,
    inactive: statusDistribution.segments.find((s) => s.id === 'inactive')?.count || 2638,
  }

  return {
    marketId,
    marketName: marketInfo.label,
    reportingCurrency: marketInfo.currency,
    dateRange,
    kpis,
    attention,
    categories,
    growthSeries,
    statusDistribution,
    verificationPipeline,
    contentApproval,
    activity,
    performance,
    quality,
    recentProviders,
    marketDistribution,
    subscriptions,
    accountHealth,
  }
}

function buildGrowthPoints(factor = 1.0, range = '30d') {
  if (range === '7d') {
    return [
      { label: 'Sep 1', newProviders: Math.round(180 * factor), activatedProviders: Math.round(150 * factor) },
      { label: 'Sep 2', newProviders: Math.round(210 * factor), activatedProviders: Math.round(175 * factor) },
      { label: 'Sep 3', newProviders: Math.round(195 * factor), activatedProviders: Math.round(160 * factor) },
      { label: 'Sep 4', newProviders: Math.round(240 * factor), activatedProviders: Math.round(205 * factor) },
      { label: 'Sep 5', newProviders: Math.round(280 * factor), activatedProviders: Math.round(230 * factor) },
      { label: 'Sep 6', newProviders: Math.round(260 * factor), activatedProviders: Math.round(220 * factor) },
      { label: 'Sep 7', newProviders: Math.round(310 * factor), activatedProviders: Math.round(270 * factor) },
    ]
  }

  if (range === '90d') {
    return [
      { label: 'Jun W1', newProviders: Math.round(720 * factor), activatedProviders: Math.round(590 * factor) },
      { label: 'Jun W3', newProviders: Math.round(840 * factor), activatedProviders: Math.round(680 * factor) },
      { label: 'Jul W1', newProviders: Math.round(980 * factor), activatedProviders: Math.round(810 * factor) },
      { label: 'Jul W3', newProviders: Math.round(1120 * factor), activatedProviders: Math.round(940 * factor) },
      { label: 'Aug W1', newProviders: Math.round(1240 * factor), activatedProviders: Math.round(1020 * factor) },
      { label: 'Aug W3', newProviders: Math.round(1410 * factor), activatedProviders: Math.round(1190 * factor) },
      { label: 'Sep W1', newProviders: Math.round(1580 * factor), activatedProviders: Math.round(1350 * factor) },
    ]
  }

  if (range === '12m') {
    return [
      { label: 'Oct', newProviders: Math.round(1800 * factor), activatedProviders: Math.round(1450 * factor) },
      { label: 'Dec', newProviders: Math.round(2400 * factor), activatedProviders: Math.round(1980 * factor) },
      { label: 'Feb', newProviders: Math.round(3100 * factor), activatedProviders: Math.round(2600 * factor) },
      { label: 'Apr', newProviders: Math.round(3900 * factor), activatedProviders: Math.round(3300 * factor) },
      { label: 'Jun', newProviders: Math.round(4800 * factor), activatedProviders: Math.round(4100 * factor) },
      { label: 'Aug', newProviders: Math.round(5700 * factor), activatedProviders: Math.round(4900 * factor) },
      { label: 'Sep', newProviders: Math.round(6500 * factor), activatedProviders: Math.round(5600 * factor) },
    ]
  }

  // Default: 30 days matching screenshot
  return [
    { label: 'Aug 10', newProviders: Math.round(850 * factor), activatedProviders: Math.round(520 * factor) },
    { label: 'Aug 17', newProviders: Math.round(1120 * factor), activatedProviders: Math.round(780 * factor) },
    { label: 'Aug 24', newProviders: Math.round(1280 * factor), activatedProviders: Math.round(910 * factor) },
    { label: 'Aug 31', newProviders: Math.round(1450 * factor), activatedProviders: Math.round(1040 * factor) },
    { label: 'Sep 7', newProviders: Math.round(1680 * factor), activatedProviders: Math.round(1190 * factor) },
  ]
}

