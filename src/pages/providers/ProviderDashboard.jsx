import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Download, ArrowRight, Shield, CircleCheck, Sparkles } from 'lucide-react'
import { useProviderDashboard } from '../../hooks/useProviderDashboard'
import { useMarketContext } from '../../hooks/useMarketContext'
import { usePermissions } from '../../hooks/usePermissions'
import { PERMISSIONS } from '../../constants/permissions'
import ErrorState from '../../components/ui/ErrorState'

// Subcomponents
import ProviderKpiCards from '../../components/providers/ProviderKpiCards'
import NeedsAttentionQueue from '../../components/providers/NeedsAttentionQueue'
import ProviderCategoriesGrid from '../../components/providers/ProviderCategoriesGrid'
import ProviderGrowthChart from '../../components/providers/ProviderGrowthChart'
import ProviderStatusDonut from '../../components/providers/ProviderStatusDonut'
import VerificationPipelineCard from '../../components/providers/VerificationPipelineCard'
import ContentApprovalCard from '../../components/providers/ContentApprovalCard'
import ProviderActivityCards from '../../components/providers/ProviderActivityCards'
import ProviderPerformanceCard from '../../components/providers/ProviderPerformanceCard'
import ProviderQualityCard from '../../components/providers/ProviderQualityCard'
import RecentProvidersTable from '../../components/providers/RecentProvidersTable'
import MarketDistributionCard from '../../components/providers/MarketDistributionCard'
import ProviderSubscriptionsCard from '../../components/providers/ProviderSubscriptionsCard'
import AccountHealthCard from '../../components/providers/AccountHealthCard'
import QuickActionsCard from '../../components/providers/QuickActionsCard'
import ContentReviewModal from '../../components/providers/ContentReviewModal'
import ExportReportModal from '../../components/providers/ExportReportModal'

/**
 * ADM-020 — Provider Management Dashboard.
 * Master Admin command center for all Lé Inspa wellness providers, individual professionals,
 * spas, and hotel/resort partners across sovereign markets.
 */
export default function ProviderDashboard() {
  const navigate = useNavigate()
  const { selectedMarket } = useMarketContext()
  const { can } = usePermissions()
  const canExport = can(PERMISSIONS.USERS_EXPORT) || can(PERMISSIONS.PROVIDERS_VIEW)

  const { data, loading, error, refetch } = useProviderDashboard()

  const [contentModalOpen, setContentModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [growthRange, setGrowthRange] = useState('30d')
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const handleContentAction = (actionDetails) => {
    showToast(
      actionDetails.action === 'approved'
        ? 'Content approved and published to provider profile'
        : 'Changes requested. Provider notified with reason note.'
    )
    refetch()
  }

  return (
    <div className="flex min-h-full flex-col space-y-3 pb-8">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-1 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#1b1140]">
              Provider Management Dashboard
            </h1>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
              ADM-020
            </span>
          </div>
          <p className="mt-0.5 text-[13px] text-[#2a1b57]/80">
            Manage professionals, spas, hotels and wellness businesses across Lé Inspa.
          </p>
        </div>

        {/* Header CTA Buttons */}
        <div className="flex items-center gap-3">
          {canExport && (
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#cfc5ee] bg-white px-3.5 text-[12.5px] font-semibold text-[#5c2dd5] shadow-xs transition hover:bg-[#f4f1fc]"
            >
              <Download className="size-3.5" /> Export Report
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/providers/all')}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#5c2dd5] px-4 text-[12.5px] font-semibold text-white shadow-xs transition hover:bg-[#481ec0]"
          >
            <span>View All Providers</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      {error && !data ? (
        <div className="pt-4">
          <ErrorState
            title="Unable to load provider management dashboard"
            description={error}
            onRetry={refetch}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* 1. Six Premium KPI Cards */}
          <section aria-label="Provider Overview KPIs">
            <ProviderKpiCards kpis={data?.kpis} />
          </section>

          {/* 2. Needs Attention & Provider Categories */}
          <section
            aria-label="Needs Attention and Categories"
            className="grid grid-cols-1 gap-3 xl:grid-cols-[1.1fr_1.4fr]"
          >
            <NeedsAttentionQueue attention={data?.attention} />
            <ProviderCategoriesGrid categories={data?.categories} />
          </section>

          {/* 3. Provider Growth, Provider Status, Verification Pipeline & Content Approval */}
          <section
            aria-label="Growth, Status and Verifications"
            className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_1fr_1.1fr]"
          >
            <ProviderGrowthChart
              series={data?.growthSeries}
              currentRange={growthRange}
              onRangeChange={setGrowthRange}
            />
            <ProviderStatusDonut statusDistribution={data?.statusDistribution} />
            <div className="flex flex-col justify-between space-y-3">
              <VerificationPipelineCard pipeline={data?.verificationPipeline} />
              <ContentApprovalCard
                contentApproval={data?.contentApproval}
                onReviewContent={() => setContentModalOpen(true)}
              />
            </div>
          </section>

          {/* 4. Provider Activity & Platform Provider Performance */}
          <section
            aria-label="Activity and Performance"
            className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.5fr]"
          >
            <ProviderActivityCards activity={data?.activity} />
            <ProviderPerformanceCard performance={data?.performance} />
          </section>

          {/* 5. Provider Quality Signals, Recently Joined Providers, Market Distribution */}
          <section
            aria-label="Quality, Recent Providers and Markets"
            className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1.8fr_1.4fr]"
          >
            <ProviderQualityCard quality={data?.quality} />
            <RecentProvidersTable providers={data?.recentProviders} />
            <MarketDistributionCard markets={data?.marketDistribution} />
          </section>

          {/* 6. Subscriptions, Account Health & Quick Actions */}
          <section
            aria-label="Subscriptions, Health and Actions"
            className="grid grid-cols-1 gap-3 md:grid-cols-3"
          >
            <ProviderSubscriptionsCard subscriptions={data?.subscriptions} />
            <AccountHealthCard accountHealth={data?.accountHealth} />
            <QuickActionsCard onOpenContentReview={() => setContentModalOpen(true)} />
          </section>
        </div>
      )}

      {/* Content Review Modal */}
      <ContentReviewModal
        isOpen={contentModalOpen}
        onClose={() => setContentModalOpen(false)}
        onActionComplete={handleContentAction}
      />

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExportSuccess={showToast}
      />

      {/* Floating Action Feedback Toast */}
      {toast && (
        <div
          role="status"
          className="fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-xl bg-[#1b1140] px-4 py-3 text-[13px] font-medium text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2"
        >
          <CircleCheck className="size-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}

