// General utility functions for Lé Inspa Admin

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function formatNumber(n) {
  if (typeof n !== 'number' || isNaN(n)) return '—'
  return new Intl.NumberFormat('en').format(n)
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function humanize(value) {
  if (!value) return '—'
  const text = String(value).replaceAll('_', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

