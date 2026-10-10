import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, ChevronLeft, ChevronRight, ClipboardCheck, Eye, Info, MapPin, MoreHorizontal, Play, Tag } from 'lucide-react'
import Skeleton from '../ui/Skeleton'
import CountryFlag from '../ui/CountryFlag'
import { useContentReview } from '../../hooks/useContentModeration'
import { contentModerationService } from '../../services/contentModerationService'
import { CONTENT_BASE, infoRequestPath, reviewPath } from '../../constants/contentModeration'
import { formatCurrency } from '../../lib/currency'
import { cn } from '../../lib/utils'
import { CARD, Card, DecisionDialog, MediaViewer, Placements, PolicyChecklist, ProviderAvatarImg, ReviewActions, Rows, StatusPill, Verified, stamp } from './ContentUI'

const money = (n, c) => (typeof n === 'number' && c ? formatCurrency(n, c) : '—')

function TypeDetails({ r }) {
  if (r.service) {
    const s = r.service
    return (
      <Card title="Service Content" icon={Tag}>
        <p className="text-[14px] font-bold text-[#1b1140]">{s.name}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#2a1b57]">{s.description}</p>
        <div className="mt-2"><Rows rows={[['Duration', s.durationMins ? `${s.durationMins} min` : '—'], ['Price', money(s.price, r.currency)], ['Category', s.category], ['Submitted by', r.provider.name]]} /></div>
        <p className="mt-2 text-[10.5px] text-[#6b6785]">Content moderation does not replace credential verification (ADM-033).</p>
      </Card>
    )
  }
  if (r.offer) {
    const o = r.offer
    return (
      <Card title={r.contentType === 'package' ? 'Package Content' : 'Offer Content'} icon={Tag}>
        <p className="text-[14px] font-bold text-[#1b1140]">{o.title}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#2a1b57]">{o.description}</p>
        <div className="mt-2">
          <Rows rows={[
            ['Original price', money(o.originalPrice, r.currency)],
            ['Offer price', money(o.offerPrice, r.currency)],
            ['Valid dates', o.validFrom && o.validTo ? `${stamp(o.validFrom, r.countryCode).split(' • ')[0]} – ${stamp(o.validTo, r.countryCode).split(' • ')[0]}` : <span className="text-[#b45309]">Not provided</span>],
            ['Eligible services', o.eligibleServices?.join(', ')],
            ['Branch / location', o.location],
          ]} />
        </div>
        <p className="mt-2 text-[10.5px] text-[#6b6785]">Only the public content is moderated here — pricing rules stay in the promotion engine.</p>
      </Card>
    )
  }
  if (r.business) {
    return (
      <Card title="Public Business Description" icon={Info}>
        <p className="text-[12px] leading-relaxed text-[#2a1b57]">{r.business.description}</p>
      </Card>
    )
  }
  return null
}

// Right-hand review panel for the selected queue item (ADM-035).
export default function ContentReviewPanel({ id, onPrev, onNext, onChanged }) {
  const navigate = useNavigate()
  const { data: r, error, loading, refetch } = useContentReview(id)
  const [index, setIndex] = useState(0)
  const [checks, setChecks] = useState({})
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  if (error) return <div className={cn(CARD, 'p-4 text-[12.5px] text-[#b91c1c]')}>{error} <button type="button" onClick={refetch} className="font-semibold underline">Retry</button></div>
  if (loading || !r) return <Skeleton className="h-[760px] rounded-2xl" />

  const full = reviewPath(r)
  // These types are decided on their dedicated screens (item / field level).
  const fullOnly = ['gallery', 'profile_change', 'service'].includes(r.contentType)
  const open = ['awaiting_review', 'under_review', 'resubmitted', 'escalated'].includes(r.status)
  const reviewing = r.status === 'under_review' || (r.status === 'escalated' && r.assignedTo)
  const media = r.media.length ? r.media : []
  const current = media[Math.min(index, media.length - 1)]

  const start = async () => {
    setBusy(true)
    setActionError(null)
    try {
      await contentModerationService.startReview(r.id)
      if (full) navigate(full)
      else {
        refetch()
        onChanged?.()
      }
    } catch (err) {
      setActionError(err?.message || 'Unable to start the review.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2.5">
      <section className={cn(CARD, 'p-3.5')}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-[#1b1140]">Content Review</h2>
            <StatusPill value={r.status} />
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-1 text-[12px] font-semibold text-[#2a1b57]">{r.contentId}</span>
            <button type="button" onClick={onPrev} aria-label="Previous item" className="flex size-7 items-center justify-center rounded-lg border border-[#ddd7ee] hover:bg-[#f4f1fc]"><ChevronLeft className="size-4" /></button>
            <button type="button" onClick={onNext} aria-label="Next item" className="flex size-7 items-center justify-center rounded-lg border border-[#ddd7ee] hover:bg-[#f4f1fc]"><ChevronRight className="size-4" /></button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-start gap-3">
          <ProviderAvatarImg url={r.provider.photoUrl || (r.contentType === 'profile_photo' ? null : r.media[0]?.url)} name={r.provider.name} size={60} rounded={r.provider.category === 'individual' ? 'rounded-full' : 'rounded-xl'} />
          <div className="min-w-0 flex-1 leading-snug">
            <p className="flex items-center gap-1 text-[16px] font-bold text-[#1b1140]">{r.provider.name}{r.provider.verified && <Verified />}</p>
            <p className="text-[11.5px] text-[#4a4466]">{r.provider.ref}</p>
            <p className="text-[12px] font-medium text-[#2a1b57]">{r.provider.typeLabel}</p>
            <p className="flex items-center gap-1 text-[11.5px] text-[#4a4466]"><CountryFlag code={r.countryCode} className="h-3 w-4.5" />{r.marketName}{r.provider.city && <><MapPin className="ml-1 size-3" />{r.provider.city}</>}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px]">
            <span className="text-[#6b6785]">Content type</span><span className="text-[#6b6785]">Submitted</span>
            <span className="font-semibold text-[#1b1140]">{r.contentLabel}</span><span className="font-semibold text-[#1b1140]">{stamp(r.submittedAt, r.countryCode)}</span>
            <span className="text-[#6b6785]">Assigned</span><span className="text-[#6b6785]">Version</span>
            <span className="font-semibold text-[#1b1140]">{r.assignedTo?.name || 'Unassigned'}</span><span className="font-semibold text-[#1b1140]">{r.version}{r.resubmitted ? ' (resubmitted)' : ''}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {r.provider.id && <Link to={`/providers/${r.provider.id}`} className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#b9a9f0] px-3 text-[12px] font-semibold text-[#4527c8] hover:bg-[#f4f0ff]">View Provider Profile</Link>}
          {full && <Link to={full} className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#ddd7ee] px-3 text-[12px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]">Open Full Review <ArrowRight className="size-3.5" /></Link>}
          {open && <Link to={infoRequestPath(r.contentType === 'profile_change' ? 'profile_change' : r.contentType === 'service' ? 'service' : 'content', r.id, `${CONTENT_BASE}?c=${r.id}`)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-dashed border-[#b9a9f0] px-3 text-[12px] font-semibold text-[#4527c8] hover:bg-[#f4f0ff]">Request More Info</Link>}
        </div>
      </section>

      <div className="grid gap-2.5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-2.5">
          {media.length > 0 && (
            <section className={cn(CARD, 'p-2.5')}>
              <MediaViewer items={media} index={Math.min(index, media.length - 1)} onIndex={setIndex} height="h-[320px]" />
            </section>
          )}
          <TypeDetails r={r} />
        </div>
        <div className="space-y-2.5">
          <Card title="Content Details" icon={Info}>
            <Rows rows={[
              ['Content ID', r.contentId],
              ['Provider', r.provider.name],
              ['Provider type', r.provider.typeLabel],
              ['Content type', r.contentLabel],
              ['Market', <span key="m" className="inline-flex items-center gap-1"><CountryFlag code={r.countryCode} className="h-3 w-4.5" />{r.marketName}</span>],
              ['Submitted', stamp(r.submittedAt, r.countryCode)],
              ['Previous version', r.previousVersions.length ? `Yes (Version ${r.version})` : 'No'],
              current?.width && ['File details', `${current.format || 'Image'} · ${current.width} × ${current.height}`],
            ]} />
          </Card>
          <Card title="Where It Will Appear" icon={Eye}><Placements items={r.placements} /></Card>
        </div>
      </div>

      {r.reason && !open && (
        <section className={cn(CARD, 'p-3.5 text-[12px]')}>
          <p className="font-semibold text-[#1b1140]">Decision: <StatusPill value={r.status} /></p>
          <p className="mt-1 text-[#2a1b57]">Reason: {r.reason}</p>
          {r.providerMessage && <p className="mt-1 text-[#4a4466]">Message to provider: “{r.providerMessage}”</p>}
          {r.reviewedBy && <p className="mt-1 text-[11px] text-[#6b6785]">by {r.reviewedBy.name} · {stamp(r.reviewedAt, r.countryCode)}</p>}
        </section>
      )}

      {open && !fullOnly && (
        <div className="grid gap-2.5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Card title="Review Checklist" icon={ClipboardCheck}>
            <PolicyChecklist checklist={r.checklist} value={checks} onChange={setChecks} readOnly={!reviewing} />
          </Card>
          <Card title="Review Actions" icon={MoreHorizontal}>
            {!reviewing ? (
              <div className="space-y-2">
                <button type="button" disabled={busy} onClick={start} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#4125d0] text-[13px] font-semibold text-white shadow-sm hover:bg-[#3519b8] disabled:opacity-60"><Play className="size-4" /> {busy ? 'Starting…' : 'Start Review'}</button>
                <p className="text-[11px] text-[#6b6785]">Starting assigns this item to you and records the review start time.</p>
              </div>
            ) : (
              <ReviewActions onAction={setDialog} approveHint={r.checklist.some((c) => checks[c.id] !== 'pass') ? 'Approve requires every check to pass.' : null} />
            )}
            {actionError && <p role="alert" className="mt-2 text-[11.5px] text-[#b91c1c]">{actionError}</p>}
          </Card>
        </div>
      )}
      {open && fullOnly && (
        <section className={cn(CARD, 'space-y-2 p-3.5')}>
          <p className="text-[12.5px] text-[#2a1b57]">{r.contentType === 'gallery' ? 'Gallery media is moderated image by image — one rejected image never rejects the whole gallery.' : r.contentType === 'profile_change' ? 'Profile changes are decided field by field; the current profile stays live until changes are approved.' : 'Service submissions are reviewed against the provider’s approved category before publication.'}</p>
          <button type="button" disabled={busy} onClick={reviewing ? () => navigate(full) : start} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#4125d0] text-[13px] font-semibold text-white hover:bg-[#3519b8] disabled:opacity-60"><Play className="size-4" /> {reviewing ? 'Continue Review' : 'Start Review'}</button>
          {actionError && <p role="alert" className="text-[11.5px] text-[#b91c1c]">{actionError}</p>}
        </section>
      )}

      {dialog && (
        <DecisionDialog
          decision={dialog}
          review={r}
          checks={checks}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null)
            setChecks({})
            refetch()
            onChanged?.()
          }}
        />
      )}
    </div>
  )
}
