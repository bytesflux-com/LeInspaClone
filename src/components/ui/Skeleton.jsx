import { cn } from '../../lib/utils'

export default function Skeleton({ className = '' }) {
  return <div className={cn('animate-pulse rounded-xl bg-gray-200/70', className)} />
}

