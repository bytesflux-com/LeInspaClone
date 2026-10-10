import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  Building,
  ShieldCheck,
} from 'lucide-react'

export function BookingEarningsKpiCards({
  summary,
  canSeeFinancial = true,
}) {
  const counts = summary?.counts || {}
  const financials = summary?.financials || {}

  const totalBookings = counts.total ?? 284
  const upcomingBookings = counts.upcoming ?? 12
  const completedBookings = counts.completed ?? 268
  const cancelledBookings = counts.cancelled ?? 4

  const totalEarningsFormatted = canSeeFinancial
    ? `KES ${(financials.providerEarnings ?? 1026500).toLocaleString()}`
    : 'KES —'

  const availableWithdrawalFormatted = canSeeFinancial
    ? `KES ${(financials.availableBalance ?? 342800).toLocaleString()}`
    : 'KES —'

  const cards = [
    {
      id: 'total',
      label: 'Total Bookings',
      value: totalBookings,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200/60',
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      value: upcomingBookings,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200/60',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: completedBookings,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200/60',
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      value: cancelledBookings,
      icon: XCircle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200/60',
    },
    {
      id: 'earnings',
      label: 'Total Earnings',
      value: totalEarningsFormatted,
      isMoney: true,
      icon: Wallet,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50/80',
      borderColor: 'border-amber-200/80',
    },
    {
      id: 'available',
      label: 'Available for Withdrawal',
      value: availableWithdrawalFormatted,
      isMoney: true,
      icon: Building,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200/60',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div
            key={c.id}
            className={`p-4 rounded-2xl border ${c.borderColor} bg-white shadow-2xs hover:shadow-xs transition flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500 truncate leading-snug">
                {c.label}
              </span>
              <div
                className={`size-8 rounded-xl ${c.bgColor} ${c.color} flex items-center justify-center shrink-0`}
              >
                <Icon className="size-4.5" />
              </div>
            </div>

            <div className="pt-1">
              <span
                className={`font-bold tracking-tight text-slate-900 block ${
                  c.isMoney ? 'text-lg sm:text-[19px] font-mono' : 'text-2xl font-bold'
                }`}
              >
                {c.value}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

