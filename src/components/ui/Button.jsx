import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const VARIANTS = {
  primary: 'bg-royal-900 text-white hover:bg-royal-800 shadow-xs ring-1 ring-royal-800 focus:ring-royal-500',
  secondary: 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 shadow-xs focus:ring-royal-500',
  outline: 'border border-royal-700 text-royal-800 hover:bg-royal-50 focus:ring-royal-500',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs focus:ring-rose-500',
  gold: 'bg-gold-400 text-royal-950 font-semibold hover:bg-gold-500 shadow-xs focus:ring-gold-400',
}

const SIZES = {
  sm: 'h-8 px-2.5 text-xs rounded-lg',
  md: 'h-9.5 px-3.5 text-xs sm:text-sm rounded-xl',
  lg: 'h-11 px-5 text-sm sm:text-base rounded-xl',
}

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    loading = false,
    loadingText,
    disabled = false,
    fullWidth = false,
    className = '',
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition focus:outline-none focus:ring-3 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="size-4 shrink-0 text-current" />
      ) : null}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  )
})

export default Button
