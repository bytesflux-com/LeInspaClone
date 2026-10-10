import { useState } from 'react'
import { Wallet, Eye, EyeOff, ChevronRight, Lock, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

export function EarningsSummaryCard({
  profile,
  canSeeFinancial = true,
  onShowToast,
}) {
  const [revealed, setRevealed] = useState(false)

  if (!profile) return null

  const earnings = profile.earnings || {}
  const currency = earnings.currency || 'KES'

  const formatAmount = (num, formatted) => {
    if (!canSeeFinancial) return `${currency} —`
    if (!revealed) return `${currency} —`
    return formatted || `${currency} ${num?.toLocaleString()}`
  }

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Wallet className="size-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Earnings ({currency})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {canSeeFinancial ? (
              <button
                type="button"
                onClick={() => setRevealed(!revealed)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 px-2 py-1 rounded-md transition"
                title={revealed ? 'Mask Financial Data' : 'Reveal Financial Data'}
              >
                {revealed ? (
                  <>
                    <EyeOff className="size-3" /> Mask
                  </>
                ) : (
                  <>
                    <Eye className="size-3" /> Reveal
                  </>
                )}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                <Lock className="size-2.5" /> Restricted
              </span>
            )}
            <Link
              to={`/providers/${profile.id}/bookings`}
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-purple-700 hover:text-purple-900"
            >
              <span>View Earnings</span>
              <ChevronRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* 4 Financial Metric Columns Matching Screenshot */}
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {/* Total Earnings */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-500 font-medium truncate">Total Earnings</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1 truncate">
              {formatAmount(earnings.totalEarnings, earnings.totalEarningsFormatted)}
            </p>
          </div>

          {/* This Month */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-500 font-medium truncate">This Month</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 mt-1 truncate">
              {formatAmount(earnings.thisMonth, earnings.thisMonthFormatted)}
            </p>
          </div>

          {/* Pending */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-500 font-medium truncate">Pending</p>
            <p className="text-xs sm:text-sm font-bold text-amber-700 mt-1 truncate">
              {formatAmount(earnings.pending, earnings.pendingFormatted)}
            </p>
          </div>

          {/* Available for Withdrawal */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-500 font-medium truncate">Available</p>
            <p className="text-xs sm:text-sm font-bold text-emerald-700 mt-1 truncate">
              {formatAmount(earnings.availableForWithdrawal, earnings.availableFormatted)}
            </p>
          </div>
        </div>

        {/* Permission Note */}
        {!revealed && (
          <p className="text-[10.5px] text-slate-400 mt-2 text-center">
            {canSeeFinancial
              ? 'Click Reveal above to view authorized balances'
              : 'Permission-controlled ledger. Contact Super Admin for access.'}
          </p>
        )}
      </div>

      {/* Footer Navigation Links */}
      <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between text-xs">
        <Link
          to={`/finance?providerId=${profile.id}`}
          className="text-purple-700 hover:text-purple-900 font-semibold hover:underline"
        >
          View Earnings
        </Link>
        <span className="text-slate-300">•</span>
        <Link
          to={`/finance?providerId=${profile.id}&tab=wallet`}
          className="text-purple-700 hover:text-purple-900 font-semibold hover:underline"
        >
          View Wallet
        </Link>
        <span className="text-slate-300">•</span>
        <Link
          to={`/withdrawals?providerId=${profile.id}`}
          className="text-purple-700 hover:text-purple-900 font-semibold hover:underline"
        >
          View Withdrawals
        </Link>
      </div>
    </div>
  )
}

