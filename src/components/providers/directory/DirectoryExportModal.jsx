import { useState } from 'react'
import { X, FileSpreadsheet, Download, ShieldCheck, Check } from 'lucide-react'
import { providerService } from '../../../services/providerService'
import { downloadTextFile } from '../../../lib/download'

export function DirectoryExportModal({
  isOpen,
  onClose,
  selectedIds = [],
  filterParams = {},
  totalCount = 0,
}) {
  const [exportScope, setExportScope] = useState(selectedIds.length > 0 ? 'selected' : 'filtered')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleExport = async () => {
    setBusy(true)
    try {
      const csvData = await providerService.exportProvidersDirectory(
        filterParams,
        exportScope === 'selected' ? selectedIds : [],
      )
      const dateStr = new Date().toISOString().slice(0, 10)
      const filename = `le-inspa-providers-directory-${dateStr}.csv`
      downloadTextFile(filename, csvData)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1200)
    } catch (err) {
      console.error('[DirectoryExportModal] export error:', err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex w-10 h-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Export Provider Directory</h3>
            <p className="text-xs text-slate-500">Download audited provider records (.csv)</p>
          </div>
        </div>

        {success ? (
          <div className="mt-6 p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Download Started</h4>
            <p className="text-xs text-slate-500">Export file has been generated and audited.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4 text-xs">
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700">Export Scope</label>
              <div className="space-y-1.5">
                {selectedIds.length > 0 && (
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-purple-200 bg-purple-50/50 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      value="selected"
                      checked={exportScope === 'selected'}
                      onChange={() => setExportScope('selected')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-medium text-purple-900">
                      Selected Providers ({selectedIds.length} records)
                    </span>
                  </label>
                )}

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    value="filtered"
                    checked={exportScope === 'filtered'}
                    onChange={() => setExportScope('filtered')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-medium text-slate-700">
                    Current Filtered View ({totalCount} records)
                  </span>
                </label>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-[11px] text-slate-600 border border-slate-200">
              <div className="flex items-center justify-between">
                <span>Format:</span>
                <span className="font-semibold text-slate-800">CSV (.csv)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Compliance Audit:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Logged & Enforced
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition shadow-xs disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {busy ? 'Generating...' : 'Export CSV'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

