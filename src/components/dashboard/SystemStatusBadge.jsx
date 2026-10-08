import { CheckCircle2 } from 'lucide-react'

export default function SystemStatusBadge({ status = 'healthy', uptime = '99.98%' }) {
  const isHealthy = status === 'healthy'

  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 shadow-xs">
      <span className={`size-2 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
      <span className="text-gray-900 font-bold">{isHealthy ? 'Live Telemetry' : 'Degraded'}</span>
      <span className="text-gray-400">·</span>
      <span className="text-gray-500">{uptime} Uptime</span>
    </div>
  )
}

