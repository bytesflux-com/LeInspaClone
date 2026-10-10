import { useState } from 'react'
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Check,
  Building2,
  Users,
  DoorOpen,
} from 'lucide-react'

export function ServiceDetailDrawer({
  service,
  onClose,
  onOpenModeration,
  onToggleStatus,
  onShowToast,
  providerType = 'individual',
}) {
  const [activeSubTab, setActiveSubTab] = useState('overview') // 'overview', 'pricing', 'availability', 'reviews'

  if (!service) return null

  const isSpa = providerType === 'spa'
  const isHotel = providerType === 'hotel_resort'

  const hasPending =
    service.approvalStatus === 'pending_review' ||
    service.reviewStatus === 'changes_pending' ||
    service.hasPendingChanges

  const proposed = service.proposedChanges || {}
  const alert = service.pricingAlerts || null

  return (
    <aside className="w-full xl:w-[420px] shrink-0 bg-white border border-slate-200 rounded-2xl shadow-lg flex flex-col max-h-[calc(100vh-140px)] sticky top-20 overflow-hidden animate-in slide-in-from-right-4">
      {/* 1. Header with Hero Image Banner */}
      <div className="relative p-4 border-b border-slate-200 bg-slate-50/70">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 p-1 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 transition shadow-xs"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-8">
          <img
            src={
              service.image ||
              'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200'
            }
            alt={service.name}
            className="size-16 rounded-xl object-cover border-2 border-white shadow-md shrink-0"
          />
          <div className="min-w-0 space-y-1">
            <h3 className="font-bold text-slate-900 text-base leading-snug truncate">
              {service.name}
            </h3>
            <p className="font-mono text-xs text-purple-700 font-semibold">
              {service.serviceId || service.id}
            </p>

            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {service.active || service.status === 'active' ? 'Active' : 'Inactive'}
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                  hasPending
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {hasPending ? <Clock className="size-3 text-amber-600" /> : <CheckCircle2 className="size-3 text-emerald-600" />}
                <span>{hasPending ? 'Pending Review' : 'Approved'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Row */}
        <div className="flex border-b border-slate-200/80 -mb-4 mt-3 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'pricing', label: 'Pricing' },
            { id: 'availability', label: 'Availability' },
            { id: 'reviews', label: 'Reviews' },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex-1 py-2 text-center border-b-2 transition ${
                  isActive
                    ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Scrollable Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* OVERVIEW SUB-TAB */}
        {activeSubTab === 'overview' && (
          <>
            {/* Service Information Box */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Service Information
                </h4>
                <button
                  type="button"
                  onClick={() => onShowToast?.('Service editing restricted to verified provider flow')}
                  className="text-[11px] font-semibold text-purple-700 hover:underline"
                >
                  Edit (Restricted)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11.5px] border-t border-slate-100 pt-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Service ID</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {service.serviceId || service.id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Category</span>
                  <span className="font-semibold text-slate-800">
                    {service.category || 'Massage'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Duration</span>
                  <span className="font-semibold text-slate-800">
                    {service.duration || '60 minutes'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Standard Price</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {service.price}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[10px] mb-1">Description</span>
                <p className="text-slate-700 leading-relaxed text-[11.5px] bg-white p-2 rounded-lg border border-slate-100">
                  {service.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-1">
                <span>Created: {service.createdDate || '12 Jan 2026'}</span>
                <span>Last Updated: {service.lastUpdated || '10 Sep 2026'}</span>
              </div>
            </div>

            {/* Service Images Grid */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Service Images
                </h4>
                <button
                  type="button"
                  onClick={() => onShowToast?.('Opening Service Media Gallery')}
                  className="text-[11px] font-semibold text-purple-700 hover:underline"
                >
                  View All (4) →
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {(service.images || [
                  service.image,
                  'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=200',
                  'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=200',
                ]).slice(0, 3).map((imgUrl, i) => (
                  <img
                    key={i}
                    src={imgUrl}
                    alt="Service thumbnail"
                    className="size-18 rounded-xl object-cover border border-slate-200"
                  />
                ))}
                <div
                  onClick={() => onShowToast?.('Viewing all 4 high-res photos')}
                  className="size-18 rounded-xl bg-slate-900 text-white font-bold flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition"
                >
                  <span className="text-sm">+1</span>
                  <span className="text-[9px] text-slate-300">More</span>
                </div>
              </div>
            </div>

            {/* Service Availability Box */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Service Availability
                </h4>
                <button
                  type="button"
                  onClick={() => onShowToast?.('Availability rules managed via provider portal')}
                  className="text-[11px] font-semibold text-purple-700 hover:underline"
                >
                  Edit (Restricted)
                </button>
              </div>

              <div className="space-y-1.5 text-[11.5px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-bold text-emerald-700">🟢 Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Available Days</span>
                  <span className="font-medium text-slate-800">
                    {service.availabilityConfig?.availableDays || 'Mon – Sat'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking Duration</span>
                  <span className="font-medium text-slate-800">
                    {service.availabilityConfig?.bookingDuration || '60 minutes'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Buffer Time</span>
                  <span className="font-medium text-slate-800">
                    {service.availabilityConfig?.bufferTime || '15 minutes'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service Mode</span>
                  <span className="font-semibold text-emerald-700 text-right">
                    ✓ Home Service • ✓ Provider Location
                  </span>
                </div>
              </div>

              {/* Spa / Hotel specific dependencies */}
              {(isSpa || isHotel) && (
                <div className="mt-2 p-2 rounded-lg bg-purple-50 border border-purple-100 text-[10.5px] text-purple-900 leading-tight">
                  ℹ️ Bookable slots depend on available Branch + Staff + Room capacity.
                </div>
              )}
            </div>

            {/* Content Review Checklist */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Content Review
                </h4>
                {hasPending && (
                  <button
                    type="button"
                    onClick={() => onOpenModeration?.(service)}
                    className="text-[11px] font-bold text-purple-700 hover:underline"
                  >
                    Moderate →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Service Name</span>
                  <span className="text-emerald-700 font-bold">✓ Approved</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Description</span>
                  <span className="text-emerald-700 font-bold">✓ Approved</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Price</span>
                  <span className="text-emerald-700 font-bold">✓ Valid</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Category</span>
                  <span className="text-emerald-700 font-bold">✓ Approved</span>
                </div>
                <div className="col-span-2 flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600">Service Image</span>
                  <span
                    className={`font-bold ${
                      service.contentReview?.serviceImage === 'Pending Review'
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {service.contentReview?.serviceImage === 'Pending Review'
                      ? '🟠 Pending Review'
                      : '✓ Approved'}
                  </span>
                </div>
              </div>

              {/* Proposed Changes Diff View */}
              {proposed?.newDescription && (
                <div className="mt-3 p-3 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                    <Clock className="size-3.5 text-amber-600" />
                    <span>Proposed Description Update</span>
                  </div>
                  <div className="text-[10.5px] space-y-1">
                    <p className="text-slate-500 line-through">
                      "{proposed.currentDescription}"
                    </p>
                    <p className="text-slate-900 font-medium">
                      "{proposed.newDescription}"
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-amber-200/60">
                    <button
                      type="button"
                      onClick={() => onOpenModeration?.(service)}
                      className="px-3 py-1 bg-purple-700 text-white rounded-lg font-bold text-[11px] shadow-xs hover:bg-purple-800 transition"
                    >
                      Review Proposed Changes →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* PRICING SUB-TAB */}
        {activeSubTab === 'pricing' && (
          <div className="space-y-3.5">
            {/* Standard Price */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
              <span className="text-slate-400 text-[10.5px]">Standard Public Price</span>
              <p className="text-xl font-black text-slate-900 font-mono">
                {service.price}
              </p>
              <p className="text-[10px] text-slate-500">
                Includes platform escrow custody and standard booking deposit guarantee.
              </p>
            </div>

            {/* Pricing Alerts */}
            {alert && (
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-2.5 text-xs text-amber-950">
                <ShieldAlert className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{alert.title || 'Pricing Alert'}</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">{alert.message}</p>
                </div>
              </div>
            )}

            {/* Branch Overrides (If Spa) */}
            {service.businessConfig?.branchPriceOverrides?.length > 0 && (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
                  Branch Price Overrides
                </span>
                <div className="divide-y divide-slate-100 text-xs">
                  {service.businessConfig.branchPriceOverrides.map((ov, i) => (
                    <div key={i} className="py-2 flex items-center justify-between">
                      <span className="font-medium text-slate-700">{ov.branchName}</span>
                      <span className="font-bold text-purple-900 font-mono">{ov.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Change History Table */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
                Price Change History
              </span>
              <div className="divide-y divide-slate-100 text-[11px]">
                {(service.priceHistory || [
                  { effectiveDate: '10 Sep 2026', previousPrice: 'KES 4,000', newPrice: 'KES 4,500', changedBy: 'Provider' },
                  { effectiveDate: '01 Jun 2026', previousPrice: 'KES 3,500', newPrice: 'KES 4,000', changedBy: 'Provider' },
                ]).map((h, i) => (
                  <div key={i} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{h.effectiveDate}</p>
                      <p className="text-[10px] text-slate-400">By {h.changedBy}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-900">{h.newPrice}</p>
                      <p className="text-[10px] text-slate-400 line-through">{h.previousPrice}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AVAILABILITY SUB-TAB */}
        {activeSubTab === 'availability' && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-800 text-xs">Booking Dispatch Engine Rules</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Service visibility is live on client search when marked active. Client slot reservation
                is validated through Lé Inspa’s real-time conflict avoidance engine.
              </p>
            </div>

            {/* If Spa: Show Branch & Staff assignments */}
            {isSpa && service.businessConfig && (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                <span className="font-bold text-slate-800 block">Connected Spa Resources</span>
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-purple-600" />
                    <span>Branches: {service.businessConfig.assignedBranches?.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="size-3.5 text-purple-600" />
                    <span>Staff: {service.businessConfig.assignedStaff?.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DoorOpen className="size-3.5 text-purple-600" />
                    <span>Resources: {service.businessConfig.roomsResources?.join(', ')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS SUB-TAB */}
        {activeSubTab === 'reviews' && (
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
            <h4 className="font-bold text-slate-800">Verified Client Reviews for {service.name}</h4>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex justify-between font-semibold text-slate-900">
                <span>James K.</span>
                <span className="text-amber-500">★★★★★ 5.0</span>
              </div>
              <p className="text-slate-600 italic">
                "The deep pressure technique relieved my lumbar pain completely. Very professional."
              </p>
              <span className="text-[10px] text-slate-400">2 days ago</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Action Buttons */}
      <div className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2">
        <button
          type="button"
          onClick={() => onShowToast?.(`Opening ${service.name} in client mobile app preview`)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
        >
          <span>View on Client App</span>
          <ExternalLink className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onShowToast?.(`Opening booking history for ${service.name}`)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <Calendar className="size-3.5" />
          <span>View Booking History</span>
        </button>
      </div>
    </aside>
  )
}

