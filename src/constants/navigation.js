import {
  LayoutDashboard,
  Activity,
  TriangleAlert,
  Users,
  BriefcaseBusiness,
  CalendarCheck,
  FileText,
  ShieldCheck,
  ChartLine,
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
      { label: 'Market Dashboard', icon: ChartLine, path: '/markets', permission: PERMISSIONS.DASHBOARD_VIEW },
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
          { label: 'Client Management', icon: LayoutDashboard, path: '/clients' },
          { label: 'All Clients', icon: Users, path: '/clients/all' },
        ],
      },
      {
        label: 'Provider Management',
        icon: BriefcaseBusiness,
        path: '/providers',
        permission: PERMISSIONS.PROVIDERS_VIEW,
        children: [
          { label: 'Provider Dashboard', icon: LayoutDashboard, path: '/providers' },
          { label: 'All Providers', icon: Users, path: '/providers/all' },
          {
            label: 'Verification Center',
            icon: FileText,
            path: '/verifications',
            permission: PERMISSIONS.PROVIDERS_VERIFY,
            badgeKey: 'verification',
            isAccordion: true,
            children: [
              { label: 'Verification Queue', path: '/verifications/queue', icon: FileText },
              { label: 'Verification Review', path: '/verifications/review', icon: FileText },
              { label: 'Identity Documents', path: '/verifications/identity', icon: FileText },
              { label: 'Professional Credentials', path: '/verifications/credentials', icon: FileText },
              { label: 'Business Documents', path: '/verifications/business', icon: FileText },
              { label: 'Verification Decision', path: '/verifications/decision', icon: ShieldCheck },
            ],
          },
          {
            label: 'Content Moderation',
            icon: ShieldCheck,
            path: '/content-approval',
            permission: PERMISSIONS.CONTENT_MODERATE,
            children: [
              { label: 'Content Approval Center', path: '/content-approval' },
              { label: 'Profile Photo Approval', path: '/content-approval/profile-photos' },
              { label: 'Gallery & Media Approval', path: '/content-approval/gallery' },
              { label: 'Profile Information Change', path: '/content-approval/profile-changes' },
              { label: 'Service Information Approval', path: '/content-approval/services' },
              { label: 'Request More Information', path: '/information-requests' },
              { label: 'Approval History', path: '/approval-history' },
            ],
          },
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
    ],
  },
]
