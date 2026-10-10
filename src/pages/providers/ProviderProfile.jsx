import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router'
import { CircleCheck, AlertCircle } from 'lucide-react'

import { useProviderProfile } from '../../hooks/useProviderProfile'
import { ProviderProfileHeader } from '../../components/providers/profile/ProviderProfileHeader'
import { ProviderHealthCards } from '../../components/providers/profile/ProviderHealthCards'
import { ProviderNavTabs } from '../../components/providers/profile/ProviderNavTabs'
import { PersonalInfoCard } from '../../components/providers/profile/PersonalInfoCard'
import { ProfessionalInfoCard } from '../../components/providers/profile/ProfessionalInfoCard'
import { AvailabilityCard } from '../../components/providers/profile/AvailabilityCard'
import { ProviderPhotoGalleryCard } from '../../components/providers/profile/ProviderPhotoGalleryCard'
import { ActiveServicesCard } from '../../components/providers/profile/ActiveServicesCard'
import { BookingPerformanceCard } from '../../components/providers/profile/BookingPerformanceCard'
import { EarningsSummaryCard } from '../../components/providers/profile/EarningsSummaryCard'
import { SubscriptionCard } from '../../components/providers/profile/SubscriptionCard'
import { ReviewsDistributionCard } from '../../components/providers/profile/ReviewsDistributionCard'
import { SupportSafetyCard } from '../../components/providers/profile/SupportSafetyCard'
import { RecentActivityCard } from '../../components/providers/profile/RecentActivityCard'
import { AdminNotesCard } from '../../components/providers/profile/AdminNotesCard'
import { AccountManagementCard } from '../../components/providers/profile/AccountManagementCard'

import {
  VerificationTabView,
  ServicesTabView,
  BookingsTabView,
  EarningsTabView,
  SubscriptionTabView,
  ReviewsTabView,
  SupportTabView,
  ActivityTabView,
} from '../../components/providers/profile/ProviderTabViews'

import { AddAdminNoteModal } from '../../components/providers/profile/AddAdminNoteModal'
import { ContentModerationModal } from '../../components/providers/profile/ContentModerationModal'
import { AccountActionsModal } from '../../components/providers/profile/AccountActionsModal'
import { FullInfoModal } from '../../components/providers/profile/FullInfoModal'

export default function ProviderProfile() {
  const { providerId = 'PR-82941', section } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const initialTab = section || 'overview'

  const {
    profile,
    loading,
    error,
    activeTab,
    setActiveTab,
    canSeeFinancial,
    canManageSafety,
    canAccountActions,
    canVerify,
    addInternalNote,
    moderateContent,
    updateVerification,
    updateAccountStatus,
    refetch,
  } = useProviderProfile(providerId, initialTab)

  // Modals state
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [isContentReviewOpen, setIsContentReviewOpen] = useState(false)
  const [isAccountActionsOpen, setIsAccountActionsOpen] = useState(false)
  const [isFullInfoOpen, setIsFullInfoOpen] = useState(false)

  // Toast notifications
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    if (tabId === 'overview') {
      navigate(`/providers/${providerId}`, { replace: true })
    } else {
      navigate(`/providers/${providerId}/${tabId}`, { replace: true })
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="h-44 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="size-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="size-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Unable to load provider profile</h2>
        <p className="text-xs text-slate-500">{error || 'Provider record was not found.'}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={refetch}
            className="px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition"
          >
            Retry
          </button>
          <Link
            to="/providers/all"
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            Back to Directory
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-3.5 sm:p-5 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* 1. Header Banner & Identity */}
      <ProviderProfileHeader
        profile={profile}
        onCopyId={(id) => showToast(`Provider ID ${id} copied to clipboard`)}
        onOpenAddNote={() => setIsAddNoteOpen(true)}
        onOpenAccountActions={() => setIsAccountActionsOpen(true)}
        onShowToast={showToast}
      />

      {/* 2. Provider Health Overview (6 Clean Status Cards) */}
      <ProviderHealthCards
        health={profile.health}
        onSelectTab={handleTabChange}
      />

      {/* 3. Navigation Tabs Shell */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <ProviderNavTabs
          activeTab={activeTab}
          onSelectTab={handleTabChange}
        />

        {/* Tab Content Area */}
        <div className="p-4 sm:p-5 bg-slate-50/40">
          {/* OVERVIEW TAB: The Master 360° Command Grid */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* ROW 1: Identity & Availability & Photos (4 balanced cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                <PersonalInfoCard
                  profile={profile}
                  onOpenFullInfo={() => setIsFullInfoOpen(true)}
                  onOpenEdit={() => setIsFullInfoOpen(true)}
                  onShowToast={showToast}
                />

                <ProfessionalInfoCard
                  profile={profile}
                  onOpenFullProfile={() => handleTabChange('services')}
                  onOpenEdit={() => setIsFullInfoOpen(true)}
                  onSelectTab={handleTabChange}
                  onShowToast={showToast}
                />

                <AvailabilityCard
                  profile={profile}
                  onViewSchedule={() => showToast('Opening Real-Time Schedule Calendar')}
                  onShowToast={showToast}
                />

                <ProviderPhotoGalleryCard
                  profile={profile}
                  onOpenContentReview={() => setIsContentReviewOpen(true)}
                  onViewAllPhotos={() => showToast('Opening High-Resolution Gallery')}
                />
              </div>

              {/* ROW 2: Services, Bookings, Earnings (3 balanced cards) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                <ActiveServicesCard
                  profile={profile}
                  onViewAllServices={() => navigate(`/providers/${profile.id}/services`)}
                />

                <BookingPerformanceCard
                  profile={profile}
                  onViewAllBookings={() => handleTabChange('bookings')}
                />

                <EarningsSummaryCard
                  profile={profile}
                  canSeeFinancial={canSeeFinancial}
                  onShowToast={showToast}
                />
              </div>

              {/* ROW 3: Subscription, Reviews, Support & Safety (3 balanced cards) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                <SubscriptionCard
                  profile={profile}
                  onViewSubscription={() => handleTabChange('subscription')}
                />

                <ReviewsDistributionCard
                  profile={profile}
                  onViewAllReviews={() => handleTabChange('reviews')}
                />

                <SupportSafetyCard
                  profile={profile}
                  onViewSupportHistory={() => handleTabChange('support')}
                />
              </div>

              {/* ROW 4: Recent Activity, Admin Notes, Account Management (3 balanced cards) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                <RecentActivityCard
                  profile={profile}
                  onViewAllActivity={() => handleTabChange('activity')}
                />

                <AdminNotesCard
                  profile={profile}
                  onOpenAddNote={() => setIsAddNoteOpen(true)}
                />

                <AccountManagementCard
                  profile={profile}
                  onOpenAccountActions={() => setIsAccountActionsOpen(true)}
                  onOpenRestrictions={() => setIsAccountActionsOpen(true)}
                  onViewAccountHistory={() => handleTabChange('activity')}
                />
              </div>
            </div>
          )}

          {/* DEDICATED TAB 2: Verification */}
          {activeTab === 'verification' && (
            <VerificationTabView
              profile={profile}
              onOpenContentReview={() => setIsContentReviewOpen(true)}
              onShowToast={showToast}
            />
          )}

          {/* DEDICATED TAB 3: Services */}
          {activeTab === 'services' && (
            <ServicesTabView
              profile={profile}
              onShowToast={showToast}
            />
          )}

          {/* DEDICATED TAB 4: Bookings */}
          {activeTab === 'bookings' && (
            <BookingsTabView profile={profile} />
          )}

          {/* DEDICATED TAB 5: Earnings */}
          {activeTab === 'earnings' && (
            <EarningsTabView
              profile={profile}
              canSeeFinancial={canSeeFinancial}
            />
          )}

          {/* DEDICATED TAB 6: Subscription */}
          {activeTab === 'subscription' && (
            <SubscriptionTabView profile={profile} />
          )}

          {/* DEDICATED TAB 7: Reviews */}
          {activeTab === 'reviews' && (
            <ReviewsTabView profile={profile} />
          )}

          {/* DEDICATED TAB 8: Support & Safety */}
          {activeTab === 'support' && (
            <SupportTabView profile={profile} />
          )}

          {/* DEDICATED TAB 9: Activity */}
          {activeTab === 'activity' && (
            <ActivityTabView profile={profile} />
          )}
        </div>
      </div>

      {/* Modals */}
      <AddAdminNoteModal
        isOpen={isAddNoteOpen}
        providerId={profile.id}
        providerName={profile.name}
        onClose={() => setIsAddNoteOpen(false)}
        onSubmitNote={addInternalNote}
        onShowToast={showToast}
      />

      <ContentModerationModal
        isOpen={isContentReviewOpen}
        profile={profile}
        onClose={() => setIsContentReviewOpen(false)}
        onSubmitModeration={moderateContent}
        onShowToast={showToast}
      />

      <AccountActionsModal
        isOpen={isAccountActionsOpen}
        profile={profile}
        onClose={() => setIsAccountActionsOpen(false)}
        onSubmitStatus={updateAccountStatus}
        onShowToast={showToast}
      />

      <FullInfoModal
        isOpen={isFullInfoOpen}
        profile={profile}
        onClose={() => setIsFullInfoOpen(false)}
      />

      {/* Toast Alert */}
      {toast && (
        <div
          role="status"
          className="fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2"
        >
          <CircleCheck className="size-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}

