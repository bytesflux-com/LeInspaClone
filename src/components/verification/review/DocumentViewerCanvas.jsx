import { useState } from 'react'
import {
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Download,
  CheckCircle2,
  ShieldCheck,
  Award,
  Sparkles,
  FileCheck,
} from 'lucide-react'

/**
 * ADM-031: DocumentViewerCanvas
 * Evidence-first interactive inspection workspace:
 * - Left thumbnail strip with page selection
 * - Center interactive canvas toolbar with zoom, rotation, fullscreen, page navigation
 * - High-fidelity vector certificate / document rendering
 * - Right document metadata panel with unmask toggle and OCR status
 */
export default function DocumentViewerCanvas({
  activeDoc,
  documents = [],
  onSelectDoc,
  provider,
}) {
  const [zoomLevel, setZoomLevel] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [activePage, setActivePage] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMasked, setIsMasked] = useState(true)

  const doc = activeDoc || documents[0] || {
    title: 'Professional Certificate',
    fileName: 'Professional_Certificate.pdf',
    docType: 'Professional Certificate',
    nameOnDoc: 'Grace Njeri',
    docNumber: '•••• 7281',
    unmaskedDocNumber: 'KMF-2024-7281',
    issuer: 'International Wellness Institute',
    issueDate: '15 Jan 2024',
    expiryDate: '15 Jan 2028',
    uploadedAt: '12 Sep 2026 • 10:42 AM',
    fileStatus: 'Readable',
    pageCount: 2,
    ocrStatus: 'SUCCESS',
  }

  const totalPages = doc.pageCount || 2

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 25, 200))
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 25, 50))
  const handleResetZoom = () => setZoomLevel(100)
  const handleRotate = () => setRotation((r) => (r + 90) % 360)

  const handlePrevPage = () => setActivePage((p) => Math.max(1, p - 1))
  const handleNextPage = () => setActivePage((p) => Math.min(totalPages, p + 1))

  return (
    <div
      className={`flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all overflow-hidden ${
        isFullscreen
          ? 'fixed inset-4 z-50 shadow-2xl flex-col ring-9999 ring-black/60 bg-white'
          : 'relative'
      }`}
    >
      {/* 1. Header Row */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-purple-100 text-[#6D28D9]">
            <FileText className="size-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Submitted Document</h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>OCR Verified</span>
          </span>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* 2. Workspace Body (3 Columns: Thumbnails | Canvas | Metadata) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px] bg-slate-100/60 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/70">
        {/* LEFT COLUMN: Vertical Thumbnail Strip (Span 2) */}
        <div className="lg:col-span-2 p-3 bg-slate-50/90 flex flex-col gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pages / Files
          </span>

          <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto max-h-[420px] pr-1">
            {/* Page 1 Thumbnail */}
            <button
              type="button"
              onClick={() => setActivePage(1)}
              className={`flex flex-col items-center rounded-xl p-2 transition cursor-pointer border text-left ${
                activePage === 1
                  ? 'border-[#6D28D9] bg-purple-50/70 shadow-xs ring-2 ring-purple-500/20'
                  : 'border-slate-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="w-full aspect-3/4 rounded-lg bg-white border border-slate-200 shadow-2xs p-2 flex flex-col justify-between overflow-hidden">
                <div className="h-1.5 w-12 bg-purple-300 rounded" />
                <div className="space-y-1">
                  <div className="h-1 w-full bg-slate-200 rounded" />
                  <div className="h-1 w-4/5 bg-slate-200 rounded" />
                  <div className="h-1 w-3/5 bg-slate-200 rounded" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="size-3 rounded-full bg-amber-400" />
                  <div className="h-1 w-6 bg-slate-300 rounded" />
                </div>
              </div>
              <span className="mt-1.5 text-[11px] font-semibold text-slate-700">Page 1 (Front)</span>
            </button>

            {/* Page 2 Thumbnail */}
            <button
              type="button"
              onClick={() => setActivePage(2)}
              className={`flex flex-col items-center rounded-xl p-2 transition cursor-pointer border text-left ${
                activePage === 2
                  ? 'border-[#6D28D9] bg-purple-50/70 shadow-xs ring-2 ring-purple-500/20'
                  : 'border-slate-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="w-full aspect-3/4 rounded-lg bg-white border border-slate-200 shadow-2xs p-2 flex flex-col justify-between overflow-hidden">
                <div className="h-1.5 w-10 bg-slate-300 rounded" />
                <div className="space-y-1">
                  <div className="h-1 w-full bg-slate-100 rounded" />
                  <div className="h-1 w-full bg-slate-100 rounded" />
                  <div className="h-1 w-2/3 bg-slate-100 rounded" />
                </div>
                <div className="flex justify-end pt-2">
                  <div className="h-2 w-8 bg-purple-200 rounded" />
                </div>
              </div>
              <span className="mt-1.5 text-[11px] font-semibold text-slate-700">Page 2 (Back)</span>
            </button>
          </div>

          {/* Submissions count pill */}
          <div className="mt-auto pt-2 border-t border-slate-200 text-center">
            <span className="inline-block rounded-lg bg-purple-100/70 px-2 py-1 text-[11px] font-medium text-purple-800">
              + {doc.totalPagesSubmitted || 3} pages submitted
            </span>
          </div>
        </div>

        {/* CENTER COLUMN: Interactive Viewer Canvas (Span 7) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-200/50">
          {/* Top Canvas Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 text-xs">
            {/* File info */}
            <div className="flex items-center gap-2 font-medium text-slate-800 truncate">
              <span className="rounded bg-rose-100 px-1.5 py-0.5 font-bold text-[10px] text-rose-700">
                PDF
              </span>
              <span className="truncate max-w-[180px] font-semibold">{doc.fileName || 'Professional_Certificate.pdf'}</span>
            </div>

            {/* Middle: Page navigation */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={activePage <= 1}
                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="font-semibold text-slate-700 px-1">
                Page {activePage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={activePage >= totalPages}
                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition shadow-2xs"
                title="Next Page"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Right: Zoom & Rotate Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition shadow-2xs"
                title="Zoom Out"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 hover:text-purple-700"
                title="Reset Zoom"
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition shadow-2xs"
                title="Zoom In"
              >
                <ZoomIn className="size-3.5" />
              </button>
              <div className="mx-1 h-4 w-px bg-slate-200" />
              <button
                type="button"
                onClick={handleRotate}
                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                title="Rotate 90°"
              >
                <RotateCw className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Document Inspection Canvas Area */}
          <div className="flex-1 overflow-auto p-6 flex items-center justify-center min-h-[380px]">
            <div
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
              }}
              className="relative w-[480px] min-h-[340px] bg-[#FCFBF7] rounded-xl shadow-xl border-4 border-amber-900/30 p-6 flex flex-col justify-between text-slate-800 select-none overflow-hidden"
            >
              {/* Guilloche Decorative Border */}
              <div className="absolute inset-1.5 border-2 border-dashed border-amber-800/40 rounded-lg pointer-events-none" />
              <div className="absolute inset-3 border border-amber-700/20 rounded-md pointer-events-none" />

              {/* Watermark Logo in center */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
                <Award className="size-64 text-amber-900" />
              </div>

              {activePage === 1 ? (
                <>
                  {/* Certificate Top Header */}
                  <div className="relative text-center space-y-1">
                    <div className="flex items-center justify-center gap-2 text-amber-800">
                      <Sparkles className="size-3.5" />
                      <span className="font-serif text-[11px] font-bold tracking-[0.2em] uppercase">
                        {doc.issuer || 'INTERNATIONAL WELLNESS INSTITUTE'}
                      </span>
                      <Sparkles className="size-3.5" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-slate-900 tracking-tight">
                      Certificate of Completion
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      This is to officially certify that
                    </p>
                  </div>

                  {/* Recipient Name & Award */}
                  <div className="relative text-center my-3 py-2 border-y border-amber-200/60 bg-amber-50/20">
                    <h4 className="font-serif text-xl font-extrabold text-[#5B21B6] tracking-wide">
                      {doc.nameOnDoc || 'Grace Njeri'}
                    </h4>
                    <p className="mt-1 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                      PROFESSIONAL MASSAGE THERAPY & CLINICAL PRACTICE
                    </p>
                    <p className="mt-1 text-[9px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Having demonstrated exceptional proficiency and satisfactorily fulfilled all prescribed
                      clinical criteria, practical coursework, and regulatory requirements.
                    </p>
                  </div>

                  {/* Certificate Seal & Signatures Footer */}
                  <div className="relative flex items-end justify-between pt-2">
                    {/* Left Signature */}
                    <div className="text-center w-28">
                      <div className="font-serif italic text-xs text-slate-800 border-b border-slate-400 pb-0.5">
                        Arthur Vance
                      </div>
                      <p className="text-[8px] uppercase tracking-wider text-slate-500 pt-0.5">
                        Dean of Faculty
                      </p>
                      <p className="text-[8px] font-mono text-slate-400">{doc.issueDate || '15 Jan 2024'}</p>
                    </div>

                    {/* Center Gold Embossed Seal */}
                    <div className="flex flex-col items-center">
                      <div className="relative flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 shadow-md border-2 border-amber-600/80">
                        <Award className="size-7 text-amber-950/80" />
                        <span className="absolute -bottom-1 text-[7px] font-bold text-amber-950 uppercase tracking-tighter bg-amber-300 px-1 rounded-sm shadow-2xs">
                          ACCREDITED
                        </span>
                      </div>
                      <span className="mt-1.5 font-mono text-[8px] text-slate-400 font-medium">
                        NO. {isMasked ? doc.docNumber : doc.unmaskedDocNumber}
                      </span>
                    </div>

                    {/* Right Signature */}
                    <div className="text-center w-28">
                      <div className="font-serif italic text-xs text-slate-800 border-b border-slate-400 pb-0.5">
                        Evelyn Mwangi
                      </div>
                      <p className="text-[8px] uppercase tracking-wider text-slate-500 pt-0.5">
                        Director of Registry
                      </p>
                      <p className="text-[8px] font-mono text-slate-400">Valid to: {doc.expiryDate || '15 Jan 2028'}</p>
                    </div>
                  </div>
                </>
              ) : (
                /* Page 2: Transcript & Endorsements */
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-2 text-center">
                    <h4 className="font-serif text-sm font-bold text-slate-900">
                      Academic & Clinical Endorsement Transcript
                    </h4>
                    <p className="text-[10px] text-slate-500">Record Serial: {doc.unmaskedDocNumber}</p>
                  </div>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex justify-between border-b border-slate-100 py-1">
                      <span className="text-slate-500">Anatomy & Physiology for Bodywork</span>
                      <span className="font-bold text-emerald-700">Grade: Distinction (94%)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 py-1">
                      <span className="text-slate-500">Deep Tissue & Myofascial Release Techniques</span>
                      <span className="font-bold text-emerald-700">Grade: Honors (91%)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 py-1">
                      <span className="text-slate-500">Hygiene, Infection Control & Ethics</span>
                      <span className="font-bold text-emerald-700">Grade: Pass (100%)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 py-1">
                      <span className="text-slate-500">Supervised Clinical Practicum (240 Hours)</span>
                      <span className="font-bold text-emerald-700">Status: Completed</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-[9px] text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    <span>Official stamp verified by Kenya Allied Health Board electronic notary system.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Document Details Card (Span 3) */}
        <div className="lg:col-span-3 p-4 bg-white flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-900">Document Metadata</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>{doc.fileStatus || 'Readable'}</span>
              </span>
            </div>

            {/* Details Fields */}
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Document Type</span>
                <p className="font-semibold text-slate-800">{doc.docType || 'Professional Certificate'}</p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium">Name on Document</span>
                <p className="font-semibold text-slate-800">{doc.nameOnDoc || 'Grace Njeri'}</p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium">Document Number</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800">
                    {isMasked ? doc.docNumber : doc.unmaskedDocNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMasked(!isMasked)}
                    className="p-1 text-slate-400 hover:text-purple-600 transition"
                    title={isMasked ? 'Reveal Number' : 'Mask Number'}
                  >
                    {isMasked ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium">Issued By</span>
                <p className="font-semibold text-slate-800">{doc.issuer || 'International Wellness Institute'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Issue Date</span>
                  <p className="font-semibold text-slate-800">{doc.issueDate || '15 Jan 2024'}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Expiry Date</span>
                  <p className="font-semibold text-slate-800">{doc.expiryDate || '15 Jan 2028'}</p>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium">Uploaded</span>
                <p className="font-semibold text-slate-700">{doc.uploadedAt || '12 Sep 2026 • 10:42 AM'}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 transition"
              onClick={() => alert(`Downloading document: ${doc.fileName}`)}
            >
              <Download className="size-3.5" />
              <span>Download PDF</span>
            </button>

            <span className="text-[10px] text-slate-400">SHA-256 Verified</span>
          </div>
        </div>
      </div>
    </div>
  )
}
