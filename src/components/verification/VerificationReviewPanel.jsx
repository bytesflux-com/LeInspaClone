import { useState } from 'react'
import { Link } from 'react-router'
import {
  X,
  Eye,
  EyeOff,
  ZoomIn,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Info,
  ExternalLink,
  MessageSquare,
  Check,
  RotateCcw,
  UserPlus,
} from 'lucide-react'
import CountryFlag from '../ui/CountryFlag'
import {
  VERIFICATION_STATUS_CONFIG,
} from '../../data/verificationSchema'

/**
 * ADM-029 Interactive Verification Review Panel (Right 35% Pane)
 * Styled in the clean, crisp light theme of ADM-009:
 * - Provider header with verified ring and status badge
 * - 4 Panel Tabs: Overview, Documents (3), Information, History
 * - Visual 4-stage pipeline milestone tracker
 * - Active document preview card with zoom lightbox trigger
 * - Quick action buttons: Approve, Request Changes, Reject
 * - Collapsible Information Comparison diff
 * - Internal team notes accordion
 * - Sticky bottom Complete Review split button
 */
export default function VerificationReviewPanel({
  record,
  onClose,
  onApprove,
  onRequestChanges,
  onReject,
  onAssignReviewer,
  onOpenDocumentViewer,
  onSaveInternalNote,
}) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [maskedDocNumber, setMaskedDocNumber] = useState(true)
  const [comparisonExpanded, setComparisonExpanded] = useState(true)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [internalNote, setInternalNote] = useState('')
  const [splitDropdownOpen, setSplitDropdownOpen] = useState(false)

  if (!record) return null

  const activeDoc = record.documents?.[0] || {
    title: 'Professional Certificate',
    docType: 'PROF_CERT',
    nameOnDoc: record.name,
    docNumber: '••••7281',
    issuer: 'Kenya Massage Federation',
    issueDate: '15 Jan 2024',
    expiryDate: '15 Jan 2028',
    fileFormat: 'PDF',
  }

  const unmaskedDocNumber = 'KMF-2024-7281'

  const statusConfig = VERIFICATION_STATUS_CONFIG[record.status] || {
    label: record.status,
    badgeColor: 'orange',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
  }

  const handleSaveNote = () => {
    if (!internalNote.trim()) return
    if (onSaveInternalNote) {
      onSaveInternalNote(record.id, internalNote)
      setInternalNote('')
    }
  }

  return (
    <aside className="w-full">
      <div className="sticky top-6 flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* 1. Header Section */}
        <div className="relative border-b border-slate-100 p-5 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            title="Close Panel"
          >
            <X className="size-4.5" />
          </button>

          <div className="flex items-start gap-3.5 pr-8">
            {/* Avatar with Verified ring */}
            <div className="relative">
              <img
                src={record.avatarUrl}
                alt={record.name}
                className="size-14 rounded-full border-2 border-white object-cover shadow-sm ring-2 ring-purple-500/40"
              />
              <span className="absolute bottom-0 right-0 flex size-4.5 items-center justify-center rounded-full bg-purple-700 text-white ring-2 ring-white">
                <Check className="size-3" />
              </span>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <Link
                  to={`/providers/${record.providerId}`}
                  className="text-base font-bold tracking-tight text-slate-900 hover:text-purple-700 hover:underline"
                  title="View Full Provider Profile (ADM-022)"
                >
                  {record.name}
                </Link>
                <Link
                  to={`/providers/${record.providerId}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:underline"
                >
                  <span>View Profile</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <Link
                  to={`/providers/${record.providerId}`}
                  className="font-mono text-[11px] font-semibold text-purple-600 hover:underline"
                >
                  {record.providerId}
                </Link>
                <span>•</span>
                <span>{record.type}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <CountryFlag code={record.market?.code} className="size-3.5" />
                  <span>{record.market?.name}</span>
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700"
                >
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  <span>{statusConfig.label}</span>
                </span>

                <Link
                  to={`/verifications/review/${record.providerId || record.id}`}
                  className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-[#6D28D9] hover:bg-purple-100 transition shadow-2xs"
                  title="Open ADM-031 Full Review Screen"
                >
                  <span>Full Review →</span>
                </Link>

                <span className="text-[11px] text-slate-400">
                  Submitted: {record.submittedAt}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Panel Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-5 text-xs font-semibold text-slate-600">
          {['Overview', 'Documents (3)', 'Information', 'History'].map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 py-3 px-3 transition-colors ${
                  isActive
                    ? 'border-[#6D28D9] text-[#6D28D9] font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {/* Scrollable Workspace Body */}
        <div className="max-h-[calc(100vh-320px)] overflow-y-auto p-5 space-y-5 bg-white">
          {/* 3. Verification Progress Pipeline Steps */}
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Verification Pipeline
            </h4>
            <div className="space-y-2">
              {(record.progressSteps || []).map((step, idx) => {
                const isApproved = step.status === 'APPROVED'
                const isReviewing = step.status === 'REVIEWING_NOW'

                return (
                  <div
                    key={step.id || idx}
                    className={`flex items-center justify-between rounded-xl border p-3 text-xs transition-colors ${
                      isReviewing
                        ? 'border-purple-300 bg-purple-50/70 text-purple-950 font-semibold'
                        : isApproved
                          ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                          : 'border-slate-200 bg-slate-50/60 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isApproved ? (
                        <div className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <Check className="size-3.5" />
                        </div>
                      ) : isReviewing ? (
                        <div className="relative flex size-5 items-center justify-center">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-purple-400 opacity-75" />
                          <span className="relative inline-flex size-3.5 rounded-full bg-purple-600" />
                        </div>
                      ) : (
                        <div className="size-4.5 rounded-full border-2 border-slate-300" />
                      )}
                      <span>{step.label}</span>
                    </div>

                    <span className="text-[11px] font-bold">
                      {isApproved ? (
                        <span className="text-emerald-700">Approved</span>
                      ) : isReviewing ? (
                        <span className="text-purple-700">Reviewing Now</span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 4. Submitted Documents & Active Document Card */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Submitted Documents
              </h4>
              <button
                type="button"
                onClick={() => onOpenDocumentViewer && onOpenDocumentViewer(activeDoc)}
                className="text-xs font-semibold text-purple-700 hover:text-purple-900"
              >
                View All (3)
              </button>
            </div>

            {/* Active Document Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="flex gap-3.5">
                {/* Thumbnail Preview */}
                <div
                  onClick={() => onOpenDocumentViewer && onOpenDocumentViewer(activeDoc)}
                  className="group relative flex h-28 w-24 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-amber-900/30 bg-gradient-to-b from-[#FFFDF9] to-[#F7F2E7] p-2 text-center shadow-xs transition-transform hover:scale-102"
                >
                  <ShieldCheck className="size-8 text-amber-800/60" />
                  <span className="mt-1 font-serif text-[8px] font-bold uppercase tracking-wider text-amber-950">
                    Certificate
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <ZoomIn className="size-5 text-white" />
                  </div>
                </div>

                {/* Metadata Fields */}
                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {activeDoc.title}
                    </span>
                    <span className="rounded-md border border-orange-200 bg-orange-50 px-1.5 py-0.2 text-[10px] font-bold text-orange-700">
                      Reviewing
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Name on Doc:{' '}
                    <span className="font-semibold text-slate-800">
                      {activeDoc.nameOnDoc}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>
                      Doc #:{' '}
                      <span className="font-mono font-semibold text-purple-700">
                        {maskedDocNumber ? activeDoc.docNumber : unmaskedDocNumber}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setMaskedDocNumber(!maskedDocNumber)}
                      className="text-slate-400 hover:text-slate-700"
                      title={maskedDocNumber ? 'Reveal number' : 'Mask number'}
                    >
                      {maskedDocNumber ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Issuer:{' '}
                    <span className="text-slate-700">
                      {activeDoc.issuer}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>Issued: {activeDoc.issueDate}</span>
                    <span>•</span>
                    <span>Expires: {activeDoc.expiryDate}</span>
                  </div>
                </div>
              </div>

              {/* Document Quick Actions (3 buttons) */}
              <div className="mt-3.5 grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => onApprove && onApprove(record)}
                  className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition"
                >
                  <Check className="size-3.5" />
                  <span>Approve</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRequestChanges && onRequestChanges(record)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Changes</span>
                </button>

                <button
                  type="button"
                  onClick={() => onReject && onReject(record)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-rose-300 bg-rose-50 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
                >
                  <X className="size-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. Information Comparison Accordion */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setComparisonExpanded(!comparisonExpanded)}
              className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-slate-800"
            >
              <span>Information Comparison</span>
              {comparisonExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {comparisonExpanded && (
              <div className="border-t border-slate-100 p-3.5 space-y-2.5 text-xs">
                {/* Row 1: Account Name vs Doc Name */}
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 text-slate-800">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-700">Name Comparison</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Possible difference
                    </span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px]">
                    <div>Account: <strong className="text-slate-900">Grace Njeri</strong></div>
                    <div>Document: <strong className="text-slate-900">Grace W. Njeri</strong></div>
                  </div>
                </div>

                {/* Row 2: Country */}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-slate-800">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-700">Country Match</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      <Check className="size-3" />
                      Match
                    </span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px]">
                    <div>Profile: <strong className="text-slate-900">Kenya 🇰🇪</strong></div>
                    <div>Doc Issuance: <strong className="text-slate-900">Kenya 🇰🇪</strong></div>
                  </div>
                </div>

                {/* Helper Tip */}
                <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-500">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-purple-600" />
                  <span>
                    Do not automatically reject for minor name variations if national registration ID and credentials correspond.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 6. Internal Team Notes Accordion */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setNotesExpanded(!notesExpanded)}
              className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-slate-800"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-slate-500" />
                <span>Internal Team Notes</span>
              </div>
              {notesExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {notesExpanded && (
              <div className="border-t border-slate-100 p-3.5 text-xs">
                <textarea
                  rows={2}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Add a private compliance or operational note for this provider..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-purple-600 focus:outline-hidden"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 7. Sticky Bottom Action Bar */}
        <div className="relative border-t border-slate-200 bg-white p-4">
          <div className="relative flex items-center">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => onApprove && onApprove(record)}
              className="flex-1 rounded-l-xl bg-[#6D28D9] py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-[#5B21B6] transition"
            >
              ✓ Complete Review & Approve
            </button>

            {/* Split Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setSplitDropdownOpen(!splitDropdownOpen)}
              className="flex size-9.5 items-center justify-center rounded-r-xl border-l border-purple-800 bg-[#6D28D9] text-white hover:bg-[#5B21B6] transition"
            >
              <ChevronDown className="size-4" />
            </button>

            {/* Split Dropdown Menu */}
            {splitDropdownOpen && (
              <div className="absolute bottom-12 right-0 z-30 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setSplitDropdownOpen(false)
                    onApprove && onApprove(record)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Check className="size-4 text-emerald-600" />
                  <span>Approve Application</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSplitDropdownOpen(false)
                    onRequestChanges && onRequestChanges(record)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <RotateCcw className="size-4 text-amber-600" />
                  <span>Request Changes</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSplitDropdownOpen(false)
                    onAssignReviewer && onAssignReviewer(record)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <UserPlus className="size-4 text-purple-600" />
                  <span>Reassign Reviewer</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    setSplitDropdownOpen(false)
                    onReject && onReject(record)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  <X className="size-4 text-rose-600" />
                  <span>Reject Application</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
