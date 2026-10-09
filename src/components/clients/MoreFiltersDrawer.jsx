import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import Button from '../ui/Button'
import { clientService } from '../../services/clientService'
import { MARKETS } from '../../constants/markets'
import {
  CLIENT_STATUS_TABS,
  GUEST_CONVERTED_OPTIONS,
  ISSUE_OPTIONS,
  LAST_BOOKING_OPTIONS,
  MEMBERSHIP_OPTIONS,
  RECENCY_OPTIONS,
  REGISTRATION_METHOD_OPTIONS,
  SORT_OPTIONS,
} from '../../constants/clients'

const fieldCls =
  'h-9 w-full rounded-lg border border-[#ddd7ee] bg-white px-3 text-[12.5px] text-[#1b1140] focus:border-[#7a5cf0] focus:ring-3 focus:ring-[#7a5cf0]/15 focus:outline-none disabled:bg-[#f7f6fb] disabled:text-[#6b6785]'

function Section({ title, children }) {
  return (
    <section className="space-y-3 border-b border-[#efecf7] py-4 last:border-0">
      <h3 className="text-[11px] font-bold tracking-[0.12em] text-[#6b6785] uppercase">{title}</h3>
      {children}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium text-[#2a1b57]">{label}</span>
      {children}
    </label>
  )
}

function Select({ value, onChange, options, disabled }) {
  return (
    <select className={fieldCls} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value || 'any'} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

const ADVANCED = ['status', 'membership', 'reg', 'guest', 'country', 'region', 'city', 'bmin', 'bmax', 'lastb', 'lasta', 'issues', 'from', 'to', 'sort']

export default function MoreFiltersDrawer({ open, filters, market, canSeeSafety, canSeeFinancial, onApply, onReset, onClose }) {
  const [draft, setDraft] = useState(filters)
  const scoped = !market.isGlobal

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }))
  const country = scoped ? market.id : draft.country
  const places = useMemo(() => clientService.getCities(country || 'ALL'), [country])
  const regions = useMemo(() => [...new Set(places.map((p) => p.region))], [places])
  const cities = useMemo(() => places.filter((p) => !draft.region || p.region === draft.region), [places, draft.region])

  if (!open) return null

  const toggleIssue = (value) =>
    set('issues', draft.issues.includes(value) ? draft.issues.filter((v) => v !== value) : [...draft.issues, value])

  const apply = () => {
    const patch = {}
    for (const k of ADVANCED) patch[k] = draft[k]
    onApply(patch)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-[#13072e]/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="More filters"
        className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200"
      >
        <header className="flex items-center justify-between border-b border-[#efecf7] px-5 py-4">
          <h2 className="text-[16px] font-bold text-[#1b1140]">More Filters</h2>
          <button type="button" onClick={onClose} aria-label="Close filters" className="rounded-lg p-1.5 text-[#2a1b57] hover:bg-[#f1edff]">
            <X className="size-[18px]" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5">
          <Section title="Account">
            <Field label="Account status">
              <Select value={draft.status} onChange={(v) => set('status', v)} options={CLIENT_STATUS_TABS.map((t) => ({ value: t.id, label: t.id === 'all' ? 'All Statuses' : t.label }))} />
            </Field>
            <Field label="Membership"><Select value={draft.membership} onChange={(v) => set('membership', v)} options={MEMBERSHIP_OPTIONS} /></Field>
            <Field label="Registration method"><Select value={draft.reg} onChange={(v) => set('reg', v)} options={REGISTRATION_METHOD_OPTIONS} /></Field>
            <Field label="Guest converted"><Select value={draft.guest} onChange={(v) => set('guest', v)} options={GUEST_CONVERTED_OPTIONS} /></Field>
          </Section>

          <Section title="Location">
            <Field label="Country">
              <Select
                value={country}
                disabled={scoped}
                onChange={(v) => setDraft((d) => ({ ...d, country: v, region: '', city: '' }))}
                options={[{ value: '', label: 'All Countries' }, ...MARKETS.filter((m) => !m.isGlobal).map((m) => ({ value: m.id, label: m.name }))]}
              />
            </Field>
            <Field label="Region">
              <Select value={draft.region} onChange={(v) => setDraft((d) => ({ ...d, region: v, city: '' }))} options={[{ value: '', label: 'All Regions' }, ...regions.map((r) => ({ value: r, label: r }))]} />
            </Field>
            <Field label="City">
              <Select value={draft.city} onChange={(v) => set('city', v)} options={[{ value: '', label: 'All Cities' }, ...cities.map((c) => ({ value: c.city, label: c.city }))]} />
            </Field>
          </Section>

          <Section title="Activity">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min bookings"><input type="number" min="0" className={fieldCls} value={draft.bmin} onChange={(e) => set('bmin', e.target.value)} placeholder="0" /></Field>
              <Field label="Max bookings"><input type="number" min="0" className={fieldCls} value={draft.bmax} onChange={(e) => set('bmax', e.target.value)} placeholder="Any" /></Field>
            </div>
            <Field label="Last booking"><Select value={draft.lastb} onChange={(v) => set('lastb', v)} options={LAST_BOOKING_OPTIONS} /></Field>
            <Field label="Last active"><Select value={draft.lasta} onChange={(v) => set('lasta', v)} options={RECENCY_OPTIONS} /></Field>
          </Section>

          <Section title="Issues">
            <div className="space-y-2.5">
              {ISSUE_OPTIONS.filter((o) => !o.restricted || canSeeSafety).map((o) => (
                <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-[12.5px] text-[#2a1b57]">
                  <input type="checkbox" className="size-4 rounded accent-[#4527c8]" checked={draft.issues.includes(o.value)} onChange={() => toggleIssue(o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
          </Section>

          <Section title="Registration">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Joined from"><input type="date" className={fieldCls} value={draft.from} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value, joined: '' }))} /></Field>
              <Field label="Joined to"><input type="date" className={fieldCls} value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value, joined: '' }))} /></Field>
            </div>
          </Section>

          <Section title="Sort">
            <Field label="Sort by">
              <Select value={draft.sort} onChange={(v) => set('sort', v)} options={SORT_OPTIONS.filter((o) => !o.financial || canSeeFinancial)} />
            </Field>
          </Section>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#efecf7] px-5 py-4">
          <Button variant="secondary" onClick={() => { onReset(); onClose() }}>Reset</Button>
          <Button className="flex-1 bg-[#4125d0] ring-[#4125d0] hover:bg-[#3519b8]" onClick={apply}>Apply Filters</Button>
        </footer>
      </aside>
    </div>
  )
}
