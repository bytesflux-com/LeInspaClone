import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { FileText, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * ADM Verification Center Expandable Accordion Menu
 * Renders the "Verification Center" parent item with animated Chevron toggle
 * and 5 indented child links with active status highlighting.
 */
export default function VerificationCenterAccordion({ onNavigate }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isVerificationRoute = location.pathname.startsWith('/verifications')

  // Auto-expand when visiting any verification screen; default to true
  const [isVerificationOpen, setIsVerificationOpen] = useState(true)

  useEffect(() => {
    if (isVerificationRoute) {
      setIsVerificationOpen(true)
    }
  }, [isVerificationRoute])

  const handleParentClick = (e) => {
    // If not currently on a verification screen, navigate to /verifications and open
    if (!isVerificationRoute) {
      navigate('/verifications')
      setIsVerificationOpen(true)
      if (onNavigate) onNavigate()
    } else {
      // Toggle dropdown if already on verification section
      setIsVerificationOpen((prev) => !prev)
    }
  }

  const handleChevronToggle = (e) => {
    e.stopPropagation()
    setIsVerificationOpen((prev) => !prev)
  }

  const childLinks = [
    {
      label: 'Verification Queue',
      path: '/verifications/queue',
      icon: FileText,
      isActive: (pathname) => pathname === '/verifications/queue' || pathname === '/verifications',
    },
    {
      label: 'Verification Review',
      path: '/verifications/review',
      icon: FileText,
      isActive: (pathname) =>
        (pathname === '/verifications/review' || pathname.startsWith('/verifications/review/')) &&
        !pathname.includes('/identity') &&
        !pathname.includes('/credentials') &&
        !pathname.includes('/business'),
    },
    {
      label: 'Identity Documents',
      path: '/verifications/identity',
      icon: FileText,
      isActive: (pathname) => pathname.startsWith('/verifications/identity') || pathname.includes('/identity'),
    },
    {
      label: 'Professional Credentials',
      path: '/verifications/credentials',
      icon: FileText,
      isActive: (pathname) => pathname.startsWith('/verifications/credentials') || pathname.includes('/credentials'),
    },
    {
      label: 'Business Documents',
      path: '/verifications/business',
      icon: FileText,
      isActive: (pathname) => pathname.startsWith('/verifications/business') || pathname.includes('/business'),
    },
  ]

  return (
    <div className="space-y-1">
      {/* Parent Menu Item */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleParentClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleParentClick(e)
          }
        }}
        className={cn(
          'group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-sm font-medium transition-colors cursor-pointer select-none',
          isVerificationRoute && !childLinks.some((l) => l.isActive(location.pathname))
            ? 'bg-white/12 text-white font-semibold'
            : 'text-slate-200 hover:bg-white/10 hover:text-white'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="size-[18px] shrink-0 text-lavender-200" aria-hidden="true" />
          <span className="text-slate-200 font-medium text-sm truncate">Verification Center</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="rounded-full bg-amber-500/90 px-1.5 py-0.2 text-[9.5px] font-bold text-white shadow-xs">
            428
          </span>
          <span
            onClick={handleChevronToggle}
            className="p-0.5 hover:bg-white/10 rounded-sm transition cursor-pointer"
            aria-label="Toggle Verification Center Submenu"
          >
            <ChevronDown
              className={cn(
                'size-4 text-slate-300 transition-transform duration-200',
                isVerificationOpen ? 'rotate-180' : 'rotate-0'
              )}
              aria-hidden="true"
            />
          </span>
        </div>
      </div>

      {/* Child Navigation Items (Rendered when isVerificationOpen is true) */}
      {isVerificationOpen && (
        <div className="pl-6 pr-2 py-1 space-y-1">
          {childLinks.map((link) => {
            const active = link.isActive(location.pathname)
            const Icon = link.icon

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onNavigate}
                className={cn(
                  'rounded-lg px-3 py-2 text-xs md:text-sm flex items-center gap-2.5 transition',
                  active
                    ? 'bg-[#6366F1] text-white font-semibold rounded-lg shadow-sm px-3 py-2 flex items-center gap-2.5'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 rounded-lg px-3 py-2 text-xs md:text-sm font-medium flex items-center gap-2.5 transition'
                )}
              >
                <Icon
                  className={cn('size-4 shrink-0', active ? 'text-white' : 'text-slate-300')}
                  aria-hidden="true"
                />
                <span className="truncate">{link.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
