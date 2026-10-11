import React from 'react'
import {
  UserCheck,
  ShieldCheck,
  ExternalLink,
  Mail,
  Phone,
  FileBadge,
  CheckCircle2,
} from 'lucide-react'

/**
 * ADM-034: BusinessRepresentativeCard
 * Authorized Representative / Corporate Signatory profile card.
 * Cross-links directly to ADM-032 (Identity Documents Review).
 */
export default function BusinessRepresentativeCard({
  representative = {
    name: 'Mary Wanjiku',
    role: 'Managing Director & Founder',
    title: 'Business Owner / Authorized Signatory',
    ownership: '100% Beneficial Shareholder',
    email: 'm.wanjiku@serenityspa.co.ke',
    phone: '+254 722 998 877',
    idNumberMasked: '•••• •••• 9102',
    authorizedDocument: 'CR12 Official Company Registry Certificate',
    isIdentityVerified: true,
    identityReviewId: 'ver-002',
  },
  onViewIdentity,
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-[#6D28D9]">
            <UserCheck className="size-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Authorized Corporate Representative
          </h3>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="size-3" />
          Identity Verified
        </span>
      </div>

      {/* Representative Profile Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-[#6D28D9] text-white font-bold text-base shadow-xs">
            {representative.name?.split(' ').map((n) => n[0]).join('') || 'MW'}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{representative.name}</span>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                {representative.ownership || 'Owner'}
              </span>
            </div>
            <div className="text-xs text-purple-800 font-medium">
              {representative.role}
            </div>
            <div className="text-[11px] text-slate-500">
              National ID: <span className="font-mono text-slate-700">{representative.idNumberMasked}</span>
            </div>
          </div>
        </div>

        {/* View Identity Review Button (Links to ADM-032) */}
        <button
          type="button"
          onClick={onViewIdentity}
          className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-bold text-[#6D28D9] hover:bg-purple-100 hover:border-purple-300 transition cursor-pointer self-start sm:self-center shrink-0 shadow-2xs"
        >
          <span>View Identity Review</span>
          <ExternalLink className="size-3.5" />
        </button>
      </div>

      {/* Corporate Signatory Authority Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-100">
          <FileBadge className="size-4 text-purple-600 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 block">Signatory Mandate</span>
            <span className="font-semibold text-slate-800 truncate">{representative.authorizedDocument}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-100">
          <Mail className="size-4 text-slate-400 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 block">Verified Official Email</span>
            <span className="font-semibold text-slate-800 truncate">{representative.email}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
