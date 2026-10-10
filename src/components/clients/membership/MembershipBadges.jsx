import { HISTORY_STATUS_STYLE, MEMBERSHIP_PAYMENT_STATUS_STYLE, MEMBERSHIP_STATUS_STYLE } from '../../../constants/clientMembership'
import { cn } from '../../../lib/utils'

const PILL = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-[6px] text-[12px] leading-none font-medium whitespace-nowrap'

function Pill({ style, className }) {
  const Icon = style.icon
  return (
    <span className={cn(PILL, style.box, className)}>
      <Icon className={cn('size-4', style.iconCls)} aria-hidden="true" />
      {style.label}
    </span>
  )
}

// Membership status — distinct from the client-account status.
export const MembershipStatusPill = ({ status, className }) => <Pill style={MEMBERSHIP_STATUS_STYLE[status] || MEMBERSHIP_STATUS_STYLE.none} className={className} />
export const HistoryStatusPill = ({ status, className }) => <Pill style={HISTORY_STATUS_STYLE[status] || HISTORY_STATUS_STYLE.completed} className={cn('!py-[5px] !text-[11.5px]', className)} />
export const PaymentStatusPill = ({ status, className }) => <Pill style={MEMBERSHIP_PAYMENT_STATUS_STYLE[status] || MEMBERSHIP_PAYMENT_STATUS_STYLE.na} className={cn('!py-[5px] !text-[11.5px]', className)} />

// Price is always read from the membership record. `restricted` hides it from admins
// without payment-viewing permission; null means "no price on the record".
export function formatPrice(currency, amount, { restricted = false, perMonth = false } = {}) {
  if (restricted) return 'Restricted'
  if (amount === null || amount === undefined) return '—'
  if (amount === 0) return 'Free'
  return `${currency} ${amount.toLocaleString('en-US')}${perMonth ? ' / month' : ''}`
}

// Read-only: auto-renewal is changed through Manage Membership (reason + audit), never inline.
export function ReadOnlySwitch({ on, label = 'Auto-renewal' }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span role="switch" aria-checked={on} aria-readonly="true" aria-label={label} className={cn('inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5', on ? 'bg-[#22a652]' : 'bg-[#cfcbe0]')}>
        <span className={cn('size-4 rounded-full bg-white shadow transition-transform', on && 'translate-x-4')} />
      </span>
      <span className="text-[12px] font-semibold text-[#1b1140]">{on ? 'On' : 'Off'}</span>
    </span>
  )
}
