import {
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  CalendarCheck,
  Wallet,
  CreditCard,
  Star,
  LifeBuoy,
  History,
} from 'lucide-react'

export const PROFILE_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'verification', label: 'Verification', icon: ShieldCheck },
  { id: 'services', label: 'Services', icon: Sparkles },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'support', label: 'Support & Safety', icon: LifeBuoy },
  { id: 'activity', label: 'Activity', icon: History },
]

export function ProviderNavTabs({ activeTab, onSelectTab }) {
  return (
    <div className="border-b border-slate-200 bg-white rounded-t-xl px-2 sm:px-4 overflow-x-auto [scrollbar-width:none]">
      <nav className="flex space-x-1 sm:space-x-2 min-w-max" aria-label="Provider Tabs">
        {PROFILE_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                isActive
                  ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon
                className={`size-4 ${
                  isActive ? 'text-purple-600' : 'text-slate-400'
                }`}
              />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

