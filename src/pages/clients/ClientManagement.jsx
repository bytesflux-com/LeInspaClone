import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { CircleCheck, Download, SlidersHorizontal } from 'lucide-react'
import { useMarketContext } from '../../hooks/useMarketContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useClientDashboard } from '../../hooks/useClientDashboard'
import { clientService } from '../../services/clientService'
import { PERMISSIONS } from '../../constants/permissions'
import { downloadTextFile } from '../../lib/download'
import ErrorState from '../../components/ui/ErrorState'
import ClientKpiCards from '../../components/clients/dashboard/ClientKpiCards'
import NeedsAttentionCard from '../../components/clients/dashboard/NeedsAttentionCard'
import ClientSegmentsCard from '../../components/clients/dashboard/ClientSegmentsCard'
import DashboardDirectory, { useDirectoryState } from '../../components/clients/dashboard/DashboardDirectory'
import MembershipDistributionCard from '../../components/clients/dashboard/MembershipDistributionCard'
import ClientGrowthCard from '../../components/clients/dashboard/ClientGrowthCard'
import BookingActivityCard from '../../components/clients/dashboard/BookingActivityCard'
import LocationDistributionCard from '../../components/clients/dashboard/LocationDistributionCard'
import GuestConversionCard from '../../components/clients/dashboard/GuestConversionCard'
import ClientOverviewPanel from '../../components/clients/dashboard/ClientOverviewPanel'
import MoreFiltersDrawer from '../../components/clients/MoreFiltersDrawer'

// ADM-010 — Client Management Dashboard. A view over the existing client source
// of truth; the detailed profile is ADM-012 and the full directory is ADM-011.
const AUTO_OPEN_FIRST_CLIENT = true // matches the ADM-010 mockup's initial state

export default function ClientManagement() {
  const navigate = useNavigate()
  const { selectedMarket } = useMarketContext()
  const { can } = usePermissions()
  const canExport = can(PERMISSIONS.USERS_EXPORT)
  const canSeeFinancial = can(PERMISSIONS.FINANCE_VIEW)

  const dash = useClientDashboard()
  const [segment, setSegment] = useState('all')
  const dir = useDirectoryState({ market: selectedMarket.id, segment })
  const [previewId, setPreviewId] = useState(null)
  const [selected, setSelected] = useState(() => new Map())
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)
  const toastTimer = useRef(null)

  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // Initial state mirrors the mockup: first client previewed.
  const autoOpened = useRef(false)
  const firstItems = dir.data?.items
  useEffect(() => {
    if (autoOpened.current || !firstItems?.length) return
    autoOpened.current = true
    if (AUTO_OPEN_FIRST_CLIENT) setPreviewId(firstItems[0].id)
  }, [firstItems])

  const selectSegment = (id) => {
    setSegment(id)
    dir.update({ membership: '', status: 'all', guest: '' })
  }
  const clearSegment = () => segment !== 'all' && setSegment('all')

  const toggleOne = (client) =>
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(client.id)) next.delete(client.id)
      else next.set(client.id, client)
      return next
    })
  const togglePage = (pageItems) =>
    setSelected((prev) => {
      const next = new Map(prev)
      const all = pageItems.every((c) => next.has(c.id))
      for (const c of pageItems) {
        if (all) next.delete(c.id)
        else next.set(c.id, c)
      }
      return next
    })

  const stamp = () => new Date().toISOString().slice(0, 10)
  const exportClients = async () => {
    setBusy(true)
    try {
      downloadTextFile(`le-inspa-clients-${stamp()}.csv`, await clientService.exportClients(dir.params))
      showToast('Client export downloaded')
    } catch (err) {
      showToast(err?.message || 'Export failed')
    } finally {
      setBusy(false)
    }
  }
  const exportSelected = () => {
    downloadTextFile(`le-inspa-clients-selected-${stamp()}.csv`, clientService.rowsToCsv([...selected.values()]))
    showToast(`Exported ${selected.size} selected ${selected.size === 1 ? 'client' : 'clients'}`)
  }
  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id)
      showToast(`${id} copied`)
    } catch {
      showToast('Unable to copy to clipboard')
    }
  }

  const fallback = firstItems?.find((c) => c.id === previewId) || null
  const goProfile = (id) => navigate(`/clients/${id}`)

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-3 pt-2 pb-2">
        <div>
          <h1 className="text-[28px] leading-tight font-bold tracking-tight text-[#1b1140]">Client Management</h1>
          <p className="mt-0 text-[13px] text-[#2a1b57]">Manage client accounts, memberships, activity and account status across Lé Inspa.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden rotate-[-4deg] text-center leading-[1.05] text-[#2a1b57] 2xl:block" style={{ fontFamily: "'Caveat', 'Segoe Script', cursive" }} aria-hidden="true">
            <p className="text-[24px]">Wellness</p>
            <p className="-mt-0.5 text-[24px]">Without Limits</p>
            <svg viewBox="0 0 120 10" className="ml-auto -mt-0.5 h-2 w-28 text-[#2a1b57]"><path d="M2 7 C30 1, 70 9, 118 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </div>
          <button type="button" onClick={() => setFiltersOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#cfc5ee] bg-white px-4 text-[13px] font-semibold text-[#2a1b57] shadow-xs transition hover:bg-[#f4f1fc]">
            <SlidersHorizontal className="size-4 text-[#4527c8]" /> Filters
          </button>
          {canExport && (
            <button type="button" onClick={exportClients} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#4125d0] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3519b8] disabled:opacity-60">
              <Download className="size-4" /> Export Clients
            </button>
          )}
        </div>
      </header>

      {dash.error && !dash.data ? (
        <div className="px-3"><ErrorState title="Unable to load the client dashboard" description={dash.error} onRetry={dash.refetch} /></div>
      ) : (
        <div className="grid items-start gap-2 px-3 pb-3 xl:grid-cols-[minmax(0,1fr)_264px]">
          <div className="@container min-w-0 space-y-2">
            <ClientKpiCards kpis={dash.data?.kpis} deltaLabel={dash.data?.deltaLabel} />
            <NeedsAttentionCard attention={dash.data?.attention} />
            <ClientSegmentsCard counts={dash.data?.segments} active={segment} onSelect={selectSegment} />

            <DashboardDirectory
              dir={dir}
              market={selectedMarket}
              segment={segment}
              onClearSegment={clearSegment}
              selectedId={previewId}
              onSelect={setPreviewId}
              onOpenProfile={goProfile}
              onOpenFilters={() => setFiltersOpen(true)}
              selected={selected}
              onToggle={toggleOne}
              onTogglePage={togglePage}
              onExportSelected={exportSelected}
              onClearSelection={() => setSelected(new Map())}
              canSeeFinancial={canSeeFinancial}
            />

            <div className="grid gap-2 @2xl:grid-cols-2 @[62rem]:grid-cols-[0.85fr_1fr_1fr]">
              <MembershipDistributionCard membership={dash.data?.membership} activeSegment={segment} onSelectTier={selectSegment} />
              <ClientGrowthCard />
              <BookingActivityCard booking={dash.data?.booking} />
            </div>
          </div>

          <aside className="min-w-0 space-y-2" aria-label="Client details and insights">
            {previewId && <ClientOverviewPanel key={previewId} clientId={previewId} fallback={fallback} onClose={() => setPreviewId(null)} onCopyId={copyId} />}
            <LocationDistributionCard locations={dash.data?.locations} />
            <GuestConversionCard guest={dash.data?.guest} />
          </aside>
        </div>
      )}

      <MoreFiltersDrawer
        open={filtersOpen}
        filters={dir.filters}
        market={selectedMarket}
        canSeeSafety={can(PERMISSIONS.DISPUTES_MANAGE)}
        canSeeFinancial={canSeeFinancial}
        onApply={(patch) => {
          setSegment('all')
          dir.update(patch)
        }}
        onReset={() => {
          setSegment('all')
          dir.reset()
        }}
        onClose={() => setFiltersOpen(false)}
      />

      {toast && (
        <div role="status" className="fixed right-6 bottom-6 z-[80] flex items-center gap-2.5 rounded-xl bg-[#1b1140] px-4 py-3 text-[13px] font-medium text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <CircleCheck className="size-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  )
}
