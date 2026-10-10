import {
  ShieldCheck,
  UserCheck,
  CreditCard,
  CalendarCheck,
  Star,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

export function ProviderHealthCards({ health = {}, onSelectTab }) {
  const cards = [
    {
      id: 'verification',
      label: 'Verification',
      value: health.verification || 'Verified',
      subtext: 'Identity & credentials',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      valueColor: 'text-emerald-700',
      tabTarget: 'verification',
    },
    {
      id: 'account',
      label: 'Account',
      value: health.account || 'Active',
      subtext: 'Account standing',
      icon: UserCheck,
      iconBg: 'bg-purple-50 text-purple-600',
      valueColor:
        health.account === 'Active'
          ? 'text-emerald-700'
          : health.account === 'Suspended'
          ? 'text-rose-700'
          : 'text-amber-700',
      tabTarget: 'overview',
    },
    {
      id: 'subscription',
      label: 'Subscription',
      value: health.subscription || 'Active',
      subtext: 'Paid & current',
      icon: CreditCard,
      iconBg: 'bg-emerald-50 text-emerald-600',
      valueColor: 'text-emerald-700',
      tabTarget: 'subscription',
    },
    {
      id: 'bookings',
      label: 'Bookings',
      value: health.bookings ?? 284,
      subtext: `${health.upcomingBookings ?? 12} upcoming`,
      icon: CalendarCheck,
      iconBg: 'bg-purple-50 text-purple-600',
      valueColor: 'text-slate-900',
      tabTarget: 'bookings',
    },
    {
      id: 'rating',
      label: 'Rating',
      value: health.rating ?? '4.9',
      subtext: `${health.reviews ?? 126} reviews`,
      icon: Star,
      iconBg: 'bg-amber-50 text-amber-500 fill-amber-400',
      valueColor: 'text-slate-900',
      tabTarget: 'reviews',
    },
    {
      id: 'issues',
      label: 'Open issues',
      value: health.openIssues ?? 0,
      subtext: health.openIssuesSubtitle || 'No active cases',
      icon: AlertTriangle,
      iconBg:
        (health.openIssues ?? 0) > 0
          ? 'bg-rose-50 text-rose-600'
          : 'bg-slate-100 text-slate-500',
      valueColor:
        (health.openIssues ?? 0) > 0 ? 'text-rose-700' : 'text-slate-900',
      tabTarget: 'support',
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
            className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-purple-300 hover:shadow-xs transition text-left group"
          >
            <div
              className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg} group-hover:scale-105 transition-transform`}
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500 truncate">
                {card.label}
              </p>
              <p className={`text-base font-bold truncate ${card.valueColor}`}>
                {card.value}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {card.subtext}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

