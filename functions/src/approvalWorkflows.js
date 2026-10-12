import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { requireAdmin } from './auth.js'
import { ALL_MARKETS, adminAccess, canAccessMarket } from './accessModel.js'
import { recordAudit } from './events.js'
import { PROVIDER_TYPES, providerTypeOf } from './platformData.js'
import { finalDecisionPatch, isVerificationRequest, verificationCase } from './verificationLogic.js'
import { CONTENT_TYPES, historyEntry, normalizeModeration, toMillis } from './contentModerationLogic.js'
import {
  DECISION_TYPES,
  REJECTION_TEMPLATES,
  buildDecisionChain,
  buildEntry,
  contentDecisionType,
  effectsFor,
  evaluateVerificationReadiness,
  filterLedgerEntries,
  ledgerDecision,
  reasonsForDecisionType,
  rejectionImpactFor,
  summarizeLedger,
  validateRejection,
  validateVerificationDecision,
  verificationImpactFor,
  writeEntry,
} from './decisionLedger.js'

// ADM-041 Reject & Send Reason / Note · ADM-042 Verification Decision · ADM-043 Approval History.

const db = () => getFirestore()

// ADM-041 / ADM-042 read the provider's real submission (verification_requests)
// as a verification case; decisions are written back in the app's format.
async function loadCase(id, tx = null) {
  const ref = db().collection('verification_requests').doc(id)
  const snap = tx ? await tx.get(ref) : await ref.get()
  if (!snap.exists || !isVerificationRequest(snap.data())) throw new HttpsError('not-found', 'Verification case not found.')
  const data = snap.data()
  const uid = data.userId || data.providerId
  const userRef = uid ? db().collection('users').doc(uid) : null
  const userSnap = userRef ? (tx ? await tx.get(userRef) : await userRef.get()) : null
  const user = userSnap?.exists ? userSnap.data() : {}
  const type = providerTypeOf(data.accountType) || providerTypeOf(user.accountType)
  const detailRef = type && uid ? db().collection(PROVIDER_TYPES[type].collection).doc(uid) : null
  const detailSnap = detailRef ? (tx ? await tx.get(detailRef) : await detailRef.get()) : null
  const infoRequests = tx ? [] : (await db().collection('information_requests').where('originRecordId', '==', id).limit(20).get().catch(() => ({ docs: [] }))).docs.map((x) => ({ id: x.id, ...x.data() }))
  return { ref, data, user, userRef: userSnap?.exists ? userRef : null, detailRef: detailSnap?.exists ? detailRef : null, vCase: verificationCase(id, data, user, { informationRequests: infoRequests }) }
}

function writeCaseDecision(tx, c, decision, opts) {
  const p = finalDecisionPatch(c.data, decision, opts)
  tx.update(c.ref, p.request)
  if (p.user && c.userRef) tx.update(c.userRef, p.user)
  if (p.detail && c.detailRef) tx.update(c.detailRef, p.detail)
  const uid = c.data.userId || c.data.providerId
  const message = { approve: 'Your Lé Inspa verification has been approved.', reject: opts.providerMessage || opts.reason || 'Your verification was not approved.', request_info: opts.providerMessage || opts.reason || 'More information is needed to complete your verification.' }[decision]
  if (uid && message) tx.set(db().collection('notifications').doc(), { userId: uid, title: decision === 'approve' ? 'Verification approved' : decision === 'reject' ? 'Verification not approved' : 'Verification update', message, notificationType: 'verification', relatedId: c.ref.id, isRead: false, read: false, createdAt: Timestamp.now() })
}
const iso = (v) => {
  const ms = toMillis(v)
  return ms ? new Date(ms).toISOString() : null
}

function assertMarket(access, countryCode) {
  const ok = countryCode ? canAccessMarket(access, countryCode) : access.markets.includes(ALL_MARKETS)
  if (!ok) throw new HttpsError('permission-denied', 'You do not have access to this market.', { reason: 'market-denied' })
}

async function guardWorkflow(request, originModule) {
  const isVer = ['verification', 'identity', 'credentials', 'business_documents'].includes(originModule)
  const permission = isVer ? 'providers.verify' : 'content.moderate'
  const uid = await requireAdmin(request, { permission })
  const access = await adminAccess(uid)
  return { uid, access, actor: { id: uid, name: access.fullName || 'Admin' } }
}

// ---------------------------------------------------------------------------
// ADM-041 — Reject & Send Reason / Note
// ---------------------------------------------------------------------------

export const adminGetRejectionWorkspace = onCall(async (request) => {
  const { originModule = 'service', originRecordId, targetId = null } = request.data || {}
  const { access } = await guardWorkflow(request, originModule)
  const id = String(originRecordId || '').trim()
  if (!id) throw new HttpsError('invalid-argument', 'Originating record ID is required.')

  if (['content', 'profile_change', 'service', 'profile_photo', 'gallery'].includes(originModule)) {
    const snap = await db().collection('content_moderation').doc(id).get()
    if (!snap.exists) throw new HttpsError('not-found', 'The originating moderation record no longer exists.')
    const r = normalizeModeration(snap.id, snap.data())
    assertMarket(access, r.countryCode)
    const decisionType = contentDecisionType(r.contentType, Boolean(targetId))
    const isUpdate = r.contentType === 'service' ? Boolean(r.serviceChange?.current) : r.contentType === 'profile_change'
    const reasons = reasonsForDecisionType(decisionType)
    return {
      origin: {
        originModule,
        originRecordId: id,
        targetId,
        decisionType,
        decisionTypeLabel: DECISION_TYPES[decisionType] || r.contentLabel,
        reviewType: r.contentType === 'service' ? 'Service Information Approval' : r.contentType === 'profile_change' ? 'Profile Information Change' : CONTENT_TYPES[r.contentType] || r.contentLabel,
        reviewId: r.contentId,
        subjectTitle: r.title || r.contentLabel,
        subjectId: r.serviceChange?.serviceId || targetId || r.contentId,
        subjectImage: r.media?.[0]?.url || r.provider.photoUrl || null,
        submittedAt: r.submittedAt,
        status: r.status,
        version: r.version,
        isUpdate,
        provider: r.provider,
        countryCode: r.countryCode,
        marketName: r.marketName,
      },
      reasons,
      templates: REJECTION_TEMPLATES,
      impact: rejectionImpactFor(decisionType, { isUpdate, allowResubmission: true }),
      allowResubmissionDefault: true,
    }
  }

  // Verification / document rejection
  const { vCase } = await loadCase(id)
  const countryCode = vCase.countryCode
  assertMarket(access, countryCode)
  const decisionType = ['identity', 'credentials', 'business_documents'].includes(originModule) ? originModule : 'verification'
  return {
    origin: {
      originModule,
      originRecordId: id,
      targetId,
      decisionType,
      decisionTypeLabel: DECISION_TYPES[decisionType] || 'Verification',
      reviewType: `${DECISION_TYPES[decisionType] || 'Verification'} Review`,
      reviewId: vCase.caseId,
      subjectTitle: vCase.provider.name,
      subjectId: targetId || id,
      subjectImage: vCase.provider.photoUrl || null,
      submittedAt: vCase.submittedAt,
      status: vCase.status,
      version: vCase.version,
      isUpdate: false,
      provider: { ...vCase.provider, countryCode },
      countryCode,
      marketName: vCase.marketName,
    },
    reasons: reasonsForDecisionType(decisionType),
    templates: REJECTION_TEMPLATES,
    impact: rejectionImpactFor(decisionType, { isUpdate: false, allowResubmission: true }),
    allowResubmissionDefault: true,
  }
})

export const adminSubmitRejection = onCall(async (request) => {
  const d = request.data || {}
  const { originModule = 'service', originRecordId, targetId = null } = d
  const { uid, access, actor } = await guardWorkflow(request, originModule)
  const id = String(originRecordId || '').trim()
  if (!id) throw new HttpsError('invalid-argument', 'Originating record ID is required.')

  const validationError = validateRejection(d)
  if (validationError) throw new HttpsError('invalid-argument', validationError)

  const now = Timestamp.now()
  let ledgerId = null

  if (['content', 'profile_change', 'service', 'profile_photo', 'gallery'].includes(originModule)) {
    const ref = db().collection('content_moderation').doc(id)
    await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) throw new HttpsError('not-found', 'The originating moderation record no longer exists.')
      const raw = snap.data()
      const r = normalizeModeration(snap.id, raw)
      assertMarket(access, r.countryCode)
      if (d.version != null && Number(d.version) !== r.version) {
        throw new HttpsError('failed-precondition', 'A newer version was submitted. Reload before rejecting.', { reason: 'stale-version' })
      }
      const decisionType = contentDecisionType(r.contentType, Boolean(targetId))
      const isUpdate = r.contentType === 'service' ? Boolean(r.serviceChange?.current) : r.contentType === 'profile_change'
      const entry = buildEntry({
        originModule,
        originRecordId: id,
        targetId,
        decisionType,
        decision: 'rejected',
        reason: d.reason || d.reasonCode,
        providerMessage: d.providerMessage,
        internalNote: d.internalNote,
        version: `Version ${r.version}`,
        subject: { type: r.contentType, name: r.title || r.contentLabel, subtitle: r.contentLabel, image: r.media?.[0]?.url || r.provider.photoUrl },
        provider: r.provider,
        countryCode: r.countryCode,
        evidenceRefs: (r.media || []).slice(0, 3).map((m) => ({ label: m.title, version: m.version, status: 'rejected' })),
        effects: effectsFor(decisionType, 'rejected', { isUpdate }),
        actor,
        access,
        at: now,
        relatedReviewId: r.contentId,
        routes: { original: `/content-approval?c=${r.id}` },
        previousDecisionId: raw?.lastDecisionIds?.[`${originModule}_${id}`] || null,
      })
      ledgerId = writeEntry(tx, entry, db())
      tx.update(ref, {
        status: 'rejected',
        decision: 'reject',
        reason: d.reason || d.reasonCode,
        providerMessage: d.providerMessage,
        internalNote: d.internalNote,
        resubmissionAllowed: d.allowResubmission !== false,
        resubmissionGuidance: d.resubmissionGuidance || null,
        responseDueAt: d.dueAt || null,
        reviewedBy: actor,
        reviewedAt: now,
        publicEligible: false,
        [`lastDecisionIds.${originModule}_${id}`]: ledgerId,
      })
      tx.set(db().collection('content_moderation_history').doc(), historyEntry(id, `Rejected — ${d.reason || d.reasonCode}`, actor, now, { decision: 'reject', ledgerId }))
    })
  } else {
    await db().runTransaction(async (tx) => {
      const c = await loadCase(id, tx)
      const data = c.vCase
      const countryCode = data.countryCode
      assertMarket(access, countryCode)
      const decisionType = ['identity', 'credentials', 'business_documents'].includes(originModule) ? originModule : 'verification'
      const entry = buildEntry({
        originModule,
        originRecordId: id,
        targetId,
        decisionType,
        decision: 'rejected',
        reason: d.reason || d.reasonCode,
        providerMessage: d.providerMessage,
        internalNote: d.internalNote,
        version: `Version ${data.version || 1}`,
        subject: { type: decisionType, name: data.provider.name || id, subtitle: data.provider.typeLabel || 'Provider', image: data.provider.photoUrl || null },
        provider: data.provider,
        countryCode,
        effects: effectsFor(decisionType, 'rejected'),
        actor,
        access,
        at: now,
        relatedReviewId: data.caseId,
        routes: { original: `/verifications/${id}/decision` },
        previousDecisionId: c.data.lastDecisionId || null,
      })
      ledgerId = writeEntry(tx, entry, db())
      writeCaseDecision(tx, c, 'reject', { reason: d.reason || d.reasonCode, providerMessage: d.providerMessage, actor, now: now.toMillis() })
      tx.update(c.ref, { lastDecisionId: ledgerId, resubmissionAllowed: d.allowResubmission !== false })
    })
  }

  await recordAudit(request, {
    actorId: uid,
    action: `${originModule}.rejected`,
    entityId: id,
    entityType: originModule,
    metadata: { reason: d.reason || d.reasonCode, allowResubmission: d.allowResubmission !== false, ledgerId },
  })
  return { ok: true, ledgerId }
})

// ---------------------------------------------------------------------------
// ADM-042 — Verification Decision
// ---------------------------------------------------------------------------

export const adminGetVerificationDecision = onCall(async (request) => {
  const { verificationId } = request.data || {}
  const uid = await requireAdmin(request, { permission: 'providers.verify' })
  const access = await adminAccess(uid)
  // Open cases for the case switcher (scoped to the admin's markets).
  const openSnap = await db().collection('verification_requests').where('status', 'in', ['pending', 'reviewed']).limit(200).get()
  const users = new Map()
  for (const x of openSnap.docs) if (x.get('userId')) users.set(x.get('userId'), null)
  const userSnaps = users.size ? await db().getAll(...[...users.keys()].slice(0, 300).map((u) => db().collection('users').doc(u))) : []
  for (const u of userSnaps) users.set(u.id, u.exists ? u.data() : {})
  const available = openSnap.docs
    .filter((x) => isVerificationRequest(x.data()))
    .map((x) => verificationCase(x.id, x.data(), users.get(x.get('userId')) || {}))
    .filter((c) => (c.countryCode ? canAccessMarket(access, c.countryCode) : access.markets.includes(ALL_MARKETS)))
  const id = String(verificationId || '').trim() || available[0]?.verificationId
  if (!id) throw new HttpsError('not-found', 'There are no verification cases awaiting a decision.')
  const { vCase } = await loadCase(id)
  assertMarket(access, vCase.countryCode)
  return {
    ...vCase,
    readiness: evaluateVerificationReadiness(vCase),
    impacts: {
      approve: verificationImpactFor('approve'),
      request_info: verificationImpactFor('request_info'),
      reject: verificationImpactFor('reject'),
      escalate: verificationImpactFor('escalate'),
    },
    availableCases: available.slice(0, 50).map((c) => ({ verificationId: c.verificationId, caseId: c.caseId, name: c.provider.name, category: c.provider.category, categoryLabel: c.provider.categoryLabel, typeLabel: c.provider.typeLabel, ready: evaluateVerificationReadiness(c).ready })),
  }
})

export const adminSubmitFinalVerificationDecision = onCall(async (request) => {
  const d = request.data || {}
  const id = String(d.verificationId || '').trim()
  if (!id) throw new HttpsError('invalid-argument', 'Verification ID is required.')
  const uid = await requireAdmin(request, { permission: 'providers.verify', fresh: true })
  const access = await adminAccess(uid)
  const actor = { id: uid, name: access.fullName || 'Admin' }
  const now = Timestamp.now()
  let ledgerId = null

  await db().runTransaction(async (tx) => {
    const c = await loadCase(id, tx)
    const vCase = c.vCase
    assertMarket(access, vCase.countryCode)
    if (d.version != null && Number(d.version) !== Number(vCase.version || 1)) {
      throw new HttpsError('failed-precondition', 'Verification case was updated by another reviewer. Reload and try again.', { reason: 'stale-version' })
    }
    if (!vCase.open) throw new HttpsError('failed-precondition', `This verification is already ${vCase.status.replace(/_/g, ' ')}.`)
    const err = validateVerificationDecision(vCase, d)
    if (err) throw new HttpsError('failed-precondition', err)

    const entry = buildEntry({
      originModule: 'verification',
      originRecordId: id,
      decisionType: 'verification',
      decision: ledgerDecision(d.decision),
      reason: d.reason || (d.decision === 'approve' ? 'All verification requirements satisfied' : null),
      providerMessage: d.providerMessage || null,
      internalNote: d.note || null,
      version: `Verification Case v${vCase.version || 1}`,
      subject: { type: 'provider', name: vCase.provider.name, subtitle: vCase.provider.typeLabel, image: vCase.provider.photoUrl },
      provider: vCase.provider,
      countryCode: vCase.countryCode,
      evidenceRefs: vCase.evidence.map((e) => ({ label: e.title, version: e.version || 1, status: e.status || 'pending' })),
      effects: effectsFor('verification', ledgerDecision(d.decision)),
      actor,
      access,
      at: now,
      relatedReviewId: vCase.caseId,
      routes: { original: `/verifications/${id}/decision` },
      previousDecisionId: c.data.lastDecisionId || null,
    })
    ledgerId = writeEntry(tx, entry, db())
    writeCaseDecision(tx, c, d.decision, { reason: d.reason || null, note: d.note || null, providerMessage: d.providerMessage || null, actor, now: now.toMillis() })
    tx.update(c.ref, { lastDecisionId: ledgerId })
  })

  await recordAudit(request, {
    actorId: uid,
    action: `verification.final_${d.decision}`,
    entityId: id,
    entityType: 'verification_request',
    metadata: { decision: d.decision, ledgerId },
  })
  return { ok: true, ledgerId }
})

// ---------------------------------------------------------------------------
// ADM-043 — Approval History (`approval_decisions` ledger)
// ---------------------------------------------------------------------------

export const adminListApprovalDecisions = onCall(async (request) => {
  const q = request.data || {}
  const uid = await requireAdmin(request, { permission: 'providers.view' })
  const access = await adminAccess(uid)

  const snap = await db().collection('approval_decisions').orderBy('reviewedAt', 'desc').limit(400).get()
  const rawEntries = snap.docs
    .map((doc) => {
      const d = doc.data()
      return {
        id: doc.id,
        ...d,
        reviewedAt: iso(d.reviewedAt) || d.reviewedAt,
        createdAt: iso(d.createdAt) || d.createdAt,
      }
    })
    .filter((e) => !e.marketId || canAccessMarket(access, e.marketId))

  const marketScoped = q.market && q.market !== 'ALL' ? rawEntries.filter((e) => e.marketId === q.market) : rawEntries
  const { counts, byType } = summarizeLedger(marketScoped)
  const filtered = filterLedgerEntries(rawEntries, q)

  const page = Math.max(1, Number(q.page) || 1)
  const pageSize = Math.min(50, Math.max(5, Number(q.pageSize) || 10))
  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize).map(({ internalNote, ...rest }) => rest)

  return {
    items,
    total: filtered.length,
    page,
    pageSize,
    counts,
    byType,
    generatedAt: new Date().toISOString(),
  }
})

export const adminGetApprovalDecision = onCall(async (request) => {
  const { decisionId } = request.data || {}
  const uid = await requireAdmin(request, { permission: 'providers.view' })
  const access = await adminAccess(uid)
  const id = String(decisionId || '').trim()
  if (!id) throw new HttpsError('invalid-argument', 'Decision ID is required.')

  const snap = await db().collection('approval_decisions').doc(id).get()
  if (!snap.exists) throw new HttpsError('not-found', 'Decision record not found.')
  const d = { id: snap.id, ...snap.data(), reviewedAt: iso(snap.data().reviewedAt), createdAt: iso(snap.data().createdAt) }
  assertMarket(access, d.marketId)

  const canSeeInternal = access.permissions?.includes('content.moderate') || access.permissions?.includes('providers.verify')
  if (!canSeeInternal) delete d.internalNote

  // Fetch related chain entries for the same subjectKey
  const chainSnap = d.subjectKey
    ? await db().collection('approval_decisions').where('subjectKey', '==', d.subjectKey).limit(25).get()
    : { docs: [snap] }
  const byId = new Map(
    chainSnap.docs.map((doc) => [
      doc.id,
      { id: doc.id, ...doc.data(), reviewedAt: iso(doc.data().reviewedAt), createdAt: iso(doc.data().createdAt) },
    ]),
  )
  const chain = buildDecisionChain(d.id, byId)

  return {
    decision: d,
    chain,
    currentSubjectStatus: {
      accountStatus: 'active',
      verificationStatus: 'verified',
    },
  }
})

export const adminExportApprovalHistory = onCall(async (request) => {
  const q = request.data || {}
  const uid = await requireAdmin(request, { permission: 'audit.view' })
  const access = await adminAccess(uid)

  const snap = await db().collection('approval_decisions').orderBy('reviewedAt', 'desc').limit(500).get()
  const rawEntries = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data(), reviewedAt: iso(doc.data().reviewedAt) }))
    .filter((e) => !e.marketId || canAccessMarket(access, e.marketId))
  const filtered = filterLedgerEntries(rawEntries, q).map(({ internalNote, ...rest }) => rest)

  await recordAudit(request, {
    actorId: uid,
    action: 'approval_history.exported',
    entityId: 'approval_decisions',
    entityType: 'approval_history',
    metadata: { count: filtered.length, filters: q },
  })
  return { items: filtered, exportedAt: new Date().toISOString() }
})

