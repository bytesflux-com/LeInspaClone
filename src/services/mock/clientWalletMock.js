// Demo data for ADM-015 (Client Wallet). Used only while the
// `adminGetClientWallet` / `adminGetWalletBalanceHistory` /
// `adminGetWalletTransactionPreview` Cloud Functions are not deployed.
// The ledger is derived from the existing client rows — there is no separate
// "admin client wallet" record. CL-78421 mirrors the ADM-015 mockup:
// credits 28,500 − debits 16,050 = balance 12,450 (+ 2,000 pending refund).
import { MOCK_CURRENCY, DAY_MS } from './clientDirectoryMock'
import { buildClientProfile } from './clientProfileMock'
import { TXN_TYPE_LABELS } from '../../constants/clientWallet'

const hashOf = (text) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
const at = (y, m, d, hh, mm, tz = 3) => new Date(Date.UTC(y, m - 1, d, hh - tz, mm)).toISOString()
const iso = (ms) => new Date(ms).toISOString()
const TZ_OFFSET_MS = 3 * 3_600_000

const METHODS = {
  mpesa: { kind: 'mpesa', label: 'M-PESA' },
  visa: { kind: 'visa', label: 'Visa •••• 4821' },
  mastercard: { kind: 'mastercard', label: 'Mastercard •••• 2214' },
}

// ---------- ledger rows ----------
// `seq` is the ledger posting sequence (1 = oldest). Balances are derived from it,
// so Previous Balance + Amount = New Balance for every completed row.

function row(seq, o) {
  return {
    seq,
    id: o.id || `WLT-TXN-${10000 + (hashOf(`${o.type}-${seq}-${o.createdAt}`) % 89000)}`,
    type: o.type,
    title: TXN_TYPE_LABELS[o.type],
    subtitle: o.method ? METHODS[o.method].label : null,
    related: o.related || null,
    createdAt: o.createdAt,
    amount: o.amount,
    direction: o.direction,
    status: o.status || 'completed',
    method: o.method ? METHODS[o.method] : null,
    paymentId: o.paymentId || null,
    booking: o.booking || null,
    refund: o.refund || null,
    promo: o.promo || null,
    membership: o.membership || null,
    failure: o.failure || null,
  }
}

const bk = (id, service, provider, amount, image) => ({ id, service, provider, amount, image: image || null })

function seededLedger() {
  const topup = (seq, createdAt, amount, method = 'mpesa', extra = {}) => row(seq, { type: 'topup', direction: 'credit', createdAt, amount, method, paymentId: `PAY-${90000 + seq * 37}`, ...extra })
  const pay = (seq, createdAt, amount, b, extra = {}) => row(seq, { type: 'booking', direction: 'debit', createdAt, amount, related: { label: `Booking #${b.id}`, sub: b.service }, booking: b, ...extra })
  return [
    topup(1, at(2026, 1, 12, 10, 5), 8000),
    topup(2, at(2026, 2, 20, 15, 20), 3500, 'visa'),
    row(3, { id: 'WLT-TXN-18420', type: 'refund', direction: 'credit', createdAt: at(2026, 3, 14, 11, 40), amount: 1500, related: { label: 'Booking #LI-31200', sub: null }, booking: bk('LI-31200', 'Classic Facial', 'Radiance Spa', 1500, '/demo/bk-facial.jpg'), refund: { id: 'RFD-3120', reason: 'Booking cancellation', status: 'Completed', requestedAt: at(2026, 3, 14, 9, 12) } }),
    topup(4, at(2026, 4, 2, 9, 10), 2500),
    row(5, { type: 'promo', direction: 'credit', createdAt: at(2026, 4, 4, 12, 0), amount: 1000, related: { label: 'Easter Promo', sub: null }, promo: { name: 'Easter Promo' } }),
    pay(6, at(2026, 4, 15, 14, 30), 1250, bk('LI-33410', 'Swedish Massage', 'Tranquil Escapes Resort', 1250, '/demo/bk-swedish.jpg')),
    topup(7, at(2026, 4, 20, 16, 45), 3000, 'mpesa', { status: 'failed', direction: 'none', failure: 'M-PESA request timed out' }),
    topup(8, at(2026, 5, 11, 8, 30), 3000),
    pay(9, at(2026, 5, 19, 13, 0), 1000, bk('LI-34120', 'Classic Facial', 'Radiance Spa', 1000, '/demo/bk-facial.jpg')),
    topup(10, at(2026, 5, 28, 19, 15), 2000, 'visa', { status: 'failed', direction: 'none', failure: 'Card declined by issuer' }),
    topup(11, at(2026, 6, 9, 9, 40), 2000),
    pay(12, at(2026, 6, 17, 7, 30), 900, bk('LI-35219', 'Meditation Session', 'Mindful Living Center', 900, '/demo/bk-meditation.jpg')),
    pay(13, at(2026, 6, 30, 17, 0), 800, bk('LI-36055', 'Yoga Session', 'Flow Wellness Studio', 800, '/demo/bk-yoga.jpg')),
    pay(14, at(2026, 7, 12, 12, 20), 600, bk('LI-37411', 'Express Facial', 'Radiance Spa', 600, '/demo/bk-facial.jpg')),
    topup(15, at(2026, 7, 24, 10, 10), 1000),
    topup(16, at(2026, 7, 29, 11, 15), 3000, 'mpesa', { status: 'failed', direction: 'none', failure: 'M-PESA request timed out' }),
    topup(17, at(2026, 7, 30, 18, 0), 500),
    row(18, { id: 'WLT-TXN-44011', type: 'membership', direction: 'debit', createdAt: at(2026, 8, 1, 9, 15), amount: 3000, related: { label: 'Premium Renewal', sub: null }, membership: { name: 'Premium Membership', note: 'Monthly renewal' } }),
    pay(19, at(2026, 8, 18, 18, 0), 4000, bk('LI-43910', 'Yoga Session', 'Elite Fitness Hub', 4000, '/demo/bk-training.jpg'), { id: 'WLT-TXN-55120' }),
    row(20, { id: 'WLT-TXN-62018', type: 'promo', direction: 'credit', createdAt: at(2026, 8, 25, 10, 30), amount: 500, related: { label: 'Welcome Promo', sub: null }, promo: { name: 'Welcome Promo' } }),
    row(21, { id: 'WLT-TXN-77124', type: 'refund', direction: 'credit', status: 'pending', createdAt: at(2026, 9, 2, 17, 12), amount: 2000, related: { label: 'Booking #LI-46021', sub: null }, booking: bk('LI-46021', 'Swedish Massage', 'Tranquil Escapes Resort', 2000, '/demo/bk-swedish.jpg'), refund: { id: 'RFD-4602', reason: 'Booking cancellation', status: 'Pending', requestedAt: at(2026, 9, 2, 17, 12) } }),
    pay(22, at(2026, 9, 12, 13, 58), 4500, bk('LI-48291', 'Deep Tissue Massage', 'Serenity Wellness Spa', 4500, '/demo/bk-massage.jpg'), { id: 'WLT-TXN-82174' }),
    topup(23, at(2026, 9, 12, 13, 45), 5000, 'mpesa', { id: 'WLT-TXN-92841', paymentId: 'PAY-92840' }),
  ]
}

// Deterministic split of `total` into `n` parts (multiples of 50).
function split(total, n, seed) {
  if (n <= 0 || total <= 0) return []
  const weights = Array.from({ length: n }, (_, i) => 1 + ((seed >> (i * 3)) % 5))
  const sum = weights.reduce((a, b) => a + b, 0)
  const parts = weights.map((w) => Math.max(50, Math.round((total * w) / sum / 50) * 50))
  parts[parts.length - 1] += total - parts.reduce((a, b) => a + b, 0)
  return parts.filter((p) => p > 0)
}

function generatedLedger(r, profile) {
  const w = profile.wallet
  const seed = hashOf(r.id)
  const credits = split(w.credits, Math.min(4, Math.max(1, 1 + (seed % 4))), seed)
  const debits = split(w.debits, Math.min(6, r.bookings), seed >> 2)
  const start = new Date(profile.joinedAt).getTime() + DAY_MS
  const end = new Date(profile.asOf).getTime() - DAY_MS
  const items = []
  credits.forEach((amount, i) => items.push({ kind: 'credit', amount, i }))
  debits.forEach((amount, i) => items.push({ kind: 'debit', amount, i }))
  // Credits first within a slot so the balance never dips below zero.
  items.sort((a, b) => (a.kind === b.kind ? a.i - b.i : a.kind === 'credit' ? -1 : 1))
  const interleaved = []
  const cs = items.filter((x) => x.kind === 'credit')
  const ds = items.filter((x) => x.kind === 'debit')
  while (cs.length || ds.length) {
    if (cs.length) interleaved.push(cs.shift())
    if (ds.length) interleaved.push(ds.shift())
  }
  const span = Math.max(DAY_MS, end - start)
  const rows = interleaved.map((x, i) => {
    const t = iso(start + Math.round((span * (i + 1)) / (interleaved.length + 1)))
    if (x.kind === 'credit') return row(i + 1, { type: 'topup', direction: 'credit', createdAt: t, amount: x.amount, method: 'mpesa', paymentId: `PAY-${10000 + ((seed + i * 977) % 80000)}` })
    const id = `LI-${30000 + ((seed + i * 131) % 15000)}`
    return row(i + 1, { type: 'booking', direction: 'debit', createdAt: t, amount: x.amount, related: { label: `Booking #${id}`, sub: 'Wellness Session' }, booking: bk(id, 'Wellness Session', 'Partner Provider', x.amount) })
  })
  if (w.pendingRefund) {
    const id = `LI-${40000 + (seed % 9000)}`
    rows.push(row(rows.length + 1, { type: 'refund', direction: 'credit', status: 'pending', createdAt: iso(end - 2 * DAY_MS), amount: w.pendingRefund, related: { label: `Booking #${id}`, sub: null }, booking: bk(id, 'Wellness Session', 'Partner Provider', w.pendingRefund), refund: { id: `RFD-${1000 + (seed % 9000)}`, reason: 'Booking cancellation', status: 'Pending', requestedAt: iso(end - 2 * DAY_MS) } }))
  }
  return rows
}

// Attach running balances in posting order; only completed rows move the balance.
function withBalances(rows) {
  let bal = 0
  return rows
    .sort((a, b) => a.seq - b.seq)
    .map((t) => {
      const before = bal
      if (t.status === 'completed' && t.direction === 'credit') bal += t.amount
      if (t.status === 'completed' && t.direction === 'debit') bal -= t.amount
      return { ...t, balanceBefore: before, balanceAfter: t.status === 'completed' ? bal : before }
    })
}

const ledgerCache = new Map()
function ledgerFor(r) {
  if (!ledgerCache.has(r.id)) {
    const profile = buildClientProfile(r)
    const rows = r.id === 'CL-78421' ? seededLedger() : generatedLedger(r, profile)
    ledgerCache.set(r.id, withBalances(rows))
  }
  return ledgerCache.get(r.id)
}

function summarize(list) {
  const done = list.filter((t) => t.status === 'completed')
  const sum = (arr) => arr.reduce((s, t) => s + t.amount, 0)
  const credits = sum(done.filter((t) => t.direction === 'credit'))
  const debits = sum(done.filter((t) => t.direction === 'debit'))
  const balance = list.length ? list[list.length - 1].balanceAfter : 0
  return {
    balance,
    pending: sum(list.filter((t) => t.status === 'pending' && t.direction === 'credit')),
    credits,
    debits,
    // Credits − Debits must equal the wallet balance; a mismatch becomes a Finance exception.
    reconciled: credits - debits === balance,
    counts: {
      all: list.length,
      credits: list.filter((t) => t.direction === 'credit').length,
      debits: list.filter((t) => t.direction === 'debit').length,
      refunds: list.filter((t) => t.type === 'refund').length,
      pending: list.filter((t) => t.status === 'pending').length,
    },
  }
}

const clientBlock = (profile, r) => ({
  id: profile.id,
  name: profile.name,
  photoURL: profile.photoURL,
  gender: profile.gender,
  membershipTier: profile.membershipTier,
  status: profile.status,
  contactVerified: profile.contactVerified,
  country: profile.country,
  countryName: profile.countryName,
  city: profile.city,
  joinedAt: profile.joinedAt,
  lastActiveAt: profile.lastActiveAt,
  asOf: profile.asOf,
  timeZone: profile.timeZone,
  currency: MOCK_CURRENCY[r.country] || profile.currency || 'USD',
})

// ---------- list query (server-side filtering / sorting / paging) ----------

const matchesDate = (t, date, asOf) => {
  if (!date) return true
  const ms = new Date(t.createdAt).getTime()
  const now = new Date(asOf).getTime()
  if (date === 'year') return new Date(ms).getUTCFullYear() === new Date(now).getUTCFullYear()
  const days = { '7d': 7, '30d': 30, '90d': 90 }[date]
  return days ? now - ms <= days * DAY_MS && ms <= now + DAY_MS : true
}

const SORTERS = {
  newest: (a, b) => b.seq - a.seq,
  oldest: (a, b) => a.seq - b.seq,
  amount_high: (a, b) => b.amount - a.amount || b.seq - a.seq,
  amount_low: (a, b) => a.amount - b.amount || b.seq - a.seq,
}

const TAB_FILTERS = {
  all: () => true,
  credits: (t) => t.direction === 'credit',
  debits: (t) => t.direction === 'debit',
  refunds: (t) => t.type === 'refund',
  pending: (t) => t.status === 'pending',
}

const listItem = (t) => ({
  id: t.id,
  seq: t.seq,
  type: t.type,
  title: t.title,
  subtitle: t.subtitle,
  related: t.related,
  createdAt: t.createdAt,
  amount: t.amount,
  direction: t.direction,
  status: t.status,
  method: t.method,
  bookingId: t.booking?.id || null,
})

export function queryClientWallet(r, p) {
  const profile = buildClientProfile(r)
  const all = ledgerFor(r)
  const needle = (p.q || '').trim().toLowerCase()

  let rows = all.filter((t) => {
    if (!(TAB_FILTERS[p.tab] || TAB_FILTERS.all)(t)) return false
    if (p.status && p.status !== 'all' && t.status !== p.status) return false
    if (!matchesDate(t, p.date, profile.asOf)) return false
    if (p.ttype && t.type !== p.ttype) return false
    if (p.effect && t.direction !== p.effect) return false
    if (p.linked && !t.booking) return false
    if (!needle) return true
    return [t.id, t.paymentId || '', t.booking?.id || '', t.related?.label || '', t.title, t.refund?.id || ''].some((v) => v.toLowerCase().includes(needle))
  })
  rows = [...rows].sort(SORTERS[p.sort] || SORTERS.newest)

  const pageSize = Number(p.pageSize) || 6
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const page = Math.min(Math.max(1, Number(p.page) || 1), totalPages)
  const start = (page - 1) * pageSize
  const s = summarize(all)

  return {
    client: clientBlock(profile, r),
    wallet: {
      id: `WLT-${r.id}`,
      type: 'Client Wallet',
      status: r.status === 'suspended' ? 'frozen' : 'active',
      owner: profile.name,
      currency: MOCK_CURRENCY[r.country] || profile.currency || 'USD',
      country: profile.country,
      countryName: profile.countryName,
      createdAt: profile.joinedAt,
    },
    summary: s,
    items: rows.slice(start, start + pageSize).map(listItem),
    total: rows.length,
    page,
    pageSize,
    totalPages,
  }
}

// ---------- balance history ----------

export function buildWalletHistory(r, { window = 30 } = {}) {
  const all = ledgerFor(r)
  const profile = buildClientProfile(r)
  const currency = MOCK_CURRENCY[r.country] || profile.currency || 'USD'
  const dayOf = (iso_) => Math.floor((new Date(iso_).getTime() + TZ_OFFSET_MS) / DAY_MS)
  const done = all.filter((t) => t.status === 'completed' && t.direction !== 'none')
  const last = all.length ? dayOf(all[all.length - 1].createdAt) : dayOf(profile.asOf)
  const first = last - (Number(window) - 1)
  let bal = 0
  let i = 0
  const points = []
  for (let d = Math.min(first, dayOf(profile.joinedAt)); d <= last; d++) {
    while (i < done.length && dayOf(done[i].createdAt) <= d) {
      bal = done[i].balanceAfter
      i++
    }
    if (d >= first) points.push({ at: iso(d * DAY_MS), balance: bal })
  }
  return { currency, window: Number(window), points, timeZone: 'UTC' }
}

// ---------- drawer preview ----------

const notesStore = new Map()

function timelineFor(t) {
  const ms = new Date(t.createdAt).getTime()
  const ev = (id, sec, text, tone = 'ok') => ({ id, at: iso(ms + sec * 1000), text, tone })
  if (t.status === 'failed') {
    return [ev('e1', 0, 'Transaction initiated'), ev('e2', 30, t.failure || 'Payment could not be completed', 'bad'), ev('e3', 31, 'Transaction marked failed', 'bad')]
  }
  if (t.type === 'topup') {
    return [ev('e1', 0, 'Transaction initiated'), ev('e2', 30, `Payment received from ${t.method.kind === 'mpesa' ? 'M-PESA' : t.method.label}`), ev('e3', 60, 'Payment verified'), ev('e4', 75, 'Wallet credited')]
  }
  if (t.type === 'booking') {
    return [ev('e1', 0, 'Wallet payment requested'), ev('e2', 20, 'Available balance verified'), ev('e3', 40, 'Wallet debited'), ev('e4', 55, 'Booking payment recorded')]
  }
  if (t.type === 'refund') {
    return t.status === 'pending'
      ? [ev('e1', 0, 'Refund requested'), ev('e2', 600, 'Refund approved'), ev('e3', 601, 'Waiting for wallet credit', 'wait')]
      : [ev('e1', 0, 'Refund requested'), ev('e2', 600, 'Refund approved'), ev('e3', 660, 'Wallet credited')]
  }
  if (t.type === 'promo') return [ev('e1', 0, 'Promotion applied'), ev('e2', 5, 'Credit issued'), ev('e3', 10, 'Wallet credited')]
  return [ev('e1', 0, 'Renewal due'), ev('e2', 20, 'Wallet debited'), ev('e3', 40, 'Membership renewed')]
}

export function buildWalletTransactionPreview(r, txnId) {
  const profile = buildClientProfile(r)
  const t = ledgerFor(r).find((x) => x.id === txnId)
  if (!t) throw new Error('Transaction not found or outside your authorised markets.')
  const cur = MOCK_CURRENCY[r.country] || 'KES'
  return {
    ...listItem(t),
    currency: cur,
    timeZone: profile.timeZone,
    asOf: profile.asOf,
    client: { id: profile.id, name: profile.name },
    typeLabel: t.title,
    balanceBefore: t.balanceBefore,
    balanceAfter: t.status === 'pending' ? null : t.balanceAfter,
    funding: t.type === 'topup' && t.method ? { method: t.method, paymentId: t.paymentId, amount: t.amount } : null,
    booking: t.booking,
    refund: t.refund ? { ...t.refund, amount: t.amount } : null,
    promo: t.promo,
    membership: t.membership,
    failure: t.failure,
    timeline: timelineFor(t),
    notes: notesStore.get(`${r.id}|${t.id}`) || [],
  }
}

export function addMockWalletNote(clientId, txnId, text) {
  const entry = { id: `wn${Date.now()}`, author: 'You', text, createdAt: new Date().toISOString() }
  const key = `${clientId}|${txnId}`
  notesStore.set(key, [entry, ...(notesStore.get(key) || [])])
  return entry
}
