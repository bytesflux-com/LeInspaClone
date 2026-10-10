import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'

export function BookingPerformanceCard({
  profile,
  onViewAllBookings,
}) {
  if (!profile) return null

  const perf = profile.bookingPerformance || {}
  const total = perf.total ?? 284
  const upcoming = perf.upcoming ?? 12
  const completed = perf.completed ?? 268
  const cancelled = perf.cancelled ?? 4
  const completionRate = perf.completionRate || '96%'
  const cancellationRate = perf.cancellationRate || '2.1%'

  const completionPct = parseFloat(completionRate) || 96
  const cancellationPct = parseFloat(cancellationRate) || 2.1

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <CalendarCheck className="size-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Booking Performance
            </h3>
          </div>
          <button
            type="button"
            onClick={onViewAllBookings}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 px-2 py-1 rounded-md transition"
          >
            <span>View All</span>
            <ChevronRight className="size-3" />
          </button>
        </div>

        {/* 4 Metrics Grid */}
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {/* Total */}
          <div className="p-2 rounded-xl bg-purple-50/60 border border-purple-200/70">
            <div className="flex items-center justify-center gap-1 text-purple-700 mb-0.5">
              <CalendarCheck className="size-3.5" />
            </div>
            <p className="text-base font-bold text-purple-900">{total}</p>
            <p className="text-[10px] text-purple-700 font-medium">Total Bookings</p>
          </div>

          {/* Upcoming */}
          <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-200/70">
            <div className="flex items-center justify-center gap-1 text-blue-700 mb-0.5">
              <Clock className="size-3.5" />
            </div>
            <p className="text-base font-bold text-blue-900">{upcoming}</p>
            <p className="text-[10px] text-blue-700 font-medium">Upcoming</p>
          </div>

          {/* Completed */}
          <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
            <div className="flex items-center justify-center gap-1 text-emerald-700 mb-0.5">
              <CheckCircle2 className="size-3.5" />
            </div>
            <p className="text-base font-bold text-emerald-900">{completed}</p>
            <p className="text-[10px] text-emerald-700 font-medium">Completed</p>
          </div>

          {/* Cancelled */}
          <div className="p-2 rounded-xl bg-rose-50/60 border border-rose-200/70">
            <div className="flex items-center justify-center gap-1 text-rose-700 mb-0.5">
              <XCircle className="size-3.5" />
            </div>
            <p className="text-base font-bold text-rose-900">{cancelled}</p>
            <p className="text-[10px] text-rose-700 font-medium">Cancelled</p>
          </div>
        </div>

        {/* Progress Bars for Completion & Cancellation Rates */}
        <div className="mt-4 space-y-3 pt-1">
          {/* Completion Rate */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <span>Completion Rate</span>
              </span>
              <span className="font-bold text-emerald-700">{completionRate}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, completionPct)}%` }}
              />
            </div>
          </div>

          {/* Cancellation Rate */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <span>Cancellation Rate</span>
              </span>
              <span className="font-bold text-rose-700">{cancellationRate}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, cancellationPct * 5)}%` }} // Scaled slightly for visual clarity
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={onViewAllBookings}
          className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 transition py-1.5 rounded-lg hover:bg-purple-50"
        >
          <span>View All Bookings</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

