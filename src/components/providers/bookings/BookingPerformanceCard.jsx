import { Award, Star, TrendingUp, CheckCircle2, XCircle, Users } from 'lucide-react'

export function BookingPerformanceCard({
  performance,
  canSeeFinancial = true,
}) {
  const p = performance || {}

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Award className="size-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Performance</h3>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
            Last 30 Days
          </span>
        </div>

        {/* 3x2 Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 pt-3">
          <div>
            <span className="text-[10.5px] font-semibold text-slate-400 block leading-tight">
              Completion Rate
            </span>
            <span className="font-mono font-bold text-emerald-700 text-base sm:text-lg mt-0.5 block">
              {p.completionRate ?? 96}%
            </span>
          </div>

          <div>
            <span className="text-[10.5px] font-semibold text-slate-400 block leading-tight">
              Cancellation Rate
            </span>
            <span className="font-mono font-bold text-rose-600 text-base sm:text-lg mt-0.5 block">
              {p.cancellationRate ?? 2.1}%
            </span>
          </div>

          <div>
            <span className="text-[10.5px] font-semibold text-slate-400 block leading-tight">
              Average Booking Value
            </span>
            <span className="font-mono font-bold text-slate-900 text-base sm:text-lg mt-0.5 block">
              {canSeeFinancial ? `KES ${(p.averageBookingValue ?? 3950).toLocaleString()}` : 'KES —'}
            </span>
          </div>

          <div className="pt-2">
            <span className="text-[10.5px] font-semibold text-slate-400 block leading-tight">
              Repeat Clients
            </span>
            <span className="font-mono font-bold text-purple-700 text-base sm:text-lg mt-0.5 block">
              {p.repeatClientsRate ?? 38}%
            </span>
          </div>

          <div className="pt-2">
            <span className="text-[10.5px] font-semibold text-slate-400 block leading-tight">
              Average Rating
            </span>
            <span className="font-mono font-bold text-amber-500 text-base sm:text-lg mt-0.5 flex items-center gap-1">
              <span>{p.averageRating ?? 4.9}</span>
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
            </span>
          </div>

          <div className="pt-2">
            <span className="text-[10.5px] font-semibold text-slate-400 block leading-tight">
              Booking Growth
            </span>
            <span className="font-mono font-bold text-emerald-600 text-base sm:text-lg mt-0.5 flex items-center gap-1">
              <span>{p.bookingGrowth ?? '+12%'}</span>
              <TrendingUp className="size-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

