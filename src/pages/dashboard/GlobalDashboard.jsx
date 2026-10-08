import { useDashboard } from '../../hooks/useDashboard'
import PageContainer from '../../components/layout/PageContainer'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import MetricGrid from '../../components/dashboard/MetricGrid'
import AttentionSection from '../../components/dashboard/AttentionSection'
import PlatformPerformance from '../../components/dashboard/PlatformPerformance'
import FinancialPosition from '../../components/dashboard/FinancialPosition'
import MarketPerformance from '../../components/dashboard/MarketPerformance'
import LiveOperations from '../../components/dashboard/LiveOperations'
import ProviderNetwork from '../../components/dashboard/ProviderNetwork'
import MembershipSummary from '../../components/dashboard/MembershipSummary'
import ApprovalQueue from '../../components/dashboard/ApprovalQueue'
import SystemHealth from '../../components/dashboard/SystemHealth'
import QuickActions from '../../components/dashboard/QuickActions'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading dashboard telemetry">
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <Skeleton className="h-84 lg:col-span-4 w-full rounded-2xl" />
        <Skeleton className="h-84 lg:col-span-5 w-full rounded-2xl" />
        <Skeleton className="h-84 lg:col-span-3 w-full rounded-2xl" />
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-96 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

// ADM-005 — Global Admin Dashboard Orchestrator
export default function GlobalDashboard() {
  const { data, loading, error, refetch } = useDashboard()

  return (
    <PageContainer wide={true}>
      <DashboardHeader
        onRefresh={refetch}
        refreshing={loading}
        isSandbox={data?.context?.isSandbox}
      />

      {error && !data && (
        <ErrorState
          title="Telemetry Connection Issue"
          description={error}
          onRetry={refetch}
        />
      )}

      {loading && !data && <DashboardSkeleton />}

      {data && (
        <div className="space-y-6">
          {/* Tier 1: Primary Executive KPIs (5 cards across) */}
          <MetricGrid
            metrics={data.metrics}
            reportingCurrency={data.context?.reportingCurrency}
            className="text-[10px] sm:text-xs"
          />

          {/* Tier 2: Operational Attention, Platform Performance & Financial Position */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-5 flex flex-col min-w-0">
              <AttentionSection
                attention={data.attention}
                marketName={data.context?.marketName}
              />
            </div>
            <div className="lg:col-span-4 flex flex-col min-w-0">
              <PlatformPerformance performance={data.performance} />
            </div>
            <div className="lg:col-span-3 flex flex-col min-w-0">
              <FinancialPosition financial={data.financial} />
            </div>
          </div>

          {/* Tier 3: Market Performance, Live Operations, Fleet Distribution & Membership */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
            <MarketPerformance markets={data.markets} />
            <LiveOperations operations={data.liveOperations} />
            <ProviderNetwork providerNetwork={data.providerNetwork} />
            <MembershipSummary membership={data.membership} />
          </div>

          {/* Tier 4: Moderation Queue, Distributed Node Health & Rapid Actions */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <ApprovalQueue approvals={data.approvals} />
            <SystemHealth systemHealth={data.systemHealth} />
            <QuickActions />
          </div>
        </div>
      )}
    </PageContainer>
  )
}
