import { Link, NavLink, matchPath, useLocation } from 'react-router'
import { Crown, Gift, User, Users, Wallet, WalletCards } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'
import { NAVIGATION_SECTIONS } from '../../constants/navigation'
import { cn } from '../../lib/utils'

const ROW = 'group flex items-center gap-2.5 whitespace-nowrap rounded-xl px-2.5 py-[3px] text-[12.5px] font-medium leading-5 transition-colors'

export default function NavigationMenu({ onNavigate }) {
  const { can } = usePermissions()

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
                return (
                  <div key={item.path + item.label} className="space-y-0.5">
                    <NavLink
                      to={item.path}
                      end={Boolean(item.children)}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(ROW, isActive ? 'bg-[#5c2dd5] font-semibold text-white shadow-md' : 'text-white/90 hover:bg-white/10 hover:text-white')
                      }
                    >
                      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>

                    {/* Sub-menu is open whenever its parent route is active */}
                    {item.children && (
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
  // ADM-012: while a client profile is open, a "Client Profile" row appears under
  // Client Management (the profile lives at /clients/:clientId, not /clients/all).
  const onProfile = Boolean(item.path === '/clients' && matchPath({ path: '/clients/:clientId/*' }, pathname) && !matchPath({ path: '/clients/all/*' }, pathname))
  // ADM-013 → ADM-017: inside a client's Bookings, Payments, Wallet or Membership the sidebar shows
  // Client Profile → Client Bookings → Client Payments → Client Wallet → Client Membership → Client Referrals & Loyalty, with the current one active.
  const subMatch = item.path === '/clients' ? matchPath({ path: '/clients/:clientId/:section' }, pathname) : null
  const sub = subMatch && subMatch.params.clientId !== 'all' && ['bookings', 'payments', 'wallet', 'membership', 'loyalty'].includes(subMatch.params.section) ? subMatch.params.section : null
  const subClient = subMatch?.params.clientId
  return (
    <ParentActive paths={item.children.map((c) => c.path)} force={onProfile}>
      {item.children.map((child) => {
        const ChildIcon = child.icon
        return (
          <NavLink
            key={child.path}
            to={child.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(ROW, 'pl-[18px]', isActive ? 'bg-[#6a4bc4] font-semibold text-white' : 'text-white/85 hover:bg-white/10 hover:text-white')
            }
          >
            <ChildIcon className="size-[18px] shrink-0" aria-hidden="true" />
            <span>{child.label}</span>
          </NavLink>
        )
      })}
      {onProfile && !sub && (
        <span aria-current="page" className={cn(ROW, 'pl-[18px] bg-[#6a4bc4] font-semibold text-white')}>
          <Users className="size-[18px] shrink-0" aria-hidden="true" />
          <span>Client Profile</span>
        </span>
      )}
      {sub && (
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
    </ParentActive>
  )
}

function ParentActive({ paths, force = false, children }) {
  const { pathname } = useLocation()
  const open = force || paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  return open ? <div className="space-y-0.5">{children}</div> : null
}
