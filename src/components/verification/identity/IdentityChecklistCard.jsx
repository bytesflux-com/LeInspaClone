import { useState } from 'react'
import { CheckCircle2, AlertCircle, XCircle, CheckSquare2, HelpCircle } from 'lucide-react'

/**
 * ADM-032: IdentityChecklistCard
 * Checklist of statutory identity criteria with interactive status toggle (Pass, Needs Review, Fail).
 */
export default function IdentityChecklistCard({
  checklist = [],
  onChecklistChange,
}) {
  const defaultItems = [
    { key: 'documentTypeAccepted', label: 'Document type accepted', status: 'Pass', resultType: 'pass', description: 'Official Republic of Kenya National ID' },
    { key: 'documentComplete', label: 'Document appears complete', status: 'Pass', resultType: 'pass', description: 'Both front and back sides provided' },
    { key: 'isReadable', label: 'Document is readable', status: 'Pass', resultType: 'pass', description: 'High contrast text, coat of arms, and photo clear' },
    { key: 'nameMatches', label: 'Name matches / reasonably corresponds', status: 'Needs review', resultType: 'review', description: 'Middle name present on ID' },
    { key: 'requiredInfoPresent', label: 'Required information is present', status: 'Pass', resultType: 'pass', description: 'ID number, DOB, sex, and issuance authority verified' },
    { key: 'isCurrent', label: 'Document is current (not expired)', status: 'Pass', resultType: 'pass', description: 'Perpetual statutory validity under Kenyan Registration law' },
    { key: 'noTampering', label: 'No obvious tampering concern', status: 'Pass', resultType: 'pass', description: 'Guilloche security background pattern and ghost photo intact' },
  ]

  const items = checklist.length > 0 ? checklist : defaultItems

  // Cycle through statuses on click: Pass -> Needs review -> Fail -> Pass
  const handleToggle = (key, currentStatus) => {
    let next = 'Pass'
    if (currentStatus === 'Pass') next = 'Needs review'
    else if (currentStatus === 'Needs review') next = 'Fail'
    else if (currentStatus === 'Fail') next = 'Pass'
    onChecklistChange?.(key, next)
  }

  const passCount = items.filter((i) => i.status === 'Pass').length

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
            <CheckSquare2 className="size-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Verification Checklist</h3>
            <p className="text-[11px] text-slate-400">Statutory review standards</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
          {passCount}/{items.length} Passed
        </span>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item) => {
          const isPass = item.status === 'Pass'
          const isReview = item.status === 'Needs review'
          const isFail = item.status === 'Fail'

          return (
            <div
              key={item.key}
              onClick={() => handleToggle(item.key, item.status)}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-2.5 hover:bg-slate-50/80 transition cursor-pointer group"
              title="Click to change verification state (Pass / Needs Review / Fail)"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-800 group-hover:text-purple-900 transition">
                  {item.label}
                </p>
                {item.description && (
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Status pill */}
              <div className="shrink-0">
                {isPass && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    Pass
                  </span>
                )}
                {isReview && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    <AlertCircle className="size-3 text-amber-600" />
                    Needs review
                  </span>
                )}
                {isFail && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    <XCircle className="size-3 text-rose-600" />
                    Fail
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-slate-400 text-center pt-0.5">
        Click any row to cycle evaluation state (Pass &bull; Needs review &bull; Fail)
      </p>
    </div>
  )
}
