import {
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'

export function BookingsTable({
  bookings = [],
  loading = false,
  selectedBooking,
  onSelectBooking,
  selectedIds = new Set(),
  onSelectAll,
  onToggleSelect,
  page = 1,
  onPageChange,
  pageSize = 5,
  onPageSizeChange,
  totalCount = 284,
  canSeeFinancial = true,
  onShowToast,
}) {
  const allSelected = bookings.length > 0 && bookings.every((b) => selectedIds.has(b.id))
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {/* Checkbox */}
              <th className="py-3 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="size-4 rounded border-slate-300 text-purple-700 focus:ring-purple-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-3 font-semibold">Booking</th>
              <th className="py-3 px-3 font-semibold">Client</th>
              <th className="py-3 px-3 font-semibold">Service</th>
              <th className="py-3 px-3 font-semibold">Date & Time</th>
              <th className="py-3 px-3 text-right font-semibold">Amount (KES)</th>
              <th className="py-3 px-3 text-center font-semibold">Payment</th>
              <th className="py-3 px-3 text-center font-semibold">Escrow</th>
              <th className="py-3 px-3 text-center font-semibold">Status</th>
              <th className="py-3 px-3 text-right pr-4 font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={10} className="py-4 px-4">
                    <div className="h-4 bg-slate-100 rounded-md w-full" />
                  </td>
                </tr>
              ))
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <HelpCircle className="size-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium text-slate-600">No bookings found</p>
                  <p className="text-[11px] text-slate-400">
                    Try adjusting your filters or search terms.
                  </p>
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const isSelected = selectedIds.has(b.id)
                const isDrawerOpen = selectedBooking?.id === b.id

                const isCompleted = (b.status || '').toLowerCase() === 'completed'
                const isConfirmed = (b.status || '').toLowerCase() === 'confirmed'
                const isCancelled = (b.status || '').toLowerCase() === 'cancelled'

                const escrow = (b.escrowStatus || '').toLowerCase()
                const isEscrowHeld = escrow === 'held'
                const isEscrowReleased = escrow === 'released'
                const isEscrowRefunded = escrow === 'refunded'
                const isEscrowDisputed = escrow === 'disputed'

                return (
                  <tr
                    key={b.id}
                    onClick={() => onSelectBooking?.(b)}
                    className={`group transition cursor-pointer ${
                      isDrawerOpen
                        ? 'bg-purple-50/70 border-l-4 border-l-purple-700'
                        : isSelected
                        ? 'bg-purple-50/40'
                        : 'hover:bg-slate-50/60'
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
                        onChange={() => onToggleSelect?.(b.id)}
                        className="size-4 rounded border-slate-300 text-purple-700 focus:ring-purple-500 cursor-pointer"
                      />
                    </td>

                    {/* Booking ID */}
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline">
                        {b.id?.startsWith('#') ? b.id : `#${b.id}`}
                      </span>
                    </td>

                    {/* Client (Avatar + Name) */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            b.clientAvatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'
                          }
                          alt={b.clientName}
                          className="size-7.5 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <span className="font-bold text-slate-900 group-hover:text-purple-800 transition truncate max-w-[140px]">
                          {b.clientName || 'Client'}
                        </span>
                      </div>
                    </td>

                    {/* Service & Duration */}
                    <td className="py-3 px-3">
                      <p className="font-medium text-slate-800 truncate max-w-[160px]">
                        {b.serviceName}
                      </p>
                      <p className="text-[10.5px] text-slate-400 font-mono">{b.duration || '60 min'}</p>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                      {b.dateTime || '12 Sep 2026 • 2:00 PM'}
                    </td>

                    {/* Amount (KES) */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {canSeeFinancial
                        ? typeof b.amount === 'number'
                          ? b.amount.toLocaleString()
                          : b.amount
                        : '—'}
                    </td>

                    {/* Payment Pill */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        <span>Paid</span>
                      </span>
                    </td>

                    {/* Escrow Pill */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold ${
                          isEscrowHeld
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : isEscrowReleased
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isEscrowRefunded
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            isEscrowHeld
                              ? 'bg-purple-600'
                              : isEscrowReleased
                              ? 'bg-emerald-500'
                              : isEscrowRefunded
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span>
                          {isEscrowHeld
                            ? 'Held'
                            : isEscrowReleased
                            ? 'Released'
                            : isEscrowRefunded
                            ? 'Refunded'
                            : 'Disputed'}
                        </span>
                      </span>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold ${
                          isConfirmed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isCancelled
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            <span>Completed</span>
                          </>
                        ) : isConfirmed ? (
                          <>
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            <span>Confirmed</span>
                          </>
                        ) : isCancelled ? (
                          <>
                            <XCircle className="size-3 text-rose-600" />
                            <span>Cancelled</span>
                          </>
                        ) : (
                          <span>{b.status}</span>
                        )}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-3 text-right pr-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectBooking?.(b)
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-semibold transition"
                      >
                        <span>View</span>
                        <ArrowRight className="size-3" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-800">
            {bookings.length > 0 ? (page - 1) * pageSize + 1 : 0}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-800">
            {Math.min(page * pageSize, totalCount)}
          </span>{' '}
          of <span className="font-semibold text-slate-800">{totalCount}</span> bookings
        </div>

        <div className="flex items-center gap-2">
          {/* Rows per page */}
          <div className="flex items-center gap-1.5 mr-2">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="p-1 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 text-slate-600 transition"
            >
              <ChevronLeft className="size-3.5" />
            </button>

            {[1, 2, 3, 4, 5].map((p) => {
              if (p > totalPages) return null
              const isCurr = page === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange?.(p)}
                  className={`size-7 rounded-lg text-xs font-semibold transition ${
                    isCurr
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {p}
                </button>
              )
            })}

            {totalPages > 5 && (
              <>
                <span className="px-1 text-slate-400">…</span>
                <button
                  type="button"
                  onClick={() => onPageChange?.(totalPages)}
                  className={`size-7 rounded-lg text-xs font-semibold ${
                    page === totalPages
                      ? 'bg-purple-700 text-white'
                      : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              className="p-1 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 text-slate-600 transition"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
