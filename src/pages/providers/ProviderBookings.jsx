import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

import { useProviderBookings } from '../../hooks/useProviderBookings'
import { ProviderBookingsHeader } from '../../components/providers/bookings/ProviderBookingsHeader'
import { BookingEarningsKpiCards } from '../../components/providers/bookings/BookingEarningsKpiCards'
import { BookingFilterBar } from '../../components/providers/bookings/BookingFilterBar'
import { BookingsTable } from '../../components/providers/bookings/BookingsTable'
import { SelectedBookingDrawer } from '../../components/providers/bookings/SelectedBookingDrawer'
import { EarningsOverviewCard } from '../../components/providers/bookings/EarningsOverviewCard'
import { EarningsPerformanceChart } from '../../components/providers/bookings/EarningsPerformanceChart'
import { EscrowPositionCard } from '../../components/providers/bookings/EscrowPositionCard'
import { WithdrawalsPositionCard } from '../../components/providers/bookings/WithdrawalsPositionCard'
import { BookingPerformanceCard } from '../../components/providers/bookings/BookingPerformanceCard'
import { TopServicesCard } from '../../components/providers/bookings/TopServicesCard'
import { RecentTransactionsCard } from '../../components/providers/bookings/RecentTransactionsCard'
import { DynamicBusinessMetricsCard } from '../../components/providers/bookings/DynamicBusinessMetricsCard'
import { PROVIDER_BOOKINGS_DATASETS } from '../../services/mock/providerBookingsMock'

export default function ProviderBookings() {
  const { providerId: routeProviderId } = useParams()
  const navigate = useNavigate()

  // Default to PR-82941 (Grace Njeri) if route is /providers/bookings or param is undefined
  const providerId = routeProviderId && routeProviderId !== 'bookings' ? routeProviderId : 'PR-82941'

  // Retrieve provider metadata for header
  const providerMetadata = useMemo(() => {
    const dataset = PROVIDER_BOOKINGS_DATASETS[providerId] || PROVIDER_BOOKINGS_DATASETS['PR-82941']
    return {
      id: providerId,
      name: dataset.providerName,
      providerType: dataset.providerType,
      typeLabel: dataset.providerTypeLabel,
      city: dataset.city,
      country: dataset.country,
      flag: dataset.flag,
      rating: dataset.rating,
      reviewCount: dataset.reviewCount,
      joinedDate: dataset.joinedDate,
      lastActive: dataset.lastActive,
      avatar: dataset.avatar,
      isVerified: dataset.isVerified,
      status: dataset.status,
      availableNow: dataset.availableNow,
      dynamicSpaContext: dataset.dynamicSpaContext,
      dynamicHotelContext: dataset.dynamicHotelContext,
    }
  }, [providerId])

  const {
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
  } = useProviderBookings(providerId)

  // Auto-open first canonical booking (#LI-48291) on desktop initial render to match mockup screenshot
  useEffect(() => {
    if (!selectedBooking && bookings.length > 0) {
      const canonical = bookings.find((b) => b.id === 'LI-48291') || bookings[0]
      setSelectedBooking(canonical)
    }
  }, [bookings, selectedBooking, setSelectedBooking])

  // Toast notifications
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => setToast({ message, type })

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleExport = () => {
    showToast(`Exported ${bookings.length} provider booking records to CSV.`, 'success')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Toast Alert */}
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

      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-6">
        {/* 1. Header */}
        <ProviderBookingsHeader
          provider={providerMetadata}
          providerId={providerId}
          onShowToast={showToast}
        />

        {/* 2. Top Summary KPI Cards (6 cards in a row) */}
        <BookingEarningsKpiCards
          summary={summary}
          canSeeFinancial={canSeeFinancial}
        />

        {/* 3. Booking Status Tabs & Filter Bar */}
        <BookingFilterBar
          summary={summary}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          service={service}
          onServiceChange={setService}
          bookingSource={bookingSource}
          onBookingSourceChange={setBookingSource}
          paymentStatus={paymentStatus}
          onPaymentStatusChange={setPaymentStatus}
          escrowStatus={escrowStatus}
          onEscrowStatusChange={setEscrowStatus}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          activeFiltersCount={activeFiltersCount}
          onClearFilters={handleClearFilters}
          onExport={handleExport}
        />

        {/* 4. Booking Table + Right Selected Booking Drawer */}
        <div className="flex flex-col xl:flex-row items-start gap-6">
          {/* Table Container */}
          <div className="flex-1 w-full min-w-0">
            {error ? (
              <div className="p-8 rounded-2xl bg-white border border-rose-200 text-center space-y-3">
                <AlertCircle className="size-8 text-rose-500 mx-auto" />
                <p className="font-semibold text-rose-900 text-sm">Failed to load bookings</p>
                <p className="text-xs text-rose-600">{error}</p>
              </div>
            ) : (
              <BookingsTable
                bookings={paginatedBookings}
                loading={loading}
                selectedBooking={selectedBooking}
                onSelectBooking={setSelectedBooking}
                selectedIds={selectedIds}
                onSelectAll={handleSelectAll}
                onToggleSelect={handleToggleSelect}
                page={page}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                totalCount={summary?.counts?.total ?? bookings.length}
                canSeeFinancial={canSeeFinancial}
                onShowToast={showToast}
              />
            )}
          </div>

          {/* Right Selected Booking Drawer */}
          {selectedBooking && (
            <SelectedBookingDrawer
              booking={selectedBooking}
              onClose={() => setSelectedBooking(null)}
              canSeeFinancial={canSeeFinancial}
              onShowToast={showToast}
            />
          )}
        </div>

        {/* Dynamic Business Context (Spa or Hotel) */}
        <DynamicBusinessMetricsCard
          provider={providerMetadata}
          canSeeFinancial={canSeeFinancial}
        />

        {/* 5. Lower Operations & Financial Grid */}
        <div className="space-y-4 pt-2">
          {/* Row 1: Earnings Overview, Earnings Chart, Escrow Position */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <EarningsOverviewCard
              financials={summary?.financials}
              canSeeFinancial={canSeeFinancial}
              onShowToast={showToast}
            />

            <EarningsPerformanceChart
              period={chartPeriod}
              onPeriodChange={setChartPeriod}
              points={chartPoints}
              loading={chartLoading}
              canSeeFinancial={canSeeFinancial}
            />

            <EscrowPositionCard
              escrowPositions={summary?.escrowPositions}
              canSeeFinancial={canSeeFinancial}
              onShowToast={showToast}
            />
          </div>

          {/* Row 2: Withdrawals Position, Performance, Top Services */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <WithdrawalsPositionCard
              withdrawalPositions={summary?.withdrawalPositions}
              canSeeFinancial={canSeeFinancial}
              onShowToast={showToast}
            />

            <BookingPerformanceCard
              performance={summary?.performance}
              canSeeFinancial={canSeeFinancial}
            />

            <TopServicesCard
              topServices={topServices}
              providerId={providerId}
              canSeeFinancial={canSeeFinancial}
              onShowToast={showToast}
            />
          </div>

          {/* Row 3: Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <div className="lg:col-span-3">
              <RecentTransactionsCard
                recentTransactions={recentTransactions}
                canSeeFinancial={canSeeFinancial}
                onShowToast={showToast}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

