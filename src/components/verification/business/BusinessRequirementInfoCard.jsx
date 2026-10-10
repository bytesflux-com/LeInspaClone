import React from 'react'
import {
  ShieldAlert,
  FileCheck2,
  CheckCircle2,
  Sparkles,
  Info,
  Scale,
} from 'lucide-react'

/**
 * ADM-034: BusinessRequirementInfoCard
 * Explains regulatory mandate for this provider type and sovereign jurisdiction,
 * detailing enabled services upon business document validation.
 */
export default function BusinessRequirementInfoCard({
  requirementInfo = {
    mandateTitle: 'Nairobi City County Single Business Permit Mandate',
    legalReference: 'Nairobi City County Single Business Permit Act (2020) & Lé Inspa Platform Safety Policy',
    description:
      'All wellness facilities operating physical massage, hydrotherapy, sauna, or aesthetic treatment premises within Nairobi County must maintain an active Single Business Permit (SBP) displaying the designated wellness activity code.',
    eligibleServices: [
      'Therapeutic Massage & Body Treatments',
      'Hydrotherapy & Water Circuit Operations',
      'Sauna, Steam & Thermal Suites',
      'Facials, Skin Care & Esthetics',
    ],
  },
}) {
  const {
    mandateTitle,
    legalReference,
    description,
    eligibleServices = [],
  } = requirementInfo

  return (
    <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/60 to-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#6D28D9]">
          <Scale className="size-4.5 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{mandateTitle}</h3>
            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-[#6D28D9]">
              Mandatory Statutory Gate
            </span>
          </div>
          <p className="text-[11px] font-medium text-purple-700 mt-0.5">{legalReference}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 leading-relaxed">
        {description}
      </p>

      {/* Eligible Platform Services Upon Validation */}
      <div className="rounded-xl border border-purple-100 bg-white/90 p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-[#6D28D9]" />
            Enabled Platform Treatments & Operations
          </span>
          <span className="text-[10px] font-semibold text-emerald-700">4 Facility Categories</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {eligibleServices.map((service, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 font-medium border border-slate-100"
            >
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{service}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
