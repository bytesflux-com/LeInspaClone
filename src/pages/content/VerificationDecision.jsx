import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  FileCheck2,
  FileQuestion,
  FlaskConical,
  History,
  Hotel,
  Info,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  StickyNote,
  UserRound,
  X,
  XCircle,
} from 'lucide-react'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import CountryFlag from '../../components/ui/CountryFlag'
import { CARD, Card, ProviderAvatarImg, Rows, StatusPill, Verified, stamp } from '../../components/content/ContentUI'
import {
  APPROVAL_HISTORY_PATH,
  CONTENT_BASE,
  infoRequestPath,
  rejectPath,
} from '../../constants/contentModeration'
import { approvalWorkflowService } from '../../services/approvalWorkflowService'
import { cn } from '../../lib/utils'

const field =
  'w-full rounded-lg border border-[#ddd7ee] bg-white px-2.5 py-2 text-[12.5px] text-[#1b1140] focus:border-[#7a5cf0] focus:outline-none'

const CATEGORY_ICON = {
  individual: UserRound,
  spa: Sparkles,
  hotel_resort: Hotel,
}

const ESCALATION_TEAMS = [
  ['senior_verification', 'Senior Verification Lead'],
  ['compliance_legal', 'Compliance / Legal Review'],
  ['trust_safety', 'Trust & Safety'],
]

function DecisionHeader({ data, onSwitchCase }) {
  const CategoryIcon = CATEGORY_ICON[data?.provider?.category] || ShieldCheck

  return (
    <header className="space-y-2.5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#4125d0] text-white shadow-sm">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[12px] text-[#4a4466]">
              <Link to="/providers" className="hover:text-[#4527c8]">
                Verification Center
              </Link>
              <ChevronRight className="size-3.5" />
              <Link to={data?.provider?.id ? `/providers/${data.provider.id}` : '/providers'} className="hover:text-[#4527c8]">
                Provider Verification Detail
              </Link>
              <ChevronRight className="size-3.5" />
              <span className="font-semibold text-[#4527c8]">Verification Decision</span>
            </nav>
            <h1 className="font-display text-[32px] leading-none font-bold tracking-tight text-[#1b1140] sm:text-[36px]">
              Verification Decision
            </h1>
            <p className="mt-1 text-[13px] text-[#2a1b57]">
              Review all verification requirements and record the final verification decision for this provider.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-[#e6d9bf] bg-[#fbf6ea] px-2.5 py-1 text-[10.5px] leading-tight text-[#8a6a2f]">
            <b className="block text-[11px]">NEW + SHARED</b>
            Used across Individual Providers, Spas & Wellness Centers, and Hotels & Resorts.
          </span>
          <Link
            to={data?.provider?.id ? `/providers/${data.provider.id}` : '/providers'}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-[#4125d0] bg-white px-3.5 text-[12.5px] font-semibold text-[#4125d0] hover:bg-[#f4f0ff]"
          >
            <ArrowLeft className="size-4" /> Back to Verification Detail
          </Link>
          {data?.provider?.id && (
            <Link
              to={`/providers/${data.provider.id}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#ddd7ee] bg-white px-3.5 text-[12.5px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]"
            >
              <CategoryIcon className="size-4" /> View Provider Profile
            </Link>
          )}
          <Link
            to={APPROVAL_HISTORY_PATH}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#ddd7ee] bg-white px-3.5 text-[12.5px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]"
          >
            <History className="size-4" /> Approval History
          </Link>
        </div>
      </div>

      {/* Shared category & readiness switcher */}
      {data?.availableCases?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#ece7fa] bg-[#faf8fe] px-3 py-1.5 text-[11.5px]">
          <span className="font-semibold text-[#4a4466]">Provider Verification Cases:</span>
          {data.availableCases.map((c) => {
            const active = c.verificationId === data.verificationId
            return (
              <button
                key={c.verificationId}
                type="button"
                onClick={() => onSwitchCase(c.verificationId)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition',
                  active ? 'bg-[#4125d0] text-white shadow-xs' : 'text-[#4a4466] hover:bg-[#ede8fb] hover:text-[#1b1140]',
                )}
              >
                <span>{c.name}</span>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.2 text-[10px]',
                    active
                      ? 'bg-white/20 text-white'
                      : c.ready
                        ? 'bg-[#dcf6e4] text-[#15803d]'
                        : 'bg-[#ffecd6] text-[#b45309]',
                  )}
                >
                  {c.categoryLabel} · {c.ready ? 'Ready' : 'Blocked'}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </header>
  )
}

function TopOverviewRow({ data, selectedDecision }) {
  const { provider, readiness, impacts } = data
  const activeImpact = impacts?.[selectedDecision] || impacts?.approve || []

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* 1. Provider & Case summary */}
      <section className={cn(CARD, 'flex flex-wrap items-center gap-x-5 gap-y-3 p-4')}>
        <div className="flex items-center gap-3.5">
          <ProviderAvatarImg url={provider.photoUrl} name={provider.name} size={76} />
          <div className="leading-snug">
            <p className="flex items-center gap-1.5 text-[20px] font-bold text-[#1b1140]">
              {provider.name}
              {provider.verified && <Verified />}
            </p>
            <p className="text-[12px] text-[#4a4466]">{provider.ref}</p>
            <span className="my-0.5 inline-block rounded-md bg-[#ece5fd] px-2 py-0.5 text-[11px] font-semibold text-[#4527c8]">
              {provider.categoryLabel || 'Individual Provider'}
            </span>
            <p className="text-[12.5px] font-semibold text-[#2a1b57]">{provider.typeLabel}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#4a4466]">
              <CountryFlag code={data.countryCode} className="h-3 w-4.5" />
              {data.city}, {data.marketName}
            </p>
          </div>
        </div>

        <div className="space-y-1 border-l border-[#efecf7] pl-5 text-[12px]">
          <span className="inline-block rounded-md bg-[#ece5fd] px-2 py-0.5 text-[11px] font-semibold text-[#4527c8]">
            Verification Case
          </span>
          <p className="text-[#1b1140]">
            Case ID: <b>{data.caseId}</b>
          </p>
          <p className="text-[#4a4466]">Submitted: {stamp(data.submittedAt, data.countryCode)}</p>
          <p className="text-[#4a4466]">
            Assigned to: <b className="text-[#1b1140]">{data.assignedTo?.name || 'Jane Ochieng'}</b>
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[#4a4466]">Current status:</span>
            <StatusPill value={data.status === 'more_information_needed' ? 'changes_requested' : data.status} />
            <span className="rounded-md bg-[#f1eefb] px-2 py-0.5 text-[10.5px] font-semibold text-[#4a4466]">
              Normal
            </span>
          </div>
        </div>
      </section>

      {/* 2. Verification Readiness */}
      <Card title="Verification Readiness" icon={ClipboardCheck}>
        <div
          className={cn(
            'flex items-start gap-2.5 rounded-xl border p-3',
            readiness.ready
              ? 'border-[#bbf7d0] bg-[#ecfdf3] text-[#14532d]'
              : 'border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]',
          )}
        >
          {readiness.ready ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#15803d]" />
          ) : (
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#d97706]" />
          )}
          <div className="text-[12px] leading-snug">
            <p className="text-[14px] font-bold">{readiness.headline}</p>
            <p className="mt-0.5">{readiness.subtitle}</p>
          </div>
        </div>

        <dl className="mt-2.5 grid grid-cols-4 gap-1.5 text-center">
          <div className="rounded-lg border border-[#f0edf8] bg-[#faf9fe] px-1.5 py-2">
            <dt className="text-[10.5px] text-[#6b6785]">Required</dt>
            <dd className="mt-0.5 text-[12px] font-bold text-[#15803d]">
              {readiness.counts.approved} / {readiness.counts.required} Complete
            </dd>
          </div>
          <div className="rounded-lg border border-[#f0edf8] bg-[#faf9fe] px-1.5 py-2">
            <dt className="text-[10.5px] text-[#6b6785]">Changes Req.</dt>
            <dd className={cn('mt-0.5 text-[13px] font-bold', readiness.counts.changesRequested > 0 ? 'text-[#b45309]' : 'text-[#1b1140]')}>
              {readiness.counts.changesRequested}
            </dd>
          </div>
          <div className="rounded-lg border border-[#f0edf8] bg-[#faf9fe] px-1.5 py-2">
            <dt className="text-[10.5px] text-[#6b6785]">Rejected</dt>
            <dd className={cn('mt-0.5 text-[13px] font-bold', readiness.counts.rejected > 0 ? 'text-[#dc2626]' : 'text-[#1b1140]')}>
              {readiness.counts.rejected}
            </dd>
          </div>
          <div className="rounded-lg border border-[#f0edf8] bg-[#faf9fe] px-1.5 py-2">
            <dt className="text-[10.5px] text-[#6b6785]">Escalations</dt>
            <dd className="mt-0.5 text-[13px] font-bold text-[#1b1140]">{readiness.counts.escalations}</dd>
          </div>
        </dl>
      </Card>

      {/* 3. Verification Decision Impact */}
      <Card title="Verification Decision Impact" icon={ShieldAlert}>
        <ul className="space-y-1.5 text-[12px]">
          {activeImpact.map((it, idx) => (
            <li key={idx} className="flex items-start gap-2">
              {it.tone === 'ok' ? (
                <CircleCheck className="mt-0.5 size-4 shrink-0 fill-[#22a652] text-white" />
              ) : it.tone === 'bad' ? (
                <XCircle className="mt-0.5 size-4 shrink-0 text-[#dc2626]" />
              ) : it.tone === 'warn' ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#d97706]" />
              ) : (
                <Info className="mt-0.5 size-4 shrink-0 text-[#4527c8]" />
              )}
              <span className={cn(it.tone === 'info' ? 'text-[11px] text-[#6b6785]' : 'text-[#1b1140]')}>
                {it.text}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

export default function VerificationDecision() {
  const navigate = useNavigate()
  const { verificationId: routeVerId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeVerId = routeVerId || searchParams.get('case') || (approvalWorkflowService.isMock ? 'PR-82941' : null)

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [decision, setDecision] = useState('approve')
  const [note, setNote] = useState('')
  const [escalateTo, setEscalateTo] = useState('senior_verification')
  const [escalateReason, setEscalateReason] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState(null)
  const [submittedResult, setSubmittedResult] = useState(null)
  const [newNoteText, setNewNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    setSubmittedResult(null)
    setFormError(null)
    approvalWorkflowService
      .getVerificationDecision({ verificationId: activeVerId })
      .then((res) => {
        if (cancelled) return
        setData(res)
        setDecision(res.readiness?.ready ? 'approve' : 'request_info')
        setNote(
          res.readiness?.ready
            ? 'All verification requirements satisfied. Identity, professional credentials, profile information, and required market documents have been reviewed and approved.'
            : 'Additional documentation is required before final verification approval can be granted.',
        )
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Unable to load verification decision workspace.')
      })
    return () => {
      cancelled = true
    }
  }, [activeVerId])

  const handleSwitchCase = (nextId) => {
    if (routeVerId) {
      navigate(`/verifications/${encodeURIComponent(nextId)}/decision`)
    } else {
      setSearchParams({ case: nextId })
    }
  }

  const handlePrimaryAction = () => {
    setFormError(null)
    if (!data) return

    if (decision === 'request_info') {
      navigate(infoRequestPath('verification', data.verificationId, `/verifications/${data.verificationId}/decision`))
      return
    }
    if (decision === 'reject') {
      navigate(
        rejectPath('verification', data.verificationId, {
          returnTo: `/verifications/${data.verificationId}/decision`,
        }),
      )
      return
    }

    const err = approvalWorkflowService.validateVerificationDecision(data, {
      decision,
      note,
      escalateTo: decision === 'escalate' ? escalateTo : null,
      reason: decision === 'escalate' ? escalateReason : null,
    })
    if (err) {
      setFormError(err)
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmSubmit = async () => {
    setBusy(true)
    setFormError(null)
    try {
      const res = await approvalWorkflowService.submitVerificationDecision({
        verificationId: data.verificationId,
        version: data.version,
        decision,
        note,
        escalateTo: decision === 'escalate' ? escalateTo : null,
        reason: decision === 'escalate' ? escalateReason : 'All Requirements Met',
      })
      setConfirmOpen(false)
      setSubmittedResult(res)
      const refreshed = await approvalWorkflowService.getVerificationDecision({ verificationId: data.verificationId })
      setData(refreshed)
    } catch (err) {
      setFormError(err?.message || 'Unable to submit verification decision.')
    } finally {
      setBusy(false)
    }
  }

  const handleAddInternalNote = () => {
    if (!newNoteText.trim() || !data) return
    const entry = {
      noteId: `N-${Date.now()}`,
      authorName: 'Jane Ochieng',
      authorRole: 'Verification Specialist',
      createdAt: new Date().toISOString(),
      text: newNoteText.trim(),
    }
    setData((prev) => ({
      ...prev,
      notes: [entry, ...(prev.notes || [])],
    }))
    setNewNoteText('')
    setAddingNote(false)
  }

  if (error) {
    return (
      <div className="space-y-3 px-4 pt-3">
        <DecisionHeader data={null} onSwitchCase={handleSwitchCase} />
        <ErrorState title="Unable to open verification decision" description={error} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-3 px-4 pt-3">
        <DecisionHeader data={null} onSwitchCase={handleSwitchCase} />
        <Skeleton className="h-[680px] rounded-2xl" />
      </div>
    )
  }

  const { readiness } = data
  const infoRequests = data.informationRequests || []
  const completedRequests = infoRequests.filter((r) => ['completed', 'responded'].includes(r.status)).length
  const outstandingRequests = readiness.counts.outstandingRequests

  return (
    <div className="min-h-full space-y-3 px-4 pt-3 pb-24">
      <DecisionHeader data={data} onSwitchCase={handleSwitchCase} />

      {approvalWorkflowService.isMock && (
        <p className="inline-flex items-center gap-1 rounded-md bg-[#fff4e0] px-2 py-1 text-[11px] font-semibold text-[#9a5a06]">
          <FlaskConical className="size-3" /> Demo data · Final decisions write to immutable Approval History (ADM-043)
        </p>
      )}

      {submittedResult && (
        <section
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#86efac] bg-[#f0fdf4] px-4 py-3 text-[13px] text-[#14532d]"
        >
          <div className="flex items-center gap-2.5">
            <BadgeCheck className="size-5 shrink-0 text-[#15803d]" />
            <div>
              <p className="font-bold">
                Final Verification Decision Recorded ({submittedResult.ledgerId}) — {data.provider.name}
              </p>
              <p className="text-[12px] text-[#166534]">
                Case Status: <b className="uppercase">{submittedResult.status}</b> · Logged to Approval History.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`${APPROVAL_HISTORY_PATH}?decision=${encodeURIComponent(submittedResult.ledgerId)}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#15803d] px-3 text-[12px] font-semibold text-white hover:bg-[#166534]"
            >
              <History className="size-3.5" /> View in Approval History
            </Link>
          </div>
        </section>
      )}

      <TopOverviewRow data={data} selectedDecision={decision} />

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.58fr)_minmax(0,1fr)]">
        {/* Left column — Requirements Table + Evidence & Review Summary */}
        <div className="space-y-3">
          <Card title="Verification Requirements Summary" icon={FileCheck2}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-[12.5px]">
                <thead>
                  <tr className="bg-[#f3f0fc] text-left text-[11.5px] font-bold text-[#1b1140]">
                    <th className="rounded-l-lg px-3 py-2">Verification Component</th>
                    <th className="px-2.5 py-2">Required</th>
                    <th className="px-2.5 py-2">Status</th>
                    <th className="px-2.5 py-2">Reviewed By</th>
                    <th className="px-2.5 py-2">Last Updated</th>
                    <th className="rounded-r-lg px-2.5 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0edf8]">
                  {readiness.components.map((comp) => (
                    <tr key={comp.key} className="hover:bg-[#faf8fe]">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <CircleCheck
                            className={cn(
                              'size-4 shrink-0',
                              comp.status === 'approved'
                                ? 'fill-[#22a652] text-white'
                                : comp.status === 'changes_requested'
                                  ? 'text-[#d97706]'
                                  : 'text-[#9ca3af]',
                            )}
                          />
                          <div>
                            <p className="font-bold text-[#1b1140]">
                              {comp.label}{' '}
                              <span className="font-normal text-[#6b6785]">({comp.adm})</span>
                            </p>
                            {comp.note && <p className="text-[11px] text-[#6b6785]">{comp.note}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5">
                        <span className="rounded-md bg-[#ede8fb] px-2 py-0.5 text-[11px] font-semibold text-[#4527c8]">
                          {comp.required ? 'Required' : 'Optional'}
                        </span>
                      </td>
                      <td className="px-2.5 py-2.5">
                        <StatusPill value={comp.status === 'pending' ? 'awaiting_review' : comp.status} />
                      </td>
                      <td className="px-2.5 py-2.5 font-medium text-[#1b1140]">
                        {comp.reviewedBy?.name || '—'}
                      </td>
                      <td className="px-2.5 py-2.5 text-[11.5px] text-[#4a4466]">
                        {comp.reviewedAt ? stamp(comp.reviewedAt, data.countryCode) : 'Pending'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right">
                        <Link
                          to={comp.route || CONTENT_BASE}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#d6cdf5] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#4527c8] hover:bg-[#f4f0ff]"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Evidence & Review Summary" icon={ClipboardCheck}>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {(data.evidence || []).map((ev) => (
                <div
                  key={ev.evidenceId}
                  className="flex flex-col justify-between rounded-xl border border-[#ece7fa] bg-[#faf9fe] p-2.5"
                >
                  <div>
                    <p className="text-[12.5px] font-bold text-[#1b1140]">{ev.title}</p>
                    <p className="text-[10.5px] text-[#6b6785]">{ev.subtitle}</p>
                    <div className="my-2 overflow-hidden rounded-lg border border-[#e5e0f4] bg-white">
                      {ev.thumbnailUrl ? (
                        <img
                          src={ev.thumbnailUrl}
                          alt={ev.title}
                          className="h-24 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-24 items-center justify-center text-[11px] text-[#6b6785]">
                          Document Preview
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <span className="rounded bg-[#ede8fb] px-1.5 py-0.5 text-[10px] font-semibold text-[#4527c8]">
                      Version {ev.version || 1}
                    </span>
                    <StatusPill value={ev.status || 'approved'} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 rounded-xl border border-[#ece7fa] bg-[#faf9fe] p-3 md:grid-cols-2">
              <div className="space-y-1 text-[12px]">
                <p className="font-bold text-[#1b1140]">Information Requests</p>
                <p className="text-[#2a1b57]">
                  <b>{infoRequests.length}</b> request{infoRequests.length === 1 ? '' : 's'} sent ·{' '}
                  <b>{completedRequests}</b> completed · <b>{outstandingRequests}</b> outstanding
                </p>
                <Link
                  to={
                    infoRequests[0]?.requestId
                      ? `/information-requests/${infoRequests[0].requestId}`
                      : infoRequestPath('verification', data.verificationId)
                  }
                  className="inline-block pt-0.5 text-[11.5px] font-semibold text-[#4527c8] hover:underline"
                >
                  View Request History →
                </Link>
              </div>

              <div className="space-y-1 border-t border-[#e8e2f6] pt-2 text-[12px] md:border-t-0 md:border-l md:pt-0 md:pl-3">
                <p className="font-bold text-[#1b1140]">Key Findings & Resolved Issues</p>
                <ul className="space-y-1">
                  {(data.issues || []).map((iss) => (
                    <li key={iss.issueId} className="flex items-start gap-1.5">
                      {iss.resolved ? (
                        <Check className="mt-0.5 size-3.5 shrink-0 text-[#15803d]" strokeWidth={3} />
                      ) : (
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[#d97706]" />
                      )}
                      <span className="text-[#2a1b57]">{iss.text}</span>
                    </li>
                  ))}
                  {readiness.ready && (
                    <li className="flex items-start gap-1.5">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-[#15803d]" strokeWidth={3} />
                      <span className="text-[#2a1b57]">No unresolved blockers remaining</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column — Final Verification Decision + History + Internal Notes */}
        <div className="space-y-3">
          <Card title="Final Verification Decision" icon={ShieldCheck}>
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-[12px] font-bold text-[#1b1140]">Select Final Decision</p>
                <div className="space-y-2">
                  {/* Approve Verification */}
                  <button
                    type="button"
                    disabled={!readiness.ready}
                    onClick={() => setDecision('approve')}
                    className={cn(
                      'flex h-10 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] text-[13px] font-bold transition',
                      decision === 'approve'
                        ? 'border-[#15803d] bg-[#15803d] text-white shadow-xs'
                        : 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d] hover:bg-[#dcfce7]',
                      !readiness.ready && 'cursor-not-allowed opacity-45',
                    )}
                  >
                    <CheckCircle2 className="size-4" />
                    Approve Verification
                  </button>

                  {/* Request More Information */}
                  <button
                    type="button"
                    onClick={() => setDecision('request_info')}
                    className={cn(
                      'flex h-10 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] text-[13px] font-bold transition',
                      decision === 'request_info'
                        ? 'border-[#d97706] bg-[#d97706] text-white shadow-xs'
                        : 'border-[#f5c384] bg-[#fff8eb] text-[#b45309] hover:bg-[#ffecd6]',
                    )}
                  >
                    <FileQuestion className="size-4" />
                    Request More Information
                  </button>

                  {/* Reject Verification */}
                  <button
                    type="button"
                    onClick={() => setDecision('reject')}
                    className={cn(
                      'flex h-10 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] text-[13px] font-bold transition',
                      decision === 'reject'
                        ? 'border-[#dc2626] bg-[#dc2626] text-white shadow-xs'
                        : 'border-[#f2a3a3] bg-[#fff1f1] text-[#b91c1c] hover:bg-[#fde4e4]',
                    )}
                  >
                    <XCircle className="size-4" />
                    Reject Verification
                  </button>

                  {/* Escalate Verification */}
                  <button
                    type="button"
                    onClick={() => setDecision('escalate')}
                    className={cn(
                      'flex h-10 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] text-[13px] font-bold transition',
                      decision === 'escalate'
                        ? 'border-[#4125d0] bg-[#4125d0] text-white shadow-xs'
                        : 'border-[#c8bcf6] bg-[#f5f2ff] text-[#4527c8] hover:bg-[#ece5fd]',
                    )}
                  >
                    <ShieldAlert className="size-4" />
                    Escalate Verification
                  </button>
                </div>

                {!readiness.ready && (
                  <p className="mt-1.5 text-[11px] font-medium text-[#b45309]">
                    Approval is disabled until all required components and open information requests are resolved.
                  </p>
                )}
              </div>

              {decision === 'escalate' && (
                <div className="space-y-2 rounded-xl border border-[#dcd3f8] bg-[#faf8fe] p-3">
                  <label className="block space-y-1">
                    <span className="text-[12px] font-semibold text-[#1b1140]">Escalate To</span>
                    <select
                      value={escalateTo}
                      onChange={(e) => setEscalateTo(e.target.value)}
                      className={field}
                    >
                      {ESCALATION_TEAMS.map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[12px] font-semibold text-[#1b1140]">Escalation Reason</span>
                    <input
                      value={escalateReason}
                      onChange={(e) => setEscalateReason(e.target.value)}
                      placeholder="e.g. Cross-border professional license requires compliance sign-off"
                      className={field}
                    />
                  </label>
                </div>
              )}

              <label className="block space-y-1">
                <span className="text-[12px] font-bold text-[#1b1140]">Final Verification Note (Internal)</span>
                <textarea
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={field}
                  placeholder="Summarize the verification findings for the audit record…"
                />
              </label>

              {/* Decision Confirmation box */}
              <div className="rounded-xl border border-[#ece7fa] bg-[#faf9fe] p-3 text-[12px]">
                <p className="font-bold text-[#1b1140]">Decision Confirmation</p>
                <div className="mt-1.5 space-y-1 text-[#2a1b57]">
                  <p>
                    Decision:{' '}
                    <b
                      className={cn(
                        decision === 'approve'
                          ? 'text-[#15803d]'
                          : decision === 'reject'
                            ? 'text-[#dc2626]'
                            : decision === 'request_info'
                              ? 'text-[#b45309]'
                              : 'text-[#4527c8]',
                      )}
                    >
                      {decision === 'approve'
                        ? 'Approve Verification'
                        : decision === 'request_info'
                          ? 'Request More Information'
                          : decision === 'reject'
                            ? 'Reject Verification'
                            : 'Escalate Verification'}
                    </b>
                  </p>
                  <p>
                    Provider: <b>{data.provider.name} ({data.provider.ref})</b>
                  </p>
                  <p>
                    All {readiness.counts.approved} of {readiness.counts.required} required components approved
                  </p>
                  <p>Outstanding blockers: {readiness.blockers.length}</p>
                </div>
              </div>

              {formError && (
                <p role="alert" className="rounded-lg bg-[#fff1f1] px-3 py-2 text-[12px] text-[#b91c1c]">
                  {formError}
                </p>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={handlePrimaryAction}
                className={cn(
                  'flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-bold text-white shadow-sm transition disabled:opacity-50',
                  decision === 'approve'
                    ? 'bg-[#15803d] hover:bg-[#166534]'
                    : decision === 'request_info'
                      ? 'bg-[#d97706] hover:bg-[#b45309]'
                      : decision === 'reject'
                        ? 'bg-[#dc2626] hover:bg-[#b91c1c]'
                        : 'bg-[#4125d0] hover:bg-[#361db0]',
                )}
              >
                {decision === 'approve' && 'Confirm Verification Approval'}
                {decision === 'request_info' && 'Continue to Request More Information →'}
                {decision === 'reject' && 'Continue to Reject & Send Reason →'}
                {decision === 'escalate' && 'Confirm Verification Escalation'}
              </button>
            </div>
          </Card>

          {/* Verification History */}
          <Card title="Verification History" icon={History}>
            <ol className="relative space-y-2.5 pl-4 before:absolute before:top-1.5 before:bottom-1.5 before:left-[5px] before:w-0.5 before:bg-[#e4defb]">
              {(data.history || []).map((h, i) => (
                <li key={i} className="relative text-[11.5px] leading-snug">
                  <span className="absolute top-1 -left-4 size-3 rounded-full border-2 border-white bg-[#4125d0] shadow" />
                  <p className="text-[#6b6785]">{stamp(h.at, data.countryCode)}</p>
                  <p className="font-semibold text-[#1b1140]">{h.event}</p>
                </li>
              ))}
            </ol>
          </Card>

          {/* Internal Verification Notes */}
          <Card
            title="Internal Verification Notes"
            icon={StickyNote}
            action={
              !addingNote && (
                <button
                  type="button"
                  onClick={() => setAddingNote(true)}
                  className="rounded-lg border border-[#b9a9f0] px-2.5 py-1 text-[11.5px] font-semibold text-[#4527c8] hover:bg-[#f4f0ff]"
                >
                  Add Note
                </button>
              )
            }
          >
            {addingNote && (
              <div className="mb-2.5 space-y-2">
                <textarea
                  rows={3}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Add an internal verification note (visible to admins only)…"
                  className={field}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddingNote(false)}
                    className="h-8 rounded-lg px-3 text-[12px] font-semibold text-[#4a4466] hover:bg-[#f4f1fc]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddInternalNote}
                    className="h-8 rounded-lg bg-[#4125d0] px-3 text-[12px] font-semibold text-white"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}
            <ul className="space-y-2">
              {(data.notes || []).map((n) => (
                <li key={n.noteId} className="rounded-xl bg-[#faf9fe] p-2.5 text-[12px]">
                  <p className="font-bold text-[#1b1140]">
                    {n.authorName}{' '}
                    <span className="font-normal text-[#6b6785]">({n.authorRole || 'Admin'})</span>
                  </p>
                  <p className="mt-1 text-[#2a1b57]">{n.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10.5px] text-[#6b6785]">Internal notes are never visible to providers.</p>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1b1140]/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ver-confirm-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#f0edf8] px-5 py-3.5">
              <h2 id="ver-confirm-title" className="flex items-center gap-2 text-[16px] font-bold text-[#1b1140]">
                <ShieldCheck className="size-5 text-[#15803d]" />
                {decision === 'approve' ? 'Confirm Final Verification Approval' : 'Confirm Verification Escalation'}
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
                  ['Provider', `${data.provider.name} (${data.provider.ref})`],
                  ['Category', data.provider.categoryLabel],
                  ['Case ID', data.caseId],
                  ['Required Components', `${readiness.counts.approved} of ${readiness.counts.required} Approved`],
                  ['Final Decision', decision === 'approve' ? 'Approve Verification' : `Escalate (${escalateTo})`],
                ]}
              />
              <div className="rounded-xl bg-[#f0fdf4] p-3 text-[12px] text-[#14532d]">
                <p className="font-bold">What happens next:</p>
                <ul className="mt-1 space-y-1">
                  {(data.impacts?.[decision] || []).map((it, idx) => (
                    <li key={idx}>• {it.text}</li>
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
                onClick={handleConfirmSubmit}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[12.5px] font-semibold text-white disabled:opacity-50',
                  decision === 'approve' ? 'bg-[#15803d] hover:bg-[#166534]' : 'bg-[#4125d0] hover:bg-[#361db0]',
                )}
              >
                <CheckCircle2 className="size-4" />
                {busy ? 'Recording Decision…' : 'Confirm Final Decision'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}

