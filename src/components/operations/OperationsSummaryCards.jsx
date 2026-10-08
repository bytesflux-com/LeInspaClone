import { AlertCircle, AlertTriangle, Clock, Eye, CheckCircle2 } from 'lucide-react'
import { formatNumber } from '../../lib/utils'

export default function OperationsSummaryCards({ summary, activeFilter, onSelectFilter }) {
  if (!summary) return null

  const cards = [
    {
      id: 'critical',
      label: 'Critical',
      count: summary.critical ?? 2,
      subtitle: 'Require immediate action',
      icon: AlertCircle,
      iconColor: 'bg-rose-100 text-rose-600',
      activeRing: 'ring-2 ring-rose-500 bg-rose-50/20',
    },
    {
      id: 'high',
      label: 'High Priority',
      count: summary.high ?? 8,
      subtitle: 'Need attention soon',
      icon: AlertTriangle,
      iconColor: 'bg-amber-100 text-amber-600',
      activeRing: 'ring-2 ring-amber-500 bg-amber-50/20',
    },
    {
      id: 'awaiting',
      label: 'Awaiting Action',
      count: summary.awaitingAction ?? 27,
      subtitle: 'Pending admin review',
      icon: Clock,
      iconColor: 'bg-purple-100 text-[#5c2dd5]',
      activeRing: 'ring-2 ring-[#5c2dd5] bg-purple-50/20',
    },
    {
      id: 'review',
      label: 'In Review',
      count: summary.inReview ?? 14,
      subtitle: 'Currently being handled',
      icon: Eye,
      iconColor: 'bg-indigo-100 text-indigo-600',
      activeRing: 'ring-2 ring-indigo-500 bg-indigo-50/20',
    },
    {
      id: 'resolved',
      label: 'Resolved Today',
      count: summary.resolvedToday ?? 43,
      subtitle: 'Completed today',
      icon: CheckCircle2,
      iconColor: 'bg-emerald-100 text-emerald-600',
      activeRing: 'ring-2 ring-emerald-500 bg-emerald-50/20',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => {
        const Icon = c.icon
        const isActive = activeFilter === c.id

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectFilter?.(isActive ? 'all' : c.id)}
            className={`flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:shadow-md cursor-pointer ${
              isActive ? c.activeRing : 'hover:border-gray-200'
            }`}
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${c.iconColor}`}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-500">{c.label}</p>
              <p className="text-2xl font-black text-gray-900 tabular-nums leading-tight mt-0.5">
                {formatNumber(c.count)}
              </p>
              <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                {c.subtitle}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

