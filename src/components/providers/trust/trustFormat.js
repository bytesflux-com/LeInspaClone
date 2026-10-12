// Formatters shared by ADM-025 → ADM-028.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function fmtDate(ms, { year = true } = {}) {
  if (!ms) return '—'
  const d = new Date(ms)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${year ? ` ${d.getFullYear()}` : ''}`
}
export function fmtTime(ms) {
  if (!ms) return ''
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
export const fmtDateTime = (ms, opts) => (ms ? `${fmtDate(ms, opts)} • ${fmtTime(ms)}` : '—')
export function fmtMoney(money, currency) {
  if (money === null || money === undefined) return '—'
  if (typeof money === 'object') {
    if (money.masked) return `${money.currency || ''} ••••`.trim()
    if (money.amount === null || money.amount === undefined) return `${money.currency || ''} —`.trim()
    return `${money.currency || ''} ${Number(money.amount).toLocaleString('en')}`.trim()
  }
  return `${currency || ''} ${Number(money).toLocaleString('en')}`.trim()
}
export const humanize = (v) => (v ? String(v).replaceAll('_', ' ').replace(/^\w/, (c) => c.toUpperCase()) : '—')

export const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] text-slate-800 outline-none focus:border-royal-400 focus:ring-2 focus:ring-royal-100'

export const REVIEW_STATUS_PILL = {
  published: { tone: 'green', label: 'Published' },
  hidden: { tone: 'grey', label: 'Hidden' },
  removed: { tone: 'red', label: 'Removed' },
  pending_review: { tone: 'purple', label: 'Pending Review' },
}
