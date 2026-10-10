import { CheckSquare2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

/**
 * ADM-033: CredentialChecklistCard
 * Checklist of credential review items with interactive toggle (Pass, Needs Review, Fail).
 */
export default function CredentialChecklistCard({
  checklist = [],
  onChecklistChange,
}) {
  const defaultItems = [
    { key: 'documentReadable', label: 'Document readable and clear', status: 'Pass', resultType: 'pass', description: 'Text, seals, and signatures are fully legible' },
    { key: 'pagesIncluded', label: 'Required pages included', status: 'Pass', resultType: 'pass', description: 'All certificate pages (1 & 2) submitted' },
    { key: 'nameCorresponds', label: 'Provider name corresponds', status: 'Needs review', resultType: 'review', description: 'Grace Njeri vs Grace W. Njeri (corresponds with National ID)' },
    { key: 'categoryMatches', label: 'Credential matches provider category', status: 'Pass', resultType: 'pass', description: 'Massage therapy qualification matches therapist profile' },
    { key: 'issuerProvided', label: 'Issuer information provided', status: 'Pass', resultType: 'pass', description: 'Kenya Massage Federation is a recognized professional body' },
    { key: 'issueDateValid', label: 'Issue date valid', status: 'Pass', resultType: 'pass', description: 'Issued 15 Jan 2024 within valid credential window' },
    { key: 'credentialCurrent', label: 'Credential current / not expired', status: 'Pass', resultType: 'pass', description: 'Expiry date 15 Jan 2028 is beyond statutory threshold' },
    { key: 'satisfiesRequirement', label: 'Satisfies configured requirement', status: 'Pass', resultType: 'pass', description: 'Fulfills Tier-1 platform qualification standards' },
    { key: 'noTampering', label: 'No issue requiring escalation', status: 'Pass', resultType: 'pass', description: 'Signatures, borders, and official seals intact' },
  ]

  const items = checklist.length > 0 ? checklist : defaultItems

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
            <h3 className="text-sm font-bold text-slate-900">Credential Review Checklist</h3>
            <p className="text-[11px] text-slate-400">Professional qualification criteria</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
          {passCount}/{items.length} Passed
        </span>
      </div>

      {/* Checklist Items */}
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
              title="Click to cycle status (Pass / Needs review / Fail)"
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

              {/* Status Pill */}
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
