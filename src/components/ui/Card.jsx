import { cn } from '../../lib/utils'

export default function Card({ title, subtitle, headerAction, children, className = '', noPadding = false }) {
  return (
    <section className={cn('rounded-2xl border border-gray-200/90 bg-white shadow-xs', className)}>
      {(title || subtitle || headerAction) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <div>
            {title && <h2 className="text-base font-bold text-royal-950">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </section>
  )
}

