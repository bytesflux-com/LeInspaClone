import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useNavigate } from 'react-router'
import { formatNumber } from '../../lib/format'

export default function ProviderStatusDonut({ statusDistribution }) {
  const navigate = useNavigate()
  if (!statusDistribution) return null

  const { total, segments } = statusDistribution

  const handleSegmentClick = (segmentId) => {
    navigate(`/providers/all?status=${segmentId}`)
  }

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      {/* Header */}
      <h2 className="text-[15px] font-bold text-[#1b1140]">Provider Status</h2>

      {/* Donut and Legend row */}
      <div className="flex flex-1 items-center justify-between gap-4 py-2">
        {/* Donut Chart with Center Total */}
        <div className="relative size-36 shrink-0 sm:size-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                dataKey="count"
                nameKey="label"
                innerRadius="65%"
                outerRadius="95%"
                paddingAngle={2}
                stroke="none"
              >
                {segments.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.color}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => handleSegmentClick(entry.id)}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1b1140',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '11px',
                  border: 'none',
                }}
                formatter={(val, name) => [`${formatNumber(val)} providers`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centered label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[18px] font-bold tracking-tight text-[#1b1140]">
              {formatNumber(total)}
            </span>
            <span className="text-[10px] font-medium text-gray-400">Total</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex flex-1 flex-col justify-center space-y-1.5 text-[11.5px]">
          {segments.map((seg) => (
            <button
              key={seg.id}
              type="button"
              onClick={() => handleSegmentClick(seg.id)}
              className="group flex w-full items-center justify-between rounded-lg px-2 py-1 text-left transition hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-gray-600 transition group-hover:text-[#1b1140]">
                  {seg.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-right font-medium text-gray-500">
                <span className="font-semibold text-[#1b1140]">{formatNumber(seg.count)}</span>
                <span className="text-[10px] text-gray-400">({seg.percentage}%)</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

