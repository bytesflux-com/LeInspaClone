import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from './Button'
import { cn } from '../../lib/utils'

export default function ErrorState({
  title = 'Failed to load telemetry',
  description = 'An error occurred while fetching information from the Lé Inspa backend.',
  onRetry,
  className = '',
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-10 text-center rounded-2xl border border-rose-200 bg-rose-50/50', className)}>
      <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 ring-1 ring-rose-200">
        <AlertTriangle className="size-6" />
      </div>
      <h3 className="mt-3 text-sm font-bold text-rose-950">{title}</h3>
      <p className="mt-1 text-xs text-rose-800 max-w-sm">{description}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 border-rose-300 text-rose-900 hover:bg-rose-100/50"
          icon={RefreshCw}
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </div>
  )
}

