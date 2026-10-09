import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import {
  BOOKING_TABS,
  DATE_OPTIONS,
  ESCROW_OPTIONS,
  PAYMENT_OPTIONS,
  PROVIDER_TYPE_OPTIONS,
  SORT_OPTIONS,
  SOURCE_OPTIONS,
} from '../../../constants/clientBookings'
import { cn } from '../../../lib/utils'

const FIELD = 'h-[38px] rounded-lg border border-[#d9d3ee] bg-white text-[12.5px] font-medium text-[#1b1140] transition hover:border-[#b9a9f0]'

function usePopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return { open, setOpen, ref }
}

function FilterSelect({ icon: Icon, label, value, options, onChange }) {
  const { open, setOpen, ref } = usePopover()
  const selected = options.find((o) => o.value === value && o.value !== '')
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(FIELD, 'inline-flex items-center gap-2 px-3 whitespace-nowrap', selected && 'border-[#7a5cf0] bg-[#f3efff] text-[#3b1fd6]')}
      >
        {Icon && <Icon className="size-4 text-[#4527c8]" aria-hidden="true" />}
        {selected ? selected.label : label}
        <ChevronDown className={cn('size-4 text-[#4527c8] transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <ul role="listbox" className="absolute left-0 z-30 mt-1.5 min-w-[200px] rounded-xl border border-[#e6e1f3] bg-white p-1.5 shadow-xl">
          {options.map((o) => (
            <li key={o.value || 'all'}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[12.5px] text-[#2a1b57] transition hover:bg-[#f4f1fc]"
              >
                {o.label}
                {o.value === value && <Check className="size-4 text-[#4527c8]" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MoreFilters({ params, canSeeFinancial, onChange, onClear }) {
  const { open, setOpen, ref } = usePopover()
  const active = [params.esc, params.neg, params.guest, params.sort !== 'newest' && params.sort].filter(Boolean).length
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(FIELD, 'inline-flex items-center gap-2 border-[#8b6cf0] px-4 font-semibold text-[#3b1fd6]', active && 'bg-[#f3efff]')}
      >
        <SlidersHorizontal className="size-4 text-[#4527c8]" aria-hidden="true" />
        More Filters
        {active > 0 && <span className="flex size-[18px] items-center justify-center rounded-full bg-[#4527c8] text-[10px] font-bold text-white">{active}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="More filters" className="absolute right-0 z-30 mt-1.5 w-[270px] space-y-3 rounded-xl border border-[#e6e1f3] bg-white p-3.5 shadow-xl">
          {canSeeFinancial && (
            <label className="block text-[12px] font-semibold text-[#2a1b57]">
              Escrow status
              <select value={params.esc} onChange={(e) => onChange({ esc: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-[#d9d3ee] bg-white px-2.5 text-[12.5px] font-medium focus:border-[#7a5cf0] focus:outline-none">
                {ESCROW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          )}
          <label className="block text-[12px] font-semibold text-[#2a1b57]">
            Sort by
            <select value={params.sort} onChange={(e) => onChange({ sort: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-[#d9d3ee] bg-white px-2.5 text-[12.5px] font-medium focus:border-[#7a5cf0] focus:outline-none">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[#2a1b57]">
            <input type="checkbox" checked={Boolean(params.neg)} onChange={(e) => onChange({ neg: e.target.checked ? '1' : '' })} className="size-4 accent-[#4527c8]" />
            Negotiated bookings only
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[#2a1b57]">
            <input type="checkbox" checked={Boolean(params.guest)} onChange={(e) => onChange({ guest: e.target.checked ? '1' : '' })} className="size-4 accent-[#4527c8]" />
            Guest-linked bookings only
          </label>
          <button type="button" onClick={onClear} className="text-[12px] font-semibold text-[#3b1fd6] hover:underline">Reset all filters</button>
        </div>
      )}
    </div>
  )
}

export default function BookingToolbar({ params, summary, canSeeFinancial, onChange, onClear, hasFilters }) {
  const [text, setText] = useState(params.q)
  // Keep the box in sync when the URL changes (back/forward, reset).
  useEffect(() => setText(params.q), [params.q])
  useEffect(() => {
    if (text === params.q) return undefined
    const t = setTimeout(() => onChange({ q: text.trim() }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const countOf = (id) => (id === 'all' ? summary.total : summary[id])

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Booking status" className="flex flex-wrap items-center gap-2">
        {BOOKING_TABS.map((t) => {
          const on = params.status === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange({ status: t.id })}
              className={cn(
                'h-[36px] rounded-lg border px-4 text-[12.5px] font-medium whitespace-nowrap transition',
                on ? 'border-[#4125d0] bg-[#4125d0] text-white shadow-sm' : 'border-[#ddd7ee] bg-[#f4f1fc] text-[#1b1140] hover:bg-[#ece6ff]',
              )}
            >
              {t.label} ({countOf(t.id)})
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#4527c8]" aria-hidden="true" />
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search booking ID, provider or service…"
            aria-label="Search bookings"
            className="h-[38px] w-full rounded-lg border border-[#d9d3ee] bg-[#f4f1fc] pr-8 pl-9 text-[12.5px] text-[#1b1140] placeholder:text-[#5b4a99] focus:border-[#7a5cf0] focus:bg-white focus:outline-none"
          />
          {text && (
            <button type="button" onClick={() => setText('')} aria-label="Clear search" className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-[#6b6785] hover:text-[#1b1140]">
              <X className="size-3.5" />
            </button>
          )}
        </label>
        <FilterSelect icon={CalendarDays} label="Date" value={params.date} options={DATE_OPTIONS} onChange={(v) => onChange({ date: v })} />
        <FilterSelect label="Provider Type" value={params.ptype} options={PROVIDER_TYPE_OPTIONS} onChange={(v) => onChange({ ptype: v })} />
        <FilterSelect label="Booking Source" value={params.src} options={SOURCE_OPTIONS} onChange={(v) => onChange({ src: v })} />
        {canSeeFinancial && <FilterSelect label="Payment Status" value={params.pay} options={PAYMENT_OPTIONS} onChange={(v) => onChange({ pay: v })} />}
        <MoreFilters params={params} canSeeFinancial={canSeeFinancial} onChange={onChange} onClear={onClear} />
        {hasFilters && (
          <button type="button" onClick={onClear} className="px-1 text-[12px] font-semibold text-[#3b1fd6] hover:underline">Clear</button>
        )}
      </div>
    </div>
  )
}
