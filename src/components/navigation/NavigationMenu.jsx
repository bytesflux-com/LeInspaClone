import { useContext } from 'react'
import { NavLink } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'
import { AdminContext } from '../../context/AdminContext'
import { NAVIGATION_SECTIONS } from '../../constants/navigation'

export default function NavigationMenu({ onNavigate }) {
  const { can } = usePermissions()
  const context = useContext(AdminContext)
  const alertCounts = context?.alertCounts || {}

  const hasChevron = (path) => path === '/verifications' || path === '/withdrawals'

  return (
    <nav className="space-y-5">
      {NAVIGATION_SECTIONS.map((section) => {
        const items = section.items.filter((item) => !item.permission || can(item.permission))
        if (items.length === 0) return null

        return (
          <div key={section.id} className="space-y-1">
            <p className="px-3 py-1 text-[10px] font-bold tracking-wider text-royal-300/50 uppercase">
              {section.section}
            </p>

            <div className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon
                const badgeValue = item.badgeKey ? alertCounts[item.badgeKey] : item.badge
                const showChevron = hasChevron(item.path)

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#5c2dd5] text-white shadow-md font-semibold'
                          : 'text-lavender-200/70 hover:bg-royal-900/60 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`size-4 transition-colors ${
                              isActive ? 'text-white' : 'text-royal-300/70 group-hover:text-lavender-100'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {badgeValue ? (
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                                item.badgeColor || 'bg-royal-800 text-gold-300'
                              }`}
                            >
                              {badgeValue}
                            </span>
                          ) : null}
                          {item.statusDot && <span className={`size-1.5 rounded-full ${item.statusDot}`} />}
                          {showChevron && (
                            <ChevronRight className="size-3 text-royal-400/60 group-hover:text-royal-300" />
                          )}
                        </div>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        )
      })}
    </nav>
  )
}
