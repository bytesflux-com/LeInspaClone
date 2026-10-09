import { useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  CalendarDays,
  ChevronUp,
  CreditCard,
  Crown,
  Headphones,
  Mail,
  MapPin,
  Phone,
  Star,
  StickyNote,
  Users,
  X,
} from 'lucide-react'
import PersonAvatar from '../ui/PersonAvatar'
import CountryFlag from '../ui/CountryFlag'
import Skeleton from '../ui/Skeleton'
import { MembershipBadge, StatusBadge } from './ClientBadges'
import { useClientPreview } from '../../hooks/useClientPreview'
import { formatDate, formatNumber } from '../../lib/format'
import { cn } from '../../lib/utils'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'notes', label: 'Notes' },
]

function Stat({ value, label, tone = 'text-[#1b1140]', small = false }) {
  return (
    <div className="rounded-lg border border-[#e6e1f3] bg-white px-2 py-2">
      <p className={cn('font-bold leading-tight', small ? 'whitespace-nowrap pt-1 text-[11px] tracking-tight' : 'text-[19px]', tone)}>{value}</p>
      <p className="mt-0.5 text-[10.5px] leading-tight text-[#4a4466]">{label}</p>
    </div>
  )
}

function InfoRow({ icon: Icon, children, filled }) {
  return (
    <li className="flex items-center gap-3 text-[12.5px] text-[#2a1b57]">
      <Icon className={cn('size-4 shrink-0 text-[#5b2fd0]', filled && 'fill-[#5b2fd0]')} aria-hidden="true" />
      <span className="min-w-0 truncate">{children}</span>
    </li>
  )
}

export default function ClientPreviewPanel({ clientId, fallback, tab, onTab, onClose, onAddNote, noteVersion, profileHref, sectionHref }) {
  const { preview, error, loading, tabItems } = useClientPreview(clientId, tab, noteVersion)
  const [membershipOpen, setMembershipOpen] = useState(true)

  const c = preview || fallback
  const money = (n) => `${preview?.currency || ''} ${formatNumber(n)}`.trim()

  return (
    <div className="flex min-h-full flex-col gap-3.5 px-3 py-4" aria-label="Client quick preview">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute top-3 right-3 rounded-lg p-1.5 text-[#2a1b57] transition hover:bg-[#f1edff]"
      >
        <X className="size-[18px]" />
      </button>

      {/* Identity */}
      {c ? (
        <div className="flex items-start gap-2.5">
          <PersonAvatar name={c.name} src={c.photoURL} gender={c.gender} size={62} />
          <div className="min-w-0 pt-0.5">
            <h2 className="truncate pr-6 text-[17px] leading-tight font-bold text-[#1b1140]">{c.name}</h2>
            <p className="mt-0.5 text-[12px] text-[#4a4466]">{c.id}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <MembershipBadge tier={c.membership} label={`${c.membership[0].toUpperCase()}${c.membership.slice(1)} Client`} className="gap-1 px-1.5 py-1 text-[10px] [&_svg]:size-3" />
              <StatusBadge status={c.status} className="gap-1 px-1.5 py-1 text-[10px] [&_svg]:size-3" />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#2a1b57]">
              <CountryFlag code={c.country} className="h-3 w-[18px]" />
              {c.city}, {c.countryName}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3"><Skeleton className="size-[72px] rounded-full" /><div className="flex-1 space-y-2 pt-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /><Skeleton className="h-6 w-40" /></div></div>
      )}

      {/* Tabs */}
      <div role="tablist" className="grid grid-cols-3 overflow-hidden rounded-lg border border-[#ddd7ee] bg-white">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => onTab(t.id)}
            className={cn(
              'h-[34px] text-[12.5px] font-medium transition',
              i > 0 && tab !== t.id && tab !== TABS[i - 1].id && 'border-l border-[#e6e1f3]',
              tab === t.id ? 'bg-[#4527c8] font-semibold text-white' : 'text-[#2a1b57] hover:bg-[#f4f1fc]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-[12px] text-rose-700">{error}</p>}

      {tab === 'overview' && (
        <>
          {loading && !preview ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
              <Skeleton className="h-36" />
            </div>
          ) : (
            preview && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <Stat value={preview.stats.totalBookings} label="Total Bookings" />
                  <Stat value={preview.stats.completed} label="Completed" tone="text-[#0f8a5f]" />
                  <Stat value={preview.stats.cancelled} label="Cancelled" tone="text-[#dc2626]" />
                  <Stat value={preview.stats.openDisputes} label="Open Disputes" tone="text-[#dc2626]" />
                  <Stat value={preview.stats.supportTickets} label="Support Tickets" />
                  <Stat value={money(preview.stats.walletBalance)} label="Wallet Balance" tone="text-[#2a1b8a]" small />
                </div>

                <ul className="space-y-2.5">
                  <InfoRow icon={Mail}>{preview.email}</InfoRow>
                  <InfoRow icon={Phone}>{preview.phone}</InfoRow>
                  <InfoRow icon={MapPin}>{preview.city}, {preview.countryName}</InfoRow>
                  <InfoRow icon={CalendarDays}>Joined {formatDate(preview.joinedAt)}</InfoRow>
                  <InfoRow icon={Users}>Referred by {preview.referredBy || '—'}</InfoRow>
                  <InfoRow icon={Star} filled>Total Savings {money(preview.totalSavings)}</InfoRow>
                </ul>

                <div className="border-t border-[#ebe7f5] pt-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2.5 text-[14px] font-bold text-[#1b1140]">
                      <span className="flex size-[30px] items-center justify-center rounded-full bg-[#5b2fd6] text-white">
                        <Crown className="size-4 fill-white" />
                      </span>
                      Membership
                    </h3>
                    <button
                      type="button"
                      onClick={() => setMembershipOpen((v) => !v)}
                      aria-expanded={membershipOpen}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4527c8] hover:underline"
                    >
                      View Details <ChevronUp className={cn('size-3.5 transition-transform', !membershipOpen && 'rotate-180')} />
                    </button>
                  </div>
                  {membershipOpen && (
                    <div className="mt-2.5 space-y-2.5">
                      <div className="pl-[40px]"><MembershipBadge tier={preview.membershipDetail.tier} /></div>
                      <dl className="space-y-2 text-[12px]">
                        <div className="grid grid-cols-[110px_1fr]"><dt className="text-[#4a4466]">Member since</dt><dd className="font-medium text-[#1b1140]">{formatDate(preview.membershipDetail.since)}</dd></div>
                        <div className="grid grid-cols-[110px_1fr]"><dt className="text-[#4a4466]">Status</dt><dd className="font-medium text-[#1b1140]">{formatDate(preview.membershipDetail.validUntil)}</dd></div>
                      </dl>
                    </div>
                  )}
                </div>

                <Link
                  to={profileHref}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#4125d0] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3519b8]"
                >
                  Open Full Profile <ArrowRight className="size-4" />
                </Link>

                <div>
                  <h3 className="text-[14.5px] font-bold text-[#1b1140]">Quick Actions</h3>
                  <ul className="mt-2 space-y-0.5">
                    {[
                      { label: 'View Bookings', icon: CalendarDays, section: 'bookings' },
                      { label: 'View Payments', icon: CreditCard, section: 'payments' },
                      { label: 'View Membership', icon: Crown, section: 'membership' },
                      { label: 'View Support History', icon: Headphones, section: 'support' },
                      { label: 'View Referrals & Loyalty', icon: Users, section: 'loyalty' },
                    ].map(({ label, icon: Icon, section }) => (
                      <li key={section}>
                        <Link to={sectionHref(section)} className="flex items-center gap-3 rounded-lg px-1 py-2 text-[13px] text-[#2a1b57] transition hover:bg-[#f4f1fc]">
                          <Icon className={cn('size-[18px] text-[#4527c8]', section === 'membership' && 'fill-[#4527c8]')} />
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )
          )}
        </>
      )}

      {tab === 'activity' && (
        <div>
          {tabItems === null ? (
            <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : tabItems.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-[#4a4466]">No recent activity.</p>
          ) : (
            <ol className="space-y-3 border-l border-[#e6e1f3] pl-4">
              {tabItems.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-white bg-[#7a5cf0]" />
                  <p className="text-[12.5px] font-medium text-[#1b1140]">{a.title}</p>
                  <p className="text-[11px] text-[#6b6785]">{a.daysAgo === 0 ? 'Today' : `${a.daysAgo} day${a.daysAgo === 1 ? '' : 's'} ago`}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={onAddNote}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-[#4527c8] text-[12.5px] font-semibold text-[#4527c8] transition hover:bg-[#f1edff]"
          >
            <StickyNote className="size-4" /> Add Client Note
          </button>
          {tabItems === null ? (
            <Skeleton className="h-16" />
          ) : tabItems.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-[#4a4466]">No internal notes yet.</p>
          ) : (
            tabItems.map((n) => (
              <div key={n.id} className="rounded-lg border border-[#e6e1f3] bg-[#faf9fd] p-3">
                <p className="text-[12.5px] whitespace-pre-wrap text-[#1b1140]">{n.note}</p>
                <p className="mt-1.5 text-[11px] text-[#6b6785]">{n.author} · {formatDate(n.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
