import { useState, useEffect, useCallback, useMemo } from 'react'
import { providerService } from '../services/providerService'
import { usePermissions } from './usePermissions'
import { PERMISSIONS } from '../constants/permissions'
import { useAdminSession } from './useAdminSession'

export function useProviderBookings(providerId) {
  const { can } = usePermissions()
  const { admin } = useAdminSession()

  const [provider, setProvider] = useState(null)
  const [bookings, setBookings] = useState([])
  const [summary, setSummary] = useState(null)
  const [topServices, setTopServices] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [activeTab, setActiveTab] = useState('all') // 'all', 'upcoming', 'ongoing', 'completed', 'cancelled', 'disputed'
  const [searchQuery, setSearchQuery] = useState('')
  const [service, setService] = useState('all')
  const [bookingSource, setBookingSource] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')
  const [escrowStatus, setEscrowStatus] = useState('all')
  const [dateRange, setDateRange] = useState('all')

  // Pagination & Multi-Select
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Drawer
  const [selectedBooking, setSelectedBooking] = useState(null)

  // Earnings Chart
  const [chartPeriod, setChartPeriod] = useState('30d')
  const [chartPoints, setChartPoints] = useState([])
  const [chartLoading, setChartLoading] = useState(false)

  // Permission check for financial amounts
  const canSeeFinancial =
    can(PERMISSIONS.FINANCE_VIEW) ||
    can('finance.view') ||
    admin?.role === 'super_admin' ||
    admin?.role === 'finance_admin'

  // Fetch bookings data
  const fetchBookings = useCallback(async () => {
    if (!providerId) return
    setLoading(true)
    setError(null)
    try {
      const data = await providerService.getProviderBookings({
        providerId,
        tab: activeTab,
        search: searchQuery,
        service,
        bookingSource,
        paymentStatus,
        escrowStatus,
        dateRange,
      })

      if (data) {
        setBookings(data.bookings || [])
        if (data.provider) setProvider(data.provider)
        if (data.summary) setSummary(data.summary)
        if (data.topServices) setTopServices(data.topServices)
        if (data.recentTransactions) setRecentTransactions(data.recentTransactions)

        // Keep drawer synchronized if selected
        if (selectedBooking) {
          const match = (data.bookings || []).find((b) => b.id === selectedBooking.id || b.bookingId === selectedBooking.bookingId)
          if (match) setSelectedBooking(match)
        }
      }
    } catch (err) {
      console.error('[useProviderBookings] Error fetching bookings:', err)
      setError(err?.message || 'Failed to load provider bookings.')
    } finally {
      setLoading(false)
    }
  }, [providerId, activeTab, searchQuery, service, bookingSource, paymentStatus, escrowStatus, dateRange, selectedBooking])

  // Fetch chart data
  const fetchChart = useCallback(async (period) => {
    setChartLoading(true)
    try {
      const res = await providerService.getProviderEarningsChart(period, providerId)
      if (res && res.points) {
        setChartPoints(res.points)
      }
    } catch (err) {
      console.error('[useProviderBookings] Chart fetch error:', err)
    } finally {
      setChartLoading(false)
    }
  }, [providerId])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  useEffect(() => {
    fetchChart(chartPeriod)
  }, [fetchChart, chartPeriod])

  // Multi-Select
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(bookings.map((b) => b.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Clear filters
  const handleClearFilters = () => {
    setActiveTab('all')
    setSearchQuery('')
    setService('all')
    setBookingSource('all')
    setPaymentStatus('all')
    setEscrowStatus('all')
    setDateRange('all')
    setPage(1)
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (service !== 'all') count++
    if (bookingSource !== 'all') count++
    if (paymentStatus !== 'all') count++
    if (escrowStatus !== 'all') count++
    if (dateRange !== 'all') count++
    if (searchQuery.trim()) count++
    return count
  }, [service, bookingSource, paymentStatus, escrowStatus, dateRange, searchQuery])

  // Paginated bookings slice
  const paginatedBookings = useMemo(() => {
    const start = (page - 1) * pageSize
    return bookings.slice(start, start + pageSize)
  }, [bookings, page, pageSize])

  return {
    provider,
    bookings,
    paginatedBookings,
    summary,
    topServices,
    recentTransactions,
    loading,
    error,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    service,
    setService,
    bookingSource,
    setBookingSource,
    paymentStatus,
    setPaymentStatus,
    escrowStatus,
    setEscrowStatus,
    dateRange,
    setDateRange,
    activeFiltersCount,
    handleClearFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    selectedIds,
    handleSelectAll,
    handleToggleSelect,
    selectedBooking,
    setSelectedBooking,
    chartPeriod,
    setChartPeriod,
    chartPoints,
    chartLoading,
    canSeeFinancial,
    refetch: fetchBookings,
  }
}

