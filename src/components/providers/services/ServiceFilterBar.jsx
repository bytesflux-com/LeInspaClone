import { Search, SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react'

export function ServiceFilterBar({
  activeTab,
  onSelectTab,
  stats = {},
  searchQuery,
  onSearchChange,
  category,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  availability,
  onAvailabilityChange,
  status,
  onStatusChange,
  onClearFilters,
  activeFiltersCount,
  onOpenMoreFilters,
}) {
  const tabs = [
    { id: 'all', label: `All (${stats.totalCount ?? 9})` },
    { id: 'active', label: `Active (${stats.activeCount ?? 6})` },
    { id: 'inactive', label: `Inactive (${stats.inactiveCount ?? 1})` },
    { id: 'pending_review', label: `Pending Review (${stats.pendingReviewCount ?? 2})` },
    { id: 'changes_requested', label: `Changes Requested (${stats.changesRequestedCount ?? 0})` },
  ]

  return (
    <div className="space-y-3">
      {/* 1. Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/90 pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                isActive
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 2. Search & Dropdown Filter Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search service name, category or service ID..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-600 focus:outline-hidden shadow-2xs"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:border-purple-600 focus:outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="all">Category: All</option>
              <option value="Massage">Massage</option>
              <option value="Hydrotherapy">Hydrotherapy</option>
              <option value="Facials">Facials</option>
              <option value="Specialty">Specialty</option>
              <option value="Packages">Packages</option>
              <option value="Mind & Body">Mind & Body</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          </div>

          {/* Price Range Dropdown */}
          <div className="relative">
            <select
              value={priceRange}
              onChange={(e) => onPriceRangeChange(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:border-purple-600 focus:outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="all">Price Range: All</option>
              <option value="under_4000">Under KES 4,000</option>
              <option value="4000_6000">KES 4,000 – KES 6,000</option>
              <option value="above_6000">Above KES 6,000</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          </div>

          {/* Availability Dropdown */}
          <div className="relative">
            <select
              value={availability}
              onChange={(e) => onAvailabilityChange(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:border-purple-600 focus:outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="all">Availability: All</option>
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:border-purple-600 focus:outline-hidden cursor-pointer shadow-2xs"
            >
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          </div>

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              title="Reset Filters"
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}

          {/* More Filters Button */}
          <button
            type="button"
            onClick={onOpenMoreFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-purple-200 bg-purple-50 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition shadow-2xs"
          >
            <SlidersHorizontal className="size-3.5" />
            <span>More Filters</span>
          </button>
        </div>
      </div>
    </div>
  )
}

