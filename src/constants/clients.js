// ADM-011 — All Clients: shared option lists and defaults.

export const CLIENT_STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'deactivated', label: 'Deactivated' },
]

export const CLIENT_STATUS_LABELS = {
  active: 'Active',
  pending: 'Pending',
  inactive: 'Inactive',
  suspended: 'Suspended',
  deactivated: 'Deactivated',
  unverified: 'Unverified',
}

export const MEMBERSHIP_OPTIONS = [
  { value: '', label: 'All Memberships' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'executive', label: 'Executive' },
]

export const BOOKING_ACTIVITY_OPTIONS = [
  { value: '', label: 'Any Activity' },
  { value: 'today', label: 'Booked Today' },
  { value: 'week', label: 'Booked This Week' },
  { value: 'upcoming', label: 'Has Upcoming Booking' },
  { value: 'in_service', label: 'Currently in Service' },
  { value: 'none', label: 'No Booking Yet' },
  { value: 'returning', label: 'Returning Client' },
  { value: 'cancelled_recent', label: 'Cancelled Recently' },
]

export const DATE_JOINED_OPTIONS = [
  { value: '', label: 'Any Time' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' },
]

export const REGISTRATION_METHOD_OPTIONS = [
  { value: '', label: 'Any Method' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'google', label: 'Google' },
  { value: 'apple', label: 'Apple' },
]

export const GUEST_CONVERTED_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'yes', label: 'Converted from guest' },
  { value: 'no', label: 'Registered directly' },
]

export const RECENCY_OPTIONS = [
  { value: '', label: 'Any Time' },
  { value: '7', label: 'Within 7 days' },
  { value: '30', label: 'Within 30 days' },
  { value: '90', label: 'Within 90 days' },
]

export const LAST_BOOKING_OPTIONS = [...RECENCY_OPTIONS, { value: 'never', label: 'Never booked' }]

export const ISSUE_OPTIONS = [
  { value: 'dispute', label: 'Open dispute' },
  { value: 'ticket', label: 'Open support ticket' },
  { value: 'safety', label: 'Safety case', restricted: true },
  { value: 'payment', label: 'Payment issue' },
]

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'bookings', label: 'Most Bookings' },
  { value: 'active', label: 'Recently Active' },
  { value: 'updated', label: 'Recently Updated' },
  // Only offered to admins with financial access
  { value: 'value', label: 'Highest Lifetime Value', financial: true },
]

export const PAGE_SIZES = [10, 25, 50, 100]
export const DEFAULT_PAGE_SIZE = 10

// Cities with their parent region, per market code.
export const CITY_DIRECTORY = {
  KE: [
    { city: 'Nairobi', region: 'Nairobi' },
    { city: 'Mombasa', region: 'Coast' },
    { city: 'Malindi', region: 'Coast' },
    { city: 'Nakuru', region: 'Rift Valley' },
    { city: 'Eldoret', region: 'Rift Valley' },
    { city: 'Kisumu', region: 'Nyanza' },
    { city: 'Thika', region: 'Central' },
    { city: 'Nyeri', region: 'Central' },
  ],
  UG: [
    { city: 'Kampala', region: 'Central' },
    { city: 'Entebbe', region: 'Central' },
    { city: 'Jinja', region: 'Eastern' },
    { city: 'Gulu', region: 'Northern' },
    { city: 'Mbarara', region: 'Western' },
  ],
  TZ: [
    { city: 'Dar es Salaam', region: 'Coastal' },
    { city: 'Arusha', region: 'Northern' },
    { city: 'Dodoma', region: 'Central' },
    { city: 'Mwanza', region: 'Lake Zone' },
    { city: 'Zanzibar', region: 'Zanzibar' },
  ],
  RW: [
    { city: 'Kigali', region: 'Kigali' },
    { city: 'Musanze', region: 'Northern' },
    { city: 'Huye', region: 'Southern' },
  ],
  ZA: [
    { city: 'Johannesburg', region: 'Gauteng' },
    { city: 'Pretoria', region: 'Gauteng' },
    { city: 'Cape Town', region: 'Western Cape' },
    { city: 'Durban', region: 'KwaZulu-Natal' },
  ],
}
