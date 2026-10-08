import { Globe2 } from 'lucide-react'

/**
 * High-fidelity vector SVG flags and global market icons.
 * Ensures consistent, crisp cross-platform rendering across Windows, macOS, and Linux.
 */
export default function CountryFlag({ code = 'ALL', className = 'w-5 h-3.5' }) {
  const normalized = (code || 'ALL').toUpperCase()

  switch (normalized) {
    case 'KE': // Kenya
      return (
        <svg
          viewBox="0 0 60 40"
          className={`shrink-0 overflow-hidden rounded-xs border border-black/10 shadow-2xs ${className}`}
          aria-label="Kenya Flag"
        >
          <rect width="60" height="40" fill="#006600" />
          <rect width="60" height="26" fill="#FFFFFF" />
          <rect width="60" height="23" fill="#BB0000" />
          <rect width="60" height="13" fill="#FFFFFF" />
          <rect width="60" height="11" fill="#000000" />
          {/* Traditional Maasai Shield */}
          <ellipse cx="30" cy="20" rx="4.5" ry="11" fill="#BB0000" stroke="#FFFFFF" strokeWidth="0.8" />
          <ellipse cx="30" cy="20" rx="1.5" ry="10" fill="#000000" />
          <circle cx="30" cy="20" r="1.2" fill="#FFFFFF" />
        </svg>
      )

    case 'UG': // Uganda
      return (
        <svg
          viewBox="0 0 60 40"
          className={`shrink-0 overflow-hidden rounded-xs border border-black/10 shadow-2xs ${className}`}
          aria-label="Uganda Flag"
        >
          <rect width="60" height="6.67" y="0" fill="#000000" />
          <rect width="60" height="6.67" y="6.67" fill="#FCDC04" />
          <rect width="60" height="6.67" y="13.33" fill="#D90000" />
          <rect width="60" height="6.67" y="20" fill="#000000" />
          <rect width="60" height="6.67" y="26.67" fill="#FCDC04" />
          <rect width="60" height="6.67" y="33.33" fill="#D90000" />
          {/* Crest Crane Disc */}
          <circle cx="30" cy="20" r="6" fill="#FFFFFF" />
          <circle cx="30" cy="18" r="2.5" fill="#000000" />
          <path d="M29 20 L31 24 L28 25 Z" fill="#D90000" />
        </svg>
      )

    case 'TZ': // Tanzania
      return (
        <svg
          viewBox="0 0 60 40"
          className={`shrink-0 overflow-hidden rounded-xs border border-black/10 shadow-2xs ${className}`}
          aria-label="Tanzania Flag"
        >
          <polygon points="0,0 60,0 0,40" fill="#1EB53A" />
          <polygon points="60,0 60,40 0,40" fill="#00A3DD" />
          {/* Diagonal Band with Yellow Fimbriation */}
          <polygon points="0,40 20,40 60,13.3 60,0 40,0 0,26.7" fill="#FCD116" />
          <polygon points="0,40 14,40 60,9.3 60,0 46,0 0,30.7" fill="#000000" />
        </svg>
      )

    case 'RW': // Rwanda
      return (
        <svg
          viewBox="0 0 60 40"
          className={`shrink-0 overflow-hidden rounded-xs border border-black/10 shadow-2xs ${className}`}
          aria-label="Rwanda Flag"
        >
          <rect width="60" height="20" fill="#00A1DE" />
          <rect width="60" height="10" y="20" fill="#FAD201" />
          <rect width="60" height="10" y="30" fill="#20603D" />
          {/* Sun symbol in top right */}
          <circle cx="48" cy="10" r="4.5" fill="#E5A100" />
          <circle cx="48" cy="10" r="3.2" fill="#FAD201" />
        </svg>
      )

    case 'ZA': // South Africa
      return (
        <svg
          viewBox="0 0 60 40"
          className={`shrink-0 overflow-hidden rounded-xs border border-black/10 shadow-2xs ${className}`}
          aria-label="South Africa Flag"
        >
          <rect width="60" height="20" fill="#DE3831" />
          <rect width="60" height="20" y="20" fill="#002395" />
          {/* White border */}
          <polygon points="0,0 26,20 0,40" fill="#000000" />
          <polygon points="0,0 0,4 21,20 0,36 0,40 27,20" fill="#FFB612" />
          <polygon points="0,0 0,2 24,20 0,38 0,40 26,20" fill="#000000" />
          {/* Green Horizontal Y */}
          <polygon points="18,0 32,15 60,15 60,12 30,12 18,0" fill="#FFFFFF" />
          <polygon points="18,40 32,25 60,25 60,28 30,28 18,40" fill="#FFFFFF" />
          <polygon points="20,0 35,16 60,16 60,24 35,24 20,40 10,40 25,20 10,0" fill="#007A4D" />
        </svg>
      )

    case 'ALL':
    default:
      return (
        <div className="flex size-4.5 items-center justify-center rounded-full bg-purple-50 text-[#5c2dd5]">
          <Globe2 className="size-3.5" />
        </div>
      )
  }
}

