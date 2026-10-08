import { CircleAlert, CircleCheck, ShieldCheck, TriangleAlert } from 'lucide-react'

const tones = {
  security: {
    box: 'bg-lavender-100 border-lavender-200',
    badge: 'size-11 rounded-full bg-linear-to-br from-royal-500 to-royal-800 text-white',
    title: 'text-royal-950',
    icon: ShieldCheck,
  },
  error: {
    box: 'bg-danger-50 border-danger-200',
    badge: 'text-danger-600',
    title: 'text-danger-700',
    icon: CircleAlert,
  },
  success: {
    box: 'bg-success-50 border-success-600/20',
    badge: 'text-success-600',
    title: 'text-success-600',
    icon: CircleCheck,
  },
  attention: {
    box: 'bg-attention-50 border-attention-600/20',
    badge: 'text-attention-600',
    title: 'text-attention-600',
    icon: TriangleAlert,
  },
}

export default function Notice({ tone = 'security', title, icon, children, className = '', ...props }) {
  const t = tones[tone]
  const Icon = icon ?? t.icon
  const hasBadge = tone === 'security'

  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={`flex gap-4 rounded-xl border p-4 ${hasBadge ? 'items-center' : 'items-start'} ${t.box} ${className}`}
      {...props}
    >
      <span className={`flex shrink-0 items-center justify-center ${t.badge}`}>
        <Icon className={hasBadge ? 'size-5' : 'mt-0.5 size-[18px]'} aria-hidden="true" />
      </span>
      <div className="min-w-0 text-sm">
        {title && <p className={`font-semibold ${t.title}`}>{title}</p>}
        {children && <div className={`${title ? 'mt-0.5' : ''} text-[0.8rem] leading-relaxed text-gray-700`}>{children}</div>}
      </div>
    </div>
  )
}
