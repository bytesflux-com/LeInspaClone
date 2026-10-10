import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { ChevronRight, CircleCheck } from 'lucide-react'
import { useMarketContext } from '../../hooks/useMarketContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useClientLoyalty, useClientReferrals, useReferralPreview } from '../../hooks/useClientLoyalty'
import { clientService } from '../../services/clientService'
import { PERMISSIONS } from '../../constants/permissions'
import { DEFAULT_PAGE_SIZE } from '../../constants/clientLoyalty'
import ErrorState from '../../components/ui/ErrorState'
import BookingsHeader from '../../components/clients/bookings/BookingsHeader'
import ReferralProgramCard from '../../components/clients/loyalty/ReferralProgramCard'
import ReferralFunnel from '../../components/clients/loyalty/ReferralFunnel'
import ReferralActivity from '../../components/clients/loyalty/ReferralActivity'
import { LoyaltyRewardsCard, LoyaltyProgressCard } from '../../components/clients/loyalty/LoyaltyOverview'
import LoyaltyActivity from '../../components/clients/loyalty/LoyaltyActivity'
import RewardsCredits from '../../components/clients/loyalty/RewardsCredits'
import LoyaltyNotes from '../../components/clients/loyalty/LoyaltyNotes'
import { QuickActionsCard, NeedsReviewCard } from '../../components/clients/loyalty/LoyaltySidePanel'
import { ReferralDrawer, RewardDrawer } from '../../components/clients/loyalty/LoyaltyDrawers'
import LoyaltySkeleton from '../../components/clients/loyalty/LoyaltySkeleton'

// The URL is the single source of truth for the referral list (tab / search / date / sort /
// page), the open drawer (`ref`, `rwd`) and the rewards tab (`rtab`), so returning from a
// Client, Booking or Transaction page restores exactly the view the admin left.
const DEFAULTS = { tab: 'all', q: '', date: '', sort: 'newest', rewarded: '', page: 1, size: DEFAULT_PAGE_SIZE, rtab: 'all' }

function readParams(sp) {
  const num = (key) => {
    const n = Number(sp.get(key))
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : DEFAULTS[key]
  }
  return {
    tab: sp.get('tab') || DEFAULTS.tab,
    q: sp.get('q') || '',
    date: sp.get('date') || '',
    sort: sp.get('sort') || DEFAULTS.sort,
    rewarded: sp.get('rewarded') || '',
    page: num('page'),
    size: num('size'),
  }
}

// ADM-017 — Client Referrals & Loyalty. An Admin view over the existing referral and loyalty
// records (`referrals`, `loyalty_accounts`, `loyalty_transactions`, reward records) — no
// duplicate admin collection. Referral and loyalty are shown as separate sections with their own
// counters. Nothing here edits money or history: there is no "+ Add Reward" and no edit/delete on
// a reward. Any correction belongs to a separate permission-controlled adjustment workflow
// (reason → review → confirm → adjustment transaction → audit log).
export default function ClientLoyalty() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [sp, setSp] = useSearchParams()
  const { selectedMarket } = useMarketContext()
  const { can } = usePermissions()

  const canView = can(PERMISSIONS.USERS_VIEW)
  const canSeeFinancial = can(PERMISSIONS.FINANCE_VIEW)
  const canViewBookings = can(PERMISSIONS.BOOKINGS_VIEW)
  const canAudit = can(PERMISSIONS.AUDIT_VIEW)

  const params = useMemo(() => readParams(sp), [sp])
  const rewardsTab = sp.get('rtab') || DEFAULTS.rtab
  const query = useMemo(() => ({ tab: params.tab, q: params.q, date: params.date, sort: params.sort, rewarded: params.rewarded, page: params.page, pageSize: params.size }), [params])

  const overview = useClientLoyalty(canView ? clientId : null, selectedMarket.id)
  const referrals = useClientReferrals(canView ? clientId : null, selectedMarket.id, query)
  const { data, error, loading, refetch } = overview

  const [activityOpen, setActivityOpen] = useState(false)
  const [rewardsOpen, setRewardsOpen] = useState(false)

  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const update = useCallback(
    (patch) => {
      const next = new URLSearchParams(sp)
      for (const [k, v] of Object.entries(patch)) {
        if (v === '' || v == null || v === DEFAULTS[k]) next.delete(k)
        else next.set(k, String(v))
      }
      // Changing the referral list (tab / search / filters / page size) returns to page 1.
      if (Object.keys(patch).some((k) => k in DEFAULTS && !['page', 'rtab'].includes(k))) {
        if (!('page' in patch)) next.delete('page')
      }
      setSp(next, { replace: true })
    },
    [sp, setSp],
  )

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams()
    if (sp.get('size')) next.set('size', sp.get('size'))
    if (sp.get('ref')) next.set('ref', sp.get('ref'))
    if (sp.get('rwd')) next.set('rwd', sp.get('rwd'))
    if (sp.get('rtab')) next.set('rtab', sp.get('rtab'))
    setSp(next, { replace: true })
  }, [sp, setSp])

  const hasFilters = Boolean(params.q || params.date || params.rewarded || params.sort !== 'newest' || params.tab !== 'all')

  // Drawers (mutually exclusive): ?ref=<referralId> or ?rwd=<rewardId>.
  const refId = canView ? sp.get('ref') : null
  const rwdId = canView && !refId ? sp.get('rwd') : null
  const { preview, error: previewError, loading: previewLoading } = useReferralPreview(refId, clientId, selectedMarket.id)
  const reward = rwdId ? data?.loyalty.rewards.items.find((x) => x.id === rwdId) : null

  const openReferral = useCallback((id) => update({ ref: id, rwd: '' }), [update])
  const openReward = useCallback((id) => update({ rwd: id, ref: '' }), [update])
  const closeDrawer = useCallback(() => update({ ref: '', rwd: '' }), [update])

  const from = location.state?.from
  const returnTo = `${location.pathname}${location.search}`
  const linkState = useMemo(() => ({ from, returnTo }), [from, returnTo])
  const profileState = useMemo(() => (from ? { from } : undefined), [from])

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      showToast(`${value} copied`)
    } catch {
      showToast('Unable to copy to clipboard')
    }
  }

  const saveNote = async (text) => {
    await clientService.addLoyaltyNote({ clientId, text })
    refetch()
    showToast('Internal note saved')
  }

  const reviewIssue = (issue) => {
    if (issue.referralId) openReferral(issue.referralId)
    else if (issue.rewardId) openReward(issue.rewardId)
  }

  const name = data?.client?.name || clientId
  const crumb = (
    <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-[13px] text-[#1b1140]">
      <Link to="/clients" className="hover:text-[#4527c8]">Client Management</Link>
      <ChevronRight className="size-3.5 text-[#4a4466]" />
      <Link to={from || '/clients/all'} className="hover:text-[#4527c8]">All Clients</Link>
      <ChevronRight className="size-3.5 text-[#4a4466]" />
      <Link to={`/clients/${clientId}`} state={profileState} className="hover:text-[#4527c8]">{name}</Link>
      <ChevronRight className="size-3.5 text-[#4a4466]" />
      <span className="font-medium">Client Referrals & Loyalty</span>
    </nav>
  )

  let body
  if (!canView) {
    body = (
      <div className="mx-auto mt-6 w-full max-w-xl">
        <ErrorState title="You don't have access to this client's referrals and loyalty" description="Client records need user-viewing permission. Ask a Super Admin to grant it." />
      </div>
    )
  } else if (error && !data) {
    body = (
      <div className="mx-auto mt-6 w-full max-w-xl">
        <ErrorState title="Unable to open referrals and loyalty" description={error} onRetry={refetch} />
        <div className="mt-4 text-center">
          <button type="button" onClick={() => navigate(from || '/clients/all')} className="text-[13px] font-semibold text-[#3b1fd6] hover:underline">Back to All Clients</button>
        </div>
      </div>
    )
  } else if (loading || !data) {
    body = <LoyaltySkeleton />
  } else {
    const { client, referral, loyalty, issues, notes } = data
    body = (
      <div className="@container min-w-0 space-y-3">
        {crumb}

        <div className="grid items-start gap-3 @[64rem]:grid-cols-[minmax(0,642fr)_minmax(0,338fr)_minmax(0,275fr)]">
          {/* Row 1 — client identity */}
          <div className="min-w-0 @[64rem]:col-span-2 @[64rem]:col-start-1 @[64rem]:row-start-1">
            <BookingsHeader client={client} backTo={`/clients/${clientId}`} linkState={profileState} onCopyId={copy} />
          </div>

          {/* Right column — quick actions, and the review card only when something needs attention */}
          <div className="flex min-w-0 flex-col gap-3 @[64rem]:col-start-3 @[64rem]:row-span-2 @[64rem]:row-start-1">
            <QuickActionsCard clientId={clientId} canSeeFinancial={canSeeFinancial} canAudit={canAudit} linkState={linkState} />
            <NeedsReviewCard issues={issues} onReview={reviewIssue} />
          </div>

          {/* Row 2 — referral overview */}
          <div className="min-w-0 @[64rem]:col-start-1 @[64rem]:row-start-2">
            <ReferralProgramCard referral={referral} currency={client.currency} canSeeFinancial={canSeeFinancial} onCopy={copy} />
          </div>
          <div className="min-w-0 @[64rem]:col-start-2 @[64rem]:row-start-2">
            <ReferralFunnel funnel={referral.funnel} />
          </div>

          {/* Row 3 — activity (left) and loyalty / rewards (right) */}
          <div className="flex min-w-0 flex-col gap-3 @[64rem]:col-start-1 @[64rem]:row-start-3">
            <ReferralActivity
              data={referrals.data}
              error={referrals.error}
              loading={referrals.loading}
              fetching={referrals.fetching}
              params={params}
              selectedId={refId}
              canSeeFinancial={canSeeFinancial}
              hasFilters={hasFilters}
              onChange={update}
              onClear={clearFilters}
              onOpen={openReferral}
              onPage={(page) => update({ page })}
              onPageSize={(size) => update({ size })}
              onRetry={referrals.refetch}
            />
            <LoyaltyActivity
              activity={loyalty.activity}
              currency={client.currency}
              timeZone={client.timeZone}
              canSeeFinancial={canSeeFinancial}
              canViewBookings={canViewBookings}
              linkState={linkState}
              expanded={activityOpen}
              onToggle={() => setActivityOpen((o) => !o)}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-3 @[64rem]:col-span-2 @[64rem]:col-start-2 @[64rem]:row-start-3">
            <LoyaltyRewardsCard loyalty={loyalty} currency={client.currency} canSeeFinancial={canSeeFinancial} />
            <LoyaltyProgressCard progress={loyalty.progress} />
            <RewardsCredits
              rewards={loyalty.rewards}
              currency={client.currency}
              timeZone={client.timeZone}
              canSeeFinancial={canSeeFinancial}
              canViewBookings={canViewBookings}
              linkState={linkState}
              tab={rewardsTab}
              onTab={(t) => update({ rtab: t })}
              expanded={rewardsOpen}
              onToggle={() => setRewardsOpen((o) => !o)}
              onOpen={openReward}
              onOpenReferral={openReferral}
            />
            <LoyaltyNotes key={clientId} notes={notes} timeZone={client.timeZone} onSave={saveNote} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col px-3.5 pt-2.5 pb-6">
      {(!data || loading || !canView) && crumb}
      {body}

      {refId && data && (
        <ReferralDrawer
          referralId={refId}
          preview={preview}
          loading={previewLoading}
          error={previewError}
          client={data.client}
          canSeeFinancial={canSeeFinancial}
          canViewBookings={canViewBookings}
          linkState={linkState}
          onClose={closeDrawer}
        />
      )}
      {reward && data && (
        <RewardDrawer
          reward={reward}
          currency={data.client.currency}
          timeZone={data.client.timeZone}
          canSeeFinancial={canSeeFinancial}
          canViewBookings={canViewBookings}
          linkState={linkState}
          onOpenReferral={openReferral}
          onClose={closeDrawer}
        />
      )}

      {toast && (
        <div role="status" className="fixed right-6 bottom-6 z-[80] flex items-center gap-2.5 rounded-xl bg-[#1b1140] px-4 py-3 text-[13px] font-medium text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <CircleCheck className="size-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  )
}
