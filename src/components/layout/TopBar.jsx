import { Menu, X } from 'lucide-react'
import GlobalSearch from '../navigation/GlobalSearch'
import MarketSelector from '../navigation/MarketSelector'
import DateRangeSelector from '../navigation/DateRangeSelector'
import NotificationButton from '../navigation/NotificationButton'
import AdminProfileMenu from '../navigation/AdminProfileMenu'

export default function TopBar({ onToggleSidebar, sidebarOpen }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200/90 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex flex-1 items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex size-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <GlobalSearch />
      </div>

      {/* Right Controls: Market Selector, Date Filter, Bell, Admin Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <MarketSelector />
        <DateRangeSelector />
        <NotificationButton />
        <AdminProfileMenu />
      </div>
    </header>
  )
}

