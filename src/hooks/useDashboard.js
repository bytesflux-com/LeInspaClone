import { useCallback, useEffect, useState } from 'react'
import { dashboardService } from '../services/dashboardService'
import { useMarketContext } from './useMarketContext'
import { useDateRange } from './useDateRange'

export function useDashboard(params = {}) {
  const { selectedMarket } = useMarketContext()
  const { dateRange, customRange } = useDateRange()

  const marketId = params.marketId || selectedMarket.id
  const rangeId = params.dateRange || dateRange

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await dashboardService.getDashboardSummary({
        marketId,
        dateRange: rangeId,
        customRange,
      })
      setData(result)
    } catch (err) {
      console.error('Failed to load dashboard summary:', err)
      setError(err?.message || 'Failed to load telemetry')
    } finally {
      setLoading(false)
    }
  }, [marketId, rangeId, customRange])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    dashboardService
      .getDashboardSummary({ marketId, dateRange: rangeId, customRange })
      .then((res) => {
        if (!cancelled) {
          setData(res)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err)
          setError(err?.message || 'Unable to retrieve dashboard data')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [marketId, rangeId, customRange])

  return {
    data,
    loading,
    error,
    refetch: fetchSummary,
  }
}

