import { Crown, CircleCheck, Clock, User } from 'lucide-react'
import { ProfileCard, CardLink, Pill } from './ProfileCard'
import { daysUntil, formatDay } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const TIER = {
  premium: { tile: 'bg-[#fdeac4]', icon: 'fill-[#e8741a] text-[#e8741a]' },
  executive: { tile: 'bg-[#f6e2a6]', icon: 'fill-[#b8860b] text-[#8a6208]' },
  standard: { tile: 'bg-[#e4eeff]', icon: 'fill-[#4a86e8] text-[#4a86e8]' },
  none: { tile: 'bg-[#eceef2]', icon: 'fill-[#8b93a5] text-[#8b93a5]' },
}
const STATE = {
  active: { label: 'Active', box: 'bg-[#dcf6e4] text-[#15803d]', dot: CircleCheck, dotClass: 'fill-[#22a652] text-white' },
  suspended: { label: 'Suspended', box: 'bg-[#fde2e2] text-[#dc2626]', dot: CircleCheck, dotClass: 'fill-[#e03a3a] text-white' },
  pending: { label: 'Payment Pending', box: 'bg-[#ffe9d2] text-[#c2570c]', dot: Clock, dotClass: 'fill-[#f08a24] text-white' },
  none: { label: 'None', box: 'bg-[#eceef2] text-[#4b5563]', dot: User, dotClass: 'fill-[#8b93a5] text-[#8b93a5]' },
}

function Switch({ on }) {
  // Read-only: billing preferences are changed by the client, not from the profile.
  return (
    <span role="switch" aria-checked={on} aria-readonly="true" aria-label="Auto-renew" className={cn('inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5', on ? 'bg-[#4125d0]' : 'bg-[#cfcbe0]')}>
      <span className={cn('size-4 rounded-full bg-white shadow transition-transform', on && 'translate-x-4')} />
    </span>
  )
}

export default function MembershipCard({ profile: c, canSeeFinancial, to, linkState }) {
  const m = c.membership
  const tier = TIER[m.tier] || TIER.none
  const state = STATE[m.status] || STATE.active
  const days = m.nextRenewal ? daysUntil(m.nextRenewal, c.asOf, c.timeZone) : null
  const dayTone = days === null ? '' : days < 0 ? 'text-[#dc2626]' : days <= 7 ? 'text-[#b45309]' : 'text-[#15803d]'
  const paid = m.monthlyFee > 0

  return (
    <ProfileCard icon={Crown} disc title="Membership" action={<CardLink to={to} state={linkState}>View Details</CardLink>}>
      <div className="flex items-center gap-2 rounded-xl bg-[#f3f0fb] p-2">
        <span className={cn('flex size-[40px] shrink-0 items-center justify-center rounded-lg', tier.tile)}>
          <Crown className={cn('size-5', tier.icon)} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] leading-tight font-bold tracking-tight text-[#3a1fb0]">{m.name}</p>
          <p className="mt-0.5 truncate text-[10.5px] text-[#2a1b57]">{m.description}</p>
        </div>
        <Pill box={state.box} dot={state.dot} dotClass={state.dotClass} className="px-2 py-1 text-[11px]">{state.label}</Pill>
      </div>

      <dl className="mt-3 grid grid-cols-[1fr_1fr_1.15fr] gap-x-2 text-[11px]">
        <div>
          <dt className="text-[#2a1b57]">Member Since</dt>
          <dd className="mt-1 text-[13px] font-semibold text-[#1b1140]">{formatDay(m.since, c.timeZone, { year: true })}</dd>
        </div>
        <div>
          <dt className="text-[#2a1b57]">Next Renewal</dt>
          <dd className="mt-1 text-[13px] font-semibold whitespace-nowrap text-[#1b1140]">{m.nextRenewal ? formatDay(m.nextRenewal, c.timeZone, { year: true }) : '—'}</dd>
          {days !== null && <p className={cn('text-[11.5px] font-medium', dayTone)}>{days < 0 ? '(overdue)' : `(in ${days} ${days === 1 ? 'day' : 'days'})`}</p>}
        </div>
        <div>
          <dt className="text-[#2a1b57]">Monthly Fee</dt>
          <dd className="mt-1 text-[13px] font-semibold whitespace-nowrap text-[#1b1140]">
            {!paid ? '—' : canSeeFinancial ? `${c.currency} ${m.monthlyFee.toLocaleString('en-US')}` : 'Restricted'}
          </dd>
          {paid && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] whitespace-nowrap text-[#2a1b57]">
              Auto-Renew <Switch on={m.autoRenew} />
            </div>
          )}
        </div>
      </dl>
    </ProfileCard>
  )
}
