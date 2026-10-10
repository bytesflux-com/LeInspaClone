import { ArrowRight, CalendarDays, FileText, Lock, MessageSquare, Pause, Play, Power, ShieldAlert, TriangleAlert, Wallet } from 'lucide-react'
import { BadgedGlyph, CARD, H2, OUTLINE_BTN } from './AccountParts'
import { cn } from '../../../lib/utils'

const TILE = 'flex min-w-0 flex-col gap-0 rounded-xl border border-[#e6e1f3] bg-[#f6f3fd] p-2.5'

function ActionTile({ glyph, title, desc, cta, onClick, locked, lockedReason, badge }) {
  return (
    <div className={TILE}>
      <div className="flex items-start justify-between gap-1">
        {glyph}
        {badge && <span className="rounded-full bg-[#ffe9d2] px-1.5 py-[3px] text-[9.5px] leading-none font-semibold text-[#c2570c]">{badge}</span>}
      </div>
      <h3 className="mt-2 min-h-[34px] text-[14px] leading-[1.15] font-bold tracking-tight text-[#1b1140]">{title}</h3>
      <p className="mt-1 mb-2 min-h-[44px] text-[11px] leading-snug text-[#2a1b57]">{locked ? <span className="flex items-start gap-1 text-[#6b6785]"><Lock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />{lockedReason}</span> : desc}</p>
      <button type="button" onClick={onClick} disabled={locked} className={cn(OUTLINE_BTN, 'mt-auto')}>
        {cta} <ArrowRight className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

const hasKind = (restrictions, kind) => restrictions.some((x) => x.kind === kind)

// Reversible, targeted controls — the smallest appropriate restriction, never a full suspension.
export function AccessControlsCard({ permitted, restrictions, onManage }) {
  const items = [
    { id: 'restrict_booking', kind: 'booking', icon: CalendarDays, title: 'Restrict Booking Access', desc: 'Prevent client from creating new bookings.' },
    { id: 'restrict_messaging', kind: 'messaging', icon: MessageSquare, title: 'Restrict Messaging', desc: 'Prevent or limit messaging on the platform.' },
    { id: 'restrict_payments', kind: 'payments', icon: Wallet, title: 'Restrict Payments / Wallet', desc: 'Limit wallet usage and payment actions.' },
  ]
  return (
    <section aria-label="Access controls" className={cn(CARD, '@container min-w-0')}>
      <h2 className={H2}>Access Controls</h2>
      <p className="mt-0.5 text-[11.5px] text-[#2a1b57]">Restrict specific client features without suspending the entire account.</p>
      <div className="mt-2.5 grid gap-2.5 @[21rem]:grid-cols-3">
        {items.map((it) => {
          const active = hasKind(restrictions, it.kind)
          const p = permitted[it.id]
          // An active restriction is always manageable (so it can be lifted) when the admin may manage accounts.
          const locked = !active && !p.allowed
          return (
            <ActionTile
              key={it.id}
              glyph={<BadgedGlyph icon={it.icon} />}
              title={it.title}
              desc={active ? 'This restriction is active. Review or remove it.' : it.desc}
              badge={active ? 'Active' : null}
              cta="Manage Restriction"
              locked={locked}
              lockedReason={p.reason}
              onClick={() => onManage(it.id, it.kind)}
            />
          )
        })}
      </div>
    </section>
  )
}

export function ReviewActionsCard({ permitted, restrictions, onAction, onManage }) {
  const reviewActive = hasKind(restrictions, 'review')
  const review = permitted.place_review
  return (
    <section aria-label="Account review actions" className={cn(CARD, '@container min-w-0')}>
      <h2 className={H2}>Account Review Actions</h2>
      <p className="mt-0.5 text-[11.5px] text-[#2a1b57]">Use these actions when additional steps are needed.</p>
      <div className="mt-2.5 grid gap-2.5 @[21rem]:grid-cols-3">
        <ActionTile
          glyph={<span className="relative inline-flex size-[34px] items-center justify-center" aria-hidden="true"><FileText className="size-[30px] fill-[#e4defb] text-[#3b1fd6]" strokeWidth={2} /><span className="absolute -right-1 -bottom-1 flex size-[16px] items-center justify-center rounded-full bg-[#3b1fd6] text-[10px] font-bold text-white">?</span></span>}
          title="Request Information" desc="Ask the client to provide additional information." cta="Send Request"
          locked={!permitted.request_info.allowed} lockedReason={permitted.request_info.reason} onClick={() => onAction('request_info')}
        />
        <ActionTile
          glyph={<TriangleAlert className="size-[34px] fill-[#f08a24] text-white" aria-hidden="true" />}
          title="Send Warning" desc="Send a formal platform warning." cta="Create Warning"
          locked={!permitted.send_warning.allowed} lockedReason={permitted.send_warning.reason} onClick={() => onAction('send_warning')}
        />
        <ActionTile
          glyph={<ShieldAlert className="size-[34px] fill-[#e11d2e] text-white" aria-hidden="true" />}
          title="Place Under Review" desc={reviewActive ? 'A review is active. End it when the review is complete.' : 'Mark account for internal review.'} cta={reviewActive ? 'End Review' : 'Start Review'}
          badge={reviewActive ? 'Active' : null}
          locked={!reviewActive && !review.allowed} lockedReason={review.reason}
          onClick={() => (reviewActive ? onManage('review') : onAction('place_review'))}
        />
      </div>
    </section>
  )
}

function ImpactRow({ disc, icon: Icon, filled = true, title, desc, onClick, disabled, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? hint : undefined}
      className={cn('flex w-full items-center gap-3 rounded-xl border border-[#efe3e1] bg-white px-3 py-2.5 text-left shadow-sm transition', disabled ? 'cursor-not-allowed opacity-80' : 'hover:bg-[#fffafa]')}
    >
      <span className={cn('flex size-[40px] shrink-0 items-center justify-center rounded-full', disc)}>
        <Icon className="size-[20px] text-white" fill={filled ? 'currentColor' : 'none'} strokeWidth={filled ? 2 : 2.6} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] leading-tight font-bold text-[#1b1140]">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-[#2a1b57]">{desc}</span>
      </span>
      <ArrowRight className="size-[17px] shrink-0 text-[#3b1fd6]" aria-hidden="true" />
    </button>
  )
}

// Clearly separated from everyday actions. Never offers "Delete Account" as an ordinary Admin button.
export function HighImpactCard({ permitted, onAction }) {
  return (
    <section aria-label="High-impact account actions" className="min-w-0 rounded-xl border border-[#f5d3cf] bg-[#fdeceb] p-3.5 shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(120,20,20,0.18)]">
      <h2 className="text-[17px] leading-tight font-bold tracking-tight text-[#7a1d17]">High-Impact Account Actions</h2>
      <p className="mt-0.5 text-[11.5px] leading-snug text-[#1b1140]">Use with caution. These actions significantly affect the client’s access.</p>
      <div className="mt-2.5 space-y-2">
        <ImpactRow disc="bg-[#f59e0b]" icon={Pause} title="Suspend Account" desc="Temporarily restrict all or selected access." onClick={() => onAction('suspend')} disabled={!permitted.suspend.allowed} hint={permitted.suspend.reason} />
        <ImpactRow disc="bg-[#16a34a] ring-[3px] ring-[#bfe8cd]" icon={Play} title="Reactivate Account" desc="Restore account access (for suspended accounts)." onClick={() => onAction('reactivate')} disabled={!permitted.reactivate.allowed} hint={permitted.reactivate.reason} />
        <ImpactRow disc="bg-[#e11d2e]" icon={Power} filled={false} title="Deactivate Account" desc="Disable the account according to platform rules." onClick={() => onAction('deactivate')} disabled={!permitted.deactivate.allowed} hint={permitted.deactivate.reason} />
      </div>
    </section>
  )
}
