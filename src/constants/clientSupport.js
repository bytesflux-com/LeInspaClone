// ADM-018 — Client Support & Safety History: shared constants.
// The screen is an aggregated, read-mostly Admin view over the real case systems
// (`support_tickets`, `disputes`, `safety_reports`, provider/client report records).
// Support ≠ Dispute ≠ Safety ≠ Report: the four case types stay distinct everywhere.

export const CASE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'support', label: 'Support' },
  { id: 'dispute', label: 'Disputes' },
  { id: 'safety', label: 'Safety' },
  { id: 'report', label: 'Reports' },
]

export const DATE_OPTIONS = [
  { value: '', label: 'Any date' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'year', label: 'This year' },
]

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In Review' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export const PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
]

// "Case Type" is the issue category inside the case systems (the case system itself is the tab).
export const CATEGORY_OPTIONS = [
  { value: '', label: 'All case types' },
  { value: 'payment', label: 'Payment' },
  { value: 'refund', label: 'Refund' },
  { value: 'booking', label: 'Booking' },
  { value: 'account', label: 'Account' },
  { value: 'technical', label: 'Technical' },
  { value: 'service', label: 'Service' },
  { value: 'conduct', label: 'Professional Conduct' },
  { value: 'safety', label: 'Safety' },
]

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'priority', label: 'Highest priority first' },
]

export const PAGE_SIZES = [10, 20, 50]
export const DEFAULT_PAGE_SIZE = 10

export const TYPE_LABELS = { support: 'Support', dispute: 'Dispute', safety: 'Safety', report: 'Report' }

// Support = lavender · Pending investigation = amber · Resolved = green · Critical safety = red · Closed = grey.
export const STATUS_STYLE = {
  open: { label: 'Open', box: 'bg-[#ffe9d2] text-[#c2570c]', dot: 'fill-[#f08a24] text-white', icon: 'dot' },
  in_review: { label: 'In Review', box: 'bg-[#ffe9d2] text-[#c2570c]', dot: 'fill-[#f08a24] text-white', icon: 'dot' },
  investigating: { label: 'Investigating', box: 'bg-[#e4defb] text-[#3b1fd6]', dot: 'fill-[#4527c8] text-white', icon: 'info' },
  under_investigation: { label: 'Under Investigation', box: 'bg-[#fde2e2] text-[#dc2626]', dot: 'fill-[#e03a3a] text-white', icon: 'info' },
  resolved: { label: 'Resolved', box: 'bg-[#dcf6e4] text-[#15803d]', dot: 'fill-[#22a652] text-white', icon: 'check' },
  closed: { label: 'Closed', box: 'bg-[#e6e8ee] text-[#3f4457]', dot: 'fill-[#7d8599] text-white', icon: 'check' },
}

export const PRIORITY_STYLE = {
  critical: { label: 'Critical', cls: 'font-bold text-[#dc2626]' },
  high: { label: 'High', cls: 'font-semibold text-[#dc2626]' },
  normal: { label: 'Normal', cls: 'text-[#1b1140]' },
  low: { label: 'Low', cls: 'text-[#4a4466]' },
}

export const PRIORITY_RANK = { critical: 0, high: 1, normal: 2, low: 3 }

export const ASSIGNEES = [
  { id: 'jane', name: 'Jane', team: 'Support Team' },
  { id: 'peter', name: 'Peter', team: 'Support Team' },
  { id: 'mary', name: 'Mary', team: 'Support Team' },
  { id: 'john', name: 'John', team: 'Support Team' },
  { id: 'tom', name: 'Tom', team: 'Support Team' },
]

export const UNRESOLVED = ['open', 'in_review', 'investigating', 'under_investigation']
