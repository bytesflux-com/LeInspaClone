import { WalletCards, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatDisplayCurrency } from '../../lib/currency'

export default function FinancialPosition({ financial }) {
  if (!financial) return null

  const currency = financial.currency || 'KES'

  const items = [
    {
      label: 'Customer Payments',
      value: formatDisplayCurrency(financial.customerPayments ?? 18430500, currency),
      valueClass: 'text-emerald-600 font-bold',
    },
    {
      label: 'In Escrow',
      value: formatDisplayCurrency(financial.inEscrow ?? 6912400, currency),
      valueClass: 'text-gray-900 font-bold',
    },
    {
      label: 'Provider Payable',
      value: formatDisplayCurrency(financial.providerPayable ?? 5482300, currency),
      valueClass: 'text-gray-900 font-bold',
    },
    {
      label: 'Platform Revenue',
      value: formatDisplayCurrency(financial.platformRevenue ?? 3482120, currency),
      valueClass: 'text-gray-900 font-bold',
    },
    {
      label: 'Pending Withdrawals',
      value: formatDisplayCurrency(financial.pendingWithdrawals ?? 1204800, currency),
      valueClass: 'text-amber-600 font-bold',
    },
  ]

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <WalletCards className="size-5 text-[#5c2dd5]" />
          <h2 className="text-base font-bold text-gray-900">Financial Position</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3">
              <span className="text-xs font-medium text-gray-600">{item.label}</span>
              <span className={`text-sm tabular-nums ${item.valueClass}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-50 text-center">
        <Link
          to="/finance"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5c2dd5] hover:text-[#4922ab] transition-colors"
        >
          <span>View Finance</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}
