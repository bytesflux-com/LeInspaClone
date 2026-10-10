import { Building, ChevronRight, Clock, ArrowRight } from 'lucide-react'

export function WithdrawalsPositionCard({
  withdrawalPositions,
  canSeeFinancial = true,
  onShowToast,
}) {
  const w = withdrawalPositions || {}
  const recent = w.recentRequest || {
    id: 'WD-82914',
    amount: 45000,
    statusLabel: 'Pending Approval',
  }

  const fmt = (val) =>
    canSeeFinancial ? (typeof val === 'number' ? `KES ${val.toLocaleString()}` : val || 'KES —') : 'KES —'

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Building className="size-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Withdrawals</h3>
          </div>

          <button
            type="button"
            onClick={() => onShowToast?.('Opening Withdrawal Authorizations Hub')}
            className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="size-3" />
          </button>
        </div>

        {/* 5-Column Status Metrics */}
        <div className="grid grid-cols-5 gap-2 py-3 text-center border-b border-slate-100">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block leading-tight">
              Available to Withdraw
            </span>
            <span className="font-mono font-bold text-slate-900 text-xs sm:text-[13px] mt-0.5 block">
              {fmt(w.availableToWithdraw ?? 342800)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block leading-tight">
              Pending Withdrawal
            </span>
            <span className="font-mono font-bold text-amber-700 text-xs sm:text-[13px] mt-0.5 block">
              {fmt(w.pendingWithdrawal ?? 45000)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block leading-tight">
              Processing
            </span>
            <span className="font-mono font-bold text-slate-600 text-xs sm:text-[13px] mt-0.5 block">
              {fmt(w.processing ?? 0)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block leading-tight">
              Completed
            </span>
            <span className="font-mono font-bold text-emerald-700 text-xs sm:text-[13px] mt-0.5 block">
              {fmt(w.completed ?? 586300)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 block leading-tight">
              Failed
            </span>
            <span className="font-mono font-bold text-slate-400 text-xs sm:text-[13px] mt-0.5 block">
              {fmt(w.failed ?? 0)}
            </span>
          </div>
        </div>

        {/* Recent Request Sub-card */}
        <div className="mt-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/70 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase">Recent Request</span>
              <span className="font-mono font-bold text-slate-900 text-xs">{recent.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-800 text-xs">
                {fmt(recent.amount)}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                <Clock className="size-2.5" />
                <span>{recent.statusLabel || 'Pending Approval'}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onShowToast?.(`Opening authorization modal for ${recent.id}`)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-2xs transition"
          >
            <span>Review</span>
            <ArrowRight className="size-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

