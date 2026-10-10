import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Info } from 'lucide-react'
import { formatCompactNumber, formatNumber } from '../../lib/format'

const RANGES = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: '12m', label: '12 Months' },
]

export default function ProviderGrowthChart({ series, onRangeChange, currentRange = '30d' }) {
  const [activeRange, setActiveRange] = useState(currentRange)

  const handleRange = (rangeId) => {
    setActiveRange(rangeId)
    if (onRangeChange) onRangeChange(rangeId)
  }

  const tooltipFormatter = (value, name) => [
    formatNumber(value),
    name === 'newProviders' ? 'New Providers' : 'Activated Providers',
  ]

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[15px] font-bold text-[#1b1140]">Provider Growth</h2>
          <Info className="size-3.5 text-gray-400" />
        </div>

        {/* Time Window Buttons */}
        <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/80 p-0.5 text-[11px] font-semibold text-gray-600">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRange(r.id)}
              className={`rounded-lg px-2.5 py-1 transition ${
                activeRange === r.id
                  ? 'bg-[#5c2dd5] font-bold text-white shadow-xs'
                  : 'hover:text-[#1b1140]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-52 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorActivated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f0f7" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCompactNumber}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1b1140',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '11px',
                border: 'none',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              }}
              formatter={tooltipFormatter}
            />
            <Area
              type="monotone"
              dataKey="newProviders"
              stroke="#7c3aed"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorNew)"
              name="newProviders"
            />
            <Area
              type="monotone"
              dataKey="activatedProviders"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorActivated)"
              name="activatedProviders"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-2 text-[11px] font-medium text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#7c3aed]" />
          <span>New Providers</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#f59e0b]" />
          <span>Activated Providers</span>
        </div>
      </div>
    </div>
  )
}

