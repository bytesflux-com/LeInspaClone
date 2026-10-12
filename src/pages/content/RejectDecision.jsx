import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileWarning,
  FlaskConical,
  History,
  Info,
  Layers,
  Lock,
  MessageSquareWarning,
  ShieldAlert,
  Smartphone,
  Sparkles,
  UserRound,
  X,
  XCircle,
} from 'lucide-react'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import CountryFlag from '../../components/ui/CountryFlag'
import { StatePill } from '../../components/bookings/OpsUI'
import { CARD, Card, ProviderAvatarImg, Rows, StatusPill, Verified, stamp } from '../../components/content/ContentUI'
import {
  APPROVAL_HISTORY_PATH,
  CONTENT_BASE,
  infoRequestPath,
  reviewPath,
  verificationDecisionPath,
} from '../../constants/contentModeration'
import { approvalWorkflowService } from '../../services/approvalWorkflowService'
import { cn } from '../../lib/utils'

const field =
  'w-full rounded-lg border border-[#ddd7ee] bg-white px-2.5 py-2 text-[12.5px] text-[#1b1140] focus:border-[#7a5cf0] focus:outline-none'

const REASON_ICONS = {
  prohibited_content: Ban,
  explicit_prohibited: Ban,
  misleading_information: AlertTriangle,
  misleading_image: AlertTriangle,
  unsupported_claim: FileWarning,
  outside_approved_category: Layers,
  category_mismatch: Layers,
  inappropriate_description: MessageSquareWarning,
  policy_violation: ShieldAlert,
  duplicate_submission: Copy,
  privacy_concern: Lock,
  unrelated_media: FileWarning,
  promotional_overlay: Sparkles,
  contact_details: Smartphone,
}

const DEMO_PRESETS = [
  { label: 'Service Information (Grace Njeri)', module: 'service', record: 'CNT-48291' },
  { label: 'Gallery Media (Serenity Spa)', module: 'gallery', record: 'CNT-72819', target: 'MED-82937' },
  { label: 'Profile Change (Grace Njeri)', module: 'profile_change', record: 'CNT-83110' },
  { label: 'Credentials (Grace Njeri)', module: 'credentials', record: 'PR-82941' },
  { label: 'Business Documents (Serenity Spa)', module: 'business_documents', record: 'SPA-28192' },
]

function computeBackPath(origin, returnTo) {
  if (returnTo) return returnTo
  if (!origin) return CONTENT_BASE
  if (['verification', 'identity', 'credentials', 'business_documents'].includes(origin.originModule)) {
    return verificationDecisionPath(origin.originRecordId)
  }
  if (['service', 'profile_change', 'profile_photo', 'gallery'].includes(origin.originModule)) {
    return (
      reviewPath({ contentType: origin.originModule === 'service' ? 'service' : origin.originModule, id: origin.originRecordId }) ||
      `${CONTENT_BASE}?c=${origin.originRecordId}`
    )
  }
  return `${CONTENT_BASE}?c=${origin.originRecordId}`
}

function buildBreadcrumbs(origin, backPath) {
  if (!origin) return [['Content Approval Center', CONTENT_BASE]]
  if (['verification', 'identity', 'credentials', 'business_documents'].includes(origin.originModule)) {
    return [
      ['Verification Center', verificationDecisionPath(origin.originRecordId)],
      [origin.reviewType || 'Verification Review', backPath],
    ]
  }
  return [
    ['Content Approval Center', CONTENT_BASE],
    [origin.reviewType || 'Content Review', backPath],
  ]
}

function RejectHeader({ origin, backPath, onSelectPreset }) {
  const titleLabel = origin?.decisionTypeLabel || 'Service Information'
  const crumbs = buildBreadcrumbs(origin, backPath)

  return (
    <header className="space-y-2.5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#dc2626] text-white shadow-sm">
            <XCircle className="size-6" />
          </span>
          <div>
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[12px] text-[#4a4466]">
              {crumbs.map(([label, to]) => (
                <span key={label} className="flex items-center gap-1">
                  {to ? (
                    <Link to={to} className="hover:text-[#4527c8]">
                      {label}
                    </Link>
                  ) : (
                    <span>{label}</span>
                  )}
                  <ChevronRight className="size-3.5" />
                </span>
              ))}
              <span className="font-semibold text-[#4527c8]">Reject {titleLabel}</span>
            </nav>
            <h1 className="font-display text-[32px] leading-none font-bold tracking-tight text-[#1b1140] sm:text-[36px]">
              Reject {titleLabel}
            </h1>
            <p className="mt-1 text-[13px] text-[#2a1b57]">
              Record the reason for rejecting this submission and send a clear explanation to the provider.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-[#e6d9bf] bg-[#fbf6ea] px-2.5 py-1 text-[10.5px] leading-tight text-[#8a6a2f]">
            <b className="block text-[11px]">NEW + SHARED</b>
            Used across verification and content approval workflows.
          </span>
          <Link
            to={backPath}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-[#4125d0] bg-white px-3.5 text-[12.5px] font-semibold text-[#4125d0] hover:bg-[#f4f0ff]"
          >
            <ArrowLeft className="size-4" /> Back to Review
          </Link>
          {origin?.provider?.id && (
            <Link
              to={`/providers/${origin.provider.id}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#ddd7ee] bg-white px-3.5 text-[12.5px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]"
            >
              <UserRound className="size-4" /> View Provider Profile
            </Link>
          )}
        </div>
      </div>

      {/* Demo-only context switcher (sample records exist only in mock mode) */}
      {approvalWorkflowService.isMock && (
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#ece7fa] bg-[#faf8fe] px-3 py-1.5 text-[11.5px]">
        <span className="font-semibold text-[#4a4466]">Shared Workflow Context:</span>
        {DEMO_PRESETS.map((p) => {
          const active = origin?.originModule === p.module && origin?.originRecordId === p.record
          return (
            <button
              key={`${p.module}-${p.record}`}
              type="button"
              onClick={() => onSelectPreset(p)}
              className={cn(
                'rounded-lg px-2.5 py-1 font-semibold transition',
                active ? 'bg-[#4125d0] text-white shadow-xs' : 'text-[#4a4466] hover:bg-[#ede8fb] hover:text-[#1b1140]',
              )}
            >
              {p.label}
            </button>
          )
        })}
      </div>
      )}
    </header>
  )
}

function ContextSummaryRow({ origin }) {
  const moduleName = ['verification', 'identity', 'credentials', 'business_documents'].includes(origin.originModule)
    ? 'Verification Center'
    : 'Content Approval'

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section className={cn(CARD, 'flex flex-wrap items-center gap-x-6 gap-y-3 p-4')}>
        <div className="flex items-center gap-3.5">
          <ProviderAvatarImg url={origin.provider.photoUrl} name={origin.provider.name} size={76} />
          <div className="leading-snug">
            <p className="flex items-center gap-1.5 text-[20px] font-bold text-[#1b1140]">
              {origin.provider.name}
              {origin.provider.verified && <Verified />}
            </p>
            <p className="text-[12px] text-[#4a4466]">{origin.provider.ref || origin.provider.id}</p>
            <p className="text-[12.5px] font-semibold text-[#2a1b57]">{origin.provider.typeLabel}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#4a4466]">
              <CountryFlag code={origin.countryCode} className="h-3 w-4.5" />
              {origin.provider.city ? `${origin.provider.city}, ${origin.marketName}` : origin.marketName}
            </p>
          </div>
        </div>

        <div className="space-y-1 border-l border-[#efecf7] pl-6 text-[12.5px]">
          <span className="inline-block rounded-md bg-[#ece5fd] px-2 py-0.5 text-[11px] font-semibold text-[#4527c8]">
            Item Being Rejected
          </span>
          <p className="text-[17px] font-bold text-[#1b1140]">{origin.subjectTitle}</p>
          <p className="text-[#2a1b57]">
            {origin.originModule === 'service' ? 'Service ID' : 'Reference ID'}: <b>{origin.subjectId}</b>
          </p>
          <p className="text-[#4a4466]">Submitted: {stamp(origin.submittedAt, origin.countryCode)}</p>
          <p className="flex items-center gap-1.5 text-[#2a1b57]">
            Current status: <StatusPill value={origin.status || 'under_review'} />
          </p>
        </div>
      </section>

      <Card title="Rejection Context" icon={Info}>
        <Rows
          rows={[
            ['Module', moduleName],
            ['Review type', origin.decisionTypeLabel],
            ['Related provider', origin.provider.name],
            ['Item', `${origin.subjectTitle} (${origin.subjectId})`],
            ['Version', `Version ${origin.version || 1} (Proposed)`],
          ]}
        />
      </Card>
    </div>
  )
}

function RejectionPhonePreview({ origin, reasonLabel, message, allowResubmission, guidance }) {
  return (
    <div className="mx-auto w-full max-w-[310px] rounded-[28px] border-[6px] border-[#1b1140] bg-white shadow-xl">
      <div className="flex items-center justify-between rounded-t-[22px] bg-[#f7f4ff] px-3.5 py-2 text-[11px] font-bold text-[#1b1140]">
        <span className="font-display text-[15px] text-[#4125d0]">Lé Inspa</span>
        <span>☰</span>
      </div>
      <div className="space-y-2.5 p-3.5 text-[11.5px]">
        <div className="flex items-center gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#dc2626] text-white">
            <X className="size-3.5" strokeWidth={3} />
          </span>
          <p className="text-[13px] font-bold text-[#1b1140]">{origin.decisionTypeLabel} Not Approved</p>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-[#f0edf8] pb-2">
          <span className="font-bold text-[#1b1140]">{origin.subjectTitle}</span>
          <span className="rounded-md bg-[#fde4e4] px-2 py-0.5 text-[10px] font-bold text-[#b91c1c]">
            Status: Rejected
          </span>
        </div>

        <p className="text-[#1b1140]">
          <span className="font-bold">Reason:</span> {reasonLabel || 'Unsupported Claim'}
        </p>

        <p className="whitespace-pre-line leading-relaxed text-[#2a1b57]">
          {message || 'Your submission could not be approved. Please review the feedback and update your submission.'}
        </p>

        {allowResubmission ? (
          <div className="rounded-xl border border-[#f5d5a7] bg-[#fff8eb] p-2.5 text-[11px] text-[#92400e]">
            <p className="flex items-center gap-1 font-bold text-[#b45309]">
              <AlertTriangle className="size-3.5 shrink-0" /> What You Can Do Next
            </p>
            <p className="mt-1 leading-snug">
              {guidance ||
                'You may update the submission and resubmit a new version for review.'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#f3b7b7] bg-[#fff1f1] p-2.5 text-[11px] text-[#b91c1c]">
            <p className="font-bold">Resubmission Not Permitted</p>
            <p className="mt-0.5 leading-snug">
              This item cannot be resubmitted under current marketplace policy.
            </p>
          </div>
        )}

        <div
          className={cn(
            'flex h-8.5 items-center justify-center rounded-lg text-[11.5px] font-semibold text-white',
            allowResubmission ? 'bg-[#4125d0]' : 'bg-[#6b6785]',
          )}
        >
          {allowResubmission ? `Edit & Resubmit ${origin.originModule === 'service' ? 'Service' : 'Item'}` : 'View Policy Standards'}
        </div>
      </div>
    </div>
  )
}

export default function RejectDecision() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const originModule = params.get('module') || 'service'
  const originRecordId = params.get('record') || 'CNT-48291'
  const targetId = params.get('target') || null
  const returnTo = params.get('returnTo') || null

  const [ws, setWs] = useState(null)
  const [error, setError] = useState(null)
  const [reasonCode, setReasonCode] = useState('unsupported_claim')
  const [providerMessage, setProviderMessage] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [allowResubmission, setAllowResubmission] = useState(true)
  const [resubmissionGuidance, setResubmissionGuidance] = useState('')
  const [channels, setChannels] = useState(['in_app', 'email'])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState(null)
  const [submittedResult, setSubmittedResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    setWs(null)
    setError(null)
    setSubmittedResult(null)
    approvalWorkflowService
      .getRejectionWorkspace({ originModule, originRecordId, targetId })
      .then((data) => {
        if (cancelled) return
        setWs(data)
        const defaultReason =
          data.reasons.find((r) => r.code === 'unsupported_claim')?.code ||
          data.reasons.find((r) => r.code === 'unrelated_media')?.code ||
          data.reasons[0]?.code ||
          'other'
        setReasonCode(defaultReason)
        const tpl = approvalWorkflowService.templateForReason(defaultReason)
        setProviderMessage(tpl.message)
        setResubmissionGuidance(tpl.guidance)
        setInternalNote(
          defaultReason === 'unsupported_claim'
            ? 'Submitted description includes an unverified claim ("guaranteed to cure chronic back pain in 3 sessions"). Rejecting Version 2; provider may resubmit once medical guarantee language is removed.'
            : `Rejected during ${data.origin.decisionTypeLabel.toLowerCase()} review: does not meet marketplace policy requirements.`,
        )
        setAllowResubmission(data.allowResubmissionDefault !== false)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Unable to load rejection workspace.')
      })
    return () => {
      cancelled = true
    }
  }, [originModule, originRecordId, targetId])

  const backPath = computeBackPath(ws?.origin, returnTo)

  const selectedReasonLabel = useMemo(() => {
    if (!ws) return ''
    return ws.reasons.find((r) => r.code === reasonCode)?.label || reasonCode
  }, [ws, reasonCode])

  const impactItems = useMemo(() => {
    if (!ws) return []
    return approvalWorkflowService.rejectionImpactFor(ws.origin.decisionType, {
      isUpdate: ws.origin.isUpdate,
      allowResubmission,
    })
  }, [ws, allowResubmission])

  const handleSelectReason = (code) => {
    setReasonCode(code)
    const tpl = approvalWorkflowService.templateForReason(code)
    setProviderMessage(tpl.message)
    setResubmissionGuidance(tpl.guidance)
  }

  const handleApplyTemplate = () => {
    const tpl = approvalWorkflowService.templateForReason(reasonCode)
    setProviderMessage(tpl.message)
    setResubmissionGuidance(tpl.guidance)
  }

  const toggleChannel = (ch) => {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((x) => x !== ch) : [...prev, ch]))
  }

  const handleOpenConfirm = () => {
    setFormError(null)
    const err = approvalWorkflowService.validateRejection({
      reasonCode,
      reason: selectedReasonLabel,
      providerMessage,
      internalNote,
    })
    if (err) {
      setFormError(err)
      return
    }
    setConfirmOpen(true)
  }

  const handleSubmitRejection = async () => {
    setBusy(true)
    setFormError(null)
    try {
      const res = await approvalWorkflowService.submitRejection({
        originModule: ws.origin.originModule,
        originRecordId: ws.origin.originRecordId,
        targetId: ws.origin.targetId,
        version: ws.origin.version,
        reasonCode,
        reason: selectedReasonLabel,
        providerMessage,
        internalNote,
        allowResubmission,
        resubmissionGuidance,
        channels,
      })
      setConfirmOpen(false)
      setSubmittedResult(res)
    } catch (err) {
      setFormError(err?.message || 'Unable to record rejection.')
    } finally {
      setBusy(false)
    }
  }

  const handlePresetSwitch = (preset) => {
    const next = new URLSearchParams()
    next.set('module', preset.module)
    next.set('record', preset.record)
    if (preset.target) next.set('target', preset.target)
    setParams(next)
  }

  if (error) {
    return (
      <div className="space-y-3 px-4 pt-3">
        <RejectHeader origin={null} backPath={backPath} onSelectPreset={handlePresetSwitch} />
        <ErrorState title="Unable to open rejection workspace" description={error} />
      </div>
    )
  }

  if (!ws) {
    return (
      <div className="space-y-3 px-4 pt-3">
        <RejectHeader origin={null} backPath={backPath} onSelectPreset={handlePresetSwitch} />
        <Skeleton className="h-[640px] rounded-2xl" />
      </div>
    )
  }

  const requestChangesUrl = infoRequestPath(
    ['service', 'profile_change', 'content'].includes(ws.origin.originModule)
      ? ws.origin.originModule
      : ['verification', 'identity', 'credentials', 'business_documents'].includes(ws.origin.originModule)
        ? 'verification'
        : 'content',
    ws.origin.originRecordId,
    backPath,
  )

  return (
    <div className="min-h-full space-y-3 px-4 pt-3 pb-24">
      <RejectHeader origin={ws.origin} backPath={backPath} onSelectPreset={handlePresetSwitch} />

      {approvalWorkflowService.isMock && (
        <p className="inline-flex items-center gap-1 rounded-md bg-[#fff4e0] px-2 py-1 text-[11px] font-semibold text-[#9a5a06]">
          <FlaskConical className="size-3" /> Demo data · Decisions are recorded in Approval History (ADM-043)
        </p>
      )}

      {submittedResult && (
        <section
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#86efac] bg-[#f0fdf4] px-4 py-3 text-[13px] text-[#14532d]"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 shrink-0 text-[#15803d]" />
            <div>
              <p className="font-bold">
                Rejection recorded ({submittedResult.ledgerId}) and sent to {ws.origin.provider.name}
              </p>
              <p className="text-[12px] text-[#166534]">
                Reason: <b>{selectedReasonLabel}</b> · Resubmission: <b>{allowResubmission ? 'Allowed' : 'Blocked'}</b> · Logged to immutable Approval History.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`${APPROVAL_HISTORY_PATH}?decision=${encodeURIComponent(submittedResult.ledgerId)}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#15803d] px-3 text-[12px] font-semibold text-white hover:bg-[#166534]"
            >
              <History className="size-3.5" /> View in Approval History
            </Link>
            <Link
              to={backPath}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#15803d] bg-white px-3 text-[12px] font-semibold text-[#15803d] hover:bg-[#dcfce7]"
            >
              Return to Review
            </Link>
          </div>
        </section>
      )}

      <ContextSummaryRow origin={ws.origin} />

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Left column — 1. Rejection Details */}
        <section className={cn(CARD, 'space-y-4 p-4')}>
          <h2 className="flex items-center gap-2 text-[16px] font-bold text-[#1b1140]">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#4125d0] text-[12px] text-white">
              1
            </span>
            Rejection Details
          </h2>

          {/* Rejection Reason grid */}
          <div>
            <p className="mb-2 text-[13px] font-bold text-[#1b1140]">Rejection Reason</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ws.reasons.map((r) => {
                const Icon = REASON_ICONS[r.code] || FileWarning
                const active = reasonCode === r.code
                return (
                  <button
                    key={r.code}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleSelectReason(r.code)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[12px] font-semibold transition',
                      active
                        ? 'border-[#4125d0] bg-[#4125d0] text-white shadow-xs'
                        : 'border-[#e6e1f3] bg-[#faf9fe] text-[#2a1b57] hover:border-[#c8bcf6] hover:bg-[#f4f0ff]',
                    )}
                  >
                    <Icon className={cn('size-4 shrink-0', active ? 'text-white' : 'text-[#4527c8]')} />
                    <span className="leading-snug">{r.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Separate Provider-Facing Message vs Internal Admin Note */}
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1">
              <span className="flex items-center justify-between text-[12.5px] font-bold text-[#1b1140]">
                <span>Provider-Facing Message</span>
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  className="rounded-md border border-[#b9a9f0] bg-[#f7f4ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#4527c8] hover:bg-[#ece5fd]"
                >
                  Use Template
                </button>
              </span>
              <textarea
                rows={7}
                maxLength={1000}
                value={providerMessage}
                onChange={(e) => setProviderMessage(e.target.value)}
                placeholder="Write a clear, constructive explanation that will be sent directly to the provider…"
                className={field}
              />
              <span className="flex items-center justify-between text-[10.5px] text-[#6b6785]">
                <span>Sent directly to {ws.origin.provider.name}</span>
                <span>{providerMessage.length} / 1000</span>
              </span>
            </label>

            <label className="block space-y-1">
              <span className="flex items-center justify-between text-[12.5px] font-bold text-[#1b1140]">
                <span>
                  Internal Admin Note <span className="font-normal text-[#6b6785]">(not visible to provider)</span>
                </span>
              </span>
              <textarea
                rows={7}
                maxLength={1000}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Record internal audit context, policy clause, or evidence details for fellow admins…"
                className={field}
              />
              <span className="flex items-center justify-between text-[10.5px] text-[#6b6785]">
                <span>Never shown to the provider</span>
                <span>{internalNote.length} / 1000</span>
              </span>
            </label>
          </div>

          {/* Resubmission & Follow-Up */}
          <div className="border-t border-[#f0edf8] pt-3">
            <h3 className="mb-2.5 text-[13.5px] font-bold text-[#1b1140]">Resubmission & Follow-Up</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {/* Column 1: Allow Resubmission */}
              <div className="space-y-1.5">
                <p className="text-[12px] font-semibold text-[#1b1140]">Allow Resubmission</p>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setAllowResubmission(true)}
                    aria-pressed={allowResubmission}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[12px] font-semibold transition',
                      allowResubmission
                        ? 'border-[#4125d0] bg-[#4125d0] text-white'
                        : 'border-[#ddd7ee] bg-white text-[#2a1b57] hover:bg-[#f4f1fc]',
                    )}
                  >
                    <CheckCircle2 className="size-4 shrink-0" />
                    Yes — Provider May Resubmit
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllowResubmission(false)}
                    aria-pressed={!allowResubmission}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[12px] font-semibold transition',
                      !allowResubmission
                        ? 'border-[#dc2626] bg-[#fff1f1] text-[#b91c1c]'
                        : 'border-[#ddd7ee] bg-white text-[#2a1b57] hover:bg-[#f4f1fc]',
                    )}
                  >
                    <Ban className="size-4 shrink-0" />
                    No — Do Not Allow Resubmission
                  </button>
                </div>
                <p className="text-[11px] text-[#6b6785]">
                  {allowResubmission
                    ? 'Provider can submit a new corrected version for review.'
                    : 'Blocks resubmission of this item under policy.'}
                </p>
              </div>

              {/* Column 2: Resubmission Guidance */}
              <label className="block space-y-1.5">
                <span className="text-[12px] font-semibold text-[#1b1140]">Resubmission Guidance (Optional)</span>
                <textarea
                  rows={4}
                  disabled={!allowResubmission}
                  value={resubmissionGuidance}
                  onChange={(e) => setResubmissionGuidance(e.target.value)}
                  placeholder="Specific steps the provider should take before resubmitting…"
                  className={cn(field, !allowResubmission && 'bg-[#f5f3fa] opacity-60')}
                />
              </label>

              {/* Column 3: Notification Channels */}
              <div className="space-y-1.5">
                <p className="text-[12px] font-semibold text-[#1b1140]">Notification Channels</p>
                <div className="space-y-1.5 rounded-xl border border-[#ece7fa] bg-[#faf9fe] p-2.5">
                  {[
                    ['in_app', 'In-App Notification'],
                    ['email', 'Email'],
                    ['sms', 'SMS'],
                  ].map(([id, label]) => {
                    const checked = channels.includes(id)
                    return (
                      <label key={id} className="flex cursor-pointer items-center gap-2 text-[12px] text-[#1b1140]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleChannel(id)}
                          className="size-4 rounded border-[#b9a9f0] accent-[#4125d0]"
                        />
                        <span className="font-medium">{label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {formError && (
            <p role="alert" className="rounded-lg border border-[#f3b7b7] bg-[#fff1f1] px-3 py-2 text-[12px] font-medium text-[#b91c1c]">
              {formError}
            </p>
          )}

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0edf8] pt-3">
            <Link
              to={backPath}
              className="inline-flex h-10 items-center rounded-lg border border-[#ddd7ee] bg-white px-4 text-[12.5px] font-semibold text-[#2a1b57] hover:bg-[#f4f1fc]"
            >
              Cancel
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={requestChangesUrl}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#b9a9f0] bg-[#f7f4ff] px-4 text-[12.5px] font-semibold text-[#4527c8] hover:bg-[#ece5fd]"
              >
                Request Changes Instead
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={handleOpenConfirm}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#dc2626] px-5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#b91c1c] disabled:opacity-50"
              >
                <XCircle className="size-4" /> Confirm Rejection
              </button>
            </div>
          </div>
        </section>

        {/* Right column — Preview + Impact + Before You Reject */}
        <div className="space-y-3">
          <Card title="Provider Notification Preview" icon={Smartphone}>
            <RejectionPhonePreview
              origin={ws.origin}
              reasonLabel={selectedReasonLabel}
              message={providerMessage}
              allowResubmission={allowResubmission}
              guidance={resubmissionGuidance}
            />
          </Card>

          <Card title="Rejection Impact" icon={ShieldAlert}>
            <ul className="space-y-2 text-[12.5px]">
              {impactItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  {item.tone === 'bad' ? (
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#fde4e4] text-[#dc2626]">
                      <X className="size-3" strokeWidth={3} />
                    </span>
                  ) : item.tone === 'warn' ? (
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#ffecd6] text-[#b45309]">
                      !
                    </span>
                  ) : (
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#dcf6e4] text-[#15803d]">
                      ✓
                    </span>
                  )}
                  <span className="text-[#1b1140]">{item.text}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Before You Reject" icon={AlertTriangle}>
            <ul className="list-disc space-y-1.5 pl-4 text-[12px] text-[#2a1b57]">
              <li>
                If the issue can be fixed with minor edits or clarification, use <b>Request Changes</b> instead
              </li>
              <li>Reject only when the submission cannot be approved in its current form</li>
              <li>
                If you are unsure about policy or eligibility, <b>Escalate</b> the review
              </li>
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to={requestChangesUrl}
                className="flex h-9 items-center justify-center rounded-lg border border-[#b9a9f0] bg-[#f7f4ff] px-2 text-center text-[11.5px] font-semibold text-[#4527c8] hover:bg-[#ece5fd]"
              >
                Request Changes Instead
              </Link>
              <Link
                to={backPath}
                className="flex h-9 items-center justify-center rounded-lg border border-[#ddd7ee] bg-white px-2 text-center text-[11.5px] font-semibold text-[#2a1b57] hover:bg-[#f4f1fc]"
              >
                Escalate Review Instead
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1b1140]/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-reject-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#f0edf8] px-5 py-3.5">
              <h2 id="confirm-reject-title" className="flex items-center gap-2 text-[16px] font-bold text-[#1b1140]">
                <XCircle className="size-5 text-[#dc2626]" />
                Confirm Rejection — {ws.origin.subjectTitle}
              </h2>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1 text-[#4a4466] hover:bg-[#f4f1fc]"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="space-y-3 px-5 py-4 text-[12.5px]">
              <Rows
                rows={[
                  ['Item', `${ws.origin.subjectTitle} (${ws.origin.subjectId})`],
                  ['Provider', `${ws.origin.provider.name} (${ws.origin.provider.ref || ws.origin.provider.id})`],
                  ['Rejection reason', selectedReasonLabel],
                  ['Allow resubmission', allowResubmission ? 'Yes — Provider may resubmit a new version' : 'No — Resubmission blocked'],
                  ['Channels', channels.join(', ').toUpperCase()],
                ]}
              />
              <div className="rounded-xl bg-[#faf9fe] p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b6785]">Rejection Impact</p>
                <ul className="mt-1.5 space-y-1 text-[12px] text-[#1b1140]">
                  {impactItems.map((it, i) => (
                    <li key={i}>• {it.text}</li>
                  ))}
                </ul>
              </div>
              {formError && (
                <p role="alert" className="rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">
                  {formError}
                </p>
              )}
            </div>
            <footer className="flex justify-end gap-2 border-t border-[#f0edf8] px-5 py-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="h-9 rounded-lg px-4 text-[12.5px] font-semibold text-[#4a4466] hover:bg-[#f4f1fc]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleSubmitRejection}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#dc2626] px-4 text-[12.5px] font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-50"
              >
                <XCircle className="size-4" />
                {busy ? 'Recording Rejection…' : 'Confirm & Send Rejection'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}

