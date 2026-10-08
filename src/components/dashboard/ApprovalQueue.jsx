import { FileCheck, ArrowRight, Image, Film, UserCheck, Award } from 'lucide-react'
import { Link } from 'react-router'
import { formatNumber } from '../../lib/utils'

export default function ApprovalQueue({ approvals }) {
  if (!approvals) return null

  const items = [
    {
      label: 'Profile Photos',
      count: approvals.profilePhotos ?? 12,
      icon: Image,
      badgeColor: 'bg-purple-100 text-[#5c2dd5]',
    },
    {
      label: 'Gallery Media',
      count: approvals.galleryMedia ?? 8,
      icon: Film,
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Profile Changes',
      count: approvals.profileChanges ?? 5,
      icon: UserCheck,
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Credentials',
      count: approvals.credentials ?? 14,
      icon: Award,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
  ]

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all duration-200">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#5c2dd5] shadow-2xs">
              <FileCheck className="size-4" />
            </span>
            <h2 className="text-sm font-bold text-gray-950">Approval Queue</h2>
          </div>
          <Link
            to="/verifications"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5c2dd5] hover:text-[#4922ab] bg-purple-50/60 hover:bg-purple-100/80 px-2 py-0.5 rounded-md transition-colors"
          >
            <span>Open Approval Center</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* 2x2 Grid of Aligned Moderation Tiles */}
        <div className="grid grid-cols-2 gap-2.5">
          {items.map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.label}
                className="flex flex-col justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-purple-50/40 hover:border-purple-200/60 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className="size-3.5 text-gray-500 shrink-0" />
                  <span className="text-xs font-bold text-gray-700 truncate">{item.label}</span>
                </div>

                <div className="flex items-baseline justify-between gap-1 pt-1 border-t border-gray-200/50">
                  <span className="text-xl font-black text-rose-600 tabular-nums">
                    {formatNumber(item.count)}
                  </span>
                  <span className="rounded-md bg-rose-50 border border-rose-200/60 px-1.5 py-0.2 text-[10px] font-bold text-rose-700">
                    Pending
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
        <span>Total Pending: 39 reviews</span>
        <Link
          to="/verifications"
          className="font-bold text-[#5c2dd5] hover:underline"
        >
          Review All →
        </Link>
      </div>
    </div>
  )
}
