import { useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  CalendarCheck,
  Wallet,
  CreditCard,
  Star,
  LifeBuoy,
  History,
  FileCheck,
  ExternalLink,
  ChevronRight,
  Plus,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react'
import { Link } from 'react-router'

export function VerificationTabView({ profile, onOpenContentReview, onShowToast }) {
  const ver = profile?.verification || {}

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Compliance Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Verification & Compliance Review
            </h2>
            <p className="text-xs text-slate-500">
              Identity, professional credentials, and regulatory compliance standards.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onShowToast?.('Opening full verification dossier')}
          className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition"
        >
          Review Verification Dossier
        </button>
      </div>

      {/* Verification Checklist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Identity Verification */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-sm">Identity Verification</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Approved
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            National ID verified via automated OCR and biometrics match against platform records.
          </p>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
            <span>Verified: 14 Jan 2026</span>
            <span className="text-purple-700 font-medium">Confidence: 99.4%</span>
          </div>
        </div>

        {/* Professional Credentials */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-sm">Professional Credentials</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Approved
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Accredited diploma & professional body certification validated by Lé Inspa verification team.
          </p>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
            <span>Verified: 15 Jan 2026</span>
            <span className="text-purple-700 font-medium">Audited by Jane M.</span>
          </div>
        </div>

        {/* Profile Information */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-sm">Profile Information</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Approved
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Public bio, languages, experience claims, and service areas verified against guidelines.
          </p>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
            <span>Verified: 15 Jan 2026</span>
            <span className="text-emerald-700 font-medium">Zero Red Flags</span>
          </div>
        </div>

        {/* Profile Photo */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-sm">Profile Photo</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="size-3.5 text-amber-600" /> Awaiting Review
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            New seasonal headshot submitted by provider. Awaiting visual audit against lighting and background policy.
          </p>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between items-center">
            <span>Submitted: 10 Sep 2026</span>
            <button
              type="button"
              onClick={onOpenContentReview}
              className="text-purple-700 font-bold hover:underline"
            >
              Review Photo →
            </button>
          </div>
        </div>

        {/* Supporting Documents */}
        <div className="col-span-1 md:col-span-2 p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-sm">Supporting Documents & Licences</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Approved (3 Documents)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="font-medium text-slate-800">Police Clearance</span>
              <span className="text-emerald-700 font-bold">Valid</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="font-medium text-slate-800">Tax Compliance</span>
              <span className="text-emerald-700 font-bold">Valid</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="font-medium text-slate-800">First Aid & CPR</span>
              <span className="text-emerald-700 font-bold">Valid</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ServicesTabView({ profile, onShowToast }) {
  const services = profile?.services || []

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Provider Services Catalogue ({services.length})
          </h2>
          <p className="text-xs text-slate-500">
            Active and archived treatments, duration, and pricing configuration.
          </p>
        </div>
        <Link
          to={`/providers/${profile.id}/services`}
          className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition"
        >
          Manage in Services Hub →
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100 text-xs">
          <div className="grid grid-cols-12 p-3 bg-slate-50 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-5">Service Title</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2 text-center">Duration</div>
            <div className="col-span-2 text-right">Price (KES)</div>
            <div className="col-span-1 text-right">Status</div>
          </div>
          {services.map((srv) => (
            <div
              key={srv.id}
              className="grid grid-cols-12 items-center p-3 hover:bg-slate-50/50 transition"
            >
              <div className="col-span-5 flex items-center gap-3">
                <img
                  src={srv.image || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=120'}
                  alt={srv.name}
                  className="size-10 rounded-lg object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{srv.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{srv.description || 'Specialized wellness therapy'}</p>
                </div>
              </div>
              <div className="col-span-2 font-medium text-slate-600">{srv.category || 'Therapy'}</div>
              <div className="col-span-2 text-center text-slate-500 font-mono">{srv.duration}</div>
              <div className="col-span-2 text-right font-bold text-slate-900">{srv.price}</div>
              <div className="col-span-1 text-right">
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function BookingsTabView({ profile }) {
  const recent = profile?.bookingPerformance?.recentBookings || []

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Booking Operations History ({profile.bookingPerformance?.total || 284})
          </h2>
          <p className="text-xs text-slate-500">
            Real-time appointments, upcoming client requests, and fulfilment status.
          </p>
        </div>
        <Link
          to={`/providers/${profile.id}/bookings`}
          className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition"
        >
          Manage Bookings & Earnings →
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100 text-xs">
          <div className="grid grid-cols-12 p-3 bg-slate-50 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-2">Booking ID</div>
            <div className="col-span-3">Client</div>
            <div className="col-span-3">Service</div>
            <div className="col-span-2">Scheduled Date</div>
            <div className="col-span-1 text-right">Amount</div>
            <div className="col-span-1 text-right">Status</div>
          </div>
          {recent.map((b) => (
            <div key={b.id} className="grid grid-cols-12 items-center p-3 hover:bg-slate-50/50 transition">
              <div className="col-span-2 font-mono font-bold text-purple-700">{b.id}</div>
              <div className="col-span-3 font-semibold text-slate-800">{b.client}</div>
              <div className="col-span-3 text-slate-600">{b.service}</div>
              <div className="col-span-2 text-slate-500">{b.date}</div>
              <div className="col-span-1 text-right font-bold text-slate-900">{b.price}</div>
              <div className="col-span-1 text-right">
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    b.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : b.status === 'Confirmed'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EarningsTabView({ profile, canSeeFinancial }) {
  const earnings = profile?.earnings || {}
  const [unmasked, setUnmasked] = useState(false)

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Provider Financial Position & Escrow
          </h2>
          <p className="text-xs text-slate-500">
            Audited balances, payout schedules, and bank account custody.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canSeeFinancial && (
            <button
              type="button"
              onClick={() => setUnmasked(!unmasked)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {unmasked ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              <span>{unmasked ? 'Mask Numbers' : 'Reveal Balances'}</span>
            </button>
          )}
          <Link
            to={`/withdrawals?providerId=${profile.id}`}
            className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition"
          >
            Review Withdrawals →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-xs text-slate-500 font-medium">Lifetime Gross Earnings</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {unmasked && canSeeFinancial ? earnings.totalEarningsFormatted : 'KES —'}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-xs text-slate-500 font-medium">Current Month</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {unmasked && canSeeFinancial ? earnings.thisMonthFormatted : 'KES —'}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-xs text-slate-500 font-medium">In Escrow / Pending</span>
          <p className="text-xl font-bold text-amber-700 mt-1">
            {unmasked && canSeeFinancial ? earnings.pendingFormatted : 'KES —'}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-xs text-slate-500 font-medium">Available for Withdrawal</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            {unmasked && canSeeFinancial ? earnings.availableFormatted : 'KES —'}
          </p>
        </div>
      </div>
    </div>
  )
}

export function SubscriptionTabView({ profile }) {
  const sub = profile?.subscription || {}

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Subscription & Platform Tier ({sub.plan || 'Professional Plan'})
          </h2>
          <p className="text-xs text-slate-500">
            Current billing period: {sub.currentPeriod} • Renewal: {sub.nextRenewal}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Payment Status: {sub.paymentStatus || 'Paid'}
        </span>
      </div>

      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Included Plan Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {(sub.features || [
            'Unlimited Booking Requests',
            'Featured in Search Radius',
            'Zero Lé Inspa Processing Commission on First 20 Bookings',
            'Dedicated Priority SLA Support',
          ]).map((feat, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span className="text-slate-800 font-medium">{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ReviewsTabView({ profile }) {
  const reviews = profile?.reviews || {}

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Client Reviews & Ratings ({reviews.reviewCount || 126} Reviews)
          </h2>
          <p className="text-xs text-slate-500">
            Verified feedback left by completed booking clients.
          </p>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-slate-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-sm">
          <Star className="size-4 fill-amber-400 text-amber-400" />
          <span>{reviews.rating || 4.9} Platform Score</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-4 space-y-3">
        {(reviews.list || [
          {
            id: 'rev-1',
            clientName: 'James K.',
            rating: 5,
            date: '08 Oct 2026',
            comment: 'Amazing experience! Very professional and skilled. Highly recommend.',
            service: 'Deep Tissue Massage',
          },
          {
            id: 'rev-2',
            clientName: 'Beatrice Wangari',
            rating: 5,
            date: '02 Oct 2026',
            comment: 'Prompt arrival with sanitized hydraulic table and calming aromatherapy.',
            service: 'Sports Massage',
          },
        ]).map((rev) => (
          <div key={rev.id} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">{rev.clientName}</span>
              <span className="text-slate-400">{rev.date}</span>
            </div>
            <p className="text-xs text-slate-700 italic">"{rev.comment}"</p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
              <span>Service: {rev.service}</span>
              <span className="text-amber-500 font-bold">{rev.rating} ★★★★★</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SupportTabView({ profile }) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Support Concierge & Trust Records
          </h2>
          <p className="text-xs text-slate-500">
            Dispute history, incident reports, and customer service tickets.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          ✓ Clean Record
        </span>
      </div>

      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-center py-8">
        <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-900 text-sm">No Active Disputes or Safety Flags</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          This provider maintains an exemplary safety compliance score with 0 open escalations.
        </p>
      </div>
    </div>
  )
}

export function ActivityTabView({ profile }) {
  const activities = profile?.recentActivity || []

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Security & Operational Activity Audit</h2>
        <p className="text-xs text-slate-500">
          Immutable event log tracking logins, schedule modifications, bookings, and content submissions.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-4 space-y-3">
        {activities.map((act, i) => (
          <div key={act.id || i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
            <span className="font-medium text-slate-800">{act.action}</span>
            <span className="font-mono text-slate-400 text-[11px]">{act.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

