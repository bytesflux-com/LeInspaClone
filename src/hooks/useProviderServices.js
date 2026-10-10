import { useState, useEffect, useCallback, useMemo } from 'react'
import { providerService } from '../services/providerService'
import { usePermissions } from './usePermissions'
import { PERMISSIONS } from '../constants/permissions'
import { useAdminSession } from './useAdminSession'

export function useProviderServices(providerId = 'PR-82941') {
  const { can } = usePermissions()
  const { admin } = useAdminSession()

  const [services, setServices] = useState([])
  const [stats, setStats] = useState({
    activeCount: 6,
    inactiveCount: 1,
    pendingReviewCount: 2,
    changesRequestedCount: 0,
    totalCount: 9,
    averagePrice: 4250,
    averagePriceFormatted: 'KES 4,250',
    lowestPrice: 3000,
    lowestPriceFormatted: 'KES 3,000',
    highestPrice: 6500,
    highestPriceFormatted: 'KES 6,500',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Search
  const [activeTab, setActiveTab] = useState('all') // 'all', 'active', 'inactive', 'pending_review', 'changes_requested'
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [availability, setAvailability] = useState('all')
  const [status, setStatus] = useState('all')

  // Pagination & Selection
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Detail Drawer
  const [selectedService, setSelectedService] = useState(null)

  const canModerate = can(PERMISSIONS.PROVIDERS_VERIFY) || can('providers.verify') || admin?.role === 'super_admin'

  const fetchServices = useCallback(async () => {
    if (!providerId) return
    setLoading(true)
    setError(null)
    try {
      const data = await providerService.getProviderServices({
        providerId,
        tab: activeTab,
        search: searchQuery,
        category,
        priceRange,
        availability,
        status,
        page,
        pageSize,
      })

      if (data) {
        setServices(data.services || [])
        if (data.stats) setStats(data.stats)
        // If drawer is open, keep selected service synchronized
        if (selectedService) {
          const updated = (data.services || []).find((s) => s.id === selectedService.id || s.serviceId === selectedService.serviceId)
          if (updated) setSelectedService(updated)
        }
      }
    } catch (err) {
      console.error('[useProviderServices] Error fetching services:', err)
      setError(err?.message || 'Failed to load provider services.')
    } finally {
      setLoading(false)
    }
  }, [providerId, activeTab, searchQuery, category, priceRange, availability, status, page, pageSize, selectedService])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  // Select / Deselect All
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(services.map((s) => s.id)))
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

  // Clear all filters
  const handleClearFilters = () => {
    setActiveTab('all')
    setSearchQuery('')
    setCategory('all')
    setPriceRange('all')
    setAvailability('all')
    setStatus('all')
    setPage(1)
  }

  // Moderate service proposed changes
  const moderateService = async ({
    serviceId,
    action, // 'approve', 'request_changes', 'reject'
    reasonCode,
    reasonLabel,
    messageToProvider,
    adminNote,
  }) => {
    try {
      await providerService.moderateProviderService({
        providerId,
        serviceId,
        action,
        reasonCode,
        reasonLabel,
        messageToProvider,
        adminNote,
      })

      setServices((prev) =>
        prev.map((s) => {
          if (s.id === serviceId || s.serviceId === serviceId) {
            if (action === 'approve') {
              return {
                ...s,
                description: s.proposedChanges?.newDescription || s.description,
                image: s.proposedChanges?.newImage || s.image,
                price: s.proposedChanges?.newPrice || s.price,
                hasPendingChanges: false,
                proposedChanges: null,
                reviewStatus: 'approved',
                approvalStatus: 'approved',
                contentReview: {
                  ...s.contentReview,
                  description: 'Approved',
                  serviceImage: 'Approved',
                },
              }
            } else if (action === 'request_changes') {
              return {
                ...s,
                reviewStatus: 'changes_requested',
                approvalStatus: 'changes_requested',
                contentReview: {
                  ...s.contentReview,
                  description: 'Changes Required',
                },
              }
            } else {
              return {
                ...s,
                hasPendingChanges: false,
                proposedChanges: null,
                reviewStatus: 'rejected',
                approvalStatus: 'rejected',
              }
            }
          }
          return s
        }),
      )

      if (selectedService && (selectedService.id === serviceId || selectedService.serviceId === serviceId)) {
        setSelectedService((prev) => ({
          ...prev,
          approvalStatus: action === 'approve' ? 'approved' : action === 'request_changes' ? 'changes_requested' : 'rejected',
          reviewStatus: action === 'approve' ? 'approved' : action === 'request_changes' ? 'changes_requested' : 'rejected',
          hasPendingChanges: action === 'approve' ? false : prev.hasPendingChanges,
        }))
      }

      return { success: true }
    } catch (err) {
      console.error('Error moderating service:', err)
      throw err
    }
  }

  // Toggle active status
  const toggleServiceStatus = async (serviceId, active) => {
    try {
      await providerService.updateProviderServiceStatus({
        providerId,
        serviceId,
        active,
      })

      setServices((prev) =>
        prev.map((s) => {
          if (s.id === serviceId || s.serviceId === serviceId) {
            return {
              ...s,
              active,
              status: active ? 'active' : 'inactive',
            }
          }
          return s
        }),
      )

      if (selectedService && (selectedService.id === serviceId || selectedService.serviceId === serviceId)) {
        setSelectedService((prev) => ({
          ...prev,
          active,
          status: active ? 'active' : 'inactive',
        }))
      }
      return { success: true }
    } catch (err) {
      console.error('Error toggling status:', err)
      throw err
    }
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (category !== 'all') count++
    if (priceRange !== 'all') count++
    if (availability !== 'all') count++
    if (status !== 'all') count++
    if (searchQuery.trim()) count++
    return count
  }, [category, priceRange, availability, status, searchQuery])

  return {
    services,
    stats,
    loading,
    error,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    category,
    setCategory,
    priceRange,
    setPriceRange,
    availability,
    setAvailability,
    status,
    setStatus,
    activeFiltersCount,
    handleClearFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    selectedIds,
    handleSelectAll,
    handleToggleSelect,
    selectedService,
    setSelectedService,
    canModerate,
    moderateService,
    toggleServiceStatus,
    refetch: fetchServices,
  }
}

