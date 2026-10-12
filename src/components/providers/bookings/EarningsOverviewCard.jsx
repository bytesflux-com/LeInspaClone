import { useNavigate, useParams } from 'react-router'
import { Wallet, ChevronRight } from 'lucide-react'

export function EarningsOverviewCard({
  financials,
  canSeeFinancial = true,
}) {
  const navigate = useNavigate()
  const { providerId: routeProviderId } = useParams()
  const f = financials || {}

  const cur = f.currency || ''
  const fmt = (val) =>
    canSeeFinancial ? (typeof val === 'number' ? `${cur} ${val.toLocaleString()}` : val || '—') : '—'

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Wallet className="size-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Earnings Overview</h3>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/providers/${routeProviderId}/earnings`)}
            className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-0.5"
          >
            <span>View Details</span>
            <ChevronRight className="size-3" />
          </button>
        </div>

        {/* Top Metric Row: Gross, Provider, Platform */}
        <div className="grid grid-cols-3 gap-3 py-3 border-b border-slate-100">
          <div>
            <span className="text-[10.5px] font-semibold text-slate-400 block leading-tight">
              Gross Service Value
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm sm:text-base mt-0.5 block">
              {fmt(f.grossServiceValue ?? 0)}
            </span>
          </div>

          <div>
            <span className="text-[10.5px] font-semibold text-slate-400 block leading-tight">
              Provider Earnings
            </span>
            <span className="font-mono font-bold text-purple-700 text-sm sm:text-base mt-0.5 block">
              {fmt(f.providerEarnings ?? 0)}
            </span>
          </div>

          <div>
            <span className="text-[10.5px] font-semibold text-slate-400 block leading-tight">
              Platform Fees
            </span>
            <span className="font-mono font-bold text-slate-600 text-sm sm:text-base mt-0.5 block">
              {fmt(f.platformFees ?? 0)}
            </span>
          </div>
        </div>

        {/* Bottom Metric Row: Pending Escrow, Available Balance, Paid Out */}
        <div className="grid grid-cols-3 gap-3 pt-3">
          <div>
            <span className="text-[10.5px] font-semibold text-slate-400 block leading-tight">
              Pending Escrow
            </span>
            <span className="font-mono font-bold text-amber-700 text-sm sm:text-base mt-0.5 block">
              {fmt(f.pendingEscrow ?? 0)}
            </span>
          </div>

          <div>
            <span className="text-[10.5px] font-semibold text-slate-400 block leading-tight">
              Available Balance
            </span>
            <span className="font-mono font-bold text-emerald-700 text-sm sm:text-base mt-0.5 block">
              {fmt(f.availableBalance ?? 0)}
            </span>
          </div>

          <div>
            <span className="text-[10.5px] font-semibold text-slate-400 block leading-tight">
              Paid Out
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm sm:text-base mt-0.5 block">
              {fmt(f.paidOut ?? 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

