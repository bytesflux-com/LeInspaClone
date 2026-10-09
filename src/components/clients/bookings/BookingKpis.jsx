import { CalendarCheck, CalendarDays, Check, Clock, TriangleAlert, X } from 'lucide-react'
import { cn } from '../../../lib/utils'

// Five compact status cards plus the total — a quick read, not an analytics dashboard.
function Kpi({ tab, active, onSelect, bg, disc, icon: Icon, iconClass, label, value, sub }) {
  const body = (
    <>
      <span className={cn('flex size-[40px] shrink-0 items-center justify-center', disc)}>
        <Icon className={cn('size-[20px]', iconClass)} aria-hidden="true" />
      </span>
      <div className="min-w-0 text-left">
        <p className="text-[12px] leading-tight font-medium whitespace-nowrap text-[#1b1140]">{label}</p>
        <p className="text-[26px] leading-[1.1] font-bold tracking-tight text-[#1b1140]">{value}</p>
        {sub && <p className="mt-0.5 text-[10px] leading-tight whitespace-nowrap text-[#4a4466]">{sub}</p>}
      </div>
    </>
  )
  const cls = cn(
    'flex min-w-0 items-center gap-2.5 rounded-xl border-2 border-white px-3 py-2.5 shadow-[0_1px_2px_rgba(36,21,71,0.05),0_8px_18px_-12px_rgba(36,21,71,0.2)] transition',
    bg,
    active && 'ring-2 ring-[#7a5cf0]/60',
  )
  if (!onSelect) return <div className={cls}>{body}</div>
  return (
    <button type="button" onClick={() => onSelect(tab)} className={cn(cls, 'cursor-pointer hover:brightness-[0.98]')} aria-pressed={active}>
      {body}
    </button>
  )
}

export default function BookingKpis({ summary: s, activeTab, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 @[40rem]:grid-cols-3 @[64rem]:grid-cols-6">
      <Kpi bg="bg-[#efebfc]" disc="rounded-full bg-[#e0d9fa]" icon={CalendarDays} iconClass="fill-[#4527c8]/20 text-[#4527c8]" label="Total Bookings" value={s.total} tab="all" active={activeTab === 'all'} onSelect={onSelect} />
      <Kpi bg="bg-[#e3f6e8]" disc="rounded-lg bg-[#1f9d55]" icon={CalendarCheck} iconClass="text-white" label="Upcoming" value={s.upcoming} sub={s.nextLabel} tab="upcoming" active={activeTab === 'upcoming'} onSelect={onSelect} />
      <Kpi bg="bg-[#fff3d9]" disc="rounded-full bg-[#fde3a6] ring-[3px] ring-[#f5a524]/70" icon={Clock} iconClass="text-[#b4570b]" label="Ongoing" value={s.ongoing} sub="In progress now" tab="ongoing" active={activeTab === 'ongoing'} onSelect={onSelect} />
      <Kpi bg="bg-[#efebfc]" disc="rounded-full bg-[#dcd3f8]" icon={Check} iconClass="text-[#3b1fd6] [stroke-width:3]" label="Completed" value={s.completed} sub={`${s.completionRate}% completion rate`} tab="completed" active={activeTab === 'completed'} onSelect={onSelect} />
      <Kpi bg="bg-[#fde8e8]" disc="rounded-full bg-[#e5484d]" icon={X} iconClass="text-white [stroke-width:3]" label="Cancelled" value={s.cancelled} sub={`${s.cancellationRate}% cancellation rate`} tab="cancelled" active={activeTab === 'cancelled'} onSelect={onSelect} />
      <Kpi bg="bg-[#fde8e8]" disc="rounded-full bg-[#e5484d]" icon={TriangleAlert} iconClass="text-white" label="Disputed" value={s.disputed} sub={s.disputed ? `${s.disputed} open ${s.disputed === 1 ? 'dispute' : 'disputes'}` : 'No open disputes'} tab="disputed" active={activeTab === 'disputed'} onSelect={onSelect} />
    </div>
  )
}
