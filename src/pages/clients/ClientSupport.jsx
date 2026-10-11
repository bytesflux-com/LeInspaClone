import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { ChevronRight, CircleCheck } from 'lucide-react'
import { useMarketContext } from '../../hooks/useMarketContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useClientSupport, useSupportCasePreview } from '../../hooks/useClientSupport'
import { clientService } from '../../services/clientService'
import { PERMISSIONS } from '../../constants/permissions'
import { DEFAULT_PAGE_SIZE } from '../../constants/clientSupport'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import BookingsHeader from '../../components/clients/bookings/BookingsHeader'
import SupportKpis from '../../components/clients/support/SupportKpis'
import { NeedsAttentionCard, AccountSafetyCard, SafetyStatusCard } from '../../components/clients/support/SupportOverview'
import SupportToolbar from '../../components/clients/support/SupportToolbar'
import SupportTable from '../../components/clients/support/SupportTable'
import SupportDrawer from '../../components/clients/support/SupportDrawer'
import { ReportsSubmittedCard, ReportsAboutCard, CaseOutcomesCard } from '../../components/clients/support/SupportBottomCards'
import SupportSkeleton from '../../components/clients/support/SupportSkeleton'

// The URL is the single source of truth for the tab / filters / page / selected case, so
// returning from a Booking, Payment, Dispute or Investigation restores the exact view.
const DEFAULTS = { tab: 'all', q: '', date: '', status: 'all', priority: '', cat: '', assigned: '', linked: '', sort: 'newest', page: 1, size: DEFAULT_PAGE_SIZE }

function readParams(sp) {
  const num = (key) => {
    const n = Number(sp.get(key))
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : DEFAULTS[key]
  }
  return {
    tab: sp.get('tab') || DEFAULTS.tab,
    q: sp.get('q') || '',
    date: sp.get('date') || '',
    status: sp.get('status') || DEFAULTS.status,
    priority: sp.get('priority') || '',
    cat: sp.get('cat') || '',
    assigned: sp.get('assigned') || '',
    linked: sp.get('linked') || '',
    sort: sp.get('sort') || DEFAULTS.sort,
    page: num('page'),
    size: num('size'),
  }
}

// ADM-018 — Client Support & Safety History. An aggregated Admin view over the real Support,
// Dispute, Safety and Report systems — there is no admin-only case collection. The four case
// types stay distinct; resolution happens in each dedicated workflow, never here (disputes are
// not resolved from this page, safety evidence is not shown here). Support cases can be
// replied to, noted, reassigned and escalated from the drawer; internal notes and client
// conversation are separate. Safety data needs stronger permission than ordinary support data.
export default function ClientSupport() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [sp, setSp] = useSearchParams()
  const { selectedMarket } = useMarketContext()
  const { can } = usePermissions()

  const canView = can(PERMISSIONS.SUPPORT_VIEW)
  const canSeeSafety = can(PERMISSIONS.DISPUTES_MANAGE)
  const canSeeFinance = can(PERMISSIONS.FINANCE_VIEW)
  const perms = useMemo(() => ({ safety: canSeeSafety, finance: canSeeFinance }), [canSeeSafety, canSeeFinance])

  const params = useMemo(() => readParams(sp), [sp])
  const query = useMemo(() => ({ ...params, pageSize: params.size }), [params])
  const { data, error, loading, fetching, refetch } = useClientSupport(canView ? clientId : null, selectedMarket.id, query, perms)

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
      // Any list change resets paging and selection, except paging/selection themselves.
      if (!('page' in patch) && !('c' in patch)) next.delete('page')
      if (!('c' in patch)) next.delete('c')
      setSp(next, { replace: true })
    },
    [sp, setSp],
  )

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams()
    if (sp.get('size')) next.set('size', sp.get('size'))
    setSp(next, { replace: true })
  }, [sp, setSp])

  const hasFilters = Boolean(params.q || params.date || params.priority || params.cat || params.assigned || params.linked || params.sort !== 'newest' || params.status !== 'all' || params.tab !== 'all')

  // Drawer selection: first row by default, "-" means the admin closed it.
  const cParam = sp.get('c')
  const selectedId = cParam === '-' ? null : cParam || data?.items?.[0]?.id || null
  const [mutation, setMutation] = useState(0)
  const { preview, error: previewError, loading: previewLoading } = useSupportCasePreview(canView ? selectedId : null, clientId, selectedMarket.id, perms, mutation)
  const item = data?.items?.find((i) => i.id === selectedId) || (preview?.id === selectedId ? preview : null)

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

  // Each action revalidates on the server; the drawer and list refresh from the case records.
  const refreshed = (message) => {
    setMutation((n) => n + 1)
    refetch()
    showToast(message)
  }
  const actions = {
    reply: async (text) => {
      await clientService.replyToSupportCase({ clientId, caseId: selectedId, text })
      refreshed('Reply sent to client')
    },
    note: async (text) => {
      await clientService.addSupportCaseNote({ clientId, caseId: selectedId, text })
      refreshed('Internal note saved')
    },
    reassign: async (assignee) => {
      await clientService.reassignSupportCase({ clientId, caseId: selectedId, assignee })
      refreshed(`Case reassigned to ${assignee}`)
    },
    escalate: async () => {
      await clientService.escalateSupportCase({ clientId, caseId: selectedId })
      refreshed('Case escalated to the Support Lead')
    },
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
      <span className="font-medium">Client Support &amp; Safety History</span>
    </nav>
  )

  let body
  if (!canView) {
    body = (
      <div className="mx-auto mt-6 w-full max-w-xl">
        <ErrorState title="You don't have access to support history" description="Support records need support-viewing permission. Ask a Super Admin or Support Admin to grant it." />
      </div>
    )
  } else if (error && !data) {
    body = (
      <div className="mx-auto mt-6 w-full max-w-xl">
        <ErrorState title="Unable to open this support history" description={error} onRetry={refetch} />
        <div className="mt-4 text-center">
          <button type="button" onClick={() => navigate(from || '/clients/all')} className="text-[13px] font-semibold text-[#3b1fd6] hover:underline">Back to All Clients</button>
        </div>
      </div>
    )
  } else if (loading || !data) {
    body = <SupportSkeleton />
  } else {
    const drawerOpen = Boolean(selectedId)
    const hasAttention = data.attention.length > 0
    const openAttention = (c) => update({ c: c.id, tab: 'all' })
    body = (
      <div className={drawerOpen ? 'grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_340px]' : ''}>
        <div className="@container min-w-0 space-y-3">
          {crumb}
          <BookingsHeader client={data.client} backTo={`/clients/${clientId}`} linkState={profileState} onCopyId={copy} statusLabel={data.client.status === 'active' ? 'Active Account' : undefined} />

          <SupportKpis summary={data.summary} activeTab={params.tab} onSelect={(tab) => update({ tab })} />

          <div className={hasAttention ? 'grid gap-3 @[56rem]:grid-cols-3' : 'grid gap-3 @[56rem]:grid-cols-2'}>
            {hasAttention && <NeedsAttentionCard attention={data.attention} timeZone={data.client.timeZone} onOpen={openAttention} />}
            <AccountSafetyCard account={data.account} />
            <SafetyStatusCard safety={data.safety} onOpenSafety={() => update({ tab: 'safety' })} />
          </div>

          <section aria-label="Support and safety history" className="rounded-xl border border-[#e6e1f3] bg-white p-3 shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)]">
            <SupportToolbar params={params} counts={data.counts} assignees={data.assignees} onChange={update} onClear={clearFilters} hasFilters={hasFilters} />
            {error && <p role="alert" className="mt-3 rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">{error} <button type="button" onClick={refetch} className="font-semibold underline">Retry</button></p>}
            <div className="mt-3">
              <SupportTable
                data={data}
                selectedId={selectedId}
                fetching={fetching}
                tab={params.tab}
                hasFilters={hasFilters}
                onSelect={(id) => update({ c: id })}
                onPage={(page) => update({ page })}
                onPageSize={(size) => update({ size })}
                onClear={clearFilters}
              />
            </div>
          </section>

          <div className="grid gap-3 @[56rem]:grid-cols-[1.35fr_1fr_1fr]">
            <ReportsSubmittedCard reports={data.reportsSubmitted} timeZone={data.client.timeZone} onViewAll={() => update({ tab: 'report' })} onOpen={(id) => update({ c: id })} />
            <ReportsAboutCard reports={data.reportsAbout} timeZone={data.client.timeZone} />
            <CaseOutcomesCard outcomes={data.outcomes} timeZone={data.client.timeZone} />
          </div>
        </div>

        {drawerOpen && (
          <>
            <button type="button" aria-label="Close case details" onClick={() => update({ c: '-' })} className="fixed inset-0 z-40 bg-[#1b1140]/30 xl:hidden" />
            <div className="max-xl:fixed max-xl:inset-y-0 max-xl:right-0 max-xl:z-50 max-xl:w-[380px] max-xl:overflow-y-auto max-xl:bg-[#f7f6fc] max-xl:p-3 max-xl:shadow-2xl xl:sticky xl:top-3 xl:max-h-[calc(100vh-1.5rem)] xl:overflow-y-auto [scrollbar-width:thin]">
              {item ? (
                <SupportDrawer
                  key={item.id}
                  item={item}
                  preview={preview}
                  loading={previewLoading}
                  error={previewError}
                  client={data.client}
                  onClose={() => update({ c: '-' })}
                  actions={actions}
                  links={{
                    booking: (id) => `/bookings/${id}`,
                    payment: (id) => `/payments/${id}`,
                    dispute: (id) => `/disputes/${id}`,
                    safety: (id) => `/safety/${id}`,
                    report: (id) => `/reports/${id}`,
                    provider: (id) => `/providers/${id}`,
                    state: linkState,
                  }}
                />
              ) : (
                <Skeleton className="h-[900px] rounded-xl" />
              )}
            </div>
          </>
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
