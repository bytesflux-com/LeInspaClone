import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CalendarDays, ChartNoAxesColumn, CircleCheck, CreditCard, Crown, Headphones, MapPin, Send, Settings, Shield, SquarePen, TriangleAlert, UserRound, Users, Wallet, Zap } from 'lucide-react'
import CountryFlag from '../../ui/CountryFlag'
import { StatusBadge } from '../ClientBadges'
import { PROFILE_CARD, DetailRow } from './ProfileCard'
import { clientService } from '../../../services/clientService'
import { PERMISSIONS } from '../../../constants/permissions'
import { formatDay } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const CAP = (s) => (s ? `${s[0].toUpperCase()}${s.slice(1)}` : '—')
const RISK_TONE = { Low: 'text-[#1b1140]', Medium: 'text-[#b45309]', High: 'text-[#dc2626]' }

export function AccountStatusCard({ profile: c, can, canSeeFinancial, canSeeSafety }) {
  const alerts = c.account.alerts.filter((a) => (a.restricted === 'safety' ? canSeeSafety : a.restricted === 'finance' ? canSeeFinancial : true))
  const healthy = c.status === 'active' && alerts.length === 0
  const HeaderIcon = healthy ? CircleCheck : TriangleAlert
  return (
    <section className={cn(PROFILE_CARD, 'p-3')} aria-label="Account status">
      <header className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[14px] leading-none font-bold tracking-tight text-[#1b1140]">
          <HeaderIcon className={cn('size-6', healthy ? 'fill-[#15803d] text-white' : 'fill-[#f08a24] text-white')} aria-hidden="true" /> Account Status
        </h2>
        <StatusBadge status={c.status} className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold" />
      </header>

      <ul>
        <DetailRow icon={UserRound} iconClass="fill-[#2a1b57] text-[#2a1b57]" label="Account Type" labelWidth="w-[104px]">{c.account.type}</DetailRow>
        <DetailRow icon={Crown} iconClass="fill-[#4527c8] text-[#4527c8]" label="Membership" labelWidth="w-[104px]">{c.membershipTier === 'none' ? 'None' : CAP(c.membershipTier)}</DetailRow>
        <DetailRow icon={CircleCheck} iconClass={c.contactVerified ? 'fill-[#15803d] text-white' : 'fill-[#e0a82e] text-white'} label="Contact Verified" labelWidth="w-[104px]">{c.contactVerified ? 'Yes' : 'No'}</DetailRow>
        <DetailRow icon={() => <CountryFlag code={c.country} className="h-3.5 w-[22px]" />} label="Country" labelWidth="w-[104px]">{c.countryName}</DetailRow>
        <DetailRow icon={MapPin} iconClass="fill-[#4527c8] text-white" label="City" labelWidth="w-[104px]">{c.city}</DetailRow>
        <DetailRow icon={ChartNoAxesColumn} iconClass="text-[#2a1b57] [stroke-width:3]" label="Risk Level" labelWidth="w-[104px]">
          <span className={RISK_TONE[c.account.riskLevel]}>{c.account.riskLevel}</span>
        </DetailRow>
        <DetailRow icon={Shield} iconClass="fill-[#2a1b57] text-[#2a1b57]" label="Restrictions" labelWidth="w-[104px]">
          <span className={c.account.restrictions === 'None' ? '' : 'text-[#dc2626]'}>{c.account.restrictions}</span>
        </DetailRow>
      </ul>

      {/* Important alerts — only when applicable */}
      <div className="mt-3 space-y-2 border-t border-[#ebe7f5] pt-3">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-[#dcf6e4] px-3.5 py-3">
            <CircleCheck className="size-9 shrink-0 fill-[#15803d] text-white" aria-hidden="true" />
            <div>
              <p className="text-[13.5px] leading-tight font-bold text-[#1b1140]">No Account Alerts</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-[#1b1140]">This client has no active alerts or restrictions.</p>
            </div>
          </div>
        ) : (
          alerts.map((a) => (
            <div key={a.id} role="alert" className={cn('flex items-start gap-3 rounded-xl px-3.5 py-3', a.level === 'danger' ? 'bg-[#fde8e8]' : 'bg-[#fff1d6]')}>
              <TriangleAlert className={cn('mt-0.5 size-5 shrink-0 text-white', a.level === 'danger' ? 'fill-[#dc2626]' : 'fill-[#f08a24]')} aria-hidden="true" />
              <div>
                <p className={cn('text-[13px] leading-tight font-bold', a.level === 'danger' ? 'text-[#b91c1c]' : 'text-[#92400e]')}>{a.title}</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-[#1b1140]">{a.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export function QuickActionsCard({ clientId, can, canSeeFinancial, linkState, onNotify, canAccountActions }) {
  const base = `/clients/${clientId}`
  const actions = [
    { label: 'View Bookings', icon: CalendarDays, to: `${base}/bookings`, fill: true },
    canSeeFinancial && { label: 'View Payments', icon: CreditCard, to: `${base}/payments`, fill: true },
    { label: 'View Membership', icon: Crown, to: `${base}/membership`, fill: true },
    canSeeFinancial && { label: 'View Wallet', icon: Wallet, to: `${base}/wallet`, fill: true },
    can(PERMISSIONS.SUPPORT_VIEW) && { label: 'View Support History', icon: Headphones, to: `${base}/support` },
    { label: 'View Referrals & Loyalty', icon: Users, to: `${base}/loyalty`, fill: true },
    { label: 'Send Notification', icon: Send, onClick: onNotify, fill: true },
    canAccountActions && { label: 'Account Actions', icon: Settings, to: `${base}/account`, accent: true, fill: true },
  ].filter(Boolean)

  const cls = 'flex h-[37px] w-full items-center gap-3 rounded-lg border-[1.5px] border-[#b9a4f3] bg-white px-3 text-[13px] font-medium transition hover:bg-[#f7f4ff]'
  return (
    <section className={cn(PROFILE_CARD, 'p-3')} aria-label="Quick actions">
      <h2 className="mb-2.5 flex items-center gap-2 text-[14px] leading-none font-bold tracking-tight text-[#1b1140]">
        <span className="flex size-[22px] items-center justify-center rounded-full bg-[#4125d0]"><Zap className="size-3 fill-white text-white" aria-hidden="true" /></span>
        Quick Actions
      </h2>
      <ul className="space-y-[7px]">
        {actions.map((a) => {
          const Icon = a.icon
          const inner = (
            <>
              <Icon className={cn('size-[18px] shrink-0 text-[#4125d0]', a.fill && 'fill-[#4125d0]/90')} aria-hidden="true" />
              <span className={cn('flex-1 text-left', a.accent ? 'font-semibold text-[#4125d0]' : 'text-[#1b1140]')}>{a.label}</span>
              <ArrowRight className="size-[17px] shrink-0 text-[#4125d0]" aria-hidden="true" />
            </>
          )
          return (
            <li key={a.label}>
              {a.to ? <Link to={a.to} state={linkState} className={cls}>{inner}</Link> : <button type="button" onClick={a.onClick} className={cls}>{inner}</button>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function InternalNotesCard({ clientId, onSaved, onError, focusSignal }) {
  const [text, setText] = useState('')
  const [notes, setNotes] = useState([])
  const [busy, setBusy] = useState(false)
  const field = useRef(null)

  useEffect(() => {
    let cancelled = false
    clientService.getClientNotes(clientId).then((n) => !cancelled && setNotes(n)).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [clientId])

  useEffect(() => {
    if (focusSignal) field.current?.focus()
  }, [focusSignal])

  const save = async () => {
    const note = text.trim()
    if (!note || busy) return
    setBusy(true)
    try {
      const entry = await clientService.addClientNote({ clientId, note })
      setNotes((n) => [entry, ...n])
      setText('')
      onSaved?.('Note saved')
    } catch (err) {
      onError?.(err?.message || 'Unable to save note')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={cn(PROFILE_CARD, 'p-3')} aria-label="Internal notes">
      <header className="mb-2.5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[14px] leading-none font-bold tracking-tight text-[#1b1140]">
          <SquarePen className="size-[19px] text-[#4125d0]" aria-hidden="true" /> Internal Notes
        </h2>
        <button type="button" onClick={() => field.current?.focus()} className="text-[12.5px] font-semibold text-[#3b1fd6] hover:underline">Add Note</button>
      </header>
      <textarea
        ref={field}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        aria-label="Internal note"
        placeholder={'Add an internal note about this client...\n(Only visible to admin team)'}
        className="h-[78px] w-full resize-none rounded-lg border border-[#e0daf0] bg-[#f6f4fb] px-3 py-2 text-[12px] leading-snug text-[#1b1140] placeholder:text-[#4a4466] focus:border-[#7a5cf0] focus:ring-3 focus:ring-[#7a5cf0]/15 focus:outline-none"
      />
      <button
        type="button"
        onClick={save}
        disabled={!text.trim() || busy}
        className="mt-2.5 flex h-9 w-full items-center justify-center rounded-lg bg-[#4125d0] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3519b8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Save Note'}
      </button>

      {notes.length > 0 && (
        <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-[#e6e1f3] bg-[#faf9fd] p-2.5">
              <p className="text-[12px] whitespace-pre-wrap text-[#1b1140]">{n.note}</p>
              <p className="mt-1 text-[10.5px] text-[#6b6785]">{n.author} · {formatDay(n.createdAt, undefined, { year: true })}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
