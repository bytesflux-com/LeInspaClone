import { Check, RotateCcw, X, Users, AlertTriangle } from 'lucide-react'

/**
 * ADM-032: IdentityReviewActions
 * Primary review actions panel for deciding on identity documents.
 * 4 decision flows: Approve, Request New Document, Reject, Escalate.
 */
export default function IdentityReviewActions({
  onApprove,
  onRequestNewDocument,
  onReject,
  onEscalate,
  submitting = false,
  status,
}) {
  const isApproved = status === 'APPROVED'

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900">Review Actions</h3>
        <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
          Identity Step
        </span>
      </div>

      <div className="space-y-2.5">
        {/* 1. Approve Document */}
        <button
          type="button"
          onClick={onApprove}
          disabled={submitting || isApproved}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Check className="size-4 stroke-[3]" />
          )}
          <span>{isApproved ? 'Identity Document Approved' : 'Approve Document'}</span>
        </button>

        {/* 2. Request New Document */}
        <button
          type="button"
          onClick={onRequestNewDocument}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 px-4 text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
        >
          <RotateCcw className="size-4 stroke-[2.5]" />
          <span>Request New Document</span>
        </button>

        {/* 3. Reject Document */}
        <button
          type="button"
          onClick={onReject}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold py-2.5 px-4 text-xs transition disabled:opacity-50 cursor-pointer"
        >
          <X className="size-4 stroke-[2.5]" />
          <span>Reject Document</span>
        </button>

        {/* 4. Escalate Review */}
        <button
          type="button"
          onClick={onEscalate}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-semibold py-2.5 px-4 text-xs transition disabled:opacity-50 cursor-pointer"
        >
          <Users className="size-4 stroke-[2.2]" />
          <span>Escalate Review</span>
        </button>
      </div>

      <p className="text-[10px] text-slate-400 text-center pt-1">
        Approving advances identity status and updates ADM-031 verification progress.
      </p>
    </div>
  )
}
