import { ShieldCheck, AlertTriangle, CheckCircle2, ChevronRight, LifeBuoy } from 'lucide-react'

export function SupportSafetyCard({
  profile,
  onViewSupportHistory,
}) {
  if (!profile) return null

  const safety = profile.supportSafety || {}
  const cases = safety.openSupportCases ?? 0
  const disputes = safety.openDisputes ?? 0
  const reports = safety.safetyReports ?? 0
  const restrictions = safety.activeRestrictions || 'None'
  const isClean = cases === 0 && disputes === 0 && reports === 0 && restrictions === 'None'

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <LifeBuoy className="size-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Support & Safety
            </h3>
          </div>
          <button
            type="button"
            onClick={onViewSupportHistory}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 px-2 py-1 rounded-md transition"
          >
            <span>View History</span>
            <ChevronRight className="size-3" />
          </button>
        </div>

        {/* 4 Metrics Grid */}
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {/* Open Support Cases */}
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-500 font-medium truncate">Support Cases</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{cases}</p>
          </div>

          {/* Open Disputes */}
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-500 font-medium truncate">Open Disputes</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{disputes}</p>
          </div>

          {/* Safety Reports */}
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-500 font-medium truncate">Safety Reports</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{reports}</p>
          </div>

          {/* Active Restrictions */}
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-500 font-medium truncate">Restrictions</p>
            <p
              className={`text-xs font-bold mt-1 truncate ${
                restrictions === 'None' ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {restrictions}
            </p>
          </div>
        </div>

        {/* Safety Alert Status Banner */}
        <div className="mt-3">
          {isClean ? (
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-[11.5px]">
                No open safety concerns
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center gap-2 text-xs text-amber-900">
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <span className="font-semibold text-[11.5px]">
                {cases > 0 || disputes > 0
                  ? 'Case under operational inquiry'
                  : `Active restriction: ${restrictions}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={onViewSupportHistory}
          className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 transition py-1.5 rounded-lg hover:bg-purple-50"
        >
          <span>View Support & Safety History</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

