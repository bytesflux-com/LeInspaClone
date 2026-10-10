import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

export function ServicesTable({
  services = [],
  selectedIds,
  onSelectAll,
  onToggleSelect,
  onSelectService,
  selectedServiceId,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
}) {
  const allSelected = services.length > 0 && services.every((s) => selectedIds.has(s.id))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col">
      {/* Table Body Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Header */}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="size-4 rounded border-slate-300 text-purple-700 focus:ring-purple-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-3 min-w-[220px]">Service</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3 text-center">Duration</th>
              <th className="py-3 px-3 text-right">Price (KES)</th>
              <th className="py-3 px-3 text-center">Availability</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-center">Review</th>
              <th className="py-3 px-3 text-right pr-4">Action</th>
            </tr>
          </thead>

          {/* Body Rows */}
          <tbody className="divide-y divide-slate-100">
            {services.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                  No services matching the active filter criteria.
                </td>
              </tr>
            ) : (
              services.map((srv) => {
                const isSelected = selectedIds.has(srv.id)
                const isRowActive = selectedServiceId === srv.id || selectedServiceId === srv.serviceId
                const isPending =
                  srv.approvalStatus === 'pending_review' ||
                  srv.reviewStatus === 'pending_review' ||
                  srv.hasPendingChanges
                const isChangesRequested =
                  srv.approvalStatus === 'changes_requested' ||
                  srv.reviewStatus === 'changes_pending'

                return (
                  <tr
                    key={srv.id}
                    onClick={() => onSelectService(srv)}
                    className={`group hover:bg-purple-50/40 cursor-pointer transition ${
                      isRowActive ? 'bg-purple-50/70' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-3 px-3.5 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect?.(srv.id)}
                        className="size-4 rounded border-slate-300 text-purple-700 focus:ring-purple-500 cursor-pointer"
                      />
                    </td>

                    {/* Service Name & ID */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            srv.image ||
                            'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=120'
                          }
                          alt={srv.name}
                          className="size-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 group-hover:text-purple-700 transition truncate text-xs sm:text-[13px]">
                            {srv.name}
                          </p>
                          <p className="font-mono text-[10.5px] text-slate-400 mt-0.5">
                            {srv.serviceId || srv.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 font-medium text-slate-600">
                      {srv.category || 'Massage'}
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-3 text-center text-slate-500 font-mono">
                      {srv.duration || `${srv.durationMinutes || 60} min`}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono text-[13px]">
                      {typeof srv.price === 'string'
                        ? srv.price.replace('KES ', '')
                        : srv.price?.toLocaleString()}
                    </td>

                    {/* Availability */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          srv.availability === 'Available' || srv.availabilityCode === 'available'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : srv.availability === 'Limited' || srv.availabilityCode === 'limited'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            srv.availability === 'Available' || srv.availabilityCode === 'available'
                              ? 'bg-emerald-500'
                              : srv.availability === 'Limited' || srv.availabilityCode === 'limited'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span>{srv.availability || 'Available'}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          srv.active || srv.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            srv.active || srv.status === 'active'
                              ? 'bg-emerald-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span>{srv.active || srv.status === 'active' ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>

                    {/* Review / Approval */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isChangesRequested
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : isPending
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isChangesRequested ? (
                          <>
                            <AlertCircle className="size-3 text-amber-600" />
                            <span>Changes Pending</span>
                          </>
                        ) : isPending ? (
                          <>
                            <Clock className="size-3 text-amber-600" />
                            <span>Pending Review</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            <span>Approved</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right pr-4">
                      {isPending || isChangesRequested ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectService(srv)
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-semibold shadow-xs transition"
                        >
                          <span>Review</span>
                          <ArrowRight className="size-3" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectService(srv)
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-semibold transition"
                        >
                          <span>View</span>
                          <ArrowRight className="size-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Matching Screenshot */}
      <div className="p-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-white">
        <span className="text-slate-500 font-medium">
          Showing 1-{services.length} of {services.length} services
        </span>

        {/* Page buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
            className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            className="size-7 rounded-lg bg-purple-700 text-white font-bold text-xs flex items-center justify-center shadow-xs"
          >
            {page}
          </button>
          <button
            type="button"
            disabled={true}
            onClick={() => onPageChange?.(page + 1)}
            className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Rows per page */}
        <div className="flex items-center gap-2 text-slate-500">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white p-1 text-xs text-slate-700 font-medium"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  )
}

