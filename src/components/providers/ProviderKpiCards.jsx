import { Users, CheckCircle2, Clock, TrendingUp, Ban, Wifi } from 'lucide-react'
import { formatNumber } from '../../lib/format'

export default function ProviderKpiCards({ kpis }) {
  if (!kpis) return null

  const cards = [
    {
      id: 'total',
      title: 'Total Providers',
      value: kpis.totalProviders,
      trend: kpis.totalProvidersTrend,
      vs: kpis.totalProvidersVs,
      trendPositive: true,
      icon: Users,
      iconBg: 'bg-[#5c2dd5]/10',
      iconColor: 'text-[#5c2dd5]',
    },
    {
      id: 'active',
      title: 'Active Providers',
      value: kpis.activeProviders,
      trend: kpis.activeProvidersTrend,
      vs: kpis.activeProvidersVs,
      trendPositive: true,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'pending',
      title: 'Pending Verification',
      value: kpis.pendingVerification,
      trend: kpis.pendingVerificationTrend,
      vs: kpis.pendingVerificationVs,
      trendPositive: false,
      icon: Clock,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
    },
    {
      id: 'new',
      title: 'New Providers',
      value: kpis.newProviders,
      trend: kpis.newProvidersTrend,
      vs: kpis.newProvidersVs,
      trendPositive: true,
      icon: TrendingUp,
      iconBg: 'bg-indigo-500/10',
      iconColor: 'text-indigo-600',
    },
    {
      id: 'suspended',
      title: 'Suspended',
      value: kpis.suspended,
      trend: kpis.suspendedTrend,
      vs: kpis.suspendedVs,
      trendPositive: false,
      icon: Ban,
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-600',
    },
    {
      id: 'available',
      title: 'Available Now',
      value: kpis.availableNow,
      trend: kpis.availableNowTrend,
      vs: kpis.availableNowVs,
      trendPositive: true,
      icon: Wifi,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs transition hover:border-[#cfc5ee] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-gray-500">{card.title}</span>
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
                <Icon className={`size-4 ${card.iconColor}`} />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[22px] font-bold tracking-tight text-[#1b1140]">
                {formatNumber(card.value)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px]">
                <span
                  className={`font-semibold ${
                    card.trendPositive ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  ▲ {card.trend}
                </span>
                <span className="text-gray-400">{card.vs}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

