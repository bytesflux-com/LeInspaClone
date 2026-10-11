import { Link } from 'react-router'
import { ArrowLeft, BadgeCheck, CalendarDays, Clock, Copy } from 'lucide-react'
import PersonAvatar from '../../ui/PersonAvatar'
import CountryFlag from '../../ui/CountryFlag'
import { MembershipBadge, StatusBadge } from '../ClientBadges'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { formatAgo, formatDay } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const PILL = 'rounded-lg px-2.5 py-2 text-[12.5px] font-medium gap-1.5 [&_svg]:size-4'

// Client mini-identity — the client stays clearly identified above their bookings.
export default function BookingsHeader({ client: c, backTo, linkState, onCopyId, verifiedLabel = 'Verified', statusLabel }) {
  const tier = c.membershipTier
  return (
    <div className={cn(PROFILE_CARD, 'relative flex flex-wrap items-center gap-x-5 gap-y-3 px-3.5 py-3.5')}>
      <PersonAvatar name={c.name} src={c.photoURL} gender={c.gender} size={110} className="ring-2 ring-white shadow-md" />

      <div className="min-w-0 flex-1">
        <h1 className="text-[28px] leading-[1.1] font-bold tracking-tight text-[#1b1140]">{c.name}</h1>
        <p className="mt-0.5 flex items-center gap-1.5 text-[15px] text-[#2a1b57]">
          Client ID: {c.id}
          <button type="button" onClick={() => onCopyId(c.id)} aria-label="Copy client ID" className="rounded p-0.5 text-[#4527c8] transition hover:bg-[#f1edff]">
            <Copy className="size-3.5" />
          </button>
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <MembershipBadge tier={tier} label={tier === 'none' ? 'No Membership' : `${tier[0].toUpperCase()}${tier.slice(1)} Client`} className={PILL} />
          <StatusBadge status={c.status} label={statusLabel} className={PILL} />
          {c.contactVerified && (
            <span className={cn('inline-flex items-center bg-[#e4defb] leading-none text-[#3b1fd6]', PILL)}>
              <BadgeCheck className="fill-[#4527c8] text-white" aria-hidden="true" /> {verifiedLabel}
            </span>
          )}
        </div>

        <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] whitespace-nowrap text-[#2a1b57]">
          <li className="flex items-center gap-2"><CountryFlag code={c.country} className="h-3.5 w-[22px]" />{c.city}, {c.countryName}</li>
          <li className="flex items-center gap-2"><CalendarDays className="size-[17px] fill-[#4527c8]/85 text-[#4527c8]" aria-hidden="true" />Joined {formatDay(c.joinedAt, c.timeZone, { year: true })}</li>
          <li className="flex items-center gap-2"><Clock className="size-[17px] text-[#2a1b57]" aria-hidden="true" />Last active {formatAgo(c.lastActiveAt, c.asOf)}</li>
        </ul>
      </div>

      <div className="ml-auto flex min-h-[96px] flex-col items-end justify-between self-stretch">
        <Link
          to={backTo}
          state={linkState}
          className="inline-flex h-10 items-center gap-2 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-3.5 text-[13px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to Client Profile
        </Link>

        <div className="mr-1 hidden -rotate-[4deg] text-center leading-[1.05] text-[#1b1140] @[48rem]:block" style={{ fontFamily: "'Caveat', 'Segoe Script', cursive" }} aria-hidden="true">
          <p className="text-[26px]">Wellness</p>
          <p className="-mt-1 text-[26px]">Without Limits</p>
          <svg viewBox="0 0 120 10" className="-mt-0.5 ml-auto h-2.5 w-32 text-[#e8a317]"><path d="M2 7 C30 1, 70 9, 118 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </div>
      </div>
    </div>
  )
}
