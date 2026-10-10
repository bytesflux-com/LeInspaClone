import BookingWorkspace from '../../components/bookings/BookingWorkspace'

// ADM-047 Ongoing Bookings — derived view over the shared bookings collection.
export default function OngoingBookings() {
  return <BookingWorkspace view="ongoing" />
}
