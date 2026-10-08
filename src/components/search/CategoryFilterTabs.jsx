export default function CategoryFilterTabs({ activeCategory = 'all', onSelectCategory, counts = {} }) {
  const tabs = [
    { id: 'all', label: 'All', count: counts.all ?? 0 },
    { id: 'clients', label: 'Clients', count: counts.clients ?? 0 },
    { id: 'providers', label: 'Providers', count: counts.providers ?? 0 },
    { id: 'spas', label: 'Spas', count: counts.spas ?? 0 },
    { id: 'hotels', label: 'Hotels & Resorts', count: counts.hotels ?? 0 },
    { id: 'bookings', label: 'Bookings', count: counts.bookings ?? 0 },
    { id: 'payments', label: 'Payments', count: counts.payments ?? 0 },
    { id: 'withdrawals', label: 'Withdrawals', count: counts.withdrawals ?? 0 },
    { id: 'disputes', label: 'Disputes', count: counts.disputes ?? 0 },
    { id: 'support', label: 'Support', count: counts.support ?? 0 },
  ]

  return (
    <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-purple-200">
      <div className="flex items-center gap-2 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeCategory === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectCategory(tab.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#5c2dd5] text-white shadow-xs'
                  : 'bg-white border border-gray-200/80 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-extrabold tabular-nums ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

