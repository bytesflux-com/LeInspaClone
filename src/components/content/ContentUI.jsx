import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  Eye,
  History,
  ImageOff,
  Maximize2,
  RotateCw,
  ShieldAlert,
  StickyNote,
  UserRoundCheck,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { CARD, StatePill } from '../bookings/OpsUI'
import { CONTENT_STATUS, DECISION_COPY } from '../../constants/contentModeration'
import { contentModerationService } from '../../services/contentModerationService'
import { formatFullStamp, timeZoneFor } from '../../lib/profileFormat'
import { cn } from '../../lib/utils'

export { CARD }
export const StatusPill = ({ value, className }) => <StatePill map={CONTENT_STATUS} value={value} className={className} />
export const stamp = (iso, countryCode) => (iso ? formatFullStamp(iso, timeZoneFor(countryCode)) : '—')

export function Card({ title, icon: Icon, action, children, className, bodyClass }) {
  return (
    <section className={cn(CARD, 'flex flex-col', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-2 border-b border-[#f0edf8] px-3.5 py-2.5">
          <h3 className="flex items-center gap-2 text-[13.5px] font-bold text-[#1b1140]">
            {Icon && <Icon className="size-4 text-[#4527c8]" aria-hidden="true" />}
            {title}
          </h3>
          {action}
        </header>
      )}
      <div className={cn('flex-1 px-3.5 py-2.5', bodyClass)}>{children}</div>
    </section>
  )
}

export function Rows({ rows }) {
  return (
    <dl className="divide-y divide-[#f3f1f9]">
      {rows.filter(Boolean).map(([k, v]) => (
        <div key={k} className="grid grid-cols-[120px_1fr] gap-2 py-[5px] text-[12px]">
          <dt className="text-[#4a4466]">{k}</dt>
          <dd className="min-w-0 font-medium text-[#1b1140]">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

// Large media viewer: zoom, rotate, fullscreen, optional prev/next + strip.
export function MediaViewer({ items, index = 0, onIndex, height = 'h-[360px]', footer, showStrip = true }) {
  const [zoom, setZoom] = useState(1)
  const [rotate, setRotate] = useState(0)
  const frame = useRef(null)
  const item = items[index]
  useEffect(() => {
    setZoom(1)
    setRotate(0)
  }, [index, item?.url])

  const btn = 'flex size-8 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15'
  const full = () => {
    const el = frame.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen?.()
    else el.requestFullscreen?.()
  }

  return (
    <div className="space-y-2">
      <div ref={frame} className={cn('relative overflow-hidden rounded-xl bg-[#1b1140]', height, '[&:fullscreen]:h-screen')}>
        {item?.url ? (
          <img
            src={item.url}
            alt={item.title || 'Submitted content'}
            className="size-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom}) rotate(${rotate}deg)` }}
            draggable={false}
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-white/70"><ImageOff className="size-8" /><span className="text-[12px]">No media attached</span></div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-0.5 rounded-xl bg-black/45 p-1 backdrop-blur">
          <button type="button" className={btn} onClick={() => setZoom((z) => Math.min(3, z + 0.25))} aria-label="Zoom in"><ZoomIn className="size-4" /></button>
          <button type="button" className={btn} onClick={() => setZoom((z) => Math.max(1, z - 0.25))} aria-label="Zoom out"><ZoomOut className="size-4" /></button>
          <button type="button" className={btn} onClick={() => setRotate((r) => (r + 90) % 360)} aria-label="Rotate"><RotateCw className="size-4" /></button>
          <button type="button" className={btn} onClick={full} aria-label="Full screen"><Maximize2 className="size-4" /></button>
        </div>
        {items.length > 1 && (
          <>
            <span className="absolute top-2 right-2 rounded-lg bg-black/45 px-2 py-1 text-[11.5px] font-semibold text-white backdrop-blur">{index + 1} / {items.length}</span>
            <button type="button" onClick={() => onIndex?.((index - 1 + items.length) % items.length)} aria-label="Previous" className="absolute top-1/2 left-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"><ChevronLeft className="size-5" /></button>
            <button type="button" onClick={() => onIndex?.((index + 1) % items.length)} aria-label="Next" className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"><ChevronRight className="size-5" /></button>
          </>
        )}
      </div>
      {footer}
      {showStrip && items.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {items.map((m, i) => (
            <button key={m.mediaId || i} type="button" onClick={() => onIndex?.(i)} className={cn('relative size-14 shrink-0 overflow-hidden rounded-lg ring-2 transition', i === index ? 'ring-[#4125d0]' : 'ring-transparent opacity-80 hover:opacity-100')}>
              <img src={m.url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Moderator-completed policy checklist (rules come from the backend policy).
export function PolicyChecklist({ checklist, value, onChange, readOnly }) {
  const passed = checklist.filter((c) => value[c.id] === 'pass').length
  return (
    <div>
      <ul className="space-y-1">
        {checklist.map((c) => {
          const v = value[c.id]
          return (
            <li key={c.id} className="flex items-center justify-between gap-2 text-[12px]">
              <span className="flex min-w-0 items-center gap-2 text-[#1b1140]">
                <CircleCheck className={cn('size-4 shrink-0', v === 'pass' ? 'fill-[#22a652] text-white' : v === 'fail' ? 'text-[#e03a3a]' : 'text-[#c9c5d8]')} aria-hidden="true" />
                <span className="leading-snug">{c.label}</span>
              </span>
              {readOnly ? (
                <span className={cn('rounded-md px-1.5 py-0.5 text-[10.5px] font-bold', v === 'pass' ? 'bg-[#dcf6e4] text-[#15803d]' : v === 'fail' ? 'bg-[#fde4e4] text-[#dc2626]' : 'bg-[#eceef3] text-[#6b6785]')}>{v === 'pass' ? 'Pass' : v === 'fail' ? 'Fail' : '—'}</span>
              ) : (
                <span className="flex shrink-0 overflow-hidden rounded-md border border-[#ddd7ee]" role="group" aria-label={c.label}>
                  {['pass', 'fail'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={v === opt}
                      onClick={() => onChange({ ...value, [c.id]: v === opt ? undefined : opt })}
                      className={cn('px-2 py-0.5 text-[10.5px] font-bold transition', v === opt ? (opt === 'pass' ? 'bg-[#22a652] text-white' : 'bg-[#e03a3a] text-white') : 'bg-white text-[#4a4466] hover:bg-[#f4f1fc]')}
                    >
                      {opt === 'pass' ? 'Pass' : 'Fail'}
                    </button>
                  ))}
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <p className={cn('mt-2 text-[11px] font-semibold', passed === checklist.length ? 'text-[#15803d]' : 'text-[#6b6785]')}>{passed} of {checklist.length} checks passed</p>
    </div>
  )
}

const ACTION_STYLE = {
  approve: 'border-[#15803d] bg-[#15803d] text-white hover:bg-[#126c34]',
  request_changes: 'border-[#f0a35c] bg-[#fff6ec] text-[#b45309] hover:bg-[#ffecd6]',
  reject: 'border-[#f2a3a3] bg-[#fff1f1] text-[#b91c1c] hover:bg-[#fde4e4]',
  escalate: 'border-[#b9a9f0] bg-[#f4f0ff] text-[#4527c8] hover:bg-[#ece5fd]',
}

export function ReviewActions({ onAction, disabled, labels = {}, approveHint }) {
  return (
    <div className="space-y-2">
      {['approve', 'request_changes', 'reject', 'escalate'].map((d) => (
        <button key={d} type="button" disabled={disabled} onClick={() => onAction(d)} className={cn('flex h-10 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45', ACTION_STYLE[d])}>
          {labels[d] || DECISION_COPY[d].title}
        </button>
      ))}
      {approveHint && <p className="text-[11px] text-[#6b6785]">{approveHint}</p>}
    </div>
  )
}

export function Placements({ items }) {
  if (!items?.length) return <p className="text-[12px] text-[#6b6785]">No public placements recorded.</p>
  return (
    <ul className="space-y-1.5">
      {items.map((p) => (
        <li key={p} className="flex items-center gap-2 text-[12px] text-[#1b1140]"><CircleCheck className="size-4 fill-[#22a652] text-white" aria-hidden="true" />{p}</li>
      ))}
    </ul>
  )
}

export function QualityList({ quality }) {
  if (!quality?.length) return <p className="text-[12px] text-[#6b6785]">Image metadata unavailable.</p>
  return (
    <ul className="divide-y divide-[#f3f1f9]">
      {quality.map((q) => (
        <li key={q.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-[5px] text-[12px]">
          <span className="text-[#4a4466]">{q.label}</span>
          <span className="font-medium text-[#1b1140]">{q.value}</span>
          <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold', q.state === 'good' ? 'bg-[#dcf6e4] text-[#15803d]' : q.state === 'fair' ? 'bg-[#ffecd6] text-[#b45309]' : 'bg-[#fde4e4] text-[#dc2626]')}>
            {q.state === 'good' && <Check className="size-3" strokeWidth={3} />}{q.note}
          </span>
        </li>
      ))}
    </ul>
  )
}

// Every earlier version stays visible — moderation evidence is never overwritten.
export function VersionHistory({ current, versions, countryCode }) {
  const [compare, setCompare] = useState(false)
  const all = [{ ...current, isCurrent: true }, ...versions]
  return (
    <Card title="Previous Versions" icon={History} action={versions.length > 0 && <button type="button" onClick={() => setCompare((c) => !c)} className="rounded-lg border border-[#b9a9f0] px-2.5 py-1 text-[11.5px] font-semibold text-[#4527c8] hover:bg-[#f4f0ff]">{compare ? 'Close Compare' : 'Compare Versions'}</button>}>
      {compare ? (
        <div className="grid grid-cols-2 gap-2">
          {all.slice(0, 2).map((v) => (
            <figure key={v.version} className="space-y-1">
              {v.url ? <img src={v.url} alt={`Version ${v.version}`} className="aspect-square w-full rounded-lg object-cover" /> : <div className="flex aspect-square items-center justify-center rounded-lg bg-[#f3f1fb] text-[11px] text-[#6b6785]">No image</div>}
              <figcaption className="text-[11px] font-semibold text-[#1b1140]">Version {v.version}{v.isCurrent ? ' (Current)' : ''}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {all.map((v) => (
            <li key={v.version} className="flex items-center gap-2.5 rounded-lg border border-[#f0edf8] p-1.5">
              {v.url ? <img src={v.url} alt="" className="size-11 shrink-0 rounded-md object-cover" /> : <span className="size-11 shrink-0 rounded-md bg-[#f3f1fb]" />}
              <div className="min-w-0 flex-1 text-[11.5px] leading-snug">
                <p className="font-semibold text-[#1b1140]">Version {v.version}{v.isCurrent ? ' (Current)' : ''}</p>
                <p className="text-[#6b6785]">{stamp(v.submittedAt, countryCode)}</p>
                {v.reason && <p className="text-[#b45309]">Reason: {v.reason}</p>}
              </div>
              <StatusPill value={v.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function ReviewHistory({ history, countryCode, limit = 6 }) {
  const [all, setAll] = useState(false)
  const items = all ? history : history.slice(0, limit)
  return (
    <Card title="Review History" icon={History} action={history.length > limit && <button type="button" onClick={() => setAll((a) => !a)} className="text-[11.5px] font-semibold text-[#4527c8] hover:underline">{all ? 'Show Less' : 'View All →'}</button>}>
      {items.length === 0 ? <p className="text-[12px] text-[#6b6785]">No moderation events yet.</p> : (
        <ol className="relative space-y-2.5 pl-4 before:absolute before:top-1.5 before:bottom-1.5 before:left-[5px] before:w-0.5 before:bg-[#e4defb]">
          {items.map((h, i) => (
            <li key={`${h.at}-${i}`} className="relative text-[11.5px] leading-snug">
              <span className="absolute top-1 -left-4 size-3 rounded-full border-2 border-white bg-[#6d3fe0] shadow" aria-hidden="true" />
              <p className="text-[#6b6785]">{stamp(h.at, countryCode)}</p>
              <p className="font-medium text-[#1b1140]">{h.event}</p>
              {h.actor?.name && <p className="text-[#6b6785]">by {h.actor.name}</p>}
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

// Internal notes are never shown to the provider.
export function NotesCard({ moderationId, notes, countryCode, onAdded }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await contentModerationService.addNote({ moderationId, text })
      setText('')
      setOpen(false)
      onAdded?.()
    } catch (err) {
      setError(err?.message || 'Unable to save the note.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card title="Internal Moderation Notes" icon={StickyNote} action={!open && <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-[#b9a9f0] px-2.5 py-1 text-[11.5px] font-semibold text-[#4527c8] hover:bg-[#f4f0ff]">Add Note</button>}>
      {open && (
        <div className="mb-2 space-y-1.5">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Visible to admins only…" className="w-full rounded-lg border border-[#ddd7ee] px-2.5 py-2 text-[12px] focus:border-[#7a5cf0] focus:outline-none" />
          {error && <p role="alert" className="text-[11px] text-[#b91c1c]">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="h-8 rounded-lg px-3 text-[12px] font-semibold text-[#4a4466] hover:bg-[#f4f1fc]">Cancel</button>
            <button type="button" disabled={busy || text.trim().length < 3} onClick={save} className="h-8 rounded-lg bg-[#4125d0] px-3 text-[12px] font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save Note'}</button>
          </div>
        </div>
      )}
      {notes.length === 0 && !open ? <p className="text-[12px] text-[#6b6785]">No internal notes yet.</p> : (
        <ul className="space-y-2">
          {notes.map((n, i) => (
            <li key={`${n.createdAt}-${i}`} className="rounded-lg bg-[#faf9fe] p-2 text-[12px]">
              <p className="text-[#1b1140]">{n.text}</p>
              <p className="mt-0.5 text-[10.5px] text-[#6b6785]">Added by {n.authorName} · {stamp(n.createdAt, countryCode)}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[10.5px] text-[#6b6785]">Internal notes are never shown to the provider.</p>
    </Card>
  )
}

export function ProviderHistory({ stats, providerId }) {
  if (!stats) return null
  return (
    <Card title="Provider Content History" icon={UserRoundCheck} action={providerId && <Link to={`/providers/${providerId}`} className="text-[11.5px] font-semibold text-[#4527c8] hover:underline">View Full History →</Link>}>
      <dl className="grid grid-cols-4 gap-2 text-center">
        {[['Approved', stats.approved, 'text-[#15803d]'], ['Changes', stats.changesRequested, 'text-[#b45309]'], ['Rejected', stats.rejected, 'text-[#b91c1c]'], ['Escalated', stats.escalated, 'text-[#4527c8]']].map(([l, n, c]) => (
          <div key={l} className="rounded-lg bg-[#faf9fe] py-1.5"><dd className={cn('text-[16px] font-bold', c)}>{n}</dd><dt className="text-[10.5px] text-[#6b6785]">{l}</dt></div>
        ))}
      </dl>
      <p className="mt-1.5 text-[10.5px] text-[#6b6785]">Context only — judge this submission on its own evidence.</p>
    </Card>
  )
}

const field = 'w-full rounded-lg border border-[#ddd7ee] bg-white px-2.5 py-2 text-[12.5px] text-[#1b1140] focus:border-[#7a5cf0] focus:outline-none'

// Decision dialog for Approve / Request Changes / Reject / Escalate.
// `target` is a gallery media item (item-level) or null (whole content).
export function DecisionDialog({ decision, review, target, checks, onClose, onDone, bulkItems }) {
  const copy = DECISION_COPY[decision]
  const reasons = decision === 'request_changes' ? review.reasons.changes : decision === 'reject' ? review.reasons.reject : review.reasons.escalate
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [note, setNote] = useState('')
  const [team, setTeam] = useState('trust_safety')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const subject = bulkItems ? `${bulkItems.length} selected media items` : target ? target.title : review.contentLabel
  const checklist = target ? target.checklist : review.checklist
  const passed = checklist.filter((c) => checks?.[c.id] === 'pass').length

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async () => {
    setBusy(true)
    setError(null)
    const base = { moderationId: review.id, version: review.version, decision, reason: reason || null, providerMessage: message || null, internalNote: note || null, escalateTo: decision === 'escalate' ? team : null }
    try {
      if (bulkItems) await contentModerationService.bulkMediaDecision({ ...base, items: bulkItems.map((m) => ({ mediaId: m.mediaId, version: m.version })) })
      else await contentModerationService.decide({ ...base, checks, ...(target ? { mediaId: target.mediaId, mediaVersion: target.version } : {}) })
      onDone(decision)
    } catch (err) {
      setError(err?.message || 'The decision could not be saved.')
      setBusy(false)
    }
  }

  const impact = {
    approve: 'The approved version becomes eligible to appear publicly according to Lé Inspa publishing rules.',
    request_changes: 'The provider is asked to correct and resubmit. This is not a rejection.',
    reject: target || bulkItems ? 'These media items will not appear publicly. Other approved gallery images are unaffected.' : 'This content will not be displayed publicly. It stays in moderation history. The provider account is not suspended.',
    escalate: 'Escalation never suspends the provider. Account-level action goes through Provider Account Actions (ADM-028).',
  }[decision]

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1b1140]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="decision-title">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#f0edf8] px-5 py-3.5">
          <h2 id="decision-title" className="text-[16px] font-bold text-[#1b1140]">{bulkItems && decision === 'approve' ? 'Approve Selected Media' : copy.title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-[#4a4466] hover:bg-[#f4f1fc]"><X className="size-5" /></button>
        </header>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4 text-[12.5px]">
          <Rows rows={[['Content', subject], ['Provider', review.provider.name], !bulkItems && ['Policy checks', `${passed} of ${checklist.length} passed`]]} />
          {bulkItems && decision === 'approve' && (
            <ul className="grid grid-cols-4 gap-1.5">
              {bulkItems.map((m) => <li key={m.mediaId}><img src={m.url} alt={m.title} title={m.title} className="aspect-[4/3] w-full rounded-md object-cover" /></li>)}
            </ul>
          )}
          {decision === 'approve' && !bulkItems && <p className="rounded-lg bg-[#ecfaf1] px-3 py-2 font-semibold text-[#15803d]">Outstanding issues: {passed === checklist.length ? 'None' : `${checklist.length - passed} checks not passed`}</p>}
          {bulkItems && decision === 'approve' && <p className="rounded-lg bg-[#fff6ec] px-3 py-2 text-[#b45309]">Only approve images you have looked at individually. Bulk approval still checks each item's current version.</p>}
          {decision !== 'approve' && (
            <>
              <label className="block space-y-1">
                <span className="font-semibold text-[#1b1140]">{decision === 'reject' ? 'Policy reason' : 'Reason'}</span>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className={field}>
                  <option value="">Select a reason…</option>
                  {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              {decision !== 'escalate' && (
                <label className="block space-y-1">
                  <span className="font-semibold text-[#1b1140]">{decision === 'reject' ? 'Provider-facing explanation' : 'Message to provider'}</span>
                  <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className={field} placeholder={decision === 'request_changes' ? 'e.g. Please upload a clearer image without promotional text or contact information.' : 'Explain clearly why this content cannot be published.'} />
                </label>
              )}
              {decision === 'escalate' && (
                <fieldset className="space-y-1">
                  <legend className="font-semibold text-[#1b1140]">Assign to</legend>
                  <div className="flex gap-2">
                    {Object.entries(review.reasons.teams).map(([id, name]) => (
                      <button key={id} type="button" onClick={() => setTeam(id)} aria-pressed={team === id} className={cn('flex-1 rounded-lg border px-3 py-2 text-[12px] font-semibold', team === id ? 'border-[#4125d0] bg-[#f4f0ff] text-[#4125d0]' : 'border-[#ddd7ee] text-[#2a1b57]')}>{name}</button>
                    ))}
                  </div>
                </fieldset>
              )}
              <label className="block space-y-1">
                <span className="font-semibold text-[#1b1140]">Internal admin note{decision === 'reject' ? '' : ' (optional)'}</span>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={field} placeholder="Hidden from the provider." />
              </label>
            </>
          )}
          <p className="flex items-start gap-1.5 rounded-lg bg-[#faf9fe] px-3 py-2 text-[11.5px] text-[#4a4466]"><ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{impact}</p>
          {error && <p role="alert" className="rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">{error}</p>}
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#f0edf8] px-5 py-3">
          <button type="button" onClick={onClose} className="h-9 rounded-lg px-4 text-[12.5px] font-semibold text-[#4a4466] hover:bg-[#f4f1fc]">Cancel</button>
          <button type="button" disabled={busy} onClick={submit} className={cn('h-9 rounded-lg border-[1.5px] px-4 text-[12.5px] font-semibold disabled:opacity-60', ACTION_STYLE[decision])}>
            {busy ? 'Saving…' : bulkItems && decision === 'approve' ? `Approve ${bulkItems.length} Selected` : copy.cta}
          </button>
        </footer>
      </div>
    </div>
  )
}

export function ProviderAvatarImg({ url, name, size = 56, rounded = 'rounded-full' }) {
  return url ? <img src={url} alt={name} className={cn('shrink-0 object-cover ring-2 ring-white', rounded)} style={{ width: size, height: size }} /> : <span className={cn('flex shrink-0 items-center justify-center bg-[#ece5fd] font-display font-bold text-[#4527c8]', rounded)} style={{ width: size, height: size }}>{String(name || '?').slice(0, 1)}</span>
}

export const Verified = () => <BadgeCheck className="size-4 shrink-0 fill-[#4125d0] text-white" aria-label="Verified provider" />

export { ClipboardCheck, Eye }
