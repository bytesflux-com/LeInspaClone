import { UserCheck, Users, Sparkles, Award, ShieldAlert, Clock, UserPlus } from 'lucide-react'
import Badge from '../../ui/Badge'

export function MarketEcosystemBreakdown({ providerNetwork, clientNetwork, marketName = 'Kenya' }) {
  if (!providerNetwork || !clientNetwork) return null

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Provider Ecosystem Card */}
      <div className="flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="size-4.5 text-royal-700" />
              <h3 className="text-base font-bold text-royal-950">Provider Network & Lifecycle</h3>
            </div>
            <Badge variant="royal">
              {providerNetwork.total?.toLocaleString('en-US')} Total Providers
            </Badge>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Specialty distribution and lifecycle statuses in {marketName}
          </p>

          {/* Specialty Breakdown */}
          <div className="mt-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Breakdown by Specialty</h4>
            {providerNetwork.bySpecialty?.map((spec) => (
              <div key={spec.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-gray-700">{spec.name}</span>
                  <span className="text-royal-950 font-bold">
                    {spec.count?.toLocaleString('en-US')} ({spec.percent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${spec.percent}%`, backgroundColor: spec.color || '#5c2dd5' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Provider Lifecycle Grid */}
        <div className="mt-6 border-t border-gray-100 pt-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Lifecycle Status</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-2.5">
              <div className="font-bold text-emerald-900 text-sm">{providerNetwork.lifecycle?.active?.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Verified Active</div>
            </div>
            <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-2.5">
              <div className="font-bold text-amber-900 text-sm">{providerNetwork.lifecycle?.pending?.toLocaleString()}</div>
              <div className="text-[11px] text-amber-700 font-medium mt-0.5">Pending Review</div>
            </div>
            <div className="rounded-xl bg-rose-50/70 border border-rose-100 p-2.5">
              <div className="font-bold text-rose-900 text-sm">{providerNetwork.lifecycle?.suspended?.toLocaleString()}</div>
              <div className="text-[11px] text-rose-700 font-medium mt-0.5">Suspended</div>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-200/80 p-2.5">
              <div className="font-bold text-gray-800 text-sm">{providerNetwork.lifecycle?.inactive?.toLocaleString()}</div>
              <div className="text-[11px] text-gray-500 font-medium mt-0.5">Dormant</div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Ecosystem & Membership Tiers Card */}
      <div className="flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="size-4.5 text-royal-700" />
              <h3 className="text-base font-bold text-royal-950">Client Ecosystem & Retention</h3>
            </div>
            <Badge variant="success">
              {clientNetwork.total?.toLocaleString('en-US')} Active Clients
            </Badge>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Membership tier distribution and retention telemetry in {marketName}
          </p>

          {/* Retention Quick Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <UserPlus className="size-3.5 text-blue-600" />
                New Clients (30d)
              </div>
              <div className="mt-1 text-xl font-bold text-royal-950">
                {clientNetwork.newClients?.toLocaleString('en-US')}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <Sparkles className="size-3.5 text-amber-500" />
                Repeat Booking Rate
              </div>
              <div className="mt-1 text-xl font-bold text-emerald-700">
                {clientNetwork.returningPercentage}%
              </div>
            </div>
          </div>

          {/* Membership Tier Breakdown */}
          <div className="mt-5 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Membership Tiers</h4>
            {clientNetwork.tiers?.map((tier) => (
              <div key={tier.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-gray-700 flex items-center gap-1.5">
                    <Award className="size-3.5 text-amber-500" />
                    {tier.name} Tier
                  </span>
                  <span className="text-royal-950 font-bold">
                    {tier.count?.toLocaleString('en-US')} ({tier.percent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${tier.percent}%`, backgroundColor: tier.color || '#5c2dd5' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-3 text-[11px] text-gray-400 flex items-center justify-between">
          <span>Client retention benchmarked against East Africa regional standard</span>
          <span className="font-semibold text-royal-700">92% Satisfaction SLA</span>
        </div>
      </div>
    </div>
  )
}
export default MarketEcosystemBreakdown
