import { useProviderDirectory } from '../../hooks/useProviderDirectory'
import { DirectoryHeader } from '../../components/providers/directory/DirectoryHeader'
import { ProviderTypeTabs } from '../../components/providers/directory/ProviderTypeTabs'
import { DirectorySearchBar } from '../../components/providers/directory/DirectorySearchBar'
import { QuickStatusTabs } from '../../components/providers/directory/QuickStatusTabs'
import { DirectoryFilterRow } from '../../components/providers/directory/DirectoryFilterRow'
import { ProviderDirectoryTable } from '../../components/providers/directory/ProviderDirectoryTable'
import { QuickProviderPreviewDrawer } from '../../components/providers/directory/QuickProviderPreviewDrawer'
import { DirectoryPagination } from '../../components/providers/directory/DirectoryPagination'
import { BulkActionsBar } from '../../components/providers/directory/BulkActionsBar'
import { AdvancedFiltersDrawer } from '../../components/providers/directory/AdvancedFiltersDrawer'
import { AddProviderModal } from '../../components/providers/directory/AddProviderModal'
import { ProviderActionsModal } from '../../components/providers/directory/ProviderActionsModal'
import { DirectoryExportModal } from '../../components/providers/directory/DirectoryExportModal'

export default function ProviderDirectory() {
  const {
    market,
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
    refetch,
  } = useProviderDirectory()

  const handleFilterChange = (key, value) => {
    switch (key) {
      case 'providerType':
        setProviderType(value)
        break
      case 'verification':
        setVerification(value)
        break
      case 'location':
        setLocation(value)
        break
      case 'availability':
        setAvailability(value)
        break
      case 'subscription':
        setSubscription(value)
        break
      case 'minRating':
        setMinRating(value)
        break
      case 'sortBy':
        setSortBy(value)
        break
      default:
        break
    }
  }

  const handleApplyAdvancedFilters = (advFilters) => {
    if (advFilters.entityType && advFilters.entityType !== 'all') {
      setProviderType(advFilters.entityType)
    }
    if (advFilters.accountStatus && advFilters.accountStatus !== 'all') {
      setStatus(advFilters.accountStatus)
    }
    if (advFilters.verificationStatus && advFilters.verificationStatus !== 'all') {
      setVerification(advFilters.verificationStatus)
    }
    if (advFilters.city && advFilters.city !== 'all') {
      setLocation(advFilters.city)
    }
    if (advFilters.minRating) {
      setMinRating(advFilters.minRating)
    }
    if (advFilters.availableNowOnly) {
      setAvailability('available_now')
    }
    refetch()
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Header */}
      <DirectoryHeader
        totalProviders={data.displayTotalCount}
        onExport={() => setIsExportModalOpen(true)}
        onAddProvider={() => setIsAddProviderModalOpen(true)}
      />

      {/* 2. Provider Type Tabs (4 Cards + Subcategories) */}
      <ProviderTypeTabs
        providerType={providerType}
        subcategory={subcategory}
        typeCounts={data.typeCounts}
        onSelectType={setProviderType}
        onSelectSubcategory={setSubcategory}
      />

      {/* 3. Search Bar */}
      <DirectorySearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAdvancedFilters={() => setIsAdvancedFilterOpen(true)}
        activeFiltersCount={activeFiltersCount}
      />

      {/* 4. Quick Status Tabs */}
      <QuickStatusTabs
        status={status}
        statusCounts={data.statusCounts}
        onSelectStatus={setStatus}
      />

      {/* 5. Dropdown Filter Row */}
      <DirectoryFilterRow
        providerType={providerType}
        verification={verification}
        location={location}
        availability={availability}
        subscription={subscription}
        minRating={minRating}
        sortBy={sortBy}
        onFilterChange={handleFilterChange}
        onOpenAdvancedFilters={() => setIsAdvancedFilterOpen(true)}
        onResetFilters={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {/* 6. Main Directory Area: Table + Side Drawer */}
      <div className="flex flex-col xl:flex-row items-start gap-5">
        {/* Table & Pagination Column */}
        <div className="flex-1 w-full min-w-0 space-y-4">
          <ProviderDirectoryTable
            providers={data.items}
            selectedIds={selectedIds}
            activeProviderId={selectedProvider?.id}
            onSelectRow={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onOpenPreview={handleSelectProvider}
            loading={loading}
          />

          <DirectoryPagination
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            totalItems={data.totalItems}
            pageSize={data.pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* 7. Quick Provider Preview Drawer (Slide-Over / Side panel) */}
        {selectedProvider && (
          <QuickProviderPreviewDrawer
            provider={selectedProvider}
            onClose={handleCloseDrawer}
            onOpenAccountActions={handleOpenAccountActions}
          />
        )}
      </div>

      {/* 8. Sticky Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onExportSelected={() => setIsExportModalOpen(true)}
        onNotifySelected={() => alert(`Notification sent to ${selectedIds.length} providers.`)}
        onAssignQueue={() => alert(`Assigned ${selectedIds.length} providers to review queue.`)}
        onAddTag={() => alert(`Tags added to ${selectedIds.length} providers.`)}
      />

      {/* 9. Advanced Filters Drawer */}
      <AdvancedFiltersDrawer
        isOpen={isAdvancedFilterOpen}
        onClose={() => setIsAdvancedFilterOpen(false)}
        onApplyFilters={handleApplyAdvancedFilters}
        onResetFilters={handleClearFilters}
      />

      {/* 10. Add Provider Modal */}
      <AddProviderModal
        isOpen={isAddProviderModalOpen}
        onClose={() => setIsAddProviderModalOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* 11. Account Actions Modal */}
      <ProviderActionsModal
        isOpen={isAccountActionsModalOpen}
        provider={accountActionTarget}
        onClose={() => setIsAccountActionsModalOpen(false)}
        onActionComplete={(act, reason) => {
          alert(`Administrative action '${act}' applied to ${accountActionTarget?.name}: ${reason}`)
          refetch()
        }}
      />

      {/* 12. Audited Export Modal */}
      <DirectoryExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        selectedIds={selectedIds}
        filterParams={{
          market: market?.id || 'ALL',
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
        }}
        totalCount={data.totalItems}
      />
    </div>
  )
}

