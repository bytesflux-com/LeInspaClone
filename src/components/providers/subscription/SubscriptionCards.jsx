import { useState } from 'react'
import { Link } from 'react-router'
import { BarChart3, CircleAlert, CircleCheck, CircleMinus, Copy, Crown, Download, Eye, History, Receipt, Sparkles, Target } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { downloadTextFile, toCsv } from '../../../lib/download'
import { Btn, LinkAction, Panel, Pill, Row } from '../trust/TrustUI'
import { fmtDate, fmtMoney, humanize } from '../trust/trustFormat'

const STATUS_TONE = { active: 'green', expiring_soon: 'amber', payment_pending: 'amber', expired: 'red', suspended: 'red', cancelled: 'grey', none: 'grey' }
const PAY_TONE = { paid: 'green', successful: 'green', completed: 'green', pending: 'amber', failed: 'red', not_applicable: 'grey' }
const range = (a, b) => `${fmtDate(a, { year: false })} – ${fmtDate(b)}`

function Check({ ok, children, tone }) {
  return (
    <li className="flex items-center gap-1.5 text-[12px] text-slate-700">
      {ok ? <CircleCheck className="size-4 text-emerald-600" /> : <CircleMinus className={cn('size-4', tone === 'amber' ? 'text-amber-500' : 'text-slate-400')} />}
      {children}
    </li>
  )
}

export function CurrentSubscriptionCard({ data, onManage, onCopy }) {
  const s = data.subscription
  if (!s) {
    return <Panel title={data.labels.subscription} icon={Crown}><p className="text-[12px] text-slate-500">This provider has no subscription record.</p></Panel>
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(s.id); onCopy?.(`${s.id} copied`) } catch { onCopy?.('Unable to copy', 'error') }
  }
  return (
    <Panel bodyClass="pt-4">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-royal-700 text-gold-300"><Crown className="size-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-slate-500">{data.labels.subscription}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[18px] font-bold text-royal-950">{s.planName}</h3>
            <Pill tone={STATUS_TONE[data.status.status]} dot>{data.status.label}</Pill>
          </div>
          {s.pendingPlanName && <p className="text-[11.5px] text-royal-600">Changes to {s.pendingPlanName} at next renewal</p>}
        </div>
      </div>
      <div className="mt-3 divide-y divide-slate-100">
        <Row label="Subscription ID"><span className="inline-flex items-center gap-1">{s.id}<button type="button" onClick={copy} aria-label="Copy subscription ID" className="text-royal-500"><Copy className="size-3.5" /></button></span></Row>
        <Row label="Billing Cycle">{humanize(s.billingCycle)}</Row>
        <Row label="Current Period">{range(s.currentPeriodStart, s.currentPeriodEnd)}</Row>
        <Row label="Next Renewal">{s.nextRenewal ? fmtDate(s.nextRenewal) : 'No renewal scheduled'}</Row>
        <Row label="Payment Status"><Pill tone={PAY_TONE[s.paymentStatus] || 'grey'} dot>{humanize(s.paymentStatus)}</Pill></Row>
        <Row label="Market">{data.provider.flag} {data.provider.country}</Row>
        <Row label="Currency">{s.price.currency || '—'}</Row>
        <Row label="Current Price"><span className="text-[14px] font-bold text-royal-950" title={s.priceSource === 'subscription_record' ? 'Amount charged for this period' : 'From plan configuration'}>{fmtMoney(s.price)}</span></Row>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {s.latestPaymentId ? <Link to={`/payments/${s.latestPaymentId}`} className="inline-flex items-center justify-center gap-1 rounded-xl bg-royal-700 px-3 py-2 text-[12px] font-semibold text-white hover:bg-royal-800">View Payment →</Link> : <Btn disabled>View Payment</Btn>}
        <Btn variant="outline" onClick={onManage} disabled={!data.permitted.subscription.length} title={!data.permitted.subscription.length ? 'Needs subscription-management permission' : undefined}>Manage Subscription</Btn>
      </div>
    </Panel>
  )
}

export function MarketplaceVisibilityCard({ data, onRules }) {
  const v = data.visibility
  return (
    <Panel title={data.labels.visibility} icon={Eye}>
      <div className="flex items-center gap-2">
        <h3 className="text-[16px] font-bold text-royal-950">{v.level === 'premium' ? 'Premium Visibility' : 'Standard Visibility'}</h3>
        <Pill tone={v.baseVisible ? 'green' : 'red'} dot>{v.baseVisible ? 'Active' : v.paused ? 'Paused' : 'Not visible'}</Pill>
      </div>
      <p className="mt-1 text-[12px] text-slate-500">{v.baseVisible ? 'This provider appears in the following areas:' : `Not shown in discovery — ${v.blocks.join('; ')}.`}</p>
      <ul className="mt-2 space-y-1.5">
        {v.surfaces.map((s) => <Check key={s.key} ok={s.state === 'active'}>{s.label}</Check>)}
      </ul>
      {v.units.length > 0 && (
        <div className="mt-3 rounded-xl bg-lavender-100/60 p-2.5">
          <p className="mb-1 text-[11.5px] font-semibold text-royal-900">{data.provider.category === 'spa' ? 'Branch Discovery Eligibility' : 'Wellness Locations Visibility'}</p>
          <ul className="space-y-1">{v.units.map((u) => <Check key={u.id} ok={u.visible} tone="amber">{u.name}{u.reason && <span className="text-[10.5px] text-slate-500">— {u.reason}</span>}</Check>)}</ul>
        </div>
      )}
      <div className={cn('mt-3 rounded-xl border p-2.5', v.premium.active ? 'border-royal-300 bg-royal-700 text-white' : 'border-[#ecd7a6] bg-[#fdf8ec]')}>
        <div className="flex items-center justify-between">
          <span className={cn('inline-flex items-center gap-1.5 text-[12.5px] font-bold', v.premium.active ? 'text-gold-300' : 'text-royal-950')}><Sparkles className="size-4 text-gold-400" />Premium Visibility</span>
          <Pill tone={v.premium.active ? 'gold' : 'grey'}>{v.premium.active ? 'Active' : 'Not Active'}</Pill>
        </div>
        <p className={cn('mt-1 text-[11px]', v.premium.active ? 'text-royal-100' : 'text-slate-600')}>{v.premium.active ? `Benefits active until ${fmtDate(v.premium.endsAt)}.` : 'Higher search priority, featured placement and a Premium badge — when purchased and eligible.'}</p>
      </div>
      <Btn variant="outline" className="mt-3 w-full" onClick={onRules}>View Visibility Rules</Btn>
    </Panel>
  )
}

export function SubscriptionStatusCard({ data }) {
  const s = data.subscription
  const st = data.status
  return (
    <Panel title="Subscription Status" icon={Receipt}>
      <div className="divide-y divide-slate-100">
        <Row label="Plan">{s?.planName || '—'}</Row>
        <Row label="Status"><Pill tone={STATUS_TONE[st.status]} dot>{st.label}</Pill></Row>
        <Row label="Auto-Renewal"><Pill tone={s?.autoRenew ? 'green' : 'grey'} dot>{s?.autoRenew ? 'On' : 'Off'}</Pill></Row>
        <Row label="Latest Payment"><Pill tone={PAY_TONE[st.latestPayment] || 'grey'} dot>{humanize(st.latestPayment) || '—'}</Pill></Row>
        <Row label="Next Billing">{s?.nextRenewal ? fmtDate(s.nextRenewal) : '—'}</Row>
        <Row label="Grace Period">{st.inGrace ? `Active (ends ${fmtDate(st.graceEndsAt)})` : data.policy ? `${st.gracePeriodDays} days if a renewal fails` : 'Not applicable'}</Row>
        <Row label="Access Impact">{st.accessImpact}</Row>
      </div>
      <p className="mt-2 text-[10.5px] text-slate-500">Subscription status is separate from account status ({humanize(data.provider.accountStatus)}).</p>
    </Panel>
  )
}

export function VisibilityLevelCard({ data, onManage }) {
  const v = data.visibility
  return (
    <Panel title="Current Visibility Level" icon={BarChart3}>
      <Row label="Standard Visibility"><Pill tone={v.baseVisible ? 'green' : 'grey'} dot>{v.baseVisible ? 'Included' : 'Not visible'}</Pill></Row>
      <Row label="Premium Visibility"><Pill tone={v.premium.active ? 'gold' : 'grey'} dot>{v.premium.active ? 'Active' : 'Not active'}</Pill></Row>
      <Row label="Featured Placement"><Pill tone={v.premium.featured && v.premium.active ? 'purple' : 'grey'} dot>{v.premium.featured && v.premium.active ? 'Enabled' : 'Off'}</Pill></Row>
      <Btn variant="outline" className="mt-2 w-full" onClick={onManage} disabled={!data.permitted.visibility.length} title={!data.permitted.visibility.length ? 'Needs visibility-management permission' : undefined}>Manage Visibility</Btn>
    </Panel>
  )
}

const PLACEMENT_TONE = { active: 'green', eligible: 'green', inactive: 'red', not_active: 'grey', not_eligible: 'grey' }
export function DiscoveryPlacementCard({ data, onRules }) {
  return (
    <Panel title="Discovery Placement" icon={Target}>
      <div className="divide-y divide-slate-100">
        {data.visibility.placement.map((p) => (
          <Row key={p.key} label={p.label}><span title={p.reason || undefined}><Pill tone={PLACEMENT_TONE[p.state]} dot>{humanize(p.state)}</Pill></span></Row>
        ))}
      </div>
      <p className="mt-2 rounded-xl bg-lavender-100/60 p-2.5 text-[11px] text-slate-600">Featured placement is subject to eligibility rules including verification status, account restrictions, service activity and quality standards — subscription alone does not guarantee placement.</p>
      <Btn variant="outline" className="mt-2 w-full" onClick={onRules}>View Discovery Rules</Btn>
    </Panel>
  )
}

export function PremiumInfoCard({ data, onPlans }) {
  if (data.visibility.premium.active) return null
  return (
    <Panel tone="gold">
      <div className="flex items-start gap-3 pt-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-royal-800 text-gold-300"><Crown className="size-5" /></span>
        <div>
          <p className="text-[13.5px] font-bold text-royal-950">Premium Visibility Available</p>
          <p className="text-[11.5px] text-slate-600">Higher search priority, featured placement and a Premium badge, purchased by the provider through the subscription system.</p>
        </div>
      </div>
      <Btn variant="gold" className="mt-3 w-full" onClick={onPlans}>View Premium Plans →</Btn>
    </Panel>
  )
}

export function FailedRenewalCard({ data }) {
  const f = data.failedRenewal
  if (!f) return null
  return (
    <Panel tone="red" title={<span className="text-rose-700">Subscription Needs Attention</span>} icon={CircleAlert} action={<LinkAction to={`/payments/${f.paymentId}`}>View Details</LinkAction>}>
      <p className="text-[12px] text-rose-700">Latest {f.kind === 'visibility_addon' ? 'Premium Visibility' : 'subscription'} renewal payment failed.</p>
      <div className="mt-1 divide-y divide-rose-100">
        <Row label="Attempted">{fmtDate(f.attemptedAt)}</Row>
        <Row label="Method">{f.method || '—'}</Row>
        <Row label="Status"><Pill tone="red" dot>Failed</Pill></Row>
        {f.reason && <Row label="Reason">{f.reason}</Row>}
        <Row label="Current Access">{f.accessState}</Row>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <Link to={`/payments/${f.paymentId}`} className="inline-flex items-center justify-center rounded-xl bg-royal-700 px-3 py-2 text-[12px] font-semibold text-white hover:bg-royal-800">View Payment</Link>
        <button type="button" onClick={() => document.getElementById('subscription-history')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center justify-center rounded-xl border border-royal-300 bg-white px-3 py-2 text-[12px] font-semibold text-royal-700 hover:bg-royal-50">View Billing History</button>
      </div>
      <p className="mt-2 text-[10.5px] text-slate-500">Payment status comes from the payment system and cannot be marked successful by an Admin.</p>
    </Panel>
  )
}

export function PremiumVisibilityCard({ data, onPerformance }) {
  const p = data.visibility.premium
  if (!p.startsAt && !p.active) return null
  return (
    <Panel title="Premium Visibility" icon={Crown} action={<Pill tone={p.active ? 'gold' : 'grey'}>{p.active ? '✦ Active' : 'Expired'}</Pill>}>
      <div className="divide-y divide-slate-100">
        <Row label="Started">{fmtDate(p.startsAt)}</Row>
        <Row label={p.active ? 'Ends' : 'Ended'}>{fmtDate(p.endsAt)}</Row>
        <Row label="Placement">Higher ranking</Row>
        <Row label="Badge">{p.active ? 'Premium' : 'Premium (inactive)'}</Row>
        <Row label="Featured Eligibility">{p.active ? (p.featured ? 'Enabled' : 'Eligible — not enabled') : 'Not eligible (subscription ended)'}</Row>
      </div>
      {!p.active && <p className="mt-2 text-[10.5px] text-slate-500">Standard visibility continues while the base subscription is valid.</p>}
      <Btn variant="outline" className="mt-2 w-full" onClick={onPerformance}>View Performance</Btn>
    </Panel>
  )
}

export function HistoryTabs({ data, providerId }) {
  const [tab, setTab] = useState('subscription')
  const exportCsv = () => {
    const files = {
      subscription: () => toCsv(data.history, [
        { label: 'Plan', value: (h) => h.planName },
        { label: 'Period start', value: (h) => fmtDate(h.periodStart) },
        { label: 'Period end', value: (h) => fmtDate(h.periodEnd) },
        { label: 'Amount', value: (h) => fmtMoney(h.amount) },
        { label: 'Status', value: (h) => h.status },
        { label: 'Payment', value: (h) => h.paymentStatus },
      ]),
      visibility: () => toCsv(data.visibilityHistory, [
        { label: 'Date', value: (v) => fmtDate(v.at) },
        { label: 'Event', value: (v) => v.label },
        { label: 'Reason', value: (v) => v.reason || '' },
        { label: 'Source', value: (v) => v.source || '' },
      ]),
      payments: () => toCsv(data.payments, [
        { label: 'Date', value: (p) => fmtDate(p.createdAt) },
        { label: 'Plan', value: (p) => p.planName },
        { label: 'Method', value: (p) => p.method },
        { label: 'Amount', value: (p) => (p.masked ? 'restricted' : p.amount) },
        { label: 'Status', value: (p) => p.status },
      ]),
    }
    downloadTextFile(`${providerId}-${tab}-history.csv`, files[tab]())
  }
  const tabs = [['subscription', 'Subscription History'], ['visibility', 'Visibility History'], ['payments', 'Subscription Payments']]
  return (
    <section id="subscription-history" className="scroll-mt-4 rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3.5">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={cn('rounded-xl px-3 py-1.5 text-[12px] font-semibold', tab === id ? 'bg-royal-700 text-white' : 'border border-slate-200 text-slate-600 hover:bg-royal-50')}>{label}</button>
          ))}
        </div>
        <Btn variant="outline" className="py-1.5" onClick={exportCsv}><Download className="size-3.5" />Export</Btn>
      </div>
      <div className="mt-3 overflow-x-auto">
        {tab === 'subscription' && (
          <Table head={['Plan', 'Period', `Amount${data.subscription?.price.currency ? ` (${data.subscription.price.currency})` : ''}`, 'Status', 'Payment', 'Action']}>
            {data.history.map((h) => (
              <tr key={h.id}>
                <Td strong>{h.planName}</Td>
                <Td>{range(h.periodStart, h.periodEnd)}</Td>
                <Td>{h.amount.masked ? '••••' : h.amount.amount !== null ? Number(h.amount.amount).toLocaleString('en') : '—'}</Td>
                <Td><Pill tone={h.status === 'active' ? 'green' : h.status === 'superseded' ? 'purple' : h.status === 'failed' ? 'red' : 'grey'} dot>{humanize(h.status)}</Pill></Td>
                <Td><Pill tone={PAY_TONE[h.paymentStatus] || 'grey'} dot>{humanize(h.paymentStatus)}</Pill></Td>
                <Td>{h.paymentId ? <Link to={`/payments/${h.paymentId}`} className="rounded-lg border border-royal-300 px-2.5 py-1 text-[11.5px] font-semibold text-royal-700 hover:bg-royal-50">View →</Link> : <span className="text-slate-400">—</span>}</Td>
              </tr>
            ))}
          </Table>
        )}
        {tab === 'visibility' && (
          <Table head={['Date', 'Event', 'Reason', 'Source']}>
            {data.visibilityHistory.map((v) => (
              <tr key={v.id}><Td>{fmtDate(v.at)}</Td><Td strong>{v.label}</Td><Td>{v.reason || '—'}</Td><Td>{v.actorName ? `${v.source} — ${v.actorName}` : v.source || '—'}</Td></tr>
            ))}
          </Table>
        )}
        {tab === 'payments' && <PaymentsTable payments={data.payments} />}
      </div>
      <p className="px-4 py-2.5 text-[10.5px] text-slate-500">Historical periods are preserved as charged — Admin changes append new records and never overwrite previous plan periods.</p>
    </section>
  )
}

function Table({ head, children }) {
  return (
    <table className="w-full min-w-[640px] text-left text-[12px]">
      <thead className="border-y border-slate-100 bg-lavender-50 text-[11px] font-semibold text-slate-500"><tr>{head.map((h) => <th key={h} className="px-3 py-2 first:pl-4">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">{children}</tbody>
    </table>
  )
}
const Td = ({ children, strong }) => <td className={cn('px-3 py-2 first:pl-4', strong ? 'font-semibold text-slate-800' : 'text-slate-600')}>{children}</td>

function PaymentsTable({ payments }) {
  if (!payments.length) return <p className="px-4 py-6 text-center text-[12px] text-slate-500">No subscription payments yet.</p>
  return (
    <Table head={['Date', 'Plan', 'Method', 'Amount', 'Status', 'Action']}>
      {payments.map((p) => (
        <tr key={p.id}>
          <Td>{fmtDate(p.createdAt)}</Td>
          <Td strong>{p.planName}</Td>
          <Td>{p.method || '—'}</Td>
          <Td>{p.masked ? '••••' : p.amount !== null ? `${p.currency || ''} ${Number(p.amount).toLocaleString('en')}` : '—'}</Td>
          <Td><Pill tone={PAY_TONE[p.status] || 'grey'} dot>{humanize(p.status)}</Pill></Td>
          <Td><Link to={`/payments/${p.id}`} className="rounded-lg border border-royal-300 px-2.5 py-1 text-[11.5px] font-semibold text-royal-700 hover:bg-royal-50">View →</Link></Td>
        </tr>
      ))}
    </Table>
  )
}

export function RecentPaymentsCard({ data }) {
  return (
    <Panel title="Recent Subscription Payments" icon={Receipt} action={<LinkAction onClick={() => document.getElementById('subscription-history')?.scrollIntoView({ behavior: 'smooth' })}>View All</LinkAction>} bodyClass="px-0">
      <div className="overflow-x-auto"><PaymentsTable payments={data.payments.slice(0, 4)} /></div>
    </Panel>
  )
}

export function VisibilityTimelineCard({ data }) {
  return (
    <Panel title="Visibility History" icon={History}>
      {data.visibilityHistory.length === 0 ? <p className="text-[12px] text-slate-500">No visibility changes yet.</p> : (
        <ol className="relative space-y-3 border-l-2 border-royal-100 pl-4">
          {data.visibilityHistory.slice(0, 5).map((v) => (
            <li key={v.id} className="relative text-[12px]">
              <span className="absolute top-1 -left-[21px] size-3 rounded-full border-2 border-white bg-royal-600" />
              <p className="text-[11px] text-slate-500">{fmtDate(v.at)}</p>
              <p className="font-semibold text-slate-800">{v.label}</p>
              {(v.reason || v.source) && <p className="text-[11px] text-slate-500">{v.reason ? `Reason: ${v.reason}` : `Source: ${v.source}`}</p>}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}
