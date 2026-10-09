import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Building2, CalendarDays, Clock, CreditCard, MapPin, Smartphone, Store, TriangleAlert, User, X } from 'lucide-react'
import Skeleton from '../../ui/Skeleton'
import { EscrowPill, PaymentPill, StatusPill } from './BookingBadges'
import { SOURCE_LABELS } from '../../../constants/clientBookings'
import { formatDay, formatFullStamp, formatTime } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const CARD = 'rounded-xl border border-[#e6e1f3] bg-white p-3'
const OUTLINE = 'flex h-10 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-[#b9a9f0] bg-white px-3 text-[12.5px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]'

const duration = (mins) => (mins % 60 === 0 ? `${mins / 60} hr` : mins > 60 ? `${Math.floor(mins / 60)} hr ${mins % 60} min` : `${mins} min`)

function InfoRow({ icon: Icon, children, sub }) {
  return (
    <li className="flex items-start gap-3 py-[7px]">
      <Icon className="mt-0.5 size-[18px] shrink-0 text-[#4527c8]" aria-hidden="true" />
      <div className="min-w-0 text-[12.5px] leading-snug">
        <p className="font-medium text-[#1b1140]">{children}</p>
        {sub && <p className="text-[11.5px] text-[#4a4466]">{sub}</p>}
      </div>
    </li>
  )
}

function KV({ label, children }) {
  return (
    <li className="grid grid-cols-[96px_1fr] items-center gap-2 py-[5px] text-[12px]">
      <span className="text-[#2a1b57]">{label}</span>
      <span className="font-medium text-[#1b1140]">{children}</span>
    </li>
  )
}

function Overview({ b, p, currency, timeZone, canSeeFinancial, clientName, clientId }) {
  return (
    <div className="space-y-2.5">
      <section className={CARD}>
        <h3 className="mb-1 text-[14px] font-bold text-[#1b1140]">Service Information</h3>
        <ul>
          <InfoRow icon={CalendarDays}>{b.service}</InfoRow>
          <InfoRow icon={Building2} sub={b.providerLabel}>{b.provider}</InfoRow>
          <InfoRow icon={User} sub={b.specialist.role}>{b.specialist.name}</InfoRow>
          <InfoRow icon={CalendarDays}>{formatDay(b.scheduledAt, timeZone, { year: true })}</InfoRow>
          <InfoRow icon={Clock}>{formatTime(b.scheduledAt, timeZone)} ({duration(b.durationMins)})</InfoRow>
          <InfoRow icon={MapPin} sub={`${b.city}, ${b.countryName}`}>{b.branch}</InfoRow>
        </ul>
      </section>

      <section className={CARD}>
        <h3 className="mb-1 text-[14px] font-bold text-[#1b1140]">Booking Details</h3>
        <ul>
          <KV label="Client">{clientName} ({clientId})</KV>
          <KV label={b.negotiated ? 'Agreed price' : 'Price'}>
            <span className="font-bold">{currency} {b.price.toLocaleString('en-US')}</span>
            {b.negotiated && <span className="ml-1.5 text-[10.5px] text-[#4a4466] line-through">{b.listPrice.toLocaleString('en-US')}</span>}
          </KV>
          <KV label="Booking Source">{SOURCE_LABELS[b.source]}</KV>
          {canSeeFinancial && <KV label="Payment Status"><PaymentPill status={b.payment} /></KV>}
          {canSeeFinancial && <KV label="Escrow Status"><EscrowPill status={b.escrow} /></KV>}
          <KV label="Booking Status"><StatusPill status={b.status} /></KV>
        </ul>
      </section>

      {p?.cancellation && (
        <section className="rounded-xl border border-[#f5c6c6] bg-[#fff5f5] p-3 text-[12px] text-[#1b1140]">
          <h3 className="mb-1 flex items-center gap-1.5 text-[13px] font-bold text-[#b91c1c]"><TriangleAlert className="size-4" aria-hidden="true" /> Cancellation</h3>
          <p>Cancelled by {p.cancellation.cancelledBy} — {p.cancellation.reason}.</p>
          {canSeeFinancial && <p className="mt-0.5">Refund {currency} {p.cancellation.refundAmount.toLocaleString('en-US')}: <span className="font-semibold">{p.cancellation.refundStatus}</span></p>}
          <p className="mt-0.5 text-[#4a4466]">Ref {p.cancellation.id}</p>
        </section>
      )}
      {p?.dispute && (
        <section className="rounded-xl border border-[#f5c6c6] bg-[#fff5f5] p-3 text-[12px] text-[#1b1140]">
          <h3 className="mb-1 flex items-center gap-1.5 text-[13px] font-bold text-[#b91c1c]"><TriangleAlert className="size-4" aria-hidden="true" /> Open dispute</h3>
          <p>{p.dispute.reason} — {p.dispute.status}.</p>
          <p className="mt-0.5 text-[#4a4466]">Ref {p.dispute.id}</p>
        </section>
      )}
    </div>
  )
}

function Timeline({ p, timeZone }) {
  if (!p) return <Skeleton className="h-40" />
  return (
    <ol className={cn(CARD, 'space-y-3')}>
      {p.timeline.map((e) => (
        <li key={e.id} className="relative pl-5 text-[12px]">
          <span className="absolute top-1.5 left-0 size-2 rounded-full bg-[#4527c8]" aria-hidden="true" />
          <p className="font-medium text-[#1b1140]">{e.text}</p>
          <p className="text-[11px] text-[#4a4466]">{formatFullStamp(e.at, timeZone)}</p>
        </li>
      ))}
    </ol>
  )
}

function Payment({ b, p, currency, timeZone }) {
  if (!p) return <Skeleton className="h-40" />
  const d = p.paymentDetail
  return (
    <section className={CARD}>
      <ul>
        <KV label="Payment ID">{d.id}</KV>
        <KV label="Method">{d.method}</KV>
        <KV label="Amount"><span className="font-bold">{currency} {d.amount.toLocaleString('en-US')}</span></KV>
        <KV label="Booking fee">{currency} {d.bookingFee.toLocaleString('en-US')}</KV>
        <KV label="Paid at">{formatFullStamp(d.paidAt, timeZone)}</KV>
        <KV label="Payment"><PaymentPill status={b.payment} /></KV>
        <KV label="Escrow"><EscrowPill status={b.escrow} /></KV>
      </ul>
    </section>
  )
}

function Notes({ p, timeZone }) {
  if (!p) return <Skeleton className="h-28" />
  return (
    <section className={CARD}>
      {p.notes.length === 0 ? (
        <p className="py-3 text-center text-[12px] text-[#4a4466]">No internal notes on this booking.</p>
      ) : (
        <ul className="space-y-2.5">
          {p.notes.map((n) => (
            <li key={n.id} className="text-[12px]">
              <p className="text-[#1b1140]">{n.text}</p>
              <p className="text-[11px] text-[#4a4466]">{n.author} • {formatFullStamp(n.createdAt, timeZone)}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 border-t border-[#efecf7] pt-2 text-[11px] text-[#4a4466]">Add or edit notes in the full booking.</p>
    </section>
  )
}

export default function BookingDrawer({ booking: b, preview, loading, error, canSeeFinancial, client, links, onClose }) {
  const [tab, setTab] = useState('overview')
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: 'Timeline' },
    ...(canSeeFinancial ? [{ id: 'payment', label: 'Payment' }] : []),
    { id: 'notes', label: 'Notes' },
  ]
  const active = tabs.some((t) => t.id === tab) ? tab : 'overview'

  return (
    <aside aria-label="Booking details" className="rounded-xl border border-[#e6e1f3] bg-white p-3.5 shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)]">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-[19px] font-bold tracking-tight text-[#1b1140]">Booking Details</h2>
        <button type="button" onClick={onClose} aria-label="Close booking details" className="rounded-lg p-1 text-[#1b1140] transition hover:bg-[#f1edff]">
          <X className="size-5" />
        </button>
      </header>

      <div className="flex items-start gap-3">
        <img src={b.image} alt="" className="h-[80px] w-[80px] shrink-0 rounded-xl object-cover" />
        <div className="min-w-0 pt-0.5">
          <StatusPill status={b.status} className="mb-1.5" />
          <p className="text-[15px] leading-tight font-bold text-[#1b1140]">{b.service}</p>
          <p className="mt-1 text-[12px] text-[#2a1b57]">Booking #: {b.id}</p>
        </div>
      </div>

      <div role="tablist" className="mt-3 mb-2.5 grid overflow-hidden rounded-lg border border-[#d9d3ee]" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === active}
            onClick={() => setTab(t.id)}
            className={cn('h-[34px] text-[12px] font-medium transition', t.id === active ? 'bg-[#4125d0] font-semibold text-white' : 'bg-white text-[#1b1140] hover:bg-[#f4f1fc]')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-[#fff1f1] p-3 text-[12px] text-[#b91c1c]">{error}</p>
      ) : (
        <>
          {active === 'overview' && <Overview b={b} p={loading ? null : preview} currency={client.currency} timeZone={client.timeZone} canSeeFinancial={canSeeFinancial} clientName={client.name} clientId={client.id} />}
          {active === 'timeline' && <Timeline p={loading ? null : preview} timeZone={client.timeZone} />}
          {active === 'payment' && canSeeFinancial && <Payment b={b} p={loading ? null : preview} currency={client.currency} timeZone={client.timeZone} />}
          {active === 'notes' && <Notes p={loading ? null : preview} timeZone={client.timeZone} />}
        </>
      )}

      <div className="mt-3 space-y-2">
        <Link to={links.full} state={links.state} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#4125d0] px-3 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3719b8]">
          Open Full Booking <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <Link to={links.provider} state={links.state} className={OUTLINE}><Store className="size-4" aria-hidden="true" /> View Provider Profile</Link>
        <Link to={links.service} state={links.state} className={OUTLINE}><Smartphone className="size-4" aria-hidden="true" /> View Service Details</Link>
        {canSeeFinancial && <Link to={links.payment} state={links.state} className={OUTLINE}><CreditCard className="size-4" aria-hidden="true" /> View Payment Details</Link>}
      </div>
    </aside>
  )
}
