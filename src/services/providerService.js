import { callAdmin } from '../lib/firebaseFunctions'
import { buildProviderDashboard } from './mock/providerDashboardMock'
import { queryProviderDirectory, DIRECTORY_PROVIDERS } from './mock/providerDirectoryMock'
import { getMockProviderProfile } from './mock/providerProfileMock'
import { queryMockProviderServices, getMockProviderServices } from './mock/providerServicesMock'
import { queryMockProviderBookings, getMockProviderBookingsDataset } from './mock/providerBookingsMock'

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
   * ADM-022: Fetch 360° Provider Admin Profile.
   * Calls live Cloud Function `adminGetProviderProfile` with fallback to deterministic mock telemetry.
   */
  async getProviderProfile(providerId) {
    try {
      const result = await callAdmin('adminGetProviderProfile', { providerId })
      const fallback = getMockProviderProfile(providerId)

      if (result && result.success && result.provider) {
        return {
          ...fallback,
          ...result.provider,
          internalNotes: result.internalNotes?.length ? result.internalNotes : fallback.internalNotes,
          services: result.services?.length ? result.services : fallback.services,
          bookingPerformance: result.bookingsAggregates || fallback.bookingPerformance,
        }
      }
      return fallback
    } catch (err) {
      console.warn(
        '[providerService] adminGetProviderProfile Cloud Function error, using fallback profile:',
        err?.message || err,
      )
      return getMockProviderProfile(providerId)
    }
  },

  /**
   * ADM-022: Add Internal Admin Note.
   */
  async addProviderInternalNote({ providerId, note, author, team }) {
    try {
      const result = await callAdmin('adminAddProviderInternalNote', {
        providerId,
        note,
        author,
        team,
      })
      if (result && result.note) {
        return result.note
      }
    } catch (err) {
      console.warn('[providerService] adminAddProviderInternalNote error, local fallback:', err)
    }
    return {
      id: `note-${Date.now()}`,
      text: note,
      author: author || 'Admin',
      team: team || 'Operations Team',
      date: 'Just now',
      createdAt: new Date().toISOString(),
    }
  },

  /**
   * ADM-022: Moderate Content (Photo, Bio, Gallery).
   */
  async updateProviderContentStatus({ providerId, itemId, itemType, status, reasonCode, reasonLabel, adminNote }) {
    try {
      const result = await callAdmin('adminUpdateProviderContentStatus', {
        providerId,
        itemId,
        itemType,
        status,
        reasonCode,
        reasonLabel,
        adminNote,
      })
      if (result && result.success) {
        return result.review
      }
    } catch (err) {
      console.warn('[providerService] adminUpdateProviderContentStatus error, local fallback:', err)
    }
    return {
      itemId,
      status,
      reasonCode,
      reasonLabel,
      adminNote,
      reviewedAt: new Date().toISOString(),
    }
  },

  /**
   * ADM-022: Update Verification Status.
   */
  async updateProviderVerificationStatus({ providerId, checkKey, status, reason, adminNote }) {
    try {
      const result = await callAdmin('adminUpdateProviderVerificationStatus', {
        providerId,
        checkKey,
        status,
        reason,
        adminNote,
      })
      if (result && result.success) {
        return result.update
      }
    } catch (err) {
      console.warn('[providerService] adminUpdateProviderVerificationStatus error, local fallback:', err)
    }
    return { providerId, checkKey, status, updatedAt: new Date().toISOString() }
  },

  /**
   * ADM-022: Update Account Status / Restrictions.
   */
  async updateProviderAccountStatus({ providerId, status, restrictionReason, adminNote }) {
    try {
      const result = await callAdmin('adminUpdateProviderAccountStatus', {
        providerId,
        status,
        restrictionReason,
        adminNote,
      })
      if (result && result.success) {
        return result.status
      }
    } catch (err) {
      console.warn('[providerService] adminUpdateProviderAccountStatus error, local fallback:', err)
    }
    return { providerId, status, restrictionReason, updatedAt: new Date().toISOString() }
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

  /**
   * ADM-023: Fetch Provider Services & Pricing catalogue.
   * Calls live Cloud Function `adminGetProviderServices` with fallback to deterministic mock catalogue.
   */
  async getProviderServices(params = {}) {
    const { providerId } = params
    try {
      const result = await callAdmin('adminGetProviderServices', params)
      if (result && Array.isArray(result.services) && result.services.length > 0) {
        return result
      }
      return queryMockProviderServices(providerId, params)
    } catch (err) {
      console.warn(
        '[providerService] adminGetProviderServices Cloud Function error, fallback to mock catalogue:',
        err?.message || err,
      )
      return queryMockProviderServices(providerId, params)
    }
  },

  /**
   * ADM-023: Fetch details for a single service.
   */
  async getProviderServiceDetail(providerId, serviceId) {
    try {
      const result = await callAdmin('adminGetProviderServiceDetail', { providerId, serviceId })
      if (result && result.service) {
        return result
      }
    } catch (err) {
      console.warn('[providerService] adminGetProviderServiceDetail error:', err?.message || err)
    }

    const all = getMockProviderServices(providerId)
    const service = all.find((s) => s.id === serviceId || s.serviceId === serviceId) || all[0]
    return {
      service,
      priceHistory: service?.priceHistory || [],
    }
  },

  /**
   * ADM-023: Moderate proposed service changes (Approve, Request Changes, Reject).
   */
  async moderateProviderService({
    providerId,
    serviceId,
    action,
    reasonCode,
    reasonLabel,
    messageToProvider,
    adminNote,
  }) {
    try {
      const result = await callAdmin('adminModerateProviderService', {
        providerId,
        serviceId,
        action,
        reasonCode,
        reasonLabel,
        messageToProvider,
        adminNote,
      })
      if (result && result.success) {
        return result.moderation
      }
    } catch (err) {
      console.warn('[providerService] adminModerateProviderService error, local update:', err?.message || err)
    }

    return {
      providerId,
      serviceId,
      action,
      reasonCode,
      reasonLabel,
      messageToProvider,
      adminNote,
      reviewedAt: new Date().toISOString(),
    }
  },

  /**
   * ADM-023: Update Service Active / Inactive Status.
   */
  async updateProviderServiceStatus({ providerId, serviceId, active, adminNote }) {
    try {
      const result = await callAdmin('adminUpdateProviderServiceStatus', {
        providerId,
        serviceId,
        active,
        adminNote,
      })
      if (result && result.success) {
        return result
      }
    } catch (err) {
      console.warn('[providerService] adminUpdateProviderServiceStatus error, local update:', err?.message || err)
    }

    return { providerId, serviceId, active }
  },

  /**
   * ADM-024: Fetch Provider Bookings, Ledger & Earnings Overview.
   * Calls live Cloud Function `adminGetProviderBookings` with fallback to deterministic mock telemetry.
   */
  async getProviderBookings({
    providerId = 'PR-82941',
    tab = 'all',
    search = '',
    service = 'all',
    bookingSource = 'all',
    paymentStatus = 'all',
    escrowStatus = 'all',
    dateRange = 'all',
  } = {}) {
    try {
      const result = await callAdmin('adminGetProviderBookings', {
        providerId,
        tab,
        search,
        service,
        bookingSource,
        paymentStatus,
        escrowStatus,
        dateRange,
      })

      if (result && Array.isArray(result.bookings)) {
        return result
      }
    } catch (err) {
      console.warn(
        '[providerService] adminGetProviderBookings live function unreachable, fallback:',
        err?.message || err,
      )
    }

    return queryMockProviderBookings(providerId, {
      tab,
      search,
      service,
      bookingSource,
      paymentStatus,
      escrowStatus,
      dateRange,
    })
  },

  /**
   * ADM-024: Fetch Detailed Single Booking for right-side drawer.
   */
  async getProviderBookingDetail(providerId, bookingId) {
    try {
      const result = await callAdmin('adminGetProviderBookingDetail', { providerId, bookingId })
      if (result && result.booking) {
        return result
      }
    } catch (err) {
      console.warn('[providerService] adminGetProviderBookingDetail error, fallback:', err?.message || err)
    }

    const dataset = getMockProviderBookingsDataset(providerId)
    const booking = (dataset.bookings || []).find((b) => b.id === bookingId || b.bookingId === bookingId)
    return {
      success: true,
      booking: booking || dataset.bookings[0],
    }
  },

  /**
   * ADM-024: Fetch Ledger Balances and Transactions.
   */
  async getProviderEarningsOverview(providerId) {
    try {
      const result = await callAdmin('adminGetProviderEarningsOverview', { providerId })
      if (result && result.ledger) {
        return result
      }
    } catch (err) {
      console.warn('[providerService] adminGetProviderEarningsOverview error, fallback:', err?.message || err)
    }

    const dataset = getMockProviderBookingsDataset(providerId)
    return {
      success: true,
      ledger: dataset.ledger,
      recentTransactions: dataset.recentTransactions,
    }
  },

  /**
   * ADM-024: Fetch Earnings Performance Chart Time Series Points.
   */
  async getProviderEarningsChart(period = '30d') {
    try {
      const result = await callAdmin('adminGetProviderEarningsChart', { period })
      if (result && Array.isArray(result.points)) {
        return result
      }
    } catch (err) {
      console.warn('[providerService] adminGetProviderEarningsChart error, fallback:', err?.message || err)
    }

    const { getEarningsChartPoints } = await import('../../functions/src/providerBookingsLogic')
    return {
      success: true,
      period,
      points: getEarningsChartPoints(period),
    }
  },
}
