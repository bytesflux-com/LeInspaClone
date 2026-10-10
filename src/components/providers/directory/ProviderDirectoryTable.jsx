import { Star, Check, AlertCircle, ArrowRight, ShieldCheck, Clock, Ban } from 'lucide-react'

export function ProviderDirectoryTable({
  providers = [],
  selectedIds = [],
  activeProviderId = null,
  onSelectRow,
  onSelectAll,
  onOpenPreview,
  loading = false,
}) {
  const isAllSelected = providers.length > 0 && selectedIds.length === providers.length

  const getVerificationBadge = (verification, label) => {
    switch (verification) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
            {label || 'Verified'}
          </span>
        )
      case 'pending_review':
      case 'documents_review':
      case 'content_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            {label || 'Pending Review'}
          </span>
        )
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" />
            {label || 'Changes Requested'}
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <Ban className="w-3 h-3 text-rose-600" />
            {label || 'Rejected'}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {label || 'Pending'}
          </span>
        )
    }
  }

  const getAvailabilityBadge = (p) => {
    if (p.locationCount && p.locationCount > 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          {p.locationBadge || `${p.locationCount} Locations`}
        </span>
      )
    }

    switch (p.availability) {
      case 'available_now':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Available Now
          </span>
        )
      case 'open_now':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Open Now
          </span>
        )
      case 'unavailable':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            Unavailable
          </span>
        )
    }
  }

  const getStatusBadge = (status, label) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            {label || 'Active'}
          </span>
        )
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
            {label || 'Under Review'}
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            {label || 'Pending'}
          </span>
        )
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            {label || 'Suspended'}
          </span>
        )
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            {label || 'Inactive'}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-4 shadow-xs">
        <div className="h-6 bg-slate-100 rounded w-1/4 animate-pulse" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (providers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Providers Found</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          No providers match your current search and filter combination. Try resetting your filters or adjusting your search term.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-3.5 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-3 min-w-[200px]">Provider</th>
              <th className="py-3 px-3 min-w-[140px]">Type</th>
              <th className="py-3 px-3 min-w-[140px]">Market</th>
              <th className="py-3 px-3 min-w-[130px]">Verification</th>
              <th className="py-3 px-3 min-w-[130px]">Availability</th>
              <th className="py-3 px-3 min-w-[80px]">Rating</th>
              <th className="py-3 px-3 min-w-[90px]">Bookings</th>
              <th className="py-3 px-3 min-w-[110px]">Status</th>
              <th className="py-3 px-3.5 text-right min-w-[90px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {providers.map((p) => {
              const isSelected = selectedIds.includes(p.id)
              const isDrawerActive = activeProviderId === p.id
              return (
                <tr
                  key={p.id}
                  onClick={() => onOpenPreview(p)}
                  className={`cursor-pointer transition-colors hover:bg-purple-50/40 ${
                    isDrawerActive
                      ? 'bg-purple-50/70 border-l-4 border-l-purple-600'
                      : isSelected
                      ? 'bg-purple-50/30'
                      : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td
                    className="py-3 px-3.5"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectRow(p.id)
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectRow(p.id)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </td>

                  {/* Provider Name, ID, Avatar */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.verification === 'verified' && (
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono bg-slate-100 text-slate-700 px-1 rounded text-[10px]">
                            {p.id}
                          </span>
                          {p.contentAttention && (
                            <span
                              title={p.contentAttention}
                              className="text-amber-600 font-medium truncate max-w-[120px]"
                            >
                              • {p.contentAttention}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {p.typeLabel}
                  </td>

                  {/* Market & City */}
                  <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{p.flag}</span>
                      <span>
                        {p.city}, {p.market}
                      </span>
                    </div>
                  </td>

                  {/* Verification */}
                  <td className="py-3 px-3">
                    {getVerificationBadge(p.verification, p.verificationLabel)}
                  </td>

                  {/* Availability */}
                  <td className="py-3 px-3">
                    {getAvailabilityBadge(p)}
                  </td>

                  {/* Rating */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1 font-semibold text-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{p.rating}</span>
                    </div>
                  </td>

                  {/* Bookings */}
                  <td className="py-3 px-3 font-semibold text-slate-700">
                    {Number(p.bookings).toLocaleString()}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    {getStatusBadge(p.status, p.statusLabel)}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenPreview(p)
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-100/60 rounded-md transition"
                    >
                      {p.status === 'pending' || p.status === 'under_review' ? 'Review' : 'View'}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

