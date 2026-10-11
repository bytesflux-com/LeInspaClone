// ADM-019 — Client Account Actions: shared constants.
// This screen is the controlled execution layer for sensitive account actions. Account status and
// restrictions are SEPARATE concepts: a client can stay Active while being prevented from creating
// new bookings, so there is never a single `isSuspended` flag — every restriction is a scoped record.
// Principle: Understand → Minimize Impact → Justify → Confirm → Record.

// Access areas shown in the Account Status card.
export const ACCESS_AREAS = [
  { id: 'client', label: 'Client Access' },
  { id: 'booking', label: 'Booking Access' },
  { id: 'payment', label: 'Payment Access' },
  { id: 'messaging', label: 'Messaging Access' },
]

export const ACCESS_STATE_STYLE = {
  enabled: { label: 'Enabled', cls: 'bg-[#dcf6e4] text-[#15803d]' },
  restricted: { label: 'Restricted', cls: 'bg-[#ffe9d2] text-[#c2570c]' },
  suspended: { label: 'Suspended', cls: 'bg-[#fde2e2] text-[#dc2626]' },
  disabled: { label: 'Disabled', cls: 'bg-[#e6e8ee] text-[#3f4457]' },
}

// Account state (separate from restrictions). Healthy = green, suspension = amber/red, deactivation = red.
export const ACCOUNT_STATE_STYLE = {
  active: { label: 'Active', pill: 'bg-[#dcf6e4] text-[#15803d]', icon: 'check', disc: 'bg-[#15803d]', caption: 'This client currently has full access to Lé Inspa.' },
  suspended: { label: 'Suspended', pill: 'bg-[#ffe9d2] text-[#c2570c]', icon: 'ban', disc: 'bg-[#e8801a]', caption: 'Access is limited according to the active suspension.' },
  deactivated: { label: 'Deactivated', pill: 'bg-[#fde2e2] text-[#dc2626]', icon: 'power', disc: 'bg-[#dc2626]', caption: 'This account is disabled. Historical records are preserved.' },
  inactive: { label: 'Inactive', pill: 'bg-[#e6e8ee] text-[#3f4457]', icon: 'minus', disc: 'bg-[#5d6579]', caption: 'This account has not been used for a long time.' },
  pending: { label: 'Pending', pill: 'bg-[#ffe9d2] text-[#c2570c]', icon: 'clock', disc: 'bg-[#e8801a]', caption: 'This account is awaiting verification.' },
  unverified: { label: 'Unverified', pill: 'bg-[#fff5d6] text-[#92660a]', icon: 'clock', disc: 'bg-[#e0a82e]', caption: 'This client has not verified their contact details.' },
}

// Reason categories — the real list comes from Admin configuration (`getClientAccount().config`);
// these are the defaults the demo backend returns.
export const SUSPEND_REASONS = [
  'Safety Concern',
  'Policy Violation',
  'Fraud / Payment Review',
  'Abusive Conduct',
  'Account Security',
  'Compliance Requirement',
  'Other Approved Reason',
]

export const RESTRICT_REASONS = [
  'Payment investigation',
  'Safety review',
  'Policy Violation',
  'Account Security',
  'Compliance Requirement',
  'Other Approved Reason',
]

export const DEACTIVATE_REASONS = [
  'Client request',
  'Policy Violation',
  'Fraud confirmed',
  'Compliance Requirement',
  'Account inactivity',
  'Other Approved Reason',
]

export const REACTIVATE_REASONS = [
  'Review completed — restriction no longer required.',
  'Issue resolved with the client.',
  'Suspension applied in error.',
  'Compliance requirement satisfied.',
  'Other Approved Reason',
]

export const LIFT_REASONS = [
  'Investigation completed',
  'Review completed — restriction no longer required.',
  'Issue resolved with the client.',
  'Applied in error.',
  'Other Approved Reason',
]

export const WARNING_REASONS = ['Professional conduct policy', 'Terms of Service', 'Cancellation policy', 'Payment policy', 'Other Approved Reason']
export const INFO_REASONS = ['Verify identity', 'Update contact details', 'Confirm payment method', 'Provide supporting documents', 'Other Approved Reason']
export const REVIEW_REASONS = ['Safety Concern', 'Fraud / Payment Review', 'Account Security', 'Policy Violation', 'Other Approved Reason']

export const OTHER_REASON = 'Other Approved Reason'

// What can be restricted. Smallest appropriate restriction first; "Full Account Access" is the last resort.
export const SUSPENSION_SCOPES = [
  { id: 'booking', label: 'New Bookings', short: 'New Bookings' },
  { id: 'messaging', label: 'Messaging', short: 'Messaging' },
  { id: 'wallet', label: 'Wallet/financial actions', hint: 'permission dependent', short: 'Wallet', needs: 'finance' },
  { id: 'membership', label: 'Membership benefits', short: 'Membership benefits' },
  { id: 'full', label: 'Full Account Access', short: 'Full Account Access' },
]

export const DURATIONS = [
  { id: 'until_reviewed', label: 'Until reviewed' },
  { id: '24h', label: '24 hours', hours: 24 },
  { id: '7d', label: '7 days', hours: 24 * 7 },
  { id: '30d', label: '30 days', hours: 24 * 30 },
  { id: 'custom', label: 'Custom' },
  { id: 'indefinite', label: 'Indefinite', note: 'higher permission', needs: 'superAdmin' },
]

export const MIN_NOTE = 10
export const MAX_NOTE = 500
export const MAX_CLIENT_MESSAGE = 400

// Approved client-facing templates. The Admin picks a template and (where permitted) adds detail.
export const CLIENT_TEMPLATES = {
  suspend: [
    'Your account has been temporarily restricted while we review an account issue.',
    'Some features of your account have been paused while we complete a policy review.',
    'We have temporarily limited your account for security reasons. Our team will contact you shortly.',
  ],
  restrict_booking: ['You are temporarily unable to create new bookings while we review your account. Existing bookings are not affected.'],
  restrict_messaging: ['Messaging on your account is temporarily limited while we review a conduct concern.'],
  restrict_payments: ['Some payment and wallet actions are temporarily limited while we review a payment issue. Your balance is safe.'],
  deactivate: [
    'Your Lé Inspa account has been deactivated. Your booking and payment history is kept as required.',
    'As requested, your account has been deactivated. Contact support if you would like to return.',
  ],
  reactivate: ['Good news — your Lé Inspa account access has been restored.'],
  lift: ['The restriction on your account has been removed. Thank you for your patience.'],
  request_info: ['Please provide the requested information so we can finish an account review.'],
  send_warning: ['This is a formal reminder of the Lé Inspa platform policy that applies to your account.'],
  place_review: ['Your account is under routine review. Your access is not affected.'],
}

// Action catalogue. `risk` drives the visual weight and whether re-verification is expected.
export const ACTION_META = {
  restrict_booking: { label: 'Restrict Booking Access', title: 'Restrict Booking Access', kind: 'booking', risk: 'medium', reasons: RESTRICT_REASONS, history: 'Booking Restriction', scope: 'Bookings', confirm: 'Apply Restriction', reviewTitle: 'Review Restriction', notice: 'Prevents the client from creating new bookings. Existing bookings are not cancelled.' },
  restrict_messaging: { label: 'Restrict Messaging', title: 'Restrict Messaging', kind: 'messaging', risk: 'medium', reasons: RESTRICT_REASONS, history: 'Messaging Restriction', scope: 'Messages', confirm: 'Apply Restriction', reviewTitle: 'Review Restriction', notice: 'Prevents or limits messaging only where policy or safety controls justify it.' },
  restrict_payments: { label: 'Restrict Payments / Wallet', title: 'Restrict Payments / Wallet', kind: 'payments', risk: 'high', reasons: RESTRICT_REASONS, history: 'Payment Restriction', scope: 'Payments', confirm: 'Apply Restriction', reviewTitle: 'Review Restriction', notice: 'Limits new wallet and payment actions only. Unrelated funds are never frozen automatically.' },
  request_info: { label: 'Request Information', title: 'Request Information', risk: 'low', reasons: INFO_REASONS, history: 'Information Requested', scope: 'Account', confirm: 'Send Request', reviewTitle: 'Review Request', notice: 'Asks the client to complete an account-related requirement. Access is not affected.' },
  send_warning: { label: 'Send Warning', title: 'Send Formal Warning', risk: 'low', reasons: WARNING_REASONS, history: 'Warning Issued', scope: 'Account', confirm: 'Send Warning', reviewTitle: 'Review Warning', notice: 'Sends a formal platform warning where policy permits. Access is not affected.' },
  place_review: { label: 'Place Under Review', title: 'Place Account Under Review', kind: 'review', risk: 'low', reasons: REVIEW_REASONS, history: 'Placed Under Review', scope: 'Account', confirm: 'Start Review', reviewTitle: 'Review Account Review', notice: '“Under review” does not restrict access — it never silently behaves like a suspension.' },
  suspend: { label: 'Suspend Account', title: 'Suspend Client Account', kind: 'suspension', risk: 'high', reasons: SUSPEND_REASONS, history: 'Account Suspended', scope: 'Account', confirm: 'Confirm Suspension', reviewTitle: 'Review Suspension' },
  reactivate: { label: 'Reactivate Account', title: 'Reactivate Client', risk: 'high', reasons: REACTIVATE_REASONS, history: 'Account Reactivated', scope: 'Account', confirm: 'Confirm Reactivation', reviewTitle: 'Review Reactivation' },
  deactivate: { label: 'Deactivate Account', title: 'Deactivate Client Account', risk: 'high', reasons: DEACTIVATE_REASONS, history: 'Account Deactivated', scope: 'Account', confirm: 'Confirm Deactivation', reviewTitle: 'Review Deactivation' },
  lift: { label: 'Review Restriction', title: 'Review Restriction', risk: 'medium', reasons: LIFT_REASONS, history: 'Restriction Removed', scope: 'Account', confirm: 'Remove Restriction', reviewTitle: 'Review Removal' },
}

// Completed = green · Removed / ended = grey · Active = amber.
export const HISTORY_STATUS_STYLE = {
  completed: { label: 'Completed', box: 'bg-[#dcf6e4] text-[#15803d]', dot: 'fill-[#22a652] text-white' },
  removed: { label: 'Removed', box: 'bg-[#e6e8ee] text-[#3f4457]', dot: 'fill-[#5d6579] text-white' },
  active: { label: 'Active', box: 'bg-[#ffe9d2] text-[#c2570c]', dot: 'fill-[#f08a24] text-white' },
}

export const NOTIFICATION_STATUS_STYLE = {
  delivered: { label: 'Delivered', box: 'bg-[#dcf6e4] text-[#15803d]', dot: 'fill-[#22a652] text-white' },
  queued: { label: 'Queued', box: 'bg-[#ffe9d2] text-[#c2570c]', dot: 'fill-[#f08a24] text-white' },
  failed: { label: 'Failed', box: 'bg-[#fde2e2] text-[#dc2626]', dot: 'fill-[#e03a3a] text-white' },
}

export const HISTORY_PREVIEW = 5
