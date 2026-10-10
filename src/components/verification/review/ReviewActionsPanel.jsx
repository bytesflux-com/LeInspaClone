import { Check, RotateCcw, X, Users, ShieldAlert } from 'lucide-react'

/**
 * ADM-031: ReviewActionsPanel
 * 2x2 Grid of decision actions: Approve, Request New Document, Reject, Escalate.
 */
export default function ReviewActionsPanel({
  onApprove,
  onRequestChanges,
  onReject,
  onEscalate,
  submitting = false,
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="text-sm font-bold text-slate-900">Review Actions</h3>
        <span className="text-[11px] text-slate-400 font-medium">Component Evaluation</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* 1. Approve Document */}
        <button
          type="button"
          onClick={onApprove}
          disabled={submitting}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-3 text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
        >
          <Check className="size-4 stroke-[2.5]" />
          <span>Approve Document</span>
        </button>

        {/* 2. Request New Document */}
        <button
          type="button"
          onClick={onRequestChanges}
          disabled={submitting}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 px-3 text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
        >
          <RotateCcw className="size-4 stroke-[2.5]" />
          <span>Request New Document</span>
        </button>

        {/* 3. Reject Document */}
        <button
          type="button"
          onClick={onReject}
          disabled={submitting}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold py-2.5 px-3 text-xs transition disabled:opacity-50 cursor-pointer"
        >
          <X className="size-4 stroke-[2.5]" />
          <span>Reject Document</span>
        </button>

        {/* 4. Escalate Review */}
        <button
          type="button"
          onClick={onEscalate}
          disabled={submitting}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-semibold py-2.5 px-3 text-xs transition disabled:opacity-50 cursor-pointer"
        >
          <Users className="size-4 text-[#6D28D9]" />
          <span>Escalate Review</span>
        </button>
      </div>
    </div>
  )
}
