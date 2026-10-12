import { useNavigate, useParams } from 'react-router'
import { Sparkles, ChevronRight } from 'lucide-react'

export function TopServicesCard({
  topServices = [],
  providerId = null,
  canSeeFinancial = true,
}) {
  const navigate = useNavigate()
  const { providerId: routeProviderId } = useParams()
  const list = topServices || []

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Top Services</h3>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/providers/${providerId || routeProviderId}/services`)}
            className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="size-3" />
          </button>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100 pt-1 text-xs">
          {list.map((srv, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs font-bold text-purple-700 size-5 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="font-bold text-slate-800 truncate">{srv.name}</span>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-500 font-medium mr-2">
                  {srv.bookings} bookings
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {canSeeFinancial
                    ? srv.revenueFormatted || `KES ${(srv.revenue || 0).toLocaleString()}`
                    : 'KES —'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

