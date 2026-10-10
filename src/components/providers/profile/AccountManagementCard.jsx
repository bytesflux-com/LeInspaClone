import {
  ShieldAlert,
  History,
  Settings,
  ChevronRight,
  ShieldCheck,
  UserX,
} from 'lucide-react'

export function AccountManagementCard({
  profile,
  onOpenAccountActions,
  onOpenRestrictions,
  onViewAccountHistory,
}) {
  if (!profile) return null

  const status = profile.status || 'active'
  const isSuspended = status === 'suspended'
  const isUnderReview = status === 'under_review'

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Settings className="size-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Account Management
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Current Status:
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isSuspended
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  status === 'active'
                    ? 'bg-emerald-500'
                    : isSuspended
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
              {profile.statusLabel || (status.charAt(0).toUpperCase() + status.slice(1))}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs text-slate-600 leading-relaxed">
          High-impact standing and compliance actions are isolated inside the account
          management workflow to prevent accidental state changes.
        </p>

        {/* Safe Shortcuts Matching Screenshot */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* View Account History */}
          <button
            type="button"
            onClick={onViewAccountHistory}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            <History className="size-3.5 text-slate-500" />
            <span>View Account History</span>
          </button>

          {/* Manage Restrictions */}
          <button
            type="button"
            onClick={onOpenRestrictions}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            <ShieldAlert className="size-3.5 text-amber-600" />
            <span>Manage Restrictions</span>
          </button>

          {/* Account Actions -> Primary Purple */}
          <button
            type="button"
            onClick={onOpenAccountActions}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Settings className="size-3.5" />
            <span>Account Actions →</span>
          </button>
        </div>
      </div>

      {/* Safety notice */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <p className="text-[10px] text-slate-400 text-center">
          Country authorization & audit logging enforced on all account modifications.
        </p>
      </div>
    </div>
  )
}

