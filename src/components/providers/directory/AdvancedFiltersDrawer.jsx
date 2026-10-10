import { useState } from 'react'
import { X, RotateCcw, Check } from 'lucide-react'

export function AdvancedFiltersDrawer({
  isOpen = false,
  onClose,
  filters = {},
  onApplyFilters,
  onResetFilters,
}) {
  const [localFilters, setLocalFilters] = useState({
    entityType: 'all',
    accountStatus: 'all',
    verificationStatus: 'all',
    joinedRange: 'all',
    country: 'all',
    city: 'all',
    availableNowOnly: false,
    hasActiveServices: false,
    hasUpcomingBookings: false,
    minRating: 0,
    minBookings: 0,
    subscriptionStatus: 'all',
    hasSafetyCase: false,
    documentsPendingOnly: false,
  })

  if (!isOpen) return null

  const handleApply = () => {
    onApplyFilters(localFilters)
    onClose()
  }

  const handleReset = () => {
    setLocalFilters({
      entityType: 'all',
      accountStatus: 'all',
      verificationStatus: 'all',
      joinedRange: 'all',
      country: 'all',
      city: 'all',
      availableNowOnly: false,
      hasActiveServices: false,
      hasUpcomingBookings: false,
      minRating: 0,
      minBookings: 0,
      subscriptionStatus: 'all',
      hasSafetyCase: false,
      documentsPendingOnly: false,
    })
    onResetFilters()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Advanced Directory Filters</h3>
            <p className="text-xs text-slate-500 mt-0.5">Filter by entity, compliance, quality & activity</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* Section 1: Provider Profile */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-purple-700">
              Provider & Account
            </h4>

            <div className="space-y-2">
              <label className="block text-slate-700 font-medium">Entity Type</label>
              <select
                value={localFilters.entityType}
                onChange={(e) => setLocalFilters({ ...localFilters, entityType: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="all">All Entities (Individuals & Businesses)</option>
                <option value="individual">Individual Professionals Only</option>
                <option value="spa">Spas & Wellness Centers</option>
                <option value="hotel_resort">Hotels & Wellness Resorts</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Account Status</label>
                <select
                  value={localFilters.accountStatus}
                  onChange={(e) => setLocalFilters({ ...localFilters, accountStatus: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Joined Date</label>
                <select
                  value={localFilters.joinedRange}
                  onChange={(e) => setLocalFilters({ ...localFilters, joinedRange: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="all">All Time</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="this_year">This Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-purple-700">
              Location & Jurisdiction
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Region / County</label>
                <select
                  value={localFilters.country}
                  onChange={(e) => setLocalFilters({ ...localFilters, country: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="all">All Regions</option>
                  <option value="nairobi">Nairobi County</option>
                  <option value="coast">Coast Region</option>
                  <option value="rift">Rift Valley</option>
                  <option value="nyanza">Nyanza</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">City</label>
                <select
                  value={localFilters.city}
                  onChange={(e) => setLocalFilters({ ...localFilters, city: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="all">All Cities</option>
                  <option value="nairobi">Nairobi</option>
                  <option value="mombasa">Mombasa</option>
                  <option value="kisumu">Kisumu</option>
                  <option value="nakuru">Nakuru</option>
                  <option value="johannesburg">Johannesburg</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Activity & Realtime State */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-purple-700">
              Activity & Live State
            </h4>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.availableNowOnly}
                  onChange={(e) => setLocalFilters({ ...localFilters, availableNowOnly: e.target.checked })}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Available Now / Open Now only</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.hasActiveServices}
                  onChange={(e) => setLocalFilters({ ...localFilters, hasActiveServices: e.target.checked })}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Has Active Published Services</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.hasUpcomingBookings}
                  onChange={(e) => setLocalFilters({ ...localFilters, hasUpcomingBookings: e.target.checked })}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Has Upcoming Bookings</span>
              </label>
            </div>
          </div>

          {/* Section 4: Quality & Performance */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-purple-700">
              Quality & Performance
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Minimum Rating</label>
                <select
                  value={localFilters.minRating}
                  onChange={(e) => setLocalFilters({ ...localFilters, minRating: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4.0}>4.0+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                  <option value={4.8}>4.8+ Stars</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Completed Bookings</label>
                <select
                  value={localFilters.minBookings}
                  onChange={(e) => setLocalFilters({ ...localFilters, minBookings: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value={0}>Any Volume</option>
                  <option value={50}>50+ Bookings</option>
                  <option value={200}>200+ Bookings</option>
                  <option value={500}>500+ Bookings</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Compliance & Moderation */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-purple-700">
              Compliance & Moderation
            </h4>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.documentsPendingOnly}
                  onChange={(e) => setLocalFilters({ ...localFilters, documentsPendingOnly: e.target.checked })}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Documents or Profile Content Awaiting Review</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.hasSafetyCase}
                  onChange={(e) => setLocalFilters({ ...localFilters, hasSafetyCase: e.target.checked })}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Has Active Trust & Safety Incident Case</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition shadow-xs"
          >
            <Check className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}

