import { useCallback, useEffect, useState } from 'react'
import { clientService } from '../services/clientService'

// ADM-018 — loads a client's support & safety history (overview + one page of cases).
// The previous result stays on screen while the next one loads, so tab / filter
// changes never flash a skeleton. `perms` only affects the demo backend: the real
// Cloud Function resolves the admin's role itself and returns permission-safe data.
export function useClientSupport(clientId, market, params, perms) {
  const [state, setState] = useState({ key: null, data: null, error: null, last: null })
  const [nonce, setNonce] = useState(0)
  const key = `${clientId}|${market}|${JSON.stringify(params)}|${perms.safety}|${perms.finance}|${nonce}`

  useEffect(() => {
    if (!clientId) return undefined
    let cancelled = false
    clientService
      .getClientSupport(clientId, { market, ...params }, perms)
      .then((data) => !cancelled && setState({ key, data, error: null, last: data }))
      .catch((err) => !cancelled && setState((s) => ({ key, data: null, error: err?.message || 'Unable to load support history.', last: s.last })))
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

// Drawer details. Permission is revalidated server-side on every open, and opening a
// sensitive (safety) case is access-logged there.
export function useSupportCasePreview(caseId, clientId, market, perms, nonce = 0) {
  const [state, setState] = useState({ key: null, data: null, error: null })
  const key = `${caseId}|${clientId}|${market}|${perms.safety}|${perms.finance}|${nonce}`

  useEffect(() => {
    if (!caseId) return undefined
    let cancelled = false
    clientService
      .getSupportCasePreview(caseId, { clientId, market }, perms)
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((err) => !cancelled && setState({ key, data: null, error: err?.message || 'Unable to load this case.' }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const current = state.key === key
  return { preview: current ? state.data : null, error: current ? state.error : null, loading: Boolean(caseId) && !current }
}
