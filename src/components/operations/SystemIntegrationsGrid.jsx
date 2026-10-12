import { Settings, ArrowRight } from 'lucide-react'

export default function SystemIntegrationsGrid({ integrations }) {
  // Statuses come from the backend; integrations without live monitoring are reported as such.
  const list = Array.isArray(integrations) ? integrations : []
  const half = Math.ceil(list.length / 2)
  const col1 = list.slice(0, half)
  const col2 = list.slice(half)

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm min-w-0">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Settings className="size-4.5 text-[#5c2dd5]" />
            <h3 className="text-sm font-bold text-gray-900">System &amp; Integrations</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div className="space-y-2">
            {col1.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <span className={`size-2 rounded-full shrink-0 ${item.status === 'Operational' ? 'bg-emerald-500' : item.isDegraded ? 'bg-amber-500' : 'bg-gray-300'}`} />
                  <span className="text-gray-700 truncate">{item.name}</span>
                </div>
                <span className={`font-semibold text-[11px] whitespace-nowrap ${item.status === 'Operational' ? 'text-emerald-600' : 'text-gray-500'}`}>
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
                      item.isDegraded ? 'bg-amber-500 animate-pulse' : item.status === 'Operational' ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  />
                  <span className="text-gray-700 truncate">{item.name}</span>
                </div>
                <span
                  className={`font-semibold text-[11px] whitespace-nowrap ${
                    item.isDegraded ? 'text-amber-600' : item.status === 'Operational' ? 'text-emerald-600' : 'text-gray-500'
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

