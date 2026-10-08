import { cn } from '../../lib/utils'

export default function PageContainer({ children, className = '', wide = false }) {
  return (
    <div
      className={cn(
        'mx-auto space-y-8 pb-12 animate-in fade-in duration-150',
        wide ? 'w-full max-w-[1850px] px-2 sm:px-4 lg:px-6' : 'max-w-7xl px-4 sm:px-6',
        className,
      )}
    >
      {children}
    </div>
  )
}

