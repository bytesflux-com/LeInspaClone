import { useEffect, useState } from 'react'
import { Link, NavLink, matchPath, useLocation } from 'react-router'
import { CalendarCheck, ChevronRight, CreditCard, Crown, Gift, ShieldAlert, ShieldCheck, Sparkles, Star, User, UserCog, Wallet, WalletCards } from 'lucide-react'


import { usePermissions } from '../../hooks/usePermissions'
import { NAVIGATION_SECTIONS } from '../../constants/navigation'
import AttentionBadge from './AttentionBadge'
import { cn } from '../../lib/utils'
import VerificationCenterAccordion from './VerificationCenterAccordion'

const ROW = 'group flex items-center gap-2.5 rounded-xl px-2.5 py-[3px] text-[12.5px] font-medium leading-5 transition-colors'
const CHILD = 'flex items-center rounded-lg py-[3px] pr-2.5 pl-[26px] text-[12px] leading-5 transition-colors'

// A route is inside a group when it matches the group prefix or any child path.
const groupPaths = (item) => [item.path, ...(item.children || []).flatMap((c) => (c.children ? groupPaths(c) : [c.path]))]
const inside = (paths, pathname) => paths.some((p) => pathname === p || pathname.startsWith(`${p}/`))

// Demo mode has a sample provider; live mode only links to a real provider in context.
const DEFAULT_PROVIDER_ID = import.meta.env.VITE_USE_MOCK_PROVIDERS === 'true' ? 'PR-82941' : null

const CLIENT_SUB_TABS = [
  ['profile', 'Client Profile', User],
  ['bookings', 'Client Bookings', CalendarCheck],
  ['payments', 'Client Payments', WalletCards],
  ['wallet', 'Client Wallet', Wallet],
  ['membership', 'Client Membership', Crown],
  ['loyalty', 'Client Referrals & Loyalty', Gift],
  ['support', 'Support & Safety History', ShieldAlert],
]

// Per-provider screens (ADM-023 → ADM-028), shown for the provider in context.
const PROVIDER_SUB_LINKS = [
  ['services', 'Provider Services & Pricing', Sparkles],
  ['bookings', 'Provider Bookings & Earnings', CalendarCheck],
  ['reviews', 'Provider Reviews', Star],
  ['subscription', 'Provider Subscription & Visibility', CreditCard],
  ['risk', 'Provider Quality & Risk Review', ShieldCheck],
  ['account', 'Provider Account Actions', UserCog],
]
const PROVIDER_SECTIONS = PROVIDER_SUB_LINKS.map(([key]) => key)

export default function NavigationMenu({ onNavigate }) {
  const { can } = usePermissions()
  const { pathname } = useLocation()

  // Expandable groups: open while the route is inside them, and toggled by
  // clicking the parent row. Entering a group (e.g. via a link) opens it.
  // Default Clients and Provider Management to open so sub-tabs are immediately accessible.
  const [open, setOpen] = useState(() => new Set(['/clients', '/providers']))
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
                      <span className="truncate">{item.label}</span>
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
                      <span className="truncate">{item.label}</span>
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


  // Client context resolution (ADM-012 -> ADM-018)
  const clientSectionMatch = item.path === '/clients' ? matchPath({ path: '/clients/:clientId/:section' }, pathname) : null
  const clientRootMatch = item.path === '/clients' ? matchPath({ path: '/clients/:clientId' }, pathname) : null
  const rawClientId = clientSectionMatch?.params?.clientId || clientRootMatch?.params?.clientId
  // Client tabs only appear while a client is open (they are views of that client).
  const currentClientId = rawClientId && rawClientId !== 'all' ? rawClientId : null

  const activeClientSub =
    item.path === '/clients' && rawClientId && rawClientId !== 'all'
      ? clientSectionMatch?.params?.section || 'profile'
      : null


  // Provider context resolution (ADM-022 -> ADM-028)
  const providerSectionMatch = item.path === '/providers' ? matchPath({ path: '/providers/:providerId/:section' }, pathname) : null
  const providerDefaultMatch = item.path === '/providers' ? matchPath({ path: '/providers/:section' }, pathname) : null
  const activeProviderSection =
    (PROVIDER_SECTIONS.includes(providerSectionMatch?.params?.section) && providerSectionMatch.params.section) ||
    (PROVIDER_SECTIONS.includes(providerDefaultMatch?.params?.section) && providerDefaultMatch.params.section) ||
    null

  const matchedProviderId = providerSectionMatch?.params?.providerId || matchPath({ path: '/providers/:providerId/*' }, pathname)?.params?.providerId

  const reservedProviderPaths = ['all', 'directory', 'subscriptions', ...PROVIDER_SECTIONS]
  const currentProviderId =
    matchedProviderId && !reservedProviderPaths.includes(matchedProviderId)
      ? matchedProviderId
      : DEFAULT_PROVIDER_ID
  // Provider tabs only appear while a provider is open (or for the demo provider).
  const showProviderTabs = Boolean(currentProviderId)

  const onProviderProfile = Boolean(
    item.path === '/providers' &&
    matchedProviderId &&
    !reservedProviderPaths.includes(matchedProviderId) &&
    !activeProviderSection
  )

  const activeCls = 'bg-[#5c2dd5] font-semibold text-white shadow-md'
  const idleCls = 'text-white/80 hover:bg-white/10 hover:text-white'

  const validChildren = item.children.filter((child) => !child.permission || can(child.permission))

  return (
    <>
      {validChildren.map((child) => {
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

        // Nested group (e.g. Content Moderation inside Provider Management).
        if (child.children) {
          return (
            <NestedGroup
              key={child.path + child.label}
              item={child}
              onNavigate={onNavigate}
              activeCls={activeCls}
              idleCls={idleCls}
            />
          )
        }

        const isAllProviders = item.path === '/providers' && child.path === '/providers/all'
        const ChildIcon = child.icon
        return (
          <div key={child.path} className="space-y-0.5">
            <NavLink
              to={child.path}
              end
              onClick={onNavigate}
              className={({ isActive }) => cn(CHILD, 'justify-between', isActive ? activeCls : idleCls)}
            >
              <div className="flex items-center gap-2 min-w-0">
                {ChildIcon && <ChildIcon className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />}
                <span className="truncate">{child.label}</span>
              </div>
              {child.badgeKey && <AttentionBadge category={child.badgeKey} className="ml-1.5" />}
            </NavLink>
            {isAllProviders && showProviderTabs && (
              <>
                <Link
                  to={`/providers/${currentProviderId}`}
                  onClick={onNavigate}
                  aria-current={onProviderProfile ? 'page' : undefined}
                  className={cn(CHILD, 'gap-2', onProviderProfile ? activeCls : idleCls)}
                >
                  <User className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
                  <span className="truncate">Provider Profile</span>
                </Link>

                {PROVIDER_SUB_LINKS.map(([key, label, RowIcon]) => (
                  <Link
                    key={key}
                    to={`/providers/${currentProviderId}/${key}`}
                    onClick={onNavigate}
                    aria-current={activeProviderSection === key ? 'page' : undefined}
                    className={cn(CHILD, 'gap-2', activeProviderSection === key ? activeCls : idleCls)}
                  >
                    <RowIcon className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
                    <span className="truncate">{label}</span>
                  </Link>
                ))}
              </>
            )}
          </div>
        )
      })}

      {item.path === '/clients' &&
        currentClientId &&
        CLIENT_SUB_TABS.map(([key, label, RowIcon]) => {
          const isActive = activeClientSub === key
          const to = key === 'profile' ? `/clients/${currentClientId}` : `/clients/${currentClientId}/${key}`
          return (
            <Link
              key={key}
              to={to}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={cn(CHILD, 'gap-2', isActive ? activeCls : idleCls)}
            >
              <RowIcon className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}

    </>
  )
}

// Second-level group inside a sidebar group (e.g. Provider Management →
// Content Moderation). Opens while the route is inside it; click toggles.
function NestedGroup({ item, onNavigate, activeCls, idleCls }) {
  const { pathname } = useLocation()
  const current = inside(groupPaths(item), pathname)
  const [open, setOpen] = useState(true)
  useEffect(() => {
    if (current) setOpen(true)
  }, [current])
  const Icon = item.icon
  return (
    <div className="space-y-0.5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={cn(CHILD, 'w-full gap-2', current ? 'font-semibold text-white' : idleCls)}>
        {Icon && <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />}
        <span className="truncate">{item.label}</span>
        <ChevronRight className={cn('ml-auto size-3.5 shrink-0 text-white/60 transition-transform', open && 'rotate-90')} aria-hidden="true" />
      </button>
      {open &&
        item.children.map((child) => (
          <NavLink key={child.path} to={child.path} end onClick={onNavigate} className={({ isActive }) => cn(CHILD, 'pl-[40px] text-[11.5px]', isActive ? activeCls : idleCls)}>
            <span className="truncate">{child.label}</span>
          </NavLink>
        ))}
    </div>
  )
}

