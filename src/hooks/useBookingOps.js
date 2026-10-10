import { useCallback, useEffect, useState } from 'react'
import { bookingOpsService } from '../services/bookingOpsService'

// Keyed loader: the previous result stays on screen while the next one loads,
// so market / tab / filter changes never flash a skeleton. Every change of key
// (market included) re-queries the whole section.
function useKeyedLoad(enabled, key, load, fallbackError) {
  const [state, setState] = useState({ key: null, data: null, error: null, last: null })
  const [nonce, setNonce] = useState(0)
  const fullKey = `${key}|${nonce}`

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false
    load()
      .then((data) => !cancelled && setState({ key: fullKey, data, error: null, last: data }))
      .catch((err) => !cancelled && setState((s) => ({ key: fullKey, data: null, error: err?.message || fallbackError, last: s.last })))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey, enabled])

  const current = state.key === fullKey
  return {
    data: current ? state.data : state.last,
    error: current ? state.error : null,
    loading: enabled && !current && !state.last,
    fetching: enabled && !current && Boolean(state.last),
    refetch: useCallback(() => setNonce((n) => n + 1), []),
  }
}

// ADM-044 dashboard.
export function useBookingDashboard(params, enabled = true) {
  return useKeyedLoad(enabled, JSON.stringify(params), () => bookingOpsService.getDashboard(params), 'Unable to load booking operations.')
}

// ADM-045 → ADM-048 workspaces.
export function useBookingList(view, params, enabled = true) {
  return useKeyedLoad(enabled, `${view}|${JSON.stringify(params)}`, () => bookingOpsService.listBookings(view, params), 'Unable to load bookings.')
}

// Drawer quick view (access re-validated server-side on every open).
export function useBookingQuickView(bookingId, view) {
  const res = useKeyedLoad(Boolean(bookingId), `${bookingId}|${view}`, () => bookingOpsService.getQuickView(bookingId, view), 'Unable to load this booking.')
  return { ...res, data: res.data?.id === bookingId ? res.data : null }
}
