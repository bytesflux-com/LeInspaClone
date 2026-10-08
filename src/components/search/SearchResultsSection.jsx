import { Link } from 'react-router'
import {
  Users,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CreditCard,
  Banknote,
  Scale,
  Headphones,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import CountryFlag from '../ui/CountryFlag'
import {
  ClientResultRow,
  ProviderResultRow,
  SpaResultRow,
  HotelResultRow,
  BookingResultRow,
  PaymentResultRow,
  WithdrawalResultRow,
  DisputeResultRow,
  SupportResultRow,
} from './EntityResultRows'

function GroupCard({ title, count, icon: Icon, iconColor = 'text-[#5c2dd5]', viewAllLink, onViewAll, children }) {
  if (!count || count === 0) return null

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-2xs">
      {/* Group Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-1">
        <div className="flex items-center gap-2">
          <Icon className={`size-4.5 ${iconColor}`} />
          <h3 className="text-sm font-bold text-gray-950">
            {title} <span className="text-gray-400 font-semibold text-xs">({count})</span>
          </h3>
        </div>

        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#5c2dd5] hover:text-[#4922ab] transition-colors cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="size-3" />
          </button>
        ) : (
          <Link
            to={viewAllLink || '/operations'}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#5c2dd5] hover:text-[#4922ab] transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="size-3" />
          </Link>
        )}
      </div>

      {/* Row Items */}
      <div className="divide-y divide-gray-100/70">{children}</div>
    </div>
  )
}

export default function SearchResultsSection({
  query,
  data,
  sortBy,
  onSortChange,
  onSelectCategory,
  selectedMarket,
}) {
  const results = data?.results || {}
  const counts = data?.counts || {}
  const total = data?.totalResults || 0

  return (
    <div className="space-y-4">
      {/* Top Results Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-base font-bold text-gray-950">
            {total} results {query ? <>for <span className="text-[#5c2dd5]">"{query}"</span></> : 'across platform'}
          </h2>

          {selectedMarket && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-2xs">
              <CountryFlag code={selectedMarket.id} className="w-3.5 h-2.5" />
              <span>{selectedMarket.name}</span>
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-2xs focus:border-[#5c2dd5] focus:outline-none cursor-pointer"
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest first</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Grouped Entity Cards */}
      <div className="space-y-4">
        {/* 1. Clients */}
        <GroupCard
          title="Clients"
          count={counts.clients}
          icon={Users}
          onViewAll={() => onSelectCategory('clients')}
        >
          {results.clients?.map((item) => (
            <ClientResultRow key={item.id} item={item} />
          ))}
        </GroupCard>

        {/* 2. Providers */}
        <GroupCard
          title="Providers"
          count={counts.providers}
          icon={BriefcaseBusiness}
          onViewAll={() => onSelectCategory('providers')}
        >
          {results.providers?.map((item) => (
            <ProviderResultRow key={item.id} item={item} />
          ))}
        </GroupCard>

        {/* 3. Spas & Wellness Centers */}
        <GroupCard
          title="Spas & Wellness Centers"
          count={counts.spas}
          icon={Building2}
          onViewAll={() => onSelectCategory('spas')}
        >
          {results.spas?.map((item) => (
            <SpaResultRow key={item.id} item={item} />
          ))}
        </GroupCard>

        {/* 4. Hotels & Resorts */}
        <GroupCard
          title="Hotels & Resorts"
          count={counts.hotels}
          icon={Building2}
          onViewAll={() => onSelectCategory('hotels')}
        >
          {results.hotels?.map((item) => (
            <HotelResultRow key={item.id} item={item} />
          ))}
        </GroupCard>

        {/* 5. Bookings */}
        <GroupCard
          title="Bookings"
          count={counts.bookings}
          icon={CalendarCheck}
          onViewAll={() => onSelectCategory('bookings')}
        >
          {results.bookings?.map((item) => (
            <BookingResultRow key={item.id} item={item} />
          ))}
        </GroupCard>

        {/* 6. Payments */}
        <GroupCard
          title="Payments"
          count={counts.payments}
          icon={CreditCard}
          onViewAll={() => onSelectCategory('payments')}
        >
          {results.payments?.map((item) => (
            <PaymentResultRow key={item.id} item={item} />
          ))}
        </GroupCard>

        {/* 7. Withdrawals */}
        <GroupCard
          title="Withdrawals"
          count={counts.withdrawals}
          icon={Banknote}
          iconColor="text-amber-600"
          onViewAll={() => onSelectCategory('withdrawals')}
        >
          {results.withdrawals?.map((item) => (
            <WithdrawalResultRow key={item.id} item={item} />
          ))}
        </GroupCard>

        {/* 8. Disputes */}
        <GroupCard
          title="Disputes"
          count={counts.disputes}
          icon={Scale}
          iconColor="text-rose-600"
          onViewAll={() => onSelectCategory('disputes')}
        >
          {results.disputes?.map((item) => (
            <DisputeResultRow key={item.id} item={item} />
          ))}
        </GroupCard>

        {/* 9. Support Tickets */}
        <GroupCard
          title="Support Tickets"
          count={counts.support}
          icon={Headphones}
          onViewAll={() => onSelectCategory('support')}
        >
          {results.supportTickets?.map((item) => (
            <SupportResultRow key={item.id} item={item} />
          ))}
        </GroupCard>

        {/* Empty state if total is 0 */}
        {total === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-2xs">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-purple-50 text-[#5c2dd5] mb-3">
              <Users className="size-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No records found</h3>
            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
              We couldn't find any results matching "{query}". Try checking for typos or searching by phone, email, or exact reference ID.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

