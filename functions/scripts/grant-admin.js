// Grants the `admin` custom claim to an existing Firebase Auth user.
// Usage: npm run grant-admin -- someone@example.com
// Uses Application Default Credentials (gcloud auth application-default login),
// or the Auth emulator when FIREBASE_AUTH_EMULATOR_HOST is set.
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const email = process.argv[2]
if (!email) {
  console.error('Usage: npm run grant-admin -- <email>')
  process.exit(1)
}

initializeApp({ projectId: process.env.GCLOUD_PROJECT })
const auth = getAuth()
const user = await auth.getUserByEmail(email)
await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true })
console.log(`Granted admin to ${email} (${user.uid}). They must sign in again to pick it up.`)
