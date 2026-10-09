import { ArrowDown, ArrowUp, CalendarDays, CircleAlert, ShieldCheck, Wallet, X } from 'lucide-react'
import { PROFILE_CARD } from './ProfileCard'
import { cn } from '../../../lib/utils'

function Delta({ value }) {
  if (!value) return null
  const up = value > 0
  const Arrow = up ? ArrowUp : ArrowDown
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-semibold', up ? 'text-[#15803d]' : 'text-[#dc2626]')}>
      <Arrow className="size-3.5" aria-hidden="true" />
      {Math.abs(value)}%
    </span>
  )
}

function Kpi({ icon: Icon, disc, iconClass, label, value, sub, valueClass = 'text-[#1b1140]' }) {
  return (
    <div className={cn(PROFILE_CARD, 'flex min-w-0 items-center gap-2.5 px-2.5 py-3')}>
      <span className={cn('flex size-[42px] shrink-0 items-center justify-center rounded-full', disc)}>
        <Icon className={cn('size-5', iconClass)} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] leading-tight whitespace-nowrap text-[#2a1b57]">{label}</p>
        <p className={cn('text-[24px] leading-[1.15] font-bold tracking-tight whitespace-nowrap', valueClass)}>{value}</p>
        <p className="mt-0.5 text-[10.5px] leading-tight whitespace-nowrap text-[#4a4466]">{sub}</p>
      </div>
    </div>
  )
}

export default function ProfileKpis({ profile: c, canSeeFinancial }) {
  const s = c.stats
  const pct = (n) => (s.totalBookings ? Math.round((n / s.totalBookings) * 100) : 0)
  return (
    <div className={cn('grid grid-cols-2 gap-2 @[44rem]:grid-cols-3', canSeeFinancial ? '@[56rem]:grid-cols-5' : '@[56rem]:grid-cols-4')}>
      <Kpi icon={CalendarDays} disc="bg-[#e9e3fb]" iconClass="fill-[#4527c8] text-[#4527c8]" label="Total Bookings" value={s.totalBookings}
        sub={s.totalBookings ? <><Delta value={s.bookingsDelta} /> <span>vs last month</span></> : 'No bookings yet'} />
      <Kpi icon={ShieldCheck} disc="bg-[#dcf6e4]" iconClass="fill-[#15803d] text-white" label="Completed" value={s.completed}
        sub={s.totalBookings ? `${pct(s.completed)}% completion rate` : '—'} />
      <Kpi icon={X} disc="bg-[#fde2e2]" iconClass="text-[#dc2626] [stroke-width:3]" label="Cancelled" value={s.cancelled} valueClass="text-[#1b1140]"
        sub={s.totalBookings ? `${pct(s.cancelled)}% cancellation rate` : '—'} />
      <Kpi icon={CircleAlert} disc="bg-[#fde2e2]" iconClass="fill-[#dc2626] text-white" label="Open Issues" value={s.openIssues}
        valueClass={s.openIssues ? 'text-[#dc2626]' : 'text-[#1b1140]'} sub={s.issuesLabel} />
      {canSeeFinancial && (
        <Kpi icon={Wallet} disc="bg-[#fbecc6]" iconClass="fill-[#b4570b]/90 text-[#b4570b]" label="Lifetime Booking Value" value={<><span className="text-[13px]">{c.currency}</span> <span className="text-[20px]">{s.lifetimeValue.toLocaleString('en-US')}</span></>}
          sub={s.totalBookings ? <><Delta value={s.lifetimeDelta} /> <span>vs last month</span></> : '—'} />
      )}
    </div>
  )
}
