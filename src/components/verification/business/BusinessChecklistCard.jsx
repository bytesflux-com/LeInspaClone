import React from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ClipboardCheck,
} from 'lucide-react'

/**
 * ADM-034: BusinessChecklistCard
 * Statutory verification checklist with click-to-cycle status evaluation toggles.
 */
export default function BusinessChecklistCard({
  checklist = [],
  onToggleStatus,
}) {
  const passedCount = checklist.filter(
    (item) => item.status === 'Pass' || item.resultType === 'pass'
  ).length
  const totalCount = checklist.length || 8
  const progressPercent = Math.round((passedCount / totalCount) * 100)

  const handleCycle = (key, currentStatus) => {
    // Cycle: Pass -> Needs review -> Fail -> Pass
    let nextStatus = 'Needs review'
    if (currentStatus === 'Pass') nextStatus = 'Needs review'
    else if (currentStatus === 'Needs review') nextStatus = 'Fail'
    else nextStatus = 'Pass'

    onToggleStatus?.(key, nextStatus)
  }

  const getStatusButton = (item) => {
    const s = item.status || 'Pass'
    if (s === 'Pass') {
      return (
        <button
          type="button"
          onClick={() => handleCycle(item.key, s)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition cursor-pointer"
          title="Click to cycle status"
        >
          <CheckCircle2 className="size-3.5" />
          Pass
        </button>
      )
    }

    if (s === 'Needs review') {
      return (
        <button
          type="button"
          onClick={() => handleCycle(item.key, s)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 shadow-2xs hover:bg-amber-100 transition cursor-pointer"
          title="Click to cycle status"
        >
          <AlertTriangle className="size-3.5" />
          Needs review
        </button>
      )
    }

    return (
      <button
        type="button"
        onClick={() => handleCycle(item.key, s)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800 shadow-2xs hover:bg-rose-100 transition cursor-pointer"
        title="Click to cycle status"
      >
        <XCircle className="size-3.5" />
        Fail
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
      {/* Header with counter and progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
            <ClipboardCheck className="size-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Statutory Compliance Checklist
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-emerald-700">{passedCount} of {totalCount} Cleared</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-400 font-normal">Click badge to cycle status</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          style={{ width: `${progressPercent}%` }}
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
        />
      </div>

      {/* Checklist items list */}
      <div className="divide-y divide-slate-100">
        {checklist.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50/50 rounded-lg px-2 transition"
          >
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {item.label}
              </div>
              {item.description && (
                <div className="text-[11px] text-slate-400 leading-normal">
                  {item.description}
                </div>
              )}
            </div>

            <div className="shrink-0">
              {getStatusButton(item)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
