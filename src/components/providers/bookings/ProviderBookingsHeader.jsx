import { Link, useNavigate } from 'react-router'
import {
  ChevronRight,
  BadgeCheck,
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react'

export function ProviderBookingsHeader({
  provider,
  providerId = 'PR-82941',
  onShowToast,
}) {
  const navigate = useNavigate()

  const name = provider?.name || 'Grace Njeri'
  const id = provider?.id || providerId
  const role = provider?.providerType || provider?.typeLabel || 'Massage Therapist'
  const city = provider?.city || 'Nairobi'
  const country = provider?.country || 'Kenya'
  const flag = provider?.flag || '🇰🇪'
  const joinedDate = provider?.joinedDate || '12 Jan 2026'
  const lastActive = provider?.lastActive || 'Today • 11:42 AM'
  const avatar =
    provider?.avatar ||
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80'

  return (
    <div className="space-y-3">
      {/* 1. Breadcrumbs + Dynamic Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Link to="/providers" className="hover:text-purple-700 transition">
            Provider Management
          </Link>
          <ChevronRight className="size-3.5 text-slate-400" />
          <Link to="/providers/all" className="hover:text-purple-700 transition">
            Provider Directory
          </Link>
          <ChevronRight className="size-3.5 text-slate-400" />
          <Link to={`/providers/${id}`} className="hover:text-purple-700 transition">
            {name}
          </Link>
          <ChevronRight className="size-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">Bookings & Earnings</span>
        </nav>

        {/* Dynamic Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-purple-50/80 border border-purple-200/80 rounded-full px-2.5 py-1 text-[11px]">
          <span className="text-purple-800 font-semibold flex items-center gap-1">
            <Sparkles className="size-3 text-purple-600" /> Dynamic View:
          </span>
          <button
            type="button"
            onClick={() => navigate('/providers/PR-82941/bookings')}
            className={`px-2 py-0.5 rounded-full font-medium transition ${
              id === 'PR-82941'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-purple-700 hover:bg-purple-200/50'
            }`}
          >
            Individual (Grace)
          </button>
          <button
            type="button"
            onClick={() => navigate('/providers/SPA-28192/bookings')}
            className={`px-2 py-0.5 rounded-full font-medium transition ${
              id === 'SPA-28192'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-purple-700 hover:bg-purple-200/50'
            }`}
          >
            Spa (Serenity)
          </button>
          <button
            type="button"
            onClick={() => navigate('/providers/HWR-18291/bookings')}
            className={`px-2 py-0.5 rounded-full font-medium transition ${
              id === 'HWR-18291'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-purple-700 hover:bg-purple-200/50'
            }`}
          >
            Hotel/Resort (Savanna)
          </button>
        </div>
      </div>

      {/* 2. Provider Identity Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left: Avatar + Details */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={avatar}
              alt={name}
              className="size-16 sm:size-20 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-purple-100"
            />
            <span
              className="absolute bottom-0.5 right-0.5 size-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs"
              title="Available Now"
            />
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-none">
                {name}
              </h1>
              <BadgeCheck className="size-5 text-blue-600 fill-blue-50 shrink-0" />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono text-purple-700 font-semibold px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100">
                {id}
              </span>
              <span className="font-semibold text-slate-700">{role}</span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                <span>{flag}</span>
                <span>
                  {city}, {country}
                </span>
              </span>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span>✓</span> Verified
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Available Now
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 flex items-center gap-1">
                <Calendar className="size-3 text-slate-400" />
                Joined: {joinedDate}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="size-3 text-slate-400" />
                Last Active: {lastActive}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Slogan & Actions */}
        <div className="flex flex-col items-start md:items-end justify-between gap-3 shrink-0">
          <div className="hidden lg:block text-right">
            <span
              className="text-2xl text-purple-800 tracking-wide font-normal italic select-none block leading-tight"
              style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
            >
              Wellness Without Limits
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/providers/${id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50/70 text-purple-700 hover:bg-purple-100 hover:text-purple-800 text-xs font-semibold shadow-2xs transition"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Provider Profile</span>
            </Link>

            <button
              type="button"
              onClick={() => onShowToast?.(`Opening public profile for ${name}`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
            >
              <span>View Public Profile</span>
              <ExternalLink className="size-3 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

