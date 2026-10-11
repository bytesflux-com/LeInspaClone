import { useState } from 'react'
import {
  X,
  AlertOctagon,
  ShieldAlert,
  CheckSquare,
  Square,
} from 'lucide-react'
import { REJECTION_REASONS } from '../../data/verificationSchema'

/**
 * ADM-029 Reject Verification Modal
 * Clean, light-themed rejection dialog with compliance audit checks,
 * mandatory rationale documentation, and senior sign-off confirmation.
 */
export default function RejectVerificationModal({
  isOpen,
  onClose,
  record,
  onSubmit,
}) {
  const [selectedReasons, setSelectedReasons] = useState([
    'Identity mismatch failure',
  ])
  const [adminNote, setAdminNote] = useState('')
  const [seniorSignoff, setSeniorSignoff] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !record) return null

  const toggleReason = (reason) => {
    if (selectedReasons.includes(reason)) {
      setSelectedReasons(selectedReasons.filter((r) => r !== reason))
    } else {
      setSelectedReasons([...selectedReasons, reason])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedReasons.length === 0) {
      setError('Please select at least one statutory or regulatory rejection reason.')
      return
    }
    if (!adminNote.trim() || adminNote.trim().length < 10) {
      setError('Supporting administrative note must be at least 10 characters long.')
      return
    }
    if (!seniorSignoff) {
      setError('You must confirm compliance sign-off prior to submitting a rejection.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await onSubmit({
        verificationId: record.id,
        decision: 'REJECT',
        reasons: selectedReasons,
        adminNotes: adminNote,
        expectedVersion: record.version,
      })
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to submit rejection.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Reject Verification Application
              </h3>
              <p className="text-xs text-slate-500">
                {record.name} ({record.providerId})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-900">
          <AlertOctagon className="mt-0.5 size-4 shrink-0 text-rose-600" />
          <p className="leading-relaxed">
            Rejecting verification will mark this submission as <strong>Rejected</strong> and write an immutable record to the compliance audit log. The provider profile status remains separate.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Rejection Reasons */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Regulatory Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <div className="mt-2 space-y-1.5">
              {REJECTION_REASONS.map((reason) => {
                const checked = selectedReasons.includes(reason)
                return (
                  <button
                    type="button"
                    key={reason}
                    onClick={() => toggleReason(reason)}
                    className={`flex w-full items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition-colors ${
                      checked
                        ? 'border-rose-400 bg-rose-50/80 font-medium text-rose-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="size-4 shrink-0 text-rose-600" />
                    ) : (
                      <Square className="size-4 shrink-0 text-slate-400" />
                    )}
                    <span>{reason}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Supporting Admin Note */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Supporting Compliance Note <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Detail the exact finding, regulatory clause, or OCR discrepancy (minimum 10 characters)..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          {/* Senior Sign-off Checkbox */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={seniorSignoff}
                onChange={(e) => setSeniorSignoff(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="font-medium text-slate-800">
                I confirm this case has undergone compliance review and that all evidence meets platform statutory standards.
              </span>
            </label>
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600">
              {error}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition"
            >
              <span>{submitting ? 'Confirming...' : 'Confirm Rejection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
