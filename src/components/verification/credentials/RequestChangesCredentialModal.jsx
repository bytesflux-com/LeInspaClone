import { useState } from 'react'
import { X, RotateCcw, Send, AlertTriangle } from 'lucide-react'

/**
 * ADM-033: RequestChangesCredentialModal
 * Dialog for requesting credential corrections or re-uploads from the provider.
 */
export default function RequestChangesCredentialModal({
  isOpen,
  onClose,
  credentialTitle = 'Professional Practice Certificate',
  providerName = 'Grace Njeri',
  onSubmit,
}) {
  const [selectedReasons, setSelectedReasons] = useState([
    'Issuing institution seal, stamp, or registrar signature unreadable',
  ])
  const [providerMessage, setProviderMessage] = useState(
    'Please upload a clear, high-contrast scan of your certificate showing the official issuing institution seal, accreditation number, and registrar signature.'
  )
  const [internalNote, setInternalNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const commonReasons = [
    'Issuing institution seal, stamp, or registrar signature unreadable',
    'Certificate expiration date missing, obscured, or illegible',
    'Page 2 (Practicum hours or clinical transcript) missing from upload',
    'Name on credential does not correspond with identity documentation',
    'Low resolution scan or optical reflection obscuring certificate text',
    'Course syllabus / qualification tier does not satisfy Tier-1 requirement',
  ]

  const toggleReason = (reason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedReasons.length === 0) return

    setSubmitting(true)
    try {
      await onSubmit?.({
        decision: 'REQUEST_CHANGES',
        reasons: selectedReasons,
        reason: selectedReasons.join('; '),
        providerMessage,
        internalNote,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <RotateCcw className="size-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Request Credential Changes</h3>
              <p className="text-xs text-slate-500">
                Notice for {credentialTitle} ({providerName})
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
          {/* Reasons */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Identified Deficiencies (Select all that apply)</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {commonReasons.map((reason) => {
                const checked = selectedReasons.includes(reason)
                return (
                  <label
                    key={reason}
                    className={`flex items-start gap-2.5 rounded-xl border p-2.5 transition cursor-pointer ${
                      checked
                        ? 'border-amber-300 bg-amber-50/40 text-slate-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleReason(reason)}
                      className="size-4 rounded-md border-slate-300 text-amber-600 focus:ring-amber-500 mt-0.5"
                    />
                    <span className="text-xs leading-snug">{reason}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Provider Notification Message */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">
              Message Sent to Provider (App notification & email)
            </label>
            <textarea
              rows={3}
              value={providerMessage}
              onChange={(e) => setProviderMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-purple-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-100 leading-relaxed"
            />
          </div>

          {/* Internal Reviewer Note */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">
              Internal Admin Note (Private — not shown to provider)
            </label>
            <input
              type="text"
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="e.g. Seal unreadable on mobile photo; requesting official scanned PDF."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-slate-800 focus:border-purple-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-100"
            />
          </div>

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
              disabled={submitting || selectedReasons.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-40 transition cursor-pointer"
            >
              {submitting ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="size-3.5" />
              )}
              <span>Dispatch Change Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
