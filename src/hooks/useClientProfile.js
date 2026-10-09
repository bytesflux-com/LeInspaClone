import { useCallback, useEffect, useState } from 'react'
import { clientService } from '../services/clientService'

// Loads the ADM-012 aggregate profile. Re-fetches when the client or the
// selected market changes (country scope is validated server-side).
export function useClientProfile(clientId, market) {
  const [state, setState] = useState({ key: null, data: null, error: null })
  const [nonce, setNonce] = useState(0)
  const key = `${clientId}|${market}|${nonce}`

  useEffect(() => {
    if (!clientId) return undefined
    let cancelled = false
    clientService
      .getClientProfile(clientId, { market })
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((err) => !cancelled && setState({ key, data: null, error: err?.message || 'Unable to load this client.' }))
    return () => {
      cancelled = true
    }
  }, [clientId, market, key])

  const current = state.key === key
  return {
    profile: current ? state.data : null,
    error: current ? state.error : null,
    loading: !current,
    refetch: useCallback(() => setNonce((n) => n + 1), []),
  }
}
