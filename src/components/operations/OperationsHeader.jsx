import { RefreshCw } from 'lucide-react'

export default function OperationsHeader({ onRefresh, refreshing = false }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
          Operations Center
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Monitor live activity, risks and tasks requiring attention across Lé Inspa.
        </p>
      </div>

      {/* Right Controls: Live status badge, timestamp & refresh */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-3 py-1.5 shadow-xs">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-900">Live</span>
          <span className="text-[11px] text-gray-400">· Last updated: Just now</span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex size-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-xs hover:bg-gray-50 hover:text-gray-900 transition disabled:opacity-60"
          title="Refresh operations queue"
          aria-label="Refresh telemetry"
        >
          <RefreshCw className={`size-4 ${refreshing ? 'animate-spin text-[#5c2dd5]' : ''}`} />
        </button>
      </div>
    </div>
  )
}

