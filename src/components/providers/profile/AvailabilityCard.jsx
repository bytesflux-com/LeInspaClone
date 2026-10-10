import { Clock, Calendar, MapPin, Radio, Compass, ChevronRight } from 'lucide-react'

export function AvailabilityCard({
  profile,
  onViewSchedule,
  onShowToast,
}) {
  if (!profile) return null

  const avail = profile.availability || {}

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Radio className="size-4 animate-pulse" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Availability</h3>
          </div>
          <button
            type="button"
            onClick={onViewSchedule}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 px-2 py-1 rounded-md transition"
          >
            View Schedule
          </button>
        </div>

        {/* Status Pill */}
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="size-2 rounded-full bg-emerald-500 -ml-3.5" />
            <span>{avail.statusLabel || 'Available Now'}</span>
          </span>
        </div>

        {/* Telemetry Grid */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Next Available */}
          <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <Clock className="size-4 text-purple-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Next Available</p>
              <p className="font-bold text-slate-900 text-xs">
                {avail.nextAvailable || 'Today • 3:30 PM'}
              </p>
            </div>
          </div>

          {/* This Week */}
          <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <Calendar className="size-4 text-purple-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 font-medium">This Week</p>
              <p className="font-bold text-slate-900 text-xs">
                {avail.thisWeekSlots || '18 available slots'}
              </p>
            </div>
          </div>
        </div>

        {/* Service Area + Visual Radius Mini-Map */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
              <MapPin className="size-3.5 text-rose-500" />
              <span>Service Area</span>
            </div>
            <p className="font-bold text-slate-800 text-xs truncate">
              {avail.serviceArea || 'Nairobi • 15 km travel radius'}
            </p>
            <p className="text-[10px] text-slate-400">
              Live GPS geofence enabled
            </p>
          </div>

          {/* Mini Graphical Vector Map with Radius */}
          <div className="relative size-20 rounded-xl overflow-hidden border border-purple-200/90 bg-linear-to-br from-purple-50 via-slate-50 to-indigo-50 shrink-0 shadow-2xs flex items-center justify-center">
            {/* Grid street lines simulated with SVG */}
            <svg
              className="absolute inset-0 size-full stroke-slate-200/80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 20 H80 M0 40 H80 M0 60 H80" strokeWidth="0.75" />
              <path d="M20 0 V80 M40 0 V80 M60 0 V80" strokeWidth="0.75" />
              <path d="M10 70 Q40 50 70 10" stroke="#cbd5e1" strokeWidth="1.5" />
              <path d="M5 25 Q35 45 75 65" stroke="#cbd5e1" strokeWidth="1.2" />
            </svg>

            {/* Travel Radius Circle */}
            <div className="absolute size-14 rounded-full border-2 border-purple-500/70 bg-purple-500/15 animate-pulse" />
            <div className="absolute size-10 rounded-full border border-purple-400/40 bg-purple-600/10" />

            {/* Center Pin Marker */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="size-3 rounded-full bg-purple-700 border-2 border-white shadow-xs" />
              <span className="text-[7.5px] font-black text-purple-900 tracking-tighter uppercase mt-0.5 bg-white/90 px-1 rounded shadow-2xs">
                Nairobi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={onViewSchedule}
          className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 transition py-1.5 rounded-lg hover:bg-purple-50"
        >
          <span>Open Real-Time Schedule</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

