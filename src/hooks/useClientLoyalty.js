import { useCallback, useEffect, useState } from 'react'
import { clientService } from '../services/clientService'

// ADM-017 — loads one client's referral + loyalty overview. The previous data stays on
// screen while a refresh runs (after saving a note), so the page never flashes a skeleton.
export function useClientLoyalty(clientId, market) {
  const [state, setState] = useState({ key: null, data: null, error: null, last: null })
  const [nonce, setNonce] = useState(0)
  const key = `${clientId}|${market}|${nonce}`

  useEffect(() => {
    if (!clientId) return undefined
    let cancelled = false
    clientService
      .getClientLoyalty(clientId, { market })
      .then((data) => !cancelled && setState({ key, data, error: null, last: data }))
      .catch((err) => !cancelled && setState((s) => ({ key, data: null, error: err?.message || 'Unable to load referrals and loyalty.', last: s.last })))
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

// One page of the referral table. The previous page stays visible while the next one loads,
// so tab / search / paging changes never flash a skeleton.
export function useClientReferrals(clientId, market, params) {
  const [state, setState] = useState({ key: null, data: null, error: null, last: null })
  const [nonce, setNonce] = useState(0)
  const key = `${clientId}|${market}|${JSON.stringify(params)}|${nonce}`

  useEffect(() => {
    if (!clientId) return undefined
    let cancelled = false
    clientService
      .getClientReferrals(clientId, { market, ...params })
      .then((data) => !cancelled && setState({ key, data, error: null, last: data }))
      .catch((err) => !cancelled && setState((s) => ({ key, data: null, error: err?.message || 'Unable to load referrals.', last: s.last })))
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

// Referral drawer details (permission is revalidated server-side on every open).
export function useReferralPreview(referralId, clientId, market) {
  const [state, setState] = useState({ key: null, data: null, error: null })
  const key = `${referralId}|${clientId}|${market}`

  useEffect(() => {
    if (!referralId) return undefined
    let cancelled = false
    clientService
      .getReferralPreview(referralId, { clientId, market })
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((err) => !cancelled && setState({ key, data: null, error: err?.message || 'Unable to load this referral.' }))
    return () => {
      cancelled = true
    }
  }, [key, referralId, clientId, market])

  const current = state.key === key
  return { preview: current ? state.data : null, error: current ? state.error : null, loading: Boolean(referralId) && !current }
}
