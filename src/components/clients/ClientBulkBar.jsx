import { Download, Send, Tag } from 'lucide-react'

// Safe bulk actions only. Suspend / delete are deliberately not offered here.
export default function ClientBulkBar({ count, busy, onExport, onNotify, onTag, onClear }) {
  const btn =
    'inline-flex h-10 items-center gap-2 rounded-lg border-[1.5px] border-[#4527c8] bg-white px-4 text-[12.5px] font-semibold text-[#4527c8] transition hover:bg-[#f1edff] disabled:opacity-50'
  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e3dcf8] bg-[#f1edff] px-4 py-3"
    >
      <span className="flex min-w-7 items-center justify-center rounded-lg bg-[#4527c8] px-2 py-1 text-[12.5px] font-bold text-white">{count}</span>
      <span className="text-[13px] font-semibold text-[#2a1b57]">
        {count} {count === 1 ? 'client' : 'clients'} selected
      </span>

      <div className="ml-3 flex flex-wrap items-center gap-2.5">
        <button type="button" className={btn} onClick={onExport} disabled={busy}>
          <Download className="size-4" /> Export Selected
        </button>
        <button type="button" className={btn} onClick={onNotify}>
          <Send className="size-4" /> Send Notification
        </button>
        <button type="button" className={btn} onClick={onTag}>
          <Tag className="size-4" /> Add Internal Tag
        </button>
      </div>

      <button type="button" onClick={onClear} className="ml-auto text-[13px] font-semibold text-[#4527c8] hover:underline">
        Clear Selection
      </button>
    </div>
  )
}
