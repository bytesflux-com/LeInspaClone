import { CheckSquare, Download, Bell, UserPlus, Tag, X } from 'lucide-react'

export function BulkActionsBar({
  selectedCount = 0,
  onClearSelection,
  onExportSelected,
  onNotifySelected,
  onAssignQueue,
  onAddTag,
}) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-xl shadow-xl px-4 py-2.5 flex items-center gap-4 text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
        <CheckSquare className="w-4 h-4 text-purple-400" />
        <span className="font-semibold text-white">
          {selectedCount} provider{selectedCount > 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExportSelected}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          <Download className="w-3.5 h-3.5 text-slate-300" />
          Export Selected
        </button>

        <button
          type="button"
          onClick={onNotifySelected}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          <Bell className="w-3.5 h-3.5 text-slate-300" />
          Send Notice
        </button>

        <button
          type="button"
          onClick={onAssignQueue}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          <UserPlus className="w-3.5 h-3.5 text-slate-300" />
          Assign Review Queue
        </button>

        <button
          type="button"
          onClick={onAddTag}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          <Tag className="w-3.5 h-3.5 text-slate-300" />
          Add Internal Tag
        </button>
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
        title="Deselect All"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

