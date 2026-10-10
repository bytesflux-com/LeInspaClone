import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react'
import ReviewHeader from '../components/verification/review/ReviewHeader'
import ReviewStepper from '../components/verification/review/ReviewStepper'
import ReviewComponentTabs from '../components/verification/review/ReviewComponentTabs'
import DocumentViewerCanvas from '../components/verification/review/DocumentViewerCanvas'
import PreviousSubmissionsTable from '../components/verification/review/PreviousSubmissionsTable'
import ReviewHistoryTimeline from '../components/verification/review/ReviewHistoryTimeline'
import InformationComparisonTable from '../components/verification/review/InformationComparisonTable'
import VerificationChecklistCard from '../components/verification/review/VerificationChecklistCard'
import ReviewActionsPanel from '../components/verification/review/ReviewActionsPanel'
import InternalNotesModal from '../components/verification/review/InternalNotesModal'
import FinalVerificationModal from '../components/verification/review/FinalVerificationModal'
import RequestChangesModal from '../components/verification/RequestChangesModal'
import RejectVerificationModal from '../components/verification/RejectVerificationModal'
import QueueEscalateModal from '../components/verification/queue/QueueEscalateModal'
import { verificationService } from '../services/verificationService'

/**
 * ADM-031: Verification Review
 * Production-ready master review workspace for evaluating provider verification submissions.
 * Conforms to the Lé Inspa light theme design system (ADM-009 / ADM-030).
 * Global top navbar is provided by AdminLayout.
 */
export default function VerificationReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Primary verification ID / Provider ID (defaults to Grace Njeri if no param)
  const targetId = id || 'PR-82941'

  // Data states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [record, setRecord] = useState(null)
  const [checklist, setChecklist] = useState([])
  const [documents, setDocuments] = useState([])
  const [activeDoc, setActiveDoc] = useState(null)
  const [activeTabId, setActiveTabId] = useState('CREDENTIALS')

  // Modals state
  const [requestChangesOpen, setRequestChangesOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [escalateOpen, setEscalateOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [finalModalOpen, setFinalModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Toast feedback
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3800)
  }

  // Load verification details
  const loadVerificationData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await verificationService.fetchVerificationDetail(targetId)
      const rec = data?.verification || {}
      setRecord(rec)
      setChecklist(rec.checklist || data?.checklist || [])
      const docs = rec.documents || data?.documents || []
      setDocuments(docs)
      setActiveDoc(rec.activeDocument || docs[0] || null)

      // Initial active tab
      const currentReviewingStep = (rec.progressSteps || []).find(
        (s) => s.status === 'REVIEWING_NOW' || s.status === 'IN_PROGRESS'
      )
      if (currentReviewingStep) {
        setActiveTabId(currentReviewingStep.id)
      }
    } catch (err) {
      console.error('[VerificationReviewPage] Failed to load detail:', err)
      setError(err?.message || 'Failed to load verification review data.')
    } finally {
      setLoading(false)
    }
  }, [targetId])

  useEffect(() => {
    loadVerificationData()
  }, [loadVerificationData])

  // Handle Checklist Status Toggle
  const handleChecklistChange = (key, nextStatus) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.key === key
          ? {
              ...item,
              status: nextStatus,
              resultType: nextStatus === 'Pass' ? 'pass' : nextStatus === 'Needs review' ? 'review' : 'fail',
            }
          : item
      )
    )
    showToast(`Checklist "${key}" marked as ${nextStatus}`, 'info')
  }

  // Handle Tab Selection
  const handleSelectTab = (tabId) => {

    if (tabId === 'IDENTITY') {
      navigate(`/verifications/identity/${targetId}`)
      return
    }
    if (tabId === 'CREDENTIALS') {
      navigate(`/verifications/credentials/${targetId}`)
      return
    }
    if (tabId === 'BUSINESS_DOCS' || tabId === 'PREMISES_PERMIT' || tabId === 'BUSINESS_REG' || tabId === 'HOSPITALITY_LIC') {
      navigate(`/verifications/business/${targetId}`)
      return
    }

    setActiveTabId(tabId)
    // If switching to identity or other docs, pick corresponding document if available
    if (tabId === 'IDENTITY') {
      const idDoc = documents.find((d) => d.id === 'doc-102' || d.docType?.includes('ID'))
      if (idDoc) setActiveDoc(idDoc)
    } else if (tabId === 'CREDENTIALS' || tabId === 'PREMISES_PERMIT' || tabId === 'HOSPITALITY_LIC') {

      const certDoc = documents.find((d) => d.id === 'doc-101' || d.docType?.includes('Certificate') || d.docType?.includes('Permit'))
      if (certDoc) setActiveDoc(certDoc)
    }
  }

  // 1. Approve Component Action
  const handleApproveComponent = async () => {
    if (!record) return
    setSaving(true)
    try {
      const checklistResults = checklist.reduce((acc, curr) => {
        acc[curr.key] = curr.status
        return acc
      }, {})

      await verificationService.submitComponentDecision({
        verificationId: record.id,
        componentKey: activeTabId,
        decision: 'APPROVE',
        checklistResults,
        internalNote: 'Component verified and approved by Jane Ochieng',
        expectedVersion: record.version,
      })

      showToast(`Approved ${activeTabId.replace('_', ' ')} successfully!`, 'success')
      await loadVerificationData()

      // Automatically advance to next pending step if available
      const steps = record.progressSteps || []
      const nextPending = steps.find((s) => s.status === 'PENDING' && s.id !== activeTabId)
      if (nextPending) {
        setActiveTabId(nextPending.id)
      }
    } catch (err) {
      showToast(err?.message || 'Failed to approve component.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // 2. Request Changes Action
  const handleRequestChangesSubmit = async (payload) => {
    if (!record) return
    try {
      await verificationService.submitComponentDecision({
        verificationId: record.id,
        componentKey: activeTabId,
        decision: 'REQUEST_CHANGES',
        reason: (payload.reasons || []).join('; ') || 'Additional documentation required',
        providerMessage: payload.adminNotes || '',
        expectedVersion: record.version,
      })

      showToast('Change request notification dispatched to provider.', 'warning')
      setRequestChangesOpen(false)
      await loadVerificationData()
    } catch (err) {
      showToast(err?.message || 'Failed to submit change request.', 'error')
    }
  }

  // 3. Reject Verification Action
  const handleRejectSubmit = async (payload) => {
    if (!record) return
    try {
      await verificationService.submitComponentDecision({
        verificationId: record.id,
        componentKey: activeTabId,
        decision: 'REJECT',
        reason: (payload.reasons || []).join('; ') || 'Failed statutory verification criteria',
        internalNote: payload.adminNote || '',
        expectedVersion: record.version,
      })

      showToast('Verification submission formally rejected.', 'error')
      setRejectOpen(false)
      await loadVerificationData()
    } catch (err) {
      showToast(err?.message || 'Failed to reject verification.', 'error')
    }
  }

  // 4. Escalate Action
  const handleEscalateSubmit = async (payload) => {
    if (!record) return
    try {
      await verificationService.submitComponentDecision({
        verificationId: record.id,
        componentKey: activeTabId,
        decision: 'ESCALATE',
        reason: payload.reason || 'Escalated for senior compliance review',
        internalNote: payload.complianceNotes || '',
        expectedVersion: record.version,
      })

      showToast('Submission escalated to Compliance & Legal review.', 'warning')
      setEscalateOpen(false)
      await loadVerificationData()
    } catch (err) {
      showToast(err?.message || 'Failed to escalate case.', 'error')
    }
  }

  // 5. Add Internal Note
  const handleAddInternalNote = async (text) => {
    if (!record) return
    try {
      await verificationService.addInternalNote(record.id, text)
      showToast('Private note added.', 'success')
      await loadVerificationData()
    } catch (err) {
      showToast(err?.message || 'Failed to add note.', 'error')
    }
  }

  // 6. Complete Verification & Continue (Final Sign-off)
  const handleCompleteAndContinue = () => {
    // Open final review dialog summarizing all 4 checks
    setFinalModalOpen(true)
  }

  const handleFinalVerificationConfirm = async () => {
    if (!record) return
    setSaving(true)
    try {
      await verificationService.submitComponentDecision({
        verificationId: record.id,
        componentKey: 'FINAL',
        decision: 'APPROVE',
        checklistResults: checklist.reduce((acc, c) => ({ ...acc, [c.key]: c.status }), {}),
        internalNote: 'Final verification sign-off completed by Jane Ochieng',
        expectedVersion: record.version,
      })

      showToast('🎉 Provider verification completed! Status updated to VERIFIED.', 'success')
      setFinalModalOpen(false)
      await loadVerificationData()
      setTimeout(() => {
        navigate('/verifications/queue')
      }, 1500)
    } catch (err) {
      showToast(err?.message || 'Failed to complete final verification.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // 7. Save & Exit
  const handleSaveAndExit = () => {
    showToast('Review session saved.', 'success')
    navigate('/verifications/queue')
  }

  if (loading && !record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="size-8 animate-spin rounded-full border-3 border-purple-200 border-t-purple-600" />
          <p className="text-sm font-semibold">Loading verification workspace...</p>
        </div>
      </div>
    )
  }

  if (error && !record) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Unable to Load Review</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={loadVerificationData}
              className="rounded-xl bg-[#6D28D9] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#5B21B6]"
            >
              Retry
            </button>
            <Link
              to="/verifications/queue"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Queue
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6 text-slate-900">
      {/* Toast Feedback */}
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

      {/* 1. Breadcrumbs & Command Header */}
      <ReviewHeader
        record={record}
        onSaveAndExit={handleSaveAndExit}
        saving={saving}
      />

      {/* 2. Provider Profile & Stepper Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        {/* Left (Span 5) — Provider Identification */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3 lg:border-r lg:border-slate-100 lg:pr-6">
          <div className="flex items-start gap-4">
            {/* Avatar with Verified ring */}
            <div className="relative shrink-0">
              <img
                src={record?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={record?.name || 'Provider'}
                className="size-16 rounded-2xl border-2 border-purple-200 object-cover shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white text-[10px] font-bold">
                ✓
              </span>
            </div>

            {/* Provider Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {record?.name || 'Grace Njeri'}
                </h2>
                <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
                  🟣 Under Review
                </span>
              </div>

              <p className="text-xs font-medium text-slate-500">
                <span className="font-mono text-purple-700 font-semibold">{record?.providerId || 'PR-82941'}</span>
                {' • '}
                <span>{record?.type || 'Massage Therapist'}</span>
                {' • '}
                <span>{record?.market?.flag || '🇰🇪'} {record?.market?.name || 'Kenya'}</span>
              </p>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                <Clock className="size-3 text-slate-400" />
                <span>Submitted: {record?.submittedAt || '12 Sep 2026 • 10:42 AM'}</span>
              </div>
            </div>
          </div>

          {/* Assigned Reviewer Row */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <img
              src={record?.assignedReviewer?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
              alt={record?.assignedTo || 'Jane Ochieng'}
              className="size-6 rounded-full border border-purple-200 object-cover"
            />
            <span>
              Assigned to: <strong className="text-slate-800 font-semibold">{record?.assignedTo || 'Jane Ochieng'}</strong>
            </span>
          </div>
        </div>

        {/* Right (Span 7) — Verification Progress Stepper */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <ReviewStepper
            steps={record?.progressSteps || []}
            activeStepId={activeTabId}
            onSelectStep={handleSelectTab}
          />
        </div>
      </div>

      {/* 3. Verification Component Tabs */}
      <ReviewComponentTabs
        tabs={record?.componentTabs || []}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
      />

      {/* 4. Main Two-Column Layout (Left 65% / Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: EVIDENCE & HISTORICAL AUDIT (Span 8 ~ 65%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Submitted Document & Canvas Workspace */}
          <DocumentViewerCanvas
            activeDoc={activeDoc}
            documents={documents}
            onSelectDoc={(d) => setActiveDoc(d)}
            provider={record}
          />

          {/* Bottom Subcards: Previous Submissions (Left) & Review History (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PreviousSubmissionsTable
              submissions={record?.previousSubmissions || []}
              onSelectSubmission={(sub) => {
                const target = documents.find((d) => d.fileName === sub.fileName) || activeDoc
                if (target) setActiveDoc(target)
                showToast(`Viewing version: ${sub.fileName}`, 'info')
              }}
            />

            <ReviewHistoryTimeline
              history={record?.reviewHistory || []}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: REVIEW DECISIONS, COMPARISON & CHECKLIST (Span 4 ~ 35%) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Review Actions Panel */}
          <ReviewActionsPanel
            onApprove={handleApproveComponent}
            onRequestChanges={() => setRequestChangesOpen(true)}
            onReject={() => setRejectOpen(true)}
            onEscalate={() => setEscalateOpen(true)}
            submitting={saving}
          />

          {/* 2. Information Comparison Card */}
          <InformationComparisonTable
            comparisonData={record?.comparisonData || []}
            providerId={record?.providerId || 'PR-82941'}
          />

          {/* 3. Verification Checklist Card */}
          <VerificationChecklistCard
            checklist={checklist}
            onChecklistChange={handleChecklistChange}
            onOpenNotes={() => setNotesOpen(true)}
            notesCount={(record?.internalNotes || []).length}
          />

          {/* 4. Next Steps Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Next Steps
            </h3>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleCompleteAndContinue}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white py-3 px-4 font-bold text-sm shadow-md transition cursor-pointer"
            >
              <span>Mark as Complete & Continue</span>
              <ArrowRight className="size-4" />
            </button>

            {/* Secondary Action */}
            <button
              type="button"
              onClick={handleSaveAndExit}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs cursor-pointer"
            >
              <Clock className="size-3.5 text-slate-400" />
              <span>⏱ Save & Review Later</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Request Changes Modal */}
      <RequestChangesModal
        isOpen={requestChangesOpen}
        onClose={() => setRequestChangesOpen(false)}
        record={record}
        onSubmit={handleRequestChangesSubmit}
      />

      {/* 2. Reject Verification Modal */}
      <RejectVerificationModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        record={record}
        onSubmit={handleRejectSubmit}
      />

      {/* 3. Escalate Modal */}
      <QueueEscalateModal
        isOpen={escalateOpen}
        onClose={() => setEscalateOpen(false)}
        record={record}
        onSubmit={handleEscalateSubmit}
      />

      {/* 4. Internal Notes Modal */}
      <InternalNotesModal
        isOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
        notes={record?.internalNotes || []}
        onAddNote={handleAddInternalNote}
        providerName={record?.name}
      />

      {/* 5. Final Verification Confirmation Modal */}
      <FinalVerificationModal
        isOpen={finalModalOpen}
        onClose={() => setFinalModalOpen(false)}
        onConfirm={handleFinalVerificationConfirm}
        record={record}
        submitting={saving}
      />
    </div>
  )
}
