import { useState } from 'react'
import { TrendingUp, Activity, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react'
import Badge from '../../ui/Badge'
import { formatCompactCurrency } from '../../../lib/currency'

export function MarketHealthAndChart({ performance, marketHealth, marketName = 'Kenya', currency = 'KES' }) {
  const [activeTab, setActiveTab] = useState('revenue') // 'revenue' | 'bookings' | 'clients' | 'providers'

  if (!performance || !marketHealth) return null

  const chartPoints = performance.chartPoints || []
  const maxRevenue = Math.max(...chartPoints.map((p) => p.revenue || 0), 1)
  const maxBookings = Math.max(...chartPoints.map((p) => p.bookings || 0), 1)
  const maxClients = Math.max(...chartPoints.map((p) => p.clients || 0), 1)
  const maxProviders = Math.max(...chartPoints.map((p) => p.providers || 0), 1)

  const getMaxValue = () => {
    switch (activeTab) {
      case 'revenue': return maxRevenue
      case 'bookings': return maxBookings
      case 'clients': return maxClients
      case 'providers': return maxProviders
      default: return maxRevenue
    }
  }

  const getPointValue = (p) => {
    switch (activeTab) {
      case 'revenue': return p.revenue || 0
      case 'bookings': return p.bookings || 0
      case 'clients': return p.clients || 0
      case 'providers': return p.providers || 0
      default: return p.revenue || 0
    }
  }

  const formatPointValue = (val) => {
    if (activeTab === 'revenue') return formatCompactCurrency(val, currency)
    return val.toLocaleString('en-US')
  }

  const maxVal = getMaxValue()

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
      {/* 30-Day Growth Chart (8 Cols) */}
      <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-royal-950">Market Growth Trajectory</h3>
              <Badge variant="success" size="sm">
                <TrendingUp className="size-3" />
                {performance.growthPercentage || '+16.8% MoM'}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              30-day telemetry performance for {marketName}
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 text-xs font-medium">
            {[
              { id: 'revenue', label: 'Revenue' },
              { id: 'bookings', label: 'Bookings' },
              { id: 'clients', label: 'Clients' },
              { id: 'providers', label: 'Providers' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-white text-royal-950 shadow-xs'
                    : 'text-gray-600 hover:text-royal-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="mt-6 flex h-52 items-end justify-between gap-3 px-2">
          {chartPoints.map((point, i) => {
            const val = getPointValue(point)
            const heightPercent = Math.max(10, Math.round((val / maxVal) * 100))

            return (
              <div key={i} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                {/* Tooltip on Hover */}
                <div className="absolute -top-9 z-10 hidden rounded-lg bg-royal-950 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg group-hover:block whitespace-nowrap">
                  {point.date}: {formatPointValue(val)}
                </div>

                {/* Bar element */}
                <div
                  className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 ${
                    activeTab === 'revenue'
                      ? 'bg-gradient-to-t from-purple-700 to-royal-600 group-hover:from-purple-800 group-hover:to-royal-500'
                      : activeTab === 'bookings'
                      ? 'bg-gradient-to-t from-blue-600 to-cyan-500 group-hover:from-blue-700 group-hover:to-cyan-400'
                      : activeTab === 'clients'
                      ? 'bg-gradient-to-t from-emerald-600 to-teal-500 group-hover:from-emerald-700 group-hover:to-teal-400'
                      : 'bg-gradient-to-t from-amber-600 to-orange-500 group-hover:from-amber-700 group-hover:to-orange-400'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                <span className="mt-2 text-[10px] font-medium text-gray-400">{point.date}</span>
              </div>
            )
          })}
        </div>

        {/* Footer Summary */}
        <div className="mt-4 flex flex-wrap items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
          <span>
            Current Period GBV: <strong className="text-royal-950">{formatCompactCurrency(performance.currentPeriodGbv, currency)}</strong>
          </span>
          <span>
            Previous Period GBV: <strong className="text-gray-700">{formatCompactCurrency(performance.previousPeriodGbv, currency)}</strong>
          </span>
        </div>
      </div>

      {/* 6-Dimensional Market Health Overview Widget (4 Cols) */}
      <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="size-4.5 text-royal-700" />
              <h3 className="text-base font-bold text-royal-950">Market Health Index</h3>
            </div>
            <Badge
              variant={
                marketHealth.status === 'Healthy'
                  ? 'success'
                  : marketHealth.status === 'Attention'
                  ? 'warning'
                  : 'danger'
              }
              dot
              dotColor={
                marketHealth.status === 'Healthy'
                  ? 'bg-emerald-500'
                  : marketHealth.status === 'Attention'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }
            >
              {marketHealth.status} ({marketHealth.overallScore}/100)
            </Badge>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Real-time multi-vector operational audit for {marketName}
          </p>

          {/* Health Metrics List */}
          <div className="mt-4 space-y-3">
            {marketHealth.metrics?.map((m) => {
              const isGood = m.score >= 85
              const isWarning = m.score >= 70 && m.score < 85

              return (
                <div key={m.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800">{m.name}</span>
                    <span
                      className={`font-bold ${
                        isGood ? 'text-emerald-700' : isWarning ? 'text-amber-700' : 'text-rose-600'
                      }`}
                    >
                      {m.value}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${m.score}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">{m.score}/100</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-3 text-[11px] text-gray-400 flex items-center justify-between">
          <span>SLAs re-evaluated every 5 minutes</span>
          <ShieldCheck className="size-3.5 text-emerald-600" />
        </div>
      </div>
    </div>
  )
}
export default MarketHealthAndChart
