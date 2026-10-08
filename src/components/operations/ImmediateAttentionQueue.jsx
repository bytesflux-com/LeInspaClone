import { useState } from 'react'
import { Link } from 'react-router'
import {
  AlertCircle,
  ArrowRight,
  SlidersHorizontal,
  MoreVertical,
} from 'lucide-react'
import CountryFlag from '../ui/CountryFlag'

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'finance', label: 'Finance' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'verification', label: 'Verification' },
  { id: 'safety', label: 'Safety' },
  { id: 'support', label: 'Support' },
  { id: 'system', label: 'System' },
]

export default function ImmediateAttentionQueue({
  items = [],
  activeFilter = 'all',
  onSelectFilter,
}) {
  const [showFiltersModal, setShowFiltersModal] = useState(false)

  // Filter items based on active tab
  const filtered = items.filter((item) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'critical') return item.priority === 'critical'
    if (activeFilter === 'high') return item.priority === 'high'
    return item.category === activeFilter
  })

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm min-w-0">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertCircle className="size-3.5" />
            </span>
            <h2 className="text-base font-bold text-gray-900">Needs Immediate Attention</h2>
          </div>
          <Link
            to="/operations/queue"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#5c2dd5] hover:text-[#4922ab] transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* Filter Tabs & More Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectFilter?.(tab.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#5c2dd5] text-white shadow-xs'
                      : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowFiltersModal((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 transition"
          >
            <SlidersHorizontal className="size-3 text-gray-500" />
            <span>More Filters</span>
          </button>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-purple-200">
          <table className="w-full min-w-[760px] xl:min-w-0 text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-400">
                <th className="py-3 pl-4 pr-3 xl:pl-5 xl:pr-4 font-medium">Priority</th>
                <th className="py-3 px-3 xl:px-4 2xl:px-5 font-medium">Issue</th>
                <th className="py-3 px-3 xl:px-4 2xl:px-5 font-medium">Market</th>
                <th className="py-3 px-3 xl:px-4 2xl:px-5 font-medium">Entity</th>
                <th className="py-3 px-3 xl:px-4 2xl:px-5 font-medium">Assigned To</th>
                <th className="py-3 px-3 xl:px-4 2xl:px-5 font-medium">Waiting</th>
                <th className="py-3 px-3 xl:px-4 2xl:px-5 font-medium">Status</th>
                <th className="py-3 pl-3 pr-4 xl:pl-4 xl:pr-5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => {
                const isCritical = item.priority === 'critical'

                return (
                  <tr key={item.id} className="hover:bg-purple-50/20 transition-colors">
                    {/* Priority */}
                    <td className="py-3.5 pl-4 pr-3 xl:pl-5 xl:pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2.5 rounded-full ${
                            isCritical ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                        />
                        <span
                          className={`font-bold capitalize text-xs ${
                            isCritical ? 'text-rose-600' : 'text-amber-600'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                    </td>

                    {/* Issue */}
                    <td className="py-3.5 px-3 xl:px-4 2xl:px-5 font-bold text-gray-900 whitespace-nowrap">
                      {item.issue}
                    </td>

                    {/* Market */}
                    <td className="py-3.5 px-3 xl:px-4 2xl:px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CountryFlag code={item.market} className="w-4.5 h-3" />
                        <span className="text-gray-700 font-medium">{item.marketName}</span>
                      </div>
                    </td>

                    {/* Entity */}
                    <td className="py-3.5 px-3 xl:px-4 2xl:px-5 text-gray-700 font-medium whitespace-nowrap">
                      {item.entity}
                    </td>

                    {/* Assigned To */}
                    <td className="py-3.5 px-3 xl:px-4 2xl:px-5 text-gray-600 whitespace-nowrap">
                      {item.assignedTo}
                    </td>

                    {/* Waiting */}
                    <td className="py-3.5 px-3 xl:px-4 2xl:px-5 text-gray-600 font-semibold tabular-nums whitespace-nowrap">
                      {item.waiting}
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-3 xl:px-4 2xl:px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold ${
                          item.status === 'New'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                            : item.status === 'Investigating'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-orange-50 text-orange-700 border border-orange-200/60'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Action Button + Menu */}
                    <td className="py-3.5 pl-3 pr-4 xl:pl-4 xl:pr-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={item.actionLink || '/operations'}
                          className="rounded-lg border border-purple-200 bg-purple-50/80 px-3 py-1 text-xs font-bold text-[#5c2dd5] shadow-2xs hover:bg-[#5c2dd5] hover:text-white transition-all"
                        >
                          {item.action || 'Review'}
                        </Link>
                        <button
                          type="button"
                          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                          title="More actions"
                        >
                          <MoreVertical className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
