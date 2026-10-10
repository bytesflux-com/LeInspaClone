import { ChevronLeft, ChevronRight } from 'lucide-react'

export function DirectoryPagination({
  currentPage = 1,
  totalPages = 2486,
  totalItems = 24860,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
}) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const pages = [1, 2, 3, 4, 5]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-xs text-slate-500">
      <div>
        Showing{' '}
        <span className="font-semibold text-slate-800">
          {startItem}-{endItem}
        </span>{' '}
        of{' '}
        <span className="font-semibold text-slate-800">
          {Number(totalItems).toLocaleString()}
        </span>{' '}
        providers
      </div>

      <div className="flex items-center gap-3">
        {/* Page Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {pages.map((p) => {
            const isActive = currentPage === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            )
          })}

          <span className="px-1 text-slate-400">…</span>

          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            className={`px-2 h-7 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition`}
          >
            {Number(totalPages).toLocaleString()}
          </button>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rows Per Page */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="pl-2 pr-6 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer shadow-xs"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
  )
}

