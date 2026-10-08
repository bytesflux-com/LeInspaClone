import { cn } from '../../lib/utils'

export default function PageContainer({ children, className = '' }) {
  return (
    <div className={cn('mx-auto max-w-7xl space-y-8 pb-12 animate-in fade-in duration-150', className)}>
      {children}
    </div>
  )
}

