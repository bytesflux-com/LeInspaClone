// ADM-015 Client Wallet — an Admin view over `wallets` + `wallet_transactions`
// (no admin_client_wallets). Only the CLIENT wallet of the selected client is read; the
// Provider / Referral / Platform / Escrow wallets are never combined with it.
// There is deliberately no edit / set-balance / delete-transaction callable. The only write
// is an internal note. Credits − Debits ≠ balance is reported (`reconciled: false`), never auto-fixed.
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import {
  DAY_MS, addNote, adminCtx, clientBlock, cleanText, currencyOf, db, iso, listNotes, loadClient, lower, ms, num, paginate, tzOf, countryName,
} from './common.js'
import { methodOf } from './payments.js'

const TYPE = { topup: 'topup', wallet_topup: 'topup', booking: 'booking', booking_payment: 'booking', refund: 'refund', booking_refund: 'refund', promo: 'promo', promotional_credit: 'promo', membership: 'membership', membership_fee: 'membership' }
const TITLE = { topup: 'Wallet Top Up', booking: 'Booking Payment', refund: 'Booking Refund', promo: 'Promotional Credit', membership: 'Membership Fee' }

async function clientWallet(user) {
  const wallets = db().collection('wallets')
  let snap = await wallets.where('ownerId', '==', user.id).where('type', '==', 'client').limit(1).get()
  if (snap.empty) snap = await wallets.where('ownerId', '==', user.id).limit(5).get()
  return snap.docs.find((d) => ['client', 'client_wallet'].includes(lower(d.get('type') ?? d.get('walletType')))) ?? null
}

function normalizeTxn(d) {
  const t = d.data()
  const type = TYPE[lower(t.type ?? t.transactionType)]
  if (!type) return null
  const status = ['completed', 'success', 'successful'].includes(lower(t.status)) ? 'completed' : lower(t.status) === 'failed' ? 'failed' : 'pending'
  const direction = lower(t.direction) === 'debit' ? 'debit' : 'credit'
  const method = type === 'topup' && (t.method || t.paymentMethod) ? methodOf(t) : null
  const bookingId = t.bookingNumber || t.bookingId || null
  return {
    id: t.transactionNumber || d.id,
    docId: d.id,
    type,
    title: TITLE[type],
    subtitle: method ? method.label : null,
    related: bookingId ? { label: `Booking #${bookingId}`, sub: t.serviceName || null } : type === 'promo' ? { label: 'Promotion / Campaign', sub: null } : type === 'membership' ? { label: 'Membership', sub: null } : null,
    createdAt: iso(t.createdAt),
    amount: num(t.amount),
    direction,
    status,
    method,
    paymentId: t.paymentNumber || t.paymentId || null,
    booking: bookingId ? { id: bookingId, service: t.serviceName || '', provider: t.providerName || '', amount: num(t.bookingAmount ?? t.amount), image: t.serviceImage || null } : null,
    refund: type === 'refund' ? { id: t.refundNumber || t.refundId || null, reason: t.reason || 'Booking cancellation', status: status === 'completed' ? 'Completed' : 'Pending', requestedAt: iso(t.requestedAt ?? t.createdAt), bookingId } : null,
    promo: type === 'promo' ? { name: t.promoName || t.campaign || 'Promotional credit' } : null,
    membership: type === 'membership' ? { name: t.membershipName || 'Membership', note: t.note || null } : null,
    failure: status === 'failed' ? t.failureReason || 'Payment could not be completed' : null,
    stored: { before: t.balanceBefore, after: t.balanceAfter },
  }
}

// Orders oldest → newest and assigns running balances (stored values win when present).
function ledgerOf(docs) {
  const rows = docs.map(normalizeTxn).filter(Boolean).sort((a, b) => ms(a.createdAt) - ms(b.createdAt))
  let balance = 0
  rows.forEach((r, i) => {
    r.seq = i + 1
    r.balanceBefore = typeof r.stored.before === 'number' ? r.stored.before : balance
    if (r.status === 'completed') balance = typeof r.stored.after === 'number' ? r.stored.after : balance + (r.direction === 'credit' ? r.amount : -r.amount)
    r.balanceAfter = r.status === 'completed' ? balance : null
    delete r.stored
  })
  return rows
}

function summarize(list, wallet) {
  const done = list.filter((t) => t.status === 'completed')
  const sum = (arr) => arr.reduce((s, t) => s + t.amount, 0)
  const credits = sum(done.filter((t) => t.direction === 'credit'))
  const debits = sum(done.filter((t) => t.direction === 'debit'))
  const balance = wallet ? num(wallet.get('availableBalance') ?? wallet.get('balance')) : 0
  return {
    balance,
    pending: sum(list.filter((t) => t.status === 'pending' && t.direction === 'credit')),
    credits,
    debits,
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

const TAB = {
  all: () => true,
  credits: (t) => t.direction === 'credit',
  debits: (t) => t.direction === 'debit',
  refunds: (t) => t.type === 'refund',
  pending: (t) => t.status === 'pending',
}
const SORT = {
  newest: (a, b) => b.seq - a.seq,
  oldest: (a, b) => a.seq - b.seq,
  amount_high: (a, b) => b.amount - a.amount || b.seq - a.seq,
  amount_low: (a, b) => a.amount - b.amount || b.seq - a.seq,
}
function dateOk(t, date) {
  if (!date) return true
  const v = ms(t.createdAt)
  const now = Date.now()
  if (date === 'year') return new Date(v).getUTCFullYear() === new Date(now).getUTCFullYear()
  const days = { '7d': 7, '30d': 30, '90d': 90 }[date]
  return days ? now - v <= days * DAY_MS && v <= now + DAY_MS : true
}
const listItem = (t) => ({
  id: t.id, seq: t.seq, type: t.type, title: t.title, subtitle: t.subtitle, related: t.related, createdAt: t.createdAt,
  amount: t.amount, direction: t.direction, status: t.status, method: t.method, bookingId: t.booking?.id || null,
})

async function loadLedger(user) {
  const wallet = await clientWallet(user)
  const docs = wallet ? (await db().collection('wallet_transactions').where('walletId', '==', wallet.id).limit(2000).get()).docs : []
  return { wallet, ledger: ledgerOf(docs) }
}

export const adminGetClientWallet = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'payments.view' })
  const p = request.data || {}
  const user = await loadClient(ctx, p.clientId, p.market)
  const { wallet, ledger } = await loadLedger(user)
  const client = clientBlock(user)
  const needle = String(p.q || '').trim().toLowerCase()
  let rows = ledger.filter((t) => {
    if (!(TAB[p.tab] || TAB.all)(t)) return false
    if (p.status && p.status !== 'all' && t.status !== p.status) return false
    if (!dateOk(t, p.date)) return false
    if (p.ttype && t.type !== p.ttype) return false
    if (p.effect && t.direction !== p.effect) return false
    if (p.linked && !t.booking) return false
    return !needle || [t.id, t.paymentId || '', t.booking?.id || '', t.related?.label || '', t.title, t.refund?.id || ''].some((v) => String(v).toLowerCase().includes(needle))
  })
  rows = [...rows].sort(SORT[p.sort] || SORT.newest)
  const page = paginate(rows, p, 6)
  const country = user.get('countryCode')
  return {
    client,
    wallet: {
      id: wallet?.get('walletNumber') || `WLT-${client.id}`,
      type: 'Client Wallet',
      status: wallet ? (['frozen', 'suspended', 'restricted'].includes(lower(wallet.get('status'))) ? 'frozen' : 'active') : 'active',
      owner: client.name,
      currency: wallet?.get('currency') || currencyOf(country),
      country,
      countryName: countryName(country),
      createdAt: iso(wallet?.get('createdAt')) || client.joinedAt,
    },
    summary: summarize(ledger, wallet),
    ...page,
    items: page.items.map(listItem),
  }
})

export const adminGetWalletBalanceHistory = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'payments.view' })
  const p = request.data || {}
  const user = await loadClient(ctx, p.clientId, p.market)
  const window = [7, 30, 90].includes(Number(p.window)) ? Number(p.window) : 30
  const { wallet, ledger } = await loadLedger(user)
  const done = ledger.filter((t) => t.status === 'completed')
  const dayOf = (v) => Math.floor(ms(v) / DAY_MS)
  const last = dayOf(new Date())
  const first = last - (window - 1)
  let balance = 0
  let i = 0
  const points = []
  for (let d = Math.min(first, done.length ? dayOf(done[0].createdAt) : first); d <= last; d++) {
    while (i < done.length && dayOf(done[i].createdAt) <= d) { balance = done[i].balanceAfter; i++ }
    if (d >= first) points.push({ at: new Date(d * DAY_MS).toISOString(), balance })
  }
  return { currency: wallet?.get('currency') || currencyOf(user.get('countryCode')), window, points, timeZone: 'UTC' }
})

function timelineOf(t) {
  const at = ms(t.createdAt)
  const ev = (id, sec, text, tone = 'ok') => ({ id, at: new Date(at + sec * 1000).toISOString(), text, tone })
  if (t.status === 'failed') return [ev('e1', 0, 'Transaction initiated'), ev('e2', 30, t.failure, 'bad'), ev('e3', 31, 'Transaction marked failed', 'bad')]
  if (t.type === 'topup') return [ev('e1', 0, 'Transaction initiated'), ev('e2', 30, `Payment received from ${t.method?.label || 'provider'}`), ev('e3', 60, 'Payment verified'), ev('e4', 75, 'Wallet credited')]
  if (t.type === 'booking') return [ev('e1', 0, 'Wallet payment requested'), ev('e2', 20, 'Available balance verified'), ev('e3', 40, 'Wallet debited'), ev('e4', 55, 'Booking payment recorded')]
  if (t.type === 'refund') return t.status === 'pending' ? [ev('e1', 0, 'Refund requested'), ev('e2', 600, 'Refund approved'), ev('e3', 601, 'Waiting for wallet credit', 'wait')] : [ev('e1', 0, 'Refund requested'), ev('e2', 600, 'Refund approved'), ev('e3', 660, 'Wallet credited')]
  if (t.type === 'promo') return [ev('e1', 0, 'Promotion applied'), ev('e2', 5, 'Credit issued'), ev('e3', 10, 'Wallet credited')]
  return [ev('e1', 0, 'Renewal due'), ev('e2', 20, 'Wallet debited'), ev('e3', 40, 'Membership renewed')]
}

export const adminGetWalletTransactionPreview = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'payments.view' })
  const p = request.data || {}
  const user = await loadClient(ctx, p.clientId, p.market)
  const { ledger } = await loadLedger(user)
  const t = ledger.find((x) => x.id === p.txnId || x.docId === p.txnId)
  if (!t) throw new HttpsError('not-found', 'Transaction not found or outside your authorised markets.')
  const notes = await listNotes(user.id, 'wallet_txn', t.docId)
  return {
    ...listItem(t),
    currency: currencyOf(user.get('countryCode')),
    timeZone: tzOf(user.get('countryCode')),
    asOf: new Date().toISOString(),
    client: { id: clientBlock(user).id, name: user.get('fullName') || 'Client' },
    typeLabel: t.title,
    balanceBefore: t.balanceBefore,
    balanceAfter: t.status === 'pending' ? null : t.balanceAfter,
    funding: t.type === 'topup' && t.method ? { method: t.method, paymentId: t.paymentId, amount: t.amount } : null,
    booking: t.booking,
    refund: t.refund ? { ...t.refund, amount: t.amount } : null,
    promo: t.promo,
    membership: t.membership,
    failure: t.failure,
    timeline: timelineOf(t),
    notes: notes.map((n) => ({ id: n.id, author: n.author, text: n.text, createdAt: n.createdAt })),
  }
})

// Internal note only — it never touches balances or any financial record.
export const adminAddWalletTransactionNote = onCall(async (request) => {
  const ctx = await adminCtx(request, { permission: 'payments.view' })
  const user = await loadClient(ctx, request.data?.clientId)
  const { ledger } = await loadLedger(user)
  const t = ledger.find((x) => x.id === request.data?.txnId || x.docId === request.data?.txnId)
  if (!t) throw new HttpsError('not-found', 'Transaction not found or outside your authorised markets.')
  const e = await addNote(request, ctx, user, { scope: 'wallet_txn', refId: t.docId, text: cleanText(request.data?.text, { max: 1000, label: 'Note' }) })
  return { id: e.id, author: e.author, text: e.text, createdAt: e.createdAt }
})

// Compact wallet numbers for the ADM-012 overview card.
export async function walletSnapshot(user) {
  const { wallet, ledger } = await loadLedger(user)
  const s = summarize(ledger, wallet)
  return { balance: s.balance, credits: s.credits, debits: s.debits, pendingRefund: ledger.filter((t) => t.type === 'refund' && t.status === 'pending').reduce((n, t) => n + t.amount, 0) }
}
