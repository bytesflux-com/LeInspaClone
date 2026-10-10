import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import QueueStatusCards from '../components/verification/queue/QueueStatusCards'
import QueueFilters from '../components/verification/queue/QueueFilters'
import QueueTable from '../components/verification/queue/QueueTable'
import QueueQuickPreviewDrawer from '../components/verification/queue/QueueQuickPreviewDrawer'
import QueueEscalateModal from '../components/verification/queue/QueueEscalateModal'
import VerificationSettingsModal from '../components/verification/VerificationSettingsModal'
import DocumentViewerModal from '../components/verification/DocumentViewerModal'
import { verificationService } from '../services/verificationService'

/**
 * ADM-030: Verification Queue
 * Production-ready master screen for reviewing and processing provider verification
 * queues across sovereign markets.
 * Note: Global top navbar is provided by AdminLayout.
 */
export default function VerificationQueuePage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [queue, setQueue] = useState([])
  const [statusCounts, setStatusCounts] = useState({
    all: 428,
    new: 196,
    underReview: 86,
    resubmitted: 46,
    changesRequested: 112,
    escalated: 7,
  })

  // Filtering & Sorting State
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    priority: 'ALL',
    providerType: 'ALL',
    verificationType: 'ALL',
    marketId: 'ALL',
    assignedTo: 'ALL',
    dateRange: 'ALL',
    overdueOnly: false,
  })
  const [sortBy, setSortBy] = useState('priority')

  // Selected Record for Quick Preview Drawer
  const [selectedRecord, setSelectedRecord] = useState(null)

  // Interactive Modals
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [escalateModalOpen, setEscalateModalOpen] = useState(false)
  const [recordToEscalate, setRecordToEscalate] = useState(null)
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const [viewingDocument, setViewingDocument] = useState(null)

  // Toast Notification
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await verificationService.fetchDetailedQueue({
        status: activeStatus,
        searchQuery: searchTerm,
        sortBy,
        ...filters,
      })

      const records = data?.queue || []
      setQueue(records)
      if (data?.statusCounts) {
        setStatusCounts(data.statusCounts)
      }

      // Default selection to Grace Njeri (PR-82941) if available to match spec
      if (!selectedRecord && records.length > 0) {
        const grace = records.find((r) => r.providerId === 'PR-82941')
        setSelectedRecord(grace || records[0])
      } else if (selectedRecord) {
        const refreshed = records.find((r) => r.id === selectedRecord.id)
        if (refreshed) setSelectedRecord(refreshed)
      }
    } catch (err) {
      setError(err?.message || 'Failed to fetch verification queue.')
    } finally {
      setLoading(false)
    }
  }, [activeStatus, searchTerm, sortBy, filters, selectedRecord])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Single Case Claim
  const handleClaimCase = async (verificationId) => {
    try {
      const result = await verificationService.claimCase(verificationId)
      showToast('Case assigned to you and moved to Under Review.', 'success')
      await loadData()
    } catch (err) {
      showToast(err?.message || 'Failed to claim verification case.', 'error')
    }
  }

  // Bulk Claim
  const handleBulkClaim = async (ids) => {
    try {
      for (const id of ids) {
        await verificationService.claimCase(id)
      }
      showToast(`${ids.length} cases assigned to you.`, 'success')
      await loadData()
    } catch (err) {
      showToast(err?.message || 'Failed to claim selected cases.', 'error')
    }
  }

  // Escalate Submission
  const handleOpenEscalate = (record) => {
    setRecordToEscalate(record)
    setEscalateModalOpen(true)
  }

  const handleEscalateSubmit = async (payload) => {
    try {
      await verificationService.escalateCase(payload.verificationId, {
        reason: payload.reason,
        complianceNotes: payload.complianceNotes,
      })
      showToast('Case successfully escalated to the Compliance Team.', 'warning')
      await loadData()
    } catch (err) {
      showToast(err?.message || 'Failed to escalate case.', 'error')
    }
  }

  // Bulk Escalate
  const handleBulkEscalate = async (ids) => {
    try {
      for (const id of ids) {
        await verificationService.escalateCase(id, {
          reason: 'Bulk escalation for compliance audit',
        })
      }
      showToast(`${ids.length} cases escalated to Compliance.`, 'warning')
      await loadData()
    } catch (err) {
      showToast(err?.message || 'Failed to escalate selected cases.', 'error')
    }
  }

  // Document Lightbox
  const handleOpenDocumentViewer = (doc) => {
    setViewingDocument(doc || selectedRecord?.documents?.[0])
    setDocumentViewerOpen(true)
  }

  // Start Review (Navigates to ADM-031 review workspace)
  const handleStartReview = (record) => {
    const target = record || selectedRecord
    if (target) {
      navigate(`/verifications/review/${target.providerId || target.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6 text-slate-900">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
              : toast.type === 'warning'
                ? 'border-amber-200 bg-amber-50/95 text-amber-900'
                : 'border-rose-200 bg-rose-50/95 text-rose-900'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-amber-600" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* 1. HEADER & BREADCRUMBS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1"
          >
            <Link to="/dashboard" className="hover:text-slate-600 transition">
              Admin
            </Link>
            <ChevronRight className="size-3 text-slate-300" />
            <Link to="/verifications" className="hover:text-slate-600 transition">
              Verification Center
            </Link>
            <ChevronRight className="size-3 text-slate-300" />
            <span className="text-slate-700 font-semibold">Verification Queue</span>
          </nav>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
            Verification Queue
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review provider verification submissions across Lé Inspa.
          </p>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Counter Box */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-2 shadow-xs">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-[#6D28D9]">
              <Clock className="size-4.5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">
                {statusCounts.all || 428} Pending Reviews
              </div>
              <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Last updated just now
              </div>
            </div>
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={loadData}
            title="Refresh Data"
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <RefreshCw
              className={`size-4 ${loading ? 'animate-spin text-[#6D28D9]' : ''}`}
            />
          </button>

          {/* Verification Settings Button */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Settings className="size-4 text-slate-500" />
            <span>Verification Settings</span>
          </button>
        </div>
      </div>

      {/* 2. QUEUE STATUS CARDS (6 Cards Row) */}
      <QueueStatusCards
        counts={statusCounts}
        activeStatus={activeStatus}
        onSelectStatus={(status) => setActiveStatus(status)}
      />

      {/* 3. FILTER & SORT TOOLBAR */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <QueueFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFilterChange={setFilters}
          statusCounts={statusCounts}
          activeStatus={activeStatus}
          onSelectStatus={setActiveStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* 4. TWO-PANE DOMINANT WORKSPACE */}
      <div className="flex flex-col gap-6 lg:flex-row items-start">
        {/* Left Pane: Dominant Queue Table (flex-1 or 68% if drawer open) */}
        <div
          className={`w-full transition-all duration-300 ${
            selectedRecord ? 'lg:w-[68%]' : 'lg:w-full'
          }`}
        >
          <QueueTable
            records={queue}
            selectedRecordId={selectedRecord?.id}
            onSelectRecord={(rec) => setSelectedRecord(rec)}
            onStartReview={handleStartReview}
            onBulkClaim={handleBulkClaim}
            onBulkEscalate={handleBulkEscalate}
          />
        </div>

        {/* Right Pane: Quick Preview Drawer (32% width on desktop) */}
        {selectedRecord && (
          <aside className="w-full lg:w-[32%] shrink-0 lg:sticky lg:top-6 self-start max-h-[calc(100vh-2rem)]">
            <QueueQuickPreviewDrawer
              record={selectedRecord}
              onClose={() => setSelectedRecord(null)}
              onClaimCase={handleClaimCase}
              onOpenEscalate={handleOpenEscalate}
              onOpenDocumentViewer={handleOpenDocumentViewer}
            />
          </aside>
        )}
      </div>

      {/* Verification Settings Modal */}
      <VerificationSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={() => {
          showToast('Verification settings updated successfully!', 'success')
        }}
      />

      {/* Document Viewer Lightbox Modal */}
      <DocumentViewerModal
        isOpen={documentViewerOpen}
        onClose={() => setDocumentViewerOpen(false)}
        document={viewingDocument}
        provider={selectedRecord}
      />

      {/* Escalate to Compliance Modal */}
      <QueueEscalateModal
        isOpen={escalateModalOpen}
        onClose={() => {
          setEscalateModalOpen(false)
          setRecordToEscalate(null)
        }}
        record={recordToEscalate}
        onSubmit={handleEscalateSubmit}
      />
    </div>
  )
}
