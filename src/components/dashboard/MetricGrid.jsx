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
        value={formatCurrency(gmv?.value ?? 0, gmv?.currency || reportingCurrency)}
        trend={gmv?.trend || null}
        trendPeriod={gmv?.period || ''}
        
        icon={Coins}
        iconBg="bg-purple-100/70 text-purple-700"
      />

      <MetricCard
        title="Platform Revenue"
        value={formatCurrency(revenue?.value ?? 0, revenue?.currency || reportingCurrency)}
        trend={revenue?.trend || null}
        trendPeriod={revenue?.period || ''}
        
        icon={BarChart3}
        iconBg="bg-amber-100/70 text-amber-600"
      />

      <MetricCard
        title="Bookings"
        value={formatNumber(bookings?.value ?? 0)}
        trend={bookings?.trend || null}
        trendPeriod={bookings?.period || ''}
        
        icon={Calendar}
        iconBg="bg-purple-100/70 text-purple-700"
      />

      <MetricCard
        title="Active Clients"
        value={formatNumber(clients?.value ?? 0)}
        trend={clients?.trend || null}
        trendPeriod={clients?.period || ''}
        
        icon={User}
        iconBg="bg-indigo-100/70 text-indigo-700"
      />

      <MetricCard
        title="Active Providers"
        value={formatNumber(providers?.value ?? 0)}
        trend={providers?.trend || null}
        trendPeriod={providers?.period || ''}
        
        icon={Briefcase}
        iconBg="bg-indigo-100/70 text-indigo-700"
      />
    </div>
  )
}

