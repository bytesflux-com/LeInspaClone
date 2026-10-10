import { Search, X, SlidersHorizontal } from 'lucide-react'

export function DirectorySearchBar({
  searchQuery = '',
  onSearchChange,
  onOpenAdvancedFilters,
  activeFiltersCount = 0,
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search provider name, Provider ID, business, email or phone…"
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenAdvancedFilters}
        className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition shadow-xs shrink-0 ${
          activeFiltersCount > 0
            ? 'bg-purple-50 text-purple-700 border-purple-300 ring-2 ring-purple-500/20'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
      >
        <SlidersHorizontal className="w-4 h-4 text-purple-600" />
        <span>Filters</span>
        {activeFiltersCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-purple-700 text-white text-xs flex items-center justify-center font-bold">
            {activeFiltersCount}
          </span>
        )}
      </button>
    </div>
  )
}

