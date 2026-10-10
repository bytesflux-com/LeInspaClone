import React from 'react'
import {
  Building2,
  MapPin,
  Globe,
  UserCheck,
  FileCheck2,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

/**
 * ADM-034: BusinessProfileProgressCard
 * Displays commercial business context, corporate registration details,
 * assigned reviewer, and a 6-counter verification progress summary.
 */
export default function BusinessProfileProgressCard({
  providerId = 'SPA-28192',
  tradingName = 'Serenity Wellness Spa',
  legalEntityName = 'Serenity Wellness Ltd.',
  businessCategory = 'Spa & Wellness Center',
  market = { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  location = 'Westlands, Nairobi',
  assignedReviewer = {
    name: 'Jane Ochieng',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    role: 'Verification Specialist',
  },
  progressSummary = {
    requiredDocuments: 4,
    submitted: 4,
    approved: 2,
    underReview: 1,
    changesRequested: 1,
    missing: 0,
  },
}) {
  const {
    requiredDocuments = 4,
    submitted = 4,
    approved = 2,
    underReview = 1,
    changesRequested = 1,
    missing = 0,
  } = progressSummary

  const approvedPercent = Math.round((approved / requiredDocuments) * 100) || 50
  const reviewPercent = Math.round((underReview / requiredDocuments) * 100) || 25
  const changesPercent = Math.round((changesRequested / requiredDocuments) * 100) || 25

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-6">
      {/* 1. Header Information Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-100 pb-5">
        {/* Business Avatar & Core Titles */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative flex size-14 sm:size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-[#5B21B6] text-white shadow-md ring-4 ring-purple-100">
            <Building2 className="size-7 sm:size-8" />
            <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
              <ShieldCheck className="size-3" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {tradingName}
              </h2>
              <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-[#6D28D9] border border-purple-200">
                {businessCategory}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 font-mono">
                {providerId}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="font-medium text-slate-700">
                Legal Entity: <span className="font-semibold text-slate-900">{legalEntityName}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 font-medium">
                <span>{market?.flag || '🇰🇪'}</span>
                <span>{market?.name || 'Kenya'}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 text-slate-400" />
                <span>{location}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Reviewer Card */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 self-start lg:self-center">
          <img
            src={assignedReviewer?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'}
            alt={assignedReviewer?.name || 'Reviewer'}
            className="size-9 rounded-full object-cover ring-2 ring-white"
          />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Assigned Reviewer
            </div>
            <div className="text-xs font-bold text-slate-900">
              {assignedReviewer?.name || 'Jane Ochieng'}
            </div>
            <div className="text-[11px] text-purple-700 font-medium">
              {assignedReviewer?.role || 'Verification Specialist'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Verification Progress Bar & 6-Counter Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700">Statutory Documentation Compliance</span>
          <span className="text-[#6D28D9]">{approved} of {requiredDocuments} Mandated Docs Approved</span>
        </div>

        {/* Segmented Multi-Color Progress Bar */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 flex">
          <div
            style={{ width: `${approvedPercent}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Approved: ${approvedPercent}%`}
          />
          <div
            style={{ width: `${reviewPercent}%` }}
            className="bg-[#6D28D9] transition-all duration-500"
            title={`Under Review: ${reviewPercent}%`}
          />
          <div
            style={{ width: `${changesPercent}%` }}
            className="bg-amber-400 transition-all duration-500"
            title={`Changes Requested: ${changesPercent}%`}
          />
        </div>

        {/* 6-Counter Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* 1. Required Documents */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-center shadow-2xs">
            <div className="text-[11px] font-medium text-slate-500">Required Docs</div>
            <div className="mt-1 text-lg font-bold text-slate-900">{requiredDocuments}</div>
            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">Category Mandate</div>
          </div>

          {/* 2. Submitted */}
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-3 text-center shadow-2xs">
            <div className="text-[11px] font-medium text-blue-700">Submitted</div>
            <div className="mt-1 text-lg font-bold text-blue-900">{submitted}</div>
            <div className="mt-0.5 text-[10px] font-semibold text-blue-600">100% Uploaded</div>
          </div>

          {/* 3. Approved */}
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 text-center shadow-2xs">
            <div className="text-[11px] font-medium text-emerald-700">Approved</div>
            <div className="mt-1 text-lg font-bold text-emerald-800">{approved}</div>
            <div className="mt-0.5 text-[10px] font-semibold text-emerald-600">Verified Legal</div>
          </div>

          {/* 4. Under Review */}
          <div className="rounded-xl border border-purple-200/80 bg-purple-50/60 p-3 text-center shadow-2xs ring-1 ring-purple-500/20">
            <div className="text-[11px] font-medium text-purple-700">Under Review</div>
            <div className="mt-1 text-lg font-bold text-[#6D28D9]">{underReview}</div>
            <div className="mt-0.5 text-[10px] font-semibold text-purple-600">Active Stage</div>
          </div>

          {/* 5. Changes Requested */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-center shadow-2xs">
            <div className="text-[11px] font-medium text-amber-700">Action Needed</div>
            <div className="mt-1 text-lg font-bold text-amber-800">{changesRequested}</div>
            <div className="mt-0.5 text-[10px] font-semibold text-amber-600">Provider Notice</div>
          </div>

          {/* 6. Missing / Incomplete */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-center shadow-2xs">
            <div className="text-[11px] font-medium text-slate-500">Missing Docs</div>
            <div className="mt-1 text-lg font-bold text-slate-700">{missing}</div>
            <div className="mt-0.5 text-[10px] font-semibold text-slate-400">All Filed</div>
          </div>
        </div>
      </div>
    </div>
  )
}
