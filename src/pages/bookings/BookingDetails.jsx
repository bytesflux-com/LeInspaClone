import { useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import BookingQuickView from '../../components/bookings/BookingQuickView'

// Booking Details (ADM-051 entry point) — every "View booking" link in the
// panel lands here. Reuses the live booking view (adminGetBookingQuickView),
// which works for any booking regardless of status, as a full page.
export default function BookingDetails({ initialTab = 'Overview' }) {
  const { bookingId } = useParams()
  const location = useLocation()
  const returnTo = location.state?.returnTo || '/bookings'
  const linkState = useMemo(() => ({ returnTo: `${location.pathname}${location.search}` }), [location.pathname, location.search])
  const id = decodeURIComponent(bookingId || '').replace(/^#/, '')

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-5 sm:px-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12.5px] text-[#6b6785]">
        <Link to={returnTo} className="inline-flex items-center gap-1 font-semibold text-[#3b1fd6] hover:underline">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <span>/</span>
        <Link to="/bookings" className="hover:underline">Booking Management</Link>
        <span>/</span>
        <span className="font-semibold text-[#1b1140]">{id}</span>
      </nav>
      <div className="overflow-hidden rounded-2xl border border-[#e6e1f3] bg-white shadow-xs">
        <BookingQuickView key={`${id}-${initialTab}`} bookingId={id} initialTab={initialTab} fullPage linkState={linkState} />
      </div>
    </div>
  )
}
