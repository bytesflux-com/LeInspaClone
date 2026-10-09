// ADM-013 — Client Bookings: shared constants.
// The booking list reuses the central `bookings` collection (no admin copy).

export const BOOKING_TABS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'disputed', label: 'Disputed' },
]

export const DATE_OPTIONS = [
  { value: '', label: 'Any date' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'year', label: 'This year' },
]

export const PROVIDER_TYPE_OPTIONS = [
  { value: '', label: 'All provider types' },
  { value: 'spa', label: 'Spa & Wellness Center' },
  { value: 'hotel', label: 'Hotel & Resort' },
  { value: 'provider', label: 'Independent Provider' },
]

export const SOURCE_OPTIONS = [
  { value: '', label: 'All sources' },
  { value: 'app', label: 'Lé Inspa App' },
  { value: 'website', label: 'Website' },
  { value: 'guest', label: 'Guest Booking' },
  { value: 'walkin', label: 'Walk-in / Manual' },
]

export const PAYMENT_OPTIONS = [
  { value: '', label: 'All payment states' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunding', label: 'Refunding' },
  { value: 'refunded', label: 'Refunded' },
]

export const ESCROW_OPTIONS = [
  { value: '', label: 'Any escrow state' },
  { value: 'held', label: 'Held' },
  { value: 'released', label: 'Released' },
  { value: 'refunded', label: 'Refunded' },
]

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'price_high', label: 'Price: high to low' },
  { value: 'price_low', label: 'Price: low to high' },
]

export const SOURCE_LABELS = {
  app: 'Lé Inspa App',
  website: 'Website',
  guest: 'Guest Booking',
  walkin: 'Walk-in / Manual',
}

export const PAGE_SIZES = [6, 12, 24]
export const DEFAULT_PAGE_SIZE = 6

// Visual language: green = confirmed/completed, amber = pending/refund processing,
// red = cancelled/problem, grey = inactive/expired, purple = escrow held / ongoing.
export const BOOKING_STATUS_STYLE = {
  confirmed: { label: 'Confirmed', box: 'bg-[#dcf6e4] text-[#15803d]', dot: 'fill-[#22a652] text-white' },
  completed: { label: 'Completed', box: 'bg-[#dcf6e4] text-[#15803d]', dot: 'fill-[#22a652] text-white' },
  pending: { label: 'Pending', box: 'bg-[#ffe9d2] text-[#c2570c]', dot: 'fill-[#f08a24] text-white' },
  ongoing: { label: 'Ongoing', box: 'bg-[#e4defb] text-[#3b1fd6]', dot: 'fill-[#4527c8] text-white' },
  cancelled: { label: 'Cancelled', box: 'bg-[#fde2e2] text-[#dc2626]', dot: 'fill-[#e03a3a] text-white' },
  disputed: { label: 'Disputed', box: 'bg-[#fde2e2] text-[#dc2626]', dot: 'fill-[#e03a3a] text-white' },
}

export const BOOKING_PAYMENT_STYLE = {
  paid: { label: 'Paid', box: 'bg-[#dcf6e4] text-[#15803d]', dot: 'fill-[#22a652] text-white' },
  pending: { label: 'Pending', box: 'bg-[#ffe9d2] text-[#c2570c]', dot: 'fill-[#f08a24] text-white' },
  failed: { label: 'Failed', box: 'bg-[#fde2e2] text-[#dc2626]', dot: 'fill-[#e03a3a] text-white' },
  refunding: { label: 'Refunding', box: 'bg-[#ffe9d2] text-[#c2570c]', dot: 'fill-[#f08a24] text-white' },
  refunded: { label: 'Refunded', box: 'bg-[#e6e8ee] text-[#3f4457]', dot: 'fill-[#8b93a5] text-white' },
}

export const BOOKING_ESCROW_STYLE = {
  held: { label: 'Held', box: 'bg-[#e4defb] text-[#3b1fd6]', dot: 'fill-[#4527c8] text-white' },
  released: { label: 'Released', box: 'bg-[#e6e8ee] text-[#3f4457]', dot: 'fill-[#7d8599] text-white' },
  refunded: { label: 'Refunded', box: 'bg-[#e6e8ee] text-[#3f4457]', dot: 'fill-[#7d8599] text-white' },
}
