import { Link, useNavigate } from 'react-router'
import {
  ChevronRight,
  BadgeCheck,
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react'

export function ProviderServicesHeader({
  provider,
  providerId = 'PR-82941',
}) {
  const navigate = useNavigate()

  const name = provider?.name || 'Grace Njeri'
  const id = provider?.id || providerId
  const role = provider?.providerType || provider?.typeLabel || 'Massage Therapist'
  const city = provider?.city || 'Nairobi'
  const market = provider?.market || 'Kenya'
  const flag = provider?.flag || '🇰🇪'
  const joinedDate = provider?.joinedDate || '12 Jan 2026'
  const lastActive = provider?.lastActive || 'Today • 11:42 AM'
  const avatar =
    provider?.avatar ||
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80'

  return (
    <div className="space-y-3">
      {/* 1. Breadcrumbs + Dynamic Switcher */}
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
          <span className="font-semibold text-slate-900">Services & Pricing</span>
        </nav>

        {/* Dynamic Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-purple-50/80 border border-purple-200/80 rounded-full px-2.5 py-1 text-[11px]">
          <span className="text-purple-800 font-semibold flex items-center gap-1">
            <Sparkles className="size-3 text-purple-600" /> Dynamic View:
          </span>
          <button
            type="button"
            onClick={() => navigate('/providers/PR-82941/services')}
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
            onClick={() => navigate('/providers/SPA-28192/services')}
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
            onClick={() => navigate('/providers/HWR-18291/services')}
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

      {/* 2. Provider Identity Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Side: Avatar + Provider Details */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={avatar}
              alt={name}
              className="size-16 sm:size-20 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-purple-100"
            />
            {/* Live beacon dot */}
            <div className="absolute bottom-0 right-0 size-4 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>{name}</span>
                <BadgeCheck className="size-5 text-blue-600 fill-blue-50 shrink-0" />
              </h1>

              {/* Status Badge */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Active
              </span>

              {/* Available Now */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Available Now
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {id}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-slate-700">{role}</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <span>{flag}</span>
                <span>{city}, {market}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3 text-slate-400" />
                <span>Joined {joinedDate}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3 text-slate-400" />
                <span>Last Active: {lastActive}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Back to Profile + Stylized Script */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-start md:self-auto shrink-0">
          {/* Stylized Brand Script (as seen in screenshot) */}
          <div className="hidden lg:block text-right pr-2">
            <span
              className="text-2xl font-serif italic text-slate-800/90 tracking-wide select-none"
              style={{ fontFamily: 'Brush Script MT, cursive, Georgia, serif' }}
            >
              Wellness Without Limits
            </span>
          </div>

          <Link
            to={`/providers/${id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-200 bg-purple-50 text-xs font-semibold text-purple-700 hover:bg-purple-100 hover:text-purple-900 transition shadow-2xs"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Provider Profile</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

