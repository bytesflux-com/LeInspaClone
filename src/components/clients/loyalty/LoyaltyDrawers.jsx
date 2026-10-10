import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { ArrowDown, ArrowRight, Circle, CircleCheck, CircleEllipsis, CircleMinus, X } from 'lucide-react'
import PersonAvatar from '../../ui/PersonAvatar'
import CountryFlag from '../../ui/CountryFlag'
import Skeleton from '../../ui/Skeleton'
import { Amount, StatusPill } from './LoyaltyBadges'
import { REFERRAL_STATUS_STYLE, REWARD_STATUS_STYLE, SOURCE_LABELS } from '../../../constants/clientLoyalty'
import { formatDay, formatFullStamp } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const CARD = 'rounded-xl border border-[#e6e1f3] bg-white p-3'
const H3 = 'mb-1.5 text-[14px] font-bold text-[#1b1140]'
const OUTLINE_BTN = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-3 text-[12.5px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]'

function Row({ label, children }) {
  return (
    <li className="grid grid-cols-[104px_1fr] items-center gap-2 border-b border-[#efecf7] py-[7px] text-[12px] last:border-b-0">
      <span className="text-[#2a1b57]">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5 font-semibold text-[#1b1140]">{children}</span>
    </li>
  )
}

// Right-hand overlay used by both drawers. Escape and the backdrop close it; the page keeps its
// scroll position, filters and selection (they live in the URL), so closing returns to the same view.
function Shell({ title, subtitle, onClose, children }) {
  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <>
      <button type="button" aria-label={`Close ${title.toLowerCase()}`} tabIndex={-1} onClick={onClose} className="fixed inset-0 z-40 bg-[#1b1140]/30" />
      <aside role="dialog" aria-modal="true" aria-label={title} className="fixed inset-y-0 right-0 z-50 flex w-[400px] max-w-full flex-col bg-[#f7f6fc] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-[#e6e1f3] bg-white px-4 py-3.5">
          <div className="min-w-0">
            <h2 className="text-[17px] leading-tight font-bold tracking-tight text-[#1b1140]">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-[12px] text-[#2a1b57]">{subtitle}</p>}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-[#1b1140] transition hover:bg-[#f1edff]">
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3.5 [scrollbar-width:thin]">{children}</div>
      </aside>
    </>
  )
}

function Party({ label, name, id, gender, photoURL, to, state }) {
  return (
    <div className="flex items-center gap-3">
      <PersonAvatar name={name} src={photoURL} gender={gender} size={40} />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-[10.5px] font-semibold tracking-wide text-[#4a4466] uppercase">{label}</p>
        <p className="truncate text-[14px] font-bold text-[#1b1140]">{name}</p>
        <p className="text-[11.5px] text-[#2a1b57]">{id}</p>
      </div>
      {to && (
        <Link to={to} state={state} className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-semibold text-[#3b1fd6] hover:underline">
          View <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

function Timeline({ events, timeZone }) {
  return (
    <ol>
      {events.map((e, i) => {
        const last = i === events.length - 1
        const wait = e.tone === 'wait'
        const muted = e.tone === 'muted'
        const Icon = wait ? CircleEllipsis : muted ? CircleMinus : CircleCheck
        const color = wait ? 'fill-[#f08a24] text-white' : muted ? 'fill-[#7d8599] text-white' : 'fill-[#22a652] text-white'
        return (
          <li key={e.id} className="relative flex items-center justify-between gap-2 py-[5px] pl-6 text-[11px]">
            {!last && <span className="absolute top-[19px] bottom-[-8px] left-[8px] w-px bg-[#d9d3ee]" aria-hidden="true" />}
            <Icon className={cn('absolute top-[5px] left-0 size-[17px]', color)} aria-hidden="true" />
            <span className="text-[#1b1140]">{e.text}</span>
            <span className="shrink-0 text-[10px] text-[#2a1b57]">{formatFullStamp(e.at, timeZone)}</span>
          </li>
        )
      })}
    </ol>
  )
}

// Referral Details — makes one referral fully traceable: who referred whom, which rule steps were
// met, what was rewarded and which reward transaction records it.
export function ReferralDrawer({ referralId, preview, loading, error, client, canSeeFinancial, canViewBookings, linkState, onClose }) {
  const ready = !loading && preview
  return (
    <Shell title="Referral Details" subtitle={referralId} onClose={onClose}>
      {error && <p role="alert" className="rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">{error}</p>}
      {!ready && !error && (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-[170px]" />
          <Skeleton className="h-[130px]" />
          <Skeleton className="h-[110px]" />
        </div>
      )}

      {ready && (
        <>
          <section className={CARD}>
            <Party label="Referrer" name={preview.referrer.name} id={preview.referrer.id} gender={client.gender} photoURL={client.photoURL} />
            <div className="my-2 flex justify-center" aria-hidden="true">
              <span className="flex size-6 items-center justify-center rounded-full bg-[#e4defb]"><ArrowDown className="size-3.5 text-[#4527c8]" /></span>
            </div>
            <Party label="Referred Client" name={preview.client.name} id={preview.client.id} gender={preview.client.gender} photoURL={preview.client.photoURL} to={`/clients/${preview.client.id}`} state={linkState} />
          </section>

          <section className={CARD}>
            <ul>
              <Row label="Referral Code">{preview.code}</Row>
              <Row label="Joined">{formatDay(preview.joinedAt, preview.timeZone, { year: true })}</Row>
              <Row label="Market"><CountryFlag code={preview.country} className="h-3 w-[18px]" />{preview.countryName}</Row>
              <Row label="Status"><StatusPill style={REFERRAL_STATUS_STYLE[preview.status]} /></Row>
            </ul>
          </section>

          <section className={CARD}>
            <h3 className={H3}>Qualification</h3>
            <ul className="space-y-1.5">
              {preview.qualification.map((q) => (
                <li key={q.id} className="flex items-center gap-2 text-[12.5px] text-[#1b1140]">
                  {q.done ? <CircleCheck className="size-[17px] fill-[#22a652] text-white" aria-hidden="true" /> : <Circle className="size-[17px] text-[#b5aed0]" aria-hidden="true" />}
                  <span className="sr-only">{q.done ? 'Completed:' : 'Not completed:'}</span>
                  {q.label}
                </li>
              ))}
            </ul>
          </section>

          <section className={CARD}>
            <h3 className={H3}>Reward</h3>
            <ul>
              <Row label="Reward"><Amount value={preview.rewardAmount} currency={preview.currency} show={canSeeFinancial || preview.rewardAmount == null} /></Row>
              <Row label="Reward Transaction">{canSeeFinancial ? preview.rewardTxnId || <span aria-label="None">—</span> : <span className="text-[#4a4466]">Restricted</span>}</Row>
              {preview.bookingId && (
                <Row label="Related Booking">
                  {canViewBookings ? <Link to={`/bookings/${preview.bookingId}`} state={linkState} className="text-[#3b1fd6] hover:underline">Booking #{preview.bookingId}</Link> : `Booking #${preview.bookingId}`}
                </Row>
              )}
            </ul>
            {canSeeFinancial && preview.rewardTxnId && (
              <Link to={`/payments/${preview.rewardTxnId}`} state={linkState} className={cn(OUTLINE_BTN, 'mt-2 w-full')}>
                View Reward Transaction <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            )}
          </section>

          <section className={CARD}>
            <h3 className={H3}>Referral Journey</h3>
            <Timeline events={preview.events} timeZone={preview.timeZone} />
          </section>

          <Link to={`/clients/${preview.client.id}`} state={linkState} className={cn(OUTLINE_BTN, 'w-full')}>View Referred Client</Link>
        </>
      )}
    </Shell>
  )
}

// Reward Details — why the reward exists, where it came from and what happened to it.
export function RewardDrawer({ reward, currency, timeZone, canSeeFinancial, canViewBookings, linkState, onOpenReferral, onClose }) {
  const closing = { redeemed: 'Redeemed', expired: 'Expired', reversed: 'Reversed' }[reward.status]
  return (
    <Shell title="Reward Details" subtitle={reward.id} onClose={onClose}>
      <section className={CARD}>
        <h3 className={H3}>Why this reward exists</h3>
        <p className="text-[12.5px] text-[#1b1140]">{reward.reason}</p>
      </section>

      <section className={CARD}>
        <ul>
          <Row label="Reward ID">{reward.id}</Row>
          <Row label="Source">{SOURCE_LABELS[reward.source] || reward.source}</Row>
          <Row label="Value"><Amount value={reward.value} currency={currency} show={canSeeFinancial} /></Row>
          <Row label="Status"><StatusPill style={REWARD_STATUS_STYLE[reward.status]} /></Row>
          <Row label="Issued">{formatFullStamp(reward.issuedAt, timeZone)}</Row>
          {closing && reward.closedAt && <Row label={closing}>{formatFullStamp(reward.closedAt, timeZone)}</Row>}
          <Row label="Related Record">
            {!reward.related ? (
              <span aria-label="None">—</span>
            ) : reward.related.kind === 'referral' ? (
              <button type="button" onClick={() => onOpenReferral(reward.related.id)} className="text-[#3b1fd6] hover:underline">{reward.related.label}</button>
            ) : canViewBookings ? (
              <Link to={`/bookings/${reward.related.id}`} state={linkState} className="text-[#3b1fd6] hover:underline">{reward.related.label}</Link>
            ) : (
              reward.related.label
            )}
          </Row>
        </ul>
      </section>

      <p className="px-1 text-[11px] leading-snug text-[#4a4466]">Rewards are a permanent record. Corrections are made with a separate adjustment or reversal entry — never by editing this reward.</p>
    </Shell>
  )
}
