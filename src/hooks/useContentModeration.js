import { useCallback, useEffect, useState } from 'react'
import { contentModerationService } from '../services/contentModerationService'

// Keyed loader: keeps the last result on screen while the next one loads.
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

// ADM-035 queue.
export function useContentQueue(params, enabled = true) {
  return useKeyedLoad(enabled, JSON.stringify(params), () => contentModerationService.getQueue(params), 'Unable to load the moderation queue.')
}

// One content review (ADM-035 panel, ADM-036, ADM-037).
export function useContentReview(moderationId) {
  const res = useKeyedLoad(Boolean(moderationId), moderationId || '', () => contentModerationService.getReview(moderationId), 'Unable to load this content.')
  return { ...res, data: res.data?.id === moderationId ? res.data : null }
}
