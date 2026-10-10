import BookingWorkspace from '../../components/bookings/BookingWorkspace'

// ADM-049 Cancelled Bookings — derived view over the shared bookings collection.
export default function CancelledBookings() {
  return <BookingWorkspace view="cancelled" />
}
