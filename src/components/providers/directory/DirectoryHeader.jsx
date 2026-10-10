import { Download, Plus } from 'lucide-react'

export function DirectoryHeader({ totalProviders = 24860, onExport, onAddProvider }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Provider Directory
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Find and manage professionals, spas, hotels and wellness businesses across Lé Inspa.
        </p>
        <div className="mt-2 text-sm font-semibold text-slate-700">
          {Number(totalProviders).toLocaleString()} Providers
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-xs"
        >
          <Download className="w-4 h-4 text-slate-500" />
          Export
        </button>

        <button
          type="button"
          onClick={onAddProvider}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Provider
        </button>
      </div>
    </div>
  )
}

