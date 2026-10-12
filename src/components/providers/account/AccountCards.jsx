import { useState } from 'react'
import { Link } from 'react-router'
import {
  BadgeCheck, Ban, Bell, CalendarCheck, CalendarX, CircleCheck, CircleX, Crown, EyeOff, FileQuestion, Info, Landmark, MessageSquareOff,
  NotebookPen, Pause, Play, Scale, ShieldAlert, ShieldCheck, Siren, TriangleAlert, Wallet, Wrench,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import PersonAvatar from '../../ui/PersonAvatar'
import { Btn, LinkAction, Panel, Pill, Row } from '../trust/TrustUI'
import { fmtDate, fmtDateTime, fmtMoney, humanize, inputCls } from '../trust/trustFormat'

const STATUS_STYLE = {
  green: { ring: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-700', Icon: CircleCheck },
  purple: { ring: 'bg-royal-50 text-royal-600', text: 'text-royal-700', Icon: ShieldAlert },
  red: { ring: 'bg-rose-50 text-rose-600', text: 'text-rose-700', Icon: CircleX },
}

export function AccountStatusPanel({ account }) {
  const s = STATUS_STYLE[account.tone] || STATUS_STYLE.green
  return (
    <Panel title="Account Status">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <div className="flex items-center gap-3">
            <span className={cn('flex size-12 items-center justify-center rounded-full', s.ring)}><s.Icon className="size-7" /></span>
            <span className={cn('text-[26px] font-bold', s.text)}>{account.label}</span>
          </div>
          <p className="mt-2 text-[12px] text-slate-600">{account.summary}</p>
          {account.suspension && (
            <div className="mt-3 divide-y divide-rose-100 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-1.5">
              <Row label="Suspended Since">{fmtDate(account.suspension.since)}</Row>
              <Row label="Suspended By">{account.suspension.by}</Row>
              <Row label="Reason">{account.suspension.reason}</Row>
              <Row label="Scope">{account.suspension.scope}</Row>
              <Row label="Duration">{account.suspension.duration || '—'}</Row>
              {account.suspension.caseId && <Row label="Related Case">{account.suspension.caseId}</Row>}
            </div>
          )}
        </div>
        <ul className="space-y-1.5">
          {account.access.map((a) => (
            <li key={a.key} className="flex items-center justify-between gap-2 text-[12px]">
              <span className="flex items-center gap-1.5 text-slate-700">{a.restricted ? <CircleX className="size-4 text-rose-500" /> : a.partial ? <TriangleAlert className="size-4 text-amber-500" /> : <CircleCheck className="size-4 text-emerald-600" />}{a.label}</span>
              <span className={cn('font-semibold', a.restricted ? 'text-rose-600' : a.partial ? 'text-amber-600' : 'text-emerald-600')}>{a.state}</span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-2 text-[12px]">
            <span className="flex items-center gap-1.5 text-slate-700">{account.activeRestrictionCount ? <TriangleAlert className="size-4 text-amber-500" /> : <CircleCheck className="size-4 text-emerald-600" />}Active Restrictions</span>
            <span className={cn('font-semibold', account.activeRestrictionCount ? 'text-amber-600' : 'text-emerald-600')}>{account.activeRestrictionCount || 'None'}</span>
          </li>
        </ul>
      </div>
    </Panel>
  )
}

function Tile({ icon: Icon, label, value, to, linkLabel, tone = 'purple' }) {
  const toneCls = { purple: 'bg-royal-50 text-royal-600', red: 'bg-rose-50 text-rose-600', amber: 'bg-amber-50 text-amber-600', green: 'bg-emerald-50 text-emerald-600' }[tone]
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border border-slate-200/80 p-2.5">
      <div className="flex items-center gap-2">
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', toneCls)}><Icon className="size-4" /></span>
        <div className="min-w-0">
          <p className="truncate text-[10.5px] text-slate-500">{label}</p>
          <p className="truncate text-[15px] font-bold text-royal-950">{value}</p>
        </div>
      </div>
      {to && <Link to={to} className="text-[11px] font-semibold text-royal-600 hover:underline">{linkLabel} →</Link>}
    </div>
  )
}

export function ReviewBeforeActionPanel({ review, providerId }) {
  const money = (v) => (review.financeLocked ? '••••' : fmtMoney(v, review.currency))
  return (
    <Panel title="Review Before Taking Action" icon={Info}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile icon={Siren} tone="red" label="Open Safety Cases" value={review.openSafetyCases} to="/safety" linkLabel="View Cases" />
        <Tile icon={Scale} tone="amber" label="Open Disputes" value={review.openDisputes} to="/disputes" linkLabel="View Disputes" />
        <Tile icon={CalendarCheck} label="Upcoming Bookings" value={review.upcomingBookings} to={`/providers/${providerId}/bookings`} linkLabel="View Bookings" />
        <Tile icon={Wallet} tone="amber" label="Pending Escrow" value={money(review.pendingEscrow)} />
        <Tile icon={Landmark} label="Pending Withdrawal" value={money(review.pendingWithdrawal)} />
        <Tile icon={BadgeCheck} tone="green" label="Verification" value={humanize(review.verification)} />
        <Tile icon={Crown} tone="purple" label="Subscription" value={review.subscription || '—'} to={`/providers/${providerId}/subscription`} linkLabel="View" />
      </div>
      {review.financeLocked && <p className="mt-2 text-[10.5px] text-slate-500">Financial amounts need Finance permission.</p>}
    </Panel>
  )
}

export function RecommendedReviewPanel({ recommended, providerId }) {
  if (!recommended) {
    return (
      <Panel title="Recommended Review" icon={ShieldCheck}>
        <p className="flex items-center gap-2 text-[12px] text-emerald-700"><CircleCheck className="size-4" />No open case is driving an account action.</p>
        <p className="mt-1 text-[11.5px] text-slate-500">Enforcement normally needs a reason grounded in a case or confirmed issue.</p>
        <LinkAction to={`/providers/${providerId}/risk`}>View Quality & Risk Review</LinkAction>
      </Panel>
    )
  }
  return (
    <Panel tone="amber" title={<span className="text-amber-800">Recommended Review</span>} icon={TriangleAlert}>
      <p className="text-[13px] font-bold text-slate-900">{recommended.title}</p>
      <div className="mt-1 divide-y divide-amber-100">
        <Row label="Case ID">{recommended.caseId}</Row>
        <Row label="Submitted">{fmtDate(recommended.submittedAt)}</Row>
        {recommended.bookingId && <Row label="Related Booking">#{recommended.bookingId}</Row>}
        <Row label="Category">{recommended.category}</Row>
        {recommended.currentRisk && <Row label="Current Risk"><span className="text-emerald-700">{recommended.currentRisk}</span></Row>}
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <Link to={recommended.link} className="inline-flex items-center justify-center rounded-xl border border-royal-300 bg-white px-2 py-2 text-[12px] font-semibold text-royal-700 hover:bg-royal-50">Review Case →</Link>
        <Link to={`/providers/${providerId}/risk`} className="inline-flex items-center justify-center rounded-xl border border-royal-300 bg-white px-2 py-2 text-[12px] font-semibold text-royal-700 hover:bg-royal-50">View Quality & Risk Review</Link>
      </div>
    </Panel>
  )
}

function ActionTile({ icon: Icon, tone, title, text, button, onClick, disabled }) {
  const toneCls = { purple: 'bg-royal-50 text-royal-600', amber: 'bg-amber-50 text-amber-600' }[tone]
  return (
    <div className="flex flex-col rounded-xl border border-slate-200/80 p-3">
      <div className="flex items-start gap-2">
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', toneCls)}><Icon className="size-5" /></span>
        <div><p className="text-[12.5px] font-bold text-slate-900">{title}</p><p className="text-[11px] text-slate-500">{text}</p></div>
      </div>
      <Btn variant="outline" className="mt-auto w-full translate-y-0 pt-2" disabled={disabled} onClick={onClick}>{button} →</Btn>
    </div>
  )
}

export function ReviewActionsPanel({ permitted, onAction }) {
  const can = (a) => permitted.includes(a)
  return (
    <Panel title="Account Review Actions" icon={NotebookPen}>
      <div className="grid gap-2 sm:grid-cols-3">
        <ActionTile icon={FileQuestion} tone="purple" title="Request Information" text="Ask the provider to submit missing or updated information." button="Send Request" disabled={!can('request_info')} onClick={() => onAction({ action: 'request_info' })} />
        <ActionTile icon={TriangleAlert} tone="amber" title="Issue Warning" text="Send a formal platform warning to the provider." button="Create Warning" disabled={!can('warn')} onClick={() => onAction({ action: 'warn' })} />
        {can('end_review')
          ? <ActionTile icon={ShieldCheck} tone="purple" title="Close Review" text="End the account review and return to normal standing." button="Close Review" onClick={() => onAction({ action: 'end_review' })} />
          : <ActionTile icon={ShieldAlert} tone="purple" title="Place Under Review" text="Mark the account as reviewed while keeping configured access rules." button="Start Review" disabled={!can('place_review')} onClick={() => onAction({ action: 'place_review' })} />}
      </div>
      <p className="mt-2 text-[10.5px] text-slate-500">“Under Review” does not suspend the provider.</p>
    </Panel>
  )
}

const RESTRICTION_ROWS = [
  ['new_bookings', CalendarX, 'Restrict New Bookings', 'Prevent the provider from accepting new bookings.'],
  ['messaging', MessageSquareOff, 'Restrict Messaging', 'Restrict provider-client messaging.'],
  ['public_visibility', EyeOff, 'Restrict Public Visibility', 'Hide or limit marketplace visibility.'],
  ['withdrawals', Ban, 'Restrict Withdrawals', 'Limit or hold withdrawals (Finance only).'],
  ['profile_changes', Wrench, 'Restrict Service Changes', 'Prevent unreviewed service/profile changes.'],
]

export function AccessRestrictionsPanel({ restrictions, permitted, permissions, onManage }) {
  const active = restrictions.filter((r) => r.status === 'active')
  return (
    <Panel title="Access Restrictions" icon={ShieldAlert}>
      <ul className="divide-y divide-slate-100">
        {RESTRICTION_ROWS.map(([kind, Icon, title, text]) => {
          const current = active.filter((r) => r.kind === kind)
          const financeOnly = kind === 'withdrawals' && !permissions.restrictWithdrawals
          const disabled = financeOnly || !permitted.includes('restrict')
          return (
            <li key={kind} className="flex items-center justify-between gap-2 py-2">
              <span className="flex min-w-0 items-start gap-2">
                <Icon className={cn('mt-0.5 size-4 shrink-0', current.length ? 'text-rose-500' : 'text-royal-500')} />
                <span className="min-w-0"><span className="block text-[12px] font-semibold text-slate-800">{title}{current.length > 0 && <Pill tone="amber" className="ml-1.5">Active</Pill>}</span><span className="text-[11px] text-slate-500">{financeOnly ? 'Requires Finance/Security permission.' : text}</span></span>
              </span>
              <Btn variant="outline" className="shrink-0 px-2.5 py-1 text-[11.5px]" disabled={disabled && !current.length} onClick={() => onManage(kind, current)}>Manage →</Btn>
            </li>
          )
        })}
      </ul>
      <p className="mt-1 text-[10.5px] text-slate-500">Prefer the smallest restriction that addresses the issue before full suspension.</p>
    </Panel>
  )
}

export function HighImpactPanel({ status, permitted, onAction }) {
  const can = (a) => permitted.includes(a)
  const row = (Icon, tone, title, text, button, variant, action, show = true) => show && (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="flex items-start gap-2.5">
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full text-white', tone)}><Icon className="size-4.5" /></span>
        <span><span className="block text-[12.5px] font-bold text-slate-900">{title}</span><span className="text-[11px] text-slate-500">{text}</span></span>
      </span>
      <Btn variant={variant} className="shrink-0 px-3 py-1.5" disabled={!can(action)} onClick={() => onAction({ action })}>{button} →</Btn>
    </li>
  )
  return (
    <Panel tone="red" title={<span className="text-rose-700">High-Impact Account Actions</span>} icon={Siren}>
      <ul className="divide-y divide-rose-100">
        {row(Pause, 'bg-rose-600', 'Suspend Provider', 'Temporarily disable selected or all provider access.', 'Suspend Account', 'danger', 'suspend', status !== 'suspended' && status !== 'deactivated')}
        {row(Play, 'bg-emerald-600', 'Reactivate Provider', 'Restore provider access after suspension.', 'Reactivate', 'success', 'reactivate', status === 'suspended' || status === 'deactivated')}
        {row(CircleX, 'bg-rose-700', 'Deactivate Provider', 'Disable the provider account (history preserved).', 'Deactivate', 'danger', 'deactivate', status !== 'deactivated')}
      </ul>
      <p className="mt-1 text-[10.5px] text-slate-500">High-impact actions require a reason, an impact review and session re-verification. There is no delete.</p>
    </Panel>
  )
}

export function CurrentRestrictionsPanel({ restrictions, canLift, onLift }) {
  const active = restrictions.filter((r) => r.status === 'active')
  return (
    <Panel title="Current Restrictions" icon={Ban}>
      {active.length === 0 ? (
        <p className="flex items-center gap-2 text-[12px] text-emerald-700"><CircleCheck className="size-4" />No Active Restrictions</p>
      ) : (
        <ul className="space-y-2">
          {active.map((r) => (
            <li key={r.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-2.5 text-[12px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900">{r.label} Restriction{r.scopeTarget?.type !== 'account' && <span className="font-normal text-slate-500"> — {r.scopeTarget.name}</span>}</span>
                <Pill tone="amber" dot>Active</Pill>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-x-3 text-[11px] text-slate-600">
                <span>Started: {fmtDate(r.startedAt)}</span>
                <span>Expires: {r.expiresAt ? fmtDate(r.expiresAt) : 'Until review'}</span>
                <span>Reason: {r.reasonLabel}</span>
                <span>Applied by: {r.appliedByName}</span>
              </div>
              {canLift && <button type="button" onClick={() => onLift(r)} className="mt-1 text-[11.5px] font-semibold text-royal-600 hover:underline">Manage Restriction →</button>}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

const HISTORY_TONE = { active: 'amber', completed: 'green' }
export function ActionHistoryPanel({ history }) {
  const [all, setAll] = useState(false)
  const rows = all ? history : history.slice(0, 5)
  return (
    <Panel title="Account Action History" action={history.length > 5 && <LinkAction onClick={() => setAll((v) => !v)}>{all ? 'Show Less' : 'View All'}</LinkAction>} bodyClass="px-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[11.5px]">
          <thead className="border-y border-slate-100 bg-lavender-50 text-[10.5px] font-semibold text-slate-500"><tr>{['Date', 'Action', 'Scope', 'Reason', 'Admin', 'Status'].map((h) => <th key={h} className="px-3 py-2 first:pl-4">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-5 text-center text-slate-500">No account actions yet.</td></tr>}
            {rows.map((h) => (
              <tr key={h.id} title={h.caseId ? `Related case ${h.caseId}` : undefined}>
                <td className="px-3 py-2 pl-4 whitespace-nowrap text-slate-600">{fmtDate(h.at)}</td>
                <td className="px-3 py-2 font-semibold text-slate-800">{h.label}</td>
                <td className="px-3 py-2 text-slate-600">{h.scope}</td>
                <td className="px-3 py-2 text-slate-600">{h.reasonLabel || '—'}</td>
                <td className="px-3 py-2 text-slate-600">{h.adminName || '—'}</td>
                <td className="px-3 py-2"><Pill tone={HISTORY_TONE[h.status] || 'grey'} dot>{humanize(h.status)}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

export function NotificationHistoryPanel({ notifications }) {
  const [open, setOpen] = useState(null)
  return (
    <Panel title="Provider Notification History" icon={Bell} bodyClass="px-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] text-left text-[11.5px]">
          <thead className="border-y border-slate-100 bg-lavender-50 text-[10.5px] font-semibold text-slate-500"><tr>{['Date', 'Notification', 'Channel', 'Status'].map((h) => <th key={h} className="px-3 py-2 first:pl-4">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {notifications.length === 0 && <tr><td colSpan={4} className="px-4 py-5 text-center text-slate-500">No account notifications.</td></tr>}
            {notifications.slice(0, 6).map((n) => (
              <tr key={n.id} className={n.body ? 'cursor-pointer hover:bg-royal-50/40' : undefined} onClick={() => n.body && setOpen(open === n.id ? null : n.id)}>
                <td className="px-3 py-2 pl-4 whitespace-nowrap text-slate-600">{fmtDate(n.at)}</td>
                <td className="px-3 py-2 font-semibold text-slate-800">{n.title}{open === n.id && <span className="mt-1 block font-normal text-slate-600">“{n.body}”</span>}</td>
                <td className="px-3 py-2 text-slate-600">{n.channels.map((c) => (c === 'in_app' ? 'In-App' : humanize(c))).join(' + ')}</td>
                <td className="px-3 py-2"><Pill tone={n.status === 'delivered' ? 'green' : n.status === 'failed' ? 'red' : 'purple'} dot>{humanize(n.status)}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 pt-2 text-[10.5px] text-slate-500">Click a row to see exactly what the provider was told.</p>
    </Panel>
  )
}

export function NotesPanel({ notes, onAdd }) {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true)
    try {
      await onAdd(text)
      setText('')
      setAdding(false)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Panel title="Notes & Internal Comments" action={<LinkAction onClick={() => setAdding((v) => !v)}>Add Note</LinkAction>}>
      {adding && (
        <div className="mb-3 space-y-2">
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} className={inputCls} placeholder="Internal only — never shown to the provider" />
          <div className="flex justify-end gap-2"><Btn variant="ghost" className="py-1.5" onClick={() => setAdding(false)}>Cancel</Btn><Btn className="py-1.5" disabled={busy || text.trim().length < 3} onClick={save}>{busy ? 'Saving…' : 'Save Note'}</Btn></div>
        </div>
      )}
      {notes.length === 0 ? <p className="text-[12px] text-slate-500">No internal notes.</p> : (
        <ul className="space-y-3">
          {notes.slice(0, 4).map((n) => (
            <li key={n.id} className="flex gap-2.5">
              <PersonAvatar name={n.author} size={30} />
              <div className="min-w-0 text-[11.5px]"><p><span className="font-semibold text-slate-800">{n.author}</span> <span className="text-slate-500">{fmtDateTime(n.at)}</span></p><p className="text-slate-600">{n.text}</p></div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function AssessmentSummaryPanel({ assessment, providerId }) {
  const tone = { low: 'green', medium: 'amber', high: 'red' }
  return (
    <Panel title="Admin Assessment" icon={ShieldCheck}>
      {!assessment ? <p className="text-[12px] text-slate-500">No assessment recorded.</p> : (
        <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="text-[11.5px]">
            <p className="text-slate-500">Current Assessment</p>
            <Pill tone={tone[assessment.level]} icon={ShieldCheck} className="my-1 text-[13px]">{assessment.levelLabel}</Pill>
            <p className="text-slate-500">Last reviewed: {fmtDate(assessment.reviewedAt)}</p>
            <p className="text-slate-500">Reviewed by: {assessment.reviewedByName}</p>
            {assessment.nextReviewAt && <p className="text-slate-500">Next review: {fmtDate(assessment.nextReviewAt)}</p>}
          </div>
          <div className="rounded-xl bg-lavender-100/70 p-2.5 text-[11.5px] text-slate-700"><p className="font-semibold text-royal-900">Internal Review Note</p>{assessment.note || assessment.reason}</div>
          <Link to={`/providers/${providerId}/risk`} className="inline-flex items-center justify-center rounded-xl border border-royal-300 px-3 py-2 text-[12px] font-semibold text-royal-700 hover:bg-royal-50">Update Assessment →</Link>
        </div>
      )}
    </Panel>
  )
}

export function NextActionPanel({ recommended }) {
  return (
    <Panel title="Recommended Next Action" icon={ShieldCheck} className="border-emerald-200">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-[13px] font-bold text-slate-900">{recommended ? `Review ${recommended.title.replace(' Under Review', '')}` : 'No account action needed'}</p>
          <p className="text-[11.5px] text-slate-500">{recommended ? 'One unresolved case requires assessment before any enforcement.' : 'No open case requires enforcement.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {recommended && <Link to={recommended.link} className="inline-flex items-center justify-center rounded-xl bg-royal-700 px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-royal-800">Review Case →</Link>}
          <span className="inline-flex items-center justify-center rounded-xl border border-royal-300 px-3.5 py-2 text-[12px] font-semibold text-royal-700">No Account Action</span>
        </div>
      </div>
    </Panel>
  )
}
