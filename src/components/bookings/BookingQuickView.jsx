import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ChevronDown, CircleAlert, CircleCheck, CircleMinus, CircleX, Eye, MapPin, ShieldAlert, Star, X } from 'lucide-react'
import Dropdown from '../ui/Dropdown'
import PersonAvatar from '../ui/PersonAvatar'
import Skeleton from '../ui/Skeleton'
import { useBookingQuickView } from '../../hooks/useBookingOps'
import { bookingOpsService } from '../../services/bookingOpsService'
import {
  ACCOUNT,
  ASSIGNMENT,
  BOOKING_STATUS,
  CANCELLED_BY,
  CONFIRMATION,
  CONTACT,
  FUNDS,
  LIFECYCLE,
  OPERATIONAL,
  PAYMENT,
  POST_SERVICE,
  READINESS,
  REFUND,
  RESOLUTION,
  SETTLEMENT,
  SOURCE_LABELS,
} from '../../constants/bookingOps'
import { formatFullStamp, formatStamp, formatTime, timeZoneFor } from '../../lib/profileFormat'
import { cn } from '../../lib/utils'
import { BusinessAvatar, MarketCell, StatePill, money } from './OpsUI'

const LINK = 'inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#4527c8] hover:underline'
const mins = (n) => (n == null ? '—' : n < 60 ? `${n} minutes` : `${Math.floor(n / 60)} hr${n % 60 ? ` ${n % 60} min` : ''}`)
const short = (n) => (n == null ? '' : n < 60 ? `${n} min` : `${Math.floor(n / 60)} hr${n % 60 ? ` ${n % 60} min` : ''}`)
const ACTOR = { client: 'Client', provider: 'Provider', admin: 'Admin', system: 'System workflow' }
const CHECK_TITLE = { active: 'Operational Check', upcoming: 'Readiness Check', ongoing: 'Live Service Health', cancelled: 'Resolution Check', guest: 'Booking Check' }
const CHECK_ICON = { ok: [CircleCheck, 'fill-[#22a652] text-white'], warn: [CircleAlert, 'fill-[#f08a24] text-white'], bad: [CircleX, 'fill-[#e03a3a] text-white'], neutral: [CircleMinus, 'text-[#9aa0b4]'] }
const OVERALL = {
  ok: ['border-[#bfe8cc] bg-[#ecfaf1] text-[#15803d]', CircleCheck, 'No action required at this time.', 'fill-[#22a652] text-white'],
  warn: ['border-[#fbd9b4] bg-[#fff6ec] text-[#b45309]', CircleAlert, 'Review recommended.', 'fill-[#f08a24] text-white'],
  bad: ['border-[#f5c6c6] bg-[#fdf0f0] text-[#b91c1c]', CircleX, 'Admin intervention may be required.', 'fill-[#e03a3a] text-white'],
}
const TABS = ['Overview', 'Timeline', 'Payments', 'Assignment', 'More']

function Section({ title, action, children, tone }) {
  return (
    <section className={cn('overflow-hidden rounded-xl border', tone === 'alert' ? 'border-[#f5c6c6]' : 'border-[#ebe7f6]')}>
      <div className={cn('flex items-center justify-between gap-2 px-3 py-1.5', tone === 'alert' ? 'bg-[#fdf0f0]' : 'bg-[#f4f1fc]')}>
        <h3 className={cn('text-[12.5px] font-bold', tone === 'alert' ? 'text-[#b91c1c]' : 'text-[#1b1140]')}>{title}</h3>
        {action}
      </div>
      <div className="px-3 py-2">{children}</div>
    </section>
  )
}

function Row({ label, children, sub }) {
  return (
    <li className="grid grid-cols-[108px_1fr] gap-2 py-[4px] text-[12px]">
      <span className="text-[#4a4466]">{label}</span>
      <span className="min-w-0 font-medium text-[#1b1140]">
        {children}
        {sub && <span className="block text-[11px] font-normal text-[#6b6785]">{sub}</span>}
      </span>
    </li>
  )
}

function Checks({ title, checks, overall }) {
  if (!checks?.length && !overall) return null
  const [box, Icon, sub, iconCls] = overall ? OVERALL[overall.tone] : []
  return (
    <Section title={title}>
      <ul className="space-y-0.5">
        {checks.map((c) => {
          const [CIcon, color] = CHECK_ICON[c.state] || CHECK_ICON.neutral
          return (
            <li key={c.label} className="grid grid-cols-[18px_1fr_auto] items-center gap-2 py-[3px] text-[12px]">
              <CIcon className={cn('size-[17px]', color)} aria-hidden="true" />
              <span className="text-[#2a1b57]">{c.label}</span>
              <span className="font-medium text-[#1b1140]">{c.value}</span>
            </li>
          )
        })}
      </ul>
      {overall && (
        <div className={cn('mt-2 flex items-center gap-2.5 rounded-lg border px-3 py-2', box)}>
          <Icon className={cn('size-7 shrink-0', iconCls)} aria-hidden="true" />
          <div>
            <p className="text-[12.5px] font-bold">{overall.label}</p>
            <p className="text-[11px] opacity-80">{sub}</p>
          </div>
        </div>
      )}
    </Section>
  )
}

function headline(q) {
  if (q.view === 'completed') return <><StatePill map={BOOKING_STATUS} value="completed" />{q.postService && q.postService !== 'complete' && <StatePill map={POST_SERVICE} value={q.postService} />}</>
  if (q.view === 'cancelled') return <><StatePill map={BOOKING_STATUS} value="cancelled" /><StatePill map={RESOLUTION} value={q.resolution} /></>
  if (q.view === 'guest') return <><StatePill map={LIFECYCLE} value={q.guestInfo?.lifecycle} /><StatePill map={ACCOUNT} value={q.guestInfo?.account} /></>
  if (q.view === 'upcoming') return <StatePill map={READINESS} value={q.readiness} />
  return <StatePill map={OPERATIONAL} value={q.operational} />
}

function PeopleCards({ q, linkState }) {
  const clientId = q.guestInfo ? q.guestInfo.linkedClientId : q.client.id
  const business = q.category !== 'individual'
  return (
    <>
      <Section title={q.view === 'guest' ? 'Guest' : 'Client'} action={clientId && <Link to={`/clients/${clientId}`} state={linkState} className={LINK}>View Client <ArrowRight className="size-3" /></Link>}>
        <div className="flex items-center gap-2.5 py-1">
          <PersonAvatar name={q.guestInfo?.name || q.client.name} size={40} />
          <div className="min-w-0 text-[12px] leading-snug">
            <p className="font-bold text-[#1b1140]">{q.guestInfo?.name || q.client.name}</p>
            <p className="text-[#6b6785]">{q.guestInfo ? 'Guest checkout' : q.client.guest ? 'Guest' : 'Registered client'}</p>
          </div>
        </div>
      </Section>
      <Section title="Provider" action={q.provider.id && <Link to={`/providers/${q.provider.id}`} state={linkState} className={LINK}>View Provider <ArrowRight className="size-3" /></Link>}>
        <div className="flex items-center gap-2.5 py-1">
          {business ? <BusinessAvatar name={q.provider.name} size={40} /> : <PersonAvatar name={q.provider.name} size={40} />}
          <div className="min-w-0 flex-1 text-[12px] leading-snug">
            <p className="font-bold text-[#1b1140]">{q.provider.name}</p>
            <p className="text-[#6b6785]">{q.branch || q.provider.typeLabel}</p>
            {q.provider.rating != null && (
              <p className="flex items-center gap-1 text-[#1b1140]"><Star className="size-3.5 fill-[#d9b26a] text-[#d9b26a]" aria-hidden="true" />{q.provider.rating}{q.provider.reviews != null && <span className="text-[#6b6785]">({q.provider.reviews} reviews)</span>}</p>
            )}
          </div>
          {!q.checks?.some((c) => c.label === 'Provider' && c.state === 'bad') && <StatePill map={{ active: ['Active', 'green'] }} value="active" />}
        </div>
      </Section>
    </>
  )
}

function BookingInfo({ q, tz }) {
  return (
    <Section title="Booking Information">
      <ul>
        <Row label="Service">{q.service}{q.durationMins ? ` (${short(q.durationMins)})` : ''}</Row>
        <Row label="Scheduled">{q.scheduledStart ? `${formatStamp(q.scheduledStart, q.bookedAt || new Date().toISOString(), tz).split(' • ')[0]}, ${formatTime(q.scheduledStart, tz)} – ${formatTime(q.scheduledEnd, tz)}` : '—'}</Row>
        {q.serviceStartedAt && <Row label="Actual start" sub={q.serviceStartedBy ? `by ${q.serviceStartedBy}` : null}>{formatTime(q.serviceStartedAt, tz)}</Row>}
        {q.view === 'ongoing' && <Row label="Elapsed">{mins(q.elapsedMins)}</Row>}
        {q.view === 'ongoing' && q.expectedEnd && (
          <Row label="Expected end">
            {formatTime(q.expectedEnd, tz)}{' '}
            {q.overByMins != null ? <span className="text-[#c2570c]">(over by {short(q.overByMins)})</span> : q.remainingMins != null && <span className="text-[#6b6785]">(in {short(q.remainingMins)})</span>}
          </Row>
        )}
        {q.view === 'completed' && <Row label="Completed at">{q.completedAt ? formatFullStamp(q.completedAt, tz) : '—'}</Row>}
        <Row label="Location"><span className="inline-flex items-start gap-1"><MapPin className="mt-0.5 size-3.5 shrink-0 fill-[#4527c8] text-white" aria-hidden="true" />{q.location?.label || q.location?.city || '—'}</span></Row>
        <Row label="Market"><MarketCell code={q.countryCode} name={q.marketName} /></Row>
        <Row label="Booking source">{SOURCE_LABELS[q.source] || q.source}</Row>
        {q.bookedAt && <Row label="Booking date">{formatFullStamp(q.bookedAt, tz)}</Row>}
      </ul>
    </Section>
  )
}

function PaymentInfo({ q, tz }) {
  const p = q.paymentInfo || { amount: q.amount, status: q.payment, method: q.paymentMethod, transactionId: q.transactionId }
  return (
    <Section title="Payment Information" action={q.related?.paymentId && <Link to={`/payments/${q.related.paymentId}`} className={LINK}>View Payment <ArrowRight className="size-3" /></Link>}>
      <ul>
        {p.amount != null && <Row label="Amount"><span className="font-bold">{money(p.amount, q.currency)}</span></Row>}
        <Row label="Payment status"><StatePill map={PAYMENT} value={p.status} /></Row>
        {p.method && <Row label="Payment method">{p.method}</Row>}
        {p.transactionId && <Row label="Transaction ID"><span className="text-[#4527c8]">{p.transactionId}</span></Row>}
      </ul>
      {q.funds && (
        <ul className="mt-1 border-t border-[#efecf7] pt-1">
          <Row label="Funds status"><StatePill map={FUNDS} value={q.funds.status} /></Row>
          {q.funds.releasedAt && <Row label="Released at">{formatFullStamp(q.funds.releasedAt, tz)}</Row>}
        </ul>
      )}
    </Section>
  )
}

function AssignmentInfo({ q, tz }) {
  const hotel = q.category === 'hotel'
  return (
    <>
      <Section title="Assignment Information">
        <ul>
          <Row label="Assignment"><StatePill map={ASSIGNMENT} value={q.assignment} /></Row>
          <Row label="Assigned to">{q.assignedTo || <span className="text-[#c2570c]">Not assigned</span>}</Row>
          <Row label="Resource / Room">{q.resources?.length ? q.resources.join(', ') : 'Not required'}</Row>
          {q.staffCheckInAt && <Row label="Staff check-in"><span className="text-[#15803d]">{formatTime(q.staffCheckInAt, tz)} ✓</span></Row>}
        </ul>
      </Section>
      {q.category !== 'individual' && (
        <Section title={hotel ? 'Hotel & Resort' : 'Spa & Branch'}>
          <ul>
            <Row label={hotel ? 'Hotel / Resort' : 'Spa'}>{q.provider.name}</Row>
            <Row label={hotel ? 'Wellness location' : 'Branch'}>{q.branch || '—'}</Row>
            {q.location?.mode && <Row label="Service mode">{q.location.mode}</Row>}
          </ul>
          <p className="mt-1 text-[11px] text-[#6b6785]">Assignment history is preserved in the Booking Timeline.</p>
        </Section>
      )}
    </>
  )
}

// ADM-048 overview block.
function CompletionBlock({ q, tz }) {
  const c = q.completion
  return (
    <>
      <Section title="Service Completion">
        <ul>
          <Row label="Provider">{c.providerCompleted ? <span className="text-[#15803d]">✓ Completed</span> : 'Not recorded'}</Row>
          {c.providerCompletedAt && <Row label="Provider done at">{formatTime(c.providerCompletedAt, tz)}</Row>}
          <Row label="Client">{c.clientConfirmed ? <span className="text-[#15803d]">✓ Service received</span> : <span className="text-[#c2570c]">Awaiting confirmation</span>}</Row>
          {c.clientConfirmedAt && <Row label="Client confirmed">{formatTime(c.clientConfirmedAt, tz)}</Row>}
          <Row label="Completed by">{ACTOR[c.completedBy] || <span className="text-[#c2570c]">Not recorded</span>}</Row>
          <Row label="Completion"><StatePill map={CONFIRMATION} value={c.clientConfirmed ? 'confirmed' : 'pending'} /></Row>
        </ul>
      </Section>
      <Section title="Review" action={q.review.id && <Link to="/reviews" className={LINK}>View Review <ArrowRight className="size-3" /></Link>}>
        {q.review.reviewed ? (
          <div className="space-y-0.5 py-1 text-[12px]">
            <p className="flex items-center gap-1 font-semibold text-[#1b1140]"><Star className="size-4 fill-[#d9b26a] text-[#d9b26a]" aria-hidden="true" />{q.review.rating ?? '—'}</p>
            {q.review.comment && <p className="text-[#2a1b57] italic">“{q.review.comment}”</p>}
            <p className="text-[#6b6785]">Status: {q.review.status ? q.review.status.charAt(0).toUpperCase() + q.review.status.slice(1) : 'Published'}</p>
          </div>
        ) : (
          <p className="py-1 text-[12px] text-[#6b6785]">Not reviewed. Reviews never affect whether the service counts as completed.</p>
        )}
      </Section>
    </>
  )
}

function PostServiceIssues({ q }) {
  const items = [
    q.issues.includes('refund_requested') && { label: 'Refund Requested', tone: 'red', to: q.related?.refundId ? `/refunds/${q.related.refundId}` : '/refunds' },
    ...(q.related?.disputes || []).map((d) => ({ label: `Dispute ${d.id}`, tone: 'red', to: `/disputes/${d.id}` })),
    q.issues.includes('chargeback') && { label: 'Chargeback / Payment Issue', tone: 'red', to: q.related?.paymentId ? `/payments/${q.related.paymentId}` : '/payments' },
    ...(q.related?.tickets || []).map((t) => ({ label: `Support ${t.id}`, tone: 'orange', to: `/support/${t.id}` })),
    q.issues.includes('safety_report') && { label: 'Safety Report', tone: 'red', to: '/safety' },
    q.issues.includes('review_reported') && { label: 'Review Reported', tone: 'orange', to: '/reviews' },
    q.settlement === 'on_hold' && { label: 'Payment Held', tone: 'purple', to: q.related?.paymentId ? `/payments/${q.related.paymentId}` : '/payments' },
  ].filter(Boolean)
  if (!items.length) return null
  return (
    <Section title="Post-Service Issues" tone="alert">
      <ul className="space-y-1.5 py-0.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center justify-between gap-2 text-[12px]">
            <span className={cn('font-semibold', it.tone === 'red' ? 'text-[#b91c1c]' : it.tone === 'purple' ? 'text-[#4527c8]' : 'text-[#b45309]')}>{it.label}</span>
            <Link to={it.to} className={LINK}>Open <ArrowRight className="size-3" /></Link>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function SettlementInfo({ q, tz }) {
  if (!q.settlementInfo) return null
  const s = q.settlementInfo
  return (
    <Section title="Settlement / Provider Payout">
      <ul>
        {s.providerAmount != null && <Row label="Provider amount">{money(s.providerAmount, q.currency)}</Row>}
        {s.platformFee != null && <Row label="Platform fee">{money(s.platformFee, q.currency)}</Row>}
        <Row label="Settlement"><StatePill map={SETTLEMENT} value={s.status} /></Row>
        {s.settledAt && <Row label="Settlement date">{formatFullStamp(s.settledAt, tz).split(' • ')[0]}</Row>}
      </ul>
      <p className="mt-1 text-[11px] text-[#6b6785]">Payment, funds and settlement statuses are tracked separately.</p>
    </Section>
  )
}

// ADM-049 blocks.
function CancellationBlock({ q, tz }) {
  const c = q.cancellation
  return (
    <Section title="Cancellation">
      <ul>
        <Row label="Cancelled at">{c.at ? formatFullStamp(c.at, tz) : '—'}</Row>
        <Row label="Cancelled by"><StatePill map={CANCELLED_BY} value={c.by} /></Row>
        <Row label="Reason">{c.reason || 'Not recorded'}</Row>
        {c.leadMins != null && <Row label="Notice given">{c.leadMins < 0 ? 'After scheduled start' : `${mins(c.leadMins)} before service`}</Row>}
        {c.fee != null && <Row label="Cancellation fee">{money(c.fee, q.currency)}</Row>}
      </ul>
    </Section>
  )
}

function RefundBlock({ q, tz }) {
  const r = q.refundInfo
  return (
    <Section title="Refund Information" action={r.id && <Link to={`/refunds/${r.id}`} className={LINK}>Open Refund <ArrowRight className="size-3" /></Link>}>
      <ul>
        <Row label="Eligibility">{{ eligible: '✓ Eligible', not_eligible: 'Not eligible', partial: 'Partially eligible', per_policy: 'Per policy' }[r.eligibility] || r.eligibility}</Row>
        {r.amount != null && <Row label="Refund amount">{money(r.amount, q.currency)}</Row>}
        <Row label="Refund status"><StatePill map={REFUND} value={r.status} /></Row>
        {r.requestedAt && <Row label="Requested at">{formatFullStamp(r.requestedAt, tz)}</Row>}
        {r.reason && <Row label="Refund reason">{r.reason}</Row>}
      </ul>
    </Section>
  )
}

function PolicyBlock({ q }) {
  return (
    <Section title="Cancellation Policy">
      {q.policy ? (
        <ul>
          <Row label="Policy applied">{q.policy.name || '—'}</Row>
          {q.policy.window && <Row label="Window">{q.policy.window}</Row>}
          {q.policy.clientFee != null && <Row label="Client fee">{q.policy.clientFee > 0 ? `${q.policy.clientFee}%` : money(0, q.currency)}</Row>}
          {q.policy.providerPenalty && <Row label="Provider penalty">{q.policy.providerPenalty}</Row>}
        </ul>
      ) : (
        <p className="py-1 text-[12px] text-[#6b6785]">No policy snapshot was recorded at cancellation time. Outcomes are not recalculated from the current policy.</p>
      )}
    </Section>
  )
}

// ADM-050 blocks. Contact details stay masked unless an authorised admin
// reveals them; every reveal is audited server-side.
function GuestBlock({ q }) {
  const g = q.guestInfo
  const [revealed, setRevealed] = useState(null)
  const [revealing, setRevealing] = useState(false)
  const [revealError, setRevealError] = useState(null)
  const reveal = async () => {
    setRevealing(true)
    setRevealError(null)
    try {
      setRevealed(await bookingOpsService.revealGuestContact(q.id))
    } catch (err) {
      setRevealError(err?.message || 'Unable to reveal contact details.')
    } finally {
      setRevealing(false)
    }
  }
  const phone = revealed?.phone ?? g.phone
  const email = revealed?.email ?? g.email
  return (
    <>
      <Section
        title="Guest Identity & Contact"
        action={g.canReveal && !revealed && (phone || email) && (
          <button type="button" onClick={reveal} disabled={revealing} className={cn(LINK, 'disabled:opacity-50')}>
            <Eye className="size-3.5" aria-hidden="true" /> {revealing ? 'Revealing…' : 'Reveal'}
          </button>
        )}
      >
        <ul>
          <Row label="Phone" sub={phone ? (g.phoneVerified ? '✓ Verified' : 'Not verified') : null}>{phone || '—'}</Row>
          <Row label="Email" sub={email ? (g.emailVerified ? '✓ Verified' : 'Not verified') : null}>{email || '—'}</Row>
          <Row label="Verification"><StatePill map={CONTACT} value={g.contact} /></Row>
          {g.countryCode && <Row label="Country"><MarketCell code={g.countryCode} name={q.marketName} /></Row>}
        </ul>
        {revealed && <p className="mt-1 text-[11px] text-[#6b6785]">Revealed for this session and recorded in the audit log.</p>}
        {revealError && <p role="alert" className="mt-1 text-[11px] text-[#b91c1c]">{revealError}</p>}
      </Section>
      <Section title="Account Status">
        <ul>
          <Row label="Account"><StatePill map={ACCOUNT} value={g.account} /></Row>
          {g.linkedClientId && <Row label="Client ID">{g.linkedClientId}</Row>}
        </ul>
        {g.account === 'link_conflict' && (
          <div className="mt-1.5 rounded-lg bg-[#fdecec] p-2 text-[12px] text-[#7f1d1d]">
            <p className="font-semibold">Account link conflict</p>
            <p>{g.conflictReason || 'This contact may already belong to another account.'}</p>
            <p className="mt-1 text-[11px]">Accounts are never merged automatically. Review the link from Booking Details.</p>
          </div>
        )}
        {g.account === 'not_registered' && <p className="mt-1 text-[11px] text-[#6b6785]">A guest booking is fully valid without an account.</p>}
      </Section>
    </>
  )
}

function Timeline({ items, tz, title = 'Timeline' }) {
  if (!items?.length) return <p className="px-1 py-4 text-center text-[12px] text-[#6b6785]">No lifecycle events recorded yet.</p>
  return (
    <Section title={title}>
      <ol className="relative space-y-2.5 py-1 pl-4 before:absolute before:top-1.5 before:bottom-1.5 before:left-[5px] before:w-0.5 before:bg-[#e4defb]">
        {items.map((t, i) => (
          <li key={t.event + i} className="relative text-[12px]">
            <span className="absolute top-1 -left-4 size-3 rounded-full border-2 border-white bg-[#6d3fe0] shadow" aria-hidden="true" />
            <p className="font-medium text-[#1b1140]">{t.event}</p>
            {t.at && <p className="text-[11px] text-[#6b6785]">{formatFullStamp(t.at, tz)}</p>}
          </li>
        ))}
      </ol>
    </Section>
  )
}

function OverviewTab({ q, tz, linkState }) {
  return (
    <>
      <PeopleCards q={q} linkState={linkState} />
      <BookingInfo q={q} tz={tz} />
      {q.view === 'completed' && q.completion ? (
        <>
          <CompletionBlock q={q} tz={tz} />
          <PostServiceIssues q={q} />
        </>
      ) : q.view === 'cancelled' && q.cancellation ? (
        <>
          <CancellationBlock q={q} tz={tz} />
          <Checks title={CHECK_TITLE.cancelled} checks={q.checks} overall={q.overall} />
        </>
      ) : q.view === 'guest' && q.guestInfo ? (
        <>
          <GuestBlock q={q} />
          <Checks title={CHECK_TITLE.guest} checks={q.checks} overall={q.overall} />
        </>
      ) : (
        <>
          <PaymentInfo q={q} tz={tz} />
          <Checks title={CHECK_TITLE[q.view] || CHECK_TITLE.active} checks={q.checks} overall={q.overall} />
        </>
      )}
    </>
  )
}

function MoreTab({ q, tz, linkState }) {
  const g = q.guestInfo
  const cases = [...(q.related?.disputes || []).map((d) => ({ ...d, kind: 'Dispute', to: `/disputes/${d.id}`, text: d.reason })), ...(q.related?.tickets || []).map((t) => ({ ...t, kind: 'Support', to: `/support/${t.id}`, text: t.subject }))]
  return (
    <>
      <Section title="Linked Cases">
        {cases.length ? (
          <ul className="space-y-1 py-1 text-[12px]">
            {cases.map((c) => <li key={c.kind + c.id}><Link to={c.to} state={linkState} className={LINK}>{c.kind} {c.id}</Link> <span className="text-[#4a4466]">— {c.text || 'Open'} ({c.status || 'open'})</span></li>)}
          </ul>
        ) : (
          <p className="py-1 text-[12px] text-[#6b6785]">No disputes or support cases linked to this booking.</p>
        )}
      </Section>
      {q.providerRisk?.reviewRecommended && (
        <Section title="Provider Cancellation Risk" tone="alert" action={q.provider.id && <Link to={`/providers/${q.provider.id}/risk`} className={LINK}>Open Risk Review <ArrowRight className="size-3" /></Link>}>
          <p className="flex items-start gap-1.5 py-1 text-[12px] text-[#1b1140]">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#b91c1c]" aria-hidden="true" />
            {q.providerRisk.cancellations} cancelled bookings on record for this provider. Quality review recommended — this never suspends a provider automatically.
          </p>
        </Section>
      )}
      {g && (
        <Section title="Original Guest Snapshot">
          <ul>
            <Row label="Name at booking">{g.snapshot.name}</Row>
            <Row label="Phone at booking">{g.phone || '—'}</Row>
            <Row label="Email at booking">{g.email || '—'}</Row>
            {g.snapshot.createdAt && <Row label="Booked at">{formatFullStamp(g.snapshot.createdAt, tz)}</Row>}
            <Row label="Booking source">{SOURCE_LABELS[g.snapshot.source] || g.snapshot.source}</Row>
            {g.channels?.length > 0 && <Row label="Communication">{g.channels.join(', ')}</Row>}
          </ul>
        </Section>
      )}
    </>
  )
}

export default function BookingQuickView({ bookingId, view, fallback, onClose, onOpenFull, linkState }) {
  const { data: q, error, loading, refetch } = useBookingQuickView(bookingId, view)
  const [tab, setTab] = useState('Overview')
  const tz = timeZoneFor((q || fallback)?.countryCode)
  const head = q || fallback
  const clientId = q?.guestInfo ? q.guestInfo.linkedClientId : q?.client.id

  return (
    <aside aria-label="Booking details" className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-[#ebe7f6] bg-white px-4 pt-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#1b1140]">{view === 'guest' ? 'Guest Booking' : 'Booking Details'}</h2>
          <button type="button" onClick={onClose} aria-label="Close booking details" className="rounded-lg p-1 text-[#4a4466] hover:bg-[#f4f1fc]">
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-[18px] font-bold text-[#1b1140]">{head?.reference || bookingId}</span>
          {q && headline(q)}
        </div>
        {head?.scheduledStart && <p className="mt-0.5 text-[12px] text-[#4a4466]">{formatStamp(head.scheduledStart, new Date().toISOString(), tz).split(' • ')[0]} • {formatTime(head.scheduledStart, tz)} – {formatTime(head.scheduledEnd, tz)}</p>}
        <nav role="tablist" aria-label="Booking detail sections" className="mt-2.5 -mb-px flex gap-3 overflow-x-auto [scrollbar-width:none]">
          {TABS.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn('shrink-0 border-b-2 pb-2 text-[12px] font-semibold transition', tab === t ? 'border-[#4125d0] text-[#4125d0]' : 'border-transparent text-[#4a4466] hover:text-[#1b1140]')}>
              {t}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 space-y-2.5 px-4 py-3">
        {error && (
          <p role="alert" className="rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">
            {error} <button type="button" onClick={refetch} className="font-semibold underline">Retry</button>
          </p>
        )}
        {loading || !q ? (
          !error && <Skeleton className="h-[560px] rounded-xl" />
        ) : tab === 'Overview' ? (
          <OverviewTab q={q} tz={tz} linkState={linkState} />
        ) : tab === 'Timeline' ? (
          <>
            {q.cancelTimeline?.length > 0 && <Timeline items={q.cancelTimeline} tz={tz} title="Cancellation Timeline" />}
            <Timeline items={q.timeline} tz={tz} title="Booking Lifecycle" />
          </>
        ) : tab === 'Payments' ? (
          <>
            <PaymentInfo q={q} tz={tz} />
            <SettlementInfo q={q} tz={tz} />
            {q.refundInfo && <RefundBlock q={q} tz={tz} />}
            {q.view === 'cancelled' && q.cancellation && <PolicyBlock q={q} />}
          </>
        ) : tab === 'Assignment' ? (
          <AssignmentInfo q={q} tz={tz} />
        ) : (
          <MoreTab q={q} tz={tz} linkState={linkState} />
        )}
      </div>

      {q && (
        <div className="sticky bottom-0 grid grid-cols-[1.3fr_1fr_1fr] gap-2 border-t border-[#ebe7f6] bg-white px-4 py-3">
          <button type="button" onClick={() => onOpenFull(q.id)} className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#4125d0] text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-[#3519b8]">
            Open Booking <ArrowRight className="size-4" />
          </button>
          <Link to={`/bookings/${q.id}/timeline`} state={linkState} className="flex h-9 items-center justify-center rounded-lg border border-[#ddd7ee] text-[12px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]">View Timeline</Link>
          <Dropdown
            align="right"
            menuWidth="w-48"
            className="w-full"
            trigger={({ open }) => (
              <button type="button" className={cn('flex h-9 w-full items-center justify-center gap-1 rounded-lg border text-[12px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]', open ? 'border-[#7a5cf0]' : 'border-[#ddd7ee]')}>
                More Actions <ChevronDown className="size-3.5" />
              </button>
            )}
          >
            <div className="space-y-0.5 [&>*]:flex [&>*]:w-full [&>*]:rounded-lg [&>*]:px-3 [&>*]:py-2 [&>*]:text-left [&>*]:text-[12.5px] [&>*]:font-medium [&>*]:text-[#2a1b57] [&>*:hover]:bg-[#f4f1fc]">
              {clientId && <Link to={`/clients/${clientId}`} state={linkState}>View Client</Link>}
              {q.provider.id && <Link to={`/providers/${q.provider.id}`} state={linkState}>View Provider</Link>}
              {q.related?.paymentId && <Link to={`/payments/${q.related.paymentId}`}>View Payment</Link>}
              <button type="button" onClick={() => navigator.clipboard?.writeText(q.reference)}>Copy Booking ID</button>
            </div>
          </Dropdown>
        </div>
      )}
    </aside>
  )
}
