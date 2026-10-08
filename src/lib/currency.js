// Currency Reporting and FX conversion engine for Lé Inspa Multi-Market Platform

// Benchmark exchange rates relative to USD (1 USD = base rate)
export const FX_RATES_TO_USD = {
  USD: 1,
  KES: 130.0,    // Kenya
  UGX: 3720.0,   // Uganda
  TZS: 2580.0,   // Tanzania
  RWF: 1320.0,   // Rwanda
  ZAR: 18.4,     // South Africa
}

export const ZERO_DECIMAL_CURRENCIES = new Set(['UGX', 'TZS', 'RWF', 'KES'])

/**
 * Converts an amount from one sovereign currency to a platform reporting currency.
 */
export function convertCurrency(amount, fromCurrency = 'USD', toCurrency = 'USD') {
  if (typeof amount !== 'number' || isNaN(amount)) return 0
  if (fromCurrency === toCurrency) return amount

  const fromRate = FX_RATES_TO_USD[fromCurrency] || 1
  const toRate = FX_RATES_TO_USD[toCurrency] || 1

  // Convert to USD base first, then to target currency
  const inUsd = amount / fromRate
  return inUsd * toRate
}

export function formatDisplayCurrency(amount, currency = 'KES') {
  if (typeof amount !== 'number' || isNaN(amount)) return '—'
  return `${currency} ${Math.round(amount).toLocaleString('en-US')}`
}

/**
 * Formats a currency amount with standard localized symbol and decimals.
 */
export function formatCurrency(amount, currency = 'USD') {
  if (typeof amount !== 'number' || isNaN(amount)) return '—'

  const hasDecimals = !ZERO_DECIMAL_CURRENCIES.has(currency)

  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: hasDecimals ? 2 : 0,
      minimumFractionDigits: hasDecimals ? 2 : 0,
    }).format(amount)
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString('en-US')}`
  }
}

/**
 * Compact currency for stat cards / high volume numbers (e.g. KSh 1.2M, $45.8K).
 */
export function formatCompactCurrency(amount, currency = 'USD') {
  if (typeof amount !== 'number' || isNaN(amount)) return '—'

  try {
    const compact = new Intl.NumberFormat('en', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(amount)

    // Prefix with currency symbol or code
    const prefix = currency === 'KES' ? 'KSh ' : currency === 'USD' ? '$' : currency === 'UGX' ? 'USh ' : currency === 'TZS' ? 'TSh ' : currency === 'RWF' ? 'FRw ' : currency === 'ZAR' ? 'R ' : `${currency} `
    return `${prefix}${compact}`
  } catch {
    return formatCurrency(amount, currency)
  }
}

