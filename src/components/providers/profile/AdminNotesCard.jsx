import { SquarePen, Lock, Plus, MessageSquare } from 'lucide-react'

export function AdminNotesCard({
  profile,
  onOpenAddNote,
}) {
  if (!profile) return null

  const notes = profile.internalNotes || []

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <MessageSquare className="size-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-slate-900 text-sm">
                Admin Notes (Internal)
              </h3>
              <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                <Lock className="size-2.5" /> Confidential
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAddNote}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 px-2.5 py-1 rounded-md transition border border-purple-200"
          >
            <Plus className="size-3" /> Add Note
          </button>
        </div>

        {/* Notes Feed */}
        <div className="mt-3 space-y-2.5 max-h-48 overflow-y-auto pr-1">
          {notes.length === 0 ? (
            <div className="py-4 text-center text-slate-400 text-xs">
              No internal notes recorded yet.
            </div>
          ) : (
            notes.map((n, i) => (
              <div
                key={n.id || i}
                className="p-3 rounded-xl bg-purple-50/40 border border-purple-100 text-xs space-y-1.5"
              >
                <p className="text-slate-800 leading-relaxed text-[11.5px]">
                  "{n.text || n.note}"
                </p>
                <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-1 border-t border-purple-100/60 font-medium">
                  <span>
                    {n.author || 'Admin'} • {n.team || 'Verification Team'}
                  </span>
                  <span>{n.date || '10 Sep 2026'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Security notice at bottom */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <p className="text-[10px] text-slate-400 text-center">
          Internal record only. Never exposed on provider's public profile.
        </p>
      </div>
    </div>
  )
}

