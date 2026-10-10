import { useEffect, useState } from 'react'
import { Link, NavLink, matchPath, useLocation } from 'react-router'
import { User, Users, Wallet, WalletCards } from 'lucide-react'

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
  // ADM-013 / ADM-014 / ADM-015: inside a client's Bookings, Payments or Wallet the sidebar shows
  // Client Profile → Client Bookings → Client Payments → Client Wallet, with the current one active.
  const subMatch = item.path === '/clients' ? matchPath({ path: '/clients/:clientId/:section' }, pathname) : null
  const sub = subMatch && subMatch.params.clientId !== 'all' && ['bookings', 'payments', 'wallet'].includes(subMatch.params.section) ? subMatch.params.section : null
  const subClient = subMatch?.params.clientId

  return (
    <>
      {validChildren.map((child) => (
        <NavLink
          key={child.path}
          to={child.path}
          end
          onClick={onNavigate}
          className={({ isActive }) => cn(CHILD, isActive ? activeCls : idleCls)}
        >
          {child.label}
        </NavLink>
      ))}
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
