import { useMarketDashboard } from '../../hooks/useMarketDashboard'
import PageContainer from '../../components/layout/PageContainer'
import MarketHeaderStatus from '../../components/dashboard/market/MarketHeaderStatus'
import MarketKPIs from '../../components/dashboard/market/MarketKPIs'
import MarketNeedsAttention from '../../components/dashboard/market/MarketNeedsAttention'
import MarketHealthAndChart from '../../components/dashboard/market/MarketHealthAndChart'
import MarketEcosystemBreakdown from '../../components/dashboard/market/MarketEcosystemBreakdown'
import CitiesRegionsTable from '../../components/dashboard/market/CitiesRegionsTable'
import MarketBookingsAndFinance from '../../components/dashboard/market/MarketBookingsAndFinance'
import MarketPaymentsAndWithdrawals from '../../components/dashboard/market/MarketPaymentsAndWithdrawals'
import MarketTrustSafetySupport from '../../components/dashboard/market/MarketTrustSafetySupport'
import MarketLiveActivity from '../../components/dashboard/market/MarketLiveActivity'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'

function MarketDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading market telemetry">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <Skeleton className="h-96 lg:col-span-8 w-full rounded-2xl" />
        <Skeleton className="h-96 lg:col-span-4 w-full rounded-2xl" />
      </div>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  )
}

// ADM-008 — Sovereign Market / Country Dashboard
export default function MarketDashboard() {
  const { data, loading, error, refetch, canManageMarket } = useMarketDashboard()

  return (
    <PageContainer>
      {error && !data && (
        <ErrorState
          title="Market Telemetry Connection Error"
          description={error}
          onRetry={refetch}
        />
      )}

      {loading && !data && <MarketDashboardSkeleton />}

      {data && (
        <div className="space-y-6">
          {/* 1. Market Header & Sovereign Status */}
          <MarketHeaderStatus
            context={data.context}
            canManageMarket={canManageMarket}
          />

          {/* 2. 5 Primary KPIs (Country-Specific Currency) */}
          <MarketKPIs
            metrics={data.metrics}
            currency={data.context?.currency}
            currencySymbol={data.context?.currencySymbol}
          />

          {/* 3. Operational Needs Attention Queue */}
          <MarketNeedsAttention
            attention={data.needsAttention}
            marketName={data.context?.marketName}
          />

          {/* 4. 30-Day Growth Trajectory & 6-Dimension Market Health Index */}
          <MarketHealthAndChart
            performance={data.performance}
            marketHealth={data.marketHealth}
            marketName={data.context?.marketName}
            currency={data.context?.currency}
          />

          {/* 5. Provider & Client Ecosystem Breakdowns */}
          <MarketEcosystemBreakdown
            providerNetwork={data.providerEcosystem}
            clientNetwork={data.clientEcosystem}
            marketName={data.context?.marketName}
          />

          {/* 6. Dynamic Cities & Regional Performance Breakdown Matrix */}
          <CitiesRegionsTable
            cities={data.cities}
            marketName={data.context?.marketName}
            currency={data.context?.currency}
          />

          {/* 7. Bookings Operations Breakdown & Financial Position Escrow */}
          <MarketBookingsAndFinance
            bookingsAndFinance={data.bookingsAndFinance}
            marketName={data.context?.marketName}
            currency={data.context?.currency}
          />

          {/* 8. Local Payment Rails Telemetry & Provider Withdrawal Pipeline */}
          <MarketPaymentsAndWithdrawals
            paymentsAndWithdrawals={data.paymentsAndWithdrawals}
            marketName={data.context?.marketName}
            currency={data.context?.currency}
          />

          {/* 9. Verification Backlog, Trust & Safety, Support Concierge & Live Activity Stream */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <MarketTrustSafetySupport
                moderationSafetySupport={data.moderationSafetySupport}
                marketName={data.context?.marketName}
              />
            </div>
            <div className="lg:col-span-4">
              <MarketLiveActivity
                operations={data.recentActivity}
                marketName={data.context?.marketName}
                marketCode={data.context?.marketCode}
              />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
