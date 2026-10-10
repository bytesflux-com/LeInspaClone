import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CalendarDays, CircleCheck, Lock, ShieldCheck, TriangleAlert } from 'lucide-react'
import { CARD, H2, LINK } from './AccountParts'
import { clientService } from '../../../services/clientService'
import { MAX_NOTE } from '../../../constants/clientAccount'
import { formatDay, formatFullStamp, formatTime } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const moneyOf = (currency, amount) => (typeof amount === 'number' ? `${currency} ${amount.toLocaleString('en-US')}` : null)

function expiryText(x, tz) {
  const e = x.expires
  return typeof e === 'string' ? e : `${formatDay(e.at, tz, { year: true })}`
}

// Active restrictions are managed individually. A healthy account says so calmly — never alarming.
export function ActiveRestrictionsCard({ restrictions, client, onReview, canSeeSafety }) {
  const tz = client.timeZone
  const none = restrictions.length === 0
  return (
    <section aria-label="Active restrictions" className={cn(CARD, 'min-w-0')}>
      <h2 className={H2}>Active Restrictions</h2>
      {none ? (
        <div className="mt-2.5 rounded-xl bg-[#f6f4fb] px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex h-[44px] items-center gap-2.5 rounded-full bg-[#dcf6e4] pr-5 pl-2.5">
              <CircleCheck className="size-[28px] fill-[#15803d] text-white" aria-hidden="true" />
              <span className="text-[24px] leading-none font-medium text-[#15803d]">None</span>
            </span>
            <ShieldCheck className="mr-2 size-[34px] fill-[#cfd3dc] text-white" aria-hidden="true" />
          </div>
          <p className="mt-3 text-center text-[11.5px] text-[#2a1b57]">There are no active restrictions on this account.</p>
        </div>
      ) : (
        <ul className="mt-2.5 max-h-[260px] space-y-2 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
          {restrictions.map((x) => (
            <li key={x.id} className={cn('rounded-xl border p-2.5', x.impact === 'none' ? 'border-[#e6e1f3] bg-[#f6f3fd]' : x.kind === 'suspension' ? 'border-[#f5d3a6] bg-[#fff7ea]' : 'border-[#f5d3a6] bg-[#fffaf1]')}>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#1b1140]">
                  <TriangleAlert className={cn('size-4 text-white', x.impact === 'none' ? 'fill-[#7a5cf0]' : 'fill-[#f08a24]')} aria-hidden="true" />
                  {x.label}
                </p>
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10.5px] leading-none font-semibold', x.impact === 'none' ? 'bg-[#e4defb] text-[#3b1fd6]' : 'bg-[#ffe9d2] text-[#c2570c]')}>
                  <span className={cn('size-1.5 rounded-full', x.impact === 'none' ? 'bg-[#4527c8]' : 'bg-[#e8801a]')} /> Active
                </span>
              </div>
              <dl className="mt-1.5 grid grid-cols-[72px_1fr] gap-x-2 gap-y-0.5 text-[11px] text-[#2a1b57]">
                <dt>Started</dt><dd className="font-medium text-[#1b1140]">{formatDay(x.startedAt, tz, { year: true })}</dd>
                {x.kind === 'suspension' && (<><dt>Scope</dt><dd className="font-medium text-[#1b1140]">{x.scopeLabel}</dd></>)}
                <dt>Reason</dt><dd className="font-medium text-[#1b1140]">{x.category || (canSeeSafety ? '—' : 'Restricted')}</dd>
                <dt>Expires</dt><dd className="font-medium text-[#1b1140]">{expiryText(x, tz)}</dd>
                <dt>Applied by</dt><dd className="font-medium text-[#1b1140]">{x.appliedBy} — {x.appliedByRole}</dd>
              </dl>
              <button type="button" onClick={() => onReview(x)} className="mt-2 inline-flex h-[26px] items-center gap-1 rounded-md border-[1.5px] border-[#6b4df0] bg-white px-2.5 text-[11px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]">
                Review Restriction <ArrowRight className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// What an action could affect: existing bookings are never cancelled silently.
export function UpcomingBookingsCard({ bookings, count, client, canSeeFinance, allTo, linkState }) {
  const tz = client.timeZone
  return (
    <section aria-label="Upcoming bookings" className={cn(CARD, 'min-w-0')}>
      <header className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[17px] leading-tight font-bold tracking-tight text-[#1b1140]">
          <span className="flex size-[24px] items-center justify-center rounded-md bg-[#4125d0]"><CalendarDays className="size-3.5 text-white" aria-hidden="true" /></span>
          Upcoming Bookings
          {count > 0 && <span className="inline-flex size-[19px] items-center justify-center rounded-full bg-[#e11d2e] text-[11px] leading-none font-bold text-white">{count}</span>}
        </h2>
        <Link to={allTo} state={linkState} className={LINK}>View All <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
      </header>
      <p className="mt-1 text-[11.5px] text-[#2a1b57]">{count === 0 ? 'This client has no upcoming bookings.' : `This client has ${count} upcoming booking${count > 1 ? 's' : ''}.`}</p>
      {count > 0 && (
        <ul className="mt-2 space-y-1.5">
          {bookings.map((b) => (
            <li key={b.id} className="flex items-center gap-2.5 rounded-lg border border-[#e6e1f3] bg-white px-2 py-1.5">
              <span className="flex size-[26px] shrink-0 items-center justify-center rounded-md bg-[#4125d0]"><CalendarDays className="size-3.5 text-white" aria-hidden="true" /></span>
              <Link to={`/bookings/${b.id}`} state={linkState} className="min-w-0 flex-[1.05] hover:underline">
                <span className="block text-[12.5px] leading-tight font-bold text-[#1b1140]">#{b.id}</span>
                <span className="block truncate text-[10.5px] leading-tight text-[#2a1b57]">{b.service}</span>
              </Link>
              <span className="flex min-w-0 flex-[1.2] items-center gap-1.5 text-[11px] whitespace-nowrap text-[#1b1140]">
                <CalendarDays className="size-3.5 shrink-0 text-[#4527c8]" aria-hidden="true" />
                {formatDay(b.scheduledAt, tz, { year: true })} • {formatTime(b.scheduledAt, tz)}
              </span>
              <span className="w-[68px] shrink-0 text-right text-[12px] font-bold text-[#1b1140]">{canSeeFinance ? moneyOf(client.currency, b.amount) : '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Internal notes use the same shared note store as the profile (`admin_notes`) — staff-only, separate from client-facing reasons.
export function AccountNotesCard({ clientId, onSaved, onError }) {
  const [text, setText] = useState('')
  const [notes, setNotes] = useState([])
  const [busy, setBusy] = useState(false)
  const field = useRef(null)

  useEffect(() => {
    let cancelled = false
    clientService.getClientNotes(clientId).then((n) => !cancelled && setNotes(n)).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [clientId])

  const save = async () => {
    const note = text.trim()
    if (!note || busy) return
    setBusy(true)
    try {
      const entry = await clientService.addClientNote({ clientId, note })
      setNotes((n) => [entry, ...n])
      setText('')
      onSaved?.('Internal note saved')
    } catch (err) {
      onError?.(err?.message || 'Unable to save note')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="Account notes (internal)" className={cn(CARD, 'min-w-0')}>
      <h2 className={H2}>Account Notes (Internal)</h2>
      <div className="relative mt-2.5">
        <textarea
          ref={field}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_NOTE))}
          maxLength={MAX_NOTE}
          aria-label="Internal account note"
          placeholder="Add an internal note about this client’s account..."
          className="h-[84px] w-full resize-none rounded-lg border border-[#d9d3ee] bg-white px-3 py-2 pb-5 text-[12px] leading-snug text-[#1b1140] placeholder:text-[#4a4466] focus:border-[#7a5cf0] focus:ring-3 focus:ring-[#7a5cf0]/15 focus:outline-none"
        />
        <span className="pointer-events-none absolute right-3 bottom-1.5 text-[10.5px] text-[#4a4466]">{text.length}/{MAX_NOTE}</span>
      </div>
      <div className="mt-2.5 flex justify-end">
        <button type="button" onClick={save} disabled={!text.trim() || busy} className="inline-flex h-9 w-[168px] items-center justify-center gap-2 rounded-lg bg-[#4125d0] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3519b8] disabled:cursor-not-allowed disabled:opacity-60">
          <Lock className="size-3.5" aria-hidden="true" /> {busy ? 'Saving…' : 'Save Note'}
        </button>
      </div>
      {notes.length > 0 && (
        <ul className="mt-2.5 max-h-[110px] space-y-1.5 overflow-y-auto [scrollbar-width:thin]">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-[#e6e1f3] bg-[#faf9fd] p-2">
              <p className="text-[11.5px] whitespace-pre-wrap text-[#1b1140]">{n.note}</p>
              <p className="mt-0.5 text-[10px] text-[#6b6785]">{n.author} · {formatFullStamp(n.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
