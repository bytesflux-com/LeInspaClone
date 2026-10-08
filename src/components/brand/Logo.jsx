import { useState } from 'react'

// Drop the real logo files into public/brand/ and they replace the placeholder
// automatically. Use a full lockup (mark + wordmark + tagline).
const LOGO_SRC = {
  dark: '/brand/logo.svg', // for light backgrounds
  light: '/brand/logo-on-dark.svg', // for the purple brand panel
}

const sizes = {
  sm: { mark: 'h-9', word: 'text-[1.7rem]', tag: 'text-[0.5rem]', img: 'h-20' },
  md: { mark: 'h-10', word: 'text-[2rem]', tag: 'text-[0.55rem]', img: 'h-24' },
}

function LotusMark({ className }) {
  return (
    <svg viewBox="0 0 64 40" fill="none" className={className} aria-hidden="true">
      <g fill="currentColor">
        <path d="M32 2c5 6 7.5 13 7.5 19S36.5 33 32 38c-4.5-5-7.5-11-7.5-17S27 8 32 2z" />
        <path d="M30 38C22 36 16 30 14 21c-.8-3.5-.8-7 .2-10.5 6 3.5 10.5 9 13 16 1.4 3.8 2.3 7.6 2.8 11.5z" opacity=".9" />
        <path d="M34 38c8-2 14-8 16-17 .8-3.5.8-7-.2-10.5-6 3.5-10.5 9-13 16-1.4 3.8-2.3 7.6-2.8 11.5z" opacity=".9" />
        <path d="M28 38.5C18.5 38.8 9.5 35 3 27.5c4.2-1.6 8.7-1.9 13-.8 5.4 1.4 9.4 5.6 12 11.8z" opacity=".75" />
        <path d="M36 38.5c9.5.3 18.5-3.5 25-11-4.2-1.6-8.7-1.9-13-.8-5.4 1.4-9.4 5.6-12 11.8z" opacity=".75" />
      </g>
    </svg>
  )
}

export default function Logo({ tone = 'dark', size = 'md', align = 'center', className = '' }) {
  const [imageFailed, setImageFailed] = useState(false)
  const s = sizes[size]
  const alignment = align === 'start' ? 'items-start text-left' : 'items-center text-center'

  if (!imageFailed) {
    return (
      <img
        src={LOGO_SRC[tone]}
        alt="Lé Inspa — Wellness for a better you"
        onError={() => setImageFailed(true)}
        className={`${s.img} w-auto ${className}`}
      />
    )
  }

  return (
    <div className={`inline-flex flex-col ${alignment} ${className}`} aria-label="Lé Inspa — Wellness for a better you" role="img">
      <LotusMark className={`${s.mark} w-auto text-gold-400`} />
      <span
        className={`font-display ${s.word} mt-1 leading-none font-medium ${
          tone === 'light' ? 'text-white' : 'text-royal-900'
        }`}
      >
        Lé Inspa
      </span>
      <span
        className={`${s.tag} mt-1.5 font-medium tracking-[0.18em] uppercase ${
          tone === 'light' ? 'text-white/80' : 'text-royal-800/80'
        }`}
      >
        Wellness for a better you
      </span>
    </div>
  )
}
