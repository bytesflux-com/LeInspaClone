import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { requireAdmin } from './auth.js'
import { ALL_MARKETS, adminAccess, canAccessMarket } from './accessModel.js'
import { MARKETS } from './dashboardLogic.js'
import { searchEntities } from './searchLogic.js'
import { readAll, readBookings, readUsers } from './platformLoaders.js'

/**
 * ADM-007 — Global Search. data: { query, category, market, sortBy }
 * Searches the mobile app's records server-side; results are limited to the
 * groups the admin's role may see and to the admin's markets.
 */
export const adminGlobalSearch = onCall(async (request) => {
  const uid = await requireAdmin(request)
  const access = await adminAccess(uid)
  const { query = '', category = 'all', sortBy = 'relevance' } = request.data || {}
  const market = String(request.data?.market || 'ALL').toUpperCase()
  if (market !== 'ALL' && !MARKETS[market]) throw new HttpsError('invalid-argument', 'Unknown market.')
  if (market !== 'ALL' && !canAccessMarket(access, market)) {
    throw new HttpsError('permission-denied', 'You do not have access to this market.', { reason: 'market-denied' })
  }
  if (String(query).length > 120) throw new HttpsError('invalid-argument', 'Search query is too long.')

  const perms = access.permissions
  const { users, byId } = await readUsers()
  const [bookings, payments, withdrawals, disputes, supportTickets] = await Promise.all([
    perms.includes('bookings.view') ? readBookings(byId) : { bookings: [] },
    perms.includes('payments.view') || perms.includes('withdrawals.approve') ? readAll('payments', { limit: 10000 }) : { rows: [] },
    perms.includes('payments.view') || perms.includes('withdrawals.approve') ? readAll('withdrawal_requests', { limit: 5000 }) : { rows: [] },
    perms.includes('safety.manage') ? readAll('disputes', { limit: 3000 }) : { rows: [] },
    perms.includes('support.view') ? readAll('support_tickets', { limit: 3000 }) : { rows: [] },
  ])

  const result = searchEntities(
    { users, usersById: byId, bookings: bookings.bookings, payments: payments.rows, withdrawals: withdrawals.rows, disputes: disputes.rows, supportTickets: supportTickets.rows },
    { query, category, market, markets: access.markets.includes(ALL_MARKETS) ? null : access.markets, permissions: perms },
  )
  return { query, market, category, sortBy, ...result }
})
