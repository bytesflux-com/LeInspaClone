import { useState } from 'react'
import {
  User,
  Fingerprint,
  Briefcase,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Building2,
  FileText,
  Eye,
  EyeOff,
  Edit2,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react'

export function PersonalInfoCard({
  profile,
  onOpenFullInfo,
  onOpenEdit,
  onShowToast,
  canRevealPii = true,
}) {
  const [revealed, setRevealed] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  if (!profile) return null

  const isSpa = profile.entityType === 'spa'
  const isHotel = profile.entityType === 'hotel_resort'
  const isBusiness = isSpa || isHotel

  const info = isBusiness ? profile.businessInfo : profile.personalInfo

  const handleCopy = (text, field) => {
    navigator.clipboard?.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
    onShowToast?.(`${field} copied`)
  }

  const maskPhone = (phone) => {
    if (!phone) return '+254 ••• ••• •••'
    if (revealed) return phone
    return phone.replace(/(\+\d{3}\s?\d{2})\d{3}(\d{3})/, '$1 ••• •••')
  }

  const maskEmail = (email) => {
    if (!email) return '•••@example.com'
    if (revealed) return email
    const parts = email.split('@')
    if (parts.length < 2) return email
    return `${parts[0].slice(0, 3)}•••@${parts[1]}`
  }

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              {isBusiness ? <Building2 className="size-4" /> : <User className="size-4" />}
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              {isBusiness ? 'Business Information' : 'Personal Information'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onOpenEdit}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 px-2 py-1 rounded-md transition"
          >
            <Edit2 className="size-3" /> Edit
          </button>
        </div>

        {/* Data Rows */}
        <div className="divide-y divide-slate-50 text-xs py-2 space-y-2">
          {/* Full Name / Business Name */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <User className="size-3.5 text-slate-400" />
              <span>{isBusiness ? 'Business Name' : 'Full Name'}</span>
            </span>
            <span className="font-semibold text-slate-900 text-right truncate max-w-[180px]">
              {info?.businessName || info?.fullName || profile.name}
            </span>
          </div>

          {/* Provider ID */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Fingerprint className="size-3.5 text-slate-400" />
              <span>Provider ID</span>
            </span>
            <div className="flex items-center gap-1">
              <span className="font-mono font-semibold text-purple-800">
                {info?.providerId || profile.id}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(info?.providerId || profile.id, 'ID')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                {copiedField === 'ID' ? (
                  <Check className="size-3 text-emerald-600" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>
          </div>

          {/* Provider Type */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Briefcase className="size-3.5 text-slate-400" />
              <span>Provider Type</span>
            </span>
            <span className="font-medium text-slate-800">
              {info?.providerType || profile.providerType}
            </span>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Mail className="size-3.5 text-slate-400" />
              <span>Email</span>
            </span>
            <div className="flex items-center gap-1">
              <span className="font-medium text-slate-800 truncate max-w-[150px]">
                {maskEmail(info?.email)}
              </span>
              {canRevealPii && (
                <button
                  type="button"
                  onClick={() => setRevealed(!revealed)}
                  title={revealed ? 'Mask Sensitive PII' : 'Reveal Sensitive PII'}
                  className="text-slate-400 hover:text-purple-700 p-0.5"
                >
                  {revealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </button>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Phone className="size-3.5 text-slate-400" />
              <span>Phone</span>
            </span>
            <span className="font-medium text-slate-800 font-mono">
              {maskPhone(info?.phone)}
            </span>
          </div>

          {/* Country */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Globe className="size-3.5 text-slate-400" />
              <span>Country</span>
            </span>
            <span className="font-medium text-slate-800">
              {info?.country || profile.market}
            </span>
          </div>

          {/* City */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <MapPin className="size-3.5 text-slate-400" />
              <span>City</span>
            </span>
            <span className="font-medium text-slate-800">
              {info?.city || profile.city}
            </span>
          </div>

          {/* Account Created */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Calendar className="size-3.5 text-slate-400" />
              <span>Account Created</span>
            </span>
            <span className="font-medium text-slate-800">
              {info?.accountCreated || profile.joinedDate}
            </span>
          </div>

          {/* Extra registration PIN if Business */}
          {isBusiness && info?.taxPin && (
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FileText className="size-3.5 text-slate-400" />
                <span>Tax PIN</span>
              </span>
              <span className="font-mono font-medium text-slate-800">
                {info.taxPin}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={onOpenFullInfo}
          className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 transition py-1.5 rounded-lg hover:bg-purple-50"
        >
          <span>View Full Information</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

