// Central Market Definitions for Lé Inspa Multi-Country Operations
export const MARKETS = [
  {
    id: 'ALL',
    code: 'ALL',
    name: 'All Markets',
    currency: 'USD',
    currencySymbol: '$',
    timeZone: 'Africa/Nairobi',
    isGlobal: true,
    enabled: true,
  },
  {
    id: 'KE',
    code: 'KE',
    name: 'Kenya',
    currency: 'KES',
    currencySymbol: 'KSh',
    timeZone: 'Africa/Nairobi',
    phonePrefix: '+254',
    isGlobal: false,
    enabled: true,
  },
  {
    id: 'UG',
    code: 'UG',
    name: 'Uganda',
    currency: 'UGX',
    currencySymbol: 'USh',
    timeZone: 'Africa/Kampala',
    phonePrefix: '+256',
    isGlobal: false,
    enabled: true,
  },
  {
    id: 'TZ',
    code: 'TZ',
    name: 'Tanzania',
    currency: 'TZS',
    currencySymbol: 'TSh',
    timeZone: 'Africa/Dar_es_Salaam',
    phonePrefix: '+255',
    isGlobal: false,
    enabled: true,
  },
  {
    id: 'RW',
    code: 'RW',
    name: 'Rwanda',
    currency: 'RWF',
    currencySymbol: 'FRw',
    timeZone: 'Africa/Kigali',
    phonePrefix: '+250',
    isGlobal: false,
    enabled: true,
  },
  {
    id: 'ZA',
    code: 'ZA',
    name: 'South Africa',
    currency: 'ZAR',
    currencySymbol: 'R',
    timeZone: 'Africa/Johannesburg',
    phonePrefix: '+27',
    isGlobal: false,
    enabled: true,
  },
]

export const DEFAULT_MARKET = MARKETS[0]

export const DATE_RANGES = [
  { id: 'today', label: 'Today', shortLabel: 'Today' },
  { id: 'yesterday', label: 'Yesterday', shortLabel: 'Yesterday' },
  { id: '7d', label: 'Last 7 Days', shortLabel: '7 Days' },
  { id: '30d', label: 'Last 30 Days', shortLabel: '30 Days' },
  { id: 'this_month', label: 'This Month', shortLabel: 'This Month' },
  { id: 'custom', label: 'Custom Range', shortLabel: 'Custom' },
]

export const DEFAULT_DATE_RANGE = '30d' // ADM-010/011 mockups open on Last 30 Days

