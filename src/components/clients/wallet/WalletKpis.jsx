import { ArrowDown, ArrowUp, Clock, Coins, Wallet } from 'lucide-react'
import { cn } from '../../../lib/utils'

const money = (cur, n) => `${cur} ${n.toLocaleString('en-US')}`
const CARD_SHADOW = 'shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)]'

function Tile({ tab, active, onSelect, className, children, label }) {
  const cls = cn('flex min-w-0 items-center gap-3 rounded-xl px-3.5 py-3.5 text-left transition', CARD_SHADOW, active && 'ring-2 ring-[#7a5cf0]/70', className)
  if (!onSelect) return <div className={cls}>{children}</div>
  return (
    <button type="button" onClick={() => onSelect(tab)} aria-pressed={active} aria-label={label} className={cn(cls, 'cursor-pointer hover:brightness-[0.98]')}>
      {children}
    </button>
  )
}

function Stat({ tab, active, onSelect, tone, disc, icon: Icon, iconClass, label, value }) {
  return (
    <Tile tab={tab} active={active} onSelect={onSelect} className={tone} label={`${label} ${value}`}>
      <span className={cn('flex size-[52px] shrink-0 items-center justify-center rounded-full', disc)}>
        <Icon className={cn('size-[26px]', iconClass)} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] leading-tight font-medium whitespace-nowrap text-[#1b1140]">{label}</p>
        <p className="mt-1 text-[22px] leading-[1.1] font-bold tracking-tight whitespace-nowrap text-[#1b1140]">{value}</p>
      </div>
    </Tile>
  )
}

// The available balance is the dominant card: it answers the first question an Admin has.
export default function WalletKpis({ summary: s, currency, activeTab, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 @[44rem]:grid-cols-3 @[64rem]:grid-cols-[1.5fr_1.05fr_1fr_1fr_0.85fr]">
      <div className={cn('col-span-2 flex min-w-0 items-center gap-4 rounded-xl bg-gradient-to-br from-[#4a2bdc] to-[#3a1cc4] px-4 py-3.5 text-white @[44rem]:col-span-3 @[64rem]:col-span-1', CARD_SHADOW)}>
        <span className="flex size-[62px] shrink-0 items-center justify-center rounded-2xl bg-white/20" aria-hidden="true">
          <Wallet className="size-[32px] fill-white/90 text-white" />
        </span>
        <div className="min-w-0">
          <p className="text-[17px] leading-tight font-bold">Client Wallet</p>
          <p className="mt-0.5 text-[13.5px] leading-tight font-medium text-white/85">Available Balance</p>
          <p className="mt-1 text-[34px] leading-[1.05] font-extrabold tracking-tight whitespace-nowrap">{money(currency, s.balance)}</p>
        </div>
      </div>

      <Stat tab="pending" active={activeTab === 'pending'} onSelect={onSelect} tone="bg-[#eaf6ee]" disc="bg-[#cfeedb]" icon={Clock} iconClass="text-[#15803d]" label="Pending" value={money(currency, s.pending)} />
      <Stat tab="credits" active={activeTab === 'credits'} onSelect={onSelect} tone="bg-[#efebfc]" disc="bg-[#d9d0fa]" icon={ArrowUp} iconClass="text-[#3b1fd6] [stroke-width:3]" label="Total Credits" value={money(currency, s.credits)} />
      <Stat tab="debits" active={activeTab === 'debits'} onSelect={onSelect} tone="bg-[#fdecec]" disc="bg-[#fbd5d5]" icon={ArrowDown} iconClass="text-[#dc2626] [stroke-width:3]" label="Total Debits" value={money(currency, s.debits)} />
      <Stat tone="bg-[#fdf3e1]" disc="bg-[#fbe3b4]" icon={Coins} iconClass="text-[#b4570b]" label="Currency" value={currency} />
    </div>
  )
}
