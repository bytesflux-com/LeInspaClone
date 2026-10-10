import { useState } from 'react'
import { X, MessageSquare, Send, ShieldAlert, User, Clock } from 'lucide-react'

/**
 * ADM-031: InternalNotesModal
 * Reviewer private notes modal with history and real-time addition.
 */
export default function InternalNotesModal({
  isOpen,
  onClose,
  notes = [],
  onAddNote,
  providerName = 'Grace Njeri',
}) {
  const [newNoteText, setNewNoteText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newNoteText.trim()) return

    setSubmitting(true)
    try {
      await onAddNote?.(newNoteText.trim())
      setNewNoteText('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-purple-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-100 text-[#6D28D9]">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Internal Review Notes
              </h3>
              <p className="text-xs text-slate-500">
                Private reviewer remarks for {providerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Notice */}
        <div className="border-b border-purple-100 bg-purple-50/40 px-6 py-2.5 flex items-center gap-2 text-xs text-purple-900 font-medium">
          <ShieldAlert className="size-4 text-[#6D28D9] shrink-0" />
          <span>Internal only. These notes are never shown to the provider.</span>
        </div>

        {/* Notes List */}
        <div className="max-h-64 overflow-y-auto p-6 space-y-3.5 divide-y divide-slate-100">
          {notes.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs italic">
              No internal notes recorded yet. Add one below.
            </div>
          ) : (
            notes.map((n, i) => (
              <div key={n.id || i} className="pt-3 first:pt-0 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <User className="size-3 text-purple-600" />
                    <span>{n.authorName || 'Jane Ochieng'}</span>
                    {n.authorRole && (
                      <span className="text-[10px] font-normal text-slate-400">({n.authorRole})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="size-3" />
                    <span>{n.createdAt || '12 Sep 2026 • 11:22 AM'}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {n.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Note Composer */}
        <form onSubmit={handleSend} className="border-t border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            rows={3}
            placeholder="Type confidential note regarding this verification..."
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-purple-600 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 shadow-2xs resize-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting || !newNoteText.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5B21B6] disabled:opacity-50 transition shadow-xs"
            >
              <Send className="size-3.5" />
              <span>{submitting ? 'Saving...' : 'Add Note'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
