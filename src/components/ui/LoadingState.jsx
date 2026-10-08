import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function LoadingState({ message = 'Loading telemetry…', className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center', className)}>
      <div className="flex size-12 items-center justify-center rounded-2xl bg-royal-50 text-royal-700 ring-1 ring-royal-200">
        <Loader2 className="size-6 animate-spin" />
      </div>
      <p className="mt-3 text-sm font-medium text-royal-950">{message}</p>
      <p className="text-xs text-gray-500">Connecting to Lé Inspa data services</p>
    </div>
  )
}

