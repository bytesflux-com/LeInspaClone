import { useState, useMemo } from 'react'
import { MapPin, Search, ArrowUpDown, ChevronDown, Filter, ExternalLink } from 'lucide-react'
import Badge from '../../ui/Badge'
import { formatCompactCurrency } from '../../../lib/currency.js'

export function CitiesRegionsTable({ cities = [], marketName = 'Kenya', currency = 'KES' }) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('gbv') // 'name' | 'clients' | 'providers' | 'bookings' | 'gbv' | 'revenue'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' | 'desc'

  const filteredAndSortedCities = useMemo(() => {
    let result = [...cities]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]

      if (typeof valA === 'string') {
        valA = valA.toLowerCase()
        valB = valB.toLowerCase()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [cities, search, sortField, sortOrder])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200/90 bg-white shadow-xs overflow-hidden">
      {/* Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4.5 text-royal-700" />
            <h3 className="text-base font-bold text-royal-950">Cities & Regional Performance Matrix</h3>
            <Badge variant="royal">{cities.length} Sovereign Nodes</Badge>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Granular geographic telemetry breakdown for {marketName}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search city or region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-3 py-1.5 text-xs text-royal-950 placeholder-gray-400 focus:border-royal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-100 bg-gray-50/60 font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="cursor-pointer px-5 py-3 hover:text-royal-950"
              >
                <div className="flex items-center gap-1.5">
                  <span>City / Region</span>
                  <ArrowUpDown className="size-3 text-gray-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('clients')}
                className="cursor-pointer px-4 py-3 text-right hover:text-royal-950"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Active Clients</span>
                  <ArrowUpDown className="size-3 text-gray-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('providers')}
                className="cursor-pointer px-4 py-3 text-right hover:text-royal-950"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Providers</span>
                  <ArrowUpDown className="size-3 text-gray-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('bookings')}
                className="cursor-pointer px-4 py-3 text-right hover:text-royal-950"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Bookings</span>
                  <ArrowUpDown className="size-3 text-gray-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('gbv')}
                className="cursor-pointer px-4 py-3 text-right hover:text-royal-950"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Gross Booking Value</span>
                  <ArrowUpDown className="size-3 text-gray-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('revenue')}
                className="cursor-pointer px-4 py-3 text-right hover:text-royal-950"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Platform Revenue</span>
                  <ArrowUpDown className="size-3 text-gray-400" />
                </div>
              </th>
              <th className="px-4 py-3 text-center">YoY Growth</th>
              <th className="px-5 py-3 text-center">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
            {filteredAndSortedCities.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-gray-400">
                  No cities found matching "{search}"
                </td>
              </tr>
            ) : (
              filteredAndSortedCities.map((city) => (
                <tr key={city.id} className="transition hover:bg-royal-50/30">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-royal-950">{city.name}</div>
                    <div className="text-[11px] text-gray-400">{city.region}</div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-gray-800">
                    {city.clients?.toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-gray-800">
                    {city.providers?.toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-gray-800">
                    {city.bookings?.toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-royal-950 font-mono">
                    {formatCompactCurrency(city.gbv, currency)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-emerald-700 font-mono">
                    {formatCompactCurrency(city.revenue, currency)}
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-emerald-600">
                    {city.growth}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Badge
                      variant={city.health === 'Healthy' ? 'success' : 'warning'}
                      size="sm"
                      dot
                      dotColor={city.health === 'Healthy' ? 'bg-emerald-500' : 'bg-amber-500'}
                    >
                      {city.health}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default CitiesRegionsTable
