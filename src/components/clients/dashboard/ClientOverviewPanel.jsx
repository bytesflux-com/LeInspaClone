import { Link, useNavigate } from 'react-router'
import { CalendarDays, ChevronRight, CreditCard, Crown, Headphones, Copy, UserRound, Users, X } from 'lucide-react'
import PersonAvatar from '../../ui/PersonAvatar'
import CountryFlag from '../../ui/CountryFlag'
import Skeleton from '../../ui/Skeleton'
import { MembershipBadge, StatusBadge } from '../ClientBadges'
import RowActionsMenu from '../RowActionsMenu'
import { useClientPreview } from '../../../hooks/useClientPreview'
import { formatNumber } from '../../../lib/format'
import { cn } from '../../../lib/utils'
import { CARD } from './DashCard'

const LINKS = [
  { label: 'View Bookings', icon: CalendarDays, section: 'bookings' },
  { label: 'View Payments', icon: CreditCard, section: 'payments' },
  { label: 'View Membership', icon: Crown, section: 'membership', fill: true },
  { label: 'View Support History', icon: Headphones, section: 'support' },
  { label: 'View Referrals & Loyalty', icon: Users, section: 'loyalty', fill: true },
]

function Stat({ value, label, tone = 'text-[#1b1140]', small }) {
  return (
    <div className="rounded-lg border border-[#e6e1f3] bg-white px-1.5 py-1.5">
      <p className={cn('font-bold leading-tight whitespace-nowrap', small ? 'pt-0.5 text-[12px] tracking-tight' : 'text-[17px]', tone)}>{value}</p>
      <p className="mt-0.5 text-[9px] leading-tight tracking-[-0.03em] whitespace-nowrap text-[#4a4466]">{label}</p>
    </div>
  )
}

// Right-hand quick look for the selected directory row (ADM-010).
export default function ClientOverviewPanel({ clientId, fallback, onClose, onCopyId }) {
  const navigate = useNavigate()
  const { preview, error } = useClientPreview(clientId, 'overview', 0)
  const c = preview || fallback
  const money = (n) => `${preview?.currency || ''} ${formatNumber(n)}`.trim()

  return (
    <section className={cn(CARD, 'p-3')} aria-label="Client overview">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[14px] font-bold tracking-tight text-[#1b1140]">
          <UserRound className="size-5 fill-[#5b2fd0] text-[#5b2fd0]" aria-hidden="true" /> Client Overview
        </h2>
        <button type="button" onClick={onClose} aria-label="Close client overview" className="rounded-lg p-1 text-[#2a1b57] hover:bg-[#f1edff]"><X className="size-[18px]" /></button>
      </header>

      {error && <p className="mb-2 rounded-lg bg-rose-50 p-2 text-[12px] text-rose-700">{error}</p>}

      {c ? (
        <div className="flex items-start gap-3">
          <PersonAvatar name={c.name} src={c.photoURL} gender={c.gender} size={64} />
          <div className="min-w-0 pt-0.5">
            <h3 className="truncate text-[15px] leading-tight font-bold text-[#1b1140]">{c.name}</h3>
            <MembershipBadge tier={c.membership} label={c.membership === 'none' ? 'No Membership' : `${c.membership[0].toUpperCase()}${c.membership.slice(1)} Client`} className="mt-1 gap-1 px-1.5 py-1 text-[10px] [&_svg]:size-3" />
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[11.5px] text-[#2a1b57]">{c.id}</span>
              <StatusBadge status={c.status} className="gap-1 px-1.5 py-0.5 text-[10px] [&_svg]:size-3" />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#2a1b57]"><CountryFlag code={c.country} className="h-3 w-[18px]" />{c.city}, {c.countryName}</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3"><Skeleton className="size-16 rounded-full" /><div className="flex-1 space-y-2 pt-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-5 w-24" /><Skeleton className="h-3 w-20" /></div></div>
      )}

      <div className="mt-2.5 flex items-center gap-2">
        <Link to={`/clients/${clientId}`} className="flex h-9 flex-1 items-center justify-center rounded-lg bg-[#4125d0] text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-[#3519b8]">Open Full Profile</Link>
        <RowActionsMenu label="More client actions" actions={[{ label: 'Copy Client ID', icon: Copy, onSelect: () => onCopyId(clientId) }, { label: 'View Payments', icon: CreditCard, onSelect: () => navigate(`/clients/${clientId}/payments`) }]} />
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
        {preview ? (
          <>
            <Stat value={preview.stats.totalBookings} label="Total Bookings" />
            <Stat value={preview.stats.completed} label="Completed" tone="text-[#0f8a5f]" />
            <Stat value={preview.stats.cancelled} label="Cancelled" tone="text-[#dc2626]" />
            <Stat value={preview.stats.openDisputes} label="Open Disputes" tone="text-[#dc2626]" />
            <Stat value={money(preview.stats.walletBalance)} label="Wallet Balance" tone="text-[#2a1b8a]" small />
            <Stat value={preview.stats.supportTickets} label="Support Tickets" />
          </>
        ) : (
          Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12" />)
        )}
      </div>

      <ul className="mt-2.5 space-y-1">
        {LINKS.map(({ label, icon: Icon, section, fill }) => (
          <li key={section}>
            <Link to={`/clients/${clientId}/${section}`} className="flex items-center gap-2.5 rounded-xl border border-[#e6e1f3] px-2.5 py-1.5 text-[12px] text-[#1b1140] transition hover:bg-[#f4f1fc]">
              <span className="flex size-6 items-center justify-center rounded-md bg-[#f1edff] text-[#4527c8]"><Icon className={cn('size-4', fill && 'fill-current')} /></span>
              <span className="flex-1">{label}</span>
              <ChevronRight className="size-4 text-[#2a1b57]" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
