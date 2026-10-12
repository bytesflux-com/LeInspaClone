import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { adminAccess, canAccessMarket } from './accessModel.js'
import { MARKETS } from './dashboardLogic.js'
import { buildMarketDashboard } from './marketDashboardLogic.js'
import { getDateBounds, safeTimeZone } from './dashboard.js'
import { readAll, readBookings, readUsers } from './platformLoaders.js'
import { ASSIGNMENT_COLLECTION } from './needsAttentionLogic.js'

const SYMBOLS = { KES: 'KSh', UGX: 'USh', TZS: 'TSh', RWF: 'FRw', ZAR: 'R' }

/**
 * ADM-008 — Market / Country Dashboard. data: { marketId, dateRange, customRange?, timeZone? }
 * One country only; the admin must be assigned to that market.
 */
export const adminGetMarketDashboardData = onCall(async (request) => {
  const uid = await requireAdmin(request, { permission: 'dashboard.view' })
  const access = await adminAccess(uid)
  const market = String(request.data?.marketId || request.data?.market || '').toUpperCase()
  if (!MARKETS[market]) throw new HttpsError('invalid-argument', 'Choose a country market.')
  if (!canAccessMarket(access, market)) {
    throw new HttpsError('permission-denied', 'You do not have access to this market.', { reason: 'market-denied' })
  }
  const timeZone = safeTimeZone(request.data?.timeZone)
  const { start, end } = getDateBounds(request.data?.dateRange || '30d', request.data?.customRange || null, timeZone)

  const { users, byId } = await readUsers()
  const [bookings, payments, escrows, withdrawals, disputes, safety, supportTickets, supportCases, verificationRequests, profileUpdates, subscriptions, assignments, managers] = await Promise.all([
    readBookings(byId),
    readAll('payments', { limit: 10000 }),
    readAll('escrow_transactions', { limit: 10000 }),
    readAll('withdrawal_requests', { limit: 5000 }),
    readAll('disputes', { limit: 3000 }),
    readAll('safety_reports', { limit: 3000 }),
    readAll('support_tickets', { limit: 3000 }),
    readAll('support_cases', { limit: 3000 }),
    readAll('verification_requests', { limit: 5000 }),
    readAll('professional_profile_update_requests', { limit: 3000 }),
    readAll('subscriptions', { limit: 10000 }),
    readAll(ASSIGNMENT_COLLECTION, { limit: 3000 }),
    getFirestore().collection('admin_profiles').where('roleId', '==', 'country_admin').where('markets', 'array-contains', market).limit(1).get().catch(() => null),
  ])
  const m = managers?.docs?.[0]
  return buildMarketDashboard(
    {
      users,
      usersById: byId,
      bookings: bookings.bookings,
      payments: payments.rows,
      escrows: escrows.rows,
      withdrawals: withdrawals.rows,
      disputes: disputes.rows,
      safety: safety.rows,
      supportTickets: supportTickets.rows,
      supportCases: supportCases.rows,
      verificationRequests: verificationRequests.rows,
      profileUpdates: profileUpdates.rows,
      subscriptions: subscriptions.rows,
      assignments: assignments.rows,
    },
    {
      market,
      start: start.getTime(),
      end: end.getTime(),
      now: Date.now(),
      dayKey: (ms) => format(toZonedTime(new Date(ms), timeZone), 'yyyy-MM-dd'),
      symbol: SYMBOLS[MARKETS[market].currency] || MARKETS[market].currency,
      manager: m ? { name: m.get('fullName') || m.get('email'), email: m.get('email') || null, role: 'Country Manager' } : null,
    },
  )
})
