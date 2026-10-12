import { useState, useEffect } from 'react'
import { Navigate, useParams, useNavigate } from 'react-router'
import { providerService } from '../../services/providerService'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

import { useProviderServices } from '../../hooks/useProviderServices'
import { ProviderServicesHeader } from '../../components/providers/services/ProviderServicesHeader'
import { ServicesSummaryKpiCards } from '../../components/providers/services/ServicesSummaryKpiCards'
import { ServiceFilterBar } from '../../components/providers/services/ServiceFilterBar'
import { ServicesTable } from '../../components/providers/services/ServicesTable'
import { ServiceDetailDrawer } from '../../components/providers/services/ServiceDetailDrawer'
import { ServiceModerationModal } from '../../components/providers/services/ServiceModerationModal'

export default function ProviderServices() {
  const { providerId: routeProviderId } = useParams()
  const navigate = useNavigate()

  // /providers/services without a provider opens the directory (demo mode keeps its sample provider).
  const providerId = routeProviderId && routeProviderId !== 'services' ? routeProviderId : providerService.isMock ? 'PR-82941' : null


  const {
    provider,
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
  } = useProviderServices(providerId)

  // Header data comes from the backend's provider record.
  const providerMetadata = provider ? { ...provider, id: providerId } : { id: providerId }

  // Moderation Modal state
  const [moderatingService, setModeratingService] = useState(null)

  // Floating Toast notification
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleOpenModeration = (service) => {
    setModeratingService(service)
  }

  const handleModerateSubmit = async (payload) => {
    await moderateService(payload)
  }

  if (!providerId) return <Navigate to="/providers/all" replace />

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold text-white ${
              toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="size-4 text-rose-300" />
            ) : (
              <CheckCircle2 className="size-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 text-white/70 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Page Layout Container */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-6">
        {/* 1. Header Section */}
        <ProviderServicesHeader
          provider={providerMetadata}
          providerId={providerId}
        />

        {/* 2. Top Summary KPI Cards */}
        <ServicesSummaryKpiCards stats={stats || {}} />

        {/* 3. Filter Bar (Status Tabs, Search, Filters) */}
        <ServiceFilterBar
          stats={stats || {}}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          category={category}
          onCategoryChange={setCategory}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          availability={availability}
          onAvailabilityChange={setAvailability}
          status={status}
          onStatusChange={setStatus}
          activeFiltersCount={activeFiltersCount}
          onClearFilters={handleClearFilters}
        />

        {/* 4. Table + Right Detail Drawer */}
        <div className="flex flex-col xl:flex-row items-start gap-6">
          {/* Main Table Panel */}
          <div className="flex-1 w-full min-w-0">
            {error ? (
              <div className="p-8 rounded-2xl bg-white border border-rose-200 text-center space-y-3">
                <AlertCircle className="size-8 text-rose-500 mx-auto" />
                <p className="font-semibold text-rose-900 text-sm">Failed to load services</p>
                <p className="text-xs text-rose-600">{error}</p>
              </div>
            ) : (
              <ServicesTable
                services={services}
                loading={loading}
                selectedService={selectedService}
                onSelectService={setSelectedService}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onToggleSelect={handleToggleSelect}
                page={page}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                totalCount={stats?.totalCount ?? 0}
                onShowToast={showToast}
              />
            )}
          </div>

          {/* Right-Side Service Detail Drawer */}
          {selectedService && (
            <ServiceDetailDrawer
              service={selectedService}
              onClose={() => setSelectedService(null)}
              onOpenModeration={handleOpenModeration}
              onToggleStatus={toggleServiceStatus}
              onShowToast={showToast}
              providerType={providerMetadata.providerType}
            />
          )}
        </div>
      </div>

      {/* Moderation Review Modal */}
      {moderatingService && (
        <ServiceModerationModal
          isOpen={Boolean(moderatingService)}
          onClose={() => setModeratingService(null)}
          service={moderatingService}
          onModerate={handleModerateSubmit}
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}
    </div>
  )
}

