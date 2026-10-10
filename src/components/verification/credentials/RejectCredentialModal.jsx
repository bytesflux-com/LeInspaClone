import { useState } from 'react'
import { X, AlertOctagon, XCircle, ShieldAlert } from 'lucide-react'

/**
 * ADM-033: RejectCredentialModal
 * Formally rejects submitted professional credential with mandatory reason and compliance logging.
 */
export default function RejectCredentialModal({
  isOpen,
  onClose,
  credentialTitle = 'Professional Practice Certificate',
  providerName = 'Grace Njeri',
  onSubmit,
}) {
  const [selectedReason, setSelectedReason] = useState('Unaccredited or unrecognized issuing institution')
  const [explanation, setExplanation] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const rejectionReasons = [
    'Unaccredited or unrecognized issuing institution',
    'Credential expired beyond allowable renewal threshold',
    'Qualification does not satisfy Tier-1 category requirements',
    'Suspected fraudulent certificate or altered conferring dates',
    'Name on credential does not correspond to account holder',
    'Certificate revoked or suspended by professional board',
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
        internalNote: `Credential rejection executed. Rationale: ${explanation.trim()}`,
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
              <h3 className="text-base font-bold text-slate-900">Reject Professional Credential</h3>
              <p className="text-xs text-slate-500">
                Reject {credentialTitle} for {providerName}
              </p>
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
          {/* Warning */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-rose-800 text-xs flex items-start gap-2">
            <ShieldAlert className="size-4 shrink-0 text-rose-600 mt-0.5" />
            <p>
              Rejection prevents the provider from offering related treatments on Lé Inspa and logs a compliance record.
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
              placeholder="Detail the official verification failure grounds, board registry findings, or deficiency reasons..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-rose-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-100 leading-relaxed"
            />
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 bg-slate-50/60 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="size-4 rounded-md border-slate-300 text-rose-600 focus:ring-rose-500 mt-0.5"
            />
            <span className="text-slate-700 leading-snug">
              I certify that I have verified the credential against accredited regulatory standards and confirmed that it does not meet Lé Inspa professional practice guidelines.
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
