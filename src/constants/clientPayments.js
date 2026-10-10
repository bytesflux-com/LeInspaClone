// ADM-014 — Client Payments: shared constants.
// The list reads the central `payments` collection (no admin copy).

export const PAYMENT_TABS = [
  { id: 'all', label: 'All' },
  { id: 'successful', label: 'Successful' },
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
  { id: 'refunded', label: 'Refunded' },
]

export const DATE_OPTIONS = [
  { value: '', label: 'Any date' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'year', label: 'This year' },
]

export const PAYMENT_TYPE_OPTIONS = [
  { value: '', label: 'All payment types' },
  { value: 'booking', label: 'Booking Payment' },
  { value: 'fee', label: 'Booking Fee' },
  { value: 'membership', label: 'Membership' },
  { value: 'wallet', label: 'Wallet Top-up' },
  { value: 'refund', label: 'Refund' },
]

export const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'All methods' },
  { value: 'mpesa', label: 'M-PESA' },
  { value: 'card', label: 'Card (Visa / Mastercard)' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'original', label: 'Original method' },
]

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'successful', label: 'Successful' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

export const ESCROW_FILTER_OPTIONS = [
  { value: '', label: 'Any escrow state' },
  { value: 'held', label: 'Held' },
  { value: 'released', label: 'Released' },
  { value: 'refunded', label: 'Refunded' },
]

export const PAYMENT_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'amount_high', label: 'Amount: high to low' },
  { value: 'amount_low', label: 'Amount: low to high' },
]

export const PAYMENT_TYPE_LABELS = {
  booking: 'Booking Payment',
  fee: 'Booking Platform Fee',
  membership: 'Membership Payment',
  wallet: 'Wallet Top-up',
  refund: 'Booking Refund',
}

export const PAGE_SIZES = [8, 16, 24]
export const DEFAULT_PAGE_SIZE = 8

// Green = successful, amber = pending / processing / refunded, red = failed,
// purple = held in escrow, grey = reversed / inactive.
export const PAYMENT_STATUS_STYLE = {
  successful: { label: 'Successful', box: 'bg-[#dcf6e4] text-[#15803d]', dot: 'fill-[#22a652] text-white', icon: 'check' },
  pending: { label: 'Pending', box: 'bg-[#ffe9d2] text-[#c2570c]', dot: 'fill-[#f08a24] text-white', icon: 'clock' },
  failed: { label: 'Failed', box: 'bg-[#fde2e2] text-[#dc2626]', dot: 'fill-[#e03a3a] text-white', icon: 'x' },
  refunded: { label: 'Refunded', box: 'bg-[#ffe9d2] text-[#c2570c]', dot: 'fill-[#f08a24] text-white', icon: 'check' },
  reversed: { label: 'Reversed', box: 'bg-[#e6e8ee] text-[#3f4457]', dot: 'fill-[#7d8599] text-white', icon: 'check' },
}
