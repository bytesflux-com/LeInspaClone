// ADM-020 → ADM-024 — provider dashboard, directory, profile, services and
// bookings. Always the live Cloud Functions (which read the mobile app's
// provider records and enforce permissions and market access); errors surface
// to the page. VITE_USE_MOCK_PROVIDERS=true runs the local demo data instead.
import { callAdmin } from '../lib/firebaseFunctions'
import { buildProviderDashboard } from './mock/providerDashboardMock'
import { queryProviderDirectory, DIRECTORY_PROVIDERS } from './mock/providerDirectoryMock'
import { getMockProviderProfile } from './mock/providerProfileMock'
import { queryMockProviderServices, getMockProviderServices } from './mock/providerServicesMock'
import { queryMockProviderBookings, getMockProviderBookingsDataset } from './mock/providerBookingsMock'
import { getEarningsChartPoints } from '../../functions/src/providerBookingsLogic'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_PROVIDERS === 'true'
const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

export const providerService = {
  isMock: USE_MOCK,

  // ADM-020
  async getProviderDashboard({ market = 'ALL', dateRange = '30d' } = {}) {
    if (USE_MOCK) return buildProviderDashboard(market, dateRange)
    return callAdmin('adminGetProviderDashboard', { market, dateRange, timeZone: timeZone() })
  },

  // ADM-021
  async listProviders(params = {}) {
    if (USE_MOCK) return queryProviderDirectory(params)
    return callAdmin('adminListProviders', params)
  },

  async getProviderDetail(providerId) {
    if (USE_MOCK) return DIRECTORY_PROVIDERS.find((p) => p.id === providerId || p.dbId === providerId) || null
    return (await callAdmin('adminGetProviderDetail', { providerId })).provider
  },

  // ADM-022
  async getProviderProfile(providerId) {
    if (USE_MOCK) return getMockProviderProfile(providerId)
    return (await callAdmin('adminGetProviderProfile', { providerId })).provider
  },

  async addProviderInternalNote({ providerId, note, team }) {
    if (USE_MOCK) return { id: `note-${Date.now()}`, text: note, author: 'You', team: team || null, date: 'Just now', createdAt: Date.now() }
    return (await callAdmin('adminAddProviderInternalNote', { providerId, note, team })).note
  },

  async updateProviderContentStatus({ providerId, itemId, itemType, status, reasonCode, reasonLabel, adminNote }) {
    if (USE_MOCK) return { itemId, status, reviewedAt: new Date().toISOString() }
    return (await callAdmin('adminUpdateProviderContentStatus', { providerId, itemId, itemType, status, reasonCode, reasonLabel, adminNote })).review
  },

  async exportProvidersReport({ market = 'ALL', dateRange = '30d' } = {}) {
    const data = await this.getProviderDashboard({ market, dateRange })

    const lines = []
    lines.push(`LÉ INSPA — PROVIDER MANAGEMENT REPORT`)
    lines.push(`Market Scope,${data.marketName} (${data.marketId})`)
    lines.push(`Period,${data.dateRange}`)
    lines.push(`Generated,${new Date().toISOString()}`)
    lines.push(``)

    lines.push(`--- KEY METRICS ---`)
    lines.push(`Metric,Value,Period Comparison`)
    lines.push(`Total Providers,${data.kpis.totalProviders},${data.kpis.totalProvidersTrend}`)
    lines.push(`Active Providers,${data.kpis.activeProviders},${data.kpis.activeProvidersTrend}`)
    lines.push(`Pending Verification,${data.kpis.pendingVerification},${data.kpis.pendingVerificationTrend}`)
    lines.push(`New Providers,${data.kpis.newProviders},${data.kpis.newProvidersTrend}`)
    lines.push(`Suspended,${data.kpis.suspended},${data.kpis.suspendedTrend}`)
    lines.push(`Available Now,${data.kpis.availableNow},${data.kpis.availableNowTrend}`)
    lines.push(``)

    lines.push(`--- PROVIDERS BY CATEGORY ---`)
    lines.push(`Category,Total Providers,Active Providers`)
    data.categories.forEach((cat) => {
      lines.push(`"${cat.name}",${cat.total},${cat.active}`)
    })
    lines.push(``)

    lines.push(`--- PROVIDER STATUS DISTRIBUTION ---`)
    lines.push(`Status,Count,Percentage`)
    data.statusDistribution.segments.forEach((seg) => {
      lines.push(`"${seg.label}",${seg.count},${seg.percentage}%`)
    })
    lines.push(``)

    lines.push(`--- RECENT PROVIDERS ---`)
    lines.push(`Name,Type,Market,Verification,Status,Joined`)
    data.recentProviders.forEach((p) => {
      lines.push(`"${p.name}","${p.type}","${p.market}","${p.verification}","${p.status}","${p.joined}"`)
    })

    return lines.join('\n')
  },

  /**
   * ADM-021: Export Directory Table as CSV.
   */
  async exportProvidersDirectory(params = {}, selectedIds = []) {
    const data = await this.listProviders({ ...params, page: 1, pageSize: 1000 })
    let exportItems = data.items || []

    if (selectedIds && selectedIds.length > 0) {
      exportItems = exportItems.filter((item) => selectedIds.includes(item.id))
    }

    const lines = []
    lines.push(`LÉ INSPA — PROVIDER DIRECTORY EXPORT`)
    lines.push(`Generated,${new Date().toISOString()}`)
    lines.push(`Total Records,${exportItems.length}`)
    lines.push(``)
    lines.push(`ID,Name,Entity Type,Category,Market,City,Verification,Availability,Rating,Reviews,Bookings,Status,Joined Date,Email,Phone`)

    exportItems.forEach((p) => {
      lines.push(
        `"${p.id}","${p.name}","${p.entityType}","${p.typeLabel}","${p.market}","${p.city}","${p.verificationLabel}","${p.availabilityLabel}",${p.rating},${p.reviewCount},${p.bookings},"${p.statusLabel}","${p.joinedDate}","${p.email}","${p.phone}"`,
      )
    })

    return lines.join('\n')
  },

  /**
   * ADM-023: Fetch Provider Services & Pricing catalogue.
   * Calls live Cloud Function `adminGetProviderServices` with fallback to deterministic mock catalogue.
   */

  // ADM-023
  async getProviderServices(params = {}) {
    if (USE_MOCK) return queryMockProviderServices(params.providerId, params)
    return callAdmin('adminGetProviderServices', params)
  },

  async getProviderServiceDetail(providerId, serviceId) {
    if (USE_MOCK) {
      const all = getMockProviderServices(providerId)
      const service = all.find((x) => x.id === serviceId || x.serviceId === serviceId) || all[0]
      return { service, priceHistory: service?.priceHistory || [] }
    }
    return callAdmin('adminGetProviderServiceDetail', { providerId, serviceId })
  },

  async moderateProviderService({ providerId, serviceId, action, reasonCode, reasonLabel, messageToProvider, adminNote }) {
    if (USE_MOCK) return { providerId, serviceId, action, reviewedAt: new Date().toISOString() }
    return (await callAdmin('adminModerateProviderService', { providerId, serviceId, action, reasonCode, reasonLabel, messageToProvider, adminNote })).moderation
  },

  async updateProviderServiceStatus({ providerId, serviceId, active, adminNote }) {
    if (USE_MOCK) return { providerId, serviceId, active }
    return callAdmin('adminUpdateProviderServiceStatus', { providerId, serviceId, active, adminNote })
  },

  // ADM-024
  async getProviderBookings({ providerId, ...filters } = {}) {
    if (USE_MOCK) return queryMockProviderBookings(providerId, filters)
    return callAdmin('adminGetProviderBookings', { providerId, ...filters })
  },

  async getProviderBookingDetail(providerId, bookingId) {
    if (USE_MOCK) {
      const dataset = getMockProviderBookingsDataset(providerId)
      return { success: true, booking: (dataset.bookings || []).find((b) => b.id === bookingId) || dataset.bookings[0] }
    }
    return callAdmin('adminGetProviderBookingDetail', { providerId, bookingId })
  },

  async getProviderEarningsOverview(providerId) {
    if (USE_MOCK) {
      const dataset = getMockProviderBookingsDataset(providerId)
      return { success: true, ledger: dataset.ledger, recentTransactions: dataset.recentTransactions }
    }
    return callAdmin('adminGetProviderEarningsOverview', { providerId })
  },

  async getProviderEarningsChart(period = '30d', providerId) {
    if (USE_MOCK) return { success: true, period, points: getEarningsChartPoints(period) }
    return callAdmin('adminGetProviderEarningsChart', { providerId, period })
  },
}
