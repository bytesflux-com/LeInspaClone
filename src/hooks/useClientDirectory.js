import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { clientService } from '../services/clientService'
import { useMarketContext } from './useMarketContext'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '../constants/clients'

// All list state lives in the URL, so returning from ADM-012 (browser back or a
// link carrying the same query string) restores market + filters + page.
const TEXT_KEYS = ['q', 'membership', 'country', 'city', 'region', 'activity', 'joined', 'from', 'to', 'reg', 'guest', 'bmin', 'bmax', 'lastb', 'lasta', 'client']
const ADVANCED_KEYS = ['region', 'reg', 'guest', 'bmin', 'bmax', 'lastb', 'lasta', 'from', 'to']

function parse(sp) {
  const f = {}
  for (const k of TEXT_KEYS) f[k] = sp.get(k) || ''
  f.status = sp.get('status') || 'all'
  f.sort = sp.get('sort') || 'newest'
  f.issues = (sp.get('issues') || '').split(',').filter(Boolean)
  f.page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)
  const size = parseInt(sp.get('size') || '', 10)
  f.pageSize = PAGE_SIZES.includes(size) ? size : DEFAULT_PAGE_SIZE
  return f
}

const DEFAULTS = { status: 'all', sort: 'newest', page: 1, size: DEFAULT_PAGE_SIZE }

export function useClientDirectory() {
  const { selectedMarket } = useMarketContext()
  const [sp, setSp] = useSearchParams()
  const filters = useMemo(() => parse(sp), [sp])

  const update = useCallback(
    (patch, { resetPage = true } = {}) => {
      setSp(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(patch)) {
            const empty =
              value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0) || DEFAULTS[key] === value
            if (empty) next.delete(key)
            else next.set(key, Array.isArray(value) ? value.join(',') : String(value))
          }
          if (resetPage && !('page' in patch)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setSp],
  )

  const reset = useCallback(() => {
    setSp(
      (prev) => {
        const next = new URLSearchParams()
        for (const keep of ['size', 'client']) if (prev.get(keep)) next.set(keep, prev.get(keep))
        return next
      },
      { replace: true },
    )
  }, [setSp])

  // Debounced search box
  const [searchText, setSearchText] = useState(filters.q)
  useEffect(() => {
    setSearchText(filters.q)
  }, [filters.q])
  useEffect(() => {
    if (searchText === filters.q) return undefined
    const t = setTimeout(() => update({ q: searchText.trim() }), 300)
    return () => clearTimeout(t)
  }, [searchText, filters.q, update])

  // Switching market clears location filters; the page refreshes in place.
  const lastMarket = useRef(selectedMarket.id)
  useEffect(() => {
    if (lastMarket.current === selectedMarket.id) return
    lastMarket.current = selectedMarket.id
    update({ city: '', region: '', country: '' })
  }, [selectedMarket.id, update])

  const params = useMemo(
    () => ({
      market: selectedMarket.id,
      q: filters.q,
      status: filters.status,
      membership: filters.membership,
      country: filters.country,
      city: filters.city,
      region: filters.region,
      activity: filters.activity,
      joined: filters.joined,
      from: filters.from,
      to: filters.to,
      reg: filters.reg,
      guest: filters.guest,
      bmin: filters.bmin,
      bmax: filters.bmax,
      lastb: filters.lastb,
      lasta: filters.lasta,
      issues: filters.issues,
      sort: filters.sort,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    [selectedMarket.id, filters],
  )
  const queryKey = JSON.stringify(params)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    clientService
      .listClients(JSON.parse(queryKey))
      .then((res) => {
        if (cancelled) return
        setData(res)
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Unable to load clients')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [queryKey, nonce])

  const activeAdvancedCount =
    ADVANCED_KEYS.filter((k) => filters[k]).length + (filters.issues.length ? 1 : 0) + (filters.sort !== 'newest' ? 1 : 0)

  return {
    filters,
    params,
    update,
    reset,
    searchText,
    setSearchText,
    data,
    loading,
    error,
    refetch: () => setNonce((n) => n + 1),
    activeAdvancedCount,
    hasActiveFilters:
      Boolean(filters.q || filters.membership || filters.country || filters.city || filters.activity || filters.joined) ||
      filters.status !== 'all' ||
      activeAdvancedCount > 0,
  }
}
