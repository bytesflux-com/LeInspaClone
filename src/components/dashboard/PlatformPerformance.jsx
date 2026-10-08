import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChevronDown, LineChart as ChartIcon, TrendingUp } from 'lucide-react'
import { formatCurrency } from '../../lib/currency'

const SAMPLE_PERFORMANCE = [
  { date: 'Aug 1', revenue: 480000, bookings: 45 },
  { date: 'Aug 5', revenue: 590000, bookings: 52 },
  { date: 'Aug 10', revenue: 780000, bookings: 68 },
  { date: 'Aug 15', revenue: 950000, bookings: 84 },
  { date: 'Aug 20', revenue: 1350000, bookings: 112 },
  { date: 'Aug 25', revenue: 1180000, bookings: 98 },
  { date: 'Aug 30', revenue: 1680000, bookings: 134 },
]

function ChartTooltip({ active, payload, mode }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-2.5 text-xs shadow-lg">
      <p className="text-gray-500 font-medium">{data.date}</p>
      <p className="mt-0.5 font-bold text-royal-950">
        {mode === 'revenue' ? formatCurrency(data.revenue, 'KES') : `${data.bookings} Bookings`}
      </p>
    </div>
  )
}

export default function PlatformPerformance({ performance }) {
  const [mode, setMode] = useState('revenue') // 'revenue' | 'bookings'

  const chartData = SAMPLE_PERFORMANCE

  return (
    <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-royal-50 text-royal-700">
              <ChartIcon className="size-4" />
            </span>
            <h2 className="text-base font-bold text-royal-950">Platform Performance</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Segmented control: Revenue / Bookings */}
            <div className="inline-flex rounded-xl bg-gray-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('revenue')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  mode === 'revenue'
                    ? 'bg-[#1b0d3d] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Revenue
              </button>
              <button
                type="button"
                onClick={() => setMode('bookings')}
                className={`rounded-lg px-2.5 py-1 transition ${
                  mode === 'bookings'
                    ? 'bg-[#1b0d3d] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bookings
              </button>
            </div>

            {/* Timeframe dropdown badge */}
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              <span>Last 30 Days</span>
              <ChevronDown className="size-3 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="mt-4 h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6f4bbd" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6f4bbd" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f3f7" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tick={{ fontSize: 10, fill: '#6b7280' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}M` : v >= 1000 ? `${v / 1000}K` : v)}
              />
              <Tooltip content={<ChartTooltip mode={mode} />} />
              <Area
                type="monotone"
                dataKey={mode}
                stroke="#5c2dd5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#purpleGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Metrics Row */}
      <div className="mt-4 grid grid-cols-3 border-t border-gray-100 pt-3 text-xs">
        <div>
          <p className="text-[11px] text-gray-400 font-medium">Current Period</p>
          <p className="mt-0.5 text-xs sm:text-sm font-bold text-gray-900">KES 12,482,300</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 font-medium">Previous Period</p>
          <p className="mt-0.5 text-xs sm:text-sm font-bold text-gray-900">KES 9,842,110</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 font-medium">Growth</p>
          <p className="mt-0.5 text-xs sm:text-sm font-bold text-emerald-600 flex items-center gap-0.5">
            <TrendingUp className="size-3" />
            <span>26.8%</span>
          </p>
        </div>
      </div>
    </div>
  )
}

