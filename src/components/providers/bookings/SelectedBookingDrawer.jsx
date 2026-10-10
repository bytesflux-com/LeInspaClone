import { Link } from 'react-router'
import { X, ArrowRight } from 'lucide-react'

export function SelectedBookingDrawer({
  booking,
  onClose,
  canSeeFinancial = true,
  onShowToast,
}) {
  if (!booking) return null

  const id = booking.id?.startsWith('#') ? booking.id : `#${booking.id}`
  const isConfirmed = (booking.status || '').toLowerCase() === 'confirmed'
  const isCompleted = (booking.status || '').toLowerCase() === 'completed'
  const isCancelled = (booking.status || '').toLowerCase() === 'cancelled'

  const escrow = (booking.escrowStatus || '').toLowerCase()
  const isEscrowHeld = escrow === 'held'
  const isEscrowReleased = escrow === 'released'

  const breakdown = booking.paymentBreakdown || {
    clientPaid: booking.amount || 4500,
    platformFeePercent: 10,
    platformFee: (booking.amount || 4500) * 0.1,
    providerEarnings: (booking.amount || 4500) * 0.9,
  }

  const timeline = booking.timeline || [
    { time: '12 Sep 2026 • 12:05 PM', title: 'Payment successful', status: 'done' },
    { time: '12 Sep 2026 • 12:06 PM', title: 'Escrow funded and held', status: 'done' },
    { time: '12 Sep 2026 • 1:50 PM', title: 'Client checked in', status: 'done' },
    { time: '12 Sep 2026 • 2:00 PM', title: 'Service confirmed', status: 'current' },
  ]

  return (
    <aside className="w-full xl:w-[380px] shrink-0 bg-white border border-slate-200 rounded-2xl shadow-lg flex flex-col max-h-[calc(100vh-140px)] sticky top-20 overflow-hidden animate-in slide-in-from-right-4">
      {/* 1. Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold font-mono text-base text-slate-900">{id}</h3>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
              isConfirmed
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isCompleted
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isCancelled
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>{isConfirmed ? 'Confirmed' : isCompleted ? 'Completed' : booking.status}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* 2. Scrollable Body */}
      <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
        {/* Client Identity Card */}
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={
                booking.clientAvatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'
              }
              alt={booking.clientName}
              className="size-10 rounded-full object-cover border border-white shadow-2xs shrink-0"
            />
            <div>
              <h4 className="font-bold text-slate-900 text-sm leading-snug">
                {booking.clientName || 'Wallen Nyaberi'}
              </h4>
              <p className="font-mono text-[10.5px] text-slate-400">
                {booking.clientId || 'CL-19281'}
              </p>
            </div>
          </div>

          <Link
            to={`/clients/${booking.clientId || 'CL-19281'}`}
            className="text-[11px] font-bold text-purple-700 hover:underline"
          >
            View Client →
          </Link>
        </div>

        {/* Booking Details Grid */}
        <div className="space-y-2 text-[11.5px]">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400">Service</span>
            <span className="font-bold text-slate-900 text-right">{booking.serviceName}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400">Date</span>
            <span className="font-medium text-slate-800">{booking.dateOnly || '12 Sep 2026'}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400">Time</span>
            <span className="font-medium text-slate-800">{booking.timeOnly || '2:00 PM (60 min)'}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400">Location</span>
            <span className="font-medium text-slate-800 text-right">
              {booking.location || 'Provider Location • Nairobi'}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400">Amount (KES)</span>
            <span className="font-mono font-bold text-slate-900">
              {canSeeFinancial
                ? typeof booking.amount === 'number'
                  ? booking.amount.toLocaleString()
                  : booking.amount
                : '—'}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400">Payment Status</span>
            <span className="font-semibold text-emerald-700 text-right">
              🟢 Paid ({booking.paymentDate || '12 Sep 2026, 12:05 PM'})
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400">Escrow</span>
            <span
              className={`font-semibold ${
                isEscrowHeld ? 'text-purple-700' : isEscrowReleased ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {isEscrowHeld ? '🟣 Held' : isEscrowReleased ? '🟢 Released' : '🟠 Refunded'}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-400">Booking Source</span>
            <span className="font-medium text-slate-800">{booking.bookingSource || 'App (Client)'}</span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-slate-400">Negotiation</span>
            <span className="font-medium text-slate-800">
              {booking.negotiation ? `${booking.negotiation.agreedPrice} (Agreed)` : 'None'}
            </span>
          </div>
        </div>

        {/* Primary CTA: Open Full Booking */}
        <Link
          to={`/bookings/${booking.id?.replace('#', '')}`}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <span>Open Full Booking</span>
          <ArrowRight className="size-3.5" />
        </Link>

        {/* Payment Breakdown Card */}
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
          <h4 className="font-bold text-slate-900 text-xs">Payment Breakdown</h4>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Client Paid</span>
              <span className="font-mono font-bold text-slate-900">
                {canSeeFinancial ? `KES ${breakdown.clientPaid?.toLocaleString()}` : 'KES —'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Platform Fee (10%)</span>
              <span className="font-mono text-slate-600">
                {canSeeFinancial ? `KES ${breakdown.platformFee?.toLocaleString()}` : 'KES —'}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
              <span className="text-slate-900">Provider Earnings</span>
              <span className="font-mono text-purple-700">
                {canSeeFinancial ? `KES ${breakdown.providerEarnings?.toLocaleString()}` : 'KES —'}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Timeline Card */}
        <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-xs">Timeline</h4>
            <button
              type="button"
              onClick={() => onShowToast?.(`Opening complete audit timeline for ${id}`)}
              className="text-[10.5px] font-bold text-purple-700 hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="space-y-2 pt-1 border-l-2 border-purple-200 ml-2 pl-3">
            {timeline.map((step, idx) => (
              <div key={idx} className="relative text-[11px] space-y-0.5">
                <span className="absolute -left-[17px] top-1 size-2 rounded-full bg-purple-600" />
                <p className="font-semibold text-slate-900">{step.title}</p>
                <p className="text-[10px] text-slate-400">{step.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
