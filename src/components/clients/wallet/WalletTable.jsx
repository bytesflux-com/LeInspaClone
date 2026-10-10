import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, WalletCards } from 'lucide-react'
import EmptyState from '../../ui/EmptyState'
import { EffectChip, LedgerTile, SignedAmount, TypeTile, WalletStatusPill } from './WalletBadges'
import { PAGE_SIZES } from '../../../constants/clientWallet'
import { formatDay, formatTime } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const COLS = [
  { id: 'txn', label: 'Transaction ID', w: 'minmax(150px,1.35fr)' },
  { id: 'type', label: 'Type', w: 'minmax(150px,1.35fr)' },
  { id: 'related', label: 'Related To', w: 'minmax(130px,1.25fr)' },
  { id: 'when', label: 'Date & Time', w: 'minmax(96px,0.95fr)' },
  { id: 'amount', label: 'Amount', w: 'minmax(104px,0.95fr)' },
  { id: 'effect', label: 'Balance Effect', w: 'minmax(92px,0.85fr)' },
  { id: 'status', label: 'Status', w: 'minmax(108px,0.95fr)' },
  { id: 'action', label: 'Action', w: 'minmax(92px,0.8fr)' },
]
const TEMPLATE = COLS.map((c) => c.w).join(' ')

function Pagination({ page, pageSize, total, totalPages, onPage, onPageSize }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const btn = 'flex size-[34px] items-center justify-center rounded-lg border text-[13px] font-medium transition'
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - page) <= 1)
  return (
    <div className="grid items-center gap-3 px-1 pt-3 text-[13px] text-[#2a1b57] md:grid-cols-[1fr_auto_1fr]">
      <p>Showing {from}–{to} of {total} transactions</p>
      <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page" className={cn(btn, 'border-[#ddd7ee] bg-white text-[#1b1140] hover:bg-[#f1edff] disabled:cursor-not-allowed disabled:opacity-40')}>
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((p, i) => (
          <span key={p} className="flex items-center gap-1.5">
            {i > 0 && p - pages[i - 1] > 1 && <span className="text-[#6b6785]">…</span>}
            <button
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(btn, p === page ? 'border-[#4125d0] bg-[#4125d0] text-white' : 'border-[#ddd7ee] bg-white text-[#1b1140] hover:bg-[#f1edff]')}
            >
              {p}
            </button>
          </span>
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page" className={cn(btn, 'border-[#ddd7ee] bg-white text-[#1b1140] hover:bg-[#f1edff] disabled:cursor-not-allowed disabled:opacity-40')}>
          <ChevronRight className="size-4" />
        </button>
      </nav>
      <label className="flex items-center justify-end gap-2 text-[13px]">
        Rows per page
        <span className="relative">
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="h-[34px] w-[68px] appearance-none rounded-lg border border-[#ddd7ee] bg-white pr-6 pl-3 text-[13px] font-medium text-[#1b1140] focus:border-[#7a5cf0] focus:outline-none">
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-[#1b1140]" />
        </span>
      </label>
    </div>
  )
}

function Row({ t, client, selected, onSelect, onOpen }) {
  const tz = client.timeZone
  return (
    <li
      role="row"
      aria-selected={selected}
      tabIndex={0}
      onClick={() => onSelect(t.id)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect(t.id)
        }
      }}
      style={{ gridTemplateColumns: TEMPLATE }}
      className={cn(
        'grid cursor-pointer items-center gap-x-3 border-b border-[#efecf7] px-2.5 py-[11px] transition outline-none last:border-b-0 focus-visible:ring-2 focus-visible:ring-[#7a5cf0]',
        selected ? 'bg-[#f8f6ff]' : 'hover:bg-[#faf9fe]',
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <LedgerTile size={28} failed={t.status === 'failed'} />
        <p className="truncate text-[12.5px] font-bold text-[#1b1140]">{t.id}</p>
      </div>

      <div className="flex min-w-0 items-center gap-2.5">
        <TypeTile type={t.type} size={32} />
        <div className="min-w-0 leading-snug">
          <p className="truncate text-[12.5px] font-bold text-[#1b1140]">{t.title}</p>
          {t.subtitle && <p className="truncate text-[11px] text-[#2a1b57]">{t.subtitle}</p>}
        </div>
      </div>

      <div className="min-w-0 leading-snug text-[12px] text-[#1b1140]">
        {t.related ? (
          <>
            <p className="truncate">{t.related.label}</p>
            {t.related.sub && <p className="truncate text-[11px] text-[#2a1b57]">{t.related.sub}</p>}
          </>
        ) : (
          <span aria-label="Not related to a booking">—</span>
        )}
      </div>

      <div className="leading-snug text-[12px] text-[#1b1140]">
        <p>{formatDay(t.createdAt, tz, { year: true })}</p>
        <p>{formatTime(t.createdAt, tz)}</p>
      </div>

      <div className="text-[13px]"><SignedAmount amount={t.amount} direction={t.direction} currency={client.currency} /></div>

      <div><EffectChip direction={t.direction} /></div>

      <div><WalletStatusPill status={t.status} /></div>

      <div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(t)
          }}
          className="inline-flex h-9 w-full max-w-[92px] items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-2.5 text-[12.5px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]"
        >
          View <ArrowRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

export default function WalletTable({ data, selectedId, fetching, onSelect, onOpen, onPage, onPageSize, onClear, hasFilters }) {
  const { items, client } = data
  return (
    <div>
      <div className={cn('overflow-x-auto transition-opacity', fetching && 'opacity-60')} aria-busy={fetching}>
        <div className="min-w-[960px]" role="table" aria-label="Wallet transactions">
          <div role="row" style={{ gridTemplateColumns: TEMPLATE }} className="grid items-center gap-x-3 border-y border-[#e6e1f3] bg-[#f7f5fd] px-2.5 py-2.5 text-[12px] font-semibold text-[#1b1140]">
            {COLS.map((c) => <span key={c.id} role="columnheader">{c.label}</span>)}
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={WalletCards}
              title={hasFilters ? 'No transactions match these filters' : 'No wallet activity yet'}
              description={hasFilters ? 'Try a different tab, date range or search term.' : 'This wallet has no transactions in the selected market.'}
              action={hasFilters && <button type="button" onClick={onClear} className="h-9 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-4 text-[13px] font-semibold text-[#3b1fd6] hover:bg-[#f4f1fc]">Clear filters</button>}
            />
          ) : (
            <ul role="rowgroup">
              {items.map((t) => (
                <Row key={t.id} t={t} client={client} selected={t.id === selectedId} onSelect={onSelect} onOpen={onOpen} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} totalPages={data.totalPages} onPage={onPage} onPageSize={onPageSize} />}
    </div>
  )
}
