import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown, Search, SlidersHorizontal, Users, X } from 'lucide-react'
import EmptyState from '../../ui/EmptyState'
import PersonAvatar from '../../ui/PersonAvatar'
import CountryFlag from '../../ui/CountryFlag'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { Amount, Pagination, StatusPill, ViewButton } from './LoyaltyBadges'
import { DATE_OPTIONS, REFERRAL_SORT_OPTIONS, REFERRAL_STATUS_STYLE, REFERRAL_TABS } from '../../../constants/clientLoyalty'
import { formatDay } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const FIELD = 'h-[34px] rounded-lg border border-[#d9d3ee] bg-white text-[12.5px] font-medium text-[#1b1140] transition hover:border-[#b9a9f0]'

const COLS = [
  { id: 'client', label: 'Referred Client', w: 'minmax(150px,1.6fr)' },
  { id: 'joined', label: 'Joined', w: 'minmax(88px,0.95fr)' },
  { id: 'market', label: 'Market', w: 'minmax(78px,0.85fr)' },
  { id: 'progress', label: 'Progress', w: 'minmax(138px,1.5fr)' },
  { id: 'reward', label: 'Reward', w: 'minmax(62px,0.7fr)' },
  { id: 'status', label: 'Status', w: 'minmax(86px,0.9fr)' },
  { id: 'action', label: 'Action', w: 'minmax(76px,0.8fr)' },
]
const TEMPLATE = COLS.map((c) => c.w).join(' ')

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

function DateFilter({ value, onChange }) {
  const { open, setOpen, ref } = usePopover()
  const selected = DATE_OPTIONS.find((o) => o.value === value && o.value !== '')
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(FIELD, 'inline-flex min-w-[104px] items-center justify-between gap-2 px-3 whitespace-nowrap', selected && 'border-[#7a5cf0] bg-[#f3efff] text-[#3b1fd6]')}
      >
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="size-[17px] fill-[#4527c8]/85 text-[#4527c8]" aria-hidden="true" />
          {selected ? selected.label : 'Date'}
        </span>
        <ChevronDown className={cn('size-4 text-[#4527c8] transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 z-30 mt-1.5 min-w-[180px] rounded-xl border border-[#e6e1f3] bg-white p-1.5 shadow-xl">
          {DATE_OPTIONS.map((o) => (
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
  const active = [params.sort !== 'newest' && params.sort, params.rewarded].filter(Boolean).length
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(FIELD, 'inline-flex items-center gap-2 border-[#8b6cf0] px-3.5 font-semibold text-[#3b1fd6]', active > 0 && 'bg-[#f3efff]')}
      >
        <SlidersHorizontal className="size-[17px] text-[#4527c8]" aria-hidden="true" />
        More Filters
        {active > 0 && <span className="flex size-[18px] items-center justify-center rounded-full bg-[#4527c8] text-[10px] font-bold text-white">{active}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="More filters" className="absolute right-0 z-30 mt-1.5 w-[250px] space-y-3 rounded-xl border border-[#e6e1f3] bg-white p-3.5 shadow-xl">
          <label className="block text-[12px] font-semibold text-[#2a1b57]">
            Sort by
            <select value={params.sort} onChange={(e) => onChange({ sort: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-[#d9d3ee] bg-white px-2.5 text-[12.5px] font-medium focus:border-[#7a5cf0] focus:outline-none">
              {REFERRAL_SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[#2a1b57]">
            <input type="checkbox" checked={Boolean(params.rewarded)} onChange={(e) => onChange({ rewarded: e.target.checked ? '1' : '' })} className="size-4 accent-[#4527c8]" />
            With a reward only
          </label>
          <button type="button" onClick={onClear} className="text-[12px] font-semibold text-[#3b1fd6] hover:underline">Reset all filters</button>
        </div>
      )}
    </div>
  )
}

function Row({ item, currency, timeZone, canSeeFinancial, selected, onOpen }) {
  return (
    <li
      role="row"
      aria-selected={selected}
      tabIndex={0}
      onClick={() => onOpen(item.id)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onOpen(item.id)
        }
      }}
      style={{ gridTemplateColumns: TEMPLATE }}
      className={cn(
        'grid cursor-pointer items-center gap-x-2.5 border-b border-[#efecf7] px-2 py-[6px] transition outline-none last:border-b-0 focus-visible:ring-2 focus-visible:ring-[#7a5cf0]',
        selected ? 'bg-[#f8f6ff]' : 'hover:bg-[#faf9fe]',
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <PersonAvatar name={item.client.name} src={item.client.photoURL} gender={item.client.gender} size={26} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[12px] font-bold text-[#1b1140]">{item.client.name}</p>
          <p className="truncate text-[10.5px] text-[#2a1b57]">{item.client.id}</p>
        </div>
      </div>
      <p className="text-[12px] text-[#1b1140]">{formatDay(item.joinedAt, timeZone, { year: true })}</p>
      <p className="flex items-center gap-1.5 text-[12px] text-[#1b1140]">
        <CountryFlag code={item.country} className="h-3 w-[18px]" />
        {item.countryName}
      </p>
      <p className="min-w-0 truncate text-[12px] text-[#1b1140]">{item.progress}</p>
      <p className="text-[12px] font-semibold text-[#1b1140]">
        <Amount value={item.rewardAmount} currency={currency} show={canSeeFinancial || item.rewardAmount == null} />
      </p>
      <div><StatusPill style={REFERRAL_STATUS_STYLE[item.status]} /></div>
      <div>
        <ViewButton
          ariaLabel={`View referral of ${item.client.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onOpen(item.id)
          }}
        />
      </div>
    </li>
  )
}

// Referral Activity — every row is one referral relationship with its resolved status
// (Rewarded / Pending / Ineligible). Selecting a row opens the referral drawer.
export default function ReferralActivity({ data, error, loading, fetching, params, selectedId, canSeeFinancial, hasFilters, onChange, onClear, onOpen, onPage, onPageSize, onRetry }) {
  const [text, setText] = useState(params.q)
  useEffect(() => setText(params.q), [params.q])
  useEffect(() => {
    if (text === params.q) return undefined
    const t = setTimeout(() => onChange({ q: text.trim() }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const counts = data?.counts || { all: 0, successful: 0, pending: 0, ineligible: 0 }

  return (
    <section aria-label="Referral activity" className={cn(PROFILE_CARD, 'p-3')}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="text-[17px] leading-tight font-bold tracking-tight whitespace-nowrap text-[#1b1140]">Referral Activity ({counts.all})</h2>
        <div role="tablist" aria-label="Referral status" className="flex flex-wrap items-center gap-2">
          {REFERRAL_TABS.map((t) => {
            const on = params.tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onChange({ tab: t.id })}
                className={cn(
                  'h-[30px] min-w-[74px] rounded-md border px-3.5 text-[12.5px] font-medium whitespace-nowrap transition',
                  on ? 'border-[#4125d0] bg-[#4125d0] text-white shadow-sm' : 'border-[#ddd7ee] bg-[#f4f1fc] text-[#1b1140] hover:bg-[#ece6ff]',
                )}
              >
                {t.label} ({counts[t.id]})
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-[17px] -translate-y-1/2 text-[#1b1140]" aria-hidden="true" />
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search referred client name, ID or email…"
            aria-label="Search referred clients"
            className="h-[34px] w-full rounded-lg border border-[#d9d3ee] bg-[#f4f1fc] pr-8 pl-9 text-[12.5px] text-[#1b1140] placeholder:text-[#4a4466] focus:border-[#7a5cf0] focus:bg-white focus:outline-none"
          />
          {text && (
            <button type="button" onClick={() => setText('')} aria-label="Clear search" className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-[#6b6785] hover:text-[#1b1140]">
              <X className="size-3.5" />
            </button>
          )}
        </label>
        <DateFilter value={params.date} onChange={(v) => onChange({ date: v })} />
        <MoreFilters params={params} onChange={onChange} onClear={onClear} />
        {hasFilters && <button type="button" onClick={onClear} className="px-1 text-[12px] font-semibold text-[#3b1fd6] hover:underline">Clear</button>}
      </div>

      {error && (
        <p role="alert" className="mt-2.5 rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">
          {error} <button type="button" onClick={onRetry} className="font-semibold underline">Retry</button>
        </p>
      )}

      <div className="mt-2.5">
        <div className={cn('overflow-x-auto transition-opacity', fetching && 'opacity-60')} aria-busy={fetching}>
          <div className="min-w-[640px]" role="table" aria-label="Referred clients">
            <div role="row" style={{ gridTemplateColumns: TEMPLATE }} className="grid items-center gap-x-2.5 border-y border-[#e6e1f3] bg-[#f7f5fd] px-2 py-2 text-[12px] font-semibold text-[#1b1140]">
              {COLS.map((c) => <span key={c.id} role="columnheader">{c.label}</span>)}
            </div>

            {loading || !data ? (
              <div className="space-y-2 p-2" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-[34px] animate-pulse rounded-lg bg-gray-200/60" />)}
              </div>
            ) : data.items.length === 0 ? (
              <EmptyState
                icon={Users}
                title={hasFilters ? 'No referrals match these filters' : 'No referrals yet'}
                description={hasFilters ? 'Try a different status tab, date range or search term.' : 'Nobody has used this client’s referral code yet.'}
                action={hasFilters && <button type="button" onClick={onClear} className="h-9 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-4 text-[13px] font-semibold text-[#3b1fd6] hover:bg-[#f4f1fc]">Clear filters</button>}
              />
            ) : (
              <ul role="rowgroup">
                {data.items.map((item) => (
                  <Row key={item.id} item={item} currency={data.currency} timeZone={data.timeZone} canSeeFinancial={canSeeFinancial} selected={item.id === selectedId} onOpen={onOpen} />
                ))}
              </ul>
            )}
          </div>
        </div>

        {data && data.total > 0 && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} totalPages={data.totalPages} noun="referrals" onPage={onPage} onPageSize={onPageSize} />}
      </div>
    </section>
  )
}
