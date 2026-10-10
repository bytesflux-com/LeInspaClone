import { ArrowRight, Banknote, CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import EmptyState from '../../ui/EmptyState'
import { MethodCell, PaymentStatusPill, RelatedVisual, TransactionTile } from './PaymentBadges'
import { PAGE_SIZES } from '../../../constants/clientPayments'
import { formatDay, formatTime } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const COLS = [
  { id: 'check', label: '', w: '28px' },
  { id: 'txn', label: 'Transaction', w: 'minmax(150px,1.45fr)' },
  { id: 'related', label: 'Related To', w: 'minmax(200px,1.9fr)' },
  { id: 'when', label: 'Date & Time', w: 'minmax(112px,1fr)' },
  { id: 'method', label: 'Method', w: 'minmax(138px,1.3fr)' },
  { id: 'amount', label: 'Amount', w: 'minmax(88px,0.8fr)' },
  { id: 'status', label: 'Status', w: 'minmax(106px,0.95fr)' },
  { id: 'action', label: 'Action', w: 'minmax(96px,0.85fr)' },
]
const TEMPLATE = COLS.map((c) => c.w).join(' ')

const CHECK = 'size-[17px] cursor-pointer rounded-[4px] border-[#c9c1e6] accent-[#4125d0]'

export function Pagination({ page, pageSize, total, totalPages, onPage, onPageSize }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const btn = 'flex size-[32px] items-center justify-center rounded-lg border text-[12.5px] font-medium transition'
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - page) <= 1)
  return (
    <div className="grid items-center gap-3 px-1 pt-3 text-[12.5px] text-[#2a1b57] md:grid-cols-[1fr_auto_1fr]">
      <p>Showing {from}–{to} of {total} payments</p>
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

function Row({ p, client, selected, onSelect, onOpen }) {
  const tz = client.timeZone
  return (
    <li
      role="row"
      aria-selected={selected}
      tabIndex={0}
      onClick={() => onSelect(p.id)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect(p.id)
        }
      }}
      style={{ gridTemplateColumns: TEMPLATE }}
      className={cn(
        'grid cursor-pointer items-center gap-x-3 rounded-xl px-2.5 py-2.5 transition outline-none focus-visible:ring-2 focus-visible:ring-[#7a5cf0]',
        selected ? 'bg-[#f6f3ff] ring-[1.5px] ring-[#7a5cf0] shadow-[0_6px_18px_-10px_rgba(69,39,200,0.45)]' : 'border-b border-[#efecf7] hover:bg-[#faf9fe]',
      )}
    >
      <input
        type="checkbox"
        className={CHECK}
        checked={selected}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onSelect(p.id)}
        aria-label={`Select payment ${p.id}`}
      />

      <div className="flex min-w-0 items-center gap-2">
        <TransactionTile failed={p.status === 'failed'} />
        <div className="min-w-0 leading-snug">
          <p className="truncate text-[12.5px] font-bold text-[#1b1140]">{p.id}</p>
          <p className="truncate text-[10.5px] text-[#2a1b57]">{p.txn}</p>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2.5">
        <RelatedVisual payment={p} size={40} />
        <div className="min-w-0 leading-snug">
          <p className="truncate text-[12.5px] font-bold text-[#1b1140]">{p.title}</p>
          <p className="truncate text-[11.5px] text-[#2a1b57]">{p.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-[#1b1140]">
        <CalendarDays className="size-[17px] shrink-0 text-[#4527c8]" aria-hidden="true" />
        <div className="leading-snug">
          <p>{formatDay(p.createdAt, tz, { year: true })}</p>
          <p>{formatTime(p.createdAt, tz)}</p>
        </div>
      </div>

      <div><MethodCell method={p.method} /></div>

      <p className="text-[13px] font-bold whitespace-nowrap text-[#1b1140] tabular-nums">{client.currency} {p.amount.toLocaleString('en-US')}</p>

      <div><PaymentStatusPill status={p.status} /></div>

      <div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(p)
          }}
          className="inline-flex h-9 w-full max-w-[96px] items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-2.5 text-[12.5px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]"
        >
          View <ArrowRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

export default function PaymentTable({ data, selectedId, fetching, onSelect, onOpen, onPage, onPageSize, onClear, hasFilters }) {
  const { items, client } = data
  return (
    <div>
      <div className={cn('overflow-x-auto transition-opacity', fetching && 'opacity-60')} aria-busy={fetching}>
        <div className="min-w-[900px]" role="table" aria-label="Client payments">
          <div role="row" style={{ gridTemplateColumns: TEMPLATE }} className="grid items-center gap-x-3 rounded-lg bg-[#eceefb] px-2.5 py-2.5 text-[11.5px] font-semibold text-[#1b1140]">
            {COLS.map((c) =>
              c.id === 'check' ? (
                <input key={c.id} type="checkbox" disabled checked={false} readOnly className={cn(CHECK, 'cursor-default opacity-60')} aria-label="Single selection — pick a row to open its details" />
              ) : (
                <span key={c.id} role="columnheader">{c.label}</span>
              ),
            )}
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={Banknote}
              title={hasFilters ? 'No payments match these filters' : 'No payments yet'}
              description={hasFilters ? 'Try a different status, date range or search term.' : 'This client has no payment activity in the selected market.'}
              action={hasFilters && <button type="button" onClick={onClear} className="h-9 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-4 text-[13px] font-semibold text-[#3b1fd6] hover:bg-[#f4f1fc]">Clear filters</button>}
            />
          ) : (
            <ul role="rowgroup" className="mt-1.5 space-y-0.5">
              {items.map((p) => (
                <Row key={p.id} p={p} client={client} selected={p.id === selectedId} onSelect={onSelect} onOpen={onOpen} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} totalPages={data.totalPages} onPage={onPage} onPageSize={onPageSize} />}
    </div>
  )
}
