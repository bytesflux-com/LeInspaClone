import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CalendarDays, CircleCheck, CircleEllipsis, CircleX, Clock, Copy, Hash, ShoppingBag, Smartphone, Square, X } from 'lucide-react'
import Skeleton from '../../ui/Skeleton'
import { PaymentStatusPill, RelatedVisual } from './PaymentBadges'
import { EscrowPill } from '../bookings/BookingBadges'
import { PAYMENT_TYPE_LABELS } from '../../../constants/clientPayments'
import { formatFullStamp } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const CARD = 'rounded-xl border border-[#e6e1f3] bg-white p-3'
const H3 = 'mb-1.5 text-[13.5px] font-bold text-[#1b1140]'
const ESCROW_HINT = { held: 'Awaiting service completion', released: 'Released to the provider', refunded: 'Returned to the client' }

const money = (cur, n) => `${cur} ${n.toLocaleString('en-US')}`

function InfoRow({ icon: Icon, iconClass = 'text-[#4527c8]', label, children }) {
  return (
    <li className="grid grid-cols-[18px_96px_1fr] items-center gap-2 border-b border-[#efecf7] py-[7px] text-[11.5px] last:border-b-0">
      <Icon className={cn('size-4', iconClass)} aria-hidden="true" />
      <span className="text-[#2a1b57]">{label}</span>
      <span className="flex min-w-0 items-center justify-end gap-1.5 text-right font-semibold text-[#1b1140]">{children}</span>
    </li>
  )
}

function Timeline({ events, timeZone }) {
  return (
    <ol>
      {events.map((e, i) => {
        const last = i === events.length - 1
        const Icon = e.tone === 'escrow' || e.tone === 'wait' ? CircleEllipsis : e.tone === 'bad' ? CircleX : CircleCheck
        const color = e.tone === 'escrow' || e.tone === 'wait' ? 'fill-[#4527c8] text-white' : e.tone === 'bad' ? 'fill-[#e03a3a] text-white' : 'fill-[#22a652] text-white'
        return (
          <li key={e.id} className="relative flex items-center justify-between gap-2 py-[5px] pl-6 text-[11.5px]">
            {!last && <span className="absolute top-[18px] bottom-[-8px] left-[8px] w-px bg-[#bfe5cc]" aria-hidden="true" />}
            <Icon className={cn('absolute top-[5px] left-0 size-[17px]', color)} aria-hidden="true" />
            <span className="text-[#1b1140]">{e.text}</span>
            <span className="shrink-0 text-[10.5px] text-[#2a1b57]">{formatFullStamp(e.at, timeZone)}</span>
          </li>
        )
      })}
    </ol>
  )
}

function Notes({ payment, preview, onSave }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const notes = preview?.notes || []

  const save = async () => {
    if (!text.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave(payment.id, text.trim())
      setText('')
    } catch (err) {
      setError(err?.message || 'Unable to save the note.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={CARD}>
      <h3 className={H3}>Internal Notes</h3>
      {notes.length > 0 && (
        <ul className="mb-2 max-h-28 space-y-1.5 overflow-y-auto">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-[#f4f1fc] px-2.5 py-1.5 text-[11.5px] text-[#1b1140]">
              {n.text}
              <span className="mt-0.5 block text-[10px] text-[#4a4466]">{n.author} • {formatFullStamp(n.createdAt, preview.timeZone)}</span>
            </li>
          ))}
        </ul>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Add a note about this payment (only visible to admin team)..."
        aria-label="Internal note"
        className="w-full resize-none rounded-lg border border-[#d9d3ee] bg-white p-2.5 text-[11.5px] text-[#1b1140] placeholder:text-[#6b6785] focus:border-[#7a5cf0] focus:outline-none"
      />
      {error && <p role="alert" className="mt-1 text-[11px] text-[#b91c1c]">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={!text.trim() || saving}
        className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-[#4125d0] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3719b8] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Note'}
      </button>
      <p className="mt-1.5 text-[10px] leading-snug text-[#4a4466]">Visible only to authorised Lé Inspa staff. Notes never change the transaction.</p>
    </section>
  )
}

export default function PaymentDrawer({ payment: p, preview, loading, error, client, links, onClose, onSaveNote }) {
  const [copied, setCopied] = useState('')
  const ready = !loading && preview
  const tz = client.timeZone
  const cur = client.currency

  const copy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  const isBooking = p.type === 'booking'
  const relatedLink = p.bookingId ? { to: links.booking, label: 'View Booking' } : p.type === 'membership' ? { to: links.membership, label: 'View Membership' } : null

  return (
    <aside aria-label="Payment details" className="rounded-xl border border-[#e6e1f3] bg-white p-3.5 shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)]">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-[19px] font-bold tracking-tight text-[#1b1140]">Payment Details</h2>
        <button type="button" onClick={onClose} aria-label="Close payment details" className="rounded-lg p-1 text-[#1b1140] transition hover:bg-[#f1edff]">
          <X className="size-5" />
        </button>
      </header>

      <div className="flex items-start gap-3">
        <span className="flex size-[74px] shrink-0 items-center justify-center rounded-2xl bg-[#ece6ff]" aria-hidden="true">
          <ShoppingBag className="size-9 fill-[#3b1fd6] text-white" />
        </span>
        <div className="min-w-0 pt-0.5">
          <PaymentStatusPill status={p.status} className="mb-1" />
          <p className="flex items-center gap-1.5 text-[19px] leading-tight font-bold text-[#1b1140]">
            {p.id}
            <button type="button" onClick={() => copy(p.id, 'id')} aria-label="Copy payment ID" className="rounded p-0.5 text-[#4527c8] hover:bg-[#f1edff]">
              {copied === 'id' ? <CircleCheck className="size-3.5 text-[#15803d]" /> : <Copy className="size-3.5" />}
            </button>
          </p>
          <p className="text-[11.5px] text-[#2a1b57]">{formatFullStamp(p.createdAt, tz)}</p>
          <p className="mt-0.5 text-[24px] leading-tight font-extrabold tracking-tight text-[#3b1fd6]">{money(cur, p.amount)}</p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-[#fff1f1] p-3 text-[12px] text-[#b91c1c]">{error}</p>
      ) : !ready ? (
        <div className="mt-3 space-y-2.5" aria-busy="true" aria-label="Loading payment details">
          <Skeleton className="h-[150px] rounded-xl" />
          <Skeleton className="h-[90px] rounded-xl" />
          <Skeleton className="h-[110px] rounded-xl" />
          <Skeleton className="h-[130px] rounded-xl" />
        </div>
      ) : (
        <div className="mt-3 space-y-2.5">
          <section className={CARD}>
            <h3 className={H3}>Transaction Information</h3>
            <ul>
              <InfoRow icon={CalendarDays} label="Payment Type">{preview.typeLabel || PAYMENT_TYPE_LABELS[p.type]}</InfoRow>
              <InfoRow icon={Smartphone} iconClass="text-[#2fa84f]" label="Payment Method">{p.method.label}</InfoRow>
              <InfoRow icon={Hash} label="Transaction Reference">
                <span className="truncate">{preview.reference}</span>
                <button type="button" onClick={() => copy(preview.reference, 'ref')} aria-label="Copy transaction reference" className="shrink-0 rounded p-0.5 text-[#4527c8] hover:bg-[#f1edff]">
                  {copied === 'ref' ? <CircleCheck className="size-3.5 text-[#15803d]" /> : <Copy className="size-3.5" />}
                </button>
              </InfoRow>
              <InfoRow icon={Clock} label="Created">{formatFullStamp(p.createdAt, tz)}</InfoRow>
              <InfoRow icon={CircleCheck} iconClass="text-[#22a652]" label="Confirmed">{preview.confirmedAt ? formatFullStamp(preview.confirmedAt, tz) : '—'}</InfoRow>
            </ul>
          </section>

          {relatedLink && (
            <section className={CARD}>
              <h3 className={H3}>{p.bookingId ? 'Related Booking' : 'Related Membership'}</h3>
              <div className="flex items-center gap-2.5">
                <RelatedVisual payment={p} size={62} className="!rounded-xl" />
                <div className="min-w-0 flex-1 leading-snug">
                  <p className="truncate text-[13.5px] font-bold text-[#1b1140]">{p.title}</p>
                  <p className="truncate text-[11.5px] text-[#2a1b57]">{p.provider || p.subtitle}</p>
                  {p.bookingId && <p className="text-[11px] text-[#2a1b57]">Booking #{p.bookingId}</p>}
                  <Link to={relatedLink.to} state={links.state} className="mt-1.5 inline-flex h-7 items-center gap-1.5 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-2.5 text-[11.5px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]">
                    {relatedLink.label} <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </section>
          )}

          <section className={CARD}>
            <h3 className={H3}>Payment Breakdown</h3>
            <ul className="text-[11.5px]">
              {preview.breakdown.rows.map(([label, value]) => (
                <li key={label} className="flex items-center justify-between border-b border-[#efecf7] py-[6px]">
                  <span className="text-[#2a1b57]">{label}</span>
                  <span className="font-medium text-[#1b1140]">{value == null ? '-' : money(cur, value)}</span>
                </li>
              ))}
              <li className="mt-1 flex items-center justify-between rounded-lg bg-[#ece8fb] px-2 py-[7px]">
                <span className="font-bold text-[#1b1140]">{preview.breakdown.totalLabel}</span>
                <span className="text-[13.5px] font-extrabold text-[#3b1fd6]">{money(cur, preview.breakdown.total)}</span>
              </li>
            </ul>
          </section>

          <div className={cn('grid gap-2.5', isBooking && preview.escrowDetail ? 'grid-cols-2' : 'grid-cols-1')}>
            {isBooking && preview.escrowDetail && (
              <section className={cn(CARD, 'flex flex-col items-center p-2.5 text-center')}>
                <h3 className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold text-[#1b1140]">
                  <span className="flex size-[22px] items-center justify-center rounded-md bg-[#3b1fd6]" aria-hidden="true"><Square className="size-3 fill-white text-white" /></span>
                  Escrow Status
                </h3>
                <EscrowPill status={preview.escrowDetail.status} />
                <p className="mt-1.5 text-[13.5px] font-bold text-[#1b1140]">{money(cur, preview.escrowDetail.amount)}</p>
                <p className="text-[10.5px] leading-snug text-[#4a4466]">{ESCROW_HINT[preview.escrowDetail.status]}</p>
                <Link to={links.escrow(preview.escrowDetail.id)} state={links.state} className="mt-1.5 text-[11px] font-semibold text-[#3b1fd6] hover:underline">View Escrow Details</Link>
              </section>
            )}

            <section className={cn(CARD, 'p-2.5', isBooking && preview.escrowDetail ? 'text-center' : '')}>
              <h3 className={cn('mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold text-[#1b1140]', isBooking && preview.escrowDetail && 'justify-center')}>
                <span className="flex size-[22px] items-center justify-center rounded-full bg-[#e6e8ee]" aria-hidden="true"><Clock className="size-3 text-[#3f4457]" /></span>
                Refund
              </h3>
              {preview.refund ? (
                <dl className="space-y-1 text-left text-[11.5px]">
                  <div className="flex justify-between gap-2"><dt className="text-[#2a1b57]">Amount</dt><dd className="font-bold text-[#1b1140]">{money(cur, preview.refund.amount)}</dd></div>
                  <div className="flex items-center justify-between gap-2"><dt className="text-[#2a1b57]">Status</dt><dd><span className="inline-flex items-center gap-1 rounded-md bg-[#ffe9d2] px-1.5 py-1 text-[10.5px] font-medium text-[#c2570c]"><Clock className="size-3 fill-[#f08a24] text-white" aria-hidden="true" />{preview.refund.status}</span></dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[#2a1b57]">Reason</dt><dd className="text-right font-medium text-[#1b1140]">{preview.refund.reason}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[#2a1b57]">Requested</dt><dd className="text-right font-medium text-[#1b1140]">{formatFullStamp(preview.refund.requestedAt, tz)}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[#2a1b57]">Processed by</dt><dd className="font-medium text-[#1b1140]">{preview.refund.processedBy}</dd></div>
                  <Link to={links.refund(preview.refund.id)} state={links.state} className="inline-block pt-1 text-[11px] font-semibold text-[#3b1fd6] hover:underline">View Refund Details</Link>
                </dl>
              ) : (
                <>
                  <p className={cn('text-[13.5px] font-bold text-[#1b1140]', isBooking && preview.escrowDetail && 'text-center')}>No refund</p>
                  <p className={cn('mt-1 text-[10.5px] leading-snug text-[#4a4466]', isBooking && preview.escrowDetail && 'text-center')}>No refund associated with this payment.</p>
                </>
              )}
            </section>
          </div>

          <section className={CARD}>
            <h3 className={H3}>Transaction Timeline</h3>
            <Timeline events={preview.timeline} timeZone={tz} />
          </section>

          <Notes payment={p} preview={preview} onSave={onSaveNote} />
        </div>
      )}
    </aside>
  )
}
