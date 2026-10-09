import { Clock, Headphones, Scale, ShieldAlert, Ticket, TriangleAlert, Lock } from 'lucide-react'
import { ProfileCard, CardLink, RowButton, Pill } from './ProfileCard'
import { TICKET_STATUS_LABELS } from '../../../constants/clientProfile'
import { formatFullStamp } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

function Row({ icon: Icon, iconClass, label, children }) {
  return (
    <li className="grid min-h-[28px] grid-cols-[22px_1fr_96px] items-center gap-1 text-[12.5px]">
      <Icon className={cn('size-[17px]', iconClass)} aria-hidden="true" />
      <span className="text-[#2a1b57]">{label}</span>
      <span className="font-bold text-[#1b1140]">{children}</span>
    </li>
  )
}

export default function SupportSafetyCard({ profile: c, canSeeSafety, to, linkState }) {
  const s = c.support
  const t = s.latest
  return (
    <ProfileCard icon={Headphones} disc title="Support & Safety" action={<CardLink to={to} state={linkState}>View Details</CardLink>}>
      <ul>
        <Row icon={Headphones} iconClass="text-[#4527c8] [stroke-width:2.4]" label="Open Support Tickets">{s.openTickets}</Row>
        <Row icon={Scale} iconClass="text-[#3b1fd6]" label="Open Disputes">{s.openDisputes}</Row>
        {canSeeSafety && <Row icon={ShieldAlert} iconClass="fill-[#e03a3a] text-white" label="Safety Reports">{s.safetyReports}</Row>}
        <Row icon={TriangleAlert} iconClass="fill-[#f08a24] text-white" label="Account Restrictions">{c.account.restrictions}</Row>
      </ul>

      {t ? (
        <div className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-[#f3f0fb] p-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1e40d8]"><Ticket className="size-4 text-white" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] leading-tight font-bold text-[#1b1140]">{t.id}</p>
            <p className="truncate text-[10.5px] leading-tight text-[#2a1b57]">{t.subject}</p>
            <p className="truncate text-[10.5px] leading-tight text-[#2a1b57]">
              {formatFullStamp(t.createdAt, c.timeZone).split(' • ')[0]} • <span className="font-medium text-[#c2570c]">{TICKET_STATUS_LABELS[t.status] || t.status}</span>
            </p>
          </div>
          <Pill box="bg-[#ffe9d2] text-[#c2570c]" dot={Clock} dotClass="fill-[#f08a24] text-white">{TICKET_STATUS_LABELS[t.status] || t.status}</Pill>
          <RowButton to={`/support/${t.id}`} state={linkState} />
        </div>
      ) : (
        <p className="mt-2.5 rounded-xl bg-[#f3f0fb] px-3 py-3 text-center text-[11.5px] text-[#4a4466]">No support tickets on record.</p>
      )}
      {!canSeeSafety && (
        <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-[#6b6785]"><Lock className="size-3" /> Safety case details are restricted for your role.</p>
      )}
    </ProfileCard>
  )
}
