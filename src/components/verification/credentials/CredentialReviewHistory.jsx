import { useState } from 'react'
import { Clock, ArrowRight } from 'lucide-react'

/**
 * ADM-033: CredentialReviewHistory
 * Connected chronological audit timeline of credential reviews and submissions.
 */
export default function CredentialReviewHistory({ history = [] }) {
  const [showAll, setShowAll] = useState(false)

  const defaultHistory = [
    {
      id: 'crh-1',
      time: '12 Sep 2026 • 11:20 AM',
      title: 'Review started (Jane Ochieng)',
      actor: 'Jane Ochieng',
      type: 'review_started',
    },
    {
      id: 'crh-2',
      time: '12 Sep 2026 • 11:05 AM',
      title: 'Assigned to Jane Ochieng',
      actor: 'System',
      type: 'assignment',
    },
    {
      id: 'crh-3',
      time: '12 Sep 2026 • 10:42 AM',
      title: 'Replacement credential submitted',
      actor: 'Grace Njeri',
      type: 'submission',
    },
    {
      id: 'crh-4',
      time: '10 Sep 2026 • 11:02 AM',
      title: 'Changes requested (Issuer unreadable)',
      actor: 'Jane Ochieng',
      type: 'changes_requested',
    },
    {
      id: 'crh-5',
      time: '10 Sep 2026 • 9:15 AM',
      title: 'Credential submitted',
      actor: 'Grace Njeri',
      type: 'submission',
    },
  ]

  const items = history.length > 0 ? history : defaultHistory
  const displayItems = showAll ? items : items.slice(0, 5)

  const getBulletClass = (type) => {
    switch (type) {
      case 'approve':
      case 'approved':
        return 'bg-emerald-500 ring-4 ring-emerald-100'
      case 'changes_requested':
        return 'bg-amber-500 ring-4 ring-amber-100'
      case 'reject':
      case 'rejected':
        return 'bg-rose-500 ring-4 ring-rose-100'
      default:
        return 'bg-[#6D28D9] ring-4 ring-purple-100'
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
            <Clock className="size-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Credential Review History</h3>
            <p className="text-[11px] text-slate-400">Chronological verification actions</p>
          </div>
        </div>

        {items.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-semibold text-purple-700 hover:text-purple-900 transition cursor-pointer flex items-center gap-1"
          >
            <span>{showAll ? 'Show Less' : 'View All'}</span>
            <ArrowRight className="size-3" />
          </button>
        )}
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 space-y-4">
        {/* Vertical Line */}
        <div
          className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200"
          aria-hidden="true"
        />

        {displayItems.map((item, idx) => (
          <div key={item.id || idx} className="relative flex flex-col space-y-0.5 group">
            {/* Dot */}
            <span
              className={`absolute -left-6 top-1.5 size-2.5 rounded-full transition-transform group-hover:scale-125 ${getBulletClass(
                item.type
              )}`}
            />

            {/* Time */}
            <span className="text-[10px] font-mono text-slate-400 font-medium">
              {item.time || item.timestamp}
            </span>

            {/* Title */}
            <p className="text-xs font-semibold text-slate-800 leading-snug">
              {item.title}
            </p>

            {/* Notes */}
            {item.notes && (
              <p className="text-[11px] text-slate-500 italic pt-0.5">
                {item.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
