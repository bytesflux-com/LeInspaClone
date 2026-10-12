import { useEffect, useState } from 'react'
import { attentionService } from '../services/attentionService'
import { useMarketContext } from './useMarketContext'

// Shared, lightly cached Needs-Your-Attention feed for the top bar and sidebar
// (notification bell, Verification Center badge). One request per market per
// TTL no matter how many components read it.
const TTL_MS = 2 * 60 * 1000
const cache = new Map() // marketId -> { at, promise, data }

function load(marketId) {
  const hit = cache.get(marketId)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise
  const promise = attentionService
    .getNeedsAttention({ marketId })
    .then((data) => {
      cache.set(marketId, { at: Date.now(), promise, data })
      return data
    })
    .catch((err) => {
      cache.delete(marketId)
      throw err
    })
  cache.set(marketId, { at: Date.now(), promise })
  return promise
}

export function useAttentionSummary() {
  const { selectedMarket } = useMarketContext()
  const marketId = selectedMarket?.id || 'ALL'
  const [state, setState] = useState(() => ({ data: cache.get(marketId)?.data || null, error: null }))

  useEffect(() => {
    let alive = true
    const refresh = () =>
      load(marketId).then(
        (data) => alive && setState({ data, error: null }),
        (err) => alive && setState((s) => ({ data: s.data, error: err?.message || 'Unavailable' })),
      )
    refresh()
    const timer = setInterval(refresh, TTL_MS)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [marketId])

  return { summary: state.data?.summary || null, items: state.data?.items || [], error: state.error }
}
