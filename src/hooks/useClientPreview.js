import { useEffect, useState } from 'react'
import { clientService } from '../services/clientService'

// Loads the lightweight preview aggregate for one client (and its tab data).
export function useClientPreview(clientId, tab, refreshKey = 0) {
  const [state, setState] = useState({ id: null, preview: null, error: null })
  const [extra, setExtra] = useState({ id: null, tab: null, items: null })

  useEffect(() => {
    if (!clientId) return undefined
    let cancelled = false
    clientService
      .getClientPreview(clientId)
      .then((preview) => !cancelled && setState({ id: clientId, preview, error: null }))
      .catch((err) => !cancelled && setState({ id: clientId, preview: null, error: err?.message || 'Unable to load client' }))
    return () => {
      cancelled = true
    }
  }, [clientId])

  useEffect(() => {
    if (!clientId || (tab !== 'activity' && tab !== 'notes')) return undefined
    let cancelled = false
    const load = tab === 'activity' ? clientService.getClientActivity : clientService.getClientNotes
    load(clientId)
      .then((items) => !cancelled && setExtra({ id: clientId, tab, items }))
      .catch(() => !cancelled && setExtra({ id: clientId, tab, items: [] }))
    return () => {
      cancelled = true
    }
  }, [clientId, tab, refreshKey])

  const current = state.id === clientId
  const extraCurrent = extra.id === clientId && extra.tab === tab
  return {
    preview: current ? state.preview : null,
    error: current ? state.error : null,
    loading: Boolean(clientId) && !current,
    tabItems: extraCurrent ? extra.items : null,
  }
}
