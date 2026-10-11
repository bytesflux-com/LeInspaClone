import { useState } from 'react'
import {
  X,
  UserPlus,
  CheckCircle2,
} from 'lucide-react'

const AVAILABLE_REVIEWERS = [
  { uid: 'adm-001', name: 'Jane Ochieng', role: 'Senior Verification Officer', market: 'Kenya 🇰🇪' },
  { uid: 'adm-002', name: 'Peter Mwangi', role: 'Verification Officer', market: 'Uganda 🇺🇬' },
  { uid: 'adm-003', name: 'Mary Akinyi', role: 'Verification Officer', market: 'South Africa 🇿🇦' },
  { uid: 'adm-004', name: 'John Kamau', role: 'Compliance Specialist', market: 'Tanzania 🇹🇿' },
  { uid: 'adm-005', name: 'Compliance Team', role: 'Escalations Group', market: 'Cross-Market 🌍' },
]

/**
 * ADM-029 Assign Reviewer Modal
 * Clean, light-themed dialog for supervisors to assign or transfer
 * verification queue records to specific officers or escalation groups.
 */
export default function AssignReviewerModal({
  isOpen,
  onClose,
  record,
  onSubmit,
}) {
  const [selectedReviewer, setSelectedReviewer] = useState(
    AVAILABLE_REVIEWERS[0]
  )
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !record) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedReviewer) {
      setError('Please select a reviewer.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await onSubmit({
        verificationId: record.id,
        assignToUid: selectedReviewer.uid,
        assignToName: selectedReviewer.name,
        note,
      })
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to assign reviewer.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Assign Reviewer
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Reviewer Selection List */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Select Officer or Team
            </label>
            <div className="mt-2 space-y-2">
              {AVAILABLE_REVIEWERS.map((rev) => {
                const isSelected = selectedReviewer?.uid === rev.uid
                return (
                  <button
                    type="button"
                    key={rev.uid}
                    onClick={() => setSelectedReviewer(rev)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/70'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {rev.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {rev.role} • {rev.market}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="size-4.5 text-purple-600" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Internal Handover Note */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Assignment Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Please expedite prior to Monday launch..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-800 disabled:opacity-50 transition"
            >
              <span>{submitting ? 'Assigning...' : 'Assign Reviewer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
