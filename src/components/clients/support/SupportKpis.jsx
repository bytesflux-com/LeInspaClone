import { CircleAlert, CircleCheck, Headphones, Lock, Scale, ShieldCheck } from 'lucide-react'
import { cn } from '../../../lib/utils'

const CARD_SHADOW = 'shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)]'

function Stat({ tab, active, onSelect, tone, disc, icon: Icon, iconClass, label, value, restricted }) {
  const cls = cn('flex min-w-0 items-center gap-3 rounded-xl px-3.5 py-3 text-left transition', CARD_SHADOW, tone, active && 'ring-2 ring-[#7a5cf0]/70')
  const body = (
    <>
      <span className={cn('flex size-[52px] shrink-0 items-center justify-center rounded-xl', disc)}>
        <Icon className={cn('size-[26px]', iconClass)} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] leading-tight font-medium whitespace-nowrap text-[#1b1140]">{label}</p>
        {restricted ? (
          <p className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-[#4a4466]"><Lock className="size-3.5" aria-hidden="true" /> Restricted</p>
        ) : (
          <p className="mt-1 text-[24px] leading-[1.1] font-bold tracking-tight whitespace-nowrap text-[#1b1140]">{value}</p>
        )}
      </div>
    </>
  )
  if (!onSelect || restricted) return <div className={cls}>{body}</div>
  return (
    <button type="button" onClick={() => onSelect(tab)} aria-pressed={active} aria-label={`${label} ${value}`} className={cn(cls, 'cursor-pointer hover:brightness-[0.98]')}>
      {body}
    </button>
  )
}

// Five compact summary cards. A zero safety count is neutral — never alarming.
export default function SupportKpis({ summary: s, activeTab, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 @[44rem]:grid-cols-3 @[64rem]:grid-cols-5">
      <Stat tab="support" active={activeTab === 'support'} onSelect={onSelect} tone="bg-[#f1edff]" disc="bg-[#4527c8]" icon={Headphones} iconClass="text-white" label="Support Tickets" value={s.support} />
      <Stat tab="support" onSelect={onSelect} tone="bg-[#fdeee8]" disc="bg-[#e8473b] !rounded-full" icon={CircleAlert} iconClass="text-white" label="Open Cases" value={s.openCases} />
      <Stat tab="dispute" active={activeTab === 'dispute'} onSelect={onSelect} tone="bg-[#f1edff]" disc="bg-[#e4defb]" icon={Scale} iconClass="text-[#4527c8]" label="Disputes" value={s.disputes} />
      <Stat tab="safety" active={activeTab === 'safety'} onSelect={onSelect} tone="bg-[#f1edff]" disc="bg-[#4527c8]" icon={ShieldCheck} iconClass="text-white" label="Safety Reports" value={s.safety} restricted={s.safety == null} />
      <Stat tone="bg-[#eaf6ee]" disc="bg-[#22a652] !rounded-full" icon={CircleCheck} iconClass="text-white" label="Resolved" value={s.resolved} />
    </div>
  )
}
