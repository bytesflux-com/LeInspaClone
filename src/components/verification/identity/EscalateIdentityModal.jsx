import { useState } from 'react'
import { X, Users, AlertTriangle, ShieldCheck } from 'lucide-react'

/**
 * ADM-032: EscalateIdentityModal
 * Dialog to escalate identity case to the senior Compliance and Trust & Safety team.
 */
export default function EscalateIdentityModal({
  isOpen,
  onClose,
  providerName = 'Grace Njeri',
  onSubmit,
}) {
  const [escalationReason, setEscalationReason] = useState('Suspected identity fraud or fraudulent document')
  const [complianceNotes, setComplianceNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const escalationReasons = [
    'Suspected identity fraud or fraudulent document',
    'Complex legal name variation requiring legal department review',
    'Foreign national / alien ID verification with sovereign embassy',
    'Biometric facial comparison anomaly requiring forensic inspection',
    'Conflicting historical records in provider registry',
    'High-risk profile requiring senior compliance officer sign-off',
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit?.({
        decision: 'ESCALATE',
        reason: escalationReason,
        complianceNotes: complianceNotes.trim(),
        internalNote: `Escalated to Compliance Team: ${escalationReason}. Notes: ${complianceNotes.trim()}`,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-purple-200 bg-white p-6 shadow-2xl space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-[#6D28D9] border border-purple-200">
              <Users className="size-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Escalate Identity Review</h3>
              <p className="text-xs text-slate-500">Route {providerName}&apos;s case to Senior Compliance</p>
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
          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 text-purple-900 text-xs flex items-start gap-2">
            <ShieldCheck className="size-4 shrink-0 text-purple-600 mt-0.5" />
            <p>
              Escalation places the case in the Compliance Queue with priority SLA and alerts senior compliance officers.
            </p>
          </div>

          {/* Reason Dropdown */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Reason for Escalation</label>
            <select
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 font-medium focus:border-purple-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-100"
            >
              {escalationReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Compliance Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">
              Compliance Brief & Findings (Confidential)
            </label>
            <textarea
              rows={3}
              value={complianceNotes}
              onChange={(e) => setComplianceNotes(e.target.value)}
              placeholder="Detail specific observations, discrepancies, or investigative questions for the compliance specialist..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:border-purple-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-100 leading-relaxed"
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
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#5B21B6] disabled:opacity-40 transition cursor-pointer"
            >
              {submitting ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Users className="size-3.5" />
              )}
              <span>Escalate Case</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
