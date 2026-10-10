import { useState } from 'react'
import { TrendingUp } from 'lucide-react'

export function EarningsPerformanceChart({
  period = '30d',
  onPeriodChange,
  points = [],
  loading = false,
  canSeeFinancial = true,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null)

  const activePoints = points && points.length > 0 ? points : [
    { date: '12 Aug', current: 18000, previous: 14000 },
    { date: '19 Aug', current: 32000, previous: 26000 },
    { date: '26 Aug', current: 24500, previous: 29000 },
    { date: '2 Sep', current: 41000, previous: 33000 },
    { date: '9 Sep', current: 48500, previous: 39000 },
  ]

  const maxVal = Math.max(...activePoints.map((p) => Math.max(p.current, p.previous)), 50000)

  // SVG coordinate dimensions
  const svgWidth = 380
  const svgHeight = 120
  const padX = 35
  const padY = 15

  const getX = (idx) => padX + (idx * (svgWidth - padX * 2)) / (activePoints.length - 1)
  const getY = (val) => svgHeight - padY - ((val / maxVal) * (svgHeight - padY * 2))

  // Build SVG Path
  const currentPathD = activePoints.reduce((acc, p, idx) => {
    const x = getX(idx)
    const y = getY(p.current)
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`
  }, '')

  const currentAreaD = `${currentPathD} L ${getX(activePoints.length - 1)} ${svgHeight - padY} L ${getX(0)} ${svgHeight - padY} Z`

  const prevPathD = activePoints.reduce((acc, p, idx) => {
    const x = getX(idx)
    const y = getY(p.previous)
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`
  }, '')

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
      {/* Header with Period Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <h3 className="font-bold text-slate-900 text-sm">Earnings Performance</h3>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10.5px] font-semibold text-slate-600">
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
            { id: '12m', label: '12 Months' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPeriodChange?.(item.id)}
              className={`px-2 py-0.5 rounded-md transition ${
                period === item.id
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-3 text-[10.5px] text-slate-500 pb-1">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="size-2 rounded-full bg-purple-700" />
          <span>Provider Earnings</span>
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-0.5 border-t-2 border-dashed border-slate-400" />
          <span>Previous Period</span>
        </span>
      </div>

      {/* SVG Chart */}
      <div className="relative pt-1">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-28 overflow-visible"
        >
          <defs>
            <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7e22ce" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={currentAreaD} fill="url(#purpleGrad)" />

          {/* Previous Period Line (dashed) */}
          <path
            d={prevPathD}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Current Period Line (solid purple) */}
          <path
            d={currentPathD}
            fill="none"
            stroke="#7e22ce"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {activePoints.map((p, idx) => {
            const x = getX(idx)
            const y = getY(p.current)
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="3.5"
                className="fill-white stroke-purple-700 stroke-2 hover:r-5 cursor-pointer transition-all"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            )
          })}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between px-3 text-[10px] font-semibold text-slate-400 pt-1">
          {activePoints.map((p, idx) => (
            <span key={idx}>{p.date}</span>
          ))}
        </div>

        {/* Tooltip on hover */}
        {hoveredPoint && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] px-2.5 py-1 rounded-lg shadow-lg font-mono flex items-center gap-2">
            <span>{hoveredPoint.date}:</span>
            <span className="font-bold text-emerald-400">
              {canSeeFinancial ? `KES ${hoveredPoint.current.toLocaleString()}` : 'KES —'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

