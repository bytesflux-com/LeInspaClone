import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, Bell, CalendarDays, ChevronRight, CircleCheck, Clock, FileQuestion, FileText, FlaskConical, Image as ImageIcon, Info, ListPlus, Mail, MessageSquare, MoreHorizontal, PenLine, Plus, RefreshCw, Send, ShieldCheck, Smartphone, Trash2, UserRound } from 'lucide-react'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import CountryFlag from '../../components/ui/CountryFlag'
import { infoRequestService } from '../../services/infoRequestService'
import { CONTENT_BASE, INFO_REQUESTS, INFO_STATUS, reviewPath } from '../../constants/contentModeration'
import { cn } from '../../lib/utils'
import { StatePill } from '../../components/bookings/OpsUI'
import { CARD, Card, ProviderAvatarImg, Rows, Verified, stamp } from '../../components/content/ContentUI'

const TYPE_ICON = { additional_document: FileText, replacement_document: RefreshCw, clarification: FileQuestion, missing_information: Info, supporting_evidence: ShieldCheck, updated_information: PenLine, other: MoreHorizontal }
const DEADLINES = [['none', 'No Deadline'], ['24h', '24 Hours'], ['3d', '3 Days'], ['7d', '7 Days'], ['custom', 'Custom Date']]
const field = 'w-full rounded-lg border border-[#ddd7ee] bg-white px-2.5 py-2 text-[12.5px] text-[#1b1140] focus:border-[#7a5cf0] focus:outline-none'
// The stored message is concrete text — no unresolved placeholders reach the provider.
const fillTemplate = (w) => w.template.replace('{name}', String(w.origin.provider.name || '').split(' ')[0] || 'there').replace('{review}', `${String(w.origin.reviewType || '').toLowerCase()} review`)
const blank = () => ({ itemId: `ITEM-${Math.random().toString(36).slice(2, 7)}`, label: '', responseType: 'upload_document', required: true })

// Where "Back to Review" / "Continue Review" goes for each originating workflow.
function originPath(origin, returnTo) {
  if (returnTo) return returnTo
  if (!origin) return INFO_REQUESTS
  if (['content', 'profile_change', 'service'].includes(origin.originModule)) {
    const type = origin.originModule === 'profile_change' ? 'profile_change' : origin.originModule === 'service' ? 'service' : null
    return (type && reviewPath({ contentType: type, id: origin.originRecordId })) || `${CONTENT_BASE}?c=${origin.originRecordId}`
  }
  if (origin.originModule === 'verification') return `/verifications/${origin.originRecordId}`
  return INFO_REQUESTS
}
const crumbs = (origin) =>
  ['content', 'profile_change', 'service'].includes(origin?.originModule)
    ? [['Content Approval Center', CONTENT_BASE], [origin.reviewType ? `${origin.reviewType} Review` : 'Content Review', null]]
    : origin?.originModule === 'verification'
      ? [['Verification Center', '/verifications'], [`${origin.reviewType} Review`, null]]
      : [['Information Requests', INFO_REQUESTS]]

function Header({ origin, back }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex size-11 items-center justify-center rounded-xl bg-[#4125d0] text-white shadow"><FileQuestion className="size-6" /></span>
        <div>
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[12px] text-[#4a4466]">
            {crumbs(origin).map(([l, to]) => <span key={l} className="flex items-center gap-1">{to ? <Link to={to} className="hover:text-[#4527c8]">{l}</Link> : <span>{l}</span>}<ChevronRight className="size-3.5" /></span>)}
            <span className="font-semibold text-[#4527c8]">Request More Information</span>
          </nav>
          <h1 className="font-display text-[34px] leading-none font-bold tracking-tight text-[#1b1140]">Request More Information</h1>
          <p className="mt-1 text-[13px] text-[#2a1b57]">Ask the provider for additional information or evidence needed to continue this review.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg border border-[#e6d9bf] bg-[#fbf6ea] px-2.5 py-1 text-[10.5px] leading-tight text-[#8a6a2f]"><b className="block text-[11px]">SHARED</b>Used across verification, content moderation, account reviews and more.</span>
        <Link to={back} className="inline-flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-[#4125d0] bg-white px-3.5 text-[12.5px] font-semibold text-[#4125d0] hover:bg-[#f4f0ff]"><ArrowLeft className="size-4" /> Back to Review</Link>
        {origin?.provider?.id && <Link to={`/providers/${origin.provider.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#ddd7ee] bg-white px-3.5 text-[12.5px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]"><UserRound className="size-4" /> View Provider Profile</Link>}
      </div>
    </header>
  )
}

function ContextRow({ origin, statusPill }) {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section className={cn(CARD, 'flex flex-wrap items-center gap-x-6 gap-y-3 p-4')}>
        <div className="flex items-center gap-3">
          <ProviderAvatarImg url={origin.provider.photoUrl} name={origin.provider.name} size={76} />
          <div className="leading-snug">
            <p className="flex items-center gap-1 text-[20px] font-bold text-[#1b1140]">{origin.provider.name}{origin.provider.verified && <Verified />}</p>
            <p className="text-[12px] text-[#4a4466]">{origin.provider.ref}</p>
            <p className="text-[12.5px] font-semibold text-[#2a1b57]">{origin.provider.typeLabel}</p>
            <p className="flex items-center gap-1 text-[12px] text-[#4a4466]"><CountryFlag code={origin.countryCode} className="h-3 w-4.5" />{origin.provider.city || origin.countryCode}</p>
          </div>
        </div>
        <div className="space-y-1 border-l border-[#efecf7] pl-6 text-[12.5px]">
          <span className="rounded-md bg-[#ece5fd] px-2 py-0.5 text-[11px] font-semibold text-[#4527c8]">Related Review</span>
          <p className="font-bold text-[#1b1140]">{origin.reviewType}</p>
          <p className="text-[#2a1b57]">Case ID: <b>{origin.caseId}</b></p>
          <p className="flex items-center gap-1.5 text-[#2a1b57]">Current status: {statusPill}</p>
        </div>
      </section>
      <Card title="Request Context" icon={Info}>
        <Rows rows={[['Module', origin.originModule === 'verification' ? 'Verification' : origin.originModule === 'profile_change' ? 'Profile Changes' : origin.originModule === 'service' ? 'Service Review' : 'Content Moderation'], ['Review type', origin.reviewType], ['Related provider', origin.provider.name], origin.relatedItem && ['Related item', origin.relatedItem], ['Case', origin.caseId]]} />
      </Card>
    </div>
  )
}

function ProviderPhonePreview({ name, title, message, items, dueAt }) {
  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[28px] border-[6px] border-[#1b1140] bg-white shadow-xl">
      <div className="flex items-center justify-between rounded-t-[22px] bg-[#f7f4ff] px-3 py-2 text-[11px] font-bold text-[#1b1140]"><span className="font-display text-[14px]">Lé Inspa</span><span>☰</span></div>
      <div className="space-y-2 p-3 text-[11px]">
        <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#1b1140]"><span className="flex size-5 items-center justify-center rounded-full bg-[#f08a24] text-white">!</span>More Information Required</p>
        <p className="font-semibold text-[#4527c8]">{title}</p>
        <p className="whitespace-pre-line text-[#2a1b57]">{(message || '').replace('{name}', name.split(' ')[0])}</p>
        <ol className="space-y-1">
          {items.filter((i) => i.label).map((i, n) => (
            <li key={i.itemId} className="flex items-center gap-1.5">
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#4125d0] text-[9px] font-bold text-white">{n + 1}</span>
              <span className="flex-1 text-[#1b1140]">{i.label}</span>
              <span className={cn('rounded px-1 text-[9px] font-bold', i.required ? 'bg-[#ffecd6] text-[#b45309]' : 'bg-[#eceef3] text-[#4b5068]')}>{i.required ? 'Required' : 'Optional'}</span>
            </li>
          ))}
        </ol>
        {dueAt && <p className="flex items-center gap-1.5 rounded-lg bg-[#fff6ec] px-2 py-1.5 text-[#b45309]"><CalendarDays className="size-3.5" />Please submit by <b>{new Date(dueAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</b></p>}
        <span className="flex h-8 items-center justify-center rounded-lg bg-[#4125d0] text-[11.5px] font-semibold text-white">Submit Information</span>
      </div>
    </div>
  )
}

function PreviousRequests({ list, countryCode }) {
  return (
    <Card title="Previous Requests for This Review" icon={Clock}>
      {list.length === 0 ? <p className="text-[12px] text-[#6b6785]">No earlier requests for this case.</p> : (
        <table className="w-full text-[11.5px]">
          <thead><tr className="text-left text-[#4a4466]"><th className="py-1 font-semibold">Date</th><th className="font-semibold">Request</th><th className="font-semibold">Status</th><th className="font-semibold">Sent by</th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.requestId} className="border-t border-[#f0edf8]">
                <td className="py-1.5 whitespace-nowrap">{stamp(r.sentAt || r.createdAt, countryCode).split(' • ')[0]}</td>
                <td className="pr-1"><Link to={`${INFO_REQUESTS}/${r.requestId}`} className="text-[#4527c8] hover:underline">{r.items?.[0]?.label || r.requestTypeLabel}</Link></td>
                <td><StatePill map={INFO_STATUS} value={r.status} /></td>
                <td className="whitespace-nowrap">{r.createdBy?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

// ---------- builder (new request) ----------
function Builder({ originModule, originRecordId, returnTo }) {
  const navigate = useNavigate()
  const [ws, setWs] = useState(null)
  const [error, setError] = useState(null)
  const [type, setType] = useState(null)
  const [items, setItems] = useState([blank()])
  const [message, setMessage] = useState('')
  const [note, setNote] = useState('')
  const [deadline, setDeadline] = useState('3d')
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('23:59')
  const [reminders, setReminders] = useState({ initial: true, before24h: true, atDeadline: true, escalate: false })
  const [channels, setChannels] = useState(['in_app', 'email'])
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    let cancelled = false
    infoRequestService.getWorkspace({ originModule, originRecordId }).then((w) => {
      if (cancelled) return
      setWs(w)
      setType(w.requestTypes[0]?.id)
      setMessage(fillTemplate(w))
    }).catch((err) => !cancelled && setError(err?.message || 'Unable to load this case.'))
    return () => {
      cancelled = true
    }
  }, [originModule, originRecordId])

  const dueAt = useMemo(() => {
    if (deadline === 'none') return null
    if (deadline === 'custom') return customDate ? new Date(`${customDate}T${customTime || '23:59'}`).toISOString() : null
    const hours = { '24h': 24, '3d': 72, '7d': 168 }[deadline]
    const d = new Date(Date.now() + hours * 3600 * 1000)
    d.setHours(23, 59, 0, 0)
    return d.toISOString()
  }, [deadline, customDate, customTime])

  const back = originPath(ws?.origin || { originModule, originRecordId }, returnTo)
  if (error) return <div className="space-y-3 px-4 pt-3"><Header origin={null} back={back} /><ErrorState title="Unable to open this case" description={error} /></div>
  if (!ws) return <div className="space-y-3 px-4 pt-3"><Header origin={null} back={back} /><Skeleton className="h-[640px] rounded-2xl" /></div>

  const save = async (send) => {
    setBusy(true)
    setFormError(null)
    try {
      const saved = await infoRequestService.save({ send, originModule, originRecordId, requestType: type, items, providerMessage: message, internalNote: note, dueAt, reminders, channels })
      navigate(`${INFO_REQUESTS}/${saved.requestId}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`, { replace: true })
    } catch (err) {
      setFormError(err?.message || 'The request could not be saved.')
      setBusy(false)
    }
  }
  const setItem = (id, patch) => setItems((list) => list.map((i) => (i.itemId === id ? { ...i, ...patch } : i)))
  const typeLabel = ws.requestTypes.find((t) => t.id === type)?.label

  return (
    <div className="min-h-full space-y-3 px-4 pt-3 pb-24">
      <Header origin={ws.origin} back={back} />
      {infoRequestService.isMock && <p className="inline-flex items-center gap-1 rounded-md bg-[#fff4e0] px-2 py-1 text-[11px] font-semibold text-[#9a5a06]"><FlaskConical className="size-3" /> Demo data</p>}
      <ContextRow origin={ws.origin} statusPill={<StatePill map={{ x: [String(ws.origin.caseStatus || 'open').replaceAll('_', ' '), 'orange'] }} value="x" />} />

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className={cn(CARD, 'space-y-4 p-4')}>
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#1b1140]"><span className="flex size-6 items-center justify-center rounded-md bg-[#4125d0] text-[12px] text-white">1</span>Request Details</h2>
          <div>
            <p className="mb-2 text-[12.5px] font-semibold text-[#1b1140]">What do you need?</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ws.requestTypes.map((t) => {
                const Icon = TYPE_ICON[t.id] || Info
                return (
                  <button key={t.id} type="button" onClick={() => setType(t.id)} aria-pressed={type === t.id} className={cn('flex items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left text-[12px] font-semibold transition', type === t.id ? 'border-[#4125d0] bg-[#f4f0ff] text-[#4125d0]' : 'border-[#e6e1f3] text-[#2a1b57] hover:bg-[#faf9fe]')}>
                    <Icon className="size-4 shrink-0" />{t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[12.5px] font-semibold text-[#1b1140]">Required Information</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-[12px]">
                <thead><tr className="bg-[#f1eefb] text-left text-[11.5px] text-[#1b1140]"><th className="w-8 rounded-l-lg px-2 py-1.5">#</th><th className="px-2">Information requested</th><th className="w-44 px-2">Response type</th><th className="w-20 px-2">Required</th><th className="w-10 rounded-r-lg" /></tr></thead>
                <tbody>
                  {items.map((it, n) => (
                    <tr key={it.itemId} className="border-b border-[#f0edf8]">
                      <td className="px-2 py-1.5 font-semibold text-[#4a4466]">{n + 1}</td>
                      <td className="px-2"><input value={it.label} onChange={(e) => setItem(it.itemId, { label: e.target.value })} placeholder="e.g. Clear copy of professional certificate" className={field} /></td>
                      <td className="px-2"><select value={it.responseType} onChange={(e) => setItem(it.itemId, { responseType: e.target.value })} className={field}>{ws.responseTypes.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select></td>
                      <td className="px-2">
                        <button type="button" role="switch" aria-checked={it.required} onClick={() => setItem(it.itemId, { required: !it.required })} className={cn('relative h-5 w-9 rounded-full transition', it.required ? 'bg-[#4125d0]' : 'bg-[#d6d2e4]')}><span className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow transition', it.required ? 'left-[18px]' : 'left-0.5')} /></button>
                      </td>
                      <td className="text-center"><button type="button" disabled={items.length === 1} onClick={() => setItems((l) => l.filter((x) => x.itemId !== it.itemId))} aria-label="Remove item" className="rounded p-1 text-[#dc2626] hover:bg-[#fff1f1] disabled:opacity-30"><Trash2 className="size-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => setItems((l) => [...l, blank()])} className="mt-2 inline-flex h-8 items-center gap-1 rounded-lg border border-[#b9a9f0] px-3 text-[12px] font-semibold text-[#4527c8] hover:bg-[#f4f0ff]"><Plus className="size-4" />Add Another Item</button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1">
              <span className="flex items-center justify-between text-[12.5px] font-semibold text-[#1b1140]">Provider-Facing Message<button type="button" onClick={() => setMessage(fillTemplate(ws))} className="rounded-md border border-[#b9a9f0] px-2 py-0.5 text-[11px] text-[#4527c8] hover:bg-[#f4f0ff]">Use Template</button></span>
              <textarea rows={7} value={message} maxLength={1000} onChange={(e) => setMessage(e.target.value)} className={field} />
              <span className="block text-right text-[10.5px] text-[#6b6785]">{message.length}/1000</span>
            </label>
            <label className="block space-y-1">
              <span className="text-[12.5px] font-semibold text-[#1b1140]">Internal Admin Note <span className="font-normal text-[#6b6785]">(not visible to provider)</span></span>
              <textarea rows={7} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} className={field} placeholder="Why this information is needed — admins only." />
              <span className="block text-right text-[10.5px] text-[#6b6785]">{note.length}/1000</span>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <fieldset className="space-y-1.5 rounded-xl border border-[#ebe7f6] p-3">
              <legend className="flex items-center gap-1 px-1 text-[12px] font-bold text-[#1b1140]"><CalendarDays className="size-4 text-[#4527c8]" />Response Deadline</legend>
              <select value={deadline} onChange={(e) => setDeadline(e.target.value)} className={field}>{DEADLINES.map(([v, l]) => <option key={v} value={v}>{l}{v === { 24: '24h', 72: '3d', 168: '7d' }[ws.defaultDeadlineHours] ? ' (default)' : ''}</option>)}</select>
              {deadline === 'custom' && <div className="flex gap-1.5"><input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className={field} /><input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className={cn(field, 'w-28')} /></div>}
              {dueAt && <p className="text-[11px] text-[#4a4466]">Due: {stamp(dueAt, ws.origin.countryCode)}</p>}
            </fieldset>
            <fieldset className="space-y-1 rounded-xl border border-[#ebe7f6] p-3 text-[12px]">
              <legend className="flex items-center gap-1 px-1 text-[12px] font-bold text-[#1b1140]"><Bell className="size-4 text-[#4527c8]" />Reminder Settings</legend>
              {[['initial', 'Send initial notification'], ['before24h', 'Remind 24 hours before deadline'], ['atDeadline', 'Remind at deadline'], ['escalate', 'Escalate if no response after 3 days']].map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 text-[#2a1b57]"><input type="checkbox" checked={reminders[k]} onChange={(e) => setReminders((r) => ({ ...r, [k]: e.target.checked }))} className="size-3.5 accent-[#4125d0]" />{l}</label>
              ))}
            </fieldset>
            <fieldset className="space-y-1 rounded-xl border border-[#ebe7f6] p-3 text-[12px]">
              <legend className="px-1 text-[12px] font-bold text-[#1b1140]">Notification Channels</legend>
              {ws.channels.map((c) => {
                const Icon = c.id === 'email' ? Mail : c.id === 'sms' ? MessageSquare : Smartphone
                return <label key={c.id} className="flex items-center gap-2 text-[#2a1b57]"><input type="checkbox" checked={channels.includes(c.id)} onChange={(e) => setChannels((l) => (e.target.checked ? [...l, c.id] : l.filter((x) => x !== c.id)))} className="size-3.5 accent-[#4125d0]" /><Icon className="size-3.5 text-[#4527c8]" />{c.label}</label>
              })}
            </fieldset>
          </div>
          {formError && <p role="alert" className="rounded-lg bg-[#fff1f1] px-3 py-2 text-[12.5px] text-[#b91c1c]">{formError}</p>}
        </section>

        <div className="space-y-3">
          <Card title="Provider Preview (How They Will See It)" icon={Smartphone} bodyClass="bg-[#f7f6fc] py-4">
            <ProviderPhonePreview name={ws.origin.provider.name} title={`${ws.origin.reviewType} — ${typeLabel || ''}`} message={message} items={items} dueAt={dueAt} />
          </Card>
          <PreviousRequests list={ws.history} countryCode={ws.origin.countryCode} />
        </div>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 flex justify-end gap-2 border-t border-[#e6e1f3] bg-white/95 px-4 py-2.5 backdrop-blur">
        <Link to={back} className="flex h-10 items-center rounded-lg border border-[#ddd7ee] px-4 text-[12.5px] font-semibold text-[#2a1b57] hover:bg-[#f4f1fc]">Cancel</Link>
        <button type="button" disabled={busy} onClick={() => save(false)} className="h-10 rounded-lg border border-[#b9a9f0] px-4 text-[12.5px] font-semibold text-[#4527c8] hover:bg-[#f4f0ff] disabled:opacity-50">Save Draft</button>
        <button type="button" disabled={busy} onClick={() => save(true)} className="flex h-10 items-center gap-2 rounded-lg bg-[#4125d0] px-5 text-[12.5px] font-semibold text-white shadow hover:bg-[#3519b8] disabled:opacity-50"><Send className="size-4" />{busy ? 'Sending…' : 'Send Request'}</button>
      </div>
    </div>
  )
}

// ---------- tracking (sent request) ----------
function Tracking({ requestId, returnTo }) {
  const navigate = useNavigate()
  const [req, setReq] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [extendTo, setExtendTo] = useState('')
  const load = useCallback(() => {
    infoRequestService.get(requestId).then(setReq).catch((err) => setError(err?.message || 'Unable to load this request.'))
  }, [requestId])
  useEffect(load, [load])

  const back = originPath(req?.origin, returnTo)
  if (error) return <div className="space-y-3 px-4 pt-3"><Header origin={null} back={INFO_REQUESTS} /><ErrorState title="Unable to open this request" description={error} /></div>
  if (!req) return <div className="space-y-3 px-4 pt-3"><Header origin={null} back={INFO_REQUESTS} /><Skeleton className="h-[560px] rounded-2xl" /></div>

  const act = async (action, extra = {}) => {
    setBusy(true)
    setActionError(null)
    try {
      await infoRequestService.action({ requestId, action, ...extra })
      load()
      return true
    } catch (err) {
      setActionError(err?.message || 'Action failed.')
      return false
    } finally {
      setBusy(false)
    }
  }
  const p = req.progress
  const tz = req.countryCode

  return (
    <div className="min-h-full space-y-3 px-4 pt-3 pb-6">
      <Header origin={req.origin} back={back} />
      <ContextRow origin={req.origin} statusPill={<StatePill map={INFO_STATUS} value={req.status} />} />
      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <section className={cn(CARD, 'p-4')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-[#6b6785] uppercase">Information Request</p>
                <p className="text-[20px] font-bold text-[#1b1140]">{req.reference}</p>
                <div className="mt-1"><StatePill map={INFO_STATUS} value={req.status} /></div>
              </div>
              <Rows rows={[['Request type', req.requestTypeLabel], ['Sent', req.sentAt ? stamp(req.sentAt, tz) : 'Not sent (draft)'], ['Due', req.dueAt ? stamp(req.dueAt, tz) : 'No deadline'], ['Sent by', req.createdBy?.name], ['Channels', req.channels.map((c) => ({ in_app: 'In-App', email: 'Email', sms: 'SMS' })[c]).join(' • ') || '—']]} />
            </div>
            <div className="mt-3">
              <p className="mb-1.5 flex items-center justify-between text-[12.5px] font-semibold text-[#1b1140]">Requested Items <span className="text-[11.5px] font-medium text-[#4a4466]">{p.received} of {p.total} received{p.requiredReceived < p.required ? ` · ${p.required - p.requiredReceived} required outstanding` : ''}</span></p>
              <ul className="divide-y divide-[#f0edf8] rounded-xl border border-[#ebe7f6]">
                {req.items.map((i) => (
                  <li key={i.itemId} className="flex items-center gap-3 px-3 py-2 text-[12.5px]">
                    {i.status === 'received' ? <CircleCheck className="size-4 shrink-0 fill-[#22a652] text-white" /> : <span className="size-4 shrink-0 rounded-full border-2 border-[#c9c5d8]" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#1b1140]">{i.label} {!i.required && <span className="text-[10.5px] text-[#6b6785]">(optional)</span>}</p>
                      {i.status === 'received' ? <p className="text-[11.5px] text-[#15803d]">{i.responseType.startsWith('upload') ? <ImageIcon className="mr-1 inline size-3.5" /> : null}{String(i.response)} · {stamp(i.respondedAt, tz)}</p> : <p className="text-[11.5px] text-[#6b6785]">Awaiting</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-3 rounded-xl bg-[#faf9fe] p-3 text-[12px]">
              <p className="font-semibold text-[#1b1140]">Message to provider</p>
              <p className="mt-0.5 whitespace-pre-line text-[#2a1b57]">{req.providerMessage}</p>
              {req.internalNote && <><p className="mt-2 font-semibold text-[#1b1140]">Internal note <span className="font-normal text-[#6b6785]">(admins only)</span></p><p className="text-[#2a1b57]">{req.internalNote}</p></>}
            </div>
          </section>

          <section className={cn(CARD, 'space-y-2.5 p-4')}>
            <h2 className="text-[14.5px] font-bold text-[#1b1140]">Actions</h2>
            {req.status === 'responded' && <p className="rounded-lg bg-[#ecfaf1] px-3 py-2 text-[12.5px] text-[#15803d]">All required items were received. Continue the review — the originating workflow decides the outcome.</p>}
            {req.status === 'partially_responded' && <p className="rounded-lg bg-[#fff6ec] px-3 py-2 text-[12.5px] text-[#b45309]">Partially responded — the request stays open until every required item is received.</p>}
            {req.status === 'overdue' && <p className="rounded-lg bg-[#fdf0f0] px-3 py-2 text-[12.5px] text-[#b91c1c]">Response overdue. This request never rejects the provider automatically — decide in the originating review.</p>}
            <div className="flex flex-wrap items-center gap-2">
              {req.actions.complete && <button type="button" disabled={busy} onClick={async () => { if (await act('complete')) navigate(back) }} className="flex h-9 items-center gap-1.5 rounded-lg bg-[#15803d] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60">Continue Review →</button>}
              {req.actions.remind && <button type="button" disabled={busy} onClick={() => act('remind')} className="h-9 rounded-lg border border-[#b9a9f0] px-3.5 text-[12.5px] font-semibold text-[#4527c8] hover:bg-[#f4f0ff]">Send Reminder</button>}
              {req.actions.extend && (
                <span className="flex items-center gap-1.5"><input type="date" value={extendTo} onChange={(e) => setExtendTo(e.target.value)} className="h-9 rounded-lg border border-[#ddd7ee] px-2 text-[12px]" aria-label="New deadline" /><button type="button" disabled={busy || !extendTo} onClick={() => act('extend', { dueAt: new Date(`${extendTo}T23:59`).toISOString() })} className="h-9 rounded-lg border border-[#ddd7ee] px-3 text-[12.5px] font-semibold text-[#2a1b57] hover:bg-[#f4f1fc] disabled:opacity-40">Extend Deadline</button></span>
              )}
              {req.actions.escalate && <button type="button" disabled={busy} onClick={() => act('escalate')} className="h-9 rounded-lg border border-[#f2a3a3] bg-[#fff1f1] px-3.5 text-[12.5px] font-semibold text-[#b91c1c]">Escalate</button>}
              {req.actions.cancel && <button type="button" disabled={busy} onClick={() => act('cancel')} className="h-9 rounded-lg px-3.5 text-[12.5px] font-semibold text-[#6b6785] hover:bg-[#f4f1fc]">Cancel Request</button>}
              <Link to={back} className="h-9 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-[#4527c8] hover:underline">Return to Review</Link>
              {infoRequestService.isMock && ['waiting', 'partially_responded', 'overdue'].includes(req.status) && <button type="button" disabled={busy} onClick={() => act('simulate_response')} className="ml-auto inline-flex h-9 items-center gap-1 rounded-lg bg-[#fff4e0] px-3 text-[12px] font-semibold text-[#9a5a06]"><FlaskConical className="size-3.5" />Demo: simulate provider reply</button>}
            </div>
            {actionError && <p role="alert" className="text-[12px] text-[#b91c1c]">{actionError}</p>}
          </section>
        </div>

        <div className="space-y-3">
          <Card title="Provider Preview" icon={Smartphone} bodyClass="bg-[#f7f6fc] py-4">
            <ProviderPhonePreview name={req.origin.provider.name} title={`${req.origin.reviewType} — ${req.requestTypeLabel}`} message={req.providerMessage} items={req.items} dueAt={req.dueAt} />
          </Card>
          <Card title="Request History" icon={ListPlus}>
            <ol className="relative space-y-2 pl-4 before:absolute before:top-1.5 before:bottom-1.5 before:left-[5px] before:w-0.5 before:bg-[#e4defb]">
              {[...req.history].reverse().map((h, i) => (
                <li key={i} className="relative text-[11.5px]"><span className="absolute top-1 -left-4 size-3 rounded-full border-2 border-white bg-[#6d3fe0]" /><p className="font-medium text-[#1b1140]">{h.event}</p><p className="text-[#6b6785]">{stamp(h.at, tz)}{h.actor?.name ? ` · ${h.actor.name}` : ''}</p></li>
              ))}
            </ol>
          </Card>
          <PreviousRequests list={req.previous || []} countryCode={tz} />
        </div>
      </div>
    </div>
  )
}

// ADM-040 — shared Request More Information: /information-requests/new?module=&record= (builder)
// and /information-requests/:requestId (tracking after sending).
export default function RequestMoreInformation() {
  const { requestId } = useParams()
  const [sp] = useSearchParams()
  const location = useLocation()
  const returnTo = sp.get('returnTo') || location.state?.returnTo || null
  if (requestId) return <Tracking key={requestId} requestId={requestId} returnTo={returnTo} />
  const module = sp.get('module')
  const record = sp.get('record')
  if (!module || !record) {
    return <div className="px-4 pt-3"><Header origin={null} back={INFO_REQUESTS} /><ErrorState className="mx-auto mt-8 max-w-xl" title="Open this from a review" description="Request More Information is launched from a verification, content, profile-change or service review so the request keeps its originating case." /></div>
  }
  return <Builder originModule={module} originRecordId={record} returnTo={returnTo} />
}
