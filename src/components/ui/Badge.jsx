import { cn } from '../../lib/utils'

const VARIANTS = {
  default: 'bg-gray-100 text-gray-700 ring-gray-500/10',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  royal: 'bg-royal-50 text-royal-800 ring-royal-600/20',
  gold: 'bg-amber-100/70 text-amber-900 ring-amber-400/40',
}

const SIZES = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
}

export default function Badge({ children, variant = 'default', size = 'md', className = '', dot = false, dotColor = '' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
        VARIANTS[variant] || VARIANTS.default,
        SIZES[size] || SIZES.md,
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dotColor || 'bg-current')} />}
      {children}
    </span>
  )
}

