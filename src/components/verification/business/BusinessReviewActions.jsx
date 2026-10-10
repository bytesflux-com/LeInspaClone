import React from 'react'
import {
  CheckCircle2,
  FileEdit,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-react'

/**
 * ADM-034: BusinessReviewActions
 * Primary administrative decision workstation controls.
 */
export default function BusinessReviewActions({
  onApprove,
  onRequestChanges,
  onReject,
  onEscalate,
  saving = false,
  status = 'UNDER_REVIEW',
}) {
  const isApproved = status === 'APPROVED'

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
            <ShieldCheck className="size-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Administrative Verification Decision
          </h3>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          Requires <span className="font-semibold text-slate-700">providers.verify</span> permission
        </span>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* 1. Approve Document */}
        <button
          type="button"
          onClick={onApprove}
          disabled={saving || isApproved}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer ${
            isApproved
              ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed opacity-80'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'
          } disabled:opacity-50`}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          <span>{isApproved ? 'Document Approved' : 'Approve Document'}</span>
        </button>

        {/* 2. Request Changes */}
        <button
          type="button"
          onClick={onRequestChanges}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-900 shadow-2xs hover:bg-amber-100 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
        >
          <FileEdit className="size-4 text-amber-700" />
          <span>Request Changes</span>
        </button>

        {/* 3. Reject Document */}
        <button
          type="button"
          onClick={onReject}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-800 shadow-2xs hover:bg-rose-100 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
        >
          <XCircle className="size-4 text-rose-600" />
          <span>Reject Document</span>
        </button>

        {/* 4. Escalate to Compliance */}
        <button
          type="button"
          onClick={onEscalate}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50/70 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#6D28D9] shadow-2xs hover:bg-purple-100 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
        >
          <AlertTriangle className="size-4 text-[#6D28D9]" />
          <span>Escalate to Compliance</span>
        </button>
      </div>
    </div>
  )
}
