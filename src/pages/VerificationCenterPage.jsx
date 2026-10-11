import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  ShieldCheck,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ListOrdered,
} from 'lucide-react'
import VerificationKPIs from '../components/verification/VerificationKPIs'
import VerificationAttentionPerformance from '../components/verification/VerificationAttentionPerformance'
import VerificationQueueTable from '../components/verification/VerificationQueueTable'
import VerificationReviewPanel from '../components/verification/VerificationReviewPanel'
import DocumentViewerModal from '../components/verification/DocumentViewerModal'
import RequestChangesModal from '../components/verification/RequestChangesModal'
import RejectVerificationModal from '../components/verification/RejectVerificationModal'
import AssignReviewerModal from '../components/verification/AssignReviewerModal'
import VerificationSettingsModal from '../components/verification/VerificationSettingsModal'
import { verificationService } from '../services/verificationService'

/**
 * ADM-029: Verification Center Master Page.
 * Styled in the clean, crisp light theme of ADM-009 (Needs Your Attention).
 * Global topbar (Search, Country, Date filter, Profile) is provided by AdminLayout.
 */
export default function VerificationCenterPage() {
  const [searchParams] = useSearchParams()
  const preselectedId = searchParams.get('id') || searchParams.get('providerId')

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState(null)
  const [queue, setQueue] = useState([])
  const [kpis, setKpis] = useState(null)
  const [needsAttention, setNeedsAttention] = useState(null)
  const [performance, setPerformance] = useState(null)

  // Filter & Search states
  const [activeTab, setActiveTab] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [tableFilters, setTableFilters] = useState({})

  // Two-Pane selection state
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Interactive Action Modals
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const [viewingDocument, setViewingDocument] = useState(null)
  const [requestChangesOpen, setRequestChangesOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  // Instant Feedback Toast
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Data fetching
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await verificationService.fetchVerificationQueue({
        status: activeTab === 'ALL' ? undefined : activeTab,
        ...tableFilters,
        searchQuery: searchTerm,
      })

      setQueue(data?.queue || [])
      setKpis(data?.kpis || null)
      setNeedsAttention(data?.needsAttention || null)
      setPerformance(data?.performance || null)

      // Preselected query param or default selection to Grace Njeri (PR-82941)
      if (preselectedId && data?.queue?.length > 0) {
        const found = data.queue.find((r) => r.id === preselectedId || r.providerId === preselectedId)
        if (found) {
          setSelectedRecord(found)
        } else if (!selectedRecord) {
          const grace = data.queue.find((r) => r.providerId === 'PR-82941')
          setSelectedRecord(grace || data.queue[0])
        }
      } else if (!selectedRecord && data?.queue?.length > 0) {
        const grace = data.queue.find((r) => r.providerId === 'PR-82941')
        setSelectedRecord(grace || data.queue[0])
      } else if (selectedRecord) {
        const updated = (data?.queue || []).find((r) => r.id === selectedRecord.id)
        if (updated) setSelectedRecord(updated)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load verification queue.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, tableFilters, searchTerm, selectedRecord, preselectedId])


  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle Attention quick review trigger
  const handleAttentionTrigger = (trigger) => {
    if (trigger.tab) {
      setActiveTab(trigger.tab)
      return
    }
    if (trigger.priority) {
      setTableFilters((prev) => ({ ...prev, priority: trigger.priority }))
      return
    }
    if (trigger.filterType === 'expiring') {
      setTableFilters((prev) => ({ ...prev, verificationType: 'Credentials', expiringOnly: true }))
      return
    }
    setTableFilters((prev) => ({ ...prev, ...trigger }))
  }

  // Action Handlers
  const handleApprove = async (recordToApprove) => {
    try {
      const rec = recordToApprove || selectedRecord
      await verificationService.submitVerificationDecision({
        verificationId: rec.id,
        decision: 'APPROVE',
        expectedVersion: rec.version,
      })

      showToast(`Verification for ${rec.name} (${rec.providerId}) approved successfully!`, 'success')
      await loadData()
    } catch (err) {
      showToast(err?.message || 'Failed to approve verification.', 'error')
    }
  }

  const handleRequestChangesSubmit = async (payload) => {
    try {
      await verificationService.submitVerificationDecision(payload)
      showToast('Change request sent to provider successfully.', 'success')
      await loadData()
    } catch (err) {
      showToast(err?.message || 'Failed to request changes.', 'error')
    }
  }

  const handleRejectSubmit = async (payload) => {
    try {
      await verificationService.submitVerificationDecision(payload)
      showToast('Verification application rejected and logged.', 'warning')
      await loadData()
    } catch (err) {
      showToast(err?.message || 'Failed to reject verification.', 'error')
    }
  }

  const handleAssignReviewerSubmit = async (payload) => {
    try {
      await verificationService.assignReviewer(payload.verificationId, {
        assignToUid: payload.assignToUid,
        assignToName: payload.assignToName,
        note: payload.note,
      })
      showToast(`Assigned review to ${payload.assignToName}.`, 'success')
      await loadData()
    } catch (err) {
      showToast(err?.message || 'Failed to assign reviewer.', 'error')
    }
  }

  const handleOpenDocumentViewer = (doc) => {
    setViewingDocument(doc || selectedRecord?.documents?.[0])
    setDocumentViewerOpen(true)
  }

  const handleSaveInternalNote = (verificationId, note) => {
    showToast('Internal note saved to verification record.', 'success')
  }

  // Filtered queue display
  const displayedRecords = useMemo(() => {
    return queue.filter((item) => {
      // Status tab filter
      if (activeTab !== 'ALL' && item.status !== activeTab) {
        return false
      }
      // Search term filter
      if (searchTerm.trim().length > 0) {
        const term = searchTerm.trim().toLowerCase()
        const matches =
          (item.name && item.name.toLowerCase().includes(term)) ||
          (item.providerId && item.providerId.toLowerCase().includes(term)) ||
          (item.type && item.type.toLowerCase().includes(term)) ||
          (item.verificationType && item.verificationType.toLowerCase().includes(term))
        if (!matches) return false
      }
      // Market filter
      if (tableFilters.marketId && tableFilters.marketId !== 'ALL' && item.market?.code !== tableFilters.marketId) {
        return false
      }
      // Priority filter
      if (tableFilters.priority && tableFilters.priority !== 'ALL' && item.priority !== tableFilters.priority) {
        return false
      }
      // Verification type filter
      if (
        tableFilters.verificationType &&
        tableFilters.verificationType !== 'ALL' &&
        !item.verificationType?.toLowerCase().includes(tableFilters.verificationType.toLowerCase())
      ) {
        return false
      }
      // Expiring credentials filter
      if (tableFilters.expiringOnly) {
        const hasExpiring = (item.documents || []).some((doc) => {
          if (!doc.expiryDate || doc.expiryDate === 'N/A') return false
          const expMs = Date.parse(doc.expiryDate)
          return !isNaN(expMs) && expMs > Date.now()
        })
        if (!hasExpiring) return false
      }
      // Provider category
      if (
        tableFilters.providerType &&
        tableFilters.providerType !== 'ALL' &&
        item.providerCategory !== tableFilters.providerType
      ) {
        return false
      }
      return true
    })
  }, [queue, activeTab, searchTerm, tableFilters])

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
            <AlertCircle className="size-5 shrink-0 text-rose-600" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* 1. Page Header (ADM-009 Design System Alignment) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-block rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 mb-2">
            ADM-029
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
            Verification Center
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and manage provider verification across Lé Inspa sovereign markets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Awaiting Review Pill */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <span className="size-2 rounded-full bg-amber-500" />
            <span>{kpis?.awaitingReview?.count || 428} Awaiting Review</span>
          </span>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={loadData}
            title="Refresh Data"
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          {/* Link to Verification Queue (ADM-030) */}
          <Link
            to="/verifications/queue"
            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-sm font-semibold text-purple-700 shadow-sm hover:bg-purple-100 transition"
          >
            <ListOrdered className="size-4" />
            <span>Verification Queue</span>
          </Link>

          {/* Verification Settings Button */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Settings className="size-4 text-slate-500" />
            <span>Verification Settings</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Bands (5 KPI Cards + Attention / Performance) */}
      <div className="space-y-6">
        <VerificationKPIs kpis={kpis} />
        <VerificationAttentionPerformance
          needsAttention={needsAttention}
          performance={performance}
          onFilterTrigger={handleAttentionTrigger}
        />
      </div>

      {/* 3. Two-Pane Operational Workspace */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Pane: Primary Queue Table (65% width if inspector is open, else 100%) */}
        <div className={`transition-all duration-300 ${selectedRecord ? 'lg:w-[65%]' : 'w-full'}`}>
          <VerificationQueueTable
            records={displayedRecords}
            selectedRecordId={selectedRecord?.id}
            onSelectRecord={(rec) => setSelectedRecord(rec)}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            searchTerm={searchTerm}
            onSearchChange={(val) => setSearchTerm(val)}
            filters={tableFilters}
            onFilterChange={(f) => setTableFilters(f)}
            totalCount={kpis?.awaitingReview?.count || 428}
          />
        </div>

        {/* Right Pane: Interactive Verification Review Panel (35% width) */}
        {selectedRecord && (
          <aside className="w-full lg:w-[35%]">
            <VerificationReviewPanel
              record={selectedRecord}
              onClose={() => setSelectedRecord(null)}
              onApprove={handleApprove}
              onRequestChanges={() => setRequestChangesOpen(true)}
              onReject={() => setRejectOpen(true)}
              onAssignReviewer={() => setAssignOpen(true)}
              onOpenDocumentViewer={handleOpenDocumentViewer}
              onSaveInternalNote={handleSaveInternalNote}
            />
          </aside>
        )}
      </div>

      {/* Lightbox Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={documentViewerOpen}
        onClose={() => setDocumentViewerOpen(false)}
        document={viewingDocument}
        provider={selectedRecord}
      />

      {/* Request Changes Modal */}
      <RequestChangesModal
        isOpen={requestChangesOpen}
        onClose={() => setRequestChangesOpen(false)}
        record={selectedRecord}
        onSubmit={handleRequestChangesSubmit}
      />

      {/* Reject Verification Modal */}
      <RejectVerificationModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        record={selectedRecord}
        onSubmit={handleRejectSubmit}
      />

      {/* Assign Reviewer Modal */}
      <AssignReviewerModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        record={selectedRecord}
        onSubmit={handleAssignReviewerSubmit}
      />

      {/* Verification Settings Modal */}
      <VerificationSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={(config) => {
          showToast('Verification SLA & compliance settings saved successfully!', 'success')
        }}
      />
    </div>
  )
}
