import { ChartNoAxesColumnIncreasing, Globe, ShieldCheck } from 'lucide-react'
import Logo from '../brand/Logo.jsx'

// Drop the premium wellness photo at public/brand/admin-login.jpg. Until it
// exists, the purple gradient layer underneath shows on its own.
const BACKGROUND = [
  'linear-gradient(180deg, rgb(23 12 48 / 0.55) 0%, rgb(36 21 71 / 0.35) 40%, rgb(23 12 48 / 0.85) 100%)',
  'linear-gradient(90deg, rgb(36 21 71 / 0.55) 0%, rgb(36 21 71 / 0) 70%)',
  "url('/brand/admin-login.jpg') center / cover no-repeat",
  'radial-gradient(ellipse at 80% 30%, #6f4bbd 0%, transparent 55%)',
  'radial-gradient(ellipse at 20% 90%, #4a2b8a 0%, transparent 60%)',
  'linear-gradient(160deg, #352066 0%, #170c30 100%)',
].join(', ')

// Brand pillars only — nothing operational is shown before authentication.
const defaultPillars = [
  { icon: Globe, title: 'Multi-Country Operations', text: 'One platform. Many markets.' },
  { icon: ShieldCheck, title: 'Trusted & Secure', text: 'Protecting our community.' },
  { icon: ChartNoAxesColumnIncreasing, title: 'Data-Driven Growth', text: 'Insights for a healthier tomorrow.' },
]

function GoldRule() {
  return <span className="block h-px w-10 bg-gold-400" aria-hidden="true" />
}

export default function BrandPanel({
  title = (
    <>
      Lé Inspa
      <span className="block text-gold-300">Administration</span>
    </>
  ),
  statement = 'Manage wellness. Build trust. Scale across markets.',
  pillars = defaultPillars,
  footerTitle = 'Secure Administration Portal',
  footerSubtitle,
}) {
  return (
    <aside
      className="relative hidden flex-col justify-between overflow-hidden px-14 py-12 text-white lg:flex lg:w-[45%] xl:px-16"
      style={{ background: BACKGROUND }}
    >
      <Logo tone="light" size="sm" />

      <div className="max-w-lg py-10">
        <GoldRule />
        <p className="mt-5 text-[0.7rem] font-medium tracking-[0.22em] text-white/80 uppercase">
          People · Places · Wellness · A Brighter Tomorrow
        </p>
        <h1 className="mt-8 font-display text-6xl leading-[1.05] font-medium xl:text-7xl">{title}</h1>
        <p className="mt-6 max-w-sm text-xl leading-snug text-white/90">{statement}</p>

        <ul className="mt-12 space-y-6">
          {pillars.map(({ icon: Icon, title: pillarTitle, text }) => (
            <li key={pillarTitle} className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/5 backdrop-blur-sm">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-medium">{pillarTitle}</span>
                <span className="block text-xs text-white/70">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <GoldRule />
        <p className="mt-4 text-[0.7rem] font-medium tracking-[0.22em] text-white/80 uppercase">{footerTitle}</p>
        {footerSubtitle && (
          <p className="mt-1 text-[0.65rem] font-medium tracking-[0.18em] text-white/60 uppercase">{footerSubtitle}</p>
        )}
      </div>
    </aside>
  )
}
