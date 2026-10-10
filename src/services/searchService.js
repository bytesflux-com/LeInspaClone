import { callAdmin } from '../lib/adminCall'

const RECENT_SEARCHES_KEY = 'leinspa_admin_recent_searches'

const DEFAULT_RECENT = [
  { id: '1', query: 'Grace Njeri', timeAgo: '2 minutes ago' },
  { id: '2', query: 'LI-48291', timeAgo: '10 minutes ago' },
  { id: '3', query: 'Serenity Wellness Spa', timeAgo: '1 hour ago' },
  { id: '4', query: 'WD-82914', timeAgo: '3 hours ago' },
  { id: '5', query: 'Daniel Kimani', timeAgo: '5 hours ago' },
]

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
      joinedAt: 'Joined 12 Jan 2025',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      link: '/clients',
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
      joinedAt: 'Joined 5 Feb 2025',
      avatarUrl: null,
      link: '/clients',
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
      joinedAt: 'Joined 18 Nov 2024',
      avatarUrl: null,
      link: '/clients',
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
      joinedAt: 'Joined 3 Mar 2024',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      link: '/providers',
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
      joinedAt: 'Joined 14 Jun 2024',
      avatarUrl: null,
      link: '/providers',
    },
    {
      id: 'prv-203',
      name: 'Daniel Kimani',
      type: 'provider',
      specialty: 'Personal Trainer',
      verified: true,
      rating: 4.7,
      reviewCount: 42,
      location: 'Nairobi, Kenya',
      market: 'KE',
      marketName: 'Kenya',
      status: 'Suspended',
      joinedAt: 'Suspended 4 Sep 2026',
      avatarUrl: null,
      link: '/providers/prv-203',
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
      joinedAt: 'Joined 14 Feb 2023',
      thumbnailUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=160&auto=format&fit=crop&q=80',
      link: '/businesses',
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
      joinedAt: 'Joined 22 Aug 2023',
      thumbnailUrl: null,
      link: '/businesses',
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
      joinedAt: 'Joined 20 Apr 2024',
      thumbnailUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=160&auto=format&fit=crop&q=80',
      link: '/businesses',
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
      link: '/bookings',
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
      link: '/bookings',
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
      link: '/finance',
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
      link: '/withdrawals',
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
      link: '/disputes',
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
      link: '/support',
    },
  ],
}

function findExactMatch(query, market) {
  if (!query) return null
  const cleanQ = query.trim().toUpperCase().replace('#', '')

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

function buildSandboxSearch(query, category = 'all', market = 'ALL', sortBy = 'relevance') {
  const queryLower = (query || '').trim().toLowerCase()
  const exactMatch = findExactMatch(query, market)

  const filteredGroups = {}
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
}

export const searchService = {
  async search({ query = '', category = 'all', marketId = 'ALL', sortBy = 'relevance' } = {}) {
    try {
      const res = await callAdmin('adminGlobalSearch', {
        query,
        category,
        market: marketId,
        sortBy,
      })
      if (res && res.counts) {
        return res
      }
      return buildSandboxSearch(query, category, marketId, sortBy)
    } catch (err) {
      console.warn(
        '[searchService] Live Cloud Function unreachable or not yet deployed, using sandbox data:',
        err?.message || err,
      )
      return buildSandboxSearch(query, category, marketId, sortBy)
    }
  },

  getRecentSearches() {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return DEFAULT_RECENT
  },

  addRecentSearch(query) {
    if (!query || !query.trim()) return
    try {
      const existing = this.getRecentSearches().filter(
        (item) => item.query.toLowerCase() !== query.toLowerCase(),
      )
      const updated = [
        { id: String(Date.now()), query: query.trim(), timeAgo: 'Just now' },
        ...existing,
      ].slice(0, 8)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }
  },

  clearRecentSearches() {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch {
      // ignore
    }
  },
}

