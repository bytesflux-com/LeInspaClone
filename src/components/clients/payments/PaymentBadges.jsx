import { BadgeDollarSign, CircleCheck, CircleX, Clock, Flame, Landmark, Receipt, RotateCcw, ShieldCheck, Smartphone, Wallet } from 'lucide-react'
import { PAYMENT_STATUS_STYLE } from '../../../constants/clientPayments'
import { cn } from '../../../lib/utils'

const PILL = 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-[7px] text-[11.5px] leading-none font-medium whitespace-nowrap'
const ICONS = { check: CircleCheck, clock: Clock, x: CircleX }

export function PaymentStatusPill({ status, className }) {
  const s = PAYMENT_STATUS_STYLE[status] || PAYMENT_STATUS_STYLE.pending
  const Icon = ICONS[s.icon]
  return (
    <span className={cn(PILL, s.box, className)}>
      <Icon className={cn('size-[15px]', s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  )
}

// Small brand-style glyphs — no external assets.
function MethodGlyph({ kind }) {
  switch (kind) {
    case 'mpesa':
      return (
        <span className="flex h-[22px] w-[18px] shrink-0 items-center justify-center rounded-[4px] bg-[#2fa84f]" aria-hidden="true">
          <Smartphone className="size-3 text-white" />
        </span>
      )
    case 'visa':
      return <span className="flex h-[16px] w-[26px] shrink-0 items-center justify-center rounded-[3px] bg-[#1a3fa8] text-[7px] font-extrabold tracking-wide text-white italic" aria-hidden="true">VISA</span>
    case 'mastercard':
      return (
        <span className="relative flex h-[16px] w-[24px] shrink-0 items-center justify-center" aria-hidden="true">
          <span className="absolute left-[2px] size-[13px] rounded-full bg-[#e5303a]" />
          <span className="absolute right-[2px] size-[13px] rounded-full bg-[#f5a31a] mix-blend-multiply" />
        </span>
      )
    case 'original':
      return (
        <span className="flex size-[20px] shrink-0 items-center justify-center rounded-full bg-[#d9dbe3]" aria-hidden="true">
          <RotateCcw className="size-3 text-[#3f4457]" />
        </span>
      )
    case 'wallet':
      return <Wallet className="size-[18px] shrink-0 text-[#4527c8]" aria-hidden="true" />
    default:
      return <Landmark className="size-[18px] shrink-0 text-[#4527c8]" aria-hidden="true" />
  }
}

export function MethodCell({ method, className }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-[12px] whitespace-nowrap text-[#1b1140]', className)}>
      <MethodGlyph kind={method.kind} />
      {method.label}
    </span>
  )
}

// Square tile used in the Transaction column (red for failed attempts).
export function TransactionTile({ failed, size = 34 }) {
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-lg', failed ? 'bg-[#fde8e8]' : 'bg-[#efebfc]')}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Receipt className={cn('size-[18px]', failed ? 'text-[#dc2626]' : 'text-[#4527c8]')} />
    </span>
  )
}

// Related-to visual: booking thumbnail, or a coloured tile for membership / wallet / fee.
export function RelatedVisual({ payment: p, size = 40, className }) {
  if (p.image) return <img src={p.image} alt="" loading="lazy" className={cn('shrink-0 rounded-lg object-cover', className)} style={{ width: size, height: size }} />
  const tile = {
    membership: { bg: 'bg-[#ffe9d9]', icon: Flame, color: 'text-[#e5483a]' },
    wallet: { bg: 'bg-[#14503a]', icon: Wallet, color: 'text-white' },
    fee: { bg: 'bg-[#3b1fd6]', icon: ShieldCheck, color: 'text-white' },
  }[p.type] || { bg: 'bg-[#efebfc]', icon: BadgeDollarSign, color: 'text-[#4527c8]' }
  const Icon = tile.icon
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-lg', tile.bg, className)} style={{ width: size, height: size }} aria-hidden="true">
      <Icon className={cn('size-[20px]', tile.color)} />
    </span>
  )
}
