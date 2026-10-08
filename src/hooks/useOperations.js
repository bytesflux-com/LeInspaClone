import { useCallback, useEffect, useState } from 'react'
import { operationsService } from '../services/operationsService'
import { useMarketContext } from './useMarketContext'

export function useOperations() {
  const { selectedMarket } = useMarketContext()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  const fetchOperations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await operationsService.getOperationsSummary({
        marketId: selectedMarket.id,
      })
      setData(res)
    } catch (err) {
      console.error('[useOperations] Fetch failed:', err)
      setError(err?.message || 'Failed to load operations telemetry')
    } finally {
      setLoading(false)
    }
  }, [selectedMarket.id])

  useEffect(() => {
    fetchOperations()
  }, [fetchOperations])

  return {
    data,
    loading,
    error,
    refetch: fetchOperations,
    activeFilter,
    setActiveFilter,
  }
}

