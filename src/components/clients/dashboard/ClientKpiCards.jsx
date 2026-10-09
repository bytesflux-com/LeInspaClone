import { Link } from 'react-router'
import { ArrowDown, ArrowUp, CalendarCheck, UserCheck, UserPlus, UserX, Users } from 'lucide-react'
import Skeleton from '../../ui/Skeleton'
import { formatNumber } from '../../../lib/format'
import { cn } from '../../../lib/utils'
import { CARD } from './DashCard'

const KPIS = [
  { key: 'total', label: 'Total Clients', icon: Users, circle: 'bg-[#dce6ff] text-[#3b6fe6]', to: '/clients/all' },
  { key: 'active', label: 'Active Clients', icon: UserCheck, circle: 'bg-[#d9f5e2] text-[#1f9d4d]', to: '/clients/all?status=active' },
  { key: 'newClients', label: 'New Clients', icon: UserPlus, circle: 'bg-[#e9defa] text-[#6d3fe0]', to: '/clients/all?joined=30d' },
  { key: 'bookingClients', label: 'Booking Clients', icon: CalendarCheck, circle: 'bg-[#dce6ff] text-[#3b6fe6]', to: '/clients/all?bmin=1' },
  { key: 'suspended', label: 'Suspended Accounts', icon: UserX, circle: 'bg-[#fde0e0] text-[#dc2626]', to: '/clients/all?status=suspended' },
]

export default function ClientKpiCards({ kpis, deltaLabel }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 @md:grid-cols-2 @2xl:grid-cols-3 @[62rem]:grid-cols-5" aria-label="Client overview">
      {KPIS.map(({ key, label, icon: Icon, circle, to }) => {
        const kpi = kpis?.[key]
        const up = (kpi?.change ?? 0) >= 0
        const good = kpi?.adverse ? !up : up
        return (
          <Link key={key} to={to} className={cn(CARD, 'flex min-w-0 items-center gap-2 overflow-hidden px-2.5 py-2.5 transition hover:border-[#cfc5ee] hover:shadow-md')}>
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', circle)}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold leading-tight tracking-[-0.02em] whitespace-nowrap text-[#1b1140]">{label}</p>
              {kpi ? (
                <>
                  <p className="mt-0.5 text-[22px] leading-none font-bold tracking-tight text-[#1b1140]">{formatNumber(kpi.value)}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] tracking-[-0.02em] whitespace-nowrap text-[#6b6785]">
                    {up ? <ArrowUp className={cn('size-3', good ? 'text-[#16a34a]' : 'text-[#dc2626]')} strokeWidth={3} /> : <ArrowDown className={cn('size-3', good ? 'text-[#16a34a]' : 'text-[#dc2626]')} strokeWidth={3} />}
                    <span className={cn('font-bold', good ? 'text-[#16a34a]' : 'text-[#dc2626]')}>{Math.abs(kpi.change)}%</span>
                    {deltaLabel}
                  </p>
                </>
              ) : (
                <div className="mt-1 space-y-1.5"><Skeleton className="h-6 w-16" /><Skeleton className="h-2.5 w-24" /></div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
