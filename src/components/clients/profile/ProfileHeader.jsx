import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { BadgeCheck, CalendarDays, ChartPie, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Clock, Copy, CreditCard, Crown, Headphones, Mail, ShieldAlert, UsersRound, Wallet } from 'lucide-react'
import PersonAvatar from '../../ui/PersonAvatar'
import CountryFlag from '../../ui/CountryFlag'
import Dropdown from '../../ui/Dropdown'
import { MembershipBadge, StatusBadge } from '../ClientBadges'
import { PROFILE_CARD } from './ProfileCard'
import { PROFILE_TABS } from '../../../constants/clientProfile'
import { formatAgo, formatDay } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const TAB_ICONS = {
  overview: ChartPie,
  bookings: CalendarDays,
  payments: CreditCard,
  wallet: Wallet,
  membership: Crown,
  loyalty: UsersRound,
  support: Headphones,
  activity: ClipboardList,
}
// Thin separators shown after these tabs (per the mockup).
const DIVIDER_AFTER = new Set(['loyalty', 'support'])

const PILL = 'rounded-full px-3.5 py-2 text-[13px] font-semibold gap-1.5 [&_svg]:size-4'

export function ProfileTabs({ clientId, active, can, linkState }) {
  const tabs = PROFILE_TABS.filter((t) => !t.permission || can(t.permission))
  const scrollRef = useRef(null)
  const drag = useRef({ down: false, moved: false, startX: 0, startLeft: 0 })
  const [edge, setEdge] = useState({ left: false, right: false })

  const updateEdges = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setEdge({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    })
  }, [])

  // Keep the active tab visible and track whether more tabs hide off-screen.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return undefined
    el.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' })
    updateEdges()
    const ro = new ResizeObserver(updateEdges)
    ro.observe(el)
    return () => ro.disconnect()
  }, [active, tabs.length, updateEdges])

  const scrollByDir = (dir) => {
    const el = scrollRef.current
    if (el) el.scrollBy({ left: dir * Math.max(200, el.clientWidth * 0.6), behavior: 'smooth' })
  }

  // Mouse wheel scrolls the row sideways when it overflows.
  const onWheel = (e) => {
    const el = scrollRef.current
    if (!el || el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
    el.scrollLeft += e.deltaY
  }

  // Click-and-drag to scroll with a mouse.
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') return
    const el = scrollRef.current
    drag.current = { down: true, moved: false, startX: e.clientX, startLeft: el.scrollLeft }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d.down) return
    const dx = e.clientX - d.startX
    if (Math.abs(dx) > 5) d.moved = true
    if (d.moved) scrollRef.current.scrollLeft = d.startLeft - dx
  }
  const endDrag = () => {
    drag.current.down = false
  }
  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      drag.current.moved = false
    }
  }

  const arrowCls =
    'absolute top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-[#ddd7ee] bg-white text-[#3b1fd6] shadow-md transition hover:bg-[#f3efff]'

  return (
    <div className="relative">
      {edge.left && (
        <>
          <span className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-12 bg-gradient-to-r from-white to-transparent" aria-hidden="true" />
          <button type="button" onClick={() => scrollByDir(-1)} aria-label="Scroll tabs left" className={cn(arrowCls, 'left-1')}>
            <ChevronLeft className="size-4" />
          </button>
        </>
      )}
      {edge.right && (
        <>
          <span className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-12 bg-gradient-to-l from-white to-transparent" aria-hidden="true" />
          <button type="button" onClick={() => scrollByDir(1)} aria-label="Scroll tabs right" className={cn(arrowCls, 'right-1')}>
            <ChevronRight className="size-4" />
          </button>
        </>
      )}
      <nav
        ref={scrollRef}
        aria-label="Client profile sections"
        role="tablist"
        onScroll={updateEdges}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        className="-mb-px flex items-center gap-0 overflow-x-auto scroll-smooth px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t, i) => {
          const Icon = TAB_ICONS[t.id]
          const on = t.id === active
          return (
            <div key={t.id} className="flex shrink-0 items-center">
              <Link
                to={t.section ? `/clients/${clientId}/${t.section}` : `/clients/${clientId}`}
                state={linkState}
                role="tab"
                aria-selected={on}
                draggable={false}
                className={cn(
                  'flex h-[36px] items-center gap-1.5 rounded-lg border-[1.5px] px-2.5 text-[12.5px] whitespace-nowrap transition',
                  on ? 'border-[#7a5cf0] bg-[#f3efff] font-semibold text-[#3b1fd6]' : 'border-transparent font-medium text-[#1b1140] hover:bg-[#f7f5fd]',
                )}
              >
                <Icon className={cn('size-[16px]', on || t.id === 'membership' ? 'fill-[#4527c8]/85 text-[#4527c8]' : 'text-[#2a1b57]')} aria-hidden="true" />
                {t.label}
              </Link>
              {DIVIDER_AFTER.has(t.id) && i < tabs.length - 1 && <span className="mx-1 h-5 w-px bg-[#ddd7ee]" aria-hidden="true" />}
            </div>
          )
        })}
      </nav>
    </div>
  )
}

export default function ProfileHeader({ profile: c, tab, can, linkState, onNotify, onCopyId, menuItems }) {
  const tier = c.membershipTier
  return (
    <div className={cn(PROFILE_CARD, 'overflow-hidden')}>
      <div className="relative flex flex-wrap items-start gap-x-5 gap-y-3 px-4 pt-4 pb-3.5">
        <PersonAvatar name={c.name} src={c.photoURL} gender={c.gender} size={134} className="ring-2 ring-white shadow-md" />

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h1 className="text-[31px] leading-[1.1] font-bold tracking-tight text-[#1b1140]">{c.name}</h1>
            {c.vip && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#f8e3b0] px-2 py-1 text-[12px] leading-none font-semibold text-[#7a4a0c]">
                <Crown className="size-3.5 fill-[#b4570b] text-[#b4570b]" aria-hidden="true" /> VIP
              </span>
            )}
          </div>

          <p className="mt-1 flex items-center gap-2 text-[16px] text-[#2a1b57]">
            Client ID: {c.id}
            <button type="button" onClick={() => onCopyId(c.id)} aria-label="Copy client ID" className="rounded p-0.5 text-[#4527c8] transition hover:bg-[#f1edff]">
              <Copy className="size-4" />
            </button>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <MembershipBadge tier={tier} label={tier === 'none' ? 'No Membership' : `${tier[0].toUpperCase()}${tier.slice(1)} Client`} className={PILL} />
            <StatusBadge status={c.status} className={cn(PILL, 'pl-3')} />
            {c.contactVerified ? (
              <span className={cn('inline-flex items-center bg-[#e4defb] leading-none text-[#3b1fd6]', PILL)}>
                <BadgeCheck className="size-4 fill-[#4527c8] text-white" aria-hidden="true" /> Contact Verified
              </span>
            ) : (
              <span className={cn('inline-flex items-center bg-[#fff1d6] leading-none text-[#92660a]', PILL)}>
                <ShieldAlert className="size-4 fill-[#e0a82e] text-white" aria-hidden="true" /> Contact Unverified
              </span>
            )}
          </div>

          <ul className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] whitespace-nowrap text-[#2a1b57]">
            <li className="flex items-center gap-2"><CountryFlag code={c.country} className="h-3.5 w-[22px]" />{c.city}, {c.countryName}</li>
            <li className="flex items-center gap-2"><CalendarDays className="size-[18px] fill-[#4527c8]/85 text-[#4527c8]" aria-hidden="true" />Joined {formatDay(c.joinedAt, c.timeZone, { year: true })}</li>
            <li className="flex items-center gap-2"><Clock className="size-[18px] text-[#2a1b57]" aria-hidden="true" />Last active {formatAgo(c.lastActiveAt, c.asOf)}</li>
          </ul>
        </div>

        <div className="ml-auto flex flex-col items-end @[52rem]:absolute @[52rem]:top-4 @[52rem]:right-4 @[52rem]:ml-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onNotify}
              className="inline-flex h-10 items-center gap-2 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-3.5 text-[13px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]"
            >
              <Mail className="size-[17px] fill-[#4527c8] text-white" aria-hidden="true" /> Message / Notify
            </button>
            <Dropdown
              menuWidth="w-56"
              trigger={({ open }) => (
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-3.5 text-[13px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]"
                >
                  More Actions <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
                </button>
              )}
            >
              <div role="menu" className="space-y-0.5">
                {menuItems.map((m) =>
                  m.to ? (
                    <Link key={m.label} to={m.to} state={linkState} role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-[#2a1b57] transition hover:bg-[#f4f1fc]">
                      <m.icon className="size-4 text-[#4527c8]" /> {m.label}
                    </Link>
                  ) : (
                    <button key={m.label} type="button" role="menuitem" onClick={m.onClick} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12.5px] font-medium text-[#2a1b57] transition hover:bg-[#f4f1fc]">
                      <m.icon className="size-4 text-[#4527c8]" /> {m.label}
                    </button>
                  ),
                )}
              </div>
            </Dropdown>
          </div>

        </div>

        <div className="pointer-events-none absolute right-6 bottom-3 hidden rotate-[-4deg] text-center leading-[1.05] text-[#1b1140] @[52rem]:block" style={{ fontFamily: "'Caveat', 'Segoe Script', cursive" }} aria-hidden="true">
          <p className="text-[27px]">Wellness</p>
          <p className="-mt-1 text-[27px]">Without Limits</p>
          <svg viewBox="0 0 120 10" className="-mt-0.5 ml-auto h-2.5 w-32 text-[#e8a317]"><path d="M2 7 C30 1, 70 9, 118 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </div>
      </div>

      <div className="border-t border-[#ebe7f5]">
        <ProfileTabs clientId={c.id} active={tab} can={can} linkState={linkState} />
      </div>
    </div>
  )
}
