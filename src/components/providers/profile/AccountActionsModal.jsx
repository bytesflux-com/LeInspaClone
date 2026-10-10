import { useState } from 'react'
import { X, ShieldAlert, AlertTriangle, CheckCircle2, ShieldX, Send } from 'lucide-react'

export function AccountActionsModal({
  isOpen,
  profile,
  onClose,
  onSubmitStatus,
  onShowToast,
}) {
  const [targetStatus, setTargetStatus] = useState(profile?.status || 'active')
  const [restrictionReason, setRestrictionReason] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !profile) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmitStatus({
        status: targetStatus,
        restrictionReason: restrictionReason || 'Administrative update',
        adminNote,
      })
      onShowToast?.(`Account status updated to ${targetStatus}`)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Provider Account Actions
            </h3>
            <p className="text-xs text-slate-500">
              Target: <strong className="text-slate-800">{profile.name}</strong> ({profile.id})
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Account Standing
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetStatus('active')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  targetStatus === 'active'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span>Active</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetStatus('under_review')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  targetStatus === 'under_review'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="size-3.5 text-amber-600" />
                <span>Under Review</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetStatus('suspended')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  targetStatus === 'suspended'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ShieldX className="size-3.5 text-rose-600" />
                <span>Suspended</span>
              </button>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Action / Restriction Rationale (Audited)
            </label>
            <input
              type="text"
              value={restrictionReason}
              onChange={(e) => setRestrictionReason(e.target.value)}
              placeholder="e.g. Annual credential verification audit in progress"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-hidden"
              required={targetStatus !== 'active'}
            />
          </div>

          {/* Internal Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Admin Note (Optional)
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder="Record operational context for the internal compliance log..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
            >
              <Send className="size-3.5" />
              <span>{isSubmitting ? 'Updating...' : 'Apply Status Change'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

