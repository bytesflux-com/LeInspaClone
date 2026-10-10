import { Link } from 'react-router'
import { ExternalLink, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react'

/**
 * ADM-031: InformationComparisonTable
 * Side-by-side reconciliation between account profile values and extracted document data.
 */
export default function InformationComparisonTable({
  comparisonData = [],
  providerId = 'PR-82941',
}) {
  const defaultData = [
    { field: 'Full Name', account: 'Grace Njeri', document: 'Grace W. Njeri', result: 'Review', resultType: 'review' },
    { field: 'Country', account: 'Kenya', document: 'Kenya', result: 'Match', resultType: 'match' },
    { field: 'Profession', account: 'Massage Therapist', document: 'Massage Therapy', result: 'Consistent', resultType: 'consistent' },
    { field: 'Document Status', account: '—', document: 'Valid', result: 'Valid', resultType: 'valid' },
    { field: 'Expiry Date', account: '—', document: '15 Jan 2028', result: 'Valid', resultType: 'valid' },
  ]

  const rows = comparisonData.length > 0 ? comparisonData : defaultData

  const renderResultBadge = (result, type) => {
    const norm = (type || result || '').toLowerCase()

    if (norm.includes('match') || norm.includes('valid') || norm.includes('consistent') || norm.includes('pass')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>{result}</span>
        </span>
      )
    }

    if (norm.includes('review') || norm.includes('needs')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span>{result}</span>
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
        <span className="size-1.5 rounded-full bg-rose-500" />
        <span>{result}</span>
      </span>
    )
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h3 className="text-sm font-bold text-slate-900">Information Comparison</h3>
        <Link
          to={`/providers/${providerId}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#6D28D9] hover:underline"
        >
          <span>View Full Profile</span>
          <ExternalLink className="size-3" />
        </Link>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
            <tr>
              <th className="py-2 pr-2">Field</th>
              <th className="py-2 px-2">Account</th>
              <th className="py-2 px-2">Document</th>
              <th className="py-2 pl-2 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 text-slate-700">
            {rows.map((row, idx) => (
              <tr key={row.field || idx} className="hover:bg-slate-50/50 transition">
                <td className="py-2.5 pr-2 font-medium text-slate-900 whitespace-nowrap">
                  {row.field}
                </td>
                <td className="py-2.5 px-2 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                  {row.account}
                </td>
                <td className="py-2.5 px-2 text-slate-900 font-mono text-[11px] font-semibold whitespace-nowrap">
                  {row.document}
                </td>
                <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                  {renderResultBadge(row.result, row.resultType)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
