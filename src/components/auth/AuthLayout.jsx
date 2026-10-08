import BrandPanel from './BrandPanel.jsx'
import LanguageSelect from './LanguageSelect.jsx'

// TODO: point these at the real pages once they exist.
const footerLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms & Conditions', href: '#' },
  { label: 'Need Help?', href: '#' },
]

const YEAR = new Date().getFullYear()

// Shared shell for the pre-authentication screens (ADM-001 → ADM-004).
export default function AuthLayout({ brand, children }) {
  return (
    <div className="flex min-h-full">
      <BrandPanel {...brand} />

      <main className="relative flex flex-1 flex-col bg-lavender-50 px-4 py-6 sm:px-10">
        <div className="flex justify-end">
          <LanguageSelect />
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[26rem]">{children}</div>
        </div>

        <footer className="text-center">
          <nav aria-label="Legal and support" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-royal-900">
            {footerLinks.map((link, i) => (
              <span key={link.label} className="flex items-center gap-3">
                {i > 0 && <span className="text-gray-300" aria-hidden="true">|</span>}
                <a href={link.href} className="hover:text-royal-600 hover:underline">
                  {link.label}
                </a>
              </span>
            ))}
          </nav>
          <p className="mt-3 text-xs text-gray-600">© {YEAR} Lé Inspa. All rights reserved.</p>
        </footer>

        <div className="absolute right-10 bottom-8 hidden text-right xl:block" aria-hidden="true">
          <p className="text-[0.65rem] leading-relaxed font-medium tracking-[0.25em] text-gray-600 uppercase">
            Wellness
            <br />
            Beyond
            <br />
            Borders
          </p>
          <span className="mt-2 ml-auto block h-px w-10 bg-gold-400" />
        </div>
      </main>
    </div>
  )
}
