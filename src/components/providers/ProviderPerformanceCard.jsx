import { useState } from 'react'
import { Link } from 'react-router'
import {
  CalendarCheck,
  CheckCircle2,
  PieChart,
  Star,
  Repeat,
  DollarSign,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react'
import { formatNumber } from '../../lib/format'
import { usePermissions } from '../../hooks/usePermissions'
import { PERMISSIONS } from '../../constants/permissions'

export default function ProviderPerformanceCard({ performance }) {
  const { can } = usePermissions()
  const canSeeFinance = can(PERMISSIONS.FINANCE_VIEW) || can(PERMISSIONS.PAYMENTS_VIEW)
  const [revealed, setRevealed] = useState(false)

  if (!performance) return null

  const items = [
    {
      id: 'bookings',
      label: 'Bookings',
      value: formatNumber(performance.bookings),
      trend: performance.bookingsTrend,
      icon: CalendarCheck,
      color: 'text-[#5c2dd5]',
      bg: 'bg-[#5c2dd5]/10',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: formatNumber(performance.completed),
      trend: performance.completedTrend,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'cancellation',
      label: 'Cancellation Rate',
      value: performance.cancellationRate,
      trend: performance.cancellationTrend,
      icon: PieChart,
      color: 'text-[#7c3aed]',
      bg: 'bg-purple-500/10',
    },
    {
      id: 'rating',
      label: 'Average Rating',
      value: performance.averageRating,
      trend: performance.ratingTrend,
      icon: Star,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      id: 'repeat',
      label: 'Repeat Booking Rate',
      value: performance.repeatBookingRate,
      trend: performance.repeatBookingTrend,
      icon: Repeat,
      color: 'text-indigo-600',
      bg: 'bg-indigo-500/10',
    },
  ]

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-[15px] font-bold text-[#1b1140]">Platform Provider Performance</h2>
        <Link
          to="/analytics"
          className="flex items-center gap-1 text-[12px] font-semibold text-[#5c2dd5] transition hover:text-[#4520a8]"
        >
          View Analytics <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <div
              key={it.id}
              className="flex flex-col justify-between rounded-xl border border-gray-100 bg-gray-50/40 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-500 line-clamp-1">{it.label}</span>
                <div className={`flex size-6 items-center justify-center rounded-lg ${it.bg}`}>
                  <Icon className={`size-3.5 ${it.color}`} />
                </div>
              </div>
              <div className="mt-2 text-[17px] font-extrabold text-[#1b1140]">
                {it.value}
              </div>
              <div className="mt-0.5 text-[10.5px] font-semibold text-emerald-600">
                ▲ {it.trend}
              </div>
            </div>
          )
        })}

        {/* Provider Earnings (Permission-Controlled Card) */}
        <div className="flex flex-col justify-between rounded-xl border border-purple-100 bg-purple-50/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-900">Provider Earnings</span>
            {canSeeFinance ? (
              <button
                type="button"
                onClick={() => setRevealed(!revealed)}
                className="text-purple-600 hover:text-purple-800"
                title={revealed ? 'Mask value' : 'Reveal value'}
              >
                {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            ) : (
              <Lock className="size-3 text-purple-400" title="Permission-restricted" />
            )}
          </div>

          <div className="mt-2 text-[17px] font-extrabold text-[#1b1140]">
            {canSeeFinance
              ? revealed
                ? performance.providerEarningsFormatted
                : performance.providerEarningsCompact
              : '••••••••'}
          </div>

          <div className="mt-0.5 text-[10.5px] font-medium text-purple-600">
            {canSeeFinance ? 'Audited Ledger' : 'Restricted Role'}
          </div>
        </div>
      </div>
    </div>
  )
}

