import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { FileText, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * ADM Verification Center Expandable Accordion Menu
 * Renders the "Verification Center" parent item with animated Chevron toggle
 * and 6 indented child links with active status highlighting.
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

  const handleParentClick = () => {
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
      isActive: (pathname) => pathname === '/verifications/queue' || pathname === '/verifications',
    },
    {
      label: 'Verification Review',
      path: '/verifications/review',
      isActive: (pathname) =>
        (pathname === '/verifications/review' || pathname.startsWith('/verifications/review/')) &&
        !pathname.includes('/identity') &&
        !pathname.includes('/credentials') &&
        !pathname.includes('/business'),
    },
    {
      label: 'Identity Documents',
      path: '/verifications/identity',
      isActive: (pathname) => pathname.startsWith('/verifications/identity') || pathname.includes('/identity'),
    },
    {
      label: 'Professional Credentials',
      path: '/verifications/credentials',
      isActive: (pathname) => pathname.startsWith('/verifications/credentials') || pathname.includes('/credentials'),
    },
    {
      label: 'Business Documents',
      path: '/verifications/business',
      isActive: (pathname) => pathname.startsWith('/verifications/business') || pathname.includes('/business'),
    },
    {
      label: 'Verification Decision',
      path: '/verifications/decision',
      isActive: (pathname) => pathname.includes('/decision'),
    },
  ]

  return (
    <div className="space-y-0.5">
      {/* Parent Menu Item */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleParentClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleParentClick()
          }
        }}
        className={cn(
          'flex w-full items-center justify-between rounded-lg py-[3px] pr-2.5 pl-[26px] text-[12px] leading-5 transition-colors cursor-pointer select-none',
          isVerificationRoute
            ? 'font-semibold text-white'
            : 'text-white/80 hover:bg-white/10 hover:text-white'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
          <span className="truncate">Verification Center</span>
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
            <ChevronRight
              className={cn(
                'size-3.5 text-white/60 transition-transform duration-200',
                isVerificationOpen && 'rotate-90'
              )}
              aria-hidden="true"
            />
          </span>
        </div>
      </div>

      {/* Child Navigation Items (Rendered when isVerificationOpen is true) */}
      {isVerificationOpen && (
        <div className="space-y-0.5">
          {childLinks.map((link) => {
            const active = link.isActive(location.pathname)

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onNavigate}
                className={cn(
                  'flex items-center rounded-lg py-[3px] pr-2.5 pl-[40px] text-[11.5px] leading-5 transition-colors',
                  active
                    ? 'bg-[#5c2dd5] font-semibold text-white shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                <span className="truncate">{link.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

