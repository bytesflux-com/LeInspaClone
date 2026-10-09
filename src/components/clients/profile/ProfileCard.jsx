import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { cn } from '../../../lib/utils'

// Shared building blocks for the ADM-012 profile cards.
export const PROFILE_CARD =
  'rounded-xl border border-[#e6e1f3] bg-white shadow-[0_1px_2px_rgba(36,21,71,0.04),0_8px_20px_-12px_rgba(36,21,71,0.14)]'

export function ProfileCard({ icon: Icon, disc = false, title, action, children, className = '', bodyClass = '', as: Tag = 'section' }) {
  return (
    <Tag className={cn(PROFILE_CARD, 'flex flex-col p-3', className)}>
      <header className="mb-2.5 flex min-w-0 items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-[14px] leading-none font-bold tracking-tight whitespace-nowrap text-[#1b1140]">
          {Icon &&
            (disc ? (
              <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#4125d0] text-white">
                <Icon className="size-3 fill-white" aria-hidden="true" />
              </span>
            ) : (
              <Icon className="size-[18px] shrink-0 fill-[#4527c8]/90 text-[#4527c8]" aria-hidden="true" />
            ))}
          {title}
        </h2>
        {action}
      </header>
      <div className={cn('min-h-0 flex-1', bodyClass)}>{children}</div>
    </Tag>
  )
}

export function CardLink({ to, state, children = 'View Details', onClick, arrow = true }) {
  const cls = 'inline-flex shrink-0 items-center gap-1 text-[11.5px] font-semibold text-[#3b1fd6] hover:underline'
  const body = (
    <>
      {children}
      {arrow && <ArrowRight className="size-3.5" aria-hidden="true" />}
    </>
  )
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{body}</button>
  return <Link to={to} state={state} className={cls}>{body}</Link>
}

// Small outlined "View →" button used in list rows.
export function RowButton({ to, state, children = 'View' }) {
  return (
    <Link
      to={to}
      state={state}
      className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-lg border-[1.5px] border-[#8b6cf0] bg-white px-2 text-[11.5px] font-semibold text-[#3b1fd6] transition hover:bg-[#f4f1fc]"
    >
      {children} <ArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
  )
}

export function Pill({ box, dot: Dot, dotClass, children, className = '' }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-[3px] text-[10px] leading-none font-medium whitespace-nowrap', box, className)}>
      {Dot && <Dot className={cn('size-3', dotClass)} aria-hidden="true" />}
      {children}
    </span>
  )
}

export function Money({ amount, currency, className = '' }) {
  return <span className={className}>{typeof amount === 'number' ? `${currency} ${amount.toLocaleString('en-US')}` : '—'}</span>
}

// Hairline-separated label/value row.
export function DetailRow({ icon: Icon, iconClass = 'text-[#4527c8]', label, children, labelWidth = 'w-[98px]', className = '' }) {
  return (
    <li className={cn('flex min-h-[33px] items-center gap-2 border-b border-[#efecf7] py-1 text-[12.5px] last:border-b-0', className)}>
      {Icon && <Icon className={cn('size-[17px] shrink-0', iconClass)} aria-hidden="true" />}
      <span className={cn('shrink-0 leading-tight text-[#2a1b57]', labelWidth)}>{label}</span>
      <span className="flex min-w-0 flex-1 items-center gap-2 font-medium text-[#1b1140]">{children}</span>
    </li>
  )
}
