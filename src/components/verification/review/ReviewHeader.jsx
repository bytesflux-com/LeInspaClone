import { Link, useNavigate } from 'react-router'
import {
  ShieldCheck,
  ArrowLeft,
  Building2,
  Save,
  CheckCircle2,
} from 'lucide-react'

/**
 * ADM-031: ReviewHeader
 * Breadcrumbs and Command Header row matching design specification.
 */
export default function ReviewHeader({
  record,
  onSaveAndExit,
  saving = false,
}) {
  const navigate = useNavigate()
  const providerName = record?.name || 'Grace Njeri'
  const providerId = record?.providerId || 'PR-82941'

  return (
    <div className="space-y-2">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <Link
          to="/verifications"
          className="hover:text-purple-700 hover:underline transition"
        >
          Verification Center
        </Link>
        <span>&gt;</span>
        <Link
          to="/verifications/queue"
          className="hover:text-purple-700 hover:underline transition"
        >
          Verification Queue
        </Link>
        <span>&gt;</span>
        <span className="text-slate-700 font-semibold truncate max-w-[200px]">
          {providerName}
        </span>
      </nav>

      {/* 2. Title Row & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-1">
        {/* Left: Shield badge icon + Title + Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-[#6D28D9] shadow-2xs">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
              Verification Review
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Review provider verification submission and make a decision.
            </p>
          </div>
        </div>

        {/* Right: Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Back to Queue */}
          <Link
            to="/verifications/queue"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft className="size-4 text-slate-500" />
            <span>Back to Queue</span>
          </Link>

          {/* View Provider Profile */}
          <Link
            to={`/providers/${providerId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200/80 bg-white px-3.5 py-2 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-50/70 transition"
          >
            <Building2 className="size-4 text-[#6D28D9]" />
            <span>View Provider Profile</span>
          </Link>

          {/* Save & Exit */}
          <button
            type="button"
            onClick={onSaveAndExit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5B21B6] disabled:opacity-50 transition"
          >
            <Save className="size-4" />
            <span>{saving ? 'Saving...' : 'Save & Exit'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
