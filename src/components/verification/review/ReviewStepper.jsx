import { Check, Clock, AlertCircle, RotateCcw, X } from 'lucide-react'

/**
 * ADM-031: ReviewStepper
 * 4 interconnected horizontal steps with connecting lines and state indicators.
 * Dynamically supports Individual, Spa, and Hotel verification steps.
 */
export default function ReviewStepper({
  steps = [],
  activeStepId,
  onSelectStep,
}) {
  const defaultSteps = [
    { id: 'IDENTITY', label: 'Identity Verification', status: 'APPROVED', number: 1 },
    { id: 'CREDENTIALS', label: 'Professional Credentials', status: 'REVIEWING_NOW', number: 2 },
    { id: 'PROFILE', label: 'Profile Information', status: 'PENDING', number: 3 },
    { id: 'FINAL', label: 'Final Verification', status: 'PENDING', number: 4 },
  ]

  const displaySteps = steps.length > 0 ? steps : defaultSteps

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return {
          icon: <Check className="size-3.5 stroke-[2.5]" />,
          text: 'Approved',
          circleClass: 'bg-emerald-600 text-white shadow-2xs',
          labelClass: 'text-emerald-700 font-semibold',
          subClass: 'text-emerald-600',
        }
      case 'REVIEWING_NOW':
      case 'IN_PROGRESS':
        return {
          icon: <span className="size-2 rounded-full bg-white animate-pulse" />,
          text: 'Reviewing Now',
          circleClass: 'bg-[#6D28D9] text-white shadow-xs ring-4 ring-purple-100',
          labelClass: 'text-purple-900 font-bold',
          subClass: 'text-[#6D28D9] font-semibold',
        }
      case 'CHANGES_REQUESTED':
        return {
          icon: <RotateCcw className="size-3 stroke-[2.5]" />,
          text: 'Changes Req.',
          circleClass: 'bg-amber-500 text-white shadow-2xs',
          labelClass: 'text-amber-800 font-semibold',
          subClass: 'text-amber-600',
        }
      case 'REJECTED':
        return {
          icon: <X className="size-3 stroke-[2.5]" />,
          text: 'Rejected',
          circleClass: 'bg-rose-600 text-white shadow-2xs',
          labelClass: 'text-rose-800 font-semibold',
          subClass: 'text-rose-600',
        }
      default:
        return {
          icon: null,
          text: 'Pending',
          circleClass: 'border-2 border-slate-300 bg-white text-slate-400 font-bold',
          labelClass: 'text-slate-600 font-medium',
          subClass: 'text-slate-400',
        }
    }
  }

  return (
    <div className="flex flex-col justify-center h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Verification Progress
        </h3>
        <span className="text-xs font-semibold text-purple-700">
          Step {displaySteps.findIndex((s) => s.id === activeStepId) + 1 || 2} of {displaySteps.length}
        </span>
      </div>

      <div className="relative flex items-start justify-between">
        {/* Horizontal Connector Line behind icons */}
        <div className="absolute left-4 right-4 top-4 -translate-y-1/2 h-0.5 bg-slate-200" aria-hidden="true" />

        {displaySteps.map((step, idx) => {
          const badge = getStatusBadge(step.status)
          const isCurrent = step.id === activeStepId || (!activeStepId && step.status === 'REVIEWING_NOW')
          const isPassed = step.status === 'APPROVED'

          return (
            <button
              key={step.id || idx}
              type="button"
              onClick={() => onSelectStep?.(step.id)}
              className="relative z-10 flex flex-1 flex-col items-center text-center group cursor-pointer focus:outline-hidden"
            >
              {/* Step Circle */}
              <div
                className={`flex size-8 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${badge.circleClass} ${
                  isCurrent ? 'ring-4 ring-purple-100 scale-105' : ''
                }`}
              >
                {badge.icon || <span className="text-xs">{step.number || idx + 1}</span>}
              </div>

              {/* Step Labels */}
              <div className="mt-2 space-y-0.5 max-w-[110px]">
                <p className={`text-xs leading-snug line-clamp-2 transition ${badge.labelClass}`}>
                  {step.label}
                </p>
                <p className={`text-[11px] ${badge.subClass}`}>
                  {step.status === 'APPROVED' ? '✓ ' : step.status === 'REVIEWING_NOW' ? '● ' : '○ '}
                  {badge.text}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
