import { CircleCheck, CircleX, Clock, Footprints, Globe, RefreshCw, Smartphone, TriangleAlert, User } from 'lucide-react'
import { BOOKING_ESCROW_STYLE, BOOKING_PAYMENT_STYLE, BOOKING_STATUS_STYLE, SOURCE_LABELS } from '../../../constants/clientBookings'
import { cn } from '../../../lib/utils'

const PILL = 'inline-flex items-center gap-1.5 rounded-lg px-2 py-[7px] text-[11.5px] leading-none font-medium whitespace-nowrap'

const STATUS_ICON = {
  confirmed: CircleCheck,
  completed: CircleCheck,
  pending: Clock,
  ongoing: Clock,
  cancelled: CircleX,
  disputed: TriangleAlert,
}
const PAYMENT_ICON = { paid: CircleCheck, pending: Clock, failed: CircleX, refunding: RefreshCw, refunded: CircleCheck }

export function StatusPill({ status, className }) {
  const s = BOOKING_STATUS_STYLE[status] || BOOKING_STATUS_STYLE.pending
  const Icon = STATUS_ICON[status] || CircleCheck
  return (
    <span className={cn(PILL, s.box, className)}>
      <Icon className={cn('size-[15px]', s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  )
}

export function PaymentPill({ status, className }) {
  const s = BOOKING_PAYMENT_STYLE[status] || BOOKING_PAYMENT_STYLE.pending
  const Icon = PAYMENT_ICON[status] || CircleCheck
  return (
    <span className={cn(PILL, s.box, className)}>
      <Icon className={cn('size-[15px]', status === 'refunding' ? 'text-[#e8791a]' : s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  )
}

export function EscrowPill({ status, className }) {
  const s = BOOKING_ESCROW_STYLE[status]
  if (!s) return <span className="text-[12px] text-[#6b6785]">—</span>
  return (
    <span className={cn(PILL, s.box, className)}>
      <CircleCheck className={cn('size-[15px]', s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  )
}

const SOURCE_ICON = { app: Smartphone, website: Globe, guest: User, walkin: Footprints }

export function SourceCell({ source, className }) {
  const Icon = SOURCE_ICON[source] || Smartphone
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[12px] text-[#1b1140]', className)}>
      <Icon className="size-4 shrink-0 text-[#4527c8]" aria-hidden="true" />
      {SOURCE_LABELS[source] || source}
    </span>
  )
}
