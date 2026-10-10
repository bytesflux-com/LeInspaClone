import React from 'react'
import {
  Clock,
  UserCheck,
  FileCheck2,
  FileEdit,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

/**
 * ADM-034: BusinessReviewHistory
 * Chronological vertical timeline of administrative audit events and submissions.
 */
export default function BusinessReviewHistory({
  reviewHistory = [],
}) {
  const defaultHistory = [
    {
      id: 'brh-1',
      time: '11 Sep 2026 • 3:45 PM',
      title: 'Review started by Jane Ochieng',
      actor: 'Jane Ochieng',
      type: 'review_started',
    },
    {
      id: 'brh-2',
      time: '11 Sep 2026 • 3:30 PM',
      title: 'Assigned to Jane Ochieng by System',
      actor: 'System',
      type: 'assignment',
    },
    {
      id: 'brh-3',
      time: '11 Sep 2026 • 3:18 PM',
      title: 'Replacement Operating Licence submitted by Serenity Wellness Spa',
      actor: 'Serenity Wellness Spa',
      type: 'submission',
    },
    {
      id: 'brh-4',
      time: '05 Sep 2026 • 2:10 PM',
      title: 'Changes requested — Licence expired (Jane Ochieng)',
      actor: 'Jane Ochieng',
      type: 'changes_requested',
    },
    {
      id: 'brh-5',
      time: '05 Sep 2026 • 11:20 AM',
      title: 'Business documents submitted by Serenity Wellness Spa',
      actor: 'Serenity Wellness Spa',
      type: 'submission',
    },
  ]

  const items = reviewHistory.length > 0 ? reviewHistory : defaultHistory

  const getEventIcon = (type) => {
    switch (type) {
      case 'approve':
      case 'approved':
        return <CheckCircle2 className="size-3.5 text-emerald-600" />
      case 'changes_requested':
      case 'request_changes':
        return <FileEdit className="size-3.5 text-amber-600" />
      case 'reject':
      case 'rejected':
        return <AlertCircle className="size-3.5 text-rose-600" />
      case 'escalate':
      case 'escalated':
        return <ShieldAlert className="size-3.5 text-purple-600" />
      case 'assignment':
        return <UserCheck className="size-3.5 text-blue-600" />
      case 'submission':
        return <FileCheck2 className="size-3.5 text-purple-600" />
      case 'review_started':
      default:
        return <Clock className="size-3.5 text-[#6D28D9]" />
    }
  }

  const getEventBadgeBg = (type) => {
    switch (type) {
      case 'approve':
      case 'approved':
        return 'bg-emerald-50 border-emerald-200'
      case 'changes_requested':
      case 'request_changes':
        return 'bg-amber-50 border-amber-200'
      case 'reject':
      case 'rejected':
        return 'bg-rose-50 border-rose-200'
      case 'escalate':
      case 'escalated':
        return 'bg-purple-50 border-purple-200'
      case 'assignment':
        return 'bg-blue-50 border-blue-200'
      case 'submission':
      case 'review_started':
      default:
        return 'bg-purple-50 border-purple-200'
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
            <Clock className="size-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Review Timeline & Audit Log</h3>
            <p className="text-[11px] text-slate-400">
              Chronological ledger of reviewer actions and notifications
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {items.length} Events Logged
        </span>
      </div>

      {/* Connected Vertical Timeline */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {items.map((event, index) => (
          <div key={event.id || index} className="relative group">
            {/* Timeline Node Dot */}
            <div
              className={`absolute -left-6 top-0.5 flex size-5 items-center justify-center rounded-full border shadow-2xs ${getEventBadgeBg(
                event.type
              )}`}
            >
              {getEventIcon(event.type)}
            </div>

            {/* Event Content */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {event.title}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {event.time}
                </span>
              </div>

              {event.notes && (
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                  &quot;{event.notes}&quot;
                </p>
              )}

              {event.actor && (
                <div className="text-[10px] text-slate-400">
                  By <span className="font-semibold text-slate-600">{event.actor}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
