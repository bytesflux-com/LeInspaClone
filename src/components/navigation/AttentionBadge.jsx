import { cn } from '../../lib/utils'
import { useAttentionSummary } from '../../hooks/useAttentionSummary'

// Live open-item count for a Needs-Your-Attention category; hidden when zero or unknown.
export default function AttentionBadge({ category, className }) {
  const { summary } = useAttentionSummary()
  const count = summary?.[category]
  if (!count) return null
  return (
    <span className={cn('rounded-full bg-amber-500/90 px-1.5 py-0.2 text-[9.5px] font-bold text-white shadow-xs', className)}>
      {count > 999 ? '999+' : count}
    </span>
  )
}
