import { Link } from 'react-router'
import {
  FileCheck,
  Image,
  ShieldAlert,
  UserCheck,
  CreditCard,
  ArrowRight,
  Info,
} from 'lucide-react'
import { formatNumber } from '../../lib/format'

export default function NeedsAttentionQueue({ attention }) {
  if (!attention || attention.length === 0) return null

  const iconMap = {
    verification_queue: { icon: FileCheck, bg: 'bg-amber-500/10', color: 'text-amber-600', border: 'border-amber-200' },
    profile_photo_approvals: { icon: Image, bg: 'bg-amber-500/10', color: 'text-amber-600', border: 'border-amber-200' },
    safety_compliance: { icon: ShieldAlert, bg: 'bg-rose-500/10', color: 'text-rose-600', border: 'border-rose-200' },
    provider_account_reviews: { icon: UserCheck, bg: 'bg-amber-500/10', color: 'text-amber-600', border: 'border-amber-200' },
    withdrawal_requests: { icon: CreditCard, bg: 'bg-[#5c2dd5]/10', color: 'text-[#5c2dd5]', border: 'border-purple-200' },
  }

  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold text-[#1b1140]">Needs Your Attention</h2>
          <span className="flex size-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {attention.length}
          </span>
          <Info className="size-3.5 text-gray-400" />
        </div>
        <Link
          to="/attention"
          className="flex items-center gap-1 text-[12px] font-semibold text-[#5c2dd5] transition hover:text-[#4520a8]"
        >
          View All <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* Grid of 5 operational cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {attention.map((item) => {
          const style = iconMap[item.id] || {
            icon: FileCheck,
            bg: 'bg-amber-500/10',
            color: 'text-amber-600',
            border: 'border-amber-200',
          }
          const Icon = style.icon

          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition hover:border-[#cfc5ee] hover:bg-white hover:shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`flex size-7 items-center justify-center rounded-lg ${style.bg}`}>
                    <Icon className={`size-3.5 ${style.color}`} />
                  </div>
                </div>

                <div className="mt-2 text-[12px] font-bold text-[#1b1140] line-clamp-1" title={item.title}>
                  {item.title}
                </div>
                <div className="mt-1 text-[18px] font-extrabold text-[#1b1140]">
                  {formatNumber(item.count)}
                </div>
                <p className="mt-0.5 text-[10.5px] leading-tight text-gray-500 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100">
                <Link
                  to={item.link}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5c2dd5] transition hover:text-[#4520a8]"
                >
                  {item.actionLabel} <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

