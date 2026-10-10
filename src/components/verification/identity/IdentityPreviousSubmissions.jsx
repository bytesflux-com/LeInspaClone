import { useState } from 'react'
import {
  History,
  FileCheck2,
  FileX,
  ExternalLink,
  Shield,
  Layers,
  MessageSquare,
  Lock,
  X,
  ArrowRight,
} from 'lucide-react'

/**
 * ADM-032: IdentityPreviousSubmissions
 * Version history list, side-by-side version comparison modal,
 * internal private notes composer, and sensitive privacy banner.
 */
export default function IdentityPreviousSubmissions({
  submissions = [],
  internalNotes = [],
  onAddNote,
  onSelectVersion,
}) {
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)

  const defaultSubmissions = [
    {
      version: 2,
      isCurrent: true,
      submittedAt: '12 Sep 2026 • 10:42 AM',
      status: 'Under Review',
      statusType: 'under_review',
      fileName: 'National_ID_Front_and_Back_v2.pdf',
      reviewer: 'Jane Ochieng',
      notes: 'Resubmitted with clear high-resolution back side scan.',
    },
    {
      version: 1,
      isCurrent: false,
      submittedAt: '10 Sep 2026 • 9:15 AM',
      status: 'Changes Requested',
      statusType: 'changes_requested',
      fileName: 'National_ID_Scan_v1.pdf',
      reviewer: 'Jane Ochieng',
      notes: 'Back side unreadable due to blurriness and glare.',
    },
  ]

  const items = submissions.length > 0 ? submissions : defaultSubmissions

  const handleCreateNote = async (e) => {
    e.preventDefault()
    if (!noteText.trim()) return

    setIsSubmittingNote(true)
    try {
      await onAddNote?.(noteText.trim())
      setNoteText('')
    } finally {
      setIsSubmittingNote(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Previous Submissions Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
              <History className="size-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Previous Submissions</h3>
              <p className="text-[11px] text-slate-400">
                Document lifecycle and resubmission audit trail
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCompareModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs cursor-pointer"
          >
            <Layers className="size-3.5 text-purple-600" />
            <span>Compare Versions</span>
          </button>
        </div>

        {/* Submissions List */}
        <div className="space-y-2.5">
          {items.map((sub) => {
            const isCurrent = sub.isCurrent || sub.version === 2
            const isChangesReq = sub.statusType === 'changes_requested' || sub.status === 'Changes Requested'

            return (
              <div
                key={sub.version}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                  isCurrent
                    ? 'border-purple-200/80 bg-purple-50/20'
                    : 'border-slate-100 bg-slate-50/60'
                }`}
              >
                {/* Left Version Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      Version {sub.version} {isCurrent && '(Current)'}
                    </span>

                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                        <span className="size-1.5 rounded-full bg-purple-600" />
                        Under Review
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        Changes Requested
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    {sub.submittedAt} • <span className="font-mono text-slate-600">{sub.fileName}</span>
                  </p>

                  {sub.notes && (
                    <p className="text-[11px] text-slate-600 italic pt-0.5">
                      Reason: &quot;{sub.notes}&quot;
                    </p>
                  )}
                </div>

                {/* Right Action Button */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => onSelectVersion?.(sub)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
                  >
                    <span>View</span>
                    <ExternalLink className="size-3 text-slate-400" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. Internal Notes & Composer Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
              <MessageSquare className="size-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Internal Review Notes</h3>
              <p className="text-[11px] text-slate-400">
                Private notes for Lé Inspa admin team only (never exposed to provider)
              </p>
            </div>
          </div>

          <span className="text-[11px] font-medium text-slate-400">
            {internalNotes.length} {internalNotes.length === 1 ? 'Note' : 'Notes'}
          </span>
        </div>

        {/* Existing Notes List */}
        {internalNotes.length > 0 && (
          <div className="space-y-2.5">
            {internalNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800">
                    {note.authorName} <span className="text-slate-400 font-normal">({note.authorRole || 'Admin'})</span>
                  </span>
                  <span className="text-slate-400">{note.createdAt}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{note.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Note Composer Form */}
        <form onSubmit={handleCreateNote} className="space-y-3">
          <textarea
            rows={2}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add an internal note (not visible to provider)..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/40 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-100 transition resize-none"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Lock className="size-3 text-purple-600" />
              <span>Visible only to verified admin reviewers</span>
            </span>

            <button
              type="submit"
              disabled={isSubmittingNote || !noteText.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#5B21B6] disabled:opacity-40 transition cursor-pointer"
            >
              <span>Add Note</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Sensitive Information Banner */}
      <div className="rounded-2xl border border-purple-200/90 bg-purple-50/60 p-4 shadow-sm flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#6D28D9]">
          <Shield className="size-4.5 stroke-[2.2]" />
        </div>
        <div className="space-y-0.5 text-xs">
          <h4 className="font-bold text-purple-950">Sensitive Data Protection Active</h4>
          <p className="text-purple-800/80 leading-relaxed text-[11px]">
            Document numbers, dates of birth and other sensitive data are masked by default.
            Every reveal action is cryptographically signed, timestamped, and immutably recorded in the security audit ledger.
          </p>
        </div>
      </div>

      {/* 4. Compare Versions Modal */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="size-5 text-[#6D28D9]" />
                <h3 className="text-base font-bold text-slate-900">Compare Document Versions</h3>
              </div>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Version 1 */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Version 1 (Initial)</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    Changes Requested
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">Submitted: 10 Sep 2026 • 9:15 AM</p>
                <div className="rounded-lg bg-white p-2.5 border border-slate-200 text-[11px] space-y-1">
                  <p className="font-semibold text-rose-700">Defect Identified:</p>
                  <p className="text-slate-600">
                    Back side scan was blurred with severe optical glare. Machine Readable Zone (MRZ) could not be parsed by OCR.
                  </p>
                </div>
              </div>

              {/* Version 2 */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Version 2 (Current)</span>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                    Under Review
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">Submitted: 12 Sep 2026 • 10:42 AM</p>
                <div className="rounded-lg bg-white p-2.5 border border-slate-200 text-[11px] space-y-1">
                  <p className="font-semibold text-emerald-700">Correction Verified:</p>
                  <p className="text-slate-600">
                    High-resolution flatbed scan submitted. Both front and back sides readable. MRZ lines intact and verified.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="rounded-xl bg-[#6D28D9] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#5B21B6]"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
