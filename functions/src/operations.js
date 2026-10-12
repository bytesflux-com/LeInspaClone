import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { requireAdmin } from './auth.js'
import { ALL_MARKETS, adminAccess, canAccessMarket } from './accessModel.js'
import { MARKETS } from './dashboardLogic.js'
import { buildOperations } from './operationsLogic.js'
import { readAll, readBookings, readUsers } from './platformLoaders.js'
import { ASSIGNMENT_COLLECTION } from './needsAttentionLogic.js'

/**
 * ADM-006 — Operations Center. data: { market }
 * A backend-generated operational read model over the mobile app's records;
 * market access is enforced here (records are scoped by their owner's country).
 */
export const adminGetOperationsSummary = onCall(async (request) => {
  const uid = await requireAdmin(request, { permission: 'dashboard.view' })
  const access = await adminAccess(uid)
  const market = String(request.data?.market || 'ALL').toUpperCase()
  if (market !== 'ALL' && !MARKETS[market]) throw new HttpsError('invalid-argument', 'Unknown market.')
  if (market !== 'ALL' && !canAccessMarket(access, market)) {
    throw new HttpsError('permission-denied', 'You do not have access to this market.', { reason: 'market-denied' })
  }

  const { users, byId, truncated } = await readUsers()
  const [bookings, payments, escrows, withdrawals, verificationRequests, profileUpdates, disputes, safety, supportTickets, supportCases, assignments, informationRequests] = await Promise.all([
    readBookings(byId),
    readAll('payments', { limit: 10000 }),
    readAll('escrow_transactions', { limit: 10000 }),
    readAll('withdrawal_requests', { limit: 5000 }),
    readAll('verification_requests', { limit: 5000 }),
    readAll('professional_profile_update_requests', { limit: 3000 }),
    readAll('disputes', { limit: 3000 }),
    readAll('safety_reports', { limit: 3000 }),
    readAll('support_tickets', { limit: 3000 }),
    readAll('support_cases', { limit: 3000 }),
    readAll(ASSIGNMENT_COLLECTION, { limit: 3000 }),
    readAll('information_requests', { limit: 3000 }),
  ])

  const result = buildOperations(
    {
      users,
      usersById: byId,
      bookings: bookings.bookings,
      payments: payments.rows,
      escrows: escrows.rows,
      withdrawals: withdrawals.rows,
      verificationRequests: verificationRequests.rows,
      profileUpdates: profileUpdates.rows,
      disputes: disputes.rows,
      safety: safety.rows,
      supportTickets: supportTickets.rows,
      supportCases: supportCases.rows,
      assignments: assignments.rows,
      informationRequests: informationRequests.rows,
    },
    { market, markets: access.markets.includes(ALL_MARKETS) ? null : access.markets, now: Date.now(), adminUid: uid },
  )

  return {
    ...result,
    context: { marketId: market, isSandbox: false, updatedAt: new Date().toISOString(), truncated: truncated || bookings.truncated },
  }
})
