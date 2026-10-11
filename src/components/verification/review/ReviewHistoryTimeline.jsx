import { Clock, UserCheck, CheckCircle2, Shield, ArrowRight, UserPlus, Flag } from 'lucide-react'

/**
 * ADM-031: ReviewHistoryTimeline
 * Vertical timeline tracking verification events with purple nodes and audit metadata.
 */
export default function ReviewHistoryTimeline({
  history = [],
}) {
  const defaultHistory = [
    {
      id: 'rh-1',
      time: '12 Sep 2026 • 11:20 AM',
      title: 'Review started',
      actor: 'Jane Ochieng',
      type: 'review_started',
    },
    {
      id: 'rh-2',
      time: '12 Sep 2026 • 11:05 AM',
      title: 'Assigned to Jane Ochieng by System',
      actor: 'System',
      type: 'assignment',
    },
    {
      id: 'rh-3',
      time: '12 Sep 2026 • 10:42 AM',
      title: 'Document submitted by Grace Njeri',
      actor: 'Grace Njeri',
      type: 'submission',
    },
  ]

  const list = history.length > 0 ? history : defaultHistory

  const getNodeIcon = (type) => {
    switch (type) {
      case 'approve':
      case 'approved':
        return <CheckCircle2 className="size-3 text-emerald-600" />
      case 'assignment':
        return <UserPlus className="size-3 text-purple-600" />
      case 'escalate':
      case 'escalated':
        return <Flag className="size-3 text-purple-600" />
      default:
        return <Clock className="size-3 text-purple-600" />
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-purple-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Review History
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Audit Trail</span>
      </div>

      {/* Timeline items */}
      <div className="flex-1 p-4 overflow-y-auto max-h-[220px]">
        <div className="relative pl-6 space-y-4">
          {/* Vertical connecting line */}
          <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-purple-100" />

          {list.map((item, idx) => (
            <div key={item.id || idx} className="relative flex flex-col gap-0.5 text-xs">
              {/* Node dot */}
              <div className="absolute -left-6 top-0.5 flex size-5 items-center justify-center rounded-full border-2 border-white bg-purple-100 text-[#6D28D9] shadow-2xs">
                {getNodeIcon(item.type)}
              </div>

              {/* Timestamp */}
              <span className="font-mono text-[10px] text-slate-400">
                {item.time || item.timestamp}
              </span>

              {/* Title & Actor */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-900">
                  {item.title}
                </span>
                {item.actor && item.actor !== '—' && !item.title?.includes(item.actor) && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
                    {item.actor}
                  </span>
                )}
              </div>

              {/* Optional detail notes */}
              {item.notes && (
                <p className="text-[11px] text-slate-500 italic mt-0.5">
                  "{item.notes}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
