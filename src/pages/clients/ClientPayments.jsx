import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { ChevronRight, CircleCheck } from 'lucide-react'
import { useMarketContext } from '../../hooks/useMarketContext'
import { useDateRange } from '../../hooks/useDateRange'
import { usePermissions } from '../../hooks/usePermissions'
import { useClientPayments, usePaymentPreview } from '../../hooks/useClientPayments'
import { clientService } from '../../services/clientService'
import { PERMISSIONS } from '../../constants/permissions'
import { DEFAULT_PAGE_SIZE } from '../../constants/clientPayments'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import BookingsHeader from '../../components/clients/bookings/BookingsHeader'
import PaymentKpis from '../../components/clients/payments/PaymentKpis'
import PaymentToolbar from '../../components/clients/payments/PaymentToolbar'
import PaymentTable from '../../components/clients/payments/PaymentTable'
import PaymentDrawer from '../../components/clients/payments/PaymentDrawer'
import PaymentsSkeleton from '../../components/clients/payments/PaymentsSkeleton'

// URL is the single source of truth for status / filters / page / selection, so
// returning from Booking, Escrow or Refund details restores the exact list.
const DEFAULTS = { status: 'all', q: '', date: '', ptype: '', method: '', esc: '', refund: '', sort: 'newest', page: 1, size: DEFAULT_PAGE_SIZE }

function readParams(sp) {
  const num = (key) => {
    const n = Number(sp.get(key))
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : DEFAULTS[key]
  }
  return {
    status: sp.get('status') || DEFAULTS.status,
    q: sp.get('q') || '',
    date: sp.get('date') || '',
    ptype: sp.get('ptype') || '',
    method: sp.get('method') || '',
    esc: sp.get('esc') || '',
    refund: sp.get('refund') || '',
    sort: sp.get('sort') || DEFAULTS.sort,
    page: num('page'),
    size: num('size'),
  }
}

// ADM-014 — Client Payments. A read-only financial ledger over the central
// `payments` collection for one client. Nothing here edits money: corrections
// belong to explicit refund / adjustment workflows with audit history.
export default function ClientPayments() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [sp, setSp] = useSearchParams()
  const { selectedMarket } = useMarketContext()
  const { dateRangeLabel } = useDateRange()
  const { can } = usePermissions()

  const canView = can(PERMISSIONS.FINANCE_VIEW)

  const params = useMemo(() => readParams(sp), [sp])
  const query = useMemo(() => ({ ...params, pageSize: params.size }), [params])
  const { data, error, loading, fetching, refetch } = useClientPayments(canView ? clientId : null, selectedMarket.id, query)

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
      if (!('page' in patch) && !('p' in patch)) next.delete('page')
      if (!('p' in patch)) next.delete('p')
      setSp(next, { replace: true })
    },
    [sp, setSp],
  )

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams()
    if (sp.get('size')) next.set('size', sp.get('size'))
    setSp(next, { replace: true })
  }, [sp, setSp])

  const hasFilters = Boolean(params.q || params.date || params.ptype || params.method || params.esc || params.refund || params.sort !== 'newest' || params.status !== 'all')

  // Drawer selection: first row by default, "-" means the admin closed it.
  const pParam = sp.get('p')
  const selectedId = pParam === '-' ? null : pParam || data?.items?.[0]?.id || null
  const [noteNonce, setNoteNonce] = useState(0)
  const { preview, error: previewError, loading: previewLoading } = usePaymentPreview(canView ? selectedId : null, clientId, selectedMarket.id, noteNonce)
  const payment = data?.items?.find((i) => i.id === selectedId) || (preview?.id === selectedId ? preview : null)

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

  const saveNote = async (paymentId, text) => {
    await clientService.addPaymentNote({ clientId, paymentId, text })
    setNoteNonce((n) => n + 1)
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
      <span className="font-medium">Client Payments</span>
    </nav>
  )

  let body
  if (!canView) {
    body = (
      <div className="mx-auto mt-6 w-full max-w-xl">
        <ErrorState title="You don't have access to payments" description="Financial records need payment-viewing permission. Ask a Super Admin or Finance Admin to grant it." />
      </div>
    )
  } else if (error && !data) {
    body = (
      <div className="mx-auto mt-6 w-full max-w-xl">
        <ErrorState title="Unable to open these payments" description={error} onRetry={refetch} />
        <div className="mt-4 text-center">
          <button type="button" onClick={() => navigate(from || '/clients/all')} className="text-[13px] font-semibold text-[#3b1fd6] hover:underline">Back to All Clients</button>
        </div>
      </div>
    )
  } else if (loading || !data) {
    body = <PaymentsSkeleton />
  } else {
    const drawerOpen = Boolean(selectedId)
    body = (
      <div className={drawerOpen ? 'grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_300px]' : ''}>
        <div className="@container min-w-0 space-y-3">
          {crumb}
          <BookingsHeader client={data.client} backTo={`/clients/${clientId}`} linkState={profileState} onCopyId={copy} />
          <PaymentKpis summary={data.summary} currency={data.client.currency} periodLabel={dateRangeLabel} activeTab={params.status} onSelect={(status) => update({ status })} />

          <section aria-label="Payment history" className="rounded-xl border border-[#e6e1f3] bg-white p-3 shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)]">
            <PaymentToolbar params={params} summary={data.summary} onChange={update} onClear={clearFilters} hasFilters={hasFilters} />
            {error && <p role="alert" className="mt-3 rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">{error} <button type="button" onClick={refetch} className="font-semibold underline">Retry</button></p>}
            <div className="mt-3">
              <PaymentTable
                data={data}
                selectedId={selectedId}
                fetching={fetching}
                hasFilters={hasFilters}
                onSelect={(id) => update({ p: id })}
                onOpen={(p) => navigate(`/payments/${p.id}`, { state: linkState })}
                onPage={(page) => update({ page })}
                onPageSize={(size) => update({ size })}
                onClear={clearFilters}
              />
            </div>
          </section>
        </div>

        {drawerOpen && (
          <>
            <button type="button" aria-label="Close payment details" onClick={() => update({ p: '-' })} className="fixed inset-0 z-40 bg-[#1b1140]/30 xl:hidden" />
            <div className="max-xl:fixed max-xl:inset-y-0 max-xl:right-0 max-xl:z-50 max-xl:w-[360px] max-xl:overflow-y-auto max-xl:bg-[#f7f6fc] max-xl:p-3 max-xl:shadow-2xl xl:sticky xl:top-3 xl:max-h-[calc(100vh-1.5rem)] xl:overflow-y-auto [scrollbar-width:thin]">
              {payment ? (
                <PaymentDrawer
                  key={payment.id}
                  payment={payment}
                  preview={preview}
                  loading={previewLoading}
                  error={previewError}
                  client={data.client}
                  onClose={() => update({ p: '-' })}
                  onSaveNote={saveNote}
                  links={{
                    booking: `/bookings/${payment.bookingId}`,
                    membership: `/clients/${clientId}/membership`,
                    escrow: (id) => `/escrow/${id}`,
                    refund: (id) => `/refunds/${id}`,
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
