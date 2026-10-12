// In-memory demo backend for ADM-025 → ADM-028 (VITE_USE_MOCK_PROVIDERS=true).
// Seeds RAW records in the same shape as the Firestore collections and runs the
// exact pure logic the Cloud Functions use (functions/src/provider*Logic.js), so
// reads and writes behave like the real callables. Nothing is written to Firestore.

import { DAY, HOUR, normalizeBooking, normalizeCase, normalizeProvider, trustPermissions } from '../../../functions/src/providerAdminShared'
import { buildReviewDetail, buildReviewsView, normalizeReport, normalizeReview, planReviewModeration } from '../../../functions/src/providerReviewsLogic'
import {
  buildSubscriptionView,
  normalizePayment,
  normalizePlan,
  normalizeSubscription,
  planSubscriptionChange,
  planVisibilityChange,
  resolveSubscriptionStatus,
} from '../../../functions/src/providerSubscriptionLogic'
import { buildRiskView, normalizeAssessment, normalizeCredential, planRiskAssessment } from '../../../functions/src/providerRiskLogic'
import { buildAccountView, normalizeAction, normalizeRestriction, planAccountAction } from '../../../functions/src/providerAccountLogic'
import { DIRECTORY_PROVIDERS } from './providerDirectoryMock'

const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms))
const clone = (v) => JSON.parse(JSON.stringify(v))

// The mockups are drawn on "12 Sep 2026"; demo dates keep the same distance from today.
const MOCK_TODAY = Date.parse('2026-09-12T12:00:00+03:00')
const ANCHOR = Date.now()
const T = (iso) => ANCHOR + (Date.parse(iso) - MOCK_TODAY)

function rng(seed) {
  let a = 0
  for (const ch of String(seed)) a = (a * 31 + ch.charCodeAt(0)) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pick = (r, list) => list[Math.floor(r() * list.length)]

const FIRST = ['Sarah', 'Daniel', 'Lina', 'James', 'Faith', 'Kevin', 'Grace', 'Marcus', 'Amina', 'George', 'Mercy', 'Brian', 'Esther', 'Peter', 'Joy', 'Collins', 'Wanjiru', 'Hassan', 'Naomi', 'Ivy', 'Otieno', 'Ruth', 'Samuel', 'Achieng']
const LAST = ['Achieng', 'Kimani', 'Wanjiku', 'Odero', 'Mwangi', 'Otieno', 'Muthoni', 'Lee', 'Hassan', 'Ndirangu', 'Kamau', 'Njoroge', 'Chebet', 'Wafula', 'Mutua', 'Kariuki']
const TEXT = {
  5: ['Excellent experience. Professional, punctual and very attentive. Highly recommend!', 'Absolutely wonderful session — I left feeling completely renewed.', 'Best massage I have had in Nairobi. Will book again.', 'Very calm, clean and professional. Five stars.'],
  4: ['Great session overall, arrived a few minutes late but made up for it.', 'Very good technique, would have liked a slightly longer session.', 'Relaxing and professional. Booking was easy.'],
  3: ['The massage was okay but the pressure was not what I asked for.', 'Average experience, communication before the session could be better.'],
  2: ['Session felt rushed and started late.', 'Not what I expected based on the description.'],
  1: ['Very disappointing — the provider arrived 40 minutes late.'],
}
const RESPONSES = ['Thank you for your feedback. We appreciate your visit and look forward to seeing you again!', 'Thank you so much — it was a pleasure to have you.', 'Thank you for the honest feedback. I will take it on board.']

const SERVICES = {
  individual: ['Deep Tissue Massage', 'Swedish Massage', 'Sports Massage', 'Aromatherapy', 'Prenatal Massage', 'Lymphatic Drainage', 'Chair Massage'],
  spa: ['Swedish Massage', 'Hot Stone Therapy', 'Signature Facial', 'Couples Retreat', 'Body Scrub & Wrap'],
  hotel: ['In-Room Massage', 'Hydrotherapy Circuit', 'Sunrise Yoga', 'Couples Spa Package', 'Detox Wellness Package'],
}

const SPA_BRANCHES = [
  { id: 'BR-WL', name: 'Westlands Branch', active: true },
  { id: 'BR-KR', name: 'Karen Forest Branch', active: true },
  { id: 'BR-KL', name: 'Kilimani Branch', active: false },
]
const HOTEL_LOCATIONS = [
  { id: 'WL-LHP', name: 'Lakeside Hydro Pavilion', active: true },
  { id: 'WL-SYD', name: 'Sunset Yoga Deck', active: true },
  { id: 'WL-IRN', name: 'In-Room Wellness', active: true },
]

const PLANS = [
  { planId: 'professional_standard', name: 'Professional Standard', kind: 'base', marketCode: 'KE', currency: 'KES', price: 1999, billingCycle: 'monthly', providerCategories: ['individual'] },
  { planId: 'professional_plus', name: 'Professional Plus', kind: 'base', marketCode: 'KE', currency: 'KES', price: 2999, billingCycle: 'monthly', providerCategories: ['individual'] },
  { planId: 'professional_annual', name: 'Professional Standard (Annual)', kind: 'base', marketCode: 'KE', currency: 'KES', price: 19990, billingCycle: 'annual', providerCategories: ['individual'] },
  { planId: 'spa_business', name: 'Spa Business', kind: 'base', marketCode: 'KE', currency: 'KES', price: 7999, billingCycle: 'monthly', providerCategories: ['spa'] },
  { planId: 'spa_business_multi', name: 'Spa Business — Multi-Branch', kind: 'base', marketCode: 'KE', currency: 'KES', price: 12999, billingCycle: 'monthly', providerCategories: ['spa'] },
  { planId: 'hotel_wellness', name: 'Hotel Wellness', kind: 'base', marketCode: 'KE', currency: 'KES', price: 14999, billingCycle: 'monthly', providerCategories: ['hotel'] },
  { planId: 'premium_visibility', name: 'Premium Visibility', kind: 'visibility_addon', marketCode: 'KE', currency: 'KES', price: 2999, billingCycle: 'monthly', benefits: ['Higher Search Priority', 'Featured Placement', 'Premium Badge', 'Priority Discovery'] },
]

const DB = new Map()

function providerRecord(providerId) {
  const d = DIRECTORY_PROVIDERS.find((p) => p.id === providerId || p.dbId === providerId)
  const showcase = {
    'PR-82941': { name: 'Grace Njeri', providerType: 'individual', typeLabel: 'Massage Therapist', city: 'Nairobi', rating: 4.9, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80', joinedDate: '12 Jan 2026' },
    'SPA-28192': { name: 'Serenity Spa & Wellness Sanctuary', providerType: 'spa', typeLabel: 'Spa & Wellness Center', city: 'Nairobi', rating: 4.85, avatar: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=160&auto=format&fit=crop&q=80', joinedDate: '04 Nov 2024', branches: SPA_BRANCHES },
    'HWR-18291': { name: 'Savanna Luxury Safari Resort & Spa', providerType: 'hotel_resort', typeLabel: 'Hotel & Wellness Resort', city: 'Naivasha', rating: 4.95, avatar: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=160&auto=format&fit=crop&q=80', joinedDate: '18 Feb 2025', wellnessLocations: HOTEL_LOCATIONS },
  }[providerId]
  if (!showcase && !d) return null
  const base = showcase || {
    name: d.name,
    providerType: d.entityType === 'hotel' ? 'hotel_resort' : d.entityType,
    typeLabel: d.typeLabel,
    city: d.city,
    rating: d.rating,
    avatar: d.avatar,
    joinedDate: d.joinedDate,
    branches: d.entityType === 'spa' ? SPA_BRANCHES : undefined,
    wellnessLocations: d.entityType === 'hotel' || d.entityType === 'hotel_resort' ? HOTEL_LOCATIONS : undefined,
  }
  return {
    providerId,
    userId: `user-${providerId}`,
    marketCode: d?.marketCode || 'KE',
    verificationStatus: d ? d.verification : 'verified',
    accountStatus: d?.status === 'suspended' ? 'suspended' : 'active',
    lastActive: 'Today • 11:42 AM',
    verificationChecklist: { identity: 'Approved', credentials: 'Approved', profileInformation: 'Approved', profilePhoto: 'Approved' },
    ...base,
  }
}

// ---------------------------------------------------------------- seeding
function seed(providerId) {
  const raw = providerRecord(providerId)
  if (!raw) return null
  const r = rng(providerId)
  const category = normalizeProvider(providerId, raw).category
  const isGrace = providerId === 'PR-82941'
  const services = SERVICES[category]
  const units = category === 'spa' ? SPA_BRANCHES.filter((b) => b.active) : category === 'hotel' ? HOTEL_LOCATIONS : []
  const db = {
    provider: raw,
    bookings: [], reviews: [], reports: [], reviewEvents: [], notifications: [], audit: [],
    subscription: null, subscriptionHistory: [], visibility: {}, visibilityHistory: [], payments: [],
    cases: [], restrictions: [], actions: [], credentials: [], content: [], withdrawals: [], wallet: {}, assessments: [], notes: [],
  }

  // Bookings — completed history over 12 months + upcoming.
  const completedCount = isGrace ? 268 : category === 'individual' ? 120 : 300
  const pool = Math.round(completedCount * 1.1)
  const unitOf = () => (units.length ? pick(r, units).name : null)
  let n = 40000
  const addBooking = (b) => {
    const id = b.bookingId || `LI-${(n += 7 + Math.floor(r() * 30))}`
    db.bookings.push({ providerId, currency: 'KES', ...b, bookingId: id })
    return id
  }
  for (let i = 0; i < completedCount; i += 1) {
    const startAt = ANCHOR - (2 + Math.floor(r() * 358)) * DAY - Math.floor(r() * 10) * HOUR
    addBooking({
      clientId: `CL-${10000 + Math.floor(r() * pool)}`,
      serviceName: pick(r, services),
      status: 'completed',
      startAt,
      completedAt: startAt + 90 * 60000,
      amount: 3000 + Math.floor(r() * 30) * 100,
      paymentStatus: 'paid',
      escrowStatus: 'released',
      respondedOnTime: r() > 0.03,
      rescheduleCount: i < 8 ? 1 : 0,
      unassigned: category === 'spa' && r() < 0.02,
      resourceConflict: category === 'spa' && i < 1,
      ...(category === 'spa' ? { branchName: unitOf(), requiresStaff: true, staffId: 'ST-1' } : {}),
      ...(category === 'hotel' ? { locationName: unitOf(), experienceType: pick(r, ['in_room', 'concierge', 'package', 'location']) } : {}),
    })
  }
  const cancel = (by, late) => {
    const startAt = ANCHOR - (40 + Math.floor(r() * 200)) * DAY
    addBooking({ clientId: `CL-${10000 + Math.floor(r() * pool)}`, serviceName: pick(r, services), status: 'cancelled', cancelledBy: by, startAt, cancelledAt: late ? startAt - 6 * HOUR : startAt - 4 * DAY, amount: 4000, paymentStatus: 'refunded', escrowStatus: 'refunded', ...(category === 'hotel' ? { locationName: unitOf(), experienceType: 'in_room' } : {}) })
  }
  ;[['provider', true], ['provider', true], ['provider', false], ['provider', false], ['client', false], ['client', false]].forEach(([by, late]) => cancel(by, late))
  addBooking({ clientId: 'CL-19001', serviceName: services[0], status: 'no_show', noShowBy: 'provider', startAt: ANCHOR - 75 * DAY, amount: 4500, paymentStatus: 'refunded' })
  addBooking({ clientId: 'CL-19002', serviceName: services[1], status: 'completed', startAt: ANCHOR - 50 * DAY, completedAt: ANCHOR - 50 * DAY, amount: 6000, paymentStatus: 'paid', escrowStatus: 'disputed', isDisputed: true })
  // Upcoming: 3 today, 4 tomorrow, 5 later (escrow held, never touched by account actions).
  const startOfTomorrow = (() => { const d = new Date(ANCHOR + 3 * HOUR); d.setUTCHours(24, 0, 0, 0); return d.getTime() - 3 * HOUR })()
  const upcomingAt = [
    ...[1, 2, 3].map((k) => Math.min(ANCHOR + k * 40 * 60000, startOfTomorrow - (4 - k) * 5 * 60000)),
    ...[10, 12, 14, 16].map((h) => startOfTomorrow + h * HOUR),
    ...[3, 4, 6, 8, 11].map((dd) => ANCHOR + dd * DAY),
  ]
  upcomingAt.forEach((startAt, i) => addBooking({ clientId: `CL-${20000 + (i % 10)}`, serviceName: pick(r, services), status: 'confirmed', startAt, amount: 3800, paymentStatus: 'paid', escrowStatus: 'held', ...(category === 'spa' ? { branchName: unitOf() } : {}) }))
  addBooking({ clientId: 'CL-20999', serviceName: services[2], status: 'completed', startAt: ANCHOR - 9 * DAY, completedAt: ANCHOR - 9 * DAY, amount: 4500, paymentStatus: 'refund_pending', refundStatus: 'pending', escrowStatus: 'held' })

  // Reviews
  const completed = db.bookings.filter((b) => b.status === 'completed' && !b.isDisputed && b.completedAt < ANCHOR - 50 * DAY)
  const totalReviews = isGrace ? 111 : Math.min(180, Math.round((raw.rating >= 4.8 ? 0.45 : 0.4) * completed.length))
  const ratingFor = () => { const x = r(); return x < (isGrace ? 0.95 : 0.92) ? 5 : x < 0.99 ? 4 : 3 }
  const reviewOf = (b, extra = {}) => {
    const rating = extra.rating ?? ratingFor()
    const name = extra.clientName || `${pick(r, FIRST)} ${pick(r, LAST)}`
    const submittedAt = extra.submittedAt ?? (b ? b.completedAt + Math.floor(r() * 3) * DAY + 5 * HOUR : ANCHOR - 200 * DAY)
    const unit = b?.branchName || b?.locationName
    return {
      reviewId: extra.reviewId || `REV-${String(30000 + db.reviews.length * 241).padStart(5, '0')}`,
      providerId,
      clientId: b?.clientId || `CL-${30000 + db.reviews.length}`,
      clientName: name,
      bookingId: b?.bookingId || null,
      serviceName: b?.serviceName || pick(r, services),
      rating,
      text: extra.text || pick(r, TEXT[rating]),
      status: 'published',
      submittedAt,
      publishedAt: submittedAt + 17 * HOUR,
      providerResponse: r() < 0.85 ? { text: pick(r, RESPONSES), status: 'published', respondedAt: submittedAt + 26 * HOUR } : null,
      media: r() < 0.08 ? [{ id: 'm1', url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&auto=format&fit=crop&q=70', status: 'approved', public: true }] : [],
      context: category === 'spa' ? { branchName: unit, serviceName: b?.serviceName, specialistName: pick(r, ['Amina K.', 'Brian M.', 'Esther N.']) } : category === 'hotel' ? { locationName: unit, experienceType: b?.experienceType || 'location', serviceName: b?.serviceName } : null,
      marketCode: raw.marketCode,
      version: 0,
      ...extra,
    }
  }
  completed.slice(0, totalReviews).forEach((b) => db.reviews.push(reviewOf(b)))
  for (let i = 0; i < (isGrace ? 5 : 3); i += 1) db.reviews.push(reviewOf(null, { submittedAt: ANCHOR - (210 + i * 9) * DAY }))
  // One device/account pattern signal on a generated review pair.
  if (db.reviews.length > 4) { db.reviews[2].deviceHash = 'dvc-7f21'; db.reviews[4].deviceHash = 'dvc-7f21' }

  if (isGrace) seedGraceCanonical(db)
  else {
    // A reported and a hidden review for the business demos.
    const rep = db.reviews[1]
    rep.rating = 2
    rep.text = TEXT[2][0]
    db.reports.push({ reportId: `RPT-${providerId.slice(-4)}1`, reviewId: rep.reviewId, providerId, target: 'review', reportedByType: 'provider', reportedById: providerId, reasonLabel: 'False Information', status: 'under_review', createdAt: ANCHOR - 3 * DAY })
    db.reviews[3].status = 'hidden'
    db.reviews[3].moderation = { action: 'hide', reasonCode: 'personal_information', reasonLabel: 'Personal information', decidedByName: 'Moderation Team', decidedAt: ANCHOR - 20 * DAY }
  }
  for (const rv of db.reviews) {
    if (db.reviewEvents.some((e) => e.reviewId === rv.reviewId)) continue
    db.reviewEvents.push({ id: `${rv.reviewId}-e1`, reviewId: rv.reviewId, type: 'submitted', label: 'Review submitted by client', at: rv.submittedAt })
    if (rv.bookingId) db.reviewEvents.push({ id: `${rv.reviewId}-e2`, reviewId: rv.reviewId, type: 'verified', label: 'Booking verified', at: rv.submittedAt + 60000 })
    if (rv.publishedAt) db.reviewEvents.push({ id: `${rv.reviewId}-e3`, reviewId: rv.reviewId, type: 'published', label: 'Review published', at: rv.publishedAt })
    if (rv.status === 'hidden' && rv.moderation) db.reviewEvents.push({ id: `${rv.reviewId}-e4`, reviewId: rv.reviewId, type: 'hide', label: 'Review hidden', at: rv.moderation.decidedAt, actorName: rv.moderation.decidedByName, detail: rv.moderation.reasonLabel })
  }

  seedSubscription(db, providerId, category)
  seedTrust(db, providerId, category, isGrace)
  return db
}

function seedGraceCanonical(db) {
  const booking = (id, service, iso, extra = {}) => {
    const startAt = T(iso)
    db.bookings.push({ bookingId: id, providerId: 'PR-82941', clientId: extra.clientId, serviceName: service, status: 'completed', startAt, completedAt: startAt + 90 * 60000, amount: 4500, paymentStatus: 'paid', escrowStatus: 'released', locationName: 'Provider Location • Nairobi', ...extra })
    return db.bookings[db.bookings.length - 1]
  }
  const rows = [
    ['REV-92841', 'Sarah Achieng', 'CL-82941', 'LI-48291', 'Deep Tissue Massage', 5, '2026-09-12T16:20:00+03:00', 'Excellent experience. Grace was professional, punctual and very attentive. Highly recommend!'],
    ['REV-82174', 'Daniel Kimani', 'CL-71820', 'LI-47182', 'Swedish Massage', 3, '2026-09-08T11:05:00+03:00', 'The massage itself was fine but the session started 25 minutes late and felt rushed at the end.'],
    ['REV-77124', 'Lina Wanjiku', 'CL-60214', 'LI-46021', 'Sports Massage', 5, '2026-09-02T18:40:00+03:00', 'Amazing sports massage! Call me on 0722 *** *** if you want a referral.'],
    ['REV-69821', 'James Odero', 'CL-58109', 'LI-45891', 'Aromatherapy', 4, '2026-08-28T15:10:00+03:00', 'Very relaxing aromatherapy session, lovely oils.'],
    ['REV-66214', 'Faith Mwangi', 'CL-55021', 'LI-45231', 'Prenatal Massage', 4, '2026-08-20T10:30:00+03:00', 'Gentle and careful prenatal massage. Felt safe throughout.'],
    ['REV-64190', 'Kevin Otieno', 'CL-53390', 'LI-44821', 'Swedish Massage', 4, '2026-08-15T19:00:00+03:00', 'Good pressure and very professional.'],
    ['REV-60214', 'Grace Muthoni', 'CL-51022', 'LI-43021', 'Deep Tissue Massage', 5, '2026-08-10T13:15:00+03:00', 'Best deep tissue massage I have had.'],
    ['REV-58022', 'Marcus Lee', 'CL-49911', 'LI-42109', 'Sports Massage', 2, '2026-08-05T09:45:00+03:00', 'Not great — the session was cut short by 15 minutes and there was no explanation.'],
    ['REV-54110', 'Amina Hassan', 'CL-47002', 'LI-40218', 'Lymphatic Drainage', 5, '2026-07-30T16:00:00+03:00', 'Wonderful lymphatic drainage session, I could feel the difference immediately.'],
    ['REV-52001', 'George Ndirangu', 'CL-45120', 'LI-39821', 'Chair Massage', 4, '2026-07-25T12:20:00+03:00', 'Quick and effective chair massage at the office.'],
  ]
  for (const [reviewId, clientName, clientId, bookingId, service, rating, iso, text] of rows) {
    const b = booking(bookingId, service, new Date(Date.parse(iso) - 3 * HOUR).toISOString(), { clientId })
    if (bookingId === 'LI-48291') b.startAt = T('2026-09-12T14:00:00+03:00')
    const submittedAt = T(iso)
    db.reviews.push({
      reviewId, providerId: 'PR-82941', clientId, clientName, bookingId, serviceName: service, rating, text,
      status: 'published', submittedAt, publishedAt: submittedAt + 17 * HOUR - 10 * 60000, marketCode: 'KE', version: 0,
      providerResponse: reviewId === 'REV-58022' ? null : { text: reviewId === 'REV-82174' ? 'Thank you for the feedback. My previous client overran — I am sorry and have adjusted my schedule buffers.' : RESPONSES[0], status: 'published', respondedAt: submittedAt + 110 * 60000 },
      media: reviewId === 'REV-92841'
        ? [
            { id: 'p1', url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&auto=format&fit=crop&q=70', status: 'approved', public: true },
            { id: 'p2', url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=300&auto=format&fit=crop&q=70', status: 'approved', public: true },
          ]
        : reviewId === 'REV-69821' ? [{ id: 'p3', url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=300&auto=format&fit=crop&q=70', status: 'pending', public: false }] : [],
    })
  }
  const rev = (id) => db.reviews.find((x) => x.reviewId === id)
  // REV-77124 hidden for personal information (moderation), original preserved.
  Object.assign(rev('REV-77124'), { status: 'hidden', moderation: { action: 'hide', target: 'review', reasonCode: 'personal_information', reasonLabel: 'Personal information', clientExplanation: 'Your review included a phone number, which our guidelines do not allow publicly.', decidedByName: 'Moderation Team', decidedAt: T('2026-09-03T09:00:00+03:00'), previousStatus: 'published' } })
  db.reviewEvents.push({ id: 'REV-77124-h', reviewId: 'REV-77124', type: 'hide', label: 'Review hidden', at: T('2026-09-03T09:00:00+03:00'), actorName: 'Moderation Team', detail: 'Personal information' })
  // A removed spam review.
  const spam = db.reviews[db.reviews.length - 11]
  Object.assign(spam, { status: 'removed', rating: 1, text: 'Visit www.cheap-massage-deals.example for 50% off!!!', moderation: { action: 'remove', target: 'review', reasonCode: 'spam', reasonLabel: 'Spam', decidedByName: 'Moderation Team', decidedAt: spam.submittedAt + DAY, previousStatus: 'published' } })
  db.reviewEvents.push({ id: `${spam.reviewId}-rm`, reviewId: spam.reviewId, type: 'remove', label: 'Review removed', at: spam.submittedAt + DAY, actorName: 'Moderation Team', detail: 'Spam' })
  // Reports: provider report on a 3★ review, provider report on a 2★ review, system flag.
  db.reports.push(
    { reportId: 'RPT-28192', reviewId: 'REV-82174', providerId: 'PR-82941', target: 'review', reportedByType: 'provider', reportedById: 'PR-82941', reasonLabel: 'False Information', status: 'under_review', createdAt: T('2026-09-09T11:32:00+03:00'), assignedTo: 'Moderation Team' },
    { reportId: 'RPT-27710', reviewId: 'REV-58022', providerId: 'PR-82941', target: 'review', reportedByType: 'provider', reportedById: 'PR-82941', reasonLabel: 'Unfair review', status: 'open', createdAt: T('2026-08-06T08:10:00+03:00') },
    { reportId: 'RPT-26003', reviewId: db.reviews[2].reviewId, providerId: 'PR-82941', target: 'review', reportedByType: 'system', reasonLabel: 'Device pattern match', status: 'open', createdAt: ANCHOR - 30 * DAY },
  )
  db.reviewEvents.push(
    { id: 'REV-82174-r1', reviewId: 'REV-82174', type: 'reported', label: 'Provider reported review', at: T('2026-09-09T11:32:00+03:00'), actorName: 'Grace Njeri' },
    { id: 'REV-82174-r2', reviewId: 'REV-82174', type: 'assigned', label: 'Assigned to Moderation Team', at: T('2026-09-09T12:05:00+03:00'), actorName: 'System' },
    { id: 'REV-58022-r1', reviewId: 'REV-58022', type: 'reported', label: 'Provider reported review', at: T('2026-08-06T08:10:00+03:00'), actorName: 'Grace Njeri' },
  )
}

function seedSubscription(db, providerId, category) {
  const planId = category === 'spa' ? 'spa_business' : category === 'hotel' ? 'hotel_wellness' : 'professional_standard'
  const plan = PLANS.find((p) => p.planId === planId)
  const premium = PLANS.find((p) => p.planId === 'premium_visibility')
  const hotelPending = category === 'hotel'
  db.subscription = {
    subscriptionId: `SUB-${providerId.replace(/\D/g, '')}`,
    providerId,
    planId,
    planName: plan.name,
    status: 'active',
    billingCycle: 'monthly',
    currentPeriodStart: hotelPending ? T('2026-08-10T00:00:00+03:00') : T('2026-09-12T00:00:00+03:00'),
    currentPeriodEnd: hotelPending ? T('2026-09-10T00:00:00+03:00') : T('2026-10-12T00:00:00+03:00'),
    autoRenew: true,
    priceCharged: { amount: plan.price, currency: plan.currency },
    paymentStatus: hotelPending ? 'failed' : 'paid',
    latestPaymentId: 'PAY-SUB-1',
    marketCode: 'KE',
    startedAt: T('2026-01-12T00:00:00+03:00'),
    version: 0,
  }
  const months = ['2026-09-12', '2026-08-12', '2026-07-12', '2026-06-12']
  months.forEach((m, i) => {
    const start = T(`${m}T00:00:00+03:00`)
    db.subscriptionHistory.push({ id: `SH-${i}`, providerId, planId, planName: plan.name, kind: 'base', periodStart: start, periodEnd: start + 30 * DAY, amount: plan.price, currency: 'KES', status: i === 0 && !hotelPending ? 'active' : 'completed', paymentStatus: i === 0 && hotelPending ? 'failed' : 'paid', paymentId: `PAY-${providerId.slice(-3)}-${i}`, source: i === 3 ? 'provider_purchase' : 'renewal' })
    if (!(i === 0 && hotelPending)) db.payments.push({ paymentId: `PAY-${providerId.slice(-3)}-${i}`, providerId, purpose: 'subscription', planKind: 'base', planName: plan.name, amount: plan.price, currency: 'KES', method: ['M-PESA', 'Visa', 'Mastercard', 'M-PESA'][i], status: 'successful', createdAt: start })
  })
  if (hotelPending) db.payments.push({ paymentId: `PAY-${providerId.slice(-3)}-F`, providerId, purpose: 'subscription', planKind: 'base', planName: plan.name, amount: plan.price, currency: 'KES', method: 'M-PESA', status: 'failed', failureReason: 'Insufficient funds', createdAt: T('2026-09-10T08:00:00+03:00') })

  // Premium Visibility add-on
  const premStart = T('2026-08-01T00:00:00+03:00')
  db.subscriptionHistory.push({ id: 'SH-P1', providerId, planId: 'premium_visibility', planName: 'Premium Visibility', kind: 'visibility_addon', periodStart: premStart, periodEnd: T('2026-08-31T23:59:00+03:00'), amount: premium.price, currency: 'KES', status: 'completed', paymentStatus: 'paid', paymentId: 'PAY-PREM-1', source: 'provider_purchase' })
  db.payments.push({ paymentId: 'PAY-PREM-1', providerId, purpose: 'subscription', planKind: 'visibility_addon', planName: 'Premium Visibility', amount: premium.price, currency: 'KES', method: 'M-PESA', status: 'successful', createdAt: premStart })
  if (category === 'spa') {
    // Spa renewed Premium and is featured.
    db.visibility = { level: 'premium', premiumStartsAt: T('2026-09-01T00:00:00+03:00'), premiumEndsAt: T('2026-09-30T23:59:00+03:00'), featured: true, paused: false, version: 0 }
    db.subscriptionHistory.push({ id: 'SH-P2', providerId, planId: 'premium_visibility', planName: 'Premium Visibility', kind: 'visibility_addon', periodStart: T('2026-09-01T00:00:00+03:00'), periodEnd: T('2026-09-30T23:59:00+03:00'), amount: premium.price, currency: 'KES', status: 'active', paymentStatus: 'paid', source: 'renewal' })
    db.payments.push({ paymentId: 'PAY-PREM-2', providerId, purpose: 'subscription', planKind: 'visibility_addon', planName: 'Premium Visibility', amount: premium.price, currency: 'KES', method: 'Visa', status: 'successful', createdAt: T('2026-09-01T00:00:00+03:00') })
    db.visibilityHistory.push({ id: 'VH-3', providerId, label: 'Featured placement enabled', reason: 'Premium Visibility active', source: 'Provider purchase', at: T('2026-09-01T00:00:00+03:00') })
  } else {
    db.visibility = { level: 'premium', premiumStartsAt: premStart, premiumEndsAt: T('2026-08-31T23:59:00+03:00'), featured: false, paused: false, version: 0 }
    db.payments.push({ paymentId: 'PAY-PREM-F', providerId, purpose: 'subscription', planKind: 'visibility_addon', planName: 'Premium Visibility', amount: premium.price, currency: 'KES', method: 'M-PESA', status: 'failed', failureReason: 'M-PESA request timed out', createdAt: T('2026-09-01T07:30:00+03:00') })
    db.visibilityHistory.push({ id: 'VH-3', providerId, label: 'Premium Visibility ended', reason: 'Subscription period ended', source: 'System', at: T('2026-09-01T00:00:00+03:00') })
  }
  db.visibilityHistory.push(
    { id: 'VH-2', providerId, label: 'Premium Visibility activated', reason: null, source: 'Provider purchase', at: premStart },
    { id: 'VH-1', providerId, label: 'Standard visibility activated', reason: null, source: 'Provider subscription', at: T('2026-01-12T00:00:00+03:00') },
  )
}

function seedTrust(db, providerId, category, isGrace) {
  const caseCategory = category === 'individual' ? 'Professional Conduct' : category === 'spa' ? 'Staff Conduct' : 'In-Room Service Issue'
  db.cases.push(
    { kind: 'safety', caseId: 'SAF-2811', providerId, category: caseCategory, severity: 'standard', status: 'under_review', statusLabel: 'Under Review', bookingId: isGrace ? 'LI-48291' : db.bookings[5].bookingId, createdAt: T('2026-09-08T10:00:00+03:00') },
    { kind: 'safety', caseId: 'SAF-2140', providerId, category: 'Client Complaint', severity: 'standard', status: 'closed', outcome: 'no_action', createdAt: T('2026-05-14T10:00:00+03:00'), resolvedAt: T('2026-05-20T10:00:00+03:00') },
    { kind: 'safety', caseId: 'SAF-1877', providerId, category: 'Late Arrival', severity: 'standard', status: 'resolved', outcome: 'unsubstantiated', createdAt: T('2026-02-02T10:00:00+03:00'), resolvedAt: T('2026-02-06T10:00:00+03:00') },
    { kind: 'dispute', disputeId: 'DSP-4410', providerId, category: 'Booking Dispute', type: 'service', status: 'resolved', bookingId: db.bookings.find((b) => b.isDisputed)?.bookingId, createdAt: ANCHOR - 50 * DAY, resolvedAt: ANCHOR - 44 * DAY },
  )
  db.credentials.push({ credentialId: 'CRED-1', providerId, name: category === 'individual' ? 'Professional Certificate' : category === 'spa' ? 'County Health Permit' : 'Spa Operating Licence', status: 'approved', expiresAt: T('2026-09-28T00:00:00+03:00'), renewedAt: T('2025-09-28T00:00:00+03:00') })
  db.credentials.push({ credentialId: 'CRED-2', providerId, name: 'First Aid Certificate', status: 'approved', expiresAt: T('2027-08-12T00:00:00+03:00'), renewedAt: T('2026-08-12T00:00:00+03:00') })
  db.wallet = { pendingEscrow: isGrace ? 45800 : 184000, availableBalance: isGrace ? 342800 : 1650000 }
  db.withdrawals.push(
    { withdrawalId: 'WD-82914', providerId, amount: isGrace ? 12300 : 350000, status: 'pending_approval', createdAt: ANCHOR - 2 * DAY },
    { withdrawalId: 'WD-80112', providerId, amount: isGrace ? 25000 : 300000, status: 'completed', createdAt: ANCHOR - 32 * DAY },
    { withdrawalId: 'WD-78210', providerId, amount: isGrace ? 30000 : 280000, status: 'completed', createdAt: ANCHOR - 62 * DAY },
  )
  db.assessments.push({ id: 'RA-1', type: 'admin_assessment', providerId, level: 'low', reason: 'Routine quality review — no action required', note: 'Provider performance remains strong. One client complaint is currently under review. No account restriction recommended at this stage.', reviewedByName: 'Wallen Nyaberi', reviewedByRole: 'Trust & Safety Admin', reviewedAt: T('2026-09-10T15:00:00+03:00'), nextReviewAt: T('2026-10-10T00:00:00+03:00'), relatedCases: ['SAF-2811'] })
  db.assessments.push({ id: 'RA-0', type: 'admin_assessment', providerId, level: 'low', reason: 'Quality review completed — no action required', reviewedByName: 'Peter Mwangi', reviewedByRole: 'Trust & Safety Admin', reviewedAt: T('2026-06-03T10:00:00+03:00') })

  const act = (id, action, label, scope, reasonLabel, adminName, iso, extra = {}) =>
    db.actions.push({ actionId: id, providerId, action, label, scope, scopeLabel: extra.scopeLabel, reasonLabel, adminName, createdAt: T(iso), status: 'completed', ...extra })
  act('AA-4', 'warn', 'Warning Issued', [], 'Late Cancellation Pattern', 'Peter Mwangi', '2026-08-04T10:00:00+03:00', { scopeLabel: 'Account' })
  act('AA-3b', 'lift_restriction', 'Restriction Removed', ['new_bookings'], 'Review Completed', 'Jane Ochieng', '2026-03-15T10:00:00+03:00', { scopeLabel: 'New Bookings' })
  act('AA-3', 'restrict', 'Booking Restriction', ['new_bookings'], 'Late Cancellation Pattern', 'Jane Ochieng', '2026-03-01T10:00:00+03:00', { scopeLabel: 'New Bookings' })
  act('AA-2', 'request_info', 'Information Requested', [], 'Credential Renewal', 'Brian Otieno', '2026-02-10T10:00:00+03:00', { scopeLabel: 'Documents' })
  act('AA-1', 'place_review', 'Under Review', [], 'Routine Quality Check', 'Wallen Nyaberi', '2026-01-05T10:00:00+03:00', { scopeLabel: 'Account' })
  db.restrictions.push({ restrictionId: 'RS-1', providerId, kind: 'new_bookings', status: 'lifted', reasonCode: 'late_cancellation_pattern', reasonLabel: 'Late Cancellation Pattern', startedAt: T('2026-03-01T10:00:00+03:00'), liftedAt: T('2026-03-15T10:00:00+03:00'), appliedByName: 'Jane Ochieng', liftedByName: 'Jane Ochieng', actionId: 'AA-3' })
  const note = (id, title, iso, channels = ['email', 'in_app']) => db.notifications.push({ id, recipientId: `user-${providerId}`, category: 'account', title, channels, status: 'delivered', createdAt: T(iso) })
  note('N-4', 'Warning Notice', '2026-08-04T10:01:00+03:00')
  note('N-3', 'Document Request', '2026-02-10T10:01:00+03:00')
  note('N-2', 'Account Under Review', '2026-01-05T10:01:00+03:00', ['email'])
  note('N-1', 'Welcome to Lé Inspa', '2026-01-12T09:00:00+03:00', ['email'])
  db.notes.push(
    { id: 'NT-2', note: 'Provider performance remains strong. One client complaint is currently under review. No account restriction recommended at this stage.', authorName: 'Wallen Nyaberi', createdAt: T('2026-09-10T16:20:00+03:00') },
    { id: 'NT-1', note: 'Initial review of complaint SAF-2811. Gathering additional information from client.', authorName: 'Jane Ochieng', createdAt: T('2026-09-08T14:15:00+03:00') },
  )
}

function dbFor(providerId) {
  if (!DB.has(providerId)) {
    const db = seed(providerId)
    if (!db) throw new Error('Provider not found or outside your authorised markets.')
    DB.set(providerId, db)
  }
  return DB.get(providerId)
}

// ---------------------------------------------------------------- access
const denied = (msg = 'Your admin role does not allow this action.') => Object.assign(new Error(msg), { code: 'functions/permission-denied' })
function scope(providerId, ctx) {
  const db = dbFor(providerId)
  const provider = normalizeProvider(providerId, db.provider)
  const markets = ctx.markets || ['ALL']
  if (!markets.includes('ALL') && !markets.includes(provider.marketCode)) throw denied('You do not have access to providers in this market.')
  return { db, provider, perms: trustPermissions({ permissions: ctx.permissions || [] }), actor: ctx.actor || { id: 'demo-admin', name: 'You' } }
}
const fail = (plan) => Object.assign(new Error(plan.error), { code: `functions/${plan.code || 'invalid-argument'}` })
const reviews = (db) => db.reviews.map((x) => normalizeReview(x.reviewId, x))
const bookings = (db) => db.bookings.map((x) => normalizeBooking(x.bookingId, x))
const reports = (db) => db.reports.map((x) => normalizeReport(x.reportId, x))
const cases = (db) => db.cases.map((c) => normalizeCase(c.caseId || c.disputeId, c, c.kind))
const restrictions = (db) => db.restrictions.map((x) => normalizeRestriction(x.restrictionId, x)).filter(Boolean)
const notify = (db, n) => db.notifications.push({ id: `N-${Date.now()}-${db.notifications.length}`, status: 'queued', channels: ['in_app', 'email'], createdAt: Date.now(), ...n })

// ---------------------------------------------------------------- ADM-025
export const trustMock = {
  async getReviews(providerId, filters, ctx) {
    await delay()
    const { db, provider, perms } = scope(providerId, ctx)
    return clone({ provider: { ...provider, joinedDate: db.provider.joinedDate, lastActive: db.provider.lastActive }, ...buildReviewsView({ reviews: reviews(db), reports: reports(db), bookings: bookings(db), filters, now: Date.now() }), permissions: perms })
  },

  async getReviewDetail(providerId, reviewId, ctx) {
    await delay(160)
    const { db, provider, perms } = scope(providerId, ctx)
    const all = reviews(db)
    const review = all.find((x) => x.id === reviewId)
    if (!review) throw new Error('Review not found.')
    const booking = bookings(db).find((b) => b.id === review.bookingId) || null
    return clone(buildReviewDetail({
      review,
      booking,
      reports: reports(db).filter((x) => x.reviewId === reviewId),
      events: db.reviewEvents.filter((e) => e.reviewId === reviewId),
      siblings: all,
      provider,
      canModerate: perms.moderateReviews,
    }))
  },

  async moderateReview(providerId, input, ctx) {
    await delay(420)
    const { db, perms, actor } = scope(providerId, ctx)
    if (!perms.moderateReviews) throw denied()
    const raw = db.reviews.find((x) => x.reviewId === input.reviewId)
    if (!raw) throw new Error('Review not found.')
    const review = normalizeReview(raw.reviewId, raw)
    const plan = planReviewModeration({ review, reports: reports(db).filter((x) => x.reviewId === review.id), input, actor, now: Date.now() })
    if (plan.error) throw fail(plan)
    Object.assign(raw, plan.reviewPatch)
    for (const u of plan.reportUpdates) Object.assign(db.reports.find((x) => x.reportId === u.id), u.patch)
    plan.events.forEach((e, i) => db.reviewEvents.push({ id: `${review.id}-${Date.now()}-${i}`, reviewId: review.id, ...e }))
    plan.notifications.forEach((n) => notify(db, { ...n, category: 'reviews' }))
    db.audit.push({ ...plan.audit, at: Date.now() })
    return { ok: true, status: plan.newStatus, message: plan.message }
  },

  // ---------------------------------------------------------------- ADM-026
  async getSubscription(providerId, ctx) {
    await delay()
    const { db, provider, perms } = scope(providerId, ctx)
    return clone({
      ...buildSubscriptionView({
        provider,
        subscription: normalizeSubscription(db.subscription.subscriptionId, db.subscription),
        plans: PLANS.map((p) => normalizePlan(p.planId, p)),
        history: db.subscriptionHistory,
        visibility: db.visibility,
        visibilityHistory: db.visibilityHistory,
        payments: db.payments.map((p) => normalizePayment(p.paymentId, p)),
        restrictions: restrictions(db),
        permissions: perms,
        now: Date.now(),
      }),
      provider: { ...provider, joinedDate: db.provider.joinedDate, lastActive: db.provider.lastActive },
    })
  },

  async manageSubscription(providerId, input, ctx) {
    await delay(480)
    const { db, provider, perms, actor } = scope(providerId, ctx)
    if (!perms.manageSubscriptions) throw denied()
    const plan = planSubscriptionChange({ provider, subscription: normalizeSubscription(db.subscription.subscriptionId, db.subscription), plans: PLANS.map((p) => normalizePlan(p.planId, p)), input, actor, now: Date.now() })
    if (plan.error) throw fail(plan)
    Object.assign(db.subscription, plan.patch)
    plan.historyAppend.forEach((h, i) => db.subscriptionHistory.push({ id: `SH-${Date.now()}-${i}`, providerId, ...h }))
    if (plan.notification) notify(db, { ...plan.notification, category: 'subscription' })
    db.audit.push({ ...plan.audit, at: Date.now() })
    return { ok: true, message: plan.message }
  },

  async manageVisibility(providerId, input, ctx) {
    await delay(420)
    const { db, provider, perms, actor } = scope(providerId, ctx)
    if (!perms.manageVisibility) throw denied()
    const plan = planVisibilityChange({ provider, subscription: normalizeSubscription(db.subscription.subscriptionId, db.subscription), visibility: db.visibility, restrictions: restrictions(db), input, actor, now: Date.now() })
    if (plan.error) throw fail(plan)
    Object.assign(db.visibility, plan.patch)
    db.visibilityHistory.push({ id: `VH-${Date.now()}`, providerId, ...plan.historyEntry })
    if (plan.notification) notify(db, { ...plan.notification, category: 'visibility' })
    return { ok: true, message: plan.message }
  },

  // ---------------------------------------------------------------- ADM-027
  async getQualityRisk(providerId, period, ctx) {
    await delay()
    const { db, provider, perms } = scope(providerId, ctx)
    return clone({
      ...buildRiskView({
        provider,
        bookings: bookings(db),
        reviews: reviews(db),
        reports: reports(db),
        cases: cases(db),
        restrictions: restrictions(db),
        credentials: db.credentials.map((c) => normalizeCredential(c.credentialId, c)),
        contentItems: db.content,
        withdrawals: perms.viewFinance ? db.withdrawals : [],
        actions: db.actions.map((a) => normalizeAction(a.actionId, a)),
        assessments: db.assessments.map((a) => normalizeAssessment(a.id, a)),
        permissions: perms,
        period,
        now: Date.now(),
      }),
      provider: { ...provider, joinedDate: db.provider.joinedDate, lastActive: db.provider.lastActive },
    })
  },

  async updateAssessment(providerId, input, ctx) {
    await delay(400)
    const { db, perms, actor } = scope(providerId, ctx)
    if (!perms.assessRisk) throw denied()
    const view = await trustMock.getQualityRisk(providerId, '30d', ctx)
    const plan = planRiskAssessment({ input, previous: view.assessment, cases: cases(db), snapshot: { computedLevel: view.kpis.risk.level }, actor, now: Date.now() })
    if (plan.error) throw fail(plan)
    db.assessments.push({ id: `RA-${Date.now()}`, providerId, ...plan.record })
    return { ok: true, message: plan.message }
  },

  // ---------------------------------------------------------------- ADM-028
  async getAccount(providerId, ctx) {
    await delay()
    const { db, provider, perms } = scope(providerId, ctx)
    const latest = db.assessments.map((a) => normalizeAssessment(a.id, a)).sort((a, b) => b.reviewedAt - a.reviewedAt)[0] || null
    return clone({
      ...buildAccountView({
        provider,
        restrictions: restrictions(db),
        actions: db.actions.map((a) => ({ id: a.actionId, ...a })),
        notifications: db.notifications.filter((n) => n.category === 'account'),
        bookings: bookings(db),
        cases: cases(db),
        wallet: perms.viewFinance ? db.wallet : null,
        withdrawals: perms.viewFinance ? db.withdrawals : [],
        subscriptionStatus: resolveSubscriptionStatus(normalizeSubscription(db.subscription.subscriptionId, db.subscription), Date.now()).label,
        assessment: latest,
        notes: db.notes,
        permissions: perms,
        now: Date.now(),
      }),
      provider: { ...provider, joinedDate: db.provider.joinedDate, lastActive: db.provider.lastActive },
    })
  },

  async applyAccountAction(providerId, input, ctx) {
    await delay(560)
    const { db, provider, perms, actor } = scope(providerId, ctx)
    if (!perms.accountActions) throw denied()
    const plan = planAccountAction({ provider, restrictions: restrictions(db), cases: cases(db), input, actor, permissions: perms, now: Date.now() })
    if (plan.error) throw fail(plan)
    const actionId = `AA-${Date.now()}`
    db.actions.push({ actionId, providerId, ...plan.actionRecord })
    plan.restrictionsCreate.forEach((x, i) => db.restrictions.push({ restrictionId: `RS-${Date.now()}-${i}`, providerId, actionId, ...x }))
    for (const u of plan.restrictionUpdates) Object.assign(db.restrictions.find((x) => x.restrictionId === u.id), u.patch)
    if (plan.providerPatch) Object.assign(db.provider, plan.providerPatch)
    if (plan.notification) notify(db, { ...plan.notification, category: 'account', recipientId: `user-${providerId}` })
    db.audit.push({ ...plan.audit, at: Date.now() })
    return { ok: true, message: plan.message, newStatus: plan.actionRecord.newStatus }
  },

  async addAccountNote(providerId, text, ctx) {
    await delay(260)
    const { db, actor } = scope(providerId, ctx)
    const clean = String(text || '').trim()
    if (clean.length < 3) throw new Error('The note is empty.')
    const note = { id: `NT-${Date.now()}`, note: clean, authorName: actor.name, createdAt: Date.now() }
    db.notes.push(note)
    return { ok: true, note: { id: note.id, text: clean, author: actor.name, at: note.createdAt } }
  },
}
