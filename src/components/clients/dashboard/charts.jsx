import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompactNumber, formatNumber } from '../../../lib/format'

const AXIS = { fontSize: 10, fill: '#6b6785' }
const TOOLTIP = {
  contentStyle: { borderRadius: 10, border: '1px solid #e6e1f3', boxShadow: '0 8px 24px -8px rgba(36,21,71,0.25)', fontSize: 12, padding: '6px 10px' },
  labelStyle: { fontWeight: 600, color: '#1b1140', marginBottom: 2 },
  cursor: { stroke: '#cfc5ee' },
}

const tickInterval = (n) => Math.max(0, Math.ceil(n / 6) - 1)

export function GrowthAreaChart({ points, height = 104 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a4cf0" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#7a4cf0" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#ece8f7" />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={tickInterval(points.length)} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={40} tickFormatter={formatCompactNumber} allowDecimals={false} />
        <Tooltip {...TOOLTIP} formatter={(v) => [formatNumber(v), 'New clients']} />
        <Area type="monotone" dataKey="value" stroke="#7a4cf0" strokeWidth={2} fill="url(#growthFill)" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function BookingBarChart({ series, height = 80 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={0} barCategoryGap="14%">
        <CartesianGrid vertical={false} stroke="#ece8f7" />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={tickInterval(series.length)} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} tickFormatter={formatCompactNumber} allowDecimals={false} />
        <Tooltip {...TOOLTIP} cursor={{ fill: 'rgba(122,92,240,0.08)' }} formatter={(v, name) => [formatNumber(v), name]} />
        <Bar dataKey="completed" name="Completed" fill="#3b27b3" radius={[1.5, 1.5, 0, 0]} />
        <Bar dataKey="cancelled" name="Cancelled" fill="#c4b5f7" radius={[1.5, 1.5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export const TIER_COLORS = { standard: '#3b5bdb', premium: '#7c3aed', executive: '#f59e0b', none: '#9aa0b4' }

export function TierDonut({ slices, total, size = 112, onSelect, activeId }) {
  const data = slices.filter((s) => s.count > 0)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            innerRadius="66%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            paddingAngle={data.length > 1 ? 1.5 : 0}
            stroke="none"
            onClick={(_, i) => onSelect?.(data[i].id)}
          >
            {data.map((s) => (
              <Cell key={s.id} fill={TIER_COLORS[s.id]} opacity={activeId && activeId !== s.id ? 0.35 : 1} cursor={onSelect ? 'pointer' : 'default'} />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP} formatter={(v, name) => [formatNumber(v), name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[17px] leading-none font-bold text-[#1b1140]">{formatNumber(total)}</span>
        <span className="mt-0.5 text-[11px] text-[#4a4466]">Clients</span>
      </div>
    </div>
  )
}
