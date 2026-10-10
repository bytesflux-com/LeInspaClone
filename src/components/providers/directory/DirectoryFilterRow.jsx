import { ChevronDown, SlidersHorizontal, RotateCcw } from 'lucide-react'

export function DirectoryFilterRow({
  providerType = 'all',
  verification = 'all',
  location = 'all',
  availability = 'all',
  subscription = 'all',
  minRating = 0,
  sortBy = 'newest',
  onFilterChange,
  onOpenAdvancedFilters,
  onResetFilters,
  activeFiltersCount = 0,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
      <div className="flex flex-wrap items-center gap-2">
        {/* Provider Type */}
        <div className="relative">
          <select
            value={providerType}
            onChange={(e) => onFilterChange('providerType', e.target.value)}
            className="appearance-none pl-3 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer shadow-xs"
          >
            <option value="all">Provider Type: All</option>
            <option value="professionals">All Professionals</option>
            <option value="massage_therapist">Massage Therapists</option>
            <option value="fitness_trainer">Personal Trainers</option>
            <option value="physiotherapy">Physiotherapy & Recovery</option>
            <option value="yoga_specialist">Yoga Specialists</option>
            <option value="meditation_specialist">Meditation Specialists</option>
            <option value="spa">Spas & Wellness</option>
            <option value="hotel_resort">Hotels & Resorts</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Verification */}
        <div className="relative">
          <select
            value={verification}
            onChange={(e) => onFilterChange('verification', e.target.value)}
            className="appearance-none pl-3 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer shadow-xs"
          >
            <option value="all">Verification: All</option>
            <option value="verified">Verified</option>
            <option value="pending_review">Pending Review</option>
            <option value="documents_review">Documents Review</option>
            <option value="content_review">Content Review</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="rejected">Rejected</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Location */}
        <div className="relative">
          <select
            value={location}
            onChange={(e) => onFilterChange('location', e.target.value)}
            className="appearance-none pl-3 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer shadow-xs"
          >
            <option value="all">Location: All</option>
            <option value="nairobi">Nairobi</option>
            <option value="mombasa">Mombasa</option>
            <option value="kisumu">Kisumu</option>
            <option value="nakuru">Nakuru</option>
            <option value="johannesburg">Johannesburg</option>
            <option value="cape town">Cape Town</option>
            <option value="lagos">Lagos</option>
            <option value="accra">Accra</option>
            <option value="dar es salaam">Dar es Salaam</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Availability */}
        <div className="relative">
          <select
            value={availability}
            onChange={(e) => onFilterChange('availability', e.target.value)}
            className="appearance-none pl-3 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer shadow-xs"
          >
            <option value="all">Availability: All</option>
            <option value="available_now">Available Now</option>
            <option value="open_now">Open Now</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Subscription */}
        <div className="relative">
          <select
            value={subscription}
            onChange={(e) => onFilterChange('subscription', e.target.value)}
            className="appearance-none pl-3 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer shadow-xs"
          >
            <option value="all">Subscription: All</option>
            <option value="active">Active</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="payment_issue">Payment Issue</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Rating */}
        <div className="relative">
          <select
            value={minRating}
            onChange={(e) => onFilterChange('minRating', Number(e.target.value))}
            className="appearance-none pl-3 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer shadow-xs"
          >
            <option value={0}>Rating: Any</option>
            <option value={4.8}>4.8+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
            <option value={4.0}>4.0+ Stars</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* More Filters button */}
        <button
          type="button"
          onClick={onOpenAdvancedFilters}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          <SlidersHorizontal className="w-3 h-3 text-purple-600" />
          <span>More Filters</span>
        </button>

        {/* Reset Filters */}
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Sort By Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Sort:</span>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="appearance-none pl-2.5 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer shadow-xs"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="rating_desc">Highest Rated</option>
            <option value="bookings_desc">Most Bookings</option>
            <option value="attention">Needs Attention</option>
            <option value="name_asc">Name (A-Z)</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

