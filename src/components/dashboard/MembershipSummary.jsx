import { Crown, ArrowUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatNumber } from '../../lib/utils'
import { formatDisplayCurrency } from '../../lib/currency'

const DEFAULT_TIERS = [
  { name: 'Standard', percent: 68, color: '#5c2dd5' },
  { name: 'Premium', percent: 24, color: '#3b82f6' },
  { name: 'Executive', percent: 8, color: '#f59e0b' },
]

export default function MembershipSummary({ membership }) {
  if (!membership) return null

  const totalClients = membership.totalClients ?? 6842
  const trend = membership.trend ?? '+11%'
  const tiers = membership.tiers || DEFAULT_TIERS
  const paidRevenue = membership.paidRevenue ?? 912400
  const revenueTrend = membership.revenueTrend ?? '+19%'
  const newUpgrades = membership.newUpgrades ?? 142
  const upgradeTrend = membership.upgradeTrend ?? '+27%'
  const currency = membership.currency || 'KES'

  // Circumference calculation for crisp SVG Donut
  const radius = 34
  const circumference = 2 * Math.PI * radius
  let accumulatedPercent = 0

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Crown className="size-5 text-amber-500" />
          <h2 className="text-base font-bold text-gray-900">Membership</h2>
        </div>

        {/* Top Total Clients Count */}
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-xs text-gray-500 font-medium">Total Clients</div>
            <div className="text-2xl font-extrabold text-gray-900 tabular-nums">
              {formatNumber(totalClients)}
            </div>
          </div>
          <div className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
            <ArrowUp className="size-3.5" />
            <span>{trend}</span>
          </div>
        </div>

        {/* Donut Chart + Legend */}
        <div className="flex items-center justify-around py-2">
          {/* SVG Donut */}
          <div className="relative flex size-24 items-center justify-center">
            <svg className="size-24 -rotate-90 transform" viewBox="0 0 88 88">
              <circle
                cx="44"
                cy="44"
                r={radius}
                className="stroke-gray-100"
                strokeWidth="10"
                fill="transparent"
              />
              {tiers.map((t) => {
                const strokeDasharray = `${(t.percent / 100) * circumference} ${circumference}`
                const strokeDashoffset = -((accumulatedPercent / 100) * circumference)
                accumulatedPercent += t.percent

                return (
                  <circle
                    key={t.name}
                    cx="44"
                    cy="44"
                    r={radius}
                    stroke={t.color}
                    strokeWidth="10"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700"
                  />
                )
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-xs">
            {tiers.map((t) => (
              <div key={t.name} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                <span className="text-gray-600 font-medium w-16">{t.name}</span>
                <span className="font-bold text-gray-900 tabular-nums">{t.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom 2 metric boxes */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
          <div className="rounded-xl bg-gray-50/70 p-2.5">
            <p className="text-[11px] text-gray-500 font-medium truncate">Paid Membership Revenue</p>
            <p className="text-xs sm:text-sm font-extrabold text-gray-900 tabular-nums mt-0.5">
              {formatDisplayCurrency(paidRevenue, currency)}
            </p>
            <div className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 mt-0.5">
              <ArrowUp className="size-3" />
              <span>{revenueTrend}</span>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50/70 p-2.5">
            <p className="text-[11px] text-gray-500 font-medium truncate">New Upgrades</p>
            <p className="text-xs sm:text-sm font-extrabold text-gray-900 tabular-nums mt-0.5">
              {formatNumber(newUpgrades)}
            </p>
            <div className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 mt-0.5">
              <ArrowUp className="size-3" />
              <span>{upgradeTrend}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2 text-center">
        <Link
          to="/memberships"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5c2dd5] hover:text-[#4922ab] transition-colors"
        >
          <span>View Memberships</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}
