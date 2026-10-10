import {
  Layers,
  PauseCircle,
  Clock,
  Sparkles,
  ArrowDown,
  ArrowUp,
  Gem,
} from 'lucide-react'

export function ServicesSummaryKpiCards({ stats = {}, onSelectTab }) {
  const cards = [
    {
      id: 'active',
      title: 'Active Services',
      value: stats.activeCount ?? 6,
      trend: '+20% vs last month',
      trendColor: 'text-emerald-600',
      icon: Layers,
      iconBg: 'bg-emerald-50 text-emerald-600',
      tabTarget: 'active',
    },
    {
      id: 'inactive',
      title: 'Inactive Services',
      value: stats.inactiveCount ?? 1,
      trend: '— 0% vs last month',
      trendColor: 'text-slate-400',
      icon: PauseCircle,
      iconBg: 'bg-rose-50 text-rose-600',
      tabTarget: 'inactive',
    },
    {
      id: 'pending',
      title: 'Pending Review',
      value: stats.pendingReviewCount ?? 2,
      trend: '+2 requires attention',
      trendColor: 'text-amber-600',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600',
      tabTarget: 'pending_review',
    },
    {
      id: 'avg_price',
      title: 'Average Price',
      value: stats.averagePriceFormatted || 'KES 4,250',
      trend: 'Calculated average',
      trendColor: 'text-slate-400',
      icon: Gem,
      iconBg: 'bg-purple-50 text-purple-600',
      tabTarget: 'all',
    },
    {
      id: 'min_price',
      title: 'Lowest Price',
      value: stats.lowestPriceFormatted || 'KES 3,000',
      trend: 'Entry level pricing',
      trendColor: 'text-slate-400',
      icon: ArrowDown,
      iconBg: 'bg-blue-50 text-blue-600',
      tabTarget: 'all',
    },
    {
      id: 'max_price',
      title: 'Highest Price',
      value: stats.highestPriceFormatted || 'KES 6,500',
      trend: 'Premium package',
      trendColor: 'text-slate-400',
      icon: ArrowUp,
      iconBg: 'bg-rose-50 text-rose-600',
      tabTarget: 'all',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectTab?.(card.tabTarget)}
            className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-purple-300 hover:shadow-xs transition text-left group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-semibold text-slate-500 truncate">
                {card.title}
              </span>
              <div
                className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg} group-hover:scale-105 transition-transform`}
              >
                <Icon className="size-4" />
              </div>
            </div>

            <div className="mt-2">
              <p className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {card.value}
              </p>
              <p className={`text-[10px] font-semibold mt-0.5 truncate ${card.trendColor}`}>
                {card.trend}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

