import { Award, Calendar, CheckCircle2, AlertTriangle, Sparkles, Tag, ShieldCheck } from 'lucide-react'

/**
 * ADM-033: CredentialRequirementCard
 * Displays requirement mapping, validity & expiry tracker, and eligible services unlocked.
 */
export default function CredentialRequirementCard({
  requirementsMapping,
  onRequestRenewal,
}) {
  if (!requirementsMapping) return null

  const {
    requiredFor = 'Massage Therapist Verification',
    marketName = 'Kenya',
    marketFlag = '🇰🇪',
    ruleTitle = 'Professional Massage Therapy Qualification',
    ruleStatus = 'Required',
    eligibleServices = ['Swedish Massage', 'Deep Tissue Massage', 'Sports Massage'],
    validity = {
      issueDate: '15 Jan 2024',
      expiryDate: '15 Jan 2028',
      remainingTime: '1 year 4 months',
      isCurrent: true,
      isExpiringSoon: false,
    },
  } = requirementsMapping

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
            <Award className="size-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Credential Requirement & Validity</h3>
            <p className="text-[11px] text-slate-400">Rule compliance and eligible service mapping</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-[#6D28D9]">
          Tier-1 Standard
        </span>
      </div>

      {/* 1. Requirement Details */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2 text-xs">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Required For</span>
            <p className="font-bold text-slate-900">{requiredFor}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-100/70 px-2 py-0.5 text-[10px] font-bold text-purple-800">
            {ruleStatus}
          </span>
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[11px]">
          <span className="text-slate-500">Market Mandate:</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1">
            <span>{marketFlag}</span>
            <span>{marketName}</span>
          </span>
        </div>

        <div className="text-[11px]">
          <span className="text-slate-500">Rule: </span>
          <span className="font-medium text-slate-800">{ruleTitle}</span>
        </div>
      </div>

      {/* 2. Validity & Expiry Tracker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="size-3.5 text-purple-600" />
            <span>Validity & Expiry Tracker</span>
          </span>

          {validity.isExpiringSoon ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
              <AlertTriangle className="size-3 text-amber-600" />
              Expiring Soon
            </span>
          ) : validity.isCurrent ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <CheckCircle2 className="size-3 text-emerald-600" />
              Current
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
              Expired
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
          <div>
            <span className="text-[10px] font-medium text-slate-400 uppercase">Issued</span>
            <p className="font-semibold text-slate-800">{validity.issueDate || '15 Jan 2024'}</p>
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400 uppercase">Expires</span>
            <p className="font-semibold text-slate-800">{validity.expiryDate || '15 Jan 2028'}</p>
          </div>
          <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Remaining Period:</span>
            <span className="font-bold text-emerald-800 font-mono text-xs">{validity.remainingTime || '1 year 4 months'}</span>
          </div>
        </div>

        {validity.isExpiringSoon && (
          <button
            type="button"
            onClick={onRequestRenewal}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 shadow-2xs transition cursor-pointer"
          >
            Request Renewal Notice
          </button>
        )}
      </div>

      {/* 3. Eligible Services Mapping */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-purple-600" />
            <span>Eligible Services Mapping</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {eligibleServices.length} Services Unlocked
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {eligibleServices.map((service) => (
            <span
              key={service}
              className="inline-flex items-center gap-1 rounded-lg border border-purple-100 bg-purple-50/70 px-2.5 py-1 text-[11px] font-semibold text-purple-900"
            >
              <CheckCircle2 className="size-3 text-emerald-600" />
              <span>{service}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
