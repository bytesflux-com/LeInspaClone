import { ArrowLeftRight, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react'

/**
 * ADM-033: CredentialComparisonTable
 * Side-by-side reconciliation between Provider Profile record and submitted Credential.
 */
export default function CredentialComparisonTable({ comparisonRows = [] }) {
  const defaultRows = [
    {
      id: 'cmp-c1',
      field: 'Full Name',
      account: 'Grace Njeri',
      credential: 'Grace W. Njeri',
      result: 'Review',
      resultType: 'review',
      note: 'Middle initial difference corresponds to National ID',
    },
    {
      id: 'cmp-c2',
      field: 'Profession',
      account: 'Massage Therapist',
      credential: 'Massage Therapy',
      result: 'Consistent',
      resultType: 'consistent',
      note: 'Matches practice category',
    },
    {
      id: 'cmp-c3',
      field: 'Country of Practice',
      account: 'Kenya',
      credential: 'Kenya',
      result: 'Match',
      resultType: 'match',
      note: 'Sovereign jurisdiction verified',
    },
    {
      id: 'cmp-c4',
      field: 'Credential Type',
      account: 'Massage Therapy Qualification',
      credential: 'Professional Practice Certificate',
      result: 'Match',
      resultType: 'match',
      note: 'Meets Tier-1 qualification requirement',
    },
    {
      id: 'cmp-c5',
      field: 'Document Expiry',
      account: '—',
      credential: '15 Jan 2028',
      result: 'Current',
      resultType: 'match',
      note: 'Valid for 1 year 4 months',
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
            <h3 className="text-sm font-bold text-slate-900">Professional Information Comparison</h3>
            <p className="text-[11px] text-slate-400">
              Provider profile record vs. submitted credential particulars
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
          Profile vs. Credential
        </span>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-2.5 pr-4">Field</th>
              <th className="py-2.5 px-4">Provider Profile</th>
              <th className="py-2.5 px-4">Credential</th>
              <th className="py-2.5 pl-4 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const isMatch = row.resultType === 'match' || row.result === 'Match' || row.result === 'Current'
              const isConsistent = row.resultType === 'consistent' || row.result === 'Consistent'
              const isReview = row.resultType === 'review' || row.result === 'Review'

              return (
                <tr key={row.id || row.field} className="hover:bg-slate-50/60 transition group">
                  {/* Field */}
                  <td className="py-3 pr-4 font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>{row.field}</span>
                    {row.note && (
                      <span title={row.note} className="cursor-help text-slate-400 hover:text-slate-600">
                        <HelpCircle className="size-3" />
                      </span>
                    )}
                  </td>

                  {/* Profile */}
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    <span className="font-mono text-xs">{row.account}</span>
                  </td>

                  {/* Credential */}
                  <td className="py-3 px-4 text-slate-900 font-medium">
                    <span className="font-mono text-xs font-semibold">{row.credential}</span>
                    {isReview && row.note && (
                      <p className="text-[10px] text-amber-700 font-sans mt-0.5">{row.note}</p>
                    )}
                  </td>

                  {/* Result Badge */}
                  <td className="py-3 pl-4 text-right">
                    {isMatch ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                        {row.result}
                      </span>
                    ) : isConsistent ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                        Consistent
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
