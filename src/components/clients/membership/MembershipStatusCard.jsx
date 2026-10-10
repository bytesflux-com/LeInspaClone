import { CircleCheck, CircleX, CreditCard, RefreshCw, ShieldCheck, CalendarClock, Receipt } from 'lucide-react'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { MembershipStatusPill, ReadOnlySwitch } from './MembershipBadges'
import { StatusBadge } from '../ClientBadges'
import { formatDay } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const PAYMENT = {
  paid: { label: 'Paid', box: 'bg-[#dcf6e4] text-[#15803d]', icon: CircleCheck },
  failed: { label: 'Failed', box: 'bg-[#ffe9d2] text-[#c2570c]', icon: CircleX },
  pending: { label: 'Pending', box: 'bg-[#ffe9d2] text-[#c2570c]', icon: CircleCheck },
  na: { label: 'N/A', box: 'bg-[#eceef2] text-[#4b5563]', icon: CircleCheck },
}

function Row({ icon: Icon, label, children }) {
  return (
    <li className="flex min-h-[36px] items-center justify-between gap-2 border-b border-[#efecf7] py-1 text-[12.5px] last:border-b-0">
      <span className="flex items-center gap-2 text-[#2a1b57]"><Icon className="size-4 shrink-0 text-[#4527c8]" aria-hidden="true" />{label}</span>
      <span className="flex items-center gap-1.5 font-semibold text-[#1b1140]">{children}</span>
    </li>
  )
}

const chip = (box, children) => <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11.5px] font-medium', box)}>{children}</span>

export default function MembershipStatusCard({ membership: m, client }) {
  const tz = client.timeZone
  const pay = PAYMENT[m.paymentStatus] || PAYMENT.na
  const PayIcon = pay.icon
  const enabled = m.accessStatus === 'enabled'
  const last = m.lastPayment
  return (
    <section aria-label="Membership status" className={cn(PROFILE_CARD, 'p-4')}>
      <h2 className="text-[19px] font-bold tracking-tight text-[#1b1140]">Membership Status</h2>
      <div className="mt-2.5"><MembershipStatusPill status={m.status} className="!px-4 !py-2 !text-[14px]" /></div>
      <ul className="mt-2">
        <Row icon={RefreshCw} label="Auto Renewal"><ReadOnlySwitch on={m.autoRenew} /></Row>
        <Row icon={CreditCard} label="Payment Status">{chip(pay.box, <><PayIcon className="size-3.5" aria-hidden="true" />{pay.label}</>)}</Row>
        <Row icon={ShieldCheck} label="Access Status">
          {chip(enabled ? 'bg-[#dcf6e4] text-[#15803d]' : 'bg-[#e6e8ee] text-[#3f4457]', <>{enabled ? <CircleCheck className="size-3.5" aria-hidden="true" /> : <CircleX className="size-3.5" aria-hidden="true" />}{enabled ? 'Enabled' : 'Disabled'}</>)}
        </Row>
        <Row icon={Receipt} label="Last Payment">
          {last ? <>{last.status === 'successful' ? 'Successful' : last.status}<span className="font-normal text-[#4a4466]">· {formatDay(last.at, tz)}</span></> : '—'}
        </Row>
        <Row icon={CalendarClock} label="Next Billing">{m.renewalAt && m.status !== 'expired' ? formatDay(m.renewalAt, tz, { year: true }) : '—'}</Row>
      </ul>
      {/* Account and membership are separate: an Active client can hold an Expired membership. */}
      <p className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#f4f1fc] px-2.5 py-2 text-[11.5px] text-[#2a1b57]">
        Client account <StatusBadge status={client.status} className="!px-2 !py-1 !text-[11px]" />
      </p>
    </section>
  )
}
