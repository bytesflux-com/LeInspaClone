import { BarChart3, Briefcase, Calendar, Coins, User } from 'lucide-react'
import MetricCard from './MetricCard'
import { formatCurrency } from '../../lib/currency'
import { formatNumber } from '../../lib/utils'

export default function MetricGrid({ metrics, reportingCurrency = 'KES' }) {
  if (!metrics) return null

  const gmv = metrics.grossBookingValue
  const revenue = metrics.platformRevenue
  const bookings = metrics.bookings
  const clients = metrics.activeClients
  const providers = metrics.activeProviders

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <MetricCard
        title="Gross Booking Value"
        value={formatCurrency(gmv?.value ?? 2348500, gmv?.currency || reportingCurrency)}
        trend={gmv?.trend || '12%'}
        trendPeriod="vs. yesterday"
        icon={Coins}
        iconBg="bg-purple-100/70 text-purple-700"
      />

      <MetricCard
        title="Platform Revenue"
        value={formatCurrency(revenue?.value ?? 348120, revenue?.currency || reportingCurrency)}
        trend={revenue?.trend || '18%'}
        trendPeriod="vs. yesterday"
        icon={BarChart3}
        iconBg="bg-amber-100/70 text-amber-600"
      />

      <MetricCard
        title="Bookings"
        value={formatNumber(bookings?.value ?? 1284)}
        trend={bookings?.trend || '14%'}
        trendPeriod="vs. yesterday"
        icon={Calendar}
        iconBg="bg-purple-100/70 text-purple-700"
      />

      <MetricCard
        title="Active Clients"
        value={formatNumber(clients?.value ?? 6842)}
        trend={clients?.trend || '11%'}
        trendPeriod="vs. yesterday"
        icon={User}
        iconBg="bg-indigo-100/70 text-indigo-700"
      />

      <MetricCard
        title="Active Providers"
        value={formatNumber(providers?.value ?? 2317)}
        trend={providers?.trend || '9%'}
        trendPeriod="vs. yesterday"
        icon={Briefcase}
        iconBg="bg-indigo-100/70 text-indigo-700"
      />
    </div>
  )
}

