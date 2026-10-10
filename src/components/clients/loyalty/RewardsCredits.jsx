import { Link } from 'react-router'
import { ArrowRight, ChevronUp, Gift } from 'lucide-react'
import EmptyState from '../../ui/EmptyState'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { Amount, StatusPill, ViewButton } from './LoyaltyBadges'
import { REWARDS_PREVIEW, REWARD_STATUS_STYLE, REWARD_TABS, SOURCE_LABELS } from '../../../constants/clientLoyalty'
import { formatDay } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const TEMPLATE = 'minmax(92px,1.05fr) minmax(70px,0.8fr) minmax(76px,0.85fr) minmax(94px,1fr) minmax(92px,1fr) minmax(110px,1.2fr) minmax(76px,0.8fr)'
const COLS = ['Reward ID', 'Source', 'Value', 'Issued', 'Status', 'Related Record', 'Action']

const TAB_FILTERS = {
  all: () => true,
  referral: (x) => x.source === 'referral',
  loyalty: (x) => x.source === 'loyalty',
  redeemed: (x) => x.status === 'redeemed',
  expired: (x) => x.status === 'expired',
}

// A reward always answers: why it exists (source), what it relates to, and what happened to it.
function RelatedRecord({ related, linkState, canViewBookings, onOpenReferral }) {
  if (!related) return <span aria-label="No related record">—</span>
  if (related.kind === 'referral') {
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); onOpenReferral(related.id) }} className="truncate text-left hover:text-[#3b1fd6] hover:underline">
        {related.label}
      </button>
    )
  }
  if (related.kind === 'booking' && canViewBookings) {
    return <Link to={`/bookings/${related.id}`} state={linkState} className="truncate hover:text-[#3b1fd6] hover:underline">{related.label}</Link>
  }
  return <span className="truncate">{related.label}</span>
}

// Rewards & Credits — every reward from any source in one place, each with its source badge,
// status and related record. Historical rewards are never edited from here.
export default function RewardsCredits({ rewards, currency, timeZone, canSeeFinancial, canViewBookings, linkState, tab, onTab, expanded, onToggle, onOpen, onOpenReferral }) {
  const { items, counts } = rewards
  const filtered = items.filter(TAB_FILTERS[tab] || TAB_FILTERS.all)
  const shown = expanded ? filtered : filtered.slice(0, REWARDS_PREVIEW)
  const more = counts.all > REWARDS_PREVIEW

  return (
    <section aria-label="Rewards and credits" className={cn(PROFILE_CARD, 'p-3')}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[17px] leading-tight font-bold tracking-tight text-[#1b1140]">Rewards & Credits ({counts.all})</h2>
        {more && (
          <button type="button" onClick={onToggle} aria-expanded={expanded} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#3b1fd6] hover:underline">
            {expanded ? 'Show Less' : 'View All Rewards'}
            {expanded ? <ChevronUp className="size-3.5" aria-hidden="true" /> : <ArrowRight className="size-3.5" aria-hidden="true" />}
          </button>
        )}
      </header>

      <div role="tablist" aria-label="Reward group" className="mb-2.5 flex flex-wrap items-center gap-2">
        {REWARD_TABS.map((t) => {
          const on = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onTab(t.id)}
              className={cn(
                'h-[30px] min-w-[70px] rounded-md border px-3 text-[12.5px] font-medium whitespace-nowrap transition',
                on ? 'border-[#4125d0] bg-[#4125d0] text-white shadow-sm' : 'border-[#ddd7ee] bg-[#f4f1fc] text-[#1b1140] hover:bg-[#ece6ff]',
              )}
            >
              {t.label} ({counts[t.id]})
            </button>
          )
        })}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]" role="table" aria-label="Rewards and credits">
          <div role="row" style={{ gridTemplateColumns: TEMPLATE }} className="grid items-center gap-x-2.5 border-y border-[#e6e1f3] bg-[#f7f5fd] px-2 py-2 text-[12px] font-semibold text-[#1b1140]">
            {COLS.map((c) => <span key={c} role="columnheader">{c}</span>)}
          </div>

          {shown.length === 0 ? (
            <EmptyState icon={Gift} title={tab === 'all' ? 'No rewards yet' : 'No rewards in this group'} description={tab === 'all' ? 'Referral and loyalty rewards will appear here once they are issued.' : 'Try a different group.'} />
          ) : (
            <ul role="rowgroup">
              {shown.map((x) => (
                <li key={x.id} role="row" style={{ gridTemplateColumns: TEMPLATE }} className="grid items-center gap-x-2.5 border-b border-[#efecf7] px-2 py-[7px] text-[12px] text-[#1b1140] last:border-b-0">
                  <p className="truncate font-medium">{x.id}</p>
                  <p>{SOURCE_LABELS[x.source] || x.source}</p>
                  <p className="font-bold"><Amount value={x.value} currency={currency} show={canSeeFinancial} /></p>
                  <p>{formatDay(x.issuedAt, timeZone, { year: true })}</p>
                  <div><StatusPill style={REWARD_STATUS_STYLE[x.status]} /></div>
                  <div className="flex min-w-0"><RelatedRecord related={x.related} linkState={linkState} canViewBookings={canViewBookings} onOpenReferral={onOpenReferral} /></div>
                  <div><ViewButton ariaLabel={`View reward ${x.id}`} onClick={() => onOpen(x.id)} /></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
