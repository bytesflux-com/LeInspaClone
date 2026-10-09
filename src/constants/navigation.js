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
  Megaphone,
  Gift,
  ShieldCheck,
  ChartNoAxesCombined,
  ChartLine,
  Settings,
  UsersRound,
  ScrollText,
  HeartPulse,
} from 'lucide-react'
import { PERMISSIONS } from './permissions.js'

// Sidebar structure per the ADM-011 mockup. An item with `children` renders
// an expanded sub-menu while the current route is inside it.
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
      { label: 'Provider Management', icon: BriefcaseBusiness, path: '/providers', permission: PERMISSIONS.PROVIDERS_VIEW },
      { label: 'Spas & Wellness Centers', icon: Flower2, path: '/spas', permission: PERMISSIONS.PROVIDERS_VIEW },
      { label: 'Hotels & Resorts', icon: Hotel, path: '/hotels', permission: PERMISSIONS.PROVIDERS_VIEW },
      { label: 'Verification & Approvals', icon: BadgeCheck, path: '/verifications', permission: PERMISSIONS.PROVIDERS_VERIFY },
    ],
  },
  {
    id: 'bookings-payments',
    section: 'BOOKINGS & PAYMENTS',
    items: [
      { label: 'Bookings', icon: CalendarCheck, path: '/bookings', permission: PERMISSIONS.BOOKINGS_VIEW },
      { label: 'Payments', icon: CreditCard, path: '/payments', permission: PERMISSIONS.FINANCE_VIEW },
      { label: 'Withdrawals', icon: Banknote, path: '/withdrawals', permission: PERMISSIONS.WITHDRAWALS_APPROVE },
      { label: 'Disputes', icon: CircleAlert, path: '/disputes', permission: PERMISSIONS.DISPUTES_MANAGE },
    ],
  },
  {
    id: 'platform-management',
    section: 'PLATFORM MANAGEMENT',
    items: [
      { label: 'Content Management', icon: FileText, path: '/content' },
      { label: 'Promotions', icon: Megaphone, path: '/promotions' },
      { label: 'Referrals & Loyalty', icon: Gift, path: '/loyalty' },
      { label: 'Support & Safety', icon: ShieldCheck, path: '/support', permission: PERMISSIONS.SUPPORT_VIEW },
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
