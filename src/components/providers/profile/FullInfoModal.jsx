import { X, User, Building2, MapPin, Phone, Mail, FileText, Calendar, ShieldCheck } from 'lucide-react'

export function FullInfoModal({
  isOpen,
  profile,
  onClose,
}) {
  if (!isOpen || !profile) return null

  const isSpa = profile.entityType === 'spa'
  const isHotel = profile.entityType === 'hotel_resort'
  const isBusiness = isSpa || isHotel
  const info = isBusiness ? profile.businessInfo : profile.personalInfo

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="size-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            {isBusiness ? <Building2 className="size-5" /> : <User className="size-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isBusiness ? 'Full Business Record' : 'Full Personal Information'}
            </h3>
            <p className="text-xs text-slate-500">
              Provider: <strong className="text-slate-800">{profile.name}</strong> ({profile.id})
            </p>
          </div>
        </div>

        {/* Detailed Data */}
        <div className="mt-4 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10.5px]">Legal Name</span>
              <span className="font-bold text-slate-900 text-xs">
                {info?.businessName || info?.fullName || profile.name}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10.5px]">Provider Identifier</span>
              <span className="font-mono font-bold text-purple-800 text-xs">
                {profile.id}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10.5px]">Primary Email</span>
              <span className="font-medium text-slate-800 text-xs">{info?.email}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10.5px]">Direct Telephone</span>
              <span className="font-mono font-medium text-slate-800 text-xs">{info?.phone}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10.5px]">Market & Jurisdiction</span>
              <span className="font-medium text-slate-800 text-xs">{profile.market} ({profile.marketCode})</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10.5px]">City / Municipality</span>
              <span className="font-medium text-slate-800 text-xs">{profile.city}</span>
            </div>
          </div>

          {info?.address && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10.5px]">Physical Location / Base Address</span>
              <span className="font-medium text-slate-800 text-xs">{info.address}</span>
            </div>
          )}

          {isBusiness && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10.5px]">Tax Identification (PIN)</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{info?.taxPin || 'P051928190Z'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10.5px]">Company Registration No</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{info?.businessRegNo || 'CPR/2023/892019'}</span>
              </div>
            </div>
          )}

          {!isBusiness && info?.dateOfBirth && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10.5px]">Date of Birth</span>
                <span className="font-medium text-slate-800 text-xs">{info.dateOfBirth}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10.5px]">Emergency Contact</span>
                <span className="font-medium text-slate-800 text-xs">{info.emergencyContact}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition"
          >
            Close Record
          </button>
        </div>
      </div>
    </div>
  )
}

