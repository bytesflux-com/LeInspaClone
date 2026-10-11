import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  User,
  ArrowRight,
  CheckSquare,
  Square,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

/**
 * QueueTable (ADM-030)
 * Dominant verification queue table in crisp light theme with row selection,
 * overdue pulse indicators, status badges, and pagination.
 */
export default function QueueTable({
  records = [],
  selectedRecordId,
  onSelectRecord,
  onStartReview,
  onBulkClaim,
  onBulkEscalate,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Handle Select All
  const isAllSelected =
    records.length > 0 && records.every((r) => selectedIds.has(r.id))
  const isSomeSelected =
    records.some((r) => selectedIds.has(r.id)) && !isAllSelected

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)))
    }
  }

  const toggleSelectOne = (id, e) => {
    e.stopPropagation()
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  // Pagination slice
  const totalPages = Math.ceil(records.length / pageSize) || 1
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return records.slice(start, start + pageSize)
  }, [records, currentPage, pageSize])

  // Status Pill Helper
  const renderStatusPill = (status) => {
    const s = String(status || '').toUpperCase()
    if (s === 'AWAITING_REVIEW' || s === 'NEW') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span>Awaiting Review</span>
        </span>
      )
    }
    if (s === 'UNDER_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
          <span className="size-1.5 rounded-full bg-purple-600 animate-pulse" />
          <span>Under Review</span>
        </span>
      )
    }
    if (s === 'RESUBMITTED') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          <span className="size-1.5 rounded-full bg-blue-600" />
          <span>Resubmitted</span>
        </span>
      )
    }
    if (s === 'CHANGES_REQUESTED') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
          <span className="size-1.5 rounded-full bg-orange-500" />
          <span>Changes Requested</span>
        </span>
      )
    }
    if (s === 'ESCALATED') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
          <span className="size-1.5 rounded-full bg-rose-600 animate-ping" />
          <span>Escalated</span>
        </span>
      )
    }
    if (s === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="size-3 text-emerald-600" />
          <span>Approved</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        {status}
      </span>
    )
  }

  // Priority Pill Helper
  const renderPriorityBadge = (priority) => {
    const p = String(priority || '').toUpperCase()
    if (p === 'URGENT') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
          <span className="size-1.5 rounded-full bg-rose-500" />
          <span>Urgent</span>
        </span>
      )
    }
    if (p === 'HIGH') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span>High</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
        <span className="size-1.5 rounded-full bg-purple-400" />
        <span>Normal</span>
      </span>
    )
  }

  // Action Button Text Helper
  const getActionLabel = (status) => {
    const s = String(status || '').toUpperCase()
    if (s === 'AWAITING_REVIEW' || s === 'NEW') return 'Review →'
    if (s === 'UNDER_REVIEW') return 'Continue →'
    return 'View →'
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      {/* BULK ACTION BAR (Conditional) */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between border-b border-purple-100 bg-[#F4F0FF] px-6 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-purple-900 font-semibold">
            <CheckSquare className="size-4 text-[#6D28D9]" />
            <span>
              {selectedIds.size} case{selectedIds.size > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onBulkClaim?.(Array.from(selectedIds))}
              className="rounded-lg bg-[#6D28D9] px-3 py-1 font-semibold text-white shadow-2xs hover:bg-[#5B21B6] transition"
            >
              Assign to Me
            </button>
            <button
              type="button"
              onClick={() => onBulkEscalate?.(Array.from(selectedIds))}
              className="rounded-lg border border-purple-200 bg-white px-3 py-1 font-semibold text-purple-800 hover:bg-purple-50 transition"
            >
              Escalate
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg px-2.5 py-1 text-slate-500 hover:text-slate-800 transition"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* DOMINANT TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="w-10 px-4 py-3 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {isAllSelected ? (
                    <CheckSquare className="size-4 text-[#6D28D9]" />
                  ) : (
                    <Square className="size-4 text-slate-300" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 min-w-[200px]">Provider</th>
              <th className="px-3 py-3 min-w-[130px]">Type</th>
              <th className="px-3 py-3 min-w-[110px]">Market</th>
              <th className="px-3 py-3 min-w-[150px]">Verification Type</th>
              <th className="px-3 py-3 min-w-[130px]">Submitted</th>
              <th className="px-3 py-3 min-w-[100px]">Waiting</th>
              <th className="px-3 py-3 min-w-[90px]">Priority</th>
              <th className="px-3 py-3 min-w-[130px]">Status</th>
              <th className="px-3 py-3 min-w-[110px]">Assigned To</th>
              <th className="px-4 py-3 text-right min-w-[90px]">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <AlertCircle className="mx-auto size-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No submissions found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting your search criteria or active status filters.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => {
                const isSelected = selectedRecordId === record.id
                const isChecked = selectedIds.has(record.id)

                return (
                  <tr
                    key={record.id}
                    onClick={() => onSelectRecord?.(record)}
                    className={`group cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-purple-50/70 border-l-4 border-l-[#6D28D9]'
                        : 'hover:bg-slate-50/90 border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-4 py-3 text-center"
                      onClick={(e) => toggleSelectOne(record.id, e)}
                    >
                      <button type="button" className="text-slate-400">
                        {isChecked ? (
                          <CheckSquare className="size-4 text-[#6D28D9]" />
                        ) : (
                          <Square className="size-4 text-slate-300 group-hover:text-slate-400" />
                        )}
                      </button>
                    </td>

                    {/* Provider */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-9 shrink-0 overflow-hidden rounded-xl border bg-slate-100 ${
                            isSelected
                              ? 'border-purple-600 ring-2 ring-purple-600/20'
                              : 'border-slate-200'
                          }`}
                        >
                          {record.avatarUrl ? (
                            <img
                              src={record.avatarUrl}
                              alt={record.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center bg-purple-100 text-purple-700 font-bold">
                              {record.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 group-hover:text-[#6D28D9] transition-colors truncate">
                            {record.name}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                            {record.providerId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Provider Type */}
                    <td className="px-3 py-3">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 truncate max-w-[140px]">
                        {record.type}
                      </span>
                    </td>

                    {/* Market */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="text-sm">{record.market?.flag}</span>
                        <span className="truncate">{record.market?.name}</span>
                      </div>
                    </td>

                    {/* Verification Type */}
                    <td className="px-3 py-3 text-slate-700">
                      <span className="truncate block font-medium">
                        {record.verificationType}
                      </span>
                    </td>

                    {/* Submitted Timestamp */}
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap text-[11px]">
                      {record.submittedAt}
                    </td>

                    {/* Waiting Duration */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {record.isOverdue ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 shadow-2xs">
                          <span className="relative flex size-2">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex size-2 rounded-full bg-rose-600" />
                          </span>
                          <span>{record.waitingFormatted || 'Overdue'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/90 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          <Clock className="size-3 text-slate-400" />
                          <span>{record.waitingFormatted || '1h 18m'}</span>
                        </span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {renderPriorityBadge(record.priority)}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {renderStatusPill(record.status)}
                    </td>

                    {/* Assigned To */}
                    <td className="px-3 py-3">
                      {record.assignedTo && record.assignedTo !== 'Unassigned' ? (
                        <div className="flex items-center gap-1 text-slate-800 font-medium truncate">
                          <User className="size-3 text-slate-400 shrink-0" />
                          <span className="truncate">{record.assignedTo}</span>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">Unassigned</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onStartReview) onStartReview(record)
                          else onSelectRecord?.(record)
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#6D28D9] hover:bg-purple-100 transition"
                      >
                        <span>{getActionLabel(record.status)}</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 bg-slate-50/70 px-6 py-3 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span>
            Showing{' '}
            <strong className="text-slate-800 font-semibold">
              {records.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800 font-semibold">
              {Math.min(currentPage * pageSize, records.length)}
            </strong>{' '}
            of{' '}
            <strong className="text-slate-800 font-semibold">
              {records.length}
            </strong>{' '}
            submissions
          </span>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-slate-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-700 shadow-2xs focus:outline-hidden"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Page Nav */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-100 transition shadow-2xs"
          >
            <ChevronLeft className="size-4" />
          </button>

          {Array.from({ length: totalPages }, (_, idx) => idx + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((page, i, arr) => {
              const prev = arr[i - 1]
              const showEllipsis = prev && page - prev > 1

              return (
                <div key={page} className="flex items-center">
                  {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`flex size-7 items-center justify-center rounded-lg font-semibold transition ${
                      currentPage === page
                        ? 'bg-[#6D28D9] text-white shadow-xs'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs'
                    }`}
                  >
                    {page}
                  </button>
                </div>
              )
            })}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-100 transition shadow-2xs"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
