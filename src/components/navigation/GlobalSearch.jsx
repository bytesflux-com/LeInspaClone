import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Search, X, User, Briefcase, Building2, Calendar, ArrowRight, Sparkles } from 'lucide-react'
import CountryFlag from '../ui/CountryFlag'

const QUICK_SUGGESTIONS = [
  {
    category: 'People',
    items: [
      { id: '1', title: 'Grace Njeri', subtitle: 'Client', role: 'client', market: 'KE', link: '/search?q=Grace%20Njeri&category=clients' },
      { id: '2', title: 'Grace Njeri', subtitle: 'Massage Therapist', role: 'provider', market: 'KE', link: '/search?q=Grace%20Njeri&category=providers' },
    ],
  },
  {
    category: 'Businesses',
    items: [
      { id: '3', title: 'Serenity Wellness Spa', subtitle: 'Spa & Wellness Center · 3 Branches', market: 'KE', link: '/search?q=Serenity%20Wellness%20Spa&category=spas' },
      { id: '4', title: 'Sarova Wellness Resort', subtitle: 'Hotel / Wellness Resort', market: 'KE', link: '/search?q=Sarova%20Wellness%20Resort&category=hotels' },
    ],
  },
  {
    category: 'Bookings & Orders',
    items: [
      { id: '5', title: '#LI-48291', subtitle: 'Deep Tissue Massage · Grace Njeri', market: 'KE', link: '/search?q=LI-48291&category=bookings' },
    ],
  },
]

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Global shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setIsOpen(false)
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const handleSelectItem = (link) => {
    setIsOpen(false)
    setQuery('')
    navigate(link)
  }

  const hasQuery = query.trim().length > 0

  return (
    <div ref={containerRef} className="relative w-full max-w-md lg:max-w-lg">
      <form onSubmit={handleSubmit}>
        <label htmlFor="global-search" className="sr-only">
          Search clients, providers, bookings, payments
        </label>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
          <Search className="size-4" aria-hidden="true" />
        </div>
        <input
          ref={inputRef}
          id="global-search"
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          placeholder="Search clients, providers, bookings, payments…"
          className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2 pr-9 pl-9 text-xs text-gray-900 placeholder:text-gray-400 transition focus:border-[#5c2dd5] focus:bg-white focus:ring-3 focus:ring-purple-500/15 focus:outline-none sm:text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="size-3.5" />
          </button>
        )}
      </form>

      {/* Quick Search Floating Panel (ADM-007 Item 11) */}
      {isOpen && hasQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-gray-200/90 bg-white shadow-xl overflow-hidden animate-in fade-in duration-150">
          <div className="p-3 bg-purple-50/40 border-b border-purple-100/60 flex items-center justify-between text-xs">
            <span className="font-bold text-gray-900">
              Quick results for <span className="text-[#5c2dd5]">"{query}"</span>
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Press Enter for full search</span>
          </div>

          <div className="max-h-80 overflow-y-auto p-2 divide-y divide-gray-100 text-xs">
            {QUICK_SUGGESTIONS.map((section) => (
              <div key={section.category} className="py-2 first:pt-1 last:pb-1">
                <p className="px-2 pb-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                  {section.category}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectItem(item.link)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-purple-50 text-left transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {section.category === 'People' && (
                          <User className="size-3.5 text-purple-600 shrink-0" />
                        )}
                        {section.category === 'Businesses' && (
                          <Building2 className="size-3.5 text-blue-600 shrink-0" />
                        )}
                        {section.category === 'Bookings & Orders' && (
                          <Calendar className="size-3.5 text-emerald-600 shrink-0" />
                        )}
                        <span className="font-bold text-gray-900 group-hover:text-[#5c2dd5] truncate">
                          {item.title}
                        </span>
                        <span className="text-gray-400 font-normal truncate">
                          — {item.subtitle}
                        </span>
                      </div>
                      <CountryFlag code={item.market} className="w-3.5 h-2.5 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer: View All Results */}
          <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-bold text-[#5c2dd5] hover:text-[#4a22ad] transition cursor-pointer"
            >
              <span>View All Results for "{query}"</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
