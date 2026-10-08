import { callAdmin } from '../lib/firebaseFunctions'
import { marketService } from './marketService'

function buildSandboxOperations(marketId) {
  const market = marketService.getMarketById(marketId)
  const isGlobal = market.isGlobal
  const multiplier = isGlobal ? 1 : market.id === 'KE' ? 0.75 : market.id === 'UG' ? 0.35 : market.id === 'TZ' ? 0.25 : 0.15

  const allAttention = [
    {
      id: 'case-1',
      priority: 'critical',
      issue: 'Safety Report',
      category: 'safety',
      market: 'KE',
      marketName: 'Kenya',
      entity: 'Provider: Grace N.',
      assignedTo: 'Unassigned',
      waiting: '4 min',
      status: 'New',
      action: 'Review',
      actionLink: '/safety',
    },
    {
      id: 'case-2',
      priority: 'critical',
      issue: 'Payment Processor Failure',
      category: 'system',
      market: 'KE',
      marketName: 'Kenya',
      entity: 'M-PESA',
      assignedTo: 'System',
      waiting: '8 min',
      status: 'Investigating',
      action: 'Open',
      actionLink: '/system-health',
    },
    {
      id: 'case-3',
      priority: 'high',
      issue: 'Withdrawal Review',
      category: 'finance',
      market: 'UG',
      marketName: 'Uganda',
      entity: 'UGX 1,250,000',
      assignedTo: 'Finance Team',
      waiting: '18 min',
      status: 'Pending',
      action: 'Review',
      actionLink: '/withdrawals',
    },
    {
      id: 'case-4',
      priority: 'high',
      issue: 'Booking Conflict',
      category: 'bookings',
      market: 'KE',
      marketName: 'Kenya',
      entity: 'Booking #LI-48291',
      assignedTo: 'Operations',
      waiting: '22 min',
      status: 'Open',
      action: 'Resolve',
      actionLink: '/bookings',
    },
    {
      id: 'case-5',
      priority: 'high',
      issue: 'Provider Verification',
      category: 'verification',
      market: 'TZ',
      marketName: 'Tanzania',
      entity: 'New Provider',
      assignedTo: 'Verification Team',
      waiting: '28 min',
      status: 'Pending',
      action: 'Review',
      actionLink: '/verifications',
    },
  ]

  const filteredAttention = isGlobal
    ? allAttention
    : allAttention.filter((item) => item.market === market.id)

  return {
    summary: {
      critical: isGlobal ? 2 : Math.max(0, Math.round(2 * multiplier)),
      high: isGlobal ? 8 : Math.max(1, Math.round(8 * multiplier)),
      awaitingAction: isGlobal ? 27 : Math.max(3, Math.round(27 * multiplier)),
      inReview: isGlobal ? 14 : Math.max(2, Math.round(14 * multiplier)),
      resolvedToday: isGlobal ? 43 : Math.max(5, Math.round(43 * multiplier)),
    },
    immediateAttention: filteredAttention.length > 0 ? filteredAttention : allAttention,
    liveActivity: [
      {
        id: 'act-1',
        type: 'booking',
        title: 'New booking confirmed',
        subtitle: 'Deep Tissue Massage',
        meta: `${market.name} • Just now`,
      },
      {
        id: 'act-2',
        type: 'verification',
        title: 'Provider verification submitted',
        subtitle: 'Massage Therapist',
        meta: 'Uganda • 2 minutes ago',
      },
      {
        id: 'act-3',
        type: 'withdrawal',
        title: 'Withdrawal submitted',
        subtitle: isGlobal ? 'KES 24,500' : `${market.currency} 24,500`,
        meta: `${market.name} • 5 minutes ago`,
      },
      {
        id: 'act-4',
        type: 'safety',
        title: 'Safety report received',
        priority: 'High Priority',
        subtitle: 'Inappropriate content',
        meta: `${market.name} • 7 minutes ago`,
      },
      {
        id: 'act-5',
        type: 'client',
        title: 'New client registration',
        subtitle: 'Premium Membership',
        meta: 'Tanzania • 33 minutes ago',
      },
    ],
    bookingOperations: {
      newConflicts: Math.max(1, Math.round(3 * multiplier)),
      unassigned: Math.max(1, Math.round(4 * multiplier)),
      failedReschedules: Math.max(0, Math.round(2 * multiplier)),
      providerCancellations: Math.max(1, Math.round(5 * multiplier)),
      guestIssues: Math.max(1, Math.round(3 * multiplier)),
      awaitingIntervention: Math.max(2, Math.round(6 * multiplier)),
    },
    financeOperations: {
      withdrawalsAwaitingApproval: Math.max(1, Math.round(7 * multiplier)),
      paymentsPendingVerification: Math.max(1, Math.round(3 * multiplier)),
      escrowHolds: Math.max(1, Math.round(5 * multiplier)),
      refundsAwaitingReview: Math.max(0, Math.round(2 * multiplier)),
      reconciliationExceptions: 1,
    },
    verificationOperations: {
      providerVerification: Math.max(2, Math.round(18 * multiplier)),
      profilePhotos: Math.max(2, Math.round(12 * multiplier)),
      galleryMedia: Math.max(1, Math.round(8 * multiplier)),
      profileChanges: Math.max(1, Math.round(5 * multiplier)),
      credentials: Math.max(2, Math.round(14 * multiplier)),
      requestMoreInfo: Math.max(1, Math.round(6 * multiplier)),
    },
    trustSafetyOperations: {
      highPrioritySafety: Math.max(1, Math.round(2 * multiplier)),
      openDisputes: Math.max(1, Math.round(3 * multiplier)),
      reportedReviews: Math.max(1, Math.round(5 * multiplier)),
      reportedMedia: Math.max(1, Math.round(4 * multiplier)),
      suspendedAccounts: Math.max(1, Math.round(2 * multiplier)),
    },
    supportOperations: {
      openTickets: Math.max(2, Math.round(12 * multiplier)),
      highPriority: Math.max(1, Math.round(3 * multiplier)),
      waitingOnLeInspa: Math.max(1, Math.round(7 * multiplier)),
      waitingOnUser: Math.max(1, Math.round(5 * multiplier)),
      slaBreachOverdue: Math.max(0, Math.round(2 * multiplier)),
    },
    systemIntegrations: {
      payments: 'Operational',
      bookingEngine: 'Operational',
      notifications: 'Operational',
      maps: 'Operational',
      mpesa: 'Degraded',
      email: 'Operational',
    },
    assignedToMe: [
      {
        id: 'my-1',
        type: 'withdrawal',
        title: 'Withdrawal Review',
        entity: isGlobal ? 'UGX 1,250,000' : `${market.currency} 450,000`,
        waiting: '12 min',
        urgency: 'high',
        link: '/withdrawals',
      },
      {
        id: 'my-2',
        type: 'verification',
        title: 'Provider Verification',
        entity: 'New Provider',
        waiting: '18 min',
        urgency: 'medium',
        link: '/verifications',
      },
      {
        id: 'my-3',
        type: 'support',
        title: 'Support Ticket',
        entity: '#SUP-4821',
        waiting: '1 hour',
        urgency: 'medium',
        link: '/support',
      },
      {
        id: 'my-4',
        type: 'safety',
        title: 'Safety Report',
        entity: 'Inappropriate content',
        waiting: '2 hours',
        urgency: 'high',
        link: '/safety',
      },
      {
        id: 'my-5',
        type: 'dispute',
        title: 'Dispute Review',
        entity: 'Booking #LI-3921',
        waiting: '3 hours',
        urgency: 'medium',
        link: '/disputes',
      },
    ],
    teamWorkload: [
      { team: 'Finance Team', count: Math.max(2, Math.round(8 * multiplier)), link: '/withdrawals' },
      { team: 'Verification Team', count: Math.max(4, Math.round(21 * multiplier)), link: '/verifications' },
      { team: 'Support Team', count: Math.max(3, Math.round(12 * multiplier)), link: '/support' },
      { team: 'Safety Team', count: Math.max(1, Math.round(5 * multiplier)), link: '/safety' },
      { team: 'Operations Team', count: Math.max(2, Math.round(7 * multiplier)), link: '/operations' },
    ],
    resolvedRecently: [
      {
        id: 'res-1',
        title: 'Withdrawal approved',
        amount: isGlobal ? 'KES 45,000' : `${market.currency} 45,000`,
        market: market.id === 'ALL' ? 'KE' : market.id,
        marketName: market.name,
        time: '12m ago',
      },
      {
        id: 'res-2',
        title: 'Provider verification completed',
        entity: 'Pure Wellness Spa',
        market: market.id === 'ALL' ? 'KE' : market.id,
        marketName: market.name,
        time: '25m ago',
      },
      {
        id: 'res-3',
        title: 'Support ticket closed',
        ticketId: '#SUP-4712',
        market: market.id === 'ALL' ? 'UG' : market.id,
        marketName: market.name,
        time: '1 hour ago',
      },
      {
        id: 'res-4',
        title: 'Safety case resolved',
        note: 'User warning issued',
        market: market.id === 'ALL' ? 'KE' : market.id,
        marketName: market.name,
        time: '2 hours ago',
      },
    ],
    context: {
      marketId: market.id,
      marketName: market.name,
      isSandbox: true,
      updatedAt: new Date().toISOString(),
    },
  }
}

export const operationsService = {
  async getOperationsSummary({ marketId = 'ALL' } = {}) {
    try {
      const result = await callAdmin('adminGetOperationsSummary', {
        market: marketId,
      })
      if (result && !result.summary) {
        return buildSandboxOperations(marketId)
      }
      return result
    } catch (err) {
      console.warn(
        '[operationsService] Live Cloud Function unreachable or not yet deployed, using sandbox telemetry:',
        err?.message || err,
      )
      return buildSandboxOperations(marketId)
    }
  },
}

