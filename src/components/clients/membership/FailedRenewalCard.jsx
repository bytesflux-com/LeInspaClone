import { Link } from 'react-router'
import { ArrowRight, TriangleAlert } from 'lucide-react'
import { MethodGlyph } from '../wallet/WalletBadges'
import { formatDay, formatFullStamp } from '../../../lib/profileFormat'

// Prominent but calm. There is deliberately NO "mark as paid" control: payment success
// can only come from the payment system.
export default function FailedRenewalCard({ failed, client, paymentTo, billingTo, linkState }) {
  const tz = client.timeZone
  const btn = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border-[1.5px] px-3 text-[12.5px] font-semibold transition'
  return (
    <section role="alert" aria-label="Membership needs attention" className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-[#f3d9a8] bg-[#fff6e4] px-4 py-3.5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#ffe3bd]" aria-hidden="true"><TriangleAlert className="size-6 text-[#c2570c]" /></span>
      <div className="min-w-[220px] flex-1">
        <h2 className="text-[16px] font-bold text-[#7a3a05]">Membership Needs Attention</h2>
        <p className="text-[12.5px] text-[#92510a]">Latest renewal payment failed{failed.reason ? ` — ${failed.reason.toLowerCase()}` : ''}.</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] @[40rem]:grid-cols-4">
        <div><dt className="text-[#92510a]">Attempted</dt><dd className="font-semibold text-[#1b1140]">{formatDay(failed.attemptedAt, tz, { year: true })}</dd></div>
        <div><dt className="text-[#92510a]">Method</dt><dd className="flex items-center gap-1.5 font-semibold text-[#1b1140]">{failed.method && <MethodGlyph kind={failed.method.kind} />}{failed.method?.label || '—'}</dd></div>
        <div><dt className="text-[#92510a]">Status</dt><dd className="font-semibold text-[#c2570c]">Failed</dd></div>
        {/* Only shown when the platform has really scheduled a retry. */}
        {failed.nextRetryAt && <div><dt className="text-[#92510a]">Next retry</dt><dd className="font-semibold text-[#1b1140]">{formatFullStamp(failed.nextRetryAt, tz)}</dd></div>}
      </dl>
      <div className="flex flex-wrap gap-2">
        {failed.paymentId && <Link to={paymentTo(failed.paymentId)} state={linkState} className={`${btn} border-[#d9a441] bg-white text-[#8a5a0b] hover:bg-[#fffaf0]`}>View Payment <ArrowRight className="size-3.5" aria-hidden="true" /></Link>}
        <Link to={billingTo} state={linkState} className={`${btn} border-[#8b6cf0] bg-white text-[#3b1fd6] hover:bg-[#f4f1fc]`}>View Billing History <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
      </div>
    </section>
  )
}
