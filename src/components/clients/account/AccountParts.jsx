import { Ban, CircleCheck, CircleMinus, Clock, Power } from 'lucide-react'
import { HISTORY_STATUS_STYLE, NOTIFICATION_STATUS_STYLE } from '../../../constants/clientAccount'
import { cn } from '../../../lib/utils'

// Shared ADM-019 building blocks — same card chrome as ADM-012 → ADM-018.
export const CARD =
  'rounded-xl border border-[#e6e1f3] bg-white p-3.5 shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)]'
export const H2 = 'text-[17px] leading-tight font-bold tracking-tight text-[#1b1140]'
export const LINK = 'inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#3b1fd6] hover:underline'
export const OUTLINE_BTN =
  'inline-flex h-[30px] w-full items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-[#6b4df0] bg-white px-2 text-[12px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc] disabled:cursor-not-allowed disabled:border-[#cfc8ea] disabled:text-[#8b86a5] disabled:hover:bg-white'
export const VIEW_BTN =
  'inline-flex h-[24px] items-center justify-center gap-1 rounded-md border-[1.5px] border-[#6b4df0] bg-white px-2.5 text-[11px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]'

export function StatusPill({ style, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-[4px] text-[11px] leading-none font-medium whitespace-nowrap', style.box, className)}>
      <CircleCheck className={cn('size-[14px]', style.dot)} aria-hidden="true" />
      {style.label}
    </span>
  )
}

export const HistoryStatus = ({ status }) => <StatusPill style={HISTORY_STATUS_STYLE[status] || HISTORY_STATUS_STYLE.completed} />
export const NotificationStatus = ({ status }) => <StatusPill style={NOTIFICATION_STATUS_STYLE[status] || NOTIFICATION_STATUS_STYLE.delivered} />

// Glyph shown inside the big account-state pill.
export function StateGlyph({ icon, className }) {
  const Icon = { check: CircleCheck, ban: Ban, power: Power, minus: CircleMinus, clock: Clock }[icon] || CircleCheck
  return <Icon className={className} aria-hidden="true" />
}

// A glyph with the small red "not allowed" badge used on the restriction cards.
export function BadgedGlyph({ icon: Icon, tone = 'text-[#3b1fd6]', className }) {
  return (
    <span className={cn('relative inline-flex size-[34px] shrink-0 items-center justify-center', className)} aria-hidden="true">
      <Icon className={cn('size-[30px]', tone)} strokeWidth={2.2} />
      <span className="absolute -right-1 -bottom-1 flex size-[17px] items-center justify-center rounded-full bg-white">
        <Ban className="size-[16px] text-[#e11d2e]" strokeWidth={3} />
      </span>
    </span>
  )
}
