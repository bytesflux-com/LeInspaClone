import { useState } from 'react'
import { Outlet, useMatches } from 'react-router'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAdminSession } from '../../hooks/useAdminSession'
import SessionVerification from '../session/SessionVerification'
import { useAuth } from '../../hooks/useAuth'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { lock, admin, unlockSession } = useAdminSession()
  const { logout } = useAuth()
  // Routes can opt out of the default page padding with `handle: { fullBleed: true }`
  const fullBleed = useMatches().some((m) => m.handle?.fullBleed)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50/50">
      {/* Deep Royal-Purple Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Reusable Global TopBar */}
        <TopBar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        {/* Viewport with Breathing Room */}
        <main
          inert={lock.locked || undefined}
          aria-hidden={lock.locked || undefined}
          className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 transition-[filter] duration-300 ${
            fullBleed ? 'bg-[#f7f6fc]' : 'p-6 md:p-8 lg:p-10'
          } ${
            lock.locked ? 'pointer-events-none blur-[6px] select-none' : ''
          }`}
        >
          <Outlet />
        </main>
      </div>

      {/* ADM-004 In-Session Lock / Verification Checkpoint */}
      {lock.locked && (
        <SessionVerification
          identity={admin}
          lockedAt={lock.lockedAt}
          onVerified={() => unlockSession()}
          onSignOut={logout}
        />
      )}
    </div>
  )
}
