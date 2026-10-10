import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, X } from 'lucide-react'
import EmptyState from '../../ui/EmptyState'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { HistoryStatusPill, formatPrice } from './MembershipBadges'
import { themeFor } from '../../../constants/clientMembership'
import { formatDay, formatFullStamp } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const TEMPLATE = 'minmax(170px,1.6fr) minmax(130px,1.2fr) minmax(80px,0.8fr) minmax(100px,0.9fr) minmax(80px,0.8fr) minmax(70px,0.6fr)'
const HEAD = ['Membership', 'Period', 'Amount', 'Status', 'Reason', 'Action']
const OUTLINE = 'inline-flex h-8 items-center justify-center gap-1 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-2.5 text-[12px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]'

export const periodLabel = (h, tz) => (h.periodEnd ? `${formatDay(h.periodStart, tz)} – ${formatDay(h.periodEnd, tz, { year: true })}` : `Since ${formatDay(h.periodStart, tz, { year: true })}`)

function TierTile({ tierId }) {
  const t = themeFor(tierId)
  const Icon = t.icon
  return (
    <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', tierId === 'standard' ? 'bg-[#f6e9c9] text-[#b4570b]' : 'bg-[#2a0f7a] text-[#f6d27a]')} aria-hidden="true">
      <Icon className="size-4" />
    </span>
  )
}

function Row({ label, children }) {
  return <div className="flex items-center justify-between gap-3 border-b border-[#efecf7] py-2 text-[12.5px] last:border-b-0"><dt className="text-[#2a1b57]">{label}</dt><dd className="text-right font-semibold text-[#1b1140]">{children}</dd></div>
}

// Membership Record Details — a read-only look at one history record. History is never edited or overwritten.
function RecordDialog({ record: h, client, canSeeFinancial, paymentTo, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const tz = client.timeZone
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" aria-label="Close membership record" onClick={onClose} className="absolute inset-0 bg-[#1b1140]/40" />
      <div role="dialog" aria-modal="true" aria-label="Membership record details" className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <header className="mb-2 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#1b1140]">Membership Record</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 hover:bg-[#f1edff]"><X className="size-5" /></button>
        </header>
        <dl>
          <Row label="Record ID">{h.id}</Row>
          <Row label="Membership">{h.name}</Row>
          <Row label="Period">{periodLabel(h, tz)}</Row>
          <Row label="Amount charged">{formatPrice(h.currency, h.amount, { restricted: !canSeeFinancial })}</Row>
          <Row label="Status"><HistoryStatusPill status={h.status} /></Row>
          <Row label="Reason">{h.reason}</Row>
          <Row label="Recorded by">{h.by}</Row>
          {h.periodStart && <Row label="Started">{formatFullStamp(h.periodStart, tz)}</Row>}
        </dl>
        <p className="mt-3 rounded-lg bg-[#f4f1fc] px-3 py-2 text-[11.5px] text-[#2a1b57]">The price shown is what was charged for this period. It is preserved even if the plan price changes later.</p>
        {h.paymentId && canSeeFinancial && (
          <Link to={paymentTo(h.paymentId)} className={cn(OUTLINE, 'mt-3 w-full')}>View Payment {h.paymentId} <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
        )}
      </div>
    </div>
  )
}

export default function MembershipHistory({ history, client, canSeeFinancial, paymentTo }) {
  const [open, setOpen] = useState(null)
  const tz = client.timeZone
  return (
    <section aria-label="Membership history" className={cn(PROFILE_CARD, 'p-3')}>
      <h2 className="mb-2 text-[17px] font-bold tracking-tight text-[#1b1140]">Membership History</h2>
      {history.length === 0 ? (
        <EmptyState title="No membership history" description="This client has never held a membership record." />
      ) : (
        <div className="overflow-x-auto">
          <div role="table" aria-label="Membership history" className="min-w-[640px]">
            <div role="row" style={{ gridTemplateColumns: TEMPLATE }} className="grid gap-x-3 rounded-lg bg-[#f4f1fc] px-2.5 py-2 text-[11.5px] font-semibold text-[#2a1b57]">
              {HEAD.map((c) => <span key={c} role="columnheader">{c}</span>)}
            </div>
            <ul>
              {history.map((h) => (
                <li key={h.id} role="row" style={{ gridTemplateColumns: TEMPLATE }} className="grid items-center gap-x-3 border-b border-[#efecf7] px-2.5 py-2.5 text-[12.5px] last:border-b-0 hover:bg-[#faf9fe]">
                  <span role="cell" className="flex min-w-0 items-center gap-2 font-semibold text-[#1b1140]"><TierTile tierId={h.tierId} /><span className="leading-tight">{h.name}</span></span>
                  <span role="cell" className="text-[#1b1140]">{periodLabel(h, tz)}</span>
                  <span role="cell" className="font-semibold whitespace-nowrap text-[#1b1140]">{formatPrice(h.currency, h.amount, { restricted: !canSeeFinancial })}</span>
                  <span role="cell"><HistoryStatusPill status={h.status} /></span>
                  <span role="cell" className="text-[#1b1140]">{h.reason}</span>
                  <span role="cell"><button type="button" onClick={() => setOpen(h)} className={OUTLINE}>View <ArrowRight className="size-3.5" aria-hidden="true" /></button></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {open && <RecordDialog record={open} client={client} canSeeFinancial={canSeeFinancial} paymentTo={paymentTo} onClose={() => setOpen(null)} />}
    </section>
  )
}
