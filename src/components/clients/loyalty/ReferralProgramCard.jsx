import { CircleCheck, CircleMinus, Clock, Coins, Copy, UserRound, Users } from 'lucide-react'
import { Amount } from './LoyaltyBadges'
import { cn } from '../../../lib/utils'

// Decorative gift box (inline SVG — no external assets).
function GiftArt() {
  return (
    <svg viewBox="0 0 120 96" className="h-[88px] w-[112px] shrink-0" aria-hidden="true">
      <g fill="#fff" opacity=".85">
        <circle cx="14" cy="22" r="1.6" />
        <circle cx="104" cy="14" r="1.8" />
        <circle cx="110" cy="46" r="1.3" />
        <circle cx="8" cy="52" r="1.2" />
        <path d="M96 30l1.6 3.4 3.4 1.6-3.4 1.6L96 40l-1.6-3.4-3.4-1.6 3.4-1.6z" />
        <path d="M22 36l1.2 2.6 2.6 1.2-2.6 1.2L22 44l-1.2-2.6-2.6-1.2 2.6-1.2z" />
      </g>
      <rect x="22" y="44" width="76" height="46" rx="4" fill="#c9852a" />
      <rect x="22" y="44" width="76" height="46" rx="4" fill="url(#gbody)" />
      <rect x="16" y="32" width="88" height="18" rx="4" fill="#f2b33d" />
      <rect x="16" y="32" width="88" height="6" rx="3" fill="#ffd877" opacity=".7" />
      <rect x="53" y="32" width="14" height="58" fill="#fff1c4" />
      <path d="M60 32c-6-16-24-16-24-7 0 7 14 7 24 7z" fill="#ffd877" />
      <path d="M60 32c6-16 24-16 24-7 0 7-14 7-24 7z" fill="#f2b33d" />
      <circle cx="60" cy="32" r="5" fill="#fff1c4" />
      <defs>
        <linearGradient id="gbody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9a23b" />
          <stop offset="1" stopColor="#b8741f" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function Kpi({ icon: Icon, disc, iconClass, label, children }) {
  return (
    <li className="flex min-w-0 items-center gap-2.5 rounded-lg bg-white px-2.5 py-2.5 shadow-sm">
      <span className={cn('flex size-[36px] shrink-0 items-center justify-center rounded-full', disc)}>
        <Icon className={cn('size-[19px]', iconClass)} aria-hidden="true" />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[11.5px] font-medium text-[#1b1140]">{label}</p>
        <p className="mt-0.5 truncate text-[22px] leading-none font-bold tracking-tight text-[#1b1140]">{children}</p>
      </div>
    </li>
  )
}

// Referral Program — royal purple card: referral identity + four summary metrics.
// Figures come from real referral events (the backend resolves qualification from the
// configured referral rule), not from everyone who merely entered a referral code.
export default function ReferralProgramCard({ referral, currency, canSeeFinancial, onCopy }) {
  const { program, summary } = referral
  const active = program.status === 'active'
  return (
    <section aria-label="Referral program" className="@container overflow-hidden rounded-xl bg-linear-to-br from-[#3b1cb4] via-[#2f1596] to-[#26107c] p-3 text-white shadow-[0_8px_20px_-10px_rgba(43,17,117,0.6)]">
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
        <span className="flex size-[58px] shrink-0 items-center justify-center rounded-xl bg-[#7355dc]/70 ring-1 ring-white/20">
          <Users className="size-8 fill-[#f1e9ff] text-[#f1e9ff]" aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <h2 className="text-[17px] leading-tight font-bold tracking-tight">Referral Program</h2>
          <p className="mt-0.5 text-[13px] leading-tight text-white/90">Referral Code</p>
          <p className="mt-0.5 flex items-center gap-2 text-[30px] leading-none font-extrabold tracking-tight">
            {program.code}
            <button type="button" onClick={() => onCopy(program.code)} aria-label="Copy referral code" className="rounded p-0.5 text-white transition hover:bg-white/15">
              <Copy className="size-[19px]" />
            </button>
          </p>
        </div>

        <span
          className={cn(
            'inline-flex h-[30px] items-center gap-1.5 self-start rounded-full px-3 text-[13px] font-semibold text-white',
            active ? 'bg-[#2fb36b] ring-1 ring-white/30' : 'bg-white/20 ring-1 ring-white/30',
          )}
          style={{ marginTop: 14 }}
        >
          {active ? <CircleCheck className="size-[17px] fill-white text-[#2fb36b]" aria-hidden="true" /> : <CircleMinus className="size-[17px]" aria-hidden="true" />}
          {active ? 'Active' : 'Paused'}
        </span>

        <div className="ml-auto hidden items-center gap-1 @[36rem]:flex" aria-hidden="true">
          <p className="text-right text-[17px] leading-[1.15] font-light text-white/95">
            Invite friends
            <br />
            Change lives
          </p>
          <GiftArt />
        </div>
      </div>

      <ul className="mt-2.5 grid grid-cols-2 gap-2 @[34rem]:grid-cols-4" aria-label="Referral summary">
        <Kpi icon={UserRound} disc="bg-[#e4defb]" iconClass="fill-[#4527c8] text-[#4527c8]" label="People Referred">{summary.referred}</Kpi>
        <Kpi icon={CircleCheck} disc="bg-[#dcf6e4]" iconClass="fill-[#22a652] text-white" label="Successful Referrals">{summary.successful}</Kpi>
        <Kpi icon={Clock} disc="bg-[#ffe9d2]" iconClass="text-[#e8791a]" label="Pending">{summary.pending}</Kpi>
        <Kpi icon={Coins} disc="bg-[#fde3ef]" iconClass="text-[#d9366f]" label="Referral Rewards Earned">
          <Amount value={summary.rewardsEarned} currency={currency} show={canSeeFinancial} className="text-[16px] font-bold" />
        </Kpi>
      </ul>
    </section>
  )
}
