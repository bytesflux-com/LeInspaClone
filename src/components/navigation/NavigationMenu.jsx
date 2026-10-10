import { Link, NavLink, matchPath, useLocation } from 'react-router'
import { ChevronDown, User, Users } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'
import { NAVIGATION_SECTIONS } from '../../constants/navigation'
import { cn } from '../../lib/utils'

const ROW = 'group flex items-center gap-2.5 whitespace-nowrap rounded-xl px-2.5 py-[3px] text-[12.5px] font-medium leading-5 transition-colors'

export default function NavigationMenu({ onNavigate }) {
  const { can } = usePermissions()
  const { pathname } = useLocation()

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
                const Icon = item.icon
                const hasChildren = Boolean(item.children && item.children.length > 0)
                const isChildActive = hasChildren && item.children.some((c) =>
                  pathname === c.path || (c.path !== '/' && pathname.startsWith(`${c.path}/`))
                )

                return (
                  <div key={item.path + item.label} className="space-y-0.5">
                    {hasChildren ? (
                      <NavLink
                        to={item.children[0].path}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            ROW,
                            'justify-between',
                            // If children exist, don't double-highlight parent when child is active
                            !isChildActive && isActive
                              ? 'bg-[#5c2dd5] font-semibold text-white shadow-md'
                              : isChildActive
                              ? 'text-white font-semibold hover:bg-white/10'
                              : 'text-white/90 hover:bg-white/10 hover:text-white'
                          )
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown className="size-3.5 text-white/60" />
                      </NavLink>
                    ) : (
                      <NavLink
                        to={item.path}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            ROW,
                            isActive
                              ? 'bg-[#5c2dd5] font-semibold text-white shadow-md'
                              : 'text-white/90 hover:bg-white/10 hover:text-white'
                          )
                        }
                      >
                        <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                      </NavLink>
                    )}

                    {/* Sub-menu is open whenever inside its domain */}
                    {hasChildren && (
                      <NavLinkChildren item={item} onNavigate={onNavigate} />
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

function NavLinkChildren({ item, onNavigate }) {
  const { pathname } = useLocation()
  const { can } = usePermissions()

  // ADM-012: while a client profile is open, a "Client Profile" row appears under Client Management
  const onProfile = Boolean(
    item.path === '/clients' &&
      matchPath({ path: '/clients/:clientId/*' }, pathname) &&
      !matchPath({ path: '/clients/all/*' }, pathname)
  )
  const bookingsMatch =
    item.path === '/clients'
      ? matchPath({ path: '/clients/:clientId/bookings' }, pathname)
      : null
  const onBookings = Boolean(bookingsMatch && bookingsMatch.params.clientId !== 'all')

  const validChildren = item.children.filter((c) => !c.permission || can(c.permission))

  return (
    <ParentActive paths={item.children.map((c) => c.path)} force={onProfile}>
      {validChildren.map((child) => {
        const ChildIcon = child.icon
        return (
          <NavLink
            key={child.path + child.label}
            to={child.path}
            end={child.path === item.path || child.path === '/providers'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                ROW,
                'pl-[18px]',
                isActive
                  ? 'bg-[#5c2dd5] font-semibold text-white shadow-md'
                  : 'text-white/85 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <ChildIcon className="size-[17px] shrink-0" aria-hidden="true" />
            <span>{child.label}</span>
          </NavLink>
        )
      })}

      {onProfile && !onBookings && (
        <span
          aria-current="page"
          className={cn(ROW, 'pl-[18px] bg-[#6a4bc4] font-semibold text-white')}
        >
          <Users className="size-[17px] shrink-0" aria-hidden="true" />
          <span>Client Profile</span>
        </span>
      )}

      {onBookings && (
        <>
          <Link
            to={`/clients/${bookingsMatch.params.clientId}`}
            onClick={onNavigate}
            className={cn(
              ROW,
              'pl-[18px] text-white/85 hover:bg-white/10 hover:text-white'
            )}
          >
            <User className="size-[17px] shrink-0" aria-hidden="true" />
            <span>Client Profile</span>
          </Link>
          <span
            aria-current="page"
            className={cn(ROW, 'pl-[18px] bg-[#5c2dd5] font-semibold text-white shadow-md')}
          >
            <User className="size-[17px] shrink-0" aria-hidden="true" />
            <span>Client Bookings</span>
          </span>
        </>
      )}
    </ParentActive>
  )
}

function ParentActive({ paths, force = false, children }) {
  const { pathname } = useLocation()
  const open =
    force ||
    paths.some((path) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`)))
  return open ? <div className="space-y-0.5">{children}</div> : null
}
