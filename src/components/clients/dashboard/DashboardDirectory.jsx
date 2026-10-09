import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Download, Search, SearchX, SlidersHorizontal, UserRound, X } from 'lucide-react'
import { clientService } from '../../../services/clientService'
import PersonAvatar from '../../ui/PersonAvatar'
import CountryFlag from '../../ui/CountryFlag'
import Skeleton from '../../ui/Skeleton'
import ErrorState from '../../ui/ErrorState'
import { MembershipBadge, StatusBadge } from '../ClientBadges'
import { SelectBox } from '../ClientTable'
import { FilterSelect } from '../ClientFilterBar'
import ClientPagination from '../ClientPagination'
import { DashCard } from './DashCard'
import { MARKETS } from '../../../constants/markets'
import {
  BOOKING_ACTIVITY_OPTIONS,
  CLIENT_STATUS_TABS,
  DATE_JOINED_OPTIONS,
  MEMBERSHIP_OPTIONS,
} from '../../../constants/clients'
import { formatDate, formatNumber } from '../../../lib/format'
import { cn } from '../../../lib/utils'

export const DIRECTORY_PAGE_SIZE = 5

const EMPTY_FILTERS = {
  q: '', status: 'all', membership: '', country: '', city: '', region: '', activity: '', joined: '', from: '', to: '',
  reg: '', guest: '', bmin: '', bmax: '', lastb: '', lasta: '', issues: [], sort: 'newest', page: 1,
}

const SEGMENT_PARAMS = {
  standard: { membership: 'standard' },
  premium: { membership: 'premium' },
  executive: { membership: 'executive' },
  guest: { guest: 'yes' },
  suspended: { status: 'suspended' },
  inactive: { status: 'inactive' },
}
export const SEGMENT_LABELS = {
  all: 'All Clients', standard: 'Standard Clients', premium: 'Premium Clients', executive: 'Executive Clients',
  guest: 'Guest Converted Clients', suspended: 'Suspended Clients', inactive: 'Inactive Clients',
}

const ISSUE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'dispute', label: 'Open dispute' },
  { value: 'ticket', label: 'Open support ticket' },
  { value: 'payment', label: 'Payment issue' },
]

// Directory state for ADM-010. Filtering/sorting/pagination run server-side.
export function useDirectoryState({ market, segment }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [searchText, setSearchText] = useState('')
  const [state, setState] = useState({ key: null, data: null, error: null })
  const [nonce, setNonce] = useState(0)

  const update = (patch, { resetPage = true } = {}) =>
    setFilters((f) => ({ ...f, ...patch, ...(resetPage && !('page' in patch) ? { page: 1 } : {}) }))
  const reset = () => {
    setFilters(EMPTY_FILTERS)
    setSearchText('')
  }

  useEffect(() => {
    if (searchText.trim() === filters.q) return undefined
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: searchText.trim(), page: 1 })), 300)
    return () => clearTimeout(t)
  }, [searchText, filters.q])

  // Market change clears location filters.
  useEffect(() => {
    setFilters((f) => ({ ...f, country: '', city: '', region: '', page: 1 }))
  }, [market])

  const params = useMemo(
    () => ({ ...filters, ...(SEGMENT_PARAMS[segment] || {}), market, pageSize: DIRECTORY_PAGE_SIZE }),
    [filters, segment, market],
  )
  const key = JSON.stringify(params) + nonce

  useEffect(() => {
    let cancelled = false
    clientService
      .listClients(JSON.parse(JSON.stringify(params)))
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((err) => !cancelled && setState({ key, data: null, error: err?.message || 'Unable to load clients' }))
    return () => {
      cancelled = true
    }
  }, [params, key])

  return {
    filters, update, reset, searchText, setSearchText, params,
    data: state.data,
    loading: state.key !== key,
    error: state.key === key ? state.error : null,
    refetch: () => setNonce((n) => n + 1),
    hasActiveFilters: Boolean(filters.q || filters.membership || filters.city || filters.country || filters.activity || filters.joined || filters.status !== 'all' || filters.issues.length || filters.guest),
  }
}

const TH = 'px-[7px] py-1.5 text-left text-[11.5px] font-semibold whitespace-nowrap text-[#25164f]'

export default function DashboardDirectory({
  dir, market, segment, onClearSegment, selectedId, onSelect, onOpenProfile, onOpenFilters,
  selected, onToggle, onTogglePage, onExportSelected, onClearSelection, canSeeFinancial,
}) {
  const { filters, update, data, loading } = dir
  const scoped = !market.isGlobal
  const items = data?.items || null
  const selectedOnPage = items ? items.filter((c) => selected.has(c.id)).length : 0
  const headState = items?.length && selectedOnPage === items.length ? 'checked' : 'unchecked'

  const countryOptions = useMemo(
    () => [{ value: '', label: 'All Countries' }, ...MARKETS.filter((m) => !m.isGlobal).map((m) => ({ value: m.id, label: m.name }))],
    [],
  )
  const cityOptions = useMemo(
    () => [{ value: '', label: 'All Cities' }, ...clientService.getCities(scoped ? market.id : filters.country || 'ALL').map((c) => ({ value: c.city, label: c.city }))],
    [scoped, market.id, filters.country],
  )
  const statusOptions = CLIENT_STATUS_TABS.map((t) => ({ value: t.id, label: t.id === 'all' ? 'All Statuses' : t.label }))

  const scopeLabel = [scoped ? market.name : null, segment !== 'all' ? SEGMENT_LABELS[segment] : null].filter(Boolean).join(' • ')

  return (
    <DashCard
      className="!p-2.5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-[14px] font-bold tracking-tight text-[#1b1140]"><UserRound className="size-5 fill-[#5b2fd0] text-[#5b2fd0]" aria-hidden="true" /> Clients</h2>
        <div className="relative w-full max-w-[320px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#3b2a82]" aria-hidden="true" />
          <input
            type="search"
            value={dir.searchText}
            onChange={(e) => dir.setSearchText(e.target.value)}
            placeholder="Search by name, email, phone, client ID…"
            aria-label="Search clients by name, email, phone or client ID"
            className="h-[32px] w-full rounded-lg border border-[#ddd7ee] bg-[#faf9fd] pr-8 pl-9 text-[12px] text-[#1b1140] placeholder:text-[#4a4466] focus:border-[#7a5cf0] focus:bg-white focus:ring-3 focus:ring-[#7a5cf0]/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {dir.searchText && (
            <button type="button" onClick={() => dir.setSearchText('')} aria-label="Clear search" className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-[#6b6785] hover:text-[#1b1140]">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        {scopeLabel && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1edff] px-3 py-1 text-[12px] font-semibold text-[#4527c8]">
            {scopeLabel}
            {segment !== 'all' && (
              <button type="button" onClick={onClearSegment} aria-label="Clear segment" className="rounded-full hover:bg-white/60">
                <X className="size-3.5" />
              </button>
            )}
          </span>
        )}
        <button
          type="button"
          onClick={onOpenFilters}
          className="ml-auto inline-flex h-[32px] items-center gap-2 rounded-lg border border-[#cfc5ee] bg-white px-3.5 text-[12px] font-semibold text-[#2a1b57] transition hover:bg-[#f4f1fc]"
        >
          <SlidersHorizontal className="size-4 text-[#4527c8]" /> Filters
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <FilterSelect label="Membership" value={filters.membership} options={MEMBERSHIP_OPTIONS} onChange={(v) => { onClearSegment(); update({ membership: v }) }} />
        <FilterSelect label="Account Status" value={filters.status} options={statusOptions} onChange={(v) => { onClearSegment(); update({ status: v }) }} />
        <FilterSelect label="Country" value={scoped ? market.id : filters.country} options={countryOptions} disabled={scoped} onChange={(v) => update({ country: v, city: '', region: '' })} />
        <FilterSelect label="City / Region" value={filters.city} options={cityOptions} onChange={(v) => update({ city: v })} />
        <FilterSelect label="Booking Activity" value={filters.activity} options={BOOKING_ACTIVITY_OPTIONS} onChange={(v) => update({ activity: v })} width="w-60" />
        <FilterSelect label="Date Joined" value={filters.joined} options={DATE_JOINED_OPTIONS} onChange={(v) => update({ joined: v, from: '', to: '' })} />
        <FilterSelect label="Has Open Issue" value={filters.issues[0] || ''} options={ISSUE_OPTIONS} onChange={(v) => update({ issues: v ? [v] : [] })} />
      </div>

      <div className="mt-2 overflow-x-auto">
        {dir.error && !data ? (
          <ErrorState title="Unable to load clients" description={dir.error} onRetry={dir.refetch} />
        ) : items && items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#f4f1fc] text-[#6b6785]"><SearchX className="size-5" /></span>
            <p className="text-[14px] font-semibold text-[#1b1140]">No Clients Found</p>
            <p className="text-[12px] text-[#4a4466]">We couldn’t find a client matching your search or filters.</p>
            {dir.hasActiveFilters && (
              <button type="button" onClick={() => { onClearSegment(); dir.reset() }} className="mt-1 rounded-lg border border-[#4527c8] px-3 py-1.5 text-[12px] font-semibold text-[#4527c8] hover:bg-[#f1edff]">Clear Filters</button>
            )}
          </div>
        ) : (
          <table className="w-full min-w-[820px] border-collapse text-[11.5px] tracking-[-0.02em] text-[#2a1b57]" aria-busy={loading}>
            <thead>
              <tr className="bg-[#f4f1fc]">
                <th className="w-10 rounded-l-xl py-1.5 pl-3"><SelectBox state={headState} onChange={() => onTogglePage(items || [])} label="Select all clients on this page" /></th>
                <th className={TH}>Client</th>
                <th className={TH}>Contact</th>
                <th className={TH}>Location</th>
                <th className={TH}>Membership</th>
                <th className={TH}>Status</th>
                <th className={TH}>Bookings</th>
                {canSeeFinancial && <th className={TH}>Lifetime Value</th>}
                <th className={TH}>Joined</th>
                <th className={cn(TH, 'rounded-r-xl')}>Action</th>
              </tr>
            </thead>
            <tbody className={cn('transition-opacity', loading && items && 'opacity-60')}>
              {!items
                ? Array.from({ length: DIRECTORY_PAGE_SIZE }, (_, i) => (
                    <tr key={i} className="h-[42px] border-b border-[#efecf7]">
                      <td colSpan={canSeeFinancial ? 10 : 9} className="px-3"><Skeleton className="h-7 w-full" /></td>
                    </tr>
                  ))
                : items.map((c) => (
                    <tr
                      key={c.id}
                      tabIndex={0}
                      onClick={() => onSelect(c.id)}
                      onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && onSelect(c.id)}
                      className={cn('h-[37px] cursor-pointer border-b border-[#efecf7] transition-colors focus:outline-none focus-visible:bg-[#f1edff]', selectedId === c.id ? 'bg-[#f6f3ff]' : 'hover:bg-[#faf8ff]')}
                    >
                      <td className="pl-3"><SelectBox state={selected.has(c.id) ? 'checked' : 'unchecked'} onChange={() => onToggle(c)} label={`Select ${c.name}`} /></td>
                      <td className="px-[7px] py-0.5">
                        <div className="flex items-center gap-2">
                          <PersonAvatar name={c.name} src={c.photoURL} gender={c.gender} size={28} />
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-semibold leading-tight text-[#1b1140]">{c.name}</p>
                            <p className="text-[11px] leading-tight text-[#6b6785]">{c.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-[7px]"><p className="leading-tight">{c.email}</p><p className="leading-tight">{c.phone}</p></td>
                      <td className="px-[7px]">
                        <div className="flex items-start gap-1.5">
                          <CountryFlag code={c.country} className="mt-[3px] h-3 w-[18px]" />
                          <div><p className="leading-tight text-[#1b1140]">{c.countryName}</p><p className="leading-tight whitespace-nowrap text-[#6b6785]">{c.city}</p></div>
                        </div>
                      </td>
                      <td className="px-[7px]"><MembershipBadge tier={c.membership} /></td>
                      <td className="px-[7px]"><StatusBadge status={c.status} /></td>
                      <td className="px-[7px] text-[12.5px] text-[#1b1140]">{c.bookings}</td>
                      {canSeeFinancial && <td className="px-[7px] whitespace-nowrap text-[#1b1140]">{c.currency} {formatNumber(c.lifetimeValue)}</td>}
                      <td className="px-[7px] whitespace-nowrap text-[#1b1140]">{formatDate(c.joinedAt)}</td>
                      <td className="px-[7px]">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onOpenProfile(c.id) }}
                          className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-lg border-[1.5px] border-[#4527c8] bg-white px-2.5 text-[12px] font-semibold text-[#4527c8] transition hover:bg-[#f1edff]"
                        >
                          View Client <ArrowRight className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        )}
      </div>

      {selected.size > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl bg-[#f1edff] px-3 py-2 text-[12px] font-semibold text-[#2a1b57]">
          {selected.size} selected
          <button type="button" onClick={onExportSelected} className="inline-flex items-center gap-1.5 rounded-lg border border-[#4527c8] bg-white px-2.5 py-1 text-[#4527c8] hover:bg-[#f6f3ff]"><Download className="size-3.5" /> Export Selected</button>
          <button type="button" onClick={onClearSelection} className="ml-auto text-[#4527c8] hover:underline">Clear Selection</button>
        </div>
      )}

      {data && data.total > 0 && (
        <div className="[&>div]:!pt-2"><ClientPagination
          hidePageSize
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPage={(page) => update({ page }, { resetPage: false })}
        /></div>
      )}
    </DashCard>
  )
}
