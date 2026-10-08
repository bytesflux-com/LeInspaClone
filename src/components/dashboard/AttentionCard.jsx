import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { cn, formatNumber } from '../../lib/utils'

export default function AttentionCard({
  title,
  count,
  subtitle,
  link = '#',
  actionText = 'Review',
  badgeIcon: BadgeIcon,
  badgeBg = 'bg-purple-100 text-purple-700',
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-[#fbfaff] p-4 text-left transition hover:border-royal-200 hover:shadow-xs">
      <div>
        <div className="flex items-center gap-2">
          {BadgeIcon && (
            <span className={cn('flex size-6 items-center justify-center rounded-lg text-xs font-bold', badgeBg)}>
              <BadgeIcon className="size-3.5" />
            </span>
          )}
          <span className="text-xs font-bold text-gray-800">{title}</span>
        </div>

        <p className="mt-3 text-2xl font-extrabold text-royal-950 tabular-nums leading-none">
          {formatNumber(count)}
        </p>
        <p className="mt-1 text-xs text-gray-500 font-medium">{subtitle}</p>
      </div>

      <Link
        to={link}
        className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-1.5 text-xs font-semibold text-royal-900 shadow-2xs hover:bg-gray-50 transition"
      >
        <span>{actionText}</span>
        <ArrowRight className="size-3 text-royal-700" />
      </Link>
    </div>
  )
}
