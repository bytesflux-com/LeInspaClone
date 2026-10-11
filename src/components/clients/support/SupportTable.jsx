import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react'
import EmptyState from '../../ui/EmptyState'
import { CaseStatusPill, CaseTile, PriorityText } from './SupportBadges'
import { PAGE_SIZES, TYPE_LABELS } from '../../../constants/clientSupport'
import { formatDay } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const COLS = [
  { id: 'id', label: 'Case ID', w: 'minmax(104px,0.95fr)' },
  { id: 'type', label: 'Type', w: 'minmax(70px,0.6fr)' },
  { id: 'subject', label: 'Issue / Subject', w: 'minmax(140px,1.35fr)' },
  { id: 'related', label: 'Related To', w: 'minmax(130px,1.2fr)' },
  { id: 'opened', label: 'Opened', w: 'minmax(92px,0.85fr)' },
  { id: 'priority', label: 'Priority', w: 'minmax(64px,0.6fr)' },
  { id: 'status', label: 'Status', w: 'minmax(112px,1fr)' },
  { id: 'assigned', label: 'Assigned To', w: 'minmax(96px,0.9fr)' },
  { id: 'action', label: 'Action', w: 'minmax(84px,0.75fr)' },
]
const TEMPLATE = COLS.map((c) => c.w).join(' ')

function Pagination({ page, pageSize, total, totalPages, onPage, onPageSize }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const btn = 'flex size-[34px] items-center justify-center rounded-lg border text-[13px] font-medium transition'
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - page) <= 1)
  return (
    <div className="grid items-center gap-3 px-1 pt-3 text-[13px] text-[#2a1b57] md:grid-cols-[1fr_auto_1fr]">
      <p>Showing {from}–{to} of {total} cases</p>
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

function Row({ c, tz, selected, onSelect }) {
  return (
    <li
      role="row"
      aria-selected={selected}
      tabIndex={0}
      onClick={() => onSelect(c.id)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect(c.id)
        }
      }}
      style={{ gridTemplateColumns: TEMPLATE }}
      className={cn(
        'grid cursor-pointer items-center gap-x-3 border-b border-[#efecf7] px-2.5 py-[5px] transition outline-none last:border-b-0 focus-visible:ring-2 focus-visible:ring-[#7a5cf0]',
        selected ? 'bg-[#f8f6ff]' : 'hover:bg-[#faf9fe]',
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <CaseTile type={c.type} status={c.status} size={24} />
        <p className="truncate text-[12.5px] font-semibold text-[#1b1140]">{c.id}</p>
      </div>
      <p className="text-[12px] text-[#1b1140]">{TYPE_LABELS[c.type]}</p>
      <p className="truncate text-[12px] text-[#1b1140]">{c.subject}</p>
      <p className="truncate text-[12px] text-[#1b1140]">{c.related ? c.related.label : <span aria-label="Not related to a booking">—</span>}</p>
      <p className="text-[12px] whitespace-nowrap text-[#1b1140]">{formatDay(c.openedAt, tz, { year: true })}</p>
      <div><PriorityText priority={c.priority} /></div>
      <div><CaseStatusPill status={c.status} className="!py-[4px] !text-[11px]" /></div>
      <p className="truncate text-[12px] text-[#1b1140]">{c.assignedTo}</p>
      <div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(c.id)
          }}
          className="inline-flex h-[26px] w-full max-w-[84px] items-center justify-center gap-1.5 rounded-md border-[1.5px] border-[#8b6cf0] bg-white px-2 text-[12px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]"
        >
          View <ArrowRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

export default function SupportTable({ data, selectedId, fetching, tab, onSelect, onPage, onPageSize, onClear, hasFilters }) {
  const { items, client } = data
  const safetyEmpty = tab === 'safety' && !hasFilters && !data.safety.restricted

  return (
    <div>
      <div className={cn('overflow-x-auto transition-opacity', fetching && 'opacity-60')} aria-busy={fetching}>
        <div className="min-w-[980px]" role="table" aria-label="Support and safety history">
          <div role="row" style={{ gridTemplateColumns: TEMPLATE }} className="grid items-center gap-x-3 border-y border-[#e6e1f3] bg-[#f7f5fd] px-2.5 py-2 text-[12px] font-semibold text-[#1b1140]">
            {COLS.map((c) => <span key={c.id} role="columnheader">{c.label}</span>)}
          </div>

          {items.length === 0 ? (
            safetyEmpty ? (
              <EmptyState icon={ShieldCheck} title="✓ No Safety History" description="No safety cases involving this client have been recorded." />
            ) : tab === 'safety' && data.safety.restricted ? (
              <EmptyState icon={ShieldCheck} title="Safety history is restricted" description="Safety cases need Trust & Safety access, so none are listed for your role." />
            ) : (
              <EmptyState
                icon={ShieldCheck}
                title={hasFilters ? 'No cases match these filters' : 'No support history yet'}
                description={hasFilters ? 'Try a different tab, date range or search term.' : 'This client has not needed support, raised a dispute or submitted a report.'}
                action={hasFilters && <button type="button" onClick={onClear} className="h-9 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-4 text-[13px] font-semibold text-[#3b1fd6] hover:bg-[#f4f1fc]">Clear filters</button>}
              />
            )
          ) : (
            <ul role="rowgroup">
              {items.map((c) => <Row key={c.id} c={c} tz={client.timeZone} selected={c.id === selectedId} onSelect={onSelect} />)}
            </ul>
          )}
        </div>
      </div>

      {data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} totalPages={data.totalPages} onPage={onPage} onPageSize={onPageSize} />}
    </div>
  )
}
