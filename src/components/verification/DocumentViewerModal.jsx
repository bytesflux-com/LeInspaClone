import { useState } from 'react'
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  FileText,
  ShieldCheck,
} from 'lucide-react'

/**
 * ADM-029 Document Viewer Modal
 * Clean, light-themed lightbox viewer for examining submitted credentials, certificates,
 * and business registry filings with zoom, rotation, and metadata inspector.
 */
export default function DocumentViewerModal({
  isOpen,
  onClose,
  document,
  provider,
}) {
  const [zoomLevel, setZoomLevel] = useState(100)
  const [rotation, setRotation] = useState(0)

  if (!isOpen || !document) return null

  const handleZoomIn = () => setZoomLevel((z) => Math.min(250, z + 25))
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 25))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)
  const handleReset = () => {
    setZoomLevel(100)
    setRotation(0)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Top Bar */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <FileText className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {document.title || 'Verification Document'}
                </h3>
                <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                  {document.fileFormat || 'PDF'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {provider?.name} ({provider?.providerId}) • {provider?.market?.name}
              </p>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white px-1 py-0.5 text-xs text-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom Out"
                className="rounded p-1 hover:bg-slate-100 text-slate-600"
              >
                <ZoomOut className="size-4" />
              </button>
              <span className="w-12 text-center font-mono text-[11px] font-semibold">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom In"
                className="rounded p-1 hover:bg-slate-100 text-slate-600"
              >
                <ZoomIn className="size-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleRotate}
              title="Rotate 90°"
              className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50"
            >
              <RotateCw className="size-4" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              Reset
            </button>

            <a
              href={document.fileUrl || '#'}
              target="_blank"
              rel="noreferrer"
              download
              className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50"
              title="Download Document"
            >
              <Download className="size-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="ml-2 flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-5" />
            </button>
          </div>
        </header>

        {/* Modal Main Content: Viewer Canvas & Metadata Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Document Canvas */}
          <div className="relative flex flex-1 items-center justify-center overflow-auto bg-slate-100/70 p-8">
            <div
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.15s ease-out',
              }}
              className="relative max-h-full max-w-full origin-center select-none shadow-xl"
            >
              {/* Simulated High-Res Certificate / Doc Template */}
              <div className="relative flex h-[580px] w-[440px] flex-col justify-between rounded-lg border-8 border-amber-900/30 bg-gradient-to-b from-[#FFFDF9] to-[#F7F2E7] p-8 text-slate-900 shadow-xl">
                {/* Certificate Guilloche & Watermark */}
                <div className="pointer-events-none absolute inset-4 rounded border-2 border-dashed border-amber-700/30" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5">
                  <ShieldCheck className="size-64 text-amber-900" />
                </div>

                {/* Certificate Top Header */}
                <div className="relative text-center">
                  <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full border-2 border-amber-800 bg-amber-50 text-amber-900">
                    <ShieldCheck className="size-7" />
                  </div>
                  <h4 className="font-serif text-lg font-bold tracking-widest text-amber-950 uppercase">
                    {document.issuer || 'Official Accreditation Board'}
                  </h4>
                  <p className="text-[10px] tracking-wider text-amber-800 uppercase">
                    Republic of {provider?.market?.name || 'Kenya'} • Regulatory Council
                  </p>
                  <div className="mx-auto mt-2 h-0.5 w-24 bg-amber-800/40" />
                </div>

                {/* Certificate Body */}
                <div className="relative space-y-3 text-center">
                  <p className="text-xs italic text-slate-600">This is to certify that</p>
                  <h2 className="font-serif text-2xl font-bold tracking-wide text-amber-950">
                    {document.nameOnDoc || provider?.name}
                  </h2>
                  <p className="px-4 text-[11px] leading-relaxed text-slate-700">
                    has successfully satisfied all statutory standards, clinical examinations,
                    and licensing regulations for professional practice in{' '}
                    <span className="font-semibold text-slate-900">{provider?.type || 'Therapeutic Practice'}</span>.
                  </p>
                  <div className="inline-block rounded border border-amber-800/30 bg-amber-50/60 px-3 py-1 font-mono text-xs font-bold text-amber-900">
                    Licence No: {document.docNumber || 'REG-2024-••••7281'}
                  </div>
                </div>

                {/* Certificate Signatures & Seals */}
                <div className="relative flex items-end justify-between border-t border-amber-800/20 pt-4 text-[10px] text-slate-600">
                  <div className="text-left">
                    <div className="font-serif text-xs font-bold text-slate-800">Dr. S. K. Chebet</div>
                    <div>Registrar of Council</div>
                    <div className="mt-0.5 text-[9px] text-slate-500">Issued: {document.issueDate || '15 Jan 2024'}</div>
                  </div>

                  <div className="flex size-14 items-center justify-center rounded-full border-2 border-amber-700 bg-amber-600/10 text-amber-900">
                    <span className="text-center font-serif text-[9px] font-bold uppercase leading-none">
                      Official<br />Seal
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="font-serif text-xs font-bold text-slate-800">Valid Through</div>
                    <div className="font-semibold text-slate-900">{document.expiryDate || '15 Jan 2028'}</div>
                    <div className="mt-0.5 text-[9px] text-emerald-700">Digital Registry Verified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Inspector Sidebar */}
          <aside className="w-80 shrink-0 border-l border-slate-200 bg-white p-6 text-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Document Metadata
            </h4>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <span className="text-slate-500">Document Type</span>
                <p className="mt-0.5 font-semibold text-slate-900">{document.title}</p>
              </div>

              <div>
                <span className="text-slate-500">Name on Document</span>
                <p className="mt-0.5 font-semibold text-slate-900">{document.nameOnDoc}</p>
              </div>

              <div>
                <span className="text-slate-500">Document Number</span>
                <p className="mt-0.5 font-mono font-semibold text-purple-700">{document.docNumber}</p>
              </div>

              <div>
                <span className="text-slate-500">Issuing Authority</span>
                <p className="mt-0.5 font-medium text-slate-800">{document.issuer}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Issue Date</span>
                  <p className="mt-0.5 font-medium text-slate-800">{document.issueDate}</p>
                </div>
                <div>
                  <span className="text-slate-500">Expiry Date</span>
                  <p className="mt-0.5 font-medium text-slate-800">{document.expiryDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">File Format</span>
                  <p className="mt-0.5 font-medium text-slate-800">{document.fileFormat}</p>
                </div>
                <div>
                  <span className="text-slate-500">File Size</span>
                  <p className="mt-0.5 font-medium text-slate-800">
                    {Math.round((document.fileSizeKb || 2048) / 1024 * 10) / 10} MB
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="mt-8 rounded-xl border border-purple-100 bg-[#F9F7FE] p-3.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-purple-700" />
                <span className="font-semibold text-purple-900">OCR Extraction Status</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-purple-800">
                Text and issuer metadata verified against regulatory database records with 99.4% confidence score.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
