// Dashboard constants and telemetry status mappings
export const STATUS_STYLES = {
  service_in_progress: { label: 'In Progress', bg: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  on_the_way: { label: 'On The Way', bg: 'bg-sky-50 text-sky-700 ring-sky-600/20' },
  confirmed: { label: 'Confirmed', bg: 'bg-royal-50 text-royal-700 ring-royal-600/20' },
  completed: { label: 'Completed', bg: 'bg-gray-100 text-gray-700 ring-gray-600/10' },
  pending: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  cancelled: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 ring-rose-600/20' },
}

export const ATTENTION_TYPES = {
  VERIFICATION: 'verification',
  WITHDRAWALS: 'withdrawals',
  DISPUTES: 'disputes',
  SAFETY: 'safety',
}

