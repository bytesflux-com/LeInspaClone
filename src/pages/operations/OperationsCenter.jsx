import PageContainer from '../../components/layout/PageContainer'
import { useOperations } from '../../hooks/useOperations'
import OperationsHeader from '../../components/operations/OperationsHeader'
import OperationsSummaryCards from '../../components/operations/OperationsSummaryCards'
import ImmediateAttentionQueue from '../../components/operations/ImmediateAttentionQueue'
import LiveActivityFeed from '../../components/operations/LiveActivityFeed'
import BookingOperationsQueue from '../../components/operations/BookingOperationsQueue'
import FinanceOperationsQueue from '../../components/operations/FinanceOperationsQueue'
import VerificationOperationsQueue from '../../components/operations/VerificationOperationsQueue'
import SafetyDisputesQueue from '../../components/operations/SafetyDisputesQueue'
import SupportOperationsQueue from '../../components/operations/SupportOperationsQueue'
import SystemIntegrationsGrid from '../../components/operations/SystemIntegrationsGrid'
import AssignedToMeQueue from '../../components/operations/AssignedToMeQueue'
import TeamWorkloadCard from '../../components/operations/TeamWorkloadCard'
import RecentlyResolvedFeed from '../../components/operations/RecentlyResolvedFeed'
import Skeleton from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'

function OperationsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading operations telemetry">
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <Skeleton className="h-96 lg:col-span-8 w-full rounded-2xl" />
        <Skeleton className="h-96 lg:col-span-4 w-full rounded-2xl" />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

// ADM-006 — Operations Center (Live Command Center Orchestrator)
export default function OperationsCenter() {
  const { data, loading, error, refetch, activeFilter, setActiveFilter } = useOperations()

  return (
    <PageContainer wide={true}>
      <OperationsHeader onRefresh={refetch} refreshing={loading} />

      {error && !data && (
        <ErrorState
          title="Operations Command Issue"
          description={error}
          onRetry={refetch}
        />
      )}

      {loading && !data && <OperationsSkeleton />}

      {data && (
        <div className="space-y-6">
          {/* Tier 1: Operations Summary Cards (5 cards across) */}
          <OperationsSummaryCards
            summary={data.summary}
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
          />

          {/* Tier 2: Needs Immediate Attention Table & Live Activity Feed in the same horizontal row */}
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            <div className="flex-1 min-w-0 flex flex-col">
              <ImmediateAttentionQueue
                items={data.immediateAttention}
                activeFilter={activeFilter}
                onSelectFilter={setActiveFilter}
              />
            </div>
            <div className="w-full lg:w-64 xl:w-72 2xl:w-80 shrink-0 flex flex-col">
              <LiveActivityFeed activities={data.liveActivity} />
            </div>
          </div>

          {/* Tier 3: Category Queues — 5 cards in one horizontal line with generous space */}
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-200">
            <div className="grid grid-cols-5 gap-4.5 min-w-[1260px] 2xl:min-w-0">
              <BookingOperationsQueue data={data.bookingOperations} />
              <FinanceOperationsQueue data={data.financeOperations} />
              <VerificationOperationsQueue data={data.verificationOperations} />
              <SafetyDisputesQueue data={data.trustSafetyOperations} />
              <SupportOperationsQueue data={data.supportOperations} />
            </div>
          </div>

          {/* Tier 4: Distributed Operations, Personal Workload & Audits (4 columns across) */}
          <div className="grid gap-4.5 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4">
            <SystemIntegrationsGrid integrations={data.systemIntegrations} />
            <AssignedToMeQueue cases={data.assignedToMe} />
            <TeamWorkloadCard workloads={data.teamWorkload} />
            <RecentlyResolvedFeed items={data.resolvedRecently} />
          </div>
        </div>
      )}
    </PageContainer>
  )
}
