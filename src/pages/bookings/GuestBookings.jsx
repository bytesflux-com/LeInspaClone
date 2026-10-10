import BookingWorkspace from '../../components/bookings/BookingWorkspace'

// ADM-050 Guest Bookings — derived view over the shared bookings collection.
export default function GuestBookings() {
  return <BookingWorkspace view="guest" />
}
