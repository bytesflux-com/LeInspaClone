import { useEffect, useState } from 'react'
import { clientService } from '../services/clientService'
import { useMarketContext } from './useMarketContext'
import { useDateRange } from './useDateRange'

// ADM-010 aggregates for the selected market + reporting period.
export function useClientDashboard() {
  const { selectedMarket } = useMarketContext()
  const { dateRange } = useDateRange()
  const [state, setState] = useState({ key: null, data: null, error: null })
  const [nonce, setNonce] = useState(0)
  const key = `${selectedMarket.id}|${dateRange}|${nonce}`

  useEffect(() => {
    let cancelled = false
    clientService
      .getClientDashboard({ market: selectedMarket.id, range: dateRange })
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((err) => !cancelled && setState({ key, data: null, error: err?.message || 'Unable to load client dashboard' }))
    return () => {
      cancelled = true
    }
  }, [selectedMarket.id, dateRange, key])

  const fresh = state.key === key
  return {
    // keep showing the last good data while a refresh is in flight
    data: state.data,
    loading: !fresh,
    error: fresh ? state.error : null,
    refetch: () => setNonce((n) => n + 1),
  }
}

export function useClientGrowth(window) {
  const { selectedMarket } = useMarketContext()
  const [state, setState] = useState({ key: null, data: null })
  const key = `${selectedMarket.id}|${window}`

  useEffect(() => {
    let cancelled = false
    clientService
      .getClientGrowth({ market: selectedMarket.id, window })
      .then((data) => !cancelled && setState({ key, data }))
      .catch(() => !cancelled && setState({ key, data: null }))
    return () => {
      cancelled = true
    }
  }, [selectedMarket.id, window, key])

  return { data: state.data, loading: state.key !== key }
}
