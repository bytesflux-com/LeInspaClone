import { useCallback, useEffect, useState } from 'react'
import { clientService } from '../services/clientService'

// ADM-016 — loads one client's membership view. The previous data stays on screen
// while a refresh runs (after a manual change), so the page never flashes a skeleton.
export function useClientMembership(clientId, market) {
  const [state, setState] = useState({ key: null, data: null, error: null, last: null })
  const [nonce, setNonce] = useState(0)
  const key = `${clientId}|${market}|${nonce}`

  useEffect(() => {
    if (!clientId) return undefined
    let cancelled = false
    clientService
      .getClientMembership(clientId, { market })
      .then((data) => !cancelled && setState({ key, data, error: null, last: data }))
      .catch((err) => !cancelled && setState((s) => ({ key, data: null, error: err?.message || 'Unable to load this membership.', last: s.last })))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const current = state.key === key
  return {
    data: current ? state.data : state.last,
    error: current ? state.error : null,
    loading: !current && !state.last,
    fetching: !current && Boolean(state.last),
    refetch: useCallback(() => setNonce((n) => n + 1), []),
  }
}
