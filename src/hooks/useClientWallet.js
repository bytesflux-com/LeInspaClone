import { useCallback, useEffect, useState } from 'react'
import { clientService } from '../services/clientService'

// ADM-015 — loads one page of a client's wallet ledger. The previous page stays on
// screen while the next one loads, so tab/filter changes never flash a skeleton.
export function useClientWallet(clientId, market, params) {
  const [state, setState] = useState({ key: null, data: null, error: null, last: null })
  const [nonce, setNonce] = useState(0)
  const key = `${clientId}|${market}|${JSON.stringify(params)}|${nonce}`

  useEffect(() => {
    if (!clientId) return undefined
    let cancelled = false
    clientService
      .getClientWallet(clientId, { market, ...params })
      .then((data) => !cancelled && setState({ key, data, error: null, last: data }))
      .catch((err) => !cancelled && setState((s) => ({ key, data: null, error: err?.message || 'Unable to load this wallet.', last: s.last })))
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

// Balance-over-time series for the chart. Independent of list filters.
export function useWalletBalanceHistory(clientId, market, window) {
  const [state, setState] = useState({ key: null, data: null, error: null, last: null })
  const key = `${clientId}|${market}|${window}`

  useEffect(() => {
    if (!clientId) return undefined
    let cancelled = false
    clientService
      .getWalletBalanceHistory(clientId, { market, window })
      .then((data) => !cancelled && setState({ key, data, error: null, last: data }))
      .catch((err) => !cancelled && setState((s) => ({ key, data: null, error: err?.message || 'Unable to load balance history.', last: s.last })))
    return () => {
      cancelled = true
    }
  }, [key, clientId, market, window])

  const current = state.key === key
  return { history: current ? state.data : state.last, error: current ? state.error : null, loading: Boolean(clientId) && !current && !state.last }
}

// Drawer details (permission is revalidated server-side on every open).
export function useWalletTransactionPreview(txnId, clientId, market, nonce = 0) {
  const [state, setState] = useState({ key: null, data: null, error: null })
  const key = `${txnId}|${clientId}|${market}|${nonce}`

  useEffect(() => {
    if (!txnId) return undefined
    let cancelled = false
    clientService
      .getWalletTransactionPreview(txnId, { clientId, market })
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((err) => !cancelled && setState({ key, data: null, error: err?.message || 'Unable to load this transaction.' }))
    return () => {
      cancelled = true
    }
  }, [key, txnId, clientId, market])

  const current = state.key === key
  return { preview: current ? state.data : null, error: current ? state.error : null, loading: Boolean(txnId) && !current }
}
