import { CreditCard, CheckCircle2, ChevronRight, Calendar } from 'lucide-react'

export function SubscriptionCard({
  profile,
  onViewSubscription,
}) {
  if (!profile) return null

  const sub = profile.subscription || {}

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CreditCard className="size-4" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Subscription</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="size-1 rounded-full bg-emerald-500" />
                {sub.status || 'Active'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewSubscription}
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-purple-700 hover:text-purple-900"
          >
            <span>View Subscription</span>
            <ChevronRight className="size-3" />
          </button>
        </div>

        {/* Subscription Info Grid */}
        <div className="mt-3 divide-y divide-slate-50 text-xs py-1 space-y-2">
          {/* Plan */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 font-medium">Plan</span>
            <span className="font-bold text-slate-900">
              {sub.plan || profile.subscriptionPlan || 'Professional Plan'}
            </span>
          </div>

          {/* Current Period */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 font-medium">Current Period</span>
            <span className="font-medium text-slate-800">
              {sub.currentPeriod || '12 Sep – 12 Oct 2026'}
            </span>
          </div>

          {/* Next Renewal */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 font-medium">Next Renewal</span>
            <span className="font-semibold text-purple-900">
              {sub.nextRenewal || profile.subscriptionRenewal || '12 Oct 2026'}
            </span>
          </div>

          {/* Payment Status */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 font-medium">Payment Status</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span>{sub.paymentStatus || 'Paid'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={onViewSubscription}
          className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 transition py-1.5 rounded-lg hover:bg-purple-50"
        >
          <span>Manage Provider Subscription</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

