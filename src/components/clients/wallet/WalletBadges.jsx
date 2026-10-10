import { Banknote, CircleCheck, CircleX, Clock, Crown, Landmark, LockKeyhole, RotateCcw, Smartphone, Star, Wallet } from 'lucide-react'
import { EFFECT_STYLE, WALLET_STATUS_STYLE } from '../../../constants/clientWallet'
import { cn } from '../../../lib/utils'

const PILL = 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-[7px] text-[11.5px] leading-none font-medium whitespace-nowrap'
const ICONS = { check: CircleCheck, clock: Clock, x: CircleX }

export function WalletStatusPill({ status, className }) {
  const s = WALLET_STATUS_STYLE[status] || WALLET_STATUS_STYLE.pending
  const Icon = ICONS[s.icon]
  return (
    <span className={cn(PILL, s.box, className)}>
      <Icon className={cn('size-[15px]', s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  )
}

export function EffectChip({ direction, className }) {
  const s = EFFECT_STYLE[direction] || EFFECT_STYLE.none
  return <span className={cn('inline-flex items-center rounded-md px-2.5 py-[5px] text-[11.5px] leading-none font-medium whitespace-nowrap', s.box, className)}>{s.label}</span>
}

// Signed amount: green "+ KES 5,000", red "- KES 4,500", neutral for failed attempts.
export function SignedAmount({ amount, direction, currency, className }) {
  const sign = direction === 'credit' ? '+' : direction === 'debit' ? '-' : ''
  const tone = direction === 'credit' ? 'text-[#15803d]' : direction === 'debit' ? 'text-[#dc2626]' : 'text-[#4b5563]'
  return (
    <span className={cn('font-bold whitespace-nowrap tabular-nums', tone, className)}>
      {sign} {currency} {amount.toLocaleString('en-US')}
    </span>
  )
}

// Wallet-ledger glyph tile used in the Transaction ID column and the drawer header.
export function LedgerTile({ size = 30, failed = false, className }) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-lg', failed ? 'bg-[#fde8e8]' : 'bg-[#efebfc]', className)} style={{ width: size, height: size }} aria-hidden="true">
      <LockKeyhole className={cn(failed ? 'text-[#dc2626]' : 'text-[#1e40d8]', 'fill-current/20')} style={{ width: size * 0.5, height: size * 0.5 }} />
    </span>
  )
}

const TYPE_TILE = {
  topup: { bg: 'bg-[#e8e4fb]', icon: Wallet, color: 'text-[#3b1fd6]' },
  booking: { bg: 'bg-[#e8e4fb]', icon: Banknote, color: 'text-[#3b1fd6]' },
  refund: { bg: 'bg-[#e8e4fb]', icon: RotateCcw, color: 'text-[#3b1fd6]' },
  promo: { bg: 'bg-[#e1f5e8]', icon: Star, color: 'text-[#15803d]' },
  membership: { bg: 'bg-[#e8e4fb]', icon: Crown, color: 'text-[#3b1fd6]' },
}

export function TypeTile({ type, size = 32, className }) {
  const t = TYPE_TILE[type] || TYPE_TILE.topup
  const Icon = t.icon
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-lg', t.bg, className)} style={{ width: size, height: size }} aria-hidden="true">
      <Icon className={cn('size-[17px] fill-current/15', t.color)} />
    </span>
  )
}

export function MethodGlyph({ kind }) {
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
    default:
      return <Landmark className="size-[18px] shrink-0 text-[#4527c8]" aria-hidden="true" />
  }
}
