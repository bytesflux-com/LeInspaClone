import { ArrowRight, Ban, ChevronLeft, ChevronRight, CircleCheck, CircleDot, CircleX, Clock, Gift, Star } from 'lucide-react'
import { PAGE_SIZES } from '../../../constants/clientLoyalty'
import { cn } from '../../../lib/utils'

const ICONS = { check: CircleCheck, dot: CircleDot, ban: Ban, clock: Clock, x: CircleX }

// Generic status pill. `style` comes from the status maps in constants/clientLoyalty.js.
export function StatusPill({ style, className }) {
  const s = style || { label: '—', box: 'bg-[#e6e8ee] text-[#3f4457]', icon: 'clock', iconClass: 'fill-[#7d8599] text-white' }
  const Icon = ICONS[s.icon] || CircleCheck
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-[5px] text-[11px] leading-none font-medium whitespace-nowrap', s.box, className)}>
      <Icon className={cn('size-[14px]', s.iconClass)} aria-hidden="true" />
      {s.label}
    </span>
  )
}

// Monetary value; restricted for admins without payment-viewing permission.
export function Amount({ value, currency, show = true, className }) {
  if (!show) return <span className={cn('text-[#4a4466]', className)}>Restricted</span>
  if (typeof value !== 'number') return <span className={className} aria-label="No value">—</span>
  return <span className={cn('whitespace-nowrap tabular-nums', className)}>{`${currency} ${value.toLocaleString('en-US')}`}</span>
}

// Outlined "View →" button shared by every row.
export function ViewButton({ onClick, label = 'View', className, ariaLabel }) {
  const cls = cn(
    'inline-flex h-8 w-full max-w-[82px] items-center justify-center gap-1.5 rounded-md border-[1.5px] border-[#8b6cf0] bg-white px-2 text-[12px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]',
    className,
  )
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={cls}>
      {label} <ArrowRight className="size-3.5" aria-hidden="true" />
    </button>
  )
}

// Loyalty-activity glyph: purple tile for qualifying activity, warm tile for an earned reward,
// red-outlined tile for a redemption (informational — not an error).
const ACTIVITY_TILE = {
  eligible_booking: { tile: 'bg-[#efebfc] ring-[#d6caf1]', icon: CircleDot, color: 'text-[#4527c8]' },
  reward_earned: { tile: 'bg-[#fff0e4] ring-[#f6cfae]', icon: Star, color: 'fill-[#f2672a] text-[#f2672a]' },
  reward_redeemed: { tile: 'bg-[#fdecec] ring-[#f3c4c4]', icon: Gift, color: 'text-[#dc2626]' },
}

export function ActivityTile({ kind, size = 28 }) {
  const t = ACTIVITY_TILE[kind] || ACTIVITY_TILE.eligible_booking
  const Icon = t.icon
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-lg ring-1', t.tile)} style={{ width: size, height: size }} aria-hidden="true">
      <Icon className={cn('size-[16px]', t.color)} />
    </span>
  )
}

// Paged footer used by the referral table.
export function Pagination({ page, pageSize, total, totalPages, noun = 'referrals', onPage, onPageSize }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const btn = 'flex size-[30px] items-center justify-center rounded-md border text-[12.5px] font-medium transition'
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - page) <= 1)
  return (
    <div className="grid items-center gap-x-4 gap-y-2 px-1 pt-3 text-[12.5px] text-[#2a1b57] md:grid-cols-[1fr_auto_1fr]">
      <p>Showing {from}-{to} of {total} {noun}</p>
      <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page" className={cn(btn, 'border-[#ddd7ee] bg-white text-[#1b1140] hover:bg-[#f1edff] disabled:cursor-not-allowed disabled:opacity-40')}>
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((p, i) => (
          <span key={p} className="flex items-center gap-1.5">
            {i > 0 && p - pages[i - 1] > 1 && <span className="text-[#6b6785]">…</span>}
            <button
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(btn, p === page ? 'border-[#4125d0] bg-[#4125d0] text-white' : 'border-[#ddd7ee] bg-white text-[#1b1140] hover:bg-[#f1edff]')}
            >
              {p}
            </button>
          </span>
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page" className={cn(btn, 'border-[#ddd7ee] bg-white text-[#1b1140] hover:bg-[#f1edff] disabled:cursor-not-allowed disabled:opacity-40')}>
          <ChevronRight className="size-4" />
        </button>
      </nav>
      <label className="flex items-center justify-end gap-2 text-[12.5px]">
        Rows per page
        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="h-[30px] w-[64px] rounded-md border border-[#ddd7ee] bg-white px-2 text-[12.5px] font-medium text-[#1b1140] focus:border-[#7a5cf0] focus:outline-none">
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
    </div>
  )
}
