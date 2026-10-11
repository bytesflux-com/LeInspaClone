import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, ClipboardCheck, FileDiff, FilePen, FileText, Globe, History, Info, Languages, ListChecks, MessageSquarePlus, Play, Send, ShieldCheck, Tag, UserRound, Users } from 'lucide-react'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import CountryFlag from '../../components/ui/CountryFlag'
import { usePermissions } from '../../hooks/usePermissions'
import { useContentReview } from '../../hooks/useContentModeration'
import { contentModerationService } from '../../services/contentModerationService'
import { PERMISSIONS } from '../../constants/permissions'
import { CONTENT_BASE, FIELD_STATUS, infoRequestPath } from '../../constants/contentModeration'
import { cn } from '../../lib/utils'
import { DISC, StatePill } from '../../components/bookings/OpsUI'
import { CARD, Card, NotesCard, PolicyChecklist, ProviderAvatarImg, ReviewHistory, Rows, StatusPill, Verified, stamp } from '../../components/content/ContentUI'
import { ACTION_BUTTON, ChangeDecisionDialog, Comparison, ProfilePreviewCard } from '../../components/content/ChangeUI'

const OPEN = ['awaiting_review', 'under_review', 'resubmitted', 'escalated']
const FIELD_ICON = { displayName: UserRound, bio: FileText, languages: Languages, professionalCategory: ShieldCheck, location: Globe }

// ADM-038 — Profile Information Change Review: Current → Proposed → Difference → Decision.
// The live profile stays public until individual fields are approved and published.
export default function ProfileChangeReview() {
  const { moderationId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { can } = usePermissions()
  const allowed = can(PERMISSIONS.CONTENT_MODERATE)
  const { data: r, error, loading, refetch } = useContentReview(allowed ? moderationId : null)
  const [selected, setSelected] = useState(null)
  const [checks, setChecks] = useState({})
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const back = location.state?.returnTo || `${CONTENT_BASE}/profile-changes`
  const pc = r?.profileChange
  const fields = pc?.fields || []

  useEffect(() => {
    if (fields.length && !fields.some((f) => f.key === selected)) setSelected((fields.find((f) => f.status === 'pending') || fields[0]).key)
  }, [fields, selected])

  const header = (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex size-11 items-center justify-center rounded-xl bg-[#4125d0] text-white shadow"><FilePen className="size-6" /></span>
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[12px] text-[#4a4466]">
            <Link to={CONTENT_BASE} className="hover:text-[#4527c8]">Content Approval Center</Link><ChevronRight className="size-3.5" /><span className="font-semibold text-[#4527c8]">Profile Information Change Review</span>
          </nav>
          <h1 className="font-display text-[34px] leading-none font-bold tracking-tight text-[#1b1140]">Profile Information Change Review</h1>
          <p className="mt-1 text-[13px] text-[#2a1b57]">Review changes before they update the provider's public profile.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to={back} className="inline-flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-[#4125d0] bg-white px-3.5 text-[12.5px] font-semibold text-[#4125d0] hover:bg-[#f4f0ff]"><ArrowLeft className="size-4" /> Back to Content Approval Center</Link>
        {r?.provider.id && <Link to={`/providers/${r.provider.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#ddd7ee] bg-white px-3.5 text-[12.5px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]"><UserRound className="size-4" /> View Current Profile</Link>}
      </div>
    </header>
  )

  if (!allowed) return <div className="px-4 pt-3">{header}<ErrorState className="mx-auto mt-8 max-w-xl" title="You don't have access to content moderation" description="Ask a Super Admin to grant the content.moderate permission." /></div>
  if (error) return <div className="space-y-3 px-4 pt-3">{header}<ErrorState title="Unable to open this change request" description={error} onRetry={refetch} /></div>
  if (loading || !r) return <div className="space-y-3 px-4 pt-3">{header}<Skeleton className="h-[680px] rounded-2xl" /></div>
  if (!pc) return <div className="space-y-3 px-4 pt-3">{header}<ErrorState title="This is not a profile change request" description={`${r.contentId} is ${r.contentLabel}.`} /></div>

  const open = OPEN.includes(r.status)
  const reviewing = open && (r.status === 'under_review' || (r.status === 'escalated' && r.assignedTo))
  const idx = Math.max(0, fields.findIndex((f) => f.key === selected))
  const f = fields[idx]
  const s = pc.summary
  const proposedProfile = { ...pc.currentProfile, ...Object.fromEntries(fields.filter((x) => !['rejected'].includes(x.status)).map((x) => [x.key, x.proposed])) }
  const photo = r.provider.photoUrl
  const fieldOpen = reviewing && f?.status === 'pending'
  const allPass = r.checklist.every((c) => checks[c.id] === 'pass')

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
  const decideField = async (input) => {
    if (input.decision === 'escalate') await contentModerationService.decide({ moderationId: r.id, version: r.version, ...input, checks })
    else await contentModerationService.profileFieldDecision({ moderationId: r.id, version: r.version, fieldKey: f.key, checks, ...input })
    setDialog(null)
    setNotice({ tone: 'ok', text: input.decision === 'escalate' ? 'Escalated to Trust & Safety. The provider is not suspended.' : `${f.label}: decision saved. The current live value is unchanged until changes are published.` })
    refetch()
  }
  const publish = async () => {
    setBusy(true)
    setNotice(null)
    try {
      const res = await contentModerationService.publishProfileChanges({ moderationId: r.id, version: r.version })
      setNotice({ tone: 'ok', text: `Published ${res.published.length} approved change${res.published.length === 1 ? '' : 's'} to the live profile.` })
      refetch()
    } catch (err) {
      setNotice({ tone: 'bad', text: err?.message || 'Unable to publish.' })
    } finally {
      setBusy(false)
    }
  }
  const quickApprove = async () => {
    setBusy(true)
    setNotice(null)
    try {
      await decideField({ decision: 'approve' })
    } catch (err) {
      setNotice({ tone: 'bad', text: err?.message || 'Unable to approve.' })
    } finally {
      setBusy(false)
    }
  }

  const SUMMARY = [['Fields Changed', s.changed, FileText, 'purple'], ['Standard Changes', s.standard, ShieldCheck, 'green'], ['Sensitive Change', s.sensitive, AlertTriangle, 'orange'], ['Previous Requests', s.previousRequests, History, 'blue']]

  return (
    <div className="min-h-full space-y-3 px-4 pt-3 pb-6">
      {header}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className={cn(CARD, 'flex flex-wrap items-center gap-x-6 gap-y-3 p-4')}>
          <div className="flex items-center gap-3">
            <ProviderAvatarImg url={photo} name={r.provider.name} size={80} />
            <div className="leading-snug">
              <p className="flex items-center gap-1 text-[21px] font-bold text-[#1b1140]">{r.provider.name}{r.provider.verified && <Verified />}</p>
              <p className="text-[12px] text-[#4a4466]">{r.provider.ref}</p>
              <p className="text-[13px] font-semibold text-[#2a1b57]">{r.provider.typeLabel}</p>
              <p className="flex items-center gap-1 text-[12px] text-[#4a4466]"><CountryFlag code={r.countryCode} className="h-3 w-4.5" />{r.marketName}{r.provider.city && ` • ${r.provider.city}`}</p>
            </div>
          </div>
          <div className="space-y-1.5 border-l border-[#efecf7] pl-6 text-[12.5px]">
            <StatePill map={{ x: [r.status === 'under_review' ? 'Changes Under Review' : r.status.replace('_', ' '), r.status === 'reverification' ? 'red' : 'purple'] }} value="x" />
            <p className="text-[#2a1b57]">Submitted: <span className="font-semibold text-[#1b1140]">{stamp(r.submittedAt, r.countryCode)}</span></p>
            <p className="text-[#2a1b57]">Assigned to: <span className="font-semibold text-[#1b1140]">{r.assignedTo?.name || 'Unassigned'}</span></p>
          </div>
        </section>
        <section className={cn(CARD, 'p-4')}>
          <h2 className="mb-2.5 text-[14.5px] font-bold text-[#1b1140]">Change Summary</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SUMMARY.map(([l, n, Icon, c]) => (
              <div key={l} className="flex items-center gap-2 rounded-xl border border-[#efecf7] p-2">
                <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', DISC[c])}><Icon className="size-4" /></span>
                <span className="leading-tight"><span className="block text-[18px] font-bold text-[#1b1140]">{n}</span><span className="block text-[10.5px] text-[#4a4466]">{l}</span></span>
              </div>
            ))}
          </div>
          {s.sensitive > 0 && (
            <button type="button" onClick={() => setSelected(fields.find((x) => x.sensitive)?.key)} className="mt-2.5 flex w-full items-center justify-between rounded-lg border border-[#fbd9b4] bg-[#fff6ec] px-3 py-2 text-left text-[12.5px] font-semibold text-[#b45309]">
              <span className="flex items-center gap-1.5"><AlertTriangle className="size-4" />{s.sensitive} change{s.sensitive === 1 ? '' : 's'} may require re-verification</span>
              <span className="text-[#4527c8]">View Details →</span>
            </button>
          )}
        </section>
      </div>

      {notice && <p role="status" className={cn('rounded-lg px-3 py-2 text-[12.5px] font-medium', notice.tone === 'ok' ? 'bg-[#ecfaf1] text-[#15803d]' : 'bg-[#fff1f1] text-[#b91c1c]')}>{notice.text}</p>}
      {open && !reviewing && (
        <section className={cn(CARD, 'flex flex-wrap items-center justify-between gap-3 p-3.5')}>
          <p className="text-[12.5px] text-[#2a1b57]">Start the review to decide each changed field. The current profile remains live meanwhile.</p>
          <button type="button" disabled={busy} onClick={start} className="flex h-9 items-center gap-2 rounded-lg bg-[#4125d0] px-4 text-[12.5px] font-semibold text-white disabled:opacity-60"><Play className="size-4" />Start Review</button>
        </section>
      )}

      <div className="grid items-start gap-3 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <Card title="Changed Fields" icon={FileDiff} bodyClass="space-y-1.5">
          {fields.map((x) => {
            const Icon = FIELD_ICON[x.key] || Tag
            return (
              <button key={x.key} type="button" onClick={() => setSelected(x.key)} className={cn('flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition', x.key === f?.key ? 'border-[#4125d0] bg-[#f4f0ff]' : 'border-[#ebe7f6] hover:bg-[#faf9fe]')}>
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', x.sensitive ? 'bg-[#fde4e4] text-[#dc2626]' : 'bg-[#ece5fd] text-[#6d3fe0]')}><Icon className="size-4" /></span>
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="block text-[12.5px] leading-tight font-semibold text-[#1b1140]">{x.label}</span>
                  <span className="flex flex-wrap items-center gap-1.5"><span className="text-[10.5px] text-[#6b6785]">{x.changeType === 'added' ? 'Added' : x.changeType === 'removed' ? 'Removed' : 'Changed'}</span><StatePill map={x.sensitive && x.status === 'pending' ? { pending: ['Re-verification', 'red'] } : FIELD_STATUS} value={x.status} /></span>
                </span>
              </button>
            )
          })}
        </Card>

        {f && (
          <section className={cn(CARD, 'p-3.5')}>
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#1b1140]">{f.label}<span className="rounded-md bg-[#ece5fd] px-2 py-0.5 text-[11px] font-semibold text-[#4527c8]">{f.changeKind}</span></h2>
              <div className="flex items-center gap-1 text-[12px] text-[#4a4466]">
                Field {idx + 1} of {fields.length}
                <button type="button" onClick={() => setSelected(fields[(idx - 1 + fields.length) % fields.length].key)} aria-label="Previous field" className="flex size-7 items-center justify-center rounded-lg border border-[#ddd7ee] hover:bg-[#f4f1fc]"><ChevronLeft className="size-4" /></button>
                <button type="button" onClick={() => setSelected(fields[(idx + 1) % fields.length].key)} aria-label="Next field" className="flex size-7 items-center justify-center rounded-lg border border-[#ddd7ee] hover:bg-[#f4f1fc]"><ChevronRight className="size-4" /></button>
              </div>
            </div>
            <Comparison current={f.current} proposed={f.proposed} diff={f.diff} listDiff={f.listDiff} currentNote={pc.currentVersion ? `Version ${pc.currentVersion} — live` : null} proposedNote={`Submitted ${stamp(r.submittedAt, r.countryCode).split(' • ')[0]}`} />
            {f.sensitive && (
              <div className="mt-3 rounded-xl border border-[#f5c6c6] bg-[#fff6f6] p-3 text-[12.5px]">
                <p className="flex items-center gap-1.5 font-bold text-[#b91c1c]"><ShieldCheck className="size-4" />Verification Required</p>
                <p className="mt-0.5 text-[#7f1d1d]">This change affects information previously used during provider verification. It can't be approved here — send it for re-verification ({f.reverifyRoute?.adm} {f.reverifyRoute?.label}).</p>
              </div>
            )}
            {f.decision && f.status !== 'pending' && (
              <p className="mt-3 rounded-lg bg-[#faf9fe] px-3 py-2 text-[12px] text-[#2a1b57]">Decision: <StatePill map={FIELD_STATUS} value={f.status} />{f.decision.reason && <> — {f.decision.reason}</>}{f.decision.by?.name && <span className="text-[#6b6785]"> · {f.decision.by.name}</span>}</p>
            )}
          </section>
        )}

        {f && (
          <Card title="Field Information" icon={Info}>
            <Rows rows={[
              ['Change type', f.changeKind],
              ['Public impact', f.publicImpact],
              ['Requires re-verification', f.sensitive ? <span className="font-semibold text-[#b91c1c]">Yes — {f.reverifyRoute?.label}</span> : <span className="text-[#15803d]">No</span>],
              ['Classification', f.sensitive ? 'Verification-critical' : 'Standard'],
              ['Moderation status', <StatePill key="s" map={FIELD_STATUS} value={f.status} />],
            ]} />
          </Card>
        )}
      </div>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_280px]">
        <ProfilePreviewCard title="Current Client View" photoUrl={photo} profile={pc.currentProfile} provider={r.provider} />
        <ProfilePreviewCard title="Proposed Client View" photoUrl={photo} profile={proposedProfile} provider={r.provider} tone="proposed" />
        <Card title="Review Checklist" icon={ListChecks}>
          <PolicyChecklist checklist={r.checklist} value={checks} onChange={setChecks} readOnly={!reviewing} />
        </Card>
        <Card title="Review Actions" icon={ClipboardCheck}>
          <div className="space-y-2">
            <button type="button" disabled={!fieldOpen || f?.sensitive || !allPass || busy} onClick={quickApprove} className={cn('flex h-10 w-full items-center justify-center rounded-lg border-[1.5px] text-[12.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-40', ACTION_BUTTON.approve)}>Approve This Change</button>
            <button type="button" disabled={!fieldOpen} onClick={() => setDialog('request_changes')} className={cn('flex h-10 w-full items-center justify-center rounded-lg border-[1.5px] text-[12.5px] font-semibold disabled:opacity-40', ACTION_BUTTON.request_changes)}>Request Changes</button>
            <button type="button" disabled={!fieldOpen} onClick={() => setDialog('reject')} className={cn('flex h-10 w-full items-center justify-center rounded-lg border-[1.5px] text-[12.5px] font-semibold disabled:opacity-40', ACTION_BUTTON.reject)}>Reject This Change</button>
            <button type="button" disabled={!fieldOpen} onClick={() => setDialog('reverify')} className={cn('flex h-10 w-full items-center justify-center rounded-lg border-[1.5px] text-[12.5px] font-semibold disabled:opacity-40', ACTION_BUTTON.reverify)}>Send for Re-verification</button>
            <button type="button" disabled={!reviewing} onClick={() => setDialog('escalate')} className={cn('flex h-10 w-full items-center justify-center rounded-lg border-[1.5px] text-[12.5px] font-semibold disabled:opacity-40', ACTION_BUTTON.escalate)}><Users className="mr-1.5 size-4" />Escalate to Trust & Safety</button>
            {fieldOpen && !f.sensitive && !allPass && <p className="text-[11px] text-[#6b6785]">Approve requires every check to pass.</p>}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" onClick={() => setSelected(fields[(idx - 1 + fields.length) % fields.length].key)} className="flex h-9 items-center justify-center gap-1 rounded-lg border border-[#ddd7ee] text-[12px] font-semibold text-[#2a1b57] hover:bg-[#f4f1fc]"><ChevronLeft className="size-4" />Previous Field</button>
              <button type="button" onClick={() => setSelected(fields[(idx + 1) % fields.length].key)} className="flex h-9 items-center justify-center gap-1 rounded-lg bg-[#4125d0] text-[12px] font-semibold text-white">Next Field<ChevronRight className="size-4" /></button>
            </div>
            <Link to={infoRequestPath('profile_change', r.id, location.pathname)} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#b9a9f0] text-[12px] font-semibold text-[#4527c8] hover:bg-[#f4f0ff]"><MessageSquarePlus className="size-4" />Request More Information</Link>
          </div>
        </Card>
      </div>

      <section className={cn(CARD, 'flex flex-wrap items-center justify-between gap-3 p-3.5')}>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-[#2a1b57]">
          <span className="font-bold text-[#1b1140]">Approval Summary</span>
          <span>Fields submitted: <b>{s.changed}</b></span>
          <span>Approved: <b className="text-[#15803d]">{s.approved + s.published}</b></span>
          <span>Requires re-verification: <b className="text-[#b91c1c]">{s.reverification + fields.filter((x) => x.sensitive && x.status === 'pending').length}</b></span>
          <span>Rejected: <b>{s.rejected}</b></span>
          <span>Published: <b>{s.published}</b></span>
        </div>
        <button type="button" disabled={busy || !pc.publishable.length} onClick={publish} className="flex h-9 items-center gap-2 rounded-lg bg-[#15803d] px-4 text-[12.5px] font-semibold text-white disabled:opacity-40"><Send className="size-4" />Approve Eligible Changes ({pc.publishable.length})</button>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Change History (Profile Versions)" icon={History}>
          <ul className="space-y-2">
            {pc.versions.map((v) => (
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

      {dialog && (
        <ChangeDecisionDialog
          decision={dialog}
          title={{ request_changes: 'Request Changes', reject: 'Reject Proposed Change', reverify: 'Re-verification Required', escalate: 'Escalate to Trust & Safety' }[dialog]}
          subject={dialog === 'escalate' ? `${r.provider.name} — profile change request` : f.label}
          summaryRows={dialog === 'reverify' ? [['Current', Array.isArray(f.current) ? f.current.join(', ') : f.current], ['Proposed', Array.isArray(f.proposed) ? f.proposed.join(', ') : f.proposed], ['Routes to', `${f.reverifyRoute?.adm || 'ADM-031'} ${f.reverifyRoute?.label || 'Verification Review'}`]] : null}
          reasons={r.reasons.changes}
          rejectReasons={r.reasons.reject}
          escalateReasons={r.reasons.escalate}
          teams={r.reasons.teams}
          impact={{ request_changes: 'The existing live profile remains unchanged.', reject: 'The proposed change will not be published. The currently approved profile information remains live.', reverify: "This field goes back to the Verification Center. The provider's existing history is kept.", escalate: 'Escalation never suspends the provider. Account-level action goes through ADM-028.' }[dialog]}
          cta={{ request_changes: 'Send Request', reject: 'Confirm Rejection', reverify: 'Send for Re-verification', escalate: 'Escalate' }[dialog]}
          onSubmit={decideField}
          onClose={() => setDialog(null)}
        />
      )}
      {!open && <p className="text-center text-[12px] text-[#6b6785]">This change request is closed ({r.status.replace('_', ' ')}). <button type="button" onClick={() => navigate(back)} className="font-semibold text-[#4527c8] hover:underline">Back to queue</button></p>}
    </div>
  )
}
