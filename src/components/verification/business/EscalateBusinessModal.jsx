import React, { useState } from 'react'
import {
  AlertTriangle,
  X,
  ShieldAlert,
  Loader2,
  Send,
} from 'lucide-react'

/**
 * ADM-034: EscalateBusinessModal
 * Modal allowing reviewer to transfer high-risk business document verification
 * cases directly to the Senior Legal & Compliance team.
 */
export default function EscalateBusinessModal({
  isOpen,
  onClose,
  onSubmit,
  documentTitle = 'Operating Licence',
  saving = false,
}) {
  const [reason, setReason] = useState(
    'Suspected forged county seal, QR verification hash failure'
  )
  const [complianceNotes, setComplianceNotes] = useState('')

  if (!isOpen) return null

  const escalationReasons = [
    'Suspected forged county seal, QR verification hash failure',
    'Complex multi-jurisdictional corporate holding structure',
    'Municipal licensing boundary or property parcel zoning dispute',
    'Direct referral requested by Legal Counsel & Senior Compliance',
    'High-risk commercial premises or previous safety incident record',
    'Contradictory shareholder mandate between CR12 and Board Resolution',
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!reason) return

    onSubmit?.({
      reason,
      complianceNotes: complianceNotes.trim(),
      internalNote: complianceNotes.trim() || `Case escalated to compliance: ${reason}`,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-[#6D28D9]">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Escalate to Compliance Team</h3>
              <p className="text-xs text-slate-500">
                Transfer case review for <span className="font-semibold text-slate-700">{documentTitle}</span>
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

        {/* Informational Banner */}
        <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3 flex items-start gap-2.5 text-xs text-purple-950">
          <AlertTriangle className="size-4 text-[#6D28D9] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Escalating this document assigns priority custody to the Legal & Compliance unit. You will remain tagged as reviewing specialist.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Escalation Classification:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-[#6D28D9] focus:outline-none focus:ring-1 focus:ring-[#6D28D9] cursor-pointer"
            >
              {escalationReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Compliance Briefing Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Compliance Briefing & Technical Findings:
            </label>
            <textarea
              value={complianceNotes}
              onChange={(e) => setComplianceNotes(e.target.value)}
              placeholder="Detail specific anomalies found during permit cross-check or corporate registry search..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-[#6D28D9] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#5B21B6] transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              <span>Submit Escalation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
