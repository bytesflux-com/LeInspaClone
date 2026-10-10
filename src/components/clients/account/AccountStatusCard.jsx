import { CalendarDays, Crown, MessageSquare, Shield, User, Wallet } from 'lucide-react'
import { ACCESS_STATE_STYLE, ACCOUNT_STATE_STYLE } from '../../../constants/clientAccount'
import { CARD, H2, StateGlyph } from './AccountParts'
import { cn } from '../../../lib/utils'

const ICONS = { client: User, booking: CalendarDays, payment: Wallet, messaging: MessageSquare }
const LABELS = { client: 'Client Access', booking: 'Booking Access', payment: 'Payment Access', messaging: 'Messaging Access' }

function Tile({ icon: Icon }) {
  return (
    <span className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-[#e8e2fb]">
      <Icon className="size-[16px] fill-[#4527c8]/85 text-[#4527c8]" aria-hidden="true" />
    </span>
  )
}

function Row({ icon, label, children }) {
  return (
    <li className="flex min-h-[34px] items-center gap-2.5">
      <Tile icon={icon} />
      <span className="min-w-0 flex-1 text-[12.5px] leading-tight whitespace-nowrap text-[#1b1140]">{label}</span>
      {children}
    </li>
  )
}

const Access = ({ state }) => {
  const s = ACCESS_STATE_STYLE[state] || ACCESS_STATE_STYLE.enabled
  return <span className={cn('inline-flex w-[76px] items-center justify-center rounded-lg px-2 py-[5px] text-[11.5px] leading-none font-medium', s.cls)}>{s.label}</span>
}

// The strongest card at the top: the client's current state before anything is touched.
export default function AccountStatusCard({ account }) {
  const s = ACCOUNT_STATE_STYLE[account.status] || ACCOUNT_STATE_STYLE.active
  const healthy = account.status === 'active'
  const none = account.restrictionCount === 0
  const caption = healthy && !none ? 'This client has full account access, with the restrictions listed below.' : s.caption

  return (
    <section aria-label="Account status" className={cn(CARD, 'min-w-0')}>
      <h2 className={H2}>Account Status</h2>
      <div className="mt-2.5 grid items-center gap-x-4 gap-y-3 @[34rem]:grid-cols-[minmax(0,190px)_minmax(0,1fr)]">
        <div>
          <div className={cn('flex h-[62px] items-center gap-3 rounded-2xl px-4', s.pill)}>
            <span className={cn('flex size-[38px] shrink-0 items-center justify-center rounded-full text-white', s.disc)}>
              <StateGlyph icon={s.icon} className="size-[22px]" />
            </span>
            <span className="text-[30px] leading-none font-medium tracking-tight">{s.label}</span>
          </div>
          <p className="mt-2 text-[10.5px] leading-snug text-[#2a1b57]">{caption}</p>
          {account.underReview && <p className="mt-1.5 inline-flex rounded-md bg-[#ffe9d2] px-2 py-1 text-[10.5px] font-semibold text-[#c2570c]">Under review — access unaffected</p>}
        </div>

        <div className="grid min-w-0 gap-x-4 gap-y-1 border-[#ebe7f5] @[34rem]:border-l @[34rem]:pl-4 @[44rem]:grid-cols-2">
          <ul className="space-y-1">
            {['client', 'booking', 'payment'].map((k) => (
              <Row key={k} icon={ICONS[k]} label={LABELS[k]}><Access state={account.access[k]} /></Row>
            ))}
          </ul>
          <ul className="space-y-1 @[44rem]:border-l @[44rem]:border-[#ebe7f5] @[44rem]:pl-4">
            <Row icon={MessageSquare} label={LABELS.messaging}><Access state={account.access.messaging} /></Row>
            <Row icon={Crown} label="Membership"><span className="text-[11.5px] font-medium whitespace-nowrap text-[#1b1140]">{account.membership}</span></Row>
            <Row icon={Shield} label="Active Restrictions">
              <span className={cn('text-[12px] font-semibold', none ? 'text-[#15803d]' : 'text-[#c2570c]')}>{none ? 'None' : account.restrictionCount}</span>
            </Row>
          </ul>
        </div>
      </div>
    </section>
  )
}
