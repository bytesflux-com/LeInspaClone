import { useState } from 'react'
import { Link } from 'react-router'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  Award, BadgeCheck, Ban, CalendarClock, CalendarX, CircleAlert, CircleCheck, CircleMinus, ClipboardCheck, FileWarning, Flag, Gavel,
  History, Lock, MessageSquareWarning, Repeat, Scale, Shield, ShieldCheck, Star, TriangleAlert, UserCheck, UserX, Users,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import PersonAvatar from '../../ui/PersonAvatar'
import { Btn, KpiCard, LinkAction, Locked, Panel, Pill, Row } from '../trust/TrustUI'
import { fmtDate } from '../trust/trustFormat'

const BAND_TONE = { strong: 'green', healthy: 'green', watch: 'amber', concern: 'red', nodata: 'grey' }
const LEVEL_TONE = { low: 'green', medium: 'amber', high: 'red' }

export function RiskKpis({ kpis, onExplain }) {
  const q = kpis.quality
  const r = kpis.risk
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard icon={Award} tone="purple" label="Quality Score" value={q.available ? <>{q.score}<span className="text-[14px] font-semibold text-slate-400"> / 100</span></> : '—'}
        sub={q.available ? <span className="flex flex-wrap items-center gap-1.5"><Pill tone={q.score >= 70 ? 'green' : q.score >= 55 ? 'amber' : 'red'} icon={CircleCheck}>{q.label}</Pill><button type="button" onClick={onExplain} className="font-semibold text-royal-600 hover:underline">How is this scored?</button></span> : q.reason} />
      <KpiCard icon={Shield} tone={r.level === 'low' ? 'green' : r.level === 'medium' ? 'amber' : 'red'} label="Risk Level" value={r.label}
        sub={<><Pill tone={LEVEL_TONE[r.level]} dot>{r.summary}</Pill><span className="mt-0.5 block">Based on configured risk rules</span></>} />
      <KpiCard icon={TriangleAlert} tone="amber" label="Open Issues" value={kpis.openIssues.count}
        sub={<Pill tone={kpis.openIssues.count ? 'amber' : 'green'} dot>{kpis.openIssues.label}</Pill>} />
      <KpiCard icon={Ban} tone="red" label="Account Restrictions" value={kpis.restrictions.count ? kpis.restrictions.count : 'None'}
        sub={<Pill tone={kpis.restrictions.count ? 'amber' : 'green'} dot>{kpis.restrictions.count ? 'Active restrictions' : 'No active restrictions'}</Pill>} />
    </div>
  )
}

const SIGNAL_ICONS = { rating: Star, completion: CircleCheck, cancellation: CalendarX, repeat: Repeat, dispute: Scale, reliability: ClipboardCheck }
export function QualitySignalsCard({ signals, onDetails }) {
  return (
    <Panel title="Quality Signals" action={<LinkAction onClick={onDetails}>View Details</LinkAction>}>
      <ul className="divide-y divide-slate-100">
        {signals.map((s) => {
          const Icon = SIGNAL_ICONS[s.key] || CircleCheck
          return (
            <li key={s.key} className="grid grid-cols-[18px_1fr_auto_auto] items-center gap-2 py-1.5 text-[12px]">
              <Icon className="size-4 text-royal-500" />
              <span className="text-slate-700">{s.label}</span>
              <span className="font-semibold text-slate-900">{s.display}{s.detail && <span className="ml-1 font-normal text-slate-500">({s.detail})</span>}</span>
              <Pill tone={BAND_TONE[s.status]} dot>{s.statusLabel}</Pill>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

const RISK_ICONS = { identity: UserCheck, credentials: BadgeCheck, payments: Lock, booking: CalendarClock, complaints: MessageSquareWarning, reviews: Flag, security: Shield, content: ShieldCheck }
export function RiskSignalsCard({ signals }) {
  const tone = { ok: 'text-emerald-600', warn: 'text-amber-600', alert: 'text-rose-600', locked: 'text-slate-400' }
  return (
    <Panel title="Risk Signals">
      <ul className="divide-y divide-slate-100">
        {signals.map((s) => {
          const Icon = RISK_ICONS[s.key] || Shield
          return (
            <li key={s.key} className="flex items-center justify-between gap-2 py-1.5 text-[12px]">
              <span className="flex items-center gap-2 text-slate-700"><Icon className="size-4 text-royal-500" />{s.label}</span>
              <span className={cn('flex items-center gap-1 font-medium', tone[s.state])}>
                {s.state === 'ok' ? <CircleCheck className="size-3.5" /> : s.state === 'locked' ? <Lock className="size-3.5" /> : <CircleAlert className="size-3.5" />}
                {s.text}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-1.5 text-[10.5px] text-slate-500">A risk signal is not proof of wrongdoing.</p>
    </Panel>
  )
}

export function NeedsReviewCard({ items }) {
  const first = items[0]
  return (
    <Panel title="Needs Review" tone={first ? 'amber' : undefined} action={items.length > 1 && <span className="text-[11px] font-semibold text-slate-500">{items.length} items</span>}>
      {!first ? (
        <p className="flex items-center gap-2 text-[12px] text-emerald-700"><CircleCheck className="size-4" />Nothing needs review right now.</p>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 2).map((it) => (
            <div key={it.id} className="rounded-xl border border-amber-200 bg-white p-3">
              <div className="flex items-start gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">{it.kind === 'credential' ? <FileWarning className="size-5" /> : <MessageSquareWarning className="size-5" />}</span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-900">{it.title}</p>
                  {it.caseId && <p className="text-[11.5px] text-slate-500">Case {it.caseId}</p>}
                </div>
              </div>
              <div className="mt-2 divide-y divide-slate-100">
                {it.submittedAt && <Row label="Submitted">{fmtDate(it.submittedAt)}</Row>}
                {it.expiresAt && <Row label="Expires">{fmtDate(it.expiresAt)}</Row>}
                {it.bookingId && <Row label="Related Booking">#{it.bookingId}</Row>}
                <Row label="Category">{it.category}</Row>
                <Row label="Status"><Pill tone="amber" dot>{it.statusLabel}</Pill></Row>
              </div>
              <Link to={it.link} className="mt-2.5 flex items-center justify-center rounded-xl border border-royal-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-royal-700 hover:bg-royal-50">{it.kind === 'credential' ? 'Review Credential →' : 'Review Case →'}</Link>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

const DIRECTION = { improving: ['↗ Improving', 'green'], stable: ['→ Stable', 'purple'], declining: ['↘ Declining', 'amber'], insufficient_data: ['Not enough data', 'grey'] }
export function QualityTrendCard({ trend, period, onPeriod, loading }) {
  const [label, tone] = DIRECTION[trend.direction] || DIRECTION.stable
  return (
    <Panel title="Quality Over Time" action={
      <div className="flex rounded-lg bg-lavender-100 p-0.5 text-[11px] font-semibold">
        {[['30d', '30 Days'], ['90d', '90 Days'], ['12m', '12 Months']].map(([id, l]) => (
          <button key={id} type="button" onClick={() => onPeriod(id)} className={cn('rounded-md px-2 py-1', period === id ? 'bg-royal-700 text-white' : 'text-royal-700')}>{l}</button>
        ))}
      </div>
    }>
      <div className={cn('h-[190px] transition-opacity', loading && 'opacity-50')}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend.points} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
            <CartesianGrid stroke="#eee8fa" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10 }} formatter={(v, n) => [v === null ? 'No data' : `${v}%`, n]} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="ratingPct" name="Rating (% of 5★)" stroke="#5b37a6" strokeWidth={2.2} dot={{ r: 2.5 }} connectNulls />
            <Line type="monotone" dataKey="completionRate" name="Completion Rate" stroke="#c79a4b" strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
            <Line type="monotone" dataKey="cancellationRate" name="Cancellation Rate" stroke="#b5a0e4" strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 flex items-center gap-2 text-[11px] text-slate-500"><Pill tone={tone}>{label}</Pill>Buckets with fewer than 3 records are left empty — one review never moves the trend.</p>
    </Panel>
  )
}

function StatList({ rows }) {
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map(([Icon, label, value, color]) => (
        <li key={label} className="flex items-center justify-between py-1.5 text-[12px]">
          <span className="flex items-center gap-2 text-slate-700"><Icon className={cn('size-4', color || 'text-royal-500')} />{label}</span>
          <span className="font-semibold text-slate-900">{value}</span>
        </li>
      ))}
    </ul>
  )
}

export function BookingReliabilityCard({ data, providerId }) {
  return (
    <Panel title="Booking Reliability" action={<LinkAction to={`/providers/${providerId}/bookings`}>View Bookings</LinkAction>}>
      <StatList rows={[
        [CircleCheck, 'Completed', data.completed, 'text-emerald-600'],
        [CalendarX, 'Provider Cancellations', data.providerCancellations, 'text-rose-500'],
        [UserX, 'No-Shows', data.noShows, 'text-rose-500'],
        [CalendarClock, 'Late Cancellations', data.lateCancellations, 'text-amber-500'],
        [Repeat, 'Reschedules', data.reschedules],
        [TriangleAlert, 'Booking Conflicts', data.conflicts, 'text-amber-500'],
      ]} />
    </Panel>
  )
}

export function ClientExperienceCard({ data, providerId }) {
  return (
    <Panel title="Client Experience" action={<LinkAction to={`/providers/${providerId}/reviews`}>View Reviews</LinkAction>}>
      <StatList rows={[
        [Star, 'Average Rating', data.averageRating ?? '—', 'text-gold-500'],
        [Users, 'Total Reviews', data.totalReviews],
        [Flag, 'Reported Reviews', data.reportedReviews, 'text-rose-500'],
        [MessageSquareWarning, 'Provider Complaints', data.complaints, 'text-rose-500'],
        [Scale, 'Disputes', data.disputes, 'text-rose-500'],
        [CircleMinus, 'Refund-Related Cases', data.refundCases],
      ]} />
      <Link to={`/providers/${providerId}/support`} className="mt-1 inline-block text-[11.5px] font-semibold text-royal-600 hover:underline">View Support & Safety →</Link>
    </Panel>
  )
}

export function ComplianceCard({ compliance }) {
  return (
    <Panel title="Compliance Health" action={<LinkAction to="/verifications">View Details</LinkAction>}>
      <ul className="divide-y divide-slate-100">
        {compliance.items.map((c) => (
          <li key={c.key} className="flex items-center justify-between py-1.5 text-[12px]">
            <span className="flex items-center gap-2 text-slate-700">{c.ok ? <CircleCheck className="size-4 text-emerald-600" /> : <CircleAlert className="size-4 text-amber-500" />}{c.label}</span>
            <Pill tone={c.ok ? 'green' : 'amber'} dot>{c.state}</Pill>
          </li>
        ))}
      </ul>
      {compliance.alerts.map((a) => (
        <div key={a.id} className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[12px]">
          <span><span className="block font-semibold text-amber-800">{a.title}</span><span className="text-slate-600">{a.name}</span></span>
          <span className="text-right"><span className="block text-[11px] text-slate-600">{a.title.includes('Expired') ? 'Expired' : 'Expires'}: {fmtDate(a.expiresAt)}</span><Link to={a.link} className="text-[11.5px] font-semibold text-royal-600">Review Credential →</Link></span>
        </div>
      ))}
      <p className="mt-2 text-[10.5px] text-slate-500">An expiring credential creates attention — it does not suspend the provider automatically.</p>
    </Panel>
  )
}

export function FinancialSignalsCard({ financial, providerId }) {
  return (
    <Panel title={<span className="flex items-center gap-1.5">Financial Signals {!financial && <Lock className="size-3.5 text-royal-400" />}</span>}>
      {!financial ? (
        <Locked text="Financial details are restricted based on your role permissions. Ask a Finance Admin for the review summary." />
      ) : (
        <>
          <StatList rows={[
            [Scale, 'Payment Disputes', financial.paymentDisputes],
            [CircleMinus, 'Refund Rate', `${financial.refundRate ?? 0}%`],
            [Ban, 'Failed Payouts', financial.failedPayouts],
            [Gavel, 'Withdrawal Reviews', financial.withdrawalReviews],
            [TriangleAlert, 'Unusual Transaction Alert', financial.unusualAlert ? 'Yes' : 'None', financial.unusualAlert ? 'text-amber-500' : undefined],
          ]} />
          {financial.unusualAlert && (
            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[12px]">
              <p className="font-semibold text-amber-800">Unusual Activity</p>
              <p className="text-slate-600">{financial.unusualAlert}</p>
              <Link to={`/providers/${providerId}/earnings`} className="text-[11.5px] font-semibold text-royal-600">Review Financial Activity →</Link>
            </div>
          )}
        </>
      )}
    </Panel>
  )
}

export function SafetyCard({ safety, providerId }) {
  return (
    <Panel title="Safety & Conduct" action={<LinkAction to={`/providers/${providerId}/support`}>View History</LinkAction>}>
      <StatList rows={[
        [MessageSquareWarning, 'Open Safety Cases', safety.openCases, 'text-rose-500'],
        [CircleCheck, 'Closed Cases', safety.closedCases, 'text-emerald-600'],
        [Gavel, 'Confirmed Violations', safety.confirmedViolations],
        [TriangleAlert, 'Warnings', safety.warnings, 'text-amber-500'],
        [Ban, 'Active Restrictions', safety.activeRestrictions || 'None', 'text-rose-500'],
      ]} />
      <p className="mt-1.5 text-[10.5px] text-slate-500">Complaints and confirmed violations are counted separately.</p>
    </Panel>
  )
}

const TL_TONE = { amber: 'bg-amber-100 text-amber-700', green: 'bg-emerald-100 text-emerald-700', purple: 'bg-royal-100 text-royal-700', red: 'bg-rose-100 text-rose-700' }
export function RiskTimelineCard({ timeline }) {
  const [all, setAll] = useState(false)
  const list = all ? timeline : timeline.slice(0, 4)
  return (
    <Panel title="Quality & Risk Timeline" action={timeline.length > 4 && <LinkAction onClick={() => setAll((v) => !v)}>{all ? 'Show Less' : 'View All'}</LinkAction>}>
      {list.length === 0 ? <p className="text-[12px] text-slate-500">No events yet.</p> : (
        <ol className="relative space-y-3 border-l-2 border-royal-100 pl-4">
          {list.map((e, i) => (
            <li key={`${e.at}-${i}`} className="relative grid grid-cols-[72px_1fr_auto] items-start gap-2 text-[12px]">
              <span className={cn('absolute top-0.5 -left-[25px] flex size-4 items-center justify-center rounded-full ring-2 ring-white', TL_TONE[e.tone] || TL_TONE.purple)}><History className="size-2.5" /></span>
              <span className="text-[11px] text-slate-500">{fmtDate(e.at)}</span>
              <span className="text-slate-800">{e.label}{e.caseId && <Link to={e.link} className="block text-[11px] font-semibold text-royal-600">{e.caseId}</Link>}</span>
              <span className={cn('text-right text-[11px]', e.tone === 'amber' ? 'text-amber-700' : 'text-slate-500')}>{e.outcome}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

export function AssessmentCard({ assessment, canAssess, onUpdate }) {
  return (
    <Panel title="Admin Assessment" action={canAssess && <LinkAction onClick={onUpdate}>Update Assessment</LinkAction>}>
      {!assessment ? <p className="text-[12px] text-slate-500">No Admin assessment recorded yet.</p> : (
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <PersonAvatar name={assessment.reviewedByName || 'Admin'} size={40} />
            <div className="min-w-0 flex-1 text-[12px]">
              <p className="text-slate-500">Current Assessment</p>
              <Pill tone={LEVEL_TONE[assessment.level]} icon={Shield}>{assessment.levelLabel}</Pill>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11.5px]">
            <div><p className="text-slate-500">Last reviewed</p><p className="font-semibold text-slate-800">{fmtDate(assessment.reviewedAt)}</p></div>
            <div><p className="text-slate-500">Reviewed by</p><p className="font-semibold text-slate-800">{assessment.reviewedByName}{assessment.reviewedByRole && <span className="block font-normal text-slate-500">{assessment.reviewedByRole}</span>}</p></div>
          </div>
          {(assessment.note || assessment.reason) && (
            <div className="rounded-xl bg-lavender-100/70 p-2.5 text-[11.5px] text-slate-700">
              <p className="mb-0.5 font-semibold text-royal-900">Internal Review Note</p>
              {assessment.note || assessment.reason}
            </div>
          )}
          {assessment.nextReviewAt && <p className="text-[11px] text-slate-500">Next review: {fmtDate(assessment.nextReviewAt)}</p>}
        </div>
      )}
    </Panel>
  )
}

export function RecommendedPathCard({ recommended, providerId, canAccountActions }) {
  const action = recommended.link
  return (
    <Panel title="Recommended Review Path" icon={ShieldCheck}>
      <div className={cn('rounded-xl border p-3', action ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50')}>
        <p className={cn('flex items-center gap-1.5 text-[13px] font-bold', action ? 'text-amber-800' : 'text-emerald-800')}>{action ? <TriangleAlert className="size-4" /> : <CircleCheck className="size-4" />}{recommended.title}</p>
        <p className="text-[11.5px] text-slate-600">{recommended.text}</p>
      </div>
      <div className="mt-2.5 space-y-2">
        {action && <Link to={action} className="flex items-center justify-center rounded-xl bg-royal-700 px-3 py-2 text-[12px] font-semibold text-white hover:bg-royal-800">{recommended.label} →</Link>}
        <Btn variant="outline" className="w-full" disabled>No Account Action</Btn>
      </div>
      <p className="mt-2.5 text-[11px] text-slate-500">If a confirmed serious issue requires action, use the Provider Account Actions workflow.</p>
      {canAccountActions && <Link to={`/providers/${providerId}/account`} className="mt-1 inline-block text-[11.5px] font-semibold text-royal-600 hover:underline">Go to Account Actions →</Link>}
    </Panel>
  )
}

export function DynamicUnitsCard({ dynamic }) {
  if (!dynamic) return null
  return (
    <Panel title={dynamic.category === 'spa' ? 'Spa Operations — Branch Performance' : 'Hotel Wellness Operations — Location Performance'}>
      <div className="mb-2 flex flex-wrap gap-2 text-[11.5px]">
        <Pill tone="purple">Staff-related complaints: {dynamic.staffComplaints}</Pill>
        {dynamic.category === 'spa' && <><Pill tone="purple">Unassigned booking rate: {dynamic.unassignedBookingRate}%</Pill><Pill tone="purple">Resource conflicts: {dynamic.resourceConflicts}</Pill></>}
        {dynamic.category === 'hotel' && <><Pill tone="purple">In-room issues: {dynamic.inRoomIssues}</Pill><Pill tone="purple">Concierge issues: {dynamic.conciergeIssues}</Pill><Pill tone="purple">Package redemption issues: {dynamic.packageIssues}</Pill></>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[12px]">
          <thead className="bg-lavender-50 text-[11px] text-slate-500"><tr>{[dynamic.unitLabel, 'Bookings', 'Completion', 'Cancellation', 'Provider cancellations', 'Conflicts'].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {dynamic.units.map((u) => (
              <tr key={u.name}><td className="px-3 py-2 font-semibold text-slate-800">{u.name}</td><td className="px-3 py-2">{u.bookings}</td><td className="px-3 py-2">{u.completionRate ?? '—'}%</td><td className="px-3 py-2">{u.cancellationRate ?? '—'}%</td><td className="px-3 py-2">{u.providerCancellations}</td><td className="px-3 py-2">{u.conflicts}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10.5px] text-slate-500">Issues in one {dynamic.unitLabel.toLowerCase()} are assessed there — they do not re-classify the whole business without the configured rules.</p>
    </Panel>
  )
}
