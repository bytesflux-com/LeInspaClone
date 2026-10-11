import { Check, Clock, AlertCircle } from 'lucide-react'

/**
 * ADM-031: ReviewComponentTabs
 * Horizontal pill selector dynamically adapting to provider type.
 */
export default function ReviewComponentTabs({
  tabs = [],
  activeTabId,
  onSelectTab,
}) {
  const defaultTabs = [
    { id: 'IDENTITY', label: 'Identity Verification', status: 'APPROVED', badgeCount: 0 },
    { id: 'CREDENTIALS', label: 'Professional Credentials', status: 'REVIEWING_NOW', badgeCount: 1 },
    { id: 'PROFILE', label: 'Profile Information', status: 'PENDING', badgeCount: 0 },
    { id: 'DOCUMENTS', label: 'Required Documents', status: 'PENDING', badgeCount: 0 },
    { id: 'FINAL', label: 'Final Verification', status: 'PENDING', badgeCount: 0 },
  ]

  const displayTabs = tabs.length > 0 ? tabs : defaultTabs

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {displayTabs.map((tab) => {
        const isActive = tab.id === activeTabId
        const isApproved = tab.status === 'APPROVED'
        const isReviewing = tab.status === 'REVIEWING_NOW'

        let pillClasses = 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'

        if (isActive) {
          pillClasses = 'bg-[#6D28D9] text-white border-transparent shadow-xs ring-2 ring-purple-600/20'
        } else if (isApproved) {
          pillClasses = 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80'
        }

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab?.(tab.id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${pillClasses}`}
          >
            {/* Status indicator */}
            {isApproved && (
              <span className="flex size-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Check className="size-2.5 stroke-[3]" />
              </span>
            )}
            {isReviewing && !isApproved && (
              <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
            )}
            {!isApproved && !isReviewing && (
              <span className="size-1.5 rounded-full bg-slate-300" />
            )}

            {/* Label */}
            <span>
              {tab.label}
              {isApproved && ' (Approved)'}
              {isReviewing && ' (Reviewing Now)'}
              {!isApproved && !isReviewing && ' (Pending)'}
            </span>

            {/* Notification / Count Badge */}
            {tab.badgeCount > 0 && (
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                  isActive
                    ? 'bg-rose-500 text-white'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {tab.badgeCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
