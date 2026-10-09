// Deterministic demo dataset for ADM-011 (12,341 clients).
// Used only while the `adminListClients` Cloud Function does not exist yet.
// The first ten rows mirror the ADM-011 mockup; the rest are generated.
import { CITY_DIRECTORY } from '../../constants/clients'
import { MARKETS } from '../../constants/markets'

export const MOCK_REFERENCE_DATE = Date.UTC(2026, 0, 13)
export const DAY_MS = 86_400_000

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(20260108)
const pick = (arr) => arr[Math.floor(rng() * arr.length)]
const int = (min, max) => min + Math.floor(rng() * (max - min + 1))

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function expand(counts) {
  const out = []
  for (const [value, n] of Object.entries(counts)) for (let i = 0; i < n; i++) out.push(value)
  return out
}

const FEMALE = ['Amina', 'Cynthia', 'Esther', 'Gloria', 'Irene', 'Lucy', 'Nancy', 'Pauline', 'Ruth', 'Tabitha', 'Winnie', 'Zainab', 'Faith', 'Mercy', 'Naomi', 'Beatrice', 'Joyce', 'Lilian', 'Purity', 'Caroline']
const MALE = ['David', 'Felix', 'Hassan', 'Joseph', 'Kevin', 'Moses', 'Oscar', 'Samuel', 'Victor', 'Collins', 'Kelvin', 'Dennis', 'Isaac', 'Patrick', 'Martin', 'Eric', 'Allan', 'Steve', 'Simon', 'Gilbert']
const LAST = {
  KE: ['Otieno', 'Kamau', 'Njoroge', 'Mutua', 'Wafula', 'Omondi', 'Chebet', 'Kiprop', 'Odhiambo', 'Karanja', 'Waweru', 'Akinyi', 'Juma', 'Barasa', 'Muthoni', 'Ndungu', 'Kilonzo', 'Hussein', 'Atieno', 'Rono', 'Koech', 'Wekesa'],
  UG: ['Nakato', 'Okello', 'Mugisha', 'Namukasa', 'Ssebunya', 'Atim', 'Kato', 'Nabirye', 'Opio'],
  TZ: ['Mushi', 'Kimaro', 'Msuya', 'Mrema', 'Mollel', 'Mwakyusa', 'Shayo'],
  RW: ['Uwase', 'Habimana', 'Mukamana', 'Nshuti', 'Ingabire', 'Niyonzima'],
  ZA: ['Nkosi', 'Dlamini', 'Naidoo', 'Khumalo', 'Pillay', 'Mokoena', 'Botha'],
}
const DOMAINS = ['gmail.com', 'gmail.com', 'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']

const CURRENCY = Object.fromEntries(MARKETS.filter((m) => !m.isGlobal).map((m) => [m.id, m.currency]))
const PREFIX = Object.fromEntries(MARKETS.filter((m) => !m.isGlobal).map((m) => [m.id, m.phonePrefix]))

const D = (y, m, d, h = 10) => Date.UTC(y, m - 1, d, h)

// [id, name, gender, emailUser, domain, dots, country, city, membership, status, bookings, joined, phonePrefix]
const SEEDS = [
  ['CL-78421', 'Wallen Nyaberi', 'f', 'wallen.nyaberi', 'gmail.com', 6, 'KE', 'Nairobi', 'premium', 'active', 18, D(2026, 1, 12), '+254'],
  ['CL-66214', 'Daniel Kimani', 'm', 'daniel.kimani', 'yahoo.com', 4, 'KE', 'Mombasa', 'standard', 'active', 6, D(2026, 1, 8), '+254'],
  ['CL-55103', 'Grace Wanjiku', 'f', 'grace.wanjiku', 'gmail.com', 6, 'KE', 'Nakuru', 'executive', 'active', 24, D(2026, 1, 5), '+254'],
  ['CL-51028', 'James Mwangi', 'm', 'james.mwangi', 'gmail.com', 5, 'KE', 'Nairobi', 'premium', 'suspended', 12, D(2025, 12, 28), '+254'],
  ['CL-33127', 'Sarah Achieng', 'f', 'sarah.achieng', 'gmail.com', 5, 'UG', 'Kampala', 'standard', 'active', 9, D(2025, 12, 20), '+254'],
  ['CL-22914', 'Peter Otieno', 'm', 'peter.otieno', 'hotmail.com', 5, 'KE', 'Kisumu', 'standard', 'pending', 0, D(2025, 12, 18), '+254'],
  ['CL-19832', 'Mary Nduku', 'f', 'mary.nduku', 'gmail.com', 4, 'TZ', 'Dar es Salaam', 'premium', 'active', 31, D(2025, 12, 15), '+254'],
  ['CL-17621', 'John Kariuki', 'm', 'john.kariuki', 'yahoo.com', 5, 'KE', 'Nakuru', 'standard', 'inactive', 3, D(2025, 12, 10), '+254'],
  ['CL-14567', 'Aisha Mohamed', 'f', 'aisha.mohamed', 'gmail.com', 6, 'TZ', 'Arusha', 'executive', 'active', 27, D(2025, 12, 8), '+255'],
  ['CL-11234', 'Brian Kiptoo', 'm', 'brian.kiptoo', 'gmail.com', 6, 'KE', 'Eldoret', 'standard', 'active', 5, D(2025, 12, 2), '+254'],
]

const TOTAL = 12341
const regionOf = (country, city) => CITY_DIRECTORY[country]?.find((c) => c.city === city)?.region || ''

function activityFields(row, bookings) {
  const never = bookings === 0
  const lastActiveDaysAgo = row.status === 'inactive' || row.status === 'deactivated' ? int(95, 400) : int(0, 60)
  const cancelledCount = never ? 0 : Math.floor(bookings * rng() * 0.18)
  const hasUpcoming = !never && row.status === 'active' && rng() < 0.16
  const completedCount = Math.max(0, bookings - cancelledCount - (hasUpcoming ? 1 : 0))
  return {
    lastBookingDaysAgo: never ? null : int(0, 210),
    lastActiveDaysAgo,
    updatedDaysAgo: int(0, 90),
    hasUpcoming,
    inService: !never && row.status === 'active' && rng() < 0.02,
    cancelledRecently: cancelledCount > 0 && rng() < 0.3,
    cancelledCount,
    completedCount,
    openDisputes: rng() < 0.03 ? 1 : 0,
    supportTickets: rng() < 0.07 ? int(1, 2) : 0,
    safetyCase: rng() < 0.01,
    paymentIssue: rng() < 0.03,
    regMethod: pick(['email', 'email', 'phone', 'google', 'apple']),
    guestConverted: rng() < 0.12,
    lifetimeValue: bookings * int(35, 160),
    walletBalance: Math.round((rng() * 18000) / 50) * 50,
    totalSavings: Math.round((bookings * rng() * 450) / 50) * 50,
    referredBy: rng() < 0.18 ? pick(SEEDS)[1] : null,
  }
}

function build() {
  const rows = []
  const used = new Set(SEEDS.map((s) => s[0]))

  SEEDS.forEach((s, i) => {
    const [id, name, gender, user, domain, dots, country, city, membership, status, bookings, joinedAt, phonePrefix] = s
    const row = { id, name, gender, emailUser: user, emailDomain: domain, emailDots: dots, country, city, membership, status, bookings, joinedAt, phonePrefix }
    Object.assign(row, activityFields(row, bookings))
    if (i === 0) {
      Object.assign(row, {
        lastBookingDaysAgo: 0, hasUpcoming: true, cancelledCount: 2, completedCount: 15, openDisputes: 0,
        supportTickets: 1, walletBalance: 12450, totalSavings: 8200, referredBy: null, safetyCase: false, paymentIssue: false,
      })
    }
    row.phoneTail = String(int(100000, 999999))
    row.region = regionOf(country, city)
    rows.push(row)
  })

  const n = TOTAL - SEEDS.length
  const statuses = shuffle(expand({ active: 10475, pending: 119, inactive: 240, suspended: 47, deactivated: 36, unverified: 1414 }))
  const countries = shuffle(expand({ KE: 8413, UG: 1699, TZ: 1298, RW: 600, ZA: 321 }))
  const base = D(2025, 12, 2)

  for (let i = 0; i < n; i++) {
    const country = countries[i]
    const gender = rng() < 0.55 ? 'f' : 'm'
    const first = pick(gender === 'f' ? FEMALE : MALE)
    const last = pick(LAST[country] || LAST.KE)
    let num = int(10000, 99999)
    while (used.has(`CL-${num}`)) num++
    const id = `CL-${num}`
    used.add(id)
    const status = statuses[i]
    const bookings = status === 'pending' || status === 'unverified' ? 0 : rng() < 0.1 ? 0 : int(1, 40)
    const cityEntry = pick(CITY_DIRECTORY[country])
    const row = {
      id,
      name: `${first} ${last}`,
      gender,
      emailUser: `${first}.${last}`.toLowerCase(),
      emailDomain: pick(DOMAINS),
      emailDots: int(4, 6),
      country,
      city: cityEntry.city,
      region: cityEntry.region,
      membership: rng() < 0.6 ? 'standard' : rng() < 0.7 ? 'premium' : 'executive',
      status,
      bookings,
      joinedAt: base - (i + 1) * 2.1 * 3_600_000 - int(0, 3_000_000),
      phonePrefix: PREFIX[country],
      phoneTail: String(int(100000, 999999)),
    }
    Object.assign(row, activityFields(row, bookings))
    rows.push(row)
  }
  return rows
}

export const MOCK_CLIENTS = build()
export const MOCK_CURRENCY = CURRENCY

export const maskEmail = (r) => `${r.emailUser[0]}${'•'.repeat(r.emailDots)}@${r.emailDomain}`
export const maskPhone = (r) => `${r.phonePrefix} 7•• ••• •••`
export const fullEmail = (r) => `${r.emailUser}@${r.emailDomain}`
export const fullPhone = (r) => `${r.phonePrefix}7${r.phoneTail}`
