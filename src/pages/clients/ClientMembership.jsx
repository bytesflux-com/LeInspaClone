import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ChevronRight, CircleCheck, CalendarClock, Crown } from 'lucide-react'
import { useMarketContext } from '../../hooks/useMarketContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useClientMembership } from '../../hooks/useClientMembership'
import { clientService } from '../../services/clientService'
import { PERMISSIONS } from '../../constants/permissions'
import { formatDay } from '../../lib/profileFormat'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import BookingsHeader from '../../components/clients/bookings/BookingsHeader'
import { PROFILE_CARD } from '../../components/clients/profile/ProfileCard'
import MembershipHero from '../../components/clients/membership/MembershipHero'
import MembershipStatusCard from '../../components/clients/membership/MembershipStatusCard'
import AccessBenefitsCard from '../../components/clients/membership/AccessBenefitsCard'
import { MembershipJourney, PlanComparison, UpgradeOpportunity } from '../../components/clients/membership/MembershipJourney'
import MembershipHistory from '../../components/clients/membership/MembershipHistory'
import MembershipPayments from '../../components/clients/membership/MembershipPayments'
import FailedRenewalCard from '../../components/clients/membership/FailedRenewalCard'
import MembershipActivity from '../../components/clients/membership/MembershipActivity'
import MembershipNotes from '../../components/clients/membership/MembershipNotes'
import ManageMembershipDrawer from '../../components/clients/membership/ManageMembershipDrawer'
import MembershipSkeleton from '../../components/clients/membership/MembershipSkeleton'
import { cn } from '../../lib/utils'

// ADM-016 — Client Membership. An Admin control/view layer over the real membership
// records (customer_memberships + plan configuration + history/events + payments).
// It answers: what membership, is it active, what does it unlock, what was paid and
// what happened before. Price and benefits are READ from the record / configuration.
// Membership status is separate from the client-account status. Manual changes go
// through a controlled drawer (reason + audit) and never touch a payment's status.
export default function ClientMembership() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedMarket } = useMarketContext()
  const { can } = usePermissions()

  const canView = can(PERMISSIONS.USERS_VIEW)
  const canSeeFinancial = can(PERMISSIONS.FINANCE_VIEW)
  const canManage = can(PERMISSIONS.MEMBERSHIPS_MANAGE)
  const { data, error, loading, fetching, refetch } = useClientMembership(canView ? clientId : null, selectedMarket.id)

  const [manage, setManage] = useState(null) // { initialAction } | null
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

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

  const confirmChange = async ({ action, payload, reason, note }) => {
    const res = await clientService.changeClientMembership({ clientId, action, payload, reason, note })
    setManage(null)
    refetch()
    showToast(`Membership updated${res?.auditId ? ` • ${res.auditId}` : ''}`)
  }

  const saveNote = async (text) => {
    await clientService.addMembershipNote({ clientId, text })
    refetch()
    showToast('Internal note saved')
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
      <span className="font-medium">Client Membership</span>
    </nav>
  )

  let body
  if (!canView) {
    body = <div className="mx-auto mt-6 w-full max-w-xl"><ErrorState title="You don't have access to this membership" description="Client records need user-viewing permission. Ask a Super Admin to grant it." /></div>
  } else if (error && !data) {
    body = (
      <div className="mx-auto mt-6 w-full max-w-xl">
        <ErrorState title="Unable to open this membership" description={error} onRetry={refetch} />
        <div className="mt-4 text-center"><button type="button" onClick={() => navigate(from || '/clients/all')} className="text-[13px] font-semibold text-[#3b1fd6] hover:underline">Back to All Clients</button></div>
      </div>
    )
  } else if (loading || !data) {
    body = <MembershipSkeleton />
  } else {
    const { client, membership: m, config, journey, upgrade, history, payments, failedRenewal, events, notes, manage: manageInfo } = data
    const paymentTo = (id) => `/payments/${id}`
    const paymentsTo = `/clients/${clientId}/payments?ptype=membership`
    const configTo = can(PERMISSIONS.SETTINGS_MANAGE) ? '/memberships' : null
    const showUpgrade = Boolean(upgrade?.eligible && canManage)
    const extras = Number(showUpgrade) + Number(Boolean(configTo))
    const sched = m?.scheduledChange
    const manageUi = canManage && manageInfo?.actions?.length > 0

    body = (
      <div className="@container min-w-0 space-y-3">
        {crumb}
        <BookingsHeader client={client} backTo={`/clients/${clientId}`} linkState={profileState} onCopyId={copy} />

        {failedRenewal && canSeeFinancial && <FailedRenewalCard failed={failedRenewal} client={client} paymentTo={paymentTo} billingTo={paymentsTo} linkState={linkState} />}

        {sched && (
          <p role="status" className="flex items-start gap-2 rounded-xl border border-[#d6caf1] bg-[#f4f1fc] px-3.5 py-2.5 text-[12.5px] text-[#2a1b57]">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-[#4527c8]" aria-hidden="true" />
            <span>A change to <strong>{sched.name}</strong> is scheduled for {formatDay(sched.effectiveAt, client.timeZone, { year: true })}, the end of the current billing period.</span>
          </p>
        )}

        {!m ? (
          <section className={cn(PROFILE_CARD, 'p-2')}>
            <EmptyState icon={Crown} title="No membership record" description="This client has never held a membership. Their account and bookings are unaffected." />
          </section>
        ) : (
          <>
            <div className="grid items-stretch gap-3 @[64rem]:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <MembershipHero
                membership={m}
                config={config}
                client={client}
                canSeeFinancial={canSeeFinancial}
                canManage={manageUi}
                onManage={() => setManage({ initialAction: null })}
                paymentTo={canSeeFinancial && m.lastPayment?.paymentId ? paymentTo(m.lastPayment.paymentId) : null}
                linkState={linkState}
                onCopy={copy}
              />
              <MembershipStatusCard membership={m} client={client} />
              <AccessBenefitsCard config={config} accessEnabled={m.accessStatus === 'enabled'} configTo={configTo} />
            </div>

            <div className={cn('grid gap-3', extras === 2 ? '@[64rem]:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_minmax(0,1fr)]' : extras === 1 ? '@[56rem]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]' : '')}>
              <MembershipJourney journey={journey} />
              {showUpgrade && <UpgradeOpportunity upgrade={upgrade} config={config} canManage={manageUi} onOpen={(a) => setManage({ initialAction: a })} />}
              {configTo && <PlanComparison to={configTo} />}
            </div>
          </>
        )}

        <div className={cn('grid items-start gap-3', canSeeFinancial && '@[64rem]:grid-cols-2')}>
          <MembershipHistory history={history} client={client} canSeeFinancial={canSeeFinancial} paymentTo={paymentTo} />
          {canSeeFinancial && <MembershipPayments payments={payments} client={client} viewAllTo={paymentsTo} paymentTo={paymentTo} linkState={linkState} />}
        </div>

        <div className="grid items-start gap-3 @[64rem]:grid-cols-2">
          <MembershipActivity events={events} client={client} auditTo={can(PERMISSIONS.AUDIT_VIEW) ? '/audit-logs' : null} />
          <MembershipNotes notes={notes} timeZone={client.timeZone} onSave={saveNote} />
        </div>

        {fetching && <p role="status" className="sr-only">Refreshing membership…</p>}

        {manage && m && (
          <ManageMembershipDrawer
            manage={manageInfo}
            membership={m}
            config={config}
            client={client}
            initialAction={manage.initialAction}
            onClose={() => setManage(null)}
            onConfirm={confirmChange}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col px-3.5 pt-2.5 pb-6">
      {(!data || loading || !canView) && crumb}
      {body}
      {toast && (
        <div role="status" className="fixed right-6 bottom-6 z-[80] flex items-center gap-2.5 rounded-xl bg-[#1b1140] px-4 py-3 text-[13px] font-medium text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <CircleCheck className="size-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  )
}
