import { useState } from 'react'
import { Link, useParams, Navigate } from 'react-router'
import { ShieldCheck } from 'lucide-react'
import { providerTrustService } from '../../services/providerTrustService'
import { useProviderTrustData } from '../../hooks/useProviderTrust'
import ErrorState from '../../components/ui/ErrorState'
import { PageSkeleton, ProviderTrustHeader } from '../../components/providers/trust/TrustUI'
import { useToast } from '../../components/providers/trust/useTrustToast'
import {
  AccessRestrictionsPanel,
  AccountStatusPanel,
  ActionHistoryPanel,
  AssessmentSummaryPanel,
  CurrentRestrictionsPanel,
  HighImpactPanel,
  NextActionPanel,
  NotesPanel,
  NotificationHistoryPanel,
  RecommendedReviewPanel,
  ReviewActionsPanel,
  ReviewBeforeActionPanel,
} from '../../components/providers/account/AccountCards'
import { AccountActionDrawer } from '../../components/providers/account/AccountActionDrawer'

// ADM-028 — Provider Account Actions / Suspension. The controlled enforcement
// screen: Context → Minimum Necessary Action → Impact Review → Confirmation → Audit.
// Account status and scoped restrictions are separate; bookings are never
// cancelled and funds never confiscated from here.
export default function ProviderAccountActions() {
  const { providerId: routeId } = useParams()
  // Without a provider in the URL, demo mode shows its sample provider; live mode opens the directory.
  const providerId = routeId || (providerTrustService.isMock ? 'PR-82941' : null)
  if (!providerId) return <Navigate to="/providers/all" replace />
  return <ProviderAccountActionsScreen key={providerId} providerId={providerId} />
}

function ProviderAccountActionsScreen({ providerId }) {
  const toast = useToast()
  const { ctx, data, error, refetch, fetching } = useProviderTrustData((c) => providerTrustService.getAccount(providerId, c), providerId)
  const [intent, setIntent] = useState(null)

  const apply = async (input) => {
    const res = await providerTrustService.applyAccountAction(providerId, input, ctx)
    setIntent(null)
    refetch()
    toast.show(res?.message || 'Account action applied')
  }
  const addNote = async (text) => {
    try {
      await providerTrustService.addAccountNote(providerId, text, ctx)
      refetch()
      toast.show('Internal note saved')
    } catch (err) {
      toast.show(err?.message || 'The note could not be saved', 'error')
      throw err
    }
  }
  // "Manage →" on a restriction row: lift it when active, otherwise apply it.
  const manage = (kind, current) => setIntent(current.length ? { action: 'lift_restriction', restrictionId: current[0].id } : { action: 'restrict', kind })

  if (error && !data) {
    return <div className="mx-auto mt-10 max-w-xl px-4"><ErrorState title="Unable to load account actions" description={error} onRetry={refetch} /></div>
  }

  const provider = data ? { ...data.provider } : null
  return (
    <div className="min-h-full space-y-4 bg-lavender-50/60 p-3.5 sm:p-5">
      <ProviderTrustHeader provider={provider} providerId={providerId} section="Account Actions" sectionPath="account" isMock={providerTrustService.isMock} onCopy={toast.show}
        actions={<Link to={`/providers/${providerId}/risk`} className="inline-flex items-center gap-1.5 rounded-xl border border-royal-300 bg-white px-3.5 py-2 text-[12px] font-semibold text-royal-700 hover:bg-royal-50"><ShieldCheck className="size-3.5" />View Quality & Risk Review</Link>} />
      {!data ? <PageSkeleton /> : (
        <div className={`space-y-4 transition-opacity ${fetching ? 'opacity-80' : ''}`}>
          {data.permitted.length === 0 && (
            <p className="rounded-xl bg-lavender-100 px-3 py-2 text-[12px] text-royal-900">You can review this account. Account actions need the suspend/reactivate permission.</p>
          )}
          <div className="grid items-stretch gap-4 xl:grid-cols-[1.15fr_1.25fr_0.9fr]">
            <AccountStatusPanel account={data.account} />
            <ReviewBeforeActionPanel review={data.review} providerId={providerId} />
            <RecommendedReviewPanel recommended={data.recommended} providerId={providerId} />
          </div>
          <div className="grid items-stretch gap-4 xl:grid-cols-[1.15fr_1.25fr_0.9fr]">
            <ReviewActionsPanel permitted={data.permitted} onAction={setIntent} />
            <AccessRestrictionsPanel restrictions={data.restrictions} permitted={data.permitted} permissions={data.permissions} onManage={manage} />
            <HighImpactPanel status={data.account.status} permitted={data.permitted} onAction={setIntent} />
          </div>
          {data.account.activeRestrictionCount > 0 && (
            <CurrentRestrictionsPanel restrictions={data.restrictions} canLift={data.permitted.includes('lift_restriction')} onLift={(r) => setIntent({ action: 'lift_restriction', restrictionId: r.id })} />
          )}
          <div className="grid items-start gap-4 xl:grid-cols-[1.25fr_1.05fr_0.9fr]">
            <ActionHistoryPanel history={data.history} />
            <NotificationHistoryPanel notifications={data.notifications} />
            <NotesPanel notes={data.notes} onAdd={addNote} />
          </div>
          <div className="grid items-stretch gap-4 xl:grid-cols-[1.3fr_1fr]">
            <AssessmentSummaryPanel assessment={data.assessment} providerId={providerId} />
            <NextActionPanel recommended={data.recommended} />
          </div>
        </div>
      )}
      {intent && data && <AccountActionDrawer key={`${intent.action}:${intent.kind || intent.restrictionId || ''}`} data={data} intent={intent} onClose={() => setIntent(null)} onSubmit={apply} />}
      {toast.node}
    </div>
  )
}
