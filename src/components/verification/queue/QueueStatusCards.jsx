import {
  FileText,
  UserPlus,
  Clock,
  RefreshCw,
  FileEdit,
  Flag,
} from 'lucide-react'

/**
 * QueueStatusCards (ADM-030)
 * 6 responsive status metric cards allowing one-click filtering.
 */
export default function QueueStatusCards({
  counts = {},
  activeStatus = 'ALL',
  onSelectStatus,
}) {
  const cards = [
    {
      id: 'ALL',
      label: 'All',
      count: counts.all ?? 428,
      subtext: 'Total submissions',
      icon: FileText,
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
      activeBorder: 'border-purple-600 ring-2 ring-purple-600/15 bg-purple-50/15',
    },
    {
      id: 'AWAITING_REVIEW',
      label: 'New',
      count: counts.new ?? 196,
      subtext: 'Awaiting initial review',
      icon: UserPlus,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      activeBorder: 'border-emerald-600 ring-2 ring-emerald-600/15 bg-emerald-50/15',
    },
    {
      id: 'UNDER_REVIEW',
      label: 'Under Review',
      count: counts.underReview ?? 86,
      subtext: 'Being reviewed',
      icon: Clock,
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      activeBorder: 'border-indigo-600 ring-2 ring-indigo-600/15 bg-indigo-50/15',
    },
    {
      id: 'RESUBMITTED',
      label: 'Resubmitted',
      count: counts.resubmitted ?? 46,
      subtext: 'Provider resubmitted',
      icon: RefreshCw,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      activeBorder: 'border-amber-600 ring-2 ring-amber-600/15 bg-amber-50/15',
    },
    {
      id: 'CHANGES_REQUESTED',
      label: 'Changes Requested',
      count: counts.changesRequested ?? 112,
      subtext: 'Waiting for provider',
      icon: FileEdit,
      iconBg: 'bg-orange-50 text-orange-600 border border-orange-100',
      activeBorder: 'border-orange-600 ring-2 ring-orange-600/15 bg-orange-50/15',
    },
    {
      id: 'ESCALATED',
      label: 'Escalated',
      count: counts.escalated ?? 7,
      subtext: 'Requires senior review',
      icon: Flag,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      activeBorder: 'border-rose-600 ring-2 ring-rose-600/15 bg-rose-50/15',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon
        const isSelected = activeStatus === card.id

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectStatus?.(card.id)}
            className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md ${
              isSelected
                ? card.activeBorder
                : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                {card.label}
              </span>
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${card.iconBg} transition-transform group-hover:scale-105`}
              >
                <Icon className="size-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-slate-900">
                {card.count.toLocaleString()}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                {card.subtext}
              </p>
            </div>

            {isSelected && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#6D28D9] to-transparent rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}
