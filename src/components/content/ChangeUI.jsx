import { useEffect, useState } from 'react'
import { ArrowRight, Clock, MapPin, ShieldAlert, Star, X } from 'lucide-react'
import { formatCurrency } from '../../lib/currency'
import { cn } from '../../lib/utils'
import { Rows, Verified } from './ContentUI'

// Word-level difference: added words highlighted, removed words struck through.
export function DiffText({ segments, side }) {
  if (!segments) return null
  return (
    <p className="text-[12.5px] leading-relaxed text-[#1b1140]">
      {segments.map((s, i) => {
        if (s.type === 'same') return <span key={i}>{s.text}</span>
        if (side === 'current' && s.type === 'removed') return <span key={i} className="rounded bg-[#fde4e4] text-[#991b1b] line-through decoration-[#dc2626]/60">{s.text}</span>
        if (side === 'proposed' && s.type === 'added') return <span key={i} className="rounded bg-[#e8f8ee] px-0.5 text-[#14532d]">{s.text}</span>
        return null
      })}
    </p>
  )
}

const asText = (v) => (Array.isArray(v) ? v.join(', ') : v == null || v === '' ? '—' : String(v))

// Current (live) → Proposed (not live) comparison card.
export function Comparison({ current, proposed, diff, listDiff, currentNote, proposedNote, format = asText }) {
  return (
    <div className="grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr]">
      <div className="rounded-xl border border-[#e6e1f3] bg-[#faf9fe]">
        <p className="rounded-t-xl border-b border-[#e6e1f3] bg-[#f1eefb] px-3 py-1.5 text-[12px] font-bold text-[#2a1b57]">Current — Live on Platform</p>
        <div className="min-h-[96px] px-3 py-2.5">
          {diff ? <DiffText segments={diff} side="current" /> : listDiff ? (
            <div className="flex flex-wrap gap-1">{[...listDiff.kept, ...listDiff.removed].map((x) => <span key={x} className={cn('rounded-md px-2 py-0.5 text-[12px]', listDiff.removed.includes(x) ? 'bg-[#fde4e4] text-[#991b1b] line-through' : 'bg-white text-[#1b1140] ring-1 ring-[#e6e1f3]')}>{x}</span>)}</div>
          ) : <p className="text-[12.5px] text-[#1b1140]">{format(current)}</p>}
          {currentNote && <p className="mt-2 text-[10.5px] text-[#6b6785]">{currentNote}</p>}
        </div>
      </div>
      <div className="flex items-center justify-center"><span className="flex size-8 items-center justify-center rounded-full bg-[#4125d0] text-white"><ArrowRight className="size-4" /></span></div>
      <div className="rounded-xl border-[1.5px] border-[#b9a9f0] bg-white">
        <p className="rounded-t-xl border-b border-[#ddd3fa] bg-[#efe9ff] px-3 py-1.5 text-[12px] font-bold text-[#4527c8]">Proposed — Not Live</p>
        <div className="min-h-[96px] px-3 py-2.5">
          {diff ? <DiffText segments={diff} side="proposed" /> : listDiff ? (
            <div className="flex flex-wrap gap-1">{[...listDiff.kept, ...listDiff.added].map((x) => <span key={x} className={cn('rounded-md px-2 py-0.5 text-[12px]', listDiff.added.includes(x) ? 'bg-[#e8f8ee] font-semibold text-[#14532d]' : 'bg-white text-[#1b1140] ring-1 ring-[#e6e1f3]')}>{x}</span>)}</div>
          ) : <p className="text-[12.5px] text-[#1b1140]">{format(proposed)}</p>}
          {proposedNote && <p className="mt-2 text-[10.5px] text-[#6b6785]">{proposedNote}</p>}
        </div>
      </div>
    </div>
  )
}

// Small client-app provider card (current vs proposed preview).
export function ProfilePreviewCard({ title, photoUrl, profile, provider, tone }) {
  return (
    <section className={cn('rounded-2xl border p-3', tone === 'proposed' ? 'border-[#b9a9f0] bg-[#fbf9ff]' : 'border-[#ebe7f6] bg-white')}>
      <p className="mb-2 text-[12.5px] font-bold text-[#1b1140]">{title}</p>
      <div className="flex gap-3">
        {photoUrl ? <img src={photoUrl} alt="" className="size-16 shrink-0 rounded-full object-cover" /> : <span className="size-16 shrink-0 rounded-full bg-[#ece5fd]" />}
        <div className="min-w-0 text-[12px] leading-snug">
          <p className="flex items-center gap-1 text-[14px] font-bold text-[#1b1140]">{profile.displayName || provider.name}{provider.verified && <Verified />}</p>
          {provider.rating != null && <p className="flex items-center gap-1 text-[#1b1140]"><Star className="size-3.5 fill-[#f5b301] text-[#f5b301]" />{provider.rating}{provider.reviews != null && <span className="text-[#6b6785]">({provider.reviews} reviews)</span>}</p>}
          <p className="font-semibold text-[#2a1b57]">{profile.professionalCategory || provider.typeLabel}</p>
          {provider.city && <p className="flex items-center gap-1 text-[#6b6785]"><MapPin className="size-3" />{provider.city}</p>}
          {profile.languages?.length > 0 && <p className="text-[#6b6785]">Speaks {profile.languages.join(', ')}</p>}
        </div>
      </div>
      <p className="mt-2 line-clamp-4 text-[12px] leading-relaxed text-[#2a1b57]">{profile.bio}</p>
      <span className="mt-2.5 flex h-9 items-center justify-center rounded-lg bg-[#4125d0] text-[12.5px] font-semibold text-white">Book a Service</span>
    </section>
  )
}

// Client-app service card + detail preview (ADM-039).
export function ServicePreview({ service, provider, currency }) {
  const price = typeof service.price === 'number' && currency ? formatCurrency(service.price, currency) : '—'
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <figure>
        <figcaption className="mb-1 text-[11.5px] font-semibold text-[#2a1b57]">Service Card (Search Results)</figcaption>
        <div className="flex gap-2.5 rounded-xl border border-[#ebe7f6] bg-white p-2.5 shadow-sm">
          {service.imageUrl ? <img src={service.imageUrl} alt="" className="size-20 shrink-0 rounded-lg object-cover" /> : <span className="size-20 shrink-0 rounded-lg bg-[#f1eefb]" />}
          <div className="min-w-0 space-y-0.5 text-[12px]">
            <p className="text-[14px] font-bold text-[#1b1140]">{service.name}</p>
            {provider.rating != null && <p className="flex items-center gap-1"><Star className="size-3.5 fill-[#f5b301] text-[#f5b301]" />{provider.rating} <span className="text-[#6b6785]">({provider.reviews})</span></p>}
            <p className="flex items-center gap-2 text-[#4a4466]"><span className="inline-flex items-center gap-1"><Clock className="size-3" />{service.durationMins} min</span>{provider.city && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{provider.city}</span>}</p>
            <p className="text-[13px] font-bold text-[#1b1140]">{price}</p>
          </div>
        </div>
      </figure>
      <figure>
        <figcaption className="mb-1 text-[11.5px] font-semibold text-[#2a1b57]">Service Detail (Client App)</figcaption>
        <div className="overflow-hidden rounded-xl border border-[#ebe7f6] bg-white shadow-sm">
          {service.imageUrl && <img src={service.imageUrl} alt="" className="h-24 w-full object-cover" />}
          <div className="space-y-1 p-2.5 text-[12px]">
            <p className="text-[14px] font-bold text-[#1b1140]">{service.name}</p>
            <p className="text-[#4a4466]">{service.durationMins} min · {(service.serviceModes || []).join(' · ') || 'At provider location'}</p>
            <p className="line-clamp-3 leading-relaxed text-[#2a1b57]">{service.description}</p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[13px] font-bold text-[#1b1140]">{price}</span>
              <span className="rounded-lg bg-[#4125d0] px-3 py-1.5 text-[11.5px] font-semibold text-white">Book Now</span>
            </div>
          </div>
        </div>
      </figure>
    </div>
  )
}

const field = 'w-full rounded-lg border border-[#ddd7ee] bg-white px-2.5 py-2 text-[12.5px] text-[#1b1140] focus:border-[#7a5cf0] focus:outline-none'
const STYLE = {
  approve: 'border-[#15803d] bg-[#15803d] text-white hover:bg-[#126c34]',
  request_changes: 'border-[#f0a35c] bg-[#fff6ec] text-[#b45309] hover:bg-[#ffecd6]',
  reject: 'border-[#f2a3a3] bg-[#fff1f1] text-[#b91c1c] hover:bg-[#fde4e4]',
  reverify: 'border-[#b9a9f0] bg-[#f4f0ff] text-[#4527c8] hover:bg-[#ece5fd]',
  escalate: 'border-[#b9a9f0] bg-[#f4f0ff] text-[#4527c8] hover:bg-[#ece5fd]',
}
export const ACTION_BUTTON = STYLE

// Decision dialog for ADM-038 fields and ADM-039 services. The caller performs
// the save through `onSubmit(input)`; the backend re-validates everything.
export function ChangeDecisionDialog({ decision, title, subject, summaryRows, reasons, rejectReasons, escalateReasons, teams, affected, impact, cta, onSubmit, onClose }) {
  const [reason, setReason] = useState('')
  const [affectedField, setAffectedField] = useState(affected?.[0] || '')
  const [message, setMessage] = useState('')
  const [note, setNote] = useState('')
  const [team, setTeam] = useState('trust_safety')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  const options = decision === 'reject' ? rejectReasons : decision === 'escalate' ? escalateReasons : reasons
  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await onSubmit({ decision, reason: reason || null, affectedField: affected ? affectedField : null, providerMessage: message || null, internalNote: note || null, escalateTo: decision === 'escalate' ? team : null })
    } catch (err) {
      setError(err?.message || 'The decision could not be saved.')
      setBusy(false)
    }
  }
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1b1140]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="change-decision-title">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#f0edf8] px-5 py-3.5">
          <h2 id="change-decision-title" className="text-[16px] font-bold text-[#1b1140]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 hover:bg-[#f4f1fc]"><X className="size-5" /></button>
        </header>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4 text-[12.5px]">
          {subject && <p className="font-semibold text-[#1b1140]">{subject}</p>}
          {summaryRows && <Rows rows={summaryRows} />}
          {['request_changes', 'reject', 'escalate'].includes(decision) && (
            <>
              {affected && decision === 'request_changes' && (
                <label className="block space-y-1"><span className="font-semibold text-[#1b1140]">Affected field</span>
                  <select value={affectedField} onChange={(e) => setAffectedField(e.target.value)} className={field}>{affected.map((a) => <option key={a} value={a}>{a}</option>)}</select>
                </label>
              )}
              <label className="block space-y-1"><span className="font-semibold text-[#1b1140]">{decision === 'reject' ? 'Policy reason' : 'Reason'}</span>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className={field}><option value="">Select a reason…</option>{options.map((r) => <option key={r} value={r}>{r}</option>)}</select>
              </label>
              {decision !== 'escalate' && (
                <label className="block space-y-1"><span className="font-semibold text-[#1b1140]">{decision === 'reject' ? 'Provider-facing explanation' : 'Message to provider'}</span>
                  <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className={field} placeholder="e.g. Please revise this section and remove the direct contact information. Clients should communicate and book through Lé Inspa." />
                </label>
              )}
              {decision === 'escalate' && (
                <div className="flex gap-2">{Object.entries(teams).map(([id, name]) => <button key={id} type="button" onClick={() => setTeam(id)} aria-pressed={team === id} className={cn('flex-1 rounded-lg border px-3 py-2 text-[12px] font-semibold', team === id ? 'border-[#4125d0] bg-[#f4f0ff] text-[#4125d0]' : 'border-[#ddd7ee] text-[#2a1b57]')}>{name}</button>)}</div>
              )}
              <label className="block space-y-1"><span className="font-semibold text-[#1b1140]">Internal admin note{decision === 'reject' ? '' : ' (optional)'}</span>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={field} placeholder="Hidden from the provider." />
              </label>
            </>
          )}
          {impact && <p className="flex items-start gap-1.5 rounded-lg bg-[#faf9fe] px-3 py-2 text-[11.5px] text-[#4a4466]"><ShieldAlert className="mt-0.5 size-3.5 shrink-0" />{impact}</p>}
          {error && <p role="alert" className="rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">{error}</p>}
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#f0edf8] px-5 py-3">
          <button type="button" onClick={onClose} className="h-9 rounded-lg px-4 text-[12.5px] font-semibold text-[#4a4466] hover:bg-[#f4f1fc]">Cancel</button>
          <button type="button" disabled={busy} onClick={submit} className={cn('h-9 rounded-lg border-[1.5px] px-4 text-[12.5px] font-semibold disabled:opacity-60', STYLE[decision])}>{busy ? 'Saving…' : cta}</button>
        </footer>
      </div>
    </div>
  )
}
