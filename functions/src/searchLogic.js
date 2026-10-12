// ADM-007 — Global Search: pure matching over the mobile app's records
// (users, bookings, payments, withdrawal_requests, disputes, support_tickets).
// Results are permission-scoped and market-scoped; contact details are masked.
// No sample entities: an empty search returns empty groups.

import { MARKETS } from './dashboardLogic.js'
import { accountStatusOf, inMarkets, lowerStatus, millis, providerTypeOf, PROVIDER_TYPES } from './platformData.js'

export const GROUPS = ['clients', 'providers', 'spas', 'hotels', 'bookings', 'payments', 'withdrawals', 'disputes', 'supportTickets']

export function allowedGroups(permissions = []) {
  const has = (p) => permissions.includes(p)
  const out = []
  if (has('users.view')) out.push('clients')
  if (has('providers.view')) out.push('providers', 'spas', 'hotels')
  if (has('bookings.view')) out.push('bookings')
  if (has('payments.view') || has('withdrawals.approve')) out.push('payments', 'withdrawals')
  if (has('safety.manage')) out.push('disputes')
  if (has('support.view')) out.push('supportTickets')
  return out
}

export const maskEmail = (e) => (e ? String(e).replace(/^(.{1,2}).*(@.*)$/, '$1••••$2') : '—')
export const maskPhone = (p) => {
  const d = String(p || '').replace(/\s+/g, '')
  return d.length > 6 ? `${d.slice(0, 4)}••••${d.slice(-3)}` : d ? '••••' : '—'
}
const fmtDate = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : '—')
const titleStatus = (s) => {
  const v = lowerStatus(s)
  return v ? v.charAt(0).toUpperCase() + v.slice(1).replaceAll('_', ' ') : '—'
}

/**
 * @param src  { users, usersById, bookings (normalized), payments, withdrawals, disputes, supportTickets }
 * @param opts { query, category, market, markets, permissions }
 */
export function searchEntities(src, { query = '', category = 'all', market = 'ALL', markets = null, permissions = [] }) {
  const q = String(query || '').trim().toLowerCase()
  const exactKey = q.replace(/^#/, '')
  const scope = market !== 'ALL' ? [market] : markets
  const groupsAllowed = allowedGroups(permissions)
  const ownerCountry = (...uids) => uids.map((u) => src.usersById.get(u)?.countryCodeResolved).find(Boolean) || null
  const nameOf = (uid) => {
    const u = src.usersById.get(uid)
    return u?.displayName || u?.fullName || u?.businessName || null
  }
  const marketName = (code) => MARKETS[code]?.name || code || 'Unknown'
  const hit = (...fields) => !q || fields.filter(Boolean).join(' ').toLowerCase().includes(q)
  const results = Object.fromEntries(GROUPS.map((g) => [g, []]))

  for (const u of src.users) {
    if (!inMarkets(u.countryCodeResolved, scope)) continue
    const name = u.displayName || u.fullName || u.businessName || ''
    if (!hit(name, u.email, u.phoneNumber, u.id, u.city)) continue
    const type = providerTypeOf(u.accountType)
    const status = titleStatus(accountStatusOf(u.accountStatus))
    const common = { id: u.id, name: name || 'Unnamed', market: u.countryCodeResolved, marketName: marketName(u.countryCodeResolved), status, joinedAt: millis(u.createdAt) ? `Joined ${fmtDate(millis(u.createdAt))}` : '—', avatarUrl: u.profilePhoto || null, location: [u.city, u.country].filter(Boolean).join(', ') }
    if (!type && String(u.accountType).toLowerCase() === 'customer') {
      results.clients.push({ ...common, type: 'client', role: 'Client', email: maskEmail(u.email), phone: maskPhone(u.phoneNumber), city: u.city || '—', link: `/clients/${u.id}` })
    } else if (type === 'spa') {
      results.spas.push({ ...common, type: 'spa', category: PROVIDER_TYPES.spa.label, verified: u.isVerified === true, thumbnailUrl: u.profilePhoto || null, branches: null, link: `/providers/${u.id}` })
    } else if (type === 'hotel_resort') {
      results.hotels.push({ ...common, type: 'hotel', category: PROVIDER_TYPES.hotel_resort.label, verified: u.isVerified === true, thumbnailUrl: u.profilePhoto || null, link: `/providers/${u.id}` })
    } else if (type) {
      results.providers.push({ ...common, type: 'provider', specialty: PROVIDER_TYPES[type].label, verified: lowerStatus(u.professionalVerificationStatus) === 'approved' || u.isVerified === true, rating: null, reviewCount: null, link: `/providers/${u.id}` })
    }
  }

  for (const b of src.bookings) {
    if (!inMarkets(b.countryCode, scope)) continue
    if (!hit(b.id, b.reference, b.service.name, b.client.name, b.provider.name)) continue
    results.bookings.push({ id: b.id, reference: `#${b.reference || b.id}`, service: b.service.name, clientName: b.client.name, clientRole: b.guest ? 'Guest' : 'Client', market: b.countryCode, marketName: marketName(b.countryCode), scheduledAt: b.scheduledStart ? new Date(b.scheduledStart).toISOString() : '—', status: titleStatus(b.status), amount: b.amount != null ? `${b.currency || ''} ${Number(b.amount).toLocaleString('en')}`.trim() : '—', link: `/bookings/${b.id}` })
  }

  for (const p of src.payments) {
    const code = ownerCountry(p.customerId, p.userId, p.providerId)
    if (!inMarkets(code, scope)) continue
    const ref = p.transactionReference || p.paymentId || p.id
    if (!hit(p.id, ref, p.bookingId, p.paymentType, p.type)) continue
    const amount = p.local?.totalPaid ?? p.amount
    results.payments.push({ id: p.id, reference: ref, bookingReference: p.bookingId ? `#${p.bookingId}` : '—', amount: amount != null ? `${p.local?.currency || p.currency || ''} ${Number(amount).toLocaleString('en')}`.trim() : '—', method: p.paymentMethod || '—', status: titleStatus(p.paymentStatus || p.status), date: fmtDate(millis(p.paidAt || p.createdAt)), market: code, marketName: marketName(code), link: `/payments/${p.id}` })
  }

  for (const w of src.withdrawals) {
    const code = ownerCountry(w.userId, w.providerId)
    if (!inMarkets(code, scope)) continue
    if (!hit(w.id, w.withdrawalId, nameOf(w.userId), w.payoutMethod)) continue
    results.withdrawals.push({ id: w.id, reference: w.withdrawalId || w.id, recipientName: nameOf(w.userId) || 'Provider', amount: `${MARKETS[code]?.currency || 'KES'} ${Number(w.amount || 0).toLocaleString('en')}`, status: titleStatus(w.status), date: fmtDate(millis(w.createdAt)), market: code, marketName: marketName(code), link: `/withdrawals/${w.id}` })
  }

  for (const d of src.disputes) {
    const code = ownerCountry(d.reporterId, d.againstId, d.clientId, d.providerId)
    if (!inMarkets(code, scope)) continue
    if (!hit(d.id, d.bookingId, d.type, d.notes)) continue
    results.disputes.push({ id: d.id, reference: d.id, bookingReference: d.bookingId ? `#${d.bookingId}` : '—', reason: d.reason || d.notes || titleStatus(d.type), status: titleStatus(d.status), date: fmtDate(millis(d.createdAt)), market: code, marketName: marketName(code), link: `/disputes/${d.id}` })
  }

  for (const t of src.supportTickets) {
    const code = ownerCountry(t.userId)
    if (!inMarkets(code, scope)) continue
    if (!hit(t.id, t.subject, t.category, t.senderName)) continue
    results.supportTickets.push({ id: t.id, reference: t.id, subject: t.subject || 'Support request', initiatorRole: t.senderType || 'User', status: titleStatus(t.status), date: fmtDate(millis(t.createdAt)), market: code, marketName: marketName(code), link: `/support/${t.id}` })
  }

  const counts = { all: 0 }
  const filtered = {}
  for (const g of GROUPS) {
    const key = g === 'supportTickets' ? 'support' : g
    const list = groupsAllowed.includes(g) ? results[g].slice(0, 50) : []
    counts[key] = list.length
    counts.all += list.length
    filtered[g] = category === 'all' || category === key ? list : []
  }

  // Exact reference / id match across permitted groups.
  let exactMatch = null
  if (exactKey) {
    for (const g of groupsAllowed) {
      const found = results[g].find((r) => [r.id, String(r.reference || '').replace(/^#/, '')].some((v) => String(v || '').toLowerCase() === exactKey))
      if (found) {
        exactMatch = { type: g, title: found.reference || found.name || found.id, subtitle: found.service || found.subject || found.recipientName || found.name || '', amount: found.amount || null, market: found.market, marketName: found.marketName, status: found.status, link: found.link }
        break
      }
    }
  }

  return { counts, totalResults: counts.all, results: filtered, exactMatch }
}
