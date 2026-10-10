import React, { useState } from 'react'
import {
  XCircle,
  X,
  AlertTriangle,
  Loader2,
  AlertOctagon,
} from 'lucide-react'

/**
 * ADM-034: RejectBusinessModal
 * Confirmation modal for rejecting an invalid or fraudulent business document.
 */
export default function RejectBusinessModal({
  isOpen,
  onClose,
  onSubmit,
  documentTitle = 'Operating Licence',
  saving = false,
}) {
  const [reason, setReason] = useState(
    'Operating permit revoked or blacklisted by county municipal authority'
  )
  const [explanation, setExplanation] = useState('')
  const [internalNote, setInternalNote] = useState('')

  if (!isOpen) return null

  const rejectionReasons = [
    'Suspected fraudulent, altered, or fabricated municipal document',
    'Operating permit revoked or blacklisted by county municipal authority',
    'Business entity dissolved, struck off, or inactive in BRS registry',
    'Premises operates unlicensed medical, invasive, or prohibited procedures',
    'Document belongs to an unrelated commercial legal entity',
    'Severe repeated failure to meet minimum statutory sanitation requirements',
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!reason) return

    onSubmit?.({
      reason,
      explanation: explanation.trim(),
      providerMessage: explanation.trim() || `Document rejected: ${reason}`,
      internalNote: internalNote.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <AlertOctagon className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Reject Business Document</h3>
              <p className="text-xs text-slate-500">
                Formal rejection for <span className="font-semibold text-slate-700">{documentTitle}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 flex items-start gap-2.5 text-xs text-rose-900">
          <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Rejecting this document will block the provider from activating public booking operations for this facility until legally compliant credentials are provided.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Primary Statutory Ground for Rejection:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
            >
              {rejectionReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Explanation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Formal Administrative Finding & Provider Notice:
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="State the regulatory evidence and specific findings leading to rejection..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Internal Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Private Internal Staff Note:
            </label>
            <input
              type="text"
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="e.g. Cross-referenced county revenue portal; permit serial does not exist."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-[#6D28D9] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || !reason}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
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
