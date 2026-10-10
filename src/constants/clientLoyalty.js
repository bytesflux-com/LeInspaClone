// ADM-017 — Client Referrals & Loyalty: shared constants.
// Referral and loyalty are related but separate systems. Their balances,
// qualification rules and transaction types stay identifiable. Nothing here
// hardcodes a loyalty mechanism (e.g. "10 bookings = reward"): the rule always
// arrives from the loyalty configuration returned by the backend.

export const REFERRAL_TABS = [
  { id: 'all', label: 'All' },
  { id: 'successful', label: 'Successful' },
  { id: 'pending', label: 'Pending' },
  { id: 'ineligible', label: 'Ineligible' },
]

export const REWARD_TABS = [
  { id: 'all', label: 'All' },
  { id: 'referral', label: 'Referral' },
  { id: 'loyalty', label: 'Loyalty' },
  { id: 'redeemed', label: 'Redeemed' },
  { id: 'expired', label: 'Expired' },
]

export const DATE_OPTIONS = [
  { value: '', label: 'Any date' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'year', label: 'This year' },
]

export const REFERRAL_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'reward_high', label: 'Reward: high to low' },
]

export const PAGE_SIZES = [5, 10, 20]
export const DEFAULT_PAGE_SIZE = 5

// Rows shown before "View All" expands a compact card.
export const ACTIVITY_PREVIEW = 5
export const REWARDS_PREVIEW = 5

// Referral progress → green = rewarded, amber = pending, grey = ineligible.
export const REFERRAL_STATUS_STYLE = {
  rewarded: { label: 'Rewarded', box: 'bg-[#dcf6e4] text-[#15803d]', icon: 'dot', iconClass: 'fill-[#22a652] text-white' },
  pending: { label: 'Pending', box: 'bg-[#ffe9d2] text-[#c2570c]', icon: 'dot', iconClass: 'fill-[#f08a24] text-white' },
  ineligible: { label: 'Ineligible', box: 'bg-[#e6e8ee] text-[#3f4457]', icon: 'ban', iconClass: 'fill-[#7d8599] text-white' },
}

// Reward lifecycle → green = available, grey = redeemed / expired, red only for a real failure.
export const REWARD_STATUS_STYLE = {
  available: { label: 'Available', box: 'bg-[#dcf6e4] text-[#15803d]', icon: 'check', iconClass: 'fill-[#22a652] text-white' },
  redeemed: { label: 'Redeemed', box: 'bg-[#e6e8ee] text-[#3f4457]', icon: 'check', iconClass: 'fill-[#7d8599] text-white' },
  expired: { label: 'Expired', box: 'bg-[#e6e8ee] text-[#3f4457]', icon: 'clock', iconClass: 'fill-[#7d8599] text-white' },
  reversed: { label: 'Reversed', box: 'bg-[#e6e8ee] text-[#3f4457]', icon: 'check', iconClass: 'fill-[#7d8599] text-white' },
  failed: { label: 'Failed', box: 'bg-[#fde2e2] text-[#dc2626]', icon: 'x', iconClass: 'fill-[#e03a3a] text-white' },
}

export const ACTIVITY_STATUS_STYLE = {
  qualified: { label: 'Qualified', box: 'bg-[#dcf6e4] text-[#15803d]', icon: 'check', iconClass: 'fill-[#22a652] text-white' },
  earned: { label: 'Earned', box: 'bg-[#dcf6e4] text-[#15803d]', icon: 'check', iconClass: 'fill-[#22a652] text-white' },
  redeemed: { label: 'Redeemed', box: 'bg-[#e6e8ee] text-[#3f4457]', icon: 'check', iconClass: 'fill-[#7d8599] text-white' },
  expired: { label: 'Expired', box: 'bg-[#e6e8ee] text-[#3f4457]', icon: 'clock', iconClass: 'fill-[#7d8599] text-white' },
}

export const SOURCE_LABELS = { referral: 'Referral', loyalty: 'Loyalty' }

// Funnel layers, top (widest) to bottom. The backend returns the counts and the
// conversion from the previous stage; qualification is never decided in the browser.
export const FUNNEL_COLORS = ['#4a22c8', '#6b43e0', '#8d6bee', '#b39cf6']
