import { useState } from 'react'
import { Building2, Clock, Globe, ShieldCheck, UserCheck, Settings, AlertCircle, X } from 'lucide-react'
import CountryFlag from '../../ui/CountryFlag'
import Badge from '../../ui/Badge'
import Button from '../../ui/Button'

export function MarketHeaderStatus({ context, canManageMarket }) {
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  if (!context) return null

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
        {/* Left: Market identity */}
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/80 p-2 shadow-2xs">
            <CountryFlag code={context.marketCode} className="h-8 w-11 rounded-xs" />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-royal-950 sm:text-2xl">
                {context.marketName} Market Operations
              </h1>
              <Badge variant="success" dot dotColor="bg-emerald-500">
                {context.status || 'Active'}
              </Badge>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1 font-medium text-gray-700">
                <Globe className="size-3.5 text-royal-600" />
                Currency: <strong className="text-royal-950">{context.currency} ({context.currencySymbol})</strong>
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 text-gray-400" />
                Timezone: {context.timeZone}
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                <Building2 className="size-3.5 text-gray-400" />
                Coverage: {context.totalCities} Sovereign Cities
              </span>
            </div>
          </div>
        </div>

        {/* Right: Country Manager & Actions */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Country Manager Info */}
          <div className="hidden sm:flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-royal-100 text-royal-800 font-bold text-xs">
              {context.countryManager?.name
                ? context.countryManager.name.split(' ').map((n) => n[0]).join('')
                : 'CM'}
            </div>
            <div className="text-xs">
              <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                <UserCheck className="size-3 text-emerald-600" />
                Country Manager
              </div>
              <div className="font-semibold text-royal-950">{context.countryManager?.name || 'Unassigned'}</div>
            </div>
          </div>

          {/* Market Settings Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettingsModal(true)}
            className="border-gray-200 hover:border-royal-300 hover:bg-royal-50/50 hover:text-royal-900"
          >
            <Settings className="size-3.5 text-gray-500" />
            <span>Market Settings</span>
            {!canManageMarket && (
              <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                View Only
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Modal Dialog */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <CountryFlag code={context.marketCode} className="w-5 h-3.5" />
                <h3 className="text-base font-bold text-royal-950">{context.marketName} Market Configuration</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl bg-gray-50 p-3 space-y-2 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Market Code:</span>
                  <span className="font-mono font-semibold text-royal-950">{context.marketCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Legal Currency:</span>
                  <span className="font-semibold text-royal-950">{context.currency} ({context.currencySymbol})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Default Timezone:</span>
                  <span className="font-semibold text-royal-950">{context.timeZone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone Code:</span>
                  <span className="font-semibold text-royal-950">{context.phonePrefix}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Assigned Lead:</span>
                  <span className="font-semibold text-royal-950">{context.countryManager?.name}</span>
                </div>
              </div>

              {!canManageMarket ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-amber-900">
                  <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Restricted Permission</strong>
                    <p className="mt-0.5 text-[11px] text-amber-800">
                      You are viewing market configuration in read-only mode. Modifying legal entity parameters requires <code className="font-mono text-amber-950 font-bold">markets.manage</code> permission.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-emerald-900">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Authorized Administrative Access</strong>
                    <p className="mt-0.5 text-[11px] text-emerald-800">
                      You have full authority to update sovereign tax rules, payment rail routing, and city dispatch boundaries.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSettingsModal(false)}>
                Close
              </Button>
              {canManageMarket && (
                <Button variant="primary" size="sm" onClick={() => setShowSettingsModal(false)}>
                  Save Market Overrides
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
export default MarketHeaderStatus
