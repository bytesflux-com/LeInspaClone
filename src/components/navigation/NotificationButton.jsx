import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router'
import Dropdown from '../ui/Dropdown'
import { useAttentionSummary } from '../../hooks/useAttentionSummary'

const PRIORITY_DOT = { critical: 'bg-rose-600', high: 'bg-amber-500', normal: 'bg-slate-400' }

function waited(minutes) {
  if (minutes == null) return null
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return `${Math.floor(minutes / 1440)}d ago`
}

// Real-time alerts = the most urgent open Needs-Your-Attention items (ADM-009).
export default function NotificationButton() {
  const navigate = useNavigate()
  const { summary, items, error } = useAttentionSummary()
  const urgent = (summary?.critical || 0) + (summary?.high || 0)
  const top = items.slice(0, 5)

  return (
    <Dropdown
      menuWidth="w-80"
      trigger={() => (
        <button
          type="button"
          aria-label={urgent ? `Notifications, ${urgent} urgent` : 'Notifications'}
          className="relative flex size-9 items-center justify-center rounded-xl text-[#2a1b57] transition hover:bg-gray-100"
        >
          <Bell className="size-[22px]" />
          {urgent > 0 && (
            <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
              {urgent > 99 ? '99+' : urgent}
            </span>
          )}
        </button>
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-100 p-3">
        <p className="text-xs font-semibold text-royal-950 uppercase tracking-wide">Needs Your Attention</p>
        {summary && (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">{summary.total} open</span>
        )}
      </div>
      <ul className="p-2 space-y-1.5 text-xs">
        {error && !top.length && <li className="p-2.5 text-gray-500">Alerts could not be loaded.</li>}
        {!error && summary && !top.length && <li className="p-2.5 text-gray-500">Nothing needs attention right now.</li>}
        {!summary && !error && <li className="p-2.5 text-gray-400">Loading…</li>}
        {top.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => navigate(`/attention?tab=${item.category}`)}
              className="w-full rounded-xl p-2.5 text-left transition hover:bg-gray-50"
            >
              <p className="flex items-center gap-1.5 font-semibold text-gray-900">
                <span className={`size-1.5 shrink-0 rounded-full ${PRIORITY_DOT[item.priority] || PRIORITY_DOT.normal}`} />
                <span className="truncate">{item.title}</span>
              </p>
              {item.description && <p className="mt-0.5 line-clamp-2 text-gray-500">{item.description}</p>}
              <p className="mt-1 text-[10px] text-gray-400">{[item.market, waited(item.waitingMinutes)].filter(Boolean).join(' · ')}</p>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => navigate('/attention')}
        className="w-full border-t border-gray-100 p-2.5 text-center text-xs font-semibold text-royal-700 hover:bg-gray-50"
      >
        View all
      </button>
    </Dropdown>
  )
}
