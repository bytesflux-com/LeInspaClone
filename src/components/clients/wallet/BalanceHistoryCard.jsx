import { useMemo, useRef, useState } from 'react'
import { Info, Wallet } from 'lucide-react'
import Skeleton from '../../ui/Skeleton'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { HISTORY_WINDOWS } from '../../../constants/clientWallet'
import { formatDay } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const W = 540
const H = 196
const M = { l: 70, r: 14, t: 14, b: 26 }
const LABEL_EVERY = { 7: 1, 30: 7, 90: 15 }

const niceStep = (raw) => {
  const pow = 10 ** Math.floor(Math.log10(raw || 1))
  const n = raw / pow
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow
}

// Monotone cubic path so the line never overshoots the real balances.
function smoothPath(pts) {
  if (pts.length < 2) return ''
  const n = pts.length
  const dx = []
  const m = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x)
    m.push((pts[i + 1].y - pts[i].y) / (pts[i + 1].x - pts[i].x))
  }
  const t = [m[0]]
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2)
  t.push(m[n - 2])
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i]
    d += ` C${pts[i].x + h / 3},${pts[i].y + (t[i] * h) / 3} ${pts[i + 1].x - h / 3},${pts[i + 1].y - (t[i + 1] * h) / 3} ${pts[i + 1].x},${pts[i + 1].y}`
  }
  return d
}

function Chart({ history, currency, timeZone }) {
  const svgRef = useRef(null)
  const [hover, setHover] = useState(null)
  const pts = history.points
  const model = useMemo(() => {
    const max = Math.max(...pts.map((p) => p.balance), 1)
    const step = niceStep((max * 1.5) / 3)
    const top = step * 3
    const x = (i) => M.l + (pts.length === 1 ? 0 : (i * (W - M.l - M.r)) / (pts.length - 1))
    const y = (v) => M.t + (1 - v / top) * (H - M.t - M.b)
    const xy = pts.map((p, i) => ({ x: x(i), y: y(p.balance) }))
    // Dots mark the days the balance moved (capped, evenly sampled).
    const changed = pts.map((p, i) => (i > 0 && p.balance !== pts[i - 1].balance ? i : -1)).filter((i) => i >= 0)
    const keep = changed.length > 6 ? changed.filter((_, k) => k % Math.ceil(changed.length / 6) === 0) : changed
    return { top, step, xy, y, dots: keep.filter((i) => i !== pts.length - 1) }
  }, [pts])

  const active = hover ?? pts.length - 1
  const a = model.xy[active]
  const label = (i) => formatDay(pts[i].at, timeZone, { year: true })
  const boxW = 118
  const boxX = Math.min(Math.max(a.x - boxW / 2 - 8, M.l), W - M.r - boxW)
  const boxY = a.y - 56 < 2 ? a.y + 12 : a.y - 56

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.round(((px - M.l) / (W - M.l - M.r)) * (pts.length - 1))
    setHover(Math.min(Math.max(idx, 0), pts.length - 1))
  }

  const line = smoothPath(model.xy)
  const base = H - M.b
  const every = LABEL_EVERY[history.window] || 7

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Wallet balance over the last ${history.window} days, currently ${currency} ${pts[pts.length - 1].balance.toLocaleString('en-US')}`}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id="walletArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a5cf0" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7a5cf0" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {[0, 1, 2, 3].map((k) => {
        const v = k * model.step
        const yy = model.y(v)
        return (
          <g key={k}>
            <line x1={M.l} x2={W - M.r} y1={yy} y2={yy} stroke="#e4def5" strokeDasharray="3 4" />
            <text x={M.l - 8} y={yy + 3.5} textAnchor="end" fontSize="10.5" fill="#2a1b57">{currency} {v.toLocaleString('en-US')}</text>
          </g>
        )
      })}

      {pts.map((p, i) => (i % every === 0 ? (
        <text key={p.at} x={model.xy[i].x} y={H - 6} textAnchor="middle" fontSize="10.5" fill="#2a1b57">{formatDay(p.at, timeZone)}</text>
      ) : null))}

      <path d={`${line} L${model.xy[model.xy.length - 1].x},${base} L${model.xy[0].x},${base} Z`} fill="url(#walletArea)" />
      <path d={line} fill="none" stroke="#6a45e6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {model.dots.map((i) => <circle key={i} cx={model.xy[i].x} cy={model.xy[i].y} r="3.5" fill="#6a45e6" stroke="#fff" strokeWidth="1.5" />)}
      <circle cx={a.x} cy={a.y} r="5.5" fill="#fff" stroke="#6a45e6" strokeWidth="3" />

      <g transform={`translate(${boxX},${boxY})`} pointerEvents="none">
        <rect width={boxW} height="42" rx="8" fill="#fff" stroke="#d9d3ee" />
        <text x="10" y="17" fontSize="10.5" fill="#2a1b57">{label(active)}</text>
        <text x="10" y="33" fontSize="12.5" fontWeight="700" fill="#1b1140">{currency} {pts[active].balance.toLocaleString('en-US')}</text>
      </g>
    </svg>
  )
}

// A compact balance-over-time line so an Admin can spot unusual movement. Not an analytics dashboard.
export default function BalanceHistoryCard({ history, loading, error, window, onWindow, currency, timeZone }) {
  return (
    <section aria-label="Balance history" className={cn(PROFILE_CARD, 'flex flex-col p-3.5')}>
      <header className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] leading-none font-bold text-[#1b1140]">
          <Wallet className="size-[18px] fill-[#4527c8]/90 text-[#4527c8]" aria-hidden="true" />
          Balance History
          <span title="Closing wallet balance at the end of each day" className="text-[#4527c8]"><Info className="size-4" aria-hidden="true" /></span>
        </h2>
        <div role="group" aria-label="Balance history period" className="inline-flex overflow-hidden rounded-lg border border-[#ddd7ee] bg-white">
          {HISTORY_WINDOWS.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={window === o.id}
              onClick={() => onWindow(o.id)}
              className={cn('h-8 px-3 text-[12px] font-medium transition', window === o.id ? 'bg-[#4125d0] text-white' : 'text-[#1b1140] hover:bg-[#f4f1fc]')}
            >
              {o.label}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1">
        {error && !history ? (
          <p role="alert" className="rounded-lg bg-[#fff1f1] p-3 text-[12px] text-[#b91c1c]">{error}</p>
        ) : loading || !history ? (
          <Skeleton className="h-[190px] rounded-xl" />
        ) : history.points.length === 0 ? (
          <p className="py-10 text-center text-[12.5px] text-[#4a4466]">No balance movement in this period.</p>
        ) : (
          <Chart key={history.window} history={history} currency={currency} timeZone={history.timeZone || timeZone} />
        )}
      </div>
    </section>
  )
}
