import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  BadgeCheck,
  Copy,
  Check,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Send,
  SquarePen,
  ShieldAlert,
  Share2,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react'

export function ProviderProfileHeader({
  profile,
  onCopyId,
  onOpenAddNote,
  onOpenAccountActions,
  onShowToast,
}) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [isActionsOpen, setIsActionsOpen] = useState(false)

  if (!profile) return null

  const handleCopy = () => {
    if (onCopyId) onCopyId(profile.id)
    else navigator.clipboard?.writeText(profile.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onShowToast?.(`Provider ID ${profile.id} copied to clipboard`)
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    onShowToast?.('Profile link copied to clipboard')
  }

  return (
    <div className="space-y-3">
      {/* 1. Breadcrumb + Quick Dynamic Switcher */}
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
          <span className="font-semibold text-slate-900">{profile.name}</span>
        </nav>

        {/* Dynamic Profile Mode Switcher for Admin Testing */}
        <div className="flex items-center gap-1.5 bg-purple-50/80 border border-purple-200/80 rounded-full px-2.5 py-1 text-[11px]">
          <span className="text-purple-800 font-semibold flex items-center gap-1">
            <Sparkles className="size-3 text-purple-600" /> Dynamic View:
          </span>
          <button
            type="button"
            onClick={() => navigate('/providers/PR-82941')}
            className={`px-2 py-0.5 rounded-full font-medium transition ${
              profile.id === 'PR-82941'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-purple-700 hover:bg-purple-200/50'
            }`}
          >
            Individual (Grace)
          </button>
          <button
            type="button"
            onClick={() => navigate('/providers/SPA-28192')}
            className={`px-2 py-0.5 rounded-full font-medium transition ${
              profile.id === 'SPA-28192'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-purple-700 hover:bg-purple-200/50'
            }`}
          >
            Spa (Serenity)
          </button>
          <button
            type="button"
            onClick={() => navigate('/providers/HWR-18291')}
            className={`px-2 py-0.5 rounded-full font-medium transition ${
              profile.id === 'HWR-18291'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-purple-700 hover:bg-purple-200/50'
            }`}
          >
            Hotel/Resort (Savanna)
          </button>
        </div>
      </div>

      {/* 2. Main Hero Banner Section */}
      <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Background Visual Banner (Right Side) */}
        <div className="absolute top-0 right-0 bottom-0 w-full sm:w-1/2 lg:w-2/5 overflow-hidden opacity-90 pointer-events-none">
          <img
            src={
              profile.coverImage ||
              'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80'
            }
            alt="Spa ambiance"
            className="w-full h-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-linear-to-r from-white via-white/80 to-transparent sm:via-white/70" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Identity Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 min-w-0">
            {/* Avatar with Online Beacon */}
            <div className="relative shrink-0">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-3 border-white shadow-md ring-2 ring-purple-100"
              />
              {/* Online beacon dot */}
              <div
                className="absolute bottom-1 right-1 flex items-center justify-center size-5 rounded-full bg-white shadow-xs"
                title={profile.availabilityLabel || 'Available Now'}
              >
                <span className="size-3.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
              </div>
            </div>

            {/* Identity Info */}
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>{profile.name}</span>
                  {profile.verified && (
                    <BadgeCheck
                      className="size-5 text-blue-600 fill-blue-50 shrink-0"
                      title="Verified Lé Inspa Provider"
                    />
                  )}
                </h1>

                {/* Status Pill */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    profile.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : profile.status === 'suspended'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      profile.status === 'active'
                        ? 'bg-emerald-500'
                        : profile.status === 'suspended'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  {profile.statusLabel || 'Active'}
                </span>

                {/* Available Now pill */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {profile.availabilityLabel || 'Available Now'}
                </span>
              </div>

              {/* Provider ID with copy button */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {profile.id}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy ID"
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                >
                  {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </button>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-700">{profile.providerType}</span>
              </div>

              {/* Location, Joined Date, Last Active */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span>{profile.flag || '🇰🇪'}</span>
                  <span>{profile.city}, {profile.market}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3 text-slate-400" />
                  <span>Joined {profile.joinedDate}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3 text-slate-400" />
                  <span>Last Active: {profile.lastActive || 'Today • 11:42 AM'}</span>
                </span>
              </div>

              {/* Rating + Quote */}
              <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs">
                <div className="flex items-center gap-1 font-semibold text-slate-800 bg-amber-50/80 border border-amber-200/80 px-2 py-0.5 rounded-md">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span>{profile.rating}</span>
                  <span className="font-normal text-slate-500">({profile.reviewCount} reviews)</span>
                </div>
                {profile.tagline && (
                  <p className="italic text-slate-600 text-xs truncate max-w-md">
                    "{profile.tagline}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="shrink-0 flex items-center gap-2 self-start md:self-auto">
            <a
              href={`#public-preview-${profile.id}`}
              onClick={(e) => {
                e.preventDefault()
                onShowToast?.(`Opening client-facing public profile for ${profile.name}`)
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white/90 backdrop-blur-xs text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition shadow-2xs"
            >
              <ExternalLink className="size-3.5 text-slate-500" />
              View Public Profile
            </a>

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-300 bg-purple-700 text-xs font-semibold text-white hover:bg-purple-800 transition shadow-2xs"
              >
                <span>More Actions</span>
                <ChevronDown className="size-3.5 text-purple-200" />
              </button>

              {isActionsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsActionsOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsOpen(false)
                        onOpenAddNote?.()
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-purple-50 hover:text-purple-900 font-medium transition"
                    >
                      <SquarePen className="size-3.5 text-purple-600" />
                      Add Internal Note
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsOpen(false)
                        onShowToast?.(`Notification dispatch opened for ${profile.name}`)
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-purple-50 hover:text-purple-900 font-medium transition"
                    >
                      <Send className="size-3.5 text-slate-500" />
                      Send Admin Notice
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsOpen(false)
                        handleShare()
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-purple-50 hover:text-purple-900 font-medium transition"
                    >
                      <Share2 className="size-3.5 text-slate-500" />
                      Share Profile Link
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsOpen(false)
                        onOpenAccountActions?.()
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 font-medium transition"
                    >
                      <ShieldAlert className="size-3.5 text-amber-600" />
                      Manage Restrictions
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

