import { ArrowRight, CalendarDays, CalendarX2, ChevronDown, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import EmptyState from '../../ui/EmptyState'
import { EscrowPill, PaymentPill, SourceCell, StatusPill } from './BookingBadges'
import { PAGE_SIZES } from '../../../constants/clientBookings'
import { formatDay, formatTime } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const money = (currency, n) => `${currency} ${n.toLocaleString('en-US')}`

function columns(finance) {
  return [
    { id: 'service', label: 'Service & Provider', w: 'minmax(215px,2.3fr)' },
    { id: 'when', label: 'Date & Time', w: 'minmax(118px,1.05fr)' },
    { id: 'where', label: 'Location', w: 'minmax(88px,0.85fr)' },
    { id: 'price', label: 'Price', w: 'minmax(84px,0.75fr)' },
    { id: 'status', label: 'Status', w: 'minmax(104px,0.95fr)' },
    ...(finance
      ? [
          { id: 'payment', label: 'Payment', w: 'minmax(80px,0.75fr)' },
          { id: 'escrow', label: 'Escrow', w: 'minmax(86px,0.8fr)' },
        ]
      : []),
    { id: 'source', label: 'Source', w: 'minmax(118px,1fr)' },
    { id: 'action', label: 'Action', w: 'minmax(116px,0.95fr)' },
  ]
}

export function Pagination({ page, pageSize, total, totalPages, onPage, onPageSize }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const btn = 'flex size-[32px] items-center justify-center rounded-lg border text-[12.5px] font-medium transition'
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - page) <= 1)
  return (
    <div className="grid items-center gap-3 px-1 pt-3 text-[12.5px] text-[#2a1b57] md:grid-cols-[1fr_auto_1fr]">
      <p>Showing {from}–{to} of {total} bookings</p>
      <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page" className={cn(btn, 'border-[#ddd7ee] bg-white text-[#4527c8] hover:bg-[#f1edff] disabled:cursor-not-allowed disabled:opacity-40')}>
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((p, i) => (
          <span key={p} className="flex items-center gap-1.5">
            {i > 0 && p - pages[i - 1] > 1 && <span className="text-[#6b6785]">…</span>}
            <button
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(btn, p === page ? 'border-[#4125d0] bg-[#4125d0] text-white' : 'border-[#ddd7ee] bg-white text-[#2a1b57] hover:bg-[#f1edff]')}
            >
              {p}
            </button>
          </span>
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page" className={cn(btn, 'border-[#ddd7ee] bg-white text-[#4527c8] hover:bg-[#f1edff] disabled:cursor-not-allowed disabled:opacity-40')}>
          <ChevronRight className="size-4" />
        </button>
      </nav>
      <label className="flex items-center justify-end gap-2 text-[12px]">
        Rows per page
        <span className="relative">
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="h-[32px] w-[64px] appearance-none rounded-lg border border-[#ddd7ee] bg-white pr-6 pl-2.5 text-[12.5px] font-medium text-[#2a1b57] focus:border-[#7a5cf0] focus:outline-none">
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-[#4527c8]" />
        </span>
      </label>
    </div>
  )
}

function Row({ b, client, finance, template, selected, onSelect, onOpen }) {
  const tz = client.timeZone
  return (
    <li
      role="row"
      aria-selected={selected}
      tabIndex={0}
      onClick={() => onSelect(b.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(b.id)
        }
      }}
      style={{ gridTemplateColumns: template }}
      className={cn(
        'grid cursor-pointer items-center gap-x-3 rounded-xl px-2.5 py-2.5 transition outline-none focus-visible:ring-2 focus-visible:ring-[#7a5cf0]',
        selected ? 'bg-white ring-[1.5px] ring-[#7a5cf0] shadow-[0_6px_18px_-10px_rgba(69,39,200,0.45)]' : 'border-b border-[#efecf7] hover:bg-[#faf9fe]',
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <img src={b.image} alt="" loading="lazy" className="h-[58px] w-[66px] shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 leading-snug">
          <p className="truncate text-[12.5px] font-bold text-[#1b1140]">{b.service}</p>
          <p className="truncate text-[11.5px] font-semibold text-[#2a1b57]">{b.provider}</p>
          <p className="truncate text-[10.5px] text-[#5b4a99]">{b.providerLabel}</p>
          <p className="truncate text-[10.5px] text-[#2a1b57]">Booking #: {b.id}</p>
        </div>
      </div>

      <div className="space-y-1 text-[12px] text-[#1b1140]">
        <p className="flex items-center gap-1.5"><CalendarDays className="size-4 shrink-0 text-[#4527c8]" aria-hidden="true" />{formatDay(b.scheduledAt, tz, { year: true })}</p>
        <p className="flex items-center gap-1.5"><Clock className="size-4 shrink-0 text-[#4527c8]" aria-hidden="true" />{formatTime(b.scheduledAt, tz)}</p>
      </div>

      <p className="flex items-start gap-1.5 text-[12px] leading-snug text-[#1b1140]">
        <MapPin className="mt-0.5 size-4 shrink-0 fill-[#4527c8] text-[#4527c8]" aria-hidden="true" />
        <span>{b.city}<br /><span className="text-[#2a1b57]">{b.countryName}</span></span>
      </p>

      <div>
        <p className="text-[12.5px] font-bold whitespace-nowrap text-[#1b1140]">{money(client.currency, b.price)}</p>
        {b.negotiated && <p className="text-[10px] font-medium text-[#4527c8]">Negotiated</p>}
      </div>

      <div><StatusPill status={b.status} /></div>
      {finance && <div><PaymentPill status={b.payment} /></div>}
      {finance && <div><EscrowPill status={b.escrow} /></div>}
      <div><SourceCell source={b.source} /></div>

      <div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(b)
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-2.5 text-[12px] font-semibold whitespace-nowrap text-[#3b1fd6] transition hover:bg-[#f4f1fc]"
        >
          {b.status === 'cancelled' ? 'View Details' : 'View Booking'} <ArrowRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

export default function BookingTable({ data, finance, selectedId, fetching, onSelect, onOpen, onPage, onPageSize, onClear, hasFilters }) {
  const cols = columns(finance)
  const template = cols.map((c) => c.w).join(' ')
  const { items, client } = data

  return (
    <div>
      <div className={cn('overflow-x-auto transition-opacity', fetching && 'opacity-60')} aria-busy={fetching}>
        <div className="min-w-[900px]" role="table" aria-label="Client bookings">
          <div role="row" style={{ gridTemplateColumns: template }} className="grid gap-x-3 rounded-lg bg-[#eceefb] px-2.5 py-2.5 text-[11.5px] font-semibold text-[#1b1140]">
            {cols.map((c) => <span key={c.id} role="columnheader">{c.label}</span>)}
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              title={hasFilters ? 'No bookings match these filters' : 'No bookings yet'}
              description={hasFilters ? 'Try a different status, date range or search term.' : 'This client has not made any bookings in the selected market.'}
              action={hasFilters && <button type="button" onClick={onClear} className="h-9 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-4 text-[13px] font-semibold text-[#3b1fd6] hover:bg-[#f4f1fc]">Clear filters</button>}
            />
          ) : (
            <ul role="rowgroup" className="mt-1.5 space-y-0.5">
              {items.map((b) => (
                <Row key={b.id} b={b} client={client} finance={finance} template={template} selected={b.id === selectedId} onSelect={onSelect} onOpen={onOpen} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} totalPages={data.totalPages} onPage={onPage} onPageSize={onPageSize} />}
    </div>
  )
}
