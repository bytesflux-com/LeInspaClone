import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  X,
  CheckCircle2,
  Clock,
  Circle,
  FileText,
  User,
  ArrowRight,
  ExternalLink,
  MoreVertical,
  Flag,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react'

/**
 * QueueQuickPreviewDrawer (ADM-030)
 * Right-hand interactive preview drawer displaying provider overview, progress steps,
 * submitted documents, comparison fields, and execution controls.
 */
export default function QueueQuickPreviewDrawer({
  record,
  onClose,
  onClaimCase,
  onOpenEscalate,
  onOpenDocumentViewer,
}) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'documents' | 'information' | 'history'
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!record) return null

  const handleCopyId = () => {
    navigator.clipboard.writeText(record.providerId || record.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setMenuOpen(false)
  }

  // Format status badge
  const renderStatusBadge = (status) => {
    const s = String(status || '').toUpperCase()
    if (s === 'AWAITING_REVIEW' || s === 'NEW') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
          <span className="size-1.5 rounded-full bg-amber-500" />
          <span>Awaiting Review</span>
        </span>
      )
    }
    if (s === 'UNDER_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
          <span className="size-1.5 rounded-full bg-purple-600 animate-pulse" />
          <span>Under Review</span>
        </span>
      )
    }
    if (s === 'RESUBMITTED') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          <span className="size-1.5 rounded-full bg-blue-600" />
          <span>Resubmitted</span>
        </span>
      )
    }
    if (s === 'CHANGES_REQUESTED') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
          <span className="size-1.5 rounded-full bg-orange-500" />
          <span>Changes Requested</span>
        </span>
      )
    }
    if (s === 'ESCALATED') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
          <span className="size-1.5 rounded-full bg-rose-600 animate-ping" />
          <span>Escalated</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="size-3 text-emerald-600" />
        <span>Approved</span>
      </span>
    )
  }

  // Document status pill
  const renderDocBadge = (status) => {
    const s = String(status || '').toUpperCase()
    if (s === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Approved
        </span>
      )
    }
    if (s === 'CHANGES_REQUESTED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
          <span className="size-1.5 rounded-full bg-orange-500" />
          Changes Req.
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
        <span className="size-1.5 rounded-full bg-purple-500 animate-pulse" />
        Reviewing
      </span>
    )
  }

  // Progress Steps Helper
  const progressSteps = record.progressSteps || [
    { id: 'step-1', label: 'Identity', status: 'APPROVED' },
    { id: 'step-2', label: 'Professional Credentials', status: 'REVIEWING_NOW' },
    { id: 'step-3', label: 'Profile Information', status: 'PENDING' },
    { id: 'step-4', label: 'Final Verification', status: 'PENDING' },
  ]

  const docs = record.documents || []

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      {/* 1. HEADER */}
      <div className="border-b border-slate-200/80 bg-slate-50/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="size-12 shrink-0 overflow-hidden rounded-2xl border-2 border-purple-600/30 p-0.5 bg-white shadow-2xs">
              {record.avatarUrl ? (
                <img
                  src={record.avatarUrl}
                  alt={record.name}
                  className="size-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold text-lg">
                  {record.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 tracking-tight text-base truncate">
                  {record.name}
                </h3>
              </div>
              <p className="font-mono text-xs text-slate-500 mt-0.5">
                {record.providerId}
              </p>
              <p className="text-xs text-slate-600 mt-0.5 font-medium truncate">
                {record.type} • {record.market?.flag} {record.market?.name}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Dynamic Status + Submitted Time */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-3 text-xs">
          <div>{renderStatusBadge(record.status)}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            Submitted: <span className="text-slate-700">{record.submittedAt}</span>
          </div>
        </div>
      </div>

      {/* 2. SUB-TABS */}
      <div className="flex border-b border-slate-200 bg-white px-5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`border-b-2 py-2.5 px-3 transition-colors ${
            activeTab === 'overview'
              ? 'border-[#6D28D9] text-[#6D28D9]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`border-b-2 py-2.5 px-3 transition-colors ${
            activeTab === 'documents'
              ? 'border-[#6D28D9] text-[#6D28D9]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Documents ({docs.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('information')}
          className={`border-b-2 py-2.5 px-3 transition-colors ${
            activeTab === 'information'
              ? 'border-[#6D28D9] text-[#6D28D9]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Information
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`border-b-2 py-2.5 px-3 transition-colors ${
            activeTab === 'history'
              ? 'border-[#6D28D9] text-[#6D28D9]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          History
        </button>
      </div>

      {/* 3. DRAWER BODY (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Verification Progress Steps */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Verification Progress
              </h4>
              <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                {progressSteps.map((step, idx) => {
                  const isApproved =
                    step.status === 'APPROVED' || (record.status === 'APPROVED' && idx === 0)
                  const isReviewing =
                    step.status === 'REVIEWING_NOW' ||
                    (record.status === 'UNDER_REVIEW' && idx === 1) ||
                    (record.status === 'AWAITING_REVIEW' && idx === 1)

                  return (
                    <div
                      key={step.id || idx}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex items-center gap-2.5">
                        {isApproved ? (
                          <div className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <Check className="size-3 stroke-[3]" />
                          </div>
                        ) : isReviewing ? (
                          <div className="flex size-5 items-center justify-center rounded-full bg-purple-100 text-[#6D28D9]">
                            <span className="size-2 rounded-full bg-[#6D28D9] animate-pulse" />
                          </div>
                        ) : (
                          <div className="flex size-5 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <Circle className="size-3" />
                          </div>
                        )}
                        <span
                          className={`font-medium ${
                            isApproved
                              ? 'text-slate-800'
                              : isReviewing
                                ? 'text-[#6D28D9] font-semibold'
                                : 'text-slate-500'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>

                      <span className="text-[11px] font-medium text-slate-400">
                        {isApproved
                          ? 'Approved'
                          : isReviewing
                            ? 'Reviewing'
                            : 'Pending'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Key Details Grid */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Submission Details
              </h4>
              <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                <div>
                  <span className="text-[11px] text-slate-400">Provider Type</span>
                  <p className="mt-0.5 font-semibold text-slate-900 truncate">
                    {record.type}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Assigned To</span>
                  <p className="mt-0.5 font-semibold text-slate-900 truncate">
                    {record.assignedTo || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Verification Type</span>
                  <p className="mt-0.5 font-semibold text-slate-900 truncate">
                    {record.verificationType}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Priority</span>
                  <p className="mt-0.5 font-semibold text-slate-900">
                    {record.priority || 'Normal'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Market</span>
                  <p className="mt-0.5 font-semibold text-slate-900">
                    {record.market?.flag} {record.market?.name}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Resubmissions</span>
                  <p className="mt-0.5 font-semibold text-slate-900">
                    {record.resubmissionsCount ?? 0}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Submitted</span>
                  <p className="mt-0.5 font-semibold text-slate-900 truncate">
                    {record.submittedAt}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Waiting Time</span>
                  <p className="mt-0.5 font-semibold text-purple-700">
                    {record.waitingFormatted || '1h 18m'}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents Submitted */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Documents Submitted ({docs.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className="text-[11px] font-semibold text-[#6D28D9] hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onOpenDocumentViewer?.(doc)}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 hover:bg-purple-50/40 hover:border-purple-200 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-purple-700 shadow-2xs">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {doc.title}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {doc.fileFormat || 'PDF'} •{' '}
                          {Math.round(((doc.fileSizeKb || 2400) / 1024) * 10) / 10} MB
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {renderDocBadge(doc.status)}
                      <Eye className="size-3.5 text-slate-400 hover:text-purple-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Review credential documents submitted for compliance validation.
            </p>
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-slate-900">{doc.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">{doc.issuer}</p>
                  </div>
                  {renderDocBadge(doc.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <div>
                    <span className="text-slate-400">Document No:</span>{' '}
                    <strong className="font-mono text-purple-700 font-medium">
                      {doc.docNumber || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Expires:</span>{' '}
                    <span>{doc.expiryDate || 'N/A'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenDocumentViewer?.(doc)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/70 py-1.5 text-xs font-semibold text-[#6D28D9] hover:bg-purple-100 transition"
                >
                  <Eye className="size-3.5" />
                  <span>Inspect Document in Lightbox</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: INFORMATION (Comparison) */}
        {activeTab === 'information' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Automated OCR field verification vs Provider Profile data.
            </p>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              {(record.comparisonData || [
                { fieldName: 'Account Name', accountValue: record.name, docValue: record.name, isMatch: true },
                { fieldName: 'Country', accountValue: record.market?.name, docValue: record.market?.name, isMatch: true },
              ]).map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 text-xs ${
                    idx !== 0 ? 'border-t border-slate-100' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">{item.fieldName}</span>
                    {item.isMatch ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                        <Check className="size-3" /> Match
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md">
                        <AlertTriangle className="size-3" /> Discrepancy
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] mt-1.5">
                    <div className="rounded bg-slate-50 p-1.5">
                      <span className="text-[10px] text-slate-400 block">Account Value</span>
                      <span className="text-slate-800 font-medium">{item.accountValue}</span>
                    </div>
                    <div className="rounded bg-slate-50 p-1.5">
                      <span className="text-[10px] text-slate-400 block">Document Value</span>
                      <span className="text-slate-800 font-medium">{item.docValue}</span>
                    </div>
                  </div>

                  {item.diffNote && (
                    <p className="mt-1.5 text-[10px] text-amber-700 italic">
                      Note: {item.diffNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Audit trail of actions and workflow decisions for this case.
            </p>

            <div className="relative border-l-2 border-slate-200 pl-4 space-y-4 ml-1">
              <div className="relative">
                <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-purple-600 ring-4 ring-white" />
                <p className="font-semibold text-slate-900">Submitted for Verification</p>
                <p className="text-[11px] text-slate-400">{record.submittedAt}</p>
              </div>

              {record.reviewStartedAt && (
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <p className="font-semibold text-slate-900">Review Started</p>
                  <p className="text-[11px] text-slate-400">Assigned to {record.assignedTo}</p>
                </div>
              )}

              {record.escalation && (
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-rose-600 ring-4 ring-white" />
                  <p className="font-semibold text-rose-700">Escalated to Compliance</p>
                  <p className="text-[11px] text-slate-600 font-medium">Reason: {record.escalation.reason}</p>
                  {record.escalation.complianceNotes && (
                    <p className="text-[10px] text-slate-500 mt-0.5 italic">
                      &quot;{record.escalation.complianceNotes}&quot;
                    </p>
                  )}
                </div>
              )}

              {record.lastDecision && (
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                  <p className="font-semibold text-slate-900">
                    Decision: {record.lastDecision.decision}
                  </p>
                  <p className="text-[11px] text-slate-400">Decided by Admin Reviewer</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. STICKY ACTION FOOTER */}
      <div className="border-t border-slate-200/80 bg-slate-50/70 p-4 space-y-2.5">
        {/* Primary Action Button: Start Review → */}
        <button
          type="button"
          onClick={() => navigate(`/verifications/review/${record.providerId || record.id}`)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6D28D9] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#5B21B6] transition"
        >
          <span>Start Review</span>
          <ArrowRight className="size-4" />
        </button>

        {/* Secondary Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Assign to Me button */}
          <button
            type="button"
            onClick={() => onClaimCase?.(record.id)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
          >
            <User className="size-3.5 text-slate-500" />
            <span>Assign to Me</span>
          </button>

          {/* Action Dropdown Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition shadow-2xs"
            >
              <MoreVertical className="size-4" />
            </button>

            {menuOpen && (
              <div className="absolute bottom-10 right-0 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onOpenEscalate?.(record)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  <Flag className="size-3.5" />
                  <span>Escalate to Compliance</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  {copied ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span>{copied ? 'Copied!' : 'Copy Provider ID'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Link to Provider Profile */}
          <Link
            to={`/providers/${record.providerId}`}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-purple-700 hover:bg-slate-100 transition shadow-2xs"
            title="View Provider Profile"
          >
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
