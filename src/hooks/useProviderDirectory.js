import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useMarketContext } from './useMarketContext'
import { providerService } from '../services/providerService'

export function useProviderDirectory() {
  const { selectedMarket } = useMarketContext()
  const currentMarket = selectedMarket
  const [searchParams, setSearchParams] = useSearchParams()

  // Read initial states from URL query params
  const initialType = searchParams.get('type') || 'all'
  const initialSubcategory = searchParams.get('subcategory') || 'all'
  const initialStatus = searchParams.get('status') || 'all'
  const initialSearch = searchParams.get('q') || ''

  // Filter States
  const [providerType, setProviderType] = useState(initialType)
  const [subcategory, setSubcategory] = useState(initialSubcategory)
  const [status, setStatus] = useState(initialStatus)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [verification, setVerification] = useState('all')
  const [location, setLocation] = useState('all')
  const [availability, setAvailability] = useState('all')
  const [subscription, setSubscription] = useState('all')
  const [minRating, setMinRating] = useState(0)
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Selection & Modal States
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isAddProviderModalOpen, setIsAddProviderModalOpen] = useState(false)
  const [isAccountActionsModalOpen, setIsAccountActionsModalOpen] = useState(false)
  const [accountActionTarget, setAccountActionTarget] = useState(null)

  // Data States
  const [data, setData] = useState({
    items: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
    typeCounts: { all: 24860, professionals: 20260, spa: 3820, hotel_resort: 780 },
    statusCounts: { all: 24860, active: 21420, pending: 428, under_review: 310, suspended: 64, inactive: 2638 },
    displayTotalCount: 24860,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch Providers
  const fetchProviders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await providerService.listProviders({
        market: currentMarket?.id || 'ALL',
        providerType,
        subcategory,
        status,
        searchQuery,
        verification,
        location,
        availability,
        subscription,
        minRating,
        sortBy,
        page,
        pageSize,
      })

      setData(result)

      // If a provider was already selected, update its reference from the new dataset if found
      if (selectedProvider) {
        const updated = result.items.find((p) => p.id === selectedProvider.id)
        if (updated) setSelectedProvider(updated)
      } else if (result.items.length > 0 && !selectedProvider) {
        // Mockup shows Grace Njeri open by default on desktop for instant preview!
        const defaultGrace = result.items.find((p) => p.id === 'PR-82941')
        if (defaultGrace) {
          setSelectedProvider(defaultGrace)
        }
      }
    } catch (err) {
      console.error('[useProviderDirectory] fetch error:', err)
      setError(err?.message || 'Failed to fetch provider directory')
    } finally {
      setLoading(false)
    }
  }, [
    currentMarket?.id,
    providerType,
    subcategory,
    status,
    searchQuery,
    verification,
    location,
    availability,
    subscription,
    minRating,
    sortBy,
    page,
    pageSize,
    selectedProvider,
  ])

  // Refetch when dependencies change
  useEffect(() => {
    fetchProviders()
  }, [
    currentMarket?.id,
    providerType,
    subcategory,
    status,
    searchQuery,
    verification,
    location,
    availability,
    subscription,
    minRating,
    sortBy,
    page,
    pageSize,
  ])

  // Sync to URL parameters for shareable search
  useEffect(() => {
    const params = {}
    if (providerType !== 'all') params.type = providerType
    if (subcategory !== 'all') params.subcategory = subcategory
    if (status !== 'all') params.status = status
    if (searchQuery) params.q = searchQuery
    if (currentMarket?.id && currentMarket?.id !== 'ALL') params.market = currentMarket.id
    setSearchParams(params, { replace: true })
  }, [providerType, subcategory, status, searchQuery, currentMarket?.id, setSearchParams])

  // Handlers
  const handleSelectProvider = (provider) => {
    setSelectedProvider(provider)
  }

  const handleCloseDrawer = () => {
    setSelectedProvider(null)
  }

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === data.items.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(data.items.map((i) => i.id))
    }
  }

  const handleClearFilters = () => {
    setProviderType('all')
    setSubcategory('all')
    setStatus('all')
    setSearchQuery('')
    setVerification('all')
    setLocation('all')
    setAvailability('all')
    setSubscription('all')
    setMinRating(0)
    setSortBy('newest')
    setPage(1)
    setSelectedIds([])
  }

  const handleOpenAccountActions = (provider) => {
    setAccountActionTarget(provider || selectedProvider)
    setIsAccountActionsModalOpen(true)
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (verification !== 'all') count++
    if (location !== 'all') count++
    if (availability !== 'all') count++
    if (subscription !== 'all') count++
    if (minRating > 0) count++
    return count
  }, [verification, location, availability, subscription, minRating])

  return {
    market: currentMarket,
    data,
    loading,
    error,
    providerType,
    setProviderType,
    subcategory,
    setSubcategory,
    status,
    setStatus,
    searchQuery,
    setSearchQuery,
    verification,
    setVerification,
    location,
    setLocation,
    availability,
    setAvailability,
    subscription,
    setSubscription,
    minRating,
    setMinRating,
    sortBy,
    setSortBy,
    page,
    setPage,
    pageSize,
    setPageSize,
    selectedIds,
    setSelectedIds,
    selectedProvider,
    handleSelectProvider,
    handleCloseDrawer,
    handleToggleSelect,
    handleSelectAll,
    handleClearFilters,
    isAdvancedFilterOpen,
    setIsAdvancedFilterOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    isAddProviderModalOpen,
    setIsAddProviderModalOpen,
    isAccountActionsModalOpen,
    setIsAccountActionsModalOpen,
    accountActionTarget,
    handleOpenAccountActions,
    activeFiltersCount,
    refetch: fetchProviders,
  }
}
