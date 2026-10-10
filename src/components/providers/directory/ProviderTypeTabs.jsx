import { Users, User, Flower2, Building2 } from 'lucide-react'

export function ProviderTypeTabs({
  providerType = 'all',
  subcategory = 'all',
  typeCounts = { all: 24860, professionals: 20260, spa: 3820, hotel_resort: 780 },
  onSelectType,
  onSelectSubcategory,
}) {
  const cards = [
    {
      id: 'all',
      label: 'All Providers',
      count: typeCounts.all || 24860,
      icon: Users,
    },
    {
      id: 'professionals',
      label: 'Professionals',
      count: typeCounts.professionals || 20260,
      icon: User,
    },
    {
      id: 'spa',
      label: 'Spas & Wellness Centers',
      count: typeCounts.spa || 3820,
      icon: Flower2,
    },
    {
      id: 'hotel_resort',
      label: 'Hotels & Resorts',
      count: typeCounts.hotel_resort || 780,
      icon: Building2,
    },
  ]

  const professionalSubcategories = [
    { id: 'all', label: 'All Professionals' },
    { id: 'massage_therapist', label: 'Massage Therapists' },
    { id: 'fitness_trainer', label: 'Personal Trainers' },
    { id: 'physiotherapy', label: 'Physiotherapy & Recovery' },
    { id: 'yoga_specialist', label: 'Yoga Specialists' },
    { id: 'meditation_specialist', label: 'Meditation Specialists' },
  ]

  const showSubcategories = providerType === 'all' || providerType === 'professionals'

  return (
    <div className="space-y-3.5">
      {/* 4 Primary Entity Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon
          const isActive = providerType === card.id
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                onSelectType(card.id)
                if (card.id !== 'professionals' && card.id !== 'all') {
                  onSelectSubcategory('all')
                }
              }}
              className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all shadow-xs ${
                isActive
                  ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500 truncate">
                  {card.label}
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {Number(card.count).toLocaleString()}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Secondary Professional Category Filter Pills */}
      {showSubcategories && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {professionalSubcategories.map((sub) => {
            const isSubActive = subcategory === sub.id
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelectSubcategory(sub.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isSubActive
                    ? 'bg-purple-700 text-white shadow-xs font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {sub.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

