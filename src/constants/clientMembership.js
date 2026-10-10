// ADM-016 — Client Membership: shared constants.
// The screen is an Admin control/view layer over the real membership records
// (`customer_memberships` + membership history/events + plan configuration).
// Nothing here stores prices or benefit text: both are read from the record /
// plan configuration returned by the backend.
import { Ban, CircleAlert, CircleCheck, Clock, CircleMinus, Crown, Gem, RefreshCw, Sparkles, User } from 'lucide-react'

// Membership status is NOT client-account status. An Active client can hold an Expired membership.
// Green = active, amber = renewal issue, red = suspended, grey = expired / ended.
export const MEMBERSHIP_STATUS_STYLE = {
  active: { label: 'Active', box: 'bg-[#dcf6e4] text-[#15803d]', icon: CircleCheck, iconCls: 'fill-[#22a652] text-white' },
  payment_failed: { label: 'Payment Failed', box: 'bg-[#ffe9d2] text-[#c2570c]', icon: CircleAlert, iconCls: 'fill-[#f08a24] text-white' },
  suspended: { label: 'Suspended', box: 'bg-[#fde2e2] text-[#dc2626]', icon: Ban, iconCls: 'fill-[#e03a3a] text-white' },
  expired: { label: 'Expired', box: 'bg-[#e6e8ee] text-[#3f4457]', icon: Clock, iconCls: 'fill-[#7d8599] text-white' },
  none: { label: 'No Membership', box: 'bg-[#eceef2] text-[#4b5563]', icon: CircleMinus, iconCls: 'fill-[#8b93a5] text-white' },
}

export const HISTORY_STATUS_STYLE = {
  active: { label: 'Active', box: 'bg-[#dcf6e4] text-[#15803d]', icon: CircleCheck, iconCls: 'fill-[#22a652] text-white' },
  completed: { label: 'Completed', box: 'bg-[#eceef2] text-[#3f4457]', icon: CircleCheck, iconCls: 'fill-[#7d8599] text-white' },
  expired: { label: 'Expired', box: 'bg-[#e6e8ee] text-[#3f4457]', icon: Clock, iconCls: 'fill-[#7d8599] text-white' },
  failed: { label: 'Failed', box: 'bg-[#ffe9d2] text-[#c2570c]', icon: CircleAlert, iconCls: 'fill-[#f08a24] text-white' },
  suspended: { label: 'Suspended', box: 'bg-[#fde2e2] text-[#dc2626]', icon: Ban, iconCls: 'fill-[#e03a3a] text-white' },
}

export const MEMBERSHIP_PAYMENT_STATUS_STYLE = {
  successful: { label: 'Successful', box: 'bg-[#dcf6e4] text-[#15803d]', icon: CircleCheck, iconCls: 'fill-[#22a652] text-white' },
  pending: { label: 'Pending', box: 'bg-[#ffe9d2] text-[#c2570c]', icon: Clock, iconCls: 'fill-[#f08a24] text-white' },
  failed: { label: 'Failed', box: 'bg-[#fde2e2] text-[#dc2626]', icon: CircleAlert, iconCls: 'fill-[#e03a3a] text-white' },
  na: { label: 'N/A', box: 'bg-[#eceef2] text-[#4b5563]', icon: CircleMinus, iconCls: 'fill-[#8b93a5] text-white' },
}

// One architecture, three visual treatments. Unknown future plans (annual, corporate,
// family …) fall back to DEFAULT_THEME, so new plans render without redesigning the screen.
export const TIER_THEME = {
  standard: {
    icon: User,
    hero: 'bg-gradient-to-br from-[#f3effc] via-[#ece6fb] to-[#e2d9f8] text-[#1b1140]',
    ring: 'ring-1 ring-[#d6caf1]',
    tile: 'bg-white text-[#4527c8] ring-1 ring-[#d6caf1]',
    kicker: 'text-[#4527c8]',
    sub: 'text-[#2a1b57]',
    accent: '#4527c8',
  },
  premium: {
    icon: Crown,
    hero: 'bg-gradient-to-br from-[#2a0f7a] via-[#3a1cb0] to-[#4a2bd0] text-white',
    ring: 'ring-1 ring-[#e8c46a]/40',
    tile: 'bg-[#6a45c9]/70 text-[#f6d27a] ring-1 ring-[#f6d27a]/40',
    kicker: 'text-[#f6d27a]',
    sub: 'text-white/85',
    accent: '#c79a4b',
  },
  executive: {
    icon: Gem,
    hero: 'bg-gradient-to-br from-[#12062b] via-[#220d52] to-[#34167a] text-white',
    ring: 'ring-[1.5px] ring-[#d9b26a]/70',
    tile: 'bg-[#d9b26a]/15 text-[#f1cf85] ring-1 ring-[#d9b26a]/60',
    kicker: 'text-[#f1cf85]',
    sub: 'text-white/80',
    accent: '#d9b26a',
  },
}
export const DEFAULT_THEME = { ...TIER_THEME.standard, icon: Sparkles }
export const themeFor = (tierId) => TIER_THEME[tierId] || DEFAULT_THEME

// Journey node icons (informational only).
export const JOURNEY_ICON = { standard: User, premium: Crown, executive: Gem }

// ---- Manage Membership (permission-controlled, reason + audit on every change) ----
export const MANAGE_ACTIONS = {
  change_tier: { label: 'Change Membership', desc: 'Move the client to another access level.', icon: Crown, risk: 'high' },
  set_auto_renew: { label: 'Turn Auto-Renewal On/Off', desc: 'Control whether the next renewal is attempted.', icon: RefreshCw, risk: 'normal' },
  extend: { label: 'Extend Membership', desc: 'Add days to the current period without a payment.', icon: Clock, risk: 'high' },
  cancel_renewal: { label: 'Cancel Renewal', desc: 'Access continues to the end of the paid period, then ends.', icon: CircleMinus, risk: 'normal' },
  reactivate: { label: 'Reactivate Membership', desc: 'Restore access for a suspended or expired membership.', icon: CircleCheck, risk: 'high' },
  correct_status: { label: 'Correct Membership Status', desc: 'Fix a wrong membership status. Payment status can never be changed here.', icon: CircleAlert, risk: 'high' },
}

export const CHANGE_REASONS = [
  'Customer support correction',
  'Verified billing issue',
  'Goodwill / retention',
  'Eligibility approved',
  'Data correction',
  'Other',
]

export const EXTEND_OPTIONS = [3, 7, 14, 30]
export const MIN_NOTE = 5
