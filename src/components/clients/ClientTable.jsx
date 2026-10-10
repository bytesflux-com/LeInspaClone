import { ArrowRight, Check, Copy, CreditCard, Eye, Minus, SearchX } from 'lucide-react'
import PersonAvatar from '../ui/PersonAvatar'
import CountryFlag from '../ui/CountryFlag'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import Skeleton from '../ui/Skeleton'
import { MembershipBadge, StatusBadge } from './ClientBadges'
import RowActionsMenu from './RowActionsMenu'
import { formatDate } from '../../lib/format'
import { cn } from '../../lib/utils'

export function SelectBox({ state, onChange, label }) {
  // state: 'checked' | 'mixed' | 'unchecked'
  const on = state !== 'unchecked'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === 'mixed' ? 'mixed' : state === 'checked'}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={cn(
        'flex size-[18px] items-center justify-center rounded-[5px] border transition',
        on ? 'border-[#4527c8] bg-[#4527c8] text-white' : 'border-[#c9c2de] bg-white hover:border-[#8f7bdc]',
      )}
    >
      {state === 'checked' && <Check className="size-3.5" strokeWidth={3} />}
      {state === 'mixed' && <Minus className="size-3.5" strokeWidth={3} />}
    </button>
  )
}

const TH = 'px-2 py-2.5 text-left text-[12px] font-semibold text-[#25164f]'

function SkeletonRows({ count }) {
  return Array.from({ length: count }, (_, i) => (
    <tr key={i} className="h-[52px] border-b border-[#efecf7]">
      <td className="pl-3"><Skeleton className="size-[18px] rounded-md" /></td>
      <td className="px-3"><div className="flex items-center gap-2.5"><Skeleton className="size-9 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-16" /></div></div></td>
      <td className="px-3"><div className="space-y-1.5"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-24" /></div></td>
      <td className="px-3"><Skeleton className="h-3 w-20" /></td>
      <td className="px-3"><Skeleton className="h-7 w-24" /></td>
      <td className="px-3"><Skeleton className="h-7 w-24" /></td>
      <td className="px-3"><Skeleton className="h-3 w-6" /></td>
      <td className="px-3"><Skeleton className="h-3 w-20" /></td>
      <td className="px-3"><Skeleton className="h-9 w-32" /></td>
    </tr>
  ))
}

export default function ClientTable({
  items,
  loading,
  pageSize,
  selected,
  activeId,
  onToggle,
  onTogglePage,
  onPreview,
  onOpenProfile,
  onOpenSection,
  onCopyId,
  onClearFilters,
  onSearchAllMarkets,
  hasActiveFilters,
}) {
  const initial = loading && !items
  const selectedOnPage = items ? items.filter((c) => selected.has(c.id)).length : 0
  const headState = items?.length && selectedOnPage === items.length ? 'checked' : 'unchecked'

  if (!initial && items && items.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No Clients Found"
        description="We couldn’t find a client matching your search or filters."
        className="py-16"
        action={
          <div className="flex flex-wrap justify-center gap-2.5">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Clear Filters
              </Button>
            )}
            {onSearchAllMarkets && (
              <Button variant="outline" size="sm" onClick={onSearchAllMarkets}>
                Search All Markets
              </Button>
            )}
          </div>
        }
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-[12px] tracking-[-0.02em] text-[#2a1b57]" aria-busy={loading}>
        <thead>
          <tr className="bg-[#f4f1fc]">
            <th className="w-10 rounded-l-xl py-2.5 pl-3">
              <SelectBox state={headState} onChange={() => onTogglePage(items || [])} label="Select all clients on this page" />
            </th>
            <th className={TH}>Client</th>
            <th className={TH}>Contact</th>
            <th className={TH}>Location</th>
            <th className={TH}>Membership</th>
            <th className={TH}>Status</th>
            <th className={TH}>Bookings</th>
            <th className={TH}>Joined</th>
            <th className={cn(TH, 'rounded-r-xl')}>Action</th>
          </tr>
        </thead>
        <tbody className={cn('transition-opacity', loading && !initial && 'opacity-60')}>
          {initial ? (
            <SkeletonRows count={pageSize} />
          ) : (
            items.map((c) => {
              const isSelected = selected.has(c.id)
              const isActive = activeId === c.id
              return (
                <tr
                  key={c.id}
                  tabIndex={0}
                  onClick={() => onPreview(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target === e.currentTarget) onPreview(c.id)
                  }}
                  className={cn(
                    'h-[50px] cursor-pointer border-b border-[#efecf7] transition-colors focus:outline-none focus-visible:bg-[#f1edff]',
                    isActive ? 'bg-[#f6f3ff]' : 'hover:bg-[#faf8ff]',
                  )}
                >
                  <td className="pl-3">
                    <SelectBox state={isSelected ? 'checked' : 'unchecked'} onChange={() => onToggle(c)} label={`Select ${c.name}`} />
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <PersonAvatar name={c.name} src={c.photoURL} gender={c.gender} size={32} />
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold leading-tight text-[#1b1140]">{c.name}</p>
                        <p className="mt-0.5 text-[11px] leading-tight text-[#6b6785]">{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2">
                    <p className="leading-tight text-[#2a1b57]">{c.email}</p>
                    <p className="mt-0.5 leading-tight text-[#2a1b57]">{c.phone}</p>
                  </td>
                  <td className="px-2">
                    <div className="flex items-start gap-1.5">
                      <CountryFlag code={c.country} className="mt-[3px] h-3 w-[18px]" />
                      <div>
                        <p className="leading-tight text-[#1b1140]">{c.countryName}</p>
                        <p className="mt-0.5 whitespace-nowrap leading-tight text-[#6b6785]">{c.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2"><MembershipBadge tier={c.membership} /></td>
                  <td className="px-2"><StatusBadge status={c.status} /></td>
                  <td className="px-2 text-[12.5px] text-[#1b1140]">{c.bookings}</td>
                  <td className="whitespace-nowrap px-2 text-[#1b1140]">{formatDate(c.joinedAt)}</td>
                  <td className="px-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenProfile(c.id)
                        }}
                        className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border-[1.5px] border-[#4527c8] bg-white px-3 text-[12px] font-semibold text-[#4527c8] transition hover:bg-[#f1edff]"
                      >
                        View Client <ArrowRight className="size-3.5" />
                      </button>
                      <RowActionsMenu
                        label={`More actions for ${c.name}`}
                        actions={[
                          { label: 'Quick Preview', icon: Eye, onSelect: () => onPreview(c.id) },
                          { label: 'View Payments', icon: CreditCard, onSelect: () => onOpenSection(c.id, 'payments') },
                          { label: 'Copy Client ID', icon: Copy, onSelect: () => onCopyId(c.id) },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
