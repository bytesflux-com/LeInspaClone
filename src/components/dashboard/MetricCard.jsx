import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function MetricCard({
  title,
  value,
  trend,
  trendPeriod = 'vs. yesterday',
  isUp = true,
  icon: Icon,
  iconBg = 'bg-purple-100/70 text-purple-700',
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs transition hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', iconBg)}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
        <p className="text-xs font-semibold text-gray-500 leading-tight">{title}</p>
      </div>

      <div className="mt-3.5">
        <p className="text-2xl sm:text-[1.75rem] font-extrabold tracking-tight text-royal-950 tabular-nums leading-none">
          {value ?? '—'}
        </p>

        {trend && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-bold',
                isUp ? 'text-emerald-700' : 'text-rose-700',
              )}
            >
              <TrendingUp className="size-3" />
              {trend}
            </span>
            <span className="text-[11px] text-gray-400">{trendPeriod}</span>
          </div>
        )}
      </div>
    </div>
  )
}
