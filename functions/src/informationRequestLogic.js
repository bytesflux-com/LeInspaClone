// ADM-040 — Request More Information (SHARED). Pure logic, no Firestore.
//
// One structured request system reused by Verification, Content Moderation,
// Profile Changes, Service Reviews, Account and Safety reviews. Requests list
// individual items (not one free-text message) so Lé Inspa knows exactly what
// was received. Request More Information is never a rejection.

import { toMillis } from './contentModerationLogic.js'

export const DAY = 24 * 60 * 60 * 1000

export const MODULES = {
  verification: { label: 'Verification', returnLabel: 'Verification Review' },
  content: { label: 'Content Moderation', returnLabel: 'Content Review' },
  profile_change: { label: 'Profile Changes', returnLabel: 'Profile Change Review' },
  service: { label: 'Service Review', returnLabel: 'Service Review' },
  account: { label: 'Account Review', returnLabel: 'Account Review' },
  safety: { label: 'Trust & Safety', returnLabel: 'Safety Case' },
  finance: { label: 'Financial Review', returnLabel: 'Financial Review' },
}

export const REQUEST_TYPES = {
  additional_document: 'Additional Document',
  replacement_document: 'Replacement Document',
  clarification: 'Clarification',
  missing_information: 'Missing Information',
  supporting_evidence: 'Proof / Supporting Evidence',
  updated_information: 'Updated Information',
  other: 'Other',
}
// Request types offered per originating workflow.
export const TYPES_BY_MODULE = {
  verification: ['additional_document', 'replacement_document', 'clarification', 'missing_information', 'supporting_evidence', 'updated_information', 'other'],
  content: ['clarification', 'supporting_evidence', 'updated_information', 'replacement_document', 'other'],
  profile_change: ['clarification', 'supporting_evidence', 'updated_information', 'other'],
  service: ['clarification', 'supporting_evidence', 'updated_information', 'missing_information', 'other'],
  account: ['clarification', 'supporting_evidence', 'additional_document', 'other'],
  safety: ['clarification', 'supporting_evidence', 'other'],
  finance: ['clarification', 'additional_document', 'missing_information', 'other'],
}

export const RESPONSE_TYPES = {
  upload_document: 'Upload Document',
  upload_image: 'Upload Image',
  text: 'Enter Text',
  date: 'Enter Date',
  select: 'Select Option',
  confirm: 'Confirm Information',
  update_field: 'Update Profile Field',
}

// Workflow defaults (hours). Configurable per workflow and market.
export const DEFAULT_DEADLINE_HOURS = { verification: 72, content: 72, profile_change: 72, service: 72, account: 168, safety: 72, finance: 72 }
export const DEADLINE_OPTIONS = { none: null, '24h': 24, '3d': 72, '7d': 168 }

export const STATUSES = ['draft', 'sent', 'waiting', 'partially_responded', 'responded', 'overdue', 'completed', 'cancelled']
export const OPEN = ['sent', 'waiting', 'partially_responded', 'overdue']

// Message templates per workflow ({name}, {review} substituted in the UI).
export const TEMPLATES = {
  verification: 'Hi {name},\nWe need a little more information before we can complete your {review}.\n\nPlease submit the items listed below. Once we receive them, we will continue with your review.',
  content: 'Hi {name},\nTo finish reviewing your {review}, we need some additional information. Please provide the items below so your content can be published.',
  profile_change: 'Hi {name},\nBefore we can publish your profile changes, please provide the information below.',
  service: 'Hi {name},\nBefore your service can be published, please provide the information below.',
  account: 'Hi {name},\nWe need some additional information about your account. Please provide the items below.',
  safety: 'Hi {name},\nWe need some additional information to continue reviewing a matter related to your account. Please provide the items below.',
  finance: 'Hi {name},\nTo complete a review of your payouts, please provide the information below.',
}

const clean = (s, max) => String(s ?? '').trim().slice(0, max)

export function normalizeItems(items = []) {
  return items
    .map((it, i) => ({
      itemId: clean(it.itemId, 40) || `ITEM-${i + 1}`,
      label: clean(it.label, 200),
      responseType: RESPONSE_TYPES[it.responseType] ? it.responseType : 'text',
      required: it.required !== false,
      options: Array.isArray(it.options) ? it.options.map((o) => clean(o, 80)).filter(Boolean).slice(0, 20) : [],
      status: ['awaiting', 'received'].includes(it.status) ? it.status : 'awaiting',
      response: it.response ?? null,
      respondedAt: it.respondedAt ?? null,
    }))
    .filter((it) => it.label)
}

// Validates a request before it is sent. Returns an error message or null.
export function validateRequest(input, now) {
  if (!MODULES[input.originModule]) return 'Unknown originating workflow.'
  if (!input.originRecordId) return 'The request must be linked to its originating case.'
  if (!input.providerId) return 'The request needs a provider to ask.'
  if (!REQUEST_TYPES[input.requestType]) return 'Choose what you need.'
  if (!(TYPES_BY_MODULE[input.originModule] || []).includes(input.requestType)) return 'This request type is not available for this workflow.'
  const items = normalizeItems(input.items)
  if (!items.length) return 'Add at least one requested item.'
  if (!items.some((i) => i.required)) return 'At least one requested item must be required.'
  if (items.some((i) => i.responseType === 'select' && i.options.length < 2)) return 'Select-option items need at least two options.'
  if (clean(input.providerMessage, 1000).length < 10) return 'Write the message the provider will see.'
  if (input.dueAt != null && toMillis(input.dueAt) <= now) return 'The deadline must be in the future.'
  const channels = input.channels || []
  if (!channels.length) return 'Choose at least one notification channel.'
  return null
}

// Overlap with another open request for the same case (avoid asking twice).
export function duplicateItems(items, openRequests) {
  const wanted = new Set(normalizeItems(items).map((i) => i.label.toLowerCase()))
  const dupes = []
  for (const r of openRequests) for (const i of r.items || []) if (wanted.has(String(i.label).toLowerCase())) dupes.push({ requestId: r.requestId, label: i.label })
  return dupes
}

// Status is derived from item-level responses and the deadline, so a partial
// response is never mistaken for a complete one.
export function deriveStatus(req, now) {
  if (['draft', 'cancelled', 'completed'].includes(req.status)) return req.status
  const items = req.items || []
  const required = items.filter((i) => i.required)
  const received = items.filter((i) => i.status === 'received')
  if (required.length && required.every((i) => i.status === 'received')) return 'responded'
  if (received.length) return toMillis(req.dueAt) != null && toMillis(req.dueAt) < now ? 'overdue' : 'partially_responded'
  if (toMillis(req.dueAt) != null && toMillis(req.dueAt) < now) return 'overdue'
  return 'waiting'
}

export function progress(req) {
  const items = req.items || []
  return { total: items.length, received: items.filter((i) => i.status === 'received').length, required: items.filter((i) => i.required).length, requiredReceived: items.filter((i) => i.required && i.status === 'received').length }
}

export function dueAtFor(choice, customDueAt, originModule, now) {
  if (choice === 'custom') return customDueAt ? toMillis(customDueAt) : null
  if (choice === 'default') return now + (DEFAULT_DEADLINE_HOURS[originModule] ?? 72) * 3600 * 1000
  const hours = DEADLINE_OPTIONS[choice]
  return hours == null ? null : now + hours * 3600 * 1000
}

// Allowed follow-up actions per derived status.
export function allowedActions(status) {
  return {
    remind: ['waiting', 'partially_responded', 'overdue'].includes(status),
    extend: ['waiting', 'partially_responded', 'overdue'].includes(status),
    cancel: ['draft', 'sent', 'waiting', 'partially_responded', 'overdue'].includes(status),
    complete: status === 'responded',
    escalate: status === 'overdue',
  }
}

export const REMINDER_DEFAULTS = { initial: true, before24h: true, atDeadline: true, escalateAfterDays: null }
export const CHANNELS = { in_app: 'In-App Notification', email: 'Email', sms: 'SMS' }
