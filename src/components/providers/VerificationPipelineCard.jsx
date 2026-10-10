import { Link } from 'react-router'
import { ArrowRight, CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react'
import { formatNumber } from '../../lib/format'

export default function VerificationPipelineCard({ pipeline }) {
  if (!pipeline) return null

  const steps = [
    {
      id: 'submitted',
      count: pipeline.submitted,
      label: 'Submitted',
      color: 'text-[#5c2dd5]',
      bg: 'bg-[#5c2dd5]/10',
      icon: FileText,
    },
    {
      id: 'awaiting',
      count: pipeline.awaitingReview,
      label: 'Awaiting Review',
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
      icon: Clock,
    },
    {
      id: 'approved',
      count: pipeline.approved,
      label: 'Approved',
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      icon: CheckCircle2,
    },
    {
      id: 'rejected',
      count: pipeline.rejected,
      label: 'Rejected / Changes Required',
      color: 'text-rose-600',
      bg: 'bg-rose-500/10',
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-[15px] font-bold text-[#1b1140]">Verification Pipeline</h2>
        <Link
          to="/verifications"
          className="flex items-center gap-1 text-[12px] font-semibold text-[#5c2dd5] transition hover:text-[#4520a8]"
        >
          View Details <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* Funnel Steps */}
      <div className="flex items-center justify-between gap-1 py-1">
        {steps.map((step, idx) => {
          const Icon = step.icon
          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-1 flex-col items-center text-center">
                <div
                  className={`flex size-8 items-center justify-center rounded-xl ${step.bg}`}
                >
                  <Icon className={`size-4 ${step.color}`} />
                </div>
                <div className="mt-1.5 text-[15px] font-extrabold text-[#1b1140]">
                  {formatNumber(step.count)}
                </div>
                <div className="text-[10px] font-medium text-gray-500 line-clamp-1 max-w-[85px]">
                  {step.label}
                </div>
              </div>

              {idx < steps.length - 1 && (
                <ArrowRight className="size-3.5 shrink-0 text-gray-300" />
              )}
            </div>
          )
        })}
      </div>

      {/* Categories breakdown */}
      {pipeline.categories && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-2.5 text-[10.5px]">
          {pipeline.categories.map((c) => (
            <span
              key={c.name}
              className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 font-medium text-gray-600"
            >
              <span>{c.name}:</span>
              <strong className="text-[#1b1140]">{c.count}</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

