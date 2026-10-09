import { Bell } from 'lucide-react'
import Dropdown from '../ui/Dropdown'

export default function NotificationButton() {
  return (
    <Dropdown
      menuWidth="w-80"
      trigger={() => (
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-xl text-[#2a1b57] transition hover:bg-gray-100"
        >
          <Bell className="size-[22px]" />
          <span className="absolute top-0 right-0 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
            3
          </span>
        </button>
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-100 p-3">
        <p className="text-xs font-semibold text-royal-950 uppercase tracking-wide">
          Real-Time Operational Alerts
        </p>
        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
          3 Active
        </span>
      </div>
      <ul className="p-2 space-y-1.5 text-xs">
        <li className="rounded-xl p-2.5 hover:bg-gray-50 transition cursor-pointer">
          <p className="font-semibold text-gray-900">Provider Credentials Pending</p>
          <p className="text-gray-500 mt-0.5">3 therapist verification packets submitted for review in Kenya.</p>
          <p className="text-[10px] text-gray-400 mt-1">12m ago</p>
        </li>
        <li className="rounded-xl p-2.5 hover:bg-gray-50 transition cursor-pointer">
          <p className="font-semibold text-gray-900">Withdrawal Batch Authorization</p>
          <p className="text-gray-500 mt-0.5">KSh 320,000 batch ready for finance authorization.</p>
          <p className="text-[10px] text-gray-400 mt-1">45m ago</p>
        </li>
        <li className="rounded-xl p-2.5 hover:bg-gray-50 transition cursor-pointer">
          <p className="font-semibold text-gray-900">Escrow Dispute Flagged</p>
          <p className="text-gray-500 mt-0.5">Booking #BK-9104 service duration adjustment request.</p>
          <p className="text-[10px] text-gray-400 mt-1">1h ago</p>
        </li>
      </ul>
    </Dropdown>
  )
}

