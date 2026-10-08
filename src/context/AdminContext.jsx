import { createContext, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { DEFAULT_MARKET, DEFAULT_DATE_RANGE } from '../constants/markets'
import { marketService } from '../services/marketService'
import { adminService } from '../services/adminService'
import { getLockState, lockSession, subscribeLock, unlockSession, endSession } from '../lib/sessionLock'

const STORAGE_KEY_MARKET = 'leinspa_admin_selected_market_id'
const STORAGE_KEY_DATE_RANGE = 'leinspa_admin_selected_date_range'

export const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const lock = useSyncExternalStore(subscribeLock, getLockState)

  // Identity & Permissions
  const [admin, setAdmin] = useState({
    fullName: 'Wallen Nyaberi',
    roleName: 'Super Admin',
    email: '',
    userId: '',
  })
  const [role, setRole] = useState('super_admin')
  const [permissions, setPermissions] = useState(new Set(['*']))
  const [permittedMarkets, setPermittedMarkets] = useState(['ALL'])

  // Persistent Selected Market
  const [selectedMarketId, setSelectedMarketId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MARKET) || DEFAULT_MARKET.id
    } catch {
      return DEFAULT_MARKET.id
    }
  })

  // Date Range
  const [dateRange, setDateRangeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_DATE_RANGE) || DEFAULT_DATE_RANGE
    } catch {
      return DEFAULT_DATE_RANGE
    }
  })
  const [customRange, setCustomRange] = useState({ start: null, end: null })

  // Global Search
  const [searchQuery, setSearchQuery] = useState('')

  // Notifications count / alert badges
  const [alertCounts, setAlertCounts] = useState({
    verifications: 18,
    withdrawals: 7,
    disputes: 3,
    safety: 2,
    support: 14,
  })

  // Set selected market and persist
  const setSelectedMarket = useCallback((marketOrId) => {
    const id = typeof marketOrId === 'string' ? marketOrId : marketOrId?.id || DEFAULT_MARKET.id
    setSelectedMarketId(id)
    try {
      localStorage.setItem(STORAGE_KEY_MARKET, id)
    } catch {
      // Storage unavailable
    }
  }, [])

  const setDateRange = useCallback((rangeId) => {
    setDateRangeState(rangeId)
    try {
      localStorage.setItem(STORAGE_KEY_DATE_RANGE, rangeId)
    } catch {
      // Storage unavailable
    }
  }, [])

  // Resolve current market object
  const selectedMarket = useMemo(() => {
    return marketService.getMarketById(selectedMarketId)
  }, [selectedMarketId])

  // Resolve available markets according to admin permissions
  const availableMarkets = useMemo(() => {
    return marketService.getAvailableMarkets(permittedMarkets)
  }, [permittedMarkets])

  // Fetch admin session from server
  const loadSession = useCallback(async () => {
    try {
      const data = await adminService.getSession({ active: true })
      if (data?.identity) {
        setAdmin({
          fullName: data.identity.fullName || 'Wallen Nyaberi',
          roleName: data.identity.roleName || 'Super Admin',
          email: data.identity.email || '',
          userId: data.identity.userId || '',
        })
      }
      if (data?.access) {
        setRole(data.access.roleId || 'super_admin')
        setPermissions(new Set(data.access.permissions || []))
        setPermittedMarkets(data.access.markets || ['ALL'])
      }
      if (data?.status === 'LOCKED') {
        lockSession(data.lockedReason || 'inactivity', data.lockedAt)
      }
    } catch (err) {
      if (err?.code === 'functions/unauthenticated') {
        endSession('unauthenticated')
      }
    }
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const value = useMemo(
    () => ({
      admin,
      role,
      permissions,
      permittedMarkets,
      selectedMarket,
      setSelectedMarket,
      availableMarkets,
      dateRange,
      setDateRange,
      customRange,
      setCustomRange,
      searchQuery,
      setSearchQuery,
      alertCounts,
      setAlertCounts,
      lock,
      refreshSession: loadSession,
    }),
    [
      admin,
      role,
      permissions,
      permittedMarkets,
      selectedMarket,
      setSelectedMarket,
      availableMarkets,
      dateRange,
      setDateRange,
      customRange,
      searchQuery,
      alertCounts,
      lock,
      loadSession,
    ],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

