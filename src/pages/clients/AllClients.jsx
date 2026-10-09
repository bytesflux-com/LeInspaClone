import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ChevronRight, Download, Plus, CircleCheck } from 'lucide-react'
import { AdminContext } from '../../context/AdminContext'
import { useMarketContext } from '../../hooks/useMarketContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useClientDirectory } from '../../hooks/useClientDirectory'
import { clientService } from '../../services/clientService'
import { PERMISSIONS } from '../../constants/permissions'
import { downloadTextFile } from '../../lib/download'
import ErrorState from '../../components/ui/ErrorState'
import ClientStatusTabs from '../../components/clients/ClientStatusTabs'
import ClientFilterBar from '../../components/clients/ClientFilterBar'
import ClientTable from '../../components/clients/ClientTable'
import ClientPagination from '../../components/clients/ClientPagination'
import ClientBulkBar from '../../components/clients/ClientBulkBar'
import ClientPreviewPanel from '../../components/clients/ClientPreviewPanel'
import MoreFiltersDrawer from '../../components/clients/MoreFiltersDrawer'
import ClientActionDialog from '../../components/clients/ClientActionDialog'

// ADM-011 — All Clients (directory). The detailed profile is ADM-012.
const AUTO_OPEN_FIRST_PREVIEW = true // matches the ADM-011 mockup's initial state

export default function AllClients() {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedMarket, setSelectedMarket } = useMarketContext()
  const adminContext = useContext(AdminContext)
  const { can } = usePermissions()
  const canSearchAllMarkets = adminContext?.permittedMarkets?.includes('ALL')

  const dir = useClientDirectory()
  const { filters, update, data } = dir
  const items = data?.items || null

  const [selected, setSelected] = useState(() => new Map())
  const [tab, setTab] = useState('overview')
  const [moreOpen, setMoreOpen] = useState(false)
  const [dialog, setDialog] = useState(null) // { mode, ids?, clientId? }
  const [noteVersion, setNoteVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = useCallback((message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // Initial state mirrors the mockup: first client previewed and ticked.
  const autoOpened = useRef(false)
  useEffect(() => {
    if (autoOpened.current || !items?.length) return
    autoOpened.current = true
    if (AUTO_OPEN_FIRST_PREVIEW && !filters.client) {
      update({ client: items[0].id }, { resetPage: false })
      setSelected(new Map([[items[0].id, items[0]]]))
    }
  }, [items, filters.client, update])

  const previewId = filters.client
  const fallback = items?.find((c) => c.id === previewId) || null

  const openPreview = (id) => {
    setTab('overview')
    update({ client: id }, { resetPage: false })
  }
  const closePreview = () => update({ client: '' }, { resetPage: false })

  const profilePath = (id) => `/clients/${id}`
  const goProfile = (id) => navigate(profilePath(id), { state: { from: `${location.pathname}${location.search}` } })
  const goSection = (id, section) => navigate(`${profilePath(id)}/${section}`, { state: { from: `${location.pathname}${location.search}` } })

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

  const exportAll = async () => {
    setBusy(true)
    try {
      const csv = await clientService.exportClients(dir.params)
      downloadTextFile(`le-inspa-clients-${stamp()}.csv`, csv)
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

  const addNote = () => {
    if (!previewId) return showToast('Select a client first to add a note')
    setDialog({ mode: 'note', clientId: previewId })
  }

  const submitDialog = async ({ title, text }) => {
    if (dialog.mode === 'notification') {
      await clientService.sendNotification({ clientIds: dialog.ids, title, message: text })
      showToast(`Notification queued for ${dialog.ids.length} ${dialog.ids.length === 1 ? 'client' : 'clients'}`)
    } else if (dialog.mode === 'tag') {
      await clientService.addInternalTag({ clientIds: dialog.ids, tag: text })
      showToast(`Tag “${text}” added to ${dialog.ids.length} ${dialog.ids.length === 1 ? 'client' : 'clients'}`)
    } else {
      await clientService.addClientNote({ clientId: dialog.clientId, note: text })
      setNoteVersion((v) => v + 1)
      showToast('Note saved')
    }
    setDialog(null)
  }

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id)
      showToast(`${id} copied`)
    } catch {
      showToast('Unable to copy to clipboard')
    }
  }

  const scoped = !selectedMarket.isGlobal
  const bulkIds = [...selected.keys()]
  const dialogTarget =
    dialog?.mode === 'note'
      ? `For ${fallback?.name || dialog.clientId} · ${dialog.clientId}`
      : `Applies to ${bulkIds.length} selected ${bulkIds.length === 1 ? 'client' : 'clients'}`

  return (
    <div className="flex min-h-full flex-col">
      {/* Page header */}
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-4 pt-3 pb-3">
        <div>
          <h1 className="text-[28px] leading-tight font-bold tracking-tight text-[#1b1140] sm:text-[30px]">
            All Clients{scoped ? ` — ${selectedMarket.name}` : ''}
          </h1>
          <p className="mt-0.5 text-[14px] text-[#2a1b57]">View and manage client accounts across Lé Inspa.</p>
        </div>

        <div className="flex flex-col items-end gap-2.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-[#6b6785]">
            <Link to="/dashboard" className="hover:text-[#4527c8]">Dashboard</Link>
            <ChevronRight className="size-3.5" />
            <span>Client Management</span>
            <ChevronRight className="size-3.5" />
            <span className="font-medium text-[#1b1140]">All Clients</span>
          </nav>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={exportAll}
              disabled={busy}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#cfc5ee] bg-white px-4 text-[13px] font-semibold text-[#2a1b57] shadow-xs transition hover:bg-[#f4f1fc] disabled:opacity-60"
            >
              <Download className="size-4 text-[#4527c8]" /> Export Clients
            </button>
            <button
              type="button"
              onClick={addNote}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#4125d0] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3519b8]"
            >
              <Plus className="size-4" /> Add Client Note
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-start">
        {/* Directory */}
        <section className="min-w-0 flex-1 space-y-2.5 px-3 pb-6" aria-label="Client directory">
          <ClientStatusTabs active={filters.status} counts={data?.counts} loading={dir.loading} onChange={(status) => update({ status })} />

          <div className="rounded-2xl border border-[#e6e1f3] bg-white p-2.5 shadow-[0_1px_2px_rgba(36,21,71,0.04)]">
            <ClientFilterBar
              filters={filters}
              update={update}
              market={selectedMarket}
              searchText={dir.searchText}
              onSearchText={dir.setSearchText}
              activeAdvancedCount={dir.activeAdvancedCount}
              onMoreFilters={() => setMoreOpen(true)}
            />

            <div className="mt-4">
              {dir.error && !data ? (
                <ErrorState title="Unable to load clients" description={dir.error} onRetry={dir.refetch} />
              ) : (
                <ClientTable
                  items={items}
                  loading={dir.loading}
                  pageSize={filters.pageSize}
                  selected={selected}
                  activeId={previewId}
                  onToggle={toggleOne}
                  onTogglePage={togglePage}
                  onPreview={openPreview}
                  onOpenProfile={goProfile}
                  onOpenSection={goSection}
                  onCopyId={copyId}
                  hasActiveFilters={dir.hasActiveFilters}
                  onClearFilters={dir.reset}
                  onSearchAllMarkets={scoped && canSearchAllMarkets ? () => setSelectedMarket('ALL') : undefined}
                />
              )}
            </div>

            {data && data.total > 0 && (
              <ClientPagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                totalPages={data.totalPages}
                onPage={(page) => update({ page }, { resetPage: false })}
                onPageSize={(size) => update({ size })}
              />
            )}
          </div>

          {selected.size > 0 && (
            <ClientBulkBar
              count={selected.size}
              busy={busy}
              onExport={exportSelected}
              onNotify={() => setDialog({ mode: 'notification', ids: bulkIds })}
              onTag={() => setDialog({ mode: 'tag', ids: bulkIds })}
              onClear={() => setSelected(new Map())}
            />
          )}
        </section>

        {/* Quick preview drawer (docked on wide screens, overlay below xl) */}
        {previewId && (
          <aside
            className="max-[1499px]:fixed max-[1499px]:top-16 max-[1499px]:right-0 max-[1499px]:bottom-0 max-[1499px]:z-40 max-[1499px]:shadow-2xl min-[1500px]:sticky min-[1500px]:top-0 min-[1500px]:max-h-[calc(100vh-4rem)] w-[276px] shrink-0 self-start overflow-y-auto border-t border-l border-[#e6e1f3] bg-white"
          >
            <ClientPreviewPanel
              key={previewId}
              clientId={previewId}
              fallback={fallback}
              tab={tab}
              onTab={setTab}
              onClose={closePreview}
              onAddNote={addNote}
              noteVersion={noteVersion}
              profileHref={profilePath(previewId)}
              sectionHref={(section) => `${profilePath(previewId)}/${section}`}
            />
          </aside>
        )}
      </div>

      <MoreFiltersDrawer
        open={moreOpen}
        filters={filters}
        market={selectedMarket}
        canSeeSafety={can(PERMISSIONS.DISPUTES_MANAGE)}
        canSeeFinancial={can(PERMISSIONS.FINANCE_VIEW)}
        onApply={(patch) => update(patch)}
        onReset={dir.reset}
        onClose={() => setMoreOpen(false)}
      />

      {dialog && <ClientActionDialog mode={dialog.mode} targetLabel={dialogTarget} onSubmit={submitDialog} onClose={() => setDialog(null)} />}

      {toast && (
        <div role="status" className="fixed right-6 bottom-6 z-[80] flex items-center gap-2.5 rounded-xl bg-[#1b1140] px-4 py-3 text-[13px] font-medium text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <CircleCheck className="size-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  )
}
