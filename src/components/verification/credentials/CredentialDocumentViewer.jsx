import { useState } from 'react'
import {
  FileText,
  Award,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  Building2,
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'

/**
 * ADM-033: CredentialDocumentViewer
 * Interactive certificate inspection workstation with page previews,
 * high-fidelity certificate canvas rendering, zoom/rotate toolbar, and credential metadata.
 */
export default function CredentialDocumentViewer({
  credential,
  onRevealNumber,
}) {
  const [activePage, setActivePage] = useState(1) // 1 | 2
  const [zoomLevel, setZoomLevel] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)

  if (!credential) return null

  const pageCount = credential.pageCount || 2
  const docNumber = isRevealed
    ? credential.unmaskedNumber || 'KMF-2024-7281'
    : credential.credentialNumber || '••••7281'

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 175))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 75))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)
  const handleReset = () => {
    setZoomLevel(100)
    setRotation(0)
  }

  const handleToggleReveal = () => {
    setIsRevealed(!isRevealed)
    onRevealNumber?.(!isRevealed)
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
      {/* 1. Header with Filename & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
            <Award className="size-4.5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">{credential.title}</h3>
              <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 font-mono">
                PDF
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{credential.subtitle || 'Statutory Qualification'}</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
            <span className="size-2 rounded-full bg-purple-600 animate-pulse" />
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
            <div className="relative w-full h-16 rounded-lg bg-gradient-to-b from-amber-50 to-white border border-slate-200/80 flex items-center justify-center overflow-hidden p-1 shadow-2xs">
              <div className="text-[7px] text-slate-400 font-serif uppercase tracking-tight text-center leading-tight">
                CERTIFICATE<br />PAGE 1
              </div>
              <div className="absolute bottom-1 right-1 size-3 rounded-full bg-amber-400/60" />
            </div>
            <span className={`text-[11px] font-bold ${activePage === 1 ? 'text-[#6D28D9]' : 'text-slate-700'}`}>
              Page 1
            </span>
            <span className="text-[9px] text-slate-400">Award Certificate</span>
          </button>

          {/* Page 2 Thumbnail */}
          {pageCount > 1 && (
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
                <div className="text-[7px] text-slate-400 font-mono uppercase tracking-tight text-center leading-tight">
                  TRANSCRIPT<br />PAGE 2
                </div>
                <div className="absolute bottom-1 left-1 w-5 h-1.5 bg-slate-200 rounded-xs" />
              </div>
              <span className={`text-[11px] font-bold ${activePage === 2 ? 'text-[#6D28D9]' : 'text-slate-700'}`}>
                Page 2
              </span>
              <span className="text-[9px] text-slate-400">Clinical Practicum</span>
            </button>
          )}
        </div>

        {/* CENTER COLUMN: Interactive Canvas Area (Span 7) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-slate-200 bg-slate-900/5 overflow-hidden">
          {/* Top Canvas Toolbar */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2 text-slate-700">
            {/* Meta */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800 font-mono truncate max-w-[190px]">
                {credential.fileName || 'Professional_Practice_Certificate.pdf'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                (Page {activePage} of {pageCount})
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {/* Page Nav */}
              <button
                type="button"
                onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                disabled={activePage === 1}
                title="Previous Page"
                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setActivePage((p) => Math.min(pageCount, p + 1))}
                disabled={activePage === pageCount}
                title="Next Page"
                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition cursor-pointer"
              >
                <ChevronRight className="size-3.5" />
              </button>

              {/* Zoom Out */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 75}
                title="Zoom Out"
                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer ml-1"
              >
                <ZoomOut className="size-3.5" />
              </button>

              {/* Zoom Reset Pill */}
              <span
                onClick={handleReset}
                title="Click to reset zoom"
                className="inline-flex min-w-[50px] items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-mono font-bold text-slate-700 cursor-pointer hover:bg-slate-200"
              >
                {zoomLevel}%
              </span>

              {/* Zoom In */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 175}
                title="Zoom In"
                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              >
                <ZoomIn className="size-3.5" />
              </button>

              {/* Rotate Button */}
              <button
                type="button"
                onClick={handleRotate}
                title="Rotate 90° Clockwise"
                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer ml-1"
              >
                <RotateCw className="size-3.5" />
              </button>

              {/* Maximize */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title="Toggle Fullscreen"
                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              </button>
            </div>
          </div>

          {/* Certificate Canvas Area */}
          <div className="relative min-h-[420px] flex items-center justify-center p-6 bg-slate-100/70 overflow-hidden">
            {/* Grid texture */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* Transform Container */}
            <div
              className="transition-transform duration-200 ease-out origin-center"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              }}
            >
              {activePage === 1 ? (
                /* ==============================================================
                 * CERTIFICATE OF COMPETENCY (PAGE 1 CANVAS)
                 * ============================================================== */
                <div className="relative w-[500px] h-[350px] rounded-xl bg-gradient-to-b from-amber-50/70 via-white to-amber-50/50 p-5 border-4 border-double border-amber-800/40 shadow-2xl overflow-hidden select-none">
                  {/* Guilloche border accent */}
                  <div className="absolute inset-2 border border-amber-700/20 rounded-lg pointer-events-none" />

                  {/* Header Crest */}
                  <div className="text-center space-y-1">
                    <div className="inline-flex size-10 items-center justify-center rounded-full bg-amber-700 text-white font-serif font-black text-sm shadow-md">
                      🏛
                    </div>
                    <h2 className="text-[13px] font-black uppercase tracking-widest text-amber-950 font-serif">
                      Kenya Massage Federation
                    </h2>
                    <p className="text-[9px] uppercase tracking-wider text-slate-600 font-semibold">
                      Board of Professional Accreditation & Sovereign Standards
                    </p>
                    <div className="w-24 h-0.5 bg-amber-700/40 mx-auto mt-1" />
                  </div>

                  {/* Certificate Body */}
                  <div className="mt-3 text-center space-y-1 text-slate-800">
                    <p className="text-[9px] uppercase font-serif tracking-widest text-slate-500">
                      This is to certify that
                    </p>
                    <p className="text-base font-black font-serif text-slate-950 underline decoration-amber-600/40 underline-offset-4 tracking-wide">
                      {credential.nameOnDoc || 'Grace W. Njeri'}
                    </p>
                    <p className="text-[9px] text-slate-600 max-w-sm mx-auto leading-relaxed pt-1">
                      has successfully satisfied all rigorous theoretical examinations, clinical practicums, and code of ethics to be officially conferred the title of
                    </p>
                    <p className="text-xs font-black uppercase tracking-wider text-amber-900 font-serif pt-0.5">
                      Certified Professional Massage Therapist
                    </p>
                  </div>

                  {/* Footer Credentials & Signatures */}
                  <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-xs">
                    {/* Left: Registrar Signature */}
                    <div className="text-left space-y-0.5">
                      <p className="font-serif italic text-xs text-slate-800 font-bold">Dr. Joseph Kimani</p>
                      <div className="w-24 h-px bg-slate-400" />
                      <p className="text-[8px] uppercase tracking-wider text-slate-500 font-medium">Registrar General</p>
                      <p className="text-[8px] font-mono text-slate-400">Issued: {credential.issueDate || '15 Jan 2024'}</p>
                    </div>

                    {/* Center: Gold Foil Stamp Emblem */}
                    <div className="relative flex flex-col items-center">
                      <div className="size-14 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center border-2 border-amber-300 shadow-md">
                        <div className="size-11 rounded-full border border-amber-800/40 flex items-center justify-center text-[7px] font-black uppercase text-amber-950 text-center leading-tight">
                          OFFICIAL<br />SEAL
                        </div>
                      </div>
                      <span className="text-[7px] font-mono text-slate-400 mt-0.5">{docNumber}</span>
                    </div>

                    {/* Right: Board Chairman */}
                    <div className="text-right space-y-0.5">
                      <p className="font-serif italic text-xs text-slate-800 font-bold">Wanjohi Ndegwa</p>
                      <div className="w-24 h-px bg-slate-400 ml-auto" />
                      <p className="text-[8px] uppercase tracking-wider text-slate-500 font-medium">Board Chairman</p>
                      <p className="text-[8px] font-mono text-slate-400">Valid Thru: {credential.expiryDate || '15 Jan 2028'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* ==============================================================
                 * PRACTICUM & TRANSCRIPT (PAGE 2 CANVAS)
                 * ============================================================== */
                <div className="relative w-[500px] h-[350px] rounded-xl bg-white p-5 border border-slate-300 shadow-2xl overflow-hidden select-none space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-900 uppercase">Clinical Modules & Hours Record</p>
                      <p className="text-[8px] text-slate-500 font-mono">ID: {docNumber} • Candidate: {credential.nameOnDoc || 'Grace W. Njeri'}</p>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-xs font-bold">
                      CREDITS CLEARED
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700 font-medium">Anatomy, Physiology & Musculoskeletal Kinesiology</span>
                      <span className="font-mono font-bold text-slate-900">120 Hours (Grade A)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700 font-medium">Swedish & Deep Tissue Manual Therapy Techniques</span>
                      <span className="font-mono font-bold text-slate-900">150 Hours (Grade A)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700 font-medium">Sports Massage & Myofascial Release Rehabilitation</span>
                      <span className="font-mono font-bold text-slate-900">100 Hours (Grade A-)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700 font-medium">Sanitation, Hygiene & Client Safety Protocols</span>
                      <span className="font-mono font-bold text-slate-900">80 Hours (Pass)</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2 border border-slate-200 text-[9px] text-slate-600 flex items-center justify-between mt-4">
                    <span>Total Clinical Practicum Verified: <strong>450 Hours</strong></span>
                    <span className="font-mono text-emerald-700 font-bold">CERTIFICATE STATUS: FULL CONFERRAL</span>
                  </div>

                  <div className="text-[8px] text-slate-400 font-mono text-center pt-2">
                    RECORDS ARCHIVED UNDER SOVEREIGN VOCATIONAL REGISTRATION NRB-MED-2024
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Credential Details Card (Span 3) */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-3 rounded-xl border border-slate-200/90 bg-white p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Credential Metadata
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Readable
              </span>
            </div>

            {/* Credential Name */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Credential Name</span>
              <p className="text-xs font-bold text-slate-900">{credential.credentialName || credential.title}</p>
            </div>

            {/* Credential Number with Reveal */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Credential Number</span>
                <span className="text-[9px] font-medium text-slate-400">Masked</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-slate-900">
                  {docNumber}
                </span>

                <button
                  type="button"
                  onClick={handleToggleReveal}
                  className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition cursor-pointer"
                  title="Toggle unmasked credential registration number"
                >
                  {isRevealed ? (
                    <>
                      <EyeOff className="size-3 text-purple-600" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="size-3 text-purple-600" />
                      <span>Reveal</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Name on Credential */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Name on Credential</span>
              <p className="text-xs font-bold text-slate-900 leading-snug">{credential.nameOnDoc || 'Grace W. Njeri'}</p>
            </div>

            {/* Issuing Institution */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Issuing Institution</span>
              <p className="text-xs font-medium text-slate-800">{credential.issuer || 'Kenya Massage Federation'}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                <CheckCircle2 className="size-3 text-emerald-600" />
                <span>Recognized Institution</span>
              </span>
            </div>

            {/* Issue Date & Expiry */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Issue Date</span>
                <p className="font-medium text-slate-800">{credential.issueDate || '15 Jan 2024'}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Expiry Date</span>
                <p className="font-medium text-slate-800">{credential.expiryDate || '15 Jan 2028'}</p>
              </div>
            </div>

            {/* Uploaded */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Uploaded</span>
              <p className="text-xs font-medium text-slate-600">{credential.uploadedAt || '12 Sep 2026 • 10:42 AM'}</p>
            </div>
          </div>

          {/* Audit Notice */}
          <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[10px] text-slate-400">
            <Info className="size-3 text-purple-600 shrink-0 mt-0.5" />
            <span>Licensing numbers verified with accredited registry records.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
