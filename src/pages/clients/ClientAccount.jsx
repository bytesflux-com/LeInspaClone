import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ChevronRight, CircleCheck } from 'lucide-react'
import { AdminContext } from '../../context/AdminContext'
import { useMarketContext } from '../../hooks/useMarketContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useClientAccount } from '../../hooks/useClientAccount'
import { clientService } from '../../services/clientService'
import { PERMISSIONS } from '../../constants/permissions'
import ErrorState from '../../components/ui/ErrorState'
import BookingsHeader from '../../components/clients/bookings/BookingsHeader'
import AccountStatusCard from '../../components/clients/account/AccountStatusCard'
import AccountReviewCards from '../../components/clients/account/AccountReviewCards'
import { AccessControlsCard, HighImpactCard, ReviewActionsCard } from '../../components/clients/account/AccountActionCards'
import { AccountNotesCard, ActiveRestrictionsCard, UpcomingBookingsCard } from '../../components/clients/account/AccountLowerCards'
import { AccountNotificationsCard, ActionHistoryCard } from '../../components/clients/account/AccountHistoryTables'
import AccountActionDrawer from '../../components/clients/account/AccountActionDrawer'
import AccountSkeleton from '../../components/clients/account/AccountSkeleton'

// ADM-019 — Client Account Actions. The controlled Admin action center for ONE client account.
// There is no Admin copy of the client: state comes from `users`, `account_restrictions`,
// `account_actions`, `notifications`, `bookings` and the case collections. Account status and
// restrictions are separate concepts, existing bookings are never cancelled silently, wallet funds are
// never frozen as a side-effect, and every action needs a reason and is audited.
// Flow: Review → Understand Impact → Give Reason → Confirm → Audit → Notify.
export default function ClientAccount() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedMarket } = useMarketContext()
  const { can, role } = usePermissions()
  const adminCtx = useContext(AdminContext)

  const canView = can(PERMISSIONS.USERS_VIEW)
  const manage = can(PERMISSIONS.USERS_SUSPEND)
  const finance = can(PERMISSIONS.FINANCE_VIEW)
  const safety = can(PERMISSIONS.DISPUTES_MANAGE)
  const superAdmin = role === 'super_admin'
  // Used by the demo backend only; the real Cloud Functions resolve the admin's role themselves.
  const perms = useMemo(() => ({ manage, finance, safety, superAdmin }), [manage, finance, safety, superAdmin])

  const { data, error, loading, fetching, refetch } = useClientAccount(canView ? clientId : null, selectedMarket.id, perms)

  const [intent, setIntent] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4200)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const from = location.state?.from
  const linkState = useMemo(() => (from ? { from } : undefined), [from])
  const base = `/clients/${clientId}`
  const name = data?.client?.name || clientId

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      showToast(`${value} copied`)
    } catch {
      showToast('Unable to copy to clipboard')
    }
  }

  // "Manage Restriction": an active restriction opens its removal flow, otherwise the apply flow.
  const openManage = (actionId, kind) => {
    const active = data.restrictions.find((x) => x.kind === kind)
    setIntent(active ? { action: 'lift', restrictionId: active.id } : { action: actionId })
  }

  const apply = async (payload) => {
    const result = await clientService.applyClientAccountAction(
      { clientId, actor: adminCtx?.admin?.fullName?.split(' ')[0] || 'You', actorRole: adminCtx?.admin?.roleName || 'Admin', ...payload },
      perms,
    )
    setIntent(null)
    refetch()
    showToast(result?.message || 'Account action applied')
  }

  const crumb = (
    <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-[13px] text-[#1b1140]">
      <Link to="/clients" className="hover:text-[#4527c8]">Client Management</Link>
      <ChevronRight className="size-3.5 text-[#4a4466]" />
      <Link to={from || '/clients/all'} className="hover:text-[#4527c8]">All Clients</Link>
      <ChevronRight className="size-3.5 text-[#4a4466]" />
      <Link to={base} state={linkState} className="hover:text-[#4527c8]">{name}</Link>
      <ChevronRight className="size-3.5 text-[#4a4466]" />
      <span className="font-medium">Client Account Actions</span>
    </nav>
  )

  let body
  if (!canView) {
    body = (
      <div className="mx-auto mt-6 w-full max-w-xl">
        <ErrorState title="You don't have access to account actions" description="Account actions need client-viewing permission. Ask a Super Admin to grant it." />
      </div>
    )
  } else if (error && !data) {
    body = (
      <div className="mx-auto mt-6 w-full max-w-xl">
        <ErrorState title="Unable to open account actions" description={error} onRetry={refetch} />
        <div className="mt-4 text-center">
          <button type="button" onClick={() => navigate(from || '/clients/all')} className="text-[13px] font-semibold text-[#3b1fd6] hover:underline">Back to All Clients</button>
        </div>
      </div>
    )
  } else if (loading || !data) {
    body = <AccountSkeleton />
  } else {
    const { client, account, review, bookings, restrictions, history, notifications, permitted } = data
    body = (
      <div className={`@container min-w-0 space-y-3 transition-opacity ${fetching ? 'opacity-80' : ''}`}>
        {crumb}
        <BookingsHeader client={client} backTo={base} linkState={linkState} onCopyId={copy} statusLabel={client.status === 'active' ? 'Active Account' : undefined} />

        {error && <p role="alert" className="rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">{error} <button type="button" onClick={refetch} className="font-semibold underline">Retry</button></p>}

        <div className="grid items-stretch gap-3 @[56rem]:grid-cols-[1.45fr_1fr]">
          <AccountStatusCard account={account} />
          <AccountReviewCards review={review} clientId={clientId} linkState={linkState} />
        </div>

        <div className="grid items-stretch gap-3 @[64rem]:grid-cols-[1.22fr_1fr_0.88fr]">
          <AccessControlsCard permitted={permitted} restrictions={restrictions} onManage={openManage} />
          <ReviewActionsCard permitted={permitted} restrictions={restrictions} onAction={(id) => setIntent({ action: id })} onManage={(kind) => openManage('place_review', kind)} />
          <HighImpactCard permitted={permitted} onAction={(id) => setIntent({ action: id })} />
        </div>

        <div className="grid items-stretch gap-3 @[56rem]:grid-cols-[0.95fr_1.1fr_1.05fr]">
          <ActiveRestrictionsCard restrictions={restrictions} client={client} canSeeSafety={safety} onReview={(x) => setIntent({ action: 'lift', restrictionId: x.id })} />
          <UpcomingBookingsCard bookings={data.bookings} count={data.bookingCount} client={client} canSeeFinance={finance} allTo={`${base}/bookings`} linkState={linkState} />
          <AccountNotesCard clientId={clientId} onSaved={showToast} onError={showToast} />
        </div>

        <div className="grid items-start gap-3 @[56rem]:grid-cols-[1.1fr_1fr]">
          <ActionHistoryCard history={history} client={client} canAudit={can(PERMISSIONS.AUDIT_VIEW)} />
          <AccountNotificationsCard notifications={notifications} client={client} />
        </div>

        {intent && (
          <AccountActionDrawer
            key={`${intent.action}:${intent.restrictionId || ''}`}
            intent={intent}
            data={data}
            client={client}
            onClose={() => setIntent(null)}
            onSubmit={apply}
            links={{
              bookings: `${base}/bookings`,
              state: linkState,
              case: (c) => ({ safety: `/safety/${c.id}`, dispute: `/disputes/${c.id}`, support: `/support/${c.id}` }[c.type] || '/support'),
            }}
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
        <div role="status" className="fixed right-6 bottom-6 z-[80] flex max-w-[420px] items-center gap-2.5 rounded-xl bg-[#1b1140] px-4 py-3 text-[13px] font-medium text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <CircleCheck className="size-4 shrink-0 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  )
}
