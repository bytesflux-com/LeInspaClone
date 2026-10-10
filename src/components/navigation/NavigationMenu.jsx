import { useEffect, useState } from 'react'
import { Link, NavLink, matchPath, useLocation } from 'react-router'

import { Crown, Gift, User, Users, Wallet, WalletCards } from 'lucide-react'

import { usePermissions } from '../../hooks/usePermissions'
import { NAVIGATION_SECTIONS } from '../../constants/navigation'
import { cn } from '../../lib/utils'
import VerificationCenterAccordion from './VerificationCenterAccordion'

const ROW = 'group flex items-center gap-2.5 whitespace-nowrap rounded-xl px-2.5 py-[3px] text-[12.5px] font-medium leading-5 transition-colors'
const CHILD = 'flex items-center whitespace-nowrap rounded-lg py-[3px] pr-2.5 pl-[38px] text-[12px] leading-5 transition-colors'

// A route is inside a group when it matches the group prefix or any child path.
const groupPaths = (item) => [
  item.path,
  ...(item.children || []).flatMap((c) => [c.path, ...(c.children || []).map((gc) => gc.path)]),
]
const inside = (paths, pathname) => paths.some((p) => pathname === p || pathname.startsWith(`${p}/`))

export default function NavigationMenu({ onNavigate }) {
  const { can } = usePermissions()
  const { pathname } = useLocation()

  // Expandable groups: open while the route is inside them, and toggled by
  // clicking the parent row. Entering a group (e.g. via a link) opens it.
  const [open, setOpen] = useState(() => new Set())
  useEffect(() => {
    const active = NAVIGATION_SECTIONS.flatMap((s) => s.items).filter((i) => i.children && inside(groupPaths(i), pathname))
    if (active.length) setOpen((prev) => (active.every((i) => prev.has(i.path)) ? prev : new Set([...prev, ...active.map((i) => i.path)])))
  }, [pathname])
  const toggle = (path) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })

  return (
    <nav className="space-y-3" aria-label="Admin navigation">
      {NAVIGATION_SECTIONS.map((section) => {
        const items = section.items.filter((item) => !item.permission || can(item.permission))
        if (items.length === 0) return null

        return (
          <div key={section.id} className="space-y-1">
            {section.section && (
              <p className="px-2.5 pt-1 pb-0.5 text-[10.5px] font-semibold tracking-[0.14em] text-[#a99ad8] uppercase">
                {section.section}
              </p>
            )}

            <div className="space-y-0.5">
              {items.map((item) => {
                if (item.path === '/verifications' || item.label === 'Verification Center' || item.isAccordion) {
                  return (
                    <VerificationCenterAccordion
                      key={item.path + item.label}
                      onNavigate={onNavigate}
                    />
                  )
                }

                const Icon = item.icon

                if (!item.children) {
                  return (
                    <NavLink
                      key={item.path + item.label}
                      to={item.path}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(ROW, isActive ? 'bg-[#5c2dd5] font-semibold text-white shadow-md' : 'text-white/90 hover:bg-white/10 hover:text-white')
                      }
                    >
                      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                }

                const isOpen = open.has(item.path)
                const current = inside(groupPaths(item), pathname)
                const id = `nav-group-${item.path.slice(1)}`
                return (
                  <div key={item.path + item.label} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggle(item.path)}
                      aria-expanded={isOpen}
                      aria-controls={id}
                      className={cn(ROW, 'w-full', current ? 'bg-white/12 font-semibold text-white' : 'text-white/90 hover:bg-white/10 hover:text-white')}
                    >
                      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                      <ChevronRight className={cn('ml-auto size-4 shrink-0 text-white/70 transition-transform', isOpen && 'rotate-90')} aria-hidden="true" />
                    </button>
                    {isOpen && (
                      <div id={id} className="space-y-0.5">
                        <GroupChildren item={item} onNavigate={onNavigate} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </nav>
  )
}

function GroupChildren({ item, onNavigate }) {
  const { pathname } = useLocation()
  const { can } = usePermissions()

  // ADM-012: while a client profile is open, a "Client Profile" row appears under
  // Clients (the profile lives at /clients/:clientId, not /clients/all).
  const onProfile = Boolean(item.path === '/clients' && matchPath({ path: '/clients/:clientId/*' }, pathname) && !matchPath({ path: '/clients/all/*' }, pathname))

  const subMatch = item.path === '/clients' ? matchPath({ path: '/clients/:clientId/:section' }, pathname) : null
  const sub = subMatch && subMatch.params.clientId !== 'all' && ['bookings', 'payments', 'wallet', 'membership', 'loyalty'].includes(subMatch.params.section) ? subMatch.params.section : null
  const subClient = subMatch?.params.clientId


  // ADM-013: on a client's bookings the sidebar shows Client Profile (link) → Client Bookings (active).
  const bookingsMatch = item.path === '/clients' ? matchPath({ path: '/clients/:clientId/bookings' }, pathname) : null
  const onBookings = Boolean(bookingsMatch && bookingsMatch.params.clientId !== 'all')
  // ADM-022, ADM-023, ADM-024: while viewing a provider, contextual sub-pages appear under
  // Provider Management, matching screenshots.
  const providerServicesMatch = item.path === '/providers' ? matchPath({ path: '/providers/:providerId/services' }, pathname) : null
  const onProviderServices = Boolean(
    providerServicesMatch || (item.path === '/providers' && pathname === '/providers/services')
  )

  const providerBookingsMatch = item.path === '/providers' ? matchPath({ path: '/providers/:providerId/bookings' }, pathname) : null
  const onProviderBookings = Boolean(
    providerBookingsMatch || (item.path === '/providers' && pathname === '/providers/bookings')
  )

  const currentProviderId =
    providerBookingsMatch?.params?.providerId ||
    providerServicesMatch?.params?.providerId ||
    (matchPath({ path: '/providers/:providerId/*' }, pathname)?.params?.providerId) ||
    'PR-82941'

  const onProviderProfile = Boolean(
    item.path === '/providers' &&
    matchPath({ path: '/providers/:providerId/*' }, pathname) &&
    !matchPath({ path: '/providers/all/*' }, pathname) &&
    !matchPath({ path: '/providers/directory/*' }, pathname) &&
    !matchPath({ path: '/providers/subscriptions/*' }, pathname) &&
    !onProviderServices &&
    !onProviderBookings
  )

  const inProviderContext = onProviderProfile || onProviderServices || onProviderBookings

  const activeCls = 'bg-[#5c2dd5] font-semibold text-white shadow-md'
  const idleCls = 'text-white/80 hover:bg-white/10 hover:text-white'

  const validChildren = item.children.filter((child) => !child.permission || can(child.permission))

  return (
    <>
      {validChildren.map((child) => {


        // Insert Provider Profile, Services, Bookings right after "All Providers"
        const isAllProviders = item.path === '/providers' && child.path === '/providers/all'
        return (
          <div key={child.path}>
            <NavLink
              to={child.path}
              end
              onClick={onNavigate}
              className={({ isActive }) => cn(CHILD, isActive ? activeCls : idleCls)}
            >
              {child.label}
            </NavLink>
            {isAllProviders && inProviderContext && (
              <>
                {onProviderProfile ? (
                  <span aria-current="page" className={cn(CHILD, activeCls)}>
                    Provider Profile
                  </span>
                ) : (
                  <Link
                    to={`/providers/${currentProviderId}`}
                    onClick={onNavigate}
                    className={cn(CHILD, idleCls)}
                  >
                    Provider Profile
                  </Link>
                )}

                {onProviderServices ? (
                  <span aria-current="page" className={cn(CHILD, activeCls)}>
                    Provider Services & Pricing
                  </span>
                ) : (
                  <Link
                    to={`/providers/${currentProviderId}/services`}
                    onClick={onNavigate}
                    className={cn(CHILD, idleCls)}
                  >
                    Provider Services & Pricing
                  </Link>
                )}

                {onProviderBookings ? (
                  <span aria-current="page" className={cn(CHILD, activeCls)}>
                    Provider Bookings & Earnings
                  </span>
                ) : (
                  <Link
                    to={`/providers/${currentProviderId}/bookings`}
                    onClick={onNavigate}
                    className={cn(CHILD, idleCls)}
                  >
                    Provider Bookings & Earnings
                  </Link>
                )}
              </>
            )}
          </div>

        if (child.path === '/verifications' || child.label === 'Verification Center' || child.isAccordion) {
          return (
            <VerificationCenterAccordion
              key={child.path + child.label}
              onNavigate={onNavigate}
            />
          )
        }
        if (child.path === '/verifications/queue' || child.label === 'Verification Queue') {
          return null
        }


        const ChildIcon = child.icon
        return (
          <NavLink
            key={child.path}
            to={child.path}
            end
            onClick={onNavigate}
            className={({ isActive }) => cn(CHILD, 'justify-between', isActive ? activeCls : idleCls)}
          >
            <div className="flex items-center gap-2 min-w-0">
              {ChildIcon && <ChildIcon className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />}
              <span className="truncate">{child.label}</span>
            </div>
            {child.badge && (
              <span className="ml-1.5 rounded-full bg-amber-500/90 px-1.5 py-0.2 text-[9.5px] font-bold text-white shadow-xs">
                {child.badge}
              </span>
            )}
          </NavLink>

        )
      })}
      {onProfile && !onBookings && (
        <span aria-current="page" className={cn(CHILD, activeCls)}>Client Profile</span>
      )}
      {onBookings && (
        <>
          <Link to={`/clients/${subClient}`} onClick={onNavigate} className={cn(ROW, 'pl-[18px] text-white/85 hover:bg-white/10 hover:text-white')}>
            <User className="size-[18px] shrink-0" aria-hidden="true" />
            <span>Client Profile</span>
          </Link>
          {[
            ['bookings', 'Client Bookings', User],
            ['payments', 'Client Payments', WalletCards],
            ['wallet', 'Client Wallet', Wallet],
            ['membership', 'Client Membership', Crown],
            ['loyalty', 'Client Referrals & Loyalty', Gift],
          ].map(([key, label, RowIcon]) =>
            sub === key ? (
              <span key={key} aria-current="page" className={cn(ROW, 'pl-[18px] bg-[#5c2dd5] font-semibold text-white shadow-md')}>
                <RowIcon className="size-[18px] shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </span>
            ) : (
              <Link key={key} to={`/clients/${subClient}/${key}`} onClick={onNavigate} className={cn(ROW, 'pl-[18px] text-white/85 hover:bg-white/10 hover:text-white')}>
                <RowIcon className="size-[18px] shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ),
          )}

        </>
      )}
    </>
  )
}
