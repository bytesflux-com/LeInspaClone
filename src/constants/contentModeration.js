// ADM-035 → ADM-037 — Content moderation: shared labels, colours and routes.
// States are separate from provider verification (ADM-029–034).

export const CONTENT_BASE = '/content-approval'

// Type routes reuse the ADM-035 queue pre-filtered to one content type.
export const TYPE_ROUTES = {
  profile_photo: `${CONTENT_BASE}/profile-photos`,
  profile_change: `${CONTENT_BASE}/profile-changes`,
  gallery: `${CONTENT_BASE}/gallery`,
  service: `${CONTENT_BASE}/services`,
  offer: `${CONTENT_BASE}/offers`,
  business_profile: `${CONTENT_BASE}/business`,
}

// Full-screen review for the types that have one; others use the ADM-035 panel.
export const reviewPath = (row) => (['profile_photo', 'profile_change', 'gallery', 'service'].includes(row.contentType) ? `${TYPE_ROUTES[row.contentType]}/${row.id}` : null)

// ADM-040 — shared Request More Information.
export const INFO_REQUESTS = '/information-requests'
export const infoRequestPath = (originModule, originRecordId, returnTo) =>
  `${INFO_REQUESTS}/new?module=${encodeURIComponent(originModule)}&record=${encodeURIComponent(originRecordId)}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`

export const CONTENT_TABS = [
  ['all', 'All Content'],
  ['profile_photo', 'Profile Photos'],
  ['profile_change', 'Profile Changes'],
  ['gallery', 'Gallery'],
  ['service', 'Service Content'],
  ['business_profile', 'Business Profiles'],
  ['offer', 'Offers'],
  ['package', 'Packages'],
  ['other', 'Other Public Content'],
]

export const CONTENT_STATUS = {
  awaiting_review: ['Awaiting Review', 'orange'],
  under_review: ['Under Review', 'purple'],
  resubmitted: ['Resubmitted', 'blue'],
  escalated: ['Escalated', 'red'],
  changes_requested: ['Changes Requested', 'orange'],
  reverification: ['Re-verification', 'red'],
  approved: ['Approved', 'green'],
  rejected: ['Rejected', 'red'],
}

export const PRIORITY = {
  urgent: ['Urgent', 'red'],
  high: ['High', 'red'],
  normal: ['Normal', 'grey'],
  low: ['Low', 'green'],
}

export const MEDIA_CATEGORY = {
  profile: 'Profile',
  gallery: 'Gallery',
  services: 'Services',
  facilities: 'Facilities',
  wellness_locations: 'Wellness Locations',
}

export const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.entries(CONTENT_STATUS).map(([value, [label]]) => ({ value, label })),
  { value: 'overdue', label: 'Overdue' },
]
export const PRIORITY_OPTIONS = [{ value: '', label: 'All priorities' }, ...Object.entries(PRIORITY).map(([value, [label]]) => ({ value, label }))]
export const SUBMITTED_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]
export const TYPE_OPTIONS = [{ value: 'all', label: 'All content types' }, ...CONTENT_TABS.slice(1).map(([value, label]) => ({ value, label }))]

export const FIELD_STATUS = {
  pending: ['Under Review', 'purple'],
  approved: ['Approved', 'green'],
  published: ['Published', 'green'],
  changes_requested: ['Changes Requested', 'orange'],
  rejected: ['Rejected', 'red'],
  reverification: ['Re-verification', 'red'],
}

export const INFO_STATUS = {
  draft: ['Draft', 'purple'],
  sent: ['Waiting for Provider', 'orange'],
  waiting: ['Waiting for Provider', 'orange'],
  partially_responded: ['Partially Responded', 'orange'],
  responded: ['Responded', 'green'],
  overdue: ['Response Overdue', 'red'],
  completed: ['Completed', 'green'],
  cancelled: ['Cancelled', 'grey'],
}

export const DECISION_COPY = {
  reverify: { title: 'Send for Re-verification', cta: 'Send for Re-verification', tone: 'purple' },
  approve: { title: 'Approve Content', cta: 'Approve Content', tone: 'green' },
  request_changes: { title: 'Request Changes', cta: 'Send Request', tone: 'orange' },
  reject: { title: 'Reject Content', cta: 'Confirm Rejection', tone: 'red' },
  escalate: { title: 'Escalate Review', cta: 'Escalate', tone: 'purple' },
}
