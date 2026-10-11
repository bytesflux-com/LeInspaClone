import { CircleAlert, CircleCheck, CircleDot, Flag, Headphones, Info, Scale, ShieldAlert } from 'lucide-react'
import { PRIORITY_STYLE, STATUS_STYLE, UNRESOLVED } from '../../../constants/clientSupport'
import { cn } from '../../../lib/utils'

const PILL = 'inline-flex items-center gap-1.5 rounded-lg px-2 py-[5px] text-[11.5px] leading-none font-medium whitespace-nowrap'
const ICONS = { dot: CircleDot, info: Info, check: CircleCheck }

// Status pill. Safety cases say "Under Investigation"; every other case system says "Investigating".
export function CaseStatusPill({ status, className }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.open
  const Icon = ICONS[s.icon]
  return (
    <span className={cn(PILL, s.box, className)}>
      <Icon className={cn('size-[15px]', s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  )
}

export function PriorityText({ priority, className }) {
  const p = PRIORITY_STYLE[priority] || PRIORITY_STYLE.normal
  return <span className={cn('text-[12px]', p.cls, className)}>{p.label}</span>
}

// Case glyph tile. Support = lavender, an unresolved ordinary ticket reads as a soft alert,
// dispute = indigo, report = green, safety = red (the only red tile on the screen).
export function CaseTile({ type, status, size = 24, className }) {
  const open = UNRESOLVED.includes(status)
  let box = 'bg-[#e8e2fb]'
  let Icon = Headphones
  let tone = 'text-[#4527c8]'
  if (type === 'dispute') { box = 'bg-[#4527c8]'; Icon = Scale; tone = 'text-white' }
  else if (type === 'report') { box = 'bg-[#22a652]'; Icon = Flag; tone = 'text-white' }
  else if (type === 'safety') { box = 'bg-[#e03a3a]'; Icon = ShieldAlert; tone = 'text-white' }
  else if (open) { box = 'bg-[#e8473b]'; Icon = CircleAlert; tone = 'text-white' }
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-md', box, className)} style={{ width: size, height: size }} aria-hidden="true">
      <Icon className={tone} style={{ width: size * 0.58, height: size * 0.58 }} />
    </span>
  )
}
