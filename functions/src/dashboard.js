import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { format, startOfDay, startOfMonth, subDays } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { requireAdmin } from './auth.js'
import { ALL_MARKETS, adminAccess, canAccessMarket } from './accessModel.js'
import { MARKETS, buildGlobalDashboard } from './dashboardLogic.js'
import { readAll, readBookings, readUsers } from './platformLoaders.js'

const DEFAULT_TIME_ZONE = 'Africa/Nairobi'

export function safeTimeZone(tz) {
  try {
    if (typeof tz === 'string' && tz) {
      new Intl.DateTimeFormat('en', { timeZone: tz })
      return tz
    }
  } catch {
    // fall through
  }
  return DEFAULT_TIME_ZONE
}

export function getDateBounds(dateRange = 'today', customRange = null, timeZone = DEFAULT_TIME_ZONE) {
  const zonedNow = toZonedTime(new Date(), timeZone)

  let startZoned = startOfDay(zonedNow)
  let endZoned = zonedNow

  switch (dateRange) {
    case 'today':
      startZoned = startOfDay(zonedNow)
      break
    case 'yesterday':
      startZoned = startOfDay(subDays(zonedNow, 1))
      endZoned = startOfDay(zonedNow)
      break
    case '7d':
      startZoned = startOfDay(subDays(zonedNow, 7))
      break
    case '30d':
      startZoned = startOfDay(subDays(zonedNow, 30))
      break
    case 'this_month':
      startZoned = startOfMonth(zonedNow)
      break
    case 'custom':
      if (customRange?.start) startZoned = toZonedTime(new Date(customRange.start), timeZone)
      if (customRange?.end) endZoned = toZonedTime(new Date(customRange.end), timeZone)
      break
    default:
      startZoned = startOfDay(subDays(zonedNow, 7))
  }

  const startDateIso = format(startZoned, 'yyyy-MM-dd')
  const endDateIso = format(endZoned, 'yyyy-MM-dd')

  return {
    start: fromZonedTime(`${startDateIso}T00:00:00`, timeZone),
    end: fromZonedTime(`${endDateIso}T23:59:59`, timeZone),
  }
}


/**
 * ADM-005 — Global Admin Dashboard. data: { market, dateRange, customRange?, timeZone? }
 * Reads the mobile app's records and aggregates them in dashboardLogic.js.
 * Market access is enforced here; records without a resolvable country only
 * appear under "All Markets" for admins with unrestricted access.
 */
export const adminGetDashboardSummary = onCall(async (request) => {
  const uid = await requireAdmin(request, { permission: 'dashboard.view' })
  const access = await adminAccess(uid)
  const market = String(request.data?.market || 'ALL').toUpperCase()
  if (market !== 'ALL' && !MARKETS[market]) throw new HttpsError('invalid-argument', 'Unknown market.')
  if (market !== 'ALL' && !canAccessMarket(access, market)) {
    throw new HttpsError('permission-denied', 'You do not have access to this market.', { reason: 'market-denied' })
  }
  const markets = access.markets.includes(ALL_MARKETS) ? null : access.markets
  const timeZone = safeTimeZone(request.data?.timeZone)
  const { start, end } = getDateBounds(request.data?.dateRange || 'today', request.data?.customRange || null, timeZone)

  const { users, byId, truncated: usersTruncated } = await readUsers()
  const [bookings, payments, escrows, withdrawals, disputes, safety, supportTickets, verificationRequests, profileUpdates, subscriptions] = await Promise.all([
    readBookings(byId),
    readAll('payments', { limit: 10000 }),
    readAll('escrow_transactions', { limit: 10000 }),
    readAll('withdrawal_requests', { limit: 5000 }),
    readAll('disputes', { limit: 3000 }),
    readAll('safety_reports', { limit: 3000 }),
    readAll('support_tickets', { limit: 3000 }),
    readAll('verification_requests', { limit: 5000 }),
    readAll('professional_profile_update_requests', { limit: 3000 }),
    readAll('subscriptions', { limit: 10000 }),
  ])

  const result = buildGlobalDashboard(
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
      verificationRequests: verificationRequests.rows,
      profileUpdates: profileUpdates.rows,
      subscriptions: subscriptions.rows,
    },
    { market, markets, start: start.getTime(), end: end.getTime(), dayKey: (ms) => format(toZonedTime(new Date(ms), timeZone), 'yyyy-MM-dd') },
  )

  return {
    context: {
      marketId: market,
      marketName: MARKETS[market]?.name || 'All Markets',
      reportingCurrency: result.financial.currency,
      timeZone,
      isSandbox: false,
      dateRange: { id: request.data?.dateRange || 'today', start: start.toISOString(), end: end.toISOString() },
      generatedAt: new Date().toISOString(),
      truncated: usersTruncated || bookings.truncated || payments.truncated || escrows.truncated,
    },
    ...result,
    // Live infrastructure monitoring is not wired to the Admin panel yet; only
    // what this request itself proves is reported.
    systemHealth: {
      nodes: [
        { name: 'Database', status: 'Operational' },
        { name: 'Admin API', status: 'Operational' },
        { name: 'Payments', status: 'Not monitored' },
        { name: 'Notifications', status: 'Not monitored' },
        { name: 'Maps', status: 'Not monitored' },
      ],
      lastChecked: new Date().toISOString(),
    },
  }
})
