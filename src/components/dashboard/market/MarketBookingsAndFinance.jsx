import { Calendar, Wallet, CheckCircle2, Clock, PlayCircle, AlertCircle, RefreshCw, Layers } from 'lucide-react'
import Badge from '../../ui/Badge'
import { formatCompactCurrency } from '../../../lib/currency'

export function MarketBookingsAndFinance({ bookingsAndFinance, marketName = 'Kenya', currency = 'KES' }) {
  if (!bookingsAndFinance) return null

  const { bookingsBreakdown, topCategories, financialPosition } = bookingsAndFinance

  const totalBookings =
    (bookingsBreakdown?.completed || 0) +
    (bookingsBreakdown?.upcoming || 0) +
    (bookingsBreakdown?.ongoing || 0) +
    (bookingsBreakdown?.today || 0)

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
      {/* Bookings Activity Matrix & Categories (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="size-4.5 text-royal-700" />
              <h3 className="text-base font-bold text-royal-950">Booking Operations & Categories</h3>
            </div>
            <Badge variant="royal">{totalBookings?.toLocaleString()} Total Cycle</Badge>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Real-time booking telemetry and popular service categories in {marketName}
          </p>

          {/* Bookings Status Pipeline */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
              <div className="flex items-center justify-between text-xs text-blue-700 font-medium">
                <span>Dispatched Today</span>
                <Clock className="size-3.5 text-blue-600" />
              </div>
              <div className="mt-1 text-xl font-extrabold text-blue-950">
                {bookingsBreakdown?.today?.toLocaleString()}
              </div>
            </div>

            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3">
              <div className="flex items-center justify-between text-xs text-purple-700 font-medium">
                <span>Ongoing Active</span>
                <PlayCircle className="size-3.5 text-purple-600" />
              </div>
              <div className="mt-1 text-xl font-extrabold text-purple-950">
                {bookingsBreakdown?.ongoing?.toLocaleString()}
              </div>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
              <div className="flex items-center justify-between text-xs text-indigo-700 font-medium">
                <span>Upcoming Slots</span>
                <Calendar className="size-3.5 text-indigo-600" />
              </div>
              <div className="mt-1 text-xl font-extrabold text-indigo-950">
                {bookingsBreakdown?.upcoming?.toLocaleString()}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
              <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
                <span>Completed</span>
                <CheckCircle2 className="size-3.5 text-emerald-600" />
              </div>
              <div className="mt-1 text-xl font-extrabold text-emerald-950">
                {bookingsBreakdown?.completed?.toLocaleString()}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
              <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                <span>Cancelled</span>
                <RefreshCw className="size-3.5 text-gray-400" />
              </div>
              <div className="mt-1 text-xl font-extrabold text-gray-700">
                {bookingsBreakdown?.cancelled?.toLocaleString()}
              </div>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
              <div className="flex items-center justify-between text-xs text-rose-700 font-medium">
                <span>Schedule Conflicts</span>
                <AlertCircle className="size-3.5 text-rose-600" />
              </div>
              <div className="mt-1 text-xl font-extrabold text-rose-950">
                {bookingsBreakdown?.conflicts?.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Top Categories */}
          <div className="mt-5 space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Top Service Categories</h4>
            {topCategories?.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-xs">
                <span className="font-semibold text-gray-800 flex items-center gap-2">
                  <Layers className="size-3.5 text-royal-600" />
                  {cat.name}
                </span>
                <span className="font-bold text-royal-950">{cat.bookings?.toLocaleString()} Bookings</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Position & Escrow Breakdown (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Wallet className="size-4.5 text-royal-700" />
              <h3 className="text-base font-bold text-royal-950">Financial Position & Escrow</h3>
            </div>
            <Badge variant="success">Balanced</Badge>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Escrow custody, provider liabilities, and revenue in {marketName}
          </p>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-purple-50/60 p-3 border border-purple-100">
              <span className="text-xs font-semibold text-purple-900">Total Customer Payments Inflow</span>
              <span className="text-sm font-extrabold text-purple-950 font-mono">
                {formatCompactCurrency(financialPosition?.customerPayments, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-amber-50/60 p-3 border border-amber-100">
              <span className="text-xs font-semibold text-amber-900">Escrow / Held Funds</span>
              <span className="text-sm font-extrabold text-amber-950 font-mono">
                {formatCompactCurrency(financialPosition?.escrowHeld, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-blue-50/60 p-3 border border-blue-100">
              <span className="text-xs font-semibold text-blue-900">Provider Payable Balance</span>
              <span className="text-sm font-extrabold text-blue-950 font-mono">
                {formatCompactCurrency(financialPosition?.providerPayable, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-emerald-50/60 p-3 border border-emerald-100">
              <span className="text-xs font-semibold text-emerald-900">Platform Revenue Earned</span>
              <span className="text-sm font-extrabold text-emerald-950 font-mono">
                {formatCompactCurrency(financialPosition?.platformRevenue, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 border border-gray-100">
              <span className="text-xs font-semibold text-gray-700">Pending Withdrawal Authorizations</span>
              <span className="text-xs font-bold text-gray-900 font-mono">
                {formatCompactCurrency(financialPosition?.pendingWithdrawals, currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-3 text-[11px] text-gray-400 flex items-center justify-between">
          <span>Funds segregated in compliance with sovereign banking laws</span>
          <span className="font-mono text-gray-600">AUDIT OK</span>
        </div>
      </div>
    </div>
  )
}
export default MarketBookingsAndFinance
