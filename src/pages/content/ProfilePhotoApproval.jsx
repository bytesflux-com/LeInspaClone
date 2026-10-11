import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ChevronRight, ClipboardCheck, Eye, FileImage, Gauge, Info, ListChecks, Play, ScanFace, UserRound } from 'lucide-react'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import CountryFlag from '../../components/ui/CountryFlag'
import { usePermissions } from '../../hooks/usePermissions'
import { useContentReview } from '../../hooks/useContentModeration'
import { contentModerationService } from '../../services/contentModerationService'
import { PERMISSIONS } from '../../constants/permissions'
import { CONTENT_BASE } from '../../constants/contentModeration'
import { cn } from '../../lib/utils'
import { CARD, Card, DecisionDialog, MediaViewer, NotesCard, Placements, PolicyChecklist, ProviderAvatarImg, ProviderHistory, QualityList, ReviewActions, ReviewHistory, Rows, StatusPill, Verified, VersionHistory, stamp } from '../../components/content/ContentUI'
import PublicPreview from '../../components/content/PublicPreview'

const OPEN = ['awaiting_review', 'under_review', 'resubmitted', 'escalated']

// ADM-036 — Profile Photo Approval. Content moderation only: whether this photo
// is suitable to represent the provider publicly. Identity matching against
// documents belongs to ADM-032 and is deliberately not asked here.
export default function ProfilePhotoApproval() {
  const { moderationId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { can } = usePermissions()
  const { data: r, error, loading, refetch } = useContentReview(can(PERMISSIONS.CONTENT_MODERATE) ? moderationId : null)
  const [checks, setChecks] = useState({})
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [shown, setShown] = useState(0)
  const back = location.state?.returnTo || `${CONTENT_BASE}/profile-photos`

  const header = (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex size-11 items-center justify-center rounded-xl bg-[#4125d0] text-white shadow"><ScanFace className="size-6" /></span>
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[12px] text-[#4a4466]">
            <Link to={CONTENT_BASE} className="hover:text-[#4527c8]">Content Approval Center</Link><ChevronRight className="size-3.5" /><span className="font-semibold text-[#4527c8]">Profile Photo Approval</span>
          </nav>
          <h1 className="font-display text-[34px] leading-none font-bold tracking-tight text-[#1b1140]">Profile Photo Approval</h1>
          <p className="mt-1 text-[13px] text-[#2a1b57]">Review the provider's profile photo before it appears publicly across Lé Inspa.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to={back} className="inline-flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-[#4125d0] bg-white px-3.5 text-[12.5px] font-semibold text-[#4125d0] hover:bg-[#f4f0ff]"><ArrowLeft className="size-4" /> Back to Content Approval Center</Link>
        {r?.provider.id && <Link to={`/providers/${r.provider.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#ddd7ee] bg-white px-3.5 text-[12.5px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]"><UserRound className="size-4" /> View Provider Profile</Link>}
      </div>
    </header>
  )

  if (!can(PERMISSIONS.CONTENT_MODERATE)) return <div className="px-4 pt-3">{header}<ErrorState className="mx-auto mt-8 max-w-xl" title="You don't have access to content moderation" description="Ask a Super Admin to grant the content.moderate permission." /></div>
  if (error) return <div className="space-y-3 px-4 pt-3">{header}<ErrorState title="Unable to open this profile photo" description={error} onRetry={refetch} /></div>
  if (loading || !r) return <div className="space-y-3 px-4 pt-3">{header}<Skeleton className="h-[640px] rounded-2xl" /></div>
  if (r.contentType !== 'profile_photo') {
    return <div className="space-y-3 px-4 pt-3">{header}<ErrorState title="This is not a profile photo" description={`${r.contentId} is ${r.contentLabel}. Open it from the Content Approval Center.`} /></div>
  }

  const photo = r.media[0]
  const versions = [{ url: photo?.url, title: `Version ${r.version} (Current)` }, ...r.previousVersions.filter((v) => v.url).map((v) => ({ url: v.url, title: `Version ${v.version}` }))]
  const open = OPEN.includes(r.status)
  const reviewing = r.status === 'under_review' || (r.status === 'escalated' && r.assignedTo)
  const passed = r.checklist.filter((c) => checks[c.id] === 'pass').length
  const quality = photo?.quality || []

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

  return (
    <div className="min-h-full space-y-3 px-4 pt-3 pb-6">
      {header}
      <div className="grid items-start gap-3 2xl:grid-cols-[minmax(0,2.15fr)_minmax(360px,1fr)]">
        <div className="min-w-0 space-y-3">
          <section className={cn(CARD, 'flex flex-wrap items-center gap-x-6 gap-y-3 p-4')}>
            <div className="flex items-center gap-3">
              <ProviderAvatarImg url={photo?.url} name={r.provider.name} size={76} />
              <div className="leading-snug">
                <p className="flex items-center gap-1 text-[22px] font-bold text-[#1b1140]">{r.provider.name}{r.provider.verified && <Verified />}</p>
                <p className="text-[12px] text-[#4a4466]">{r.provider.ref}</p>
                <p className="text-[13px] font-semibold text-[#2a1b57]">{r.provider.typeLabel}</p>
                <p className="flex items-center gap-1 text-[12px] text-[#4a4466]"><CountryFlag code={r.countryCode} className="h-3 w-4.5" />{r.marketName}{r.provider.city && ` • ${r.provider.city}`}</p>
              </div>
            </div>
            <div className="space-y-1.5 border-l border-[#efecf7] pl-6 text-[12.5px]">
              <StatusPill value={r.status} />
              <p className="text-[#2a1b57]">Submitted: <span className="font-semibold text-[#1b1140]">{stamp(r.submittedAt, r.countryCode)}</span></p>
              <p className="text-[#2a1b57]">Assigned to: <span className="font-semibold text-[#1b1140]">{r.assignedTo?.name || 'Unassigned'}</span></p>
            </div>
          </section>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <Card title="Submitted Profile Photo" icon={FileImage}>
              <div className="flex gap-2.5">
                <div className="flex w-16 shrink-0 flex-col gap-2">
                  {versions.map((v, i) => (
                    <button key={v.title} type="button" onClick={() => setShown(i)} title={v.title} className={cn('overflow-hidden rounded-lg ring-2 transition', shown === i ? 'ring-[#4125d0]' : 'ring-transparent opacity-75 hover:opacity-100')}>
                      <img src={v.url} alt={v.title} className="aspect-square w-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <MediaViewer items={[versions[shown] || versions[0]]} height="h-[380px]" showStrip={false} />
                  {photo && (
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-[#faf9fe] px-2.5 py-1.5 text-[11.5px] text-[#2a1b57]">
                      <span className="font-semibold">{shown === 0 ? 'Original Photo' : versions[shown]?.title}</span>
                      {shown === 0 && <><span>{photo.width} × {photo.height}</span>{photo.sizeBytes && <span>{(photo.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>}<span>{photo.format}</span>{quality[0] && <span className={cn('rounded-md px-1.5 py-0.5 text-[10.5px] font-bold', quality[0].state === 'good' ? 'bg-[#dcf6e4] text-[#15803d]' : 'bg-[#ffecd6] text-[#b45309]')}>{quality[0].state === 'good' ? '✓ Good Resolution' : 'Low Resolution'}</span>}</>}
                    </p>
                  )}
                </div>
              </div>
            </Card>
            <div className="space-y-3">
              <Card title="Photo Information" icon={Info}>
                <Rows rows={[
                  ['Content ID', r.contentId],
                  ['Provider', r.provider.name],
                  ['Provider type', r.provider.typeLabel],
                  ['Market', <span key="m" className="inline-flex items-center gap-1"><CountryFlag code={r.countryCode} className="h-3 w-4.5" />{r.marketName}</span>],
                  ['Submitted', stamp(r.submittedAt, r.countryCode)],
                  ['Current version', `Version ${r.version}`],
                  ['Status', <StatusPill key="s" value={r.status} />],
                  ['Previous version', r.previousVersions.length ? 'Available' : 'None'],
                ]} />
              </Card>
              <Card title="Image Quality" icon={Gauge}>
                <QualityList quality={quality} />
                <p className="mt-1.5 text-[10.5px] text-[#6b6785]">Measured from the file. Lighting, cropping and visibility are judged in the checklist — studio photography is not required.</p>
              </Card>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <Card title="Review Checklist" icon={ListChecks}>
              <PolicyChecklist checklist={r.checklist} value={checks} onChange={setChecks} readOnly={!open || !reviewing} />
              <p className="mt-1 text-[10.5px] text-[#6b6785]">This checks public suitability only. Identity matching belongs to identity verification (ADM-032).</p>
            </Card>
            <div className="space-y-3">
              <Card title="Review Actions" icon={ClipboardCheck}>
                {!open ? (
                  <div className="space-y-1.5 text-[12.5px]">
                    <p>Decision recorded: <StatusPill value={r.status} /></p>
                    {r.reason && <p className="text-[#2a1b57]">Reason: {r.reason}</p>}
                    {r.reviewedBy && <p className="text-[11px] text-[#6b6785]">by {r.reviewedBy.name} · {stamp(r.reviewedAt, r.countryCode)}</p>}
                    <button type="button" onClick={() => navigate(back)} className="mt-1 h-9 w-full rounded-lg bg-[#4125d0] text-[12.5px] font-semibold text-white">Back to queue</button>
                  </div>
                ) : !reviewing ? (
                  <div className="space-y-2">
                    <button type="button" disabled={busy} onClick={start} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#4125d0] text-[13px] font-semibold text-white hover:bg-[#3519b8] disabled:opacity-60"><Play className="size-4" />{busy ? 'Starting…' : 'Start Review'}</button>
                    <p className="text-[11px] text-[#6b6785]">Assigns this photo to you and records the start time.</p>
                  </div>
                ) : (
                  <ReviewActions onAction={setDialog} labels={{ approve: 'Approve Profile Photo', reject: 'Reject Profile Photo' }} approveHint={passed < r.checklist.length ? 'Approve requires every check to pass.' : null} />
                )}
                {actionError && <p role="alert" className="mt-2 text-[11.5px] text-[#b91c1c]">{actionError}</p>}
              </Card>
              <Card title="Review Summary" icon={Eye}>
                <Rows rows={[
                  ['Provider', r.provider.name],
                  ['Content', 'Profile Photo'],
                  ['Image quality', quality.some((q) => q.state === 'poor') ? <span className="text-[#b91c1c]">Below standard</span> : <span className="text-[#15803d]">Suitable</span>],
                  ['Content standards', passed === r.checklist.length ? <span className="text-[#15803d]">Passed</span> : `${passed} of ${r.checklist.length} checked`],
                  ['Outstanding issues', r.checklist.some((c) => checks[c.id] === 'fail') ? <span className="text-[#b91c1c]">{r.checklist.filter((c) => checks[c.id] === 'fail').length} failed checks</span> : 'None'],
                ]} />
              </Card>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <Card title="Public Appearance Preview" icon={Eye}>
            <p className="-mt-1 mb-1 text-[11px] text-[#6b6785]">How this photo will appear to clients.</p>
            <PublicPreview photoUrl={versions[shown]?.url || photo?.url} provider={r.provider} currency={r.currency} />
            <div className="mt-3 rounded-xl bg-[#f4f0ff] p-2.5">
              <p className="mb-1.5 text-[12px] font-bold text-[#4527c8]">Where It Will Appear</p>
              <Placements items={r.placements} />
            </div>
          </Card>
          <VersionHistory current={{ version: r.version, status: r.status, submittedAt: r.submittedAt, url: photo?.url }} versions={r.previousVersions} countryCode={r.countryCode} />
          <ReviewHistory history={r.history} countryCode={r.countryCode} />
          <NotesCard moderationId={r.id} notes={r.notes} countryCode={r.countryCode} onAdded={refetch} />
          <ProviderHistory stats={r.providerStats} providerId={r.provider.id} />
        </div>
      </div>

      {dialog && (
        <DecisionDialog decision={dialog} review={r} checks={checks} onClose={() => setDialog(null)} onDone={() => { setDialog(null); refetch() }} />
      )}
    </div>
  )
}
