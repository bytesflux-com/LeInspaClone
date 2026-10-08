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

function getActivityVisuals(type) {
  switch (type) {
    case 'booking':
      return {
        icon: CalendarCheck,
        bg: 'bg-purple-50 text-[#5c2dd5]',
      }
    case 'verification':
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

export default function LiveActivityFeed({ activities = [] }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm min-w-0">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-[#5c2dd5]" />
            <h2 className="text-base font-bold text-gray-900">Live Activity Feed</h2>
          </div>
          <Link
            to="/operations"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#5c2dd5] hover:text-[#4922ab] transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {activities.map((item) => {
            const visuals = getActivityVisuals(item.type)
            const Icon = visuals.icon

            return (
              <div key={item.id} className="flex items-start gap-2.5">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${visuals.bg}`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                    {item.priority && (
                      <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
                        {item.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">{item.subtitle}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.meta}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

