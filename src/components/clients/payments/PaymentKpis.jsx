import { ArrowDown, ArrowUp, Check, Clock, RotateCcw, Wallet, X } from 'lucide-react'
import { cn } from '../../../lib/utils'

const money = (cur, n) => `${cur} ${n.toLocaleString('en-US')}`

function Kpi({ tab, active, onSelect, disc, icon: Icon, iconClass, label, value, sub, subClass }) {
  const body = (
    <>
      <span className={cn('flex size-[50px] shrink-0 items-center justify-center rounded-full', disc)}>
        <Icon className={cn('size-[24px]', iconClass)} aria-hidden="true" />
      </span>
      <div className="min-w-0 text-left">
        <p className="text-[12px] leading-tight font-medium whitespace-nowrap text-[#1b1140]">{label}</p>
        <p className="text-[24px] leading-[1.15] font-bold tracking-tight whitespace-nowrap text-[#1b1140]">{value}</p>
        <p className={cn('mt-0.5 text-[10.5px] leading-tight whitespace-nowrap text-[#4a4466]', subClass)}>{sub}</p>
      </div>
    </>
  )
  const cls = cn(
    'flex min-w-0 items-center gap-3 rounded-xl border border-[#e6e1f3] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)] transition',
    active && 'ring-2 ring-[#7a5cf0]/60',
  )
  if (!onSelect) return <div className={cls}>{body}</div>
  return (
    <button type="button" onClick={() => onSelect(tab)} aria-pressed={active} className={cn(cls, 'cursor-pointer hover:bg-[#faf9fe]')}>
      {body}
    </button>
  )
}

export default function PaymentKpis({ summary: s, currency, periodLabel, activeTab, onSelect }) {
  const up = s.totalPaidDelta >= 0
  const Arrow = up ? ArrowUp : ArrowDown
  return (
    <div className="grid grid-cols-2 gap-2.5 @[44rem]:grid-cols-3 @[64rem]:grid-cols-5">
      <Kpi
        disc="bg-[#e4defb]"
        icon={Wallet}
        iconClass="fill-[#4527c8]/25 text-[#3b1fd6]"
        label="Total Paid"
        value={money(currency, s.totalPaid)}
        sub={
          <span className="inline-flex items-center gap-1">
            <span className={cn('inline-flex items-center gap-0.5 font-semibold', up ? 'text-[#15803d]' : 'text-[#dc2626]')}>
              <Arrow className="size-3" aria-hidden="true" />{Math.abs(s.totalPaidDelta)}%
            </span>
            vs. {periodLabel.toLowerCase()}
          </span>
        }
      />
      <Kpi tab="successful" active={activeTab === 'successful'} onSelect={onSelect} disc="bg-[#dcf6e4]" icon={Check} iconClass="text-[#15803d] [stroke-width:3]" label="Successful Payments" value={s.successful} sub={`${s.successRate}% success rate`} subClass="font-medium text-[#15803d]" />
      <Kpi tab="pending" active={activeTab === 'pending'} onSelect={onSelect} disc="bg-[#fde9c2] ring-[3px] ring-[#f5a524]/60" icon={Clock} iconClass="text-[#b4570b]" label="Pending" value={s.pending} sub={money(currency, s.pendingAmount)} />
      <Kpi tab="refunded" active={activeTab === 'refunded'} onSelect={onSelect} disc="bg-[#e4defb]" icon={RotateCcw} iconClass="text-[#3b1fd6] [stroke-width:2.5]" label="Refunded" value={money(currency, s.refundedAmount)} sub={`${s.refundCount} ${s.refundCount === 1 ? 'refund' : 'refunds'}`} />
      <Kpi tab="failed" active={activeTab === 'failed'} onSelect={onSelect} disc="bg-[#fde2e2]" icon={X} iconClass="text-[#dc2626] [stroke-width:3]" label="Failed" value={s.failed} sub={`${s.failureRate}% failure rate`} subClass="font-medium text-[#dc2626]" />
    </div>
  )
}
