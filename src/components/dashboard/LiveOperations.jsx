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

const DEFAULT_OPERATIONS = [
  {
    id: 'op-1',
    type: 'booking',
    title: 'Booking Confirmed',
    subtitle: 'Deep Tissue Massage',
    meta: 'Kenya • Just now',
  },
  {
    id: 'op-2',
    type: 'provider',
    title: 'Provider Approved',
    subtitle: 'Massage Therapist',
    meta: 'Kenya • 4 minutes ago',
  },
  {
    id: 'op-3',
    type: 'withdrawal',
    title: 'Withdrawal Submitted',
    subtitle: 'KES 24,500 • Awaiting Review',
    meta: 'Kenya • 8 minutes ago',
  },
  {
    id: 'op-4',
    type: 'safety',
    title: 'Safety Report Received',
    priority: 'High Priority',
    subtitle: 'Inappropriate content',
    meta: 'Uganda • 12 minutes ago',
  },
  {
    id: 'op-5',
    type: 'client',
    title: 'New Client Registration',
    subtitle: 'From Mobile App',
    meta: 'Tanzania • 15 minutes ago',
  },
]

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
  const items = operations.length > 0 ? operations : DEFAULT_OPERATIONS

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
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.meta}</p>
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
