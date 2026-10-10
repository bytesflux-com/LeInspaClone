import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import BusinessHeader from '../components/verification/business/BusinessHeader'
import BusinessProfileProgressCard from '../components/verification/business/BusinessProfileProgressCard'
import BusinessRequirementTabs from '../components/verification/business/BusinessRequirementTabs'
import BusinessDocumentViewer from '../components/verification/business/BusinessDocumentViewer'
import BusinessRequirementInfoCard from '../components/verification/business/BusinessRequirementInfoCard'
import BusinessRepresentativeCard from '../components/verification/business/BusinessRepresentativeCard'
import BusinessAddressComparisonCard from '../components/verification/business/BusinessAddressComparisonCard'
import BusinessComparisonTable from '../components/verification/business/BusinessComparisonTable'
import BusinessChecklistCard from '../components/verification/business/BusinessChecklistCard'
import BusinessReviewActions from '../components/verification/business/BusinessReviewActions'
import BusinessPreviousSubmissions from '../components/verification/business/BusinessPreviousSubmissions'
import BusinessReviewHistory from '../components/verification/business/BusinessReviewHistory'
import RequestChangesBusinessModal from '../components/verification/business/RequestChangesBusinessModal'
import RejectBusinessModal from '../components/verification/business/RejectBusinessModal'
import EscalateBusinessModal from '../components/verification/business/EscalateBusinessModal'
import { verificationService } from '../services/verificationService'

/**
 * ADM-034: Business Documents Review
 * Master review workstation for evaluating corporate incorporation, premises operating permits,
 * tax compliance, and authorized signatory credentials for Spas, Wellness Centers, and Hotels.
 * Strictly adheres to Lé Inspa light theme design system (ADM-009, ADM-030, ADM-031, ADM-032, ADM-033).
 * Global top navbar is provided by AdminLayout.
 */
export default function BusinessDocumentsReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Target provider/verification ID (defaults to Serenity Wellness Spa if absent)
  const targetId = id || 'SPA-28192'

  // Data states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [activeDocId, setActiveDocId] = useState('doc-licence')
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

  // Load business verification review data
  const loadData = useCallback(async (docId = activeDocId) => {
    setLoading(true)
    setError(null)
    try {
      const res = await verificationService.fetchBusinessVerificationDetail(targetId, docId)
      setData(res)
      if (res?.activeDocument?.id) {
        setActiveDocId(res.activeDocument.id)
      }
    } catch (err) {
      console.error('[BusinessDocumentsReviewPage] Failed to load detail:', err)
      setError(err?.message || 'Failed to load business document verification record.')
    } finally {
      setLoading(false)
    }
  }, [targetId, activeDocId])

  useEffect(() => {
    loadData(activeDocId)
  }, [loadData, activeDocId])

  // Handle switching document tabs
  const handleSelectDoc = (docId) => {
    setActiveDocId(docId)
    loadData(docId)
  }

  // Checklist status toggle
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

  // Unmask sensitive document number
  const handleRevealNumber = async (isRevealed) => {
    if (!data) return
    if (isRevealed) {
      try {
        const res = await verificationService.revealBusinessDocumentNumber(
          data.verificationId || targetId,
          activeDocId
        )
        if (res?.plainNumber) {
          setData((prev) => ({
            ...prev,
            activeDocument: {
              ...prev.activeDocument,
              regNumberPlain: res.plainNumber,
            },
          }))
          showToast(`Document number unmasked for audit inspection.`, 'info')
        }
      } catch (err) {
        showToast(err?.message || 'Failed to unmask document number.', 'error')
      }
    }
  }

  // 1. Approve Action
  const handleApprove = async () => {
    if (!data) return
    setSubmitting(true)
    try {
      const checklistResults = data.checklist.reduce((acc, c) => {
        acc[c.key] = c.status
        return acc
      }, {})

      await verificationService.submitBusinessDocumentDecision({
        verificationId: data.verificationId || targetId,
        documentId: activeDocId,
        decision: 'APPROVE',
        checklistResults,
        internalNote: `Approved by Jane Ochieng: ${data.activeDocument?.title || 'Operating Licence'}`,
        expectedVersion: data.version,
      })

      showToast('Business document approved! Premises status active.', 'success')
      await loadData(activeDocId)
    } catch (err) {
      showToast(err?.message || 'Failed to approve business document.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 2. Request Changes Action
  const handleRequestChangesSubmit = async (payload) => {
    if (!data) return
    setSubmitting(true)
    try {
      await verificationService.submitBusinessDocumentDecision({
        verificationId: data.verificationId || targetId,
        documentId: activeDocId,
        decision: 'REQUEST_CHANGES',
        reason: payload.reason,
        providerMessage: payload.providerMessage,
        internalNote: payload.internalNote,
        expectedVersion: data.version,
      })

      showToast('Correction notice dispatched to provider.', 'warning')
      setRequestChangesOpen(false)
      await loadData(activeDocId)
    } catch (err) {
      showToast(err?.message || 'Failed to submit change request.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 3. Reject Action
  const handleRejectSubmit = async (payload) => {
    if (!data) return
    setSubmitting(true)
    try {
      await verificationService.submitBusinessDocumentDecision({
        verificationId: data.verificationId || targetId,
        documentId: activeDocId,
        decision: 'REJECT',
        reason: payload.reason,
        providerMessage: payload.providerMessage,
        internalNote: payload.internalNote,
        expectedVersion: data.version,
      })

      showToast('Business document rejected. Provider operations blocked.', 'error')
      setRejectOpen(false)
      await loadData(activeDocId)
    } catch (err) {
      showToast(err?.message || 'Failed to reject business document.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 4. Escalate Action
  const handleEscalateSubmit = async (payload) => {
    if (!data) return
    setSubmitting(true)
    try {
      await verificationService.submitBusinessDocumentDecision({
        verificationId: data.verificationId || targetId,
        documentId: activeDocId,
        decision: 'ESCALATE',
        reason: payload.reason,
        providerMessage: '',
        internalNote: payload.internalNote,
        expectedVersion: data.version,
      })

      showToast('Case escalated to Senior Compliance & Legal.', 'info')
      setEscalateOpen(false)
      await loadData(activeDocId)
    } catch (err) {
      showToast(err?.message || 'Failed to escalate case.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Add Internal Staff Note
  const handleAddInternalNote = async (text) => {
    if (!data || !text.trim()) return
    try {
      const res = await verificationService.addBusinessInternalNote(
        data.verificationId || targetId,
        activeDocId,
        text
      )
      if (res?.note) {
        setData((prev) => ({
          ...prev,
          internalNotes: [res.note, ...(prev.internalNotes || [])],
        }))
        showToast('Internal note saved to confidential audit log.', 'success')
      }
    } catch (err) {
      showToast(err?.message || 'Failed to save internal note.', 'error')
    }
  }

  // Cross-link Navigation
  const handleBackToReview = () => {
    navigate(`/verifications/review/${targetId}`)
  }

  const handleViewIdentity = () => {
    navigate(`/verifications/identity/${data?.representative?.identityReviewId || targetId}`)
  }

  const handleViewBusinessProfile = () => {
    showToast(`Navigating to profile for ${data?.tradingName || 'Business'}...`, 'info')
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-900">
      {/* Toast Notification Surface */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs sm:text-sm font-semibold shadow-xl transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : toast.type === 'error'
              ? 'border-rose-300 bg-rose-50 text-rose-900'
              : toast.type === 'warning'
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-purple-300 bg-purple-50 text-purple-950'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="size-4 text-rose-600 shrink-0" />}
          {toast.type === 'warning' && <AlertCircle className="size-4 text-amber-600 shrink-0" />}
          {toast.type === 'info' && <CheckCircle2 className="size-4 text-[#6D28D9] shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Header (No Duplicate Global Navbar) */}
      <BusinessHeader
        verificationId={data?.verificationId || targetId}
        providerId={data?.providerId || 'SPA-28192'}
        tradingName={data?.tradingName || 'Serenity Wellness Spa'}
        businessCategory={data?.businessCategory || 'Spa & Wellness Center'}
        status={data?.status || 'UNDER_REVIEW'}
        version={data?.version || 2}
        onBack={handleBackToReview}
        onViewProfile={handleViewBusinessProfile}
      />

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="flex h-96 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="size-8 animate-spin text-[#6D28D9]" />
          <p className="text-sm font-semibold text-slate-600">
            Loading statutory business documents and municipal permits...
          </p>
        </div>
      )}

      {/* Error Fallback */}
      {error && !data && (
        <div className="flex h-96 flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-white p-6 text-center">
          <AlertCircle className="size-10 text-rose-600" />
          <h3 className="text-base font-bold text-slate-900">Failed to Load Business Review</h3>
          <p className="text-xs text-slate-500 max-w-md">{error}</p>
          <button
            type="button"
            onClick={() => loadData(activeDocId)}
            className="rounded-xl bg-[#6D28D9] px-4 py-2 text-xs font-bold text-white hover:bg-[#5B21B6] transition cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Content Surface */}
      {data && (
        <>
          {/* 2. Business Profile & Verification Progress Card */}
          <BusinessProfileProgressCard
            providerId={data.providerId}
            tradingName={data.tradingName}
            legalEntityName={data.legalEntityName}
            businessCategory={data.businessCategory}
            market={data.market}
            location={data.location}
            assignedReviewer={data.assignedReviewer}
            progressSummary={data.progressSummary}
          />

          {/* 3. Document Requirement Tabs */}
          <BusinessRequirementTabs
            documents={data.documents}
            activeDocId={activeDocId}
            onSelectDoc={handleSelectDoc}
          />

          {/* 4. Document-Centric Workstation (Two-Column Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT WORKSPACE: 68% Width (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Document Canvas & Inspection Viewer */}
              <BusinessDocumentViewer
                documentData={data.activeDocument}
                onRevealNumber={handleRevealNumber}
              />

              {/* Information Comparison Table with Trading Name Rule */}
              <BusinessComparisonTable
                comparisonRows={data.comparisonTable}
              />

              {/* Physical Facility vs Registered Corporate Address */}
              <BusinessAddressComparisonCard
                addressComparison={data.addressComparison}
              />

              {/* Statutory Mandate & Platform Enabled Services */}
              <BusinessRequirementInfoCard
                requirementInfo={data.requirementInfo}
              />

              {/* Version History, Version Compare Modal & Internal Notes Composer */}
              <BusinessPreviousSubmissions
                submissions={data.previousSubmissions}
                internalNotes={data.internalNotes}
                onAddNote={handleAddInternalNote}
              />
            </div>

            {/* RIGHT SIDEBAR: 32% Width (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Authorized Representative Card with Direct Link to ADM-032 */}
              <BusinessRepresentativeCard
                representative={data.representative}
                onViewIdentity={handleViewIdentity}
              />

              {/* Statutory Checklist Card with Click-to-Cycle Toggles */}
              <BusinessChecklistCard
                checklist={data.checklist}
                onToggleStatus={handleChecklistChange}
              />

              {/* Primary Decision Action Controls */}
              <BusinessReviewActions
                onApprove={handleApprove}
                onRequestChanges={() => setRequestChangesOpen(true)}
                onReject={() => setRejectOpen(true)}
                onEscalate={() => setEscalateOpen(true)}
                saving={submitting}
                status={data.activeDocument?.status || data.status}
              />

              {/* Chronological Audit Timeline */}
              <BusinessReviewHistory
                reviewHistory={data.reviewHistory}
              />
            </div>
          </div>

          {/* Decision Modals */}
          <RequestChangesBusinessModal
            isOpen={requestChangesOpen}
            onClose={() => setRequestChangesOpen(false)}
            onSubmit={handleRequestChangesSubmit}
            documentTitle={data.activeDocument?.title}
            saving={submitting}
          />

          <RejectBusinessModal
            isOpen={rejectOpen}
            onClose={() => setRejectOpen(false)}
            onSubmit={handleRejectSubmit}
            documentTitle={data.activeDocument?.title}
            saving={submitting}
          />

          <EscalateBusinessModal
            isOpen={escalateOpen}
            onClose={() => setEscalateOpen(false)}
            onSubmit={handleEscalateSubmit}
            documentTitle={data.activeDocument?.title}
            saving={submitting}
          />
        </>
      )}
    </div>
  )
}
