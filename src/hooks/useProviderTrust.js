import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AdminContext } from '../context/AdminContext'

const TRUST_PERMISSIONS = [
  'providers.view',
  'payments.view',
  'content.moderate',
  'subscriptions.manage',
  'visibility.manage',
  'safety.manage',
  'users.suspend',
  'users.deactivate',
  'withdrawals.approve',
  'audit.view',
]

// Admin context for the ADM-025 → ADM-028 demo backend. The real Cloud
// Functions ignore it and resolve role, permissions and markets server-side.
export function useTrustContext() {
  const ctx = useContext(AdminContext)
  const permissions = ctx?.permissions
  const role = ctx?.role
  const markets = ctx?.permittedMarkets
  const name = ctx?.admin?.fullName
  const roleName = ctx?.admin?.roleName
  return useMemo(() => {
    const all = role === 'super_admin' || permissions?.has?.('*')
    return {
      permissions: all ? TRUST_PERMISSIONS : TRUST_PERMISSIONS.filter((p) => permissions?.has?.(p)),
      markets: markets?.length ? markets : ['ALL'],
      actor: { id: 'current-admin', name: name || 'Admin', role: roleName || null },
    }
  }, [permissions, role, markets, name, roleName])
}

// Loads `load(ctx)` whenever `key` changes. The previous result stays on
// screen while a refresh is in flight, so actions never flash a skeleton.
export function useProviderTrustData(load, key) {
  const ctx = useTrustContext()
  const [state, setState] = useState({ key: null, data: null, error: null, last: null })
  const [nonce, setNonce] = useState(0)
  const fullKey = `${key}|${ctx.permissions.join(',')}|${nonce}`

  useEffect(() => {
    let cancelled = false
    load(ctx)
      .then((data) => !cancelled && setState({ key: fullKey, data, error: null, last: data }))
      .catch((err) => !cancelled && setState((s) => ({ key: fullKey, data: null, error: err?.message || 'Unable to load this screen.', last: s.last })))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey])

  const current = state.key === fullKey
  return {
    ctx,
    data: current ? state.data : state.last,
    error: current ? state.error : null,
    loading: !current && !state.last,
    fetching: !current && Boolean(state.last),
    refetch: useCallback(() => setNonce((n) => n + 1), []),
  }
}
