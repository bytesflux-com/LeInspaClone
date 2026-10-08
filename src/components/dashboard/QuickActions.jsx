import { Zap, BadgeCheck, Banknote, Megaphone, Send } from 'lucide-react'
import { Link } from 'react-router'

const ACTIONS = [
  {
    label: 'Review Verification',
    icon: BadgeCheck,
    to: '/verifications',
    iconBg: 'bg-purple-50 text-[#5c2dd5]',
  },
  {
    label: 'Review Withdrawals',
    icon: Banknote,
    to: '/withdrawals',
    iconBg: 'bg-amber-50 text-amber-600',
  },
  {
    label: 'Create Campaign',
    icon: Megaphone,
    to: '/promotions',
    iconBg: 'bg-purple-50 text-[#5c2dd5]',
  },
  {
    label: 'Send Notification',
    icon: Send,
    to: '/notifications',
    iconBg: 'bg-purple-50 text-[#5c2dd5]',
  },
]

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="size-5 text-amber-500 fill-amber-500" />
        <h2 className="text-base font-bold text-gray-900">Quick Actions</h2>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {ACTIONS.map((act) => {
          const Icon = act.icon
          return (
            <Link
              key={act.label}
              to={act.to}
              className="flex items-center gap-2.5 rounded-xl border border-gray-200/80 bg-white p-3 hover:border-purple-300 hover:bg-purple-50/20 transition-all shadow-sm group"
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${act.iconBg} transition-transform group-hover:scale-105`}
              >
                <Icon className="size-4" />
              </div>
              <span className="text-xs font-bold text-gray-800 group-hover:text-[#5c2dd5] transition-colors leading-tight">
                {act.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
