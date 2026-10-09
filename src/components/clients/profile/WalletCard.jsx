import { CalendarCheck, Wallet } from 'lucide-react'
import { ProfileCard, CardLink } from './ProfileCard'
import { cn } from '../../../lib/utils'

const money = (c, n) => `${c.currency} ${n.toLocaleString('en-US')}`

export default function WalletCard({ profile: c, to, linkState }) {
  const w = c.wallet
  const tiles = [
    { label: 'Total Credits', value: w.credits, box: 'bg-[#f1eefc]' },
    { label: 'Total Debits', value: w.debits, box: 'bg-[#f1eefc]' },
    { label: 'Pending Refund', value: w.pendingRefund, box: w.pendingRefund ? 'bg-[#fdf0dc]' : 'bg-[#f1eefc]' },
  ]
  return (
    <ProfileCard icon={Wallet} title="Client Wallet" action={<CardLink to={to} state={linkState}>View Wallet</CardLink>}>
      <div className="flex items-center gap-3 rounded-xl bg-[#f1eefc] p-2.5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#e2e9ff]">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#1e40d8]"><CalendarCheck className="size-[18px] text-white" aria-hidden="true" /></span>
        </span>
        <div>
          <p className="text-[12.5px] text-[#2a1b57]">Available Balance</p>
          <p className="text-[24px] leading-tight font-bold tracking-tight text-[#1b1140]">{money(c, w.balance)}</p>
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className={cn('min-w-0 rounded-xl px-2.5 py-2.5', t.box)}>
            <p className="text-[10.5px] leading-tight whitespace-nowrap text-[#2a1b57]">{t.label}</p>
            <p className="mt-1 text-[12.5px] leading-tight font-bold whitespace-nowrap text-[#1b1140]">{money(c, t.value)}</p>
          </div>
        ))}
      </div>
    </ProfileCard>
  )
}
