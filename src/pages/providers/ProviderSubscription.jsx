import { useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router'
import { providerTrustService } from '../../services/providerTrustService'
import { useProviderTrustData } from '../../hooks/useProviderTrust'
import ErrorState from '../../components/ui/ErrorState'
import { PageSkeleton, ProviderTrustHeader } from '../../components/providers/trust/TrustUI'
import { useToast } from '../../components/providers/trust/useTrustToast'
import {
  CurrentSubscriptionCard,
  DiscoveryPlacementCard,
  FailedRenewalCard,
  HistoryTabs,
  MarketplaceVisibilityCard,
  PremiumInfoCard,
  PremiumVisibilityCard,
  RecentPaymentsCard,
  SubscriptionStatusCard,
  VisibilityLevelCard,
  VisibilityTimelineCard,
} from '../../components/providers/subscription/SubscriptionCards'
import { ManageSubscriptionDrawer, ManageVisibilityDrawer, VisibilityRulesDrawer } from '../../components/providers/subscription/SubscriptionDrawers'

// ADM-026 — Provider Subscription & Visibility. Admin control layer over the
// shared subscription engine. Subscription, account status and marketplace
// visibility stay separate: Understand → Verify → Trace → Manage.
export default function ProviderSubscription() {
  const { providerId: routeId } = useParams()
  // Without a provider in the URL, demo mode shows its sample provider; live mode opens the directory.
  const providerId = routeId || (providerTrustService.isMock ? 'PR-82941' : null)
  if (!providerId) return <Navigate to="/providers/all" replace />
  return <ProviderSubscriptionScreen key={providerId} providerId={providerId} />
}

function ProviderSubscriptionScreen({ providerId }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { ctx, data, error, refetch, fetching } = useProviderTrustData((c) => providerTrustService.getSubscription(providerId, c), providerId)
  const [drawer, setDrawer] = useState(null)

  const submit = (fn) => async (input) => {
    const res = await fn(providerId, input, ctx)
    setDrawer(null)
    refetch()
    toast.show(res?.message || 'Change applied')
  }

  if (error && !data) {
    return <div className="mx-auto mt-10 max-w-xl px-4"><ErrorState title="Unable to load subscription & visibility" description={error} onRetry={refetch} /></div>
  }

  return (
    <div className="min-h-full bg-lavender-50/60 p-3.5 sm:p-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <ProviderTrustHeader provider={data?.provider} providerId={providerId} section="Subscription & Visibility" sectionPath="subscription" isMock={providerTrustService.isMock} onCopy={toast.show} />
          {!data ? <PageSkeleton /> : (
            <div className={`space-y-4 transition-opacity ${fetching ? 'opacity-70' : ''}`}>
              <div className="grid items-start gap-4 lg:grid-cols-3">
                <CurrentSubscriptionCard data={data} onManage={() => setDrawer('subscription')} onCopy={toast.show} />
                <MarketplaceVisibilityCard data={data} onRules={() => setDrawer('rules')} />
                <div className="space-y-4">
                  <SubscriptionStatusCard data={data} />
                  <VisibilityLevelCard data={data} onManage={() => setDrawer('visibility')} />
                </div>
              </div>
              <HistoryTabs data={data} providerId={providerId} />
              <div className="grid items-start gap-4 lg:grid-cols-2">
                <RecentPaymentsCard data={data} />
                <VisibilityTimelineCard data={data} />
              </div>
            </div>
          )}
        </div>
        {data && (
          <div className="space-y-4">
            <DiscoveryPlacementCard data={data} onRules={() => setDrawer('rules')} />
            <PremiumInfoCard data={data} onPlans={() => setDrawer('rules')} />
            <FailedRenewalCard data={data} />
            <PremiumVisibilityCard data={data} onPerformance={() => navigate(`/providers/${providerId}/bookings`)} />
          </div>
        )}
      </div>

      {drawer === 'subscription' && <ManageSubscriptionDrawer data={data} onClose={() => setDrawer(null)} onSubmit={submit(providerTrustService.manageSubscription)} />}
      {drawer === 'visibility' && <ManageVisibilityDrawer data={data} onClose={() => setDrawer(null)} onSubmit={submit(providerTrustService.manageVisibility)} />}
      {drawer === 'rules' && <VisibilityRulesDrawer data={data} onClose={() => setDrawer(null)} />}
      {toast.node}
    </div>
  )
}
