import { Link } from 'react-router'
import { ArrowRight, ChartColumn, Gem, Info } from 'lucide-react'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { JOURNEY_ICON, themeFor } from '../../../constants/clientMembership'
import { cn } from '../../../lib/utils'

// Informational only: it shows where the client is, and never implies that every
// client must eventually become Executive. Tiers come from the plan configuration.
export function MembershipJourney({ journey }) {
  const tiers = journey.tiers
  return (
    <section aria-label="Membership journey" className={cn(PROFILE_CARD, 'p-4')}>
      <h2 className="flex items-center gap-1.5 text-[17px] font-bold tracking-tight text-[#1b1140]">
        Membership Journey
        <span title="Informational only. Clients are not expected to move up the levels." className="text-[#4527c8]"><Info className="size-4" aria-label="Informational only" /></span>
      </h2>
      <ol className="mt-3 flex items-start">
        {tiers.map((t, i) => {
          const current = t.id === journey.currentId
          const Icon = JOURNEY_ICON[t.id] || themeFor(t.id).icon
          return (
            <li key={t.id} className="flex min-w-0 flex-1 items-start">
              {i > 0 && <span className="mt-[22px] h-px flex-1 bg-[#cfc7ea]" aria-hidden="true" />}
              <div className="flex w-[110px] shrink-0 flex-col items-center text-center" aria-current={current ? 'step' : undefined}>
                <span className={cn('flex size-11 items-center justify-center rounded-full transition', current ? 'bg-[#4125d0] text-white shadow-[0_0_0_5px_#e4defb]' : 'bg-[#eceef2] text-[#6b6785]')}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className={cn('mt-1.5 text-[13px] font-bold', current ? 'text-[#1b1140]' : 'text-[#3f3a5c]')}>{t.label}</span>
                <span className="text-[11.5px] leading-tight text-[#4a4466]">{current ? 'Current access level' : t.caption}</span>
              </div>
              {i < tiers.length - 1 && <span className="mt-[22px] h-px flex-1 bg-[#cfc7ea]" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

// Shown only when the backend says this client is eligible — Executive is never a plain upgrade button.
export function UpgradeOpportunity({ upgrade, config, canManage, onOpen }) {
  const name = upgrade.tierId === 'executive' ? 'Executive Access' : upgrade.tierId
  return (
    <section aria-label="Upgrade opportunity" className="rounded-xl border border-[#f0dcae] bg-[#fff6e4] p-4 shadow-[0_1px_2px_rgba(36,21,71,0.04)]">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#fbe5b0]" aria-hidden="true"><Gem className="size-6 text-[#b4570b]" /></span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-[#1b1140]">Upgrade Opportunity</h2>
          <p className="mt-0.5 text-[12.5px] leading-snug text-[#3a2a12]">Eligible for {name}. {upgrade.requiresApproval ? 'A change still needs approval and backend validation.' : 'This client meets the eligibility criteria.'}</p>
        </div>
      </div>
      {canManage && (
        <button type="button" onClick={() => onOpen('change_tier')} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-[#d9a441] bg-white text-[12.5px] font-semibold text-[#8a5a0b] transition hover:bg-[#fffaf0]">
          View Upgrade Options <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      )}
    </section>
  )
}

export function PlanComparison({ to }) {
  return (
    <section aria-label="Plan comparison" className="rounded-xl border border-[#e2dcf5] bg-[#f1edff] p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#e2dcf8]" aria-hidden="true"><ChartColumn className="size-6 text-[#4527c8]" /></span>
        <div>
          <h2 className="text-[15px] font-bold text-[#1b1140]">Plan Comparison</h2>
          <p className="mt-0.5 text-[12.5px] leading-snug text-[#2a1b57]">Compare plan features across all membership tiers.</p>
        </div>
      </div>
      <Link to={to} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white text-[12.5px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]">
        View Comparison <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </section>
  )
}
