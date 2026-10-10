import BookingWorkspace from '../../components/bookings/BookingWorkspace'

// ADM-045 Active Bookings — derived view over the shared bookings collection.
export default function ActiveBookings() {
  return <BookingWorkspace view="active" />
}
