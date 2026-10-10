import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { LayoutGrid, List, Search } from 'lucide-react'
import ErrorState from '../ui/ErrorState'
import Skeleton from '../ui/Skeleton'
import { useMarketContext } from '../../hooks/useMarketContext'
import { useDateRange } from '../../hooks/useDateRange'
import { usePermissions } from '../../hooks/usePermissions'
import { useBookingList } from '../../hooks/useBookingOps'
import { bookingOpsService } from '../../services/bookingOpsService'
import { PERMISSIONS } from '../../constants/permissions'
import { FILTER_DEFS, ISSUE_ICONS, ISSUE_LABELS, PROVIDER_CATEGORY_OPTIONS, VIEW_CONFIG } from '../../constants/bookingOps'
import { downloadTextFile, toCsv } from '../../lib/download'
import { formatNumber } from '../../lib/format'
import { cn } from '../../lib/utils'
import { AttentionPanel, CARD, Chip, KpiCards, OpsHeader, PillTabs, SelectBox, Toast } from './OpsUI'
import OpsTable from './OpsTable'
import BookingQuickView from './BookingQuickView'

const FILTER_KEYS = Object.keys(FILTER_DEFS)
const DEFAULTS = { tab: 'all', issue: '', q: '', pt: '', sort: 'priority', page: 1, size: 10, ...Object.fromEntries(FILTER_KEYS.map((k) => [k, ''])) }
const DEFAULT_SORTS = [{ value: 'priority', label: 'Problems first' }, { value: 'time', label: 'Scheduled time (soonest)' }, { value: 'newest', label: 'Newest booking' }]
const NOUN = { active: 'active', upcoming: 'upcoming', ongoing: 'ongoing', completed: 'completed', cancelled: 'cancelled', guest: 'guest' }

// CSV columns for exports. Guest contact stays masked in exports too.
const CSV = [
  { label: 'Booking', value: (b) => b.reference },
  { label: 'Client', value: (b) => b.guest?.name || b.client.name },
  { label: 'Provider', value: (b) => b.provider.name },
  { label: 'Service', value: (b) => b.service },
  { label: 'Scheduled', value: (b) => b.scheduledStart },
  { label: 'Completed', value: (b) => b.completedAt },
  { label: 'Cancelled', value: (b) => b.cancelledAt },
  { label: 'Market', value: (b) => b.marketName },
  { label: 'Amount', value: (b) => (b.amount == null ? '' : `${b.currency} ${b.amount}`) },
  { label: 'Booking status', value: (b) => b.status },
  { label: 'Payment', value: (b) => b.payment },
  { label: 'Assignment', value: (b) => b.assignment },
  { label: 'Operational', value: (b) => b.operational },
  { label: 'Settlement', value: (b) => b.settlement },
  { label: 'Confirmation', value: (b) => b.confirmation },
  { label: 'Cancelled by', value: (b) => b.cancelledBy },
  { label: 'Reason', value: (b) => b.cancellationReason },
  { label: 'Refund', value: (b) => b.refund },
  { label: 'Account', value: (b) => b.account },
  { label: 'Issues', value: (b) => (b.issues || []).join('; ') },
]

function readParams(sp) {
  const num = (k) => {
    const n = Number(sp.get(k))
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : DEFAULTS[k]
  }
  return Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, k === 'page' || k === 'size' ? num(k) : sp.get(k) || DEFAULTS[k]]))
}

// ADM-045 → ADM-050 workspaces. One operational view over the shared bookings
// collection; the URL holds tab / filters / page / selection so returning from
// Booking Details restores the exact list.
export default function BookingWorkspace({ view }) {
  const cfg = VIEW_CONFIG[view]
  const navigate = useNavigate()
  const location = useLocation()
  const [sp, setSp] = useSearchParams()
  const { selectedMarket, setSelectedMarket } = useMarketContext()
  const { dateRange, dateRangeLabel, customRange } = useDateRange()
  const { can } = usePermissions()
  const canView = can(PERMISSIONS.BOOKINGS_VIEW)
  const finance = can(PERMISSIONS.FINANCE_VIEW)

  const p = useMemo(() => readParams(sp), [sp])
  const query = useMemo(
    () => ({
      market: selectedMarket.id,
      providerType: p.pt || null,
      dateRange: cfg.periodControl ? dateRange : undefined,
      customRange: cfg.periodControl && dateRange === 'custom' ? customRange : undefined,
      tab: p.tab,
      issue: p.issue || undefined,
      q: p.q || undefined,
      ...Object.fromEntries(cfg.filters.map((k) => [k, p[k] || undefined])),
      sort: p.sort,
      page: p.page,
      pageSize: p.size,
    }),
    [selectedMarket.id, p, cfg.periodControl, cfg.filters, dateRange, customRange],
  )
  const { data, error, loading, fetching, refetch } = useBookingList(view, query, canView)

  const [layout, setLayout] = useState('list')
  const [checked, setChecked] = useState(() => new Map())
  const [toast, setToast] = useState(null)
  const [exporting, setExporting] = useState(false)
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const update = (patch) => {
    const next = new URLSearchParams(sp)
    for (const [k, v] of Object.entries(patch)) {
      if (v === '' || v == null || v === DEFAULTS[k]) next.delete(k)
      else next.set(k, String(v))
    }
    if (!('page' in patch) && !('b' in patch)) next.delete('page')
    if (!('b' in patch)) next.delete('b')
    setSp(next, { replace: true })
  }
  const clearFilters = () => setSp(new URLSearchParams(), { replace: true })

  // Debounced search box bound to ?q=.
  const [search, setSearch] = useState(p.q)
  useEffect(() => setSearch(p.q), [p.q])
  useEffect(() => {
    if (search === p.q) return undefined
    const t = setTimeout(() => update({ q: search.trim() }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const stamp = () => new Date().toISOString().slice(0, 10)
  const exportAll = async () => {
    setExporting(true)
    try {
      const all = await bookingOpsService.exportBookings(view, { ...query, page: 1 })
      downloadTextFile(`le-inspa-${view}-bookings-${stamp()}.csv`, toCsv(all.items, CSV))
      setToast(`Exported ${formatNumber(all.total)} bookings`)
    } catch (err) {
      setToast(err?.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }
  const exportChecked = () => {
    downloadTextFile(`le-inspa-${view}-bookings-selected-${stamp()}.csv`, toCsv([...checked.values()], CSV))
    setToast(`Exported ${checked.size} selected ${checked.size === 1 ? 'booking' : 'bookings'}`)
  }
  const toggleOne = (b) =>
    setChecked((prev) => {
      const next = new Map(prev)
      if (next.has(b.id)) next.delete(b.id)
      else next.set(b.id, b)
      return next
    })
  const togglePage = (items) =>
    setChecked((prev) => {
      const next = new Map(prev)
      const all = items.every((b) => next.has(b.id))
      for (const b of items) {
        if (all) next.delete(b.id)
        else next.set(b.id, b)
      }
      return next
    })

  const bParam = sp.get('b')
  const selectedId = bParam === '-' ? null : bParam || null
  const fallback = data?.items?.find((i) => i.id === selectedId) || null
  const linkState = useMemo(() => ({ returnTo: `${location.pathname}${location.search}` }), [location.pathname, location.search])

  const attention = data?.attention.map((a) => ({
    id: a.id,
    label: cfg.attentionLabels[a.id] || ISSUE_LABELS[a.id] || a.id,
    count: a.count,
    tone: cfg.attention[a.id] || 'orange',
    icon: ISSUE_ICONS[a.id],
  }))
  const kpis = cfg.summary
    .filter((s) => !s.finance || finance)
    .map((s) => ({ ...s, id: s.tab ? `tab:${s.tab}` : null }))
  const filters = cfg.filters.filter((k) => !FILTER_DEFS[k].finance || finance)
  const issueOptions = [{ value: '', label: 'All issue types' }, ...(data?.attention || []).map((a) => ({ value: a.id, label: cfg.attentionLabels[a.id] || ISSUE_LABELS[a.id] }))]

  const chips = [
    !selectedMarket.isGlobal && { k: 'market', label: `Market: ${selectedMarket.name}`, remove: () => setSelectedMarket('ALL') },
    cfg.periodControl && { k: 'date', label: `Date: ${dateRangeLabel}` },
    p.pt && { k: 'pt', label: `Provider: ${PROVIDER_CATEGORY_OPTIONS.find((o) => o.value === p.pt)?.label}`, remove: () => update({ pt: '' }) },
    p.issue && { k: 'issue', label: `Issue: ${cfg.attentionLabels[p.issue] || ISSUE_LABELS[p.issue] || p.issue}`, remove: () => update({ issue: '' }) },
    ...filters.filter((k) => p[k]).map((k) => ({ k, label: `${FILTER_DEFS[k].label}: ${FILTER_DEFS[k].options.find((o) => o.value === p[k])?.label || p[k]}`, remove: () => update({ [k]: '' }) })),
    p.q && { k: 'q', label: `Search: “${p.q}”`, remove: () => update({ q: '' }) },
  ].filter(Boolean)
  const hasFilters = chips.some((c) => c.remove && c.k !== 'market') || p.tab !== 'all'

  const header = (
    <OpsHeader
      crumb={cfg.title}
      title={cfg.title}
      subtitle={cfg.subtitle}
      market={selectedMarket}
      providerType={p.pt}
      onProviderType={(pt) => update({ pt })}
      period={cfg.periodControl}
      onRefresh={refetch}
      fetching={fetching}
      generatedAt={data?.context?.generatedAt}
      demo={bookingOpsService.isMock}
      canExport={Boolean(data?.context?.canExport)}
      onExport={exportAll}
      exporting={exporting}
    />
  )

  if (!canView) {
    return (
      <div className="px-4 pt-3 pb-6">
        {header}
        <div className="mx-auto mt-6 max-w-xl"><ErrorState title="You don't have access to bookings" description="Your role does not include booking visibility. Ask a Super Admin to grant bookings access." /></div>
      </div>
    )
  }

  const drawerOpen = Boolean(selectedId)
  const from = data && data.total ? (data.page - 1) * data.pageSize + 1 : 0
  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0

  return (
    <div className={cn('min-h-full', drawerOpen && 'xl:grid xl:grid-cols-[minmax(0,1fr)_340px]')}>
      <div className="min-w-0 space-y-3 px-4 pt-3 pb-6">
        {header}

        {error && !data ? (
          <ErrorState title={`Unable to load ${cfg.title.toLowerCase()}`} description={error} onRetry={refetch} />
        ) : (
          <>
            {data?.context?.truncated && (
              <p className="rounded-lg bg-[#fff8eb] px-3 py-2 text-[12px] text-[#9a5a06]">Booking volume exceeded the live query window, so counts reflect the most recent bookings only.</p>
            )}
            <KpiCards
              items={kpis}
              values={data?.summary}
              active={p.issue ? null : `tab:${p.tab}`}
              onSelect={(it) => it.tab && update({ tab: it.tab, issue: '' })}
            />
            <AttentionPanel
              title={cfg.attentionTitle}
              subtitle={cfg.attentionSubtitle}
              items={attention}
              loading={!data}
              onReview={(it) => update({ issue: it.id, tab: 'all' })}
            />

            <section aria-label={cfg.title} className={cn(CARD, 'p-3.5')}>
              <PillTabs label="Operational views" tabs={cfg.tabs.map(([id, label]) => ({ id, label, count: data?.tabs.find((t) => t.id === id)?.count }))} value={p.tab} onChange={(tab) => update({ tab })} />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="relative min-w-[240px] flex-1 lg:max-w-[300px]">
                  <span className="sr-only">Search bookings</span>
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6b6785]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={cfg.searchPlaceholder || 'Search Booking ID, client, provider, service…'}
                    className="h-9 w-full rounded-lg border border-[#ddd7ee] bg-white pr-3 pl-9 text-[12.5px] text-[#1b1140] placeholder:text-[#8a85a3] focus:border-[#7a5cf0] focus:outline-none"
                  />
                </label>
                {filters.map((k) => (
                  <SelectBox key={k} label={FILTER_DEFS[k].label} value={p[k]} options={FILTER_DEFS[k].options} onChange={(v) => update({ [k]: v })} width={FILTER_DEFS[k].width} />
                ))}
                {data && <SelectBox label="Issue Type" value={p.issue} options={issueOptions} onChange={(issue) => update({ issue })} width="w-64" align="right" />}
                {hasFilters && <button type="button" onClick={clearFilters} className="px-1 text-[12px] font-semibold text-[#4527c8] hover:underline">Clear All</button>}
              </div>

              {chips.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {chips.map((c) => <Chip key={c.k} onRemove={c.remove}>{c.label}</Chip>)}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12.5px] text-[#2a1b57]">
                  {data ? <>Showing {from}–{to} of {formatNumber(data.total)} {NOUN[view]} bookings</> : <Skeleton className="h-4 w-48" />}
                </p>
                <div className="flex items-center gap-2">
                  {checked.size > 0 && (
                    <span className="flex items-center gap-2 rounded-lg bg-[#f1edff] px-2.5 py-1.5 text-[12px] font-semibold text-[#3b1fd6]">
                      {checked.size} selected
                      {data?.context?.canExport && <button type="button" onClick={exportChecked} className="underline">Export selected</button>}
                      <button type="button" onClick={() => setChecked(new Map())} className="text-[#4a4466] hover:underline">Clear</button>
                    </span>
                  )}
                  <span className="text-[12px] text-[#4a4466]">Sort by</span>
                  <SelectBox value={p.sort} options={cfg.sorts || DEFAULT_SORTS} onChange={(sort) => update({ sort })} width="w-56" align="right" className="min-w-[180px]" />
                  <div className="flex overflow-hidden rounded-lg border border-[#ddd7ee]" role="group" aria-label="Layout">
                    {[['list', List], ['grid', LayoutGrid]].map(([id, Icon]) => (
                      <button key={id} type="button" onClick={() => setLayout(id)} aria-pressed={layout === id} aria-label={`${id} view`} className={cn('flex size-9 items-center justify-center transition', layout === id ? 'bg-[#ece5fd] text-[#4125d0]' : 'bg-white text-[#4a4466] hover:bg-[#f4f1fc]')}>
                        <Icon className="size-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && data && <p role="alert" className="mt-2 rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">{error} <button type="button" onClick={refetch} className="font-semibold underline">Retry</button></p>}

              <div className="mt-2.5">
                {loading || !data ? (
                  <div className="space-y-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : (
                  <OpsTable
                    view={view}
                    columns={cfg.columns}
                    data={data}
                    layout={layout}
                    finance={finance && data.context?.canSeeFinancial !== false}
                    selectedId={selectedId}
                    checked={checked}
                    onCheck={toggleOne}
                    onCheckPage={togglePage}
                    fetching={fetching}
                    emptyText={cfg.empty}
                    hasFilters={hasFilters}
                    onClear={clearFilters}
                    onSelect={(id) => update({ b: id })}
                    onOpen={(b) => update({ b: b.id })}
                    onPage={(page) => update({ page })}
                    onPageSize={(size) => update({ size })}
                  />
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {drawerOpen && (
        <>
          <button type="button" aria-label="Close booking details" onClick={() => update({ b: '-' })} className="fixed inset-0 z-40 bg-[#1b1140]/30 xl:hidden" />
          <div className="border-l border-[#e6e1f3] bg-white max-xl:fixed max-xl:inset-y-0 max-xl:right-0 max-xl:z-50 max-xl:w-[380px] max-xl:overflow-y-auto max-xl:shadow-2xl xl:sticky xl:top-0 xl:h-screen xl:overflow-y-auto [scrollbar-width:thin]">
            <BookingQuickView key={selectedId} view={view} bookingId={selectedId} fallback={fallback} onClose={() => update({ b: '-' })} onOpenFull={(id) => navigate(`/bookings/${id}`, { state: linkState })} linkState={linkState} />
          </div>
        </>
      )}
      <Toast message={toast} />
    </div>
  )
}
