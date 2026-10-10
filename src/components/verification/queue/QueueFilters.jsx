import { useState } from 'react'
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react'

/**
 * QueueFilters (ADM-030)
 * 2-row toolbar with comprehensive multi-criteria filtering, status tabs, and priority sorting.
 */
export default function QueueFilters({
  searchTerm = '',
  onSearchChange,
  filters = {},
  onFilterChange,
  statusCounts = {},
  activeStatus = 'ALL',
  onSelectStatus,
  sortBy = 'priority',
  onSortChange,
}) {
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  // Status Tab Items
  const statusTabs = [
    { id: 'ALL', label: 'All', count: statusCounts.all ?? 428 },
    { id: 'AWAITING_REVIEW', label: 'New', count: statusCounts.new ?? 196 },
    { id: 'UNDER_REVIEW', label: 'Under Review', count: statusCounts.underReview ?? 86 },
    { id: 'RESUBMITTED', label: 'Resubmitted', count: statusCounts.resubmitted ?? 46 },
    { id: 'CHANGES_REQUESTED', label: 'Changes Requested', count: statusCounts.changesRequested ?? 112 },
    { id: 'ESCALATED', label: 'Escalated', count: statusCounts.escalated ?? 7 },
  ]

  // Sort Options
  const sortOptions = [
    { value: 'priority', label: 'Priority First' },
    { value: 'waiting', label: 'Longest Waiting' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'resubmitted', label: 'Recently Resubmitted' },
    { value: 'unassigned', label: 'Unassigned First' },
  ]

  const hasActiveFilters = Boolean(
    searchTerm ||
    (filters.priority && filters.priority !== 'ALL') ||
    (filters.providerType && filters.providerType !== 'ALL') ||
    (filters.verificationType && filters.verificationType !== 'ALL') ||
    (filters.marketId && filters.marketId !== 'ALL') ||
    (filters.assignedTo && filters.assignedTo !== 'ALL') ||
    (filters.dateRange && filters.dateRange !== 'ALL') ||
    filters.overdueOnly
  )

  const handleResetFilters = () => {
    onSearchChange?.('')
    onFilterChange?.({
      priority: 'ALL',
      providerType: 'ALL',
      verificationType: 'ALL',
      marketId: 'ALL',
      assignedTo: 'ALL',
      dateRange: 'ALL',
      overdueOnly: false,
    })
  }

  return (
    <div className="space-y-3.5">
      {/* ROW 1: Search + Dropdown Filter Pills + More Filters Toggle */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative min-w-[260px] flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search provider, Provider ID, business..."
            className="w-full rounded-xl border border-slate-200/90 bg-white py-2 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs transition focus:border-[#6D28D9] focus:outline-hidden focus:ring-2 focus:ring-[#6D28D9]/15"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Priority Filter Pill */}
        <select
          value={filters.priority || 'ALL'}
          onChange={(e) => onFilterChange?.({ ...filters, priority: e.target.value })}
          className={`h-9 rounded-xl border px-3 text-xs font-medium transition cursor-pointer shadow-2xs focus:outline-hidden ${
            filters.priority && filters.priority !== 'ALL'
              ? 'border-purple-300 bg-purple-50 text-purple-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <option value="ALL">All Priorities</option>
          <option value="URGENT">🔴 Urgent Priority</option>
          <option value="HIGH">🟠 High Priority</option>
          <option value="NORMAL">🟣 Normal Priority</option>
        </select>

        {/* Provider Type Pill */}
        <select
          value={filters.providerType || 'ALL'}
          onChange={(e) => onFilterChange?.({ ...filters, providerType: e.target.value })}
          className={`h-9 rounded-xl border px-3 text-xs font-medium transition cursor-pointer shadow-2xs focus:outline-hidden ${
            filters.providerType && filters.providerType !== 'ALL'
              ? 'border-purple-300 bg-purple-50 text-purple-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <option value="ALL">Provider Type</option>
          <option value="INDIVIDUAL">Individual Professional</option>
          <option value="SPA_WELLNESS">Spa & Wellness Center</option>
          <option value="HOTEL_RESORT">Hotel & Resort</option>
        </select>

        {/* Verification Type Pill */}
        <select
          value={filters.verificationType || 'ALL'}
          onChange={(e) => onFilterChange?.({ ...filters, verificationType: e.target.value })}
          className={`h-9 rounded-xl border px-3 text-xs font-medium transition cursor-pointer shadow-2xs focus:outline-hidden ${
            filters.verificationType && filters.verificationType !== 'ALL'
              ? 'border-purple-300 bg-purple-50 text-purple-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <option value="ALL">Verification Type</option>
          <option value="Credentials">Credentials</option>
          <option value="Business Docs">Business Docs</option>
          <option value="Property">Property Verification</option>
          <option value="Identity">Identity</option>
          <option value="Location">Location</option>
        </select>

        {/* Market Pill */}
        <select
          value={filters.marketId || 'ALL'}
          onChange={(e) => onFilterChange?.({ ...filters, marketId: e.target.value })}
          className={`h-9 rounded-xl border px-3 text-xs font-medium transition cursor-pointer shadow-2xs focus:outline-hidden ${
            filters.marketId && filters.marketId !== 'ALL'
              ? 'border-purple-300 bg-purple-50 text-purple-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <option value="ALL">All Markets</option>
          <option value="KE">Kenya 🇰🇪</option>
          <option value="UG">Uganda 🇺🇬</option>
          <option value="TZ">Tanzania 🇹🇿</option>
          <option value="ZA">South Africa 🇿🇦</option>
          <option value="MA">Morocco 🇲🇦</option>
        </select>

        {/* Assigned Admin Pill */}
        <select
          value={filters.assignedTo || 'ALL'}
          onChange={(e) => onFilterChange?.({ ...filters, assignedTo: e.target.value })}
          className={`h-9 rounded-xl border px-3 text-xs font-medium transition cursor-pointer shadow-2xs focus:outline-hidden ${
            filters.assignedTo && filters.assignedTo !== 'ALL'
              ? 'border-purple-300 bg-purple-50 text-purple-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <option value="ALL">Assigned Admin</option>
          <option value="UNASSIGNED">Unassigned</option>
          <option value="Jane Ochieng">Jane Ochieng</option>
          <option value="Peter Mwangi">Peter Mwangi</option>
          <option value="Mary Akinyi">Mary Akinyi</option>
          <option value="John Kamau">John Kamau</option>
          <option value="Compliance Team">Compliance Team</option>
        </select>

        {/* Submitted Date Pill */}
        <select
          value={filters.dateRange || 'ALL'}
          onChange={(e) => onFilterChange?.({ ...filters, dateRange: e.target.value })}
          className={`h-9 rounded-xl border px-3 text-xs font-medium transition cursor-pointer shadow-2xs focus:outline-hidden ${
            filters.dateRange && filters.dateRange !== 'ALL'
              ? 'border-purple-300 bg-purple-50 text-purple-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <option value="ALL">Submitted Date</option>
          <option value="TODAY">Today</option>
          <option value="7_DAYS">Last 7 Days</option>
          <option value="30_DAYS">Last 30 Days</option>
        </select>

        {/* More Filters Toggle */}
        <button
          type="button"
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition shadow-2xs ${
            showMoreFilters || filters.overdueOnly
              ? 'border-purple-300 bg-[#F4F0FF] text-[#6D28D9]'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="size-3.5" />
          <span>More Filters</span>
          {filters.overdueOnly && (
            <span className="size-1.5 rounded-full bg-rose-500" />
          )}
        </button>

        {/* Reset Filters Link */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex h-9 items-center gap-1 rounded-xl px-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* EXPANDABLE MORE FILTERS BAR */}
      {showMoreFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-purple-100 bg-[#F9F7FE] p-3 text-xs text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={Boolean(filters.overdueOnly)}
              onChange={(e) =>
                onFilterChange?.({ ...filters, overdueOnly: e.target.checked })
              }
              className="size-4 rounded text-[#6D28D9] focus:ring-[#6D28D9]"
            />
            <span className="flex items-center gap-1 text-rose-700 font-semibold">
              <AlertTriangle className="size-3.5 text-rose-500" />
              <span>Overdue SLA Submissions Only</span>
            </span>
          </label>

          <span className="text-slate-300">|</span>

          <span className="text-[11px] text-slate-500">
            Filtered view updates immediately across all sovereign markets.
          </span>
        </div>
      )}

      {/* ROW 2: Status Pills + Right Sort Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-3">
        {/* Status Tab Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {statusTabs.map((tab) => {
            const isActive = activeStatus === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectStatus?.(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#6D28D9] text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-white text-slate-600 border border-slate-200/80'
                  }`}
                >
                  {tab.count.toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Sort:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange?.(e.target.value)}
              className="h-8.5 rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 transition focus:outline-hidden cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
