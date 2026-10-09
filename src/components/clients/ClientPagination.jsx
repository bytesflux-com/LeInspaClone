import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { PAGE_SIZES } from '../../constants/clients'
import { formatNumber } from '../../lib/format'
import { cn } from '../../lib/utils'

function pageWindow(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, '…', total]
  if (page >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', page - 1, page, page + 1, '…', total]
}

const BTN = 'flex size-[30px] items-center justify-center rounded-md border text-[12.5px] font-medium transition'

export default function ClientPagination({ page, pageSize, total, totalPages, onPage, onPageSize }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3.5 text-[12.5px] text-[#2a1b57]">
      <p>
        Showing {formatNumber(from)}–{formatNumber(to)} of {formatNumber(total)} clients
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <nav className="flex items-center gap-1.5" aria-label="Pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            aria-label="Previous page"
            className={cn(BTN, 'border-[#ddd7ee] bg-white text-[#4527c8] hover:bg-[#f1edff] disabled:cursor-not-allowed disabled:opacity-40')}
          >
            <ChevronLeft className="size-4" />
          </button>
          {pageWindow(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="flex size-[30px] items-end justify-center pb-1.5 text-[#6b6785]">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p)}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  BTN,
                  p === page ? 'border-[#4527c8] bg-[#4527c8] text-white' : 'border-[#ddd7ee] bg-white text-[#2a1b57] hover:bg-[#f1edff]',
                  String(formatNumber(p)).length > 3 && 'w-auto min-w-[38px] px-2',
                )}
              >
                {formatNumber(p)}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            aria-label="Next page"
            className={cn(BTN, 'border-[#ddd7ee] bg-white text-[#4527c8] hover:bg-[#f1edff] disabled:cursor-not-allowed disabled:opacity-40')}
          >
            <ChevronRight className="size-4" />
          </button>
        </nav>

        <label className="flex items-center gap-2 text-[12px] text-[#2a1b57]">
          Rows per page
          <span className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
              className="h-[30px] appearance-none rounded-md border border-[#ddd7ee] bg-white pr-7 pl-2.5 text-[12.5px] font-medium text-[#2a1b57] focus:border-[#7a5cf0] focus:outline-none"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-[#4527c8]" />
          </span>
        </label>
      </div>
    </div>
  )
}
