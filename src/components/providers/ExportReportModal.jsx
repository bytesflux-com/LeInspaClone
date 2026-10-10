import { useState } from 'react'
import { X, Download, FileSpreadsheet, Check, Shield } from 'lucide-react'
import { providerService } from '../../services/providerService'
import { downloadTextFile } from '../../lib/download'
import { useMarketContext } from '../../hooks/useMarketContext'
import { useDateRange } from '../../hooks/useDateRange'

export default function ExportReportModal({ isOpen, onClose, onExportSuccess }) {
  const { selectedMarket } = useMarketContext()
  const { dateRange } = useDateRange()
  const [format, setFormat] = useState('csv')
  const [busy, setBusy] = useState(false)

  if (!isOpen) return null

  const handleExport = async () => {
    setBusy(true)
    try {
      const csvData = await providerService.exportProvidersReport({
        market: selectedMarket.id,
        dateRange,
      })
      const filename = `le-inspa-providers-${selectedMarket.id}-${new Date().toISOString().slice(0, 10)}.csv`
      downloadTextFile(filename, csvData)
      onExportSuccess?.('Provider Management report exported successfully')
      onClose()
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-[#5c2dd5]">
            <FileSpreadsheet className="size-5" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#1b1140]">Export Provider Report</h3>
            <p className="text-[12px] text-gray-500">
              Scope: <strong className="text-[#1b1140]">{selectedMarket.name}</strong> • {dateRange}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-3.5 text-[12px] text-gray-600">
          <div className="flex items-center justify-between">
            <span>Market Filter:</span>
            <strong className="text-[#1b1140]">{selectedMarket.name}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Audit Logging:</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <Shield className="size-3.5" /> Enforced
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>File Format:</span>
            <strong className="text-[#1b1140]">Comma-Separated Values (.csv)</strong>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-[12px] font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#5c2dd5] px-4 py-2 text-[12px] font-semibold text-white shadow-xs hover:bg-[#481ec0] disabled:opacity-50"
          >
            <Download className="size-3.5" /> {busy ? 'Generating...' : 'Download Report'}
          </button>
        </div>
      </div>
    </div>
  )
}

