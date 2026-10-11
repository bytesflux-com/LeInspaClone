import { Check, Clock, AlertCircle, FileText } from 'lucide-react'

/**
 * ADM-033: CredentialTabs
 * Horizontal pill tabs for navigating between submitted and optional credentials.
 */
export default function CredentialTabs({
  credentials = [],
  activeCredentialId,
  onSelectCredential,
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {credentials.map((cred) => {
        const isActive = cred.id === activeCredentialId
        const isApproved = cred.status === 'APPROVED'
        const isReviewing = cred.status === 'REVIEWING_NOW' || cred.status === 'UNDER_REVIEW'
        const isChanges = cred.status === 'CHANGES_REQUESTED'

        let pillClasses = 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'

        if (isActive) {
          pillClasses = 'bg-[#6D28D9] text-white border-transparent shadow-xs ring-2 ring-purple-600/20'
        } else if (isApproved) {
          pillClasses = 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80'
        } else if (isChanges) {
          pillClasses = 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/80'
        }

        return (
          <button
            key={cred.id}
            type="button"
            onClick={() => onSelectCredential?.(cred.id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${pillClasses}`}
          >
            {/* Status Indicator */}
            {isApproved && (
              <span className="flex size-4 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Check className="size-2.5 stroke-[3]" />
              </span>
            )}
            {isReviewing && (
              <span
                className={`size-2 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-[#6D28D9] animate-pulse'}`}
              />
            )}
            {isChanges && (
              <span className="size-2 rounded-full bg-amber-500" />
            )}
            {!isApproved && !isReviewing && !isChanges && (
              <span className="size-1.5 rounded-full bg-slate-300" />
            )}

            {/* Title */}
            <span>
              {cred.title}
              {isApproved && ' (Approved)'}
              {isReviewing && ' (Reviewing Now)'}
              {isChanges && ' (Changes Req.)'}
              {!isApproved && !isReviewing && !isChanges && (cred.isRequired ? ' (Pending)' : ' (Optional)')}
            </span>

            {/* Required Tag */}
            {cred.isRequired && !isApproved && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                  isActive ? 'bg-purple-800 text-purple-100' : 'bg-slate-100 text-slate-500'
                }`}
              >
                Req
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
