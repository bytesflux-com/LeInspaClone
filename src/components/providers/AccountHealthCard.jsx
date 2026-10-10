import { CheckCircle2, AlertTriangle, Ban, Clock } from 'lucide-react'
import { formatNumber } from '../../lib/format'

export default function AccountHealthCard({ accountHealth }) {
  if (!accountHealth) return null

  const items = [
    {
      id: 'healthy',
      label: 'Healthy',
      count: accountHealth.healthy,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      barColor: 'bg-emerald-500',
    },
    {
      id: 'needs_attention',
      label: 'Needs Attention',
      count: accountHealth.needsAttention,
      icon: AlertTriangle,
      color: 'text-amber-600',
      barColor: 'bg-amber-500',
    },
    {
      id: 'suspended',
      label: 'Suspended',
      count: accountHealth.suspended,
      icon: Ban,
      color: 'text-rose-600',
      barColor: 'bg-rose-500',
    },
    {
      id: 'inactive',
      label: 'Inactive',
      count: accountHealth.inactive,
      icon: Clock,
      color: 'text-slate-500',
      barColor: 'bg-slate-400',
    },
  ]

  const total = items.reduce((acc, it) => acc + (it.count || 0), 0)

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <h2 className="text-[15px] font-bold text-[#1b1140] pb-2">Provider Account Health</h2>

      {/* Progress segmented bar */}
      <div className="my-1.5 flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
        {items.map((it) => {
          const pct = total > 0 ? (it.count / total) * 100 : 0
          if (pct === 0) return null
          return (
            <div
              key={it.id}
              style={{ width: `${pct}%` }}
              className={`h-full ${it.barColor}`}
              title={`${it.label}: ${pct.toFixed(1)}%`}
            />
          )
        })}
      </div>

      {/* Grid of values */}
      <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-4">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <div key={it.id} className="flex items-center gap-2 rounded-lg bg-gray-50/50 p-2">
              <Icon className={`size-4 shrink-0 ${it.color}`} />
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-[#1b1140]">
                  {formatNumber(it.count)}
                </div>
                <div className="text-[10px] text-gray-500 line-clamp-1">{it.label}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

