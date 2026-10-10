import { useEffect, useState } from 'react'
import { providerService } from '../services/providerService'
import { useMarketContext } from './useMarketContext'
import { useDateRange } from './useDateRange'

/**
 * Hook for ADM-020 Provider Management Dashboard telemetry.
 * Automatically synchronizes with sovereign market context and date range filter.
 */
export function useProviderDashboard() {
  const { selectedMarket } = useMarketContext()
  const { dateRange } = useDateRange()
  const [state, setState] = useState({ key: null, data: null, error: null })
  const [nonce, setNonce] = useState(0)

  const key = `${selectedMarket.id}|${dateRange}|${nonce}`

  useEffect(() => {
    let cancelled = false
    providerService
      .getProviderDashboard({ market: selectedMarket.id, dateRange })
      .then((data) => {
        if (!cancelled) setState({ key, data, error: null })
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            key,
            data: null,
            error: err?.message || 'Unable to load provider management telemetry',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedMarket.id, dateRange, key])

  const fresh = state.key === key

  return {
    data: state.data,
    loading: !fresh,
    error: fresh ? state.error : null,
    refetch: () => setNonce((n) => n + 1),
  }
}

