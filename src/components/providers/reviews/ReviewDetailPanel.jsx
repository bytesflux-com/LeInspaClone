import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, ChevronRight, CircleAlert, CircleCheck, Image as ImageIcon, Info, ShieldAlert, X } from 'lucide-react'
import { cn } from '../../../lib/utils'
import PersonAvatar from '../../ui/PersonAvatar'
import Skeleton from '../../ui/Skeleton'
import { Btn, ErrorBanner, Field, Pill, Row, Stars } from '../trust/TrustUI'
import { REVIEW_STATUS_PILL, fmtDate, fmtDateTime, humanize, inputCls } from '../trust/trustFormat'

const ACTION_COPY = {
  keep_published: { title: 'Keep Published', button: 'Keep Published', variant: 'success' },
  hide: { title: 'Hide Review', button: 'Hide Review', variant: 'danger' },
  remove: { title: 'Remove Review', button: 'Remove Review', variant: 'dangerSolid' },
  request_review: { title: 'Request Further Review', button: 'Send for Review', variant: 'outline' },
  restore: { title: 'Restore Review', button: 'Restore', variant: 'success' },
}

function Section({ title, action, children }) {
  return (
    <section className="rounded-xl border border-slate-200/80 p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h4 className="text-[12.5px] font-bold text-royal-950">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  )
}

function ModerationDialog({ detail, intent, onCancel, onConfirm, busy, error }) {
  const isResponse = intent.target === 'response'
  const restore = intent.action === 'restore'
  const needsReason = ['hide', 'remove', 'restore'].includes(intent.action)
  const reasons = restore ? detail.restoreReasons : detail.reasons
  const [reasonCode, setReasonCode] = useState('')
  const [clientExplanation, setClientExplanation] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const copy = ACTION_COPY[intent.action]
  const canSubmit = !busy && (!needsReason || reasonCode) && (intent.action !== 'request_review' || internalNote.trim().length >= 5)

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-royal-950/40 p-4">
      <div role="dialog" aria-modal="true" aria-label={copy.title} className="w-full max-w-[480px] rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-[15px] font-bold text-royal-950">{copy.title}{isResponse ? ' — Provider Response' : ''}</h3>
            <p className="text-[12px] text-slate-500">{detail.review.id} • {detail.client.name}</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="size-5" /></button>
        </div>
        <div className="space-y-3 px-5 py-4">
          {detail.negativeGuard && (intent.action === 'hide' || intent.action === 'remove') && !isResponse && (
            <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-[12px] text-amber-800">
              <ShieldAlert className="size-4 shrink-0" />
              This is a critical review from a verified completed booking. A negative review should stay visible unless it breaks a review policy — moderation protects review integrity, not provider reputation.
            </p>
          )}
          {intent.action === 'keep_published' && <p className="text-[12px] text-slate-600">Open reports will be resolved and the review stays visible. Reporters are notified that the report was reviewed.</p>}
          {intent.action === 'request_review' && <p className="text-[12px] text-slate-600">The review stays in its current state and is assigned to the Moderation Team with your note.</p>}
          {needsReason && (
            <Field label={restore ? 'Restoration reason' : 'Reason'} required>
              <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} className={inputCls}>
                <option value="">Select a configured reason…</option>
                {reasons.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
              </select>
            </Field>
          )}
          {(intent.action === 'hide' || intent.action === 'remove') && (
            <Field label={isResponse ? 'Provider-facing explanation' : 'Client-facing explanation'} hint="Optional. Shown to the author — never include internal details.">
              <textarea rows={2} value={clientExplanation} onChange={(e) => setClientExplanation(e.target.value)} className={inputCls} />
            </Field>
          )}
          <Field label="Internal Admin Note" required={intent.action === 'request_review' || reasonCode === 'other_policy'} hint="Visible to authorised Admins only.">
            <textarea rows={3} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} className={inputCls} />
          </Field>
          <ErrorBanner>{error}</ErrorBanner>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant={copy.variant === 'success' ? 'primary' : copy.variant === 'outline' ? 'primary' : 'dangerSolid'} disabled={!canSubmit}
            onClick={() => onConfirm({ action: intent.action, target: intent.target, reasonCode: reasonCode || undefined, clientExplanation, internalNote, expectedStatus: isResponse ? detail.providerResponse?.status : detail.review.status })}>
            {busy ? 'Saving…' : `Confirm — ${copy.button}`}
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ADM-025 — Review Detail drawer: Read → Verify → Contextualize → Decide → Record.
export function ReviewDetailPanel({ detail, loading, error, onClose, onModerate, canModerate, providerName }) {
  const [intent, setIntent] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [fullHistory, setFullHistory] = useState(false)

  if (loading && !detail) {
    return <div className="space-y-3 p-4"><Skeleton className="h-16" /><Skeleton className="h-24" /><Skeleton className="h-40" /><Skeleton className="h-32" /></div>
  }
  if (error && !detail) return <div className="p-4"><ErrorBanner>{error}</ErrorBanner></div>
  if (!detail) return <div className="p-6 text-center text-[12px] text-slate-500">Select a review to see its details.</div>

  const { review, client, booking, bookingVerification, authenticity, media, reports, providerResponse, history, actions, responseActions } = detail
  const pill = REVIEW_STATUS_PILL[review.status]
  const ctx = review.context
  const confirm = async (input) => {
    setBusy(true)
    setFormError(null)
    try {
      await onModerate(input)
      setIntent(null)
    } catch (err) {
      setFormError(err?.message || 'The decision could not be saved.')
    } finally {
      setBusy(false)
    }
  }
  const primary = actions.filter((a) => ['keep_published', 'hide', 'remove'].includes(a))
  const secondary = actions.filter((a) => !primary.includes(a))
  const shownHistory = fullHistory ? history : history.slice(-4)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-[16px] font-bold text-royal-950">Review Details</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Close review details"><X className="size-5" /></button>
      </div>

      <div className={cn('flex-1 space-y-3 overflow-y-auto px-4 pb-4', loading && 'opacity-60')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <PersonAvatar name={client.name} size={44} />
            <div>
              <p className="text-[13.5px] font-bold text-slate-900">{client.name}</p>
              {client.id && <p className="text-[11px] text-slate-500">{client.id}</p>}
              {client.id && <Link to={`/clients/${client.id}`} className="inline-flex items-center text-[11.5px] font-semibold text-royal-600 hover:underline">View Client <ChevronRight className="size-3" /></Link>}
            </div>
          </div>
          <div className="text-right">
            <Pill tone={pill.tone} dot>{pill.label}</Pill>
            <p className="mt-1 text-[12px] font-bold text-royal-700">{review.id}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Stars value={review.rating} size="size-5" /><span className="text-[15px] font-bold">{review.rating.toFixed(1)}</span></span>
          <span className="text-[11.5px] text-slate-500">{fmtDateTime(review.submittedAt)}</span>
        </div>
        <blockquote className="rounded-xl bg-lavender-100/70 p-3 text-[12.5px] leading-relaxed text-slate-700">“{review.text}”</blockquote>

        {review.moderation && review.status !== 'published' && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[12px]">
            <p className="font-semibold text-slate-800">{humanize(review.moderation.action)} — {review.moderation.reasonLabel || 'Moderation'}</p>
            <p className="text-slate-500">By {review.moderation.decidedByName} • {fmtDateTime(review.moderation.decidedAt)}</p>
            {review.moderation.clientExplanation && <p className="mt-1 text-slate-600">Client told: “{review.moderation.clientExplanation}”</p>}
            <p className="mt-1 text-[11px] text-slate-500">Original content is preserved for audit.</p>
          </div>
        )}

        {ctx && (ctx.branchName || ctx.locationName) && (
          <Section title={ctx.branchName ? 'Spa Review' : 'Hotel Wellness Review'}>
            {ctx.branchName && <Row label="Branch">{ctx.branchName}</Row>}
            {ctx.locationName && <Row label="Wellness Location">{ctx.locationName}</Row>}
            {ctx.experienceType && <Row label="Experience">{humanize(ctx.experienceType)}</Row>}
            <Row label="Service">{review.serviceName}</Row>
            {ctx.specialistName && <Row label="Specialist">{ctx.specialistName}</Row>}
          </Section>
        )}

        <Section title="Booking & Service">
          <Row label="Booking ID">
            {booking.missing ? <span className="text-slate-400">{booking.id || 'None'}</span> : (
              <span className="inline-flex items-center gap-2">#{booking.id}<Link to={`/bookings/${booking.id}`} className="inline-flex items-center text-[11.5px] font-semibold text-royal-600">View Booking <ChevronRight className="size-3" /></Link></span>
            )}
          </Row>
          <Row label="Service">{review.serviceName || '—'}</Row>
          {!booking.missing && <Row label="Date & Time">{fmtDateTime(booking.startAt)}</Row>}
          {booking.location && <Row label="Location">{booking.location}</Row>}
          {!booking.missing && <Row label="Booking Status"><Pill tone={booking.status === 'completed' ? 'green' : 'amber'} dot>{humanize(booking.status)}</Pill></Row>}
          <Row label="Booking Verification"><Pill tone={bookingVerification.verified ? 'green' : 'amber'} icon={bookingVerification.verified ? CircleCheck : CircleAlert}>{bookingVerification.label}</Pill></Row>
        </Section>

        {media.length > 0 && (
          <Section title={`Review Photos (${media.length})`}>
            <div className="flex flex-wrap gap-2">
              {media.map((m) => (
                <figure key={m.id} className="w-[88px]">
                  {m.url ? <img src={m.url} alt="" className="size-[88px] rounded-lg object-cover" /> : <span className="flex size-[88px] items-center justify-center rounded-lg bg-slate-100"><ImageIcon className="size-5 text-slate-400" /></span>}
                  <figcaption className="mt-1 flex flex-wrap gap-1">
                    {m.moderationPending ? <Pill tone="purple">Moderation pending</Pill> : m.public ? <Pill tone="green">Public</Pill> : <Pill tone="grey">{humanize(m.status)}</Pill>}
                    {m.reported && <Pill tone="amber">Reported</Pill>}
                  </figcaption>
                </figure>
              ))}
            </div>
            {media.some((m) => m.moderationPending) && <p className="mt-1.5 text-[11px] text-slate-500">Photos awaiting moderation are not shown publicly.</p>}
          </Section>
        )}

        {providerResponse && (
          <Section title="Provider Response" action={<Pill tone={providerResponse.status === 'published' ? 'green' : 'grey'} dot>{humanize(providerResponse.status)}</Pill>}>
            <div className="flex gap-2">
              <PersonAvatar name={providerName} size={30} />
              <div className="min-w-0 text-[12px]">
                <p className="font-semibold text-slate-800">{providerName} <span className="font-normal text-slate-500">• {fmtDateTime(providerResponse.respondedAt)}</span></p>
                <p className="text-slate-700">{providerResponse.text}</p>
              </div>
            </div>
            {canModerate && responseActions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {responseActions.map((a) => <Btn key={a} variant="ghost" className="px-2.5 py-1 text-[11px]" onClick={() => { setFormError(null); setIntent({ action: a, target: 'response' }) }}>{ACTION_COPY[a].title} response</Btn>)}
              </div>
            )}
          </Section>
        )}

        {reports.length > 0 && (
          <Section title="Report Details">
            {reports.map((r) => (
              <div key={r.id} className="border-t border-slate-100 pt-1.5 first:border-0 first:pt-0">
                <Row label="Reported By">{humanize(r.reportedByType === 'system' ? 'System flag' : r.reportedByType)}</Row>
                <Row label="Reason">{r.reasonLabel}</Row>
                <Row label="Report ID">{r.id}{r.target === 'response' && ' (response)'}</Row>
                <Row label="Reported">{fmtDate(r.createdAt)}</Row>
                <Row label="Status"><Pill tone={r.open ? 'amber' : 'green'} dot>{r.open ? humanize(r.status) : 'Resolved'}</Pill></Row>
              </div>
            ))}
            <p className="mt-1.5 flex gap-1.5 text-[11px] text-slate-500"><Info className="size-3.5 shrink-0" />A report is an allegation. Decide on the review, booking and evidence — not the report reason alone.</p>
          </Section>
        )}

        <Section title="Authenticity Signals">
          <ul className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
            {authenticity.map((s) => (
              <li key={s.key} className="flex items-start gap-1.5 text-[11.5px] text-slate-700">
                {s.tone === 'ok' ? <CircleCheck className="mt-px size-3.5 shrink-0 text-emerald-600" /> : <CircleAlert className={cn('mt-px size-3.5 shrink-0', s.tone === 'warn' ? 'text-amber-500' : 'text-rose-500')} />}
                {s.label}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[10.5px] text-slate-500">Signals give context only — they are not proof of manipulation.</p>
        </Section>

        <Section title="Review Activity" action={history.length > 4 && <button type="button" onClick={() => setFullHistory((v) => !v)} className="text-[11px] font-semibold text-royal-600">{fullHistory ? 'Show Less' : 'View Full History'}</button>}>
          <ol className="relative space-y-2 border-l-2 border-royal-100 pl-3">
            {shownHistory.map((h) => (
              <li key={h.id || `${h.type}-${h.at}`} className="relative text-[11.5px]">
                <span className="absolute top-1 -left-[17px] size-2.5 rounded-full border-2 border-white bg-royal-600" />
                <span className="text-slate-500">{fmtDateTime(h.at, { year: false })}</span>
                <span className="ml-2 font-medium text-slate-800">{h.label}</span>
                {h.detail && <span className="text-slate-500"> — {h.detail}</span>}
              </li>
            ))}
          </ol>
        </Section>
      </div>

      {canModerate && (actions.length > 0) && (
        <div className="space-y-2 border-t border-slate-100 p-3">
          {!actions.includes('keep_published') && review.status === 'published' && (
            <p className="flex items-center gap-1.5 text-[11.5px] text-emerald-700"><CircleCheck className="size-3.5" />Published and not reported — no action required.</p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {primary.map((a) => <Btn key={a} variant={ACTION_COPY[a].variant} className="px-2" onClick={() => { setFormError(null); setIntent({ action: a, target: 'review' }) }}>{ACTION_COPY[a].button}</Btn>)}
          </div>
          {secondary.length > 0 && (
            <div className="relative flex justify-end">
              <Btn variant="outline" onClick={() => setMoreOpen((v) => !v)}>More Actions <ChevronDown className="size-3.5" /></Btn>
              {moreOpen && (
                <div className="absolute right-0 bottom-11 z-10 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                  {secondary.map((a) => (
                    <button key={a} type="button" onClick={() => { setMoreOpen(false); setFormError(null); setIntent({ action: a, target: 'review' }) }} className="block w-full rounded-lg px-3 py-2 text-left text-[12px] hover:bg-royal-50">{ACTION_COPY[a].title}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {!canModerate && <p className="border-t border-slate-100 p-3 text-[11.5px] text-slate-500">You can view reviews. Moderation needs the content-moderation permission.</p>}

      {intent && <ModerationDialog detail={detail} intent={intent} busy={busy} error={formError} onCancel={() => setIntent(null)} onConfirm={confirm} />}
    </div>
  )
}
