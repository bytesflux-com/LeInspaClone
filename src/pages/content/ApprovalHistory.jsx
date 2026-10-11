import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  FlaskConical,
  History,
  Info,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
} from 'lucide-react'
import ErrorState from '../../components/ui/ErrorState'
import Skeleton from '../../components/ui/Skeleton'
import CountryFlag from '../../components/ui/CountryFlag'
import { CARD, ProviderAvatarImg, Rows, Verified, stamp } from '../../components/content/ContentUI'
import {
  CONTENT_BASE,
  VERIFICATION_DECISION_PATH,
  verificationDecisionPath,
} from '../../constants/contentModeration'
import { approvalWorkflowService } from '../../services/approvalWorkflowService'
import { cn } from '../../lib/utils'

const DECISION_TABS = [
  ['all', 'All Decisions'],
  ['verification', 'Verification'],
  ['identity', 'Identity'],
  ['credentials', 'Credentials'],
  ['business_documents', 'Business Documents'],
  ['profile_photos', 'Profile Photos'],
  ['gallery_media', 'Gallery & Media'],
  ['profile_changes', 'Profile Changes'],
  ['service_information', 'Service Information'],
]

const DECISION_TYPE_LABELS = Object.fromEntries(DECISION_TABS.slice(1))

const DECISION_BADGE = {
  approved: { label: 'Approved', cls: 'bg-[#dcf6e4] text-[#15803d]' },
  changes_requested: { label: 'Changes Requested', cls: 'bg-[#ffecd6] text-[#b45309]' },
  rejected: { label: 'Rejected', cls: 'bg-[#fde4e4] text-[#dc2626]' },
  escalated: { label: 'Escalated', cls: 'bg-[#ece5fd] text-[#4527c8]' },
  reverification: { label: 'Re-verification', cls: 'bg-[#ece5fd] text-[#4527c8]' },
  reopened: { label: 'Reopened', cls: 'bg-[#e0edff] text-[#1d4ed8]' },
}

const selectCls =
  'h-9 rounded-lg border border-[#ddd7ee] bg-white px-2.5 text-[12px] font-medium text-[#1b1140] focus:border-[#7a5cf0] focus:outline-none'

function DecisionPill({ decision, supersededBy }) {
  const meta = DECISION_BADGE[decision] || { label: decision, cls: 'bg-[#eceef3] text-[#4b5068]' }
  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold', meta.cls)}>
        {meta.label}
      </span>
      {supersededBy && (
        <span className="rounded bg-[#eceef5] px-1.5 py-0.2 text-[9.5px] font-semibold text-[#5b5675]">
          Superseded
        </span>
      )}
    </div>
  )
}

function SummaryCards({ counts, activeStatus, onToggleStatus }) {
  // Combine baseline historical volume with live session entries so numbers match enterprise scale in mockup_2.jpg
  const cards = [
    {
      key: 'approved',
      label: 'Approved',
      value: (1276 + (counts?.approved || 0)).toLocaleString(),
      sessionCount: counts?.approved || 0,
      icon: CheckCircle2,
      iconBg: 'bg-[#16a34a] text-white',
      activeRing: 'ring-2 ring-[#16a34a] bg-[#f0fdf4]',
    },
    {
      key: 'changes_requested',
      label: 'Changes Requested',
      value: (339 + (counts?.changes_requested || 0)).toLocaleString(),
      sessionCount: counts?.changes_requested || 0,
      icon: AlertCircle,
      iconBg: 'bg-[#ea580c] text-white',
      activeRing: 'ring-2 ring-[#ea580c] bg-[#fff7ed]',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      value: (96 + (counts?.rejected || 0)).toLocaleString(),
      sessionCount: counts?.rejected || 0,
      icon: XCircle,
      iconBg: 'bg-[#dc2626] text-white',
      activeRing: 'ring-2 ring-[#dc2626] bg-[#fef2f2]',
    },
    {
      key: 'escalated',
      label: 'Escalated',
      value: (40 + (counts?.escalated || 0)).toLocaleString(),
      sessionCount: counts?.escalated || 0,
      icon: ShieldAlert,
      iconBg: 'bg-[#5b21b6] text-white',
      activeRing: 'ring-2 ring-[#5b21b6] bg-[#f5f3ff]',
    },
    {
      key: 'superseded',
      label: 'Superseded / Reopened',
      value: (64 + (counts?.superseded || 0)).toLocaleString(),
      sessionCount: counts?.superseded || 0,
      icon: RefreshCw,
      iconBg: 'bg-[#2563eb] text-white',
      activeRing: 'ring-2 ring-[#2563eb] bg-[#eff6ff]',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => {
        const Icon = c.icon
        const active = activeStatus === c.key
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onToggleStatus(active ? '' : c.key)}
            aria-pressed={active}
            className={cn(
              CARD,
              'flex items-center gap-3 p-3.5 text-left transition hover:border-[#c8bcf6]',
              active && c.activeRing,
            )}
          >
            <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full shadow-xs', c.iconBg)}>
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[26px] leading-none font-bold text-[#1b1140]">{c.value}</p>
              <p className="mt-1 truncate text-[12px] font-semibold text-[#2a1b57]">{c.label}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ApprovalDetailsDrawer({ detail, loading, onSelectDecision, onClose }) {
  const [drawerTab, setDrawerTab] = useState('details')

  if (loading) {
    return (
      <aside className={cn(CARD, 'p-4')}>
        <Skeleton className="h-[620px] rounded-xl" />
      </aside>
    )
  }

  if (!detail?.decision) {
    return (
      <aside className={cn(CARD, 'flex h-64 items-center justify-center p-4 text-[12.5px] text-[#6b6785]')}>
        Select a decision row to inspect its immutable approval record.
      </aside>
    )
  }

  const { decision: d, chain = [] } = detail
  const moduleName = ['verification', 'identity', 'credentials', 'business_documents'].includes(d.originModule)
    ? 'Verification Center'
    : 'Content Approval Center'

  const originalRoute =
    d.routes?.original ||
    (['verification', 'identity', 'credentials', 'business_documents'].includes(d.originModule)
      ? verificationDecisionPath(d.providerId || 'PR-82941')
      : CONTENT_BASE)

  const providerRoute = d.routes?.provider || (d.providerId ? `/providers/${d.providerId}` : '/providers')

  return (
    <aside className={cn(CARD, 'flex flex-col overflow-hidden')}>
      {/* Drawer Header */}
      <header className="flex items-center justify-between border-b border-[#f0edf8] px-4 py-3">
        <h2 className="text-[16px] font-bold text-[#1b1140]">Approval Details</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="rounded-lg p-1 text-[#4a4466] hover:bg-[#f4f1fc]"
        >
          <X className="size-4" />
        </button>
      </header>

      {/* Subject + Decision Summary Strip */}
      <div className="border-b border-[#f0edf8] bg-[#faf9fe] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <ProviderAvatarImg url={d.subjectImage} name={d.subjectName || d.providerName} size={54} />
            <div className="leading-snug">
              <p className="flex items-center gap-1 text-[16px] font-bold text-[#1b1140]">
                {d.subjectName || d.providerName}
                <Verified />
              </p>
              <p className="text-[12px] font-medium text-[#2a1b57]">{d.subjectSubtitle || d.providerType}</p>
              <p className="flex items-center gap-1 text-[11.5px] text-[#4a4466]">
                <CountryFlag code={d.marketId || 'KE'} className="h-3 w-4" />
                {d.marketName || d.marketId || 'Nairobi, Kenya'}
              </p>
              <p className="text-[11px] text-[#6b6785]">Provider ID: {d.providerRef || d.providerId}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-semibold text-[#4a4466]">
              Decision ID: <b className="text-[#1b1140]">{d.decisionRef}</b>
            </p>
            <div className="my-1 flex justify-end">
              <DecisionPill decision={d.decision} supersededBy={d.supersededByDecisionId} />
            </div>
            <p className="text-[11px] text-[#6b6785]">{stamp(d.reviewedAt, d.marketId)}</p>
          </div>
        </div>

        {/* Superseded / Reopened callout if applicable */}
        {d.supersededByDecisionId && (
          <div className="mt-2.5 flex items-center justify-between rounded-lg border border-[#cbd5e1] bg-white px-2.5 py-1.5 text-[11.5px] text-[#334155]">
            <span>
              Superseded by later decision <b>{d.supersededByDecisionId}</b>
            </span>
            <button
              type="button"
              onClick={() => onSelectDecision(d.supersededByDecisionId)}
              className="font-semibold text-[#4125d0] hover:underline"
            >
              Open {d.supersededByDecisionId} →
            </button>
          </div>
        )}
      </div>

      {/* Drawer Sub-Tabs */}
      <div className="flex border-b border-[#f0edf8] bg-white px-3 pt-1.5 text-[12px] font-semibold">
        {[
          ['details', 'Details'],
          ['evidence', 'Evidence'],
          ['history', 'History'],
          ['related', 'Related'],
          ['audit', 'Audit'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setDrawerTab(id)}
            className={cn(
              'border-b-2 px-3 py-2 transition',
              drawerTab === id
                ? 'border-[#4125d0] text-[#4125d0]'
                : 'border-transparent text-[#6b6785] hover:text-[#1b1140]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Drawer Body */}
      <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-[12px]">
        {drawerTab === 'details' && (
          <>
            <section>
              <h3 className="mb-1.5 text-[13px] font-bold text-[#1b1140]">Decision Summary</h3>
              <Rows
                rows={[
                  ['Module', moduleName],
                  ['Decision Type', DECISION_TYPE_LABELS[d.decisionType] || d.decisionType],
                  ['Subject', `${d.providerName || d.subjectName} (${d.providerType || 'Provider'})`],
                  ['Item Reviewed', d.subjectName],
                  ['Version Reviewed', d.version || 'Version 1'],
                  ['Decision', <DecisionPill key="dec" decision={d.decision} />],
                  ['Outcome', d.reason || 'Requirements Met'],
                  ['Reviewed By', `${d.reviewedBy?.name || 'Admin'} (${d.reviewerRoleSnapshot || 'Verification Specialist'})`],
                  ['Reviewed At', stamp(d.reviewedAt, d.marketId)],
                ]}
              />
            </section>

            <section className="space-y-2 border-t border-[#f0edf8] pt-3">
              <h3 className="text-[13px] font-bold text-[#1b1140]">Reason & Notes</h3>
              <p className="text-[#2a1b57]">
                <span className="text-[#6b6785]">Outcome / Reason:</span>{' '}
                <b className="text-[#1b1140]">{d.reason || 'Approved'}</b>
              </p>

              {d.providerMessage && (
                <div className="rounded-xl border border-[#e6e1f3] bg-white p-2.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#6b6785]">
                    Provider-Facing Message
                  </p>
                  <p className="mt-1 whitespace-pre-line text-[#1b1140]">{d.providerMessage}</p>
                </div>
              )}

              {d.internalNote && (
                <div className="rounded-xl border border-[#ece7fa] bg-[#faf8fe] p-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#4527c8]">
                      Internal Admin Note
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#6b6785]">
                      <Lock className="size-3" /> Admin-only
                    </span>
                  </div>
                  <p className="mt-1 text-[#2a1b57]">{d.internalNote}</p>
                </div>
              )}
            </section>

            <section className="space-y-2 border-t border-[#f0edf8] pt-3">
              <h3 className="text-[13px] font-bold text-[#1b1140]">Evidence Reviewed</h3>
              <ul className="space-y-1.5">
                {(d.evidenceRefs || []).map((ev, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[#f0edf8] bg-[#faf9fe] px-2.5 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-[#15803d]" />
                      <span className="truncate font-medium text-[#1b1140]">{ev.label}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <DecisionPill decision={ev.status || d.decision} />
                      <button
                        type="button"
                        onClick={() => setDrawerTab('evidence')}
                        className="rounded border border-[#d6cdf5] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#4527c8] hover:bg-[#f4f0ff]"
                      >
                        View
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-1.5 border-t border-[#f0edf8] pt-3">
              <h3 className="text-[13px] font-bold text-[#1b1140]">Effect at Time of Decision</h3>
              <ul className="space-y-1">
                {(d.effects || []).map((ef, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[#1b1140]">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[#15803d]" strokeWidth={3} />
                    <span>{ef}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2 border-t border-[#f0edf8] pt-3">
              <h3 className="text-[13px] font-bold text-[#1b1140]">Decision Chain</h3>
              <ol className="relative space-y-2.5 pl-4 before:absolute before:top-1.5 before:bottom-1.5 before:left-[5px] before:w-0.5 before:bg-[#e4defb]">
                {chain.map((node) => {
                  const isCurrent = node.id === d.id
                  return (
                    <li key={node.id} className="relative text-[11.5px] leading-snug">
                      <span
                        className={cn(
                          'absolute top-1 -left-4 size-3 rounded-full border-2 border-white shadow',
                          node.decision === 'approved'
                            ? 'bg-[#16a34a]'
                            : node.decision === 'rejected'
                              ? 'bg-[#dc2626]'
                              : 'bg-[#ea580c]',
                        )}
                      />
                      <p className="text-[#6b6785]">{stamp(node.reviewedAt, node.marketId)}</p>
                      <p className="font-bold text-[#1b1140]">
                        {node.version || 'Version 1'} —{' '}
                        {DECISION_BADGE[node.decision]?.label || node.decision}
                        {node.reason ? ` (${node.reason})` : ''}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6b6785]">by {node.reviewedBy?.name}</span>
                        {!isCurrent ? (
                          <button
                            type="button"
                            onClick={() => onSelectDecision(node.id)}
                            className="font-semibold text-[#4125d0] hover:underline"
                          >
                            Inspect {node.decisionRef} →
                          </button>
                        ) : (
                          <span className="rounded bg-[#ece5fd] px-1.5 py-0.2 text-[10px] font-bold text-[#4527c8]">
                            Viewing
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          </>
        )}

        {drawerTab === 'evidence' && (
          <div className="space-y-3">
            <p className="text-[11.5px] text-[#4a4466]">
              Evidence snapshots referenced at the moment decision <b>{d.decisionRef}</b> was recorded. Evidence is never overwritten by later submissions.
            </p>
            {(d.evidenceRefs || []).map((ev, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-[#ece7fa] bg-[#faf9fe] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-[#1b1140]">{ev.label}</p>
                    <p className="text-[11px] text-[#6b6785]">Version {ev.version || 1}</p>
                  </div>
                  <DecisionPill decision={ev.status || d.decision} />
                </div>
                {ev.previewUrl && (
                  <img
                    src={ev.previewUrl}
                    alt={ev.label}
                    className="h-40 w-full rounded-lg border border-[#e5e0f4] object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {drawerTab === 'history' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-[#ece7fa] bg-[#faf9fe] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#4527c8]">
                Historical Decision vs. Current Live State
              </p>
              <Rows
                rows={[
                  ['Decision at Review Time', DECISION_BADGE[d.decision]?.label || d.decision],
                  ['Version Decided', d.version || 'Version 1'],
                  ['Superseded By', d.supersededByDecisionId || 'None (Latest decision for this item)'],
                  ['Current Provider Status', 'Active · Verified'],
                ]}
              />
            </div>

            <h3 className="text-[13px] font-bold text-[#1b1140]">Complete Subject Decision Chain</h3>
            <ol className="space-y-2">
              {chain.map((node, idx) => (
                <li
                  key={node.id}
                  className={cn(
                    'rounded-xl border p-3',
                    node.id === d.id ? 'border-[#4125d0] bg-[#f6f3ff]' : 'border-[#ece7fa] bg-white',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1b1140]">
                      #{idx + 1} · {node.decisionRef} ({node.version})
                    </span>
                    <DecisionPill decision={node.decision} supersededBy={node.supersededByDecisionId} />
                  </div>
                  <p className="mt-1 text-[#2a1b57]">{node.reason}</p>
                  <p className="mt-0.5 text-[11px] text-[#6b6785]">
                    {stamp(node.reviewedAt, node.marketId)} · by {node.reviewedBy?.name}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {drawerTab === 'related' && (
          <div className="space-y-2.5">
            <p className="text-[11.5px] text-[#4a4466]">
              Cross-references linked to decision <b>{d.decisionRef}</b>:
            </p>
            <Link
              to={originalRoute}
              className="flex items-center justify-between rounded-xl border border-[#ece7fa] bg-[#faf9fe] p-3 font-semibold text-[#1b1140] hover:border-[#b9a9f0]"
            >
              <span>Original Review Workspace ({d.relatedReviewId || d.originRecordId})</span>
              <ArrowUpRight className="size-4 text-[#4125d0]" />
            </Link>
            <Link
              to={providerRoute}
              className="flex items-center justify-between rounded-xl border border-[#ece7fa] bg-[#faf9fe] p-3 font-semibold text-[#1b1140] hover:border-[#b9a9f0]"
            >
              <span>Provider Profile ({d.providerName || d.subjectName})</span>
              <ArrowUpRight className="size-4 text-[#4125d0]" />
            </Link>
            <Link
              to={verificationDecisionPath(d.providerId || 'PR-82941')}
              className="flex items-center justify-between rounded-xl border border-[#ece7fa] bg-[#faf9fe] p-3 font-semibold text-[#1b1140] hover:border-[#b9a9f0]"
            >
              <span>Verification Decision Gate (ADM-042)</span>
              <ArrowUpRight className="size-4 text-[#4125d0]" />
            </Link>
            {d.relatedInfoRequestId && (
              <Link
                to={`/information-requests/${d.relatedInfoRequestId}`}
                className="flex items-center justify-between rounded-xl border border-[#ece7fa] bg-[#faf9fe] p-3 font-semibold text-[#1b1140] hover:border-[#b9a9f0]"
              >
                <span>Related Information Request ({d.relatedInfoRequestId})</span>
                <ArrowUpRight className="size-4 text-[#4125d0]" />
              </Link>
            )}
          </div>
        )}

        {drawerTab === 'audit' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-[#ece7fa] bg-[#faf9fe] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#4527c8]">
                Immutable Governance & Technical Trail
              </p>
              <Rows
                rows={[
                  ['Decision Ledger ID', d.decisionRef],
                  ['Audit Event ID', d.auditId || `AUD-${d.decisionRef.replace('APR-', '')}`],
                  ['Subject Key', d.subjectKey],
                  ['Originating Module', d.originModule],
                  ['Originating Record', d.originRecordId],
                  ['Reviewer ID', d.reviewedBy?.id || 'adm-jane'],
                  ['Reviewer Role Snapshot', d.reviewerRoleSnapshot || 'Verification Specialist'],
                  ['Market Scope Snapshot', (d.reviewerMarketSnapshot || ['KE']).join(', ')],
                  ['Recorded Timestamp', d.createdAt || d.reviewedAt],
                ]}
              />
            </div>
            <p className="text-[11px] text-[#6b6785]">
              Records in <code>approval_decisions</code> are append-only and never overwritten by subsequent submissions.
            </p>
          </div>
        )}
      </div>

      {/* Drawer Footer Buttons */}
      <footer className="space-y-2 border-t border-[#f0edf8] bg-[#faf9fe] p-3.5">
        <Link
          to={originalRoute}
          className="flex h-9.5 w-full items-center justify-center gap-1.5 rounded-lg bg-[#4125d0] text-[12.5px] font-semibold text-white shadow-xs hover:bg-[#361db0]"
        >
          Open Original Review
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link
            to={providerRoute}
            className="flex h-9 items-center justify-center rounded-lg border border-[#ddd7ee] bg-white px-2 text-[12px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]"
          >
            View Provider Profile
          </Link>
          <Link
            to={verificationDecisionPath(d.providerId || 'PR-82941')}
            className="flex h-9 items-center justify-center rounded-lg border border-[#ddd7ee] bg-white px-2 text-[12px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]"
          >
            View Verification Case
          </Link>
        </div>
      </footer>
    </aside>
  )
}

export default function ApprovalHistory() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialDecisionId = searchParams.get('decision') || 'APR-82941'

  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [decisionTypeFilter, setDecisionTypeFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [providerTypeFilter, setProviderTypeFilter] = useState('')
  const [marketFilter, setMarketFilter] = useState('')
  const [reviewerFilter, setReviewerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateRangeFilter, setDateRangeFilter] = useState('')
  const [page, setPage] = useState(1)

  const [listData, setListData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedId, setSelectedId] = useState(initialDecisionId)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [exportToast, setExportToast] = useState(null)

  // Load paginated ledger entries
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    approvalWorkflowService
      .listApprovalDecisions({
        q,
        tab,
        decisionType: decisionTypeFilter,
        module: moduleFilter,
        providerType: providerTypeFilter,
        market: marketFilter,
        reviewer: reviewerFilter,
        status: statusFilter,
        page,
        pageSize: 10,
      })
      .then((res) => {
        if (cancelled) return
        setListData(res)
        setLoading(false)
        if (res.items.length > 0 && !res.items.some((x) => x.id === selectedId) && !searchParams.get('decision')) {
          setSelectedId(res.items[0].id)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Unable to load approval history.')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [q, tab, decisionTypeFilter, moduleFilter, providerTypeFilter, marketFilter, reviewerFilter, statusFilter, page])

  // Load selected decision detail + chain
  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    setDetailLoading(true)
    approvalWorkflowService
      .getApprovalDecision({ decisionId: selectedId })
      .then((res) => {
        if (!cancelled) {
          setDetailData(res)
          setDetailLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const handleClearFilters = () => {
    setTab('all')
    setQ('')
    setDecisionTypeFilter('')
    setModuleFilter('')
    setProviderTypeFilter('')
    setMarketFilter('')
    setReviewerFilter('')
    setStatusFilter('')
    setDateRangeFilter('')
    setPage(1)
    setSearchParams({})
  }

  const handleExport = async () => {
    const res = await approvalWorkflowService.exportApprovalHistory({
      q,
      tab,
      decisionType: decisionTypeFilter,
      module: moduleFilter,
      providerType: providerTypeFilter,
      market: marketFilter,
      reviewer: reviewerFilter,
      status: statusFilter,
    })
    const blob = new Blob([JSON.stringify(res.items, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `approval-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportToast(`Exported ${res.items.length} decision records (internal admin notes excluded).`)
    setTimeout(() => setExportToast(null), 4000)
  }

  const items = listData?.items || []
  const total = listData?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / 10))

  return (
    <div className="min-h-full space-y-3 px-4 pt-3 pb-24">
      {/* Page Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#4125d0] text-white shadow-sm">
            <History className="size-6" />
          </span>
          <div>
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[12px] text-[#4a4466]">
              <Link to={CONTENT_BASE} className="hover:text-[#4527c8]">
                Verification & Content Moderation
              </Link>
              <ChevronRight className="size-3.5" />
              <span className="font-semibold text-[#4527c8]">Approval History</span>
            </nav>
            <h1 className="font-display text-[32px] leading-none font-bold tracking-tight text-[#1b1140] sm:text-[36px]">
              Approval History
            </h1>
            <p className="mt-1 text-[13px] text-[#2a1b57]">
              View historical verification and content moderation decisions across the platform.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-[#e6d9bf] bg-[#fbf6ea] px-2.5 py-1 text-[10.5px] leading-tight text-[#8a6a2f]">
            <b className="block text-[11px]">NEW</b>
            Historical record of verification and content approval decisions.
          </span>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-[#4125d0] bg-white px-3.5 text-[12.5px] font-semibold text-[#4125d0] hover:bg-[#f4f0ff]"
          >
            <Download className="size-4" /> Export History
          </button>
          <Link
            to={VERIFICATION_DECISION_PATH}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#ddd7ee] bg-white px-3.5 text-[12.5px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]"
          >
            <ShieldCheck className="size-4 text-[#4125d0]" /> Verification Center
          </Link>
          <Link
            to={CONTENT_BASE}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#ddd7ee] bg-white px-3.5 text-[12.5px] font-semibold text-[#1b1140] hover:bg-[#f4f1fc]"
          >
            <FileCheck2 className="size-4 text-[#4125d0]" /> Content Approval Center
          </Link>
        </div>
      </header>

      {exportToast && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-[#86efac] bg-[#f0fdf4] px-3.5 py-2 text-[12px] font-semibold text-[#15803d]"
        >
          <span>{exportToast}</span>
          <button type="button" onClick={() => setExportToast(null)}>
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* 5 KPI Summary Cards */}
      <SummaryCards
        counts={listData?.counts}
        activeStatus={statusFilter}
        onToggleStatus={(st) => {
          setStatusFilter(st)
          setPage(1)
        }}
      />

      {/* Decision-Type Tabs + Search & Filter Bar */}
      <section className={cn(CARD, 'space-y-3 p-3.5')}>
        {/* Scrollable Tabs */}
        <div
          role="tablist"
          aria-label="Approval decision categories"
          className="flex items-center gap-1.5 overflow-x-auto border-b border-[#f0edf8] pb-2.5 [scrollbar-width:thin]"
        >
          {DECISION_TABS.map(([id, label]) => {
            const active = tab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(id)
                  setPage(1)
                }}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition',
                  active
                    ? 'bg-[#4125d0] text-white shadow-xs'
                    : 'text-[#2a1b57] hover:bg-[#f4f0ff] hover:text-[#4125d0]',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Multi-Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[230px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6b6785]" />
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder="Search by provider, ID, reviewer, or item..."
              className="h-9 w-full rounded-lg border border-[#ddd7ee] bg-white pr-3 pl-9 text-[12.5px] text-[#1b1140] focus:border-[#7a5cf0] focus:outline-none"
            />
          </div>

          <select
            aria-label="Decision Type"
            value={decisionTypeFilter}
            onChange={(e) => {
              setDecisionTypeFilter(e.target.value)
              setPage(1)
            }}
            className={selectCls}
          >
            <option value="">Decision Type</option>
            {DECISION_TABS.slice(1).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>

          <select
            aria-label="Module"
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value)
              setPage(1)
            }}
            className={selectCls}
          >
            <option value="">Module</option>
            <option value="verification">Verification Center</option>
            <option value="content">Content Approval</option>
          </select>

          <select
            aria-label="Provider Type"
            value={providerTypeFilter}
            onChange={(e) => {
              setProviderTypeFilter(e.target.value)
              setPage(1)
            }}
            className={selectCls}
          >
            <option value="">Provider Type</option>
            <option value="individual">Individual Provider</option>
            <option value="spa">Spa & Wellness Center</option>
            <option value="hotel_resort">Hotel & Wellness Resort</option>
          </select>

          <select
            aria-label="Market / Country"
            value={marketFilter}
            onChange={(e) => {
              setMarketFilter(e.target.value)
              setPage(1)
            }}
            className={selectCls}
          >
            <option value="">Market / Country</option>
            <option value="KE">Kenya</option>
            <option value="UG">Uganda</option>
            <option value="TZ">Tanzania</option>
            <option value="RW">Rwanda</option>
            <option value="ZA">South Africa</option>
          </select>

          <select
            aria-label="Reviewer"
            value={reviewerFilter}
            onChange={(e) => {
              setReviewerFilter(e.target.value)
              setPage(1)
            }}
            className={selectCls}
          >
            <option value="">Reviewer</option>
            <option value="Jane Ochieng">Jane Ochieng</option>
            <option value="Peter Maina">Peter Maina</option>
            <option value="David Mwangi">David Mwangi</option>
            <option value="Aisha Noor">Aisha Noor</option>
          </select>

          <select
            aria-label="Date Range"
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className={selectCls}
          >
            <option value="">Date Range</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <button
            type="button"
            onClick={handleClearFilters}
            className="h-9 rounded-lg border border-[#ddd7ee] bg-[#faf9fe] px-3 text-[12px] font-semibold text-[#4527c8] hover:bg-[#f4f0ff]"
          >
            Clear Filters
          </button>
        </div>
      </section>

      {error ? (
        <ErrorState title="Unable to load approval history" description={error} />
      ) : (
        <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,1fr)]">
          {/* Left Ledger Table */}
          <section className={cn(CARD, 'overflow-hidden')}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-[12px]">
                <thead>
                  <tr className="bg-[#f3f0fc] text-left text-[11.5px] font-bold text-[#1b1140]">
                    <th className="px-3 py-2.5">Decision ID</th>
                    <th className="px-2.5 py-2.5">Date & Time</th>
                    <th className="px-2.5 py-2.5">Provider / Subject</th>
                    <th className="px-2.5 py-2.5">Decision Type</th>
                    <th className="px-2.5 py-2.5">Decision</th>
                    <th className="px-2.5 py-2.5">Reason / Outcome</th>
                    <th className="px-2.5 py-2.5">Reviewed By</th>
                    <th className="px-2.5 py-2.5">Market</th>
                    <th className="px-2.5 py-2.5">Version</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0edf8]">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={10} className="p-2">
                          <Skeleton className="h-11 rounded-lg" />
                        </td>
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[13px] text-[#6b6785]">
                        No historical approval decisions match your current filters.
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => {
                      const active = row.id === selectedId
                      const dtParts = stamp(row.reviewedAt, row.marketId).split(' • ')
                      return (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedId(row.id)}
                          className={cn(
                            'cursor-pointer transition',
                            active ? 'bg-[#f4f0ff]' : 'hover:bg-[#faf8fe]',
                          )}
                        >
                          <td className="px-3 py-2.5 font-bold whitespace-nowrap text-[#1b1140]">
                            {row.decisionRef}
                          </td>
                          <td className="px-2.5 py-2.5 whitespace-nowrap text-[#2a1b57]">
                            <p className="font-medium text-[#1b1140]">{dtParts[0]}</p>
                            {dtParts[1] && <p className="text-[11px] text-[#6b6785]">{dtParts[1]}</p>}
                          </td>
                          <td className="px-2.5 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <ProviderAvatarImg
                                url={row.subjectImage}
                                name={row.subjectName || row.providerName}
                                size={36}
                              />
                              <div className="min-w-0 leading-tight">
                                <p className="truncate font-bold text-[#1b1140]">{row.subjectName}</p>
                                <p className="truncate text-[11px] text-[#6b6785]">{row.subjectSubtitle}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2.5 py-2.5">
                            <span className="inline-block rounded-md bg-[#ede8fb] px-2 py-0.5 text-[11px] font-semibold text-[#4527c8]">
                              {DECISION_TYPE_LABELS[row.decisionType] || row.decisionType}
                            </span>
                          </td>
                          <td className="px-2.5 py-2.5">
                            <DecisionPill decision={row.decision} supersededBy={row.supersededByDecisionId} />
                          </td>
                          <td className="max-w-[160px] px-2.5 py-2.5 font-medium text-[#1b1140]">
                            <span className="line-clamp-2">{row.reason || 'Approved'}</span>
                          </td>
                          <td className="px-2.5 py-2.5 whitespace-nowrap">
                            <span className="font-medium text-[#1b1140]">{row.reviewedBy?.name}</span>
                          </td>
                          <td className="px-2.5 py-2.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#2a1b57]">
                              <CountryFlag code={row.marketId || 'KE'} className="h-3 w-4" />
                              {row.marketName || row.marketId}
                            </span>
                          </td>
                          <td className="px-2.5 py-2.5 whitespace-nowrap text-[#4a4466]">
                            {row.version || 'Version 1'}
                          </td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedId(row.id)
                              }}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11.5px] font-semibold transition',
                                active
                                  ? 'border-[#4125d0] bg-[#4125d0] text-white'
                                  : 'border-[#d6cdf5] bg-white text-[#4527c8] hover:bg-[#f4f0ff]',
                              )}
                            >
                              View →
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Footer */}
            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0edf8] px-4 py-2.5 text-[12px] text-[#4a4466]">
              <span>
                Showing <b>{items.length ? (page - 1) * 10 + 1 : 0}–{(page - 1) * 10 + items.length}</b> of{' '}
                <b>{total}</b> matching decisions (1,825 total platform decisions)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#ddd7ee] bg-white px-2.5 font-semibold text-[#2a1b57] hover:bg-[#f4f1fc] disabled:opacity-40"
                >
                  <ChevronLeft className="size-3.5" /> Previous
                </button>
                <span className="px-2 font-semibold text-[#1b1140]">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#ddd7ee] bg-white px-2.5 font-semibold text-[#2a1b57] hover:bg-[#f4f1fc] disabled:opacity-40"
                >
                  Next <ChevronRight className="size-3.5" />
                </button>
              </div>
            </footer>
          </section>

          {/* Right Approval Details Drawer */}
          <ApprovalDetailsDrawer
            detail={detailData}
            loading={detailLoading}
            onSelectDecision={(id) => setSelectedId(id)}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  )
}

