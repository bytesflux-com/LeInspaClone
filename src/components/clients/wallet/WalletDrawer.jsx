import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CircleCheck, CircleEllipsis, CircleX, Copy, X } from 'lucide-react'
import Skeleton from '../../ui/Skeleton'
import { LedgerTile, MethodGlyph, WalletStatusPill } from './WalletBadges'
import { formatFullStamp } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const CARD = 'rounded-xl border border-[#e6e1f3] bg-white p-3'
const H3 = 'mb-1.5 text-[14px] font-bold text-[#1b1140]'
const OUTLINE_BTN = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-3 text-[12.5px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]'

const money = (cur, n) => `${cur} ${n.toLocaleString('en-US')}`
const DIRECTION_LABEL = { credit: 'Credit', debit: 'Debit', none: 'No balance effect' }

function Row({ label, children }) {
  return (
    <li className="grid grid-cols-[100px_1fr] items-center gap-2 py-[5px] text-[12px]">
      <span className="text-[#2a1b57]">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5 font-semibold text-[#1b1140]">{children}</span>
    </li>
  )
}

function Timeline({ events, timeZone }) {
  return (
    <ol>
      {events.map((e, i) => {
        const last = i === events.length - 1
        const wait = e.tone === 'wait'
        const Icon = wait ? CircleEllipsis : e.tone === 'bad' ? CircleX : CircleCheck
        const color = wait ? 'fill-[#f08a24] text-white' : e.tone === 'bad' ? 'fill-[#e03a3a] text-white' : 'fill-[#22a652] text-white'
        return (
          <li key={e.id} className="relative flex items-center justify-between gap-2 py-[5px] pl-6 text-[11px]">
            {!last && <span className="absolute top-[19px] bottom-[-8px] left-[8px] w-px bg-[#bfe5cc]" aria-hidden="true" />}
            <Icon className={cn('absolute top-[5px] left-0 size-[17px]', color)} aria-hidden="true" />
            <span className="text-[#1b1140]">{e.text}</span>
            <span className="shrink-0 text-[10px] text-[#2a1b57]">{formatFullStamp(e.at, timeZone)}</span>
          </li>
        )
      })}
    </ol>
  )
}

function Notes({ txn, preview, onSave }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const notes = preview?.notes || []

  const save = async () => {
    if (!text.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave(txn.id, text.trim())
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
        rows={2}
        maxLength={500}
        placeholder="Add an internal note about this transaction…"
        aria-label="Internal note"
        className="w-full resize-none rounded-lg border border-[#d9d3ee] bg-[#faf9fe] p-2.5 text-[11.5px] text-[#1b1140] placeholder:text-[#4a4466] focus:border-[#7a5cf0] focus:bg-white focus:outline-none"
      />
      {error && <p role="alert" className="mt-1 text-[11px] text-[#b91c1c]">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={!text.trim() || saving}
        className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-[#4125d0] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3719b8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save Note'}
      </button>
      <p className="mt-1.5 text-[10px] leading-snug text-[#4a4466]">Visible only to authorised Lé Inspa admin staff. Notes never change balances or financial records.</p>
    </section>
  )
}

export default function WalletDrawer({ txn: t, preview, loading, error, client, links, onClose, onSaveNote }) {
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

  const sign = t.direction === 'credit' ? '+' : t.direction === 'debit' ? '-' : ''
  const amountTone = t.direction === 'credit' ? 'text-[#15803d]' : t.direction === 'debit' ? 'text-[#dc2626]' : 'text-[#1b1140]'

  return (
    <aside aria-label="Wallet transaction details" className="rounded-xl border border-[#e6e1f3] bg-white p-3.5 shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)]">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-[20px] font-bold tracking-tight text-[#1b1140]">Wallet Transaction</h2>
        <button type="button" onClick={onClose} aria-label="Close wallet transaction details" className="rounded-lg p-1 text-[#1b1140] transition hover:bg-[#f1edff]">
          <X className="size-5" />
        </button>
      </header>

      <div className="flex items-center gap-3">
        <LedgerTile size={70} failed={t.status === 'failed'} className="!rounded-2xl" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="flex items-center gap-1 text-[18px] leading-tight font-bold text-[#1b1140]">
              {t.id}
              <button type="button" onClick={() => copy(t.id, 'id')} aria-label="Copy transaction ID" className="rounded p-0.5 text-[#4527c8] hover:bg-[#f1edff]">
                {copied === 'id' ? <CircleCheck className="size-3.5 text-[#15803d]" /> : <Copy className="size-3.5" />}
              </button>
            </p>
            <WalletStatusPill status={t.status} className="!py-[5px] !text-[11px]" />
          </div>
          <p className="mt-1 text-[12.5px] text-[#2a1b57]">{formatFullStamp(t.createdAt, tz)}</p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-[#fff1f1] p-3 text-[12px] text-[#b91c1c]">{error}</p>
      ) : !ready ? (
        <div className="mt-3 space-y-2.5" aria-busy="true" aria-label="Loading transaction details">
          <Skeleton className="h-[190px] rounded-xl" />
          <Skeleton className="h-[130px] rounded-xl" />
          <Skeleton className="h-[100px] rounded-xl" />
          <Skeleton className="h-[130px] rounded-xl" />
        </div>
      ) : (
        <div className="mt-3 space-y-2.5">
          <section className={CARD}>
            <h3 className={H3}>Transaction Information</h3>
            <ul>
              <Row label="Type">{preview.typeLabel}</Row>
              <Row label="Direction">{DIRECTION_LABEL[t.direction]}</Row>
              <Row label="Amount">{money(cur, t.amount)}</Row>
              <Row label="Previous Balance">{money(cur, preview.balanceBefore)}</Row>
              <Row label="New Balance">{preview.balanceAfter == null ? 'Not applied yet' : money(cur, preview.balanceAfter)}</Row>
              <Row label="Created">{formatFullStamp(t.createdAt, tz)}</Row>
              <Row label="Status"><WalletStatusPill status={t.status} className="!py-[5px] !text-[11px]" /></Row>
            </ul>
          </section>

          {preview.funding && (
            <section className={CARD}>
              <h3 className={H3}>Funding Source</h3>
              <div className="mb-1 flex items-center gap-2 py-1 text-[13px] font-bold text-[#1b1140]">
                <MethodGlyph kind={preview.funding.method.kind} />
                {preview.funding.method.label}
              </div>
              <ul>
                <Row label="Payment ID">
                  <span className="truncate">{preview.funding.paymentId}</span>
                  <button type="button" onClick={() => copy(preview.funding.paymentId, 'pay')} aria-label="Copy payment ID" className="shrink-0 rounded p-0.5 text-[#4527c8] hover:bg-[#f1edff]">
                    {copied === 'pay' ? <CircleCheck className="size-3.5 text-[#15803d]" /> : <Copy className="size-3.5" />}
                  </button>
                </Row>
                <Row label="Amount">{money(cur, preview.funding.amount)}</Row>
              </ul>
              <Link to={links.payment(preview.funding.paymentId)} state={links.state} className={cn(OUTLINE_BTN, 'mt-2 w-full')}>
                View Payment <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </section>
          )}

          {preview.refund && (
            <section className={CARD}>
              <h3 className={H3}>Refund Details</h3>
              <ul>
                <Row label="Refund">{money(cur, preview.refund.amount)}</Row>
                <Row label="Reason">{preview.refund.reason}</Row>
                <Row label="Status">{preview.refund.status}</Row>
                <Row label="Booking">#{preview.booking?.id}</Row>
                <Row label="Requested">{formatFullStamp(preview.refund.requestedAt, tz)}</Row>
              </ul>
              <Link to={links.refund(preview.refund.id)} state={links.state} className={cn(OUTLINE_BTN, 'mt-2 w-full')}>
                View Refund <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </section>
          )}

          <section className={CARD}>
            <h3 className={H3}>Balance Update</h3>
            {t.status === 'failed' ? (
              <p className="py-1 text-[12px] text-[#2a1b57]">This attempt failed, so the wallet balance did not change{preview.failure ? ` (${preview.failure})` : ''}.</p>
            ) : (
              <ul className="text-[12px]">
                <li className="flex items-center justify-between py-[5px]"><span className="text-[#2a1b57]">Previous Balance</span><span className="font-semibold text-[#1b1140]">{money(cur, preview.balanceBefore)}</span></li>
                <li className="flex items-center justify-between py-[5px]"><span className="text-[#2a1b57]">Amount</span><span className={cn('font-bold', t.status === 'pending' ? 'text-[#c2570c]' : amountTone)}>{sign}{t.status === 'pending' ? ' ' : ''}{money(cur, t.amount)}</span></li>
                <li className="flex items-center justify-between py-[5px]"><span className="font-semibold text-[#1b1140]">New Balance</span><span className="text-[14px] font-extrabold text-[#1b1140]">{preview.balanceAfter == null ? 'Pending' : money(cur, preview.balanceAfter)}</span></li>
              </ul>
            )}
          </section>

          <section className={CARD}>
            <h3 className={H3}>Transaction Timeline</h3>
            <Timeline events={preview.timeline} timeZone={tz} />
          </section>

          <section className={CARD}>
            <h3 className={H3}>Related</h3>
            {preview.booking ? (
              <div className="flex items-center gap-2.5">
                {preview.booking.image ? (
                  <img src={preview.booking.image} alt="" loading="lazy" className="size-[56px] shrink-0 rounded-xl object-cover" />
                ) : (
                  <LedgerTile size={56} className="!rounded-xl" />
                )}
                <div className="min-w-0 flex-1 leading-snug">
                  <p className="truncate text-[13px] font-bold text-[#1b1140]">{preview.booking.service}</p>
                  <p className="truncate text-[11.5px] text-[#2a1b57]">{preview.booking.provider}</p>
                  <p className="text-[11px] text-[#2a1b57]">Booking #{preview.booking.id} • {money(cur, preview.booking.amount)}</p>
                  <Link to={links.booking(preview.booking.id)} state={links.state} className="mt-1 inline-flex h-7 items-center gap-1.5 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-2.5 text-[11.5px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]">
                    View Booking <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ) : preview.promo ? (
              <p className="text-[12px] text-[#2a1b57]">Promotion / campaign: <span className="font-semibold text-[#1b1140]">{preview.promo.name}</span></p>
            ) : preview.membership ? (
              <p className="text-[12px] text-[#2a1b57]">Membership: <span className="font-semibold text-[#1b1140]">{preview.membership.name}</span>{preview.membership.note ? ` — ${preview.membership.note}` : ''}</p>
            ) : (
              <p className="text-[12px] text-[#2a1b57]">No related booking for this transaction.</p>
            )}
          </section>

          <Notes txn={t} preview={preview} onSave={onSaveNote} />
        </div>
      )}
    </aside>
  )
}
