import React from 'react'
import {
  MapPin,
  Building,
  CheckCircle2,
  Navigation,
  ExternalLink,
} from 'lucide-react'

/**
 * ADM-034: BusinessAddressComparisonCard
 * Reconciles statutory registered corporate address against physical operating premises.
 */
export default function BusinessAddressComparisonCard({
  addressComparison = {
    registeredAddress: 'Delta Towers, 4th Floor, Chiromo Road, Westlands, Nairobi, P.O. Box 48192-00100',
    operatingAddress: 'Delta Towers, Ground Floor & Suite 102, Chiromo Road, Westlands, Nairobi',
    isMatch: true,
    matchNote: 'Premises Match Confirmed (Same Commercial Complex / Address Parcel)',
  },
}) {
  const { registeredAddress, operatingAddress, isMatch, matchNote } = addressComparison

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
            <MapPin className="size-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Address & Physical Facility Reconciliation
          </h3>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="size-3" />
          Parcel Matched
        </span>
      </div>

      {/* Side-by-Side Address Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Registered Corporate Address */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            BRS Registered Corporate Office
          </div>
          <div className="font-semibold text-slate-900 leading-snug">
            {registeredAddress}
          </div>
          <div className="text-[10px] text-slate-400">Statutory Legal Registration</div>
        </div>

        {/* Operating Premises Address */}
        <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-700">
            Single Business Permit Premises
          </div>
          <div className="font-semibold text-purple-950 leading-snug">
            {operatingAddress}
          </div>
          <div className="text-[10px] text-purple-600 font-medium">Customer-Facing Wellness Facility</div>
        </div>
      </div>

      {/* Confirmation Note */}
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50/80 border border-emerald-200 p-2.5 text-xs text-emerald-900">
        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
        <span className="font-medium text-[11px] leading-tight">
          {matchNote || 'Premises Match Confirmed: Ground floor spa suite is legally situated within registered corporate commercial tower.'}
        </span>
      </div>
    </div>
  )
}
