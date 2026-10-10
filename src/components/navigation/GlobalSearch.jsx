import { useContext, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Search, X, User, Briefcase, Building2, Calendar, ArrowRight, Sparkles } from 'lucide-react'
import { AdminContext } from '../../context/AdminContext'
import { searchService } from '../../services/searchService'
import { useMarketContext } from '../../hooks/useMarketContext'
import CountryFlag from '../ui/CountryFlag'

export default function GlobalSearch() {
  const navigate = useNavigate()
  const context = useContext(AdminContext)
  const { selectedMarket } = useMarketContext()

  const searchQuery = context?.searchQuery || ''
  const setSearchQuery = context?.setSearchQuery || (() => {})

  const [isOpen, setIsOpen] = useState(false)
  const [quickResults, setQuickResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced fetch for quick results
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setQuickResults(null)
      return
    }

    let isCurrent = true
    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const res = await searchService.search({
          query: searchQuery,
          marketId: selectedMarket?.id || 'ALL',
          category: 'all',
        })
        if (isCurrent) {
          setQuickResults(res)
          setLoading(false)
        }
      } catch (err) {
        if (isCurrent) setLoading(false)
      }
    }, 200)

    return () => {
      isCurrent = false
      clearTimeout(timer)
    }
  }, [searchQuery, selectedMarket?.id])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (searchQuery.trim()) {
        setIsOpen(false)
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleSelectResult = (link) => {
    setIsOpen(false)
    if (link) navigate(link)
  }

  const handleViewAll = () => {
    setIsOpen(false)
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const results = quickResults?.results || {}
  const people = [...(results.clients || []), ...(results.providers || [])].slice(0, 3)
  const businesses = [...(results.spas || []), ...(results.hotels || [])].slice(0, 2)
  const bookings = (results.bookings || []).slice(0, 2)
  const hasAnyResults = people.length > 0 || businesses.length > 0 || bookings.length > 0

  return (
    <div ref={containerRef} className="relative w-full max-w-md lg:max-w-[560px]">
      <label htmlFor="global-search" className="sr-only">
        Search clients, providers, bookings, payments
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#2a1b57]">
          <Search className="size-4" aria-hidden="true" />
        </div>
        <input
          ref={inputRef}
          id="global-search"
          type="text"
          value={searchQuery}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search clients, providers, bookings, payments..."
          className="w-full rounded-xl border border-[#ddd6f0] bg-white py-2 pr-16 pl-9 text-xs text-gray-900 placeholder:text-gray-400 transition focus:border-[#5c2dd5] focus:bg-white focus:ring-3 focus:ring-purple-500/15 focus:outline-none sm:text-sm"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1.5">
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setQuickResults(null)
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 shadow-2xs">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Quick Search Popover Dropdown (Requirement 11) */}
      {isOpen && searchQuery.trim().length >= 2 && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-full rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl backdrop-blur-md">
          {loading ? (
            <div className="py-4 text-center text-xs text-gray-400">Searching platform...</div>
          ) : hasAnyResults ? (
            <div className="space-y-3">
              {/* People Section */}
              {people.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                    People
                  </div>
                  <div className="space-y-0.5">
                    {people.map((p) => (
                      <button
                        key={p.id + p.type}
                        type="button"
                        onClick={() => handleSelectResult(p.link)}
                        className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition hover:bg-purple-50/50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="size-3.5 text-[#5c2dd5] shrink-0" />
                          <span className="font-semibold text-gray-900 truncate">{p.name}</span>
                          <span className="text-[11px] text-gray-500">
                            — {p.type === 'client' ? 'Client' : p.specialty || 'Provider'}
                          </span>
                        </div>
                        {p.market && <CountryFlag code={p.market} className="w-3.5 h-2.5 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Businesses Section */}
              {businesses.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                    Businesses
                  </div>
                  <div className="space-y-0.5">
                    {businesses.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleSelectResult(b.link)}
                        className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition hover:bg-purple-50/50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="size-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold text-gray-900 truncate">{b.name}</span>
                          <span className="text-[11px] text-gray-500">
                            — {b.category || (b.type === 'spa' ? 'Spa' : 'Hotel')}
                          </span>
                        </div>
                        {b.market && <CountryFlag code={b.market} className="w-3.5 h-2.5 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bookings Section */}
              {bookings.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                    Bookings
                  </div>
                  <div className="space-y-0.5">
                    {bookings.map((bk) => (
                      <button
                        key={bk.id}
                        type="button"
                        onClick={() => handleSelectResult(bk.link)}
                        className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition hover:bg-purple-50/50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="size-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-gray-900">{bk.reference || bk.id}</span>
                          <span className="text-[11px] text-gray-500 truncate">
                            — {bk.service} ({bk.clientName})
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-gray-700">{bk.amount}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom: View All Results */}
              <div className="border-t border-gray-100 pt-2">
                <button
                  type="button"
                  onClick={handleViewAll}
                  className="flex w-full items-center justify-between rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold text-[#5c2dd5] transition hover:bg-purple-100/70"
                >
                  <span>View All Results for "{searchQuery}"</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-gray-500">No instant preview found.</p>
              <button
                type="button"
                onClick={handleViewAll}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#5c2dd5] hover:underline"
              >
                Press Enter to open full search <ArrowRight className="size-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
