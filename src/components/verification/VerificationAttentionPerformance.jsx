import {
  AlertCircle,
  Clock,
  UserCheck,
  TrendingUp,
  RotateCcw,
  Flag,
  ChevronRight,
} from 'lucide-react'

/**
 * ADM-029 Attention & Performance Overview
 * Left: "Needs Your Attention" (4 alert cards with review triggers)
 * Right: "Verification Performance" (5 operational KPIs on soft lavender background #F9F7FE)
 * Built with the crisp light theme design system of ADM-009.
 */
export default function VerificationAttentionPerformance({
  needsAttention = {},
  performance = {},
  onFilterTrigger,
}) {
  const overdueReviews = needsAttention?.overdueReviews || {
    count: 24,
    label: 'Overdue Reviews',
    description: 'Past review target',
    severity: 'urgent',
  }
  const expiringCredentials = needsAttention?.expiringCredentials || {
    count: 38,
    label: 'Expiring Credentials',
    description: 'Require renewal',
    severity: 'warning',
  }
  const resubmissions = needsAttention?.resubmissions || {
    count: 46,
    label: 'Resubmissions',
    description: 'Submitted corrections',
    severity: 'warning',
  }
  const escalatedReviews = needsAttention?.escalatedReviews || {
    count: 7,
    label: 'Escalated Reviews',
    description: 'Require senior review',
    severity: 'escalated',
  }

  const attentionCards = [
    {
      id: 'overdue',
      title: overdueReviews.label || 'Overdue Reviews',
      count: overdueReviews.count,
      description: overdueReviews.description || 'Past review target',
      dotColor: 'bg-rose-500',
      actionFilter: { priority: 'URGENT' },
      accentColor: 'text-rose-600',
    },
    {
      id: 'expiring',
      title: expiringCredentials.label || 'Expiring Credentials',
      count: expiringCredentials.count,
      description: expiringCredentials.description || 'Require renewal',
      dotColor: 'bg-amber-500',
      actionFilter: { verificationType: 'Credentials', filterType: 'expiring' },
      accentColor: 'text-amber-600',
    },
    {
      id: 'resubmissions',
      title: resubmissions.label || 'Resubmissions',
      count: resubmissions.count,
      description: resubmissions.description || 'Submitted corrections',
      dotColor: 'bg-amber-500',
      actionFilter: { tab: 'RESUBMITTED' },
      accentColor: 'text-amber-600',
    },
    {
      id: 'escalated',
      title: escalatedReviews.label || 'Escalated Reviews',
      count: escalatedReviews.count,
      description: escalatedReviews.description || 'Require senior review',
      dotColor: 'bg-purple-600',
      actionFilter: { tab: 'ESCALATED' },
      accentColor: 'text-purple-600',
    },
  ]

  const medianReviewTime = performance?.medianReviewTime || '4h 18m'
  const reviewedToday = performance?.reviewedToday || 84
  const approvalRate = performance?.approvalRate || '88%'
  const changesRequestedRate = performance?.changesRequestedRate || '9%'
  const escalatedRate = performance?.escalatedRate || '3%'

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left: Needs Your Attention (Span 7) */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-7">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertCircle className="size-3.5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Needs Your Attention
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Automated compliance triggers
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {attentionCards.map((card) => (
            <div
              key={card.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 transition hover:bg-slate-100/60"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`size-2 shrink-0 rounded-full ${card.dotColor}`} />
                  <span className="truncate text-xs font-medium text-slate-700">
                    {card.title}
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {card.count}
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                  {card.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onFilterTrigger && onFilterTrigger(card.actionFilter)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-800 transition"
              >
                <span>Review</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Verification Performance (Span 5) */}
      <div className="flex flex-col justify-between rounded-2xl border border-purple-100 bg-[#F9F7FE] p-5 shadow-sm lg:col-span-5">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Verification Performance
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
              Live SLA
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Trailing 24 hours operational throughput
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* Median Review Time */}
          <div className="flex flex-col rounded-xl bg-white/90 p-3 shadow-2xs border border-purple-100/60">
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="size-3 text-purple-600" />
              <span>Median Time</span>
            </div>
            <span className="mt-1 text-sm font-bold text-slate-800">
              {medianReviewTime}
            </span>
          </div>

          {/* Reviewed Today */}
          <div className="flex flex-col rounded-xl bg-white/90 p-3 shadow-2xs border border-purple-100/60">
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <UserCheck className="size-3 text-purple-600" />
              <span>Reviewed</span>
            </div>
            <span className="mt-1 text-sm font-bold text-slate-800">
              {reviewedToday}
            </span>
          </div>

          {/* Approval Rate */}
          <div className="flex flex-col rounded-xl bg-white/90 p-3 shadow-2xs border border-purple-100/60">
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <TrendingUp className="size-3 text-emerald-600" />
              <span>Approval</span>
            </div>
            <span className="mt-1 text-sm font-bold text-slate-800">
              {approvalRate}
            </span>
          </div>

          {/* Changes Requested */}
          <div className="flex flex-col rounded-xl bg-white/90 p-3 shadow-2xs border border-purple-100/60">
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <RotateCcw className="size-3 text-amber-600" />
              <span>Changes</span>
            </div>
            <span className="mt-1 text-sm font-bold text-slate-800">
              {changesRequestedRate}
            </span>
          </div>

          {/* Escalated Rate */}
          <div className="flex flex-col rounded-xl bg-white/90 p-3 shadow-2xs border border-purple-100/60">
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Flag className="size-3 text-rose-600" />
              <span>Escalated</span>
            </div>
            <span className="mt-1 text-sm font-bold text-slate-800">
              {escalatedRate}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
