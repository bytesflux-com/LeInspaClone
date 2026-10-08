import { AlertCircle, ArrowRight, CheckCircle2, DollarSign, Scale, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router'
import AttentionCard from './AttentionCard'

export default function AttentionSection({ attention }) {
  if (!attention) return null

  const verification = attention.verification
  const withdrawals = attention.withdrawals
  const disputes = attention.disputes
  const safety = attention.safety

  return (
    <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertCircle className="size-4" />
            </span>
            <h2 className="text-base font-bold text-royal-950">Needs Your Attention</h2>
          </div>
          <Link
            to="/verifications"
            className="inline-flex items-center gap-1 text-xs font-semibold text-royal-700 hover:text-royal-900"
          >
            <span>View All</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">Items requiring Admin review or action</p>

        {/* 4 Cards Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AttentionCard
            title="Provider Verification"
            count={verification?.pending ?? 18}
            subtitle="Pending Reviews"
            link="/verifications"
            badgeIcon={CheckCircle2}
            badgeBg="bg-purple-100 text-purple-700"
          />

          <AttentionCard
            title="Withdrawals"
            count={withdrawals?.pending ?? 7}
            subtitle="Awaiting Approval"
            link="/withdrawals"
            badgeIcon={DollarSign}
            badgeBg="bg-amber-100 text-amber-700"
          />

          <AttentionCard
            title="Disputes"
            count={disputes?.open ?? 3}
            subtitle="Open Cases"
            link="/disputes"
            badgeIcon={Scale}
            badgeBg="bg-rose-100 text-rose-700"
          />

          <AttentionCard
            title="Safety"
            count={safety?.incidents ?? 2}
            subtitle="High Priority"
            link="/safety"
            badgeIcon={ShieldAlert}
            badgeBg="bg-rose-100 text-rose-700"
          />
        </div>
      </div>
    </div>
  )
}
