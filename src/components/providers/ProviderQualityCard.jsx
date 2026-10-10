import { Star, CheckCircle, ShieldCheck, AlertTriangle } from 'lucide-react'
import { formatNumber } from '../../lib/format'

export default function ProviderQualityCard({ quality }) {
  if (!quality) return null

  const items = [
    {
      id: 'rating',
      label: '4.5+ Rating',
      count: quality.rating45Plus,
      icon: Star,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      id: 'completion',
      label: 'High Completion Rate',
      count: quality.highCompletionRate,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      id: 'cancellation',
      label: 'Low Cancellation',
      count: quality.lowCancellation,
      icon: ShieldCheck,
      color: 'text-[#7c3aed]',
      bg: 'bg-purple-50',
    },
    {
      id: 'review',
      label: 'Needs Performance Review',
      count: quality.needsPerformanceReview,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ]

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <h2 className="text-[15px] font-bold text-[#1b1140] pb-3">Provider Quality Signals</h2>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <div
              key={it.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/40 p-3"
            >
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${it.bg}`}>
                <Icon className={`size-4 ${it.color}`} />
              </div>
              <div className="min-w-0">
                <div className="text-[16px] font-extrabold text-[#1b1140]">
                  {formatNumber(it.count)}
                </div>
                <div className="text-[10.5px] font-medium text-gray-500 line-clamp-1">
                  {it.label}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

