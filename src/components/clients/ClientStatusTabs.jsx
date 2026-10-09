import { Users, UserCheck, ShieldCheck, User, UserX, SquareCheck } from 'lucide-react'
import { CLIENT_STATUS_TABS } from '../../constants/clients'
import { formatNumber } from '../../lib/format'
import { cn } from '../../lib/utils'

const TAB_STYLE = {
  all: { icon: Users, circle: 'bg-[#e6defc] text-[#5b2fd0]' },
  active: { icon: UserCheck, circle: 'bg-[#d9f5e2] text-[#1f9d4d]' },
  pending: { icon: ShieldCheck, circle: 'bg-[#ffe7c9] text-[#e8890c]' },
  inactive: { icon: User, circle: 'bg-[#e6e8ee] text-[#5d6579]' },
  suspended: { icon: UserX, circle: 'bg-[#fde0e0] text-[#dc2626]' },
  deactivated: { icon: SquareCheck, circle: 'bg-[#dfe3ea] text-[#3f4d63]' },
}

export default function ClientStatusTabs({ active, counts, loading, onChange }) {
  return (
    <div role="tablist" aria-label="Filter clients by status" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
      {CLIENT_STATUS_TABS.map((tab) => {
        const { icon: Icon, circle } = TAB_STYLE[tab.id]
        const selected = active === tab.id
        const value = counts?.[tab.id]
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 text-left transition',
              selected
                ? 'border-2 border-[#7a5cf0] bg-[#f1edff] shadow-[0_2px_10px_-4px_rgba(91,47,208,0.35)]'
                : 'border-[#e6e1f3] hover:border-[#cfc5ee] hover:bg-[#faf8ff]',
            )}
          >
            <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', circle)}>
              <Icon className="size-[18px]" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-medium leading-tight text-[#2a1b57]">{tab.label}</span>
              <span className={cn('mt-0.5 block text-[22px] font-bold leading-none tracking-tight text-[#1b1140]', loading && value === undefined && 'text-transparent')}>
                {value === undefined ? '0000' : formatNumber(value)}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
