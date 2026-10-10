import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { AlertTriangle, ArrowLeft, BadgeCheck, ChevronRight, CircleCheck, FileText, History, Image as ImageIcon, ListChecks, MessageSquarePlus, Play, ShieldAlert, Sparkles, UserRound, Users, Wallet } from 'lucide-react'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import CountryFlag from '../../components/ui/CountryFlag'
import { usePermissions } from '../../hooks/usePermissions'
import { useContentReview } from '../../hooks/useContentModeration'
import { contentModerationService } from '../../services/contentModerationService'
import { PERMISSIONS } from '../../constants/permissions'
import { CONTENT_BASE, TYPE_ROUTES, infoRequestPath } from '../../constants/contentModeration'
import { formatCurrency } from '../../lib/currency'
import { cn } from '../../lib/utils'
import { DISC, StatePill } from '../../components/bookings/OpsUI'
import { CARD, Card, MediaViewer, NotesCard, PolicyChecklist, ProviderAvatarImg, ReviewHistory, Rows, StatusPill, Verified, stamp } from '../../components/content/ContentUI'
import { ACTION_BUTTON, ChangeDecisionDialog, Comparison, ServicePreview } from '../../components/content/ChangeUI'

const OPEN = ['awaiting_review', 'under_review', 'resubmitted', 'escalated']
const fmtValue = (key, v, currency) => {
  if (v == null || (Array.isArray(v) && !v.length)) return '—'
  if (key === 'price') return formatCurrency(v, currency)
  if (key === 'durationMins') return `${v} minutes`
  return Array.isArray(v) ? v.join(' • ') : String(v)
}

// ADM-039 — Service Information Approval. Moderates the public description of
// a new or edited service; it never decides professional qualifications,
// pricing rules or bookability (the shared booking engine owns availability).
export default function ServiceApproval() {
  const { moderationId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { can } = usePermissions()
  const allowed = can(PERMISSIONS.CONTENT_MODERATE)
  const { data: r, error, loading, refetch } = useContentReview(allowed ? moderationId : null)
  const [selected, setSelected] = useState('description')
  const [checks, setChecks] = useState({})
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [mediaIdx, setMediaIdx] = useState(0)
  const back = location.state?.returnTo || TYPE_ROUTES.service
  const sv = r?.serviceReview

  useEffect(() => {
    if (sv && !sv.fields.some((f) => f.key === selected && (f.changed || sv.mode === 'new'))) setSelected(sv.changedFields[0] || 'description')
  }, [sv, selected])

  const header = (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex size-11 items-center justify-center rounded-xl bg-[#4125d0] text-white shadow"><FileText className="size-6" /></span>
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[12px] text-[#4a4466]">
            <Link to={CONTENT_BASE} className="hover:text-[#4527c8]">Content Approval Center</Link><ChevronRight className="size-3.5" /><span className="font-semibold text-[#4527c8]">Service Information Approval</span>
          </nav>
          <h1 className="font-display text-[34px] leading-none font-bold tracking-tight text-[#1b1140]">Service Information Approval</h1>
          <p className="mt-1 text-[13px] text-[#2a1b57]">Review service information before it appears publicly across Lé Inspa.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to={back} className="inline-flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-[#4125d0] bg-white px-3.5 text-[12.5px] font-semibold text-[#4125d0] hover:bg-[#f4f0ff]"><ArrowLeft className="size-4" /> Back to Content Approval Center</Link>
        {r?.provider.id && <Link to={`/providers/${r.provider.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#ddd7ee] bg-white px-3.5 text-[12.5px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]"><UserRound className="size-4" /> View Provider Profile</Link>}
      </div>
    </header>
  )

  if (!allowed) return <div className="px-4 pt-3">{header}<ErrorState className="mx-auto mt-8 max-w-xl" title="You don't have access to content moderation" description="Ask a Super Admin to grant the content.moderate permission." /></div>
  if (error) return <div className="space-y-3 px-4 pt-3">{header}<ErrorState title="Unable to open this service" description={error} onRetry={refetch} /></div>
  if (loading || !r) return <div className="space-y-3 px-4 pt-3">{header}<Skeleton className="h-[680px] rounded-2xl" /></div>
  if (!sv) return <div className="space-y-3 px-4 pt-3">{header}<ErrorState title="This is not a service submission" description={`${r.contentId} is ${r.contentLabel}.`} /></div>

  const p = sv.proposed
  const open = OPEN.includes(r.status)
  const reviewing = open && (r.status === 'under_review' || (r.status === 'escalated' && r.assignedTo))
  const isUpdate = sv.mode === 'update'
  const f = sv.fields.find((x) => x.key === selected) || sv.fields[1]
  const allPass = r.checklist.every((c) => checks[c.id] === 'pass')
  const eligible = sv.eligibility.consistent

  const start = async () => {
    setBusy(true)
    try {
      await contentModerationService.startReview(r.id)
      refetch()
    } catch (err) {
      setNotice({ tone: 'bad', text: err?.message || 'Unable to start the review.' })
    } finally {
      setBusy(false)
    }
  }
  const submit = async (input) => {
    if (input.decision === 'escalate') await contentModerationService.decide({ moderationId: r.id, version: r.version, checks, ...input })
    else await contentModerationService.serviceDecision({ moderationId: r.id, version: r.version, checks, ...input })
    setDialog(null)
    setNotice({ tone: 'ok', text: { approve: isUpdate ? 'Approved — the new version replaces the current public service.' : 'Approved — the service is eligible for publication.', request_changes: isUpdate ? 'Changes requested. The current approved service remains live.' : 'Changes requested from the provider.', reject: isUpdate ? 'Rejected. The currently approved service remains live.' : 'Rejected. This service will not be published.', reverify: 'Sent for verification review. Content moderation did not approve professional eligibility.', escalate: 'Escalated to Trust & Safety. The provider is not suspended.' }[input.decision] })
    refetch()
  }

  const SUMMARY = isUpdate
    ? [['Review Type', 'Service Update', FileText, 'purple'], ['Fields Changed', sv.changedFields.length, ListChecks, 'blue'], ['Issues Detected', sv.issues.length, AlertTriangle, sv.issues.length ? 'orange' : 'green'], ['Verification Impact', sv.verificationImpact === 'None' ? 'None' : 'Required', BadgeCheck, sv.verificationImpact === 'None' ? 'green' : 'red']]
    : [['Review Type', 'New Service', Sparkles, 'purple'], ['Fields Submitted', sv.changedFields.length, ListChecks, 'blue'], ['Issues Detected', sv.issues.length, AlertTriangle, sv.issues.length ? 'orange' : 'green'], ['Verification Impact', sv.verificationImpact === 'None' ? 'None' : 'Required', BadgeCheck, sv.verificationImpact === 'None' ? 'green' : 'red']]
  const media = r.media.length ? r.media : p.imageUrl ? [{ url: p.imageUrl, title: p.name }] : []

  return (
    <div className="min-h-full space-y-3 px-4 pt-3 pb-24">
      {header}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <section className={cn(CARD, 'flex flex-wrap items-center gap-x-6 gap-y-3 p-4')}>
          <div className="flex items-center gap-3">
            {media[0] ? <img src={media[0].url} alt="" className="h-20 w-24 rounded-xl object-cover" /> : <ProviderAvatarImg url={r.provider.photoUrl} name={r.provider.name} size={80} />}
            <div className="leading-snug">
              <p className="text-[21px] font-bold text-[#1b1140]">{p.name}</p>
              <p className="text-[12px] text-[#4a4466]">{sv.serviceId}</p>
              <p className="flex items-center gap-1 text-[12.5px] text-[#2a1b57]">Submitted by: <span className="font-semibold text-[#1b1140]">{r.provider.name}</span>{r.provider.verified && <Verified />}</p>
              <p className="text-[12px] text-[#4a4466]">{r.provider.typeLabel}</p>
              <p className="flex items-center gap-1 text-[12px] text-[#4a4466]"><CountryFlag code={r.countryCode} className="h-3 w-4.5" />{r.marketName}{r.provider.city && ` • ${r.provider.city}`}</p>
            </div>
          </div>
          <div className="space-y-1.5 border-l border-[#efecf7] pl-6 text-[12.5px]">
            <StatePill map={{ x: [r.status === 'under_review' ? 'Service Under Review' : r.status.replace('_', ' '), ['rejected', 'reverification', 'escalated'].includes(r.status) ? 'red' : r.status === 'approved' ? 'green' : 'purple'] }} value="x" />
            <p className="text-[#2a1b57]">Submitted: <span className="font-semibold text-[#1b1140]">{stamp(r.submittedAt, r.countryCode)}</span></p>
            <p className="text-[#2a1b57]">Assigned to: <span className="font-semibold text-[#1b1140]">{r.assignedTo?.name || 'Unassigned'}</span></p>
          </div>
        </section>
        <section className={cn(CARD, 'p-4')}>
          <h2 className="mb-2.5 text-[14.5px] font-bold text-[#1b1140]">Review Summary</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SUMMARY.map(([l, n, Icon, c]) => (
              <div key={l} className="flex items-center gap-2 rounded-xl border border-[#efecf7] p-2">
                <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', DISC[c])}><Icon className="size-4" /></span>
                <span className="leading-tight"><span className="block text-[10.5px] text-[#4a4466]">{l}</span><span className="block text-[14px] font-bold text-[#1b1140]">{n}</span></span>
              </div>
            ))}
          </div>
          {sv.issues.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {sv.issues.map((i) => <li key={i.text} className={cn('flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium', i.type === 'eligibility' ? 'bg-[#fdf0f0] text-[#b91c1c]' : 'bg-[#fff6ec] text-[#b45309]')}><AlertTriangle className="mt-0.5 size-3.5 shrink-0" />{i.text}</li>)}
            </ul>
          )}
        </section>
      </div>

      {notice && <p role="status" className={cn('rounded-lg px-3 py-2 text-[12.5px] font-medium', notice.tone === 'ok' ? 'bg-[#ecfaf1] text-[#15803d]' : 'bg-[#fff1f1] text-[#b91c1c]')}>{notice.text}</p>}
      {open && !reviewing && (
        <section className={cn(CARD, 'flex flex-wrap items-center justify-between gap-3 p-3.5')}>
          <p className="text-[12.5px] text-[#2a1b57]">{isUpdate ? 'Start the review. The current approved service stays live until a decision is made.' : 'Start the review to moderate this new service before it can be published.'}</p>
          <button type="button" disabled={busy} onClick={start} className="flex h-9 items-center gap-2 rounded-lg bg-[#4125d0] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"><Play className="size-4" />Start Review</button>
        </section>
      )}

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)_minmax(0,0.95fr)]">
        <div className="space-y-3">
          <Card title="Service Media" icon={ImageIcon}>
            {media.length ? <MediaViewer items={media} index={Math.min(mediaIdx, media.length - 1)} onIndex={setMediaIdx} height="h-[220px]" /> : <p className="text-[12px] text-[#6b6785]">No service image submitted.</p>}
            <div className="mt-2 flex items-center justify-between gap-2 text-[12px]">
              <span className="flex items-center gap-1.5 text-[#2a1b57]">Image status <StatePill map={{ approved: ['Approved', 'green'], awaiting_review: ['Awaiting Media Review', 'purple'] }} value={sv.mediaStatus || 'awaiting_review'} /></span>
              <Link to={TYPE_ROUTES.gallery} className="font-semibold text-[#4527c8] hover:underline">View Media Review →</Link>
            </div>
          </Card>
          <Card title="Service Details (Submitted)" icon={FileText}>
            <Rows rows={[
              ['Service name', p.name],
              ['Category', p.category],
              ['Description', p.description],
              ['Duration', fmtValue('durationMins', p.durationMins)],
              ['Price', fmtValue('price', p.price, r.currency)],
              ['Service mode', fmtValue('serviceModes', p.serviceModes)],
              ['Provider', r.provider.name],
              ['Market', r.marketName],
              ['Status', <StatusPill key="s" value={r.status} />],
            ]} />
          </Card>
        </div>

        <div className="space-y-3">
          <section className={cn(CARD, 'p-3.5')}>
            <h2 className="mb-2.5 text-[15px] font-bold text-[#1b1140]">{isUpdate ? 'Current vs Proposed Information' : 'Submitted Information'}</h2>
            <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)]">
              <ul className="space-y-1">
                {sv.fields.map((x) => (
                  <li key={x.key}>
                    <button type="button" onClick={() => setSelected(x.key)} className={cn('flex w-full items-center justify-between gap-1 rounded-lg border px-2 py-1.5 text-left text-[12px] transition', x.key === f.key ? 'border-[#4125d0] bg-[#f4f0ff] font-semibold text-[#1b1140]' : 'border-transparent text-[#2a1b57] hover:bg-[#faf9fe]')}>
                      {x.label}
                      {isUpdate ? <StatePill map={{ c: [x.sensitive ? 'Sensitive' : 'Changed', x.sensitive ? 'red' : 'purple'], n: ['No Change', 'green'] }} value={x.changed ? 'c' : 'n'} /> : null}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="min-w-0 space-y-2.5">
                <p className="text-[13px] font-bold text-[#1b1140]">{f.label}</p>
                {isUpdate ? (
                  <Comparison current={fmtValue(f.key, f.current, r.currency)} proposed={fmtValue(f.key, f.proposed, r.currency)} diff={f.diff} />
                ) : (
                  <div className="rounded-xl border-[1.5px] border-[#b9a9f0] bg-white px-3 py-2.5 text-[12.5px] text-[#1b1140]">{fmtValue(f.key, f.proposed, r.currency)}</div>
                )}
                {f.key === 'description' && sv.claims.length > 0 && (
                  <p className="rounded-lg bg-[#fff6ec] px-3 py-2 text-[12px] text-[#b45309]"><b>Detected wording:</b> {sv.claims.map((c) => `“${c}”`).join(', ')} — wellness descriptions must not promise medical outcomes.</p>
                )}
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#faf9fe] p-2.5 text-[11.5px] sm:grid-cols-4">
                  <span><span className="block text-[#6b6785]">Change type</span><b className="text-[#1b1140]">{isUpdate ? 'Content Update' : 'New Service'}</b></span>
                  <span><span className="block text-[#6b6785]">Public impact</span><b className="text-[#1b1140]">Service Details</b></span>
                  <span><span className="block text-[#6b6785]">Requires verification</span><b className={sv.verificationImpact === 'None' ? 'text-[#15803d]' : 'text-[#b91c1c]'}>{sv.verificationImpact === 'None' ? 'No' : 'Yes'}</b></span>
                  <span><span className="block text-[#6b6785]">Moderation status</span><StatusPill value={r.status} /></span>
                </div>
              </div>
            </div>
          </section>
          <Card title="Client Preview (How It Will Appear)" icon={Sparkles}>
            <ServicePreview service={p} provider={r.provider} currency={r.currency} />
            <p className="mt-2 text-[10.5px] text-[#6b6785]">Approval publishes the information; bookability still depends on the shared booking engine (branch, staff, resources, capacity).</p>
          </Card>
        </div>

        <div className="space-y-3">
          <Card title="Provider Context" icon={UserRound}>
            <div className="flex items-center gap-2.5">
              <ProviderAvatarImg url={r.provider.photoUrl} name={r.provider.name} size={48} rounded={r.provider.category === 'individual' ? 'rounded-full' : 'rounded-xl'} />
              <div className="text-[12px] leading-snug"><p className="flex items-center gap-1 font-bold text-[#1b1140]">{r.provider.name}{r.provider.verified && <Verified />}</p><p className="text-[#4a4466]">{r.provider.typeLabel}</p></div>
            </div>
            <div className="mt-2"><Rows rows={[['Approved category', sv.eligibility.approvedCategory], ['Service category', sv.eligibility.submittedCategory], sv.branches.length > 0 && ['Branches / locations', sv.branches.join(' • ')]]} /></div>
            <div className={cn('mt-2 flex items-start gap-2 rounded-lg px-3 py-2 text-[12px]', eligible ? 'bg-[#ecfaf1] text-[#14532d]' : 'bg-[#fdf0f0] text-[#7f1d1d]')}>
              {eligible ? <CircleCheck className="mt-0.5 size-4 shrink-0 fill-[#22a652] text-white" /> : <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#dc2626]" />}
              <span><b>{eligible ? 'Category Consistent' : 'Verification Review Required'}</b><br />{eligible ? "Service matches provider's approved professional category." : 'Content moderation cannot approve professional eligibility. Send for verification review (ADM-031 / ADM-033).'}</span>
            </div>
          </Card>
          <Card title="Pricing & Duration" icon={Wallet}>
            <Rows rows={[
              ['Price', <span key="p" className="flex items-center gap-1.5">{fmtValue('price', sv.pricing.price, r.currency)}<StatePill map={{ ok: ['Valid', 'green'], bad: ['Missing', 'red'] }} value={sv.pricing.price != null ? 'ok' : 'bad'} /></span>],
              ['Pricing type', sv.pricing.pricingType],
              isUpdate && ['Previous price', fmtValue('price', sv.pricing.previousPrice, r.currency)],
              ['Duration', <span key="d" className="flex items-center gap-1.5">{fmtValue('durationMins', p.durationMins)}<StatePill map={{ ok: ['Valid', 'green'], bad: ['Missing', 'red'] }} value={p.durationMins ? 'ok' : 'bad'} /></span>],
              sv.bufferMins != null && ['Booking buffer', <span key="b">{sv.bufferMins} minutes <span className="text-[10.5px] text-[#6b6785]">(operational, not shown to clients)</span></span>],
            ]} />
            <p className="mt-1.5 text-[10.5px] text-[#6b6785]">Pricing rules live in the service/pricing architecture — only flag display issues here.</p>
          </Card>
          <Card title="Service Review Checklist" icon={ListChecks}>
            <PolicyChecklist checklist={r.checklist} value={checks} onChange={setChecks} readOnly={!reviewing} />
          </Card>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Service Version History" icon={History}>
          <ul className="space-y-2">
            {sv.versions.map((v) => (
              <li key={v.version} className="flex items-center justify-between gap-2 rounded-lg border border-[#f0edf8] px-2.5 py-1.5 text-[12px]">
                <span className="leading-tight"><span className="block font-semibold text-[#1b1140]">Version {v.version}{v.label && <span className={v.label === 'Current Live' ? 'text-[#15803d]' : 'text-[#4527c8]'}> — {v.label}</span>}</span><span className="text-[11px] text-[#6b6785]">{stamp(v.submittedAt, r.countryCode)}</span></span>
                <StatusPill value={v.status} />
                <span className="text-[11px] text-[#4a4466]">{v.note}</span>
              </li>
            ))}
          </ul>
        </Card>
        <ReviewHistory history={r.history} countryCode={r.countryCode} limit={6} />
        <NotesCard moderationId={r.id} notes={r.notes} countryCode={r.countryCode} onAdded={refetch} />
      </div>

      {reviewing && (
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-[#e6e1f3] bg-white/95 px-4 py-2.5 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={!allPass || !eligible} onClick={() => setDialog('approve')} title={!eligible ? 'Outside approved category — send for verification review' : !allPass ? 'Every check must pass' : ''} className={cn('flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border-[1.5px] text-[12.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-40', ACTION_BUTTON.approve)}><CircleCheck className="size-4" />Approve Service</button>
            <button type="button" onClick={() => setDialog('request_changes')} className={cn('flex h-10 flex-1 items-center justify-center rounded-lg border-[1.5px] text-[12.5px] font-semibold', ACTION_BUTTON.request_changes)}>Request Changes</button>
            <button type="button" onClick={() => setDialog('reject')} className={cn('flex h-10 flex-1 items-center justify-center rounded-lg border-[1.5px] text-[12.5px] font-semibold', ACTION_BUTTON.reject)}>Reject Service</button>
            <button type="button" onClick={() => setDialog('reverify')} className={cn('flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border-[1.5px] text-[12.5px] font-semibold', ACTION_BUTTON.reverify)}><BadgeCheck className="size-4" />Send for Verification Review</button>
            <button type="button" onClick={() => setDialog('escalate')} className={cn('flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border-[1.5px] text-[12.5px] font-semibold', ACTION_BUTTON.escalate)}><Users className="size-4" />Escalate to Trust & Safety</button>
            <Link to={infoRequestPath('service', r.id, location.pathname)} className="flex h-10 items-center gap-1.5 rounded-lg border border-dashed border-[#b9a9f0] px-3 text-[12px] font-semibold text-[#4527c8] hover:bg-[#f4f0ff]"><MessageSquarePlus className="size-4" />Request Info</Link>
          </div>
        </div>
      )}

      {dialog && (
        <ChangeDecisionDialog
          decision={dialog}
          title={{ approve: 'Approve Service', request_changes: 'Request Changes', reject: 'Reject Service Submission', reverify: 'Professional Verification Required', escalate: 'Escalate to Trust & Safety' }[dialog]}
          subject={`${p.name} — ${r.provider.name}`}
          summaryRows={dialog === 'approve' ? [['Category', p.category], ['Content checks', <span key="c" className="text-[#15803d]">Passed</span>], ['Verification impact', sv.verificationImpact], ['Outstanding issues', sv.issues.length ? `${sv.issues.length} flagged` : 'None']] : dialog === 'reverify' ? [['Provider category', sv.eligibility.approvedCategory], ['Submitted service', `${p.name} (${p.category})`]] : null}
          reasons={r.reasons.changes}
          rejectReasons={r.reasons.reject}
          escalateReasons={r.reasons.escalate}
          teams={r.reasons.teams}
          affected={dialog === 'request_changes' ? r.reasons.affected : null}
          impact={{ approve: isUpdate ? 'The approved version replaces the current public service information.' : 'The service becomes eligible for publication subject to other platform requirements.', request_changes: isUpdate ? 'The current approved version remains live.' : 'The service stays unpublished until corrected.', reject: isUpdate ? 'The proposed changes will not be published. The currently approved service remains live.' : 'This service will not be published. The provider is not suspended.', reverify: 'Routes to the Verification Center (ADM-031 / ADM-033) instead of approving professional eligibility here.', escalate: 'Escalation never suspends the provider. Provider-level action goes through ADM-027 / ADM-028.' }[dialog]}
          cta={{ approve: 'Approve Service', request_changes: 'Send Request', reject: 'Confirm Rejection', reverify: 'Send for Verification Review', escalate: 'Escalate' }[dialog]}
          onSubmit={submit}
          onClose={() => setDialog(null)}
        />
      )}
      {!open && <p className="text-center text-[12px] text-[#6b6785]">This service review is closed ({r.status.replace('_', ' ')}). <button type="button" onClick={() => navigate(back)} className="font-semibold text-[#4527c8] hover:underline">Back to queue</button></p>}
    </div>
  )
}
