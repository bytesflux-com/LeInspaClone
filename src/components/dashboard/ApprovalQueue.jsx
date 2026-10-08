import { FileCheck, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatNumber } from '../../lib/utils'

export default function ApprovalQueue({ approvals }) {
  if (!approvals) return null

  const items = [
    {
      label: 'Profile Photos',
      count: approvals.profilePhotos ?? 12,
    },
    {
      label: 'Gallery Media',
      count: approvals.galleryMedia ?? 8,
    },
    {
      label: 'Profile Changes',
      count: approvals.profileChanges ?? 5,
    },
    {
      label: 'Credentials',
      count: approvals.credentials ?? 14,
    },
  ]

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileCheck className="size-5 text-[#5c2dd5]" />
          <h2 className="text-base font-bold text-gray-900">Approval Queue</h2>
        </div>
        <Link
          to="/verifications"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#5c2dd5] hover:text-[#4922ab] transition-colors"
        >
          <span>Open Approval Center</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col">
            <span className="text-xs text-gray-600 font-medium">{item.label}</span>
            <span className="text-2xl font-black text-rose-500 tabular-nums my-1">
              {formatNumber(item.count)}
            </span>
            <span className="text-xs text-gray-400 font-medium">Pending</span>
          </div>
        ))}
      </div>
    </div>
  )
}
