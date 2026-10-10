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
} from 'lucide-react'
import { PERMISSIONS } from './permissions.js'

// Sidebar structure per the Lé Inspa Admin specifications (ADM-010, ADM-020).
// An item with `children` renders an expanded sub-menu while inside its domain.
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
        label: 'Client Management',
        icon: Users,
        path: '/clients',
        permission: PERMISSIONS.USERS_VIEW,
        children: [{ label: 'All Clients', icon: Users, path: '/clients/all' }],
      },
      {
        label: 'Provider Management',
        icon: BriefcaseBusiness,
        path: '/providers',
        permission: PERMISSIONS.PROVIDERS_VIEW,
        children: [
          { label: 'Provider Dashboard', icon: LayoutDashboard, path: '/providers' },
          { label: 'All Providers', icon: Users, path: '/providers/all' },
          { label: 'Verifications & Approvals', icon: BadgeCheck, path: '/verifications', permission: PERMISSIONS.PROVIDERS_VERIFY },
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
      { label: 'Bookings', icon: CalendarCheck, path: '/bookings', permission: PERMISSIONS.BOOKINGS_VIEW },
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
