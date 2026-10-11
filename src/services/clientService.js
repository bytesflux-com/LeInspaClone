// ADM-011 — client directory service.
//
// Every call has the shape a server-side implementation needs: filtering,
// sorting and pagination happen behind this boundary, so the browser only
// ever holds one page. While the backend callables below are not deployed the
// service answers from a deterministic demo dataset. Set
// VITE_USE_MOCK_CLIENTS=false to call the real admin Cloud Functions instead:
//
//   adminGetClientDashboard, adminGetClientGrowth,
//   adminListClients, adminGetClientPreview, adminGetClientActivity,
//   adminGetClientNotes, adminExportClients, adminBulkNotifyClients,
//   adminBulkTagClients, adminAddClientNote,
//   adminGetClientProfile, adminRevealClientContact   (ADM-012)
//   adminGetClientBookings, adminGetBookingPreview     (ADM-013)
//   adminGetClientPayments, adminGetPaymentPreview,
//   adminAddPaymentNote                                (ADM-014)
//   adminGetClientWallet, adminGetWalletBalanceHistory,
//   adminGetWalletTransactionPreview,
//   adminAddWalletTransactionNote                      (ADM-015)
//   adminGetClientMembership, adminChangeClientMembership,
//   adminAddMembershipNote                             (ADM-016)
//   adminGetClientLoyalty, adminGetClientReferrals,
//   adminGetReferralPreview, adminAddLoyaltyNote       (ADM-017)
//   adminGetClientSupport, adminGetSupportCasePreview,
//   adminReplyToSupportCase, adminAddSupportCaseNote,
//   adminReassignSupportCase, adminEscalateSupportCase (ADM-018)
//   adminGetClientAccount, adminApplyClientAccountAction     (ADM-019)
//
// Country scope MUST be enforced by those functions (never trust `market`).
import { callAdmin } from '../lib/adminCall'
import { toCsv } from '../lib/download'
import { CITY_DIRECTORY, CLIENT_STATUS_TABS, DEFAULT_PAGE_SIZE } from '../constants/clients'
import { MARKETS } from '../constants/markets'
import {
  MOCK_CLIENTS,
  MOCK_CURRENCY,
  MOCK_REFERENCE_DATE,
  DAY_MS,
  maskEmail,
  maskPhone,
  fullEmail,
  fullPhone,
} from './mock/clientDirectoryMock'
import { buildDashboard, buildGrowth } from './mock/clientDashboardMock'
import { buildClientProfile } from './mock/clientProfileMock'
import { queryClientBookings, buildBookingPreview } from './mock/clientBookingsMock'
import { queryClientPayments, buildPaymentPreview, addMockPaymentNote } from './mock/clientPaymentsMock'
import { queryClientWallet, buildWalletHistory, buildWalletTransactionPreview, addMockWalletNote } from './mock/clientWalletMock'
import { buildClientMembership, applyMockMembershipChange, addMockMembershipNote } from './mock/clientMembershipMock'
import { buildClientLoyalty, queryClientReferrals, buildReferralPreview, addMockLoyaltyNote } from './mock/clientLoyaltyMock'
import { buildClientAccount, applyAccountAction } from './mock/clientAccountMock'
import { queryClientSupport, buildSupportCasePreview, addMockCaseMessage, addMockCaseNote, reassignMockCase, escalateMockCase } from './mock/clientSupportMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_CLIENTS !== 'false'
const delay = (ms = 160) => new Promise((r) => setTimeout(r, ms))
// Mock lifetime values are stored in KES-equivalent; show in the client's market currency.
const FX = { KE: 1, UG: 28, TZ: 19, RW: 10, ZA: 0.14 }
const countryName = (code) => MARKETS.find((m) => m.id === code)?.name || code

// ---------- helpers (mock backend) ----------

function matchesSearch(row, q) {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  const digits = needle.replace(/\D/g, '')
  return (
    row.id.toLowerCase().includes(needle) ||
    row.name.toLowerCase().includes(needle) ||
    fullEmail(row).toLowerCase().includes(needle) ||
    (digits.length >= 3 && fullPhone(row).replace(/\D/g, '').includes(digits))
  )
}

function matchesActivity(row, activity) {
  switch (activity) {
    case 'today': return row.lastBookingDaysAgo === 0
    case 'week': return row.lastBookingDaysAgo !== null && row.lastBookingDaysAgo <= 7
    case 'upcoming': return row.hasUpcoming
    case 'in_service': return row.inService
    case 'none': return row.bookings === 0
    case 'returning': return row.bookings >= 2
    case 'cancelled_recent': return row.cancelledRecently
    default: return true
  }
}

function applyFilters(rows, p, { ignoreStatus = false } = {}) {
  const country = p.market && p.market !== 'ALL' ? p.market : p.country
  const joinedCutoff = { '7d': 7, '30d': 30, '90d': 90 }[p.joined]
  const issues = p.issues || []
  const withinDays = (value, limit) => value !== null && value <= Number(limit)

  return rows.filter((r) => {
    if (country && r.country !== country) return false
    if (!ignoreStatus && p.status && p.status !== 'all' && r.status !== p.status) return false
    if (p.membership && r.membership !== p.membership) return false
    if (p.region && r.region !== p.region) return false
    if (p.city && r.city !== p.city) return false
    if (p.activity && !matchesActivity(r, p.activity)) return false
    if (joinedCutoff && MOCK_REFERENCE_DATE - r.joinedAt > joinedCutoff * DAY_MS) return false
    if (p.joined === 'year' && new Date(r.joinedAt).getUTCFullYear() !== new Date(MOCK_REFERENCE_DATE).getUTCFullYear()) return false
    if (p.from && r.joinedAt < Date.parse(p.from)) return false
    if (p.to && r.joinedAt > Date.parse(p.to) + DAY_MS - 1) return false
    if (p.reg && r.regMethod !== p.reg) return false
    if (p.guest === 'yes' && !r.guestConverted) return false
    if (p.guest === 'no' && r.guestConverted) return false
    if (p.bmin !== '' && p.bmin !== undefined && r.bookings < Number(p.bmin)) return false
    if (p.bmax !== '' && p.bmax !== undefined && r.bookings > Number(p.bmax)) return false
    if (p.lastb === 'never' && r.lastBookingDaysAgo !== null) return false
    if (p.lastb && p.lastb !== 'never' && !withinDays(r.lastBookingDaysAgo, p.lastb)) return false
    if (p.lasta && r.lastActiveDaysAgo > Number(p.lasta)) return false
    if (issues.includes('dispute') && !r.openDisputes) return false
    if (issues.includes('ticket') && !r.supportTickets) return false
    if (issues.includes('safety') && !r.safetyCase) return false
    if (issues.includes('payment') && !r.paymentIssue) return false
    return matchesSearch(r, p.q || '')
  })
}

const SORTERS = {
  newest: (a, b) => b.joinedAt - a.joinedAt,
  oldest: (a, b) => a.joinedAt - b.joinedAt,
  bookings: (a, b) => b.bookings - a.bookings || b.joinedAt - a.joinedAt,
  active: (a, b) => a.lastActiveDaysAgo - b.lastActiveDaysAgo || b.joinedAt - a.joinedAt,
  updated: (a, b) => a.updatedDaysAgo - b.updatedDaysAgo || b.joinedAt - a.joinedAt,
  value: (a, b) => b.lifetimeValue - a.lifetimeValue,
}

// Masked list projection — the directory never receives full contact details.
function toListItem(r) {
  return {
    id: r.id,
    name: r.name,
    gender: r.gender,
    photoURL: r.photoURL || null,
    email: maskEmail(r),
    phone: maskPhone(r),
    country: r.country,
    countryName: countryName(r.country),
    city: r.city,
    membership: r.membership,
    status: r.status,
    bookings: r.bookings,
    lifetimeValue: Math.round(r.lifetimeValue * (FX[r.country] || 1)),
    currency: MOCK_CURRENCY[r.country] || 'USD',
    guestConverted: r.guestConverted,
    joinedAt: new Date(r.joinedAt).toISOString(),
  }
}

const notesStore = new Map()

function mockActivity(r) {
  const base = [
    { id: 'a1', type: 'booking', title: 'Booked a Deep Tissue Massage', daysAgo: r.lastBookingDaysAgo ?? 1 },
    { id: 'a2', type: 'payment', title: 'Wallet top-up completed', daysAgo: (r.lastBookingDaysAgo ?? 1) + 2 },
    { id: 'a3', type: 'login', title: 'Signed in from the mobile app', daysAgo: r.lastActiveDaysAgo },
    { id: 'a4', type: 'profile', title: 'Updated profile details', daysAgo: r.updatedDaysAgo },
  ]
  if (r.bookings === 0) return base.slice(2)
  return base.sort((a, b) => a.daysAgo - b.daysAgo)
}

// ---------- public API ----------

export const clientService = {
  // ADM-010 — aggregate dashboard for the selected market + reporting period.
  async getClientDashboard({ market, range }) {
    if (!USE_MOCK) return callAdmin('adminGetClientDashboard', { market, range })
    await delay(240)
    return buildDashboard({ market, range })
  },

  async getClientGrowth({ market, window }) {
    if (!USE_MOCK) return callAdmin('adminGetClientGrowth', { market, window })
    await delay(160)
    return buildGrowth({ market, window })
  },

  async listClients(params) {
    if (!USE_MOCK) return callAdmin('adminListClients', params)
    await delay()
    const page = Math.max(1, Number(params.page) || 1)
    const pageSize = Number(params.pageSize) || DEFAULT_PAGE_SIZE

    const scoped = applyFilters(MOCK_CLIENTS, params, { ignoreStatus: true })
    const counts = { all: scoped.length }
    for (const t of CLIENT_STATUS_TABS) if (t.id !== 'all') counts[t.id] = 0
    for (const r of scoped) if (r.status in counts) counts[r.status]++

    const filtered = params.status && params.status !== 'all' ? scoped.filter((r) => r.status === params.status) : scoped
    const sorter = SORTERS[params.sort] || SORTERS.newest
    const sorted = [...filtered].sort(sorter)

    // An exact Client ID match always ranks first.
    const q = (params.q || '').trim().toLowerCase()
    if (q) {
      const i = sorted.findIndex((r) => r.id.toLowerCase() === q)
      if (i > 0) sorted.unshift(sorted.splice(i, 1)[0])
    }

    const start = (page - 1) * pageSize
    return {
      items: sorted.slice(start, start + pageSize).map(toListItem),
      total: sorted.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
      counts,
    }
  },

  // Lightweight aggregate preview — never the full booking/payment history.
  async getClientPreview(clientId) {
    if (!USE_MOCK) return callAdmin('adminGetClientPreview', { clientId })
    await delay(120)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r) throw new Error('Client not found or outside your authorised markets.')
    const joined = new Date(r.joinedAt)
    const validUntil = new Date(joined)
    validUntil.setUTCFullYear(validUntil.getUTCFullYear() + 1)
    return {
      ...toListItem(r),
      currency: MOCK_CURRENCY[r.country] || 'USD',
      stats: {
        totalBookings: r.bookings,
        completed: r.completedCount,
        cancelled: r.cancelledCount,
        openDisputes: r.openDisputes,
        supportTickets: r.supportTickets,
        walletBalance: r.walletBalance,
      },
      totalSavings: r.totalSavings,
      referredBy: r.referredBy,
      membershipDetail: {
        tier: r.membership,
        since: joined.toISOString(),
        validUntil: validUntil.toISOString(),
      },
    }
  },

  async getClientActivity(clientId) {
    if (!USE_MOCK) return callAdmin('adminGetClientActivity', { clientId })
    await delay(120)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    return r ? mockActivity(r) : []
  },

  async getClientNotes(clientId) {
    if (!USE_MOCK) return callAdmin('adminGetClientNotes', { clientId })
    await delay(100)
    return notesStore.get(clientId) || []
  },

  async addClientNote({ clientId, note }) {
    if (!USE_MOCK) return callAdmin('adminAddClientNote', { clientId, note })
    await delay(220)
    const entry = { id: `n${Date.now()}`, note, author: 'You', createdAt: new Date().toISOString() }
    notesStore.set(clientId, [entry, ...(notesStore.get(clientId) || [])])
    return entry
  },

  // ADM-012 — one aggregate payload for the Overview tab: identity, summary
  // counts and the latest 3–5 records per module. Full histories belong to the
  // dedicated screens (ADM-013 → ADM-018). Contact details arrive MASKED.
  // The server must enforce country scope and omit financial / safety blocks
  // the admin is not permitted to see.
  async getClientProfile(clientId, { market } = {}) {
    if (!USE_MOCK) return callAdmin('adminGetClientProfile', { clientId, market })
    await delay(260)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (market && market !== 'ALL' && r.country !== market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return buildClientProfile(r)
  },

  // Unmasks email + phone. The callable must record an audit event.
  async revealClientContact(clientId) {
    if (!USE_MOCK) return callAdmin('adminRevealClientContact', { clientId })
    await delay(200)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r) throw new Error('Client not found or outside your authorised markets.')
    const d = `7${r.phoneTail}${r.phoneTail.slice(1, 3)}`
    return { email: fullEmail(r), phone: `${r.phonePrefix} ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` }
  },

  // ADM-013 — a client's bookings, read from the central `bookings` collection
  // (no admin copy). Filtering, sorting, paging and status counts run on the
  // server; payment / escrow fields are omitted when `finance` is false. The
  // server must validate admin, permission, country and client access.
  async getClientBookings(clientId, params = {}) {
    if (!USE_MOCK) return callAdmin('adminGetClientBookings', { clientId, ...params })
    await delay(220)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (params.market && params.market !== 'ALL' && r.country !== params.market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return queryClientBookings(r, params)
  },

  // ADM-013 — quick preview for the drawer; access is revalidated on every open.
  async getBookingPreview(bookingId, { clientId, market, finance } = {}) {
    if (!USE_MOCK) return callAdmin('adminGetBookingPreview', { bookingId, clientId, market })
    await delay(140)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (market && market !== 'ALL' && r.country !== market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return buildBookingPreview(r, bookingId, { finance })
  },

  // ADM-014 — a client's payment history, read from the central `payments`
  // collection (no admin copy). Filtering, sorting, paging and summary metrics
  // run on the server; status comes from verified backend / provider events,
  // never from the client-facing success screen. The server must validate admin,
  // finance permission, country and client access, and mask processor details.
  async getClientPayments(clientId, params = {}) {
    if (!USE_MOCK) return callAdmin('adminGetClientPayments', { clientId, ...params })
    await delay(220)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (params.market && params.market !== 'ALL' && r.country !== params.market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return queryClientPayments(r, params)
  },

  // ADM-014 — drawer details; permission is revalidated on every open.
  async getPaymentPreview(paymentId, { clientId, market } = {}) {
    if (!USE_MOCK) return callAdmin('adminGetPaymentPreview', { paymentId, clientId, market })
    await delay(140)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (market && market !== 'ALL' && r.country !== market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return buildPaymentPreview(r, paymentId)
  },

  // ADM-014 — internal note only; it never touches the financial record.
  async addPaymentNote({ clientId, paymentId, text }) {
    if (!USE_MOCK) return callAdmin('adminAddPaymentNote', { clientId, paymentId, text })
    await delay(220)
    return addMockPaymentNote(clientId, paymentId, text)
  },

  // ADM-015 — one client's wallet, read from the existing `wallets` +
  // `wallet_transactions` collections (no admin copy). Balance, credits, debits
  // and status counts are aggregated server-side and must reconcile
  // (credits − debits = balance); a mismatch is reported, never auto-corrected.
  // The server must validate admin, finance permission, country and client access,
  // and keep the Client Wallet separate from Provider / Referral / Platform / Escrow wallets.
  async getClientWallet(clientId, params = {}) {
    if (!USE_MOCK) return callAdmin('adminGetClientWallet', { clientId, ...params })
    await delay(220)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (params.market && params.market !== 'ALL' && r.country !== params.market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return queryClientWallet(r, params)
  },

  // ADM-015 — compact balance-over-time series (7 / 30 / 90 days) for the chart.
  async getWalletBalanceHistory(clientId, { market, window = 30 } = {}) {
    if (!USE_MOCK) return callAdmin('adminGetWalletBalanceHistory', { clientId, market, window })
    await delay(160)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (market && market !== 'ALL' && r.country !== market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return buildWalletHistory(r, { window })
  },

  // ADM-015 — drawer details; permission is revalidated on every open.
  async getWalletTransactionPreview(txnId, { clientId, market } = {}) {
    if (!USE_MOCK) return callAdmin('adminGetWalletTransactionPreview', { txnId, clientId, market })
    await delay(140)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (market && market !== 'ALL' && r.country !== market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return buildWalletTransactionPreview(r, txnId)
  },

  // ADM-015 — internal note only; it never touches balances or financial records.
  async addWalletTransactionNote({ clientId, txnId, text }) {
    if (!USE_MOCK) return callAdmin('adminAddWalletTransactionNote', { clientId, txnId, text })
    await delay(220)
    return addMockWalletNote(clientId, txnId, text)
  },

  // ADM-016 — one client's membership, read from `customer_memberships`, the plan
  // configuration, membership history/events and membership payments (no admin copy).
  // Price and benefits come from the record / configuration — never from the UI.
  // The server must validate admin, permission, country and client access, resolve the
  // membership status separately from the client-account status, and omit payments
  // and prices when the admin lacks payment-viewing permission.
  async getClientMembership(clientId, { market } = {}) {
    if (!USE_MOCK) return callAdmin('adminGetClientMembership', { clientId, market })
    await delay(240)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (market && market !== 'ALL' && r.country !== market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return buildClientMembership(r)
  },

  // ADM-016 — controlled manual change. Reason is mandatory. The callable must
  // re-verify the admin where required (callAdmin handles `reverification-required`),
  // re-read the latest membership, validate the transition / market / Executive
  // eligibility, update transactionally, preserve the previous record, write the
  // history event + audit log, notify the client where appropriate and refresh access.
  // It can never mark a payment successful.
  async changeClientMembership({ clientId, action, payload, reason, note }) {
    if (!USE_MOCK) return callAdmin('adminChangeClientMembership', { clientId, action, payload, reason, note })
    await delay(420)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r) throw new Error('Client not found or outside your authorised markets.')
    return applyMockMembershipChange(r, { action, payload, reason, note })
  },

  // ADM-016 — internal note only; it never alters the membership.
  async addMembershipNote({ clientId, text }) {
    if (!USE_MOCK) return callAdmin('adminAddMembershipNote', { clientId, text })
    await delay(220)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r) throw new Error('Client not found or outside your authorised markets.')
    return addMockMembershipNote(r, text)
  },

  // ADM-017 — one client's referral identity, referral funnel, loyalty account, loyalty
  // activity and rewards, read from the existing `users` / `customer_profiles`,
  // `referrals`, `loyalty_accounts`, `loyalty_transactions` and reward records (no admin
  // copy, no `admin_referrals` / `admin_loyalty`). Referral success is resolved by the
  // configured referral rule and the loyalty progress by the configured loyalty rule —
  // both server-side. The server must validate admin, country and client access, keep
  // referral and loyalty balances separate, and omit monetary values / transaction links
  // when the admin lacks payment-viewing permission.
  async getClientLoyalty(clientId, { market } = {}) {
    if (!USE_MOCK) return callAdmin('adminGetClientLoyalty', { clientId, market })
    await delay(240)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (market && market !== 'ALL' && r.country !== market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return buildClientLoyalty(r)
  },

  // ADM-017 — one page of the referral list (tab / search / date / sort / paging are
  // applied server-side, so the browser only ever holds one page).
  async getClientReferrals(clientId, params = {}) {
    if (!USE_MOCK) return callAdmin('adminGetClientReferrals', { clientId, ...params })
    await delay(200)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (params.market && params.market !== 'ALL' && r.country !== params.market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return queryClientReferrals(r, params)
  },

  // ADM-017 — referral drawer details; permission is revalidated on every open.
  async getReferralPreview(referralId, { clientId, market } = {}) {
    if (!USE_MOCK) return callAdmin('adminGetReferralPreview', { referralId, clientId, market })
    await delay(140)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (market && market !== 'ALL' && r.country !== market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return buildReferralPreview(r, referralId)
  },

  // ADM-017 — internal note only; it never creates, edits or reverses a reward.
  async addLoyaltyNote({ clientId, text }) {
    if (!USE_MOCK) return callAdmin('adminAddLoyaltyNote', { clientId, text })
    await delay(220)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r) throw new Error('Client not found or outside your authorised markets.')
    return addMockLoyaltyNote(r, text)
  },

  // ADM-018 — one client's support & safety history. An aggregated Admin view over the REAL
  // case systems (`support_tickets`, `disputes`, `safety_reports`, report records, restriction
  // records, case events) — there is no `admin_client_support_history` collection. Support,
  // Dispute, Safety and Report stay distinct case types. The server must validate admin, session,
  // client and country access, resolve the admin's role, and return permission-safe data: safety
  // cases, safety counts, restriction reasons and "reports involving client" are omitted for roles
  // without Trust & Safety access. `perms` is used by the demo backend only.
  async getClientSupport(clientId, params = {}, perms = {}) {
    if (!USE_MOCK) return callAdmin('adminGetClientSupport', { clientId, ...params })
    await delay(240)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (params.market && params.market !== 'ALL' && r.country !== params.market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return queryClientSupport(r, params, perms)
  },

  // ADM-018 — drawer details. Permission is revalidated on every open, related booking/payment/
  // provider are resolved server-side, internal notes are returned separately from the client
  // conversation, and opening a sensitive (safety) case is written to the audit log.
  async getSupportCasePreview(caseId, { clientId, market } = {}, perms = {}) {
    if (!USE_MOCK) return callAdmin('adminGetSupportCasePreview', { caseId, clientId, market })
    await delay(160)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (market && market !== 'ALL' && r.country !== market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return buildSupportCasePreview(r, caseId, perms)
  },

  // ADM-018 — reply goes through the shared support messaging; it never includes internal notes.
  async replyToSupportCase({ clientId, caseId, text }) {
    if (!USE_MOCK) return callAdmin('adminReplyToSupportCase', { clientId, caseId, text })
    await delay(240)
    return addMockCaseMessage(clientId, caseId, text)
  },

  // ADM-018 — internal note: stored separately, never visible to the client.
  async addSupportCaseNote({ clientId, caseId, text }) {
    if (!USE_MOCK) return callAdmin('adminAddSupportCaseNote', { clientId, caseId, text })
    await delay(200)
    return addMockCaseNote(clientId, caseId, text)
  },

  async reassignSupportCase({ clientId, caseId, assignee }) {
    if (!USE_MOCK) return callAdmin('adminReassignSupportCase', { clientId, caseId, assignee })
    await delay(200)
    return reassignMockCase(clientId, caseId, assignee)
  },

  async escalateSupportCase({ clientId, caseId }) {
    if (!USE_MOCK) return callAdmin('adminEscalateSupportCase', { clientId, caseId })
    await delay(200)
    return escalateMockCase(clientId, caseId)
  },

  // ADM-019 — one client's account-control state: account status, scoped restrictions, open cases,
  // upcoming bookings, action history and the notifications sent. Read from the existing `users`,
  // `account_restrictions`, `account_actions`, `notifications`, `bookings` and case collections
  // (no second Admin copy of the client account). Account status and restrictions are separate
  // concepts. The server must validate admin, session, client and country access and return the
  // set of actions THIS admin may perform (`permitted`) — the UI only reflects it. `perms` is used by
  // the demo backend only.
  async getClientAccount(clientId, { market } = {}, perms = {}) {
    if (!USE_MOCK) return callAdmin('adminGetClientAccount', { clientId, market })
    await delay(240)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r || (market && market !== 'ALL' && r.country !== market)) {
      throw new Error('Client not found or outside your authorised markets.')
    }
    return buildClientAccount(r, perms)
  },

  // ADM-019 — the single write path for every account action. The browser only COLLECTS the request:
  // the callable must re-authenticate the admin, re-check role / permission / country, re-read the
  // client's LATEST state and restrictions, validate the transition, re-verify the admin for
  // high-impact actions (callAdmin handles `reverification-required`), apply it transactionally,
  // preserve the previous state, write `account_actions` / `account_restrictions`, audit-log it,
  // notify the client and trigger the downstream access changes. It never cancels bookings,
  // never touches wallet funds, and never deletes an old restriction.
  async applyClientAccountAction({ clientId, action, ...payload }, perms = {}) {
    if (!USE_MOCK) return callAdmin('adminApplyClientAccountAction', { clientId, action, ...payload })
    await delay(520)
    const r = MOCK_CLIENTS.find((c) => c.id === clientId)
    if (!r) throw new Error('Client not found or outside your authorised markets.')
    return applyAccountAction(r, { action, ...payload }, perms)
  },

  getCities(country) {
    const codes = country && country !== 'ALL' ? [country] : Object.keys(CITY_DIRECTORY)
    return codes.flatMap((c) => CITY_DIRECTORY[c] || [])
  },

  // Bulk actions — safe actions only. Suspend / delete are intentionally absent.
  async sendNotification({ clientIds, title, message }) {
    if (!USE_MOCK) return callAdmin('adminBulkNotifyClients', { clientIds, title, message })
    await delay(350)
    return { queued: clientIds.length }
  },

  async addInternalTag({ clientIds, tag }) {
    if (!USE_MOCK) return callAdmin('adminBulkTagClients', { clientIds, tag })
    await delay(300)
    return { tagged: clientIds.length }
  },

  // Returns CSV text of masked directory columns.
  async exportClients(params, { limit = 5000 } = {}) {
    if (!USE_MOCK) return callAdmin('adminExportClients', params)
    await delay(300)
    const rows = applyFilters(MOCK_CLIENTS, params).sort(SORTERS[params.sort] || SORTERS.newest).slice(0, limit)
    return clientService.rowsToCsv(rows.map(toListItem))
  },

  rowsToCsv(items) {
    return toCsv(items, [
      { label: 'Client ID', value: (r) => r.id },
      { label: 'Name', value: (r) => r.name },
      { label: 'Email (masked)', value: (r) => r.email },
      { label: 'Phone (masked)', value: (r) => r.phone },
      { label: 'Country', value: (r) => r.countryName },
      { label: 'City', value: (r) => r.city },
      { label: 'Membership', value: (r) => r.membership },
      { label: 'Status', value: (r) => r.status },
      { label: 'Bookings', value: (r) => r.bookings },
      { label: 'Joined', value: (r) => r.joinedAt.slice(0, 10) },
    ])
  },
}
