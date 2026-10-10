import { Link } from 'react-router'
import { CreditCard, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Lock } from 'lucide-react'
import { formatNumber } from '../../lib/format'
import { usePermissions } from '../../hooks/usePermissions'
import { PERMISSIONS } from '../../constants/permissions'

export default function ProviderSubscriptionsCard({ subscriptions }) {
  const { can } = usePermissions()
  const canSeeFinance = can(PERMISSIONS.FINANCE_VIEW) || can(PERMISSIONS.PAYMENTS_VIEW)

  if (!subscriptions) return null

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="size-4 text-[#5c2dd5]" />
          <h2 className="text-[15px] font-bold text-[#1b1140]">Provider Subscriptions</h2>
        </div>
        <Link
          to="/providers/subscriptions"
          className="flex items-center gap-1 text-[12px] font-semibold text-[#5c2dd5] transition hover:text-[#4520a8]"
        >
          View Subscriptions <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-2.5">
          <span className="text-[10.5px] font-medium text-emerald-800">Active</span>
          <div className="mt-1 text-[16px] font-extrabold text-emerald-900">
            {formatNumber(subscriptions.active)}
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-2.5">
          <span className="text-[10.5px] font-medium text-amber-800">Expiring Soon</span>
          <div className="mt-1 text-[16px] font-extrabold text-amber-900">
            {formatNumber(subscriptions.expiringSoon)}
          </div>
        </div>

        <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-2.5">
          <span className="text-[10.5px] font-medium text-rose-800">Payment Failed</span>
          <div className="mt-1 text-[16px] font-extrabold text-rose-900">
            {formatNumber(subscriptions.paymentFailed)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
          <span className="text-[10.5px] font-medium text-slate-600">Inactive</span>
          <div className="mt-1 text-[16px] font-extrabold text-slate-800">
            {formatNumber(subscriptions.inactive)}
          </div>
        </div>
      </div>

      {/* Financial row */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-[11px]">
        <span className="text-gray-500">Subscription Revenue</span>
        <div className="flex items-center gap-1.5 font-bold text-[#1b1140]">
          {canSeeFinance ? (
            <span>{subscriptions.revenueCompact}</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-gray-400">
              <Lock className="size-3" /> Restricted
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

