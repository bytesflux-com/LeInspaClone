import { useState } from 'react'
import { X, AlertOctagon, XCircle, ShieldAlert } from 'lucide-react'

/**
 * ADM-032: RejectIdentityModal
 * Formally rejects submitted identity verification with mandatory reason and compliance logging.
 */
export default function RejectIdentityModal({
  isOpen,
  onClose,
  providerName = 'Grace Njeri',
  onSubmit,
}) {
  const [selectedReason, setSelectedReason] = useState('Suspected fraudulent or digitally altered document')
  const [explanation, setExplanation] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const rejectionReasons = [
    'Suspected fraudulent or digitally altered document',
    'Name on document does not correspond to applicant account',
    'Tampered or altered national identification number / date of birth',
    'Facial biometric mismatch between photo ID and selfie verification',
    'Unacceptable or fraudulent issuer authority',
    'Document revoked or flagged in sovereign civil registry',
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!explanation.trim() || !confirmed) return

    setSubmitting(true)
    try {
      await onSubmit?.({
        decision: 'REJECT',
        reason: `${selectedReason}: ${explanation.trim()}`,
        reasons: [selectedReason],
        internalNote: `Rejection executed by reviewer. Detailed rationale: ${explanation.trim()}`,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <AlertOctagon className="size-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Reject Identity Verification</h3>
              <p className="text-xs text-slate-500">Record formal identity rejection for {providerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Warning Banner */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-rose-800 text-xs flex items-start gap-2">
            <ShieldAlert className="size-4 shrink-0 text-rose-600 mt-0.5" />
            <p>
              Rejection will suspend the provider&apos;s identity onboarding pipeline and log a permanent compliance record.
            </p>
          </div>

          {/* Primary Reason */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Primary Rejection Rationale</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 font-medium focus:border-rose-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-100"
            >
              {rejectionReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Mandatory Explanation */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">
              Detailed Findings & Rationale <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="State the exact evidence or technical grounds for rejecting this identity submission..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-rose-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-100 leading-relaxed"
            />
          </div>

          {/* Mandatory Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 bg-slate-50/60 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="size-4 rounded-md border-slate-300 text-rose-600 focus:ring-rose-500 mt-0.5"
            />
            <span className="text-slate-700 leading-snug">
              I certify that I have verified the national identification standard, cross-checked all particulars, and confirmed that this document fails sovereign admission standards.
            </span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !explanation.trim() || !confirmed}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-40 transition cursor-pointer"
            >
              {submitting ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <XCircle className="size-3.5" />
              )}
              <span>Confirm Rejection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
