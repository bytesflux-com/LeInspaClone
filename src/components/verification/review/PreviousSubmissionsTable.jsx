import { History, Eye, FileText, CheckCircle, RotateCcw } from 'lucide-react'

/**
 * ADM-031: PreviousSubmissionsTable
 * Table listing version history of previous document submissions.
 */
export default function PreviousSubmissionsTable({
  submissions = [],
  onSelectSubmission,
}) {
  const defaultSubmissions = [
    {
      num: 1,
      submittedAt: '12 Sep 2026 10:42 AM',
      fileName: 'Professional_Certificate.pdf',
      status: 'Current',
      statusType: 'current',
      reviewedBy: '—',
      notes: '—',
      docId: 'doc-101',
    },
    {
      num: 2,
      submittedAt: '10 Sep 2026 9:15 AM',
      fileName: 'Certificate_v1.pdf',
      status: 'Replaced',
      statusType: 'replaced',
      reviewedBy: 'Jane Ochieng',
      notes: 'Document unclear',
      docId: 'doc-101-v1',
    },
  ]

  const list = submissions.length > 0 ? submissions : defaultSubmissions

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <History className="size-4 text-purple-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Previous Submissions
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {list.length} versions recorded
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500">
            <tr>
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Submitted</th>
              <th className="px-3 py-2.5">File Name</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Reviewed By</th>
              <th className="px-3 py-2.5">Notes</th>
              <th className="px-3 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {list.map((row, idx) => (
              <tr key={row.docId || idx} className="hover:bg-slate-50/70 transition">
                <td className="px-3 py-2.5 font-semibold text-slate-900">{row.num || idx + 1}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{row.submittedAt}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5 font-medium text-slate-900 max-w-[140px] truncate" title={row.fileName}>
                    <FileText className="size-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{row.fileName}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {row.statusType === 'current' || row.status === 'Current' ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                      <span className="size-1.5 rounded-full bg-purple-600" />
                      <span>Current</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                      <span className="size-1.5 rounded-full bg-rose-600" />
                      <span>Replaced</span>
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{row.reviewedBy || '—'}</td>
                <td className="px-3 py-2.5 text-slate-500 italic max-w-[120px] truncate" title={row.notes}>
                  {row.notes || '—'}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onSelectSubmission?.(row)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-50 transition shadow-2xs"
                  >
                    <Eye className="size-3" />
                    <span>View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
