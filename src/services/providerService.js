import { callAdmin } from '../lib/firebaseFunctions'
import { buildProviderDashboard } from './mock/providerDashboardMock'
import { queryProviderDirectory, DIRECTORY_PROVIDERS } from './mock/providerDirectoryMock'

export const providerService = {
  /**
   * Fetch aggregated provider management telemetry.
   * Calls live Cloud Function `adminGetProviderDashboard` with fallback to deterministic mock telemetry.
   */
  async getProviderDashboard({ market = 'ALL', dateRange = '30d' } = {}) {
    try {
      const result = await callAdmin('adminGetProviderDashboard', {
        market,
        dateRange,
      })

      if (result && result.kpis) {
        return result
      }
      return buildProviderDashboard(market, dateRange)
    } catch (err) {
      console.warn(
        '[providerService] Live Cloud Function unreachable or not yet deployed, using sandbox telemetry:',
        err?.message || err,
      )
      return buildProviderDashboard(market, dateRange)
    }
  },

  /**
   * ADM-021: Query Provider Directory.
   * Calls live Cloud Function `adminListProviders` with fallback to deterministic multi-market mock directory.
   */
  async listProviders(params = {}) {
    try {
      const result = await callAdmin('adminListProviders', params)
      if (result && Array.isArray(result.items)) {
        return result
      }
      return queryProviderDirectory(params)
    } catch (err) {
      console.warn(
        '[providerService] adminListProviders Cloud Function not reachable, falling back to local dataset:',
        err?.message || err,
      )
      return queryProviderDirectory(params)
    }
  },

  /**
   * ADM-021: Fetch detailed provider profile for quick preview drawer.
   */
  async getProviderDetail(providerId) {
    try {
      const result = await callAdmin('adminGetProviderDetail', { providerId })
      if (result && result.provider) {
        return result.provider
      }
      return (
        DIRECTORY_PROVIDERS.find(
          (p) => p.id === providerId || p.dbId === providerId,
        ) || null
      )
    } catch (err) {
      console.warn(
        '[providerService] adminGetProviderDetail error, falling back:',
        err?.message || err,
      )
      return (
        DIRECTORY_PROVIDERS.find(
          (p) => p.id === providerId || p.dbId === providerId,
        ) || null
      )
    }
  },

  /**
   * Export operational provider telemetry report as CSV.
   */
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
}
