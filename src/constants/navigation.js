import {
  LayoutDashboard,
  Activity,
  Search,
  AlertCircle,
  Users,
  BriefcaseBusiness,
  BadgeCheck,
  CalendarCheck,
  WalletCards,
  ShieldCheck,
  Banknote,
  Scale,
  ShieldAlert,
  Headphones,
  Crown,
  Gift,
  Megaphone,
  ChartNoAxesCombined,
  Globe,
  Settings,
  UsersRound,
  ScrollText,
  HeartPulse,
} from 'lucide-react'
import { PERMISSIONS } from './permissions.js'

export const NAVIGATION_SECTIONS = [
  {
    id: 'control',
    section: 'CONTROL',
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard',
        permission: PERMISSIONS.DASHBOARD_VIEW,
      },
      {
        label: 'Operations Center',
        icon: Activity,
        path: '/operations',
        badge: 'Live',
        badgeColor: 'bg-emerald-500/20 text-emerald-300',
        permission: PERMISSIONS.DASHBOARD_VIEW,
      },
      {
        label: 'Global Search',
        icon: Search,
        path: '/search',
        badge: '⌘K',
        badgeColor: 'bg-royal-800 text-royal-200 text-[10px]',
        permission: PERMISSIONS.DASHBOARD_VIEW,
      },
      {
        label: 'Needs Attention',
        icon: AlertCircle,
        path: '/attention',
        badge: '27',
        badgeColor: 'bg-rose-500/20 text-rose-200',
        permission: PERMISSIONS.DASHBOARD_VIEW,
      },
    ],
  },
  {
    id: 'management',
    section: 'MANAGEMENT',
    items: [
      {
        label: 'Clients',
        icon: Users,
        path: '/clients',
        permission: PERMISSIONS.USERS_VIEW,
      },
      {
        label: 'Providers',
        icon: BriefcaseBusiness,
        path: '/providers',
        permission: PERMISSIONS.PROVIDERS_VIEW,
      },
      {
        label: 'Verification & Approvals',
        icon: BadgeCheck,
        path: '/verifications',
        badgeKey: 'verifications',
        permission: PERMISSIONS.PROVIDERS_VERIFY,
      },
      {
        label: 'Bookings',
        icon: CalendarCheck,
        path: '/bookings',
        permission: PERMISSIONS.BOOKINGS_VIEW,
      },
    ],
  },
  {
    id: 'finance',
    section: 'FINANCE',
    items: [
      {
        label: 'Finance',
        icon: WalletCards,
        path: '/finance',
        permission: PERMISSIONS.FINANCE_VIEW,
      },
      {
        label: 'Escrow',
        icon: ShieldCheck,
        path: '/escrow',
        permission: PERMISSIONS.ESCROW_RELEASE,
      },
      {
        label: 'Withdrawals',
        icon: Banknote,
        path: '/withdrawals',
        badgeKey: 'withdrawals',
        permission: PERMISSIONS.WITHDRAWALS_APPROVE,
      },
    ],
  },
  {
    id: 'trust-safety',
    section: 'TRUST & SAFETY',
    items: [
      {
        label: 'Disputes',
        icon: Scale,
        path: '/disputes',
        badgeKey: 'disputes',
        permission: PERMISSIONS.DISPUTES_MANAGE,
      },
      {
        label: 'Safety',
        icon: ShieldAlert,
        path: '/safety',
        badgeKey: 'safety',
        permission: PERMISSIONS.DISPUTES_MANAGE,
      },
      {
        label: 'Support',
        icon: Headphones,
        path: '/support',
        badgeKey: 'support',
        permission: PERMISSIONS.SUPPORT_VIEW,
      },
    ],
  },
  {
    id: 'growth',
    section: 'GROWTH',
    items: [
      {
        label: 'Memberships',
        icon: Crown,
        path: '/memberships',
      },
      {
        label: 'Referrals & Loyalty',
        icon: Gift,
        path: '/loyalty',
      },
      {
        label: 'Promotions',
        icon: Megaphone,
        path: '/promotions',
      },
    ],
  },
  {
    id: 'intelligence',
    section: 'INTELLIGENCE',
    items: [
      {
        label: 'Analytics',
        icon: ChartNoAxesCombined,
        path: '/analytics',
      },
      {
        label: 'Markets',
        icon: Globe,
        path: '/markets',
        permission: PERMISSIONS.MARKETS_MANAGE,
      },
    ],
  },
  {
    id: 'platform',
    section: 'PLATFORM',
    items: [
      {
        label: 'Settings',
        icon: Settings,
        path: '/settings',
        permission: PERMISSIONS.SETTINGS_MANAGE,
      },
      {
        label: 'Admin Team',
        icon: UsersRound,
        path: '/team',
        permission: PERMISSIONS.ADMINS_MANAGE,
      },
      {
        label: 'Audit Logs',
        icon: ScrollText,
        path: '/audit-logs',
        permission: PERMISSIONS.AUDIT_VIEW,
      },
      {
        label: 'System Health',
        icon: HeartPulse,
        path: '/system-health',
        statusDot: 'bg-emerald-400',
      },
    ],
  },
]

