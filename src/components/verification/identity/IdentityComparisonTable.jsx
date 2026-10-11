import { CheckCircle2, AlertCircle, ArrowLeftRight, HelpCircle } from 'lucide-react'

/**
 * ADM-032: IdentityComparisonTable
 * Side-by-side reconciliation between Lé Inspa Account data and Identity Document details.
 */
export default function IdentityComparisonTable({
  comparisonRows = [],
  isNumberRevealed = false,
  isDobRevealed = false,
}) {
  const defaultRows = [
    {
      id: 'cmp-1',
      field: 'Full Name',
      account: 'Grace Njeri',
      document: 'Grace Wanjiku Njeri',
      result: 'Review',
      resultType: 'review',
      note: 'Name variation / middle name present on ID',
    },
    {
      id: 'cmp-2',
      field: 'Country',
      account: 'Kenya',
      document: 'Kenya',
      result: 'Match',
      resultType: 'match',
      note: 'Operating market confirmed',
    },
    {
      id: 'cmp-3',
      field: 'Date of Birth',
      account: isDobRevealed ? '14 Mar 1998' : '••/••/1998',
      document: isDobRevealed ? '14 Mar 1998' : '••/••/1998',
      result: 'Match',
      resultType: 'match',
      note: 'Legal majority verified (28y)',
    },
    {
      id: 'cmp-4',
      field: 'Document Type',
      account: 'National ID',
      document: 'National ID',
      result: 'Match',
      resultType: 'match',
      note: 'Recognized official Kenyan ID',
    },
    {
      id: 'cmp-5',
      field: 'Document Number',
      account: isNumberRevealed ? '1234 5678 4821' : '•••• •••• 4821',
      document: isNumberRevealed ? '1234 5678 4821' : '•••• •••• 4821',
      result: 'Match',
      resultType: 'match',
      note: 'National Registration Bureau format',
    },
  ]

  const rows = comparisonRows.length > 0 ? comparisonRows : defaultRows

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
            <ArrowLeftRight className="size-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Information Comparison</h3>
            <p className="text-[11px] text-slate-400">
              Cross-verifying profile record against official document credentials
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
          5 Fields Cross-checked
        </span>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-2.5 pr-4">Field</th>
              <th className="py-2.5 px-4">Lé Inspa Account</th>
              <th className="py-2.5 px-4">Identity Document</th>
              <th className="py-2.5 pl-4 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const isMatch = row.resultType === 'match' || row.result === 'Match'
              const isReview = row.resultType === 'review' || row.result === 'Review'

              // Determine display values for sensitive fields
              let accountVal = row.account
              let documentVal = row.document

              if (row.field === 'Document Number') {
                accountVal = isNumberRevealed ? row.accountPlain || '1234 5678 4821' : '•••• •••• 4821'
                documentVal = isNumberRevealed ? row.documentPlain || '1234 5678 4821' : '•••• •••• 4821'
              } else if (row.field === 'Date of Birth') {
                accountVal = isDobRevealed ? row.accountPlain || '14 Mar 1998' : '••/••/1998'
                documentVal = isDobRevealed ? row.documentPlain || '14 Mar 1998' : '14 Mar 1998'
              }

              return (
                <tr key={row.id || row.field} className="hover:bg-slate-50/60 transition group">
                  {/* Field Name */}
                  <td className="py-3 pr-4 font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>{row.field}</span>
                    {row.note && (
                      <span title={row.note} className="cursor-help text-slate-400 hover:text-slate-600">
                        <HelpCircle className="size-3" />
                      </span>
                    )}
                  </td>

                  {/* Lé Inspa Account Record */}
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    <span className="font-mono text-xs">{accountVal}</span>
                  </td>

                  {/* Identity Document */}
                  <td className="py-3 px-4 text-slate-900 font-medium">
                    <span className="font-mono text-xs font-semibold">{documentVal}</span>
                    {isReview && row.note && (
                      <p className="text-[10px] text-amber-700 font-sans mt-0.5">{row.note}</p>
                    )}
                  </td>

                  {/* Result Status Badge */}
                  <td className="py-3 pl-4 text-right">
                    {isMatch ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                        Match
                      </span>
                    ) : isReview ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                        <AlertCircle className="size-3 text-amber-600" />
                        Review
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                        Mismatch
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
