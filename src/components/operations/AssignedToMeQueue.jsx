import { User, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

export default function AssignedToMeQueue({ cases = [] }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm min-w-0">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <User className="size-4.5 text-[#5c2dd5]" />
            <h3 className="text-sm font-bold text-gray-900">Assigned to Me</h3>
          </div>
          <Link
            to="/operations/my-tasks"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#5c2dd5] hover:text-[#4922ab] transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-gray-50 text-xs">
          {cases.map((c) => {
            const isHigh = c.urgency === 'high'
            return (
              <div key={c.id} className="flex items-center justify-between py-2">
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-gray-900 truncate">{c.title}</p>
                  <p className="text-[11px] text-gray-500 truncate">{c.entity}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-gray-400 tabular-nums">{c.waiting}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                      isHigh
                        ? 'bg-rose-50 text-rose-700 border border-rose-200/50'
                        : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                    }`}
                  >
                    {isHigh ? 'High' : 'Medium'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

