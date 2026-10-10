import { Link } from 'react-router'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  Clock,
  Download,
  FlaskConical,
  Globe,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
  UsersRound,
  X,
} from 'lucide-react'
import Dropdown from '../ui/Dropdown'
import CountryFlag from '../ui/CountryFlag'
import Skeleton from '../ui/Skeleton'
import { useMarketContext } from '../../hooks/useMarketContext'
import { useDateRange } from '../../hooks/useDateRange'
import { PROVIDER_CATEGORY_OPTIONS, TONE } from '../../constants/bookingOps'
import { formatCurrency } from '../../lib/currency'
import { formatNumber } from '../../lib/format'
import { formatTime } from '../../lib/profileFormat'
import { cn } from '../../lib/utils'

export const CARD = 'rounded-2xl border border-[#ebe7f6] bg-white shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_24px_-14px_rgba(36,21,71,0.18)]'

// Solid icon discs (KPI cards) and soft icon tiles (attention cards).
export const DISC = {
  purple: 'bg-[#6d3fe0] text-white',
  blue: 'bg-[#2f6fe4] text-white',
  orange: 'bg-[#f08a24] text-white',
  green: 'bg-[#22a652] text-white',
  red: 'bg-[#e03a3a] text-white',
  grey: 'bg-[#e9e7f2] text-[#4b5068]',
  slate: 'bg-[#6b6f80] text-white',
}
export const TILE = {
  red: 'bg-[#fde4e4] text-[#dc2626]',
  orange: 'bg-[#ffecd6] text-[#e8791a]',
  purple: 'bg-[#ece5fd] text-[#6d3fe0]',
  blue: 'bg-[#e1eafd] text-[#2f6fe4]',
  green: 'bg-[#dcf6e4] text-[#16a34a]',
  grey: 'bg-[#eceef3] text-[#4b5068]',
}

const PILL_ICON = { green: CircleCheck, purple: Circle, orange: Clock, red: CircleAlert, blue: RotateCcw, grey: CircleMinus }

// One pill for every separate state family (booking / payment / assignment /
// operational / readiness / settlement …) — the map decides label and tone.
export function StatePill({ map, value, className }) {
  if (!value) return <span className="text-[12px] text-[#6b6785]">—</span>
  const [label, tone] = map[value] || [value, 'grey']
  const Icon = PILL_ICON[tone] || Circle
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-[4px] text-[11px] leading-none font-semibold whitespace-nowrap', TONE[tone], className)}>
      <Icon className={cn('size-3 shrink-0', tone === 'purple' && 'fill-current')} strokeWidth={2.5} aria-hidden="true" />
      {label}
    </span>
  )
}

export const money = (amount, currency) => (typeof amount === 'number' && currency ? formatCurrency(amount, currency) : '—')

export function MarketCell({ code, name }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] whitespace-nowrap text-[#1b1140]">
      <CountryFlag code={code} className="h-3 w-4.5 shrink-0" />
      {name}
    </span>
  )
}

export function Toast({ message }) {
  if (!message) return null
  return (
    <div role="status" className="fixed right-6 bottom-6 z-[80] rounded-xl bg-[#1b1140] px-4 py-3 text-[13px] font-medium text-white shadow-2xl">
      {message}
    </div>
  )
}

export function TrendChip({ value }) {
  if (value == null) return null
  const up = value >= 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold', up ? 'bg-[#dcf6e4] text-[#15803d]' : 'bg-[#fde4e4] text-[#dc2626]')}>
      {up ? <ArrowUp className="size-3" strokeWidth={3} /> : <ArrowDown className="size-3" strokeWidth={3} />}
      {Math.abs(value)}%
    </span>
  )
}

// Bordered menu used by the header controls and the filter row. With a
// `label`, the box shows the label until a non-default value is chosen.
export function SelectBox({ icon: Icon, label, value, options, onChange, width = 'w-56', align = 'left', className, prefix }) {
  const current = options.find((o) => o.value === value)
  const active = Boolean(value) && value !== options[0]?.value
  return (
    <Dropdown
      align={align}
      menuWidth={width}
      trigger={({ open }) => (
        <button
          type="button"
          aria-label={label || current?.label}
          aria-haspopup="listbox"
          className={cn(
            'flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-[12.5px] font-medium whitespace-nowrap text-[#1b1140] transition',
            open ? 'border-[#7a5cf0] ring-2 ring-[#7a5cf0]/15' : active && label ? 'border-[#b9a9f0] bg-[#faf8ff]' : 'border-[#ddd7ee] hover:border-[#bfb3e6]',
            className,
          )}
        >
          {Icon && <Icon className="size-4 shrink-0 text-[#2a1b57]" aria-hidden="true" />}
          {prefix}
          <span>{label && !active ? label : current?.label}</span>
          <ChevronDown className={cn('ml-auto size-3.5 shrink-0 text-[#4a4466] transition-transform', open && 'rotate-180')} />
        </button>
      )}
    >
      <div role="listbox" className="max-h-80 space-y-0.5 overflow-y-auto">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="option"
            aria-selected={o.value === value}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[12.5px] font-medium transition',
              o.value === value ? 'bg-[#f1edff] font-semibold text-[#4527c8]' : 'text-[#2a1b57] hover:bg-[#f4f1fc]',
            )}
          >
            <span className="flex items-center gap-2">{o.icon}{o.label}</span>
            {o.value === value && <Check className="size-4 shrink-0" />}
          </button>
        ))}
      </div>
    </Dropdown>
  )
}

// Page-level market control. It drives the same global market context as the
// top bar, so changing it re-queries every section.
function MarketMenu() {
  const { selectedMarket, setSelectedMarket, availableMarkets } = useMarketContext()
  return (
    <SelectBox
      icon={selectedMarket.isGlobal ? Globe : undefined}
      prefix={selectedMarket.isGlobal ? null : <CountryFlag code={selectedMarket.id} className="h-3 w-4.5" />}
      value={selectedMarket.id}
      options={availableMarkets.map((m) => ({ value: m.id, label: m.name, icon: m.isGlobal ? <Globe className="size-4 text-[#4527c8]" /> : <CountryFlag code={m.id} className="h-3 w-4.5" /> }))}
      onChange={setSelectedMarket}
      width="w-52"
    />
  )
}

function PeriodMenu() {
  const { dateRange, setDateRange, availableRanges } = useDateRange()
  const options = availableRanges.filter((r) => r.id !== 'custom').map((r) => ({ value: r.id, label: r.label }))
  return <SelectBox icon={CalendarDays} value={options.some((o) => o.value === dateRange) ? dateRange : options[0].value} options={options} onChange={setDateRange} width="w-48" className="min-w-[140px]" />
}

// Header shared by ADM-044 → ADM-050.
export function OpsHeader({ crumb, title, subtitle, market, providerType, onProviderType, period = true, onRefresh, fetching, generatedAt, demo, onExport, exporting, canExport }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-[#4a4466]">
          <Link to="/dashboard" className="hover:text-[#4527c8]">Home</Link>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <Link to="/bookings" className="hover:text-[#4527c8]">Booking Operations</Link>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <span className="font-semibold text-[#4527c8]">{crumb}</span>
        </nav>
        <h1 className="mt-1 font-display text-[36px] leading-none font-bold tracking-tight text-[#1b1140]">
          {title}
          {market && !market.isGlobal && <span className="text-[#4527c8]"> — {market.name}</span>}
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#2a1b57]">
          {subtitle}
          {generatedAt && <span className="inline-flex items-center gap-1 text-[11px] text-[#6b6785]"><span className="size-1.5 rounded-full bg-[#22a652]" />Updated {formatTime(generatedAt, market?.timeZone)}</span>}
          {demo && <span className="inline-flex items-center gap-1 rounded-md bg-[#fff4e0] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#9a5a06]" title="VITE_USE_MOCK_BOOKINGS is on"><FlaskConical className="size-3" /> Demo data</span>}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MarketMenu />
        <SelectBox icon={UsersRound} value={providerType} options={PROVIDER_CATEGORY_OPTIONS} onChange={onProviderType} width="w-60" />
        {period && <PeriodMenu />}
        <span className="mx-1 hidden h-7 w-px bg-[#e6e1f3] lg:block" aria-hidden="true" />
        <button type="button" onClick={onRefresh} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#ddd7ee] bg-white px-4 text-[12.5px] font-semibold text-[#1b1140] transition hover:bg-[#f4f1fc]">
          <RefreshCw className={cn('size-4', fetching && 'animate-spin')} aria-hidden="true" /> Refresh
        </button>
        {canExport && (
          <button type="button" onClick={onExport} disabled={exporting} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#4125d0] px-5 text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-[#3519b8] disabled:opacity-60">
            <Download className="size-4" aria-hidden="true" /> {exporting ? 'Exporting…' : 'Export'}
          </button>
        )}
      </div>
    </header>
  )
}

// Icon KPI cards. Clicking filters the list (onSelect) or deep-links (to).
export function KpiCards({ items, values, trends, active, onSelect, cols = 'xl:grid-cols-6' }) {
  return (
    <div className={cn('grid grid-cols-2 gap-2.5 md:grid-cols-3', cols)}>
      {items.map((it) => {
        const Icon = it.icon
        const value = values?.[it.key]
        const isActive = active && active === it.id
        const Tag = it.to ? Link : 'button'
        const trend = trends?.[it.key]
        return (
          <Tag
            key={it.key}
            {...(it.to ? { to: it.to } : { type: 'button', onClick: () => onSelect?.(it) })}
            aria-pressed={it.to ? undefined : Boolean(isActive)}
            className={cn(CARD, 'flex min-w-0 items-center gap-3 px-3.5 py-3 text-left transition hover:border-[#cfc5ee] hover:shadow-md', isActive && 'border-[#7a5cf0] ring-2 ring-[#7a5cf0]/20')}
          >
            <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', DISC[it.color])}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 block text-[11.5px] leading-tight font-medium text-[#2a1b57]" title={it.label}>{it.label}</span>
              {values ? (
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className={cn('font-bold tracking-tight text-[#1b1140]', it.small ? 'text-[14px] leading-7 whitespace-nowrap' : 'text-[22px] leading-7')}>{it.display ?? formatNumber(value ?? 0)}</span>
                  <TrendChip value={trend} />
                </span>
              ) : (
                <Skeleton className="mt-1 h-6 w-16" />
              )}
              {(it.sub || trend != null) && <span className="block truncate text-[10.5px] text-[#6b6785]">{it.sub || 'vs. previous period'}</span>}
            </span>
          </Tag>
        )
      })}
    </div>
  )
}

// "Needs Your Attention" panel. Zero counts stay quiet.
export function AttentionPanel({ title = 'Needs Your Attention', subtitle, items, loading, onReview, viewAll }) {
  return (
    <section aria-label={title} className="rounded-2xl border border-[#f7d4d8] bg-[#fff6f7] p-3.5">
      <header className="mb-2.5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <TriangleAlert className="mt-0.5 size-6 shrink-0 fill-[#e5252a] text-white" aria-hidden="true" />
          <div>
            <h2 className="text-[15px] font-bold text-[#1b1140]">{title}</h2>
            {subtitle && <p className="text-[11.5px] text-[#4a4466]">{subtitle}</p>}
          </div>
        </div>
        {viewAll && (
          <Link to={viewAll.to} className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#4527c8] hover:underline">
            {viewAll.label} <ArrowRight className="size-3.5" />
          </Link>
        )}
      </header>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {(items || Array.from({ length: 6 }, (_, i) => ({ id: i }))).map((it) => {
          const Icon = it.icon || CircleAlert
          const hot = it.count > 0
          return (
            <div key={it.id} className={cn('flex min-w-0 items-start gap-2.5 rounded-xl border border-[#f1e9ee] bg-white px-3 py-2.5', !hot && !loading && 'opacity-75')}>
              <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', TILE[hot ? it.tone : 'grey'])}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                {it.label ? <p className="line-clamp-2 text-[11.5px] leading-tight font-medium text-[#2a1b57]" title={it.label}>{it.label}</p> : <Skeleton className="h-3 w-20" />}
                {loading ? <Skeleton className="mt-1 h-5 w-8" /> : <p className="text-[20px] leading-7 font-bold text-[#1b1140]">{formatNumber(it.count ?? 0)}</p>}
                {hot && !loading && (it.to ? (
                  <Link to={it.to} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#4527c8] hover:underline">Review <ArrowRight className="size-3.5" /></Link>
                ) : (
                  <button type="button" onClick={() => onReview?.(it)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#4527c8] hover:underline">Review <ArrowRight className="size-3.5" /></button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function PillTabs({ tabs, value, onChange, label }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      onWheel={(e) => {
        if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY
      }}
      className="flex gap-1 overflow-x-auto scroll-smooth scrollbar-thin"
    >
      {tabs.map((t) => {
        const on = t.id === value
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn('h-9 shrink-0 rounded-lg px-3.5 text-[12.5px] font-semibold whitespace-nowrap transition', on ? 'bg-[#4125d0] text-white shadow-sm' : 'text-[#2a1b57] hover:bg-[#f1edff]')}
          >
            {t.label}{t.count != null && ` (${formatNumber(t.count)})`}
          </button>
        )
      })}
    </div>
  )
}

export function Chip({ children, onRemove }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#ece5fd] px-3 text-[11.5px] font-semibold text-[#3b1fd6]">
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Remove filter" className="rounded-full hover:bg-white/60">
          <X className="size-3.5" />
        </button>
      )}
    </span>
  )
}

// Spas and hotels get a monogram tile; people get PersonAvatar.
export function BusinessAvatar({ name, size = 30 }) {
  const initials = String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-[#f6f0e3] font-display text-[12px] font-bold text-[#8a6a2f] ring-1 ring-[#e6d9bf]" style={{ width: size, height: size }} aria-hidden="true">
      {initials}
    </span>
  )
}
