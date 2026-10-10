import {
  Search,
  SlidersHorizontal,
  Download,
  Filter,
  X,
} from 'lucide-react'

export function BookingFilterBar({
  summary,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  service,
  onServiceChange,
  bookingSource,
  onBookingSourceChange,
  paymentStatus,
  onPaymentStatusChange,
  escrowStatus,
  onEscrowStatusChange,
  dateRange,
  onDateRangeChange,
  activeFiltersCount,
  onClearFilters,
  onExport,
}) {
  const counts = summary?.counts || {}

  const tabs = [
    { id: 'all', label: 'All', count: counts.total ?? 284 },
    { id: 'upcoming', label: 'Upcoming', count: counts.upcoming ?? 12 },
    { id: 'ongoing', label: 'Ongoing', count: counts.ongoing ?? 3 },
    { id: 'completed', label: 'Completed', count: counts.completed ?? 268 },
    { id: 'cancelled', label: 'Cancelled', count: counts.cancelled ?? 4 },
    { id: 'disputed', label: 'Disputed', count: counts.disputed ?? 2 },
  ]

  return (
    <div className="space-y-3">
      {/* 1. Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/90 pb-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search booking ID, client or service…"
            className="w-full pl-9.5 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Middle/Right: Dropdowns and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Date Filter */}
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:border-purple-600 shadow-2xs"
          >
            <option value="all">Date ▾</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_30_days">Last 30 Days</option>
          </select>

          {/* Service Filter */}
          <select
            value={service}
            onChange={(e) => onServiceChange(e.target.value)}
            className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:border-purple-600 shadow-2xs"
          >
            <option value="all">Service ▾</option>
            <option value="Deep Tissue">Deep Tissue Massage</option>
            <option value="Swedish">Swedish Massage</option>
            <option value="Sports">Sports Massage</option>
            <option value="Aromatherapy">Aromatherapy Massage</option>
            <option value="Prenatal">Prenatal Massage</option>
          </select>

          {/* Booking Source Filter */}
          <select
            value={bookingSource}
            onChange={(e) => onBookingSourceChange(e.target.value)}
            className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:border-purple-600 shadow-2xs"
          >
            <option value="all">Booking Source ▾</option>
            <option value="App">App (Client)</option>
            <option value="Web">Web Portal</option>
            <option value="Concierge">Concierge / Desk</option>
            <option value="Walk-In">Walk-In / Manual</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentStatus}
            onChange={(e) => onPaymentStatusChange(e.target.value)}
            className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:border-purple-600 shadow-2xs"
          >
            <option value="all">Payment Status ▾</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Escrow Status Filter */}
          <select
            value={escrowStatus}
            onChange={(e) => onEscrowStatusChange(e.target.value)}
            className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:border-purple-600 shadow-2xs"
          >
            <option value="all">Escrow Status ▾</option>
            <option value="held">Held</option>
            <option value="released">Released</option>
            <option value="disputed">Disputed</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Clear Filters (if active) */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 font-semibold transition"
            >
              <X className="size-3.5" />
              <span>Clear ({activeFiltersCount})</span>
            </button>
          )}

          {/* Export CTA */}
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/70 text-purple-700 hover:bg-purple-100 font-semibold transition shadow-2xs"
          >
            <Download className="size-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  )
}

