import { TrendingUp, TrendingDown, DollarSign, CalendarCheck, Users, UserCheck, CreditCard } from 'lucide-react'
import { formatCompactCurrency, formatCurrency } from '../../../lib/currency'

export function MarketKPIs({ metrics, currency = 'KES', currencySymbol = 'KSh' }) {
  if (!metrics) return null

  const items = [
    {
      id: 'gbv',
      title: 'Gross Booking Value',
      raw: metrics.gbv?.raw,
      formatted: metrics.gbv?.formatted || formatCompactCurrency(metrics.gbv?.raw, currency),
      trend: metrics.gbv?.trend || '+16.8%',
      isPositive: true,
      period: metrics.gbv?.period || 'vs. last month',
      previous: metrics.gbv?.previous ? formatCompactCurrency(metrics.gbv.previous, currency) : null,
      icon: DollarSign,
      iconBg: 'bg-purple-50 text-purple-700',
    },
    {
      id: 'revenue',
      title: 'Platform Revenue',
      raw: metrics.revenue?.raw,
      formatted: metrics.revenue?.formatted || formatCompactCurrency(metrics.revenue?.raw, currency),
      trend: metrics.revenue?.trend || '+19.2%',
      isPositive: true,
      period: metrics.revenue?.period || 'vs. last month',
      previous: metrics.revenue?.previous ? formatCompactCurrency(metrics.revenue.previous, currency) : null,
      icon: CreditCard,
      iconBg: 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'bookings',
      title: 'Total Bookings',
      raw: metrics.bookings?.raw,
      formatted: metrics.bookings?.formatted || metrics.bookings?.raw?.toLocaleString('en-US'),
      trend: metrics.bookings?.trend || '+14.1%',
      isPositive: true,
      period: metrics.bookings?.period || 'vs. last month',
      previous: metrics.bookings?.previous ? metrics.bookings.previous.toLocaleString('en-US') : null,
      icon: CalendarCheck,
      iconBg: 'bg-blue-50 text-blue-700',
    },
    {
      id: 'clients',
      title: 'Active Clients',
      raw: metrics.clients?.raw,
      formatted: metrics.clients?.formatted || metrics.clients?.raw?.toLocaleString('en-US'),
      trend: metrics.clients?.trend || '+12.5%',
      isPositive: true,
      period: metrics.clients?.period || 'vs. last month',
      previous: metrics.clients?.previous ? metrics.clients.previous.toLocaleString('en-US') : null,
      icon: Users,
      iconBg: 'bg-indigo-50 text-indigo-700',
    },
    {
      id: 'providers',
      title: 'Active Providers',
      raw: metrics.providers?.raw,
      formatted: metrics.providers?.formatted || metrics.providers?.raw?.toLocaleString('en-US'),
      trend: metrics.providers?.trend || '+8.9%',
      isPositive: true,
      period: metrics.providers?.period || 'vs. last month',
      previous: metrics.providers?.previous ? metrics.providers.previous.toLocaleString('en-US') : null,
      icon: UserCheck,
      iconBg: 'bg-amber-50 text-amber-800',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs transition hover:border-royal-200 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{item.title}</span>
                <div className={`flex size-9 items-center justify-center rounded-xl ${item.iconBg}`}>
                  <Icon className="size-4.5" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-royal-950 font-sans">
                  {item.formatted}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
              <span className={`inline-flex items-center gap-1 font-bold ${item.isPositive ? 'text-emerald-700' : 'text-rose-600'}`}>
                {item.isPositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {item.trend}
              </span>
              <span className="text-[11px] text-gray-400">
                {item.previous ? `prev: ${item.previous}` : item.period}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
export default MarketKPIs
