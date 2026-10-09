import { useCallback, useEffect, useState } from 'react'
import { attentionService } from '../services/attentionService'
import { useMarketContext } from './useMarketContext'

export function useNeedsAttention() {
  const { selectedMarket } = useMarketContext()
  const marketId = selectedMarket?.id || 'ALL'

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await attentionService.getNeedsAttention({ marketId })
      setData(result)
    } catch (err) {
      setError(err?.message || 'Failed to load items that need attention')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [marketId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    attentionService
      .getNeedsAttention({ marketId })
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Unable to retrieve the action queue')
          setData(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [marketId])

  return {
    data,
    loading,
    error,
    refetch: fetchQueue,
    marketId,
  }
}
