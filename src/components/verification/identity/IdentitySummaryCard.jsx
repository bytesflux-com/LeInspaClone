import { Check, Clock, UserCheck, Shield, Building2, Hotel } from 'lucide-react'

/**
 * ADM-032: IdentitySummaryCard
 * Two-panel identification & summary card displaying provider/representative context
 * and high-level identity verification metrics.
 */
export default function IdentitySummaryCard({ data }) {
  if (!data) return null

  const isSpa = data.providerCategory === 'SPA_WELLNESS'
  const isHotel = data.providerCategory === 'HOTEL_RESORT'

  // Dynamic status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <span className="size-2 rounded-full bg-emerald-500" />
            Approved
          </span>
        )
      case 'CHANGES_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <span className="size-2 rounded-full bg-amber-500" />
            Changes Requested
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
            <span className="size-2 rounded-full bg-rose-500" />
            Rejected
          </span>
        )
      case 'ESCALATED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
            <span className="size-2 rounded-full bg-purple-500" />
            Escalated
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <span className="size-2 rounded-full bg-amber-500" />
            Awaiting Review
          </span>
        )
    }
  }

  const defaultAvatar = isSpa
    ? 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150&auto=format&fit=crop&q=80'
    : isHotel
      ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
      {/* LEFT PANEL: Person & Case Header (Col span 6) */}
      <div className="lg:col-span-6 flex flex-col justify-between space-y-4 lg:border-r lg:border-slate-100 lg:pr-6">
        <div className="flex items-start gap-4">
          {/* Avatar with Verified ring */}
          <div className="relative shrink-0">
            <img
              src={data.avatarUrl || defaultAvatar}
              alt={data.name}
              className="size-16 rounded-2xl border-2 border-purple-200 object-cover shadow-sm"
            />
            <span
              title="Verified Account Holder"
              className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white text-[10px] font-bold"
            >
              ✓
            </span>
          </div>

          {/* Primary Identity Info */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                {data.name}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                <span className="size-1.5 rounded-full bg-purple-600" />
                Identity Review
              </span>
            </div>

            {/* Provider Type & Market Context */}
            {isSpa ? (
              <div className="space-y-0.5 text-xs">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-purple-600" />
                  <span>{data.businessName || 'Serenity Wellness Spa'}</span>
                  <span className="font-mono text-purple-700 font-semibold">({data.providerId})</span>
                </p>
                <p className="text-slate-500 font-medium">
                  {data.representative?.role || 'Business Owner / Authorized Representative'} • {data.market?.flag} {data.market?.name}
                </p>
              </div>
            ) : isHotel ? (
              <div className="space-y-0.5 text-xs">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Hotel className="size-3.5 text-purple-600" />
                  <span>{data.businessName || 'Savanna Wellness Resort'}</span>
                  <span className="font-mono text-purple-700 font-semibold">({data.providerId})</span>
                </p>
                <p className="text-slate-500 font-medium">
                  {data.representative?.role || 'Property Administrator'} • {data.market?.flag} {data.market?.name}
                </p>
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <span className="font-mono text-purple-700 font-semibold">{data.providerId || 'PR-82941'}</span>
                <span>•</span>
                <span>{data.type || 'Massage Therapist'}</span>
                <span>•</span>
                <span>{data.market?.flag || '🇰🇪'} {data.market?.name || 'Kenya'}</span>
              </p>
            )}

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
              alt={data.assignedTo || 'Reviewer'}
              className="size-6 rounded-full border border-purple-200 object-cover"
            />
            <span>
              Assigned to: <strong className="text-slate-900 font-semibold">{data.assignedTo || 'Jane Ochieng'}</strong>
            </span>
          </div>

          <span className="text-[11px] font-medium text-slate-400">
            Version {data.version || 2} Current
          </span>
        </div>
      </div>

      {/* RIGHT PANEL: Identity Verification Snapshot (Col span 6) */}
      <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-purple-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900">
              Identity Verification
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Primary Legal Verification
          </span>
        </div>

        {/* 5-Column Metric Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          {/* Submitted Name */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
            <p className="text-[11px] font-medium text-slate-500">Submitted Name</p>
            <p className="text-xs font-bold text-slate-900 truncate mt-0.5" title={data.name}>
              {data.name}
            </p>
          </div>

          {/* Document Type */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
            <p className="text-[11px] font-medium text-slate-500">Document Type</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5">
              {data.document?.type || 'National ID'}
            </p>
          </div>

          {/* Market */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
            <p className="text-[11px] font-medium text-slate-500">Market</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1">
              <span>{data.market?.flag || '🇰🇪'}</span>
              <span>{data.market?.name || 'Kenya'}</span>
            </p>
          </div>

          {/* Submitted Time */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
            <p className="text-[11px] font-medium text-slate-500">Submitted</p>
            <p className="text-xs font-semibold text-slate-800 mt-0.5">
              12 Sep 2026 10:42 AM
            </p>
          </div>

          {/* Current Status */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 col-span-2 sm:col-span-2">
            <p className="text-[11px] font-medium text-slate-500">Current Status</p>
            <div className="mt-1">
              {getStatusBadge(data.status)}
            </div>
          </div>
        </div>

        {/* Audit notice */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-purple-50/50 border border-purple-100/60 rounded-xl px-3 py-1.5">
          <Shield className="size-3.5 text-purple-600 shrink-0" />
          <span>Biometric & statutory cross-check enabled. Access is logged.</span>
        </div>
      </div>
    </div>
  )
}
