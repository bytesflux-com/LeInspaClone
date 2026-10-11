import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import IdentityHeader from '../components/verification/identity/IdentityHeader'
import IdentitySummaryCard from '../components/verification/identity/IdentitySummaryCard'
import IdentityDocumentViewer from '../components/verification/identity/IdentityDocumentViewer'
import IdentityComparisonTable from '../components/verification/identity/IdentityComparisonTable'
import IdentityPreviousSubmissions from '../components/verification/identity/IdentityPreviousSubmissions'
import IdentityReviewActions from '../components/verification/identity/IdentityReviewActions'
import IdentityChecklistCard from '../components/verification/identity/IdentityChecklistCard'
import IdentityReviewHistory from '../components/verification/identity/IdentityReviewHistory'
import RequestNewDocumentModal from '../components/verification/identity/RequestNewDocumentModal'
import RejectIdentityModal from '../components/verification/identity/RejectIdentityModal'
import EscalateIdentityModal from '../components/verification/identity/EscalateIdentityModal'
import { verificationService } from '../services/verificationService'

/**
 * ADM-032: Identity Documents Review
 * Production-ready screen for inspecting, verifying, and deciding on provider identity documents.
 * Conforms to Lé Inspa Light Theme Design System (ADM-009, ADM-030, ADM-031).
 * Global top navbar is provided by AdminLayout.
 */
export default function IdentityDocumentsReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Default to Grace Njeri (ver-001 / PR-82941) if no ID is passed
  const targetId = id || 'PR-82941'

  // Data states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [identityData, setIdentityData] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Sensitive Field Reveal State
  const [isRevealingNumber, setIsRevealingNumber] = useState(false)
  const [isNumberRevealed, setIsNumberRevealed] = useState(false)
  const [isDobRevealed, setIsDobRevealed] = useState(false)

  // Modals state
  const [requestDocModalOpen, setRequestDocModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [escalateModalOpen, setEscalateModalOpen] = useState(false)

  // Toast state
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3800)
  }

  // Load identity verification details
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await verificationService.fetchIdentityVerificationDetail(targetId)
      setIdentityData(data)
    } catch (err) {
      console.error('[IdentityDocumentsReviewPage] Error loading detail:', err)
      setError(err?.message || 'Failed to load identity verification record.')
    } finally {
      setLoading(false)
    }
  }, [targetId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Reveal Sensitive Field handler (Calls backend Cloud Function / service)
  const handleRevealField = async (fieldName) => {
    if (!identityData) return

    if (fieldName === 'documentNumber') {
      if (isNumberRevealed) {
        setIsNumberRevealed(false)
        showToast('Document number re-masked.', 'info')
        return
      }

      setIsRevealingNumber(true)
      try {
        const result = await verificationService.revealSensitiveIdentityField(
          identityData.id || targetId,
          'documentNumber'
        )
        if (result?.plainValue) {
          setIsNumberRevealed(true)
          showToast('Document number unmasked. Audit log entry recorded.', 'success')
        }
      } catch (err) {
        showToast(err?.message || 'Failed to reveal sensitive field.', 'error')
      } finally {
        setIsRevealingNumber(false)
      }
    } else if (fieldName === 'dob') {
      setIsDobRevealed(!isDobRevealed)
      showToast(isDobRevealed ? 'Date of birth masked.' : 'Date of birth unmasked.', 'info')
    }
  }

  // Checklist Status Change Handler
  const handleChecklistChange = (key, nextStatus) => {
    if (!identityData) return
    setIdentityData((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.key === key
          ? {
              ...item,
              status: nextStatus,
              resultType: nextStatus === 'Pass' ? 'pass' : nextStatus === 'Needs review' ? 'review' : 'fail',
            }
          : item
      ),
    }))
    showToast(`Checklist "${key}" updated to ${nextStatus}.`, 'info')
  }

  // 1. Approve Document Action
  const handleApprove = async () => {
    if (!identityData) return
    setSubmitting(true)
    try {
      const checklistResults = identityData.checklist.reduce((acc, c) => {
        acc[c.key] = c.status
        return acc
      }, {})

      const result = await verificationService.submitIdentityDecision({
        verificationId: identityData.id || targetId,
        decision: 'APPROVE',
        checklistResults,
        internalNote: 'Identity document verified and approved by Jane Ochieng',
        expectedVersion: identityData.version,
      })

      showToast('Identity document verified and approved! ADM-031 progress updated.', 'success')
      await loadData()
    } catch (err) {
      showToast(err?.message || 'Failed to approve document.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 2. Request New Document Action
  const handleRequestNewDocumentSubmit = async (payload) => {
    if (!identityData) return
    setSubmitting(true)
    try {
      await verificationService.submitIdentityDecision({
        verificationId: identityData.id || targetId,
        decision: 'REQUEST_CHANGES',
        reason: payload.reason,
        providerMessage: payload.providerMessage,
        internalNote: payload.internalNote,
        expectedVersion: identityData.version,
      })

      showToast('Correction notice dispatched to provider.', 'warning')
      setRequestDocModalOpen(false)
      await loadData()
    } catch (err) {
      showToast(err?.message || 'Failed to request new document.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 3. Reject Document Action
  const handleRejectSubmit = async (payload) => {
    if (!identityData) return
    setSubmitting(true)
    try {
      await verificationService.submitIdentityDecision({
        verificationId: identityData.id || targetId,
        decision: 'REJECT',
        reason: payload.reason,
        internalNote: payload.internalNote,
        expectedVersion: identityData.version,
      })

      showToast('Identity document rejected. Incident logged.', 'error')
      setRejectModalOpen(false)
      await loadData()
    } catch (err) {
      showToast(err?.message || 'Failed to reject document.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 4. Escalate Document Action
  const handleEscalateSubmit = async (payload) => {
    if (!identityData) return
    setSubmitting(true)
    try {
      await verificationService.submitIdentityDecision({
        verificationId: identityData.id || targetId,
        decision: 'ESCALATE',
        reason: payload.reason,
        internalNote: payload.complianceNotes || payload.internalNote,
        expectedVersion: identityData.version,
      })

      showToast('Case escalated to senior Compliance & Legal.', 'warning')
      setEscalateModalOpen(false)
      await loadData()
    } catch (err) {
      showToast(err?.message || 'Failed to escalate case.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 5. Add Internal Note
  const handleAddNote = async (text) => {
    if (!identityData) return
    try {
      await verificationService.addInternalNote(identityData.id || targetId, text)
      showToast('Internal note saved.', 'success')
      await loadData()
    } catch (err) {
      showToast(err?.message || 'Failed to add internal note.', 'error')
    }
  }

  if (loading && !identityData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="size-8 animate-spin rounded-full border-3 border-purple-200 border-t-purple-600" />
          <p className="text-sm font-semibold">Loading identity documents review...</p>
        </div>
      </div>
    )
  }

  if (error && !identityData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Unable to Load Identity Record</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={loadData}
              className="rounded-xl bg-[#6D28D9] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#5B21B6]"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => navigate(`/verifications/review/${targetId}`)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Review
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6 text-slate-900">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-md transition-all ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : toast.type === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : toast.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-purple-200 bg-purple-50 text-purple-900'
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

      {/* 1. Breadcrumbs & Header Actions */}
      <IdentityHeader
        verificationId={identityData?.id || targetId}
        providerId={identityData?.providerId || 'PR-82941'}
      />

      {/* 2. Top Identification & Summary Card */}
      <IdentitySummaryCard data={identityData} />

      {/* 3. Main Workspace Layout (Left 65% / Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: DOCUMENT VIEWER & COMPARISONS (Span 8 ~ 65%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Interactive Document Viewer & Canvas */}
          <IdentityDocumentViewer
            data={identityData}
            onRevealField={handleRevealField}
            isRevealingNumber={isRevealingNumber}
            isNumberRevealed={isNumberRevealed}
          />

          {/* Information Comparison Card */}
          <IdentityComparisonTable
            comparisonRows={identityData?.comparisonTable || []}
            isNumberRevealed={isNumberRevealed}
            isDobRevealed={isDobRevealed}
          />

          {/* Previous Submissions, Notes & Privacy Banner */}
          <IdentityPreviousSubmissions
            submissions={identityData?.previousSubmissions || []}
            internalNotes={identityData?.internalNotes || []}
            onAddNote={handleAddNote}
            onSelectVersion={(sub) => {
              showToast(`Viewing version ${sub.version}`, 'info')
            }}
          />
        </div>

        {/* RIGHT COLUMN: ACTIONS, CHECKLIST & TIMELINE (Span 4 ~ 35%) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Review Actions Panel */}
          <IdentityReviewActions
            onApprove={handleApprove}
            onRequestNewDocument={() => setRequestDocModalOpen(true)}
            onReject={() => setRejectModalOpen(true)}
            onEscalate={() => setEscalateModalOpen(true)}
            submitting={submitting}
            status={identityData?.status}
          />

          {/* 2. Verification Checklist Card */}
          <IdentityChecklistCard
            checklist={identityData?.checklist || []}
            onChecklistChange={handleChecklistChange}
          />

          {/* 3. Review History Timeline */}
          <IdentityReviewHistory history={identityData?.reviewHistory || []} />
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Request New Document Modal */}
      <RequestNewDocumentModal
        isOpen={requestDocModalOpen}
        onClose={() => setRequestDocModalOpen(false)}
        providerName={identityData?.name}
        onSubmit={handleRequestNewDocumentSubmit}
      />

      {/* 2. Reject Identity Modal */}
      <RejectIdentityModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        providerName={identityData?.name}
        onSubmit={handleRejectSubmit}
      />

      {/* 3. Escalate Identity Modal */}
      <EscalateIdentityModal
        isOpen={escalateModalOpen}
        onClose={() => setEscalateModalOpen(false)}
        providerName={identityData?.name}
        onSubmit={handleEscalateSubmit}
      />
    </div>
  )
}
