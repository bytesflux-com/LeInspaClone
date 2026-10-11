import { useState } from 'react'
import { Check, AlertTriangle, X, FileText, MessageSquare } from 'lucide-react'

/**
 * ADM-031: VerificationChecklistCard
 * Verification rules engine checklist card with interactive status toggles and Notes button.
 */
export default function VerificationChecklistCard({
  checklist = [],
  onChecklistChange,
  onOpenNotes,
  notesCount = 0,
}) {
  const defaultItems = [
    { id: 'chk-1', key: 'documentReadable', label: 'Document readable', status: 'Pass', resultType: 'pass' },
    { id: 'chk-2', key: 'nameMatches', label: 'Name reasonably matches account', status: 'Needs review', resultType: 'review' },
    { id: 'chk-3', key: 'issuerProvided', label: 'Issuer provided', status: 'Pass', resultType: 'pass' },
    { id: 'chk-4', key: 'documentCurrent', label: 'Document current (not expired)', status: 'Pass', resultType: 'pass' },
    { id: 'chk-5', key: 'pagesIncluded', label: 'Required pages included', status: 'Pass', resultType: 'pass' },
    { id: 'chk-6', key: 'credentialAccepted', label: 'Credential type accepted', status: 'Pass', resultType: 'pass' },
    { id: 'chk-7', key: 'noTampering', label: 'No obvious tampering concern', status: 'Pass', resultType: 'pass' },
  ]

  const items = checklist.length > 0 ? checklist : defaultItems

  // Cycle status on click: Pass -> Needs review -> Fail -> Pass
  const cycleStatus = (key, currentStatus) => {
    let nextStatus = 'Pass'
    if (currentStatus === 'Pass') nextStatus = 'Needs review'
    else if (currentStatus === 'Needs review') nextStatus = 'Fail'
    else nextStatus = 'Pass'

    onChecklistChange?.(key, nextStatus)
  }

  const renderStatusButton = (item) => {
    const s = item.status || 'Pass'
    if (s === 'Pass') {
      return (
        <button
          type="button"
          onClick={() => cycleStatus(item.key, s)}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
          title="Click to cycle status"
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>Pass</span>
        </button>
      )
    }

    if (s === 'Needs review') {
      return (
        <button
          type="button"
          onClick={() => cycleStatus(item.key, s)}
          className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
          title="Click to cycle status"
        >
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span>Needs review</span>
        </button>
      )
    }

    return (
      <button
        type="button"
        onClick={() => cycleStatus(item.key, s)}
        className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer shadow-2xs"
        title="Click to cycle status"
      >
        <span className="size-1.5 rounded-full bg-rose-500" />
        <span>Fail</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="text-sm font-bold text-slate-900">Verification Checklist</h3>
        <span className="text-[11px] text-slate-400 font-medium">Compliance Standards</span>
      </div>

      {/* Checklist items list */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={item.key || idx}
            className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-slate-50/70 transition"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                  item.status === 'Pass'
                    ? 'bg-emerald-100 text-emerald-700'
                    : item.status === 'Needs review'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                }`}
              >
                {item.status === 'Pass' && <Check className="size-3 stroke-[2.5]" />}
                {item.status === 'Needs review' && <AlertTriangle className="size-2.5" />}
                {item.status === 'Fail' && <X className="size-3 stroke-[2.5]" />}
              </div>
              <span className="text-xs font-medium text-slate-800 leading-snug">
                {item.label}
              </span>
            </div>

            {renderStatusButton(item)}
          </div>
        ))}
      </div>

      {/* Bottom Notes Trigger */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenNotes}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-purple-700 transition shadow-2xs cursor-pointer"
        >
          <MessageSquare className="size-3.5 text-purple-600" />
          <span>📝 Notes</span>
          {notesCount > 0 && (
            <span className="ml-1 rounded-full bg-purple-100 px-1.5 py-0.2 text-[10px] font-bold text-purple-700">
              {notesCount}
            </span>
          )}
        </button>

        <span className="text-[11px] text-slate-400">Click item badge to change state</span>
      </div>
    </div>
  )
}
