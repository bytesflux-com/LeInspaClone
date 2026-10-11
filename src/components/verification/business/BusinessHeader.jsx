import React from 'react'
import {
  Building2,
  ChevronLeft,
  ExternalLink,
  ShieldCheck,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
} from 'lucide-react'

/**
 * ADM-034: BusinessHeader
 * Top page header with breadcrumbs, entity title, dynamic status badges,
 * and direct navigation back to Verification Review and Business Profile.
 */
export default function BusinessHeader({
  verificationId,
  providerId,
  tradingName = 'Serenity Wellness Spa',
  businessCategory = 'Spa & Wellness Center',
  status = 'UNDER_REVIEW',
  version = 2,
  onBack,
  onViewProfile,
}) {
  const getStatusBadge = () => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="size-3.5" />
            Approved
          </span>
        )
      case 'CHANGES_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <Clock className="size-3.5" />
            Changes Requested
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            <XCircle className="size-3.5" />
            Rejected
          </span>
        )
      case 'ESCALATED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
            <AlertTriangle className="size-3.5" />
            Escalated to Compliance
          </span>
        )
      case 'UNDER_REVIEW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-[#6D28D9]">
            <Clock className="size-3.5" />
            Under Review
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Breadcrumb navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <button
          type="button"
          onClick={onBack}
          className="hover:text-slate-900 transition flex items-center gap-1 cursor-pointer"
        >
          Verifications
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={onBack}
          className="hover:text-slate-900 transition cursor-pointer"
        >
          Verification Review
        </button>
        <span>/</span>
        <span className="font-semibold text-slate-900">Business Documents</span>
      </nav>

      {/* 2. Main Title Row with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-[#6D28D9] shadow-xs ring-4 ring-purple-50">
            <Building2 className="size-6 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Business Documents Review
              </h1>
              {getStatusBadge()}
              <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
                v{version} Current
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Verify statutory corporate incorporation, premises operating permits, tax compliance, and authorized signatory credentials.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
          >
            <ChevronLeft className="size-4" />
            Back to Review
          </button>

          <button
            type="button"
            onClick={onViewProfile}
            className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50/70 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#6D28D9] shadow-2xs hover:bg-purple-100/70 transition cursor-pointer"
          >
            <ExternalLink className="size-4" />
            View Business Profile
          </button>
        </div>
      </div>
    </div>
  )
}
