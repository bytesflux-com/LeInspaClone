import {
  AlarmClock,
  ArrowLeftRight,
  BadgeCheck,
  Banknote,
  Box,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CalendarX2,
  CircleCheck,
  CircleX,
  Clock,
  CreditCard,
  Flag,
  Hand,
  Headset,
  Hourglass,
  Link2,
  MessageSquareWarning,
  PhoneOff,
  Play,
  Repeat,
  RotateCcw,
  ShieldAlert,
  Star,
  Store,
  Timer,
  TriangleAlert,
  UserCheck,
  UserCog,
  UserRound,
  UserX,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react'

// ADM-044 → ADM-048 — Booking Operations: shared labels, colours and view config.
// Every screen is a view over the shared `bookings` collection; the states below
// are derived server-side (functions/src/bookingsLogic.js), never stored.

export const PROVIDER_CATEGORY_OPTIONS = [
  { value: '', label: 'All Provider Types' },
  { value: 'individual', label: 'Individual Professionals' },
  { value: 'spa', label: 'Spa & Wellness Centers' },
  { value: 'hotel', label: 'Hotels & Wellness Resorts' },
]

export const SOURCE_LABELS = {
  app: 'Lé Inspa App',
  shared_link: 'Shared Link',
  qr_code: 'QR Code',
  website: 'Website',
  walk_in: 'Walk-In',
  manual: 'Manual',
  phone: 'Phone',
  guest: 'Guest Booking',
}
export const SOURCE_OPTIONS = [{ value: '', label: 'All sources' }, ...Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label }))]

export const PAYMENT_OPTIONS = [
  { value: '', label: 'All payment states' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunding', label: 'Refunding' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'disputed', label: 'Disputed' },
]

export const ASSIGNMENT_OPTIONS = [
  { value: '', label: 'All assignment states' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'reassignment_needed', label: 'Reassignment needed' },
  { value: 'conflict', label: 'Assignment conflict' },
  { value: 'not_required', label: 'Not required' },
]

// Tones follow the design rules: green healthy, purple active workflow,
// orange attention, red conflict/failed, blue refunded, grey neutral.
export const TONE = {
  green: 'bg-[#dcf6e4] text-[#15803d]',
  purple: 'bg-[#e4defb] text-[#3b1fd6]',
  orange: 'bg-[#ffe9d2] text-[#c2570c]',
  red: 'bg-[#fde2e2] text-[#dc2626]',
  blue: 'bg-[#dce6ff] text-[#2f5bd3]',
  grey: 'bg-[#eceef3] text-[#4b5068]',
}
export const DOT = {
  green: 'bg-[#22a652]',
  purple: 'bg-[#4527c8]',
  orange: 'bg-[#f08a24]',
  red: 'bg-[#e03a3a]',
  blue: 'bg-[#3b6fe6]',
  grey: 'bg-[#9aa0b4]',
}

export const BOOKING_STATUS = {
  pending: ['Pending', 'orange'],
  negotiation: ['Negotiation', 'orange'],
  accepted: ['Accepted', 'purple'],
  confirmed: ['Confirmed', 'purple'],
  on_the_way: ['On the way', 'purple'],
  arrived: ['Arrived', 'purple'],
  service_in_progress: ['In Progress', 'purple'],
  awaiting_client_confirmation: ['Awaiting Confirmation', 'orange'],
  completed: ['Completed', 'green'],
  cancelled: ['Cancelled', 'grey'],
  rejected: ['Rejected', 'grey'],
  expired: ['Expired', 'grey'],
}

export const OPERATIONAL = {
  conflict: ['Conflict', 'red'],
  service_problem: ['Service Problem', 'red'],
  running_late: ['Running Late', 'orange'],
  over_time: ['Running Over Time', 'orange'],
  awaiting_completion: ['Awaiting Completion', 'orange'],
  needs_attention: ['Needs Attention', 'orange'],
  approaching_end: ['Approaching End', 'purple'],
  in_progress: ['In Progress', 'purple'],
  starting_soon: ['Starting Soon', 'purple'],
  upcoming: ['Upcoming', 'purple'],
  scheduled: ['Scheduled', 'grey'],
}

export const PAYMENT = {
  paid: ['Paid', 'green'],
  pending: ['Pending', 'orange'],
  failed: ['Failed', 'red'],
  refunding: ['Refunding', 'blue'],
  refunded: ['Refunded', 'blue'],
  disputed: ['Disputed', 'purple'],
}

export const ASSIGNMENT = {
  assigned: ['Assigned', 'green'],
  unassigned: ['Unassigned', 'orange'],
  reassignment_needed: ['Reassignment Needed', 'orange'],
  conflict: ['Assignment Conflict', 'red'],
  not_required: ['Not Required', 'grey'],
}

export const READINESS = {
  ready: ['Ready', 'green'],
  needs_attention: ['Needs Attention', 'orange'],
  payment_pending: ['Payment Pending', 'orange'],
  assignment_pending: ['Assignment Pending', 'orange'],
  conflict: ['Conflict', 'red'],
}

// ADM-048: provider settlement / payout — not payment status, not funds status.
export const SETTLEMENT = {
  settled: ['Settled', 'green'],
  pending: ['Settlement Pending', 'orange'],
  on_hold: ['On Hold', 'purple'],
  refunded: ['Refunded', 'blue'],
}

// Held funds (escrow) as defined in the payment architecture.
export const FUNDS = {
  pending: ['Pending', 'orange'],
  held: ['Funded', 'purple'],
  released: ['Released', 'green'],
  disputed: ['Disputed', 'purple'],
  refunded: ['Refunded', 'blue'],
}

export const CONFIRMATION = {
  confirmed: ['Client Confirmed', 'green'],
  pending: ['Awaiting Client', 'orange'],
}

export const POST_SERVICE = {
  complete: ['Complete', 'green'],
  follow_up: ['Follow-Up', 'orange'],
  refund_requested: ['Refund Requested', 'red'],
  refund_resolved: ['Refund Resolved', 'grey'],
  disputed: ['Disputed', 'red'],
  chargeback: ['Chargeback', 'red'],
}

// ADM-049: who cancelled, refund outcome and resolution are separate states.
export const CANCELLED_BY = {
  client: ['Client', 'grey'],
  provider: ['Provider', 'orange'],
  admin: ['Admin', 'purple'],
  system: ['System', 'grey'],
  unknown: ['Not recorded', 'grey'],
}

export const REFUND = {
  pending: ['Refund Pending', 'orange'],
  not_started: ['Not Started', 'red'],
  failed: ['Refund Failed', 'red'],
  refunded: ['Refunded', 'green'],
  no_refund: ['No Refund', 'grey'],
  not_applicable: ['No Payment', 'grey'],
}

export const RESOLUTION = {
  resolved: ['Resolved', 'grey'],
  closed: ['Closed', 'grey'],
  needs_attention: ['Needs Attention', 'orange'],
  disputed: ['Disputed', 'purple'],
}

// ADM-050: account-link state. "Not Registered" is a valid state, never a warning.
export const ACCOUNT = {
  not_registered: ['Not Registered', 'grey'],
  registration_started: ['Registration Started', 'purple'],
  account_created: ['Account Created', 'green'],
  linked: ['Account Linked', 'green'],
  link_pending: ['Link Pending', 'orange'],
  link_conflict: ['Link Conflict', 'red'],
}

export const LIFECYCLE = {
  upcoming: ['Upcoming', 'purple'],
  ongoing: ['Ongoing', 'purple'],
  completed: ['Completed', 'green'],
  cancelled: ['Cancelled', 'grey'],
}

export const CONTACT = {
  verified: ['Verified', 'green'],
  unverified: ['Unverified', 'orange'],
  missing: ['No contact', 'red'],
}

export const ISSUE_ICONS = {
  conflict: CalendarX2,
  resource_conflict: Box,
  service_problem: TriangleAlert,
  payment_issue: CreditCard,
  unassigned: UsersRound,
  disputed: ShieldAlert,
  client_issue: MessageSquareWarning,
  provider_issue: UserCog,
  provider_unavailable: UserX,
  client_action: Hand,
  assignment_changed: ArrowLeftRight,
  running_late: AlarmClock,
  over_time: Timer,
  awaiting_confirmation: Hourglass,
  settlement_pending: Wallet,
  refund_requested: RotateCcw,
  chargeback: CreditCard,
  support_follow_up: Headset,
  safety_report: ShieldAlert,
  review_reported: Flag,
  refund_pending: RotateCcw,
  refund_not_started: Banknote,
  provider_no_show: UserX,
  dispute_open: ShieldAlert,
  repeated_provider: Repeat,
  safety_cancellation: ShieldAlert,
  support_open: Headset,
  link_pending: Link2,
  duplicate_match: Users,
  contact_issue: PhoneOff,
  guest_support: Headset,
}

export const ISSUE_LABELS = {
  conflict: 'Booking Conflict',
  resource_conflict: 'Resource Conflict',
  service_problem: 'Service Problem',
  payment_issue: 'Payment Issue',
  unassigned: 'Unassigned Specialist',
  disputed: 'Disputed',
  client_issue: 'Client Reported Problem',
  provider_issue: 'Provider Reported Issue',
  provider_unavailable: 'Provider Unavailable',
  client_action: 'Client Action Required',
  assignment_changed: 'Assignment Changed',
  running_late: 'Running Late',
  over_time: 'Running Over Time',
  awaiting_confirmation: 'Awaiting Client Confirmation',
  settlement_pending: 'Settlement Pending',
  refund_requested: 'Refund Requested',
  chargeback: 'Chargeback / Payment Issue',
  support_follow_up: 'Support Follow-Up',
  safety_report: 'Safety Report',
  review_reported: 'Review Reported',
  refund_pending: 'Refund Pending',
  refund_not_started: 'Payment Taken — Refund Not Started',
  provider_no_show: 'Provider No-Show / Late Cancellation',
  dispute_open: 'Dispute Open',
  repeated_provider: 'Repeated Provider Cancellations',
  safety_cancellation: 'Safety-Related Cancellation',
  support_open: 'Support Case Open',
  link_pending: 'Account Link Pending',
  duplicate_match: 'Duplicate Account Match',
  contact_issue: 'Contact Verification Issue',
  guest_support: 'Guest Support Request',
}

const opts = (all, map) => [{ value: '', label: all }, ...Object.entries(map).map(([value, [label]]) => ({ value, label }))]

// Filter dropdowns available to the workspaces (each view lists the ones it uses).
export const FILTER_DEFS = {
  pay: { label: 'Payment status', options: PAYMENT_OPTIONS, width: 'w-48' },
  assign: { label: 'Assignment', options: ASSIGNMENT_OPTIONS, width: 'w-52' },
  src: { label: 'Booking source', options: SOURCE_OPTIONS, width: 'w-44' },
  settle: { label: 'Settlement', options: opts('All settlement states', SETTLEMENT), width: 'w-48', finance: true },
  confirm: { label: 'Confirmation', options: opts('All confirmation states', CONFIRMATION), width: 'w-52' },
  review: { label: 'Review', options: [{ value: '', label: 'Any review status' }, { value: 'reviewed', label: 'Reviewed' }, { value: 'not_reviewed', label: 'Not reviewed' }], width: 'w-44' },
  by: { label: 'Cancelled by', options: opts('Cancelled by anyone', CANCELLED_BY), width: 'w-48' },
  refund: { label: 'Refund status', options: [{ value: '', label: 'All refund states' }, { value: 'pending', label: 'Pending' }, { value: 'refunded', label: 'Refunded' }, { value: 'no_refund', label: 'No refund' }], width: 'w-44' },
  account: { label: 'Account status', options: opts('All account states', ACCOUNT), width: 'w-52' },
  contact: { label: 'Contact verification', options: opts('Any verification', CONTACT), width: 'w-48' },
  lifecycle: { label: 'Booking status', options: opts('All booking states', LIFECYCLE), width: 'w-44' },
}

// Per-workspace configuration (ADM-045 → ADM-050).
export const VIEW_CONFIG = {
  active: {
    adm: 'ADM-045',
    path: '/bookings/active',
    title: 'Active Bookings',
    subtitle: 'Monitor bookings currently happening or requiring immediate operational attention.',
    periodControl: false,
    summary: [
      { key: 'activeNow', label: 'Active Now', icon: Play, color: 'purple', tab: 'in_progress' },
      { key: 'startingSoon', label: 'Starting Soon', icon: Clock, color: 'blue', tab: 'starting_soon' },
      { key: 'runningLate', label: 'Running Late', icon: AlarmClock, color: 'orange', tab: 'running_late' },
      { key: 'needsAttention', label: 'Needs Attention', icon: TriangleAlert, color: 'orange', tab: 'needs_attention' },
      { key: 'awaitingCompletion', label: 'Awaiting Completion', icon: CircleCheck, color: 'green', tab: 'awaiting_completion' },
      { key: 'unassigned', label: 'Unassigned', icon: UserX, color: 'slate', tab: 'unassigned' },
    ],
    attention: { conflict: 'red', running_late: 'orange', unassigned: 'orange', payment_issue: 'orange', resource_conflict: 'red', client_issue: 'purple' },
    attentionSubtitle: 'Operational issues that require admin review.',
    attentionLabels: { running_late: 'Provider Running Late' },
    tabs: [
      ['all', 'All Active'],
      ['starting_soon', 'Starting Soon'],
      ['in_progress', 'In Progress'],
      ['running_late', 'Running Late'],
      ['awaiting_completion', 'Awaiting Completion'],
      ['needs_attention', 'Needs Attention'],
      ['unassigned', 'Unassigned'],
    ],
    filters: ['pay', 'assign', 'src'],
    columns: ['booking', 'client', 'provider', 'service', 'time', 'market', 'payment', 'assignment', 'operational', 'action'],
    empty: 'No bookings are active right now in this market.',
  },
  upcoming: {
    adm: 'ADM-046',
    path: '/bookings/upcoming',
    title: 'Upcoming Bookings',
    subtitle: 'Monitor bookings scheduled to happen across Lé Inspa.',
    periodControl: false,
    summary: [
      { key: 'upcoming', label: 'Upcoming', icon: CalendarDays, color: 'purple', tab: 'all' },
      { key: 'today', label: 'Today', icon: CalendarCheck, color: 'blue', tab: 'today' },
      { key: 'tomorrow', label: 'Tomorrow', icon: CalendarClock, color: 'blue', tab: 'tomorrow' },
      { key: 'next7', label: 'Next 7 Days', icon: CalendarRange, color: 'purple', tab: 'next_7' },
      { key: 'paymentPending', label: 'Payment Pending', icon: Wallet, color: 'orange', issue: 'payment_issue' },
      { key: 'needsAttention', label: 'Needs Attention', icon: TriangleAlert, color: 'orange', tab: 'needs_attention' },
    ],
    attention: { payment_issue: 'orange', unassigned: 'orange', conflict: 'red', provider_unavailable: 'orange', client_action: 'purple' },
    attentionSubtitle: 'Pre-service risks to resolve before service time.',
    attentionLabels: { payment_issue: 'Payment Pending', unassigned: 'Unassigned' },
    tabs: [
      ['all', 'All Upcoming'],
      ['today', 'Today'],
      ['tomorrow', 'Tomorrow'],
      ['next_7', 'Next 7 Days'],
      ['next_30', 'Next 30 Days'],
      ['needs_attention', 'Needs Attention'],
    ],
    filters: ['pay', 'assign', 'src'],
    columns: ['booking', 'client', 'provider', 'service', 'scheduled', 'market', 'amount', 'payment', 'assignment', 'readiness', 'action'],
    empty: 'No upcoming bookings match this view.',
  },
  ongoing: {
    adm: 'ADM-047',
    path: '/bookings/ongoing',
    title: 'Ongoing Bookings',
    subtitle: 'Monitor services currently in progress across Lé Inspa.',
    periodControl: false,
    summary: [
      { key: 'inProgress', label: 'In Progress', icon: Play, color: 'purple', tab: 'all' },
      { key: 'approachingEnd', label: 'Approaching End', icon: Clock, color: 'blue', tab: 'approaching_end' },
      { key: 'overTime', label: 'Running Over Time', icon: Timer, color: 'orange', tab: 'over_time' },
      { key: 'needsAttention', label: 'Needs Attention', icon: TriangleAlert, color: 'orange', tab: 'needs_attention' },
      { key: 'clientIssue', label: 'Client Reported Issue', icon: UserRound, color: 'red', tab: 'client_issue' },
      { key: 'providerIssue', label: 'Provider Reported Issue', icon: UserCog, color: 'purple', tab: 'provider_issue' },
    ],
    attention: { over_time: 'red', service_problem: 'red', provider_issue: 'orange', assignment_changed: 'orange', client_issue: 'purple', payment_issue: 'red' },
    attentionSubtitle: 'Issues detected in ongoing services that may require admin intervention.',
    attentionTitle: 'Live Service Alerts',
    attentionLabels: { over_time: 'Service Running Over Expected Time', service_problem: 'Client Safety / Service Concern', provider_issue: 'Provider Reported Delay', assignment_changed: 'Assignment Changed During Service', client_issue: 'Client Requested Support', payment_issue: 'Payment / Booking Integrity Issue' },
    tabs: [
      ['all', 'All Ongoing'],
      ['in_progress', 'In Progress'],
      ['approaching_end', 'Approaching End'],
      ['over_time', 'Running Over Time'],
      ['needs_attention', 'Needs Attention'],
      ['client_issue', 'Client Issue'],
      ['provider_issue', 'Provider Issue'],
    ],
    filters: ['pay', 'assign', 'src'],
    columns: ['booking', 'client', 'provider', 'service', 'started', 'expectedEnd', 'elapsed', 'market', 'payment', 'operational', 'action'],
    empty: 'No services are in progress right now.',
  },
  completed: {
    adm: 'ADM-048',
    path: '/bookings/completed',
    title: 'Completed Bookings',
    subtitle: 'Review completed services and their post-service status across Lé Inspa.',
    periodControl: true,
    defaultRange: '30d',
    summary: [
      { key: 'completed', label: 'Completed', icon: CircleCheck, color: 'green', tab: 'all' },
      { key: 'today', label: 'Completed Today', icon: CalendarCheck, color: 'blue', tab: 'today' },
      { key: 'confirmed', label: 'Client Confirmed', icon: BadgeCheck, color: 'green', tab: 'confirmed' },
      { key: 'awaitingSettlement', label: 'Awaiting Settlement', icon: Hourglass, color: 'orange', tab: 'settlement_pending', finance: true },
      { key: 'reviewed', label: 'Reviewed', icon: Star, color: 'purple', tab: 'reviewed' },
      { key: 'postServiceIssues', label: 'Post-Service Issues', icon: TriangleAlert, color: 'red', tab: 'disputed' },
    ],
    attention: { awaiting_confirmation: 'orange', settlement_pending: 'orange', refund_requested: 'red', disputed: 'purple', chargeback: 'red', support_follow_up: 'orange' },
    attentionTitle: 'Post-Service Attention',
    attentionSubtitle: 'Genuine follow-up after service completion.',
    attentionLabels: { disputed: 'Disputed' },
    tabs: [
      ['all', 'All Completed'],
      ['today', 'Completed Today'],
      ['confirmed', 'Client Confirmed'],
      ['settlement_pending', 'Settlement Pending'],
      ['reviewed', 'Reviewed'],
      ['refunded', 'Refunded'],
      ['disputed', 'Disputed'],
    ],
    filters: ['pay', 'settle', 'confirm', 'src', 'review'],
    sorts: [{ value: 'priority', label: 'Unresolved first' }, { value: 'recent', label: 'Recently completed' }, { value: 'amount', label: 'Highest amount' }],
    columns: ['booking', 'client', 'provider', 'service', 'completed', 'market', 'amount', 'confirmation', 'settlement', 'postService', 'action'],
    empty: 'No bookings were completed in this period.',
  },
  cancelled: {
    adm: 'ADM-049',
    path: '/bookings/cancelled',
    title: 'Cancelled Bookings',
    subtitle: 'Review cancelled bookings and resolve outstanding cancellation issues across Lé Inspa.',
    periodControl: true,
    defaultRange: '30d',
    summary: [
      { key: 'total', label: 'Total Cancelled', icon: CircleX, color: 'red', tab: 'all' },
      { key: 'today', label: 'Cancelled Today', icon: CalendarX2, color: 'slate' },
      { key: 'client', label: 'Client Cancelled', icon: UserRound, color: 'blue', tab: 'client' },
      { key: 'provider', label: 'Provider Cancelled', icon: Store, color: 'purple', tab: 'provider' },
      { key: 'refundPending', label: 'Refund Pending', icon: RotateCcw, color: 'orange', tab: 'refund_pending' },
      { key: 'needsAttention', label: 'Needs Attention', icon: TriangleAlert, color: 'orange', tab: 'needs_attention' },
    ],
    attention: { refund_pending: 'orange', refund_not_started: 'red', provider_no_show: 'red', dispute_open: 'purple', repeated_provider: 'orange', safety_cancellation: 'red' },
    attentionSubtitle: 'Unresolved or risk-relevant cancellations.',
    attentionLabels: {},
    tabs: [
      ['all', 'All Cancelled'],
      ['client', 'Client Cancelled'],
      ['provider', 'Provider Cancelled'],
      ['admin', 'Admin Cancelled'],
      ['refund_pending', 'Refund Pending'],
      ['refunded', 'Refunded'],
      ['no_refund', 'No Refund'],
      ['needs_attention', 'Needs Attention'],
    ],
    filters: ['by', 'pay', 'refund', 'src'],
    sorts: [{ value: 'priority', label: 'Unresolved first' }, { value: 'recent', label: 'Recently cancelled' }, { value: 'time', label: 'Scheduled time' }],
    columns: ['booking', 'client', 'provider', 'service', 'scheduled', 'cancelledBy', 'reason', 'payment', 'refund', 'resolution', 'action'],
    empty: 'No bookings were cancelled in this period.',
  },
  guest: {
    adm: 'ADM-050',
    path: '/guest-bookings',
    title: 'Guest Bookings',
    subtitle: 'Monitor bookings made without a registered Lé Inspa account.',
    periodControl: true,
    defaultRange: '30d',
    searchPlaceholder: 'Search booking ID, guest name, phone or email…',
    summary: [
      { key: 'guests', label: 'Guest Bookings', icon: UserRound, color: 'purple', tab: 'all' },
      { key: 'upcoming', label: 'Upcoming', icon: CalendarDays, color: 'blue', tab: 'upcoming' },
      { key: 'completed', label: 'Completed', icon: CircleCheck, color: 'green', tab: 'completed' },
      { key: 'accountsCreated', label: 'Accounts Created', icon: UserCheck, color: 'green', tab: 'account_created' },
      { key: 'awaitingLink', label: 'Awaiting Account Link', icon: Link2, color: 'orange', tab: 'link_issues' },
      { key: 'needsAttention', label: 'Needs Attention', icon: TriangleAlert, color: 'orange' },
    ],
    attention: { link_pending: 'orange', duplicate_match: 'red', contact_issue: 'orange', payment_issue: 'red', guest_support: 'orange' },
    attentionSubtitle: 'Guest-specific booking and account issues.',
    attentionLabels: { payment_issue: 'Payment Issue' },
    tabs: [
      ['all', 'All Guests'],
      ['upcoming', 'Upcoming'],
      ['ongoing', 'Ongoing'],
      ['completed', 'Completed'],
      ['cancelled', 'Cancelled'],
      ['account_created', 'Account Created'],
      ['not_registered', 'Not Registered'],
      ['link_issues', 'Link Issues'],
    ],
    filters: ['lifecycle', 'account', 'contact', 'pay', 'src'],
    sorts: [{ value: 'priority', label: 'Issues first' }, { value: 'recent', label: 'Newest booking' }, { value: 'time', label: 'Scheduled time' }],
    columns: ['booking', 'guest', 'provider', 'service', 'scheduled', 'market', 'payment', 'lifecycle', 'account', 'action'],
    empty: 'No guest bookings in this period.',
  },
}

// Sub-navigation shared by every booking workspace.
export const BOOKING_NAV = [
  { label: 'Overview', path: '/bookings' },
  { label: 'Active', path: '/bookings/active' },
  { label: 'Upcoming', path: '/bookings/upcoming' },
  { label: 'Ongoing', path: '/bookings/ongoing' },
  { label: 'Completed', path: '/bookings/completed' },
  { label: 'Cancelled', path: '/bookings/cancelled' },
  { label: 'Guest', path: '/guest-bookings' },
]

export const PAGE_SIZES = [10, 20, 50]
