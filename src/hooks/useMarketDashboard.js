import { useCallback, useEffect, useState, useMemo } from 'react'
import { useMarketContext } from './useMarketContext'
import { usePermissions } from './usePermissions'
import { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { marketDashboardService } from '../services/marketDashboardService'
import { PERMISSIONS } from '../constants/permissions'

export function useMarketDashboard() {
  const { selectedMarket } = useMarketContext()
  const { can, role } = usePermissions()
  const adminContext = useContext(AdminContext)

  const dateRange = adminContext?.dateRange || '30d'
  const permittedMarkets = adminContext?.permittedMarkets || ['ALL']

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const canManageMarket = useMemo(() => {
    return can(PERMISSIONS.MARKETS_MANAGE)
  }, [can])

  const isCountryRestricted = useMemo(() => {
    if (role === 'super_admin' || permittedMarkets.includes('ALL')) return false
    return permittedMarkets.length === 1
  }, [role, permittedMarkets])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const marketId = selectedMarket?.id || 'KE'
      const response = await marketDashboardService.getMarketDashboardData({
        marketId,
        dateRange,
      })
      setData(response)
    } catch (err) {
      console.error('Failed to load market dashboard data:', err)
      setError(err?.message || 'Failed to connect to market telemetry')
    } finally {
      setLoading(false)
    }
  }, [selectedMarket?.id, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    selectedMarket,
    dateRange,
    canManageMarket,
    isCountryRestricted,
  }
}
