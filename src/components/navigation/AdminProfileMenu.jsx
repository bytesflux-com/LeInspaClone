import { ChevronDown, Lock, LogOut, Shield } from 'lucide-react'
import { useAdminSession } from '../../hooks/useAdminSession'
import { useAuth } from '../../hooks/useAuth'
import Dropdown from '../ui/Dropdown'

export default function AdminProfileMenu() {
  const { admin, role, lockSession } = useAdminSession()
  const { logout } = useAuth()

  const adminName = admin?.fullName || 'Wallen Nyaberi'
  const adminRole = admin?.roleName || (role === 'super_admin' ? 'Super Admin' : role)

  const initials = adminName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

  return (
    <Dropdown
      menuWidth="w-56"
      trigger={({ open }) => (
        <button
          type="button"
          aria-label="Admin Profile Menu"
          className="flex items-center gap-2.5 rounded-xl border border-transparent p-1 pl-1.5 transition hover:bg-gray-100/70 focus:outline-none"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-royal-900 text-xs font-bold text-gold-400 shadow-xs ring-1 ring-royal-800">
            {initials}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold leading-tight text-gray-900">{adminName}</p>
            <p className="text-[11px] leading-tight text-gray-500">{adminRole}</p>
          </div>
          <ChevronDown className={`size-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
    >
      <div className="border-b border-gray-100 px-3 py-2.5">
        <p className="text-xs font-bold text-royal-950">{adminName}</p>
        <p className="text-[11px] text-gray-500">{adminRole}</p>
        <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
          <Shield className="size-3" /> 2FA Verified
        </span>
      </div>
      <div className="space-y-0.5 py-1">
        <button
          type="button"
          onClick={() => lockSession('manual')}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-100/80 transition"
        >
          <Lock className="size-4 text-gray-500" />
          Lock Admin Session
        </button>
      </div>
      <div className="border-t border-gray-100 pt-1">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
        >
          <LogOut className="size-4" />
          Sign Out
        </button>
      </div>
    </Dropdown>
  )
}

