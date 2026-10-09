import { CreditCard, Banknote, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, Cpu } from 'lucide-react'
import Badge from '../../ui/Badge'
import { formatCompactCurrency } from '../../../lib/currency.js'

export function MarketPaymentsAndWithdrawals({ paymentsAndWithdrawals, marketName = 'Kenya', currency = 'KES' }) {
  if (!paymentsAndWithdrawals) return null

  const { rails = [], withdrawalsPipeline } = paymentsAndWithdrawals

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Market Payment Rails Performance */}
      <div className="flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4.5 text-royal-700" />
              <h3 className="text-base font-bold text-royal-950">Market Payment Rails Telemetry</h3>
            </div>
            <Badge variant="success">All Gateways Active</Badge>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Sovereign payment gateway performance & transaction success in {marketName}
          </p>

          {/* Payment Rails Table */}
          <div className="mt-4 space-y-3">
            {rails.map((rail) => (
              <div key={rail.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-white border border-gray-200 text-royal-800 font-bold text-xs shadow-2xs">
                      <Cpu className="size-4 text-royal-600" />
                    </div>
                    <div>
                      <div className="font-bold text-royal-950 text-xs">{rail.name}</div>
                      <div className="text-[11px] text-gray-400">{rail.type}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-emerald-700 text-xs">{rail.successRate}% Success</div>
                    <div className="text-[11px] font-mono text-gray-500">
                      {formatCompactCurrency(rail.volume, currency)} ({rail.transactions} txns)
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        rail.successRate >= 96 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${rail.successRate}%` }}
                    />
                  </div>
                  <Badge variant={rail.status === 'Operational' ? 'success' : 'warning'} size="sm">
                    {rail.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Provider Withdrawal Pipeline */}
      <div className="flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Banknote className="size-4.5 text-royal-700" />
              <h3 className="text-base font-bold text-royal-950">Provider Withdrawal Pipeline</h3>
            </div>
            <Badge variant="warning">
              {withdrawalsPipeline?.pendingApproval} Pending Review
            </Badge>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Real-time provider payout execution in {marketName}
          </p>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
              <div className="text-[11px] text-gray-500 font-medium">Submitted Today</div>
              <div className="mt-1 text-lg font-bold text-royal-950">
                {withdrawalsPipeline?.todaySubmitted}
              </div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-center">
              <div className="text-[11px] text-amber-800 font-medium">Pending Approval</div>
              <div className="mt-1 text-lg font-bold text-amber-950">
                {withdrawalsPipeline?.pendingApproval}
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-center">
              <div className="text-[11px] text-blue-800 font-medium">Processing</div>
              <div className="mt-1 text-lg font-bold text-blue-950">
                {withdrawalsPipeline?.processing}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-center">
              <div className="text-[11px] text-emerald-800 font-medium">Completed Today</div>
              <div className="mt-1 text-lg font-bold text-emerald-950">
                {withdrawalsPipeline?.completedToday}
              </div>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-center">
              <div className="text-[11px] text-rose-800 font-medium">Failed / Bounced</div>
              <div className="mt-1 text-lg font-bold text-rose-950">
                {withdrawalsPipeline?.failedToday}
              </div>
            </div>

            <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-center">
              <div className="text-[11px] text-purple-800 font-medium">Pending Queue Vol</div>
              <div className="mt-1 text-xs font-bold text-purple-950 font-mono">
                {formatCompactCurrency(withdrawalsPipeline?.totalPendingAmount, currency)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-3 text-[11px] text-gray-400 flex items-center justify-between">
          <span>Automated fraud & KYC checks enforced prior to payout dispatch</span>
          <ShieldCheck className="size-3.5 text-emerald-600" />
        </div>
      </div>
    </div>
  )
}
export default MarketPaymentsAndWithdrawals
