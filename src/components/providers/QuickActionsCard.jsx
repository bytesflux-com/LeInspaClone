import { useNavigate } from 'react-router'
import {
  Users,
  BadgeCheck,
  FileCheck,
  Banknote,
  Ban,
  ArrowRight,
} from 'lucide-react'

export default function QuickActionsCard({ onOpenContentReview }) {
  const navigate = useNavigate()

  const actions = [
    {
      id: 'all_providers',
      label: 'View All Providers',
      icon: Users,
      action: () => navigate('/providers/all'),
      color: 'text-[#5c2dd5]',
      bg: 'bg-[#5c2dd5]/10',
    },
    {
      id: 'verifications',
      label: 'Review Verifications',
      icon: BadgeCheck,
      action: () => navigate('/verifications'),
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    {
      id: 'content',
      label: 'Review Content',
      icon: FileCheck,
      action: onOpenContentReview || (() => navigate('/content')),
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
    },
    {
      id: 'withdrawals',
      label: 'Review Withdrawals',
      icon: Banknote,
      action: () => navigate('/withdrawals'),
      color: 'text-purple-600',
      bg: 'bg-purple-500/10',
    },
    {
      id: 'suspended',
      label: 'View Suspended Accounts',
      icon: Ban,
      action: () => navigate('/providers/all?status=suspended'),
      color: 'text-rose-600',
      bg: 'bg-rose-500/10',
    },
  ]

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      <h2 className="text-[15px] font-bold text-[#1b1140] pb-2">Quick Operations</h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((act) => {
          const Icon = act.icon
          return (
            <button
              key={act.id}
              type="button"
              onClick={act.action}
              className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 text-left transition hover:border-[#cfc5ee] hover:bg-white hover:shadow-xs"
            >
              <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${act.bg}`}>
                <Icon className={`size-3.5 ${act.color}`} />
              </div>
              <span className="text-[11.5px] font-semibold text-[#1b1140] line-clamp-1">
                {act.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

