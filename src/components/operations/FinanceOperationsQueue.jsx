import { WalletCards, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatNumber } from '../../lib/utils'

export default function FinanceOperationsQueue({ data }) {
  if (!data) return null

  const items = [
    { label: 'Withdrawals Awaiting Approval', count: data.withdrawalsAwaitingApproval ?? 7, badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
    { label: 'Payments Pending Verification', count: data.paymentsPendingVerification ?? 3, badge: 'bg-purple-100 text-[#5c2dd5]', dot: 'bg-purple-500' },
    { label: 'Escrow Holds', count: data.escrowHolds ?? 5, badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
    { label: 'Refunds Awaiting Review', count: data.refundsAwaitingReview ?? 2, badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
    { label: 'Reconciliation Exceptions', count: data.reconciliationExceptions ?? 1, badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  ]

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-4.5 shadow-2xs hover:shadow-md hover:border-amber-200 transition-all duration-200 min-w-0">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 shadow-2xs shrink-0">
              <WalletCards className="size-4" />
            </span>
            <h3 className="text-sm font-bold text-gray-900 truncate">Finance Operations</h3>
          </div>
          <Link
            to="/withdrawals"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5c2dd5] hover:text-[#4922ab] bg-purple-50/60 hover:bg-purple-100/80 px-2 py-0.5 rounded-md transition-colors whitespace-nowrap"
          >
            <span>View Queue</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50 text-xs">
          {items.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-2.5 px-1.5 -mx-1.5 rounded-lg hover:bg-amber-50/30 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <span className={`size-1.5 rounded-full shrink-0 ${row.dot}`} />
                <span className="text-gray-700 font-medium truncate text-xs">{row.label}</span>
              </div>
              <span
                className={`inline-flex items-center justify-center min-w-[24px] h-5 px-2 rounded-full text-[11px] font-extrabold tabular-nums shrink-0 ${row.badge}`}
              >
                {formatNumber(row.count)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
