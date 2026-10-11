import { ArrowRight, CircleAlert, Lock, ShieldAlert, ShieldCheck } from 'lucide-react'
import { formatFullStamp } from '../../../lib/profileFormat'
import { PRIORITY_STYLE } from '../../../constants/clientSupport'
import { cn } from '../../../lib/utils'

const SHADOW = 'shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)]'
const OPEN_BTN = 'inline-flex h-9 w-full max-w-[150px] items-center justify-center gap-1.5 rounded-lg border-[1.5px] bg-white px-3 text-[12.5px] font-semibold transition'

function KV({ label, children }) {
  return (
    <li className="grid grid-cols-[64px_1fr] gap-x-2 text-[12px] leading-[1.45]">
      <span className="text-[#2a1b57]">{label}</span>
      <span className="font-medium text-[#1b1140]">{children}</span>
    </li>
  )
}

// Only rendered when something currently requires action. An open safety case outranks any
// ordinary support issue and shows only minimal, non-detailed information.
export function NeedsAttentionCard({ attention, timeZone, onOpen }) {
  const first = attention[0]
  const critical = first.severity === 'critical'
  const more = attention.length - 1
  return (
    <section aria-label="Needs attention" className={cn('flex flex-col rounded-xl border p-3.5', SHADOW, critical ? 'border-[#f5c2c2] bg-[#fff1f1]' : 'border-[#f6d8b4] bg-[#fff3e4]')}>
      <h2 className={cn('flex items-center gap-2.5 text-[17px] leading-none font-bold', critical ? 'text-[#c81e1e]' : 'text-[#d9570c]')}>
        <span className={cn('flex size-[40px] items-center justify-center rounded-full text-white', critical ? 'bg-[#e03a3a]' : 'bg-[#f08a24]')}>
          {critical ? <ShieldAlert className="size-[22px]" aria-hidden="true" /> : <CircleAlert className="size-[24px]" aria-hidden="true" />}
        </span>
        Needs Attention
      </h2>
      <div className="mt-2.5">
        <p className="text-[12.5px] font-semibold text-[#1b1140]">
          {critical ? `Safety Case — ${PRIORITY_STYLE[first.priority]?.label || 'High'} Priority` : 'Open Support Case'}
        </p>
        <p className="text-[16px] leading-tight font-bold text-[#1b1140]">{first.id}</p>
        <p className="text-[12.5px] text-[#1b1140]">{first.subject}</p>
      </div>
      <ul className="mt-2 space-y-0.5">
        <KV label="Opened:">{formatFullStamp(first.openedAt, timeZone)}</KV>
        <KV label="Priority:">{PRIORITY_STYLE[first.priority]?.label}</KV>
        <KV label="Assigned:">{first.assignedTeam && first.assignedTo !== first.assignedTeam ? `${first.assignedTo} – ${first.assignedTeam}` : first.assignedTo}</KV>
      </ul>
      <div className="mt-auto flex items-center gap-3 pt-2.5">
        <button type="button" onClick={() => onOpen(first)} className={cn(OPEN_BTN, critical ? 'border-[#e03a3a] text-[#c81e1e] hover:bg-[#fff1f1]' : 'border-[#8b6cf0] text-[#3b1fd6] hover:bg-[#f4f1fc]')}>
          Open Case <ArrowRight className="size-3.5" aria-hidden="true" />
        </button>
        {more > 0 && <span className="text-[11.5px] text-[#4a4466]">+{more} more needing attention</span>}
      </div>
    </section>
  )
}

const Restricted = () => (
  <span className="inline-flex items-center gap-1 text-[#4a4466]"><Lock className="size-3" aria-hidden="true" /> Restricted</span>
)

// Case status and account status are different: an open ticket never makes the account look unwell.
export function AccountSafetyCard({ account, accountLabel = 'Active' }) {
  const statusOk = account.status === 'active'
  const hasRestrictions = account.restrictions.length > 0
  return (
    <section aria-label="Account safety" className={cn('flex flex-col rounded-xl border border-[#e6e1f3] bg-white p-3.5', SHADOW)}>
      <h2 className="flex flex-wrap items-center gap-2 text-[18px] leading-none font-bold text-[#1b1140]">
        <ShieldCheck className="size-[26px] fill-[#4527c8] text-white" aria-hidden="true" />
        Account Safety
        <span className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-[5px] text-[11.5px] font-medium', statusOk ? 'bg-[#dcf6e4] text-[#15803d]' : 'bg-[#fde2e2] text-[#dc2626]')}>
          <span className={cn('size-2 rounded-full', statusOk ? 'bg-[#22a652]' : 'bg-[#e03a3a]')} aria-hidden="true" />
          {statusOk ? accountLabel : account.status[0].toUpperCase() + account.status.slice(1)}
        </span>
      </h2>
      <dl className="mt-3 space-y-[7px] text-[12.5px]">
        <div className="grid grid-cols-[1fr_1fr] gap-2"><dt className="text-[#2a1b57]">Safety Restrictions</dt><dd className="font-medium text-[#1b1140]">{hasRestrictions ? `${account.restrictions.length} active` : 'None'}</dd></div>
        <div className="grid grid-cols-[1fr_1fr] gap-2"><dt className="text-[#2a1b57]">Open Investigations</dt><dd className="font-medium text-[#1b1140]">{account.openInvestigations == null ? <Restricted /> : account.openInvestigations}</dd></div>
        <div className="grid grid-cols-[1fr_1fr] gap-2"><dt className="text-[#2a1b57]">Active Booking Restrictions</dt><dd className="font-medium text-[#1b1140]">{account.restrictions.some((x) => x.kind === 'booking') ? 'Booking restricted' : 'None'}</dd></div>
        <div className="grid grid-cols-[1fr_1fr] gap-2"><dt className="text-[#2a1b57]">Account Risk Review</dt><dd className="font-medium text-[#1b1140]">{account.riskReview == null ? <Restricted /> : account.riskReview}</dd></div>
      </dl>
      {hasRestrictions && (
        <ul className="mt-2.5 space-y-1.5">
          {account.restrictions.map((x) => (
            <li key={x.id} className="rounded-lg bg-[#fff3e4] px-2.5 py-1.5 text-[12px]">
              <p className="font-semibold text-[#c2570c]">{x.label}</p>
              {x.reason ? <p className="text-[11.5px] text-[#2a1b57]">{x.reason}</p> : <p className="flex items-center gap-1 text-[11px] text-[#4a4466]"><Lock className="size-3" aria-hidden="true" /> Reason details are restricted for your role.</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Safety panel: calm when clear, red only when a case is genuinely open, locked without permission.
export function SafetyStatusCard({ safety, onOpenSafety }) {
  if (safety.restricted) {
    return (
      <section aria-label="Safety status" className={cn('flex flex-col items-center justify-center rounded-xl border border-[#e6e1f3] bg-[#f7f5fd] p-3.5 text-center', SHADOW)}>
        <span className="flex size-[58px] items-center justify-center rounded-2xl bg-[#e4defb]"><Lock className="size-7 text-[#4527c8]" aria-hidden="true" /></span>
        <p className="mt-2.5 text-[16px] font-bold text-[#1b1140]">Safety details restricted</p>
        <p className="mt-1 max-w-[260px] text-[12px] leading-snug text-[#2a1b57]">Safety information needs Trust &amp; Safety access. Ask a Safety Admin if you need it for this client.</p>
      </section>
    )
  }
  if (safety.open > 0) {
    return (
      <section aria-label="Safety status" className={cn('flex flex-col items-center justify-center rounded-xl border border-[#f5c2c2] bg-[#fff1f1] p-3.5 text-center', SHADOW)}>
        <span className="flex size-[58px] items-center justify-center rounded-2xl bg-[#e03a3a]"><ShieldAlert className="size-8 text-white" aria-hidden="true" /></span>
        <p className="mt-2.5 text-[16px] font-bold text-[#c81e1e]">{safety.open} Open Safety {safety.open === 1 ? 'Case' : 'Cases'}</p>
        <p className="mt-1 max-w-[260px] text-[12px] leading-snug text-[#2a1b57]">Details stay in the Trust &amp; Safety workflow. Opening a safety case is access-logged.</p>
        <button type="button" onClick={onOpenSafety} className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-[#e03a3a] bg-white px-3.5 text-[12.5px] font-semibold text-[#c81e1e] hover:bg-[#fff1f1]">
          View Safety Cases <ArrowRight className="size-3.5" aria-hidden="true" />
        </button>
      </section>
    )
  }
  return (
    <section aria-label="Safety status" className={cn('flex flex-col items-center justify-center rounded-xl border border-[#cfeedb] bg-[#eaf6ee] p-3.5 text-center', SHADOW)}>
      <ShieldCheck className="size-[58px] fill-[#22a652] text-white" aria-hidden="true" />
      <p className="mt-2 text-[18px] leading-tight font-bold text-[#1b1140]">No Open Safety Concerns</p>
      <p className="mt-1 max-w-[260px] text-[12.5px] leading-snug text-[#2a1b57]">This client has no active safety cases or restrictions.</p>
    </section>
  )
}
