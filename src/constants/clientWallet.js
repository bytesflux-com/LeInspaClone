// ADM-015 — Client Wallet: shared constants.
// The screen is a read-only Admin view of the existing Client Wallet
// (`wallets` + `wallet_transactions`). Nothing here creates or edits money.

export const WALLET_TABS = [
  { id: 'all', label: 'All' },
  { id: 'credits', label: 'Credits' },
  { id: 'debits', label: 'Debits' },
  { id: 'refunds', label: 'Refunds' },
  { id: 'pending', label: 'Pending' },
]

export const DATE_OPTIONS = [
  { value: '', label: 'Any date' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'year', label: 'This year' },
]

// Only types the wallet backend actually writes. Add a type here only when the
// backend supports it (manual adjustments are a separate, permission-controlled workflow).
export const TXN_TYPE_OPTIONS = [
  { value: '', label: 'All transaction types' },
  { value: 'topup', label: 'Wallet Top Up' },
  { value: 'booking', label: 'Booking Payment' },
  { value: 'refund', label: 'Booking Refund' },
  { value: 'promo', label: 'Promotional Credit' },
  { value: 'membership', label: 'Membership Fee' },
]

export const TXN_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
]

export const WALLET_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'amount_high', label: 'Amount: high to low' },
  { value: 'amount_low', label: 'Amount: low to high' },
]

export const TXN_TYPE_LABELS = {
  topup: 'Wallet Top Up',
  booking: 'Booking Payment',
  refund: 'Booking Refund',
  promo: 'Promotional Credit',
  membership: 'Membership Fee',
}

export const HISTORY_WINDOWS = [
  { id: 7, label: '7 Days' },
  { id: 30, label: '30 Days' },
  { id: 90, label: '90 Days' },
]

export const PAGE_SIZES = [6, 12, 24]
export const DEFAULT_PAGE_SIZE = 6

// Green = completed, amber = pending, red = failed, purple = held, grey = reversed.
export const WALLET_STATUS_STYLE = {
  completed: { label: 'Completed', box: 'bg-[#dcf6e4] text-[#15803d]', dot: 'fill-[#22a652] text-white', icon: 'check' },
  pending: { label: 'Pending', box: 'bg-[#ffe9d2] text-[#c2570c]', dot: 'fill-[#f08a24] text-white', icon: 'clock' },
  failed: { label: 'Failed', box: 'bg-[#fde2e2] text-[#dc2626]', dot: 'fill-[#e03a3a] text-white', icon: 'x' },
  held: { label: 'Held', box: 'bg-[#e4defb] text-[#3b1fd6]', dot: 'fill-[#4527c8] text-white', icon: 'clock' },
  reversed: { label: 'Reversed', box: 'bg-[#e6e8ee] text-[#3f4457]', dot: 'fill-[#7d8599] text-white', icon: 'check' },
}

// Balance effect chip: credit (green), debit (red), none (failed / informational).
export const EFFECT_STYLE = {
  credit: { label: 'Credit', box: 'bg-[#e6f7ec] text-[#15803d]' },
  debit: { label: 'Debit', box: 'bg-[#fde8e8] text-[#dc2626]' },
  none: { label: 'No effect', box: 'bg-[#eceef2] text-[#4b5563]' },
}
