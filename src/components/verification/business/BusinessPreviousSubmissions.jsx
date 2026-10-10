import React, { useState } from 'react'
import {
  History,
  Layers,
  ExternalLink,
  MessageSquare,
  Lock,
  Shield,
  X,
  Send,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

/**
 * ADM-034: BusinessPreviousSubmissions
 * Business document version history, side-by-side version comparison modal,
 * and internal administrative private notes composer.
 */
export default function BusinessPreviousSubmissions({
  submissions = [],
  internalNotes = [],
  onAddNote,
  onSelectVersion,
}) {
  const [compareOpen, setCompareOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [submittingNote, setSubmittingNote] = useState(false)

  const defaultSubmissions = [
    {
      version: 2,
      isCurrent: true,
      submittedAt: '11 Sep 2026 • 3:18 PM',
      fileName: 'Nairobi_County_Operating_Licence_2025.pdf',
      status: 'Under Review',
      statusType: 'under_review',
      reviewer: 'Jane Ochieng',
      notes: 'Resubmitted with current 2025/2026 calendar year Single Business Permit and paid county receipt.',
    },
    {
      version: 1,
      isCurrent: false,
      submittedAt: '05 Sep 2026 • 11:20 AM',
      fileName: 'County_Permit_2024_Expired.pdf',
      status: 'Changes Requested',
      statusType: 'changes_requested',
      reviewer: 'Jane Ochieng',
      notes: 'Submitted permit expired on 31 Dec 2024. Current calendar year single business permit required.',
    },
  ]

  const items = submissions.length > 0 ? submissions : defaultSubmissions

  const handleCreateNote = async (e) => {
    e.preventDefault()
    if (!noteText.trim()) return

    setSubmittingNote(true)
    try {
      await onAddNote?.(noteText.trim())
      setNoteText('')
    } finally {
      setSubmittingNote(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Submissions History Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
              <History className="size-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Document Submission History</h3>
              <p className="text-[11px] text-slate-400">
                Statutory permit lifecycle, renewals, and corrections
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <Layers className="size-3.5 text-purple-600" />
            <span>Compare Versions</span>
          </button>
        </div>

        {/* List */}
        <div className="space-y-2.5">
          {items.map((sub) => {
            const isCurrent = sub.isCurrent || sub.version === 2

            return (
              <div
                key={sub.version}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                  isCurrent
                    ? 'border-purple-200/80 bg-purple-50/20'
                    : 'border-slate-100 bg-slate-50/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      Version {sub.version} {isCurrent && '(Current)'}
                    </span>

                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-[#6D28D9]">
                        <span className="size-1.5 rounded-full bg-[#6D28D9]" />
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

      {/* 2. Compare Versions Modal */}
      {compareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
                  <Layers className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Side-by-Side Version Diff</h3>
                  <p className="text-xs text-slate-500">
                    Comparing Version 1 (Replaced) vs Version 2 (Current)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCompareOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Version 1 (Expired) */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-900">Version 1 (Initial Filing)</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    Expired Year
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div><span className="font-semibold">Licence Period:</span> 01 Jan 2024 – 31 Dec 2024</div>
                  <div><span className="font-semibold">Issue Status:</span> <span className="text-rose-600 font-bold">Lapsed / Expired</span></div>
                  <div><span className="font-semibold">Sanitation Stamp:</span> Missing 2025 Inspection Endorsement</div>
                  <div><span className="font-semibold">File:</span> County_Permit_2024_Expired.pdf</div>
                </div>
                <div className="rounded-lg bg-amber-100/70 p-2 text-[11px] text-amber-900 italic">
                  Reviewer note: &quot;Provider uploaded previous year permit. Requested 2025/2026 renewal.&quot;
                </div>
              </div>

              {/* Version 2 (Current) */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-900">Version 2 (Current Submission)</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Current & Active
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div><span className="font-semibold">Licence Period:</span> 01 Jan 2025 – 31 Dec 2025</div>
                  <div><span className="font-semibold">Issue Status:</span> <span className="text-emerald-700 font-bold">Active & Paid (6 mos remaining)</span></div>
                  <div><span className="font-semibold">Sanitation Stamp:</span> 2025/2026 Public Health Class A Seal</div>
                  <div><span className="font-semibold">File:</span> Nairobi_County_Operating_Licence_2025.pdf</div>
                </div>
                <div className="rounded-lg bg-emerald-100/70 p-2 text-[11px] text-emerald-900 font-medium">
                  Verified: Correct current municipal permit and verified bank revenue payment code.
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCompareOpen(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Internal Administrative Notes Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
              <Lock className="size-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Private Internal Administrative Notes</h3>
              <p className="text-[11px] text-slate-400">
                Staff-only audit commentary • Invisible to provider
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            <Shield className="size-3" />
            Confidential
          </span>
        </div>

        {/* Existing Notes List */}
        <div className="space-y-2.5">
          {internalNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">{note.authorName}</span>
                <span className="text-[11px] text-slate-400">{note.createdAt}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {note.text}
              </p>
            </div>
          ))}
        </div>

        {/* Add Note Composer */}
        <form onSubmit={handleCreateNote} className="space-y-2 pt-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add internal staff note regarding business registration, tax compliance, or corporate standing..."
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-[#6D28D9] focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingNote || !noteText.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#5B21B6] transition disabled:opacity-50 cursor-pointer"
            >
              {submittingNote ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              <span>Post Internal Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
