// ADM-035 → ADM-037 — Content moderation service.
//
// Calls the admin Cloud Functions (functions/src/contentModeration.js):
//   adminGetContentQueue, adminGetContentReview, adminStartContentReview,
//   adminContentDecision, adminBulkMediaDecision, adminCompleteGalleryReview,
//   adminAddModerationNote
// Market access, permissions, version checks and audit logs are enforced
// server-side. VITE_USE_MOCK_CONTENT=true runs an in-memory demo through the
// same moderation rules (functions/src/contentModerationLogic.js).
import { callAdmin } from '../lib/adminCall'
import { MARKETS } from '../constants/markets'
import {
  buildQueue,
  buildReview,
  checklistFor,
  decideMedia,
  decideRecord,
  galleryOutcome,
  historyEntry,
  label,
  normalizeModeration,
  OPEN_STATUSES,
  scopeRecords,
  validateDecision,
} from '../../functions/src/contentModerationLogic.js'
import { MOCK_ADMIN, contentStore } from './mock/contentModerationMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_CONTENT === 'true'
const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms))
const timeZoneOf = (market) => MARKETS.find((m) => m.id === market)?.timeZone || 'Africa/Nairobi'
const fail = (message) => {
  throw new Error(message)
}

// ---- demo backend (mirrors functions/src/contentModeration.js) ----
function entry(id) {
  const e = contentStore().get(id)
  if (!e) fail('This content is no longer in the moderation queue.')
  return e
}
function mutate(id, version, fn) {
  const e = entry(id)
  const record = normalizeModeration(id, e.doc)
  if (version != null && Number(version) !== record.version) fail('The provider submitted a newer version. Reload to review the latest content.')
  const now = new Date().toISOString()
  const out = fn({ record, now })
  Object.assign(e.doc, out.patch)
  e.history.push(...(out.history || []))
  return out
}
const providerStats = (record) => {
  const s = { approved: 0, changesRequested: 0, rejected: 0, escalated: 0 }
  for (const [id, e] of contentStore()) {
    if (id === record.id || e.doc.providerId !== record.provider.id) continue
    if (e.doc.status === 'approved') s.approved += 1
    else if (e.doc.status === 'changes_requested') s.changesRequested += 1
    else if (e.doc.status === 'rejected') s.rejected += 1
    else if (e.doc.status === 'escalated') s.escalated += 1
  }
  return s
}

const mock = {
  async queue(params) {
    await delay()
    const now = Date.now()
    const records = scopeRecords(
      [...contentStore(now)].map(([id, e]) => normalizeModeration(id, e.doc)),
      { markets: params.market && params.market !== 'ALL' ? [params.market] : null, providerCategory: params.providerType || null },
    )
    return { context: { market: params.market, generatedAt: new Date(now).toISOString(), adminId: MOCK_ADMIN.id, isDemo: true }, ...buildQueue(records, params, { now, adminId: MOCK_ADMIN.id }) }
  },
  async review(id) {
    await delay(150)
    const e = entry(id)
    const record = normalizeModeration(id, e.doc)
    return buildReview(record, { now: Date.now(), history: e.history, notes: e.notes, providerStats: providerStats(record) })
  },
  async start(id) {
    await delay(150)
    mutate(id, null, ({ record, now }) => {
      if (!OPEN_STATUSES.includes(record.status)) fail(`This content is already ${label(record.status).toLowerCase()}.`)
      const takeover = record.assignedTo && record.assignedTo.id !== MOCK_ADMIN.id
      return { patch: { status: record.status === 'escalated' ? 'escalated' : 'under_review', assignedTo: MOCK_ADMIN, reviewStartedAt: now }, history: [historyEntry(id, takeover ? `Review taken over from ${record.assignedTo.name}` : 'Review started', MOCK_ADMIN, now)] }
    })
    return { ok: true }
  },
  async decide(input) {
    await delay(200)
    return mutate(input.moderationId, input.version, ({ record, now }) => {
      if (!OPEN_STATUSES.includes(record.status)) fail(`This content is already ${label(record.status).toLowerCase()}.`)
      const isMedia = Boolean(input.mediaId)
      const error = validateDecision(input, checklistFor(record.contentType, isMedia || record.contentType === 'gallery'))
      if (error) fail(error)
      if (isMedia) {
        const current = record.media.find((m) => m.mediaId === input.mediaId)
        if (!['awaiting_review', 'under_review'].includes(current?.status)) fail('This media item already has a decision.')
        const res = decideMedia(record.media.map((m) => ({ ...m, uploadedAt: m.uploadedAt })), input.mediaId, input, MOCK_ADMIN, now)
        return { patch: { media: res.media, status: record.status === 'awaiting_review' ? 'under_review' : record.status, assignedTo: record.assignedTo || MOCK_ADMIN }, history: [historyEntry(input.moderationId, `${current.title}: ${label(res.status)}${input.reason ? ` — ${input.reason}` : ''}`, MOCK_ADMIN, now)] }
      }
      const res = decideRecord(record, input, MOCK_ADMIN, now)
      return { patch: res.patch, history: [res.history] }
    })
  },
  async bulk(input) {
    await delay(200)
    return mutate(input.moderationId, input.version, ({ record, now }) => {
      if (['reject', 'request_changes'].includes(input.decision)) {
        const error = validateDecision(input, [])
        if (error) fail(error)
      }
      let media = record.media
      for (const it of input.items) {
        const current = media.find((m) => m.mediaId === it.mediaId)
        if (!['awaiting_review', 'under_review'].includes(current?.status)) fail(`${current?.title || 'An item'} already has a decision.`)
        media = decideMedia(media, it.mediaId, input, MOCK_ADMIN, now).media
      }
      return { patch: { media, status: record.status === 'awaiting_review' ? 'under_review' : record.status }, history: [historyEntry(input.moderationId, `${input.items.length} media items: ${label({ approve: 'approved', reject: 'rejected', request_changes: 'changes_requested' }[input.decision])}`, MOCK_ADMIN, now)] }
    })
  },
  async complete({ moderationId, version }) {
    await delay(200)
    const out = mutate(moderationId, version, ({ record, now }) => {
      const outcome = galleryOutcome(record.media)
      if (!outcome) fail('Every media item needs a decision before the review can be completed.')
      const s = outcome.summary
      return { patch: { status: outcome.status, decision: 'gallery_complete', reviewedBy: MOCK_ADMIN, reviewedAt: now, publishedMediaIds: outcome.publishedMediaIds }, history: [historyEntry(moderationId, `Gallery review completed — ${s.approved} approved, ${s.changesRequested} changes requested, ${s.rejected} rejected, ${s.escalated} escalated`, MOCK_ADMIN, now)], outcome }
    })
    return { ok: true, status: out.outcome.status, summary: out.outcome.summary }
  },
  async note({ moderationId, text }) {
    await delay(120)
    const note = { text, authorName: MOCK_ADMIN.name, createdAt: new Date().toISOString() }
    entry(moderationId).notes.push(note)
    return note
  },
}

export const contentModerationService = {
  isMock: USE_MOCK,
  getQueue: (params) => (USE_MOCK ? mock.queue(params) : callAdmin('adminGetContentQueue', { ...params, timeZone: timeZoneOf(params.market) })),
  getReview: (moderationId) => (USE_MOCK ? mock.review(moderationId) : callAdmin('adminGetContentReview', { moderationId })),
  startReview: (moderationId) => (USE_MOCK ? mock.start(moderationId) : callAdmin('adminStartContentReview', { moderationId })),
  decide: (input) => (USE_MOCK ? mock.decide(input) : callAdmin('adminContentDecision', input)),
  bulkMediaDecision: (input) => (USE_MOCK ? mock.bulk(input) : callAdmin('adminBulkMediaDecision', input)),
  completeGallery: (input) => (USE_MOCK ? mock.complete(input) : callAdmin('adminCompleteGalleryReview', input)),
  addNote: (input) => (USE_MOCK ? mock.note(input) : callAdmin('adminAddModerationNote', input)),
}
