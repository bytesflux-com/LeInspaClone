import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { FileSearch } from 'lucide-react'
import { providerTrustService } from '../../services/providerTrustService'
import { useProviderTrustData } from '../../hooks/useProviderTrust'
import ErrorState from '../../components/ui/ErrorState'
import { PageSkeleton, ProviderTrustHeader } from '../../components/providers/trust/TrustUI'
import { useToast } from '../../components/providers/trust/useTrustToast'
import {
  AssessmentCard,
  BookingReliabilityCard,
  ClientExperienceCard,
  ComplianceCard,
  DynamicUnitsCard,
  FinancialSignalsCard,
  NeedsReviewCard,
  QualitySignalsCard,
  QualityTrendCard,
  RecommendedPathCard,
  RiskKpis,
  RiskSignalsCard,
  RiskTimelineCard,
  SafetyCard,
} from '../../components/providers/risk/RiskCards'
import { AssessmentDrawer, ScoreExplanationDrawer } from '../../components/providers/risk/RiskDrawers'

// ADM-027 — Provider Quality & Risk Review. Investigates, never enforces:
// Signal → Context → Evidence → Human Review → Decision.
export default function ProviderQualityRisk() {
  const { providerId: routeId } = useParams()
  const providerId = routeId || 'PR-82941'
  const toast = useToast()
  const [period, setPeriod] = useState('30d')
  const { ctx, data, error, refetch, fetching } = useProviderTrustData((c) => providerTrustService.getQualityRisk(providerId, period, c), `${providerId}|${period}`)
  const [drawer, setDrawer] = useState(null)

  const saveAssessment = async (input) => {
    const res = await providerTrustService.updateAssessment(providerId, input, ctx)
    setDrawer(null)
    refetch()
    toast.show(res?.message || 'Assessment recorded')
  }

  if (error && !data) {
    return <div className="mx-auto mt-10 max-w-xl px-4"><ErrorState title="Unable to load quality & risk review" description={error} onRetry={refetch} /></div>
  }

  const investigation = data?.permissions.canInvestigate && data.needsReview.find((n) => n.caseId)
  const provider = data ? { ...data.provider, rating: data.experience.averageRating ?? data.provider.rating, reviewTotal: data.experience.totalReviews } : null

  return (
    <div className="min-h-full space-y-4 bg-lavender-50/60 p-3.5 sm:p-5">
      <ProviderTrustHeader provider={provider} providerId={providerId} section="Quality & Risk Review" sectionPath="risk" isMock={providerTrustService.isMock} onCopy={toast.show}
        actions={investigation && (
          <Link to={investigation.link} className="inline-flex items-center gap-1.5 rounded-xl bg-royal-700 px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-royal-800"><FileSearch className="size-4" />Open Full Investigation</Link>
        )} />
      {!data ? <PageSkeleton /> : (
        <div className={`space-y-4 transition-opacity ${fetching ? 'opacity-80' : ''}`}>
          <RiskKpis kpis={data.kpis} onExplain={() => setDrawer('explain')} />
          <div className="grid items-start gap-4 lg:grid-cols-[1.1fr_1.1fr_0.9fr]">
            <QualitySignalsCard signals={data.qualitySignals} onDetails={() => setDrawer('explain')} />
            <RiskSignalsCard signals={data.riskSignals} />
            <NeedsReviewCard items={data.needsReview} />
          </div>
          <div className="grid items-start gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
            <QualityTrendCard trend={data.trend} period={period} onPeriod={setPeriod} loading={fetching} />
            <BookingReliabilityCard data={data.reliability} providerId={providerId} />
            <ClientExperienceCard data={data.experience} providerId={providerId} />
          </div>
          <DynamicUnitsCard dynamic={data.dynamic} />
          <div className="grid items-start gap-4 lg:grid-cols-3">
            <ComplianceCard compliance={data.compliance} />
            <FinancialSignalsCard financial={data.financial} />
            <SafetyCard safety={data.safety} />
          </div>
          <div className="grid items-start gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
            <RiskTimelineCard timeline={data.timeline} />
            <AssessmentCard assessment={data.assessment} canAssess={data.permissions.canAssess} onUpdate={() => setDrawer('assess')} />
            <RecommendedPathCard recommended={data.recommended} providerId={providerId} canAccountActions={data.permissions.canAccountActions} />
          </div>
        </div>
      )}
      {drawer === 'explain' && <ScoreExplanationDrawer data={data} onClose={() => setDrawer(null)} />}
      {drawer === 'assess' && <AssessmentDrawer data={data} onClose={() => setDrawer(null)} onSubmit={saveAssessment} />}
      {toast.node}
    </div>
  )
}
