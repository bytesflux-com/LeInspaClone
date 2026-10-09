import { ChartPie, Crown, Gem, Link2, User, UserX, Users } from 'lucide-react'
import Skeleton from '../../ui/Skeleton'
import { formatNumber } from '../../../lib/format'
import { cn } from '../../../lib/utils'
import { DashCard } from './DashCard'

export const SEGMENTS = [
  { id: 'all', label: 'All Clients', icon: Users, circle: 'bg-[#6d4be0] text-white', rounded: 'rounded-lg' },
  { id: 'standard', label: 'Standard', icon: User, circle: 'bg-[#dce6ff] text-[#3b6fe6]' },
  { id: 'premium', label: 'Premium', icon: Crown, circle: 'bg-[#ffe9c7] text-[#e8890c]', fill: true },
  { id: 'executive', label: 'Executive', icon: Gem, circle: 'bg-[#e6defc] text-[#6d3fe0]', fill: true },
  { id: 'guest', label: 'Guest Converted', icon: Link2, circle: 'bg-[#d9f5e2] text-[#1f9d4d]' },
  { id: 'suspended', label: 'Suspended', icon: UserX, circle: 'bg-[#fde0e0] text-[#dc2626]' },
  { id: 'inactive', label: 'Inactive', icon: User, circle: 'bg-[#e6e8ee] text-[#5d6579]', fill: true },
]

export default function ClientSegmentsCard({ counts, active, onSelect }) {
  return (
    <DashCard icon={ChartPie} iconClass="text-[#5b2fd0] fill-[#e6defc]" title="Client Segments">
      <div role="tablist" aria-label="Client segments" className="grid grid-cols-2 gap-2 @xl:grid-cols-4 @[62rem]:grid-cols-[0.95fr_0.9fr_0.9fr_0.95fr_1.25fr_0.95fr_0.9fr]">
        {SEGMENTS.map(({ id, label, icon: Icon, circle, rounded = 'rounded-full', fill }) => {
          const selected = active === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onSelect(id)}
              className={cn(
                'flex min-w-0 items-center gap-2 overflow-hidden rounded-xl border bg-white px-2 py-1.5 text-left transition',
                selected ? 'border-2 border-[#7a5cf0] bg-[#f1edff]' : 'border-[#e6e1f3] hover:border-[#cfc5ee] hover:bg-[#faf8ff]',
              )}
            >
              <span className={cn('flex size-7 shrink-0 items-center justify-center', rounded, circle)}>
                <Icon className={cn('size-4', fill && 'fill-current')} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] leading-tight font-semibold tracking-[-0.025em] whitespace-nowrap text-[#1b1140]">{label}</span>
                {counts ? (
                  <span className="block text-[14px] leading-tight font-medium text-[#1b1140]">{formatNumber(counts[id])}</span>
                ) : (
                  <Skeleton className="mt-1 h-4 w-10" />
                )}
              </span>
            </button>
          )
        })}
      </div>
    </DashCard>
  )
}
