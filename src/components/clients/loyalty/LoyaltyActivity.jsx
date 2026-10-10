import { Link } from 'react-router'
import { ArrowRight, ChevronUp, Sparkles } from 'lucide-react'
import EmptyState from '../../ui/EmptyState'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { ActivityTile, StatusPill } from './LoyaltyBadges'
import { ACTIVITY_PREVIEW, ACTIVITY_STATUS_STYLE } from '../../../constants/clientLoyalty'
import { formatDay, formatTime } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const TEMPLATE = 'minmax(150px,1.35fr) minmax(150px,1.45fr) minmax(104px,1fr) minmax(104px,1fr) minmax(92px,0.9fr)'
const COLS = ['Activity', 'Related To', 'Date', 'Progress / Reward', 'Status']

// One movement of the loyalty ledger. Every movement has a source: a booking, a milestone or a redemption.
function Delta({ delta, currency, canSeeFinancial }) {
  if (delta.type === 'progress') return <span className="font-medium text-[#15803d]">+{delta.value} Progress</span>
  if (delta.type === 'points') return <span className="font-medium text-[#15803d]">+{delta.value.toLocaleString('en-US')} Points</span>
  if (delta.type === 'reward') {
    return <span className="font-bold whitespace-nowrap text-[#15803d]">{canSeeFinancial ? `${currency} ${delta.value.toLocaleString('en-US')} ` : ''}Reward</span>
  }
  return <span className="font-bold whitespace-nowrap text-[#dc2626]">- {delta.value} Reward</span>
}

function Related({ related, linkState, canViewBookings }) {
  const bookingText = related.sub?.startsWith('Booking #') ? related.sub : related.label?.startsWith('Booking #') ? related.label : null
  const link = (text) =>
    related.bookingId && canViewBookings && text === bookingText ? (
      <Link to={`/bookings/${related.bookingId}`} state={linkState} onClick={(e) => e.stopPropagation()} className="truncate text-[#1b1140] hover:text-[#3b1fd6] hover:underline">{text}</Link>
    ) : (
      <span className="truncate">{text}</span>
    )
  return (
    <div className="min-w-0 leading-snug text-[12px] text-[#1b1140]">
      <p className="flex">{link(related.label)}</p>
      {related.sub && <p className="flex text-[11px] text-[#2a1b57]">{link(related.sub)}</p>}
    </div>
  )
}

// Loyalty Activity — read-only ledger. "View All" expands the card in place.
export default function LoyaltyActivity({ activity, currency, timeZone, canSeeFinancial, canViewBookings, linkState, expanded, onToggle }) {
  const { items, total } = activity
  const shown = expanded ? items : items.slice(0, ACTIVITY_PREVIEW)
  const more = total > ACTIVITY_PREVIEW
  return (
    <section aria-label="Loyalty activity" className={cn(PROFILE_CARD, 'p-3')}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[17px] leading-tight font-bold tracking-tight text-[#1b1140]">Loyalty Activity ({total})</h2>
        {more && (
          <button type="button" onClick={onToggle} aria-expanded={expanded} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#3b1fd6] hover:underline">
            {expanded ? 'Show Less' : 'View All'}
            {expanded ? <ChevronUp className="size-3.5" aria-hidden="true" /> : <ArrowRight className="size-3.5" aria-hidden="true" />}
          </button>
        )}
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-[620px]" role="table" aria-label="Loyalty activity">
          <div role="row" style={{ gridTemplateColumns: TEMPLATE }} className="grid items-center gap-x-2.5 border-y border-[#e6e1f3] bg-[#f7f5fd] px-2 py-2 text-[12px] font-semibold text-[#1b1140]">
            {COLS.map((c) => <span key={c} role="columnheader">{c}</span>)}
          </div>

          {items.length === 0 ? (
            <EmptyState icon={Sparkles} title="No loyalty activity yet" description="Eligible bookings and rewards will appear here as this client uses Lé Inspa." />
          ) : (
            <ul role="rowgroup">
              {shown.map((a) => (
                <li key={a.id} role="row" style={{ gridTemplateColumns: TEMPLATE }} className="grid items-center gap-x-2.5 border-b border-[#efecf7] px-2 py-[7px] last:border-b-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <ActivityTile kind={a.kind} size={28} />
                    <p className="truncate text-[12px] text-[#1b1140]">{a.title}</p>
                  </div>
                  <Related related={a.related} linkState={linkState} canViewBookings={canViewBookings} />
                  <div className="leading-snug text-[12px] text-[#1b1140]">
                    <p>{formatDay(a.at, timeZone, { year: true })}</p>
                    <p className="text-[11px] text-[#2a1b57]">{formatTime(a.at, timeZone)}</p>
                  </div>
                  <p className="text-[12px]"><Delta delta={a.delta} currency={currency} canSeeFinancial={canSeeFinancial} /></p>
                  <div><StatusPill style={ACTIVITY_STATUS_STYLE[a.status]} /></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
