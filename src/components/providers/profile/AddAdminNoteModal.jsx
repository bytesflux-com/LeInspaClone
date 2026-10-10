import { useState } from 'react'
import { X, SquarePen, Lock, Send, AlertCircle } from 'lucide-react'
import { useAdminSession } from '../../../hooks/useAdminSession'

export function AddAdminNoteModal({
  isOpen,
  providerId,
  providerName,
  onClose,
  onSubmitNote,
  onShowToast,
}) {
  const { admin } = useAdminSession()
  const [noteText, setNoteText] = useState('')
  const [team, setTeam] = useState('Verification Team')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!noteText.trim()) {
      setError('Please enter a note before submitting.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmitNote(noteText, team)
      onShowToast?.('Internal admin note saved')
      setNoteText('')
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to save note.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="size-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <SquarePen className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Add Internal Admin Note
            </h3>
            <p className="text-xs text-slate-500">
              Provider: <strong className="text-slate-800">{providerName}</strong> ({providerId})
            </p>
          </div>
        </div>

        {/* Security Alert Banner */}
        <div className="mt-4 p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
          <Lock className="size-4 text-purple-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Admin notes are internal-only operational logs. They will never appear on the
            provider’s profile or in client-facing communication.
          </p>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Team / Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Admin Department / Team
            </label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-purple-600 focus:outline-hidden"
            >
              <option value="Verification Team">Verification Team</option>
              <option value="Compliance & Safety Team">Compliance & Safety Team</option>
              <option value="Operations Team">Operations Team</option>
              <option value="Finance & Escrow Team">Finance & Escrow Team</option>
              <option value="Executive Escalations">Executive Escalations</option>
            </select>
          </div>

          {/* Note Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Note Text
            </label>
            <textarea
              value={noteText}
              onChange={(e) => {
                setNoteText(e.target.value)
                setError('')
              }}
              rows={4}
              placeholder="Record operational observations, credential check findings, or audit notes..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-purple-600 focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
            >
              <Send className="size-3.5" />
              <span>{isSubmitting ? 'Saving Note...' : 'Save Internal Note'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

