import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ChevronDown, ChevronRight, CircleCheck, CircleX, ClipboardCheck, Eye, Gauge, Hourglass, ImagePlus, Images, Info, ListChecks, Maximize2, Play, RefreshCw, Store, Upload, Users } from 'lucide-react'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import Dropdown from '../../components/ui/Dropdown'
import CountryFlag from '../../components/ui/CountryFlag'
import { usePermissions } from '../../hooks/usePermissions'
import { useContentReview } from '../../hooks/useContentModeration'
import { contentModerationService } from '../../services/contentModerationService'
import { PERMISSIONS } from '../../constants/permissions'
import { CONTENT_BASE, MEDIA_CATEGORY } from '../../constants/contentModeration'
import { cn } from '../../lib/utils'
import { DISC, PillTabs, StatePill } from '../../components/bookings/OpsUI'
import { CARD, Card, DecisionDialog, MediaViewer, NotesCard, Placements, PolicyChecklist, ProviderAvatarImg, QualityList, ReviewActions, ReviewHistory, Rows, StatusPill, Verified, stamp } from '../../components/content/ContentUI'

const OPEN = ['awaiting_review', 'under_review', 'resubmitted', 'escalated']
const PENDING = ['awaiting_review', 'under_review']
// Short labels so tile pills fit narrow thumbnails.
const TILE_STATUS = { awaiting_review: ['Awaiting', 'grey'], under_review: ['In Review', 'purple'], approved: ['Approved', 'green'], changes_requested: ['Changes', 'orange'], rejected: ['Rejected', 'red'], escalated: ['Escalated', 'purple'] }

// ADM-037 — Gallery & Media Approval. Media is moderated item by item: one
// rejected image never rejects the rest of the gallery.
export default function GalleryMediaApproval() {
  const { moderationId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { can } = usePermissions()
  const allowed = can(PERMISSIONS.CONTENT_MODERATE)
  const { data: r, error, loading, refetch } = useContentReview(allowed ? moderationId : null)
  const [tab, setTab] = useState('all')
  const [sort, setSort] = useState('position')
  const [selectedId, setSelectedId] = useState(null)
  const [checked, setChecked] = useState(() => new Set())
  const [checksById, setChecksById] = useState({})
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [completed, setCompleted] = useState(null)
  const back = location.state?.returnTo || `${CONTENT_BASE}/gallery`

  const media = useMemo(() => r?.media || [], [r])
  const filtered = useMemo(() => {
    const list = media.filter((m) => tab === 'all' || m.category === tab)
    if (sort === 'status') return [...list].sort((a, z) => Number(PENDING.includes(z.status)) - Number(PENDING.includes(a.status)) || a.position - z.position)
    return [...list].sort((a, z) => a.position - z.position)
  }, [media, tab, sort])

  // Default to the first pending item.
  useEffect(() => {
    if (!media.length) return
    if (!selectedId || !media.some((m) => m.mediaId === selectedId)) setSelectedId((media.find((m) => PENDING.includes(m.status)) || media[0]).mediaId)
  }, [media, selectedId])

  const header = (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex size-11 items-center justify-center rounded-xl bg-[#4125d0] text-white shadow"><Images className="size-6" /></span>
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[12px] text-[#4a4466]">
            <Link to={CONTENT_BASE} className="hover:text-[#4527c8]">Content Approval Center</Link><ChevronRight className="size-3.5" /><span className="font-semibold text-[#4527c8]">Gallery & Media Approval</span>
          </nav>
          <h1 className="font-display text-[34px] leading-none font-bold tracking-tight text-[#1b1140]">Gallery & Media Approval</h1>
          <p className="mt-1 text-[13px] text-[#2a1b57]">Review provider photos and media before they appear publicly across Lé Inspa.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to={back} className="inline-flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-[#4125d0] bg-white px-3.5 text-[12.5px] font-semibold text-[#4125d0] hover:bg-[#f4f0ff]"><ArrowLeft className="size-4" /> Back to Content Approval Center</Link>
        {r?.provider.id && <Link to={`/providers/${r.provider.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#ddd7ee] bg-white px-3.5 text-[12.5px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]"><Store className="size-4" /> View Business Profile</Link>}
      </div>
    </header>
  )

  if (!allowed) return <div className="px-4 pt-3">{header}<ErrorState className="mx-auto mt-8 max-w-xl" title="You don't have access to content moderation" description="Ask a Super Admin to grant the content.moderate permission." /></div>
  if (error) return <div className="space-y-3 px-4 pt-3">{header}<ErrorState title="Unable to open this gallery" description={error} onRetry={refetch} /></div>
  if (loading || !r) return <div className="space-y-3 px-4 pt-3">{header}<Skeleton className="h-[720px] rounded-2xl" /></div>
  if (r.contentType !== 'gallery') return <div className="space-y-3 px-4 pt-3">{header}<ErrorState title="This is not a gallery submission" description={`${r.contentId} is ${r.contentLabel}.`} /></div>

  const s = r.mediaSummary
  const open = OPEN.includes(r.status)
  const reviewing = open && (r.status === 'under_review' || (r.status === 'escalated' && r.assignedTo))
  const idx = Math.max(0, filtered.findIndex((m) => m.mediaId === selectedId))
  const item = filtered[idx] || media[0]
  const itemPending = item && PENDING.includes(item.status)
  const checks = checksById[item?.mediaId] || {}
  const selectedPending = media.filter((m) => checked.has(m.mediaId) && PENDING.includes(m.status))
  const categories = Object.keys(MEDIA_CATEGORY).filter((c) => media.some((m) => m.category === c))
  const nextPending = () => {
    const order = [...filtered.slice(idx + 1), ...filtered.slice(0, idx)]
    return order.find((m) => PENDING.includes(m.status))
  }

  const start = async () => {
    setBusy(true)
    setActionError(null)
    try {
      await contentModerationService.startReview(r.id)
      refetch()
    } catch (err) {
      setActionError(err?.message || 'Unable to start the review.')
    } finally {
      setBusy(false)
    }
  }
  const complete = async () => {
    setBusy(true)
    setActionError(null)
    try {
      setCompleted(await contentModerationService.completeGallery({ moderationId: r.id, version: r.version }))
      refetch()
    } catch (err) {
      setActionError(err?.message || 'Unable to complete the review.')
    } finally {
      setBusy(false)
    }
  }
  const afterDecision = () => {
    const next = dialog?.bulk ? null : nextPending()
    setDialog(null)
    setChecked(new Set())
    if (next) setSelectedId(next.mediaId)
    refetch()
  }

  const SUMMARY = [
    ['Submitted', s.submitted, Upload, 'purple'],
    ['Approved', s.approved, CircleCheck, 'green'],
    ['Awaiting Review', s.awaiting + s.underReview, Hourglass, 'orange'],
    ['Changes Requested', s.changesRequested, RefreshCw, 'orange'],
    ['Rejected', s.rejected, CircleX, 'red'],
  ]

  return (
    <div className="min-h-full space-y-3 px-4 pt-3 pb-6">
      {header}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className={cn(CARD, 'flex flex-wrap items-center gap-x-6 gap-y-3 p-4')}>
          <div className="flex items-center gap-3">
            <ProviderAvatarImg url={media.find((m) => m.title.toLowerCase().includes('reception'))?.url || media[0]?.url} name={r.provider.name} size={84} rounded="rounded-xl" />
            <div className="leading-snug">
              <p className="flex items-center gap-1 text-[20px] font-bold text-[#1b1140]">{r.provider.name}{r.provider.verified && <Verified />}</p>
              <p className="text-[12px] text-[#4a4466]">{r.provider.ref}</p>
              <p className="text-[12.5px] font-semibold text-[#2a1b57]">{r.provider.typeLabel}</p>
              <p className="flex items-center gap-1 text-[12px] text-[#4a4466]"><CountryFlag code={r.countryCode} className="h-3 w-4.5" />{r.marketName}{r.provider.city && ` • ${r.provider.city}`}</p>
            </div>
          </div>
          <div className="space-y-1.5 text-[12.5px]">
            <StatusPill value={r.status} />
            <p className="text-[#2a1b57]">Submitted: <span className="font-semibold text-[#1b1140]">{stamp(r.submittedAt, r.countryCode)}</span></p>
            <p className="text-[#2a1b57]">Assigned to: <span className="font-semibold text-[#1b1140]">{r.assignedTo?.name || 'Unassigned'}</span></p>
          </div>
        </section>
        <section className={cn(CARD, 'p-4')}>
          <h2 className="mb-2.5 text-[14.5px] font-bold text-[#1b1140]">Submission Summary</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {SUMMARY.map(([l, n, Icon, c]) => (
              <div key={l} className="flex items-center gap-2 rounded-xl border border-[#efecf7] p-2">
                <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', DISC[c])}><Icon className="size-4" /></span>
                <span className="leading-tight"><span className="block text-[18px] font-bold text-[#1b1140]">{n}</span><span className="block text-[10.5px] text-[#4a4466]">{l}</span></span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {open && !reviewing && (
        <section className={cn(CARD, 'flex flex-wrap items-center justify-between gap-3 p-3.5')}>
          <p className="text-[12.5px] text-[#2a1b57]">Start the review to moderate each image. Approved images become eligible for publication only when the gallery review is completed.</p>
          <button type="button" disabled={busy} onClick={start} className="flex h-9 items-center gap-2 rounded-lg bg-[#4125d0] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"><Play className="size-4" />{busy ? 'Starting…' : 'Start Gallery Review'}</button>
        </section>
      )}
      {reviewing && s.complete && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#bfe8cc] bg-[#ecfaf1] p-3.5">
          <div className="text-[12.5px] text-[#14532d]">
            <p className="text-[14px] font-bold">Gallery Review Complete — {s.submitted} media items</p>
            <p>🟢 {s.approved} approved · 🟠 {s.changesRequested} changes requested · 🔴 {s.rejected} rejected · 🟣 {s.escalated} escalated. Only approved items will be published; the rest stay private.</p>
          </div>
          <button type="button" disabled={busy} onClick={complete} className="h-9 rounded-lg bg-[#15803d] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60">{busy ? 'Completing…' : 'Complete Review'}</button>
        </section>
      )}
      {completed && <p role="status" className="rounded-lg bg-[#ecfaf1] px-3 py-2 text-[12.5px] font-semibold text-[#15803d]">Gallery review completed. Outcome: {completed.status.replace('_', ' ')}.</p>}
      {actionError && <p role="alert" className="rounded-lg bg-[#fff1f1] px-3 py-2 text-[12.5px] text-[#b91c1c]">{actionError}</p>}

      {categories.length > 1 && (
        <PillTabs label="Media types" tabs={[{ id: 'all', label: 'All', count: media.length }, ...categories.map((c) => ({ id: c, label: MEDIA_CATEGORY[c], count: media.filter((m) => m.category === c).length }))]} value={tab} onChange={setTab} />
      )}

      <div className="grid items-start gap-3 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)_300px] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className={cn(CARD, 'p-3.5')} aria-label="Submitted media">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h2 className="text-[14.5px] font-bold text-[#1b1140]">Submitted Media ({filtered.length})</h2>
            <div className="flex items-center gap-3 text-[12px]">
              <label className="flex items-center gap-1.5 text-[#2a1b57]">
                <input type="checkbox" className="size-3.5 accent-[#4125d0]" disabled={!reviewing} checked={filtered.some((m) => PENDING.includes(m.status)) && filtered.filter((m) => PENDING.includes(m.status)).every((m) => checked.has(m.mediaId))} onChange={(e) => setChecked(e.target.checked ? new Set(filtered.filter((m) => PENDING.includes(m.status)).map((m) => m.mediaId)) : new Set())} />
                Select pending
              </label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-8 rounded-lg border border-[#ddd7ee] bg-white px-2 text-[12px]" aria-label="Sort media">
                <option value="position">Sort: Gallery order</option>
                <option value="status">Sort: Pending first</option>
              </select>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((m) => {
              const sel = m.mediaId === item?.mediaId
              const pending = PENDING.includes(m.status)
              return (
                <li key={m.mediaId}>
                  <div className={cn('group overflow-hidden rounded-xl border bg-white transition', sel ? 'border-[#4125d0] ring-2 ring-[#4125d0]/25' : 'border-[#ebe7f6] hover:shadow-md')}>
                    <div className="relative">
                      <button type="button" onClick={() => setSelectedId(m.mediaId)} className="block w-full" aria-label={`Review ${m.title}`}>
                        <img src={m.url} alt={m.title} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                      </button>
                      <span className="absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-md bg-white/90 text-[10.5px] font-bold text-[#1b1140]">{m.position}</span>
                      {pending && reviewing && (
                        <input type="checkbox" aria-label={`Select ${m.title}`} checked={checked.has(m.mediaId)} onChange={() => setChecked((prev) => { const n = new Set(prev); if (n.has(m.mediaId)) n.delete(m.mediaId); else n.add(m.mediaId); return n })} className="absolute top-1.5 right-1.5 size-4 accent-[#4125d0]" />
                      )}
                      <button type="button" onClick={() => setSelectedId(m.mediaId)} aria-label="Preview" className="absolute right-1.5 bottom-1.5 hidden rounded-md bg-black/50 p-1 text-white group-hover:block"><Maximize2 className="size-3.5" /></button>
                    </div>
                    <div className="space-y-1 p-2">
                      <p className="truncate text-[12px] font-semibold text-[#1b1140]">{m.title}</p>
                      <p className="text-[10.5px] text-[#6b6785]">{MEDIA_CATEGORY[m.category]}</p>
                      <StatePill map={TILE_STATUS} value={m.status} />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          {reviewing && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#efecf7] pt-3">
              <span className="text-[12px] font-semibold text-[#2a1b57]">{selectedPending.length} selected</span>
              <button type="button" disabled={!selectedPending.length} onClick={() => setDialog({ decision: 'approve', bulk: true })} className="h-9 rounded-lg bg-[#15803d] px-3.5 text-[12px] font-semibold text-white disabled:opacity-40">Approve Selected</button>
              <button type="button" disabled={!selectedPending.length} onClick={() => setDialog({ decision: 'request_changes', bulk: true })} className="h-9 rounded-lg border-[1.5px] border-[#f0a35c] bg-[#fff6ec] px-3.5 text-[12px] font-semibold text-[#b45309] disabled:opacity-40">Request Changes</button>
              <Dropdown
                align="left"
                menuWidth="w-48"
                trigger={({ open: o }) => <button type="button" disabled={!selectedPending.length} className={cn('flex h-9 items-center gap-1 rounded-lg border px-3 text-[12px] font-semibold text-[#2a1b57] disabled:opacity-40', o ? 'border-[#7a5cf0]' : 'border-[#ddd7ee]')}>More Actions <ChevronDown className="size-3.5" /></button>}
              >
                <button type="button" onClick={() => selectedPending.length && setDialog({ decision: 'reject', bulk: true })} className="flex w-full rounded-lg px-3 py-2 text-left text-[12.5px] font-medium text-[#b91c1c] hover:bg-[#fff1f1]">Reject Selected…</button>
                <button type="button" onClick={() => setChecked(new Set())} className="flex w-full rounded-lg px-3 py-2 text-left text-[12.5px] font-medium text-[#2a1b57] hover:bg-[#f4f1fc]">Clear selection</button>
              </Dropdown>
            </div>
          )}
        </section>

        {item && (
          <div className="min-w-0 space-y-3">
            <section className={cn(CARD, 'p-3.5')} aria-label="Selected media">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-[14.5px] font-bold text-[#1b1140]">Selected Media</h2>
                <div className="flex items-center gap-1.5 text-[12px]">
                  <button type="button" onClick={() => setSelectedId(filtered[(idx - 1 + filtered.length) % filtered.length].mediaId)} className="rounded-lg border border-[#ddd7ee] px-2.5 py-1 font-semibold text-[#4527c8] hover:bg-[#f4f1fc]">‹ Previous</button>
                  <span className="text-[#4a4466]">{idx + 1} of {filtered.length}</span>
                  <button type="button" onClick={() => setSelectedId(filtered[(idx + 1) % filtered.length].mediaId)} className="rounded-lg border border-[#ddd7ee] px-2.5 py-1 font-semibold text-[#4527c8] hover:bg-[#f4f1fc]">Next ›</button>
                </div>
              </div>
              <MediaViewer items={[item]} height="h-[330px]" showStrip={false} footer={
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-[#faf9fe] px-2.5 py-1.5 text-[11.5px] text-[#2a1b57]">
                  <span className="font-semibold">{item.title}</span>
                  {item.width && <span>{item.width} × {item.height}</span>}
                  {item.sizeBytes && <span>{(item.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>}
                  {item.format && <span>{item.format}</span>}
                  <span className="ml-auto"><StatusPill value={item.status} /></span>
                </p>
              } />
            </section>
            <div className="space-y-3">
              <Card title="Image Quality" icon={Gauge}><QualityList quality={item.quality} /></Card>
              <Card title="Review Checklist" icon={ListChecks}>
                <PolicyChecklist checklist={item.checklist} value={checks} onChange={(v) => setChecksById((p) => ({ ...p, [item.mediaId]: v }))} readOnly={!reviewing || !itemPending} />
              </Card>
            </div>
            {reviewing && itemPending ? (
              <section className={cn(CARD, 'p-3.5')}>
                <div className="grid gap-2 sm:grid-cols-4 [&>div]:contents">
                  <ReviewActions onAction={(d) => setDialog({ decision: d })} labels={{ approve: 'Approve Media', reject: 'Reject Media' }} />
                </div>
                {item.checklist.some((c) => checks[c.id] !== 'pass') && <p className="mt-2 text-[11px] text-[#6b6785]">Approve requires every check for this image to pass.</p>}
              </section>
            ) : item.decision ? (
              <section className={cn(CARD, 'space-y-1 p-3.5 text-[12px]')}>
                <p className="font-semibold text-[#1b1140]">Decision: <StatusPill value={item.status} /></p>
                {item.decision.reason && <p className="text-[#2a1b57]">Reason: {item.decision.reason}</p>}
                {item.decision.providerMessage && <p className="text-[#4a4466]">Message to provider: “{item.decision.providerMessage}”</p>}
                {item.decision.by && <p className="text-[11px] text-[#6b6785]">by {item.decision.by.name} · {stamp(item.decision.at, r.countryCode)}</p>}
                {nextPending() && <button type="button" onClick={() => setSelectedId(nextPending().mediaId)} className="mt-1 font-semibold text-[#4527c8] hover:underline">Next Pending →</button>}
              </section>
            ) : null}
          </div>
        )}

        {item && (
          <div className="min-w-0 space-y-3 xl:col-span-2 2xl:col-span-1">
            <Card title="Media Information" icon={Info}>
              <Rows rows={[
                ['Media ID', item.mediaId],
                ['Type', MEDIA_CATEGORY[item.category]],
                ['Uploaded by', r.provider.name],
                item.relatedEntity && [`Related ${item.relatedEntity.type?.toLowerCase() || 'item'}`, item.relatedEntity.name],
                item.branch && ['Branch', item.branch],
                ['Market', <span key="m" className="inline-flex items-center gap-1"><CountryFlag code={r.countryCode} className="h-3 w-4.5" />{r.marketName}</span>],
                ['Submitted', stamp(item.uploadedAt || r.submittedAt, r.countryCode)],
                ['Current version', `Version ${item.version}`],
                ['Previous version', item.versions.length ? 'Available' : 'None'],
              ]} />
            </Card>
            <Card title="Where It Will Appear" icon={Eye}><Placements items={item.placements.length ? item.placements : r.placements} /></Card>
            {item.peopleVisible && (
              <Card title="Privacy Check" icon={Users}>
                <Rows rows={[['People visible', 'Yes'], ['Consent requirement', item.consent === 'satisfied' ? <span className="text-[#15803d]">✓ Satisfied</span> : <span className="text-[#b45309]">Review required</span>]]} />
                <p className="mt-1 text-[10.5px] text-[#6b6785]">Do not assume people in a spa photo consented to marketplace publication. Escalate privacy concerns.</p>
              </Card>
            )}
            {item.versions.length > 0 && (
              <Card title="Media History" icon={ImagePlus}>
                <ul className="space-y-2">
                  {[{ version: item.version, status: item.status, url: item.url, current: true }, ...item.versions].map((v) => (
                    <li key={v.version} className="flex items-center gap-2 text-[11.5px]">
                      <img src={v.url} alt="" className="size-10 rounded-md object-cover" />
                      <div className="min-w-0 flex-1"><p className="font-semibold text-[#1b1140]">Version {v.version}{v.current ? ' (Current)' : ''}</p>{v.reason && <p className="text-[#b45309]">Reason: {v.reason}</p>}</div>
                      <StatusPill value={v.status} />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Submission Progress" icon={ClipboardCheck}>
          <p className="text-[12.5px] font-semibold text-[#1b1140]">{s.reviewed} of {s.submitted} reviewed ({s.submitted ? Math.round((s.reviewed / s.submitted) * 100) : 0}%)</p>
          <div className="my-2 flex h-2.5 overflow-hidden rounded-full bg-[#efecf7]">
            {[[s.approved, '#22a652'], [s.changesRequested, '#f08a24'], [s.rejected, '#e03a3a'], [s.escalated, '#6d3fe0']].map(([n, c], i) => <span key={i} style={{ width: `${(n / Math.max(1, s.submitted)) * 100}%`, background: c }} />)}
          </div>
          <ul className="grid grid-cols-2 gap-1 text-[11.5px] text-[#2a1b57]">
            <li>🟢 {s.approved} Approved</li><li>🟠 {s.awaiting + s.underReview} Awaiting</li><li>🟠 {s.changesRequested} Changes requested</li><li>🔴 {s.rejected} Rejected</li>
          </ul>
        </Card>
        <ReviewHistory history={r.history} countryCode={r.countryCode} limit={5} />
        <NotesCard moderationId={r.id} notes={r.notes} countryCode={r.countryCode} onAdded={refetch} />
      </div>

      {dialog && (
        <DecisionDialog
          decision={dialog.decision}
          review={r}
          target={dialog.bulk ? null : item}
          bulkItems={dialog.bulk ? selectedPending : null}
          checks={dialog.bulk ? null : checks}
          onClose={() => setDialog(null)}
          onDone={afterDecision}
        />
      )}
      {!open && (
        <p className="text-center text-[12px] text-[#6b6785]">
          This gallery review is closed. <button type="button" onClick={() => navigate(back)} className="font-semibold text-[#4527c8] hover:underline">Back to queue</button>
        </p>
      )}
    </div>
  )
}
