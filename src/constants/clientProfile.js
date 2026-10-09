// ADM-012 — Client Profile: shared constants.
import { PERMISSIONS } from './permissions.js'

// Profile tabs. `section` is the URL segment: /clients/:clientId/:section
// (Overview has no segment). The deeper screens are ADM-013 → ADM-018.
export const PROFILE_TABS = [
  { id: 'overview', label: 'Overview', section: '' },
  { id: 'bookings', label: 'Bookings', section: 'bookings', screen: 'ADM-013' },
  { id: 'payments', label: 'Payments', section: 'payments', screen: 'ADM-014', permission: PERMISSIONS.FINANCE_VIEW },
  { id: 'wallet', label: 'Wallet', section: 'wallet', screen: 'ADM-015', permission: PERMISSIONS.FINANCE_VIEW },
  { id: 'membership', label: 'Membership', section: 'membership', screen: 'ADM-016' },
  { id: 'loyalty', label: 'Referrals & Loyalty', section: 'loyalty', screen: 'ADM-017' },
  { id: 'support', label: 'Support & Safety', section: 'support', screen: 'ADM-018', permission: PERMISSIONS.SUPPORT_VIEW },
  { id: 'activity', label: 'Activity', section: 'activity', screen: 'ADM-012' },
]

// Sections reachable from quick actions but not shown as tabs.
export const EXTRA_SECTIONS = {
  account: { label: 'Account Actions', screen: 'ADM-019' },
}

export const BOOKING_STATUS_STYLE = {
  confirmed: { label: 'Confirmed', box: 'bg-[#dcf6e4] text-[#15803d]', dot: 'fill-[#22a652] text-white' },
  completed: { label: 'Completed', box: 'bg-[#dcf6e4] text-[#15803d]', dot: 'fill-[#22a652] text-white' },
  pending: { label: 'Pending', box: 'bg-[#ffe9d2] text-[#c2570c]', dot: 'fill-[#f08a24] text-white' },
  cancelled: { label: 'Cancelled', box: 'bg-[#fde2e2] text-[#dc2626]', dot: 'fill-[#e03a3a] text-white' },
}

export const PAYMENT_STATUS_STYLE = {
  successful: { label: 'Successful', box: 'bg-[#dcf6e4] text-[#15803d]', dot: 'fill-[#22a652] text-white' },
  pending: { label: 'Pending', box: 'bg-[#ffe9d2] text-[#c2570c]', dot: 'fill-[#f08a24] text-white' },
  failed: { label: 'Failed', box: 'bg-[#fde2e2] text-[#dc2626]', dot: 'fill-[#e03a3a] text-white' },
  refunded: { label: 'Refunded', box: 'bg-[#ffe9d2] text-[#c2570c]', dot: 'fill-[#f08a24] text-white' },
}

export const TICKET_STATUS_LABELS = {
  open: 'Open',
  in_review: 'In Review',
  resolved: 'Resolved',
}
