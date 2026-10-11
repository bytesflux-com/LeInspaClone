// ADM-040 — Request More Information (shared) service.
//
// Calls the admin Cloud Functions (functions/src/informationRequests.js):
//   adminGetInfoRequestWorkspace, adminSaveInfoRequest, adminGetInfoRequest,
//   adminListInfoRequests, adminInfoRequestAction
// The originating case is resolved server-side. VITE_USE_MOCK_CONTENT=true
// runs an in-memory demo through the same request rules.
import { callAdmin } from '../lib/adminCall'
import {
  CHANNELS,
  DEFAULT_DEADLINE_HOURS,
  MODULES,
  OPEN,
  REMINDER_DEFAULTS,
  REQUEST_TYPES,
  RESPONSE_TYPES,
  TEMPLATES,
  TYPES_BY_MODULE,
  allowedActions,
  deriveStatus,
  duplicateItems,
  normalizeItems,
  progress,
  validateRequest,
} from '../../functions/src/informationRequestLogic.js'
import { CONTENT_TYPES, normalizeModeration } from '../../functions/src/contentModerationLogic.js'
import { MOCK_ADMIN, contentStore } from './mock/contentModerationMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_CONTENT === 'true'
const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms))
const fail = (m) => {
  throw new Error(m)
}
const DAY = 24 * 3600 * 1000
const iso = (ms) => new Date(ms).toISOString()

// Demo verification cases (keyed like the provider's users record).
const MOCK_USERS = {
  'PR-82941': { name: 'Grace Njeri', ref: 'PR-82941', typeLabel: 'Massage Therapist', photoUrl: '/demo/content/grace-njeri.jpg', city: 'Nairobi', countryCode: 'KE', verified: true, caseStatus: 'more_information_needed', related: 'Professional Practice Certificate' },
}

function resolveOrigin(originModule, originRecordId) {
  if (!MODULES[originModule]) fail('Unknown originating workflow.')
  if (['content', 'profile_change', 'service'].includes(originModule)) {
    const e = contentStore().get(originRecordId)
    if (!e) fail('The originating content review no longer exists.')
    const r = normalizeModeration(originRecordId, e.doc)
    return { originModule, originRecordId, reviewType: r.contentType === 'profile_change' ? 'Profile Information Change' : r.contentType === 'service' ? 'Service Information' : CONTENT_TYPES[r.contentType], caseId: r.contentId, caseStatus: r.status, relatedItem: r.title || r.contentLabel, provider: { ...r.provider }, countryCode: r.countryCode }
  }
  const u = MOCK_USERS[originRecordId]
  if (!u) fail('The originating case no longer exists.')
  return { originModule, originRecordId, reviewType: originModule === 'verification' ? 'Professional Credentials' : MODULES[originModule].label, caseId: `VER-${originRecordId.replace('PR-', '')}`, caseStatus: u.caseStatus, relatedItem: u.related, provider: { id: originRecordId, ref: u.ref, name: u.name, typeLabel: u.typeLabel, photoUrl: u.photoUrl, verified: u.verified, city: u.city }, countryCode: u.countryCode }
}

let store = null
function requests() {
  if (store) return store
  const now = Date.now()
  const origin = resolveOrigin('verification', 'PR-82941')
  const mk = (id, over) => ({ requestId: id, reference: id, originModule: 'verification', originRecordId: 'PR-82941', origin, providerId: 'PR-82941', countryCode: 'KE', requestType: 'replacement_document', channels: ['in_app', 'email'], reminders: REMINDER_DEFAULTS, createdBy: { id: 'adm-jane', name: 'Jane Ochieng' }, internalNote: '', history: [], ...over })
  store = new Map([
    ['REQ-82941', mk('REQ-82941', { status: 'sent', createdAt: iso(now - 2 * DAY), sentAt: iso(now - 2 * DAY), dueAt: iso(now + DAY), providerMessage: 'We need a clearer copy of your certificate image.', items: [{ itemId: 'ITEM-1', label: 'Clearer certificate image', responseType: 'upload_image', required: true, status: 'received', response: 'certificate_v2.jpg', respondedAt: iso(now - DAY) }], history: [{ event: 'Request sent', at: iso(now - 2 * DAY), actor: { name: 'Jane Ochieng' } }, { event: 'Provider responded', at: iso(now - DAY), actor: { name: 'Grace Njeri' } }] })],
    ['REQ-71204', mk('REQ-71204', { requestType: 'missing_information', status: 'completed', createdAt: iso(now - 38 * DAY), sentAt: iso(now - 38 * DAY), dueAt: iso(now - 35 * DAY), providerMessage: 'Please provide your certificate details.', createdBy: { name: 'Peter Maina' }, items: [{ itemId: 'ITEM-1', label: 'Missing certificate details', responseType: 'text', required: true, status: 'received', response: 'HTA-7281', respondedAt: iso(now - 37 * DAY) }], history: [{ event: 'Request sent', at: iso(now - 38 * DAY), actor: { name: 'Peter Maina' } }, { event: 'Marked complete — review can continue', at: iso(now - 37 * DAY), actor: { name: 'Peter Maina' } }] })],
    ['REQ-60518', mk('REQ-60518', { requestType: 'clarification', status: 'completed', createdAt: iso(now - 46 * DAY), sentAt: iso(now - 46 * DAY), dueAt: iso(now - 43 * DAY), providerMessage: 'Please clarify the name on your ID document.', createdBy: { name: 'Peter Maina' }, items: [{ itemId: 'ITEM-1', label: 'ID document clarification', responseType: 'text', required: true, status: 'received', response: 'Name matches after marriage — certificate attached', respondedAt: iso(now - 45 * DAY) }], history: [{ event: 'Request sent', at: iso(now - 46 * DAY), actor: { name: 'Peter Maina' } }] })],
  ])
  return store
}

function view(r, now = Date.now()) {
  const status = deriveStatus(r, now)
  return { ...r, requestTypeLabel: REQUEST_TYPES[r.requestType], status, progress: progress(r), actions: allowedActions(status) }
}
const forOrigin = (m, id, now) => [...requests().values()].filter((r) => r.originModule === m && r.originRecordId === id).map((r) => view(r, now)).sort((a, z) => String(z.createdAt).localeCompare(String(a.createdAt)))

const mock = {
  async workspace({ originModule, originRecordId }) {
    await delay()
    const origin = resolveOrigin(originModule, originRecordId)
    return {
      origin,
      requestTypes: TYPES_BY_MODULE[originModule].map((id) => ({ id, label: REQUEST_TYPES[id] })),
      responseTypes: Object.entries(RESPONSE_TYPES).map(([id, l]) => ({ id, label: l })),
      template: TEMPLATES[originModule],
      defaultDeadlineHours: DEFAULT_DEADLINE_HOURS[originModule],
      reminderDefaults: REMINDER_DEFAULTS,
      channels: Object.entries(CHANNELS).map(([id, l]) => ({ id, label: l })),
      history: forOrigin(originModule, originRecordId, Date.now()),
    }
  },
  async save(d) {
    await delay(220)
    const now = Date.now()
    const origin = resolveOrigin(d.originModule, d.originRecordId)
    if (d.send) {
      const error = validateRequest({ ...d, providerId: origin.provider.id }, now)
      if (error) fail(error)
      const open = forOrigin(d.originModule, d.originRecordId, now).filter((r) => OPEN.includes(r.status) && r.requestId !== d.requestId)
      const dupes = duplicateItems(d.items, open)
      if (dupes.length && !d.allowDuplicates) fail(`An open request already asks for: ${dupes.map((x) => x.label).join(', ')}.`)
    }
    const existing = d.requestId ? requests().get(d.requestId) : null
    if (existing && existing.status !== 'draft') fail('Only drafts can be edited. Cancel and replace a sent request instead.')
    const id = existing?.requestId || `REQ-${String(83000 + requests().size).padStart(5, '0')}`
    const rec = {
      ...(existing || {}),
      requestId: id,
      reference: id,
      originModule: d.originModule,
      originRecordId: d.originRecordId,
      origin,
      providerId: origin.provider.id,
      countryCode: origin.countryCode,
      requestType: d.requestType,
      items: normalizeItems(d.items),
      providerMessage: d.providerMessage,
      internalNote: d.internalNote || '',
      dueAt: d.dueAt || null,
      reminders: { ...REMINDER_DEFAULTS, ...(d.reminders || {}) },
      channels: d.channels || [],
      status: d.send ? 'sent' : 'draft',
      createdBy: existing?.createdBy || MOCK_ADMIN,
      createdAt: existing?.createdAt || iso(now),
      ...(d.send ? { sentAt: iso(now) } : {}),
      history: [...(existing?.history || []), { event: d.send ? 'Request sent' : 'Draft saved', at: iso(now), actor: MOCK_ADMIN }],
    }
    requests().set(id, rec)
    if (d.send && ['content', 'profile_change', 'service'].includes(d.originModule)) {
      contentStore().get(d.originRecordId)?.history.push({ moderationId: d.originRecordId, event: `More information requested (${rec.items.length} item${rec.items.length === 1 ? '' : 's'})`, at: iso(now), actor: MOCK_ADMIN })
    }
    return view(rec, now)
  },
  async get({ requestId }) {
    await delay(150)
    const r = requests().get(requestId)
    if (!r) fail('This information request no longer exists.')
    const now = Date.now()
    return { ...view(r, now), previous: forOrigin(r.originModule, r.originRecordId, now).filter((x) => x.requestId !== requestId) }
  },
  async list({ status, originModule, market } = {}) {
    await delay(150)
    const now = Date.now()
    const items = [...requests().values()].map((r) => view(r, now)).filter((r) => (!status || r.status === status) && (!originModule || r.originModule === originModule) && (!market || market === 'ALL' || r.countryCode === market)).sort((a, z) => String(z.createdAt).localeCompare(String(a.createdAt)))
    const counts = {}
    for (const r of items) counts[r.status] = (counts[r.status] || 0) + 1
    return { items, counts, generatedAt: iso(now) }
  },
  async action({ requestId, action, dueAt }) {
    await delay(150)
    const r = requests().get(requestId)
    if (!r) fail('This information request no longer exists.')
    const now = Date.now()
    const status = deriveStatus(r, now)
    if (action === 'simulate_response') {
      // Demo only: the provider answers the first outstanding item.
      const next = r.items.find((i) => i.status === 'awaiting')
      if (!next) fail('Every item already has a response.')
      next.status = 'received'
      next.response = next.responseType.startsWith('upload') ? 'uploaded_file.pdf' : next.responseType === 'date' ? '2027-06-30' : 'Provided by provider'
      next.respondedAt = iso(now)
      r.history.push({ event: `Provider responded: ${next.label}`, at: iso(now), actor: { name: r.origin.provider.name } })
      return view(r, now)
    }
    if (!allowedActions(status)[action]) fail(`You can't ${action} a request that is ${status.replace('_', ' ')}.`)
    const events = { remind: 'Reminder sent', extend: `Deadline extended to ${String(dueAt).slice(0, 10)}`, cancel: 'Request cancelled', complete: 'Marked complete — review can continue', escalate: 'Escalated after no response' }
    if (action === 'extend') {
      if (!dueAt || Date.parse(dueAt) <= now) fail('Choose a new deadline in the future.')
      r.dueAt = dueAt
    }
    if (action === 'cancel') r.status = 'cancelled'
    if (action === 'complete') r.status = 'completed'
    r.history.push({ event: events[action], at: iso(now), actor: MOCK_ADMIN })
    return view(r, now)
  },
}

export const infoRequestService = {
  isMock: USE_MOCK,
  getWorkspace: (p) => (USE_MOCK ? mock.workspace(p) : callAdmin('adminGetInfoRequestWorkspace', p)),
  save: (p) => (USE_MOCK ? mock.save(p) : callAdmin('adminSaveInfoRequest', p)),
  get: (requestId) => (USE_MOCK ? mock.get({ requestId }) : callAdmin('adminGetInfoRequest', { requestId })),
  list: (p) => (USE_MOCK ? mock.list(p) : callAdmin('adminListInfoRequests', p)),
  action: (p) => (USE_MOCK ? mock.action(p) : callAdmin('adminInfoRequestAction', p)),
}
