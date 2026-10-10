import React, { useState } from 'react'
import {
  FileText,
  Building2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  MapPin,
  QrCode,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Sparkles,
  Award,
} from 'lucide-react'

/**
 * ADM-034: BusinessDocumentViewer
 * Multi-page inspection workstation with high-fidelity canvas simulation
 * of official Republic of Kenya / Nairobi City County Single Business Permit,
 * zoom/rotate/pan controls, page thumbnails, and security unmasking.
 */
export default function BusinessDocumentViewer({
  documentData,
  onRevealNumber,
}) {
  const [activePage, setActivePage] = useState(1) // 1 | 2 | 3
  const [zoomLevel, setZoomLevel] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)

  if (!documentData) return null

  const pageCount = documentData.pageCount || 3
  const docNumber = isRevealed
    ? documentData.regNumberPlain || 'NBI/BL/2025/78421'
    : documentData.regNumberMasked || '•••• •••• 78421'

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 175))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 75))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)
  const handleReset = () => {
    setZoomLevel(100)
    setRotation(0)
  }

  const handleToggleReveal = () => {
    const nextRevealed = !isRevealed
    setIsRevealed(nextRevealed)
    onRevealNumber?.(nextRevealed)
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
      {/* 1. Header with Filename & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-[#6D28D9]">
            <Building2 className="size-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">{documentData.title}</h3>
              <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 font-mono">
                {documentData.fileFormat || 'PDF'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{documentData.subtitle || documentData.docType}</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-[#6D28D9]">
            <span className="size-2 rounded-full bg-[#6D28D9] animate-pulse" />
            Active Evidence Inspection
          </span>
        </div>
      </div>

      {/* 2. Main 3-Column Inspection Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Vertical Page Thumbnails Strip (Span 2) */}
        <div className="lg:col-span-2 flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {/* Page 1 Thumbnail */}
          <button
            type="button"
            onClick={() => setActivePage(1)}
            className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition cursor-pointer shrink-0 w-28 lg:w-full ${
              activePage === 1
                ? 'border-[#6D28D9] bg-purple-50/50 ring-2 ring-purple-600/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="relative w-full h-16 rounded-lg bg-gradient-to-b from-amber-50/60 to-white border border-slate-200/80 flex items-center justify-center overflow-hidden p-1 shadow-2xs">
              <div className="text-[7px] text-slate-500 font-serif uppercase tracking-tight text-center leading-tight">
                COUNTY LICENCE<br />PAGE 1
              </div>
              <div className="absolute bottom-1 right-1 size-3 rounded-full bg-amber-400/80" />
            </div>
            <span className={`text-[11px] font-bold ${activePage === 1 ? 'text-[#6D28D9]' : 'text-slate-700'}`}>
              Page 1
            </span>
            <span className="text-[9px] text-slate-400">Single Business Permit</span>
          </button>

          {/* Page 2 Thumbnail */}
          {pageCount >= 2 && (
            <button
              type="button"
              onClick={() => setActivePage(2)}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition cursor-pointer shrink-0 w-28 lg:w-full ${
                activePage === 2
                  ? 'border-[#6D28D9] bg-purple-50/50 ring-2 ring-purple-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="relative w-full h-16 rounded-lg bg-gradient-to-b from-slate-50 to-white border border-slate-200/80 flex items-center justify-center overflow-hidden p-1 shadow-2xs">
                <div className="text-[7px] text-slate-500 font-mono uppercase tracking-tight text-center leading-tight">
                  SCHEDULE<br />PAGE 2
                </div>
                <div className="absolute bottom-1 left-1 w-5 h-1 bg-slate-300 rounded-xs" />
              </div>
              <span className={`text-[11px] font-bold ${activePage === 2 ? 'text-[#6D28D9]' : 'text-slate-700'}`}>
                Page 2
              </span>
              <span className="text-[9px] text-slate-400">Permitted Operations</span>
            </button>
          )}

          {/* Page 3 Thumbnail */}
          {pageCount >= 3 && (
            <button
              type="button"
              onClick={() => setActivePage(3)}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition cursor-pointer shrink-0 w-28 lg:w-full ${
                activePage === 3
                  ? 'border-[#6D28D9] bg-purple-50/50 ring-2 ring-purple-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="relative w-full h-16 rounded-lg bg-gradient-to-b from-emerald-50/50 to-white border border-slate-200/80 flex items-center justify-center overflow-hidden p-1 shadow-2xs">
                <div className="text-[7px] text-slate-500 font-mono uppercase tracking-tight text-center leading-tight">
                  HEALTH DEPT<br />PAGE 3
                </div>
                <div className="absolute bottom-1 right-1 size-3 rounded-full bg-emerald-400/80" />
              </div>
              <span className={`text-[11px] font-bold ${activePage === 3 ? 'text-[#6D28D9]' : 'text-slate-700'}`}>
                Page 3
              </span>
              <span className="text-[9px] text-slate-400">Sanitation Clearance</span>
            </button>
          )}
        </div>

        {/* CENTER COLUMN: Interactive Canvas Area (Span 7) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-slate-200 bg-slate-900/5 overflow-hidden">
          {/* Top Canvas Toolbar */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2 text-slate-700">
            {/* Meta */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800">
                Page {activePage} of {pageCount}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-500 font-mono">
                {zoomLevel}%
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 75}
                title="Zoom Out"
                className="flex size-7 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-40 transition cursor-pointer"
              >
                <ZoomOut className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 175}
                title="Zoom In"
                className="flex size-7 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-40 transition cursor-pointer"
              >
                <ZoomIn className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                title="Rotate 90°"
                className="flex size-7 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              >
                <RotateCw className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="Reset View"
                className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title="Toggle Fullscreen"
                className="flex size-7 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer ml-1"
              >
                {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
            </div>
          </div>

          {/* Canvas Display Surface */}
          <div
            className={`relative flex items-center justify-center p-4 sm:p-6 overflow-auto bg-slate-100/70 min-h-[500px] transition-all ${
              isFullscreen ? 'fixed inset-0 z-50 p-10 bg-slate-900/80 backdrop-blur-sm' : ''
            }`}
          >
            {isFullscreen && (
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 z-50 rounded-xl bg-white p-2 text-slate-700 shadow-lg hover:bg-slate-100 cursor-pointer"
              >
                <Minimize2 className="size-5" />
              </button>
            )}

            {/* Document Render Canvas */}
            <div
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out',
              }}
              className="relative w-full max-w-[560px] rounded-xl bg-amber-50/20 border-4 border-amber-900/20 p-6 sm:p-8 shadow-xl text-slate-900 font-serif select-none"
            >
              {/* Guilloche Double Security Border */}
              <div className="absolute inset-2 border-2 border-dashed border-amber-800/30 rounded-lg pointer-events-none" />

              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <div className="text-4xl font-extrabold rotate-[-30deg] tracking-widest text-slate-900 uppercase">
                  NAIROBI CITY COUNTY • OFFICIAL PERMIT
                </div>
              </div>

              {/* Page 1: Single Business Permit Canvas */}
              {activePage === 1 && (
                <div className="relative space-y-5 text-center">
                  {/* Official Header */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-3">
                      <div className="size-10 rounded-full border-2 border-amber-700/60 bg-white flex items-center justify-center shadow-xs">
                        <Building2 className="size-6 text-amber-900" />
                      </div>
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-amber-950 font-sans">
                      Republic of Kenya
                    </h4>
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">
                      Nairobi City County Government
                    </h3>
                    <p className="text-[10px] font-sans font-semibold tracking-wider text-slate-600 uppercase">
                      Finance and Economic Planning Sector • Revenue Administration
                    </p>
                    <div className="inline-block rounded-md bg-amber-800 px-3 py-1 text-[11px] font-sans font-bold text-white uppercase tracking-wider mt-1">
                      Unified Single Business Permit (SBP)
                    </div>
                  </div>

                  {/* Permit Registration Number */}
                  <div className="rounded-lg border border-slate-300 bg-white/90 p-2.5 shadow-2xs font-sans">
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                      Permit Identification Number
                    </div>
                    <div className="text-base font-extrabold tracking-wider text-[#6D28D9] font-mono">
                      {docNumber}
                    </div>
                  </div>

                  {/* Body Content Grid */}
                  <div className="grid grid-cols-2 gap-3 text-left font-sans text-xs pt-1 border-t border-slate-200">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Legal Entity Name</div>
                      <div className="font-bold text-slate-900">{documentData.legalEntityName || 'Serenity Wellness Ltd.'}</div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Trading As (Public Name)</div>
                      <div className="font-bold text-purple-900">{documentData.tradingName || 'Serenity Wellness Spa'}</div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Physical Premises / LR No.</div>
                      <div className="font-medium text-slate-800">{documentData.plotNumber || 'Plot 209/18420 Chiromo Rd, Westlands'}</div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Permitted Business Activity</div>
                      <div className="font-medium text-slate-800">{documentData.businessActivity || 'Spa, Massage Therapy & Wellness Establishment'}</div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Date of Issuance</div>
                      <div className="font-medium text-slate-800">{documentData.issueDate || '01 Jan 2025'}</div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Permit Expiry Date</div>
                      <div className="font-bold text-emerald-700">{documentData.expiryDate || '31 Dec 2025'}</div>
                    </div>
                  </div>

                  {/* Footer Stamps & Signatures */}
                  <div className="flex items-end justify-between border-t border-slate-200 pt-3 font-sans">
                    <div className="text-left space-y-1">
                      <div className="text-[9px] text-slate-400 uppercase">Digital Security Seal</div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="size-3.5" />
                        County Revenue Hash Valid
                      </div>
                      <div className="text-[8px] text-slate-400 font-mono">
                        TXN: NCC/2025/REV-981249
                      </div>
                    </div>

                    {/* QR Code & Official County Stamp */}
                    <div className="flex items-center gap-3">
                      <div className="relative flex size-14 items-center justify-center rounded-full border-2 border-purple-800/80 text-purple-900 rotate-[-12deg] p-1 text-center leading-tight">
                        <div className="text-[6.5px] font-black uppercase tracking-tight">
                          Nairobi City County<br />★ REVENUE ★<br />PAID & APPROVED
                        </div>
                      </div>

                      <div className="flex size-12 items-center justify-center rounded-lg border border-slate-300 bg-white p-1">
                        <QrCode className="size-10 text-slate-800" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Page 2: Schedule of Permitted Operations */}
              {activePage === 2 && (
                <div className="relative space-y-4 font-sans text-left">
                  <div className="border-b border-slate-200 pb-2 text-center">
                    <h4 className="text-xs font-bold uppercase text-slate-800">
                      Nairobi City County Government — Annexure A
                    </h4>
                    <h5 className="text-[11px] font-medium text-slate-500">
                      Schedule of Approved Premises Facilities & Operational Capacities
                    </h5>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                      <span className="font-bold text-slate-900">Treatment Rooms: </span>
                      <span className="text-slate-700">6 Private Therapy Suites with Individual Washrooms</span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                      <span className="font-bold text-slate-900">Thermal / Hydro Facilities: </span>
                      <span className="text-slate-700">Finnish Dry Sauna, Steam Room, 2 Whirlpool Hydrotherapy Baths</span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                      <span className="font-bold text-slate-900">Sanitation Standards: </span>
                      <span className="text-slate-700">Continuous Ventilation, Medical-Grade Linens Autoclave on Site</span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                      <span className="font-bold text-slate-900">Operating Hours Endorsement: </span>
                      <span className="text-slate-700">08:00 AM – 09:00 PM (Daily Municipal License)</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-400 text-center">
                    Document continues to Page 3 — County Public Health Directorate Clearance
                  </div>
                </div>
              )}

              {/* Page 3: Public Health Directorate Clearance */}
              {activePage === 3 && (
                <div className="relative space-y-4 font-sans text-left">
                  <div className="border-b border-slate-200 pb-2 text-center">
                    <div className="inline-flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 mb-1">
                      <ShieldCheck className="size-5" />
                    </div>
                    <h4 className="text-xs font-bold uppercase text-slate-800">
                      Directorate of Public Health & Sanitation
                    </h4>
                    <h5 className="text-[11px] font-medium text-slate-500">
                      Annual Health & Hygiene Inspection Clearance Certificate
                    </h5>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50/60 p-2.5 border border-emerald-200">
                      <span className="font-semibold text-emerald-900">Premises Inspection Grade:</span>
                      <span className="font-extrabold text-emerald-700">Class A (Exemplary 96%)</span>
                    </div>

                    <div className="space-y-1 text-slate-700 text-[11px]">
                      <div>✓ Potable water supply bacteriological test passed</div>
                      <div>✓ Waste disposal and laundry hygiene protocols cleared</div>
                      <div>✓ First Aid & Emergency resuscitation kit verified</div>
                      <div>✓ Staff food/beverage hygiene handling badges inspected</div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Chief Public Health Officer: Dr. P. Kariuki</span>
                    <span className="font-mono text-emerald-700 font-bold">CLEARED 2025/2026</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Document Metadata & Security Unmasking (Span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Metadata Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-xs font-bold text-slate-900">Document Metadata</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Verified Format
              </span>
            </div>

            {/* Document Number with Reveal Action */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">Document Number</span>
                <button
                  type="button"
                  onClick={handleToggleReveal}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#6D28D9] hover:underline cursor-pointer"
                >
                  {isRevealed ? (
                    <>
                      <EyeOff className="size-3" />
                      Mask
                    </>
                  ) : (
                    <>
                      <Eye className="size-3" />
                      Reveal
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900 shadow-2xs">
                <span>{docNumber}</span>
                {isRevealed && (
                  <span className="rounded-xs bg-purple-100 px-1.5 py-0.5 text-[9px] font-sans font-semibold text-purple-700">
                    AUDITED
                  </span>
                )}
              </div>
            </div>

            {/* Issuer */}
            <div className="space-y-0.5 text-xs">
              <div className="text-[11px] font-medium text-slate-500">Issuing Authority</div>
              <div className="font-semibold text-slate-900">{documentData.issuer || 'Nairobi City County Government'}</div>
              <div className="text-[10px] text-slate-400">Unified Municipal Registry</div>
            </div>

            {/* Issue & Expiry Date */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
              <div>
                <div className="text-[11px] font-medium text-slate-500">Issue Date</div>
                <div className="font-semibold text-slate-900">{documentData.issueDate || '01 Jan 2025'}</div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">Expiry Date</div>
                <div className="font-semibold text-emerald-700">{documentData.expiryDate || '31 Dec 2025'}</div>
              </div>
            </div>

            {/* Validity Tracker */}
            <div className="rounded-lg bg-emerald-50/80 border border-emerald-200 p-2.5 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900">Current & Valid</span>
                <span className="text-[11px] font-semibold text-emerald-700">6 mos remaining</span>
              </div>
              <p className="text-[10px] text-emerald-800">
                Single business permit is active for current fiscal year. No municipal suspension notices.
              </p>
            </div>

            {/* File Details */}
            <div className="space-y-1 pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
              <div className="flex justify-between">
                <span>File Name:</span>
                <span className="font-medium text-slate-700 truncate max-w-[120px]">{documentData.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span>File Size:</span>
                <span className="font-medium text-slate-700">{documentData.fileSize || '3.1 MB'}</span>
              </div>
              <div className="flex justify-between">
                <span>Uploaded:</span>
                <span className="font-medium text-slate-700">{documentData.uploadedAt || '11 Sep 2026'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
