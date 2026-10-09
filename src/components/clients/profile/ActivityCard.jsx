import { CalendarDays, ClipboardList, Crown, Headphones, SquarePen, Wallet } from 'lucide-react'
import { ProfileCard, CardLink } from './ProfileCard'
import { formatStamp } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const TYPE = {
  booking: { icon: CalendarDays, wrap: 'bg-[#e9e3fb]', cls: 'fill-[#4527c8] text-[#4527c8]' },
  payment: { icon: Wallet, wrap: 'bg-[#dcf6e4]', cls: 'fill-[#15803d] text-[#15803d]' },
  profile: { icon: SquarePen, wrap: 'bg-[#e9e3fb]', cls: 'text-[#4527c8]' },
  membership: { icon: Crown, wrap: 'bg-[#fbecc6]', cls: 'fill-[#e8741a] text-[#e8741a]' },
  support: { icon: Headphones, wrap: 'bg-[#e9e3fb]', cls: 'text-[#4527c8]' },
}

// Real events only — the server returns them; nothing is synthesised from UI state.
export default function ActivityCard({ profile: c, to, linkState, className }) {
  const rows = c.activity
  return (
    <ProfileCard icon={ClipboardList} title="Recent Activity" className={className} action={to ? <CardLink to={to} state={linkState}>View All Activity</CardLink> : null}>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-[#4a4466]">No recent activity.</p>
      ) : (
        <ol>
          {rows.map((a) => {
            const t = TYPE[a.type] || TYPE.profile
            const Icon = t.icon
            return (
              <li key={a.id} className="flex items-center gap-2.5 border-b border-[#efecf7] py-[5px] last:border-b-0">
                <span className={cn('flex size-[30px] shrink-0 items-center justify-center rounded-full', t.wrap)}>
                  <Icon className={cn('size-[15px]', t.cls)} aria-hidden="true" />
                </span>
                <span className="w-[100px] shrink-0 text-[11px] whitespace-nowrap text-[#2a1b57]">{formatStamp(a.at, c.asOf, c.timeZone)}</span>
                <span className="min-w-0 flex-1 text-[11px] leading-tight text-[#1b1140]">{a.text}</span>
              </li>
            )
          })}
        </ol>
      )}
    </ProfileCard>
  )
}
