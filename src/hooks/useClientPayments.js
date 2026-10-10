import { useCallback, useEffect, useState } from 'react'
import { clientService } from '../services/clientService'

// ADM-014 — loads one page of a client's payments. The previous page stays on
// screen while the next one loads, so tab/filter changes never flash a skeleton.
export function useClientPayments(clientId, market, params) {
  const [state, setState] = useState({ key: null, data: null, error: null, last: null })
  const [nonce, setNonce] = useState(0)
  const key = `${clientId}|${market}|${JSON.stringify(params)}|${nonce}`

  useEffect(() => {
    if (!clientId) return undefined
    let cancelled = false
    clientService
      .getClientPayments(clientId, { market, ...params })
      .then((data) => !cancelled && setState({ key, data, error: null, last: data }))
      .catch((err) => !cancelled && setState((s) => ({ key, data: null, error: err?.message || 'Unable to load payments.', last: s.last })))
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

// Drawer details (permission is revalidated server-side on every open).
export function usePaymentPreview(paymentId, clientId, market, nonce = 0) {
  const [state, setState] = useState({ key: null, data: null, error: null })
  const key = `${paymentId}|${clientId}|${market}|${nonce}`

  useEffect(() => {
    if (!paymentId) return undefined
    let cancelled = false
    clientService
      .getPaymentPreview(paymentId, { clientId, market })
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((err) => !cancelled && setState({ key, data: null, error: err?.message || 'Unable to load this payment.' }))
    return () => {
      cancelled = true
    }
  }, [key, paymentId, clientId, market])

  const current = state.key === key
  return { preview: current ? state.data : null, error: current ? state.error : null, loading: Boolean(paymentId) && !current }
}
