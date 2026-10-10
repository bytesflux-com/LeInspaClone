import { useCallback, useEffect, useState } from 'react'
import { clientService } from '../services/clientService'

// ADM-019 — loads a client's account-control state. The previous result stays on screen while a
// refresh is in flight, so applying an action never flashes a skeleton. `perms` only affects the
// demo backend: the real Cloud Function resolves the admin's role itself and returns the
// permission-safe data plus the list of actions this admin may perform.
export function useClientAccount(clientId, market, perms) {
  const [state, setState] = useState({ key: null, data: null, error: null, last: null })
  const [nonce, setNonce] = useState(0)
  const key = `${clientId}|${market}|${perms.manage}|${perms.finance}|${perms.safety}|${perms.superAdmin}|${nonce}`

  useEffect(() => {
    if (!clientId) return undefined
    let cancelled = false
    clientService
      .getClientAccount(clientId, { market }, perms)
      .then((data) => !cancelled && setState({ key, data, error: null, last: data }))
      .catch((err) => !cancelled && setState((s) => ({ key, data: null, error: err?.message || 'Unable to load account actions.', last: s.last })))
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
