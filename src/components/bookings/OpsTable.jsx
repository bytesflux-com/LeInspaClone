import { ArrowRight, CalendarX2, ChevronDown, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import PersonAvatar from '../ui/PersonAvatar'
import { ACCOUNT, ASSIGNMENT, CANCELLED_BY, CONFIRMATION, LIFECYCLE, OPERATIONAL, PAGE_SIZES, PAYMENT, POST_SERVICE, READINESS, REFUND, RESOLUTION, SETTLEMENT } from '../../constants/bookingOps'
import { formatStamp, formatTime, timeZoneFor } from '../../lib/profileFormat'
import { cn } from '../../lib/utils'
import { BusinessAvatar, CARD, MarketCell, StatePill, money } from './OpsUI'

const mins = (n) => (n == null ? '—' : n < 1 ? '< 1 min' : n < 60 ? `${n} min` : `${Math.floor(n / 60)} hr${n % 60 ? ` ${n % 60} min` : ''}`)
const TXT = 'text-[12px] text-[#1b1140]'

export function Person({ name, sub, business, size = 30 }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {business ? <BusinessAvatar name={name} size={size} /> : <PersonAvatar name={name} size={size} />}
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[12px] font-semibold text-[#1b1140]">{name}</p>
        {sub && <p className="truncate text-[10.5px] text-[#6b6785]">{sub}</p>}
      </div>
    </div>
  )
}

const twoLine = (top, bottom) => (
  <div className="leading-tight whitespace-nowrap">
    <p className={TXT}>{top}</p>
    {bottom && <p className="text-[11px] text-[#6b6785]">{bottom}</p>}
  </div>
)

// Column catalogue; each workspace picks its own list from VIEW_CONFIG.
const COLUMNS = {
  booking: { label: 'Booking ID', w: 'minmax(78px,0.7fr)', render: (b, tz, asOf, open) => (
    <div className="min-w-0">
      <button type="button" onClick={(e) => { e.stopPropagation(); open(b) }} className="text-[12px] font-semibold text-[#4527c8] hover:underline">{b.reference}</button>
      {b.needsAttention && b.issues.length > 0 && <p className="text-[10px] font-semibold text-[#c2570c]">{b.issues.length} issue{b.issues.length === 1 ? '' : 's'}</p>}
    </div>
  ) },
  client: { label: 'Client', w: 'minmax(118px,1.2fr)', render: (b) => <Person name={b.client.name} sub={b.client.guest ? 'Guest' : 'Registered Client'} /> },
  guest: { label: 'Guest', w: 'minmax(140px,1.25fr)', render: (b) => <Person name={b.guest?.name} sub={b.guest?.phone || b.guest?.email || 'No contact'} /> },
  provider: { label: 'Provider', w: 'minmax(124px,1.3fr)', render: (b) => <Person name={b.provider.name} sub={b.branch || b.provider.typeLabel} business={b.category !== 'individual'} /> },
  service: { label: 'Service', w: 'minmax(96px,1.1fr)', render: (b) => (
    <div className="min-w-0 leading-tight">
      <p className="truncate text-[12px] text-[#1b1140]" title={b.service}>{b.service}</p>
      <p className="text-[11px] text-[#6b6785]">{mins(b.durationMins)}</p>
    </div>
  ) },
  time: { label: 'Time', w: 'minmax(78px,0.7fr)', render: (b, tz) => (b.scheduledStart ? twoLine(formatTime(b.scheduledStart, tz), `– ${formatTime(b.scheduledEnd, tz)}`) : '—') },
  scheduled: { label: 'Scheduled', w: 'minmax(104px,0.95fr)', render: (b, tz, asOf) => (b.scheduledStart ? twoLine(...formatStamp(b.scheduledStart, asOf, tz).split(' • ')) : '—') },
  started: { label: 'Started', w: 'minmax(66px,0.55fr)', render: (b, tz) => <p className={cn(TXT, 'whitespace-nowrap')}>{b.serviceStartedAt ? formatTime(b.serviceStartedAt, tz) : '—'}</p> },
  expectedEnd: { label: 'Expected End', w: 'minmax(84px,0.7fr)', render: (b, tz) => twoLine(b.expectedEnd ? formatTime(b.expectedEnd, tz) : '—', b.overByMins != null ? <span className="font-semibold text-[#c2570c]">+{mins(b.overByMins)}</span> : null) },
  elapsed: { label: 'Elapsed', w: 'minmax(68px,0.6fr)', render: (b) => <p className={cn(TXT, 'whitespace-nowrap')}>{mins(b.elapsedMins)}</p> },
  completed: { label: 'Completed', w: 'minmax(104px,0.95fr)', render: (b, tz, asOf) => (b.completedAt ? twoLine(...formatStamp(b.completedAt, asOf, tz).split(' • ')) : '—') },
  market: { label: 'Market', w: 'minmax(76px,0.7fr)', render: (b) => <MarketCell code={b.countryCode} name={b.marketName} /> },
  amount: { label: 'Amount', w: 'minmax(80px,0.7fr)', finance: true, render: (b) => <p className="text-[12px] font-semibold whitespace-nowrap text-[#1b1140]">{money(b.amount, b.currency)}</p> },
  payment: { label: 'Payment', w: 'minmax(78px,0.65fr)', render: (b) => <StatePill map={PAYMENT} value={b.payment} /> },
  assignment: { label: 'Assignment', w: 'minmax(96px,0.85fr)', render: (b) => <StatePill map={ASSIGNMENT} value={b.assignment} /> },
  operational: { label: 'Operational Status', w: 'minmax(136px,1fr)', render: (b) => <StatePill map={OPERATIONAL} value={b.operational} /> },
  readiness: { label: 'Readiness', w: 'minmax(134px,1fr)', render: (b) => <StatePill map={READINESS} value={b.readiness} /> },
  settlement: { label: 'Settlement', w: 'minmax(128px,0.95fr)', finance: true, render: (b) => <StatePill map={SETTLEMENT} value={b.settlement} /> },
  confirmation: { label: 'Confirmation', w: 'minmax(122px,0.95fr)', render: (b) => <StatePill map={CONFIRMATION} value={b.confirmation} /> },
  postService: { label: 'Post-Service', w: 'minmax(116px,0.9fr)', render: (b) => <StatePill map={POST_SERVICE} value={b.postService} /> },
  review: { label: 'Review', w: 'minmax(60px,0.5fr)', render: (b) => (b.rating ? <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1b1140]"><Star className="size-3.5 fill-[#d9b26a] text-[#d9b26a]" aria-hidden="true" />{b.rating}</span> : <span className="text-[12px] text-[#6b6785]">None</span>) },
  cancelledBy: { label: 'Cancelled By', w: 'minmax(82px,0.7fr)', render: (b) => <StatePill map={CANCELLED_BY} value={b.cancelledBy} /> },
  reason: { label: 'Reason', w: 'minmax(110px,1.05fr)', render: (b) => <p className="line-clamp-2 text-[12px] leading-snug text-[#1b1140]" title={b.cancellationReason || ''}>{b.cancellationReason || <span className="text-[#6b6785]">Not recorded</span>}</p> },
  refund: { label: 'Refund', w: 'minmax(112px,0.85fr)', render: (b) => <StatePill map={REFUND} value={b.refund} /> },
  resolution: { label: 'Status', w: 'minmax(108px,0.85fr)', render: (b) => <StatePill map={RESOLUTION} value={b.resolution} /> },
  lifecycle: { label: 'Booking', w: 'minmax(92px,0.75fr)', render: (b) => <StatePill map={LIFECYCLE} value={b.lifecycle} /> },
  account: { label: 'Account', w: 'minmax(126px,0.95fr)', render: (b) => <StatePill map={ACCOUNT} value={b.account} /> },
  action: { label: 'Action', w: 'minmax(58px,0.5fr)', render: null },
}

// The status pill shown on grid cards for each workspace.
const CARD_STATUS = {
  active: (b) => <StatePill map={OPERATIONAL} value={b.operational} />,
  ongoing: (b) => <StatePill map={OPERATIONAL} value={b.operational} />,
  upcoming: (b) => <StatePill map={READINESS} value={b.readiness} />,
  completed: (b) => <StatePill map={POST_SERVICE} value={b.postService} />,
  cancelled: (b) => <StatePill map={RESOLUTION} value={b.resolution} />,
  guest: (b) => <StatePill map={ACCOUNT} value={b.account} />,
}

function ActionLink({ b, onOpen }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpen(b)
      }}
      className={cn('inline-flex items-center gap-1 text-[12px] font-semibold whitespace-nowrap hover:underline', b.needsAttention ? 'text-[#c2570c]' : 'text-[#4527c8]')}
    >
      {b.needsAttention ? 'Review' : 'View'} <ArrowRight className="size-3.5" aria-hidden="true" />
    </button>
  )
}

export function Pagination({ page, pageSize, totalPages, onPage, onPageSize }) {
  const btn = 'flex size-8 items-center justify-center rounded-lg text-[12.5px] font-semibold transition'
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => totalPages <= 7 || p <= 5 || p === totalPages || Math.abs(p - page) <= 1)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page" className={cn(btn, 'border border-[#ddd7ee] text-[#4527c8] hover:bg-[#f1edff] disabled:opacity-40')}>
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((p, i) => (
          <span key={p} className="flex items-center gap-1">
            {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-[#6b6785]">…</span>}
            <button type="button" onClick={() => onPage(p)} aria-current={p === page ? 'page' : undefined} className={cn(btn, p === page ? 'bg-[#4125d0] text-white' : 'text-[#2a1b57] hover:bg-[#f1edff]')}>{p}</button>
          </span>
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page" className={cn(btn, 'border border-[#ddd7ee] text-[#4527c8] hover:bg-[#f1edff] disabled:opacity-40')}>
          <ChevronRight className="size-4" />
        </button>
      </nav>
      <label className="flex items-center gap-2 text-[12px] text-[#2a1b57]">
        Rows per page
        <span className="relative">
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="h-8 w-[68px] appearance-none rounded-lg border border-[#ddd7ee] bg-white pr-6 pl-2.5 text-[12.5px] font-medium text-[#2a1b57] focus:border-[#7a5cf0] focus:outline-none">
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-[#4527c8]" />
        </span>
      </label>
    </div>
  )
}

export default function OpsTable({ view, columns, data, finance, layout = 'list', selectedId, checked, onCheck, onCheckPage, fetching, onSelect, onOpen, onPage, onPageSize, emptyText, hasFilters, onClear }) {
  const cols = columns.map((id) => ({ id, ...COLUMNS[id] })).filter((c) => !c.finance || finance)
  const template = ['22px', ...cols.map((c) => c.w)].join(' ')
  const asOf = data.context?.generatedAt || new Date().toISOString()
  const allChecked = data.items.length > 0 && data.items.every((b) => checked.has(b.id))

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={CalendarX2}
        title={hasFilters ? 'No bookings match these filters' : 'Nothing here right now'}
        description={hasFilters ? 'Try another tab, filter or search term.' : emptyText}
        action={hasFilters && <button type="button" onClick={onClear} className="h-9 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-4 text-[13px] font-semibold text-[#3b1fd6] hover:bg-[#f4f1fc]">Clear filters</button>}
      />
    )
  }

  const body = layout === 'grid' ? (
    <ul className="grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-3">
      {data.items.map((b) => {
        const tz = timeZoneFor(b.countryCode)
        return (
          <li key={b.id}>
            <button type="button" onClick={() => onSelect(b.id)} className={cn(CARD, 'w-full space-y-2.5 p-3 text-left transition hover:shadow-md', b.id === selectedId && 'border-[#7a5cf0] ring-2 ring-[#7a5cf0]/20')}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-bold text-[#4527c8]">{b.reference}</span>
                {CARD_STATUS[view](b)}
              </div>
              <Person name={view === 'guest' ? b.guest?.name : b.client.name} sub={view === 'guest' ? b.guest?.phone : b.client.guest ? 'Guest' : 'Registered Client'} />
              <Person name={b.provider.name} sub={b.branch || b.provider.typeLabel} business={b.category !== 'individual'} />
              <div className="flex items-center justify-between gap-2 border-t border-[#efecf7] pt-2 text-[11.5px] text-[#2a1b57]">
                <span className="truncate">{b.service} · {b.scheduledStart ? formatStamp(b.scheduledStart, asOf, tz) : '—'}</span>
                <StatePill map={PAYMENT} value={b.payment} />
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  ) : (
    <div className="overflow-x-auto">
      <div className="min-w-[960px]" role="table" aria-label="Bookings">
        <div role="row" style={{ gridTemplateColumns: template }} className="grid items-center gap-x-1.5 rounded-lg bg-[#f1eefb] px-2.5 py-2.5 text-[11.5px] font-semibold text-[#1b1140]">
          <span role="columnheader"><input type="checkbox" aria-label="Select all on this page" checked={allChecked} onChange={() => onCheckPage(data.items)} className="size-3.5 accent-[#4125d0]" /></span>
          {cols.map((c) => <span key={c.id} role="columnheader">{c.label}</span>)}
        </div>
        <ul role="rowgroup">
          {data.items.map((b) => {
            const tz = timeZoneFor(b.countryCode)
            const selected = b.id === selectedId
            return (
              <li
                key={b.id}
                role="row"
                aria-selected={selected}
                tabIndex={0}
                onClick={() => onSelect(b.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(b.id)
                  }
                }}
                style={{ gridTemplateColumns: template }}
                className={cn(
                  'grid cursor-pointer items-center gap-x-1.5 border-b border-[#efecf7] px-2.5 py-2 transition outline-none focus-visible:ring-2 focus-visible:ring-[#7a5cf0]',
                  selected ? 'bg-[#f4f0ff] shadow-[inset_3px_0_0_#4125d0]' : 'hover:bg-[#faf9fe]',
                )}
              >
                <span role="cell" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" aria-label={`Select ${b.reference}`} checked={checked.has(b.id)} onChange={() => onCheck(b)} className="size-3.5 accent-[#4125d0]" />
                </span>
                {cols.map((c) => (
                  <div key={c.id} role="cell" className="min-w-0">
                    {c.id === 'action' ? <ActionLink b={b} onOpen={onOpen} /> : c.render(b, tz, asOf, onOpen)}
                  </div>
                ))}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )

  return (
    <div className={cn('transition-opacity', fetching && 'opacity-60')} aria-busy={fetching}>
      {body}
      <Pagination page={data.page} pageSize={data.pageSize} totalPages={data.totalPages} onPage={onPage} onPageSize={onPageSize} />
    </div>
  )
}
