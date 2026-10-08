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
        'flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-4 sm:p-4.5 shadow-2xs transition-all duration-200 hover:shadow-md hover:border-purple-200 min-w-0 overflow-hidden',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <span className={cn('flex size-8.5 shrink-0 items-center justify-center rounded-xl shadow-2xs', iconBg)}>
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
        )}
        <p className="text-xs font-bold text-gray-500 leading-tight truncate">{title}</p>
      </div>

      <div className="mt-3 min-w-0">
        <p className="text-lg sm:text-xl xl:text-[1.35rem] 2xl:text-[1.5rem] font-black tracking-tight text-royal-950 tabular-nums leading-tight truncate">
          {value ?? '—'}
        </p>

        {trend && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs flex-wrap">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-bold',
                isUp ? 'text-emerald-700' : 'text-rose-700',
              )}
            >
              <TrendingUp className="size-3" />
              {trend}
            </span>
            <span className="text-[11px] text-gray-400 truncate">{trendPeriod}</span>
          </div>
        )}
      </div>
    </div>
  )
}
