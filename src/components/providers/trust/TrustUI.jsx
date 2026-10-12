import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, BadgeCheck, Calendar, ChevronRight, CircleAlert, Clock, Copy, FlaskConical, Lock, Star, X } from 'lucide-react'
import { cn } from '../../../lib/utils'
import Skeleton from '../../ui/Skeleton'
import { humanize } from './trustFormat'

// Shared building blocks for ADM-025 → ADM-028 (same premium desktop shell as
// ADM-022 → ADM-024: royal-purple accents, white workspace, lavender surfaces,
// restrained gold, rounded cards).

const TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  grey: 'bg-slate-100 text-slate-600 ring-slate-200',
  purple: 'bg-royal-50 text-royal-700 ring-royal-200',
  gold: 'bg-[#fbf3e2] text-[#8a6420] ring-[#ecd7a6]',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
}
const DOTS = { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500', grey: 'bg-slate-400', purple: 'bg-royal-500', gold: 'bg-gold-500', blue: 'bg-sky-500' }

export function Pill({ tone = 'grey', dot = false, icon: Icon, children, className = '' }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', TONES[tone], className)}>
      {dot && <span className={cn('size-1.5 rounded-full', DOTS[tone])} />}
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  )
}

export function Stars({ value = 0, size = 'size-3.5', className = '' }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(size, i <= Math.round(value) ? 'fill-gold-400 text-gold-400' : 'fill-slate-200 text-slate-200')} />
      ))}
    </span>
  )
}

export function Panel({ title, icon: Icon, action, children, className = '', bodyClass = '', tone }) {
  return (
    <section className={cn('flex min-w-0 flex-col rounded-2xl border bg-white shadow-card', tone === 'amber' ? 'border-amber-200 bg-amber-50/40' : tone === 'red' ? 'border-rose-200 bg-rose-50/30' : tone === 'gold' ? 'border-[#ecd7a6] bg-[#fdf8ec]' : 'border-slate-200/80', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
          <h3 className="flex min-w-0 items-center gap-2 text-[13.5px] font-bold text-royal-950">
            {Icon && <Icon className="size-4 shrink-0 text-royal-600" />}
            <span className="truncate">{title}</span>
          </h3>
          {action}
        </header>
      )}
      <div className={cn('min-w-0 flex-1 px-4 pb-4', bodyClass)}>{children}</div>
    </section>
  )
}

export function LinkAction({ to, onClick, children, state }) {
  const cls = 'inline-flex shrink-0 items-center gap-0.5 text-[11.5px] font-semibold text-royal-600 hover:text-royal-800'
  return to ? (
    <Link to={to} state={state} className={cls}>{children} <ChevronRight className="size-3" /></Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>{children} <ChevronRight className="size-3" /></button>
  )
}

export function Btn({ variant = 'primary', className = '', children, ...props }) {
  const styles = {
    primary: 'bg-royal-700 text-white hover:bg-royal-800 disabled:bg-royal-300',
    outline: 'border border-royal-300 bg-white text-royal-700 hover:bg-royal-50 disabled:opacity-50',
    ghost: 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 disabled:opacity-50',
    danger: 'border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-50',
    dangerSolid: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300',
    success: 'border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 disabled:opacity-50',
    gold: 'bg-gold-500 text-white hover:bg-[#b38840] disabled:opacity-50',
  }
  return (
    <button type="button" className={cn('inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition disabled:cursor-not-allowed', styles[variant], className)} {...props}>
      {children}
    </button>
  )
}

export function Row({ label, children, className = '' }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 py-1 text-[12px]', className)}>
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="min-w-0 text-right font-medium text-slate-800">{children}</span>
    </div>
  )
}

export function KpiCard({ icon: Icon, tone = 'purple', label, value, sub, children }) {
  const iconTone = { purple: 'bg-royal-50 text-royal-600', gold: 'bg-[#fbf3e2] text-gold-500', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-rose-50 text-rose-600', blue: 'bg-sky-50 text-sky-600' }[tone]
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-card">
      {Icon && <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', iconTone)}><Icon className="size-5" /></span>}
      <div className="min-w-0">
        <p className="text-[11.5px] font-medium text-slate-500">{label}</p>
        <p className="text-[22px] leading-tight font-bold text-royal-950">{value}</p>
        {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
        {children}
      </div>
    </div>
  )
}

export function Locked({ title = 'Limited Access', text = 'These details are restricted based on your role permissions.' }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 rounded-xl bg-lavender-100/60 px-4 py-6 text-center">
      <Lock className="size-5 text-royal-500" />
      <p className="text-[13px] font-semibold text-royal-900">{title}</p>
      <p className="max-w-[240px] text-[11.5px] text-slate-500">{text}</p>
    </div>
  )
}

export function Empty({ children }) {
  return <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-[12px] text-slate-500">{children}</p>
}

export function Field({ label, required, hint, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-[12px] font-semibold text-slate-700">{label}{required && <span className="text-rose-600"> *</span>}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
    </label>
  )
}

export function Drawer({ open, title, subtitle, onClose, children, footer, width = 'max-w-[520px]' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-royal-950/30 backdrop-blur-[1px]" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label={title} className={cn('relative flex h-full w-full flex-col bg-white shadow-2xl', width)}>
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[16px] font-bold text-royal-950">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[12px] text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="size-5" /></button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="border-t border-slate-100 px-5 py-3">{footer}</footer>}
      </aside>
    </div>
  )
}

export function ErrorBanner({ children }) {
  return children ? <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-700"><CircleAlert className="mt-px size-4 shrink-0" />{children}</p> : null
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      <div className="grid gap-4 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
    </div>
  )
}

const DEMO_PROVIDERS = [
  { id: 'PR-82941', label: 'Individual (Grace)' },
  { id: 'SPA-28192', label: 'Spa (Serenity)' },
  { id: 'HWR-18291', label: 'Hotel/Resort (Savanna)' },
]

// Provider header shared by ADM-025 → ADM-028.
export function ProviderTrustHeader({ provider, providerId, section, sectionPath, actions, showRating = true, isMock, onCopy }) {
  const navigate = useNavigate()
  const p = provider || {}
  const statusTone = { active: 'green', under_review: 'purple', suspended: 'red', deactivated: 'red' }[p.accountStatus] || 'grey'
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(p.id || providerId)
      onCopy?.(`${p.id || providerId} copied`)
    } catch {
      onCopy?.('Unable to copy to clipboard', 'error')
    }
  }
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-slate-500">
          <Link to="/providers" className="hover:text-royal-700">Provider Management</Link>
          <ChevronRight className="size-3.5 text-slate-400" />
          <Link to="/providers/all" className="hover:text-royal-700">Provider Directory</Link>
          <ChevronRight className="size-3.5 text-slate-400" />
          <Link to={`/providers/${providerId}`} className="hover:text-royal-700">{p.name || providerId}</Link>
          <ChevronRight className="size-3.5 text-slate-400" />
          <span className="font-semibold text-royal-950">{section}</span>
        </nav>
        <div className="flex items-center gap-2">
          {isMock && <span className="inline-flex items-center gap-1 rounded-md bg-[#fff4e0] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#9a5a06]" title="VITE_USE_MOCK_PROVIDERS is on"><FlaskConical className="size-3" /> Demo data</span>}
          {isMock && (
            <div className="flex items-center gap-1 rounded-full border border-royal-200 bg-royal-50/70 px-1.5 py-0.5 text-[11px]">
              {DEMO_PROVIDERS.map((d) => (
                <button key={d.id} type="button" onClick={() => navigate(`/providers/${d.id}/${sectionPath}`)} className={cn('rounded-full px-2 py-0.5 font-medium', providerId === d.id ? 'bg-royal-700 text-white' : 'text-royal-700 hover:bg-royal-100')}>
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card md:flex-row md:items-center sm:p-5">
        <div className="flex min-w-0 items-center gap-4">
          {p.avatar ? (
            <img src={p.avatar} alt="" className="size-20 shrink-0 rounded-full object-cover ring-2 ring-royal-100 sm:size-24" />
          ) : (
            <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-royal-100 text-2xl font-bold text-royal-700 sm:size-24">{(p.name || '?').charAt(0)}</span>
          )}
          <div className="min-w-0 space-y-1">
            <h1 className="flex items-center gap-1.5 text-[22px] leading-tight font-bold text-royal-950 sm:text-[26px]">
              <span className="truncate">{p.name || providerId}</span>
              {p.verified && <BadgeCheck className="size-6 shrink-0 fill-royal-600 text-white" />}
            </h1>
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
              {p.id || providerId}
              <button type="button" onClick={copy} className="text-royal-500 hover:text-royal-700" aria-label="Copy provider ID"><Copy className="size-3.5" /></button>
            </p>
            <p className="text-[14px] font-semibold text-slate-800">{p.typeLabel}</p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[12px]">
              <span className="text-slate-600">{p.flag} {[p.city, p.country].filter(Boolean).join(', ')}</span>
              <Pill tone={p.verified ? 'green' : 'amber'} dot>{p.verified ? 'Verified' : humanize(p.verificationStatus)}</Pill>
              <Pill tone={statusTone} dot>{humanize(p.accountStatus)}</Pill>
              {showRating && typeof p.rating === 'number' && (
                <span className="inline-flex items-center gap-1 font-semibold text-slate-800"><Star className="size-4 fill-gold-400 text-gold-400" />{p.rating}{typeof p.reviewTotal === 'number' && <span className="font-normal text-slate-500">({p.reviewTotal} reviews)</span>}</span>
              )}
            </div>
            {(p.joinedDate || p.lastActive) && (
              <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-slate-500">
                {p.joinedDate && <span className="inline-flex items-center gap-1"><Calendar className="size-3.5 text-royal-400" />Joined: {p.joinedDate}</span>}
                {p.lastActive && <span className="inline-flex items-center gap-1"><Clock className="size-3.5 text-royal-400" />Last Active: {p.lastActive}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
          <div className="flex flex-wrap gap-2 md:justify-end">
            <Link to={`/providers/${providerId}`} className="inline-flex items-center gap-1.5 rounded-xl border border-royal-300 bg-white px-3.5 py-2 text-[12px] font-semibold text-royal-700 hover:bg-royal-50">
              <ArrowLeft className="size-3.5" /> Back to Provider Profile
            </Link>
            {actions}
          </div>
          <span className="hidden text-[26px] leading-none text-royal-800 italic lg:block" style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}>Wellness Without Limits</span>
        </div>
      </div>
    </div>
  )
}
