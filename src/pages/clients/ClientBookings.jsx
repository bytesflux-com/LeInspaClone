import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { ChevronRight, CircleCheck } from 'lucide-react'
import { useMarketContext } from '../../hooks/useMarketContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useBookingPreview, useClientBookings } from '../../hooks/useClientBookings'
import { PERMISSIONS } from '../../constants/permissions'
import { DEFAULT_PAGE_SIZE } from '../../constants/clientBookings'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import BookingsHeader from '../../components/clients/bookings/BookingsHeader'
import BookingKpis from '../../components/clients/bookings/BookingKpis'
import BookingToolbar from '../../components/clients/bookings/BookingToolbar'
import BookingTable from '../../components/clients/bookings/BookingTable'
import BookingDrawer from '../../components/clients/bookings/BookingDrawer'
import BookingsSkeleton from '../../components/clients/bookings/BookingsSkeleton'

// URL is the single source of truth for status / filters / page / selection, so
// returning from the shared Booking Details screen restores the exact list.
const DEFAULTS = { status: 'all', q: '', date: '', ptype: '', src: '', pay: '', esc: '', neg: '', guest: '', sort: 'newest', page: 1, size: DEFAULT_PAGE_SIZE }

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
    src: sp.get('src') || '',
    pay: sp.get('pay') || '',
    esc: sp.get('esc') || '',
    neg: sp.get('neg') || '',
    guest: sp.get('guest') || '',
    sort: sp.get('sort') || DEFAULTS.sort,
    page: num('page'),
    size: num('size'),
  }
}

// ADM-013 — Client Bookings. An admin view of the central `bookings` collection
// filtered to one client; operational actions live in the shared Booking Details.
export default function ClientBookings() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [sp, setSp] = useSearchParams()
  const { selectedMarket } = useMarketContext()
  const { can } = usePermissions()

  const canView = can(PERMISSIONS.BOOKINGS_VIEW)
  const canSeeFinancial = can(PERMISSIONS.FINANCE_VIEW)

  const params = useMemo(() => readParams(sp), [sp])
  const query = useMemo(() => ({ ...params, pageSize: params.size }), [params])
  const { data, error, loading, fetching, refetch } = useClientBookings(canView ? clientId : null, selectedMarket.id, query, canSeeFinancial)

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
      if (!('page' in patch) && !('b' in patch)) next.delete('page')
      if (!('b' in patch)) next.delete('b')
      setSp(next, { replace: true })
    },
    [sp, setSp],
  )

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams()
    if (sp.get('size')) next.set('size', sp.get('size'))
    setSp(next, { replace: true })
  }, [sp, setSp])

  const hasFilters = Boolean(params.q || params.date || params.ptype || params.src || params.pay || params.esc || params.neg || params.guest || params.sort !== 'newest' || params.status !== 'all')

  // Drawer selection: first row by default, "-" means the admin closed it.
  const bParam = sp.get('b')
  const selectedId = bParam === '-' ? null : bParam || data?.items?.[0]?.id || null
  const { preview, error: previewError, loading: previewLoading } = useBookingPreview(selectedId, clientId, selectedMarket.id, canSeeFinancial)
  const booking = data?.items?.find((i) => i.id === selectedId) || (preview?.id === selectedId ? preview : null)

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

  const name = data?.client?.name || clientId
  const openBooking = (b) => navigate(`/bookings/${b.id}`, { state: linkState })

  const crumb = (
    <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-[13px] text-[#1b1140]">
      <Link to="/clients" className="hover:text-[#4527c8]">Client Management</Link>
      <ChevronRight className="size-3.5 text-[#4a4466]" />
      <Link to={from || '/clients/all'} className="hover:text-[#4527c8]">All Clients</Link>
      <ChevronRight className="size-3.5 text-[#4a4466]" />
      <Link to={`/clients/${clientId}`} state={profileState} className="hover:text-[#4527c8]">{name}</Link>
      <ChevronRight className="size-3.5 text-[#4a4466]" />
      <span className="font-medium">Client Bookings</span>
    </nav>
  )

  let body
  if (!canView) {
    body = (
      <div className="mx-auto mt-6 w-full max-w-xl">
        <ErrorState title="You don't have access to bookings" description="Your role does not include booking visibility. Ask a Super Admin to grant bookings access." />
      </div>
    )
  } else if (error && !data) {
    body = (
      <div className="mx-auto mt-6 w-full max-w-xl">
        <ErrorState title="Unable to open these bookings" description={error} onRetry={refetch} />
        <div className="mt-4 text-center">
          <button type="button" onClick={() => navigate(from || '/clients/all')} className="text-[13px] font-semibold text-[#3b1fd6] hover:underline">Back to All Clients</button>
        </div>
      </div>
    )
  } else if (loading || !data) {
    body = <BookingsSkeleton />
  } else {
    const drawerOpen = Boolean(selectedId)
    body = (
      <div className={drawerOpen ? 'grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_300px]' : ''}>
        <div className="@container min-w-0 space-y-3">
          {crumb}
          <BookingsHeader client={data.client} backTo={`/clients/${clientId}`} linkState={profileState} onCopyId={copy} />
          <BookingKpis summary={data.summary} activeTab={params.status} onSelect={(status) => update({ status })} />

          <section aria-label="Bookings" className="rounded-xl border border-[#e6e1f3] bg-white p-3 shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)]">
            <BookingToolbar params={params} summary={data.summary} canSeeFinancial={canSeeFinancial} onChange={update} onClear={clearFilters} hasFilters={hasFilters} />
            {error && <p role="alert" className="mt-3 rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">{error} <button type="button" onClick={refetch} className="font-semibold underline">Retry</button></p>}
            <div className="mt-3">
              <BookingTable
                data={data}
                finance={canSeeFinancial}
                selectedId={selectedId}
                fetching={fetching}
                hasFilters={hasFilters}
                onSelect={(id) => update({ b: id })}
                onOpen={openBooking}
                onPage={(page) => update({ page })}
                onPageSize={(size) => update({ size })}
                onClear={clearFilters}
              />
            </div>
          </section>
        </div>

        {drawerOpen && (
          <>
            <button type="button" aria-label="Close booking details" onClick={() => update({ b: '-' })} className="fixed inset-0 z-40 bg-[#1b1140]/30 xl:hidden" />
            <div className="max-xl:fixed max-xl:inset-y-0 max-xl:right-0 max-xl:z-50 max-xl:w-[340px] max-xl:overflow-y-auto max-xl:bg-[#f7f6fc] max-xl:p-3 max-xl:shadow-2xl xl:sticky xl:top-3 xl:max-h-[calc(100vh-1.5rem)] xl:overflow-y-auto [scrollbar-width:thin]">
              {booking ? (
                <BookingDrawer
                  key={booking.id}
                  booking={booking}
                  preview={preview}
                  loading={previewLoading}
                  error={previewError}
                  canSeeFinancial={canSeeFinancial}
                  client={data.client}
                  onClose={() => update({ b: '-' })}
                  links={{
                    full: `/bookings/${booking.id}`,
                    provider: `/providers/${booking.providerId}`,
                    service: `/services/${booking.serviceId}`,
                    payment: `/payments/${booking.paymentId}`,
                    state: linkState,
                  }}
                />
              ) : (
                <Skeleton className="h-[720px] rounded-xl" />
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col px-3.5 pt-2.5 pb-6">
      {/* While loading / on error the breadcrumb sits above the state; once loaded it lives in the left column. */}
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
