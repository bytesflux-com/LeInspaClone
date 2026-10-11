import { useState } from 'react'
import { X, RotateCcw, AlertTriangle, Send, FileText, Check } from 'lucide-react'

/**
 * ADM-032: RequestNewDocumentModal
 * Dialog to dispatch a document correction request to provider with pre-set reasons and custom guidance.
 */
export default function RequestNewDocumentModal({
  isOpen,
  onClose,
  providerName = 'Grace Njeri',
  onSubmit,
}) {
  const [selectedDoc, setSelectedDoc] = useState('national_id')
  const [selectedReasons, setSelectedReasons] = useState([
    'Back side of ID unreadable due to optical glare or blurriness',
  ])
  const [providerMessage, setProviderMessage] = useState(
    'Please upload a clear, flatbed scan of your National ID. Ensure both front and back sides are fully visible with all four corners intact and no optical glare obscuring the text or barcode.'
  )
  const [internalNote, setInternalNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const commonReasons = [
    'Back side of ID unreadable due to optical glare or blurriness',
    'Edges or corners cropped / incomplete document borders',
    'Low image resolution obscuring facial portrait or serial number',
    'Name variation requires legal name affidavit or official deed poll',
    'Damaged or worn laminate card surface preventing OCR verification',
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
        documentRequested: selectedDoc,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <RotateCcw className="size-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Request New Identity Document</h3>
              <p className="text-xs text-slate-500">Dispatch correction notice to {providerName}</p>
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
          {/* Document to Re-upload */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Document Type Requested</label>
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 font-medium focus:border-purple-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-100"
            >
              <option value="national_id">Republic of Kenya National ID (Front & Back)</option>
              <option value="passport">Republic of Kenya Passport (Bio-data page)</option>
              <option value="affidavit">Legal Name Clarification Affidavit / Gazette Notice</option>
              <option value="police_clearance">DCI Police Clearance Certificate (Good Conduct)</option>
            </select>
          </div>

          {/* Preset Reasons Checklist */}
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
              placeholder="e.g. Back scan serial number blurred; requesting 300 DPI flatbed scan."
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
              <span>Dispatch Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
