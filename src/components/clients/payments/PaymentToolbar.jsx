import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import {
  DATE_OPTIONS,
  ESCROW_FILTER_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_SORT_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_TABS,
  PAYMENT_TYPE_OPTIONS,
} from '../../../constants/clientPayments'
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

function FilterSelect({ icon: Icon, label, value, emptyValue = '', options, onChange }) {
  const { open, setOpen, ref } = usePopover()
  const selected = options.find((o) => o.value === value && o.value !== emptyValue)
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
            <li key={o.value || 'any'}>
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

function MoreFilters({ params, onChange, onClear }) {
  const { open, setOpen, ref } = usePopover()
  const active = [params.esc, params.refund, params.sort !== 'newest' && params.sort].filter(Boolean).length
  const select = 'mt-1 h-9 w-full rounded-lg border border-[#d9d3ee] bg-white px-2.5 text-[12.5px] font-medium focus:border-[#7a5cf0] focus:outline-none'
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
          <label className="block text-[12px] font-semibold text-[#2a1b57]">
            Escrow / settlement state
            <select value={params.esc} onChange={(e) => onChange({ esc: e.target.value })} className={select}>
              {ESCROW_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="block text-[12px] font-semibold text-[#2a1b57]">
            Sort by
            <select value={params.sort} onChange={(e) => onChange({ sort: e.target.value })} className={select}>
              {PAYMENT_SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[#2a1b57]">
            <input type="checkbox" checked={Boolean(params.refund)} onChange={(e) => onChange({ refund: e.target.checked ? '1' : '' })} className="size-4 accent-[#4527c8]" />
            Payments with a refund only
          </label>
          <button type="button" onClick={onClear} className="text-[12px] font-semibold text-[#3b1fd6] hover:underline">Reset all filters</button>
        </div>
      )}
    </div>
  )
}

export default function PaymentToolbar({ params, summary, onChange, onClear, hasFilters }) {
  const [text, setText] = useState(params.q)
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
      <div role="tablist" aria-label="Payment status" className="flex flex-wrap items-center gap-2">
        {PAYMENT_TABS.map((t) => {
          const on = params.status === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange({ status: t.id })}
              className={cn(
                'h-[38px] min-w-[86px] rounded-lg border px-4 text-[12.5px] font-medium whitespace-nowrap transition',
                on ? 'border-[#4125d0] bg-[#4125d0] text-white shadow-sm' : 'border-[#ddd7ee] bg-[#f4f1fc] text-[#1b1140] hover:bg-[#ece6ff]',
              )}
            >
              {t.label} ({countOf(t.id)})
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[230px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#4527c8]" aria-hidden="true" />
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search transaction ID, booking ID or reference…"
            aria-label="Search payments"
            className="h-[38px] w-full rounded-lg border border-[#d9d3ee] bg-[#f4f1fc] pr-8 pl-9 text-[12.5px] text-[#1b1140] placeholder:text-[#5b4a99] focus:border-[#7a5cf0] focus:bg-white focus:outline-none"
          />
          {text && (
            <button type="button" onClick={() => setText('')} aria-label="Clear search" className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-[#6b6785] hover:text-[#1b1140]">
              <X className="size-3.5" />
            </button>
          )}
        </label>
        <FilterSelect icon={CalendarDays} label="Date" value={params.date} options={DATE_OPTIONS} onChange={(v) => onChange({ date: v })} />
        <FilterSelect label="Payment Type" value={params.ptype} options={PAYMENT_TYPE_OPTIONS} onChange={(v) => onChange({ ptype: v })} />
        <FilterSelect label="Payment Method" value={params.method} options={PAYMENT_METHOD_OPTIONS} onChange={(v) => onChange({ method: v })} />
        <FilterSelect label="Status" value={params.status} emptyValue="all" options={PAYMENT_STATUS_OPTIONS} onChange={(v) => onChange({ status: v })} />
        <MoreFilters params={params} onChange={onChange} onClear={onClear} />
        {hasFilters && <button type="button" onClick={onClear} className="px-1 text-[12px] font-semibold text-[#3b1fd6] hover:underline">Clear</button>}
      </div>
    </div>
  )
}
