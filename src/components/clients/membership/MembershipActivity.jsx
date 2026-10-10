import { Link } from 'react-router'
import { CircleCheck, CircleX, UserRoundCog } from 'lucide-react'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { formatFullStamp } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const TONE = {
  ok: { icon: CircleCheck, cls: 'fill-[#22a652] text-white' },
  bad: { icon: CircleX, cls: 'fill-[#e03a3a] text-white' },
  admin: { icon: UserRoundCog, cls: 'text-[#4125d0]' },
}

// Every event is real and traceable: it carries who/what produced it and a reference id
// (payment, membership record or audit record).
export default function MembershipActivity({ events, client, auditTo }) {
  const tz = client.timeZone
  return (
    <section aria-label="Membership activity" className={cn(PROFILE_CARD, 'p-4')}>
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-[17px] font-bold tracking-tight text-[#1b1140]">Membership Activity</h2>
        {auditTo && <Link to={auditTo} className="text-[11.5px] font-semibold text-[#3b1fd6] hover:underline">Audit Logs →</Link>}
      </header>
      {events.length === 0 ? (
        <p className="py-4 text-[12.5px] text-[#4a4466]">No membership events recorded yet.</p>
      ) : (
        <ol>
          {events.map((e, i) => {
            const t = TONE[e.tone] || TONE.ok
            const Icon = t.icon
            return (
              <li key={e.id} className="relative flex items-start gap-3 py-[7px] pl-6 text-[12.5px]">
                {i < events.length - 1 && <span className="absolute top-[26px] bottom-[-8px] left-[8px] w-px bg-[#d9d3ee]" aria-hidden="true" />}
                <Icon className={cn('absolute top-[8px] left-0 size-[17px]', t.cls)} aria-hidden="true" />
                <span className="w-[158px] shrink-0 text-[#2a1b57]">{formatFullStamp(e.at, tz)}</span>
                <span className="min-w-0 text-[#1b1140]">
                  {e.text}
                  <span className="block text-[11px] text-[#4a4466]">
                    {e.actor}{e.reason ? ` · ${e.reason}` : ''}{e.ref ? ` · ${e.ref.id}` : ''}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
