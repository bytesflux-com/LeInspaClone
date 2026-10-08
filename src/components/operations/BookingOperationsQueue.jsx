import { CalendarCheck, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatNumber } from '../../lib/utils'

export default function BookingOperationsQueue({ data }) {
  if (!data) return null

  const items = [
    { label: 'New Booking Conflicts', count: data.newConflicts ?? 3, badge: 'bg-purple-100 text-[#5c2dd5]', dot: 'bg-purple-500' },
    { label: 'Unassigned Bookings', count: data.unassigned ?? 4, badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
    { label: 'Failed Reschedules', count: data.failedReschedules ?? 2, badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    { label: 'Provider Cancellations', count: data.providerCancellations ?? 5, badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    { label: 'Guest Booking Issues', count: data.guestIssues ?? 3, badge: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500' },
    { label: 'Bookings Awaiting Intervention', count: data.awaitingIntervention ?? 6, badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  ]

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-4.5 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all duration-200 min-w-0">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#5c2dd5] shadow-2xs shrink-0">
              <CalendarCheck className="size-4" />
            </span>
            <h3 className="text-sm font-bold text-gray-900 truncate">Booking Operations</h3>
          </div>
          <Link
            to="/bookings"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5c2dd5] hover:text-[#4922ab] bg-purple-50/60 hover:bg-purple-100/80 px-2 py-0.5 rounded-md transition-colors whitespace-nowrap"
          >
            <span>View Queue</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50 text-xs">
          {items.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-2.5 px-1.5 -mx-1.5 rounded-lg hover:bg-purple-50/30 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <span className={`size-1.5 rounded-full shrink-0 ${row.dot}`} />
                <span className="text-gray-700 font-medium truncate text-xs">{row.label}</span>
              </div>
              <span
                className={`inline-flex items-center justify-center min-w-[24px] h-5 px-2 rounded-full text-[11px] font-extrabold tabular-nums shrink-0 ${row.badge}`}
              >
                {formatNumber(row.count)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
