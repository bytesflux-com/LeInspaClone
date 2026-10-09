import { useMemo } from 'react'
import { Check, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import Dropdown from '../ui/Dropdown'
import { clientService } from '../../services/clientService'
import { MARKETS } from '../../constants/markets'
import {
  BOOKING_ACTIVITY_OPTIONS,
  CLIENT_STATUS_TABS,
  DATE_JOINED_OPTIONS,
  MEMBERSHIP_OPTIONS,
} from '../../constants/clients'
import { cn } from '../../lib/utils'

function FilterSelect({ label, value, options, onChange, disabled = false, width = 'w-52' }) {
  const current = options.find((o) => o.value === value)
  const active = Boolean(value) && value !== 'all'
  return (
    <Dropdown
      align="left"
      menuWidth={width}
      trigger={({ open }) => (
        <button
          type="button"
          disabled={disabled}
          aria-label={label}
          aria-haspopup="listbox"
          className={cn(
            'flex h-[34px] items-center gap-1.5 rounded-lg border bg-white px-2.5 text-[12px] font-medium transition disabled:cursor-not-allowed disabled:bg-[#f7f6fb] disabled:text-[#6b6785]',
            open ? 'border-[#7a5cf0] ring-2 ring-[#7a5cf0]/15' : 'border-[#ddd7ee] hover:border-[#bfb3e6]',
            active ? 'text-[#4527c8]' : 'text-[#2a1b57]',
          )}
        >
          <span className="whitespace-nowrap">{active && current ? current.label : label}</span>
          <ChevronDown className={cn('size-3.5 text-[#2a1b57] transition-transform', open && 'rotate-180')} />
        </button>
      )}
    >
      <div className="max-h-72 space-y-0.5 overflow-y-auto" role="listbox">
        {options.map((o) => {
          const selected = (o.value || '') === (value || '')
          return (
            <button
              key={o.value || 'all'}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(o.value)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12.5px] font-medium transition',
                selected ? 'bg-[#f1edff] font-semibold text-[#4527c8]' : 'text-[#2a1b57] hover:bg-[#f4f1fc]',
              )}
            >
              {o.label}
              {selected && <Check className="size-4" />}
            </button>
          )
        })}
      </div>
    </Dropdown>
  )
}

export default function ClientFilterBar({
  filters,
  update,
  market,
  searchText,
  onSearchText,
  activeAdvancedCount,
  onMoreFilters,
}) {
  const scoped = !market.isGlobal
  const effectiveCountry = scoped ? market.id : filters.country

  const countryOptions = useMemo(
    () => [{ value: '', label: 'All Countries' }, ...MARKETS.filter((m) => !m.isGlobal).map((m) => ({ value: m.id, label: m.name }))],
    [],
  )
  const cityOptions = useMemo(
    () => [{ value: '', label: 'All Cities' }, ...clientService.getCities(effectiveCountry || 'ALL').map((c) => ({ value: c.city, label: c.city }))],
    [effectiveCountry],
  )
  const statusOptions = useMemo(
    () => CLIENT_STATUS_TABS.map((t) => ({ value: t.id, label: t.id === 'all' ? 'All Statuses' : t.label })),
    [],
  )

  return (
    <div className="space-y-3.5">
      <div className="relative w-full max-w-[449px]">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#3b2a82]" aria-hidden="true" />
        <input
          type="search"
          value={searchText}
          onChange={(e) => onSearchText(e.target.value)}
          placeholder="Search name, Client ID, email or phone…"
          aria-label="Search clients by name, Client ID, email or phone"
          className="h-[38px] w-full rounded-lg border border-[#ddd7ee] bg-[#faf9fd] pr-9 pl-9 text-[12.5px] text-[#1b1140] placeholder:text-[#4a4466] focus:border-[#7a5cf0] focus:bg-white focus:ring-3 focus:ring-[#7a5cf0]/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {searchText && (
          <button
            type="button"
            onClick={() => onSearchText('')}
            aria-label="Clear search"
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-[#6b6785] hover:text-[#1b1140]"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label="Membership" value={filters.membership} options={MEMBERSHIP_OPTIONS} onChange={(v) => update({ membership: v })} />
        <FilterSelect
          label="Country"
          value={scoped ? market.id : filters.country}
          options={countryOptions}
          disabled={scoped}
          onChange={(v) => update({ country: v, city: '', region: '' })}
        />
        <FilterSelect label="City / Region" value={filters.city} options={cityOptions} onChange={(v) => update({ city: v })} />
        <FilterSelect label="Booking Activity" value={filters.activity} options={BOOKING_ACTIVITY_OPTIONS} onChange={(v) => update({ activity: v })} width="w-60" />
        <FilterSelect label="Account Status" value={filters.status} options={statusOptions} onChange={(v) => update({ status: v })} />
        <FilterSelect label="Date Joined" value={filters.joined} options={DATE_JOINED_OPTIONS} onChange={(v) => update({ joined: v, from: '', to: '' })} />

        <button
          type="button"
          onClick={onMoreFilters}
          className="ml-auto inline-flex h-[36px] items-center gap-2 rounded-lg border border-[#cfc3f5] bg-[#f5f1ff] px-3.5 text-[12px] font-semibold text-[#4527c8] transition hover:bg-[#ece6ff]"
        >
          <SlidersHorizontal className="size-4" />
          More Filters
          {activeAdvancedCount > 0 && (
            <span className="flex size-[18px] items-center justify-center rounded-full bg-[#4527c8] text-[10px] font-bold text-white">
              {activeAdvancedCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
