import BookingWorkspace from '../../components/bookings/BookingWorkspace'

// ADM-046 Upcoming Bookings — derived view over the shared bookings collection.
export default function UpcomingBookings() {
  return <BookingWorkspace view="upcoming" />
}
