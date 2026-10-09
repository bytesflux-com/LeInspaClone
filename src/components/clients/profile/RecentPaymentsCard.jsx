import { Link } from 'react-router'
import { CircleCheck, Clock, CreditCard, Crown, RotateCcw, Smartphone, Wallet, Ban } from 'lucide-react'
import { ProfileCard, CardLink, Pill } from './ProfileCard'
import { PAYMENT_STATUS_STYLE } from '../../../constants/clientProfile'
import { formatFullStamp } from '../../../lib/profileFormat'

const STATUS_DOT = { successful: CircleCheck, refunded: Clock, pending: Clock, failed: Ban }

function kindIcon(p) {
  if (p.category === 'subscription') return { Icon: Crown, tile: 'bg-[#15803d]', ring: 'bg-[#dcf6e4]' }
  if (p.category === 'refund') return { Icon: RotateCcw, tile: 'bg-[#dc2626]', ring: 'bg-[#fde2e2]' }
  if (p.kind === 'Card') return { Icon: CreditCard, tile: 'bg-[#1e40d8]', ring: 'bg-[#e2e9ff]' }
  if (p.kind === 'Wallet top-up') return { Icon: Wallet, tile: 'bg-[#1e40d8]', ring: 'bg-[#e2e9ff]' }
  return { Icon: Smartphone, tile: 'bg-[#1e40d8]', ring: 'bg-[#e2e9ff]' }
}

export default function RecentPaymentsCard({ profile: c, allTo, linkState }) {
  const rows = c.recentPayments
  return (
    <ProfileCard icon={CreditCard} title="Recent Payments" action={<CardLink to={allTo} state={linkState}>View All Payments</CardLink>}>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-[#4a4466]">No payments yet.</p>
      ) : (
        <ul>
          {rows.map((p) => {
            const st = PAYMENT_STATUS_STYLE[p.status] || PAYMENT_STATUS_STYLE.pending
            const { Icon, tile, ring } = kindIcon(p)
            return (
              <li key={p.id} className="border-b border-[#efecf7] last:border-b-0">
                <Link to={`/payments/${p.id}`} state={linkState} className="-mx-1 flex items-center gap-2 rounded-lg px-1 py-2 transition hover:bg-[#faf9fd]">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${ring}`}>
                    <span className={`flex size-5 items-center justify-center rounded-md ${tile}`}><Icon className="size-3 text-white" aria-hidden="true" /></span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] leading-tight font-bold text-[#1b1140]">{p.id}</p>
                    <p className="truncate text-[10px] leading-snug text-[#2a1b57]">{formatFullStamp(p.createdAt, c.timeZone)}</p>
                    <p className="truncate text-[9.5px] leading-snug text-[#4a4466]">{p.kind}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Pill box={st.box} dot={STATUS_DOT[p.status] || Clock} dotClass={st.dot}>{st.label}</Pill>
                    <span className="text-[11.5px] leading-none font-bold whitespace-nowrap text-[#1b1140]">{`${c.currency} ${p.amount.toLocaleString('en-US')}`}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </ProfileCard>
  )
}
