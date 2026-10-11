import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, Lock, ShieldAlert, TriangleAlert, X } from 'lucide-react'
import {
  ACCOUNT_STATE_STYLE,
  ACTION_META,
  CLIENT_TEMPLATES,
  DURATIONS,
  MAX_CLIENT_MESSAGE,
  MAX_NOTE,
  MIN_NOTE,
  OTHER_REASON,
  SUSPENSION_SCOPES,
} from '../../../constants/clientAccount'
import { formatDay, formatFullStamp, formatTime } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const FIELD = 'w-full rounded-lg border border-[#d9d3ee] bg-[#faf9fe] px-3 py-2 text-[13px] text-[#1b1140] focus:border-[#7a5cf0] focus:bg-white focus:outline-none'
const LABEL = 'mb-1 block text-[12.5px] font-semibold text-[#1b1140]'
const REQ = <span className="text-[#dc2626]">*</span>

const REASON_KEY = { suspend: 'suspendReasons', deactivate: 'deactivateReasons', reactivate: 'reactivateReasons', lift: 'liftReasons' }
const MIN_DAYS = 1
const MAX_DAYS = 365

function Choice({ type = 'checkbox', name, checked, onChange, disabled, children, hint }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 rounded-lg border px-2.5 py-2 text-[13px] transition', checked ? 'border-[#7a5cf0] bg-[#f4f1fc]' : 'border-[#e6e1f3] bg-white hover:bg-[#faf9fe]', disabled && 'cursor-not-allowed opacity-55 hover:bg-white')}>
      <input type={type} name={name} checked={checked} onChange={onChange} disabled={disabled} className="mt-0.5 accent-[#4125d0]" />
      <span className="font-medium text-[#1b1140]">{children}{hint && <span className="ml-1 text-[11.5px] font-normal text-[#4a4466]">— {hint}</span>}</span>
    </label>
  )
}

function Summary({ rows }) {
  return (
    <dl className="rounded-xl border border-[#e6e1f3] bg-[#faf9fe] px-3.5 py-1.5">
      {rows.filter(Boolean).map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 border-b border-[#efecf7] py-2 text-[12.5px] last:border-b-0">
          <dt className="shrink-0 text-[#2a1b57]">{label}</dt>
          <dd className="min-w-0 text-right font-semibold break-words text-[#1b1140]">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function StateChip({ status }) {
  const s = ACCOUNT_STATE_STYLE[status] || ACCOUNT_STATE_STYLE.active
  const dot = status === 'active' ? 'bg-[#22a652]' : status === 'deactivated' ? 'bg-[#dc2626]' : 'bg-[#e8801a]'
  return <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold', s.pill)}><span className={cn('size-2 rounded-full', dot)} />{s.label}</span>
}

// Controlled action panel. The browser only COLLECTS the request: the backend re-validates the admin,
// permission, country, the client's latest state, active restrictions and booking / financial impact,
// re-verifies the admin for high-impact actions, applies it transactionally, preserves the previous
// state and writes the action record, restriction record, audit log and client notification.
export default function AccountActionDrawer({ intent, data, client, links, onClose, onSubmit }) {
  const { action } = intent
  const meta = ACTION_META[action]
  const high = meta.risk === 'high'
  const tz = client.timeZone
  const { account, config, bookings, relatedCases } = data
  const target = action === 'lift' ? data.restrictions.find((x) => x.id === intent.restrictionId) : null
  const reasons = config[REASON_KEY[action]] || (meta.kind && meta.kind !== 'suspension' && action.startsWith('restrict') ? config.restrictReasons : meta.reasons)
  const needsDuration = action === 'suspend' || action.startsWith('restrict')
  const templates = CLIENT_TEMPLATES[action] || []
  const showBookings = (action === 'suspend' || action === 'deactivate') && bookings.length > 0

  const [step, setStep] = useState('form')
  const [form, setForm] = useState({
    category: '', scope: [], duration: 'until_reviewed', customDays: '7', notify: true,
    clientMessage: templates[0] || '', internalNote: '', relatedId: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const panel = useRef(null)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  useEffect(() => {
    panel.current?.focus()
    const onKey = (e) => e.key === 'Escape' && !saving && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  const scopeAllowed = (id) => config.scopes.find((s) => s.id === id)?.allowed !== false
  const durationAllowed = (id) => config.durations.find((d) => d.id === id)?.allowed !== false

  const toggleScope = (id) => {
    setForm((f) => {
      if (id === 'full') return { ...f, scope: f.scope.includes('full') ? [] : ['full'] }
      const without = f.scope.filter((s) => s !== 'full')
      return { ...f, scope: without.includes(id) ? without.filter((s) => s !== id) : [...without, id] }
    })
  }

  const customDaysNum = Number(form.customDays)
  const customOk = Number.isInteger(customDaysNum) && customDaysNum >= MIN_DAYS && customDaysNum <= MAX_DAYS
  const issues = useMemo(() => {
    const out = []
    if (!form.category) out.push('Select a reason.')
    if (form.category === OTHER_REASON && form.internalNote.trim().length < MIN_NOTE) out.push(`Add an internal note of at least ${MIN_NOTE} characters.`)
    if (action === 'suspend' && form.scope.length === 0) out.push('Choose what should be restricted.')
    if (needsDuration && form.duration === 'custom' && !customOk) out.push(`Enter a custom duration of ${MIN_DAYS}–${MAX_DAYS} days.`)
    if (form.notify && !form.clientMessage.trim()) out.push('Add the message the client will receive, or turn notification off.')
    return out
  }, [action, form, needsDuration, customOk])
  const valid = issues.length === 0

  const scopeText = useMemo(() => {
    if (action === 'suspend') return form.scope.map((id) => SUSPENSION_SCOPES.find((s) => s.id === id)?.short).join(' + ')
    if (action === 'lift') return target?.scopeLabel || 'Account'
    return meta.scope
  }, [action, form.scope, meta.scope, target])

  const durationText = useMemo(() => {
    if (form.duration === 'custom') return `${customDaysNum || '—'} days`
    return DURATIONS.find((d) => d.id === form.duration)?.label
  }, [form.duration, customDaysNum])

  const related = relatedCases.find((c) => c.id === form.relatedId)

  const submit = async () => {
    if (!valid || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        action,
        restrictionId: target?.id,
        category: form.category,
        scope: action === 'suspend' ? form.scope : undefined,
        duration: needsDuration ? form.duration : undefined,
        customDays: needsDuration && form.duration === 'custom' ? customDaysNum : undefined,
        notify: form.notify,
        clientMessage: form.notify ? form.clientMessage.trim() : '',
        internalNote: form.internalNote.trim(),
        relatedId: form.relatedId || undefined,
      })
    } catch (err) {
      setError(err?.message || 'The action could not be applied.')
      setSaving(false)
    }
  }

  const reactivateInfo = (() => {
    if (action !== 'reactivate') return null
    if (account.suspension) {
      const s = account.suspension
      return [
        ['Suspended Since', formatDay(s.startedAt, tz, { year: true })],
        ['Suspended By', s.appliedBy],
        ['Original Reason', s.category || 'Restricted'],
        ['Current Restrictions', s.scopeLabel],
        s.related && ['Related Case', s.related.restricted ? 'Restricted' : s.related.id],
      ]
    }
    const h = data.history.find((x) => x.action === 'Account Deactivated' && x.status === 'active')
    return h ? [['Deactivated Since', formatDay(h.at, tz, { year: true })], ['Deactivated By', h.admin], ['Original Reason', h.reason]] : []
  })()

  const confirmRows = [
    ['Client', client.name],
    ['Action', meta.history === 'Account Suspended' ? 'Suspend' : action === 'lift' ? target?.label ? `Remove ${target.label}` : meta.label : meta.label],
    action !== 'reactivate' && action !== 'deactivate' && !['request_info', 'send_warning'].includes(action) && ['Scope', scopeText],
    needsDuration && ['Duration', durationText],
    ['Reason', form.category],
    showBookings && ['Existing Bookings', `${bookings.length} — not cancelled`],
    related && ['Related Case', related.id],
    ['Client Notification', form.notify ? 'Yes' : 'No'],
  ]

  const tone = high ? 'bg-[#c2410c] hover:bg-[#a8370a]' : 'bg-[#4125d0] hover:bg-[#3719b8]'
  const reviewing = step === 'review'

  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label={`Close ${meta.title}`} onClick={() => !saving && onClose()} className="absolute inset-0 bg-[#1b1140]/40" />
      <aside ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={meta.title} className="absolute inset-y-0 right-0 flex w-full max-w-[470px] flex-col bg-white shadow-2xl outline-none">
        <header className="flex items-center justify-between border-b border-[#e6e1f3] px-5 py-4">
          <div className="flex items-center gap-2">
            {reviewing && !saving && (
              <button type="button" onClick={() => { setStep('form'); setError(null) }} aria-label="Back to edit" className="rounded-lg p-1 hover:bg-[#f1edff]"><ArrowLeft className="size-5" /></button>
            )}
            <h2 className="text-[19px] font-bold tracking-tight text-[#1b1140]">{reviewing ? meta.reviewTitle : meta.title}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="rounded-lg p-1 hover:bg-[#f1edff]"><X className="size-5" /></button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {!reviewing && (
            <>
              <div className="flex items-center justify-between rounded-lg bg-[#f4f1fc] px-3 py-2 text-[12.5px] text-[#2a1b57]">
                <span>Current Status</span>
                <StateChip status={account.status} />
              </div>

              {meta.notice && <p className="flex items-start gap-2 rounded-lg border border-[#e6e1f3] bg-[#faf9fe] px-3 py-2 text-[12px] text-[#2a1b57]">{meta.notice}</p>}

              {high && (
                <p className="flex items-start gap-2 rounded-lg border border-[#f3d9a8] bg-[#fff6e4] px-3 py-2 text-[12px] text-[#92510a]">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>High-impact action. A reason is required and you may be asked to verify your identity again.</span>
                </p>
              )}

              {action === 'deactivate' && (
                <p className="flex items-start gap-2 rounded-lg border border-[#f5cfcb] bg-[#fdeceb] px-3 py-2 text-[12px] text-[#7a1d17]">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>The account is disabled under Lé Inspa’s deactivation rules. Booking, payment and audit history is preserved. Accounts are never deleted from here.</span>
                </p>
              )}

              {reactivateInfo && reactivateInfo.length > 0 && <Summary rows={reactivateInfo} />}

              {target && (
                <Summary rows={[
                  [target.label, 'Active'],
                  ['Started', formatDay(target.startedAt, tz, { year: true })],
                  target.kind === 'suspension' && ['Scope', target.scopeLabel],
                  ['Reason', target.category || 'Restricted'],
                  ['Expires', typeof target.expires === 'string' ? target.expires : formatDay(target.expires.at, tz, { year: true })],
                  ['Applied by', `${target.appliedBy} — ${target.appliedByRole}`],
                ]} />
              )}

              <div>
                <label className={LABEL} htmlFor="acct-reason">
                  {action === 'reactivate' ? 'Reactivation Reason' : action === 'lift' ? 'Reason for removing' : 'Reason Category'} {REQ}
                </label>
                <select id="acct-reason" value={form.category} onChange={(e) => set({ category: e.target.value })} className={FIELD}>
                  <option value="">Select a reason…</option>
                  {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {action === 'suspend' && (
                <fieldset className="space-y-1.5">
                  <legend className={LABEL}>Suspension Scope — what should be restricted? {REQ}</legend>
                  <p className="-mt-0.5 mb-1.5 text-[11.5px] text-[#4a4466]">Use the smallest appropriate restriction instead of suspending everything.</p>
                  {SUSPENSION_SCOPES.map((s) => {
                    const ok = scopeAllowed(s.id)
                    const fullOn = form.scope.includes('full') && s.id !== 'full'
                    return (
                      <Choice key={s.id} checked={form.scope.includes(s.id) || fullOn} disabled={!ok || fullOn} onChange={() => toggleScope(s.id)} hint={!ok ? 'needs Finance permission' : s.hint}>
                        {s.label}
                      </Choice>
                    )
                  })}
                </fieldset>
              )}

              {needsDuration && (
                <fieldset className="space-y-1.5">
                  <legend className={LABEL}>{action === 'suspend' ? 'Suspension Duration' : 'Restriction Duration'}</legend>
                  {DURATIONS.map((d) => {
                    const ok = durationAllowed(d.id)
                    return (
                      <Choice key={d.id} type="radio" name="duration" checked={form.duration === d.id} disabled={!ok} onChange={() => set({ duration: d.id })} hint={d.note}>
                        {d.label}
                      </Choice>
                    )
                  })}
                  {form.duration === 'custom' && (
                    <div className="flex items-center gap-2 pl-1">
                      <input type="number" min={MIN_DAYS} max={MAX_DAYS} value={form.customDays} onChange={(e) => set({ customDays: e.target.value })} aria-label="Custom duration in days" className={cn(FIELD, 'w-24')} />
                      <span className="text-[12.5px] text-[#2a1b57]">days</span>
                    </div>
                  )}
                </fieldset>
              )}

              {showBookings && (
                <div className="rounded-xl border border-[#f3d9a8] bg-[#fff6e4] p-3">
                  <p className="flex items-center gap-2 text-[13px] font-bold text-[#92510a]">
                    <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                    {bookings.length} Upcoming Booking{bookings.length > 1 ? 's' : ''}
                  </p>
                  <p className="mt-1 text-[12px] text-[#5b3a0c]">{action === 'deactivate' ? 'Deactivating' : 'Suspending'} this account may affect existing bookings. They are not cancelled automatically.</p>
                  <ul className="mt-2 space-y-1">
                    {bookings.map((b) => (
                      <li key={b.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-[12px]">
                        <span className="font-semibold text-[#1b1140]">Booking #{b.id}</span>
                        <span className="text-[#2a1b57]">{formatDay(b.scheduledAt, tz)} • {typeof b.amount === 'number' ? `${client.currency} ${b.amount.toLocaleString('en-US')}` : formatTime(b.scheduledAt, tz)}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={links.bookings} state={links.state} className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#3b1fd6] hover:underline">
                    Review Existing Bookings <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              )}

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className={cn(LABEL, 'mb-0')} htmlFor="acct-client-msg">Reason sent to client</label>
                  <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-[#2a1b57]">
                    <input type="checkbox" checked={form.notify} onChange={(e) => set({ notify: e.target.checked })} className="accent-[#4125d0]" /> Notify client
                  </label>
                </div>
                {form.notify && (
                  <>
                    {templates.length > 0 && (
                      <select aria-label="Approved message template" value="" onChange={(e) => e.target.value !== '' && set({ clientMessage: templates[Number(e.target.value)] })} className={cn(FIELD, 'mb-1.5')}>
                        <option value="">Use an approved template…</option>
                        {templates.map((t, i) => <option key={t} value={i}>{t.length > 62 ? `${t.slice(0, 62)}…` : t}</option>)}
                      </select>
                    )}
                    <textarea id="acct-client-msg" rows={3} maxLength={MAX_CLIENT_MESSAGE} value={form.clientMessage} onChange={(e) => set({ clientMessage: e.target.value })} className={cn(FIELD, 'resize-none')} placeholder="This is what the client will see." />
                    <p className="mt-0.5 text-right text-[10.5px] text-[#4a4466]">{form.clientMessage.length}/{MAX_CLIENT_MESSAGE}</p>
                  </>
                )}
              </div>

              <div>
                <label className={LABEL} htmlFor="acct-note">
                  Internal Note {form.category === OTHER_REASON ? <span className="text-[#dc2626]">* (min {MIN_NOTE} characters)</span> : <span className="font-normal text-[#4a4466]">(optional)</span>}
                </label>
                <textarea id="acct-note" rows={3} maxLength={MAX_NOTE} value={form.internalNote} onChange={(e) => set({ internalNote: e.target.value })} className={cn(FIELD, 'resize-none')} placeholder="Operational context. Never sent to the client." />
                <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-[#4a4466]"><Lock className="size-3" aria-hidden="true" /> Only Lé Inspa staff can see this.</p>
              </div>

              {relatedCases.length > 0 && (
                <div>
                  <label className={LABEL} htmlFor="acct-related">Evidence / Related Case <span className="font-normal text-[#4a4466]">(where relevant)</span></label>
                  <select id="acct-related" value={form.relatedId} onChange={(e) => set({ relatedId: e.target.value })} className={FIELD}>
                    <option value="">None</option>
                    {relatedCases.map((c) => <option key={c.id} value={c.id}>{c.label} — {c.status}</option>)}
                  </select>
                  {related && (
                    <Link to={links.case(related)} state={links.state} className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-[#3b1fd6] hover:underline">
                      View Case <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {reviewing && (
            <>
              <Summary rows={confirmRows} />
              {form.notify && (
                <div className="rounded-xl border border-[#e6e1f3] bg-[#faf9fe] p-3">
                  <p className="text-[10.5px] font-semibold tracking-wide text-[#6b6785] uppercase">The client will be told</p>
                  <p className="mt-1 text-[12.5px] leading-snug whitespace-pre-wrap text-[#1b1140]">{form.clientMessage}</p>
                </div>
              )}
              {form.internalNote && (
                <div className="rounded-xl border border-[#e6e1f3] bg-white p-3">
                  <p className="flex items-center gap-1 text-[10.5px] font-semibold tracking-wide text-[#6b6785] uppercase"><Lock className="size-3" aria-hidden="true" /> Internal note — staff only</p>
                  <p className="mt-1 text-[12.5px] leading-snug whitespace-pre-wrap text-[#1b1140]">{form.internalNote}</p>
                </div>
              )}
              <p className="rounded-lg bg-[#f4f1fc] px-3 py-2 text-[12px] text-[#2a1b57]">
                {high ? 'You may be asked to verify your identity before this is applied. ' : ''}
                The action is validated again against the client’s latest state, recorded in the action history and audit log, and the previous state is preserved.
                {action === 'suspend' || action === 'deactivate' ? ' Wallet funds are not touched and existing bookings are not cancelled.' : ''}
              </p>
              {error && <p role="alert" className="rounded-lg bg-[#fff1f1] px-3 py-2 text-[12.5px] text-[#b91c1c]">{error}</p>}
            </>
          )}
        </div>

        <footer className="border-t border-[#e6e1f3] px-5 py-3.5">
          {!reviewing && !valid && form.category && <p className="mb-2 text-[11.5px] text-[#b45309]">{issues[0]}</p>}
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={reviewing ? () => { setStep('form'); setError(null) } : onClose} disabled={saving} className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border-[1.5px] border-[#8b6cf0] bg-white text-[13px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc] disabled:opacity-50">
              {reviewing ? 'Back' : 'Cancel'}
            </button>
            {reviewing ? (
              <button type="button" onClick={submit} disabled={saving} className={cn('inline-flex h-10 flex-[1.4] items-center justify-center rounded-lg text-[13px] font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60', tone)}>
                {saving ? 'Applying…' : meta.confirm}
              </button>
            ) : (
              <button type="button" onClick={() => setStep('review')} disabled={!valid} className="inline-flex h-10 flex-[1.4] items-center justify-center gap-1.5 rounded-lg bg-[#4125d0] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3719b8] disabled:cursor-not-allowed disabled:opacity-55">
                Review &amp; Confirm <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </footer>
      </aside>
    </div>
  )
}
