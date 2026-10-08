import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import CountryFlag from '../ui/CountryFlag'

export default function RecentlyResolvedFeed({ items = [] }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm min-w-0">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4.5 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900">Resolved Recently</h3>
          </div>
          <Link
            to="/audit-logs"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#5c2dd5] hover:text-[#4922ab] transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-gray-50 text-xs">
          {items.map((res) => (
            <div key={res.id} className="flex items-start justify-between py-2 gap-2">
              <div className="flex items-start gap-1.5 min-w-0">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{res.title}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {res.amount || res.entity || res.ticketId || res.note}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-right">
                <CountryFlag code={res.market} className="w-4 h-2.5" />
                <span className="text-[10px] text-gray-400 tabular-nums">{res.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

