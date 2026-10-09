// Date helpers for ADM-012. Relative labels are computed against the server's
// `asOf` timestamp (not the browser clock) in the client's market time zone,
// so "Today" / "2 hours ago" are consistent for every admin.
import { MARKETS } from '../constants/markets'

export const timeZoneFor = (country) => MARKETS.find((m) => m.id === country)?.timeZone || 'Africa/Nairobi'

function parts(iso, timeZone) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(iso))
  const get = (t) => Number(f.find((p) => p.type === t).value)
  return { y: get('year'), m: get('month'), d: get('day') }
}

const dayIndex = ({ y, m, d }) => Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)

export function formatTime(iso, timeZone) {
  return new Date(iso)
    .toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s/g, ' ')
}

// "12 Sep" / "12 Sep 2026" — built by hand because en-GB renders September as "Sept".
export function formatDay(iso, timeZone, { year = false } = {}) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone, day: 'numeric', month: 'short', year: 'numeric' }).formatToParts(new Date(iso))
  const get = (t) => f.find((p) => p.type === t).value
  return `${get('day')} ${get('month')}${year ? ` ${get('year')}` : ''}`
}

// "Today • 10:42 AM" · "Yesterday • 4:18 PM" · "7 Sep • 2:30 PM"
export function formatStamp(iso, asOf, timeZone) {
  const diff = dayIndex(parts(asOf, timeZone)) - dayIndex(parts(iso, timeZone))
  const day = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : formatDay(iso, timeZone)
  return `${day} • ${formatTime(iso, timeZone)}`
}

// "12 Sep 2026 • 2:00 PM"
export function formatFullStamp(iso, timeZone) {
  return `${formatDay(iso, timeZone, { year: true })} • ${formatTime(iso, timeZone)}`
}

export function formatAgo(iso, asOf) {
  if (!iso) return '—'
  const mins = Math.max(0, Math.round((new Date(asOf) - new Date(iso)) / 60_000))
  if (mins < 2) return 'Just now'
  if (mins < 60) return `${mins} minutes ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  const months = Math.round(days / 30)
  return `${months} ${months === 1 ? 'month' : 'months'} ago`
}

export function daysUntil(iso, asOf, timeZone) {
  return dayIndex(parts(iso, timeZone)) - dayIndex(parts(asOf, timeZone))
}
