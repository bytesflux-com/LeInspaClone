import React, { useState } from 'react'
import {
  FileEdit,
  X,
  AlertCircle,
  Loader2,
  Send,
  CheckSquare,
  Square,
} from 'lucide-react'

/**
 * ADM-034: RequestChangesBusinessModal
 * Modal allowing reviewer to select standard business document defect reasons
 * and author an instructional message dispatched directly to the provider.
 */
export default function RequestChangesBusinessModal({
  isOpen,
  onClose,
  onSubmit,
  documentTitle = 'Operating Licence',
  saving = false,
}) {
  const [selectedReasons, setSelectedReasons] = useState([
    'Operating permit expired for current calendar year (Requires 2025/2026 renewal)',
  ])
  const [providerMessage, setProviderMessage] = useState('')
  const [internalNote, setInternalNote] = useState('')

  if (!isOpen) return null

  const standardReasons = [
    'Operating permit expired for current calendar year (Requires 2025/2026 renewal)',
    'Premises address on permit does not match physical application location',
    'Document scan cropped, blurred, or official county stamp/seal unreadable',
    'Missing schedule of permitted wellness/spa activities (Annexure A)',
    'Public Health & Sanitation Inspection Certificate missing or expired',
    'Authorized signatory appointment mandate / CR12 outdated or incomplete',
  ]

  const handleToggleReason = (reason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedReasons.length === 0 && !providerMessage.trim()) return

    onSubmit?.({
      reasons: selectedReasons,
      reason: selectedReasons.join('; ') || 'Documentation corrections required',
      providerMessage: providerMessage.trim(),
      internalNote: internalNote.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
              <FileEdit className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Request Document Changes</h3>
              <p className="text-xs text-slate-500">
                Correction notice for <span className="font-semibold text-slate-700">{documentTitle}</span>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Standard Checklist Reasons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Standard Statutory Deficiencies (Select all that apply):
            </label>

            <div className="space-y-1.5">
              {standardReasons.map((reason) => {
                const checked = selectedReasons.includes(reason)
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => handleToggleReason(reason)}
                    className={`flex items-start gap-2.5 w-full rounded-xl border p-2.5 text-left text-xs transition cursor-pointer ${
                      checked
                        ? 'border-amber-300 bg-amber-50/50 text-amber-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="size-4 text-amber-700 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="size-4 text-slate-300 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-snug">{reason}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Provider Instruction Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Direct Guidance to Provider (Visible on Provider Dashboard):
            </label>
            <textarea
              value={providerMessage}
              onChange={(e) => setProviderMessage(e.target.value)}
              placeholder="Please upload a high-resolution scan of your 2025 Nairobi County Single Business Permit renewal receipt and schedule..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* 3. Confidential Internal Staff Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Private Internal Administrative Note (Staff Only):
            </label>
            <input
              type="text"
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="e.g. Followed up via phone; provider stated county inspector visited yesterday."
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
              disabled={saving || (selectedReasons.length === 0 && !providerMessage.trim())}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
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
