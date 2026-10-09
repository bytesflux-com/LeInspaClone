import { useCallback, useEffect, useState } from 'react'
import { clientService } from '../services/clientService'

// ADM-013 — loads one page of a client's bookings. The previous page stays on
// screen while the next one loads, so tab/filter changes never flash a skeleton.
export function useClientBookings(clientId, market, params, finance) {
  const [state, setState] = useState({ key: null, data: null, error: null, last: null })
  const [nonce, setNonce] = useState(0)
  const key = `${clientId}|${market}|${finance}|${JSON.stringify(params)}|${nonce}`

  useEffect(() => {
    if (!clientId) return undefined
    let cancelled = false
    clientService
      .getClientBookings(clientId, { market, finance, ...params })
      .then((data) => !cancelled && setState({ key, data, error: null, last: data }))
      .catch((err) => !cancelled && setState((s) => ({ key, data: null, error: err?.message || 'Unable to load bookings.', last: s.last })))
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

// Quick preview for the right-hand drawer (access is re-validated server-side).
export function useBookingPreview(bookingId, clientId, market, finance) {
  const [state, setState] = useState({ key: null, data: null, error: null })
  const key = `${bookingId}|${clientId}|${market}|${finance}`

  useEffect(() => {
    if (!bookingId) return undefined
    let cancelled = false
    clientService
      .getBookingPreview(bookingId, { clientId, market, finance })
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((err) => !cancelled && setState({ key, data: null, error: err?.message || 'Unable to load this booking.' }))
    return () => {
      cancelled = true
    }
  }, [key, bookingId, clientId, market, finance])

  const current = state.key === key
  return { preview: current ? state.data : null, error: current ? state.error : null, loading: Boolean(bookingId) && !current }
}
