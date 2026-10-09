import { Check, ChevronDown } from 'lucide-react'
import Dropdown from '../../ui/Dropdown'
import { useDateRange } from '../../../hooks/useDateRange'
import { cn } from '../../../lib/utils'

export const CARD =
  'rounded-2xl border border-[#e6e1f3] bg-white shadow-[0_1px_2px_rgba(36,21,71,0.04),0_6px_16px_-8px_rgba(36,21,71,0.08)]'

export function DashCard({ icon: Icon, iconWrap = '', iconClass = 'text-[#5b2fd0]', title, action, children, className = '', bodyClass = '' }) {
  return (
    <section className={cn(CARD, 'p-3', className)}>
      {(title || action) && <header className="mb-2 flex min-w-0 items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-[14px] font-bold tracking-tight whitespace-nowrap text-[#1b1140]">
          {Icon && (
            <span className={cn('flex size-6 shrink-0 items-center justify-center', iconWrap)}>
              <Icon className={cn('size-5', iconClass)} aria-hidden="true" />
            </span>
          )}
          {title}
        </h2>
        {action}
      </header>}
      <div className={bodyClass}>{children}</div>
    </section>
  )
}

// Small bordered select used in card headers.
export function MiniSelect({ value, options, onChange, label, align = 'right', width = 'w-40', compact = false }) {
  const current = options.find((o) => o.value === value)
  return (
    <Dropdown
      align={align}
      menuWidth={width}
      trigger={({ open }) => (
        <button
          type="button"
          aria-label={label}
          aria-haspopup="listbox"
          className={cn(
            'flex h-7 shrink-0 items-center gap-1 rounded-lg border bg-white px-2 text-[11px] font-medium whitespace-nowrap text-[#2a1b57] transition',
            open ? 'border-[#7a5cf0] ring-2 ring-[#7a5cf0]/15' : 'border-[#ddd7ee] hover:border-[#bfb3e6]',
          )}
        >
          {(compact && current?.short) || current?.label || label}
          <ChevronDown className={cn('size-3 shrink-0 transition-transform', open && 'rotate-180')} />
        </button>
      )}
    >
      <div role="listbox" className="space-y-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="option"
            aria-selected={o.value === value}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12.5px] font-medium transition',
              o.value === value ? 'bg-[#f1edff] font-semibold text-[#4527c8]' : 'text-[#2a1b57] hover:bg-[#f4f1fc]',
            )}
          >
            {o.label}
            {o.value === value && <Check className="size-4" />}
          </button>
        ))}
      </div>
    </Dropdown>
  )
}

// Reporting-period select bound to the shared Admin date range.
export function PeriodSelect({ compact = false }) {
  const { dateRange, setDateRange, availableRanges } = useDateRange()
  const options = availableRanges.filter((r) => r.id !== 'custom').map((r) => ({ value: r.id, label: r.label, short: r.shortLabel }))
  const value = options.some((o) => o.value === dateRange) ? dateRange : undefined
  return (
    <MiniSelect
      label={options.find((o) => o.value === value)?.label || 'Select period'}
      value={value}
      options={options}
      onChange={setDateRange}
      width="w-44"
      compact={compact}
    />
  )
}
