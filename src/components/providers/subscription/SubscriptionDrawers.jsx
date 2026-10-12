import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Btn, Drawer, ErrorBanner, Field, Row } from '../trust/TrustUI'
import { fmtDate, fmtMoney, humanize, inputCls } from '../trust/trustFormat'

const SUB_ACTIONS = {
  change_plan: { label: 'Change Plan', text: 'Move the provider to another configured plan for their market.' },
  extend: { label: 'Extend Subscription', text: 'Extend the current period (no charge).' },
  courtesy_extension: { label: 'Apply Approved Courtesy Extension', text: 'Goodwill extension within the configured limit.' },
  cancel_renewal: { label: 'Cancel Renewal', text: 'Turn off auto-renewal; access continues to period end.' },
  resume_renewal: { label: 'Resume Renewal', text: 'Turn auto-renewal back on.' },
  reactivate: { label: 'Reactivate Subscription', text: 'Reopen the subscription; benefits return once the payment system confirms payment.' },
}
const VIS_ACTIONS = {
  enable_featured: { label: 'Enable Featured Placement', text: 'Requires active Premium Visibility, verification and no visibility restriction.' },
  disable_featured: { label: 'Disable Featured Placement', text: 'Removes featured placement; Premium badge and ranking stay.' },
  pause: { label: 'Pause Marketplace Visibility', text: 'Temporarily hides the provider from discovery without touching billing.' },
  restore: { label: 'Restore Visibility', text: 'Cannot override an account suspension or visibility restriction.' },
}

function ActionPicker({ actions, catalog, value, onChange }) {
  return (
    <div className="space-y-1.5" role="radiogroup">
      {actions.map((a) => (
        <label key={a} className={cn('flex cursor-pointer gap-2.5 rounded-xl border p-2.5', value === a ? 'border-royal-400 bg-royal-50' : 'border-slate-200 hover:bg-slate-50')}>
          <input type="radio" name="action" checked={value === a} onChange={() => onChange(a)} className="mt-0.5 accent-royal-700" />
          <span><span className="block text-[12.5px] font-semibold text-slate-800">{catalog[a].label}</span><span className="text-[11.5px] text-slate-500">{catalog[a].text}</span></span>
        </label>
      ))}
    </div>
  )
}

function useSubmit(onSubmit) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const run = async (payload) => {
    setBusy(true)
    setError(null)
    try {
      await onSubmit(payload)
    } catch (err) {
      setError(err?.message || 'The change could not be applied.')
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, run }
}

export function ManageSubscriptionDrawer({ data, onClose, onSubmit }) {
  const permitted = data.permitted.subscription
  const [action, setAction] = useState(permitted[0])
  const [planId, setPlanId] = useState('')
  const [effective, setEffective] = useState('next_renewal')
  const [days, setDays] = useState(7)
  const [reasonCode, setReasonCode] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [review, setReview] = useState(false)
  const [openedAt] = useState(() => Date.now())
  const { busy, error, run } = useSubmit(onSubmit)
  const s = data.subscription
  const plans = data.plans.filter((p) => p.id !== s.planId)
  const maxDays = action === 'courtesy_extension' ? data.policy.maxCourtesyExtensionDays : data.policy.maxAdminExtensionDays
  const valid = reasonCode && (action !== 'change_plan' || planId) && (!['extend', 'courtesy_extension'].includes(action) || (days >= 1 && days <= maxDays))
  const plan = data.plans.find((p) => p.id === planId)
  const reason = data.reasons.find((r) => r.code === reasonCode)

  return (
    <Drawer open title="Manage Subscription" subtitle={`${data.provider.name} • ${s.planName} • ${data.status.label}`} onClose={onClose}
      footer={review ? (
        <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={() => setReview(false)}>Go Back</Btn><Btn disabled={busy} onClick={() => run({ action, planId: planId || undefined, effective, days: Number(days), reasonCode, internalNote, expectedVersion: s.version })}>{busy ? 'Applying…' : 'Confirm Change'}</Btn></div>
      ) : (
        <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn disabled={!valid} onClick={() => setReview(true)}>Review Change</Btn></div>
      )}>
      {review ? (
        <div className="space-y-3">
          <h3 className="text-[13.5px] font-bold text-royal-950">Review before confirming</h3>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 p-3">
            <Row label="Action">{SUB_ACTIONS[action].label}</Row>
            {plan && <Row label="New plan">{plan.name} — {fmtMoney(plan.price)} / {humanize(plan.billingCycle)}</Row>}
            {action === 'change_plan' && <Row label="Effective">{effective === 'immediate' ? 'Immediately (new period, payment pending)' : `At next renewal (${fmtDate(s.currentPeriodEnd)})`}</Row>}
            {['extend', 'courtesy_extension'].includes(action) && <Row label="Extension">{days} days → ends {fmtDate(Math.max(s.currentPeriodEnd, openedAt) + days * 86400000)}</Row>}
            <Row label="Reason">{reason?.label}</Row>
            <Row label="Internal note">{internalNote || '—'}</Row>
            <Row label="Provider notification">{['resume_renewal'].includes(action) ? 'No' : 'Yes'}</Row>
          </div>
          <p className="text-[11.5px] text-slate-500">The change is applied by the subscription engine, recorded in history and audited. Previous periods are never edited.</p>
          <ErrorBanner>{error}</ErrorBanner>
        </div>
      ) : (
        <>
          <ActionPicker actions={permitted} catalog={SUB_ACTIONS} value={action} onChange={setAction} />
          {action === 'change_plan' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="New plan" required>
                <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={inputCls}>
                  <option value="">Select a plan…</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {fmtMoney(p.price)}</option>)}
                </select>
              </Field>
              <Field label="Effective">
                <select value={effective} onChange={(e) => setEffective(e.target.value)} className={inputCls}>
                  <option value="next_renewal">At next renewal</option>
                  <option value="immediate">Immediately</option>
                </select>
              </Field>
            </div>
          )}
          {['extend', 'courtesy_extension'].includes(action) && (
            <Field label="Days" required hint={`Between 1 and ${maxDays} days.`}>
              <input type="number" min={1} max={maxDays} value={days} onChange={(e) => setDays(e.target.value)} className={inputCls} />
            </Field>
          )}
          <Field label="Reason" required>
            <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} className={inputCls}>
              <option value="">Select a reason…</option>
              {data.reasons.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Internal Note" hint="Visible to authorised Admins only.">
            <textarea rows={3} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} className={inputCls} />
          </Field>
          <p className="flex gap-2 rounded-xl bg-lavender-100/70 p-2.5 text-[11.5px] text-slate-600"><ShieldAlert className="size-4 shrink-0 text-royal-500" />Payments cannot be marked successful here — payment truth comes from the payment system.</p>
        </>
      )}
    </Drawer>
  )
}

export function ManageVisibilityDrawer({ data, onClose, onSubmit }) {
  const permitted = data.permitted.visibility
  const [action, setAction] = useState(permitted[0])
  const [reasonCode, setReasonCode] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const { busy, error, run } = useSubmit(onSubmit)
  const blocked = ['suspended', 'deactivated'].includes(data.provider.accountStatus)
  return (
    <Drawer open title="Manage Visibility" subtitle={`${data.provider.name} • ${data.visibility.level === 'premium' ? 'Premium' : 'Standard'} visibility`} onClose={onClose}
      footer={<div className="flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn disabled={!reasonCode || !action || busy} onClick={() => run({ action, reasonCode, internalNote, expectedVersion: data.visibility.version })}>{busy ? 'Applying…' : 'Confirm Change'}</Btn></div>}>
      {blocked && <ErrorBanner>Account is {data.provider.accountStatus}. Premium Visibility or featured placement cannot override account status.</ErrorBanner>}
      <ActionPicker actions={permitted} catalog={VIS_ACTIONS} value={action} onChange={setAction} />
      <Field label="Reason" required>
        <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} className={inputCls}>
          <option value="">Select a reason…</option>
          {data.reasons.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
        </select>
      </Field>
      <Field label="Internal Note" hint="Visible to authorised Admins only.">
        <textarea rows={3} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} className={inputCls} />
      </Field>
      <p className="text-[11.5px] text-slate-500">Visibility changes never touch billing and are recorded in Visibility History.</p>
      <ErrorBanner>{error}</ErrorBanner>
    </Drawer>
  )
}

export function VisibilityRulesDrawer({ data, onClose }) {
  const v = data.visibility
  return (
    <Drawer open title="Visibility & Discovery Rules" subtitle="How this provider's placement is decided" onClose={onClose}>
      <section className="space-y-1.5 text-[12px] text-slate-700">
        <h4 className="font-bold text-royal-950">Standard visibility requires</h4>
        <ul className="list-disc space-y-1 pl-5">
          <li>Account not suspended or deactivated</li>
          <li>Verified provider</li>
          <li>Active subscription (or within the {data.status.gracePeriodDays}-day payment grace period)</li>
          <li>No active public-visibility restriction and visibility not paused</li>
          <li>Approved profile content</li>
        </ul>
      </section>
      <section className="space-y-1.5 text-[12px] text-slate-700">
        <h4 className="font-bold text-royal-950">Premium Visibility benefits (configured)</h4>
        <ul className="list-disc space-y-1 pl-5">{v.premium.benefits.map((b) => <li key={b}>{b}</li>)}</ul>
        <p className="text-slate-500">Premium can never override an account suspension, verification requirement or restriction.</p>
      </section>
      <section className="space-y-1.5 text-[12px]">
        <h4 className="font-bold text-royal-950">Current evaluation</h4>
        {v.placement.map((p) => <Row key={p.key} label={p.label}>{humanize(p.state)}{p.reason && <span className="block text-[11px] font-normal text-slate-500">{p.reason}</span>}</Row>)}
      </section>
    </Drawer>
  )
}
