import { useState } from 'react'
import {
  X,
  Copy,
  Check,
  Star,
  ExternalLink,
  ShieldCheck,
  Calendar,
  CreditCard,
  AlertTriangle,
  Building2,
  Flower2,
  ChevronRight,
  Settings,
  Clock,
  UserCheck,
  BadgeAlert,
  FileCheck,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react'
import { Link } from 'react-router'

export function QuickProviderPreviewDrawer({
  provider = null,
  onClose,
  onOpenAccountActions,
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const [copied, setCopied] = useState(false)

  if (!provider) return null

  const handleCopyId = () => {
    navigator.clipboard?.writeText(provider.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isSpa = provider.entityType === 'spa' || provider.typeId === 'spa'
  const isHotel = provider.entityType === 'hotel_resort' || provider.typeId === 'hotel_resort'
  const isIndividual = !isSpa && !isHotel

  return (
    <aside className="w-full xl:w-[410px] shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col max-h-[calc(100vh-140px)] sticky top-20 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 flex items-start justify-between gap-3 bg-slate-50/60">
        <div className="flex items-start gap-3 min-w-0">
          <img
            src={provider.avatar}
            alt={provider.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 truncate text-base">
                {provider.name}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                  provider.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : provider.status === 'suspended'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : provider.status === 'under_review'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    provider.status === 'active'
                      ? 'bg-emerald-500'
                      : provider.status === 'suspended'
                      ? 'bg-rose-500'
                      : provider.status === 'under_review'
                      ? 'bg-purple-500'
                      : 'bg-amber-500'
                  }`}
                />
                {provider.statusLabel || provider.status}
              </span>
            </div>

            {/* Provider ID & Copy */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <span className="font-mono font-medium text-slate-700">{provider.id}</span>
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy Provider ID"
                className="text-slate-400 hover:text-slate-600 transition"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="text-xs text-slate-600 font-medium mt-0.5">
              {provider.typeLabel}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <span>{provider.flag}</span>
                <span>
                  {provider.city}, {provider.market}
                </span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{provider.rating}</span>
                <span className="font-normal text-slate-400">
                  ({provider.reviewCount} reviews)
                </span>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-4 bg-white text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'verification', label: 'Verification' },
          { id: 'services', label: 'Services' },
          { id: 'bookings', label: 'Bookings' },
        ].map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-3 border-b-2 transition-colors ${
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

      {/* Tab Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* 4 Stats Cards */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/40 text-center">
                <div className="text-base font-bold text-blue-900">
                  {provider.activity?.totalBookings || provider.bookings}
                </div>
                <div className="text-[10px] text-blue-700 font-medium">Total Bookings</div>
              </div>
              <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/40 text-center">
                <div className="text-base font-bold text-amber-900">
                  {provider.activity?.upcomingBookings || 12}
                </div>
                <div className="text-[10px] text-amber-700 font-medium">Upcoming</div>
              </div>
              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/40 text-center">
                <div className="text-base font-bold text-emerald-900">
                  {provider.activity?.completionRate || '96%'}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium">Completion</div>
              </div>
              <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/40 text-center">
                <div className="text-base font-bold text-rose-900">
                  {provider.activity?.cancellationRate || '2.1%'}
                </div>
                <div className="text-[10px] text-rose-700 font-medium">Cancellation</div>
              </div>
            </div>

            {/* Business Structure (If Spa or Hotel) */}
            {isSpa && provider.businessStructure && (
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Flower2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Spa Structure</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <div className="font-bold text-slate-900">{provider.businessStructure.branches}</div>
                    <div className="text-[10px] text-slate-500">Branches</div>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <div className="font-bold text-slate-900">{provider.businessStructure.staff}</div>
                    <div className="text-[10px] text-slate-500">Staff</div>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <div className="font-bold text-slate-900">{provider.businessStructure.services}</div>
                    <div className="text-[10px] text-slate-500">Services</div>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <div className="font-bold text-slate-900">{provider.businessStructure.resources}</div>
                    <div className="text-[10px] text-slate-500">Rooms/Beds</div>
                  </div>
                </div>
              </div>
            )}

            {isHotel && provider.hotelStructure && (
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Resort Structure</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <div className="font-bold text-slate-900">{provider.hotelStructure.locations}</div>
                    <div className="text-[10px] text-slate-500">Locations</div>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <div className="font-bold text-slate-900">{provider.hotelStructure.departments}</div>
                    <div className="text-[10px] text-slate-500">Depts</div>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <div className="font-bold text-slate-900">{provider.hotelStructure.services}</div>
                    <div className="text-[10px] text-slate-500">Services</div>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <div className="font-bold text-slate-900">{provider.hotelStructure.therapists}</div>
                    <div className="text-[10px] text-slate-500">Therapists</div>
                  </div>
                </div>
              </div>
            )}

            {/* Availability */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-700">Availability</div>
                <button
                  type="button"
                  className="text-purple-700 hover:text-purple-900 font-semibold inline-flex items-center gap-0.5"
                >
                  View Schedule <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    provider.availability === 'available_now' || provider.availability === 'open_now'
                      ? 'bg-emerald-500'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="font-semibold text-slate-900">
                  {provider.availabilityLabel || 'Available Now'}
                </span>
              </div>
              <div className="text-slate-500 text-[11px]">
                {provider.operatingHours
                  ? provider.operatingHours
                  : `Next available: ${provider.nextAvailable || 'Today • 3:30 PM'}`}
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
              <div className="font-bold text-slate-700">Verification</div>
              <div className="space-y-1.5">
                {provider.verificationChecklist ? (
                  Object.entries(provider.verificationChecklist).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-0.5">
                      <span className="capitalize text-slate-600">
                        {k.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                          v.toLowerCase().includes('approved')
                            ? 'text-emerald-700'
                            : v.toLowerCase().includes('review')
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {v.toLowerCase().includes('approved') && (
                          <Check className="w-3 h-3 text-emerald-600" />
                        )}
                        {v}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-600">Identity Verification</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                        <Check className="w-3 h-3" /> Approved
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-600">Professional Credentials</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                        <Check className="w-3 h-3" /> Approved
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-600">Profile Information</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                        <Check className="w-3 h-3" /> Approved
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-600">Profile Photo</span>
                      <span className="text-amber-700 font-semibold text-[11px]">
                        🟠 Awaiting Review
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Subscription */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-700">Subscription</div>
                <button
                  type="button"
                  className="text-purple-700 hover:text-purple-900 font-semibold inline-flex items-center gap-0.5"
                >
                  View Subscription <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">
                    {provider.subscriptionPlan || 'Professional Plan'}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Next renewal: {provider.subscriptionRenewal || '12 Oct 2026'}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
            </div>

            {/* Account Health */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
              <div className="font-bold text-slate-700">Account Health</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500">Account Status</div>
                  <div className="font-bold text-emerald-700 text-xs mt-0.5">
                    {provider.accountHealth?.status || 'Active'}
                  </div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500">Safety Cases</div>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">
                    {provider.accountHealth?.openSafetyCases ?? 0}
                  </div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500">Restrictions</div>
                  <div className="font-bold text-slate-800 text-xs mt-0.5 truncate">
                    {provider.accountHealth?.activeRestrictions || 'None'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-1">
              <Link
                to={`/providers/${provider.id}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-lg transition shadow-xs"
              >
                Open Full Provider Profile <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link
                  to={`/verifications?providerId=${provider.id}`}
                  className="p-2 text-center rounded-lg border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  View Verification
                </Link>
                <Link
                  to={`/bookings?providerId=${provider.id}`}
                  className="p-2 text-center rounded-lg border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  View Bookings
                </Link>
                <Link
                  to={`/withdrawals?providerId=${provider.id}`}
                  className="p-2 text-center rounded-lg border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  View Earnings
                </Link>
                <Link
                  to={`/support?providerId=${provider.id}`}
                  className="p-2 text-center rounded-lg border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  View Support & Safety
                </Link>
              </div>

              <button
                type="button"
                onClick={() => onOpenAccountActions(provider)}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                Account Actions
              </button>
            </div>
          </>
        )}

        {/* VERIFICATION TAB */}
        {activeTab === 'verification' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="font-bold text-slate-900 mb-1">Verification Status</div>
              <div className="text-slate-500 text-[11px] mb-3">
                Review verified documents and audit credentials submitted by this provider.
              </div>

              <div className="space-y-2">
                {[
                  { name: 'National ID / Passport Scan', status: 'Approved', date: '12 Sep 2026' },
                  { name: 'Professional Licencing Certificate', status: 'Approved', date: '14 Sep 2026' },
                  { name: 'Criminal Background Check Clearance', status: 'Approved', date: '15 Sep 2026' },
                  { name: 'Current Health & First Aid Certification', status: 'Approved', date: '16 Sep 2026' },
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{doc.name}</div>
                      <div className="text-[10px] text-slate-400">Verified on {doc.date}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <Check className="w-3 h-3" /> {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs transition"
              >
                Approve Verification
              </button>
              <button
                type="button"
                className="flex-1 py-2 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg font-medium text-xs transition"
              >
                Request Re-submission
              </button>
            </div>
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="space-y-3 text-xs">
            <div className="font-bold text-slate-900">Configured Services Catalog</div>
            <div className="space-y-2">
              {provider.services?.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{s.name}</div>
                    <div className="text-[11px] text-slate-500">{s.duration}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{s.price}</div>
                    <span className="text-[10px] text-emerald-600 font-medium">Active</span>
                  </div>
                </div>
              )) || (
                <div className="text-slate-500 text-center py-4">No services recorded</div>
              )}
            </div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="space-y-3 text-xs">
            <div className="font-bold text-slate-900">Recent Bookings Telemetry</div>
            <div className="space-y-2">
              {provider.recentBookings?.map((b) => (
                <div
                  key={b.id}
                  className="p-3 bg-white rounded-lg border border-slate-200 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-purple-700 font-semibold">{b.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {b.status}
                    </span>
                  </div>
                  <div className="font-medium text-slate-800">{b.service}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>{b.client} • {b.date}</span>
                    <span className="font-bold text-slate-900">{b.price}</span>
                  </div>
                </div>
              )) || (
                <div className="text-slate-500 text-center py-4">No recent bookings found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
