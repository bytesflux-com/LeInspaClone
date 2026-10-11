import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CalendarDays, CreditCard, FileText, Lock, Send, TriangleAlert, Users, X } from 'lucide-react'
import Skeleton from '../../ui/Skeleton'
import { CaseStatusPill, CaseTile } from './SupportBadges'
import { ASSIGNEES, PRIORITY_STYLE, UNRESOLVED } from '../../../constants/clientSupport'
import { formatFullStamp } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const CARD = 'rounded-xl border border-[#e6e1f3] bg-white p-3'
const H3 = 'mb-2 text-[15px] font-bold text-[#1b1140]'
const OUTLINE = 'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-3 text-[12.5px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]'
const SMALL_OUTLINE = 'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-2.5 text-[11.5px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]'
const money = (cur, n) => (typeof n === 'number' ? `${cur} ${n.toLocaleString('en-US')}` : `${cur} —`)
const TITLES = { support: 'Support Case', dispute: 'Dispute', safety: 'Safety Case', report: 'Report' }

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[11.5px] text-[#2a1b57]">{label}</p>
      <div className="mt-0.5 text-[12.5px] font-semibold text-[#1b1140]">{children}</div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <li className="grid grid-cols-[118px_1fr] items-center gap-2 border-b border-[#efecf7] py-[6px] text-[12px] last:border-b-0">
      <span className="text-[#2a1b57]">{label}</span>
      <span className="min-w-0 font-semibold text-[#1b1140]">{children}</span>
    </li>
  )
}

// Vertical timeline generated from the real case events.
function Timeline({ events, timeZone }) {
  return (
    <ol>
      {events.map((e, i) => {
        const last = i === events.length - 1
        return (
          <li key={e.id} className="relative pb-2.5 pl-6 last:pb-0">
            {!last && <span className="absolute top-[14px] bottom-[-2px] left-[5px] w-[1.5px] bg-[#c9bdf4]" aria-hidden="true" />}
            <span className="absolute top-[3px] left-0 size-[11px] rounded-full bg-[#4527c8] ring-[3px] ring-[#e4defb]" aria-hidden="true" />
            <p className="text-[11.5px] leading-tight text-[#2a1b57]">{formatFullStamp(e.at, timeZone)}</p>
            <p className="text-[12px] leading-snug font-medium text-[#1b1140]">{e.text}</p>
          </li>
        )
      })}
    </ol>
  )
}

function RelatedRecords({ related, currency, links }) {
  const { booking, payment } = related
  if (!booking && !payment) return null
  return (
    <section className={CARD}>
      <h3 className={H3}>Related Records</h3>
      <div className="space-y-3">
        {booking && (
          <div className="flex items-center gap-2.5">
            <span className="flex size-[38px] shrink-0 items-center justify-center rounded-lg bg-[#4125d0]" aria-hidden="true"><CalendarDays className="size-5 text-white" /></span>
            <div className="min-w-0 flex-1 leading-snug">
              <p className="text-[11.5px] text-[#2a1b57]">Booking</p>
              <p className="text-[13px] font-bold text-[#1b1140]">#{booking.id}</p>
              <p className="truncate text-[11px] text-[#2a1b57]">{booking.service}</p>
            </div>
            <Link to={links.booking(booking.id)} state={links.state} className={SMALL_OUTLINE}>View Booking <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
          </div>
        )}
        {payment && (
          <div className="flex items-center gap-2.5">
            <span className="flex size-[38px] shrink-0 items-center justify-center rounded-lg bg-[#e8473b]" aria-hidden="true"><CreditCard className="size-5 text-white" /></span>
            <div className="min-w-0 flex-1 leading-snug">
              <p className="text-[11.5px] text-[#2a1b57]">Payment</p>
              <p className="text-[13px] font-bold text-[#1b1140]">{payment.id}</p>
              <p className="truncate text-[11px] text-[#2a1b57]">{money(currency, payment.amount)} • {payment.method}</p>
            </div>
            <Link to={links.payment(payment.id)} state={links.state} className={SMALL_OUTLINE}>View Payment <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
          </div>
        )}
      </div>
    </section>
  )
}

function Header({ type, onClose }) {
  return (
    <header className="mb-3 flex items-center justify-between">
      <h2 className="text-[22px] font-bold tracking-tight text-[#1b1140]">{TITLES[type]}</h2>
      <button type="button" onClick={onClose} aria-label="Close case details" className="rounded-lg p-1 text-[#1b1140] transition hover:bg-[#f1edff]"><X className="size-5" /></button>
    </header>
  )
}

function Identity({ c, tz }) {
  return (
    <div className="flex items-center gap-3">
      <CaseTile type={c.type} status={c.status} size={64} className="!rounded-2xl" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[22px] leading-tight font-bold text-[#1b1140]">{c.id}</p>
          <CaseStatusPill status={c.status} />
        </div>
        <p className="mt-1 text-[12.5px] text-[#2a1b57]">{c.type === 'report' ? 'Submitted' : 'Opened'} {formatFullStamp(c.openedAt, tz)}</p>
      </div>
    </div>
  )
}

const assignedLabel = (c) => (c.assignedTeam && c.assignedTo !== c.assignedTeam ? `${c.assignedTo} – ${c.assignedTeam}` : c.assignedTo)

// ---------- support ----------

function Conversation({ p, tz, replyFocus, onReply }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const ref = useRef(null)
  useEffect(() => {
    if (replyFocus) ref.current?.focus()
  }, [replyFocus])

  const send = async () => {
    if (!text.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      await onReply(text.trim())
      setText('')
    } catch (err) {
      setError(err?.message || 'Unable to send the reply.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2.5">
      <section className={CARD}>
        <h3 className={H3}>Conversation</h3>
        <ul className="space-y-2.5">
          {p.conversation.map((m) => (
            <li key={m.id} className={cn('rounded-xl px-3 py-2', m.from === 'client' ? 'bg-[#f4f1fc]' : 'bg-[#e8f0ff]')}>
              <p className="text-[11px] font-semibold text-[#2a1b57]">{m.from === 'client' ? 'Client:' : 'Admin response:'} <span className="font-normal text-[#4a4466]">{formatFullStamp(m.at, tz)}</span></p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-[#1b1140]">{m.text}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className={CARD}>
        <h3 className={H3}>Reply to Client</h3>
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Write a reply the client will see…"
          aria-label="Reply to client"
          className="w-full resize-none rounded-lg border border-[#d9d3ee] bg-[#faf9fe] p-2.5 text-[12px] text-[#1b1140] placeholder:text-[#4a4466] focus:border-[#7a5cf0] focus:bg-white focus:outline-none"
        />
        {error && <p role="alert" className="mt-1 text-[11px] text-[#b91c1c]">{error}</p>}
        <button type="button" onClick={send} disabled={!text.trim() || busy} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#3b1fd6] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3119b8] disabled:cursor-not-allowed disabled:opacity-60">
          <Send className="size-4" aria-hidden="true" /> {busy ? 'Sending…' : 'Send Reply'}
        </button>
        <p className="mt-1.5 text-[10.5px] leading-snug text-[#4a4466]">Sent through the support messaging. Internal notes are never included in client messages.</p>
      </section>
    </div>
  )
}

function InternalNotes({ p, tz, noteFocus, onNote }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const ref = useRef(null)
  useEffect(() => {
    if (noteFocus) ref.current?.focus()
  }, [noteFocus])

  const save = async () => {
    if (!text.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      await onNote(text.trim())
      setText('')
    } catch (err) {
      setError(err?.message || 'Unable to save the note.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={CARD}>
      <h3 className={H3}>Internal Admin Notes</h3>
      {p.notes.length === 0 ? (
        <p className="mb-2 text-[12px] text-[#4a4466]">No internal notes on this case yet.</p>
      ) : (
        <ul className="mb-2.5 space-y-1.5">
          {p.notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-[#fff8e6] px-2.5 py-2 text-[12px] text-[#1b1140]">
              {n.text}
              <span className="mt-0.5 block text-[10.5px] text-[#4a4466]">Added by: {n.author} • {formatFullStamp(n.createdAt, tz)}</span>
            </li>
          ))}
        </ul>
      )}
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Add internal note…"
        aria-label="Internal note"
        className="w-full resize-none rounded-lg border border-[#d9d3ee] bg-[#faf9fe] p-2.5 text-[12px] text-[#1b1140] placeholder:text-[#4a4466] focus:border-[#7a5cf0] focus:bg-white focus:outline-none"
      />
      {error && <p role="alert" className="mt-1 text-[11px] text-[#b91c1c]">{error}</p>}
      <button type="button" onClick={save} disabled={!text.trim() || busy} className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-[#4125d0] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3719b8] disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? 'Saving…' : 'Save Note'}
      </button>
      <p className="mt-1.5 flex items-center gap-1 text-[10.5px] leading-snug text-[#4a4466]"><Lock className="size-3 shrink-0" aria-hidden="true" /> The client can never see internal notes.</p>
    </section>
  )
}

function SupportBody({ c, p, client, links, tz, actions }) {
  const [tab, setTab] = useState('overview')
  const [replyFocus, setReplyFocus] = useState(0)
  const [noteFocus, setNoteFocus] = useState(0)
  const [menu, setMenu] = useState(null) // 'reassign' | 'escalate' | null
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const open = UNRESOLVED.includes(c.status)

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      setMenu(null)
    } catch (err) {
      setError(err?.message || 'That action could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  const TABS = [['overview', 'Overview'], ['conversation', 'Conversation'], ['notes', 'Internal Notes']]
  return (
    <>
      <div role="tablist" aria-label="Case sections" className="mt-3 grid grid-cols-3 gap-1.5">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn('h-[34px] rounded-lg text-[12px] font-medium transition', tab === id ? 'bg-[#3b1fd6] text-white shadow-sm' : 'bg-[#efebfc] text-[#1b1140] hover:bg-[#e4defb]')}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-2.5 space-y-2.5">
        {tab === 'overview' && (
          <>
            <section className={CARD}>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <Field label="Issue"><span className="text-[14px]">{p.subject}</span></Field>
                <Field label="Priority">
                  <span className={cn('inline-flex rounded-md px-2.5 py-[4px] text-[11.5px] font-medium', p.priority === 'normal' || p.priority === 'low' ? 'bg-[#e4defb] text-[#3b1fd6]' : 'bg-[#fde2e2] text-[#dc2626]')}>{PRIORITY_STYLE[p.priority]?.label}</span>
                </Field>
                <Field label="Client">{client.name} ({client.id})</Field>
                <Field label="Opened">{formatFullStamp(p.openedAt, tz)}</Field>
                <Field label="Assigned To">{assignedLabel(p)}</Field>
                <Field label="Status"><CaseStatusPill status={p.status} className="!py-[4px] !text-[11px]" /></Field>
              </div>
            </section>
            <RelatedRecords related={p.related} currency={client.currency} links={links} />
            <section className={CARD}>
              <h3 className={H3}>Case Timeline</h3>
              <Timeline events={p.timeline} timeZone={tz} />
            </section>
          </>
        )}
        {tab === 'conversation' && <Conversation p={p} tz={tz} replyFocus={replyFocus} onReply={actions.reply} />}
        {tab === 'notes' && <InternalNotes p={p} tz={tz} noteFocus={noteFocus} onNote={actions.note} />}
      </div>

      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={() => {
            setTab('conversation')
            setReplyFocus((n) => n + 1)
          }}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#3b1fd6] text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#3119b8]"
        >
          <Send className="size-4" aria-hidden="true" /> Reply to Client
        </button>
        <div className="grid grid-cols-2 gap-2">
          {open ? (
            <button type="button" onClick={() => setMenu((m) => (m === 'reassign' ? null : 'reassign'))} aria-expanded={menu === 'reassign'} className={OUTLINE}>
              <Users className="size-4" aria-hidden="true" /> Reassign Case
            </button>
          ) : (
            <span className={cn(OUTLINE, 'cursor-not-allowed opacity-50')} aria-disabled="true"><Users className="size-4" aria-hidden="true" /> Reassign Case</span>
          )}
          <button
            type="button"
            onClick={() => {
              setTab('notes')
              setNoteFocus((n) => n + 1)
            }}
            className={OUTLINE}
          >
            <FileText className="size-4" aria-hidden="true" /> Add Internal Note
          </button>
        </div>

        {menu === 'reassign' && (
          <ul className="rounded-xl border border-[#e6e1f3] bg-white p-1.5 shadow-md" aria-label="Reassign to">
            {ASSIGNEES.map((a) => (
              <li key={a.id}>
                <button type="button" disabled={busy} onClick={() => run(() => actions.reassign(a.name))} className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[12.5px] text-[#2a1b57] hover:bg-[#f4f1fc] disabled:opacity-60">
                  {a.name} — {a.team}{p.assignedTo === a.name && <span className="text-[11px] text-[#4a4466]">Current</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {open && menu !== 'escalate' && (
          <button type="button" onClick={() => setMenu('escalate')} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-[#e03a3a] bg-white text-[13px] font-semibold text-[#dc2626] transition hover:bg-[#fff1f1]">
            <TriangleAlert className="size-4" aria-hidden="true" /> Escalate Case
          </button>
        )}
        {menu === 'escalate' && (
          <div role="alertdialog" aria-label="Confirm escalation" className="rounded-xl border border-[#f5c2c2] bg-[#fff1f1] p-3">
            <p className="text-[12.5px] leading-snug text-[#1b1140]">Escalate <strong>{c.id}</strong> to the Support Lead? Priority becomes High and the escalation is recorded on the case timeline.</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setMenu(null)} className={OUTLINE}>Cancel</button>
              <button type="button" disabled={busy} onClick={() => run(actions.escalate)} className="inline-flex h-10 items-center justify-center rounded-lg bg-[#dc2626] text-[12.5px] font-semibold text-white transition hover:bg-[#b91c1c] disabled:opacity-60">{busy ? 'Escalating…' : 'Escalate'}</button>
            </div>
          </div>
        )}
        {error && <p role="alert" className="rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">{error}</p>}
      </div>
    </>
  )
}

// ---------- dispute / safety / report (preview only — the real work happens in the dedicated workflows) ----------

function DisputeBody({ p, client, links, tz }) {
  const d = p.dispute
  return (
    <div className="mt-3 space-y-2.5">
      <section className={CARD}>
        <h3 className={H3}>Dispute Details</h3>
        <ul>
          <Row label="Booking">{p.related.booking ? `#${p.related.booking.id}` : '—'}</Row>
          <Row label="Issue">{d.issue}</Row>
          <Row label="Amount involved">{d.amount === undefined ? <span className="inline-flex items-center gap-1 text-[#4a4466]"><Lock className="size-3" aria-hidden="true" /> Restricted</span> : money(client.currency, d.amount)}</Row>
          <Row label="Escrow"><span className="inline-flex items-center gap-1.5 rounded-md bg-[#e4defb] px-2 py-[3px] text-[11.5px] font-medium text-[#3b1fd6]"><span className="size-2 rounded-full bg-[#4527c8]" aria-hidden="true" />Held</span></Row>
          <Row label="Status"><CaseStatusPill status={p.status} className="!py-[4px] !text-[11px]" /></Row>
          <Row label="Assigned">{assignedLabel(p)}</Row>
          <Row label="Submitted">{formatFullStamp(d.submittedAt, tz)}</Row>
        </ul>
      </section>
      <RelatedRecords related={p.related} currency={client.currency} links={links} />
      <section className={CARD}><h3 className={H3}>Dispute Timeline</h3><Timeline events={p.timeline} timeZone={tz} /></section>
      <Link to={links.dispute(p.id)} state={links.state} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#3b1fd6] text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#3119b8]">View Dispute <ArrowRight className="size-4" aria-hidden="true" /></Link>
      <p className="px-1 text-[10.5px] leading-snug text-[#4a4466]">Disputes are reviewed and resolved in the dedicated dispute workflow — never from this history page.</p>
    </div>
  )
}

function SafetyBody({ p, links, tz }) {
  const s = p.safety
  return (
    <div className="mt-3 space-y-2.5">
      <p className="flex items-start gap-2 rounded-xl border border-[#f5c2c2] bg-[#fff1f1] px-3 py-2 text-[11.5px] leading-snug text-[#7f1d1d]">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> Sensitive case. Visible to Trust &amp; Safety roles only; this access has been logged.
      </p>
      <section className={cn(CARD, 'border-[#f5c2c2]')}>
        <h3 className={H3}>Safety Case Preview</h3>
        <ul>
          <Row label="Case ID">{p.id}</Row>
          <Row label="Severity"><span className="rounded-md bg-[#fde2e2] px-2 py-[3px] text-[11.5px] font-semibold text-[#dc2626]">{s.severity}</span></Row>
          <Row label="Category">{s.category}</Row>
          <Row label="Related Booking">{p.related.booking ? `#${p.related.booking.id}` : '—'}</Row>
          <Row label="Reporting Party">{s.reportingParty}</Row>
          <Row label="Reported Party">{s.reportedParty}</Row>
          <Row label="Evidence Status">{s.evidenceStatus}</Row>
          <Row label="Investigator">{s.investigator}</Row>
          <Row label="Case Status"><CaseStatusPill status={p.status} className="!py-[4px] !text-[11px]" /></Row>
          <Row label="Actions Taken">{s.actionsTaken}</Row>
          <Row label="Outcome">{s.outcome}</Row>
        </ul>
      </section>
      <section className={CARD}><h3 className={H3}>Case Timeline</h3><Timeline events={p.timeline} timeZone={tz} /></section>
      <Link to={links.safety(p.id)} state={links.state} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#3b1fd6] text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#3119b8]">Open Full Investigation <ArrowRight className="size-4" aria-hidden="true" /></Link>
      <p className="px-1 text-[10.5px] leading-snug text-[#4a4466]">Detailed evidence and allegations stay in the Trust &amp; Safety investigation workflow, not here.</p>
    </div>
  )
}

function ReportBody({ p, links, tz }) {
  const r = p.report
  return (
    <div className="mt-3 space-y-2.5">
      <section className={CARD}>
        <h3 className={H3}>Report Details</h3>
        <ul>
          <Row label="Report type">{r.kind}</Row>
          <Row label="Provider">{r.providerName ? `${r.providerName} (#${r.providerId})` : `#${r.providerId}`}</Row>
          <Row label="Reason category">{r.reason}</Row>
          <Row label="Submitted">{formatFullStamp(r.submittedAt, tz)}</Row>
          <Row label="Status"><CaseStatusPill status={p.status} className="!py-[4px] !text-[11px]" /></Row>
          <Row label="Outcome">{r.outcome}</Row>
        </ul>
        {r.providerId && <Link to={links.provider(r.providerId)} state={links.state} className={cn(SMALL_OUTLINE, 'mt-2 w-full')}>View Provider <ArrowRight className="size-3.5" aria-hidden="true" /></Link>}
      </section>
      <section className={CARD}><h3 className={H3}>Report Timeline</h3><Timeline events={p.timeline} timeZone={tz} /></section>
      <Link to={links.report(p.id)} state={links.state} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#3b1fd6] text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#3119b8]">View Report <ArrowRight className="size-4" aria-hidden="true" /></Link>
      <p className="px-1 text-[10.5px] leading-snug text-[#4a4466]">A report is an allegation and an input for review — not proof.</p>
    </div>
  )
}

export default function SupportDrawer({ item, preview, loading, error, client, links, onClose, actions }) {
  const ready = !loading && preview
  const tz = client.timeZone
  const c = preview || item
  return (
    <aside aria-label={`${TITLES[item.type]} details`} className="rounded-xl border border-[#e6e1f3] bg-white p-3.5 shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)]">
      <Header type={item.type} onClose={onClose} />
      <Identity c={c} tz={tz} />

      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-[#fff1f1] p-3 text-[12px] text-[#b91c1c]">{error}</p>
      ) : !ready ? (
        <div className="mt-3 space-y-2.5" aria-busy="true" aria-label="Loading case details">
          <Skeleton className="h-[34px] rounded-lg" />
          <Skeleton className="h-[170px] rounded-xl" />
          <Skeleton className="h-[130px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
      ) : preview.type === 'support' ? (
        <SupportBody key={preview.id} c={item} p={preview} client={client} links={links} tz={tz} actions={actions} />
      ) : preview.type === 'dispute' ? (
        <DisputeBody p={preview} client={client} links={links} tz={tz} />
      ) : preview.type === 'safety' ? (
        <SafetyBody p={preview} links={links} tz={tz} />
      ) : (
        <ReportBody p={preview} links={links} tz={tz} />
      )}
    </aside>
  )
}
