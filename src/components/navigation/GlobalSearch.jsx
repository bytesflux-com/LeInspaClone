import { useContext } from 'react'
import { Search, X } from 'lucide-react'
import { AdminContext } from '../../context/AdminContext'

export default function GlobalSearch() {
  const context = useContext(AdminContext)
  const searchQuery = context?.searchQuery || ''
  const setSearchQuery = context?.setSearchQuery || (() => {})

  return (
    <div className="relative w-full max-w-md lg:max-w-lg">
      <label htmlFor="global-search" className="sr-only">
        Search clients, providers, bookings, payments
      </label>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
        <Search className="size-4" aria-hidden="true" />
      </div>
      <input
        id="global-search"
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search clients, providers, bookings, payments…"
        className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2 pr-9 pl-9 text-xs text-gray-900 placeholder:text-gray-400 transition focus:border-royal-500 focus:bg-white focus:ring-3 focus:ring-royal-500/15 focus:outline-none sm:text-sm"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

