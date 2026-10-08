import { Command } from 'lucide-react'

export default function SearchHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
      <div>
        <h1 className="text-2xl font-black text-gray-950 tracking-tight">Global Search</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
          Find clients, providers, bookings, payments and operational records across Lé Inspa.
        </p>
      </div>

      <div className="flex items-center gap-4 self-start md:self-auto">
        {/* Brand Tagline in Elegant Script */}
        <div className="hidden lg:flex flex-col items-end">
          <span className="font-display italic text-lg text-gold-500 font-medium tracking-wide">
            Wellness Without Limits
          </span>
        </div>

        {/* Keyboard Shortcut Indicator */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white px-3 py-1.5 shadow-2xs">
          <kbd className="inline-flex items-center gap-0.5 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold text-gray-700">
            <Command className="size-3" />
            <span>K</span>
            <span className="text-gray-400 font-normal">/</span>
            <span>Ctrl K</span>
          </kbd>
          <span className="text-[11px] font-medium text-gray-500">Quick search</span>
        </div>
      </div>
    </div>
  )
}

