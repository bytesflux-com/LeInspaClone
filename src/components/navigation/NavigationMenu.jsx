import { useEffect, useState } from 'react'
import { Link, NavLink, matchPath, useLocation } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'
import { NAVIGATION_SECTIONS } from '../../constants/navigation'
import { cn } from '../../lib/utils'

const ROW = 'group flex items-center gap-2.5 whitespace-nowrap rounded-xl px-2.5 py-[3px] text-[12.5px] font-medium leading-5 transition-colors'
const CHILD = 'flex items-center whitespace-nowrap rounded-lg py-[3px] pr-2.5 pl-[38px] text-[12px] leading-5 transition-colors'

// A route is inside a group when it matches the group prefix or any child path.
const groupPaths = (item) => [item.path, ...item.children.map((c) => c.path)]
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
  // ADM-013: on a client's bookings the sidebar shows Client Profile (link) → Client Bookings (active).
  const bookingsMatch = item.path === '/clients' ? matchPath({ path: '/clients/:clientId/bookings' }, pathname) : null
  const onBookings = Boolean(bookingsMatch && bookingsMatch.params.clientId !== 'all')
  const activeCls = 'bg-[#5c2dd5] font-semibold text-white shadow-md'
  const idleCls = 'text-white/80 hover:bg-white/10 hover:text-white'

  const validChildren = item.children.filter((child) => !child.permission || can(child.permission))

  return (
    <>
      {validChildren.map((child) =>
        child.children ? (
          <NestedGroup key={child.path + child.label} item={child} onNavigate={onNavigate} activeCls={activeCls} idleCls={idleCls} />
        ) : (
          <NavLink
            key={child.path}
            to={child.path}
            end
            onClick={onNavigate}
            className={({ isActive }) => cn(CHILD, isActive ? activeCls : idleCls)}
          >
            {child.label}
          </NavLink>
        ),
      )}
      {onProfile && !onBookings && (
        <span aria-current="page" className={cn(CHILD, activeCls)}>Client Profile</span>
      )}
      {onBookings && (
        <>
          <Link to={`/clients/${bookingsMatch.params.clientId}`} onClick={onNavigate} className={cn(CHILD, idleCls)}>Client Profile</Link>
          <span aria-current="page" className={cn(CHILD, activeCls)}>Client Bookings</span>
        </>
      )}
    </>
  )
}

// Second-level group inside a sidebar group (e.g. Provider Management →
// Content Moderation). Opens while the route is inside it; click toggles.
function NestedGroup({ item, onNavigate, activeCls, idleCls }) {
  const { pathname } = useLocation()
  const current = inside(groupPaths(item), pathname)
  const [open, setOpen] = useState(current)
  useEffect(() => {
    if (current) setOpen(true)
  }, [current])
  return (
    <div className="space-y-0.5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={cn(CHILD, 'w-full', current ? 'font-semibold text-white' : idleCls)}>
        {item.label}
        <ChevronRight className={cn('ml-auto size-3.5 shrink-0 text-white/60 transition-transform', open && 'rotate-90')} aria-hidden="true" />
      </button>
      {open &&
        item.children.map((child) => (
          <NavLink key={child.path} to={child.path} end onClick={onNavigate} className={({ isActive }) => cn(CHILD, 'pl-[52px] text-[11.5px]', isActive ? activeCls : idleCls)}>
            {child.label}
          </NavLink>
        ))}
    </div>
  )
}
