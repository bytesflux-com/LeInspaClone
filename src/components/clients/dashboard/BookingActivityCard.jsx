import { ShieldCheck } from 'lucide-react'
import Skeleton from '../../ui/Skeleton'
import { formatNumber } from '../../../lib/format'
import { DashCard, PeriodSelect } from './DashCard'
import { BookingBarChart } from './charts'

export default function BookingActivityCard({ booking }) {
  return (
    <DashCard
      icon={ShieldCheck}
      iconClass="text-[#4527c8] fill-[#4527c8]/15"
      title="Client Booking Activity"
      action={<PeriodSelect />}
    >
      <div className="mb-1 flex items-center gap-4 text-[11px] text-[#4a4466]">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#3b27b3]" /> Completed</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#c4b5f7]" /> Cancelled</span>
      </div>
      {booking ? <BookingBarChart series={booking.series} /> : <Skeleton className="h-[80px] w-full" />}
      <div className="mt-1 grid grid-cols-3 gap-2">
        <Stat value={booking && formatNumber(booking.bookingClients)} label="Booking clients" color="text-[#2a1b8a]" />
        <Stat value={booking && `${booking.completionRate}%`} label="Completion rate" color="text-[#2a1b8a]" />
        <Stat value={booking && `${booking.currency} ${formatNumber(booking.avgBookingValue)}`} label="Avg. booking value" color="text-[#2a1b8a]" />
      </div>
    </DashCard>
  )
}

function Stat({ value, label, color }) {
  return (
    <div className="min-w-0">
      {value === null || value === undefined ? <Skeleton className="h-6 w-16" /> : <p className={`truncate text-[17px] leading-tight font-bold tracking-tight ${color}`}>{value}</p>}
      <p className="text-[10.5px] whitespace-nowrap text-[#4a4466]">{label}</p>
    </div>
  )
}
