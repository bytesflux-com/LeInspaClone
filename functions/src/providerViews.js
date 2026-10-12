// ADM-020 → ADM-024 — pure view builders over the mobile app's provider
// records (see providerSources.js). Every number is computed from records;
// fields the app does not capture are null (shown as "—"), never invented.

import { normalizeBooking } from './bookingsLogic.js'
import { MARKETS } from './dashboardLogic.js'
import { lowerStatus, millis, PROVIDER_TYPES } from './platformData.js'

export { DAY }

const FLAGS = { KE: '🇰🇪', UG: '🇺🇬', TZ: '🇹🇿', RW: '🇷🇼', ZA: '🇿🇦', NG: '🇳🇬', PK: '🇵🇰', IN: '🇮🇳' }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY = 86400000

export function fmtDate(ms) {
  if (!ms) return '—'
  const d = new Date(ms + 3 * 3600000)
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
export function fmtDateTime(ms) {
  if (!ms) return '—'
  const d = new Date(ms + 3 * 3600000)
  const h = d.getUTCHours()
  return `${fmtDate(ms)} • ${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}
export const money = (n, currency = 'KES') => (typeof n === 'number' && Number.isFinite(n) ? `${currency} ${Math.round(n).toLocaleString('en-US')}` : '—')
const pct = (a, b) => (b ? `${Math.round((a / b) * 1000) / 10}%` : '—')
const label = (s) => (s ? String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—')
const currencyOf = (p) => MARKETS[p.countryCode]?.currency || 'KES'

const VERIFICATION_LABEL = { approved: 'Verified', pending: 'Pending', rejected: 'Rejected', changes_requested: 'Changes Requested', not_submitted: 'Not Submitted' }

// ---------------------------------------------------------------- ADM-021 directory
export function directoryRow(p, extras = {}) {
  const bookings = extras.bookings || []
  const upcoming = bookings.filter((b) => ['pending', 'accepted', 'confirmed', 'negotiation'].includes(b.status) && (b.scheduledStart || 0) >= Date.now()).length
  const finished = bookings.filter((b) => ['completed', 'cancelled'].includes(b.status))
  const completed = finished.filter((b) => b.status === 'completed').length
  return {
    id: p.uid,
    dbId: p.uid,
    name: p.name,
    entityType: p.category === 'hotel' ? 'hotel_resort' : p.category,
    typeId: p.type,
    typeLabel: p.typeLabel,
    market: MARKETS[p.countryCode]?.name || p.country || 'Unknown',
    marketCode: p.countryCode || null,
    city: p.city || '—',
    region: p.region || '—',
    flag: FLAGS[p.countryCode] || '🌍',
    verification: p.verificationStatus === 'approved' ? 'verified' : p.verificationStatus || 'pending',
    verificationLabel: VERIFICATION_LABEL[p.verificationStatus] || label(p.verificationStatus),
    contentAttention: extras.contentPending ? `${extras.contentPending} item(s) awaiting moderation` : null,
    attentionCount: extras.contentPending || 0,
    availability: p.isAvailable === true ? 'available_now' : p.isAvailable === false ? 'unavailable' : 'unknown',
    availabilityLabel: p.isAvailable === true ? 'Available' : p.isAvailable === false ? 'Unavailable' : '—',
    nextAvailable: null,
    rating: p.rating || 0,
    reviewCount: p.reviewCount || 0,
    bookings: bookings.length || p.totalBookings || 0,
    status: p.accountStatus,
    statusLabel: label(p.accountStatus),
    avatar: p.avatar,
    email: p.email,
    phone: p.phone,
    joinedDate: fmtDate(p.createdAt),
    joinedAt: p.createdAt,
    subscriptionPlan: p.subscriptionPlan || null,
    subscriptionStatus: lowerStatus(p.subscriptionStatus) || 'none',
    subscriptionRenewal: null,
    activity: { totalBookings: bookings.length, upcomingBookings: upcoming, completionRate: pct(completed, finished.length), cancellationRate: pct(finished.length - completed, finished.length) },
    verificationChecklist: {
      identity: VERIFICATION_LABEL[p.identityVerificationStatus] || label(p.identityVerificationStatus),
      credentials: VERIFICATION_LABEL[p.professionalVerificationStatus] || label(p.professionalVerificationStatus),
      business: p.category === 'individual' ? null : VERIFICATION_LABEL[p.businessVerificationStatus] || label(p.businessVerificationStatus),
    },
    accountHealth: { status: label(p.accountStatus), activeRestrictions: extras.restrictions || 'None' },
    services: extras.serviceCount ?? null,
    recentBookings: [],
  }
}

export function queryDirectory(rows, params = {}) {
  const {
    market = 'ALL', providerType = 'all', subcategory = 'all', status = 'all', searchQuery = '', verification = 'all',
    location = 'all', availability = 'all', subscription = 'all', minRating = 0, sortBy = 'newest', page = 1, pageSize = 10,
  } = params
  const scoped = rows.filter((r) => market === 'ALL' || r.marketCode === market)
  const q = String(searchQuery || '').trim().toLowerCase()
  const filtered = scoped.filter((r) => {
    if (providerType !== 'all') {
      if (providerType === 'individual' || providerType === 'professionals') { if (r.entityType !== 'individual') return false } else if (r.entityType !== providerType && r.typeId !== providerType) return false
    }
    if (subcategory !== 'all' && r.typeId !== subcategory) return false
    if (status !== 'all' && r.status !== status) return false
    if (verification !== 'all' && r.verification !== verification) return false
    if (location !== 'all' && String(r.city).toLowerCase() !== String(location).toLowerCase()) return false
    if (availability !== 'all' && r.availability !== availability) return false
    if (subscription !== 'all' && r.subscriptionStatus !== subscription) return false
    if (Number(minRating) && (r.rating || 0) < Number(minRating)) return false
    if (q && ![r.id, r.name, r.email, r.phone, r.city, r.typeLabel].some((v) => String(v || '').toLowerCase().includes(q))) return false
    return true
  })
  const sorters = {
    newest: (a, b) => (b.joinedAt || 0) - (a.joinedAt || 0),
    oldest: (a, b) => (a.joinedAt || 0) - (b.joinedAt || 0),
    rating: (a, b) => (b.rating || 0) - (a.rating || 0),
    bookings: (a, b) => (b.bookings || 0) - (a.bookings || 0),
    name: (a, b) => a.name.localeCompare(b.name),
  }
  // Exact ID matches first.
  const sorted = [...filtered].sort((a, b) => (q && (b.id.toLowerCase() === q) - (a.id.toLowerCase() === q)) || (sorters[sortBy] || sorters.newest)(a, b))
  const size = Math.min(100, Math.max(1, Number(pageSize) || 10))
  const totalPages = Math.max(1, Math.ceil(sorted.length / size))
  const current = Math.min(totalPages, Math.max(1, Number(page) || 1))
  const count = (pred) => scoped.filter(pred).length
  return {
    items: sorted.slice((current - 1) * size, current * size),
    totalItems: sorted.length,
    totalPages,
    currentPage: current,
    pageSize: size,
    typeCounts: { all: scoped.length, professionals: count((r) => r.entityType === 'individual'), spa: count((r) => r.entityType === 'spa'), hotel_resort: count((r) => r.entityType === 'hotel_resort') },
    statusCounts: { all: scoped.length, active: count((r) => r.status === 'active'), pending: count((r) => r.status === 'pending'), under_review: count((r) => r.status === 'under_review'), suspended: count((r) => r.status === 'suspended'), inactive: count((r) => ['rejected', 'deactivated'].includes(r.status)) },
    displayTotalCount: scoped.length,
  }
}

// ---------------------------------------------------------------- ADM-023 services
export function serviceView(id, s, currency = 'KES') {
  const minutes = Number(s.durationMinutes ?? s.duration) || null
  const price = typeof s.price === 'number' ? s.price : Number(s.price) || null
  const moderation = lowerStatus(s.moderationStatus)
  const active = s.isActive !== false && !s.isDeleted
  return {
    id,
    serviceId: s.serviceId || id,
    name: s.serviceName || s.name || 'Service',
    category: s.category || '—',
    duration: minutes ? `${minutes} min` : '—',
    durationMinutes: minutes,
    price: price != null ? money(price, s.currency || currency) : '—',
    priceNum: price,
    availability: label(s.availabilityType || 'general'),
    availabilityCode: s.availabilityType || 'general',
    status: s.isDeleted ? 'deleted' : active ? 'active' : 'inactive',
    active,
    reviewStatus: moderation === 'pending' ? 'pending_review' : moderation || 'approved',
    approvalStatus: moderation === 'pending' ? 'pending_review' : moderation || 'approved',
    hasPendingChanges: moderation === 'pending',
    description: s.description || '',
    createdDate: fmtDate(millis(s.createdAt)),
    lastUpdated: fmtDate(millis(s.updatedAt)),
    image: s.imageUrl || s.serviceImage || s.thumbnailUrl || null,
    images: [s.imageUrl || s.serviceImage].filter(Boolean),
    availabilityConfig: { type: s.availabilityType || 'general', minimumBookingNotice: s.minimumBookingNotice ?? null, maxBookingsPerDay: s.maxBookingsPerDay ?? null, sessionTypes: s.sessionTypes || [] },
    contentReview: { status: moderation || 'approved', submittedAt: fmtDate(millis(s.updatedAt || s.createdAt)), reviewer: null },
    priceHistory: [],
    pricingAlerts: null,
    acceptsNegotiation: Boolean(s.acceptsNegotiation),
  }
}

// ---------------------------------------------------------------- ADM-024 bookings
export function bookingRow(b, raw = {}) {
  const currency = b.currency || 'KES'
  return {
    id: b.id,
    bookingId: b.id,
    clientId: b.client.id,
    clientName: b.client.name,
    clientAvatar: raw.customerProfilePic || null,
    clientPhone: null, // contact details are revealed through the guarded booking views
    clientEmail: null,
    serviceId: b.service.id,
    serviceName: b.service.name,
    duration: b.durationMins ? `${b.durationMins} min` : '—',
    dateTime: fmtDateTime(b.scheduledStart),
    dateOnly: fmtDate(b.scheduledStart),
    timeOnly: b.scheduledStart ? `${fmtDateTime(b.scheduledStart).split(' • ')[1]} (${b.durationMins} min)` : '—',
    location: b.location.label || b.location.mode || '—',
    amount: b.amount,
    amountFormatted: money(b.amount, currency),
    paymentStatus: b.payment || lowerStatus(raw.paymentStatus) || '—',
    paymentDate: null,
    escrowStatus: b.escrow || lowerStatus(raw.escrowStatus) || 'none',
    status: b.status,
    bookingSource: raw.bookingSource || b.source || '—',
    negotiation: raw.negotiationEnabled ? { enabled: true, status: raw.negotiationStatus || null } : null,
    paymentBreakdown: { clientPaid: b.amount, platformFeePercent: b.amount && b.platformFee != null ? Math.round((b.platformFee / b.amount) * 100) : null, platformFee: b.platformFee, providerEarnings: b.providerAmount },
    timeline: [
      b.createdAt && { time: fmtDateTime(b.createdAt), title: 'Booking created', status: 'done' },
      b.confirmedAt && { time: fmtDateTime(b.confirmedAt), title: 'Booking confirmed', status: 'done' },
      b.serviceStartedAt && { time: fmtDateTime(b.serviceStartedAt), title: 'Service started', status: 'done' },
      b.completedAt && { time: fmtDateTime(b.completedAt), title: 'Completed', status: 'done' },
      b.cancelledAt && { time: fmtDateTime(b.cancelledAt), title: 'Cancelled', status: 'done' },
    ].filter(Boolean),
    scheduledStart: b.scheduledStart,
  }
}

const UPCOMING = new Set(['pending', 'negotiation', 'accepted', 'confirmed', 'on_the_way', 'arrived'])
const ONGOING = new Set(['service_in_progress', 'awaiting_client_confirmation'])

export function bookingsSummary(bookings, { wallet = null, escrows = [], withdrawals = [], finance = false, currency = 'KES', avgRating = null } = {}) {
  const count = (pred) => bookings.filter(pred).length
  const finished = bookings.filter((b) => ['completed', 'cancelled', 'rejected', 'expired'].includes(b.status))
  const completed = bookings.filter((b) => b.status === 'completed')
  const perClient = new Map()
  for (const b of completed) if (b.client.id) perClient.set(b.client.id, (perClient.get(b.client.id) || 0) + 1)
  const sum = (list, f) => list.reduce((t, x) => t + (Number(f(x)) || 0), 0)
  const localOf = (e, k) => e.local?.[k] ?? (k === 'totalPrice' ? e.amount : null)
  const escrowBy = (statuses) => sum(escrows.filter((e) => statuses.includes(lowerStatus(e.status))), (e) => localOf(e, 'totalPrice'))
  const openW = withdrawals.filter((w) => ['submitted', 'pending', 'pending_approval', 'processing', 'manual_review'].includes(lowerStatus(w.status)))
  const latestW = [...withdrawals].sort((a, b) => (millis(b.createdAt) || 0) - (millis(a.createdAt) || 0))[0]
  return {
    counts: {
      total: bookings.length,
      upcoming: count((b) => UPCOMING.has(b.status)),
      ongoing: count((b) => ONGOING.has(b.status)),
      completed: completed.length,
      cancelled: count((b) => ['cancelled', 'rejected', 'expired'].includes(b.status)),
      disputed: count((b) => b.escrow === 'disputed' || b.flags?.dispute),
    },
    financials: finance
      ? {
          grossServiceValue: sum(completed, (b) => b.amount),
          providerEarnings: sum(completed, (b) => b.providerAmount),
          platformFees: sum(completed, (b) => b.platformFee),
          pendingEscrow: escrowBy(['funded', 'held', 'pending']),
          availableBalance: wallet?.local?.availableBalance ?? null,
          paidOut: sum(withdrawals.filter((w) => ['completed', 'approved'].includes(lowerStatus(w.status))), (w) => w.amount),
          currency,
        }
      : null,
    escrowPositions: finance ? { held: escrowBy(['funded', 'held', 'pending']), released: escrowBy(['released']), disputed: escrowBy(['disputed']), refunded: escrowBy(['refunded', 'split_refund']), currency } : null,
    withdrawalPositions: finance
      ? {
          availableToWithdraw: wallet?.local?.availableBalance ?? null,
          pendingWithdrawal: sum(openW, (w) => w.amount),
          processing: sum(withdrawals.filter((w) => lowerStatus(w.status) === 'processing'), (w) => w.amount),
          completed: sum(withdrawals.filter((w) => ['completed', 'approved'].includes(lowerStatus(w.status))), (w) => w.amount),
          failed: sum(withdrawals.filter((w) => ['failed', 'rejected'].includes(lowerStatus(w.status))), (w) => w.amount),
          recentRequest: latestW ? { id: latestW.withdrawalId || latestW.id, amount: latestW.amount, currency, status: lowerStatus(latestW.status), statusLabel: label(latestW.status), requestedAt: fmtDate(millis(latestW.createdAt)) } : null,
          currency,
        }
      : null,
    performance: {
      completionRate: finished.length ? Math.round((completed.length / finished.length) * 1000) / 10 : null,
      cancellationRate: finished.length ? Math.round(((finished.length - completed.length) / finished.length) * 1000) / 10 : null,
      averageBookingValue: completed.length ? Math.round(sum(completed, (b) => b.amount) / completed.length) : null,
      repeatClientsRate: perClient.size ? Math.round(([...perClient.values()].filter((n) => n > 1).length / perClient.size) * 100) : null,
      averageRating: avgRating,
      bookingGrowth: null,
    },
  }
}

export function topServices(bookings, currency = 'KES') {
  const map = new Map()
  for (const b of bookings) {
    const s = map.get(b.service.name) || { name: b.service.name, bookings: 0, revenue: 0, completed: 0 }
    s.bookings += 1
    if (b.status === 'completed') { s.completed += 1; s.revenue += b.amount || 0 }
    map.set(b.service.name, s)
  }
  return [...map.values()].sort((a, b) => b.bookings - a.bookings).slice(0, 5).map((s) => ({ ...s, revenueFormatted: money(s.revenue, currency), completionRate: s.bookings ? Math.round((s.completed / s.bookings) * 100) : 0 }))
}

export function walletTransactions(tx, currency = 'KES') {
  return [...tx]
    .sort((a, b) => (millis(b.createdAt) || 0) - (millis(a.createdAt) || 0))
    .slice(0, 5)
    .map((t) => {
      const amount = Number(t.localAmount ?? t.amount) || 0
      // Direction from the recorded balance movement, else from the transaction type.
      const credit = typeof t.balanceAfter === 'number' && typeof t.balanceBefore === 'number' ? t.balanceAfter >= t.balanceBefore : /earn|release|credit|top.?up|deposit/i.test(t.type || t.transactionType || '')
      return { id: t.id, type: t.type || t.transactionType, typeLabel: label(t.type || t.transactionType), reference: t.bookingId ? `#${t.bookingId}` : t.referenceId || '—', amount, amountFormatted: `${credit ? '+' : '−'} ${money(Math.abs(amount), t.localAmount != null ? currency : t.currency || currency)}`, date: fmtDate(millis(t.createdAt)), isCredit: credit, walletType: t.walletType || 'provider_wallet' }
    })
}

export const normalizeProviderBookings = (raw) => raw.filter((d) => lowerStatus(d.bookingStatus ?? d.status) !== 'draft').map((d) => ({ b: normalizeBooking(d.id, { ...d, derivedCountryCode: d.derivedCountryCode }), raw: d }))

// ---------------------------------------------------------------- reviews (shared app collection)
export function reviewStats(reviews) {
  const rated = reviews.filter((r) => typeof r.rating === 'number' && r.status !== 'removed' && r.status !== 'hidden')
  const avg = rated.length ? Math.round((rated.reduce((t, r) => t + r.rating, 0) / rated.length) * 10) / 10 : null
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = rated.filter((r) => Math.round(r.rating) === stars).length
    return { stars, count, percentage: rated.length ? Math.round((count / rated.length) * 100) : 0 }
  })
  return { avg, count: rated.length, distribution }
}

// ---------------------------------------------------------------- ADM-022 profile
export function buildProfileView(bundle, { perms = {}, now = Date.now() } = {}) {
  const p = bundle.provider
  const raw = bundle.raw
  const currency = currencyOf(p)
  const items = normalizeProviderBookings(bundle.bookings.map((d) => ({ ...d, derivedCountryCode: p.countryCode })))
  const bookings = items.map((x) => x.b)
  const reviews = reviewStats(bundle.reviews)
  const summary = bookingsSummary(bookings, { finance: false, avgRating: reviews.avg })
  const activeRestrictions = bundle.restrictions.filter((r) => r.kind && lowerStatus(r.status) === 'active' && (!millis(r.expiresAt) || millis(r.expiresAt) > now))
  const openCases = bundle.safety.filter((s) => ['pending', 'open', 'under_investigation'].includes(lowerStatus(s.status))).length + bundle.disputes.filter((d) => lowerStatus(d.status) === 'open').length + bundle.support.filter((s) => lowerStatus(s.status) === 'open').length
  const sub = [...bundle.subscriptions].sort((a, b) => (millis(b.startDate || b.createdAt) || 0) - (millis(a.startDate || a.createdAt) || 0))[0] || null
  const subPay = [...bundle.subscriptionPayments].sort((a, b) => (millis(b.paidAt || b.createdAt) || 0) - (millis(a.paidAt || a.createdAt) || 0))[0] || null
  const vr = [...bundle.verificationRequests].sort((a, b) => (millis(b.submittedAt || b.createdAt) || 0) - (millis(a.submittedAt || a.createdAt) || 0))
  const pendingContent = bundle.content.filter((c) => ['awaiting_review', 'under_review', 'resubmitted', 'escalated'].includes(c.status))
  const comp = (status) => ({ status: VERIFICATION_LABEL[lowerStatus(status)] || label(status) || 'Not Submitted', raw: lowerStatus(status) || null })
  const detail = raw.detail
  const galleryApproved = bundle.gallery.filter((g) => lowerStatus(g.moderationStatus) !== 'rejected')
  const recentActivity = [
    ...bookings.filter((b) => b.createdAt).map((b) => ({ at: b.createdAt, action: `Booking ${b.status.replace(/_/g, ' ')} — ${b.service.name}`, type: 'booking' })),
    ...vr.map((v) => ({ at: millis(v.submittedAt || v.createdAt), action: `Verification ${lowerStatus(v.status) || 'submitted'}${v.docType ? ` — ${v.docType}` : ''}`, type: 'verification' })),
    ...bundle.reviews.map((r) => ({ at: millis(r.createdAt), action: `New ${r.rating}★ review`, type: 'review' })),
    ...bundle.actions.map((a) => ({ at: millis(a.createdAt), action: a.label || a.action, type: 'account' })),
  ].filter((a) => a.at).sort((a, b) => b.at - a.at).slice(0, 10).map((a, i) => ({ id: `act-${i}`, time: fmtDateTime(a.at), action: a.action, type: a.type }))

  return {
    id: p.uid,
    dbId: p.uid,
    name: p.name,
    verified: p.verified,
    entityType: p.category === 'hotel' ? 'hotel_resort' : p.category,
    providerType: p.typeLabel,
    typeId: p.type,
    market: MARKETS[p.countryCode]?.name || p.country || 'Unknown',
    marketCode: p.countryCode,
    city: p.city || '—',
    region: p.region || '—',
    flag: FLAGS[p.countryCode] || '🌍',
    status: p.accountStatus,
    statusLabel: label(p.accountStatus),
    availabilityStatus: p.isAvailable === true ? 'available_now' : p.isAvailable === false ? 'unavailable' : 'unknown',
    availabilityLabel: p.isAvailable === true ? 'Available' : p.isAvailable === false ? 'Unavailable' : '—',
    avatar: p.avatar,
    coverImage: detail.coverPhoto || null,
    joinedDate: fmtDate(p.createdAt),
    lastActive: p.lastActive ? fmtDateTime(p.lastActive) : '—',
    rating: reviews.avg ?? p.rating ?? 0,
    reviewCount: reviews.count || p.reviewCount || 0,
    tagline: detail.headline || null,
    health: {
      verification: VERIFICATION_LABEL[p.verificationStatus] || label(p.verificationStatus),
      account: label(p.accountStatus),
      subscription: sub ? label(sub.status) : 'None',
      bookings: bookings.length,
      upcomingBookings: summary.counts.upcoming,
      rating: reviews.avg ?? 0,
      reviews: reviews.count,
      openIssues: openCases,
      openIssuesSubtitle: openCases ? `${openCases} open case${openCases === 1 ? '' : 's'}` : 'No active cases',
    },
    personalInfo: {
      fullName: raw.user.fullName || detail.fullName || p.name,
      providerId: p.uid,
      providerType: p.typeLabel,
      email: perms.revealPii ? p.email : p.email ? String(p.email).replace(/^(.{2}).*(@.*)$/, '$1••••$2') : '—',
      phone: perms.revealPii ? p.phone : p.phone ? `${String(p.phone).slice(0, 4)}••••${String(p.phone).slice(-3)}` : '—',
      country: p.country || '—',
      city: p.city || '—',
      accountCreated: fmtDate(p.createdAt),
      dateOfBirth: null,
      gender: detail.gender || null,
      emergencyContact: null,
      address: detail.physicalAddress || detail.address || null,
    },
    professionalInfo: {
      specialization: p.typeLabel,
      experience: p.yearsExperience != null ? `${p.yearsExperience} Years` : '—',
      serviceModes: detail.serviceModes || detail.sessionTypes || [],
      languages: (Array.isArray(p.languages) ? p.languages.join(' • ') : p.languages) || '—',
      bio: p.bio || '',
      education: null,
      certifications: (vr[0]?.professionalDocumentTitles || []).map((t) => ({ name: t, status: label(vr[0]?.professionalVerificationStatus) })),
      equipmentSupplied: [],
    },
    availability: {
      status: p.isAvailable === true ? 'available_now' : 'unavailable',
      statusLabel: p.isAvailable === true ? 'Available' : p.isAvailable === false ? 'Unavailable' : '—',
      nextAvailable: null,
      thisWeekSlots: null,
      serviceArea: detail.serviceRadiusKm || detail.serviceRadius ? `${p.city || ''} • ${detail.serviceRadiusKm || detail.serviceRadius} km travel radius` : p.city || '—',
      radiusKm: Number(detail.serviceRadiusKm || detail.serviceRadius) || null,
      coordinates: detail.latitude && detail.longitude ? { lat: detail.latitude, lng: detail.longitude } : null,
      travelBase: detail.area || p.city || null,
      workingHours: null,
      slotsToday: [],
    },
    gallery: {
      mainPhoto: p.avatar,
      thumbnails: galleryApproved.slice(0, 4).map((g) => g.thumbnailUrl || g.imageUrl),
      totalCount: bundle.gallery.length,
      pendingApproval: { count: bundle.gallery.filter((g) => lowerStatus(g.moderationStatus) === 'pending').length },
    },
    verification: {
      status: p.verificationStatus,
      identity: comp(p.identityVerificationStatus),
      credentials: comp(p.professionalVerificationStatus),
      profileInfo: comp(pendingContent.some((c) => c.contentType === 'profile_change') ? 'pending' : 'approved'),
      profilePhoto: comp(pendingContent.some((c) => c.contentType === 'profile_photo') ? 'pending' : 'approved'),
      supportingDocuments: comp(p.category === 'individual' ? p.professionalVerificationStatus : p.businessVerificationStatus),
      rejectionAlert: vr.find((v) => lowerStatus(v.status) === 'rejected')?.rejectionReason || null,
      latestRequestId: vr[0]?.id || null,
    },
    contentApproval: {
      profilePhoto: pendingContent.some((c) => c.contentType === 'profile_photo') ? 'Pending' : 'Approved',
      gallery: pendingContent.some((c) => c.contentType === 'gallery') ? 'Pending' : 'Approved',
      bio: pendingContent.some((c) => c.contentType === 'profile_change') ? 'Pending' : 'Approved',
      services: pendingContent.some((c) => c.contentType === 'service') ? 'Pending' : 'Approved',
      pendingCount: pendingContent.length,
      items: pendingContent.slice(0, 5).map((c) => ({ id: c.id, type: c.contentType, status: c.status, submittedAt: fmtDate(millis(c.submittedAt)), url: c.media?.[0]?.url || null })),
    },
    services: bundle.services.filter((s) => !s.isDeleted).map((s) => serviceView(s.id, s, currency)),
    bookingPerformance: {
      total: bookings.length,
      upcoming: summary.counts.upcoming,
      completed: summary.counts.completed,
      cancelled: summary.counts.cancelled,
      completionRate: summary.performance.completionRate == null ? '—' : `${summary.performance.completionRate}%`,
      cancellationRate: summary.performance.cancellationRate == null ? '—' : `${summary.performance.cancellationRate}%`,
      recentBookings: [...bookings].sort((a, b) => (b.scheduledStart || 0) - (a.scheduledStart || 0)).slice(0, 5).map((b) => ({ id: b.id, client: b.client.name, service: b.service.name, date: fmtDate(b.scheduledStart), price: money(b.amount, b.currency || currency), status: b.status })),
    },
    earnings: perms.finance
      ? (() => {
          const monthStart = new Date(now); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0)
          const done = bookings.filter((b) => b.status === 'completed')
          const total = done.reduce((t, b) => t + (b.providerAmount || 0), 0)
          const month = done.filter((b) => (b.completedAt || b.scheduledStart) >= monthStart.getTime()).reduce((t, b) => t + (b.providerAmount || 0), 0)
          const pending = (bundle.escrows || []).filter((e) => lowerStatus(e.status) === 'funded').reduce((t, e) => t + (e.local?.providerEarnings || 0), 0)
          const available = bundle.wallet?.local?.availableBalance ?? null
          return { currency, totalEarnings: total, totalEarningsFormatted: money(total, currency), thisMonth: month, thisMonthFormatted: money(month, currency), pending, pendingFormatted: money(pending, currency), availableForWithdrawal: available, availableFormatted: money(available, currency), defaultMasked: true, bankDetails: null }
        })()
      : { currency, restricted: true, defaultMasked: true },
    subscription: sub
      ? { status: label(sub.status), plan: sub.planName || '—', currentPeriod: `${fmtDate(millis(sub.startDate))} – ${fmtDate(millis(sub.endDate))}`, nextRenewal: fmtDate(millis(sub.endDate)), paymentStatus: subPay ? label(subPay.paymentStatus) : '—', interval: null, features: [] }
      : { status: 'None', plan: p.subscriptionPlan || '—', currentPeriod: '—', nextRenewal: '—', paymentStatus: '—', interval: null, features: [] },
    reviews: {
      rating: reviews.avg ?? 0,
      reviewCount: reviews.count,
      distribution: reviews.distribution,
      recentReview: null,
      list: [...bundle.reviews].sort((a, b) => (millis(b.createdAt) || 0) - (millis(a.createdAt) || 0)).slice(0, 3).map((r) => ({ id: r.id, clientName: r.customerName || 'Client', rating: r.rating, date: fmtDate(millis(r.createdAt)), comment: r.reviewText || r.comment || '', service: r.serviceName || '—' })),
    },
    supportSafety: {
      openSupportCases: bundle.support.filter((s) => lowerStatus(s.status) === 'open').length,
      openDisputes: bundle.disputes.filter((d) => lowerStatus(d.status) === 'open').length,
      safetyReports: bundle.safety.filter((s) => ['pending', 'open', 'under_investigation'].includes(lowerStatus(s.status))).length,
      activeRestrictions: activeRestrictions.length ? activeRestrictions.map((r) => label(r.kind)).join(', ') : 'None',
      statusText: openCases ? `${openCases} open case${openCases === 1 ? '' : 's'}` : 'No open safety concerns',
      isClean: openCases === 0,
      history: [
        ...bundle.safety.map((s) => ({ id: s.id, at: millis(s.createdAt), type: 'Safety', subject: s.issueType || 'Safety report', status: label(s.status) })),
        ...bundle.disputes.map((d) => ({ id: d.id, at: millis(d.createdAt), type: 'Dispute', subject: label(d.type) || 'Dispute', status: label(d.status) })),
        ...bundle.support.map((s) => ({ id: s.id, at: millis(s.createdAt), type: 'Support', subject: s.subject || 'Support ticket', status: label(s.status) })),
      ].sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 10).map(({ at, ...x }) => ({ ...x, date: fmtDate(at) })),
    },
    recentActivity,
    internalNotes: bundle.notes.map((n) => ({ id: n.id, text: n.note || n.text, author: n.authorName || n.author || 'Admin', team: n.team || null, date: fmtDate(millis(n.createdAt)), createdAt: millis(n.createdAt) })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    permissions: { canViewFinancials: Boolean(perms.finance), canRevealPii: Boolean(perms.revealPii) },
  }
}


// ---------------------------------------------------------------- ADM-020 dashboard
const CATEGORY_ICONS = { massage_therapist: 'hand', fitness_trainer: 'dumbbell', yoga_specialist: 'flower', meditation_specialist: 'brain', physiotherapist: 'activity', spa: 'sparkles', hotel_resort: 'hotel' }
const trend = (cur, prev) => (prev ? `${cur - prev >= 0 ? '+' : ''}${Math.round(((cur - prev) / prev) * 1000) / 10}%` : null)

/**
 * @param src { providers (mergeProvider rows), bookings (normalized, with countryCode), verificationRequests, content, subscriptions, subscriptionPayments, safety }
 */
export function buildProviderDashboardView(src, { market = 'ALL', markets = null, start, end, now = Date.now() }) {
  const inScope = (code) => (market !== 'ALL' ? code === market : !markets || (code && markets.includes(code)))
  const providers = src.providers.filter((p) => inScope(p.countryCode))
  const uids = new Set(providers.map((p) => p.uid))
  const bookings = src.bookings.filter((b) => uids.has(b.provider.id))
  const prevStart = start - (end - start)
  const joinedIn = (s, e) => providers.filter((p) => p.createdAt >= s && p.createdAt <= e).length
  const count = (pred) => providers.filter(pred).length
  const active = count((p) => p.accountStatus === 'active')
  const pendingVerification = count((p) => p.verificationStatus === 'pending' || p.professionalVerificationStatus === 'pending' || p.identityVerificationStatus === 'pending')
  const suspended = count((p) => p.accountStatus === 'suspended')
  const availableNow = count((p) => p.isAvailable === true && p.accountStatus === 'active')
  const vr = src.verificationRequests.filter((v) => uids.has(v.userId))
  const content = src.content.filter((c) => uids.has(c.providerId) && ['awaiting_review', 'under_review', 'resubmitted', 'escalated'].includes(c.status))
  const contentCount = (t) => content.filter((c) => c.contentType === t).length
  const currency = MARKETS[market]?.currency || 'KES'
  const completedIn = (s, e) => bookings.filter((b) => b.status === 'completed' && (b.completedAt || b.scheduledStart) >= s && (b.completedAt || b.scheduledStart) <= e)
  const periodBookings = bookings.filter((b) => b.createdAt >= start && b.createdAt <= end)
  const prevBookings = bookings.filter((b) => b.createdAt >= prevStart && b.createdAt < start)
  const finished = periodBookings.filter((b) => ['completed', 'cancelled', 'rejected', 'expired'].includes(b.status))
  const cancelRate = finished.length ? Math.round(((finished.length - finished.filter((b) => b.status === 'completed').length) / finished.length) * 1000) / 10 : null
  const perClient = new Map()
  for (const b of bookings.filter((x) => x.status === 'completed')) perClient.set(b.client.id, (perClient.get(b.client.id) || 0) + 1)
  const repeat = perClient.size ? Math.round(([...perClient.values()].filter((n) => n > 1).length / perClient.size) * 100) : null
  const rated = providers.filter((p) => p.rating > 0)
  const avgRating = rated.length ? Math.round((rated.reduce((t, p) => t + p.rating, 0) / rated.length) * 10) / 10 : null
  const earnings = completedIn(start, end).reduce((t, b) => t + (b.providerAmount || 0), 0)

  // Six-bucket growth series over the period.
  const step = (end - start) / 5
  const growthSeries = Array.from({ length: 5 }, (_, i) => {
    const s = start + i * step
    const e = s + step
    return { label: fmtDate(e).slice(0, 6), newProviders: providers.filter((p) => p.createdAt >= s && p.createdAt < e).length, activatedProviders: providers.filter((p) => p.accountStatus === 'active' && p.createdAt >= s && p.createdAt < e).length }
  })

  const statusSegments = [
    ['active', 'Active', '#10b981'],
    ['pending', 'Pending', '#f59e0b'],
    ['under_review', 'Under Review', '#6366f1'],
    ['suspended', 'Suspended', '#ef4444'],
    ['rejected', 'Rejected / Inactive', '#94a3b8'],
  ].map(([id, l, color]) => {
    const n = count((p) => (id === 'rejected' ? ['rejected', 'deactivated'].includes(p.accountStatus) : p.accountStatus === id))
    return { id, label: l, count: n, percentage: providers.length ? Math.round((n / providers.length) * 100) : 0, color }
  })

  const subs = src.subscriptions.filter((x) => uids.has(x.userId))
  const subsActive = subs.filter((x) => lowerStatus(x.status) === 'active' && (!millis(x.endDate) || millis(x.endDate) > now))
  const subRevenue = src.subscriptionPayments.filter((x) => uids.has(x.providerId) && ['successful', 'completed', 'paid'].includes(lowerStatus(x.paymentStatus)) && (millis(x.paidAt || x.createdAt) || 0) >= start).reduce((t, x) => t + (Number(x.amount) || 0), 0)

  const byMarket = new Map()
  for (const p of providers) byMarket.set(p.countryCode || 'UNKNOWN', (byMarket.get(p.countryCode || 'UNKNOWN') || 0) + 1)

  return {
    marketId: market,
    marketName: MARKETS[market]?.name || 'All Markets',
    reportingCurrency: currency,
    kpis: {
      totalProviders: providers.length, totalProvidersTrend: trend(providers.length, providers.length - joinedIn(start, end)), totalProvidersVs: 'vs start of period',
      activeProviders: active, activeProvidersTrend: null, activeProvidersVs: '',
      pendingVerification, pendingVerificationTrend: null, pendingVerificationVs: '',
      newProviders: joinedIn(start, end), newProvidersTrend: trend(joinedIn(start, end), joinedIn(prevStart, start)), newProvidersVs: 'vs previous period',
      suspended, suspendedTrend: null, suspendedVs: '',
      availableNow, availableNowTrend: null, availableNowVs: '',
    },
    attention: [
      { id: 'verification', title: 'Pending Verification', count: vr.filter((v) => lowerStatus(v.status) === 'pending').length, description: 'Verification submissions awaiting review', badgeColor: 'amber', link: '/verifications/queue', actionLabel: 'Review' },
      { id: 'content', title: 'Content Approval', count: content.length, description: 'Photos, gallery, profile and service changes', badgeColor: 'purple', link: '/content-approval', actionLabel: 'Moderate' },
      { id: 'safety', title: 'Safety Reports', count: src.safety.filter((s) => uids.has(s.providerId) && ['pending', 'open', 'under_investigation'].includes(lowerStatus(s.status))).length, description: 'Open reports involving providers', badgeColor: 'red', link: '/safety', actionLabel: 'Review' },
      { id: 'suspended', title: 'Suspended Providers', count: suspended, description: 'Accounts currently suspended', badgeColor: 'red', link: '/providers/all?status=suspended', actionLabel: 'View' },
      { id: 'subscriptions', title: 'Inactive Subscriptions', count: providers.length - subsActive.length, description: 'Providers without an active subscription', badgeColor: 'blue', link: '/providers/all', actionLabel: 'View' },
    ],
    categories: Object.entries(PROVIDER_TYPES).map(([id, info]) => ({ id, name: info.label, total: count((p) => p.type === id), active: count((p) => p.type === id && p.accountStatus === 'active'), icon: CATEGORY_ICONS[id] })),
    growthSeries,
    statusDistribution: { total: providers.length, segments: statusSegments },
    verificationPipeline: {
      submitted: vr.length,
      awaitingReview: vr.filter((v) => lowerStatus(v.status) === 'pending').length,
      approved: vr.filter((v) => lowerStatus(v.status) === 'approved').length,
      rejected: vr.filter((v) => lowerStatus(v.status) === 'rejected').length,
      categories: [
        { name: 'Identity', count: vr.filter((v) => lowerStatus(v.identityVerificationStatus) === 'pending').length },
        { name: 'Professional Credentials', count: vr.filter((v) => lowerStatus(v.professionalVerificationStatus) === 'pending').length },
        { name: 'Business Documents', count: vr.filter((v) => lowerStatus(v.businessVerificationStatus) === 'pending').length },
        { name: 'Content Items', count: vr.filter((v) => /gallery|profile/.test(lowerStatus(v.requestType)) && lowerStatus(v.status) === 'pending').length },
      ],
    },
    contentApproval: { profilePhotos: contentCount('profile_photo'), galleryPhotos: contentCount('gallery'), profileInfo: contentCount('profile_change'), servicesDescriptions: contentCount('service'), businessInfo: contentCount('business_profile'), totalAwaiting: content.length },
    activity: {
      availableNow,
      bookedToday: new Set(bookings.filter((b) => b.scheduledStart && Math.floor((b.scheduledStart + 3 * 3600000) / DAY) === Math.floor((now + 3 * 3600000) / DAY)).map((b) => b.provider.id)).size,
      unavailable: count((p) => p.isAvailable === false),
      noScheduleConfigured: count((p) => p.isAvailable == null),
    },
    performance: {
      bookings: periodBookings.length, bookingsTrend: trend(periodBookings.length, prevBookings.length),
      completed: completedIn(start, end).length, completedTrend: trend(completedIn(start, end).length, completedIn(prevStart, start).length),
      cancellationRate: cancelRate == null ? '—' : `${cancelRate}%`, cancellationTrend: null,
      averageRating: avgRating, ratingTrend: null,
      repeatBookingRate: repeat == null ? '—' : `${repeat}%`, repeatBookingTrend: null,
      providerEarningsAmount: earnings, providerEarningsFormatted: money(earnings, currency), providerEarningsCompact: money(earnings, currency),
    },
    quality: {
      rating45Plus: count((p) => p.rating >= 4.5),
      highCompletionRate: null,
      lowCancellation: null,
      needsPerformanceReview: count((p) => p.rating > 0 && p.rating < 3.5),
    },
    recentProviders: [...providers].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5).map((p) => ({ id: p.uid, name: p.name, type: p.typeLabel, typeId: p.type, market: MARKETS[p.countryCode]?.name || p.country || 'Unknown', marketCode: p.countryCode, verification: VERIFICATION_LABEL[p.verificationStatus] || label(p.verificationStatus), verificationStatus: p.verificationStatus, status: label(p.accountStatus), statusId: p.accountStatus, joined: fmtDate(p.createdAt), avatar: p.avatar })),
    marketDistribution: [...byMarket].sort((a, b) => b[1] - a[1]).map(([code, n]) => ({ code, name: MARKETS[code]?.name || (code === 'UNKNOWN' ? 'Unknown' : code), count: n, percent: providers.length ? Math.round((n / providers.length) * 100) : 0, flag: FLAGS[code] || '🌍' })),
    subscriptions: {
      active: subsActive.length,
      expiringSoon: subsActive.filter((x) => millis(x.endDate) && millis(x.endDate) - now < 7 * DAY).length,
      paymentFailed: src.subscriptionPayments.filter((x) => uids.has(x.providerId) && lowerStatus(x.paymentStatus) === 'failed').length,
      inactive: providers.length - subsActive.length,
      revenueAmount: Math.round(subRevenue * 100) / 100,
      revenueFormatted: money(subRevenue, 'USD'),
      revenueCompact: money(subRevenue, 'USD'),
    },
    accountHealth: { healthy: active, needsAttention: count((p) => ['pending', 'under_review'].includes(p.accountStatus)), suspended, inactive: count((p) => ['rejected', 'deactivated'].includes(p.accountStatus)) },
  }
}

// ---------------------------------------------------------------- ADM-024 Spa / Hotel context
/** Business breakdowns for Spa / Hotel providers, computed from their bookings. */
export function businessContext(category, items, currency = 'KES', finance = false) {
  if (category !== 'spa' && category !== 'hotel') return null
  const group = (key) => {
    const m = new Map()
    for (const { b, raw } of items) {
      const k = key(b, raw)
      if (!k) continue
      const g = m.get(k) || { name: k, bookings: 0, revenue: 0 }
      g.bookings += 1
      if (b.status === 'completed') g.revenue += b.amount || 0
      m.set(k, g)
    }
    return [...m.values()].sort((a, b) => b.bookings - a.bookings).slice(0, 6).map((g) => ({ ...g, revenue: finance ? money(g.revenue, currency) : null }))
  }
  const total = items.length
  const src = (raw) => String(raw.bookingSource || '').toLowerCase()
  if (category === 'spa') {
    return {
      spa: {
        totalBookings: total,
        staffAssignedBookings: items.filter(({ b, raw }) => b.assignedId || raw.staffId || raw.assignedStaffId).length,
        unassignedBookings: items.filter(({ b, raw }) => !b.assignedId && !raw.staffId && !raw.assignedStaffId).length,
        walkInBookings: items.filter(({ raw }) => /walk/.test(src(raw))).length,
        branchRevenue: group((b, raw) => raw.branchName || b.branch).map((g) => ({ branch: g.name, revenue: g.revenue, bookings: g.bookings })),
        staffRevenueContribution: group((b, raw) => raw.assignedStaffName || raw.staffName || b.specialist).map((g) => ({ staff: g.name, revenue: g.revenue, bookings: g.bookings })),
      },
    }
  }
  const completed = items.filter(({ b }) => b.status === 'completed').reduce((t, { b }) => t + (b.amount || 0), 0)
  return {
    hotel: {
      totalBookings: total,
      inRoomBookings: items.filter(({ b, raw }) => /room/i.test(raw.locationType || b.location?.mode || '')).length,
      conciergeBookings: items.filter(({ raw }) => /concierge/.test(src(raw))).length,
      packageRedemptions: items.filter(({ raw }) => raw.isPackageRedemption).length,
      wellnessRevenue: finance ? money(completed, currency) : null,
      locationPerformance: group((b, raw) => raw.locationName || raw.wellnessLocationName || b.location?.label).map((g) => ({ location: g.name, revenue: g.revenue, bookings: g.bookings })),
    },
  }
}
