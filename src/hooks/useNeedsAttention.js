<<<<<<< HEAD
import { useCallback, useEffect, useRef, useState } from 'react'
import { attentionService } from '../services/attentionService'
import { useMarketContext } from './useMarketContext'

const ERROR_MESSAGES = {
  'unauthorized-market': 'You are not authorized to view this market.',
  'no-authorized-markets': 'Your account is not assigned to any market.',
  'invalid-market': 'The selected market is not supported.',
  'missing-permission': 'Your admin role cannot view this queue.',
  'queue-unavailable': 'The attention queue could not be loaded. Please try again.',
}

// Loads the ADM-009 queue for the selected market. Data is keyed by market:
// while a different market is loading, the previous market's data is not
// returned, and responses for a market that is no longer selected are dropped.
export function useNeedsAttention() {
  const { selectedMarket } = useMarketContext()
  const marketId = selectedMarket.id
  const [state, setState] = useState({ marketId: null, data: null, error: null, loading: true })
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestRef.current
    setState({ marketId, data: null, error: null, loading: true })
    try {
      const data = await attentionService.getNeedsAttention({ marketId })
      if (requestRef.current === requestId) setState({ marketId, data, error: null, loading: false })
    } catch (err) {
      if (requestRef.current !== requestId) return
      const reason = err?.details?.reason
      setState({
        marketId,
        data: null,
        error: ERROR_MESSAGES[reason] ?? err?.message ?? 'Unable to load the attention queue.',
        loading: false,
      })
=======
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
>>>>>>> 34d6fc54f70a52ab6bda0e4055cb0e1c9840e2e7
    }
  }, [marketId])

  useEffect(() => {
<<<<<<< HEAD
    load()
    return () => {
      // Invalidate in-flight responses on market change / unmount.
      requestRef.current++
    }
  }, [load])

  const current = state.marketId === marketId
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: !current || state.loading,
    refetch: load,
=======
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
>>>>>>> 34d6fc54f70a52ab6bda0e4055cb0e1c9840e2e7
  }
}
