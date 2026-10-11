import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import CredentialHeader from '../components/verification/credentials/CredentialHeader'
import CredentialSummaryCard from '../components/verification/credentials/CredentialSummaryCard'
import CredentialTabs from '../components/verification/credentials/CredentialTabs'
import CredentialDocumentViewer from '../components/verification/credentials/CredentialDocumentViewer'
import CredentialRequirementCard from '../components/verification/credentials/CredentialRequirementCard'
import CredentialComparisonTable from '../components/verification/credentials/CredentialComparisonTable'
import CredentialChecklistCard from '../components/verification/credentials/CredentialChecklistCard'
import CredentialReviewActions from '../components/verification/credentials/CredentialReviewActions'
import CredentialPreviousSubmissions from '../components/verification/credentials/CredentialPreviousSubmissions'
import CredentialReviewHistory from '../components/verification/credentials/CredentialReviewHistory'
import RequestChangesCredentialModal from '../components/verification/credentials/RequestChangesCredentialModal'
import RejectCredentialModal from '../components/verification/credentials/RejectCredentialModal'
import EscalateCredentialModal from '../components/verification/credentials/EscalateCredentialModal'
import { verificationService } from '../services/verificationService'

/**
 * ADM-033: Professional Credentials Review
 * Master review screen for evaluating qualifications, certificates, licenses, and accreditation.
 * Strictly adheres to Lé Inspa light theme design system (ADM-009, ADM-030, ADM-031, ADM-032).
 * Global top navbar is provided by AdminLayout.
 */
export default function ProfessionalCredentialsReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Target provider/verification ID (defaults to Grace Njeri if absent)
  const targetId = id || 'PR-82941'

  // Data states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [activeCredId, setActiveCredId] = useState('cred-001')
  const [submitting, setSubmitting] = useState(false)

  // Modals state
  const [requestChangesOpen, setRequestChangesOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [escalateOpen, setEscalateOpen] = useState(false)

  // Toast feedback
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3800)
  }

  // Load credential review data
  const loadData = useCallback(async (credId = activeCredId) => {
    setLoading(true)
    setError(null)
    try {
      const res = await verificationService.fetchCredentialVerificationDetail(targetId, credId)
      setData(res)
      if (res?.activeCredential?.id) {
        setActiveCredId(res.activeCredential.id)
      }
    } catch (err) {
      console.error('[ProfessionalCredentialsReviewPage] Failed to load detail:', err)
      setError(err?.message || 'Failed to load credential verification record.')
    } finally {
      setLoading(false)
    }
  }, [targetId, activeCredId])

  useEffect(() => {
    loadData(activeCredId)
  }, [loadData, activeCredId])

  // Handle switching credential tabs
  const handleSelectCredential = (credId) => {
    setActiveCredId(credId)
    loadData(credId)
  }

  // Checklist item status toggle
  const handleChecklistChange = (key, nextStatus) => {
    if (!data) return
    setData((prev) => ({
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
    showToast(`Checklist criterion updated to ${nextStatus}.`, 'info')
  }

  // 1. Approve Credential Action
  const handleApprove = async () => {
    if (!data) return
    setSubmitting(true)
    try {
      const checklistResults = data.checklist.reduce((acc, c) => {
        acc[c.key] = c.status
        return acc
      }, {})

      await verificationService.submitCredentialDecision({
        verificationId: data.verificationId || targetId,
        credentialId: activeCredId,
        decision: 'APPROVE',
        checklistResults,
        internalNote: `Approved by Jane Ochieng: ${data.activeCredential?.title || 'Practice Certificate'}`,
        expectedVersion: data.version,
      })

      showToast('Credential approved! Service eligibility unlocked.', 'success')
      await loadData(activeCredId)
    } catch (err) {
      showToast(err?.message || 'Failed to approve credential.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 2. Request Changes Action
  const handleRequestChangesSubmit = async (payload) => {
    if (!data) return
    setSubmitting(true)
    try {
      await verificationService.submitCredentialDecision({
        verificationId: data.verificationId || targetId,
        credentialId: activeCredId,
        decision: 'REQUEST_CHANGES',
        reason: payload.reason,
        providerMessage: payload.providerMessage,
        internalNote: payload.internalNote,
        expectedVersion: data.version,
      })

      showToast('Correction notice dispatched to provider.', 'warning')
      setRequestChangesOpen(false)
      await loadData(activeCredId)
    } catch (err) {
      showToast(err?.message || 'Failed to request credential changes.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 3. Reject Credential Action
  const handleRejectSubmit = async (payload) => {
    if (!data) return
    setSubmitting(true)
    try {
      await verificationService.submitCredentialDecision({
        verificationId: data.verificationId || targetId,
        credentialId: activeCredId,
        decision: 'REJECT',
        reason: payload.reason,
        internalNote: payload.internalNote,
        expectedVersion: data.version,
      })

      showToast('Credential formally rejected. Logged to compliance audit.', 'error')
      setRejectOpen(false)
      await loadData(activeCredId)
    } catch (err) {
      showToast(err?.message || 'Failed to reject credential.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 4. Escalate Credential Action
  const handleEscalateSubmit = async (payload) => {
    if (!data) return
    setSubmitting(true)
    try {
      await verificationService.submitCredentialDecision({
        verificationId: data.verificationId || targetId,
        credentialId: activeCredId,
        decision: 'ESCALATE',
        reason: payload.reason,
        internalNote: payload.complianceNotes || payload.internalNote,
        expectedVersion: data.version,
      })

      showToast('Credential escalated to Senior Clinical Standards.', 'warning')
      setEscalateOpen(false)
      await loadData(activeCredId)
    } catch (err) {
      showToast(err?.message || 'Failed to escalate credential.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 5. Add Internal Note
  const handleAddNote = async (text) => {
    if (!data) return
    try {
      await verificationService.addCredentialInternalNote(data.verificationId || targetId, activeCredId, text)
      showToast('Private note added.', 'success')
      await loadData(activeCredId)
    } catch (err) {
      showToast(err?.message || 'Failed to add note.', 'error')
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="size-8 animate-spin rounded-full border-3 border-purple-200 border-t-purple-600" />
          <p className="text-sm font-semibold">Loading credential verification workspace...</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Unable to Load Credentials</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => loadData(activeCredId)}
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

      {/* 1. Header & Actions */}
      <CredentialHeader
        verificationId={data?.verificationId || targetId}
        providerId={data?.providerId || 'PR-82941'}
      />

      {/* 2. Provider Context & Credential Review Summary */}
      <CredentialSummaryCard data={data} />

      {/* 3. Horizontal Credential Navigation Tabs */}
      <CredentialTabs
        credentials={data?.credentialsList || []}
        activeCredentialId={activeCredId}
        onSelectCredential={handleSelectCredential}
      />

      {/* 4. Main Two-Column Layout (Left 65% / Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: EVIDENCE, COMPARISON & HISTORY (Span 8 ~ 65%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Large Interactive Document Viewer */}
          <CredentialDocumentViewer
            credential={data?.activeCredential}
            onRevealNumber={(revealed) => {
              showToast(revealed ? 'Registration number unmasked.' : 'Registration number masked.', 'info')
            }}
          />

          {/* Professional Information Comparison Table */}
          <CredentialComparisonTable
            comparisonRows={data?.comparisonTable || []}
          />

          {/* Previous Submissions & Internal Notes */}
          <CredentialPreviousSubmissions
            submissions={data?.previousSubmissions || []}
            internalNotes={data?.internalNotes || []}
            onAddNote={handleAddNote}
            onSelectVersion={(sub) => {
              showToast(`Viewing version ${sub.version}`, 'info')
            }}
          />
        </div>

        {/* RIGHT COLUMN: REQUIREMENT, CHECKLIST, ACTIONS & TIMELINE (Span 4 ~ 35%) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Credential Requirement & Validity Card */}
          <CredentialRequirementCard
            requirementsMapping={data?.requirementsMapping}
            onRequestRenewal={() => {
              setRequestChangesOpen(true)
            }}
          />

          {/* 2. Credential Review Checklist Card */}
          <CredentialChecklistCard
            checklist={data?.checklist || []}
            onChecklistChange={handleChecklistChange}
          />

          {/* 3. Review Actions Panel */}
          <CredentialReviewActions
            onApprove={handleApprove}
            onRequestChanges={() => setRequestChangesOpen(true)}
            onReject={() => setRejectOpen(true)}
            onEscalate={() => setEscalateOpen(true)}
            submitting={submitting}
            status={data?.activeCredential?.status}
          />

          {/* 4. Review History Timeline */}
          <CredentialReviewHistory
            history={data?.reviewHistory || []}
          />
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Request Changes Modal */}
      <RequestChangesCredentialModal
        isOpen={requestChangesOpen}
        onClose={() => setRequestChangesOpen(false)}
        credentialTitle={data?.activeCredential?.title}
        providerName={data?.name}
        onSubmit={handleRequestChangesSubmit}
      />

      {/* 2. Reject Modal */}
      <RejectCredentialModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        credentialTitle={data?.activeCredential?.title}
        providerName={data?.name}
        onSubmit={handleRejectSubmit}
      />

      {/* 3. Escalate Modal */}
      <EscalateCredentialModal
        isOpen={escalateOpen}
        onClose={() => setEscalateOpen(false)}
        credentialTitle={data?.activeCredential?.title}
        providerName={data?.name}
        onSubmit={handleEscalateSubmit}
      />
    </div>
  )
}
