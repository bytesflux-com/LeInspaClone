import { Users, ArrowUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatNumber } from '../../lib/utils'

const DEFAULT_CATEGORIES = [
  { name: 'Massage Therapists', percent: 38 },
  { name: 'Personal Trainers', percent: 36 },
  { name: 'Yoga Specialists', percent: 12 },
  { name: 'Meditation Specialists', percent: 8 },
  { name: 'Physiotherapists / Recovery', percent: 30 },
  { name: 'Spa & Wellness Centers', percent: 12 },
  { name: 'Hotels & Resorts', percent: 4 },
]

export default function ProviderNetwork({ providerNetwork }) {
  if (!providerNetwork) return null

  const total = providerNetwork.total ?? 2317
  const trend = providerNetwork.trend ?? '+9%'
  const period = providerNetwork.period ?? 'vs. last month'
  const categories = providerNetwork.categories || DEFAULT_CATEGORIES
  const pendingVerification = providerNetwork.pendingVerification ?? 214
  const suspended = providerNetwork.suspended ?? 36

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="size-5 text-[#5c2dd5]" />
          <h2 className="text-base font-bold text-gray-900">Provider Network</h2>
        </div>

        {/* Top Active Providers Count */}
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-2xl font-extrabold text-gray-900 tabular-nums">
              {formatNumber(total)}
            </div>
            <div className="text-xs text-gray-500 font-medium">Active Providers</div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <ArrowUp className="size-3.5" />
            <span>{trend}</span>
            <span className="text-[11px] text-gray-400 font-normal">{period}</span>
          </div>
        </div>

        {/* Category progress bars */}
        <div className="space-y-2.5">
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center gap-2 text-xs">
              <span className="w-40 truncate text-gray-600 font-medium">{cat.name}</span>
              <div className="flex-1 h-1.5 rounded-full bg-purple-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#5c2dd5] transition-all duration-500"
                  style={{ width: `${Math.min(100, cat.percent)}%` }}
                />
              </div>
              <span className="w-8 text-right text-gray-700 font-semibold tabular-nums text-[11px]">
                {cat.percent}%
              </span>
            </div>
          ))}
        </div>

        {/* Pending & Suspended footer boxes */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
          <div className="rounded-xl bg-gray-50/70 p-2.5">
            <p className="text-[11px] text-gray-500 font-medium">Pending Verification</p>
            <p className="text-base font-extrabold text-gray-900 tabular-nums">
              {formatNumber(pendingVerification)}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50/70 p-2.5">
            <p className="text-[11px] text-gray-500 font-medium">Suspended</p>
            <p className="text-base font-extrabold text-rose-600 tabular-nums">
              {formatNumber(suspended)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2 text-center">
        <Link
          to="/providers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5c2dd5] hover:text-[#4922ab] transition-colors"
        >
          <span>Manage Providers</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}
