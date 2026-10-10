import { Link, useNavigate } from 'react-router'
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react'

/**
 * ADM-032: IdentityHeader
 * Breadcrumbs and primary top actions for Identity Documents Review.
 * Note: Global top navbar is provided by AdminLayout.
 */
export default function IdentityHeader({ verificationId, providerId }) {
  const navigate = useNavigate()
  const reviewUrl = `/verifications/review/${verificationId || 'ver-001'}`
  const profileUrl = `/providers/${providerId || 'PR-82941'}`

  return (
    <div className="space-y-3">
      {/* Breadcrumb trail */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
        <Link to="/verifications" className="hover:text-purple-700 transition">
          Verification Center
        </Link>
        <span>&gt;</span>
        <Link to="/verifications/queue" className="hover:text-purple-700 transition">
          Verification Queue
        </Link>
        <span>&gt;</span>
        <Link to={reviewUrl} className="hover:text-purple-700 transition">
          Verification Review
        </Link>
        <span>&gt;</span>
        <span className="text-slate-700 font-semibold">Identity Documents</span>
      </nav>

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-purple-50 text-[#6D28D9] border border-purple-100 shadow-2xs">
            <ShieldCheck className="size-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Identity Documents Review
            </h1>
            <p className="text-sm text-slate-500">
              Review submitted identity documents and verify the account holder&apos;s identity.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/verifications/credentials/${verificationId || 'ver-001'}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
            title="Inspect professional credentials (ADM-033)"
          >
            <ShieldCheck className="size-3.5 text-purple-600" />
            <span>Credentials Review</span>
          </Link>

          <button
            type="button"
            onClick={() => navigate(reviewUrl)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
          >
            <ArrowLeft className="size-4 text-slate-500" />
            <span>Back to Verification Review</span>
          </button>

          <Link
            to={profileUrl}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-50/60 transition cursor-pointer"
          >
            <ExternalLink className="size-4 text-purple-600" />
            <span>View Provider Profile</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
