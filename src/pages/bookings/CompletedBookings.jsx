import BookingWorkspace from '../../components/bookings/BookingWorkspace'

// ADM-048 Completed Bookings — derived view over the shared bookings collection.
export default function CompletedBookings() {
  return <BookingWorkspace view="completed" />
}
