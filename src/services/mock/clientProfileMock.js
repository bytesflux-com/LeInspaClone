// Demo data for ADM-012 (Client Profile). Used only while the
// `adminGetClientProfile` Cloud Function is not deployed.
//
// Everything is derived from the existing ADM-011 client rows — there is no
// separate "admin client profile" record. CL-78421 mirrors the ADM-012 mockup.
import { MOCK_CLIENTS, MOCK_CURRENCY, DAY_MS, maskEmail, maskPhone } from './clientDirectoryMock'
import { MARKETS } from '../../constants/markets'
import { timeZoneFor } from '../../lib/profileFormat'

// The "server clock" for demo data (22 Sep 2026, 12:30 Nairobi).
export const PROFILE_AS_OF = Date.UTC(2026, 8, 22, 9, 30)
const FX = { KE: 1, UG: 28, TZ: 19, RW: 10, ZA: 0.14 }
const MEMBERSHIP_FEE = { premium: 3000, executive: 7500 }
const SERVICES = [
  ['Deep Tissue Massage', 'Serenity Wellness Spa', 4500],
  ['Swedish Massage', 'Lé Inspa Wellness Center', 3500],
  ['Hot Stone Massage', 'Tranquil Escapes Resort', 6000],
  ['Aromatherapy Facial', 'Azure Day Spa', 5200],
  ['Body Scrub & Wrap', 'Palm Court Retreat', 4800],
]
const IMAGES = ['/demo/booking-1.jpg', '/demo/booking-2.jpg', '/demo/booking-3.jpg']

const countryName = (code) => MARKETS.find((m) => m.id === code)?.name || code
const hashOf = (text) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
const at = (y, m, d, hh, mm, tz = 3) => new Date(Date.UTC(y, m - 1, d, hh - tz, mm)).toISOString()
const iso = (ms) => new Date(ms).toISOString()

const CONTACT_VERIFIED = (status) => status !== 'unverified' && status !== 'pending'

function accountBlock(r) {
  const alerts = []
  if (r.status === 'suspended') alerts.push({ id: 'suspended', level: 'danger', title: 'Account Suspended', text: 'Sign-in and new bookings are blocked. History is retained.' })
  if (r.safetyCase) alerts.push({ id: 'safety', level: 'danger', title: 'Open Safety Review', text: 'A safety report is awaiting review.', restricted: 'safety' })
  if (r.paymentIssue) alerts.push({ id: 'payment', level: 'warning', title: 'Open Payment Issue', text: 'A payment on this account needs attention.', restricted: 'finance' })
  if (r.openDisputes) alerts.push({ id: 'dispute', level: 'warning', title: 'Open Dispute', text: 'A booking dispute is awaiting resolution.' })
  const risk = r.status === 'suspended' || r.safetyCase ? 'High' : r.paymentIssue || r.openDisputes ? 'Medium' : 'Low'
  return {
    type: 'Client (Customer)',
    riskLevel: risk,
    restrictions: r.status === 'suspended' ? 'Suspended' : 'None',
    alerts,
  }
}

function buildBookings(r, fx) {
  if (!r.bookings) return []
  const seed = hashOf(r.id)
  const count = Math.min(3, r.bookings)
  return Array.from({ length: count }, (_, i) => {
    const [service, venue, price] = SERVICES[(seed + i) % SERVICES.length]
    const at0 = PROFILE_AS_OF - ((r.lastBookingDaysAgo ?? 3) + i * 4) * DAY_MS - 3 * 3_600_000
    return {
      id: `BK-${String(seed % 90000 + 10000 + i)}`,
      service,
      venue,
      scheduledAt: iso(at0),
      status: i === 0 && r.hasUpcoming ? 'confirmed' : 'completed',
      amount: Math.round(price * fx),
      image: IMAGES[i % IMAGES.length],
    }
  })
}

function buildPayments(r, bookings, fx) {
  const seed = hashOf(r.id)
  return bookings.map((b, i) => ({
    id: `PAY-${String(seed % 80000 + 10000 + i * 137)}`,
    createdAt: iso(new Date(b.scheduledAt).getTime() - 3_600_000),
    amount: b.amount,
    status: 'successful',
    kind: i % 2 ? 'Card' : 'M-PESA',
    category: 'booking',
  })).concat(
    r.paymentIssue
      ? [{ id: `PAY-${String(seed % 70000 + 20000)}`, createdAt: iso(PROFILE_AS_OF - 2 * DAY_MS), amount: Math.round(2500 * fx), status: 'failed', kind: 'Card', category: 'booking' }]
      : [],
  )
}

function seededProfile(r) {
  return {
    registrationLabel: 'Mobile App',
    lastActiveAt: at(2026, 9, 22, 10, 30),
    vip: true,
    stats: { totalBookings: 18, completed: 15, cancelled: 2, openIssues: 1, issuesLabel: '1 support ticket', bookingsDelta: 28, lifetimeValue: 128450, lifetimeDelta: 36 },
    membership: {
      tier: 'premium', name: 'Premium Wellness Access', description: 'Access to all wellness services', status: 'active',
      since: at(2026, 1, 12, 10, 0), nextRenewal: at(2026, 10, 12, 10, 0), monthlyFee: 3000, autoRenew: true,
    },
    bookings: [
      { id: 'BK-48211', service: 'Deep Tissue Massage', venue: 'Serenity Wellness Spa', scheduledAt: at(2026, 9, 12, 14, 0), status: 'confirmed', amount: 4500, image: IMAGES[0] },
      { id: 'BK-48102', service: 'Swedish Massage', venue: 'Lé Inspa Wellness Center', scheduledAt: at(2026, 9, 8, 10, 0), status: 'completed', amount: 3500, image: IMAGES[1] },
      { id: 'BK-47930', service: 'Hot Stone Massage', venue: 'Tranquil Escapes Resort', scheduledAt: at(2026, 9, 2, 16, 30), status: 'completed', amount: 6000, image: IMAGES[2] },
    ],
    payments: [
      { id: 'PAY-92841', createdAt: at(2026, 9, 12, 13, 58), amount: 4500, status: 'successful', kind: 'M-PESA', category: 'booking' },
      { id: 'PAY-77123', createdAt: at(2026, 9, 8, 9, 45), amount: 3500, status: 'successful', kind: 'Wallet top-up', category: 'booking' },
      { id: 'SUB-66211', createdAt: at(2026, 8, 12, 10, 0), amount: 3000, status: 'successful', kind: 'Membership', category: 'subscription' },
      { id: 'PAY-55612', createdAt: at(2026, 8, 2, 15, 20), amount: 2000, status: 'refunded', kind: 'Booking refund', category: 'refund' },
    ],
    wallet: { balance: 12450, credits: 28500, debits: 16050, pendingRefund: 2000 },
    referrals: { code: 'WALLEN24', referredBy: null, successful: 8, loyaltyStatus: 'active', totalSavings: 3200 },
    support: { openTickets: 1, openDisputes: 0, safetyReports: 0, latest: { id: 'SUP-4812', subject: 'Payment not reflected in wallet', createdAt: at(2026, 9, 8, 15, 0), status: 'in_review' } },
    activity: [
      { id: 'e1', type: 'booking', at: at(2026, 9, 22, 10, 42), text: 'Booking created – Deep Tissue Massage' },
      { id: 'e2', type: 'payment', at: at(2026, 9, 21, 16, 18), text: 'Payment completed – KES 4,500' },
      { id: 'e3', type: 'profile', at: at(2026, 9, 7, 14, 30), text: 'Profile updated' },
      { id: 'e4', type: 'membership', at: at(2026, 9, 5, 11, 10), text: 'Membership renewed – Premium' },
      { id: 'e5', type: 'support', at: at(2026, 9, 2, 9, 21), text: 'Support ticket created – SUP-4812' },
    ],
  }
}

export function buildClientProfile(r) {
  const fx = FX[r.country] || 1
  const currency = MOCK_CURRENCY[r.country] || 'USD'
  const seeded = r.id === 'CL-78421' ? seededProfile(r) : null
  const money = (n) => Math.round(n * fx)

  let bookings, payments, wallet, membership, stats, support, referrals, activity
  if (seeded) {
    // Seeded amounts are already KES; scale only for non-KE markets.
    const scale = (list, keys) => list.map((x) => keys.reduce((o, k) => ({ ...o, [k]: money(x[k]) }), x))
    bookings = scale(seeded.bookings, ['amount'])
    payments = scale(seeded.payments, ['amount'])
    wallet = Object.fromEntries(Object.entries(seeded.wallet).map(([k, v]) => [k, money(v)]))
    membership = { ...seeded.membership, monthlyFee: money(seeded.membership.monthlyFee) }
    stats = { ...seeded.stats, lifetimeValue: money(seeded.stats.lifetimeValue) }
    support = seeded.support
    referrals = { ...seeded.referrals, totalSavings: money(seeded.referrals.totalSavings) }
    activity = seeded.activity
  } else {
    bookings = buildBookings(r, fx)
    payments = buildPayments(r, bookings, fx)
    const seed = hashOf(r.id)
    const debits = money(r.bookings * 650)
    wallet = { balance: money(r.walletBalance), credits: money(r.walletBalance) + debits, debits, pendingRefund: r.paymentIssue ? money(2000) : 0 }
    const tier = r.membership
    const fee = MEMBERSHIP_FEE[tier]
    membership = fee
      ? {
          tier, name: `${tier === 'executive' ? 'Executive' : 'Premium'} Wellness Access`, description: 'Access to all wellness services',
          status: r.status === 'suspended' ? 'suspended' : 'active', since: iso(r.joinedAt),
          nextRenewal: iso(PROFILE_AS_OF + ((seed % 27) + 3) * DAY_MS), monthlyFee: money(fee), autoRenew: seed % 5 !== 0,
        }
      : { tier, name: tier === 'standard' ? 'Standard Access' : 'No Membership', description: tier === 'standard' ? 'Pay-per-booking access' : 'No active plan', status: tier === 'none' ? 'none' : 'active', since: iso(r.joinedAt), nextRenewal: null, monthlyFee: 0, autoRenew: false }
    const issues = r.supportTickets + r.openDisputes
    stats = {
      totalBookings: r.bookings,
      completed: r.completedCount,
      cancelled: r.cancelledCount,
      openIssues: issues,
      issuesLabel: r.supportTickets ? `${r.supportTickets} support ticket${r.supportTickets > 1 ? 's' : ''}` : r.openDisputes ? '1 open dispute' : 'No open issues',
      bookingsDelta: r.bookings ? (seed % 40) - 8 : 0,
      lifetimeValue: money(r.lifetimeValue),
      lifetimeDelta: r.bookings ? (seed % 45) - 6 : 0,
    }
    support = {
      openTickets: r.supportTickets,
      openDisputes: r.openDisputes,
      safetyReports: r.safetyCase ? 1 : 0,
      latest: r.supportTickets ? { id: `SUP-${4000 + (seed % 900)}`, subject: r.paymentIssue ? 'Payment not reflected in wallet' : 'Booking enquiry', createdAt: iso(PROFILE_AS_OF - 4 * DAY_MS), status: 'in_review' } : null,
    }
    referrals = { code: `${r.name.split(' ')[0].toUpperCase()}${String(r.joinedAt).slice(-2)}`, referredBy: r.referredBy, successful: seed % 6, loyaltyStatus: r.status === 'active' ? 'active' : 'inactive', totalSavings: money(r.totalSavings) }
    activity = [
      r.bookings ? { id: 'e1', type: 'booking', at: iso(PROFILE_AS_OF - (r.lastBookingDaysAgo ?? 2) * DAY_MS - 2 * 3_600_000), text: `Booking created – ${bookings[0]?.service || 'Massage'}` } : null,
      payments[0] ? { id: 'e2', type: 'payment', at: iso(new Date(payments[0].createdAt).getTime()), text: `Payment completed – ${currency} ${payments[0].amount.toLocaleString('en-US')}` } : null,
      { id: 'e3', type: 'profile', at: iso(PROFILE_AS_OF - r.updatedDaysAgo * DAY_MS), text: 'Profile updated' },
      support.latest ? { id: 'e4', type: 'support', at: support.latest.createdAt, text: `Support ticket created – ${support.latest.id}` } : null,
    ].filter(Boolean).sort((a, b) => new Date(b.at) - new Date(a.at))
  }

  const lastActiveAt = seeded?.lastActiveAt || iso(PROFILE_AS_OF - r.lastActiveDaysAgo * DAY_MS - 3_600_000)
  const paid = payments.filter((p) => p.status === 'successful').length

  return {
    asOf: iso(PROFILE_AS_OF),
    timeZone: timeZoneFor(r.country),
    currency,
    id: r.id,
    name: r.name,
    gender: r.gender,
    photoURL: r.id === 'CL-78421' ? '/demo/client-wallen.jpg' : null,
    vip: seeded ? true : r.membership === 'executive',
    membershipTier: r.membership,
    status: r.status,
    contactVerified: CONTACT_VERIFIED(r.status),
    country: r.country,
    countryName: countryName(r.country),
    city: r.city,
    joinedAt: iso(r.joinedAt),
    lastActiveAt,
    registrationLabel: seeded?.registrationLabel || { email: 'Email', phone: 'Phone', google: 'Google', apple: 'Apple' }[r.regMethod] || 'Mobile App',
    // Masked by default; the full values come from revealClientContact().
    email: maskEmail(r),
    phone: maskPhone(r),
    stats,
    membership,
    recentBookings: bookings,
    recentPayments: payments.slice(0, 4),
    paymentCount: paid,
    wallet,
    referrals,
    support,
    activity: activity.slice(0, 5),
    account: accountBlock(r),
  }
}

export const findMockClient = (id) => MOCK_CLIENTS.find((c) => c.id === id)
