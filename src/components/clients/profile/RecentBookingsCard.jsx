import { ArrowRight, CalendarDays, CircleCheck } from 'lucide-react'
import { Link } from 'react-router'
import { ProfileCard, CardLink, Pill } from './ProfileCard'
import { BOOKING_STATUS_STYLE } from '../../../constants/clientProfile'
import { formatFullStamp } from '../../../lib/profileFormat'

export default function RecentBookingsCard({ profile: c, allTo, linkState }) {
  const rows = c.recentBookings
  return (
    <ProfileCard icon={CalendarDays} title="Recent Bookings" action={<CardLink to={allTo} state={linkState}>View All Bookings</CardLink>}>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-[#4a4466]">No bookings yet.</p>
      ) : (
        <ul>
          {rows.map((b) => {
            const st = BOOKING_STATUS_STYLE[b.status] || BOOKING_STATUS_STYLE.pending
            return (
              <li key={b.id} className="flex items-center gap-2 border-b border-[#efecf7] py-2 first:pt-1 last:border-b-0 last:pb-0">
                {b.image ? (
                  <img src={b.image} alt="" className="size-10 shrink-0 rounded-lg object-cover" loading="lazy" />
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#ece6ff]"><CalendarDays className="size-5 text-[#4527c8]" /></span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] leading-tight font-bold text-[#1b1140]">{b.service}</p>
                  <p className="truncate text-[10px] leading-snug text-[#2a1b57]">{b.venue}</p>
                  <p className="truncate text-[10px] leading-snug text-[#2a1b57]">{formatFullStamp(b.scheduledAt, c.timeZone)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Pill box={st.box} dot={CircleCheck} dotClass={st.dot}>{st.label}</Pill>
                  <span className="text-[11.5px] leading-none font-bold whitespace-nowrap text-[#1b1140]">{`${c.currency} ${b.amount.toLocaleString('en-US')}`}</span>
                  <Link to={`/bookings/${b.id}`} state={linkState} className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#3b1fd6] hover:underline">
                    View <ArrowRight className="size-3" aria-hidden="true" />
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </ProfileCard>
  )
}
