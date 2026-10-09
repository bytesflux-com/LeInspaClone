import { Link } from 'react-router'
import { ArrowRight, Users } from 'lucide-react'
import Skeleton from '../../ui/Skeleton'
import { formatNumber } from '../../../lib/format'
import { DashCard, PeriodSelect } from './DashCard'

export default function GuestConversionCard({ guest }) {
  const tiles = [
    { label: 'Guest Bookings', value: guest && formatNumber(guest.bookings), bg: 'bg-[#e8eeff]', color: 'text-[#3b5bdb]' },
    { label: 'Converted to Accounts', value: guest && `${guest.convertedPct}%`, bg: 'bg-[#e0f7e8]', color: 'text-[#1f9d4d]' },
    { label: 'Unlinked Bookings', value: guest && formatNumber(guest.unlinked), bg: 'bg-[#fff0dc]', color: 'text-[#e8890c]' },
  ]
  return (
    <DashCard className="[&_h2]:gap-1.5 [&_h2]:text-[12px] [&_h2>span]:size-5 [&_h2_svg]:size-4" icon={Users} iconClass="text-[#5b2fd0] fill-[#5b2fd0]/25" title="Guest Conversion" action={<PeriodSelect compact />}>
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className={`rounded-xl px-1.5 py-1.5 text-center ${t.bg}`}>
            {t.value ? <p className={`text-[18px] leading-tight font-bold ${t.color}`}>{t.value}</p> : <Skeleton className="mx-auto h-6 w-10" />}
            <p className="mt-0.5 text-[10px] leading-tight text-[#2a1b57]">{t.label}</p>
          </div>
        ))}
      </div>
      <Link
        to="/guest-bookings"
        className="mt-2 flex h-8 items-center justify-center gap-2 rounded-lg border-[1.5px] border-[#7a5cf0] bg-[#f1edff] text-[11.5px] font-semibold text-[#4527c8] transition hover:bg-[#e8e1ff]"
      >
        View Guest Clients / Bookings <ArrowRight className="size-3.5" />
      </Link>
    </DashCard>
  )
}
