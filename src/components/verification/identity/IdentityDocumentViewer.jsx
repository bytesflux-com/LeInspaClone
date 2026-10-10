import { useState } from 'react'
import {
  IdCard,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  CheckCircle2,
  FileText,
  Calendar,
  Building,
  ShieldAlert,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Info,
  Plus,
} from 'lucide-react'

/**
 * ADM-032: IdentityDocumentViewer
 * High-fidelity, interactive document inspection viewer.
 * Includes Front/Back side switcher, canvas zoom/rotate controls,
 * Kenya National ID visual render, and masked data reveal.
 */
export default function IdentityDocumentViewer({
  data,
  onRevealField,
  isRevealingNumber = false,
  isNumberRevealed = false,
}) {
  const [activeSlot, setActiveSlot] = useState('national_id')
  const [activeSide, setActiveSide] = useState('front') // 'front' | 'back'
  const [zoomLevel, setZoomLevel] = useState(100) // 75, 100, 125, 150
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [isFullscreen, setIsFullscreen] = useState(false)

  const doc = data?.document || {}
  const personName = doc.nameOnDoc || data?.name || 'Grace Wanjiku Njeri'
  const isSpa = data?.providerCategory === 'SPA_WELLNESS'
  const isHotel = data?.providerCategory === 'HOTEL_RESORT'

  // Sensitive Field: Masked vs Unmasked
  const displayNumber = isNumberRevealed
    ? doc.docNumberPlain || '1234 5678 4821'
    : doc.docNumberMasked || '•••• •••• 4821'

  const displayDob = doc.dobPlain || '14 Mar 1998'

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 175))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 75))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)
  const handleResetView = () => {
    setZoomLevel(100)
    setRotation(0)
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
      {/* 1. Header & Document Type Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
            <IdCard className="size-4.5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Submitted Document</h3>
            <p className="text-[11px] text-slate-400">High-resolution statutory identification</p>
          </div>
        </div>

        {/* Document Type Selector Tabs */}
        <div className="inline-flex rounded-xl bg-slate-100/80 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => {
              setActiveSlot('national_id')
              setActiveSide('front')
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition cursor-pointer ${
              activeSlot === 'national_id'
                ? 'bg-[#6D28D9] text-white shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>National ID</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeSlot === 'national_id' ? 'bg-purple-800 text-purple-100' : 'bg-slate-200 text-slate-700'
              }`}
            >
              2
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSlot('passport')
              setActiveSide('front')
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition cursor-pointer ${
              activeSlot === 'passport'
                ? 'bg-[#6D28D9] text-white shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>Passport</span>
            <span className="text-[10px] opacity-60">(Optional)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSlot('supporting')
              setActiveSide('front')
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition cursor-pointer ${
              activeSlot === 'supporting'
                ? 'bg-[#6D28D9] text-white shadow-xs'
                : 'hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>Supporting Document</span>
            <span className="text-[10px] opacity-60">(Optional)</span>
          </button>
        </div>
      </div>

      {/* 2. Main 3-Column Inspection Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Thumbnails Strip (Span 2) */}
        <div className="lg:col-span-2 flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {/* Front Side Thumbnail */}
          <button
            type="button"
            onClick={() => setActiveSide('front')}
            className={`relative flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition cursor-pointer shrink-0 w-28 lg:w-full ${
              activeSide === 'front'
                ? 'border-[#6D28D9] bg-purple-50/50 ring-2 ring-purple-600/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="relative w-full h-16 rounded-lg bg-gradient-to-br from-amber-50 to-emerald-50 border border-slate-200/80 flex items-center justify-center overflow-hidden">
              {/* Miniature ID simulation */}
              <div className="text-[7px] text-slate-400 font-bold uppercase tracking-tight scale-75 text-center">
                KENYA ID<br />FRONT
              </div>
              <div className="absolute bottom-1 left-1 size-3 rounded-full bg-slate-300" />
            </div>
            <span className={`text-[11px] font-bold ${activeSide === 'front' ? 'text-[#6D28D9]' : 'text-slate-700'}`}>
              Front Side
            </span>
            <span className="text-[9px] text-slate-400 font-medium">Page 1 of 2</span>
          </button>

          {/* Back Side Thumbnail */}
          <button
            type="button"
            onClick={() => setActiveSide('back')}
            className={`relative flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition cursor-pointer shrink-0 w-28 lg:w-full ${
              activeSide === 'back'
                ? 'border-[#6D28D9] bg-purple-50/50 ring-2 ring-purple-600/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="relative w-full h-16 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/80 flex items-center justify-center overflow-hidden">
              <div className="text-[7px] text-slate-400 font-bold uppercase tracking-tight scale-75 text-center">
                KENYA ID<br />BACK (MRZ)
              </div>
              <div className="absolute bottom-1 right-1 w-6 h-2 bg-slate-200 rounded-xs" />
            </div>
            <span className={`text-[11px] font-bold ${activeSide === 'back' ? 'text-[#6D28D9]' : 'text-slate-700'}`}>
              Back Side
            </span>
            <span className="text-[9px] text-slate-400 font-medium">Page 2 of 2</span>
          </button>

          {/* Add Another Document Placeholder */}
          <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 p-2.5 text-center text-slate-400 shrink-0 w-28 lg:w-full hover:border-purple-300 hover:bg-purple-50/30 transition">
            <Plus className="size-4 text-slate-400" />
            <span className="text-[10px] font-medium leading-tight">
              Add document<br />(0/5 slots)
            </span>
          </div>
        </div>

        {/* CENTER COLUMN: High-Fidelity Canvas Viewer (Span 7) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-slate-200 bg-slate-900/5 overflow-hidden">
          {/* Canvas Top Toolbar */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2 text-slate-700">
            {/* View Meta */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                {activeSlot === 'national_id' ? 'National ID' : activeSlot === 'passport' ? 'Passport' : 'Supporting Doc'} • {activeSide === 'front' ? 'Front Side' : 'Back Side'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeSide === 'front' ? '< 1/2 >' : '< 2/2 >'}
              </span>
            </div>

            {/* Canvas Actions Controls */}
            <div className="flex items-center gap-1">
              {/* Zoom Out */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 75}
                title="Zoom Out"
                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              >
                <ZoomOut className="size-3.5" />
              </button>

              {/* Zoom Pill */}
              <span
                onClick={handleResetView}
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

              {/* Fullscreen Modal Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title="Toggle Expanded View"
                className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              </button>
            </div>
          </div>

          {/* Visual Canvas Display Area */}
          <div className="relative min-h-[380px] flex items-center justify-center p-6 bg-slate-100/70 overflow-hidden">
            {/* Background Texture / Grid lines */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* Document Canvas with Zoom & Rotation applied */}
            <div
              className="transition-transform duration-200 ease-out origin-center"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              }}
            >
              {activeSlot === 'national_id' && activeSide === 'front' && (
                /* ==============================================================
                 * KENYA NATIONAL ID FRONT CANVAS (Realistic Visual Rendering)
                 * ============================================================== */
                <div className="relative w-[480px] h-[300px] rounded-2xl bg-gradient-to-tr from-amber-50 via-emerald-50/40 to-sky-50 p-4 border border-slate-300 shadow-xl overflow-hidden select-none">
                  {/* Subtle Guilloche Pattern Overlay */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(45deg, #059669 0, #059669 1px, transparent 0, transparent 8px)',
                    }}
                  />

                  {/* Kenya Coat of Arms & Header Banner */}
                  <div className="relative flex items-center justify-between border-b border-emerald-700/30 pb-2">
                    {/* Coat of Arms Badge */}
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-amber-600 text-white font-serif font-black text-[9px] shadow-xs">
                        🇰🇪
                      </div>
                      <div>
                        <p className="text-[11px] font-black tracking-wider text-emerald-900 uppercase font-serif">
                          Republic of Kenya
                        </p>
                        <p className="text-[9px] font-extrabold tracking-widest text-slate-700 uppercase">
                          National Identity Card
                        </p>
                      </div>
                    </div>

                    {/* ID Card Flag Strip */}
                    <div className="flex flex-col items-end">
                      <div className="flex h-3 w-10 overflow-hidden rounded-xs border border-slate-400">
                        <span className="w-1/3 bg-black" />
                        <span className="w-1/3 bg-red-600" />
                        <span className="w-1/3 bg-emerald-700" />
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 pt-0.5">SERIAL: 2803144</span>
                    </div>
                  </div>

                  {/* Main ID Content Body */}
                  <div className="relative mt-3 grid grid-cols-12 gap-3">
                    {/* Left Photo & Ghost Watermark (Col span 4) */}
                    <div className="col-span-4 flex flex-col items-center gap-1.5">
                      <div className="relative size-28 rounded-xl border-2 border-emerald-800/40 bg-slate-200 overflow-hidden shadow-sm">
                        <img
                          src={
                            data?.avatarUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
                          }
                          alt="ID Portrait"
                          className="size-full object-cover grayscale contrast-110"
                        />
                        {/* Stamp Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                          <div className="border border-red-800 rounded-full size-16 rotate-12 flex items-center justify-center text-[7px] font-black text-red-800 uppercase">
                            REGISTRAR
                          </div>
                        </div>
                      </div>

                      {/* Ghost Watermark */}
                      <div className="w-16 h-8 rounded-sm bg-emerald-100/50 border border-emerald-300/40 flex items-center justify-center overflow-hidden opacity-60">
                        <span className="text-[8px] font-mono font-bold text-emerald-800">KENYA GHOST</span>
                      </div>
                    </div>

                    {/* Right Identification Fields (Col span 8) */}
                    <div className="col-span-8 space-y-1.5 text-slate-900">
                      {/* ID Number */}
                      <div>
                        <span className="text-[9px] font-bold uppercase text-slate-500">ID NUMBER:</span>
                        <p className="font-mono text-sm font-black tracking-wider text-slate-900">
                          {displayNumber}
                        </p>
                      </div>

                      {/* Full Names */}
                      <div>
                        <span className="text-[9px] font-bold uppercase text-slate-500">FULL NAMES:</span>
                        <p className="text-xs font-black uppercase text-slate-900 tracking-tight leading-tight">
                          {personName}
                        </p>
                      </div>

                      {/* Date of Birth & Sex */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[9px] font-bold uppercase text-slate-500">DATE OF BIRTH:</span>
                          <p className="font-mono text-[11px] font-bold text-slate-900">
                            {displayDob}
                          </p>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold uppercase text-slate-500">SEX:</span>
                          <p className="font-mono text-[11px] font-bold text-slate-900">
                            {doc.sex || (isSpa ? 'F' : isHotel ? 'M' : 'F')}
                          </p>
                        </div>
                      </div>

                      {/* District / County & Nationality */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[9px] font-bold uppercase text-slate-500">DISTRICT OF BIRTH:</span>
                          <p className="text-[11px] font-bold text-slate-800 uppercase">
                            NAIROBI
                          </p>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold uppercase text-slate-500">NATIONALITY:</span>
                          <p className="text-[11px] font-bold text-emerald-900 uppercase">
                            KENYAN
                          </p>
                        </div>
                      </div>

                      {/* Signature graphic simulation */}
                      <div className="pt-1 flex items-center justify-between border-t border-slate-200">
                        <span className="text-[8px] text-slate-400 font-medium">HOLDER&apos;S SIGNATURE</span>
                        <span className="font-serif italic text-xs font-bold text-slate-700 tracking-wide">
                          {personName.split(' ')[0]} {personName.split(' ')[1]?.[0]}.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Microprint Footer */}
                  <div className="absolute bottom-1.5 left-4 right-4 flex items-center justify-between text-[7px] font-mono text-slate-400">
                    <span>NRB-KE-REV-2018</span>
                    <span>OFFICIAL GOVERNMENT OF KENYA DOCUMENT</span>
                  </div>
                </div>
              )}

              {activeSlot === 'national_id' && activeSide === 'back' && (
                /* ==============================================================
                 * KENYA NATIONAL ID BACK CANVAS (MRZ & Biometric Reverse Side)
                 * ============================================================== */
                <div className="relative w-[480px] h-[300px] rounded-2xl bg-gradient-to-tr from-slate-50 via-slate-100 to-amber-50/30 p-4 border border-slate-300 shadow-xl overflow-hidden select-none">
                  {/* Subtle Guilloche Pattern Overlay */}
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(135deg, #475569 0, #475569 1px, transparent 0, transparent 8px)',
                    }}
                  />

                  {/* Back Header */}
                  <div className="relative flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase text-slate-700 tracking-wider">
                        Particulars of Holder & Origin
                      </p>
                      <p className="text-[8px] text-slate-500 font-medium">
                        National Registration Act (Cap. 107 Laws of Kenya)
                      </p>
                    </div>
                    <span className="text-[8px] font-mono font-bold text-slate-400">SIDE 2</span>
                  </div>

                  {/* Administrative Origin Details */}
                  <div className="mt-3 grid grid-cols-12 gap-3 text-xs">
                    {/* Left: Administrative Divisions (Span 7) */}
                    <div className="col-span-7 space-y-1.5 text-slate-800">
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">PROVINCE / COUNTY:</span>
                          <p className="font-semibold">NAIROBI COUNTY</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">DIVISION:</span>
                          <p className="font-semibold">DAGORETTI</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">LOCATION:</span>
                          <p className="font-semibold">KILIMANI</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">SUB-LOCATION:</span>
                          <p className="font-semibold">KILIMANI CENTRAL</p>
                        </div>
                      </div>

                      <div className="pt-1 text-[10px]">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">DATE OF ISSUE:</span>
                        <p className="font-mono font-semibold">{doc.issueDate || '14 Mar 2018'}</p>
                      </div>
                    </div>

                    {/* Right: Thumbprint biometric stamp & Registrar Seal (Span 5) */}
                    <div className="col-span-5 flex flex-col items-center justify-center gap-1 border-l border-slate-200 pl-3">
                      <div className="relative size-18 rounded-lg border border-slate-300 bg-white flex items-center justify-center p-1 shadow-2xs">
                        {/* Fingerprint graphic placeholder */}
                        <div className="size-full rounded-sm border border-dashed border-slate-300 flex items-center justify-center text-[8px] font-mono text-slate-400 text-center">
                          THUMBPRINT<br />VERIFIED
                        </div>
                      </div>
                      <span className="text-[7px] text-slate-400 text-center">PRINCIPAL REGISTRAR SEAL</span>
                    </div>
                  </div>

                  {/* Machine Readable Zone (MRZ Lines) */}
                  <div className="absolute bottom-3 left-4 right-4 rounded-lg bg-white/90 border border-slate-200/90 p-2 font-mono text-[9px] tracking-widest text-slate-900 leading-tight">
                    <p>IDKEN123456784821&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
                    <p>9803140F2803144KEN&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;4</p>
                    <p>NJERI&lt;&lt;GRACE&lt;WANJIKU&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
                  </div>
                </div>
              )}

              {activeSlot === 'passport' && (
                /* ==============================================================
                 * PASSPORT VIEW PLACEHOLDER
                 * ============================================================== */
                <div className="relative w-[480px] h-[300px] rounded-2xl bg-gradient-to-tr from-sky-50 to-blue-50/40 p-5 border border-slate-300 shadow-xl flex flex-col items-center justify-center text-center space-y-2">
                  <div className="size-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FileText className="size-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Kenyan Passport Bio-Data Slot</h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    No passport uploaded by provider. Primary verification fulfilled by Republic of Kenya National ID.
                  </p>
                  <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                    Slot Optional
                  </span>
                </div>
              )}

              {activeSlot === 'supporting' && (
                /* ==============================================================
                 * SUPPORTING DOCUMENT VIEW PLACEHOLDER
                 * ============================================================== */
                <div className="relative w-[480px] h-[300px] rounded-2xl bg-gradient-to-tr from-purple-50 to-slate-50 p-5 border border-slate-300 shadow-xl flex flex-col items-center justify-center text-center space-y-2">
                  <div className="size-12 rounded-full bg-purple-100 text-[#6D28D9] flex items-center justify-center">
                    <FileText className="size-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Supporting Identification Documents</h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Police Clearance Certificate (DCI Good Conduct) or Certified Affidavit slot.
                  </p>
                  <span className="inline-flex rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
                    0 of 3 Uploaded
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Document Details & Sensitive Field Reveal (Span 3) */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-3 rounded-xl border border-slate-200/90 bg-white p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Document Details
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Readable
              </span>
            </div>

            {/* Document Type */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Document Type</span>
              <p className="text-xs font-bold text-slate-900">{doc.type || 'National ID'}</p>
            </div>

            {/* Document Number with Reveal Toggle */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Document Number</span>
                <span className="text-[9px] font-medium text-slate-400">Masked</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-slate-900">
                  {displayNumber}
                </span>

                <button
                  type="button"
                  onClick={() => onRevealField?.('documentNumber')}
                  disabled={isRevealingNumber}
                  className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition cursor-pointer disabled:opacity-50"
                  title="Reveal sensitive unmasked ID number and log access"
                >
                  {isRevealingNumber ? (
                    <span className="size-3 animate-spin rounded-full border border-purple-600 border-t-transparent" />
                  ) : isNumberRevealed ? (
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

            {/* Name on Document */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Name on Document</span>
              <p className="text-xs font-bold text-slate-900 leading-snug">{personName}</p>
            </div>

            {/* Issued By */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Issued By</span>
              <p className="text-xs font-medium text-slate-800">{doc.issuedBy || 'Government of Kenya'}</p>
            </div>

            {/* Issue Date & Expiry */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Issue Date</span>
                <p className="font-medium text-slate-800">{doc.issueDate || '14 Mar 2018'}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Expiry Date</span>
                <p className="font-medium text-slate-800">{doc.expiryDate || 'Not Applicable'}</p>
              </div>
            </div>

            {/* Uploaded Timestamp */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Uploaded</span>
              <p className="text-xs font-medium text-slate-600">{doc.uploadedAt || '12 Sep 2026 • 10:42 AM'}</p>
            </div>
          </div>

          {/* Security & Access Notice */}
          <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[10px] text-slate-400">
            <Info className="size-3 text-purple-600 shrink-0 mt-0.5" />
            <span>ID reveals are cryptographically signed & logged to audit ledger.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
