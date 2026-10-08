import { CheckCircle2, RefreshCw } from 'lucide-react'
import { useAdminSession } from '../../hooks/useAdminSession'

export default function DashboardHeader({ onRefresh, refreshing = false }) {
  const { admin } = useAdminSession()
  const firstName = admin?.fullName?.split(' ')[0] || 'Wallen'

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-4">
      {/* Left Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-royal-950 flex items-center gap-2.5">
          <span>Good afternoon, {firstName}</span>
          <span className="inline-flex items-center text-amber-500 hover:rotate-12 transition-transform cursor-default" title="Hello!">
            <svg
              className="size-6 sm:size-7 fill-amber-400 stroke-amber-600 stroke-[1.2]"
              viewBox="0 0 24 24"
              aria-label="waving hand"
            >
              <path d="M18.5 11a1.5 1.5 0 0 0-1.5-1.5v-3a1.5 1.5 0 0 0-3 0v3a1.5 1.5 0 0 0-3 0V4.5a1.5 1.5 0 0 0-3 0v8a1.5 1.5 0 0 0-3 0v-2a1.5 1.5 0 0 0-3 0v6.5a7 7 0 0 0 7 7h1a7 7 0 0 0 7-7v-5Z" />
            </svg>
          </span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Here's what's happening across Lé Inspa today.
        </p>
      </div>

      {/* Right Status Badge & Decorative Watermark */}
      <div className="flex items-center gap-6">
        {/* Core Systems Operational Box */}
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200/90 bg-white px-4 py-2.5 shadow-xs">
          <span className="flex size-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <p className="text-xs font-bold text-gray-900 leading-tight">All Core Systems Operational</p>
            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">Last checked: 2 minutes ago</p>
          </div>
        </div>

        {/* Decorative Brand Watermark */}
        <div className="hidden lg:flex items-center gap-2 select-none pr-2 opacity-85">
          <div className="text-right">
            <span className="font-display italic text-lg text-royal-900 font-semibold tracking-wide">
              Wellness Without Limits
            </span>
          </div>
          <svg viewBox="0 0 64 40" fill="none" className="size-8 text-royal-300/60" aria-hidden="true">
            <g fill="currentColor">
              <path d="M32 2c5 6 7.5 13 7.5 19S36.5 33 32 38c-4.5-5-7.5-11-7.5-17S27 8 32 2z" />
              <path d="M30 38C22 36 16 30 14 21c-.8-3.5-.8-7 .2-10.5 6 3.5 10.5 9 13 16 1.4 3.8 2.3 7.6 2.8 11.5z" opacity=".8" />
              <path d="M34 38c8-2 14-8 16-17 .8-3.5.8-7-.2-10.5-6 3.5-10.5 9-13 16-1.4 3.8-2.3 7.6-2.8 11.5z" opacity=".8" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}
