import { Link } from 'react-router'
import { ShieldAlert, FileCheck, Banknote, AlertTriangle, LifeBuoy, Camera, ArrowUpRight } from 'lucide-react'
import Badge from '../../ui/Badge'

export function MarketNeedsAttention({ attention, marketName = 'Kenya' }) {
  if (!attention) return null

  const items = [
    {
      id: 'verifications',
      title: 'Provider Verifications',
      count: attention.verifications?.count || 0,
      label: attention.verifications?.label || 'Applications pending document verification',
      route: attention.verifications?.route || '/verifications',
      icon: FileCheck,
      badgeVariant: 'warning',
      urgency: 'high',
    },
    {
      id: 'approvals',
      title: 'Photo & Media Approvals',
      count: attention.approvals?.count || 0,
      label: attention.approvals?.label || 'Gallery & avatar moderation required',
      route: attention.approvals?.route || '/verifications?tab=photos',
      icon: Camera,
      badgeVariant: 'royal',
      urgency: 'medium',
    },
    {
      id: 'withdrawals',
      title: 'Pending Withdrawals',
      count: attention.withdrawals?.count || 0,
      label: attention.withdrawals?.label || 'Provider payout batches awaiting authorization',
      route: attention.withdrawals?.route || '/withdrawals',
      icon: Banknote,
      badgeVariant: 'warning',
      urgency: 'high',
    },
    {
      id: 'disputes',
      title: 'Disputes & Refunds',
      count: attention.disputes?.count || 0,
      label: attention.disputes?.label || 'Booking disputes awaiting resolution',
      route: attention.disputes?.route || '/disputes',
      icon: AlertTriangle,
      badgeVariant: 'danger',
      urgency: 'medium',
    },
    {
      id: 'safety',
      title: 'Safety Incident Reports',
      count: attention.safety?.count || 0,
      label: attention.safety?.label || 'High priority field incidents reported',
      route: attention.safety?.route || '/safety',
      icon: ShieldAlert,
      badgeVariant: 'danger',
      urgency: 'critical',
    },
    {
      id: 'support',
      title: 'Open Support Tickets',
      count: attention.support?.count || 0,
      label: attention.support?.label || 'Unassigned customer & partner tickets',
      route: attention.support?.route || '/support',
      icon: LifeBuoy,
      badgeVariant: 'default',
      urgency: 'medium',
    },
  ]

  const totalActionItems = items.reduce((acc, curr) => acc + curr.count, 0)

  return (
    <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-royal-950">Needs Attention Queue</h2>
            <Badge variant="warning" size="sm" dot dotColor="bg-amber-500 font-bold">
              {totalActionItems} Actionable
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Real-time operational queue filtered to {marketName} market rules
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.id}
              to={item.route}
              className="group relative flex flex-col justify-between rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-royal-300 hover:bg-white hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-white border border-gray-100 text-royal-700 shadow-2xs group-hover:bg-royal-50 group-hover:text-royal-900">
                    <Icon className="size-4" />
                  </div>
                  <ArrowUpRight className="size-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-royal-600" />
                </div>

                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-royal-950">{item.count}</div>
                  <div className="mt-0.5 text-xs font-semibold text-gray-800">{item.title}</div>
                </div>
              </div>

              <div className="mt-3 border-t border-gray-200/60 pt-2 text-[11px] text-gray-500 line-clamp-1">
                {item.label}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
export default MarketNeedsAttention
