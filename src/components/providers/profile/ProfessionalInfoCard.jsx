import {
  Award,
  Clock,
  Home,
  MapPin,
  Languages,
  FileText,
  ChevronRight,
  Edit2,
  Flower2,
  Building2,
  Users,
  Layers,
  Sparkles,
  Package,
} from 'lucide-react'

export function ProfessionalInfoCard({
  profile,
  onOpenFullProfile,
  onOpenEdit,
  onSelectTab,
  onShowToast,
}) {
  if (!profile) return null

  const isSpa = profile.entityType === 'spa'
  const isHotel = profile.entityType === 'hotel_resort'
  const isIndividual = !isSpa && !isHotel

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              {isSpa ? (
                <Flower2 className="size-4" />
              ) : isHotel ? (
                <Building2 className="size-4" />
              ) : (
                <Award className="size-4" />
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              {isSpa
                ? 'Spa Operations'
                : isHotel
                ? 'Wellness Operations'
                : 'Professional Information'}
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

        {/* Content based on dynamic entity type */}
        {isIndividual && (
          <div className="divide-y divide-slate-50 text-xs py-2 space-y-2">
            {/* Specialization */}
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Award className="size-3.5 text-slate-400" />
                <span>Specialization</span>
              </span>
              <span className="font-semibold text-slate-900">
                {profile.professionalInfo?.specialization || 'Massage Therapy'}
              </span>
            </div>

            {/* Experience */}
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="size-3.5 text-slate-400" />
                <span>Experience</span>
              </span>
              <span className="font-medium text-slate-800">
                {profile.professionalInfo?.experience || '6 Years'}
              </span>
            </div>

            {/* Service Mode */}
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Home className="size-3.5 text-slate-400" />
                <span>Service Mode</span>
              </span>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                <span className="inline-flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  ✓ Home Service
                </span>
                <span className="inline-flex items-center gap-0.5 bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                  ✓ Provider Location
                </span>
              </div>
            </div>

            {/* Languages */}
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Languages className="size-3.5 text-slate-400" />
                <span>Languages</span>
              </span>
              <span className="font-medium text-slate-800">
                {profile.professionalInfo?.languages || 'English • Swahili'}
              </span>
            </div>

            {/* Professional Bio Preview */}
            <div className="py-1">
              <span className="text-slate-500 text-[11px] block mb-1">
                Professional Bio
              </span>
              <p className="text-slate-700 leading-relaxed text-[11.5px] line-clamp-3 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                {profile.professionalInfo?.bio ||
                  'Certified massage therapist specializing in deep tissue, Swedish and sports massage.'}
              </p>
            </div>
          </div>
        )}

        {/* Dynamic SPA Information */}
        {isSpa && (
          <div className="py-2 space-y-3 text-xs">
            {/* 4 Stat Boxes: Branches, Staff, Services, Resources */}
            <div className="grid grid-cols-4 gap-2 text-center pt-1">
              <div className="bg-purple-50/60 border border-purple-200/70 p-2 rounded-lg">
                <p className="text-base font-bold text-purple-900">
                  {profile.businessStructure?.branches || 3}
                </p>
                <p className="text-[10px] text-purple-700 font-medium">Branches</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <p className="text-base font-bold text-slate-900">
                  {profile.businessStructure?.staff || 18}
                </p>
                <p className="text-[10px] text-slate-600 font-medium">Staff</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <p className="text-base font-bold text-slate-900">
                  {profile.businessStructure?.services || 24}
                </p>
                <p className="text-[10px] text-slate-600 font-medium">Services</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                <p className="text-base font-bold text-slate-900">
                  {profile.businessStructure?.resources || 12}
                </p>
                <p className="text-[10px] text-slate-600 font-medium">Resources</p>
              </div>
            </div>

            {/* Branches List Preview */}
            <div className="space-y-1.5 pt-1">
              <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                Operating Branches
              </span>
              <div className="space-y-1">
                {(profile.businessStructure?.branchList || [
                  { name: 'Nairobi Flagship Hub', location: 'Westlands' },
                  { name: 'Karen Sanctuary', location: 'Marula Lane' },
                  { name: 'Gigiri Diplomatic Suite', location: 'UN Avenue' },
                ]).map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-1.5 rounded-md bg-slate-50/80 border border-slate-100 text-[11.5px]"
                  >
                    <span className="font-semibold text-slate-800">{b.name}</span>
                    <span className="text-slate-500 text-[11px]">{b.location}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Pills */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onShowToast?.('Opening Branches Manager')}
                className="flex-1 py-1 px-2 text-center text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-purple-100 hover:text-purple-900 rounded-md transition"
              >
                View Branches
              </button>
              <button
                type="button"
                onClick={() => onShowToast?.('Opening Staff Roster')}
                className="flex-1 py-1 px-2 text-center text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-purple-100 hover:text-purple-900 rounded-md transition"
              >
                View Staff
              </button>
            </div>
          </div>
        )}

        {/* Dynamic HOTEL Information */}
        {isHotel && (
          <div className="py-2 space-y-3 text-xs">
            {/* 5 Metrics: Locations, Departments, Staff, Services, Packages */}
            <div className="grid grid-cols-5 gap-1.5 text-center pt-1">
              <div className="bg-purple-50/60 border border-purple-200/70 p-1.5 rounded-lg">
                <p className="text-sm font-bold text-purple-900">
                  {profile.wellnessOperations?.wellnessLocations || 4}
                </p>
                <p className="text-[9px] text-purple-700 font-medium">Locations</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                <p className="text-sm font-bold text-slate-900">
                  {profile.wellnessOperations?.wellnessDepartments || 6}
                </p>
                <p className="text-[9px] text-slate-600 font-medium">Depts</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                <p className="text-sm font-bold text-slate-900">
                  {profile.wellnessOperations?.wellnessStaff || 32}
                </p>
                <p className="text-[9px] text-slate-600 font-medium">Staff</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                <p className="text-sm font-bold text-slate-900">
                  {profile.wellnessOperations?.activeServices || 18}
                </p>
                <p className="text-[9px] text-slate-600 font-medium">Services</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                <p className="text-sm font-bold text-slate-900">
                  {profile.wellnessOperations?.wellnessPackages || 7}
                </p>
                <p className="text-[9px] text-slate-600 font-medium">Packages</p>
              </div>
            </div>

            {/* Programs Preview */}
            <div className="space-y-1.5 pt-1">
              <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                Resort Wellness Programs
              </span>
              <div className="space-y-1">
                {(profile.wellnessOperations?.programs || [
                  'In-Room Wellness: 24/7 on-demand suite therapies',
                  'Concierge Wellness: Bespoke rejuvenation itineraries',
                  'Safari Recovery Ritual: Post-drive muscle recovery',
                ]).map((prog, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded-md bg-slate-50/80 border border-slate-100 text-[11px] text-slate-700 flex items-center gap-1.5"
                  >
                    <span className="size-1.5 rounded-full bg-purple-600 shrink-0" />
                    <span>{prog}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={onOpenFullProfile}
          className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 transition py-1.5 rounded-lg hover:bg-purple-50"
        >
          <span>
            {isSpa
              ? 'View Spa Operations'
              : isHotel
              ? 'View Wellness Operations'
              : 'View Full Profile'}
          </span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

