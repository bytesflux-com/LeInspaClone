import React from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Info,
  Scale,
} from 'lucide-react'

/**
 * ADM-034: BusinessComparisonTable
 * Side-by-side reconciliation between provider platform profile data
 * and verified document fields. Implements Trading Name vs Legal Entity Rule.
 */
export default function BusinessComparisonTable({
  comparisonRows = [],
}) {
  const getResultBadge = (resultType, resultText) => {
    switch (resultType) {
      case 'match':
      case 'pass':
      case 'consistent':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="size-3" />
            {resultText || 'Match'}
          </span>
        )
      case 'review':
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
            <AlertTriangle className="size-3" />
            {resultText || 'Review'}
          </span>
        )
      case 'mismatch':
      case 'fail':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
            <XCircle className="size-3" />
            {resultText || 'Mismatch'}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            {resultText || 'Review'}
          </span>
        )
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
            <Scale className="size-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Information Comparison & Statutory Reconciliation
          </h3>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Profile vs. Official Permit
        </span>
      </div>

      {/* Trading Name vs Legal Entity Operational Policy Callout */}
      <div className="rounded-xl border border-purple-200/80 bg-purple-50/50 p-3.5 flex items-start gap-3">
        <div className="size-6 rounded-full bg-purple-100 text-[#6D28D9] flex items-center justify-center shrink-0 mt-0.5">
          <Info className="size-3.5" />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-bold text-purple-950">
            Trading Name vs. Registered Corporate Entity Operational Policy
          </div>
          <p className="text-purple-900/80 leading-relaxed text-[11px]">
            Commercial facilities often operate under a consumer brand trading name (e.g. <span className="font-semibold">Serenity Wellness Spa</span>) that differs from the registered incorporation entity (<span className="font-semibold">Serenity Wellness Ltd.</span>). Under Lé Inspa compliance guidelines, this produces an <span className="font-bold">informational review status</span>, not an automatic rejection.
          </p>
        </div>
      </div>

      {/* Table Surface */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700 text-[11px]">
              <th className="px-3.5 py-2.5">Field</th>
              <th className="px-3.5 py-2.5">Platform Profile</th>
              <th className="px-3.5 py-2.5">Document Evidence</th>
              <th className="px-3.5 py-2.5">Result</th>
              <th className="px-3.5 py-2.5">Reconciliation Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {comparisonRows.map((row) => (
              <tr
                key={row.id || row.field}
                className={`hover:bg-slate-50/60 transition ${
                  row.resultType === 'review' ? 'bg-amber-50/20' : ''
                }`}
              >
                <td className="px-3.5 py-3 font-semibold text-slate-900 whitespace-nowrap">
                  {row.field}
                </td>
                <td className="px-3.5 py-3 font-medium text-slate-800">
                  {row.account}
                </td>
                <td className="px-3.5 py-3 font-semibold text-purple-900">
                  {row.document}
                </td>
                <td className="px-3.5 py-3 whitespace-nowrap">
                  {getResultBadge(row.resultType, row.result)}
                </td>
                <td className="px-3.5 py-3 text-slate-500 text-[11px] max-w-[280px]">
                  {row.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
