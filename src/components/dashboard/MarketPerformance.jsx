import { Globe2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatNumber } from '../../lib/utils'
import { formatDisplayCurrency } from '../../lib/currency'
import { useMarketContext } from '../../hooks/useMarketContext'
import CountryFlag from '../ui/CountryFlag'

export default function MarketPerformance({ markets = [] }) {
  const { setSelectedMarket } = useMarketContext()

  if (!markets || markets.length === 0) return null

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe2 className="size-5 text-[#5c2dd5]" />
          <h2 className="text-base font-bold text-gray-900">Market Performance</h2>
        </div>
        <Link
          to="/markets"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#5c2dd5] hover:text-[#4922ab] transition-colors"
        >
          <span>View All Markets</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-500 pb-2">
              <th className="py-2.5 font-medium">Market</th>
              <th className="py-2.5 font-medium">Bookings</th>
              <th className="py-2.5 font-medium">Revenue</th>
              <th className="py-2.5 font-medium">Providers</th>
              <th className="py-2.5 font-medium">Attention</th>
              <th className="py-2.5 font-medium">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {markets.map((m) => (
              <tr
                key={m.id}
                onClick={() => setSelectedMarket(m.id)}
                className="group cursor-pointer hover:bg-purple-50/30 transition-colors"
                title={`Filter platform view to ${m.name}`}
              >
                <td className="py-3 font-medium text-gray-900 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <CountryFlag code={m.id} className="w-5 h-3.5" />
                    <span className="group-hover:text-[#5c2dd5] transition-colors">{m.name}</span>
                  </div>
                </td>
                <td className="py-3 text-gray-700 tabular-nums">
                  {formatNumber(m.bookings)}
                </td>
                <td className="py-3 font-medium text-gray-900 tabular-nums">
                  {m.revenueFormatted || formatDisplayCurrency(m.revenue, 'KES')}
                </td>
                <td className="py-3 text-gray-700 tabular-nums">
                  {formatNumber(m.providers)}
                </td>
                <td className="py-3 font-bold text-rose-500 tabular-nums">
                  {m.attention ?? 0}
                </td>
                <td className="py-3 whitespace-nowrap">
                  {m.health === 'Attention' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                      <span className="size-2 rounded-full bg-amber-500" />
                      <span>Attention</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <span>Healthy</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
