import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import EmptyState from '../../ui/EmptyState'
import { PROFILE_CARD } from '../profile/ProfileCard'
import { MethodGlyph } from '../wallet/WalletBadges'
import { PaymentStatusPill, formatPrice } from './MembershipBadges'
import { formatDay } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const TEMPLATE = 'minmax(80px,0.8fr) minmax(110px,1.1fr) minmax(120px,1.1fr) minmax(86px,0.8fr) minmax(100px,0.9fr) minmax(76px,0.7fr)'
const HEAD = ['Date', 'Description', 'Method', 'Amount', 'Status', 'Action']
const OUTLINE = 'inline-flex h-8 items-center justify-center gap-1 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-2.5 text-[12px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]'

// Only payments whose status came from the payment system. There is no control here to
// change a payment's status — investigation happens in ADM-014 / Payment Details.
export default function MembershipPayments({ payments, client, viewAllTo, paymentTo, linkState }) {
  const tz = client.timeZone
  return (
    <section aria-label="Recent membership payments" className={cn(PROFILE_CARD, 'p-3')}>
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-[17px] font-bold tracking-tight text-[#1b1140]">Recent Membership Payments</h2>
        <Link to={viewAllTo} state={linkState} className="inline-flex h-8 items-center gap-1 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-2.5 text-[12px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]">
          View All <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </header>
      {payments.length === 0 ? (
        <EmptyState title="No membership payments" description="No payment has been made for this membership yet." />
      ) : (
        <div className="overflow-x-auto">
          <div role="table" aria-label="Recent membership payments" className="min-w-[600px]">
            <div role="row" style={{ gridTemplateColumns: TEMPLATE }} className="grid gap-x-3 rounded-lg bg-[#f4f1fc] px-2.5 py-2 text-[11.5px] font-semibold text-[#2a1b57]">
              {HEAD.map((c) => <span key={c} role="columnheader">{c}</span>)}
            </div>
            <ul>
              {payments.map((p) => (
                <li key={p.id} role="row" style={{ gridTemplateColumns: TEMPLATE }} className="grid items-center gap-x-3 border-b border-[#efecf7] px-2.5 py-2.5 text-[12.5px] last:border-b-0 hover:bg-[#faf9fe]">
                  <span role="cell" className="text-[#1b1140]">{formatDay(p.createdAt, tz, { year: true })}</span>
                  <span role="cell" className="leading-tight text-[#1b1140]">{p.description}{p.paymentId && <span className="block text-[11px] text-[#4a4466]">{p.paymentId}</span>}</span>
                  <span role="cell" className="flex items-center gap-1.5 text-[#1b1140]">{p.method ? <><MethodGlyph kind={p.method.kind} />{p.method.label}</> : '—'}</span>
                  <span role="cell" className="font-semibold whitespace-nowrap text-[#1b1140]">{formatPrice(client.currency, p.amount)}</span>
                  <span role="cell"><PaymentStatusPill status={p.status} /></span>
                  <span role="cell">{p.paymentId ? <Link to={paymentTo(p.paymentId)} state={linkState} className={OUTLINE}>View <ArrowRight className="size-3.5" aria-hidden="true" /></Link> : <span className="text-[#6b6785]">—</span>}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
