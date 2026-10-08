import { Activity, CalendarCheck, UserCheck, BadgeDollarSign, ShieldAlert, UserPlus, ArrowRight, Radio } from 'lucide-react'
import { Link } from 'react-router'
import Badge from '../../ui/Badge'
import CountryFlag from '../../ui/CountryFlag'

function getOperationVisuals(type) {
  switch (type) {
    case 'booking':
      return {
        icon: CalendarCheck,
        bg: 'bg-purple-50 text-purple-700 border-purple-100',
      }
    case 'provider':
      return {
        icon: UserCheck,
        bg: 'bg-blue-50 text-blue-700 border-blue-100',
      }
    case 'withdrawal':
      return {
        icon: BadgeDollarSign,
        bg: 'bg-amber-50 text-amber-800 border-amber-100',
      }
    case 'safety':
      return {
        icon: ShieldAlert,
        bg: 'bg-rose-50 text-rose-700 border-rose-100',
      }
    case 'dispute':
      return {
        icon: ShieldAlert,
        bg: 'bg-amber-50 text-amber-900 border-amber-200',
      }
    case 'client':
    default:
      return {
        icon: UserPlus,
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      }
  }
}

export function MarketLiveActivity({ operations = [], marketName = 'Kenya', marketCode = 'KE' }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
      <div>
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="size-4.5 text-royal-700 animate-pulse" />
            <h3 className="text-base font-bold text-royal-950">Recent Market Activity</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <CountryFlag code={marketCode} className="w-4.5 h-3" />
            <Badge variant="royal" size="sm">{marketName} Stream</Badge>
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Live telemetry stream scoped to sovereign country events
        </p>

        <div className="mt-4 space-y-3">
          {operations.map((item) => {
            const visuals = getOperationVisuals(item.type)
            const Icon = visuals.icon

            return (
              <div key={item.id} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 transition hover:bg-royal-50/20">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg border ${visuals.bg}`}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-royal-950 truncate">{item.title}</p>
                    {item.amount && (
                      <span className="text-xs font-bold text-emerald-700 font-mono">{item.amount}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">{item.subtitle}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.meta}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-3">
        <Link
          to="/operations"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-royal-100 bg-royal-50/60 py-2.5 text-xs font-semibold text-royal-800 hover:bg-royal-100/80 transition-colors"
        >
          <span>Open Full Operations Stream</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}
export default MarketLiveActivity
