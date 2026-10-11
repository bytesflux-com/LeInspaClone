import { Clock, ShieldCheck, Award, CheckCircle2, AlertCircle, FileCheck, Layers } from 'lucide-react'

/**
 * ADM-033: CredentialSummaryCard
 * Provider context & qualification review summary counters.
 */
export default function CredentialSummaryCard({ data }) {
  if (!data) return null

  const summary = data.summary || {
    credentialsRequired: 2,
    submitted: 2,
    approved: 1,
    underReview: 1,
    changesRequested: 0,
  }

  const defaultAvatar =
    data.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
      {/* LEFT SECTION: Provider Identity (Col span 5) */}
      <div className="lg:col-span-5 flex flex-col justify-between space-y-4 lg:border-r lg:border-slate-100 lg:pr-6">
        <div className="flex items-start gap-4">
          {/* Avatar with Verified Ring */}
          <div className="relative shrink-0">
            <img
              src={defaultAvatar}
              alt={data.name}
              className="size-16 rounded-2xl border-2 border-purple-200 object-cover shadow-sm"
            />
            <span
              title="Verified Identity"
              className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white text-[10px] font-bold"
            >
              ✓
            </span>
          </div>

          {/* Provider Details */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {data.name || 'Grace Njeri'}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                <span className="size-1.5 rounded-full bg-purple-600" />
                Credential Review
              </span>
            </div>

            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <span className="font-mono text-purple-700 font-semibold">{data.providerId || 'PR-82941'}</span>
              <span>•</span>
              <span>{data.type || 'Massage Therapist'}</span>
              <span>•</span>
              <span>{data.market?.flag || '🇰🇪'} {data.market?.name || 'Kenya'}</span>
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
              <Clock className="size-3.5 text-slate-400" />
              <span>Submitted: {data.submittedAt || '12 Sep 2026 • 10:42 AM'}</span>
            </div>
          </div>
        </div>

        {/* Assigned Reviewer Row */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <img
              src={
                data.assignedReviewer?.avatarUrl ||
                'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
              }
              alt={data.assignedTo || 'Jane Ochieng'}
              className="size-6 rounded-full border border-purple-200 object-cover"
            />
            <span>
              Assigned to: <strong className="text-slate-900 font-semibold">{data.assignedTo || 'Jane Ochieng'}</strong>
            </span>
          </div>

          <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
            Step 2 of 4 (ADM-031)
          </span>
        </div>
      </div>

      {/* RIGHT SECTION: Credential Review Summary (Col span 7) */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-purple-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900">
              Professional Verification
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Service Accreditation Required
          </span>
        </div>

        {/* Metric Chips Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-1">
          {/* Category */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 col-span-2">
            <p className="text-[10px] font-medium text-slate-500 uppercase">Provider Category</p>
            <p className="text-xs font-bold text-slate-900 truncate mt-0.5" title={data.type}>
              {data.type || 'Massage Therapist'}
            </p>
          </div>

          {/* Required */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-center">
            <p className="text-[10px] font-medium text-slate-500 uppercase">Required</p>
            <p className="text-sm font-black text-slate-900 mt-0.5">
              {summary.credentialsRequired}
            </p>
          </div>

          {/* Submitted */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-center">
            <p className="text-[10px] font-medium text-slate-500 uppercase">Submitted</p>
            <p className="text-sm font-black text-slate-900 mt-0.5">
              {summary.submitted}
            </p>
          </div>

          {/* Approved */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 text-center">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Approved</p>
            <p className="text-sm font-black text-emerald-700 mt-0.5">
              {summary.approved}
            </p>
          </div>

          {/* Under Review */}
          <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-2.5 text-center">
            <p className="text-[10px] font-bold text-purple-700 uppercase">Reviewing</p>
            <p className="text-sm font-black text-[#6D28D9] mt-0.5">
              {summary.underReview}
            </p>
          </div>
        </div>

        {/* Audit policy notice */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-purple-50/40 border border-purple-100/60 rounded-xl px-3 py-1.5">
          <Award className="size-3.5 text-purple-600 shrink-0" />
          <span>Only verified qualifications unlock bookable services on the marketplace.</span>
        </div>
      </div>
    </div>
  )
}
