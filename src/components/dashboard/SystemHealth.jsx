import { HeartPulse, ArrowRight } from 'lucide-react'
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

  const col1 = nodes.slice(0, 3)
  const col2 = nodes.slice(3, 6)

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="size-5 text-[#5c2dd5]" />
            <h2 className="text-base font-bold text-gray-900">System Health</h2>
          </div>
          <Link
            to="/system-health"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#5c2dd5] hover:text-[#4922ab] transition-colors"
          >
            <span>View Details</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
          <div className="space-y-2.5">
            {col1.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>{item.name}</span>
                </div>
                <span className="text-emerald-600 font-medium text-[11px]">{item.status}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            {col2.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>{item.name}</span>
                </div>
                <span className="text-emerald-600 font-medium text-[11px]">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 text-right">
        <span className="text-[11px] text-gray-400">Last checked: {lastChecked}</span>
      </div>
    </div>
  )
}
