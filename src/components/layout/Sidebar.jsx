import { ChevronRight, Headphones, Sparkles, X } from 'lucide-react'
import NavigationMenu from '../navigation/NavigationMenu'
import Logo from '../brand/Logo.jsx'

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 shrink-0 flex-col bg-linear-to-b from-[#2b1175] via-[#260f6a] to-[#1c0a52] text-white transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-2xl md:shadow-none select-none`}
      >
        {/* Top Header: Logo + • ADMINISTRATION • */}
        <div className="flex h-[70px] shrink-0 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center">
              <svg viewBox="0 0 64 40" fill="none" className="size-9 text-gold-400" aria-hidden="true">
                <g fill="currentColor">
                  <path d="M32 2c5 6 7.5 13 7.5 19S36.5 33 32 38c-4.5-5-7.5-11-7.5-17S27 8 32 2z" />
                  <path d="M30 38C22 36 16 30 14 21c-.8-3.5-.8-7 .2-10.5 6 3.5 10.5 9 13 16 1.4 3.8 2.3 7.6 2.8 11.5z" opacity=".9" />
                  <path d="M34 38c8-2 14-8 16-17 .8-3.5.8-7-.2-10.5-6 3.5-10.5 9-13 16-1.4 3.8-2.3 7.6-2.8 11.5z" opacity=".9" />
                  <path d="M28 38.5C18.5 38.8 9.5 35 3 27.5c4.2-1.6 8.7-1.9 13-.8 5.4 1.4 9.4 5.6 12 11.8z" opacity=".75" />
                  <path d="M36 38.5c9.5.3 18.5-3.5 25-11-4.2-1.6-8.7-1.9-13-.8-5.4 1.4-9.4 5.6-12 11.8z" opacity=".75" />
                </g>
              </svg>
            </div>
            <div>
              <span className="font-display text-lg font-medium tracking-wide text-white">Lé Inspa</span>
              <p className="text-[9px] font-semibold tracking-[0.2em] text-gold-400 uppercase">
                ADMINISTRATION
              </p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-lavender-200/70 hover:bg-royal-900 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-royal-900">
          <NavigationMenu
            onNavigate={() => {
              if (window.innerWidth < 768 && onClose) onClose()
            }}
          />
        </div>

        {/* Bottom Card: Need Help? Contact Admin Support */}
        <div className="shrink-0 p-3.5">
          <div className="flex items-center gap-3 rounded-2xl border border-white/30 p-2.5 text-left">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/60 text-white">
              <Headphones className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white leading-tight">Need Help?</p>
              <p className="text-[10.5px] text-white/80 whitespace-nowrap leading-tight mt-0.5">Contact Admin Support</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
