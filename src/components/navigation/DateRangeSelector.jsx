import { CalendarDays, Check, ChevronDown } from 'lucide-react'
import { useDateRange } from '../../hooks/useDateRange'
import Dropdown from '../ui/Dropdown'

export default function DateRangeSelector() {
  const { dateRange, setDateRange, dateRangeLabel, availableRanges } = useDateRange()

  return (
    <Dropdown
      menuWidth="w-48"
      trigger={({ open }) => (
        <button
          type="button"
          aria-label="Select Date Range"
          className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition sm:text-sm ${
            open
              ? 'border-royal-600 bg-royal-50/60 text-royal-950 ring-2 ring-royal-500/20'
              : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50/80 shadow-xs'
          }`}
        >
          <CalendarDays className="size-4 text-royal-700" />
          <span className="hidden sm:inline text-gray-900 font-medium">{dateRangeLabel}</span>
          <ChevronDown className={`size-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
    >
      <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
        Reporting Period
      </div>
      <div className="space-y-0.5">
        {availableRanges.map((opt) => {
          const isSelected = opt.id === dateRange
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDateRange(opt.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition sm:text-sm ${
                isSelected
                  ? 'bg-royal-50 text-royal-800 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100/80'
              }`}
            >
              <span>{opt.label}</span>
              {isSelected && <Check className="size-4 text-royal-700" />}
            </button>
          )
        })}
      </div>
    </Dropdown>
  )
}

