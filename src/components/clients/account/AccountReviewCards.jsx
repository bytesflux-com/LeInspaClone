import { Link } from 'react-router'
import { CalendarDays, Headphones, Lock, Scale, ShieldCheck } from 'lucide-react'
import { CARD, H2 } from './AccountParts'
import { cn } from '../../../lib/utils'

function Tile({ to, state, tone, disc, icon: Icon, iconClass, label, value, restricted }) {
  const cls = cn('flex min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-3 transition', tone, to && !restricted && 'hover:brightness-[0.97]')
  const body = (
    <>
      <span className={cn('flex size-[46px] shrink-0 items-center justify-center rounded-full', disc)}>
        <Icon className={cn('size-[24px]', iconClass)} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11.5px] leading-[1.15] font-medium text-[#1b1140]">{label}</p>
        {restricted ? (
          <p className="mt-1 flex items-center gap-1 text-[11.5px] font-semibold text-[#4a4466]"><Lock className="size-3.5" aria-hidden="true" /> Restricted</p>
        ) : (
          <p className="mt-0.5 text-[28px] leading-[1.1] font-bold tracking-tight text-[#1b1140]">{value}</p>
        )}
      </div>
    </>
  )
  return to && !restricted ? <Link to={to} state={state} aria-label={`${label} ${value}`} className={cls}>{body}</Link> : <div className={cls}>{body}</div>
}

// Before any account action the Admin needs the context that justifies it — and the impact of it.
export default function AccountReviewCards({ review, clientId, linkState }) {
  const base = `/clients/${clientId}`
  return (
    <section aria-label="Account review" className={cn(CARD, 'min-w-0')}>
      <h2 className={H2}>Account Review</h2>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5 @[40rem]:grid-cols-4">
        <Tile to={`${base}/support?tab=safety`} state={linkState} tone="bg-[#eee9fc]" disc="bg-[#d6cdf6]" icon={ShieldCheck} iconClass="fill-[#4527c8] text-white" label={<>Open Safety<br />Cases</>} value={review.safety} restricted={review.safety == null} />
        <Tile to={`${base}/support?tab=dispute`} state={linkState} tone="bg-[#fde9e9]" disc="bg-[#f7c6cb]" icon={Scale} iconClass="text-[#d92d45]" label={<>Open<br />Disputes</>} value={review.disputes} />
        <Tile to={`${base}/support?tab=support`} state={linkState} tone="bg-[#fdeedd]" disc="bg-[#f9d3a8]" icon={Headphones} iconClass="text-[#e8801a]" label={<>Open Support<br />Cases</>} value={review.support} />
        <Tile to={`${base}/bookings`} state={linkState} tone="bg-[#e6eefb]" disc="bg-[#c9daf6]" icon={CalendarDays} iconClass="fill-[#3b62c8] text-[#3b62c8]" label={<>Active<br />Bookings</>} value={review.bookings} />
      </div>
    </section>
  )
}
