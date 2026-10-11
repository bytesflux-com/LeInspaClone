import { useState } from 'react'
import {
  X,
  FileEdit,
  Info,
  CheckSquare,
  Square,
  Send,
} from 'lucide-react'
import { CHANGE_REQUEST_REASONS } from '../../data/verificationSchema'

/**
 * ADM-029 Request Changes Modal
 * Clean, light-themed administrative dialog to request document corrections
 * with categorized reason checkboxes and customizable provider notification message.
 */
export default function RequestChangesModal({
  isOpen,
  onClose,
  record,
  onSubmit,
}) {
  const [selectedReasons, setSelectedReasons] = useState(['Document unclear'])
  const [customMessage, setCustomMessage] = useState(
    'Please upload a clearer image of your professional certificate. All details must be readable and uncropped.'
  )
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
      setError('Please select at least one reason for requesting changes.')
      return
    }
    if (!customMessage.trim()) {
      setError('Please provide instructions for the provider.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await onSubmit({
        verificationId: record.id,
        decision: 'REQUEST_CHANGES',
        reasons: selectedReasons,
        adminNotes: customMessage,
        requestedChanges: selectedReasons,
        expectedVersion: record.version,
      })
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to submit change request.')
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
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
              <FileEdit className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Request Changes from Provider
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

        {/* Informational Notice */}
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="leading-relaxed">
            The provider will be notified immediately via in-app alert and email. The verification status will transition to <strong>Changes Requested</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Reason Checkboxes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Reason Categories <span className="text-rose-500">*</span>
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {CHANGE_REQUEST_REASONS.map((reason) => {
                const checked = selectedReasons.includes(reason)
                return (
                  <button
                    type="button"
                    key={reason}
                    onClick={() => toggleReason(reason)}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition-colors ${
                      checked
                        ? 'border-amber-400 bg-amber-50/80 font-medium text-amber-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="size-4 shrink-0 text-amber-600" />
                    ) : (
                      <Square className="size-4 shrink-0 text-slate-400" />
                    )}
                    <span className="truncate">{reason}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Message to Provider <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Specify the exact issues and steps needed for approval..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            />
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50 transition"
            >
              <Send className="size-3.5" />
              <span>{submitting ? 'Sending Request...' : 'Send Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
