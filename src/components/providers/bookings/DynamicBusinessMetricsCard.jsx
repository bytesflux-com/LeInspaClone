import { Building2, Users, Hotel, Sparkles, MapPin } from 'lucide-react'

export function DynamicBusinessMetricsCard({
  provider,
  canSeeFinancial = true,
}) {
  if (!provider) return null

  const isSpa = provider.providerType === 'spa'
  const isHotel = provider.providerType === 'hotel_resort'

  if (!isSpa && !isHotel) return null

  const spa = provider.dynamicSpaContext || {}
  const hotel = provider.dynamicHotelContext || {}

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-purple-200 bg-purple-50/30 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-purple-100">
        <div className="size-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
          {isSpa ? <Building2 className="size-4" /> : <Hotel className="size-4" />}
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            {isSpa ? 'Spa Facility Operations & Staff Breakdown' : 'Resort & In-Room Wellness Operations'}
          </h3>
          <p className="text-xs text-slate-500">
            {isSpa
              ? 'Multi-branch booking dispatch, staff allocations and walk-in reconciliations'
              : 'Guest suite wellness dispatch, concierge bookings and package redemptions'}
          </p>
        </div>
      </div>

      {isSpa && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Dispatch Metrics */}
          <div className="p-3 rounded-xl bg-white border border-purple-100 space-y-2">
            <span className="font-bold text-slate-800 text-xs block">Booking Dispatch Types</span>
            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Staff-Assigned</span>
                <span className="font-mono font-bold text-slate-900">{spa.staffAssignedBookings || 588}</span>
              </div>
              <div className="flex justify-between">
                <span>Unassigned Slots</span>
                <span className="font-mono font-bold text-amber-700">{spa.unassignedBookings || 14}</span>
              </div>
              <div className="flex justify-between">
                <span>Front Desk Walk-Ins</span>
                <span className="font-mono font-bold text-purple-700">{spa.walkInBookings || 40}</span>
              </div>
            </div>
          </div>

          {/* Branch Revenue */}
          <div className="p-3 rounded-xl bg-white border border-purple-100 space-y-2">
            <span className="font-bold text-slate-800 text-xs block">Branch Revenue Split</span>
            <div className="space-y-1.5 text-slate-600">
              {(spa.branchRevenue || [
                { branch: 'Westlands Flagship', revenue: 'KES 2,450,000', bookings: 380 },
                { branch: 'Karen Branch', revenue: 'KES 1,820,000', bookings: 262 },
              ]).map((b, i) => (
                <div key={i} className="flex justify-between items-center text-[11px]">
                  <span className="truncate pr-2">{b.branch}</span>
                  <span className="font-mono font-bold text-slate-900">{canSeeFinancial ? b.revenue : 'KES —'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Contributions */}
          <div className="p-3 rounded-xl bg-white border border-purple-100 space-y-2">
            <span className="font-bold text-slate-800 text-xs block">Top Staff Contributors</span>
            <div className="space-y-1 text-slate-600">
              {(spa.staffRevenueContribution || [
                { staff: 'Amina K. (Senior)', bookings: 142, revenue: 'KES 780,000' },
                { staff: 'Brian M. (Rehab)', bookings: 118, revenue: 'KES 640,000' },
              ]).map((s, i) => (
                <div key={i} className="flex justify-between items-center text-[11px]">
                  <span className="truncate pr-2">{s.staff}</span>
                  <span className="font-mono font-bold text-emerald-700">{canSeeFinancial ? s.revenue : 'KES —'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isHotel && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white border border-purple-100 space-y-2">
            <span className="font-bold text-slate-800 text-xs block">Dispatch Department</span>
            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>In-Room Suite Bookings</span>
                <span className="font-mono font-bold text-slate-900">{hotel.inRoomBookings || 245}</span>
              </div>
              <div className="flex justify-between">
                <span>Concierge Desk</span>
                <span className="font-mono font-bold text-purple-700">{hotel.conciergeBookings || 410}</span>
              </div>
              <div className="flex justify-between">
                <span>Resort Package Redemptions</span>
                <span className="font-mono font-bold text-emerald-700">{hotel.packageRedemptions || 157}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-purple-100 space-y-2 col-span-2">
            <span className="font-bold text-slate-800 text-xs block">Wellness Locations Performance</span>
            <div className="grid sm:grid-cols-3 gap-2 pt-0.5">
              {(hotel.locationPerformance || [
                { location: 'Lakeside Hydro Pavilion', revenue: 'KES 2,980,000', bookings: 310 },
                { location: 'Sunset Yoga Deck', revenue: 'KES 1,920,000', bookings: 257 },
                { location: 'In-Suite Network', revenue: 'KES 1,950,000', bookings: 245 },
              ]).map((loc, i) => (
                <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
                  <p className="font-semibold text-slate-900 truncate text-[11px]">{loc.location}</p>
                  <p className="font-mono font-bold text-purple-700 text-xs">
                    {canSeeFinancial ? loc.revenue : 'KES —'}
                  </p>
                  <p className="text-[10px] text-slate-400">{loc.bookings} bookings</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

