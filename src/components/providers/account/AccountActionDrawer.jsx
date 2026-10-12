import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ShieldAlert, TriangleAlert } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Btn, Drawer, ErrorBanner, Field, Pill, Row } from '../trust/TrustUI'
import { fmtDate, fmtMoney, humanize, inputCls } from '../trust/trustFormat'

const TITLES = {
  request_info: 'Request Information',
  warn: 'Issue Warning',
  place_review: 'Place Under Review',
  end_review: 'Close Account Review',
  restrict: 'Apply Restriction',
  lift_restriction: 'Lift Restriction',
  suspend: 'Suspend Provider',
  reactivate: 'Reactivate Account',
  deactivate: 'Deactivate Provider',
}
const CONFIRM = { suspend: 'Confirm Suspension', reactivate: 'Confirm Reactivation', deactivate: 'Confirm Deactivation', restrict: 'Confirm Restriction', lift_restriction: 'Lift Restriction' }
const HIGH = ['suspend', 'reactivate', 'deactivate']
const SUSPEND_SCOPES = ['new_bookings', 'public_visibility', 'messaging', 'profile_changes', 'withdrawals', 'subscription_benefits', 'full_access']

function ImpactBlock({ data }) {
  const { impact, review } = data
  const money = (v) => (impact.financial ? fmtMoney(v, impact.financial.currency) : '••••')
  return (
    <div className="space-y-3">
      {impact.bookings.total > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px]">
          <p className="flex items-center gap-1.5 font-bold text-amber-800"><TriangleAlert className="size-4" />{impact.bookings.total} Upcoming Booking{impact.bookings.total === 1 ? '' : 's'}</p>
          <div className="mt-1 grid grid-cols-3 gap-2 text-center">
            {[['Today', impact.bookings.today], ['Tomorrow', impact.bookings.tomorrow], ['Later', impact.bookings.later]].map(([l, v]) => <div key={l} className="rounded-lg bg-white py-1.5"><p className="text-[15px] font-bold text-slate-900">{v}</p><p className="text-[10.5px] text-slate-500">{l}</p></div>)}
          </div>
          <p className="mt-1.5 text-[11px] text-amber-800">Existing bookings are NOT cancelled. Decide what happens to them in the booking-management workflow.</p>
          <Link to={`/providers/${data.provider.id}/bookings`} className="text-[11.5px] font-semibold text-royal-600">Review Affected Bookings →</Link>
        </div>
      )}
      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-[12px] font-bold text-royal-950">Financial Position</p>
        {impact.financial ? (
          <>
            <Row label="Pending Escrow">{money(impact.financial.pendingEscrow)}</Row>
            <Row label="Available Balance">{impact.financial.availableBalance === null ? '—' : money(impact.financial.availableBalance)}</Row>
            <Row label="Pending Withdrawal">{money(impact.financial.pendingWithdrawal)}</Row>
            <Row label="Unresolved Refunds">{money(impact.financial.unresolvedRefunds)}</Row>
          </>
        ) : <p className="text-[11.5px] text-slate-500">Financial amounts need Finance permission.</p>}
        <p className="mt-1.5 flex gap-1.5 text-[11px] text-slate-600"><ShieldAlert className="size-3.5 shrink-0 text-royal-500" />Account suspension does not confiscate funds. Holding withdrawals is a separate, permission-controlled restriction.</p>
      </div>
      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-[12px] font-bold text-royal-950">Client Impact</p>
        <Row label="Clients with Upcoming Bookings">{impact.clients.upcoming}</Row>
        <Row label="Clients in Ongoing Bookings">{impact.clients.ongoing}</Row>
        <Row label="Clients Awaiting Refund/Resolution">{impact.clients.awaitingRefund}</Row>
      </div>
      {review.openSafetyCases + review.openDisputes === 0 && <p className="text-[11px] text-slate-500">No open safety cases or disputes for this provider.</p>}
    </div>
  )
}

// ADM-028 — one controlled drawer for every account action:
// Context → Minimum Necessary Action → Impact Review → Confirmation → Audit.
export function AccountActionDrawer({ data, intent, onClose, onSubmit }) {
  const { action } = intent
  const cfg = data.config
  const perms = data.permissions
  const activeRestrictions = data.restrictions.filter((r) => r.status === 'active')
  const liftTarget = intent.restrictionId ? activeRestrictions.find((r) => r.id === intent.restrictionId) : null

  const [step, setStep] = useState('form')
  const [reasonCode, setReasonCode] = useState('')
  const [scope, setScope] = useState(['new_bookings', 'public_visibility'])
  const [targetId, setTargetId] = useState('')
  const [duration, setDuration] = useState('until_review')
  const [customUntil, setCustomUntil] = useState('')
  const openCases = data.cases.filter((c) => c.open)
  const [caseId, setCaseId] = useState(openCases[0]?.id || '')
  const [manualCase, setManualCase] = useState('')
  const [providerMessage, setProviderMessage] = useState(cfg.templates[action] || '')
  const [internalNote, setInternalNote] = useState('')
  const [notify, setNotify] = useState(true)
  const [restore, setRestore] = useState(activeRestrictions.filter((r) => r.kind !== 'withdrawals' || perms.restrictWithdrawals).map((r) => r.kind))
  const [busy, setBusy] = useState(false)
  const [minCustomDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10))
  const [error, setError] = useState(null)

  const reasons = action === 'reactivate' ? cfg.reactivationReasons : cfg.reasons
  const kindLabel = (k) => cfg.kinds.find((x) => x.code === k)?.label || k
  const usesDuration = action === 'restrict' || action === 'suspend'
  const usesCase = ['restrict', 'suspend', 'deactivate', 'warn'].includes(action)
  const needsMessage = ['warn', 'request_info', 'suspend', 'deactivate', 'restrict'].includes(action)
  const needsNote = action === 'suspend' || action === 'deactivate'
  const relatedCase = caseId === '__manual' ? manualCase.trim().toUpperCase() : caseId

  const problems = useMemo(() => {
    const out = []
    if (!reasonCode) out.push('Select a reason.')
    if (action === 'suspend' && scope.length === 0) out.push('Select at least one scope.')
    if (usesDuration && duration === 'custom' && !customUntil) out.push('Pick a custom end date.')
    if (action === 'suspend' && !relatedCase) out.push('Select or enter the related case (policy).')
    if (needsMessage && !providerMessage.trim()) out.push('Add the provider message.')
    if (needsNote && internalNote.trim().length < 10) out.push('Add an internal note (10+ characters).')
    if (providerMessage.trim() && providerMessage.trim() === internalNote.trim()) out.push('Provider message and internal note must differ.')
    return out
  }, [reasonCode, action, scope, usesDuration, duration, customUntil, relatedCase, needsMessage, providerMessage, needsNote, internalNote])

  const payload = () => ({
    action,
    reasonCode,
    kind: action === 'restrict' ? intent.kind : undefined,
    scope: action === 'suspend' ? scope : undefined,
    targetId: targetId || undefined,
    duration: usesDuration ? duration : undefined,
    customUntil: duration === 'custom' ? customUntil : undefined,
    caseId: usesCase && relatedCase ? relatedCase : undefined,
    restrictionId: liftTarget?.id,
    restore: action === 'reactivate' ? restore : undefined,
    providerMessage,
    internalNote,
    notify,
    expectedStatus: data.account.status,
  })

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await onSubmit(payload())
    } catch (err) {
      setError(err?.message || 'The action could not be applied.')
      setStep('form')
    } finally {
      setBusy(false)
    }
  }

  const title = action === 'restrict' ? `Restrict ${kindLabel(intent.kind)}` : TITLES[action]
  const reason = reasons.find((r) => r.code === reasonCode)
  const durationLabel = cfg.durations.find((d) => d.code === duration)?.label

  return (
    <Drawer open width="max-w-[620px]" title={title} subtitle={`${data.provider.name} • ${data.provider.id} • Current status: ${data.account.label}`} onClose={onClose}
      footer={step === 'form' ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500">{problems[0] || 'Ready to review.'}</span>
          <div className="flex gap-2"><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn disabled={problems.length > 0} onClick={() => setStep('review')}>Review {HIGH.includes(action) ? 'Action' : ''}</Btn></div>
        </div>
      ) : (
        <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={() => setStep('form')}>Go Back</Btn><Btn variant={action === 'reactivate' ? 'primary' : HIGH.includes(action) || action === 'restrict' ? 'dangerSolid' : 'primary'} disabled={busy} onClick={confirm}>{busy ? 'Applying…' : CONFIRM[action] || 'Confirm'}</Btn></div>
      )}>
      {step === 'review' ? (
        <div className="space-y-3">
          <h3 className="text-[14px] font-bold text-royal-950">Review {title}</h3>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-3 py-1.5">
            <Row label="Provider">{data.provider.name}</Row>
            <Row label="Action">{title}</Row>
            {action === 'suspend' && <Row label="Scope">{scope.map(kindLabel).join(' + ')}</Row>}
            {targetId && <Row label="Applies to">{cfg.units.find((u) => u.id === targetId)?.name}</Row>}
            {usesDuration && <Row label="Duration">{duration === 'custom' ? `Until ${customUntil}` : durationLabel}</Row>}
            {liftTarget && <Row label="Restriction">{liftTarget.label}</Row>}
            {action === 'reactivate' && <Row label="Restore">{restore.length ? restore.map(kindLabel).join(' + ') : 'Account status only'}</Row>}
            <Row label="Reason">{reason?.label}</Row>
            {(action === 'suspend' || action === 'deactivate' || action === 'restrict') && <Row label="Upcoming Bookings">{data.impact.bookings.total} (not cancelled)</Row>}
            {(action === 'suspend' || action === 'deactivate') && <Row label="Pending Escrow">{data.impact.financial ? fmtMoney(data.impact.financial.pendingEscrow, data.impact.financial.currency) : '••••'}</Row>}
            <Row label="Provider Notification">{notify ? 'Yes' : 'No'}</Row>
            {relatedCase && usesCase && <Row label="Related Case">{relatedCase}</Row>}
          </div>
          {notify && <div className="rounded-xl bg-lavender-100/70 p-3 text-[12px] text-slate-700"><p className="mb-0.5 font-semibold text-royal-900">Message to provider</p>{providerMessage}</div>}
          {HIGH.includes(action) && <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-[11.5px] text-amber-800"><ShieldAlert className="size-4 shrink-0" />High-impact action: you may be asked to re-verify your session before it is applied. The previous state is preserved in history.</p>}
          <ErrorBanner>{error}</ErrorBanner>
        </div>
      ) : (
        <>
          <ErrorBanner>{error}</ErrorBanner>
          {action === 'reactivate' && data.account.suspension && (
            <div className="divide-y divide-rose-100 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-1.5">
              <p className="py-1 text-[12px] font-bold text-rose-800">Original suspension</p>
              <Row label="Since">{fmtDate(data.account.suspension.since)}</Row>
              <Row label="Reason">{data.account.suspension.reason}</Row>
              <Row label="Scope">{data.account.suspension.scope}</Row>
              <Row label="By">{data.account.suspension.by}</Row>
            </div>
          )}
          {liftTarget && (
            <div className="divide-y divide-amber-100 rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-1.5">
              <Row label="Restriction">{liftTarget.label}{liftTarget.scopeTarget?.type !== 'account' && ` — ${liftTarget.scopeTarget.name}`}</Row>
              <Row label="Started">{fmtDate(liftTarget.startedAt)}</Row>
              <Row label="Expires">{liftTarget.expiresAt ? fmtDate(liftTarget.expiresAt) : 'Until review'}</Row>
              <Row label="Reason">{liftTarget.reasonLabel}</Row>
            </div>
          )}

          <Field label={action === 'reactivate' ? 'Reactivation Reason' : 'Reason Category'} required>
            <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} className={inputCls}>
              <option value="">Select a configured reason…</option>
              {reasons.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
            </select>
          </Field>

          {action === 'suspend' && (
            <Field label="Suspension Scope" required hint="Choose the smallest scope that addresses the issue.">
              <div className="grid gap-1.5 sm:grid-cols-2">
                {SUSPEND_SCOPES.map((k) => {
                  const locked = k === 'withdrawals' && !perms.restrictWithdrawals
                  return (
                    <label key={k} className={cn('flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px]', locked ? 'border-slate-100 text-slate-400' : 'border-slate-200')}>
                      <input type="checkbox" disabled={locked} checked={scope.includes(k)} onChange={() => setScope((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]))} className="accent-royal-700" />
                      {kindLabel(k)}{locked && <span className="text-[10px]">(Finance only)</span>}
                    </label>
                  )
                })}
              </div>
            </Field>
          )}

          {(action === 'suspend' || action === 'restrict') && cfg.units.length > 0 && (
            <Field label={cfg.units[0].type === 'branch' ? 'Applies to branch' : 'Applies to wellness location'} hint="A problem in one location should not shut down every location unless the case justifies it.">
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className={inputCls}>
                <option value="">Entire {cfg.units[0].type === 'branch' ? 'Spa' : 'wellness account'}</option>
                {cfg.units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
          )}

          {usesDuration && (
            <Field label="Duration" required>
              <div className="grid gap-1.5 sm:grid-cols-3">
                {cfg.durations.map((d) => {
                  const locked = d.elevated && !perms.deactivate
                  return (
                    <label key={d.code} className={cn('flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px]', duration === d.code ? 'border-royal-400 bg-royal-50' : 'border-slate-200', locked && 'opacity-50')}>
                      <input type="radio" name="duration" disabled={locked} checked={duration === d.code} onChange={() => setDuration(d.code)} className="accent-royal-700" />{d.label.replace(' — higher permission only', '')}
                    </label>
                  )
                })}
              </div>
              {duration === 'custom' && <input type="date" value={customUntil} min={minCustomDate} onChange={(e) => setCustomUntil(e.target.value)} className={cn(inputCls, 'mt-2')} />}
            </Field>
          )}

          {action === 'reactivate' && activeRestrictions.length > 0 && (
            <Field label="Restore access" hint="Financial restrictions can only be lifted by Finance/Security roles.">
              <div className="grid gap-1.5 sm:grid-cols-2">
                {[...new Set(activeRestrictions.map((r) => r.kind))].map((k) => {
                  const locked = k === 'withdrawals' && !perms.restrictWithdrawals
                  return (
                    <label key={k} className={cn('flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px]', locked && 'opacity-50')}>
                      <input type="checkbox" disabled={locked} checked={restore.includes(k)} onChange={() => setRestore((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]))} className="accent-royal-700" />{kindLabel(k)}
                    </label>
                  )
                })}
              </div>
            </Field>
          )}

          {(action === 'suspend' || action === 'deactivate') && <ImpactBlock data={data} />}
          {action === 'restrict' && intent.kind === 'new_bookings' && data.impact.bookings.total > 0 && (
            <p className="rounded-xl bg-amber-50 p-2.5 text-[11.5px] text-amber-800">{data.impact.bookings.total} upcoming bookings stay in place — this only stops new bookings.</p>
          )}

          {usesCase && (
            <Field label="Related Case" required={action === 'suspend'} hint={action === 'suspend' ? 'Policy requires a case reference for suspension.' : 'Optional.'}>
              <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className={inputCls}>
                <option value="">No related case</option>
                {data.cases.map((c) => <option key={c.id} value={c.id}>{c.id} — {c.category} ({c.open ? 'open' : humanize(c.status)})</option>)}
                <option value="__manual">Enter another case reference…</option>
              </select>
              {caseId === '__manual' && <input value={manualCase} onChange={(e) => setManualCase(e.target.value)} placeholder="e.g. SAF-2811" className={cn(inputCls, 'mt-2')} />}
              {caseId && caseId !== '__manual' && <Link to={data.cases.find((c) => c.id === caseId)?.link || '#'} className="text-[11.5px] font-semibold text-royal-600">Open Case →</Link>}
            </Field>
          )}

          <Field label="Message to Provider" required={needsMessage} hint="Approved template — edit safely. Do not include confidential investigation details.">
            <textarea rows={3} value={providerMessage} onChange={(e) => setProviderMessage(e.target.value)} className={inputCls} />
          </Field>
          <label className="flex items-center gap-2 text-[12px] text-slate-700"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-royal-700" />Notify the provider (email + in-app)</label>
          <Field label="Internal Note" required={needsNote} hint="Authorised Admins only — never shown to the provider.">
            <textarea rows={3} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} className={inputCls} />
          </Field>
          {HIGH.includes(action) && <Pill tone="amber">Session re-verification may be required</Pill>}
        </>
      )}
    </Drawer>
  )
}
