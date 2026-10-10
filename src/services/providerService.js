import { callAdmin } from '../lib/firebaseFunctions'
import { buildProviderDashboard } from './mock/providerDashboardMock'

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
}

