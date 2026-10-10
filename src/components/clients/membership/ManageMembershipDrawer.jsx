import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ChevronRight, ShieldAlert, X } from 'lucide-react'
import { CHANGE_REASONS, EXTEND_OPTIONS, MANAGE_ACTIONS, MIN_NOTE, MEMBERSHIP_STATUS_STYLE } from '../../../constants/clientMembership'
import { formatDay } from '../../../lib/profileFormat'
import { cn } from '../../../lib/utils'

const FIELD = 'w-full rounded-lg border border-[#d9d3ee] bg-[#faf9fe] px-3 py-2 text-[13px] text-[#1b1140] focus:border-[#7a5cf0] focus:bg-white focus:outline-none'
const LABEL = 'mb-1 block text-[12.5px] font-semibold text-[#1b1140]'

function Radio({ name, checked, onChange, disabled, children, hint }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-[13px] transition', checked ? 'border-[#7a5cf0] bg-[#f4f1fc]' : 'border-[#e6e1f3] bg-white hover:bg-[#faf9fe]', disabled && 'cursor-not-allowed opacity-55 hover:bg-white')}>
      <input type="radio" name={name} checked={checked} onChange={onChange} disabled={disabled} className="mt-0.5 accent-[#4125d0]" />
      <span><span className="font-semibold text-[#1b1140]">{children}</span>{hint && <span className="block text-[11.5px] text-[#4a4466]">{hint}</span>}</span>
    </label>
  )
}

// Controlled management drawer. The browser only COLLECTS the request: the backend decides
// what is legally / commercially valid, re-verifies the admin where needed, updates
// transactionally, preserves the previous record and writes history + audit.
export default function ManageMembershipDrawer({ manage, membership: m, config, client, initialAction, onClose, onConfirm }) {
  const [actionId, setActionId] = useState(initialAction || null)
  const [form, setForm] = useState({ tierId: '', effective: 'now', enabled: !m.autoRenew, days: 7, status: m.status === 'active' ? 'suspended' : 'active' })
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const panel = useRef(null)
  const tz = client.timeZone

  useEffect(() => {
    panel.current?.focus()
    const onKey = (e) => e.key === 'Escape' && !saving && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  const actions = manage.actions
  const current = actions.find((a) => a.id === actionId)
  const meta = actionId ? MANAGE_ACTIONS[actionId] : null
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const formValid = useMemo(() => {
    if (!current) return false
    if (actionId === 'change_tier') return Boolean(form.tierId)
    if (actionId === 'extend') return Number(form.days) >= 1
    if (actionId === 'correct_status') return Boolean(form.status) && form.status !== m.status
    return true
  }, [actionId, current, form, m.status])
  const reasonValid = Boolean(reason) && (reason !== 'Other' || note.trim().length >= MIN_NOTE)
  const canConfirm = formValid && reasonValid && !saving

  const summary = useMemo(() => {
    if (!current) return ''
    if (actionId === 'change_tier') {
      const t = current.options.find((o) => o.tierId === form.tierId)
      if (!t) return ''
      return form.effective === 'end_of_period' && m.periodEnd
        ? `Moves to ${t.label} on ${formatDay(m.periodEnd, tz, { year: true })}. Access stays as it is until then.`
        : `Moves to ${t.label} immediately. The current record is closed and kept in history; billing and access are recalculated by the backend.`
    }
    if (actionId === 'set_auto_renew') return `Auto-renewal will be turned ${form.enabled ? 'on' : 'off'}. No payment is taken now.`
    if (actionId === 'extend') return `Adds ${form.days} days to the current period. No payment is created or marked as paid.`
    if (actionId === 'cancel_renewal') return 'The next renewal will not be attempted. Access continues to the end of the paid period.'
    if (actionId === 'reactivate') return 'Access is restored. This does not create or confirm a payment.'
    if (actionId === 'correct_status') return `Membership status changes from ${MEMBERSHIP_STATUS_STYLE[m.status]?.label} to ${MEMBERSHIP_STATUS_STYLE[form.status]?.label}. Payment status is not touched.`
    return ''
  }, [actionId, current, form, m.periodEnd, m.status, tz])

  const submit = async () => {
    if (!canConfirm) return
    setSaving(true)
    setError(null)
    const payload = {
      change_tier: { tierId: form.tierId, effective: form.effective },
      set_auto_renew: { enabled: form.enabled },
      extend: { days: Number(form.days) },
      correct_status: { status: form.status },
    }[actionId] || {}
    try {
      await onConfirm({ action: actionId, payload, reason, note: note.trim() })
    } catch (err) {
      setError(err?.message || 'The change could not be applied.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label="Close manage membership" onClick={() => !saving && onClose()} className="absolute inset-0 bg-[#1b1140]/40" />
      <aside ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Manage membership" className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-white shadow-2xl outline-none">
        <header className="flex items-center justify-between border-b border-[#e6e1f3] px-5 py-4">
          <div className="flex items-center gap-2">
            {actionId && (
              <button type="button" onClick={() => { setActionId(null); setError(null) }} aria-label="Back to actions" className="rounded-lg p-1 hover:bg-[#f1edff]"><ArrowLeft className="size-5" /></button>
            )}
            <h2 className="text-[19px] font-bold tracking-tight text-[#1b1140]">{meta ? meta.label : 'Manage Membership'}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="rounded-lg p-1 hover:bg-[#f1edff]"><X className="size-5" /></button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <p className="rounded-lg bg-[#f4f1fc] px-3 py-2 text-[12.5px] text-[#2a1b57]">
            Current: <span className="font-bold text-[#1b1140]">{config?.name}</span> · {MEMBERSHIP_STATUS_STYLE[m.status]?.label}
          </p>

          {!actionId && (
            <ul className="space-y-2">
              {actions.map((a) => {
                const mt = MANAGE_ACTIONS[a.id]
                if (!mt) return null
                const Icon = mt.icon
                return (
                  <li key={a.id}>
                    <button type="button" disabled={!a.enabled} onClick={() => setActionId(a.id)} className="flex w-full items-center gap-3 rounded-xl border border-[#e6e1f3] bg-white p-3 text-left transition hover:bg-[#faf9fe] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-white">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#efebfc] text-[#4527c8]"><Icon className="size-[18px]" aria-hidden="true" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-semibold text-[#1b1140]">{mt.label}</span>
                        <span className="block text-[11.5px] text-[#4a4466]">{a.enabled ? mt.desc : a.disabledReason}</span>
                      </span>
                      {a.enabled && <ChevronRight className="size-4 text-[#6b6785]" aria-hidden="true" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {actionId && current && (
            <>
              {meta.risk === 'high' && (
                <p className="flex items-start gap-2 rounded-lg border border-[#f3d9a8] bg-[#fff6e4] px-3 py-2 text-[12px] text-[#92510a]">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>Higher-risk change. You may be asked to verify your identity again before it is applied.</span>
                </p>
              )}

              {actionId === 'change_tier' && (
                <>
                  <fieldset className="space-y-2">
                    <legend className={LABEL}>New membership</legend>
                    {current.options.map((o) => (
                      <Radio key={o.tierId} name="tier" checked={form.tierId ? form.tierId === o.tierId : o.current} disabled={!o.available} onChange={() => set({ tierId: o.tierId })} hint={o.current ? 'Current membership' : o.reason}>
                        {o.label}
                      </Radio>
                    ))}
                  </fieldset>
                  <fieldset className="space-y-2">
                    <legend className={LABEL}>Effective</legend>
                    <Radio name="eff" checked={form.effective === 'now'} onChange={() => set({ effective: 'now' })}>Immediately</Radio>
                    <Radio name="eff" checked={form.effective === 'end_of_period'} onChange={() => set({ effective: 'end_of_period' })} disabled={!m.periodEnd} hint={!m.periodEnd ? 'This membership has no billing period.' : null}>End of current billing period</Radio>
                  </fieldset>
                </>
              )}

              {actionId === 'set_auto_renew' && (
                <fieldset className="space-y-2">
                  <legend className={LABEL}>Auto-renewal</legend>
                  <Radio name="ar" checked={form.enabled} onChange={() => set({ enabled: true })}>On</Radio>
                  <Radio name="ar" checked={!form.enabled} onChange={() => set({ enabled: false })}>Off</Radio>
                </fieldset>
              )}

              {actionId === 'extend' && (
                <div>
                  <label className={LABEL} htmlFor="ext-days">Extend by</label>
                  <select id="ext-days" value={form.days} onChange={(e) => set({ days: Number(e.target.value) })} className={FIELD}>
                    {EXTEND_OPTIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
                  </select>
                </div>
              )}

              {actionId === 'correct_status' && (
                <div>
                  <label className={LABEL} htmlFor="corr-status">Correct status to</label>
                  <select id="corr-status" value={form.status} onChange={(e) => set({ status: e.target.value })} className={FIELD}>
                    {current.statuses.map((s) => <option key={s} value={s}>{MEMBERSHIP_STATUS_STYLE[s]?.label}</option>)}
                  </select>
                </div>
              )}

              {summary && <p className="rounded-lg border border-[#e6e1f3] bg-[#faf9fe] px-3 py-2 text-[12.5px] text-[#2a1b57]"><span className="font-semibold text-[#1b1140]">What will happen: </span>{summary}</p>}

              <div>
                <label className={LABEL} htmlFor="chg-reason">Reason for change <span className="text-[#dc2626]">*</span></label>
                <select id="chg-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={FIELD}>
                  <option value="">Select a reason…</option>
                  {CHANGE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="chg-note">Internal note {reason === 'Other' ? <span className="text-[#dc2626]">* (min {MIN_NOTE} characters)</span> : <span className="font-normal text-[#4a4466]">(optional)</span>}</label>
                <textarea id="chg-note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={cn(FIELD, 'resize-none')} placeholder="Visible to authorised admin staff only." />
              </div>
              {error && <p role="alert" className="rounded-lg bg-[#fff1f1] px-3 py-2 text-[12.5px] text-[#b91c1c]">{error}</p>}
            </>
          )}
        </div>

        {actionId && (
          <footer className="flex items-center gap-2.5 border-t border-[#e6e1f3] px-5 py-3.5">
            <button type="button" onClick={onClose} disabled={saving} className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border-[1.5px] border-[#8b6cf0] bg-white text-[13px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc] disabled:opacity-50">Cancel</button>
            <button type="button" onClick={submit} disabled={!canConfirm} className="inline-flex h-10 flex-[1.4] items-center justify-center rounded-lg bg-[#4125d0] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#3719b8] disabled:cursor-not-allowed disabled:opacity-55">
              {saving ? 'Applying…' : 'Confirm Change'}
            </button>
          </footer>
        )}
      </aside>
    </div>
  )
}
