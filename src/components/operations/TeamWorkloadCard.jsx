import { Users, ChevronRight, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatNumber } from '../../lib/utils'

export default function TeamWorkloadCard({ workloads = [] }) {
  const getDot = (team) => {
    if (team.includes('Finance')) return 'bg-purple-500'
    if (team.includes('Verification')) return 'bg-emerald-500'
    if (team.includes('Support')) return 'bg-blue-500'
    if (team.includes('Safety')) return 'bg-rose-500'
    return 'bg-purple-500'
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm min-w-0">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Users className="size-4.5 text-[#5c2dd5]" />
            <h3 className="text-sm font-bold text-gray-900">Team Workload</h3>
          </div>
          <Link
            to="/team"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#5c2dd5] hover:text-[#4922ab] transition-colors"
          >
            <span>View Details</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-gray-50 text-xs">
          {workloads.map((w) => (
            <Link
              key={w.team}
              to={w.link || '/operations'}
              className="flex items-center justify-between py-2 hover:bg-purple-50/20 px-1 rounded-lg transition"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className={`size-2 rounded-full shrink-0 ${getDot(w.team)}`} />
                <span className="text-gray-700 font-medium truncate">{w.team}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500 font-semibold tabular-nums shrink-0">
                <span>{formatNumber(w.count)} open</span>
                <ChevronRight className="size-3 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

