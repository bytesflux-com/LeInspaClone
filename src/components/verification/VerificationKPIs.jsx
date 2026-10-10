import { Clock, Hourglass, FileEdit, CheckCircle2, XCircle } from 'lucide-react'

/**
 * ADM-029 Verification KPIs
 * Displays 5 clean white metric cards matching the ADM-009 light theme design system:
 * 1. Awaiting Review (428 | 34 urgent)
 * 2. Under Review (86 | In progress)
 * 3. Changes Requested (112 | Waiting for provider)
 * 4. Approved (742 | This month)
 * 5. Rejected (27 | This month)
 */
export default function VerificationKPIs({ kpis = {} }) {
  const awaitingReview = kpis?.awaitingReview || { count: 428, subtext: '34 urgent', status: 'urgent' }
  const underReview = kpis?.underReview || { count: 86, subtext: 'In progress', status: 'progress' }
  const changesRequested = kpis?.changesRequested || { count: 112, subtext: 'Waiting for provider', status: 'waiting' }
  const approved = kpis?.approved || { count: 742, subtext: 'This month', status: 'success' }
  const rejected = kpis?.rejected || { count: 27, subtext: 'This month', status: 'danger' }

  const cards = [
    {
      id: 'awaiting',
      title: 'Awaiting Review',
      count: awaitingReview.count,
      subtext: awaitingReview.subtext || '34 urgent',
      icon: Clock,
      iconClass: 'bg-amber-50 text-amber-600 border border-amber-100',
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      dotColor: 'bg-amber-500',
    },
    {
      id: 'under_review',
      title: 'Under Review',
      count: underReview.count,
      subtext: underReview.subtext || 'In progress',
      icon: Hourglass,
      iconClass: 'bg-purple-50 text-purple-600 border border-purple-100',
      badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200',
      dotColor: 'bg-purple-500',
    },
    {
      id: 'changes_requested',
      title: 'Changes Requested',
      count: changesRequested.count,
      subtext: changesRequested.subtext || 'Waiting for provider',
      icon: FileEdit,
      iconClass: 'bg-orange-50 text-orange-600 border border-orange-100',
      badgeClass: 'bg-orange-50 text-orange-700 border border-orange-200',
      dotColor: 'bg-orange-500',
    },
    {
      id: 'approved',
      title: 'Approved',
      count: approved.count,
      subtext: approved.subtext || 'This month',
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      dotColor: 'bg-emerald-500',
    },
    {
      id: 'rejected',
      title: 'Rejected',
      count: rejected.count,
      subtext: rejected.subtext || 'This month',
      icon: XCircle,
      iconClass: 'bg-rose-50 text-rose-600 border border-rose-100',
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
      dotColor: 'bg-rose-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const IconComponent = card.icon
        return (
          <div
            key={card.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            {/* Top row: Metric label on left, icon pill on right */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                {card.title}
              </span>
              <div className={`flex size-9 items-center justify-center rounded-xl ${card.iconClass}`}>
                <IconComponent className="size-4.5" />
              </div>
            </div>

            {/* Big number */}
            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {typeof card.count === 'number' ? card.count.toLocaleString() : card.count}
            </div>

            {/* Bottom row: Status pill */}
            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${card.badgeClass}`}
              >
                <span className={`size-1.5 rounded-full ${card.dotColor}`} />
                <span>{card.subtext}</span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
