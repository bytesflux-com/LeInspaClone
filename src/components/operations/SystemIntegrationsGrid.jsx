import { Settings, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

export default function SystemIntegrationsGrid({ integrations }) {
  const col1 = [
    { name: 'Payments', status: integrations?.payments || 'Operational', isDegraded: false },
    { name: 'Booking Engine', status: integrations?.bookingEngine || 'Operational', isDegraded: false },
    { name: 'Notifications', status: integrations?.notifications || 'Operational', isDegraded: false },
  ]

  const col2 = [
    { name: 'Maps', status: integrations?.maps || 'Operational', isDegraded: false },
    { name: 'M-PESA Integration', status: integrations?.mpesa || 'Degraded', isDegraded: true },
    { name: 'Email', status: integrations?.email || 'Operational', isDegraded: false },
  ]

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm min-w-0">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Settings className="size-4.5 text-[#5c2dd5]" />
            <h3 className="text-sm font-bold text-gray-900">System &amp; Integrations</h3>
          </div>
          <Link
            to="/system-health"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#5c2dd5] hover:text-[#4922ab] transition-colors"
          >
            <span>View Details</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div className="space-y-2">
            {col1.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-gray-700 truncate">{item.name}</span>
                </div>
                <span className="text-emerald-600 font-semibold text-[11px] whitespace-nowrap">
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {col2.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <span
                    className={`size-2 rounded-full shrink-0 ${
                      item.isDegraded ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-gray-700 truncate">{item.name}</span>
                </div>
                <span
                  className={`font-semibold text-[11px] whitespace-nowrap ${
                    item.isDegraded ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

