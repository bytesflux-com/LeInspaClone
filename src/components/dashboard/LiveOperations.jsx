import { useState } from 'react'
import {
  Activity,
  CalendarCheck,
  UserCheck,
  BadgeDollarSign,
  ShieldAlert,
  UserPlus,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router'

function getOperationVisuals(type) {
  switch (type) {
    case 'booking':
      return {
        icon: CalendarCheck,
        bg: 'bg-purple-50 text-purple-600',
      }
    case 'provider':
      return {
        icon: UserCheck,
        bg: 'bg-blue-50 text-blue-600',
      }
    case 'withdrawal':
      return {
        icon: BadgeDollarSign,
        bg: 'bg-amber-50 text-amber-600',
      }
    case 'safety':
      return {
        icon: ShieldAlert,
        bg: 'bg-rose-50 text-rose-600',
      }
    case 'client':
    default:
      return {
        icon: UserPlus,
        bg: 'bg-indigo-50 text-indigo-600',
      }
  }
}

export default function LiveOperations({ operations = [] }) {
  const items = operations
  const [now] = useState(() => Date.now())
  const ago = (at) => {
    if (!at) return ''
    const mins = Math.max(0, Math.round((now - at) / 60000))
    if (mins < 60) return `${mins} min ago`
    if (mins < 1440) return `${Math.round(mins / 60)} h ago`
    return new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-[#5c2dd5]" />
            <h2 className="text-base font-bold text-gray-900">Live Operations</h2>
          </div>
          <Link
            to="/operations"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#5c2dd5] hover:text-[#4922ab] transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="space-y-3.5">
          {items.length === 0 && <p className="py-6 text-center text-xs text-gray-500">No activity in this market yet.</p>}
          {items.map((item) => {
            const visuals = getOperationVisuals(item.type)
            const Icon = visuals.icon

            return (
              <div key={item.id} className="flex items-start gap-3">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${visuals.bg}`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                    {item.priority && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                        {item.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">{item.subtitle}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{[item.meta, ago(item.at)].filter(Boolean).join(' • ')}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-5">
        <Link
          to="/operations"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-purple-50/80 py-2.5 text-xs font-semibold text-[#5c2dd5] hover:bg-purple-100 transition-colors"
        >
          <span>Open Operations Center</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}
