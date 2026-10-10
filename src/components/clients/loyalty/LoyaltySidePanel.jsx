import { Link } from 'react-router'
import { ArrowRight, CircleAlert, FileText, History, Wallet } from 'lucide-react'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { cn } from '../../../lib/utils'

// Decorative paper plane (inline SVG).
function PlaneArt() {
  return (
    <svg viewBox="0 0 90 60" className="pointer-events-none absolute top-2 right-3 h-[58px] w-[84px]" aria-hidden="true">
      <path d="M6 52c14-2 20-14 34-14" fill="none" stroke="#b9a4f3" strokeWidth="1.6" strokeDasharray="2 4" strokeLinecap="round" />
      <path d="M82 6L28 26l16 6z" fill="#8b6cf0" />
      <path d="M82 6L44 32l6 16 8-12z" fill="#5b36d8" />
      <path d="M44 32l14 4-8 12z" fill="#3b1fd6" />
    </svg>
  )
}

const ROW = 'flex min-h-[32px] w-full items-center gap-3 rounded-lg px-1 py-1 text-[13px] font-medium text-[#1b1140] transition hover:bg-[#f4f1fc]'

// Quick Actions — safe navigation only. There is deliberately no "+ Add Reward" here: any manual
// adjustment belongs to a dedicated, permission-controlled workflow with a reason and an audit entry.
export function QuickActionsCard({ clientId, canSeeFinancial, canAudit, linkState }) {
  const items = [
    { label: 'View Referral Terms', to: '/loyalty', icon: FileText, ring: true },
    canSeeFinancial && { label: 'View Client Wallet', to: `/clients/${clientId}/wallet`, icon: Wallet, solid: true },
    canAudit && { label: 'View Audit History', to: '/audit-logs', icon: History, ring: true },
  ].filter(Boolean)

  return (
    <section aria-label="Quick actions" className={cn(PROFILE_CARD, 'relative overflow-hidden p-3.5')}>
      <PlaneArt />
      <h2 className="mb-2 text-[17px] leading-tight font-bold tracking-tight text-[#1b1140]">Quick Actions</h2>
      <ul className="space-y-1">
        {items.map((a) => {
          const Icon = a.icon
          return (
            <li key={a.label}>
              <Link to={a.to} state={linkState} className={ROW}>
                <span className={cn('flex size-[26px] shrink-0 items-center justify-center', a.solid ? 'rounded-md bg-[#4125d0]' : 'rounded-full border-2 border-[#4527c8] bg-white')}>
                  <Icon className={cn('size-[14px]', a.solid ? 'fill-white/20 text-white' : 'text-[#4527c8]')} aria-hidden="true" />
                </span>
                <span className="flex-1 truncate">{a.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Needs Review — rendered only when something requires attention. Wording is neutral: an anomaly
// raises a review state, it never accuses the client of abuse or penalises them automatically.
export function NeedsReviewCard({ issues, onReview }) {
  if (!issues || issues.length === 0) return null
  const first = issues[0]
  return (
    <section aria-label="Needs review" className="rounded-xl border border-[#f3d9a8] bg-linear-to-b from-[#fff3de] to-[#ffe9c8] p-3.5 shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(146,81,10,0.25)]">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 size-9 shrink-0 fill-[#f2672a] text-white" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-[17px] leading-tight font-bold tracking-tight text-[#1b1140]">{first.title}</h2>
          <ul className="mt-1 space-y-0.5">
            {issues.map((i) => <li key={i.id} className="text-[12.5px] leading-snug text-[#1b1140]">{i.text}</li>)}
          </ul>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onReview(first)}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white text-[13.5px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]"
      >
        Review Now <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </section>
  )
}
