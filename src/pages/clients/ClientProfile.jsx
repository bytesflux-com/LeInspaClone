import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { ChevronRight, CircleCheck, Copy, Send, SquarePen, Settings } from 'lucide-react'
import { useMarketContext } from '../../hooks/useMarketContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useClientProfile } from '../../hooks/useClientProfile'
import { clientService } from '../../services/clientService'
import { PERMISSIONS } from '../../constants/permissions'
import { EXTRA_SECTIONS, PROFILE_TABS } from '../../constants/clientProfile'
import ErrorState from '../../components/ui/ErrorState'
import ClientActionDialog from '../../components/clients/ClientActionDialog'
import ProfileHeader from '../../components/clients/profile/ProfileHeader'
import ProfileKpis from '../../components/clients/profile/ProfileKpis'
import ContactCard from '../../components/clients/profile/ContactCard'
import MembershipCard from '../../components/clients/profile/MembershipCard'
import RecentBookingsCard from '../../components/clients/profile/RecentBookingsCard'
import WalletCard from '../../components/clients/profile/WalletCard'
import RecentPaymentsCard from '../../components/clients/profile/RecentPaymentsCard'
import ReferralsCard from '../../components/clients/profile/ReferralsCard'
import SupportSafetyCard from '../../components/clients/profile/SupportSafetyCard'
import ActivityCard from '../../components/clients/profile/ActivityCard'
import { AccountStatusCard, QuickActionsCard, InternalNotesCard } from '../../components/clients/profile/ProfileSidePanel'
import ProfileSkeleton from '../../components/clients/profile/ProfileSkeleton'
import SectionPlaceholder from '../../components/clients/profile/SectionPlaceholder'

// ADM-012 — Client Profile. An admin view/control layer over the existing
// client record: no duplicate admin profile collection is created.
export default function ClientProfile() {
  const { clientId, section } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedMarket } = useMarketContext()
  const { can } = usePermissions()

  const { profile, error, loading, refetch } = useClientProfile(clientId, selectedMarket.id)

  const [dialog, setDialog] = useState(false)
  const [toast, setToast] = useState(null)
  const [noteFocus, setNoteFocus] = useState(0)
  const toastTimer = useRef(null)

  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // Keep the "back to directory" context (filters, page) through the profile.
  const from = location.state?.from
  const linkState = useMemo(() => (from ? { from } : undefined), [from])

  const canSeeFinancial = can(PERMISSIONS.FINANCE_VIEW)
  const canSeeSafety = can(PERMISSIONS.DISPUTES_MANAGE)
  const canAccountActions = can(PERMISSIONS.USERS_SUSPEND)

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      showToast(`${value} copied`)
    } catch {
      showToast('Unable to copy to clipboard')
    }
  }

  const tab = !section ? 'overview' : PROFILE_TABS.find((t) => t.section === section)?.id || (EXTRA_SECTIONS[section] ? 'account' : null)
  if (tab === null) return <Navigate to={`/clients/${clientId}`} replace />

  const base = `/clients/${clientId}`
  const goTo = (s) => `${base}/${s}`
  const name = profile?.name || clientId

  const menuItems = [
    { label: 'Send Notification', icon: Send, onClick: () => setDialog(true) },
    { label: 'Add Internal Note', icon: SquarePen, onClick: () => setNoteFocus((n) => n + 1) },
    { label: 'Copy Client ID', icon: Copy, onClick: () => copy(clientId) },
    canAccountActions && { label: 'Account Actions', icon: Settings, to: goTo('account') },
  ].filter(Boolean)

  const submitNotification = async ({ title, text }) => {
    await clientService.sendNotification({ clientIds: [clientId], title, message: text })
    showToast(`Notification queued for ${name}`)
    setDialog(false)
  }

  const tabMeta = PROFILE_TABS.find((t) => t.id === tab)
  const placeholderTitle = tab === 'account' ? EXTRA_SECTIONS.account.label : tabMeta?.label
  const placeholderScreen = tab === 'account' ? EXTRA_SECTIONS.account.screen : tabMeta?.screen

  return (
    <div className="flex min-h-full flex-col px-3.5 pt-2.5 pb-6">
      {/* Breadcrumb — keeps the admin oriented; country context lives in the top bar */}
      <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-[13px] text-[#1b1140]">
        <Link to="/clients" className="hover:text-[#4527c8]">Client Management</Link>
        <ChevronRight className="size-3.5 text-[#4a4466]" />
        <Link to={from || '/clients/all'} className="hover:text-[#4527c8]">All Clients</Link>
        <ChevronRight className="size-3.5 text-[#4a4466]" />
        <span className="font-medium">{name}</span>
      </nav>

      {error ? (
        <div className="mx-auto mt-6 w-full max-w-xl">
          <ErrorState title="Unable to open this client" description={error} onRetry={refetch} />
          <div className="mt-4 text-center">
            <button type="button" onClick={() => navigate(from || '/clients/all')} className="text-[13px] font-semibold text-[#3b1fd6] hover:underline">Back to All Clients</button>
          </div>
        </div>
      ) : loading || !profile ? (
        <ProfileSkeleton />
      ) : (
        <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_290px]">
          <div className="@container min-w-0 space-y-3">
            <ProfileHeader
              profile={profile}
              tab={tab === 'account' ? '' : tab}
              can={can}
              linkState={linkState}
              onNotify={() => setDialog(true)}
              onCopyId={copy}
              menuItems={menuItems}
            />

            {tab === 'overview' && (
              <>
                <ProfileKpis profile={profile} canSeeFinancial={canSeeFinancial} />

                <div className="grid items-stretch gap-3 @[56rem]:grid-cols-[minmax(0,298fr)_minmax(0,339fr)_minmax(0,325fr)]">
                  <ContactCard
                    profile={profile}
                    canEdit={canAccountActions}
                    canReveal={can(PERMISSIONS.USERS_REVEAL_PII)}
                    editTo={goTo('account')}
                    linkState={linkState}
                    onError={showToast}
                  />
                  <div className="flex min-w-0 flex-col gap-3">
                    <MembershipCard profile={profile} canSeeFinancial={canSeeFinancial} to={goTo('membership')} linkState={linkState} />
                    <RecentBookingsCard profile={profile} allTo={goTo('bookings')} linkState={linkState} />
                  </div>
                  {canSeeFinancial && (
                    <div className="flex min-w-0 flex-col gap-3">
                      <WalletCard profile={profile} to={goTo('wallet')} linkState={linkState} />
                      <RecentPaymentsCard profile={profile} allTo={goTo('payments')} linkState={linkState} />
                    </div>
                  )}
                </div>

                <div className="grid items-stretch gap-3 @[56rem]:grid-cols-[minmax(0,298fr)_minmax(0,339fr)_minmax(0,325fr)]">
                  <ReferralsCard profile={profile} canSeeFinancial={canSeeFinancial} to={goTo('loyalty')} linkState={linkState} onCopy={copy} />
                  {can(PERMISSIONS.SUPPORT_VIEW) && (
                    <SupportSafetyCard profile={profile} canSeeSafety={canSeeSafety} to={goTo('support')} linkState={linkState} />
                  )}
                  <ActivityCard profile={profile} to={goTo('activity')} linkState={linkState} />
                </div>
              </>
            )}

            {tab === 'activity' && <ActivityCard profile={profile} />}

            {tab !== 'overview' && tab !== 'activity' && (
              <SectionPlaceholder title={placeholderTitle} screen={placeholderScreen} clientId={clientId} linkState={linkState} />
            )}
          </div>

          {/* Control panel — stays in view while the profile scrolls */}
          <aside className="space-y-3 xl:sticky xl:top-3 xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto xl:pr-0.5 [scrollbar-width:thin]" aria-label="Account controls">
            <AccountStatusCard profile={profile} can={can} canSeeFinancial={canSeeFinancial} canSeeSafety={canSeeSafety} />
            <QuickActionsCard
              clientId={clientId}
              can={can}
              canSeeFinancial={canSeeFinancial}
              canAccountActions={canAccountActions}
              linkState={linkState}
              onNotify={() => setDialog(true)}
            />
            <InternalNotesCard key={clientId} clientId={clientId} focusSignal={noteFocus} onSaved={showToast} onError={showToast} />
          </aside>
        </div>
      )}

      {dialog && (
        <ClientActionDialog mode="notification" targetLabel={`To ${name} · ${clientId}`} onSubmit={submitNotification} onClose={() => setDialog(false)} />
      )}

      {toast && (
        <div role="status" className="fixed right-6 bottom-6 z-[80] flex items-center gap-2.5 rounded-xl bg-[#1b1140] px-4 py-3 text-[13px] font-medium text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <CircleCheck className="size-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  )
}
