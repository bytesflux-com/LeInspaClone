import { useState } from 'react'
import {
  X,
  AlertTriangle,
  Flag,
  Send,
  ShieldAlert,
} from 'lucide-react'

/**
 * QueueEscalateModal (ADM-030)
 * Modal prompt to escalate a verification case to the Compliance Team with reason and notes.
 */
export default function QueueEscalateModal({
  isOpen,
  onClose,
  record,
  onSubmit,
}) {
  const [reason, setReason] = useState('Document discrepancy requiring legal or compliance verification')
  const [complianceNotes, setComplianceNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen || !record) return null

  const reasonsList = [
    'Document discrepancy requiring legal or compliance verification',
    'Suspected fraudulent or tampered documentation',
    'Unaccredited certification body or non-compliant authority',
    'Disputed property ownership or invalid cadastral parcel',
    'Identity mismatch / High risk profile flag',
    'Other complex compliance investigation',
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit?.({
        verificationId: record.id,
        reason,
        complianceNotes,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-rose-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <Flag className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Escalate Case to Compliance
              </h3>
              <p className="text-xs text-slate-500">
                {record.name} ({record.providerId})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
            <p>
              Escalating routes this verification case directly to the sovereign
              Compliance Team and tags it as <strong className="font-semibold text-rose-900">ESCALATED</strong>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Escalation Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:border-rose-500 focus:outline-hidden"
            >
              {reasonsList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Compliance Notes & Observations
            </label>
            <textarea
              rows={4}
              value={complianceNotes}
              onChange={(e) => setComplianceNotes(e.target.value)}
              placeholder="Detail the specific regulatory concerns, discrepancies observed, or required investigations..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 shadow-2xs focus:border-rose-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
            >
              <Send className="size-3.5" />
              <span>{submitting ? 'Escalating...' : 'Confirm Escalation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
