import { cn } from '../../lib/utils'

const BACKDROPS = ['#e9defa', '#d7ecf7', '#fde8d4', '#dff3e4', '#fbe0e6', '#e4e2f7']
const SKINS = ['#8d5a3b', '#a56b46', '#6f4429', '#c68a62', '#5a3722']
const CLOTHES = ['#3f2a8c', '#2b3a67', '#8b3a62', '#2f6b58', '#a8742d']
const HAIR = '#1b1210'

function hash(text = '') {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h
}

// Shows the person's photo when one exists, otherwise a stylised portrait
// picked deterministically from their name (no initials, no external assets).
export default function PersonAvatar({ name = '', src, gender = 'f', size = 36, className = '' }) {
  const h = hash(name)
  const backdrop = BACKDROPS[h % BACKDROPS.length]
  const skin = SKINS[(h >> 3) % SKINS.length]
  const clothes = CLOTHES[(h >> 5) % CLOTHES.length]
  const styles = gender === 'm' ? ['short', 'short', 'afro'] : ['long', 'afro', 'long']
  const style = styles[(h >> 7) % styles.length]

  return (
    <span
      className={cn('inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-black/5', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={name || 'Avatar'}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <svg viewBox="0 0 64 64" className="size-full" aria-hidden="true">
          <rect width="64" height="64" fill={backdrop} />
          {style === 'afro' && <circle cx="32" cy="26" r="15.5" fill={HAIR} />}
          {style === 'long' && <path d="M16.5 31c0-13 6-20 15.5-20s15.5 7 15.5 20v22h-31z" fill={HAIR} />}
          <path d="M6 64c1-11 11-17 26-17s25 6 26 17z" fill={clothes} />
          <rect x="27" y="36" width="10" height="13" rx="4" fill={skin} />
          <ellipse cx="32" cy="28" rx="10.5" ry="12.5" fill={skin} />
          <path d="M21.5 27c-.5-9 4-14.5 10.5-14.5S42.5 18 42.5 27c-2-5-5-7.5-10.5-7.5S23.5 22 21.5 27z" fill={HAIR} />
        </svg>
      )}
    </span>
  )
}
