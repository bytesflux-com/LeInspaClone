import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { ChevronRight, CircleCheck, TriangleAlert } from 'lucide-react'
import { useMarketContext } from '../../hooks/useMarketContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useClientWallet, useWalletBalanceHistory, useWalletTransactionPreview } from '../../hooks/useClientWallet'
import { clientService } from '../../services/clientService'
import { PERMISSIONS } from '../../constants/permissions'
import { DEFAULT_PAGE_SIZE } from '../../constants/clientWallet'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import BookingsHeader from '../../components/clients/bookings/BookingsHeader'
import WalletKpis from '../../components/clients/wallet/WalletKpis'
import WalletStatusCard from '../../components/clients/wallet/WalletStatusCard'
import BalanceHistoryCard from '../../components/clients/wallet/BalanceHistoryCard'
import WalletToolbar from '../../components/clients/wallet/WalletToolbar'
import WalletTable from '../../components/clients/wallet/WalletTable'
import WalletDrawer from '../../components/clients/wallet/WalletDrawer'
import WalletSkeleton from '../../components/clients/wallet/WalletSkeleton'

// URL is the single source of truth for tab / filters / page / selection, so
// returning from Payment, Booking or Refund details restores the exact ledger view.
const DEFAULTS = { tab: 'all', q: '', date: '', ttype: '', status: 'all', effect: '', linked: '', sort: 'newest', page: 1, size: DEFAULT_PAGE_SIZE }

function readParams(sp) {
  const num = (key) => {
    const n = Number(sp.get(key))
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : DEFAULTS[key]
  }
  return {
    tab: sp.get('tab') || DEFAULTS.tab,
    q: sp.get('q') || '',
    date: sp.get('date') || '',
    ttype: sp.get('ttype') || '',
    status: sp.get('status') || DEFAULTS.status,
    effect: sp.get('effect') || '',
    linked: sp.get('linked') || '',
    sort: sp.get('sort') || DEFAULTS.sort,
    page: num('page'),
    size: num('size'),
  }
}

// ADM-015 — Client Wallet. A read-only financial ledger over the existing Client
// Wallet (`wallets` + `wallet_transactions`). Nothing here edits money: there is no
// edit-balance, set-balance or delete-transaction control. Any correction belongs to a
// separate, permission-controlled adjustment workflow with a reason, approval and audit trail.
export default function ClientWallet() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [sp, setSp] = useSearchParams()
  const { selectedMarket } = useMarketContext()
  const { can } = usePermissions()

  const canView = can(PERMISSIONS.FINANCE_VIEW)

  const params = useMemo(() => readParams(sp), [sp])
  const query = useMemo(() => ({ ...params, pageSize: params.size }), [params])
  const { data, error, loading, fetching, refetch } = useClientWallet(canView ? clientId : null, selectedMarket.id, query)

  const [historyWindow, setHistoryWindow] = useState(30)
  const { history, error: historyError, loading: historyLoading } = useWalletBalanceHistory(canView ? clientId : null, selectedMarket.id, historyWindow)

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

  const hasFilters = Boolean(params.q || params.date || params.ttype || params.effect || params.linked || params.sort !== 'newest' || params.status !== 'all' || params.tab !== 'all')

  // Drawer selection: first row by default, "-" means the admin closed it.
  const pParam = sp.get('p')
  const selectedId = pParam === '-' ? null : pParam || data?.items?.[0]?.id || null
  const [noteNonce, setNoteNonce] = useState(0)
  const { preview, error: previewError, loading: previewLoading } = useWalletTransactionPreview(canView ? selectedId : null, clientId, selectedMarket.id, noteNonce)
  const txn = data?.items?.find((i) => i.id === selectedId) || (preview?.id === selectedId ? preview : null)

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

  const saveNote = async (txnId, text) => {
    await clientService.addWalletTransactionNote({ clientId, txnId, text })
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
      <span className="font-medium">Client Wallet</span>
    </nav>
  )

  let body
  if (!canView) {
    body = (
      <div className="mx-auto mt-6 w-full max-w-xl">
        <ErrorState title="You don't have access to this wallet" description="Financial records need payment-viewing permission. Ask a Super Admin or Finance Admin to grant it." />
      </div>
    )
  } else if (error && !data) {
    body = (
      <div className="mx-auto mt-6 w-full max-w-xl">
        <ErrorState title="Unable to open this wallet" description={error} onRetry={refetch} />
        <div className="mt-4 text-center">
          <button type="button" onClick={() => navigate(from || '/clients/all')} className="text-[13px] font-semibold text-[#3b1fd6] hover:underline">Back to All Clients</button>
        </div>
      </div>
    )
  } else if (loading || !data) {
    body = <WalletSkeleton />
  } else {
    const drawerOpen = Boolean(selectedId)
    body = (
      <div className={drawerOpen ? 'grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_300px]' : ''}>
        <div className="@container min-w-0 space-y-3">
          {crumb}
          <BookingsHeader client={data.client} backTo={`/clients/${clientId}`} linkState={profileState} onCopyId={copy} verifiedLabel="Contact Verified" />

          {!data.summary.reconciled && (
            <p role="alert" className="flex items-start gap-2 rounded-xl border border-[#f3d9a8] bg-[#fff6e4] px-3.5 py-2.5 text-[12.5px] text-[#92510a]">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>This wallet's balance does not match its transaction history (credits − debits). It has been flagged for Finance review; nothing was changed automatically.</span>
            </p>
          )}

          <WalletKpis summary={data.summary} currency={data.client.currency} activeTab={params.tab} onSelect={(tab) => update({ tab })} />

          <div className="grid gap-3 @[56rem]:grid-cols-2">
            <WalletStatusCard wallet={data.wallet} client={data.client} onCopy={copy} />
            <BalanceHistoryCard history={history} loading={historyLoading} error={historyError} window={historyWindow} onWindow={setHistoryWindow} currency={data.client.currency} timeZone={data.client.timeZone} />
          </div>

          <section aria-label="Wallet transactions" className="rounded-xl border border-[#e6e1f3] bg-white p-3 shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)]">
            <WalletToolbar params={params} counts={data.summary.counts} onChange={update} onClear={clearFilters} hasFilters={hasFilters} />
            {error && <p role="alert" className="mt-3 rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">{error} <button type="button" onClick={refetch} className="font-semibold underline">Retry</button></p>}
            <div className="mt-3">
              <WalletTable
                data={data}
                selectedId={selectedId}
                fetching={fetching}
                hasFilters={hasFilters}
                onSelect={(id) => update({ p: id })}
                onOpen={(t) => update({ p: t.id })}
                onPage={(page) => update({ page })}
                onPageSize={(size) => update({ size })}
                onClear={clearFilters}
              />
            </div>
          </section>
        </div>

        {drawerOpen && (
          <>
            <button type="button" aria-label="Close wallet transaction details" onClick={() => update({ p: '-' })} className="fixed inset-0 z-40 bg-[#1b1140]/30 xl:hidden" />
            <div className="max-xl:fixed max-xl:inset-y-0 max-xl:right-0 max-xl:z-50 max-xl:w-[360px] max-xl:overflow-y-auto max-xl:bg-[#f7f6fc] max-xl:p-3 max-xl:shadow-2xl xl:sticky xl:top-3 xl:max-h-[calc(100vh-1.5rem)] xl:overflow-y-auto [scrollbar-width:thin]">
              {txn ? (
                <WalletDrawer
                  key={txn.id}
                  txn={txn}
                  preview={preview}
                  loading={previewLoading}
                  error={previewError}
                  client={data.client}
                  onClose={() => update({ p: '-' })}
                  onSaveNote={saveNote}
                  links={{
                    payment: (id) => `/payments/${id}`,
                    booking: (id) => `/bookings/${id}`,
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
