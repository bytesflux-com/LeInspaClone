import { useState, useEffect, useCallback } from 'react'
import { providerService } from '../services/providerService'
import { usePermissions } from './usePermissions'
import { PERMISSIONS } from '../constants/permissions'
import { useAdminSession } from './useAdminSession'

export function useProviderProfile(providerId, initialTab = 'overview') {
  const { can } = usePermissions()
  const { admin } = useAdminSession()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [revealedPii, setRevealedPii] = useState(false)
  const [revealedEarnings, setRevealedEarnings] = useState(false)

  const canSeeFinancial = can(PERMISSIONS.FINANCE_VIEW) || can('payments.view')
  const canManageSafety = can(PERMISSIONS.DISPUTES_MANAGE) || can('safety.manage')
  const canAccountActions = can(PERMISSIONS.USERS_SUSPEND) || can('users.suspend')
  const canVerify = can(PERMISSIONS.PROVIDERS_VERIFY) || can('providers.verify')

  const fetchProfile = useCallback(async () => {
    if (!providerId) return
    setLoading(true)
    setError(null)
    try {
      const data = await providerService.getProviderProfile(providerId)
      if (!data) {
        setError(`Provider profile '${providerId}' not found.`)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('[useProviderProfile] Fetch error:', err)
      setError(err?.message || 'Failed to load provider profile.')
    } finally {
      setLoading(false)
    }
  }, [providerId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Add internal admin note
  const addInternalNote = async (text, team = 'Operations Team') => {
    if (!text?.trim() || !profile) return
    try {
      const newNote = await providerService.addProviderInternalNote({
        providerId: profile.id,
        note: text.trim(),
        author: admin?.name || 'Admin',
        team,
      })
      setProfile((prev) => ({
        ...prev,
        internalNotes: [newNote, ...(prev.internalNotes || [])],
      }))
      return { success: true, note: newNote }
    } catch (err) {
      console.error('Error adding note:', err)
      throw err
    }
  }

  // Moderate content (approve or request changes)
  const moderateContent = async ({
    itemId,
    itemType = 'photo',
    status,
    reasonCode,
    reasonLabel,
    adminNote,
  }) => {
    if (!profile) return
    try {
      await providerService.updateProviderContentStatus({
        providerId: profile.id,
        itemId,
        itemType,
        status,
        reasonCode,
        reasonLabel,
        adminNote,
      })

      setProfile((prev) => {
        const next = { ...prev }
        if (status === 'approved') {
          if (next.gallery?.pendingApproval) {
            next.gallery.pendingApproval.hasPending = false
          }
          if (next.contentApproval) {
            next.contentApproval.profilePhoto = 'Approved'
            next.contentApproval.pendingCount = 0
            next.contentApproval.items = []
          }
          if (next.verification) {
            next.verification.profilePhoto.status = 'Approved'
          }
        } else {
          if (next.gallery?.pendingApproval) {
            next.gallery.pendingApproval.hasPending = true
            next.gallery.pendingApproval.status = 'changes_requested'
          }
          if (next.contentApproval) {
            next.contentApproval.profilePhoto = 'Changes Required'
          }
          if (next.verification) {
            next.verification.profilePhoto.status = 'Changes Required'
          }
        }
        return next
      })
      return { success: true }
    } catch (err) {
      console.error('Error moderating content:', err)
      throw err
    }
  }

  // Update verification status
  const updateVerification = async ({ checkKey, status, reason, adminNote }) => {
    if (!profile) return
    try {
      await providerService.updateProviderVerificationStatus({
        providerId: profile.id,
        checkKey,
        status,
        reason,
        adminNote,
      })
      setProfile((prev) => {
        const next = { ...prev }
        if (next.verification && next.verification[checkKey]) {
          next.verification[checkKey] = {
            ...next.verification[checkKey],
            status,
            reason,
            adminNote,
          }
        }
        return next
      })
      return { success: true }
    } catch (err) {
      console.error('Error updating verification:', err)
      throw err
    }
  }

  // Update account status / restrictions
  const updateAccountStatus = async ({ status, restrictionReason, adminNote }) => {
    if (!profile) return
    try {
      await providerService.updateProviderAccountStatus({
        providerId: profile.id,
        status,
        restrictionReason,
        adminNote,
      })
      setProfile((prev) => ({
        ...prev,
        status,
        statusLabel: status.charAt(0).toUpperCase() + status.slice(1),
        health: {
          ...prev.health,
          account: status.charAt(0).toUpperCase() + status.slice(1),
        },
      }))
      return { success: true }
    } catch (err) {
      console.error('Error updating account status:', err)
      throw err
    }
  }

  return {
    profile,
    loading,
    error,
    activeTab,
    setActiveTab,
    revealedPii,
    setRevealedPii,
    revealedEarnings,
    setRevealedEarnings,
    canSeeFinancial,
    canManageSafety,
    canAccountActions,
    canVerify,
    addInternalNote,
    moderateContent,
    updateVerification,
    updateAccountStatus,
    refetch: fetchProfile,
  }
}

