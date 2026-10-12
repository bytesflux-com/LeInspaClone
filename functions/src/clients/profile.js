// ADM-012 Client Profile — one aggregate payload for the Overview tab (identity, summary counts,
// the latest 3–5 records per module). Full histories live in ADM-013 → ADM-018.
// An Admin view over existing data: no admin_client_profiles. Contact details arrive MASKED;
// finance / safety / support blocks are omitted for roles that may not see them.
import { onCall } from 'firebase-functions/v2/https'
import {
  DAY_MS, F, adminCtx, audit, clientBlock, clientDocsAny, db, formatPhone, iso, loadClient, lower, ms, maskEmail, maskPhone, need, num, safeCount, tierOf,
} from './common.js'
import { bookingsOf } from './bookings.js'
import { paymentsOf } from './payments.js'
import { walletSnapshot } from './wallet.js'
import { loadMembership } from './membership.js'

const REG = { email: 'Email', phone: 'Phone', google: 'Google', apple: 'Apple' }
const PROFILE_BOOKING_STATUS = { ongoing: 'confirmed', disputed: 'pending' }
const OPEN = ['open', 'in_review', 'investigating', 'under_investigation', 'escalated']

export const adminGetClientProfile = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view' })
  const user = await loadClient(ctx, request.data?.clientId, request.data?.market)
  const { finance, safety, support } = ctx.perms
  const base = clientBlock(user)
  const ids = [...new Set([user.id, user.get(F.clientCode)].filter(Boolean))]
  const status = base.status

  const [bookings, payments, wallet, mem, rewarded, tickets, disputes, safetyOpen, restrictions] = await Promise.all([
    bookingsOf(user, 500),
    finance ? paymentsOf(user, 200) : [],
    finance ? walletSnapshot(user) : null,
    loadMembership(user, ctx),
    safeCount(db().collection('referrals').where('referrerId', '==', user.id).where('status', 'in', ['rewarded', 'successful'])),
    support ? db().collection('support_tickets').where('customerId', 'in', ids).limit(100).get() : null,
    db().collection('disputes').where('customerId', 'in', ids).where('status', 'in', OPEN).limit(50).get(),
    safety ? safeCount(db().collection('safety_reports').where('customerId', 'in', ids).where('status', 'in', OPEN)) : null,
    db().collection('account_restrictions').where('customerId', '==', user.id).where('status', '==', 'active').limit(20).get(),
  ])

  const now = Date.now()
  const inWin = (list, from, to, f) => list.filter((x) => now - ms(f(x)) >= from * DAY_MS && now - ms(f(x)) < to * DAY_MS)
  const delta = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0)
  const completed = bookings.filter((b) => b.status === 'completed')
  const openTickets = (tickets?.docs || []).filter((d) => OPEN.includes(lower(d.get('status'))))
  const openDisputes = disputes.size
  const issues = openTickets.length + openDisputes
  const lifetime = completed.reduce((s, b) => s + b.price, 0)
  const lifetimePrev = inWin(completed, 30, 60, (b) => b.scheduledAt).reduce((s, b) => s + b.price, 0)
  const lifetimeCur = inWin(completed, 0, 30, (b) => b.scheduledAt).reduce((s, b) => s + b.price, 0)

  const recentBookings = bookings.slice(0, 3).map((b) => ({
    id: b.id, service: b.service, venue: b.provider, scheduledAt: b.scheduledAt, status: PROFILE_BOOKING_STATUS[b.status] || b.status, amount: finance ? b.price : null, image: b.image,
  }))
  const recentPayments = payments.slice(0, 4).map((p) => ({ id: p.id, createdAt: p.createdAt, amount: p.amount, status: p.status, kind: p.method.label, category: p.type === 'membership' ? 'subscription' : p.type === 'refund' ? 'refund' : 'booking' }))

  const m = mem.membership
  const latest = [...openTickets, ...(tickets?.docs || [])].sort((a, b) => ms(b.get('createdAt')) - ms(a.get('createdAt')))[0]

  const activity = [
    ...bookings.slice(0, 2).map((b) => ({ id: `b-${b.docId}`, type: 'booking', at: b.createdAt, text: `Booking created – ${b.service}` })),
    ...(finance ? payments.slice(0, 2).map((p) => ({ id: `p-${p.docId}`, type: 'payment', at: p.createdAt, text: `Payment ${p.status === 'successful' ? 'completed' : p.status} – ${base.currency} ${p.amount.toLocaleString('en-US')}` })) : []),
    ...mem.events.slice(0, 1).map((e) => ({ id: `m-${e.id}`, type: 'membership', at: e.at, text: e.text })),
    ...(latest ? [{ id: `s-${latest.id}`, type: 'support', at: iso(latest.get('createdAt')), text: `Support ticket created – ${latest.get('ticketNumber') || latest.id}` }] : []),
    ...(user.get(F.updated) ? [{ id: 'u1', type: 'profile', at: iso(user.get(F.updated)), text: 'Profile updated' }] : []),
  ].filter((a) => a.at).sort((a, b) => ms(b.at) - ms(a.at)).slice(0, 5)

  const alerts = []
  if (status === 'suspended') alerts.push({ id: 'suspended', level: 'danger', title: 'Account Suspended', text: 'Sign-in and new bookings are blocked. History is retained.' })
  if (safety && safetyOpen) alerts.push({ id: 'safety', level: 'danger', title: 'Open Safety Review', text: 'A safety report is awaiting review.', restricted: 'safety' })
  if (finance && (user.get(F.paymentIssue) || payments.some((p) => p.status === 'failed' && now - ms(p.createdAt) < 14 * DAY_MS))) alerts.push({ id: 'payment', level: 'warning', title: 'Open Payment Issue', text: 'A payment on this account needs attention.', restricted: 'finance' })
  if (openDisputes) alerts.push({ id: 'dispute', level: 'warning', title: 'Open Dispute', text: 'A booking dispute is awaiting resolution.' })
  if (m?.status === 'payment_failed') alerts.push({ id: 'membership', level: 'warning', title: 'Membership Payment Failed', text: 'The latest renewal payment failed.' })
  const risk = status === 'suspended' || (safety && safetyOpen) ? 'High' : alerts.length ? 'Medium' : 'Low'
  const restrictionLabels = restrictions.docs.map((d) => d.get('label')).filter(Boolean)

  return {
    asOf: base.asOf,
    timeZone: base.timeZone,
    currency: base.currency,
    id: base.id, name: base.name, gender: base.gender, photoURL: base.photoURL,
    vip: tierOf(user.get(F.membership)) === 'executive',
    membershipTier: base.membershipTier, status, contactVerified: base.contactVerified,
    country: base.country, countryName: base.countryName, city: base.city,
    joinedAt: base.joinedAt, lastActiveAt: base.lastActiveAt,
    registrationLabel: REG[lower(user.get(F.regMethod))] || 'Mobile App',
    email: maskEmail(user.get(F.email)),
    phone: maskPhone(user.get(F.phone), base.country),
    stats: {
      totalBookings: bookings.length, completed: completed.length, cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      openIssues: issues,
      issuesLabel: openTickets.length ? `${openTickets.length} support ticket${openTickets.length > 1 ? 's' : ''}` : openDisputes ? `${openDisputes} open dispute${openDisputes > 1 ? 's' : ''}` : 'No open issues',
      bookingsDelta: delta(inWin(bookings, 0, 30, (b) => b.createdAt).length, inWin(bookings, 30, 60, (b) => b.createdAt).length),
      lifetimeValue: finance ? lifetime : null,
      lifetimeDelta: finance ? delta(lifetimeCur, lifetimePrev) : 0,
    },
    membership: m ? {
      tier: m.tierId, name: mem.config?.name || { standard: 'Standard Wellness Access', premium: 'Premium Wellness Access', executive: 'Executive Access' }[m.tierId],
      description: mem.config?.tagline || '', status: m.status, since: m.startedAt, nextRenewal: m.renewalAt, monthlyFee: finance ? m.price : null, autoRenew: m.autoRenew,
    } : { tier: 'none', name: 'No Membership', description: 'No active plan', status: 'none', since: base.joinedAt, nextRenewal: null, monthlyFee: 0, autoRenew: false },
    recentBookings,
    recentPayments: finance ? recentPayments : [],
    paymentCount: finance ? payments.filter((p) => p.status === 'successful').length : null,
    wallet: finance ? wallet : null,
    referrals: { code: user.get(F.referralCode) || null, referredBy: user.get(F.referredBy) || null, successful: rewarded, loyaltyStatus: status === 'active' ? 'active' : 'inactive', totalSavings: finance ? num(user.get(F.totalSavings)) : null },
    support: support ? {
      openTickets: openTickets.length, openDisputes, safetyReports: safety ? safetyOpen : null,
      latest: latest ? { id: latest.get('ticketNumber') || latest.id, subject: latest.get('subject') || 'Support ticket', createdAt: iso(latest.get('createdAt')), status: lower(latest.get('status')) === 'resolved' ? 'resolved' : lower(latest.get('status')) === 'open' ? 'open' : 'in_review' } : null,
    } : null,
    activity,
    account: { type: 'Client (Customer)', riskLevel: risk, restrictions: status === 'suspended' ? 'Suspended' : restrictionLabels.length ? restrictionLabels.join(', ') : 'None', alerts },
  }
})

// Unmasks email + phone. Needs users.reveal_pii and is always audit-logged.
export const adminRevealClientContact = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'users.view', fresh: true })
  need(ctx, 'users.reveal_pii', 'Your role cannot reveal full contact details.')
  const user = await loadClient(ctx, request.data?.clientId)
  await audit(request, ctx, 'client.contact_revealed', user, { fields: ['email', 'phone'] })
  return { email: user.get(F.email) || '', phone: formatPhone(user.get(F.phone), user.get(F.country)) }
})
