import { Link } from 'react-router'
import { ArrowRight, CircleCheck, Headset, Link2, UserX, Wallet } from 'lucide-react'
import Skeleton from '../../ui/Skeleton'
import { cn } from '../../../lib/utils'
import { CARD } from './DashCard'

// Every tile opens the relevant filtered view. No destructive actions here.
const ITEMS = [
  { key: 'reviews', label: 'Account Reviews', sub: 'Pending review', icon: CircleCheck, circle: 'bg-[#dbe6ff]', iconCls: 'size-6 fill-[#3b6fe6] text-white', to: '/clients/all?status=pending' },
  { key: 'suspended', label: 'Suspended Accounts', sub: 'Require action', icon: UserX, circle: 'bg-[#fde0e0]', iconCls: 'size-[22px] text-[#dc2626]', to: '/clients/all?status=suspended' },
  { key: 'support', label: 'Support Escalations', sub: 'Awaiting response', icon: Headset, circle: 'bg-[#e6defc]', iconCls: 'size-[22px] text-[#6d3fe0]', to: '/clients/all?issues=ticket' },
  { key: 'payments', label: 'Payment / Wallet Issues', sub: 'Needs review', icon: Wallet, circle: 'bg-[#ffe7c9]', iconCls: 'size-[22px] text-[#e8890c]', to: '/clients/all?issues=payment' },
  { key: 'guestLinking', label: 'Guest-to-Account Linking', sub: 'Needs follow up', icon: Link2, circle: 'bg-[#e6defc]', iconCls: 'size-[22px] text-[#6d3fe0]', to: '/guest-bookings' },
]

export default function NeedsAttentionCard({ attention }) {
  return (
    <section className={cn(CARD, 'p-3')} aria-label="Needs attention">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[14px] font-bold tracking-tight text-[#1b1140]">
          <span className="flex size-5 items-center justify-center rounded-full bg-[#e5252a] text-[12px] leading-none font-bold text-white" aria-hidden="true">!</span>
          Needs Attention
        </h2>
        <Link to="/attention" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#4527c8] hover:underline">
          View All <ArrowRight className="size-3.5" />
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-2 @lg:grid-cols-2 @3xl:grid-cols-3 @[62rem]:grid-cols-[0.95fr_1.05fr_1.05fr_1.15fr_1.35fr]">
        {ITEMS.map(({ key, label, sub, icon: Icon, circle, iconCls, to }) => (
          <Link key={key} to={to} className="flex min-w-0 items-center gap-2 rounded-xl bg-[#f3f1fb] px-2.5 py-1.5 transition hover:bg-[#ebe7fa]">
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', circle)}>
              <Icon className={iconCls} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] leading-tight font-semibold tracking-[-0.02em] whitespace-nowrap text-[#1b1140]">{label}</p>
              {attention ? (
                <p className="text-[19px] leading-[22px] font-bold text-[#1b1140]">{attention[key]}</p>
              ) : (
                <Skeleton className="my-1 h-5 w-8" />
              )}
              <p className="text-[11px] leading-tight text-[#4a4466]">{sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
