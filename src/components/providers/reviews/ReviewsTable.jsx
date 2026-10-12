import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '../../../lib/utils'
import PersonAvatar from '../../ui/PersonAvatar'
import { Pill, Stars } from '../trust/TrustUI'
import { REVIEW_STATUS_PILL, fmtDate } from '../trust/trustFormat'

const TABS = [
  ['all', 'All'],
  ['published', 'Published'],
  ['reported', 'Reported'],
  ['hidden', 'Hidden'],
  ['pending', 'Pending Review'],
]

const selectCls = 'h-9 min-w-[150px] rounded-xl border border-slate-200 bg-white px-3 text-[12px] text-slate-700 outline-none focus:border-royal-400'

function Select({ value, onChange, options, label }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

function pages(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out = [1]
  for (let p = Math.max(2, page - 1); p <= Math.min(total - 1, page + 1); p += 1) out.push(p)
  if (page < total - 2) out.push('…')
  out.push(total)
  if (page > 3) out.splice(1, 0, '…')
  return out
}

// ADM-025 — tabs, search, filters and the reviews table.
export function ReviewsTable({ data, filters, setFilter, selectedId, onSelect, fetching }) {
  const [more, setMore] = useState(false)
  const { counts, items, total, page, pageSize, totalPages } = data
  const activeFilters = ['rating', 'dateRange', 'status', 'bookingVerified', 'hasMedia', 'hasResponse'].filter((k) => filters[k] && filters[k] !== 'all').length
  const from = total ? (page - 1) * pageSize + 1 : 0
  const to = Math.min(total, page * pageSize)

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3.5">
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={filters.tab === id} type="button" onClick={() => setFilter({ tab: id, page: 1 })}
              className={cn('rounded-xl px-3 py-1.5 text-[12px] font-semibold transition', filters.tab === id ? 'bg-royal-700 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-royal-50')}>
              {label} ({counts[id]})
            </button>
          ))}
        </div>
        <label className="relative w-full sm:w-[320px]">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input value={filters.search} onChange={(e) => setFilter({ search: e.target.value, page: 1 })} placeholder="Search review ID, client, booking ID or keywords…" className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-8 pl-9 text-[12px] outline-none focus:border-royal-400 focus:ring-2 focus:ring-royal-100" />
          {filters.search && <button type="button" onClick={() => setFilter({ search: '', page: 1 })} className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400" aria-label="Clear search"><X className="size-4" /></button>}
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
        <Select label="Rating" value={filters.rating} onChange={(v) => setFilter({ rating: v, page: 1 })} options={[['all', 'Rating: All'], ['5', '5 stars'], ['4', '4 stars'], ['3', '3 stars'], ['2', '2 stars'], ['1', '1 star']]} />
        <Select label="Date" value={filters.dateRange} onChange={(v) => setFilter({ dateRange: v, page: 1 })} options={[['all', 'Date: All time'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['90d', 'Last 90 days'], ['12m', 'Last 12 months']]} />
        <Select label="Status" value={filters.status} onChange={(v) => setFilter({ status: v, page: 1 })} options={[['all', 'Status: All'], ['published', 'Published'], ['hidden', 'Hidden'], ['removed', 'Removed'], ['pending_review', 'Pending Review']]} />
        <Select label="Booking Verified" value={filters.bookingVerified} onChange={(v) => setFilter({ bookingVerified: v, page: 1 })} options={[['all', 'Booking Verified: All'], ['yes', 'Verified booking'], ['no', 'Not verified']]} />
        <button type="button" onClick={() => setMore((m) => !m)} className={cn('inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12px] font-semibold', more ? 'border-royal-400 bg-royal-50 text-royal-700' : 'border-royal-200 bg-white text-royal-700 hover:bg-royal-50')}>
          <SlidersHorizontal className="size-4" /> More Filters
        </button>
        {activeFilters > 0 && (
          <button type="button" onClick={() => setFilter({ rating: 'all', dateRange: 'all', status: 'all', bookingVerified: 'all', hasMedia: 'all', hasResponse: 'all', page: 1 })} className="text-[12px] font-semibold text-royal-600 hover:underline">
            Clear filters ({activeFilters})
          </button>
        )}
      </div>
      {more && (
        <div className="mx-4 mt-2 flex flex-wrap gap-2 rounded-xl bg-lavender-100/60 p-2.5">
          <Select label="Media" value={filters.hasMedia} onChange={(v) => setFilter({ hasMedia: v, page: 1 })} options={[['all', 'Photos: Any'], ['yes', 'With photos']]} />
          <Select label="Provider response" value={filters.hasResponse} onChange={(v) => setFilter({ hasResponse: v, page: 1 })} options={[['all', 'Provider response: Any'], ['yes', 'Responded'], ['no', 'No response']]} />
        </div>
      )}

      <div className={cn('mt-3 overflow-x-auto transition-opacity', fetching && 'opacity-60')}>
        <table className="w-full min-w-[860px] text-left text-[12px]">
          <thead className="border-y border-slate-100 bg-lavender-50 text-[11px] font-semibold text-slate-500">
            <tr>
              {['Review', 'Client', 'Booking', 'Service', 'Rating', 'Date', 'Status', 'Reported', 'Action'].map((h) => <th key={h} className="px-3 py-2.5 first:pl-4">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">No reviews match these filters.</td></tr>
            )}
            {items.map((r) => {
              const pill = REVIEW_STATUS_PILL[r.status]
              const selected = r.id === selectedId
              return (
                <tr key={r.id} onClick={() => onSelect(r.id)} className={cn('cursor-pointer hover:bg-royal-50/40', selected && 'bg-royal-50/70')}>
                  <td className="px-3 py-2.5 pl-4 font-semibold text-royal-700">{r.id}</td>
                  <td className="px-3 py-2.5"><span className="flex items-center gap-2"><PersonAvatar name={r.clientName} size={26} /><span className="font-medium text-slate-800">{r.clientName}</span></span></td>
                  <td className="px-3 py-2.5 text-royal-700">{r.bookingId ? `#${r.bookingId}` : <span className="text-slate-400">No booking</span>}</td>
                  <td className="px-3 py-2.5 text-slate-700">{r.serviceName}</td>
                  <td className="px-3 py-2.5"><Stars value={r.rating} /></td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{fmtDate(r.submittedAt)}</td>
                  <td className="px-3 py-2.5">
                    <Pill tone={pill.tone} dot>{pill.label}</Pill>
                    {r.hiddenReason && <span className="mt-0.5 block text-[10.5px] text-slate-500">Reason: {r.hiddenReason}</span>}
                  </td>
                  <td className="px-3 py-2.5">{r.reported ? <Pill tone="amber" dot>Reported</Pill> : <span className="text-slate-500">No</span>}</td>
                  <td className="px-3 py-2.5">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onSelect(r.id) }} className="inline-flex items-center gap-0.5 rounded-lg border border-royal-300 px-2.5 py-1 text-[11.5px] font-semibold text-royal-700 hover:bg-royal-50">
                      {r.reported ? 'Review' : 'View'} <ChevronRight className="size-3" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[12px] text-slate-600">
        <span>Showing {from}–{to} of {total} reviews</span>
        <div className="flex items-center gap-1">
          <button type="button" disabled={page <= 1} onClick={() => setFilter({ page: page - 1 })} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="size-4" /></button>
          {pages(page, totalPages).map((p, i) => p === '…'
            ? <span key={`e${i}`} className="px-1.5">…</span>
            : <button key={p} type="button" onClick={() => setFilter({ page: p })} className={cn('min-w-8 rounded-lg px-2 py-1 font-semibold', p === page ? 'bg-royal-700 text-white' : 'border border-slate-200 hover:bg-royal-50')}>{p}</button>)}
          <button type="button" disabled={page >= totalPages} onClick={() => setFilter({ page: page + 1 })} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40" aria-label="Next page"><ChevronRight className="size-4" /></button>
        </div>
        <label className="flex items-center gap-2">Rows per page
          <select value={pageSize} onChange={(e) => setFilter({ pageSize: Number(e.target.value), page: 1 })} className="h-8 rounded-lg border border-slate-200 px-2">
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
    </section>
  )
}
