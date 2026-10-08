import { History, Zap, HelpCircle, Search, ArrowRight, ShieldAlert, Scale, Banknote, BadgeCheck } from 'lucide-react'
import { Link } from 'react-router'

/* 1. RECENT SEARCHES CARD */
export function RecentSearchesCard({ items = [], onSelectRecent, onClearRecent }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-4.5 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
        <div className="flex items-center gap-2">
          <History className="size-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-950">Recent Searches</h3>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearRecent}
            className="text-[11px] font-bold text-[#5c2dd5] hover:text-[#4922ab] transition cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-50 text-xs">
        {items.length === 0 ? (
          <p className="py-3 text-xs text-gray-400 text-center italic">No recent searches</p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectRecent(item.query)}
              className="w-full flex items-center justify-between py-2 px-1.5 -mx-1.5 rounded-lg text-left hover:bg-purple-50/40 transition group cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <History className="size-3 text-gray-400 group-hover:text-[#5c2dd5] transition-colors shrink-0" />
                <span className="font-semibold text-gray-700 group-hover:text-gray-950 truncate">
                  {item.query}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 shrink-0">{item.timeAgo}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

/* 2. QUICK ACCESS CARD */
export function QuickAccessCard() {
  const quickLinks = [
    { label: 'Pending Withdrawals', count: 7, icon: Banknote, color: 'text-amber-600', link: '/withdrawals' },
    { label: 'Pending Verifications', count: 18, icon: BadgeCheck, color: 'text-[#5c2dd5]', link: '/verifications' },
    { label: 'Open Disputes', count: 3, icon: Scale, color: 'text-rose-600', link: '/disputes' },
    { label: 'Safety Reports', count: 2, icon: ShieldAlert, color: 'text-rose-600', link: '/safety' },
  ]

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-4.5 shadow-2xs">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-2">
        <Zap className="size-4 text-amber-500 fill-amber-500" />
        <h3 className="text-sm font-bold text-gray-950">Quick Access</h3>
      </div>

      <div className="space-y-1.5 text-xs">
        {quickLinks.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.label}
              to={item.link}
              className="flex items-center justify-between p-2 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-purple-50/50 hover:border-purple-200 transition group"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-6 items-center justify-center rounded-lg bg-white shadow-2xs">
                  <Icon className={`size-3.5 ${item.color}`} />
                </span>
                <span className="font-bold text-gray-800 group-hover:text-gray-950 text-xs">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-black text-gray-900 tabular-nums text-xs">{item.count}</span>
                <ArrowRight className="size-3 text-gray-400 group-hover:text-[#5c2dd5] transition-colors" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* 3. SEARCH TIPS CARD */
export function SearchTipsCard() {
  const tips = [
    'Search by name, phone, email, ID or reference number.',
    'Use exact IDs (e.g. LI-48291, WD-82914) for faster results.',
    'Results are filtered by your selected market.',
    'Suspended accounts are searchable (for authorized admins).',
    'Use filters to narrow down results.',
  ]

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-4.5 shadow-2xs">
      <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100 mb-2.5">
        <HelpCircle className="size-4 text-[#5c2dd5]" />
        <h3 className="text-sm font-bold text-gray-950">Search Tips</h3>
      </div>

      <ul className="space-y-2 text-xs text-gray-600">
        {tips.map((tip, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="size-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
            <span className="leading-relaxed">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* 4. SEARCH PROMOTION BANNER */
export function SearchPromotionBanner() {
  return (
    <div className="rounded-2xl border border-purple-200/70 bg-linear-to-br from-purple-50 via-white to-purple-100/40 p-4.5 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#5c2dd5] text-white shadow-xs shrink-0">
          <Search className="size-4.5" />
        </div>
        <div>
          <h4 className="text-xs font-black text-gray-950">Find anything. Faster.</h4>
          <p className="text-[11px] text-gray-500 mt-0.5">
            One search. Every record. Across Lé Inspa.
          </p>
        </div>
      </div>
    </div>
  )
}

