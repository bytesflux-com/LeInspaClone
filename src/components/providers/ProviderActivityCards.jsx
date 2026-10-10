import { Wifi, Calendar, Clock, AlertCircle } from 'lucide-react'
import { formatNumber } from '../../lib/format'

export default function ProviderActivityCards({ activity }) {
  if (!activity) return null

  const items = [
    {
      id: 'available',
      label: 'Available Now',
      count: activity.availableNow,
      icon: Wifi,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'booked',
      label: 'Booked Today',
      count: activity.bookedToday,
      icon: Calendar,
      color: 'text-[#5c2dd5]',
      bg: 'bg-[#5c2dd5]/10',
    },
    {
      id: 'unavailable',
      label: 'Unavailable',
      count: activity.unavailable,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    {
      id: 'no_schedule',
      label: 'No Availability Configured',
      count: activity.noScheduleConfigured,
      icon: AlertCircle,
      color: 'text-gray-500',
      bg: 'bg-gray-100',
    },
  ]

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <h2 className="text-[15px] font-bold text-[#1b1140] pb-3">Provider Activity</h2>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <div
              key={it.id}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/40 p-3 transition hover:border-[#cfc5ee] hover:bg-white"
            >
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${it.bg}`}>
                <Icon className={`size-4.5 ${it.color}`} />
              </div>
              <div className="min-w-0">
                <div className="text-[18px] font-extrabold text-[#1b1140]">
                  {formatNumber(it.count)}
                </div>
                <div className="text-[11px] font-medium text-gray-500 line-clamp-1">
                  {it.label}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

