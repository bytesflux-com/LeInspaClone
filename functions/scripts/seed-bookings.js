// Seeds demo data for the Booking Operations screens (ADM-044 → ADM-050):
// `bookings`, `booking_cancellations` and `guest_account_links`.
//
//   npm run seed-bookings                      → Firestore emulator (default)
//   npm run seed-bookings -- --clean           → remove the seeded documents
//   npm run seed-bookings -- --project <id> --allow-live   → a real project
//
// Every document id starts with `demo_` and carries `seedTag`, so --clean
// removes exactly what this script wrote. Emails use example.com and phones a
// fake 0000 block. A real project needs --allow-live because live booking
// triggers and schedulers (notifications, escrow release, auto-expiry) will
// act on these documents. Uses Application Default Credentials for real projects.
import { initializeApp } from 'firebase-admin/app'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { mockBookingDocs } from '../../src/services/mock/bookingOpsMock.js'

const SEED_TAG = 'booking-ops-demo'
const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const option = (name) => args[args.indexOf(name) + 1]

const project = flag('--project') ? option('--project') : process.env.GCLOUD_PROJECT || 'le-inspa'
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  if (!flag('--project') || !flag('--allow-live')) {
    console.error('Refusing to write to a real Firestore project.\n' +
      'Start the emulator (firebase emulators:start --only firestore) and set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080,\n' +
      'or pass --project <id> --allow-live to seed a non-production project on purpose.')
    process.exit(1)
  }
}

initializeApp({ projectId: project })
const db = getFirestore()
const COLLECTIONS = ['bookings', 'booking_cancellations', 'guest_account_links']
const DATE_FIELDS = new Set(['scheduledAt', 'createdAt', 'confirmedAt', 'serviceStartedAt', 'providerCompletedAt', 'serviceConfirmedAt', 'completedAt', 'cancelledAt', 'cancellationRequestedAt', 'refundRequestedAt', 'escrowReleasedAt', 'settledAt', 'rescheduledAt', 'accountLinkedAt', 'staffCheckInAt'])

// ISO strings → Timestamps (the backend range-queries createdAt as a Timestamp).
const toFirestore = (doc) => Object.fromEntries(Object.entries(doc).map(([k, v]) => [k, DATE_FIELDS.has(k) && typeof v === 'string' ? Timestamp.fromDate(new Date(v)) : v]))

// Never seed anything that could reach a real person.
function sanitize(doc, i) {
  const out = { ...doc }
  if (out.guestSnapshot) {
    const n = String(i).padStart(3, '0')
    out.guestSnapshot = { ...out.guestSnapshot, phone: `+254700000${n}`, email: `guest${n}@example.com` }
  }
  return out
}

async function commitAll(writes) {
  for (let i = 0; i < writes.length; i += 400) {
    const batch = db.batch()
    for (const w of writes.slice(i, i + 400)) w(batch)
    await batch.commit()
  }
}

async function clean() {
  let removed = 0
  for (const name of COLLECTIONS) {
    const snap = await db.collection(name).where('seedTag', '==', SEED_TAG).get()
    await commitAll(snap.docs.map((d) => (b) => b.delete(d.ref)))
    removed += snap.size
  }
  console.log(`Removed ${removed} seeded documents from ${project}.`)
}

async function seed() {
  const docs = mockBookingDocs(Date.now())
  const writes = []
  let cancellations = 0
  let links = 0
  docs.forEach(([id, raw], i) => {
    const bookingId = `demo_${id}`
    const data = { ...toFirestore(sanitize(raw, i)), seedTag: SEED_TAG }
    writes.push((b) => b.set(db.collection('bookings').doc(bookingId), data))
    if (raw.bookingStatus === 'cancelled') {
      cancellations += 1
      writes.push((b) => b.set(db.collection('booking_cancellations').doc(`demo_cx_${id}`), {
        cancellationId: `demo_cx_${id}`,
        bookingId,
        cancelledBy: raw.cancelledBy ?? null,
        cancellationReason: raw.cancellationReason ?? null,
        refundAmount: raw.refundAmount ?? null,
        refundStatus: raw.refundStatus ?? null,
        createdAt: data.cancelledAt ?? Timestamp.now(),
        seedTag: SEED_TAG,
      }))
    }
    if (raw.accountLinkStatus === 'pending' || raw.accountLinkStatus === 'conflict') {
      links += 1
      writes.push((b) => b.set(db.collection('guest_account_links').doc(`demo_ln_${id}`), {
        linkId: `demo_ln_${id}`,
        bookingId,
        status: raw.accountLinkStatus,
        conflictReason: raw.accountLinkConflictReason ?? null,
        createdAt: data.createdAt,
        seedTag: SEED_TAG,
      }))
    }
  })
  await commitAll(writes)
  console.log(`Seeded ${docs.length} bookings, ${cancellations} cancellations and ${links} guest account links into ${project}${process.env.FIRESTORE_EMULATOR_HOST ? ' (emulator)' : ''}.`)
}

await (flag('--clean') ? clean() : seed())
