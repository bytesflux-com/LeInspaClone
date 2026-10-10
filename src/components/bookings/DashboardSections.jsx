import { useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  Ban,
  CalendarClock,
  CircleCheck,
  CircleX,
  Clock,
  Hotel,
  RotateCcw,
  ShieldAlert,
  UserCheck,
  UserRound,
  UserX,
  Users,
  Wallet,
  Flower2,
  Shuffle,
  TriangleAlert,
  Store,
} from 'lucide-react'
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Skeleton from '../ui/Skeleton'
import CountryFlag from '../ui/CountryFlag'
import PersonAvatar from '../ui/PersonAvatar'
import { BOOKING_STATUS, OPERATIONAL, PAYMENT } from '../../constants/bookingOps'
import { formatCompactNumber, formatNumber } from '../../lib/format'
import { formatStamp, timeZoneFor } from '../../lib/profileFormat'
import { cn } from '../../lib/utils'
import { BusinessAvatar, CARD, MarketCell, StatePill, TILE } from './OpsUI'

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0)
const pct1 = (n, total) => (total ? `${(Math.round((n / total) * 1000) / 10).toString()}%` : '0%')
const Loading = ({ rows = 5 }) => <div className="space-y-2.5">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-5" />)}</div>

export function Panel({ title, subtitle, action, children, className, bodyClass }) {
  return (
    <section className={cn(CARD, 'flex flex-col p-4', className)}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[14.5px] font-bold tracking-tight text-[#1b1140]">{title}</h2>
          {subtitle && <p className="text-[11.5px] text-[#6b6785]">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className={cn('flex-1', bodyClass)}>{children}</div>
    </section>
  )
}

const MoreLink = ({ to, children }) => (
  <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#4527c8] hover:underline">
    {children} <ArrowRight className="size-3.5" />
  </Link>
)

// Fixed colour per stored booking status (donut + legend).
const STATUS_COLOR = {
  pending: '#9aa0b4',
  negotiation: '#c4b5f7',
  accepted: '#8b6cf0',
  confirmed: '#4125d0',
  on_the_way: '#2f6fe4',
  arrived: '#5fa0f4',
  service_in_progress: '#f08a24',
  awaiting_client_confirmation: '#f5b75a',
  completed: '#22a652',
  cancelled: '#e03a3a',
  rejected: '#7d8599',
  expired: '#c9cdd8',
}

// Stored booking statuses only — payment, assignment and readiness are separate.
export function StatusOverview({ data }) {
  const rows = data?.statusOverview?.filter((s) => s.count > 0) || []
  const total = rows.reduce((n, s) => n + s.count, 0)
  return (
    <Panel title="Booking Status Overview" subtitle="Distribution of bookings by current status.">
      {!data ? <Loading /> : rows.length === 0 ? <p className="py-10 text-center text-[12px] text-[#6b6785]">No bookings in scope.</p> : (
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative size-[150px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rows} dataKey="count" nameKey="status" innerRadius="62%" outerRadius="100%" startAngle={90} endAngle={-270} paddingAngle={rows.length > 1 ? 1 : 0} stroke="none" isAnimationActive={false}>
                  {rows.map((s) => <Cell key={s.status} fill={STATUS_COLOR[s.status]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e6e1f3', fontSize: 12 }} formatter={(v, n) => [formatNumber(v), BOOKING_STATUS[n]?.[0] || n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[20px] leading-none font-bold text-[#1b1140]">{formatNumber(total)}</span>
              <span className="mt-1 text-[10.5px] text-[#6b6785]">Total Bookings</span>
            </div>
          </div>
          <ul className="min-w-[180px] flex-1 space-y-1.5">
            {rows.map((s) => (
              <li key={s.status} className="grid grid-cols-[12px_1fr_auto_44px] items-center gap-2 text-[12px]">
                <span className="size-2.5 rounded-full" style={{ background: STATUS_COLOR[s.status] }} />
                <span className="truncate text-[#1b1140]">{BOOKING_STATUS[s.status]?.[0] || s.status}</span>
                <span className="font-semibold text-[#1b1140]">{formatNumber(s.count)}</span>
                <span className="text-right text-[#6b6785]">({pct(s.count, total)}%)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}

const AXIS = { fontSize: 10.5, fill: '#6b6785' }
const RANGES = [['today', 'Today'], ['7d', '7 Days'], ['30d', '30 Days']]

export function ActivityChart({ activity }) {
  const [range, setRange] = useState('today')
  const points = activity?.[range]?.map((d) => ({
    ...d,
    label: range === 'today' ? `${d.at.slice(11, 13)}:00` : new Date(`${d.at}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  }))
  return (
    <Panel
      title="Booking Activity"
      subtitle="Created, completed and cancelled bookings."
      action={
        <div className="flex rounded-lg border border-[#ddd7ee] p-0.5" role="group" aria-label="Activity range">
          {RANGES.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setRange(id)} aria-pressed={range === id} className={cn('h-7 rounded-md px-3 text-[11.5px] font-semibold transition', range === id ? 'bg-[#4125d0] text-white' : 'text-[#2a1b57] hover:bg-[#f4f1fc]')}>
              {label}
            </button>
          ))}
        </div>
      }
    >
      {!points ? <Skeleton className="h-[190px]" /> : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={points} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#ece8f7" />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} width={40} tickFormatter={formatCompactNumber} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e6e1f3', fontSize: 12 }} formatter={(v, name) => [formatNumber(v), name]} />
              <Line type="monotone" dataKey="created" name="Created" stroke="#4125d0" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="completed" name="Completed" stroke="#22a652" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="#e03a3a" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-1 flex justify-center gap-4 text-[11.5px] text-[#2a1b57]">
            {[['Created', '#4125d0'], ['Completed', '#22a652'], ['Cancelled', '#e03a3a']].map(([l, c]) => (
              <span key={l} className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3.5 rounded" style={{ background: c }} />{l}</span>
            ))}
          </div>
        </>
      )}
    </Panel>
  )
}

const CATEGORY_STYLE = {
  individual: [UserRound, 'purple', '#6d3fe0'],
  spa: [Flower2, 'orange', '#f0a43a'],
  hotel: [Hotel, 'blue', '#2f6fe4'],
}

export function ProviderBreakdown({ providerTypes }) {
  const cats = providerTypes?.categories || []
  const total = cats.reduce((n, c) => n + c.count, 0)
  return (
    <Panel title="Provider Type Breakdown" subtitle="Bookings by provider category." action={<MoreLink to="/providers">View Details</MoreLink>}>
      {!providerTypes ? <Loading rows={4} /> : (
        <ul className="space-y-3">
          {cats.map((c) => {
            const [Icon, tile, color] = CATEGORY_STYLE[c.id] || [Store, 'grey', '#9aa0b4']
            return (
              <li key={c.id} className="grid grid-cols-[32px_1fr_auto_36px] items-center gap-x-2.5 gap-y-1">
                <span className={cn('row-span-2 flex size-8 items-center justify-center rounded-lg', TILE[tile])}><Icon className="size-4" /></span>
                <span className="truncate text-[12.5px] font-medium text-[#1b1140]">{c.label}</span>
                <span className="text-[12.5px] font-bold text-[#1b1140]">{formatNumber(c.count)}</span>
                <span className="text-right text-[11.5px] text-[#6b6785]">{pct(c.count, total)}%</span>
                <span className="col-span-3 h-1.5 overflow-hidden rounded-full bg-[#efecf7]"><span className="block h-full rounded-full" style={{ width: `${pct(c.count, total)}%`, background: color }} /></span>
              </li>
            )
          })}
          {providerTypes.individual.length > 0 && (
            <li className="rounded-xl bg-[#f7f5fd] p-2.5">
              <p className="mb-1 text-[11px] font-semibold text-[#4a4466]">Individual professionals by category</p>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                {providerTypes.individual.map((t) => (
                  <li key={t.id} className="flex justify-between text-[11.5px]"><span className="truncate text-[#2a1b57]">{t.label}</span><span className="font-semibold text-[#1b1140]">{formatNumber(t.count)}</span></li>
                ))}
              </ul>
            </li>
          )}
        </ul>
      )}
    </Panel>
  )
}

export function MarketPerformance({ markets, onSelectMarket }) {
  return (
    <Panel title="Market Performance" subtitle="Markets by booking volume. Select one to focus the dashboard." action={<MoreLink to="/markets">View All Markets</MoreLink>}>
      {!markets ? <Loading rows={4} /> : markets.length === 0 ? <p className="py-8 text-center text-[12px] text-[#6b6785]">No market activity in this period.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-[12px]">
            <thead>
              <tr className="bg-[#f1eefb] text-left text-[11.5px] text-[#1b1140]">
                <th className="rounded-l-lg px-2 py-2 font-semibold">Market</th>
                <th className="px-2 py-2 font-semibold">Bookings</th>
                <th className="px-2 py-2 font-semibold">Ongoing</th>
                <th className="px-2 py-2 font-semibold">Needs Attention</th>
                <th className="rounded-r-lg px-2 py-2 font-semibold">Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {[...markets].sort((a, z) => z.bookings - a.bookings).map((m) => (
                <tr key={m.id} onClick={() => onSelectMarket(m.id)} className="cursor-pointer border-b border-[#efecf7] hover:bg-[#faf9fe]">
                  <td className="px-2 py-2"><span className="inline-flex items-center gap-1.5 font-medium text-[#1b1140]"><CountryFlag code={m.id} className="h-3 w-4.5" />{m.name}</span></td>
                  <td className="px-2 py-2 text-[#1b1140]">{formatNumber(m.bookings)}</td>
                  <td className="px-2 py-2 text-[#1b1140]">{formatNumber(m.ongoing)}</td>
                  <td className={cn('px-2 py-2', m.needsAttention ? 'font-semibold text-[#c2570c]' : 'text-[#1b1140]')}>{formatNumber(m.needsAttention)}</td>
                  <td className="px-2 py-2">
                    {m.completionRate == null ? '—' : (
                      <span className="flex items-center gap-2">
                        <span className="w-9 text-[#1b1140]">{m.completionRate}%</span>
                        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#efecf7]"><span className="block h-full rounded-full bg-[#22a652]" style={{ width: `${m.completionRate}%` }} /></span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

function HealthList({ rows }) {
  const total = rows.reduce((n, r) => n + (r.value || 0), 0)
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => {
        const Icon = r.icon
        const label = r.to ? <Link to={r.to} className="hover:text-[#4527c8] hover:underline">{r.label}</Link> : r.label
        return (
          <li key={r.label} className="grid grid-cols-[24px_1fr_auto_42px] items-center gap-2 text-[12px]">
            <span className={cn('flex size-6 items-center justify-center rounded-full', TILE[r.tone])}><Icon className="size-3.5" /></span>
            <span className="truncate text-[#1b1140]">{label}</span>
            <span className={cn('font-bold', r.hot && r.value ? (r.tone === 'red' ? 'text-[#dc2626]' : 'text-[#c2570c]') : 'text-[#1b1140]')}>{formatNumber(r.value ?? 0)}</span>
            <span className="text-right text-[11px] text-[#6b6785]">{r.noPct ? '' : pct1(r.value, total)}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function PaymentHealth({ payment }) {
  return (
    <Panel title="Payment Health" subtitle="Server-confirmed payment status.">
      {!payment ? <Loading /> : (
        <HealthList rows={[
          { label: 'Paid', value: payment.paid, tone: 'green', icon: CircleCheck },
          { label: 'Pending', value: payment.pending, tone: 'orange', icon: Clock, hot: true, to: '/bookings/upcoming?pay=pending' },
          { label: 'Failed', value: payment.failed, tone: 'red', icon: CircleX, hot: true, to: '/bookings/active?pay=failed' },
          { label: 'Refunded', value: payment.refunded, tone: 'blue', icon: RotateCcw },
          { label: 'Disputed', value: payment.disputed, tone: 'purple', icon: ShieldAlert, hot: true, to: '/disputes' },
        ]} />
      )}
    </Panel>
  )
}

export function AssignmentHealth({ assignment }) {
  return (
    <Panel title="Assignment Health" subtitle="Staff assignment for spas and hotels.">
      {!assignment ? <Loading rows={4} /> : (
        <HealthList rows={[
          { label: 'Assigned', value: assignment.assigned, tone: 'green', icon: UserCheck },
          { label: 'Unassigned', value: assignment.unassigned, tone: 'orange', icon: UserX, hot: true, to: '/bookings/upcoming?assign=unassigned' },
          { label: 'Reassignment Needed', value: assignment.reassignment, tone: 'orange', icon: Shuffle, hot: true, to: '/bookings/active?assign=reassignment_needed' },
          { label: 'Assignment Conflict', value: assignment.conflict, tone: 'red', icon: TriangleAlert, hot: true, to: '/bookings/active?assign=conflict' },
        ]} />
      )}
    </Panel>
  )
}

export function CancellationCard({ cancellations }) {
  return (
    <Panel title="Cancellations & Rescheduling" subtitle="Today's activity." action={<MoreLink to="/bookings/cancelled">View</MoreLink>}>
      {!cancellations ? <Loading /> : (
        <HealthList rows={[
          { label: 'Cancelled Today', value: cancellations.cancelledToday, tone: 'red', icon: Ban, noPct: true },
          { label: 'Rescheduled Today', value: cancellations.rescheduledToday, tone: 'purple', icon: CalendarClock, noPct: true },
          { label: 'Refund Pending', value: cancellations.refundPending, tone: 'orange', icon: Wallet, hot: true, noPct: true, to: '/bookings/cancelled?tab=refund_pending' },
          { label: 'Provider Cancellation', value: cancellations.byProvider, tone: 'red', icon: Store, noPct: true, to: '/bookings/cancelled?tab=provider' },
          { label: 'Client Cancellation', value: cancellations.byClient, tone: 'grey', icon: Users, noPct: true, to: '/bookings/cancelled?tab=client' },
        ]} />
      )}
    </Panel>
  )
}

const mins = (n) => (n == null ? '' : n < 60 ? `${n} min` : `${Math.floor(n / 60)} hr${n % 60 ? ` ${n % 60} min` : ''}`)

// Snapshot only — ADM-044 is not a booking directory.
export function RecentBookings({ recent, asOf, onOpen }) {
  return (
    <Panel title="Recent Bookings" subtitle="Latest bookings across the selected markets." action={<MoreLink to="/bookings/active">View All Bookings</MoreLink>}>
      {!recent ? <Loading rows={6} /> : recent.length === 0 ? <p className="py-8 text-center text-[12px] text-[#6b6785]">No bookings created in this period.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-[12px]">
            <thead>
              <tr className="bg-[#f1eefb] text-left text-[11.5px] text-[#1b1140]">
                {['Booking ID', 'Client', 'Provider', 'Service', 'Scheduled', 'Market', 'Payment', 'Booking Status', 'Action'].map((h, i, a) => <th key={h} className={cn('px-2 py-2 font-semibold', i === 0 && 'rounded-l-lg', i === a.length - 1 && 'rounded-r-lg')}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id} className="border-b border-[#efecf7]">
                  <td className="px-2 py-2"><button type="button" onClick={() => onOpen(b)} className="font-semibold whitespace-nowrap text-[#4527c8] hover:underline">{b.reference}</button></td>
                  <td className="px-2 py-2"><span className="flex items-center gap-2"><PersonAvatar name={b.client.name} size={28} /><span className="font-medium whitespace-nowrap text-[#1b1140]">{b.client.name}</span></span></td>
                  <td className="px-2 py-2">
                    <span className="flex items-center gap-2">
                      {b.category === 'individual' ? <PersonAvatar name={b.provider.name} size={28} /> : <BusinessAvatar name={b.provider.name} size={28} />}
                      <span className="leading-tight"><span className="block font-medium whitespace-nowrap text-[#1b1140]">{b.provider.name}</span><span className="block text-[10.5px] text-[#6b6785]">{b.provider.typeLabel}</span></span>
                    </span>
                  </td>
                  <td className="px-2 py-2 leading-tight"><span className="block text-[#1b1140]">{b.service}</span><span className="block text-[10.5px] text-[#6b6785]">{mins(b.durationMins)}</span></td>
                  <td className="px-2 py-2 whitespace-nowrap text-[#1b1140]">{b.scheduledStart ? formatStamp(b.scheduledStart, asOf, timeZoneFor(b.countryCode)) : '—'}</td>
                  <td className="px-2 py-2"><MarketCell code={b.countryCode} name={b.marketName} /></td>
                  <td className="px-2 py-2"><StatePill map={PAYMENT} value={b.payment} /></td>
                  <td className="px-2 py-2">{b.needsAttention ? <StatePill map={OPERATIONAL} value="needs_attention" /> : <StatePill map={BOOKING_STATUS} value={b.status} />}</td>
                  <td className="px-2 py-2">
                    <button type="button" onClick={() => onOpen(b)} className={cn('inline-flex items-center gap-1 font-semibold whitespace-nowrap hover:underline', b.needsAttention ? 'text-[#c2570c]' : 'text-[#4527c8]')}>
                      {b.needsAttention ? 'Review' : 'View'} <ArrowRight className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

const SOURCE_COLORS = ['#4125d0', '#f0a43a', '#22a652', '#2f6fe4', '#e03a3a', '#8b6cf0', '#16a3b8', '#9aa0b4']

export function SourceCard({ sources }) {
  const total = sources?.reduce((n, s) => n + s.count, 0) || 0
  return (
    <Panel title="Booking Source" subtitle="How bookings are created.">
      {!sources ? <Loading /> : sources.length === 0 ? <p className="py-6 text-center text-[12px] text-[#6b6785]">No bookings yet.</p> : (
        <ul className="space-y-2">
          {sources.map((s, i) => (
            <li key={s.id} className="grid grid-cols-[12px_1fr_auto_40px] items-center gap-2 text-[12px]">
              <span className="size-2.5 rounded-sm" style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
              <span className="truncate text-[#1b1140]">{s.label}</span>
              <span className="font-semibold text-[#1b1140]">{formatNumber(s.count)}</span>
              <span className="text-right text-[11px] text-[#6b6785]">{pct(s.count, total)}%</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

