import { Ban, CircleCheck, CircleMinus, Clock, Crown, ShieldAlert, User } from 'lucide-react'
import { cn } from '../../lib/utils'
import { CLIENT_STATUS_LABELS } from '../../constants/clients'

const MEMBERSHIP = {
  premium: { label: 'Premium', icon: Crown, box: 'bg-[#ece6ff] text-[#5b2fd0]', iconCls: 'fill-[#5b2fd0] text-[#5b2fd0]' },
  executive: { label: 'Executive', icon: Crown, box: 'bg-[#fff1c9] text-[#b4570b]', iconCls: 'fill-[#e8a317] text-[#e8a317]' },
  none: { label: 'No Membership', icon: User, box: 'bg-[#eceef2] text-[#4b5563]', iconCls: 'fill-[#8b93a5] text-[#8b93a5]' },
  standard: { label: 'Standard', icon: User, box: 'bg-[#e4eeff] text-[#2f5fc4]', iconCls: 'fill-[#4a86e8] text-[#4a86e8]' },
}

export function MembershipBadge({ tier, className = '', label }) {
  const m = MEMBERSHIP[tier] || MEMBERSHIP.standard
  const Icon = m.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-[12px] font-medium leading-none whitespace-nowrap', m.box, className)}>
      <Icon className={cn('size-3.5', m.iconCls)} aria-hidden="true" />
      {label || m.label}
    </span>
  )
}

const STATUS = {
  active: { icon: CircleCheck, box: 'bg-[#dcf6e4] text-[#15803d]', iconCls: 'fill-[#22a652] text-white' },
  pending: { icon: Clock, box: 'bg-[#ffe9d2] text-[#c2570c]', iconCls: 'fill-[#f08a24] text-white' },
  suspended: { icon: Ban, box: 'bg-[#fde2e2] text-[#dc2626]', iconCls: 'fill-[#e03a3a] text-white' },
  inactive: { icon: CircleMinus, box: 'bg-[#e6e8ee] text-[#3f4457]', iconCls: 'fill-[#5d6579] text-white' },
  deactivated: { icon: CircleMinus, box: 'bg-[#eceef2] text-[#4b5563]', iconCls: 'fill-[#8b93a5] text-white' },
  unverified: { icon: ShieldAlert, box: 'bg-[#fff5d6] text-[#92660a]', iconCls: 'fill-[#e0a82e] text-white' },
}

export function StatusBadge({ status, className = '', label }) {
  const s = STATUS[status] || STATUS.inactive
  const Icon = s.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-[12px] font-medium leading-none whitespace-nowrap', s.box, className)}>
      <Icon className={cn('size-4', s.iconCls)} aria-hidden="true" />
      {label || CLIENT_STATUS_LABELS[status] || status}
    </span>
  )
}
