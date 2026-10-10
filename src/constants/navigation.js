import {
  LayoutDashboard,
  Activity,
  TriangleAlert,
  Users,
  BriefcaseBusiness,
  Flower2,
  Hotel,
  BadgeCheck,
  CalendarCheck,
  CreditCard,
  Banknote,
  CircleAlert,
  FileText,
  FileCheck,
  Megaphone,
  Gift,
  ShieldCheck,
  ChartNoAxesCombined,
  ChartLine,
  Settings,
  UsersRound,
  ScrollText,
  HeartPulse,
  Wallet,
  ListOrdered,
} from 'lucide-react'
import { PERMISSIONS } from './permissions.js'

export const NAVIGATION_SECTIONS = [
  {
    id: 'control',
    section: null,
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', permission: PERMISSIONS.DASHBOARD_VIEW },
      { label: 'Operations Center', icon: Activity, path: '/operations', permission: PERMISSIONS.DASHBOARD_VIEW },
      { label: 'Needs Your Attention', icon: TriangleAlert, path: '/attention', permission: PERMISSIONS.DASHBOARD_VIEW },
    ],
  },
  {
    id: 'users-providers',
    section: 'USERS & PROVIDERS',
    items: [
      {
        label: 'Clients',
        icon: Users,
        path: '/clients',
        permission: PERMISSIONS.USERS_VIEW,
        children: [
          { label: 'Client Management', path: '/clients' },
          { label: 'All Clients', path: '/clients/all' },
        ],
      },
      {
        label: 'Provider Management',
        icon: BriefcaseBusiness,
        path: '/providers',
        permission: PERMISSIONS.PROVIDERS_VIEW,
        children: [
          { label: 'Provider Dashboard', icon: LayoutDashboard, path: '/providers' },

          {
            label: 'Verification Center',
            icon: FileText,
            path: '/verifications',
            permission: PERMISSIONS.PROVIDERS_VERIFY,
            badge: '428',
            isAccordion: true,
            children: [
              { label: 'Verification Queue', path: '/verifications/queue', icon: FileText },
              { label: 'Verification Review', path: '/verifications/review', icon: FileText },
              { label: 'Identity Documents', path: '/verifications/identity', icon: FileText },
              { label: 'Professional Credentials', path: '/verifications/credentials', icon: FileText },
              { label: 'Business Documents', path: '/verifications/business', icon: FileText },
            ],
          },

          { label: 'Content Moderation', icon: FileCheck, path: '/content' },
          { label: 'Withdrawals', icon: Banknote, path: '/withdrawals', permission: PERMISSIONS.WITHDRAWALS_APPROVE },
          { label: 'Provider Subscriptions', icon: CreditCard, path: '/providers/subscriptions' },
          { label: 'Spa & Wellness Centers', icon: Flower2, path: '/spas', permission: PERMISSIONS.PROVIDERS_VIEW },
          { label: 'Hotels & Resorts', icon: Hotel, path: '/hotels', permission: PERMISSIONS.PROVIDERS_VIEW },
        ],
      },
    ],
  },
  {
    id: 'bookings-payments',
    section: 'BOOKINGS & PAYMENTS',
    items: [
      {
        label: 'Bookings',
        icon: CalendarCheck,
        path: '/bookings',
        permission: PERMISSIONS.BOOKINGS_VIEW,
        children: [
          { label: 'Booking Management', path: '/bookings' },
          { label: 'Active Bookings', path: '/bookings/active' },
          { label: 'Upcoming Bookings', path: '/bookings/upcoming' },
          { label: 'Ongoing Bookings', path: '/bookings/ongoing' },
          { label: 'Completed Bookings', path: '/bookings/completed' },
          { label: 'Cancelled Bookings', path: '/bookings/cancelled' },
          { label: 'Guest Bookings', path: '/guest-bookings' },
        ],
      },
      { label: 'Payments', icon: CreditCard, path: '/payments', permission: PERMISSIONS.FINANCE_VIEW },
      { label: 'Wallet & Payouts', icon: Wallet, path: '/finance', permission: PERMISSIONS.FINANCE_VIEW },
      { label: 'Disputes', icon: CircleAlert, path: '/disputes', permission: PERMISSIONS.DISPUTES_MANAGE },
    ],
  },
  {
    id: 'marketing-growth',
    section: 'MARKETING & GROWTH',
    items: [
      { label: 'Promotions', icon: Megaphone, path: '/promotions' },
      { label: 'Referrals & Loyalty', icon: Gift, path: '/loyalty' },
      { label: 'Campaigns', icon: FileText, path: '/campaigns' },
    ],
  },
  {
    id: 'analytics',
    section: 'ANALYTICS',
    items: [
      { label: 'Reports', icon: ChartNoAxesCombined, path: '/reports' },
      { label: 'Market Insights', icon: ChartLine, path: '/market-insights' },
    ],
  },
  {
    id: 'system',
    section: 'SYSTEM',
    items: [
      { label: 'Settings', icon: Settings, path: '/settings', permission: PERMISSIONS.SETTINGS_MANAGE },
      { label: 'Admin Team', icon: UsersRound, path: '/team', permission: PERMISSIONS.ADMINS_MANAGE },
      { label: 'Audit Logs', icon: ScrollText, path: '/audit-logs', permission: PERMISSIONS.AUDIT_VIEW },
      { label: 'System Health', icon: HeartPulse, path: '/system-health' },
    ],
  },
]
