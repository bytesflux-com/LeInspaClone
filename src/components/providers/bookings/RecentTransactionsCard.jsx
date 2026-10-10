import { Receipt, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export function RecentTransactionsCard({
  recentTransactions = [],
  canSeeFinancial = true,
  onShowToast,
}) {
  const list = recentTransactions && recentTransactions.length > 0 ? recentTransactions : [
    { typeLabel: 'Booking Payment Released', reference: '#LI-47182', amountFormatted: '+ KES 3,150', date: '8 Sep', isCredit: true },
    { typeLabel: 'Withdrawal Request', reference: 'WD-82914', amountFormatted: '− KES 45,000', date: '12 Sep', isCredit: false },
    { typeLabel: 'Refund Adjustment', reference: '#LI-46021', amountFormatted: '− KES 6,000', date: '2 Sep', isCredit: false },
    { typeLabel: 'Subscription Payment', reference: 'Provider Plan', amountFormatted: '− KES 2,500', date: '1 Sep', isCredit: false },
    { typeLabel: 'Booking Payment Released', reference: '#LI-45891', amountFormatted: '+ KES 3,600', date: '28 Aug', isCredit: true },
  ]

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Receipt className="size-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Transactions</h3>
          </div>

          <button
            type="button"
            onClick={() => onShowToast?.('Opening Provider Wallet & Transaction Ledger')}
            className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="size-3" />
          </button>
        </div>

        {/* Transactions List */}
        <div className="divide-y divide-slate-100 pt-1 text-xs">
          {list.map((tx, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${
                    tx.isCredit
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}
                >
                  {tx.isCredit ? (
                    <ArrowDownLeft className="size-3.5" />
                  ) : (
                    <ArrowUpRight className="size-3.5" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{tx.typeLabel}</p>
                  <p className="font-mono text-[10.5px] text-slate-400">{tx.reference}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`font-mono font-bold ${
                    tx.isCredit ? 'text-emerald-700' : 'text-slate-900'
                  }`}
                >
                  {canSeeFinancial ? tx.amountFormatted : 'KES —'}
                </p>
                <p className="text-[10px] text-slate-400">{tx.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

