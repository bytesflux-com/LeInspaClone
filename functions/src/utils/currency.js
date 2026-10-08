// Currency & FX helper for Cloud Functions backend
export const FX_RATES_TO_USD = {
  USD: 1,
  KES: 130.0,
  UGX: 3720.0,
  TZS: 2580.0,
  RWF: 1320.0,
  ZAR: 18.4,
}

export function convertCurrency(amount, from = 'USD', to = 'USD') {
  if (typeof amount !== 'number' || isNaN(amount)) return 0
  if (from === to) return amount
  const fromRate = FX_RATES_TO_USD[from] || 1
  const toRate = FX_RATES_TO_USD[to] || 1
  return (amount / fromRate) * toRate
}

