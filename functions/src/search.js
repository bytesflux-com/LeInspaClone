import { onCall } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { canAccessMarket } from './accessModel.js'

// Realistic platform entities for sandbox & production fallback
const SAMPLE_ENTITIES = {
  clients: [
    {
      id: 'usr-101',
      name: 'Grace Njeri',
      type: 'client',
      role: 'Client',
      email: 'g••••@gmail.com',
      phone: '+254 7•• ••• •••',
      market: 'KE',
      marketName: 'Kenya',
      city: 'Nairobi',
      status: 'Active',
      joinedAt: '12 Jan 2025',
      avatarUrl: null,
      link: '/clients/usr-101',
    },
    {
      id: 'usr-102',
      name: 'Daniel Kimani',
      type: 'client',
      role: 'Client',
      email: 'd••••@yahoo.com',
      phone: '+254 7•• ••• •••',
      market: 'KE',
      marketName: 'Kenya',
      city: 'Nairobi',
      status: 'Active',
      joinedAt: '5 Feb 2025',
      avatarUrl: null,
      link: '/clients/usr-102',
    },
    {
      id: 'usr-103',
      name: 'Sarah Nakato',
      type: 'client',
      role: 'Client',
      email: 's••••@gmail.com',
      phone: '+256 7•• ••• •••',
      market: 'UG',
      marketName: 'Uganda',
      city: 'Kampala',
      status: 'Active',
      joinedAt: '18 Nov 2024',
      avatarUrl: null,
      link: '/clients/usr-103',
    },
  ],
  providers: [
    {
      id: 'prv-201',
      name: 'Grace Njeri',
      type: 'provider',
      specialty: 'Massage Therapist',
      verified: true,
      rating: 4.9,
      reviewCount: 128,
      location: 'Nairobi, Kenya',
      market: 'KE',
      marketName: 'Kenya',
      status: 'Active',
      joinedAt: '3 Mar 2024',
      avatarUrl: null,
      link: '/providers/prv-201',
    },
    {
      id: 'prv-202',
      name: 'David Ochieng',
      type: 'provider',
      specialty: 'Aesthetician & Skincare',
      verified: true,
      rating: 4.8,
      reviewCount: 94,
      location: 'Kampala, Uganda',
      market: 'UG',
      marketName: 'Uganda',
      status: 'Active',
      joinedAt: '14 Jun 2024',
      avatarUrl: null,
      link: '/providers/prv-202',
    },
  ],
  spas: [
    {
      id: 'spa-301',
      name: 'Serenity Wellness Spa',
      type: 'spa',
      category: 'Spa & Wellness Center',
      verified: true,
      location: 'Nairobi, Kenya',
      market: 'KE',
      marketName: 'Kenya',
      branches: '3 Branches',
      status: 'Active',
      joinedAt: '14 Feb 2023',
      thumbnailUrl: null,
      link: '/businesses/spa-301',
    },
    {
      id: 'spa-302',
      name: 'Oasis Luxury Spa',
      type: 'spa',
      category: 'Day Spa & Hammam',
      verified: true,
      location: 'Kampala, Uganda',
      market: 'UG',
      marketName: 'Uganda',
      branches: '1 Branch',
      status: 'Active',
      joinedAt: '22 Aug 2023',
      thumbnailUrl: null,
      link: '/businesses/spa-302',
    },
  ],
  hotels: [
    {
      id: 'htl-401',
      name: 'Sarova Wellness Resort',
      type: 'hotel',
      category: 'Hotel / Wellness Resort',
      verified: true,
      location: 'Nairobi, Kenya',
      market: 'KE',
      marketName: 'Kenya',
      status: 'Active',
      joinedAt: '20 Apr 2024',
      thumbnailUrl: null,
      link: '/businesses/htl-401',
    },
    {
      id: 'htl-402',
      name: 'Serena Safari Spa Resort',
      type: 'hotel',
      category: 'Safari Lodge & Wellness Spa',
      verified: true,
      location: 'Arusha, Tanzania',
      market: 'TZ',
      marketName: 'Tanzania',
      status: 'Active',
      joinedAt: '11 Jan 2024',
      thumbnailUrl: null,
      link: '/businesses/htl-402',
    },
  ],
  bookings: [
    {
      id: 'LI-48291',
      reference: '#LI-48291',
      service: 'Deep Tissue Massage',
      clientName: 'Grace Njeri',
      clientRole: 'Client',
      market: 'KE',
      marketName: 'Kenya',
      scheduledAt: '12 Sep 2026 · 2:00 PM',
      status: 'Confirmed',
      amount: 'KES 4,500',
      link: '/bookings/LI-48291',
    },
    {
      id: 'LI-48192',
      reference: '#LI-48192',
      service: 'Aromatherapy & Body Polish',
      clientName: 'Daniel Kimani',
      clientRole: 'Client',
      market: 'KE',
      marketName: 'Kenya',
      scheduledAt: '10 Sep 2026 · 11:30 AM',
      status: 'Completed',
      amount: 'KES 3,800',
      link: '/bookings/LI-48192',
    },
  ],
  payments: [
    {
      id: 'PAY-928410',
      reference: 'PAY-928410',
      bookingReference: 'Booking #LI-48291',
      amount: 'KES 4,500',
      method: 'M-PESA',
      market: 'KE',
      marketName: 'Kenya',
      status: 'Successful',
      date: '12 Sep 2026',
      link: '/finance/payments/PAY-928410',
    },
    {
      id: 'PAY-928105',
      reference: 'PAY-928105',
      bookingReference: 'Booking #LI-48192',
      amount: 'KES 3,800',
      method: 'Card',
      market: 'KE',
      marketName: 'Kenya',
      status: 'Successful',
      date: '10 Sep 2026',
      link: '/finance/payments/PAY-928105',
    },
  ],
  withdrawals: [
    {
      id: 'WD-82914',
      reference: 'WD-82914',
      recipientName: 'Grace Njeri',
      recipientType: 'Provider',
      amount: 'KES 45,000',
      market: 'KE',
      marketName: 'Kenya',
      status: 'Pending Approval',
      date: '10 Sep 2026',
      link: '/withdrawals/WD-82914',
    },
    {
      id: 'WD-82801',
      reference: 'WD-82801',
      recipientName: 'James Ochieng',
      recipientType: 'Provider',
      amount: 'KES 12,000',
      market: 'KE',
      marketName: 'Kenya',
      status: 'Completed',
      date: '5 Sep 2026',
      link: '/withdrawals/WD-82801',
    },
  ],
  disputes: [
    {
      id: 'DSP-2041',
      reference: 'DSP-2041',
      bookingReference: 'Booking #LI-48291',
      reason: 'Service Quality',
      market: 'KE',
      marketName: 'Kenya',
      status: 'Open',
      date: '8 Sep 2026',
      link: '/disputes/DSP-2041',
    },
    {
      id: 'DSP-2030',
      reference: 'DSP-2030',
      bookingReference: 'Booking #LI-47990',
      reason: 'Late Arrival',
      market: 'KE',
      marketName: 'Kenya',
      status: 'Resolved',
      date: '2 Sep 2026',
      link: '/disputes/DSP-2030',
    },
  ],
  supportTickets: [
    {
      id: 'SUP-4812',
      reference: 'SUP-4812',
      subject: 'Payment not reflected',
      initiatorRole: 'Client',
      market: 'UG',
      marketName: 'Uganda',
      status: 'In Review',
      date: '9 Sep 2026',
      link: '/support/SUP-4812',
    },
    {
      id: 'SUP-4790',
      reference: 'SUP-4790',
      subject: 'Reschedule request',
      initiatorRole: 'Provider',
      market: 'KE',
      marketName: 'Kenya',
      status: 'Closed',
      date: '4 Sep 2026',
      link: '/support/SUP-4790',
    },
  ],
}

/**
 * Detect exact match for reference IDs (e.g. WD-82914, LI-48291, PAY-928410)
 */
function findExactMatch(query, market) {
  if (!query) return null
  const cleanQ = query.trim().toUpperCase().replace('#', '')

  // Check all collections for exact ID / reference
  for (const groupKey of Object.keys(SAMPLE_ENTITIES)) {
    const list = SAMPLE_ENTITIES[groupKey]
    for (const item of list) {
      if (market !== 'ALL' && item.market !== market) continue
      const ref = (item.id || item.reference || '').toUpperCase().replace('#', '')
      if (ref === cleanQ) {
        return {
          type: groupKey,
          title: item.reference || item.id,
          subtitle: item.service || item.subject || item.recipientName || item.name || '',
          amount: item.amount || null,
          market: item.market,
          marketName: item.marketName,
          status: item.status,
          link: item.link,
        }
      }
    }
  }
  return null
}

/**
 * Filter items by text query and country market
 */
function matchItem(item, queryLower, market) {
  if (market !== 'ALL' && item.market !== market) {
    return false
  }
  if (!queryLower) return true

  const searchable = [
    item.name,
    item.id,
    item.reference,
    item.bookingReference,
    item.service,
    item.subject,
    item.recipientName,
    item.clientName,
    item.specialty,
    item.category,
    item.location,
    item.city,
    item.email,
    item.phone,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return searchable.includes(queryLower)
}

/**
 * ADM-007 — Universal Global Search Cloud Function
 */
export const adminGlobalSearch = onCall(async (request) => {
  const admin = await requireAdmin(request)
  const {
    query = '',
    category = 'all',
    market = 'ALL',
    sortBy = 'relevance',
  } = request.data || {}

  logger.info('[adminGlobalSearch] Request:', {
    adminId: admin.uid,
    query,
    category,
    market,
  })

  // Market access enforcement
  if (market !== 'ALL' && !canAccessMarket(admin, market)) {
    throw new Error(`Unauthorized market access: ${market}`)
  }

  const queryLower = (query || '').trim().toLowerCase()
  const exactMatch = findExactMatch(query, market)

  // Filter groups
  const filteredGroups = {}
  let totalCount = 0

  const counts = {
    all: 0,
    clients: 0,
    providers: 0,
    spas: 0,
    hotels: 0,
    bookings: 0,
    payments: 0,
    withdrawals: 0,
    disputes: 0,
    support: 0,
  }

  for (const [key, items] of Object.entries(SAMPLE_ENTITIES)) {
    const matched = items.filter((item) => matchItem(item, queryLower, market))
    const countKey = key === 'supportTickets' ? 'support' : key
    counts[countKey] = matched.length
    counts.all += matched.length

    if (category === 'all' || category === countKey) {
      filteredGroups[key] = matched
      totalCount += matched.length
    } else {
      filteredGroups[key] = []
    }
  }

  return {
    query,
    market,
    category,
    sortBy,
    exactMatch,
    counts,
    totalResults: counts.all,
    results: filteredGroups,
  }
})

