export function QuickStatusTabs({
  status = 'all',
  statusCounts = { all: 24860, active: 21420, pending: 428, under_review: 310, suspended: 64, inactive: 2638 },
  onSelectStatus,
}) {
  const tabs = [
    {
      id: 'all',
      label: 'All',
      count: statusCounts.all,
      dotColor: null,
    },
    {
      id: 'active',
      label: 'Active',
      count: statusCounts.active,
      dotColor: 'bg-emerald-500',
    },
    {
      id: 'pending',
      label: 'Pending Verification',
      count: statusCounts.pending,
      dotColor: 'bg-amber-500',
    },
    {
      id: 'under_review',
      label: 'Under Review',
      count: statusCounts.under_review,
      dotColor: 'bg-indigo-500',
    },
    {
      id: 'suspended',
      label: 'Suspended',
      count: statusCounts.suspended,
      dotColor: 'bg-rose-500',
    },
    {
      id: 'inactive',
      label: 'Inactive',
      count: statusCounts.inactive,
      dotColor: 'bg-slate-400',
    },
  ]

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = status === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectStatus(tab.id)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-purple-700 text-white font-semibold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.dotColor && (
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${tab.dotColor} ${
                  isActive ? 'ring-2 ring-white/50' : ''
                }`}
              />
            )}
            <span>{tab.label}</span>
            <span
              className={`text-xs ml-0.5 ${
                isActive ? 'text-purple-200 font-semibold' : 'text-slate-400 font-normal'
              }`}
            >
              ({Number(tab.count || 0).toLocaleString()})
            </span>
          </button>
        )
      })}
    </div>
  )
}

