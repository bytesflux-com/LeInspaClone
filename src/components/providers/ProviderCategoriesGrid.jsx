import { Link } from 'react-router'
import {
  Sparkles,
  Dumbbell,
  Activity,
  Heart,
  Leaf,
  Flower2,
  Hotel,
  ArrowRight,
} from 'lucide-react'
import { formatNumber } from '../../lib/format'

export default function ProviderCategoriesGrid({ categories }) {
  if (!categories || categories.length === 0) return null

  const iconMap = {
    massage_therapist: { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
    fitness_trainer: { icon: Dumbbell, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    physiotherapy: { icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50' },
    yoga_specialist: { icon: Heart, color: 'text-purple-600', bg: 'bg-purple-50' },
    meditation_specialist: { icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    spa: { icon: Flower2, color: 'text-blue-600', bg: 'bg-blue-50' },
    hotel_resort: { icon: Hotel, color: 'text-slate-600', bg: 'bg-slate-50' },
  }

  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-[15px] font-bold text-[#1b1140]">Provider Categories</h2>
        <Link
          to="/providers/all"
          className="flex items-center gap-1 text-[12px] font-semibold text-[#5c2dd5] transition hover:text-[#4520a8]"
        >
          View All <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* Categories Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {categories.map((cat) => {
          const style = iconMap[cat.id] || {
            icon: Sparkles,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          }
          const Icon = style.icon

          return (
            <Link
              key={cat.id}
              to={`/providers/all?type=${cat.id}`}
              className="group flex flex-col justify-between rounded-xl border border-gray-100 bg-gray-50/40 p-3 transition hover:border-[#cfc5ee] hover:bg-white hover:shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`flex size-7 items-center justify-center rounded-lg ${style.bg}`}>
                    <Icon className={`size-3.5 ${style.color}`} />
                  </div>
                  <ArrowRight className="size-3.5 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#5c2dd5]" />
                </div>

                <div className="mt-2 text-[11.5px] font-semibold text-gray-600 line-clamp-1" title={cat.name}>
                  {cat.name}
                </div>
                <div className="mt-0.5 text-[18px] font-extrabold text-[#1b1140]">
                  {formatNumber(cat.total)}
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-[10.5px] font-medium text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>{formatNumber(cat.active)} Active</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

