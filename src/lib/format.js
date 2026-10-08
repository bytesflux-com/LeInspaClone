import { marketService } from '../services/marketService'
import { formatCurrency as formatWithCurrency, formatCompactCurrency } from './currency'

const number = new Intl.NumberFormat('en')
const kes = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 })

export const formatNumber = (n) => (typeof n === 'number' ? number.format(n) : '—')
export const formatKes = (n) => (typeof n === 'number' ? kes.format(n) : '—')

export function formatCurrency(amount, currency = 'USD', options = {}) {
  return formatWithCurrency(amount, currency)
}

export function formatMarketCurrency(amount, marketCode = 'ALL') {
  if (typeof amount !== 'number') return '—'
  const market = marketService.getMarketById(marketCode)
  return formatWithCurrency(amount, market.currency)
}

export function formatCompactNumber(n) {
  if (typeof n !== 'number') return '—'
  return new Intl.NumberFormat('en', { notation: 'compact', compactDisplay: 'short' }).format(n)
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function humanize(value) {
  if (!value) return '—'
  const text = String(value).replaceAll('_', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
