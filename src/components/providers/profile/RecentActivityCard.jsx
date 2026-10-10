import { History, ChevronRight } from 'lucide-react'

export function RecentActivityCard({
  profile,
  onViewAllActivity,
}) {
  if (!profile) return null

  const activities = profile.recentActivity || [
    { time: 'Today • 11:42 AM', action: 'Provider logged in' },
    { time: 'Today • 10:15 AM', action: 'Availability updated' },
    { time: 'Yesterday • 4:30 PM', action: 'Booking #LI-48291 confirmed' },
    { time: '10 Sep • 2:18 PM', action: 'Profile photo submitted for review' },
  ]

  const preview = activities.slice(0, 4)

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <History className="size-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Activity</h3>
          </div>
          <button
            type="button"
            onClick={onViewAllActivity}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 px-2 py-1 rounded-md transition"
          >
            <span>View All</span>
            <ChevronRight className="size-3" />
          </button>
        </div>

        {/* Timeline List */}
        <div className="mt-3 relative pl-4 space-y-3 text-xs before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-100">
          {preview.map((item, idx) => (
            <div key={idx} className="relative group">
              {/* Dot */}
              <div className="absolute -left-4 top-1 size-2 rounded-full bg-purple-600 ring-4 ring-white" />
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block leading-tight">
                  {item.time}
                </span>
                <span className="font-medium text-slate-800 text-[11.5px] leading-snug">
                  {item.action}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={onViewAllActivity}
          className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 transition py-1.5 rounded-lg hover:bg-purple-50"
        >
          <span>View Full Activity Audit</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

