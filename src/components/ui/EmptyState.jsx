import { Inbox } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no active entries matching your selected criteria.',
  action,
  className = '',
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-10 text-center', className)}>
      <div className="flex size-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-xs text-gray-500 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

