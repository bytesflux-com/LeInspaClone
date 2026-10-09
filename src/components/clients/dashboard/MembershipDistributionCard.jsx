import { ChartPie } from 'lucide-react'
import Skeleton from '../../ui/Skeleton'
import { formatNumber } from '../../../lib/format'
import { cn } from '../../../lib/utils'
import { DashCard } from './DashCard'
import { TIER_COLORS, TierDonut } from './charts'

// Clicking a tier (donut slice or legend row) filters the client directory.
export default function MembershipDistributionCard({ membership, activeSegment, onSelectTier }) {
  return (
    <DashCard icon={ChartPie} iconClass="text-[#3b2a82] fill-[#3b2a82]" title="Membership Distribution">
      {!membership ? (
        <div className="flex items-center gap-4"><Skeleton className="size-[112px] rounded-full" /><div className="flex-1 space-y-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-4" />)}</div></div>
      ) : (
        <div className="flex items-center gap-4">
          <TierDonut slices={membership.slices} total={membership.total} activeId={['standard', 'premium', 'executive'].includes(activeSegment) ? activeSegment : null} onSelect={(id) => id !== 'none' && onSelectTier(id)} />
          <ul className="min-w-0 flex-1 space-y-1 text-[11px]">
            {membership.slices.map((s) => {
              const clickable = s.id !== 'none'
              const Row = clickable ? 'button' : 'div'
              return (
                <li key={s.id}>
                  <Row
                    {...(clickable ? { type: 'button', onClick: () => onSelectTier(s.id), 'aria-label': `Filter directory to ${s.label} clients` } : {})}
                    className={cn('grid w-full grid-cols-[10px_1fr_auto_auto] items-center gap-x-2 rounded-md px-1 py-0.5 text-left', clickable && 'hover:bg-[#f4f1fc]')}
                  >
                    <span className="size-2.5 rounded-full" style={{ background: TIER_COLORS[s.id] }} />
                    <span className="text-[#1b1140]">{s.label}</span>
                    <span className="w-10 text-right text-[#4a4466]">{s.pct.toFixed(1)}%</span>
                    <span className="w-10 text-right font-medium text-[#1b1140]">{formatNumber(s.count)}</span>
                  </Row>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </DashCard>
  )
}
