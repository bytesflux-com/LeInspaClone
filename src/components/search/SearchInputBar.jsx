import { useState, useRef, useEffect } from 'react'
import { Search, X, SlidersHorizontal, MapPin } from 'lucide-react'
import CountryFlag from '../ui/CountryFlag'

export default function SearchInputBar({
  query,
  onSearch,
  selectedMarket,
  onResetMarket,
  onToggleFilters,
}) {
  const [inputValue, setInputValue] = useState(query || '')
  const inputRef = useRef(null)

  useEffect(() => {
    setInputValue(query || '')
  }, [query])

  // Global Ctrl+K / Cmd+K listener
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

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(inputValue)
  }

  const handleClear = () => {
    setInputValue('')
    onSearch('')
    inputRef.current?.focus()
  }

  const isCountryScoped = selectedMarket && selectedMarket.id !== 'ALL'

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
        {/* Main Search Input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            <Search className="size-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search by name, phone, email, ID or reference…"
            className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-12 pr-11 text-sm font-medium text-gray-900 placeholder:text-gray-400 shadow-2xs transition focus:border-[#5c2dd5] focus:ring-4 focus:ring-purple-500/10 focus:outline-none"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-700 transition"
              title="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Primary Search Button */}
        <button
          type="submit"
          className="rounded-2xl bg-[#5c2dd5] px-6 py-3.5 text-sm font-bold text-white shadow-xs hover:bg-[#4a22ad] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>Search</span>
        </button>

        {/* Filters Toggle Button */}
        <button
          type="button"
          onClick={onToggleFilters}
          className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-bold text-gray-700 shadow-2xs hover:bg-gray-50 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="size-4 text-gray-500" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </form>

      {/* Scope Indicator Banner (if restricted to specific country) */}
      {isCountryScoped && (
        <div className="flex items-center justify-between rounded-xl bg-purple-50/60 border border-purple-100 px-3.5 py-1.5 text-xs text-purple-900">
          <div className="flex items-center gap-2">
            <CountryFlag code={selectedMarket.id} className="w-4 h-2.5" />
            <span className="font-semibold">
              Searching <span className="underline">{selectedMarket.name}</span> records only
            </span>
          </div>
          {onResetMarket && (
            <button
              type="button"
              onClick={onResetMarket}
              className="font-bold text-[#5c2dd5] hover:text-[#4922ab] transition underline cursor-pointer"
            >
              Search All Markets
            </button>
          )}
        </div>
      )}
    </div>
  )
}

