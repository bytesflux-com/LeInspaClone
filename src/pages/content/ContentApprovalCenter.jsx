import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowUpDown, BookOpen, ChevronRight, CircleCheck, ClipboardList, Clock, FileClock, FileWarning, FlaskConical, RefreshCw, Search, ShieldAlert, ShieldCheck, Siren, UsersRound, X } from 'lucide-react'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import CountryFlag from '../../components/ui/CountryFlag'
import { useMarketContext } from '../../hooks/useMarketContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useContentQueue } from '../../hooks/useContentModeration'
import { contentModerationService } from '../../services/contentModerationService'
import { PERMISSIONS } from '../../constants/permissions'
import { PROVIDER_CATEGORY_OPTIONS } from '../../constants/bookingOps'
import { CONTENT_TABS, PRIORITY, PRIORITY_OPTIONS, STATUS_OPTIONS, SUBMITTED_OPTIONS, TYPE_OPTIONS, reviewPath } from '../../constants/contentModeration'
import { CHECKLISTS, CONTENT_TYPES } from '../../../functions/src/contentModerationLogic.js'
import { formatNumber } from '../../lib/format'
import { formatStamp, timeZoneFor } from '../../lib/profileFormat'
import { cn } from '../../lib/utils'
import { CARD, Chip, KpiCards, MarketMenu, PillTabs, SelectBox, StatePill, TILE } from '../../components/bookings/OpsUI'
import { Pagination } from '../../components/bookings/OpsTable'
import ContentReviewPanel from '../../components/content/ContentReviewPanel'
import { StatusPill, Verified } from '../../components/content/ContentUI'

const DEFAULTS = { type: 'all', q: '', status: '', priority: '', submitted: '', reviewer: '', pt: '', sort: 'oldest', page: 1, size: 10 }
const KPIS = [
  { key: 'awaiting', label: 'Awaiting Review', icon: FileClock, color: 'orange', status: 'awaiting_review' },
  { key: 'underReview', label: 'Under Review', icon: ShieldCheck, color: 'purple', status: 'under_review', sub: 'In progress' },
  { key: 'changesRequested', label: 'Changes Requested', icon: FileWarning, color: 'orange', status: 'changes_requested', sub: 'Waiting for provider' },
  { key: 'approvedToday', label: 'Approved Today', icon: CircleCheck, color: 'green', status: 'approved', sub: 'Published / Eligible' },
  { key: 'escalated', label: 'Escalated', icon: Siren, color: 'red', status: 'escalated', sub: 'Requires specialist review' },
]

function readParams(sp, presetType) {
  const num = (k) => {
    const n = Number(sp.get(k))
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : DEFAULTS[k]
  }
  const p = Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, k === 'page' || k === 'size' ? num(k) : sp.get(k) || DEFAULTS[k]]))
  if (presetType) p.type = presetType
  return p
}

// Content policy reference (the same checklists the backend enforces).
function GuidelinesDialog({ onClose }) {
  const groups = [['profile_photo', 'Profile Photos'], ['media', 'Gallery & Media'], ['service', 'Service Content'], ['offer', 'Offers & Packages'], ['business_profile', 'Business Profiles'], ['other', 'Other Public Content']]
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1b1140]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="guidelines-title">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#f0edf8] px-5 py-3.5">
          <h2 id="guidelines-title" className="text-[16px] font-bold text-[#1b1140]">Lé Inspa Content Guidelines</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 hover:bg-[#f4f1fc]"><X className="size-5" /></button>
        </header>
        <div className="grid gap-3 overflow-y-auto p-5 sm:grid-cols-2">
          {groups.map(([key, title]) => (
            <section key={key} className="rounded-xl border border-[#ebe7f6] p-3">
              <h3 className="mb-1.5 text-[13px] font-bold text-[#1b1140]">{title}</h3>
              <ul className="space-y-1">{CHECKLISTS[key].map(([id, l]) => <li key={id} className="flex gap-1.5 text-[12px] text-[#2a1b57]"><CircleCheck className="mt-0.5 size-3.5 shrink-0 text-[#22a652]" />{l}</li>)}</ul>
            </section>
          ))}
        </div>
        <p className="border-t border-[#f0edf8] px-5 py-3 text-[11.5px] text-[#6b6785]">Content moderation is separate from provider verification. Rejecting content never suspends a provider; account-level action goes through ADM-028.</p>
      </div>
    </div>
  )
}

// ADM-035 — Content Approval Center. One moderation queue for professionals,
// spas and hotels; `presetType` comes from the per-type sidebar routes.
export default function ContentApprovalCenter({ presetType = null, title = 'Content Approval Center' }) {
  const [sp, setSp] = useSearchParams()
  const { selectedMarket } = useMarketContext()
  const { can } = usePermissions()
  const canModerate = can(PERMISSIONS.CONTENT_MODERATE)
  const p = useMemo(() => readParams(sp, presetType), [sp, presetType])
  const query = useMemo(
    () => ({ market: selectedMarket.id, providerType: p.pt || null, type: p.type, q: p.q || undefined, status: p.status || undefined, priority: p.priority || undefined, submitted: p.submitted || undefined, reviewer: p.reviewer || undefined, sort: p.sort, page: p.page, pageSize: p.size }),
    [selectedMarket.id, p],
  )
  const { data, error, loading, fetching, refetch } = useContentQueue(query, canModerate)
  const [guidelines, setGuidelines] = useState(false)

  const update = (patch) => {
    const next = new URLSearchParams(sp)
    for (const [k, v] of Object.entries(patch)) {
      if (v === '' || v == null || v === DEFAULTS[k]) next.delete(k)
      else next.set(k, String(v))
    }
    if (!('page' in patch) && !('c' in patch)) next.delete('page')
    setSp(next, { replace: true })
  }

  const [search, setSearch] = useState(p.q)
  useEffect(() => setSearch(p.q), [p.q])
  useEffect(() => {
    if (search === p.q) return undefined
    const t = setTimeout(() => update({ q: search.trim() }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const items = data?.items || []
  const selectedId = sp.get('c') || items[0]?.id || null
  const idx = items.findIndex((i) => i.id === selectedId)
  const go = (delta) => items.length && update({ c: items[(Math.max(idx, 0) + delta + items.length) % items.length].id })

  const reviewerOptions = [{ value: '', label: 'All reviewers' }, { value: 'unassigned', label: 'Unassigned' }, { value: 'me', label: 'Assigned to me' }, ...(data?.reviewers || []).map((r) => ({ value: r, label: r }))]
  const chips = [
    p.status && ['status', `Status: ${STATUS_OPTIONS.find((o) => o.value === p.status)?.label}`],
    p.priority && ['priority', `Priority: ${PRIORITY[p.priority]?.[0]}`],
    p.submitted && ['submitted', `Submitted: ${SUBMITTED_OPTIONS.find((o) => o.value === p.submitted)?.label}`],
    p.reviewer && ['reviewer', `Reviewer: ${reviewerOptions.find((o) => o.value === p.reviewer)?.label}`],
    p.pt && ['pt', PROVIDER_CATEGORY_OPTIONS.find((o) => o.value === p.pt)?.label],
    p.q && ['q', `Search: “${p.q}”`],
  ].filter(Boolean)

  const kpiValues = data && { ...data.kpis }
  const kpiItems = KPIS.map((k) => ({ ...k, id: k.status, sub: k.key === 'awaiting' ? (data ? `${formatNumber(data.kpis.awaitingPriority)} priority` : '') : k.sub }))
  const attention = [
    { id: 'escalated', label: 'Escalated Content', sub: 'Requires senior moderation review.', icon: ShieldAlert, tone: 'red', patch: { status: 'escalated' } },
    { id: 'overdue', label: 'Overdue Reviews', sub: 'Past configured moderation target.', icon: Clock, tone: 'orange', patch: { status: 'overdue' } },
    { id: 'resubmitted', label: 'Resubmitted Content', sub: 'Providers corrected previously rejected or requested content.', icon: RefreshCw, tone: 'purple', patch: { status: 'resubmitted' } },
  ]

  if (!canModerate) {
    return <div className="px-4 pt-3 pb-6"><div className="mx-auto mt-10 max-w-xl"><ErrorState title="You don't have access to content moderation" description="Your role does not include content moderation. Ask a Super Admin to grant the content.moderate permission." /></div></div>
  }

  return (
    <div className="min-h-full space-y-3 px-4 pt-3 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-11 items-center justify-center rounded-xl bg-[#4125d0] text-white shadow"><ShieldCheck className="size-6" /></span>
          <div>
            {presetType && (
              <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[12px] text-[#4a4466]">
                <Link to="/content-approval" className="hover:text-[#4527c8]">Content Approval Center</Link><ChevronRight className="size-3.5" /><span className="font-semibold text-[#4527c8]">{title}</span>
              </nav>
            )}
            <h1 className="font-display text-[34px] leading-none font-bold tracking-tight text-[#1b1140]">{title}{!selectedMarket.isGlobal && <span className="text-[#4527c8]"> — {selectedMarket.name}</span>}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[#2a1b57]">
              Review and manage provider content before it appears across Lé Inspa.
              {contentModerationService.isMock && <span className="inline-flex items-center gap-1 rounded-md bg-[#fff4e0] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#9a5a06]"><FlaskConical className="size-3" /> Demo data</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MarketMenu />
          <SelectBox icon={UsersRound} value={p.pt} options={PROVIDER_CATEGORY_OPTIONS} onChange={(pt) => update({ pt })} width="w-60" />
          <button type="button" onClick={refetch} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#ddd7ee] bg-white px-3.5 text-[12.5px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]"><RefreshCw className={cn('size-4', fetching && 'animate-spin')} /> Refresh</button>
          <button type="button" onClick={() => setGuidelines(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border-[1.5px] border-[#4125d0] bg-white px-3.5 text-[12.5px] font-semibold text-[#4125d0] hover:bg-[#f4f0ff]"><BookOpen className="size-4" /> Content Guidelines</button>
        </div>
      </header>

      {error && !data ? <ErrorState title="Unable to load the moderation queue" description={error} onRetry={refetch} /> : (
        <>
          <KpiCards items={kpiItems} values={kpiValues} active={p.status ? p.status : null} onSelect={(it) => update({ status: p.status === it.status ? '' : it.status })} cols="xl:grid-cols-5" />
          {!presetType && <PillTabs label="Content types" tabs={CONTENT_TABS.map(([id, l]) => ({ id, label: l, count: data?.tabs.find((t) => t.id === id)?.count }))} value={p.type} onChange={(type) => update({ type, c: '' })} />}

          <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(380px,1fr)]">
            <div className="min-w-0 space-y-3">
              <section className={cn(CARD, 'p-3.5')} aria-label="Needs your attention">
                <h2 className="mb-2.5 text-[15px] font-bold text-[#1b1140]">Needs Your Attention</h2>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {attention.map((a) => {
                    const Icon = a.icon
                    const n = data?.attention[a.id]
                    return (
                      <div key={a.id} className={cn('rounded-xl border p-3', a.tone === 'red' ? 'border-[#f7d4d8] bg-[#fff6f7]' : a.tone === 'orange' ? 'border-[#fbe2c4] bg-[#fff8ef]' : 'border-[#e3dafb] bg-[#f8f5ff]')}>
                        <div className="flex items-start gap-2.5">
                          <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', TILE[a.tone])}><Icon className="size-[18px]" /></span>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-[#1b1140]">{a.label}</p>
                            {data ? <p className="text-[22px] leading-7 font-bold text-[#1b1140]">{formatNumber(n)}</p> : <Skeleton className="my-1 h-6 w-10" />}
                            <p className="text-[11px] leading-snug text-[#4a4466]">{a.sub}</p>
                            {n > 0 && <button type="button" onClick={() => update({ ...a.patch, type: 'all' })} className="mt-1 text-[12px] font-semibold text-[#4527c8] hover:underline">Review →</button>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className={cn(CARD, 'p-3.5')} aria-label="Content moderation queue">
                <h2 className="text-[15px] font-bold text-[#1b1140]">Content Moderation Queue {data && <span className="text-[#6b6785]">({formatNumber(data.total)})</span>}</h2>
                <label className="relative mt-2.5 block">
                  <span className="sr-only">Search the queue</span>
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6b6785]" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search provider, content ID, service or business…" className="h-9 w-full rounded-lg border border-[#ddd7ee] bg-white pr-3 pl-9 text-[12.5px] focus:border-[#7a5cf0] focus:outline-none" />
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {!presetType && <SelectBox label="Content Type" value={p.type === 'all' ? 'all' : p.type} options={TYPE_OPTIONS} onChange={(type) => update({ type, c: '' })} width="w-56" />}
                  <SelectBox label="Status" value={p.status} options={STATUS_OPTIONS} onChange={(status) => update({ status })} width="w-52" />
                  <SelectBox label="Priority" value={p.priority} options={PRIORITY_OPTIONS} onChange={(priority) => update({ priority })} width="w-44" />
                  <SelectBox label="Submitted Date" value={p.submitted} options={SUBMITTED_OPTIONS} onChange={(submitted) => update({ submitted })} width="w-44" />
                  <SelectBox label="Assigned Reviewer" value={p.reviewer} options={reviewerOptions} onChange={(reviewer) => update({ reviewer })} width="w-52" align="right" />
                  <button type="button" onClick={() => update({ sort: p.sort === 'oldest' ? 'newest' : 'oldest' })} title={p.sort === 'oldest' ? 'Oldest first' : 'Newest first'} className="ml-auto flex h-9 items-center gap-1 rounded-lg border border-[#ddd7ee] px-2.5 text-[12px] font-semibold text-[#2a1b57] hover:bg-[#f4f1fc]"><ArrowUpDown className="size-4" />{p.sort === 'oldest' ? 'Oldest' : 'Newest'}</button>
                </div>
                {chips.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {chips.map(([k, l]) => <Chip key={k} onRemove={() => update({ [k]: '' })}>{l}</Chip>)}
                    <button type="button" onClick={() => setSp(new URLSearchParams(), { replace: true })} className="text-[12px] font-semibold text-[#4527c8] hover:underline">Clear All</button>
                  </div>
                )}

                <div className={cn('mt-3 overflow-x-auto transition-opacity', fetching && 'opacity-60')}>
                  {loading || !data ? <div className="space-y-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div> : items.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center"><ClipboardList className="size-8 text-[#b5a0e4]" /><p className="text-[13px] font-semibold text-[#1b1140]">Nothing to moderate here</p><p className="text-[12px] text-[#6b6785]">No content matches these filters.</p></div>
                  ) : (
                    <table className="w-full min-w-[640px] text-[12px]">
                      <thead>
                        <tr className="bg-[#f1eefb] text-left text-[11.5px] text-[#1b1140]">
                          {['Content', 'Provider', 'Market', 'Submitted', 'Priority', 'Status / Reviewer', ''].map((h, i, a) => <th key={h || i} className={cn('px-2 py-2 font-semibold', i === 0 && 'rounded-l-lg', i === a.length - 1 && 'rounded-r-lg')}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it) => {
                          const sel = it.id === selectedId
                          const full = reviewPath(it)
                          return (
                            <tr key={it.id} onClick={() => update({ c: it.id })} className={cn('cursor-pointer border-b border-[#efecf7] transition', sel ? 'bg-[#f4f0ff] shadow-[inset_3px_0_0_#4125d0]' : 'hover:bg-[#faf9fe]')}>
                              <td className="px-2 py-2">
                                <span className="flex items-center gap-2">
                                  {it.thumbnailUrl ? <img src={it.thumbnailUrl} alt="" className="size-10 shrink-0 rounded-lg object-cover" /> : <span className="size-10 shrink-0 rounded-lg bg-[#f1eefb]" />}
                                  <span className="leading-tight"><span className="block font-semibold whitespace-nowrap text-[#1b1140]" title={CONTENT_TYPES[it.contentType]}>{it.title || it.contentLabel}{it.mediaCount > 1 && <span className="ml-1 text-[10.5px] text-[#6b6785]">· {it.mediaCount}</span>}</span><span className="block text-[11px] text-[#4527c8]">{it.contentId}</span></span>
                                </span>
                              </td>
                              <td className="max-w-[170px] px-2 py-2 leading-tight"><span className="flex items-center gap-1 font-semibold text-[#1b1140]"><span className="truncate">{it.provider.name}</span>{it.provider.verified && <Verified />}</span><span className="block truncate text-[11px] text-[#6b6785]">{it.provider.typeLabel}</span></td>
                              <td className="px-2 py-2"><span className="inline-flex items-center gap-1 whitespace-nowrap text-[#1b1140]"><CountryFlag code={it.countryCode} className="h-3 w-4.5" />{it.marketName}</span></td>
                              <td className="px-2 py-2 leading-tight whitespace-nowrap text-[#1b1140]">{it.submittedAt ? formatStamp(it.submittedAt, new Date().toISOString(), timeZoneFor(it.countryCode)).split(' • ').map((x, i) => <span key={i} className={cn('block', i && 'text-[11px] text-[#6b6785]')}>{x}</span>) : '—'}{it.overdue && <span className="block text-[10.5px] font-semibold text-[#c2570c]">Overdue</span>}</td>
                              <td className="px-2 py-2"><StatePill map={PRIORITY} value={it.priority} /></td>
                              <td className="px-2 py-2 leading-tight"><StatusPill value={it.status} /><span className="mt-1 block text-[10.5px] whitespace-nowrap text-[#6b6785]">{it.assignedTo?.name || 'Unassigned'}</span></td>
                              <td className="px-1 py-2 text-right">
                                {full ? (
                                  <Link to={full} onClick={(e) => e.stopPropagation()} aria-label={`${it.status === 'under_review' ? 'Continue' : 'Review'} ${it.contentId}`} title={it.status === 'under_review' ? 'Continue review' : 'Open full review'} className="inline-flex size-7 items-center justify-center rounded-lg text-[#4527c8] hover:bg-[#f1edff]"><ChevronRight className="size-4" /></Link>
                                ) : (
                                  <button type="button" onClick={(e) => { e.stopPropagation(); update({ c: it.id }) }} aria-label={`Review ${it.contentId}`} title="Review in panel" className="inline-flex size-7 items-center justify-center rounded-lg text-[#4527c8] hover:bg-[#f1edff]"><ChevronRight className="size-4" /></button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                {data && data.total > 0 && (
                  <>
                    <p className="mt-2 text-[12px] text-[#4a4466]">Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {formatNumber(data.total)}</p>
                    <Pagination page={data.page} pageSize={data.pageSize} totalPages={data.totalPages} onPage={(page) => update({ page })} onPageSize={(size) => update({ size })} />
                  </>
                )}
              </section>
            </div>

            <div className="min-w-0 xl:sticky xl:top-3">
              {selectedId ? <ContentReviewPanel key={selectedId} id={selectedId} onPrev={() => go(-1)} onNext={() => go(1)} onChanged={refetch} /> : !loading && <div className={cn(CARD, 'p-6 text-center text-[12.5px] text-[#6b6785]')}>Select content from the queue to preview it.</div>}
            </div>
          </div>
        </>
      )}
      {guidelines && <GuidelinesDialog onClose={() => setGuidelines(false)} />}
    </div>
  )
}
