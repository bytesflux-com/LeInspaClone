import { HeartPulse, ArrowRight, CheckCircle2, Clock } from 'lucide-react'
import { Link } from 'react-router'

const DEFAULT_NODES = [
  { name: 'Authentication', status: 'Operational' },
  { name: 'Booking Engine', status: 'Operational' },
  { name: 'Payments', status: 'Operational' },
  { name: 'Notifications', status: 'Operational' },
  { name: 'Maps', status: 'Operational' },
  { name: 'Database', status: 'Operational' },
]

export default function SystemHealth({ systemHealth }) {
  const nodes = DEFAULT_NODES
  const lastChecked = systemHealth?.lastChecked || 'Just now'

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all duration-200">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#5c2dd5] shadow-2xs">
              <HeartPulse className="size-4" />
            </span>
            <h2 className="text-sm font-bold text-gray-950">System Health</h2>
          </div>
          <Link
            to="/system-health"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5c2dd5] hover:text-[#4922ab] bg-purple-50/60 hover:bg-purple-100/80 px-2 py-0.5 rounded-md transition-colors"
          >
            <span>View Details</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Global Status Banner */}
        <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 border border-emerald-200/60 px-3 py-1.5 mb-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            <span>All Core Services Operational</span>
          </div>
          <span className="font-extrabold text-emerald-700 tabular-nums text-[11px]">99.98%</span>
        </div>

        {/* 6 Micro-Service Tiles in 2 Columns */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {nodes.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between p-2 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-purple-50/30 transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0 pr-1">
                <span className="size-2 rounded-full bg-emerald-500 shadow-xs shrink-0" />
                <span className="text-gray-800 font-semibold truncate text-[11px]">{item.name}</span>
              </div>
              <span className="rounded-md bg-emerald-100/70 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-700 shrink-0">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="size-3 text-gray-400" />
          <span>Last checked: {lastChecked}</span>
        </span>
        <span className="font-semibold text-emerald-600">Zero active incidents</span>
      </div>
    </div>
  )
}
