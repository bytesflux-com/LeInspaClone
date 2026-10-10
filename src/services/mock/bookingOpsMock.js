// Demo bookings for ADM-044 → ADM-048, used only when VITE_USE_MOCK_BOOKINGS=true.
// Rows are shaped like raw `bookings` documents and go through the same
// derivation code the Cloud Functions use, so demo and live behave alike.
import { normalizeBooking } from '../../../functions/src/bookingsLogic.js'

const MIN = 60 * 1000
const DAY = 24 * 60 * MIN

const MARKETS = [
  ['KE', 'KES', 1, ['Nairobi', 'Westlands', 'Kilimani', 'Karen', 'Mombasa'], 0.62],
  ['UG', 'UGX', 28, ['Kampala', 'Entebbe'], 0.15],
  ['TZ', 'TZS', 19, ['Dar es Salaam', 'Arusha'], 0.12],
  ['RW', 'RWF', 10, ['Kigali'], 0.06],
  ['ZA', 'ZAR', 0.14, ['Cape Town', 'Johannesburg'], 0.05],
]
const CLIENTS = ['Sarah Wanjiku', 'David Mwangi', 'Amina Hassan', 'Brian Otieno', 'Grace Achieng', 'Peter Kamau', 'Naomi Chebet', 'Joseph Mutua', 'Faith Njoki', 'Kevin Odhiambo', 'Linda Atieno', 'Samuel Kiprop']
// [providerType, provider, services[[name, KES, mins]], staff, branches, resources]
const PROVIDERS = [
  ['massage_therapist', 'Grace Njeri', [['Deep Tissue Massage', 4500, 60], ['Swedish Massage', 3500, 60]]],
  ['fitness_trainer', 'Brian Otieno', [['Personal Training', 4000, 60]]],
  ['physiotherapist', 'Dr. Mercy Wairimu', [['Sports Physiotherapy', 5500, 45]]],
  ['yoga_specialist', 'Amina Wekesa', [['Private Yoga Session', 3500, 60]]],
  ['meditation_specialist', 'Naomi Chebet', [['Guided Meditation', 2500, 45]]],
  ['spa', 'Serenity Wellness Spa', [['Swedish Massage', 6500, 60], ['Hot Stone Therapy', 7500, 90], ['Classic Facial', 5000, 75]], ['Lucy Wanjiru', 'Mary Njeri', 'Esther Moraa'], ['Westlands Branch', 'Karen Branch'], ['Massage Room 2', 'Massage Bed 3']],
  ['spa', 'Radiance Day Spa', [['Aromatherapy Massage', 6000, 60]], ['Joy Akinyi'], ['Kilimani Branch'], ['Treatment Room 1']],
  ['hotel_resort', 'Elite Wellness Resort', [['Couples Massage', 14000, 90], ['Detox Body Wrap', 9000, 60]], ['John Kamau', 'Mary Njeri'], ['Wellness Pavilion'], ['Couples Suite', '2 Massage Beds']],
  ['hotel_resort', 'Tranquil Escapes Resort', [['Signature Spa Ritual', 12000, 120]], ['Peter Kamau'], ['Ocean Spa'], ['Suite 4']],
]
const SOURCES = ['app', 'app', 'app', 'app', 'shared_link', 'qr_code', 'walk_in', 'manual', 'phone']
const METHODS = ['M-Pesa', 'M-Pesa', 'Card', 'Airtel Money', 'MTN MoMo']
const GUESTS = [['Daniel Kamau', '+254712345678', 'daniel.kamau@gmail.com'], ['John Mwangi', '+254722118934', 'john.m@yahoo.com'], ['Halima Yusuf', '+256772554310', 'halima.y@gmail.com'], ['Neema Mushi', '+255754221908', 'neema.mushi@outlook.com'], ['Eric Habimana', '+250788310442', 'eric.h@gmail.com'], ['Thandi Nkosi', '+27821554410', 'thandi.n@gmail.com']]
const CLIENT_REASONS = [['Change of plans', 'change_of_plans'], ['Booked by mistake', 'mistake'], ['Late cancellation', 'late_cancellation'], ['Found another time', 'reschedule']]
const PROVIDER_REASONS = [['Specialist unavailable', 'specialist_unavailable'], ['Branch closure', 'branch_closure'], ['Resource unavailable', 'resource_unavailable'], ['Provider no-show', 'no_show']]
const ADMIN_REASONS = [['Duplicate booking', 'duplicate'], ['Payment verification failed', 'payment_failed'], ['Duplicate booking', 'duplicate'], ['Safety concern reported', 'safety_review']]
const POLICIES = [{ name: 'Flexible Cancellation', window: 'More than 2 hours before service', clientFee: 0, providerPenalty: 'Review required' }, { name: 'Standard Cancellation', window: 'More than 24 hours before service', clientFee: 0, providerPenalty: 'Warning' }, { name: 'Strict Cancellation', window: 'Less than 24 hours before service', clientFee: 50, providerPenalty: 'Review required' }]

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

function pickMarket(r) {
  let x = r()
  for (const m of MARKETS) {
    if ((x -= m[4]) <= 0) return m
  }
  return MARKETS[0]
}

// Lifecycle scenarios relative to `now`, weighted toward healthy bookings.
const SCENARIOS = [
  ['upcoming', 30],
  ['starting_soon', 6],
  ['late', 3],
  ['in_progress', 10],
  ['over_time', 2],
  ['awaiting', 3],
  ['completed', 34],
  ['cancelled', 8],
  ['pending', 4],
]
const scenarioTotal = SCENARIOS.reduce((n, [, w]) => n + w, 0)

function scenarioOf(r) {
  let x = r() * scenarioTotal
  for (const [id, w] of SCENARIOS) {
    if ((x -= w) <= 0) return id
  }
  return 'upcoming'
}

function buildDoc(i, now) {
  const r = rng(i * 7919 + 17)
  const [cc, currency, fx, cities] = pickMarket(r)
  const [ptype, provider, services, staff, branches, resources] = PROVIDERS[Math.floor(r() * PROVIDERS.length)]
  const [service, price, mins] = services[Math.floor(r() * services.length)]
  const business = ptype === 'spa' || ptype === 'hotel_resort'
  const scenario = scenarioOf(r)
  const chance = (p) => r() < p

  let start
  const doc = {
    bookingReference: `BK-${92841 - i * 37}`,
    countryCode: cc,
    currency,
    totalPrice: Math.round(price * fx),
    providerType: ptype,
    providerName: provider,
    providerId: `PR-${10000 + ((i * 131) % 80000)}`,
    customerName: CLIENTS[Math.floor(r() * CLIENTS.length)],
    customerId: `CL-${70000 + ((i * 97) % 9000)}`,
    serviceName: service,
    durationMinutes: mins,
    bookingSource: SOURCES[Math.floor(r() * SOURCES.length)],
    city: cities[Math.floor(r() * cities.length)],
    serviceMode: business ? 'In-venue' : chance(0.7) ? 'Home Service' : 'Provider Studio',
    paymentStatus: 'paid',
  }
  if (business) {
    doc.branchName = branches[Math.floor(r() * branches.length)]
    doc.resourceNames = resources
    if (chance(0.9)) doc.assignedStaffName = staff[Math.floor(r() * staff.length)]
  }
  doc.locationName = business ? `${doc.branchName}, ${doc.city}` : `${doc.serviceMode} · ${doc.city}`

  switch (scenario) {
    case 'upcoming':
      start = now + (2 * 60 + Math.floor(r() * 14 * 24 * 60)) * MIN
      doc.bookingStatus = chance(0.85) ? 'confirmed' : 'accepted'
      if (chance(0.08)) doc.paymentStatus = 'pending'
      if (chance(0.03)) doc.hasConflict = true
      if (chance(0.02)) doc.providerUnavailable = true
      break
    case 'pending':
      start = now + (6 * 60 + Math.floor(r() * 5 * 24 * 60)) * MIN
      doc.bookingStatus = chance(0.5) ? 'pending' : 'negotiation'
      doc.paymentStatus = 'pending'
      break
    case 'starting_soon':
      start = now + Math.floor(5 + r() * 50) * MIN
      doc.bookingStatus = chance(0.4) ? 'on_the_way' : 'confirmed'
      break
    case 'late':
      start = now - Math.floor(15 + r() * 30) * MIN
      doc.bookingStatus = 'confirmed'
      if (chance(0.5)) doc.delayReported = true
      break
    case 'in_progress':
      start = now - Math.floor(5 + r() * (mins - 10)) * MIN
      doc.bookingStatus = 'service_in_progress'
      doc.serviceStarted = true
      doc.serviceStartedAt = new Date(start + Math.floor(r() * 4) * MIN).toISOString()
      doc.serviceStartedBy = business ? 'Business staff' : 'Provider'
      if (chance(0.05)) doc.clientReportedIssue = true
      if (chance(0.04)) doc.providerReportedIssue = true
      break
    case 'over_time':
      start = now - (mins + 15 + Math.floor(r() * 30)) * MIN
      doc.bookingStatus = 'service_in_progress'
      doc.serviceStartedAt = new Date(start).toISOString()
      break
    case 'awaiting':
      start = now - (mins + 20 + Math.floor(r() * 120)) * MIN
      doc.bookingStatus = 'awaiting_client_confirmation'
      doc.serviceStartedAt = new Date(start).toISOString()
      doc.serviceCompletedByProvider = true
      doc.providerCompletedAt = new Date(start + mins * MIN).toISOString()
      break
    case 'completed': {
      start = now - Math.floor(2 * 60 + r() * 29 * 24 * 60) * MIN
      const end = start + mins * MIN
      doc.bookingStatus = 'completed'
      doc.serviceStartedAt = new Date(start).toISOString()
      doc.providerCompletedAt = new Date(end).toISOString()
      doc.serviceConfirmed = chance(0.88)
      if (doc.serviceConfirmed) doc.serviceConfirmedAt = new Date(end + 25 * MIN).toISOString()
      doc.completedAt = new Date(end + 30 * MIN).toISOString()
      doc.completedBy = doc.serviceConfirmed ? 'Client confirmation' : 'Provider'
      doc.escrowStatus = end < now - 2 * DAY ? (chance(0.92) ? 'released' : 'funded') : 'funded'
      if (doc.escrowStatus === 'released') {
        doc.escrowReleasedAt = new Date(end + 45 * MIN).toISOString()
        doc.settledAt = new Date(end + DAY).toISOString()
      }
      if (chance(0.03)) { doc.escrowStatus = 'disputed'; doc.hasOpenDispute = true }
      if (chance(0.03)) { doc.paymentStatus = 'refunded'; doc.escrowStatus = 'refunded' }
      else if (chance(0.025)) { doc.paymentStatus = 'refunding'; doc.refundStatus = 'Pending'; doc.refundRequestedAt = new Date(end + 3 * 60 * MIN).toISOString() }
      if (chance(0.02)) doc.hasOpenSupportTicket = true
      if (chance(0.01)) doc.chargeback = true
      doc.platformFee = Math.round(doc.totalPrice * 0.1)
      doc.providerAmount = doc.totalPrice - doc.platformFee
      if (chance(0.6)) {
        doc.rating = Math.round((4 + r()) * 10) / 10
        doc.reviewId = `RV-${10000 + i}`
        doc.reviewComment = ['Excellent service.', 'Very relaxing, will book again.', 'On time and professional.', 'Great experience overall.'][Math.floor(r() * 4)]
        doc.reviewStatus = 'published'
      }
      break
    }
    case 'cancelled':
      start = now + Math.floor(-10 * 24 * 60 + r() * 14 * 24 * 60) * MIN
    {
      doc.bookingStatus = 'cancelled'
      const who = r()
      doc.cancelledBy = who < 0.6 ? 'Client' : who < 0.9 ? 'Provider' : 'Admin'
      const [reason, code] = doc.cancelledBy === 'Client' ? CLIENT_REASONS[Math.floor(r() * CLIENT_REASONS.length)] : doc.cancelledBy === 'Provider' ? PROVIDER_REASONS[Math.floor(r() * PROVIDER_REASONS.length)] : ADMIN_REASONS[Math.floor(r() * ADMIN_REASONS.length)]
      doc.cancellationReason = reason
      doc.cancellationReasonCode = code
      const lead = code === 'no_show' || code === 'late_cancellation' ? 45 : 180 + Math.floor(r() * 2000)
      const cancelledAt = Math.min(now - 30 * MIN, start - lead * MIN)
      doc.cancellationRequestedAt = new Date(cancelledAt - 2 * MIN).toISOString()
      doc.cancelledAt = new Date(cancelledAt).toISOString()
      doc.cancellationPolicySnapshot = POLICIES[Math.floor(r() * POLICIES.length)]
      doc.clientNotified = chance(0.97)
      doc.providerNotified = true
      if (chance(0.15)) {
        doc.paymentStatus = 'pending' // never captured
      } else if (code === 'late_cancellation') {
        doc.refundStatus = 'No Refund'
      } else {
        const rr = r()
        doc.refundStatus = rr < 0.72 ? 'Refunded' : rr < 0.9 ? 'Pending' : null
        if (doc.refundStatus === 'Refunded') doc.paymentStatus = 'refunded'
        if (doc.refundStatus) {
          doc.refundAmount = Math.round(price * fx)
          doc.refundRequestedAt = new Date(cancelledAt + 2 * MIN).toISOString()
          doc.refundId = `RF-${20000 + i}`
          doc.refundReason = doc.cancelledBy === 'Client' ? 'Client cancellation within policy' : 'Provider cancellation'
        }
      }
      if (chance(0.03)) doc.hasOpenDispute = true
      break
    }
    default:
      start = now + DAY
  }
  doc.providerRating = Math.round((4.3 + r() * 0.7) * 10) / 10
  doc.providerReviewCount = 20 + Math.floor(r() * 300)
  if (business && doc.serviceStartedAt && doc.assignedStaffName) doc.staffCheckInAt = doc.serviceStartedAt
  doc.paymentMethod = METHODS[Math.floor(r() * METHODS.length)]
  doc.transactionId = `PAY-${700000 + i * 13}`
  // ~18% of bookings are guest checkouts (same bookings collection, no client account).
  if (chance(0.18)) {
    const [gname, gphone, gemail] = GUESTS[Math.floor(r() * GUESTS.length)]
    doc.customerType = 'GUEST'
    doc.customerName = gname
    doc.customerId = null
    doc.bookingSource = 'guest'
    doc.guestSnapshot = { fullName: gname, phone: gphone, email: gemail, phoneVerified: chance(0.93), emailVerified: chance(0.5), countryCode: cc }
    doc.notificationChannels = ['SMS', ...(chance(0.6) ? ['Email'] : [])]
    const a = r()
    if (a < 0.3) { doc.customerType = 'REGISTERED_FROM_GUEST'; doc.customerId = `CLT-${80000 + i}`; doc.accountLinkedAt = new Date(now - Math.floor(r() * 5 * DAY)).toISOString() }
    else if (a < 0.35) doc.accountLinkStatus = 'pending'
    else if (a < 0.38) { doc.accountLinkStatus = 'conflict'; doc.accountLinkConflictReason = 'Contact already associated with another account.' }
    else if (a < 0.45) doc.accountLinkStatus = 'registration_started'
  }
  doc.scheduledAt = new Date(start).toISOString()
  const created = Math.min(now - Math.floor(10 + r() * 7 * 24 * 60) * MIN, start - 30 * MIN)
  doc.createdAt = new Date(created).toISOString()
  if (doc.bookingStatus !== 'pending' && doc.bookingStatus !== 'negotiation') doc.confirmedAt = new Date(created + 20 * MIN).toISOString()
  if (chance(0.04) && scenario === 'upcoming') doc.rescheduledAt = new Date(now - Math.floor(r() * 6) * 60 * MIN).toISOString()
  return doc
}

// The two hand-written rows mirror the ADM-044/045 mockups.
function seeded(now) {
  return [
    ['BK-92841', { bookingReference: 'BK-92841', countryCode: 'KE', currency: 'KES', totalPrice: 4500, providerType: 'massage_therapist', providerName: 'Grace Njeri', customerName: 'Sarah Wanjiku', serviceName: 'Deep Tissue Massage', durationMinutes: 60, bookingSource: 'app', serviceMode: 'Home Service', city: 'Nairobi', locationName: 'Home Service · Kilimani, Nairobi', paymentStatus: 'paid', bookingStatus: 'service_in_progress', serviceStartedAt: new Date(now - 38 * MIN).toISOString(), serviceStartedBy: 'Provider', scheduledAt: new Date(now - 40 * MIN).toISOString(), createdAt: new Date(now - 3 * 60 * MIN).toISOString(), confirmedAt: new Date(now - 170 * MIN).toISOString() }],
    ['BK-82716', { bookingReference: 'BK-82716', countryCode: 'KE', currency: 'KES', totalPrice: 6500, providerType: 'spa', providerName: 'Serenity Wellness Spa', branchName: 'Westlands Branch', resourceNames: ['Massage Room 2', 'Massage Bed 3'], customerName: 'David Mwangi', serviceName: 'Swedish Massage', durationMinutes: 60, bookingSource: 'app', city: 'Westlands', locationName: 'Westlands Branch, Nairobi', paymentStatus: 'paid', bookingStatus: 'confirmed', scheduledAt: new Date(now + 45 * MIN).toISOString(), createdAt: new Date(now - 2 * 60 * MIN).toISOString(), confirmedAt: new Date(now - 110 * MIN).toISOString() }],
  ]
}

// Raw `bookings` documents ([id, data]) — also used by functions/scripts/seed-bookings.js.
export function mockBookingDocs(now = Date.now(), count = 420) {
  return [...seeded(now), ...Array.from({ length: count }, (_, i) => [`bk_${String(i + 1).padStart(4, '0')}`, buildDoc(i + 1, now)])]
}

let cache = null
export function mockBookings(now = Date.now()) {
  // Regenerate every few minutes so relative times stay believable.
  if (cache && now - cache.at < 5 * MIN) return cache.rows
  const rows = mockBookingDocs(now).map(([id, d]) => normalizeBooking(id, d))
  cache = { at: now, rows }
  return rows
}
