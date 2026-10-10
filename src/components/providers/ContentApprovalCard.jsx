import { Image, Images, User, ListChecks, Building2, ArrowRight } from 'lucide-react'
import { formatNumber } from '../../lib/format'

export default function ContentApprovalCard({ contentApproval, onReviewContent }) {
  if (!contentApproval) return null

  const items = [
    {
      id: 'profilePhotos',
      label: 'Profile Photos',
      count: contentApproval.profilePhotos,
      icon: Image,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      id: 'galleryPhotos',
      label: 'Gallery Photos',
      count: contentApproval.galleryPhotos,
      icon: Images,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      id: 'profileInfo',
      label: 'Profile Information',
      count: contentApproval.profileInfo,
      icon: User,
      color: 'text-[#5c2dd5]',
      bg: 'bg-purple-50',
    },
    {
      id: 'servicesDescriptions',
      label: 'Services / Descriptions',
      count: contentApproval.servicesDescriptions,
      icon: ListChecks,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      id: 'businessInfo',
      label: 'Business Information',
      count: contentApproval.businessInfo,
      icon: Building2,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
    },
  ]

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-[15px] font-bold text-[#1b1140]">Content Awaiting Approval</h2>
        <button
          type="button"
          onClick={onReviewContent}
          className="flex items-center gap-1 text-[12px] font-semibold text-[#5c2dd5] transition hover:text-[#4520a8]"
        >
          Review Content <ArrowRight className="size-3.5" />
        </button>
      </div>

      {/* 5 Content approval counts */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <div
              key={it.id}
              onClick={onReviewContent}
              className="flex cursor-pointer flex-col justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 transition hover:border-[#cfc5ee] hover:bg-white hover:shadow-xs"
            >
              <div className={`flex size-7 items-center justify-center rounded-lg ${it.bg}`}>
                <Icon className={`size-3.5 ${it.color}`} />
              </div>
              <div className="mt-2 text-[17px] font-extrabold text-[#1b1140]">
                {formatNumber(it.count)}
              </div>
              <div className="text-[10px] font-medium text-gray-500 line-clamp-1">
                {it.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

