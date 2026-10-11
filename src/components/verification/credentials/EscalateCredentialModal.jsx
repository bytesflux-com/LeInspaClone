import { useState } from 'react'
import { X, Users, ShieldCheck } from 'lucide-react'

/**
 * ADM-033: EscalateCredentialModal
 * Dialog to escalate a credential review to Senior Compliance or Clinical Standards.
 */
export default function EscalateCredentialModal({
  isOpen,
  onClose,
  credentialTitle = 'Professional Practice Certificate',
  providerName = 'Grace Njeri',
  onSubmit,
}) {
  const [escalationReason, setEscalationReason] = useState('Foreign qualification requiring sovereign equivalency evaluation')
  const [complianceNotes, setComplianceNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const escalationReasons = [
    'Foreign qualification requiring sovereign equivalency evaluation',
    'Suspected unaccredited institution or diploma mill certificate',
    'Discrepant registration records in sovereign council directory',
    'Complex scope-of-practice specialization boundary interpretation',
    'Name variation requiring legal affidavit review by compliance',
    'Senior medical / clinical director consultation requested',
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit?.({
        decision: 'ESCALATE',
        reason: escalationReason,
        complianceNotes: complianceNotes.trim(),
        internalNote: `Credential escalated: ${escalationReason}. Notes: ${complianceNotes.trim()}`,
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
              <h3 className="text-base font-bold text-slate-900">Escalate Credential Review</h3>
              <p className="text-xs text-slate-500">
                Route {credentialTitle} for {providerName} to Senior Compliance
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
          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 text-purple-900 text-xs flex items-start gap-2">
            <ShieldCheck className="size-4 shrink-0 text-purple-600 mt-0.5" />
            <p>
              Escalating places this credential under priority review by Clinical Standards and alerts senior officers.
            </p>
          </div>

          {/* Reason */}
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

          {/* Compliance Brief */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">
              Compliance Brief & Findings (Confidential)
            </label>
            <textarea
              rows={3}
              value={complianceNotes}
              onChange={(e) => setComplianceNotes(e.target.value)}
              placeholder="State observations, registry queries, or specific institutional accreditation questions..."
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
              <span>Escalate Credential</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
